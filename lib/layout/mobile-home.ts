/**
 * تنسيقات الواجهة الرئيسية على الهاتف.
 * ------------------------------------------------------------------
 * الهاتف ليس شاشةً مصغّرة بل ترتيبٌ آخر: الإبهام يصل إلى أسفل الشاشة لا
 * أعلاها، والتمرير أرخص من الضغط، والصورة الكبيرة تُبعد الزرَّ عن اليد.
 * ولذلك تنسيقاتُه سجلٌّ مستقلّ لا اشتقاقٌ من تخطيط سطح المكتب.
 *
 * كل القواعد داخل ‎@media (max-width: 767px)‎ — فلا يمسّ هذا السجلّ
 * الشاشات الأوسع إطلاقاً.
 *
 * أربعة محاور تُركَّب فتُنتج عشرين تنسيقاً:
 *   ترتيب الهيرو · إيقاع الأقسام · دعوة ثابتة · عرض البطاقات.
 */

/** ترتيب الهيرو على الهاتف. */
export type MhHero =
  | "textFirst"   // النصّ أوّلاً ثم الصورة (الافتراضي)
  | "imageFirst"  // الصورة أوّلاً ثم النصّ
  | "behind"      // الصورة خلفية والنصّ فوقها
  | "compact"     // صورة صغيرة بجانب العنوان
  | "textOnly";   // بلا صورة — أسرع وصولاً للزرّ

/** إيقاع الأقسام. */
export type MhFlow =
  | "airy"        // فراغ مريح (الافتراضي)
  | "tight"       // مضغوط — أقسام أكثر في شاشة واحدة
  | "banded"      // خلفيات متناوبة تفصل الأقسام
  | "carded";     // كل قسم داخل بطاقة بحوافّ

/** دعوة ثابتة أسفل الشاشة — حيث يصل الإبهام. */
export type MhCta = "bar" | "float" | "none";

/** عرض البطاقات على الهاتف. */
export type MhCards =
  | "one"         // عمود واحد (الافتراضي)
  | "two"         // عمودان مضغوطان
  | "scroll";     // شريط أفقي ينجذب للبطاقة

export type MobileHome = {
  id: string;
  name: string;
  hint: string;
  hero: MhHero;
  flow: MhFlow;
  cta: MhCta;
  cards: MhCards;
};

function mh(
  id: string, name: string, hint: string,
  hero: MhHero, flow: MhFlow, cta: MhCta, cards: MhCards
): MobileHome {
  return { id, name, hint, hero, flow, cta, cards };
}

export const MOBILE_HOMES: MobileHome[] = [
  mh("classic", "الأصلي", "الترتيب كما هو بلا تغيير", "textFirst", "airy", "none", "one"),
  mh("classicBar", "الأصلي بشريط", "دعوة ثابتة أسفل الشاشة", "textFirst", "airy", "bar", "one"),
  mh("classicTight", "الأصلي المضغوط", "فراغ أقلّ وأقسام أقرب", "textFirst", "tight", "none", "one"),
  mh("imageLead", "الصورة أوّلاً", "المعلّمة قبل الكلام", "imageFirst", "airy", "bar", "one"),
  mh("imageBanded", "الصورة والأشرطة", "خلفيات متناوبة تفصل الأقسام", "imageFirst", "banded", "float", "one"),
  mh("imageScroll", "الصورة والشريط الأفقي", "بطاقات تنجذب للتمرير", "imageFirst", "airy", "none", "scroll"),
  mh("behindFloat", "الصورة خلفية", "النصّ فوق الصورة وزرّ طافٍ", "behind", "airy", "float", "one"),
  mh("behindTight", "الخلفية المضغوطة", "صورة خلفية وإيقاع مضغوط", "behind", "tight", "bar", "two"),
  mh("behindCarded", "الخلفية ببطاقات", "كل قسم داخل بطاقة", "behind", "carded", "none", "one"),
  mh("compactBar", "المضغوط", "صورة صغيرة بجانب العنوان", "compact", "tight", "bar", "one"),
  mh("compactTwo", "المضغوط بعمودين", "بطاقتان في الصفّ", "compact", "tight", "none", "two"),
  mh("compactScroll", "المضغوط الأفقي", "صورة صغيرة وبطاقات تنزلق", "compact", "airy", "float", "scroll"),
  mh("textOnlyBar", "بلا صورة", "أسرع وصولاً للزرّ", "textOnly", "airy", "bar", "one"),
  mh("textOnlyTight", "بلا صورة مضغوط", "أخفّ ما يكون", "textOnly", "tight", "bar", "one"),
  mh("textOnlyBanded", "بلا صورة بأشرطة", "خلفيات متناوبة", "textOnly", "banded", "none", "one"),
  mh("cardedFloat", "البطاقات", "أقسام داخل بطاقات وزرّ طافٍ", "textFirst", "carded", "float", "one"),
  mh("cardedTwo", "البطاقات بعمودين", "بطاقات وأعمدة مزدوجة", "textFirst", "carded", "bar", "two"),
  mh("bandedTwo", "الأشرطة بعمودين", "خلفيات متناوبة وعمودان", "textFirst", "banded", "bar", "two"),
  mh("scrollFloat", "الانزلاق", "بطاقات أفقية وزرّ طافٍ", "textFirst", "airy", "float", "scroll"),
  mh("minimal", "المبسّط", "بلا صورة ولا دعوة ثابتة ولا فراغ زائد", "textOnly", "tight", "none", "one"),
];

export const DEFAULT_MOBILE_HOME = MOBILE_HOMES[0].id;

export function findMobileHome(id?: string): MobileHome {
  return MOBILE_HOMES.find((x) => x.id === id) ?? MOBILE_HOMES[0];
}

export function mobileHomeClass(x: MobileHome): string {
  return `mh-hero-${x.hero} mh-flow-${x.flow} mh-cta-${x.cta} mh-cards-${x.cards}`;
}
