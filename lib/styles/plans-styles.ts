/**
 * تصاميم قسم الخطط في الصفحة الرئيسية.
 * ------------------------------------------------------------------
 * قسم الخطط أكثر ما يُقرَّر عنده الاشتراك، فشكله يستحقّ تحكّماً مستقلّاً
 * عن الثيم وعن بقية الأقسام.
 *
 * أربعة محاور تُركَّب فتُنتج عشرين تصميماً فريداً:
 *   سطح البطاقة · شبكة العرض · تمييز الخطة المميّزة · عرض السعر.
 * كلّها بيانات → أصناف على القسم، والأنماط معرَّفة مرّة واحدة.
 */

/** سطح بطاقة الخطة. */
export type PlanCardSurface =
  | "solid"     // بطاقة مصمتة بحدّ (الافتراضي)
  | "soft"      // بلا حدّ، ظلّ ناعم فقط
  | "glass"     // زجاجي شفّاف
  | "outline"   // حدّ فقط بلا تعبئة
  | "plaque"    // أركان مقصوصة كلوح المخطوط
  | "ticket";   // حزّان جانبيان كتذكرة

/** شبكة عرض الخطط. */
export type PlanGrid =
  | "auto"      // ثلاثة أعمدة تتكيّف مع العدد (الافتراضي)
  | "two"       // عمودان دائماً
  | "wide"      // بطاقات أعرض وأقلّ عدداً في الصفّ
  | "list";     // صفّ واحد لكل خطة

/** تمييز الخطة المميّزة. */
export type PlanFeatured =
  | "border"    // حدّ ملوّن (الافتراضي)
  | "lift"      // ترتفع فوق أخواتها
  | "glow"      // هالة ملوّنة
  | "crown"     // شريط علوي بلونها
  | "scale";    // أكبر قليلاً من البقية

/** عرض السعر. */
export type PlanPrice =
  | "big"       // رقم كبير (الافتراضي)
  | "badge"     // داخل شارة ملوّنة
  | "circle"    // داخل قرص
  | "top";      // فوق اسم الخطة لا تحته

export type PlansStyle = {
  id: string;
  name: string;
  hint: string;
  surface: PlanCardSurface;
  grid: PlanGrid;
  featured: PlanFeatured;
  price: PlanPrice;
};

function ps(
  id: string, name: string, hint: string,
  surface: PlanCardSurface, grid: PlanGrid, featured: PlanFeatured, price: PlanPrice
): PlansStyle {
  return { id, name, hint, surface, grid, featured, price };
}

export const PLANS_STYLES: PlansStyle[] = [
  ps("classic", "الكلاسيكي", "بطاقات مصمتة بحدّ ملوّن للمميّزة", "solid", "auto", "border", "big"),
  ps("classicLift", "الكلاسيكي المرتفع", "المميّزة ترتفع فوق أخواتها", "solid", "auto", "lift", "big"),
  ps("classicCrown", "الكلاسيكي المتوَّج", "شريط علوي بلون الخطة المميّزة", "solid", "auto", "crown", "big"),
  ps("softGlow", "الناعم", "بلا حدود وهالة حول المميّزة", "soft", "auto", "glow", "big"),
  ps("softBadge", "الناعم بشارة", "السعر داخل شارة ملوّنة", "soft", "auto", "border", "badge"),
  ps("softScale", "الناعم المكبَّر", "المميّزة أكبر من البقية", "soft", "auto", "scale", "big"),
  ps("glassLift", "الزجاجي", "بطاقات زجاجية والمميّزة ترتفع", "glass", "auto", "lift", "big"),
  ps("glassCircle", "الزجاجي بقرص", "السعر داخل قرص ملوّن", "glass", "auto", "glow", "circle"),
  ps("outlineBorder", "المفرَّغ", "حدّ فقط بلا تعبئة", "outline", "auto", "border", "big"),
  ps("outlineTop", "المفرَّغ العلوي", "السعر فوق اسم الخطة", "outline", "auto", "crown", "top"),
  ps("plaqueGold", "اللوح", "أركان مقصوصة كلوح المخطوط", "plaque", "auto", "border", "big"),
  ps("plaqueCrown", "اللوح المتوَّج", "لوح وشريط علوي للمميّزة", "plaque", "auto", "crown", "badge"),
  ps("ticketRow", "التذكرة", "حزّان جانبيان كتذكرة", "ticket", "auto", "border", "big"),
  ps("ticketList", "التذكرة الممتدّة", "تذكرة بصفّ واحد لكل خطة", "ticket", "list", "border", "top"),
  ps("twoBig", "العمودان", "عمودان دائماً ببطاقات أوسع", "solid", "two", "lift", "big"),
  ps("twoGlass", "العمودان الزجاجيان", "عمودان زجاجيان", "glass", "two", "scale", "circle"),
  ps("wideSoft", "العريض", "بطاقات أعرض وأقلّ في الصفّ", "soft", "wide", "glow", "big"),
  ps("wideOutline", "العريض المفرَّغ", "عريض بحدّ فقط", "outline", "wide", "lift", "badge"),
  ps("listCompare", "القائمة", "صفّ لكل خطة — أسهل للمقارنة", "solid", "list", "border", "top"),
  ps("listPlaque", "قائمة الألواح", "صفوف بألواح مقصوصة الأركان", "plaque", "list", "glow", "badge"),
];

export const DEFAULT_PLANS_STYLE = PLANS_STYLES[0].id;

export function findPlansStyle(id?: string): PlansStyle {
  return PLANS_STYLES.find((x) => x.id === id) ?? PLANS_STYLES[0];
}

export function plansClass(x: PlansStyle): string {
  return `pl-surface-${x.surface} pl-grid-${x.grid} pl-feat-${x.featured} pl-price-${x.price}`;
}

/** أصناف الشبكة — في مكان واحد فلا تتفرّق القيم بين الملفّات. */
export function plansGridClass(grid: PlanGrid, count: number): string {
  if (grid === "list") return "grid-cols-1 mx-auto max-w-3xl";
  if (grid === "two") return "sm:grid-cols-2 lg:mx-auto lg:max-w-4xl";
  if (grid === "wide") return "sm:grid-cols-2 lg:mx-auto lg:max-w-5xl";
  // auto — يتكيّف مع عدد الخطط
  return count === 1
    ? "mx-auto max-w-md"
    : count === 2
      ? "sm:grid-cols-2 lg:mx-auto lg:max-w-3xl"
      : "sm:grid-cols-2 lg:grid-cols-3";
}
