/**
 * تخطيطات الواجهة الرئيسية.
 * ------------------------------------------------------------------
 * التخطيط بيانات لا شيفرة: ترتيب الأقسام، وشكل الهيرو، وعرض الحاوية،
 * وكثافة التباعد، والفاصل بين الأقسام. الصفحة تقرأ هذه البيانات وترسم
 * — فإضافة تخطيط سطر في مصفوفة لا صفحة جديدة.
 *
 * لماذا الترتيب مصفوفة معرّفات لا شيفرة شرطية؟ لأن ترتيب الأقسام أكثر
 * ما يتغيّر بين تخطيط وآخر، ومصفوفة تجعله بياناً يُقرأ ويُتحقّق منه
 * بدل شجرة شروط تتضخّم مع كل تخطيط.
 */

/** أقسام الصفحة القابلة للترتيب. */
export type HomeSection = "freeLive" | "stages" | "features" | "plans" | "testimonials" | "faq";

export const HOME_SECTIONS: HomeSection[] = ["freeLive", "stages", "features", "plans", "testimonials", "faq"];

/** شكل الهيرو. */
export type HeroShape =
  | "split"      // نصّ ويسارَه الصورة (الافتراضي)
  | "reversed"   // الصورة يميناً والنصّ يساراً
  | "centered"   // كل شيء في الوسط والصورة تحته
  | "stacked"    // الصورة فوق والنصّ تحتها
  | "compact";   // بلا صورة — نصّ مركّز فقط

/** عرض الحاوية. */
export type HomeWidth = "narrow" | "default" | "wide";
/** كثافة التباعد بين الأقسام. */
export type HomeDensity = "tight" | "normal" | "airy";
/** الفاصل بين الأقسام. */
export type HomeDivider = "none" | "rule" | "ornament" | "wave";

export type HomeLayout = {
  id: string;
  name: string;
  hint: string;
  hero: HeroShape;
  order: HomeSection[];
  width: HomeWidth;
  density: HomeDensity;
  divider: HomeDivider;
};

function h(
  id: string, name: string, hint: string,
  hero: HeroShape, order: HomeSection[],
  width: HomeWidth, density: HomeDensity, divider: HomeDivider
): HomeLayout {
  return { id, name, hint, hero, order, width, density, divider };
}

/* الترتيبات المستخدمة — مسمّاة لتُقرأ */
const O_DEFAULT: HomeSection[] = ["freeLive", "stages", "features", "plans", "testimonials", "faq"];
const O_PLANS_FIRST: HomeSection[] = ["plans", "stages", "features", "freeLive", "testimonials", "faq"];
const O_PROOF_FIRST: HomeSection[] = ["testimonials", "stages", "features", "plans", "freeLive", "faq"];
const O_FAQ_EARLY: HomeSection[] = ["stages", "features", "faq", "plans", "testimonials", "freeLive"];
const O_LIVE_LAST: HomeSection[] = ["stages", "features", "plans", "testimonials", "faq", "freeLive"];
const O_LEAN: HomeSection[] = ["stages", "features", "plans", "faq"];
const O_SALES: HomeSection[] = ["plans", "testimonials", "stages", "features", "faq", "freeLive"];
const O_STORY: HomeSection[] = ["stages", "features", "testimonials", "plans", "faq", "freeLive"];

export const HOME_LAYOUTS: HomeLayout[] = [
  h("classic", "الكلاسيكي", "الترتيب الأصلي بهيرو منقسم", "split", O_DEFAULT, "default", "normal", "none"),
  h("classicAiry", "الكلاسيكي الفسيح", "نفس الترتيب بتباعد أوسع وفواصل مذهّبة", "split", O_DEFAULT, "default", "airy", "ornament"),
  h("mirror", "المعكوس", "الصورة يميناً والنصّ يساراً", "reversed", O_DEFAULT, "default", "normal", "rule"),
  h("center", "المتمركز", "هيرو في الوسط والصورة تحته", "centered", O_DEFAULT, "default", "normal", "ornament"),
  h("centerWide", "المتمركز العريض", "متمركز بحاوية عريضة", "centered", O_DEFAULT, "wide", "airy", "wave"),
  h("stack", "المتراكب", "الصورة فوق والنصّ تحتها", "stacked", O_DEFAULT, "narrow", "normal", "rule"),
  h("salesFirst", "البيع أولاً", "الخطط في أعلى الصفحة", "split", O_PLANS_FIRST, "default", "normal", "ornament"),
  h("salesCompact", "البيع المضغوط", "خطط أولاً وهيرو بلا صورة", "compact", O_PLANS_FIRST, "narrow", "tight", "rule"),
  h("proof", "الدليل أولاً", "شهادات الطلاب قبل كل شيء", "split", O_PROOF_FIRST, "default", "normal", "none"),
  h("proofAiry", "الدليل الفسيح", "شهادات أولاً بتباعد واسع", "centered", O_PROOF_FIRST, "wide", "airy", "ornament"),
  h("answers", "الأسئلة مبكّراً", "الأسئلة الشائعة قبل الخطط", "split", O_FAQ_EARLY, "default", "normal", "rule"),
  h("liveLast", "البث أخيراً", "البث المجاني في آخر الصفحة", "reversed", O_LIVE_LAST, "default", "normal", "ornament"),
  h("lean", "المختصر", "ثلاثة أقسام فقط — أسرع طريق للاشتراك", "compact", O_LEAN, "narrow", "tight", "none"),
  h("leanWide", "المختصر العريض", "مختصر بحاوية عريضة وتباعد مريح", "split", O_LEAN, "wide", "normal", "rule"),
  h("magazine", "المجلّة", "حاوية عريضة وفواصل موجيّة", "stacked", O_STORY, "wide", "airy", "wave"),
  h("story", "الحكاية", "مزايا فشهادات فخطط", "split", O_STORY, "default", "airy", "ornament"),
  h("dense", "المكثّف", "كل الأقسام بتباعد ضيّق", "compact", O_DEFAULT, "default", "tight", "rule"),
  h("poster", "الملصق", "هيرو متمركز كبير وحاوية ضيّقة", "centered", O_SALES, "narrow", "airy", "ornament"),
  h("showcase", "العرض", "بيع أولاً بهيرو معكوس عريض", "reversed", O_SALES, "wide", "normal", "wave"),
  h("minimal", "المبسّط", "بلا فواصل ولا زخرفة بين الأقسام", "compact", O_LEAN, "default", "normal", "none"),
];

export const DEFAULT_HOME_LAYOUT = HOME_LAYOUTS[0].id;

export function findHomeLayout(id?: string): HomeLayout {
  return HOME_LAYOUTS.find((l) => l.id === id) ?? HOME_LAYOUTS[0];
}

/** أصناف عرض الحاوية وكثافة التباعد — في مكان واحد فلا تتفرّق القيم. */
export const WIDTH_CLASS: Record<HomeWidth, string> = {
  narrow: "[&_.container]:max-w-3xl",
  default: "",
  wide: "[&_.container]:max-w-[88rem]",
};

export const DENSITY_CLASS: Record<HomeDensity, string> = {
  tight: "[&_section]:py-12",
  normal: "",
  airy: "[&_section]:py-32",
};
