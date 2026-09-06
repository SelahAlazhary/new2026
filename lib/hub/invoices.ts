import "server-only";
import type { SaasInvoice, SaasPlan } from "./types";
import { hubGet, hubList, hubSet, hubId } from "./store";
import { planPrice } from "../plans";

/**
 * فواتيرُ اشتراك المنصّات — سجلٌّ لكلّ دفعةٍ (يدويّةٍ أو ببطاقة).
 * ------------------------------------------------------------------
 * الحالةُ تُشتقّ من الفاتورة لا من الواجهة: لا يصير اشتراكٌ نشطاً إلّا
 * بفاتورةٍ `paid`. و`idempotencyKey` يمنع ازدواجَ التفعيل حين يصل إشعارُ
 * الدفع مرّتين (بايموب تُعيد الإشعار).
 */

export async function invoiceById(id: string): Promise<SaasInvoice | null> {
  return hubGet<SaasInvoice>(`invoices/${id}`);
}

export async function listInvoices(opts?: { tenantId?: string; status?: SaasInvoice["status"] }): Promise<SaasInvoice[]> {
  const all = await hubList<SaasInvoice>("invoices");
  return Object.values(all)
    .filter((v) => v && v.id && (!opts?.tenantId || v.tenantId === opts.tenantId) && (!opts?.status || v.status === opts.status))
    .sort((a, b) => (b.createdAt ?? "").localeCompare(a.createdAt ?? ""));
}

/** يبحث عن فاتورةٍ بمرجع المزوّد — لمنع الازدواج عند وصول الإشعار. */
export async function invoiceByRef(providerRef: string): Promise<SaasInvoice | null> {
  const all = await hubList<SaasInvoice>("invoices");
  return Object.values(all).find((v) => v && v.providerRef === providerRef) ?? null;
}

export function amountOf(plan: SaasPlan): number {
  return planPrice({ price: plan.priceEGP, discount: plan.discount }).price;
}

export async function createInvoice(p: {
  tenantId: string; subscriptionId: string; plan: SaasPlan;
  provider: SaasInvoice["provider"];
  manualMethod?: SaasInvoice["manualMethod"];
  receiptUrl?: string;
}): Promise<SaasInvoice> {
  const now = new Date().toISOString();
  const inv: SaasInvoice = {
    id: hubId("inv"),
    tenantId: p.tenantId,
    subscriptionId: p.subscriptionId,
    planId: p.plan.id,
    amountEGP: amountOf(p.plan),
    currency: "EGP",
    provider: p.provider,
    status: "pending",
    manualMethod: p.manualMethod,
    receiptUrl: p.receiptUrl,
    createdAt: now,
    idempotencyKey: hubId("idem"),
  };
  await hubSet(`invoices/${inv.id}`, inv);
  return inv;
}

export async function updateInvoice(id: string, patch: Partial<SaasInvoice>): Promise<SaasInvoice | null> {
  const cur = await invoiceById(id);
  if (!cur) return null;
  const next = { ...cur, ...patch };
  await hubSet(`invoices/${id}`, next);
  return next;
}
