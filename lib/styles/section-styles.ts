/**
 * تصاميم أقسام البطاقات في الصفحة الرئيسية.
 * ------------------------------------------------------------------
 * ثلاثة أقسام تشترك في بنية واحدة — عنوانٌ ثم شبكةُ بطاقات: المراحل،
 * المزايا، الشهادات. فسجلٌّ واحد يخدمها، ولكلٍّ اختيارُه المستقلّ
 * المحفوظ بمفتاحه، فلا يُجبَر قسمٌ على شكل جاره.
 *
 * أربعة محاور تُركَّب فتُنتج عشرين هيئة فريدة:
 *   سطح البطاقة · شبكة العرض · معالجة العنوان · زخرفة الحافّة.
 *
 * الأقسامُ الأخرى (الأسئلة · الدعوة · الفوتر) بنيتُها مختلفة تماماً،
 * فلها سجلّاتها — إقحامُها هنا كان سيُنتج خياراتٍ لا معنى لها فيها.
 */

/** سطح بطاقة القسم. */
export type SxCard =
  /**
   * هوية المنصّة كما هي — زجاج وحلقة ذهب وظلّ بينتو.
   * هذا هو الافتراضي: التصميم الافتراضي لا يجوز أن يُغيّر شكل الموقع
   * بمجرّد إضافة نظام التصاميم، وإلا فُوجئ صاحبُ المنصّة بشكلٍ أفقر
   * لم يطلبه.
   */
  | "brand"
  | "solid"     // مصمتة بحدّ
  | "glass"     // زجاجية مضبّبة
  | "outline"   // حدّ فقط بلا تعبئة
  | "soft"      // بلا حدّ، ظلّ ناعم
  | "plaque"    // أركان مقصوصة كلوح المخطوط
  | "ticket"    // حزّان جانبيان كتذكرة
  | "tint";     // غلالة من لون الهوية

/** شبكة عرض البطاقات. */
export type SxGrid =
  | "auto"      // تتكيّف مع العدد (الافتراضي)
  | "two"       // عمودان دائماً
  | "three"     // ثلاثة أعمدة دائماً
  | "list"      // صفّ لكل بطاقة
  | "stagger"   // شبكة متعرّجة: الزوجيّة تنزل قليلاً
  | "wide";     // بطاقات أعرض وأقلّ في الصفّ

/** معالجة عنوان القسم. */
export type SxHead =
  | "center"    // متمركز (الافتراضي)
  | "start"     // إلى يمين الصفحة
  | "split"     // العنوان يمين والنبذة يسار
  | "rule"      // خطّ مذهّب يحيط بالعنوان
  | "badge";    // شارة فوق العنوان

/** زخرفة حافّة البطاقة. */
export type SxEdge =
  | "corner"    // عقدة في الركن (الافتراضي)
  | "top"       // شريط علوي ملوّن
  | "side"      // شريط جانبي ملوّن
  | "glow"      // هالة خفيفة عند المرور
  | "none";     // بلا زخرفة

export type SectionStyle = {
  id: string;
  name: string;
  hint: string;
  card: SxCard;
  grid: SxGrid;
  head: SxHead;
  edge: SxEdge;
};

function sx(
  id: string, name: string, hint: string,
  card: SxCard, grid: SxGrid, head: SxHead, edge: SxEdge
): SectionStyle {
  return { id, name, hint, card, grid, head, edge };
}

