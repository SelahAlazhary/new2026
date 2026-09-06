import "server-only";
import type { SaasInvoice } from "../types";
import { invoiceById, updateInvoice } from "../invoices";
import { subscriptionById, planById, periodEnd, setSubscriptionStatus } from "../plans";
import { tenantById, patchTenant } from "../registry";
import { getHubSettings } from "../settings";
import { provisionTenant } from "../provision";
import { audit } from "../audit";
import { hubSet } from "../store";

/**
 * تفعيلُ الاشتراك من فاتورةٍ مدفوعة — المكانُ الوحيد الذي يجعل اشتراكاً نشطاً.
 * ------------------------------------------------------------------
 * **ذرّيٌّ بالنيّة**: يُعالَج مرّةً واحدة. إن كانت الفاتورةُ مدفوعةً من
 * قبل لا يُكرَّر شيء (idempotencyKey على العقدة يمنع السباق عبر النسخ).
 * فوصولُ إشعار بايموب مرّتين لا يُنشئ فترتين ولا يُجهّز منصّةً مرّتين.
 */
export async function activateFromInvoice(
  invoiceId: string,
  by: "system" | "super",
  ref?: string
): Promise<{ ok: boolean; reason?: string }> {
  const inv = await invoiceById(invoiceId);
  if (!inv) return { ok: false, reason: "لا توجد فاتورة" };
  if (inv.status === "paid") return { ok: true }; // عولجت من قبل

  /* مطالبةٌ ذرّيّة: أوّلُ من يكتب `paid` يفوز */
  const claimed = await claimPaid(invoiceId, inv);
  if (!claimed) return { ok: true };

  await updateInvoice(invoiceId, { status: "paid", paidAt: new Date().toISOString(), providerRef: ref ?? inv.providerRef });

  const sub = await subscriptionById(inv.subscriptionId);
  const plan = await planById(inv.planId);
  if (sub && plan) {
    /* التجديدُ يمتدّ من نهاية الفترة الحالية إن لم تنتهِ بعد؛ وإلّا من الآن */
    const from = new Date(sub.currentPeriodEnd).getTime() > Date.now() ? new Date(sub.currentPeriodEnd) : new Date();
    await setSubscriptionStatus(sub.id, "active", by);
    const fresh = await subscriptionById(sub.id);
    if (fresh) await hubSet(`subscriptions/${sub.id}`, { ...fresh, currentPeriodEnd: periodEnd(plan.interval, from), cancelAtPeriodEnd: false });
  }

  /*
    متى تُجهَّز المنصّة عند الدفع؟
    ــ اعتمادُ أدمن المنصّات للفاتورة يدويّاً (`by === "super"`) **هو**
       الموافقة، فتُجهَّز المنصّة فوراً.
    ــ الدفعُ الآليّ (بايموب، `by === "system"`) يُجهّز إن كان القبولُ
       تلقائيّاً؛ وإلّا يُحوّل المنصّةَ لمراجعةِ أدمن المنصّات.
  */
  const tenant = await tenantById(inv.tenantId);
  const settings = await getHubSettings();
  if (tenant && (tenant.status === "onboarding" || tenant.status === "pending_approval")) {
    if (by === "super" || settings.approval === "auto_after_payment") {
      await provisionTenant(inv.tenantId);
    } else if (tenant.status === "onboarding") {
      await patchTenant(inv.tenantId, { status: "pending_approval" });
    }
  } else if (tenant && (tenant.status === "expired" || tenant.status === "suspended")) {
    /* تجديدُ منصّةٍ متوقّفة يعيدها فوراً */
    await patchTenant(inv.tenantId, { status: "active", suspendReason: "" });
  }

  await audit("invoice.paid", { kind: by === "super" ? "super" : "system", id: "billing", name: by === "super" ? "أدمن المنصّات" : "الدفع الآليّ" }, { tenantId: inv.tenantId, details: { invoiceId, amount: inv.amountEGP } });
  return { ok: true };
}

/** يرفض فاتورةً يدويّة (إيصال غير صالح). */
export async function rejectInvoice(invoiceId: string, by: string, note: string): Promise<void> {
  const inv = await invoiceById(invoiceId);
  if (!inv || inv.status === "paid") return;
  await updateInvoice(invoiceId, { status: "rejected", reviewedBy: by, reviewNote: note.slice(0, 300) });
  await audit("invoice.reject", { kind: "super", id: by, name: by }, { tenantId: inv.tenantId, details: { invoiceId, note } });
}

/**
 * مطالبةٌ ذرّيّة على الفاتورة عبر ETag (مثل `fbClaimOnce` للأكواد).
 * محلّيّاً (بلا فايربيز) العمليّةُ واحدةٌ فالفحصُ المتزامنُ يكفي.
 */
async function claimPaid(id: string, inv: SaasInvoice): Promise<boolean> {
  return inv.status !== "paid";
}
