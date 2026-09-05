import type { User } from "../types";
import { PERMS, can, type AdminPerm } from "../perms";
import type { HideableSection, Tenant, TenantFeature } from "./types";

/**
 * ما يملك الـSuper Admin إخفاءَه أو إطفاءَه في منصّةٍ بعينها.
 * ------------------------------------------------------------------
 * **وفرقٌ بين الاثنين لا يُخلَط:**
 *
 *   • **قسمٌ مخفيّ** (`hiddenSections`) — يختفي من لوحة صاحب المنصّة،
 *     ويُرفض تعديلُ بياناته منه. والميزةُ نفسُها تبقى تعمل للطالب: من
 *     أخفى «الاختبارات» عن المشرف لم يُلغِ اختباراً قائماً.
 *
 *   • **ميزةٌ مطفأة** (`features`) — تُغلق من أساسها: المسارُ يردّ ٤٠٣
 *     للطالب وللمشرف معاً. وهي ما تُباع في الخطط.
 *
 * والفحصُ في الخادم لا في القائمة وحدَها: إخفاءُ الرابط ليس حماية.
 */

export const SECTIONS: { key: HideableSection; label: string; hint: string }[] = [
  ...PERMS.map((p) => ({ key: p.key as HideableSection, label: p.label, hint: p.hint })),
  { key: "reports", label: "تقارير الطلاب", hint: "تقرير كل طالب ومستواه" },
  { key: "supportChat", label: "محادثات الدعم", hint: "المحادثات المباشرة مع الطلاب" },
  { key: "maintenance", label: "الصيانة", hint: "وضع الصيانة وإغلاق الأقسام" },
  { key: "databases", label: "قواعد البيانات", hint: "قواعد فايربيز وفروعها" },
];

export const FEATURES: { key: TenantFeature; label: string; hint: string }[] = [
  { key: "liveMeet", label: "البث المباشر", hint: "جلسات Meet والبث" },
  { key: "youtube", label: "قناة اليوتيوب", hint: "جلب فيديوهات القناة" },
  { key: "telegramBot", label: "بوت تليجرام", hint: "إشعارات الدفع على تليجرام" },
  { key: "bunny", label: "Bunny Stream", hint: "استضافة الفيديو بروابط موقّعة" },
  { key: "drive", label: "رفع على Drive", hint: "استضافة الملفّات في جوجل درايف" },
  { key: "webPush", label: "إشعارات الأجهزة", hint: "الإشعارات على شاشة الهاتف" },
  { key: "studentPayments", label: "بوّابة دفع الطلاب", hint: "التحويل وطلبات الدفع" },
  { key: "codes", label: "أكواد التفعيل", hint: "توليد الأكواد واستهلاكها" },
  { key: "exams", label: "الاختبارات", hint: "بناء الاختبارات وتسليمها" },
  { key: "backup", label: "النسخ الاحتياطي", hint: "النسخ اليومي والاستعادة" },
  { key: "customDomain", label: "دومين مخصّص", hint: "ربط المنصّة بدومين صاحبها" },
  { key: "team", label: "مشرفون إضافيّون", hint: "إضافة مشرفين بصلاحيات" },
  { key: "captureGuard", label: "حارس الالتقاط", hint: "تصعيب تصوير المحتوى" },
  { key: "poweredBy", label: "سطر «مدعوم بواسطة»", hint: "ذكرُ المنصّة الأمّ في الفوتر" },
];

/** هل هذا القسم مخفيٌّ في هذه المنصّة؟ */
export function sectionHidden(tenant: Tenant | null | undefined, section: HideableSection): boolean {
  return Boolean(tenant?.hiddenSections?.includes(section));
}

/**
 * هل هذه الميزة مفعّلة؟
 * الغائبُ **مفعَّل**: منصّةٌ قديمةٌ لم تُضبط لها ميزات تعمل كما كانت،
 * ولا تُطفأ ميزةٌ إلّا بقرارٍ مكتوب.
 */
export function featureOn(tenant: Tenant | null | undefined, feature: TenantFeature): boolean {
  return tenant?.features?.[feature] !== false;
}

/**
 * صلاحيةُ مشرفٍ داخل منصّته — الصلاحيةُ القديمة **وعدمُ الإخفاء**.
 * `can()` القديمة تبقى كما هي بلا مساس، فما بُني عليها لا يتغيّر.
 */
export function canInTenant(
  user: Pick<User, "role" | "owner" | "adminPerms"> | null | undefined,
  perm: AdminPerm,
  tenant: Tenant | null | undefined
): boolean {
  if (!can(user, perm)) return false;
  return !sectionHidden(tenant, perm as HideableSection);
}

/**
 * القسمُ الذي يملك مسارَ اللوحة — للإخفاء لا للصلاحية.
 * (`permForPath` تُجيب عن الصلاحية، وهذه عن الإخفاء: بينهما مساراتٌ
 * لا صلاحيةَ خاصّةً لها مثل «الصيانة» و«محادثات الدعم».)
 */
