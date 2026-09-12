import { NextResponse } from "next/server";
import { sameOrigin, limit, clientIp } from "@/lib/auth/guard";
import { isHubHost } from "@/lib/hub/guard-host";
import { requireOwner } from "@/lib/hub/owner";
import { listTenants, tenantById, upsertTenant, patchTenant } from "@/lib/hub/registry";
import { hubId } from "@/lib/hub/store";
import { availableSlug, checkSlug } from "@/lib/hub/onboarding";
import { visiblePlans, planById, createSubscription, subscriptionForTenant, setSubscriptionStatus } from "@/lib/hub/plans";
import { getHubSettings } from "@/lib/hub/settings";
import { tenantBaseUrl } from "@/lib/hub/resolve";
import { createInvoice, updateInvoice, listInvoices } from "@/lib/hub/invoices";
import { createCheckout, paymobConfigured } from "@/lib/hub/billing/paymob";
import { presetById } from "@/lib/hub/presets";
import { provisionTenant, resetTenantPassword } from "@/lib/hub/provision";
import { revealDelivery } from "@/lib/hub/delivery";
import { audit } from "@/lib/hub/audit";
import type { Tenant } from "@/lib/hub/types";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

/**
 * مُنظِّمُ رحلة إنشاء المنصّة.
 * ------------------------------------------------------------------
 * فعلٌ واحدٌ في كلّ طلب (`action`)، وكلُّها تعمل على **مسودّةِ** المدرّس:
 * منصّةٌ بحالة `onboarding` يملكها، واحدةٌ لا أكثر. الخطواتُ تُحفظ فيها
 * تباعاً (`onboardingStep`)، فمن قطع الرحلة عاد إلى حيث وقف.
 *
 * ولا يُنشئ المدرّسُ منصّةً نهائيّةً بنفسه: أقصى ما يبلغه `pending_approval`
 * (أو `active` إن كان القبولُ تلقائيّاً). التفعيلُ والتجهيزُ قرارٌ من
 * الموقع الأمّ — انظر `provisionTenant`.
 */
async function currentDraft(ownerId: string): Promise<Tenant | null> {
  const mine = (await listTenants()).filter((t) => t.ownerId === ownerId);
  return mine.find((t) => t.status === "onboarding" || t.status === "pending_approval") ?? null;
}

/**
 * منصّةٌ فُعِّلت بالفعل لهذا المالك — إن وُجدت فلا مسوَّدةَ ثانية.
 * ------------------------------------------------------------------
 * `currentDraft` تتعمّد تجاهل `active`: فمن أكمل رحلتَه لا يُحسب صاحبَ
 * مسوَّدةٍ معلَّقة. وهذا صوابٌ لغرضه هو — لكنّه ترك ثغرةً: من فُعِّلت
 * منصّتُه ثمّ عاد لخطوة «اختيار الخطّة» يجد `currentDraft` فارغةً،
 * فيُنشئ الكودُ مسوَّدةً **ثانيةً** لصاحبٍ لديه بالفعل منصّةٌ عاملة —
 * ومنه صار البريدُ الواحد يملك عدّةَ منصّات، لا واحدةً كما يُفترض.
 */
async function activeTenant(ownerId: string): Promise<Tenant | null> {
  const mine = (await listTenants()).filter((t) => t.ownerId === ownerId);
  return mine.find((t) => t.status === "active") ?? null;
}

