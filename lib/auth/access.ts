import type { PublicUser, User, Subscription, SitePlan, Live, TermNo } from "@/lib/utils/types";
import { pickKey, parsePick } from "@/lib/business/picks";

type U = Pick<User | PublicUser, "subscriptions" | "enrolled">;

/** هل الاشتراك ساري الآن؟ (expiresAt = null يعني بلا انتهاء) */
export function subActive(sub: Subscription, now = Date.now()): boolean {
  if (!sub.expiresAt) return true;
  const t = new Date(sub.expiresAt).getTime();
  return Number.isFinite(t) ? t > now : true;
}

/** كل الاشتراكات السارية للطالب. */
export function activeSubs(u: U | null | undefined, now = Date.now()): Subscription[] {
  return (u?.subscriptions ?? []).filter((s) => subActive(s, now));
}

/** هل يملك الطالب صلاحية على هذا الكورس؟
 *  - اشتراك نطاقه "*" (خطة كل المواد/الترم الكامل) وساري → يفتح كل المواد.
 *  - اشتراك على نفس الكورس وساري → يفتح هذا الكورس.
 *  الاشتراك ملك للطالب وحده، وينتهي تلقائياً عند expiresAt.
 */
export function courseActive(
  u: U | null | undefined,
  subjectId: string,
  now = Date.now(),
  subjectTerm?: TermNo
): boolean {
  const subs = activeSubs(u, now);
  if (subs.some((s) => s.subjectId === "*")) return true;                       // كل المواد
  if (subjectTerm && subs.some((s) => s.subjectId === `T${subjectTerm}`)) return true; // فصل دراسي كامل
  if (subs.some((s) => s.subjectId === subjectId)) return true;                 // كورس بعينه
  // توافق قديم (قبل نظام الاشتراكات)
  return Boolean(u?.enrolled?.includes(subjectId)) && (u?.subscriptions ?? []).length === 0;
}

/** صلاحية على كورس بكائنه (يمرّر الفصل الدراسي تلقائياً). */
export function subjectActive(
  u: U | null | undefined,
  subject: { id: string; term?: TermNo; free?: boolean } | null | undefined,
  now = Date.now()
): boolean {
  if (!subject) return false;
  /*
    المجّانيُّ يسبق كلَّ فحص.
    من أتاحه الأستاذُ مجّاناً أراده مفتوحاً لكلّ أحد — بحسابٍ أو بلا
    اشتراكٍ ساري. وفحصُ الاشتراك بعده عبثٌ: نتيجتُه لا تغيّر شيئاً.
  */
  if (subject.free) return true;
  return courseActive(u, subject.id, now, subject.term);
}


/**
 * صلاحيةُ مادّةٍ بعينها.
 * ------------------------------------------------------------------
 * تُفتح بأحد ثلاثة: صلاحيةٌ على الكورس كلِّه (فهي جزءٌ منه)، أو اشتراكٌ
 * مفتاحُه مفتاحُ هذه المادّة، أو درسٌ مجانيٌّ فيها — وذاك يُفحص عند الدرس
 * لا هنا.
 *
 * **والكورسُ يفتح موادَّه، والمادّةُ لا تفتح كورسَها.** الاتّجاهُ واحد،
 * وعكسُه يجعل شراءَ مادّةٍ واحدةٍ يفتح المنهجَ كلَّه.
 */
export function unitActive(
  u: U | null | undefined,
  subjectId: string,
  unitId: string,
  now = Date.now(),
  subjectTerm?: TermNo
): boolean {
  if (courseActive(u, subjectId, now, subjectTerm)) return true;
  return activeSubs(u, now).some((s) => s.subjectId === pickKey(subjectId, unitId));
}

/** اشتراكُ مادّةٍ بعينها إن وُجد — للعرض («اشتراك المادّة» ومدّتُه). */
export function unitSubscription(
  u: U | null | undefined,
  subjectId: string,
  unitId: string,
  now = Date.now()
): Subscription | null {
  return activeSubs(u, now).find((s) => s.subjectId === pickKey(subjectId, unitId)) ?? null;
}

/**
 * هل يملك الطالبُ شيئاً من هذا الكورس — كورساً كان أو مادّةً منه؟
 * تُستعمل في بطاقة الكورس: من اشترى مادّةً منه ليس «غيرَ مالك» تماماً،
 * فلا يُساق إلى بوّابة الدفع وكأنّه لم يشترِ شيئاً.
 */
export function ownsAnyUnit(
  u: U | null | undefined,
  subjectId: string,
  now = Date.now()
): boolean {
  return activeSubs(u, now).some((s) => parsePick(s.subjectId).subjectId === subjectId);
}

/** صلاحية درس = صلاحية الكورس أو درس تجريبي مجاني. */
export function lessonActive(u: U | null | undefined, subjectId: string, _lessonId: string, isFree?: boolean): boolean {
  return Boolean(isFree) || courseActive(u, subjectId);
}

/** أي وصول على الكورس. */
export function anyAccess(u: U | null | undefined, subjectId: string): boolean {
  return courseActive(u, subjectId);
}

/** هل لدى الطالب اشتراك ساري يفتح كل المواد (الترم الكامل)؟ */
export function hasTermAccess(u: U | null | undefined, now = Date.now()): boolean {
  return activeSubs(u, now).some((s) => s.subjectId === "*");
}

