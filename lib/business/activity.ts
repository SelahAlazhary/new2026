import type { Activity, ActivityKind, User } from "@/lib/utils/types";

/**
 * تتبّع نشاط الطالب.
 * ------------------------------------------------------------------
 * السؤال الذي يجيب عنه هذا الملف: ماذا يفعل الطالب فعلاً؟ متى يدخل،
 * وأيّ الدروس يفتح، وكم يمكث، ومن أين جاء إلى المنصّة أصلاً.
 *
 * **حدُّ التخزين قيدٌ في التصميم لا تفصيلٌ بعده.** سجلُّ الأحداث ينمو
 * بلا سقف بطبعه، وقاعدةُ المنصّة واحدة تُقرأ كاملةً في كل طلب. ولذلك:
 *
 *   • السجلّ حلقةٌ مقفلة لكل طالب (آخر ‎CAP‎ حدثاً)، فينمو بعدد الطلاب
 *     لا بعدد الأيام — وهو ما يمكن التنبّؤ به.
 *   • الحدثُ نفسُه مضغوط: حروفٌ لا كلمات في النوع، ومراجعُ لا نسخٌ من
 *     الأسماء (الاسمُ يُقرأ من الكورس وقت العرض).
 *   • المجاميع الدائمة (عدد الزيارات · آخر ظهور · دقائق المشاهدة) على
 *     الحساب نفسه، فلا تضيع حين تُزاح الأحداثُ القديمة.
 */

/** أقصى عدد أحداث محفوظة لكل طالب. */
export const CAP = 60;

export const KIND_LABEL: Record<ActivityKind, string> = {
  login: "دخول",
  view: "فتح صفحة",
  lesson: "مشاهدة درس",
  quiz: "اختبار درس",
  exam: "اختبار",
  pay: "طلب دفع",
  redeem: "تفعيل كود",
  live: "بثّ مباشر",
};

/** أيقونة نصّية مختصرة لكل نوع — تُقرأ في القوائم الطويلة. */
export const KIND_ICON: Record<ActivityKind, string> = {
  login: "🔑",
  view: "📄",
  lesson: "▶️",
  quiz: "✍️",
  exam: "📝",
  pay: "💳",
  redeem: "🎟️",
  live: "📡",
};

/**
 * مصدر الزيارة — من أين جاء الطالب.
 * يُشتقّ من الإحالة مرّةً واحدة عند التسجيل ويبقى، فهو صفةُ الحساب لا
 * صفةُ الزيارة.
 */
export function sourceOf(referrer?: string | null, utm?: string | null): string {
  const u = (utm ?? "").trim().toLowerCase();
  if (u) return u;
  const r = (referrer ?? "").trim().toLowerCase();
  if (!r) return "مباشر";
  if (/facebook|fb\.me|fb\.com/.test(r)) return "فيسبوك";
  if (/instagram/.test(r)) return "إنستجرام";
  if (/whatsapp|wa\.me/.test(r)) return "واتساب";
  if (/t\.me|telegram/.test(r)) return "تليجرام";
  if (/youtube|youtu\.be/.test(r)) return "يوتيوب";
  if (/tiktok/.test(r)) return "تيك توك";
  if (/google|bing|yahoo|duckduckgo/.test(r)) return "بحث";
  if (/twitter|x\.com/.test(r)) return "إكس";
  try {
    return new URL(r).hostname.replace(/^www\./, "");
  } catch {
    return "أخرى";
  }
}

/** حدثٌ جديد بمعرّف قصير — الطول هنا تخزينٌ لا جمال. */
export function newActivity(
  kind: ActivityKind,
  ref?: string,
  meta?: string
): Activity {
  return {
    id: Math.random().toString(36).slice(2, 9),
    at: new Date().toISOString(),
    kind,
    ...(ref ? { ref } : {}),
    ...(meta ? { meta } : {}),
  };
}

/**
 * يحدّث مجاميعَ الطالب بحدثٍ وقع.
 * الحلقةُ نفسُها تُكتب في مسارها المستقلّ (lib/activity-store.ts) —
 * هنا ما يبقى في القاعدة الرئيسية وحده. يُعدّل المستخدمَ في مكانه؛
 * والحفظُ على المستدعي.
 */
export function pushActivity(u: User, a: Activity, minutes = 0) {
  u.lastSeen = a.at;
  if (a.kind === "login") u.visits = (u.visits ?? 0) + 1;
  if (minutes > 0) u.minutes = Math.round((u.minutes ?? 0) + minutes);
}

/* ------------------------------------------------------------------ */
/*  قراءةُ التقرير                                                     */
/* ------------------------------------------------------------------ */

/** هل الطالب متّصل الآن؟ (ظهر خلال خمس دقائق) */
export function isOnline(u: Pick<User, "lastSeen">, now = Date.now()): boolean {
  if (!u.lastSeen) return false;
  return now - new Date(u.lastSeen).getTime() < 5 * 60_000;
}

/** منذ متى لم يُرَ؟ نصٌّ عربي مقروء. */
export function sinceText(at?: string, now = Date.now()): string {
  if (!at) return "لم يدخل بعد";
  const ms = now - new Date(at).getTime();
  const m = Math.floor(ms / 60_000);
  if (m < 1) return "الآن";
  if (m < 60) return `منذ ${m.toLocaleString("ar-EG")} دقيقة`;
  const h = Math.floor(m / 60);
  if (h < 24) return `منذ ${h.toLocaleString("ar-EG")} ساعة`;
  const d = Math.floor(h / 24);
  if (d < 30) return `منذ ${d.toLocaleString("ar-EG")} يوماً`;
  return new Date(at).toLocaleDateString("ar-EG", { timeZone: "Africa/Cairo" });
}

/** توزيع أنواع النشاط — لرسم شريط بسيط في التقرير. */
export function kindCounts(list: Activity[] | undefined): { kind: ActivityKind; n: number }[] {
  const map = new Map<ActivityKind, number>();
  for (const a of list ?? []) map.set(a.kind, (map.get(a.kind) ?? 0) + 1);
  return [...map.entries()]
    .map(([kind, n]) => ({ kind, n }))
    .sort((a, b) => b.n - a.n);
}

/** أنشط أيام الأسبوع — يقول متى يذاكر الطالب فعلاً. */
export function byWeekday(list: Activity[] | undefined): number[] {
  const days = [0, 0, 0, 0, 0, 0, 0];
  for (const a of list ?? []) {
    const d = new Date(a.at);
    if (Number.isFinite(d.getTime())) days[d.getDay()] += 1;
  }
  return days;
}

export const WEEKDAYS = ["الأحد", "الاثنين", "الثلاثاء", "الأربعاء", "الخميس", "الجمعة", "السبت"];