export async function POST(req: Request) {
  if (!(await isHubHost())) return NextResponse.json({ error: "غير موجود" }, { status: 404 });
  if (!(await sameOrigin(req))) return NextResponse.json({ error: "طلب غير صالح" }, { status: 403 });

  const owner = await requireOwner();
  if (!owner) return NextResponse.json({ error: "سجّل الدخول أوّلاً", code: "no_owner" }, { status: 401 });

  const rate = limit(`start:${await clientIp()}`, 60, 60_000);
  if (!rate.ok) return NextResponse.json({ error: "طلبات كثيرة" }, { status: 429 });

  const body = (await req.json().catch(() => ({}))) as Record<string, unknown>;
  const action = String(body.action ?? "");

  switch (action) {
    /* فحصُ توفّر الرابط — لحظيّاً أثناء الكتابة */
    case "slug-check": {
      const res = await checkSlug(String(body.slug ?? ""));
      return NextResponse.json(res);
    }

    /* اختيارُ الخطّة — يُنشئ المسودّة إن لم تكن، ويربط اشتراكاً */
    case "plan": {
      const plan = await planById(String(body.planId ?? ""));
      if (!plan || !plan.visible) return NextResponse.json({ error: "خطّة غير معروفة" }, { status: 400 });

      let draft = await currentDraft(owner.id);
      if (!draft) {
        const already = await activeTenant(owner.id);
        if (already) {
          return NextResponse.json(
            { error: "لديك منصّةٌ بالفعل — كلُّ حسابٍ يملك منصّةً واحدة", code: "already_has_tenant", tenantId: already.id },
            { status: 409 }
          );
        }
        const id = hubId("t");
        const slug = await availableSlug(owner.name || owner.email.split("@")[0]);
        draft = {
          id, slug, name: "", ownerId: owner.id,
          status: "onboarding", createdAt: new Date().toISOString(),
          onboardingStep: "name",
          brandPresetId: "midad",
          brandColors: presetById("midad").colors,
          hiddenSections: [], features: {},
          limits: plan.limits,
          adminEmail: owner.email,
        };
        await upsertTenant(draft);
        await createSubscription(id, plan);
        await audit("owner.start_platform", { kind: "owner", id: owner.id, name: owner.name }, { tenantId: id, details: { plan: plan.id } });
      } else {
        /* غيّر الخطّة قبل الإكمال: يُحدَّث الاشتراكُ والحدود */
        const sub = await subscriptionForTenant(draft.id);
        if (sub) await setSubscriptionStatus(sub.id, "canceled", "owner", "غيّر الخطّة");
        await createSubscription(draft.id, plan);
        draft = (await patchTenant(draft.id, { limits: plan.limits }))!;
      }
      return NextResponse.json({ ok: true, tenant: draft, planId: plan.id });
    }

    /* حفظُ بيانات المنصّة — اسمٌ ووصفٌ ورابطٌ وشعارٌ وهويّةٌ ودومين */
    case "save": {
      const draft = await currentDraft(owner.id);
      if (!draft) return NextResponse.json({ error: "ابدأ باختيار خطّة", code: "no_draft" }, { status: 400 });
      if (draft.status !== "onboarding") return NextResponse.json({ error: "لا يمكن التعديل بعد الإرسال" }, { status: 400 });

      const patch: Partial<Tenant> = {};
      const step = String(body.step ?? "");

      if (typeof body.name === "string") patch.name = body.name.trim().slice(0, 60);
      if (typeof body.description === "string") patch.description = body.description.trim().slice(0, 300);
      if (typeof body.logo === "string") patch.logo = body.logo.slice(0, 100000); // data: أو رابط

      if (typeof body.slug === "string") {
        const check = await checkSlug(body.slug);
        if (!check.ok) return NextResponse.json({ error: check.reason }, { status: 400 });
        patch.slug = body.slug.trim().toLowerCase();
      }

      if (typeof body.presetId === "string") {
        const preset = presetById(body.presetId);
        patch.brandPresetId = preset.id;
        if (!body.colors) patch.brandColors = preset.colors;
      }
      if (body.colors && typeof body.colors === "object") {
        const c = body.colors as Record<string, string>;
        const hex = (v: string, fb: string) => (/^#[0-9a-fA-F]{6}$/.test(v ?? "") ? v : fb);
        const cur = draft.brandColors;
        patch.brandColors = {
          primary: hex(c.primary, cur.primary),
          gold: hex(c.gold, cur.gold),
          paper: hex(c.paper, cur.paper),
        };
      }

      if (typeof body.customDomain === "string") {
        const d = body.customDomain.trim().toLowerCase().replace(/^https?:\/\//, "").replace(/\/.*$/, "");
        patch.customDomain = d || undefined;
      }

      if (step) patch.onboardingStep = step as Tenant["onboardingStep"];

      const next = await patchTenant(draft.id, patch);
      return NextResponse.json({ ok: true, tenant: next });
    }

    /* الإرسالُ للمراجعة — أو تفعيلٌ تلقائيّ إن كان القبولُ آليّاً */
    case "submit": {
      const draft = await currentDraft(owner.id);
      if (!draft) return NextResponse.json({ error: "لا توجد مسودّة" }, { status: 400 });
      if (!draft.name || draft.name.length < 3) return NextResponse.json({ error: "أدخل اسم المنصّة أوّلاً" }, { status: 400 });
      if (draft.status === "pending_approval") return NextResponse.json({ ok: true, tenant: draft, pending: true });

      const settings = await getHubSettings();
      const sub = await subscriptionForTenant(draft.id);
      const plan2 = sub ? await planById(sub.planId) : null;
      /* خطّةٌ مدفوعةٌ بلا تجربة: تحتاج دفعاً قبل الإرسال */
      if (plan2 && plan2.priceEGP > 0 && sub?.status === "pending_payment") {
        return NextResponse.json({ ok: false, needPayment: true, error: "أكمل الدفع لتفعيل منصّتك" }, { status: 402 });
      }
      const paid = sub?.status === "trialing" || sub?.status === "active";

      /* القبولُ التلقائيّ يُفعّل الآن (بعد الدفع في M5)؛ واليدويُّ ينتظر أدمن المنصّات */
      if (settings.approval === "auto_after_payment" && paid) {
        await patchTenant(draft.id, { status: "pending_approval", onboardingStep: "done" });
        const result = await provisionTenant(draft.id);
        if (sub) await setSubscriptionStatus(sub.id, sub.status === "trialing" ? "trialing" : "active", "system");
        return NextResponse.json({ ok: true, provisioned: true, result });
      }

      await patchTenant(draft.id, { status: "pending_approval", onboardingStep: "done" });
      await audit("owner.submit_platform", { kind: "owner", id: owner.id, name: owner.name }, { tenantId: draft.id });
      return NextResponse.json({ ok: true, tenant: { ...draft, status: "pending_approval" }, pending: true });
    }

    /* الدفعُ — تحويلٌ يدويّ (إيصال) أو بطاقةٌ عبر بايموب */
    case "pay": {
      const draft = await currentDraft(owner.id);
      if (!draft) return NextResponse.json({ error: "لا توجد منصّة" }, { status: 400 });
      const sub = await subscriptionForTenant(draft.id);
      if (!sub) return NextResponse.json({ error: "لا يوجد اشتراك" }, { status: 400 });
      const plan = await planById(sub.planId);
      if (!plan) return NextResponse.json({ error: "لا توجد خطّة" }, { status: 400 });
      const settings = await getHubSettings();
      const method = String(body.method ?? "manual");

      if (method === "paymob") {
        if (!paymobConfigured() || !settings.paymob.enabled) return NextResponse.json({ error: "الدفع بالبطاقة غير متاح حالياً" }, { status: 400 });
        const inv = await createInvoice({ tenantId: draft.id, subscriptionId: sub.id, plan, provider: "paymob" });
        try {
          const { iframeUrl, orderId } = await createCheckout({
            invoiceId: inv.id, amountEGP: inv.amountEGP, email: owner.email, name: owner.name,
            returnUrl: `${new URL(req.url).origin}/start`,
          });
          await updateInvoice(inv.id, { providerRef: orderId });
          return NextResponse.json({ ok: true, iframeUrl });
        } catch (e) {
          await updateInvoice(inv.id, { status: "failed", reviewNote: (e as Error).message });
          return NextResponse.json({ error: (e as Error).message }, { status: 502 });
        }
      }

      /* تحويلٌ يدويّ: يرفع الإيصالَ ورقمَ المحوِّل، فتنتظر الفاتورةُ اعتماداً */
      const receipt = typeof body.receipt === "string" ? body.receipt.slice(0, 400000) : undefined;
      const senderNumber = String(body.senderNumber ?? "").slice(0, 40);
      const kind = (["instapay", "wallet", "bank"].includes(String(body.kind)) ? body.kind : "wallet") as "instapay" | "wallet" | "bank";
      if (!receipt) return NextResponse.json({ error: "أرفق صورة الإيصال" }, { status: 400 });
      await createInvoice({
        tenantId: draft.id, subscriptionId: sub.id, plan, provider: "manual",
        manualMethod: { kind, senderNumber }, receiptUrl: receipt,
      });
      await patchTenant(draft.id, { status: "pending_approval", onboardingStep: "done" });
      await setSubscriptionStatus(sub.id, "pending_approval", "owner");
      await audit("owner.paid_manual", { kind: "owner", id: owner.id, name: owner.name }, { tenantId: draft.id });
      return NextResponse.json({ ok: true, pending: true });
    }

    /* كشفُ بيانات الدخول — مرّةً واحدةً لصاحب المنصّة بعد تجهيزها */
    case "reveal": {
      const mine = (await listTenants()).filter((t) => t.ownerId === owner.id);
      const t = mine.find((x) => x.id === String(body.tenantId ?? ""));
      if (!t) return NextResponse.json({ error: "لا توجد منصّة" }, { status: 404 });
      if (t.status !== "active") return NextResponse.json({ error: "لم تُجهَّز المنصّة بعد", code: "not_ready" }, { status: 409 });
      let d = await revealDelivery(t.id);
      let password = d?.password ?? null;
      if (!password) {
        password = await resetTenantPassword(t.id);
      }
      const base = tenantBaseUrl(t, process.env.ROOT_DOMAIN);
      return NextResponse.json({
        ok: true,
        adminEmail: t.adminEmail,
        password,
        studentUrl: base,
        adminUrl: `${base}/admin`,
      });
    }

    default:
      return NextResponse.json({ error: "أمر غير معروف" }, { status: 400 });
  }
}

/** حالةُ المسودّة الحالية — للاستعلام والاستئناف. */
export async function GET() {
  if (!(await isHubHost())) return NextResponse.json({ error: "غير موجود" }, { status: 404 });
  const owner = await requireOwner();
  if (!owner) return NextResponse.json({ owner: null }, { status: 200 });

  const mine = (await listTenants()).filter((t) => t.ownerId === owner.id);
  const draft = mine.find((t) => t.status === "onboarding" || t.status === "pending_approval") ?? null;
  const active = mine.filter((t) => t.status === "active" || t.status === "suspended" || t.status === "expired");
  const plans = await visiblePlans();
  const sub = draft ? await subscriptionForTenant(draft.id) : null;
  const plan = sub ? await planById(sub.planId) : null;
  const settings = await getHubSettings();

  /* ما يحتاجه الدفع: هل الخطّة مدفوعة؟ وطرقُ التحويل المتاحة، وحالةُ آخر فاتورة */
  const needPayment = Boolean(plan && plan.priceEGP > 0 && sub?.status === "pending_payment");
  const invoices = draft ? await listInvoices({ tenantId: draft.id }) : [];
  const payment = {
    needPayment,
    amountEGP: plan?.priceEGP ?? 0,
    manual: settings.manualPay.enabled ? settings.manualPay.methods.filter((m) => m.active) : [],
    paymob: settings.paymob.enabled && paymobConfigured(),
    lastInvoice: invoices[0] ? { status: invoices[0].status, provider: invoices[0].provider } : null,
  };

  return NextResponse.json(
    { owner: { name: owner.name, email: owner.email, picture: owner.picture }, draft, active, plans, planId: sub?.planId ?? null, subStatus: sub?.status ?? null, payment },
    { headers: { "Cache-Control": "no-store" } }
  );
}