export const SECTION_STYLES: SectionStyle[] = [
  sx("classic", "الأصلي", "هوية المنصّة كما هي — زجاج وذهب وظلّ", "brand", "auto", "center", "corner"),
  sx("classicTop", "الكلاسيكي المتوَّج", "شريط علوي ملوّن على كل بطاقة", "solid", "auto", "center", "top"),
  sx("classicStart", "الكلاسيكي المحاذي", "العنوان إلى يمين الصفحة", "solid", "auto", "start", "corner"),
  sx("glassGlow", "الزجاجي", "زجاج مضبّب وهالة عند المرور", "glass", "auto", "center", "glow"),
  sx("glassSplit", "الزجاجي المنقسم", "العنوان يمين والنبذة يسار", "glass", "three", "split", "side"),
  sx("glassStagger", "الزجاجي المتعرّج", "شبكة تتعرّج فتكسر الصفوف", "glass", "stagger", "center", "none"),
  sx("outlineRule", "المفرَّغ", "حدّ فقط وخطّ مذهّب حول العنوان", "outline", "auto", "rule", "corner"),
  sx("outlineList", "المفرَّغ الممتدّ", "صفّ لكل بطاقة بحدّ", "outline", "list", "start", "side"),
  sx("outlineWide", "المفرَّغ العريض", "بطاقات أعرض بحدّ", "outline", "wide", "center", "top"),
  sx("softGlow", "الناعم", "بلا حدود وظلّ خفيف", "soft", "auto", "center", "glow"),
  sx("softBadge", "الناعم بشارة", "شارة فوق العنوان", "soft", "three", "badge", "none"),
  sx("softStagger", "الناعم المتعرّج", "ناعم بشبكة متعرّجة", "soft", "stagger", "start", "glow"),
  sx("plaqueGold", "اللوح", "أركان مقصوصة كلوح المخطوط", "plaque", "auto", "rule", "corner"),
  sx("plaqueTwo", "اللوح المزدوج", "عمودان بألواح مقصوصة", "plaque", "two", "center", "top"),
  sx("plaqueList", "قائمة الألواح", "صفوف بألواح مقصوصة", "plaque", "list", "split", "side"),
  sx("ticketRow", "التذكرة", "حزّان جانبيان كتذكرة", "ticket", "auto", "center", "none"),
  sx("ticketWide", "التذكرة العريضة", "تذاكر أعرض وأقلّ في الصفّ", "ticket", "wide", "badge", "top"),
  sx("tintCorner", "المُغلَّل", "غلالة من لون الهوية", "tint", "auto", "center", "corner"),
  sx("tintThree", "المُغلَّل الثلاثي", "ثلاثة أعمدة مُغلَّلة", "tint", "three", "rule", "glow"),
  sx("minimal", "المبسّط", "بلا حدّ ولا زخرفة — أخفّ ما يكون", "soft", "auto", "start", "none"),
];

export const DEFAULT_SECTION_STYLE = SECTION_STYLES[0].id;

export function findSectionStyle(id?: string): SectionStyle {
  return SECTION_STYLES.find((x) => x.id === id) ?? SECTION_STYLES[0];
}

export function sectionClass(x: SectionStyle): string {
  return `sx-card-${x.card} sx-grid-${x.grid} sx-head-${x.head} sx-edge-${x.edge}`;
}

/**
 * أصناف الشبكة — في مكان واحد فلا تتفرّق القيم بين الملفّات.
 * `stagger` شبكةٌ عادية والتعرّج يأتي من CSS، فلا يحتاج صنفاً خاصاً هنا.
 */
export function sxGridClass(grid: SxGrid, count: number): string {
  switch (grid) {
    case "two": return "sm:grid-cols-2";
    /* ثلاثةٌ من أوّل نقطة توقّف — لا مرحلةَ عمودين قبلها، وإلا صار
       نسخةً حرفية من «المتكيّفة» فبدا التصميمان واحداً. */
    case "three": return "sm:grid-cols-3";
    case "list": return "grid-cols-1";
    case "wide": return "sm:grid-cols-2 lg:mx-auto lg:max-w-5xl";
    /* المتعرّجة تحتاج عمودين ليظهر التعرّج — بثلاثة يختفي الإيقاع. */
    case "stagger": return "sm:grid-cols-2";
    default:
      return count <= 2 ? "sm:grid-cols-2" : "sm:grid-cols-2 lg:grid-cols-3";
  }
}

/** الأقسام التي يخدمها هذا السجلّ — مفاتيحها في المحتوى وأسماؤها. */
export const SX_SECTIONS = [
  { key: "stagesStyle", label: "قسم المراحل" },
  { key: "featuresStyle", label: "قسم المزايا" },
  { key: "testimonialsStyle", label: "قسم الشهادات" },
] as const;

export type SxSectionKey = (typeof SX_SECTIONS)[number]["key"];
