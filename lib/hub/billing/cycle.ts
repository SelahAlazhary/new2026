import "server-only";
import { listTenants, patchTenant } from "../registry";
import { subscriptionForTenant, setSubscriptionStatus, planById, createSubscription } from "../plans";
import { getHubSettings } from "../settings";
import { createInvoice, listInvoices } from "../invoices";
import { audit } from "../audit";

/**
 * دورةُ الفوترة — تُشغَّل يوميّاً (Cron).
 * ------------------------------------------------------------------
 * تفعل ثلاثةَ أشياء بحسب موعد نهاية الفترة:
 *   ــ **قبل الانتهاء بـ٧ أيام**: تُنشئ فاتورةَ تجديدٍ إن لم توجد، فيرى
 *      المدرّسُ استحقاقاً قادماً (والدفعُ يمدّد الفترة).
 *   ــ **بعد الانتهاء**: الاشتراكُ `past_due` والمنصّةُ تبقى تعمل ضمن
 *      المهلة (grace) — لا تُقطع فجأةً على طلاب المدرّس.
 *   ــ **بعد الانتهاء + المهلة**: المنصّةُ `expired` — تُقرأ ولا تُكتب،
 *      ويرى الطالبُ صفحةَ توقّف حتى يجدّد المدرّس.
 *
 * والتجربةُ المجانيّة تُعامَل كالفترة: تنتهي فتصير `past_due` ثم `expired`،
 * فيدفع المدرّسُ ليكمل.
 */

const DAY = 86_400_000;
const RENEW_AHEAD = 7 * DAY;

export type CycleResult = { checked: number; renewals: number; pastDue: number; expired: number };

export async function runBillingCycle(now = Date.now()): Promise<CycleResult> {
  const settings = await getHubSettings();
  const graceMs = (settings.gracePeriodDays ?? 7) * DAY;
  const tenants = (await listTenants()).filter((t) => t.status === "active" || t.status === "expired");

  const out: CycleResult = { checked: 0, renewals: 0, pastDue: 0, expired: 0 };

  for (const tenant of tenants) {
    const sub = await subscriptionForTenant(tenant.id);
    if (!sub) continue;
    const plan = await planById(sub.planId);
    if (!plan || plan.priceEGP === 0) continue; // المجانيّةُ لا تُفوتر
    out.checked++;

    const end = new Date(sub.currentPeriodEnd).getTime();

    /* فاتورةُ تجديدٍ قبل الاستحقاق — مرّةً واحدة */
    if (sub.status === "active" && end - now < RENEW_AHEAD && end > now) {
      const open = (await listInvoices({ tenantId: tenant.id, status: "pending" })).length;
      if (!open) {
        await createInvoice({ tenantId: tenant.id, subscriptionId: sub.id, plan, provider: settings.paymob.enabled ? "paymob" : "manual" });
        out.renewals++;
      }
    }

    /* انتهت الفترة: past_due ثمّ expired بعد المهلة */
    if (end <= now) {
      if (now - end >= graceMs) {
        if (tenant.status !== "expired") {
          await patchTenant(tenant.id, { status: "expired" });
          await setSubscriptionStatus(sub.id, "expired", "system");
          await audit("subscription.expired", { kind: "system", id: "billing", name: "الدفع الآليّ" }, { tenantId: tenant.id });
          out.expired++;
        }
      } else if (sub.status === "active") {
        await setSubscriptionStatus(sub.id, "past_due", "system");
        out.pastDue++;
      }
    }
  }

  return out;
}
