import type { Tenant } from "./types";
import { isAlwaysOpen } from "./sections";

/**
 * بوّابةُ حالة المنصّة — ماذا يُخدم ومتى.
 * ------------------------------------------------------------------
 * الحالةُ في بطاقة المنصّة (`Tenant.status`) ليست وسماً للعرض: هي التي
 * تقرّر ما يصل المتصفّح. وقاعدتُها:
 *
 *   active                 كلُّ شيءٍ يعمل.
 *   suspended · expired    **يُقرأ ولا يُكتب.** الطالبُ والزائرُ يريان
 *                          صفحةَ توقّفٍ مهذّبة، وصاحبُ المنصّة يدخل لوحتَه
 *                          ليرى بياناتِه ويجدّد — ولا يُعدّل شيئاً (٤٠٢).
 *                          ولماذا يُقرأ أصلاً؟ لأنّ الإيقافَ عقوبةُ تأخّرٍ
 *                          في السداد لا مصادرةَ عمل، ومن جدّد عاد كلُّ
 *                          شيءٍ في لحظته.
 *   onboarding · pending   لم تُجهَّز بعد — لا شيءَ يُخدم على نطاقها.
 *   archived               ٤٠٤ كاملة، كأنّها لم تكن.
 *
 * وثلاثةُ مساراتٍ لا تُغلق أبداً (انظر `ALWAYS_OPEN`): الدخولُ والخروجُ
 * وقراءةُ الجلسة وتدوينُ الأمان — وإلّا حُبس صاحبُ المنصّة خارجَ لوحته
 * في اليوم الذي يريد أن يجدّد فيه.
 */

export type GateVerdict =
  | { ok: true }
  | { ok: false; kind: "paused" | "gone" | "unready"; status: number; message: string };

const MUTATING = new Set(["POST", "PUT", "PATCH", "DELETE"]);

/** هل تُخدم صفحاتُ هذه المنصّة أصلاً؟ (للتخطيط الجذري) */
export function pageGate(tenant: Tenant): GateVerdict {
  switch (tenant.status) {
    case "archived":
      return { ok: false, kind: "gone", status: 404, message: "لا توجد منصّة على هذا العنوان" };
    case "onboarding":
    case "pending_approval":
      return { ok: false, kind: "unready", status: 404, message: "هذه المنصّة قيد التجهيز" };
    case "suspended":
      return { ok: false, kind: "paused", status: 200, message: tenant.suspendReason || "المنصّة متوقّفة مؤقّتاً" };
    case "expired":
      return { ok: false, kind: "paused", status: 200, message: "انتهى اشتراك المنصّة" };
    default:
      return { ok: true };
  }
}

/** ما يُسمح به من مسارات API بحسب الحالة والطريقة. */
export function apiGate(tenant: Tenant, method: string, pathname: string): GateVerdict {
  if (isAlwaysOpen(pathname)) {
    /* حتى المؤرشفةُ تُدوّن ما يُصدّ عنها؛ وما عداها مغلق */
    if (tenant.status === "archived") return { ok: false, kind: "gone", status: 404, message: "غير موجود" };
    return { ok: true };
  }

  const verdict = pageGate(tenant);
  if (verdict.ok) return verdict;

  if (verdict.kind === "paused") {
    /* القراءةُ تمرّ، والكتابةُ تُردّ بـ٤٠٢ (الدفعُ مطلوب) لا بـ٤٠٣ — والفرقُ مقصود:
       ليست صلاحيةً ناقصةً بل اشتراكاً متوقّفاً، والرسالةُ تقول ذلك للواجهة. */
    if (!MUTATING.has(method)) return { ok: true };
    return { ok: false, kind: "paused", status: 402, message: verdict.message };
  }

  return { ok: false, kind: verdict.kind, status: 404, message: "غير موجود" };
}
