/**
 * الصيانة.
 * ------------------------------------------------------------------
 * ليس كلُّ خللٍ يستدعي إغلاقَ المنصّة: قد يتعطّل البثُّ وحدَه، أو تُراجَع
 * الخططُ قبل ترمٍ جديد، أو يُغلق بابُ التسجيل ليومٍ واحد. وإغلاقُ الكلّ
 * من أجل جزءٍ خسارةٌ لا داعي لها.
 *
 * فالصيانةُ هنا على مستويين:
 *   • **المنصّة كلُّها** — لوحُ صيانةٍ يحلّ محلَّ كلّ شيء.
 *   • **قسمٌ بعينه** — القسمُ وحدَه يُغلق ويبقى ما سواه يعمل.
 *
 * **والأدمن يمرّ دائماً.** صيانةٌ تحجب من يصلحها ليست صيانة — بل قفلٌ
 * على المفتاح داخله. فالمالكةُ والمشرفون يرون المنصّة كاملةً، ويُنبَّهون
 * بشريطٍ أنّها مغلقةٌ على غيرهم، فلا ينسون فتحَها.
 */

import type { SiteContent } from "@/lib/utils/types";

/** ما يمكن إغلاقُه على حدة. */
export type MaintScope =
  /* ---- أقسام الصفحة الرئيسية ---- */
  | "hero" | "stages" | "features" | "plans" | "testimonials" | "faq" | "freeLive"
  /* ---- أبوابٌ وظيفية ---- */
  | "register" | "login" | "pay" | "courses" | "exams" | "live" | "support";

export const SCOPE_LABEL: Record<MaintScope, string> = {
  hero: "قسم الرئيسية (الهيرو)",
  stages: "المراحل",
  features: "المزايا",
  plans: "الخطط والأسعار",
  testimonials: "آراء الطلاب",
  faq: "الأسئلة الشائعة",
  freeLive: "الدرس المجاني",
  register: "التسجيل (إنشاء حساب)",
  login: "تسجيل الدخول",
  pay: "بوابة الدفع",
  courses: "الكورسات والدروس",
  exams: "الاختبارات",
  live: "البث المباشر",
  support: "الدعم والمساعدة",
};

/** الأقسام مقسومةٌ إلى مجموعتين ليُقرأ الاختيار لا ليُبحث فيه. */
export const SCOPE_GROUPS: { title: string; items: MaintScope[] }[] = [
  { title: "أقسام الصفحة الرئيسية", items: ["hero", "stages", "features", "plans", "testimonials", "faq", "freeLive"] },
  { title: "أبواب المنصّة", items: ["register", "login", "pay", "courses", "exams", "live", "support"] },
];

export type Maintenance = {
  /** المنصّة كلُّها مغلقة. */
  all?: boolean;
  /** أقسامٌ بعينها مغلقة. */
  scopes?: MaintScope[];
  title?: string;
  message?: string;
  /** موعدُ العودة — نصٌّ حرّ أو تاريخ. */
  until?: string;
  /** هل يظهر عدّادٌ للعودة (يحتاج `until` تاريخاً). */
  countdown?: boolean;
};

export const DEFAULT_TITLE = "المنصّة تحت الصيانة";
export const DEFAULT_MESSAGE =
  "نُجري تحسيناتٍ سريعة الآن. عُد بعد قليل — ولن تفقد شيئاً من اشتراكك أو تقدّمك.";

/** هل المنصّة كلُّها مغلقة؟ */
export function siteDown(content: Pick<SiteContent, "maintenance">): boolean {
  return Boolean(content.maintenance?.all);
}

/**
 * هل هذا القسم مغلق؟
 * إغلاقُ الكلّ يغلق كلَّ قسمٍ ضمناً — فلا يُسأل عن الجزء بعد إغلاق الكلّ.
 */
export function scopeDown(
  content: Pick<SiteContent, "maintenance">,
  scope: MaintScope
): boolean {
  const m = content.maintenance;
  if (!m) return false;
  return Boolean(m.all) || (m.scopes ?? []).includes(scope);
}

/** النصُّ المعروض — الفارغُ يقع على الأصل فلا تظهر شاشةٌ بلا كلمة. */
export function maintText(content: Pick<SiteContent, "maintenance">) {
  const m = content.maintenance ?? {};
  return {
    title: (m.title ?? "").trim() || DEFAULT_TITLE,
    message: (m.message ?? "").trim() || DEFAULT_MESSAGE,
    until: (m.until ?? "").trim(),
  };
}

/** عددُ ما هو مغلقٌ الآن — للشارة في اللوحة. */
export function downCount(content: Pick<SiteContent, "maintenance">): number {
  const m = content.maintenance;
  if (!m) return 0;
  if (m.all) return 1 + (m.scopes?.length ?? 0);
  return m.scopes?.length ?? 0;
}