/** تاريخ انتهاء اشتراك «كل المواد» الساري (أو null إن لم يوجد/بلا انتهاء). */
export function termExpiry(u: U | null | undefined, now = Date.now()): string | null {
  const sub = activeSubs(u, now).find((s) => s.subjectId === "*");
  return sub?.expiresAt ?? null;
}

/** اشتراك ساري يخصّ كورساً بعينه (أو اشتراك كل المواد). */
export function subscriptionFor(u: U | null | undefined, subjectId: string, now = Date.now()): Subscription | null {
  const subs = activeSubs(u, now);
  return subs.find((s) => s.subjectId === subjectId) ?? subs.find((s) => s.subjectId === "*") ?? null;
}

/** الأيام المتبقّية على انتهاء اشتراك (null = بلا انتهاء). */
export function daysLeft(expiresAt?: string | null, now = Date.now()): number | null {
  if (!expiresAt) return null;
  const t = new Date(expiresAt).getTime();
  if (!Number.isFinite(t)) return null;
  return Math.max(0, Math.ceil((t - now) / 86400000));
}

/** حساب تاريخ انتهاء اشتراك من خطة — المصدر الوحيد لمنطق المدّة.
 *  term   → endsAt الخاص بالخطة، وإلا تاريخ نهاية الترم العام، وإلا المدّة بالأيام.
 *  month  → durationDays (٣٠ يوماً افتراضياً).
 *  custom → durationDays، أو بلا انتهاء إذا لم تُحدَّد.
 */
export function planExpiry(plan: SitePlan, termEnd?: string, from: Date = new Date()): string | null {
  const byDays = (d?: number | null) => {
    if (!d || d <= 0) return null;
    return new Date(from.getTime() + d * 86400000).toISOString();
  };
  /* الدائم لا ينتهي — null تعني «بلا تاريخ انتهاء» في كل المنصّة. */
  if (plan.kind === "lifetime") return null;
  if (plan.kind === "term") {
    const fixed = plan.endsAt || termEnd;
    if (fixed) {
      const d = new Date(fixed);
      if (Number.isFinite(d.getTime())) {
        d.setHours(23, 59, 59, 999); // نهاية اليوم المحدّد
        return d.toISOString();
      }
    }
    return byDays(plan.durationDays ?? 120); // ترم افتراضي ≈ ٤ أشهر
  }
  if (plan.kind === "month") return byDays(plan.durationDays ?? 30);
  return byDays(plan.durationDays);
}

/** نطاق الخطة كـ subjectId للاشتراك. */
export function planSubjectId(plan: SitePlan): string {
  return planTargets(plan)[0] ?? "";
}

/**
 * كلُّ ما تفتحه الخطّة — مفتاحاً مفتاحاً.
 * ------------------------------------------------------------------
 * كانت الخطّةُ تفتح مفتاحاً واحداً، فكفى `planSubjectId` نصّاً واحداً.
 * وخطّةُ «المختارة» تفتح جملةً منها، فلا يكفي. وهذه هي المرجعُ الآن،
 * و`planSubjectId` تُبقي أوّلَها لمن يريد وصفاً مختصراً — كشارةِ الكود.
 */
export function planTargets(plan: SitePlan): string[] {
  if (plan.scope === "all") return ["*"];
  if (plan.scope === "term") return plan.termNo ? [`T${plan.termNo}`] : [];
  if (plan.scope === "picked") return (plan.picks ?? []).filter(Boolean);
  return plan.subjectId ? [plan.subjectId] : [];
}

/** اسم الفصل الدراسي للعرض. */
export function termLabel(n?: TermNo): string {
  return n === 2 ? "الفصل الدراسي الثاني" : n === 1 ? "الفصل الدراسي الأول" : "بلا فصل محدّد";
}

/** هل الكورس مناسب لصف/شعبة الطالب؟ (تُستخدم في الواجهة وعلى السيرفر) */
export function eligibleFor(
  s: { grade?: string; track?: string },
  me?: { grade?: string; track?: string } | null
): boolean {
  const gradeOk = !me?.grade || !s.grade || s.grade === "كل الصفوف" || s.grade === me.grade;
  const trackOk = !me?.track || !s.track || s.track === "الكل" || s.track === me.track;
  return gradeOk && trackOk;
}

/** هل يحقّ للطالب فتح رابط هذه الجلسة؟
 *  audience = "all"         → أي طالب مسجّل (حتى غير المشترك).
 *  audience = "subscribers" → اشتراك ساري: على الكورس المحدّد إن وُجد، وإلا أي اشتراك.
 *  الزائر (بلا حساب) لا يرى الرابط إطلاقاً — تُفرض القاعدة على السيرفر أيضاً.
 */
export function liveVisible(
  u: (U & { id?: string }) | null | undefined,
  l: Pick<Live, "audience" | "subjectId"> & { subjectTerm?: TermNo },
  now = Date.now()
): boolean {
  const audience = l.audience ?? "subscribers";
  if (audience === "public") return true;   // بث مجاني — لا يحتاج حساباً
  if (!u) return false;
  if (audience === "all") return true;
  if (l.subjectId) return courseActive(u, l.subjectId, now, l.subjectTerm);
  return activeSubs(u, now).length > 0;
}

/** البث المجاني المتاح للجميع (يُعرض على الصفحة الرئيسية). */
export function publicLives(list: Live[]): Live[] {
  return list.filter((l) => l.audience === "public" && l.status !== "منتهي");
}
