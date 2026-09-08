/**
 * تصاميم زرّي الهيرو.
 * ------------------------------------------------------------------
 * «أنشئ حساب طالب» و«شاهد درساً مجانياً» هما البابان اللذان يدخل منهما
 * الزائر — وأكثرُ عنصرين يُنظر إليهما في الصفحة. فشكلُهما يستحقّ سجلّاً
 * مستقلّاً لا أن يتبع لوحَ الحبر وحده.
 *
 * ثلاثة محاور تُركَّب فتُنتج عشرين هيئة:
 *   شكل الزرّ · معالجة الزرّ الثاني · الحركة عند المرور.
 *
 * والزرّان يُصمَّمان معاً لا كلٌّ على حدة: الأوّل يقود والثاني يُساند،
 * والعلاقةُ بينهما هي التصميم — لا مظهرُ كلٍّ منهما منفرداً.
 */

/** شكل الزرّ الأوّل — وهو الذي يحدّد هيئتهما معاً. */
export type BtnShape =
  | "plaque"    // لوح المخطوط بأركان مقصوصة (الأصل)
  | "pill"      // كبسولة كاملة الاستدارة
  | "round"     // حوافّ ناعمة معتدلة
  | "square"    // حوافّ حادّة
  | "arch"      // قوسٌ من أعلى كالمحراب
  | "ticket"    // حزّان جانبيان كتذكرة
  | "slant";    // حافّة مائلة على الطرف

/** معالجة الزرّ الثاني — علاقتُه بالأوّل. */
export type BtnPair =
  | "foil"      // مذهّب بحدّ (الأصل)
  | "ghost"     // شفّاف بحدّ رفيع
  | "text"      // نصٌّ وسهم بلا إطار
  | "solid"     // مصمت بلون أهدأ
  | "outline";  // حدّ سميك بلا تعبئة

/** ما يحدث عند المرور. */
export type BtnHover =
  | "lift"      // يرتفع قليلاً
  | "glow"      // يتوهّج
  | "fill"      // يمتلئ الثاني بلون الأوّل
  | "slide"     // يزحف بريقٌ عبره
  | "none";

export type ButtonStyle = {
  id: string;
  name: string;
  hint: string;
  shape: BtnShape;
  pair: BtnPair;
  hover: BtnHover;
};

function b(
  id: string, name: string, hint: string,
  shape: BtnShape, pair: BtnPair, hover: BtnHover
): ButtonStyle {
  return { id, name, hint, shape, pair, hover };
}

export const BUTTON_STYLES: ButtonStyle[] = [
  b("plaque", "اللوح الأصلي", "أركان مقصوصة وزرٌّ مذهّب بجانبه", "plaque", "foil", "lift"),
  b("plaqueGhost", "اللوح الشفّاف", "لوح وزرٌّ ثانٍ شفّاف", "plaque", "ghost", "lift"),
  b("plaqueGlow", "اللوح المتوهّج", "لوح يتوهّج عند المرور", "plaque", "foil", "glow"),
  b("pillFoil", "الكبسولة", "استدارة كاملة وزرٌّ مذهّب", "pill", "foil", "lift"),
  b("pillGhost", "الكبسولة الشفّافة", "كبسولة وزرٌّ ثانٍ شفّاف", "pill", "ghost", "fill"),
  b("pillText", "الكبسولة والنصّ", "الثاني نصٌّ وسهم بلا إطار", "pill", "text", "slide"),
  b("pillSlide", "الكبسولة اللامعة", "بريقٌ يزحف عبر الزرّ", "pill", "outline", "slide"),
  b("roundFoil", "الناعم", "حوافّ معتدلة وزرٌّ مذهّب", "round", "foil", "lift"),
  b("roundOutline", "الناعم المفرَّغ", "حدّ سميك بلا تعبئة", "round", "outline", "fill"),
  b("roundText", "الناعم والنصّ", "الثاني نصٌّ وحده", "round", "text", "none"),
  b("squareSolid", "الحادّ", "حوافّ حادّة وزرٌّ مصمت", "square", "solid", "lift"),
  b("squareOutline", "الحادّ المفرَّغ", "حادّ بحدّ سميك", "square", "outline", "slide"),
  b("squareGlow", "الحادّ المتوهّج", "حادّ يتوهّج", "square", "ghost", "glow"),
  b("archFoil", "القوس", "قوسٌ من أعلى كالمحراب", "arch", "foil", "lift"),
  b("archGhost", "القوس الشفّاف", "قوس وزرٌّ شفّاف", "arch", "ghost", "glow"),
  b("ticketFoil", "التذكرة", "حزّان جانبيان كتذكرة", "ticket", "foil", "lift"),
  b("ticketSolid", "التذكرة المصمتة", "تذكرة وزرٌّ مصمت", "ticket", "solid", "fill"),
  b("slantFoil", "المائل", "حافّة مائلة تكسر الاستقامة", "slant", "foil", "slide"),
  b("slantOutline", "المائل المفرَّغ", "مائل بحدّ سميك", "slant", "outline", "lift"),
  b("minimal", "المبسّط", "كبسولة ونصّ — أخفّ ما يكون", "pill", "text", "none"),
];

export const DEFAULT_BUTTON_STYLE = BUTTON_STYLES[0].id;

export function findButtonStyle(id?: string): ButtonStyle {
  return BUTTON_STYLES.find((x) => x.id === id) ?? BUTTON_STYLES[0];
}

export function buttonClass(x: ButtonStyle): string {
  return `bt-shape-${x.shape} bt-pair-${x.pair} bt-hover-${x.hover}`;
}
