import { NextResponse } from "next/server";
import { isHubHost } from "@/lib/hub/guard-host";
import { requireOwner } from "@/lib/hub/owner";
import { listInvoices, createInvoice, updateInvoice, invoiceById } from "@/lib/hub/invoices";
import { subscriptionById, subscriptionForTenant, planById } from "@/lib/hub/plans";
import { tenantById, patchTenant } from "@/lib/hub/registry";
import { getHubSettings } from "@/lib/hub/settings";
import { audit } from "@/lib/hub/audit";
import { sameOrigin } from "@/lib/guard";
import type { SaasInvoice } from "@/lib/hub/types";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

/**
 * GET  — فواتيرُ المالك وبياناتُ اشتراكه وطرقُ الدفع المتاحة.
 * POST — إرسالُ دفعةٍ يدويّة (إيصال + رقم العملية + اسم المحوِّل + رقمه).
 */

export async function GET() {
  if (!(await isHubHost())) return NextResponse.json({ error: "غير موجود" }, { status: 404 });
  const owner = await requireOwner();
  if (!owner) return NextResponse.json({ error: "يجب تسجيل الدخول" }, { status: 401 });

  const settings = await getHubSettings();
  const methods = settings.manualPay.enabled
    ? settings.manualPay.methods.filter((m) => m.active)
    : [];

  const invoices: SaasInvoice[] = [];
  let activePlan: { name: string; price: number; interval: string } | null = null;
  let subscription: { id: string; status: string; periodEnd: string; planId: string } | null = null;

  for (const tid of owner.tenantIds) {
    const tInvoices = await listInvoices({ tenantId: tid });
    invoices.push(...tInvoices);
    const sub = await subscriptionForTenant(tid);
    if (sub) {
      const plan = await planById(sub.planId);
      subscription = { id: sub.id, status: sub.status, periodEnd: sub.currentPeriodEnd, planId: sub.planId };
      if (plan) activePlan = { name: plan.name, price: plan.priceEGP, interval: plan.interval };
    }
  }

  return NextResponse.json({
    owner: { name: owner.name, email: owner.email },
    subscription,
    plan: activePlan,
    invoices: invoices.slice(0, 20),
    methods,
    paymob: settings.paymob.enabled,
  });
}

export async function POST(req: Request) {
  if (!(await isHubHost())) return NextResponse.json({ error: "غير موجود" }, { status: 404 });
  if (!(await sameOrigin(req))) return NextResponse.json({ error: "طلب غير صالح" }, { status: 403 });
  const owner = await requireOwner();
  if (!owner) return NextResponse.json({ error: "يجب تسجيل الدخول" }, { status: 401 });

  const body = await req.json().catch(() => ({}));
  const action = String(body.action ?? "");

  if (action === "pay") {
    const invoiceId = String(body.invoiceId ?? "").trim();
    const kind = String(body.kind ?? "");
    const senderName = String(body.senderName ?? "").trim().slice(0, 100);
    const senderNumber = String(body.senderNumber ?? "").trim().slice(0, 30);
    const transactionRef = String(body.transactionRef ?? "").trim().slice(0, 60);
    const receipt = String(body.receipt ?? "");

    if (!senderName) return NextResponse.json({ error: "أدخل اسم المحوِّل" }, { status: 400 });
    if (!senderNumber) return NextResponse.json({ error: "أدخل رقم المحوِّل" }, { status: 400 });
    if (!transactionRef) return NextResponse.json({ error: "أدخل رقم العملية" }, { status: 400 });
    if (!receipt || !receipt.startsWith("data:image/")) return NextResponse.json({ error: "أرفق صورة الإيصال" }, { status: 400 });
    if (receipt.length > 400_000) return NextResponse.json({ error: "صورة الإيصال كبيرة جداً (الحدّ ٣٠٠ كيلوبايت)" }, { status: 400 });
    if (!["instapay", "wallet", "bank"].includes(kind)) return NextResponse.json({ error: "طريقة دفع غير صالحة" }, { status: 400 });

    const inv = await invoiceById(invoiceId);
    const ownerTenants = new Set(owner.tenantIds);

    if (inv) {
      if (!ownerTenants.has(inv.tenantId)) return NextResponse.json({ error: "لا صلاحية" }, { status: 403 });
      if (inv.status !== "pending") return NextResponse.json({ error: "هذه الفاتورة لا تقبل الدفع" }, { status: 400 });
      await updateInvoice(inv.id, {
        receiptUrl: receipt,
        manualMethod: { kind: kind as "instapay" | "wallet" | "bank", senderName, senderNumber, transactionRef },
      });
      const tenant = await tenantById(inv.tenantId);
      if (tenant && tenant.status === "onboarding") {
        await patchTenant(inv.tenantId, { status: "pending_approval" });
      }
      await audit("invoice.manual_submit", { kind: "owner", id: owner.id, name: owner.name }, { tenantId: inv.tenantId, details: { invoiceId: inv.id, kind, transactionRef } });
      return NextResponse.json({ ok: true });
    }

    /* لا فاتورة — يُنشئ جديدة (تجديد يدوي) */
    const tid = owner.tenantIds[0];
    if (!tid) return NextResponse.json({ error: "لا منصّة مرتبطة" }, { status: 400 });
    const tenant = await tenantById(tid);
    const sub = await subscriptionForTenant(tid);
    if (!sub) return NextResponse.json({ error: "لا اشتراك" }, { status: 400 });
    const plan = await planById(sub.planId);
    if (!plan || plan.priceEGP === 0) return NextResponse.json({ error: "خطتك مجانية" }, { status: 400 });

    const newInv = await createInvoice({
      tenantId: tid,
      subscriptionId: sub.id,
      plan,
      provider: "manual",
      manualMethod: { kind: kind as "instapay" | "wallet" | "bank", senderName, senderNumber, transactionRef },
      receiptUrl: receipt,
    });
    if (tenant?.status === "onboarding") {
      await patchTenant(tid, { status: "pending_approval" });
    }
    await audit("invoice.manual_submit", { kind: "owner", id: owner.id, name: owner.name }, { tenantId: tid, details: { invoiceId: newInv.id, kind, transactionRef } });
    return NextResponse.json({ ok: true });
  }

  return NextResponse.json({ error: "إجراء غير معروف" }, { status: 400 });
}