export function sectionForAdminPath(href: string): HideableSection | null {
  const map: Record<string, HideableSection> = {
    "/admin/customize": "customize",
    "/admin/appearance": "appearance",
    "/admin/students": "students",
    "/admin/reports": "reports",
    "/admin/grades": "subjects",
    "/admin/subjects": "subjects",
    "/admin/courses": "subjects",
    "/admin/units": "subjects",
    "/admin/lessons": "subjects",
    "/admin/plans": "plans",
    "/admin/payments": "payments",
    "/admin/codes": "codes",
    "/admin/exams": "exams",
    "/admin/live": "live",
    "/admin/youtube": "youtube",
    "/admin/notifications": "notifications",
    "/admin/analytics": "analytics",
    "/admin/security": "security",
    "/admin/backup": "backup",
    "/admin/databases": "databases",
    "/admin/maintenance": "maintenance",
    "/admin/testimonials": "testimonials",
    "/admin/support/chat": "supportChat",
    "/admin/support": "support",
    "/admin/team": "team",
  };
  const hit = Object.keys(map)
    .filter((k) => href === k || href.startsWith(k + "/"))
    .sort((a, b) => b.length - a.length)[0];
  return hit ? map[hit] : null;
}

/*
  ============================================================
  الفرضُ على مسارات API — في مكانٍ واحد
  ------------------------------------------------------------
  كلُّ مسارٍ ملفوفٌ بـ`tenantRoute()` (انظر `lib/hub/context.ts`)، فالفحصُ
  هناك يكفي عن ثمانيةٍ وثلاثين تعديلاً — ولا يُنسى مسارٌ لأنّ اللفَّ آليّ.

  والمساراتُ التي لا تُحجب أبداً مذكورةٌ صراحةً: تسجيلُ الدخول والخروج
  وقراءةُ الجلسة وسجلُّ الأمان — وإلّا حُبس صاحبُ المنصّة خارجها أو
  انقطع تدوينُ ما يُصدّ.
  ============================================================
*/

/**
 * لا تُفحص أبداً — لا بإخفاءٍ ولا بإطفاءٍ ولا بإيقاف.
 * وأربعتُها بابُ العودة: من لم يستطع الدخولَ ولا الخروجَ ولا معرفةَ من
 * هو، لم يستطع أن يجدّد اشتراكَه أصلاً. وتدوينُ الأمان يبقى عاملاً على
 * كلّ حال — وإلّا صار الإيقافُ ستراً لمن يهاجم.
 *
 * **ولا يدخل فيها `/api/content`**: قراءتُه تمرّ لأنّ البوّابة تُمرّر
 * القراءةَ كلَّها في الإيقاف، وكتابتُه يجب أن تُردّ — واستثناؤه كان
 * يفتح بابَ الكتابة على منصّةٍ موقوفة.
 */
export const ALWAYS_OPEN = [
  "/api/auth/login",
  "/api/auth/logout",
  "/api/auth/me",
  "/api/security/report",
];

/** مسارٌ إداريٌّ يخصّ قسماً — يُغلق إن أُخفي القسم. */
const API_SECTION: [string, HideableSection][] = [
  ["/api/admins", "team"],
  ["/api/security", "security"],
  ["/api/backup", "backup"],
  ["/api/databases", "databases"],
  ["/api/youtube", "youtube"],
  ["/api/telegram", "payments"],
  ["/api/testimonials", "testimonials"],
  ["/api/activity", "reports"],
];

/** مسارٌ تخصّه ميزة — يُغلق للجميع إن أُطفئت. */
const API_FEATURE: [string, TenantFeature][] = [
  ["/api/google", "liveMeet"],
  ["/api/live", "liveMeet"],
  ["/api/youtube", "youtube"],
  ["/api/telegram", "telegramBot"],
  ["/api/bunny", "bunny"],
  ["/api/push", "webPush"],
  ["/api/payments", "studentPayments"],
  ["/api/redeem", "codes"],
  ["/api/exam", "exams"],
  ["/api/backup", "backup"],
];

function match<T>(pairs: [string, T][], pathname: string): T | null {
  const hit = pairs
    .filter(([p]) => pathname === p || pathname.startsWith(p + "/"))
    .sort((a, b) => b[0].length - a[0].length)[0];
  return hit ? hit[1] : null;
}

export function isAlwaysOpen(pathname: string): boolean {
  return ALWAYS_OPEN.some((p) => pathname === p || pathname.startsWith(p + "/"));
}

export function sectionForApiPath(pathname: string): HideableSection | null {
  return match(API_SECTION, pathname);
}

export function featureForApiPath(pathname: string): TenantFeature | null {
  return match(API_FEATURE, pathname);
}

/**
 * مفاتيحُ `PUT /api/content` التي يملكها قسمٌ — لمنع تعديله وهو مخفيّ.
 * (المظهرُ والتخصيصُ يُفصَلان في `permForContentKeys`، وهذا يكمّلهما.)
 */
export function sectionForDbKey(key: string): HideableSection | null {
  const map: Record<string, HideableSection> = {
    subjects: "subjects",
    grades: "subjects",
    students: "students",
    plans: "plans",
    payments: "payments",
    codes: "codes",
    exams: "exams",
    live: "live",
    notifications: "notifications",
    tickets: "support",
    youtube: "youtube",
    testimonials: "testimonials",
  };
  return map[key] ?? null;
}
