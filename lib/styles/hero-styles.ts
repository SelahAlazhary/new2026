/**
 * تصاميم قسم الهيرو.
 * ------------------------------------------------------------------
 * تخطيط الصفحة يحدّد **موضع** الهيرو (منقسم · معكوس · متمركز · متراكب ·
 * مضغوط)، وهذا السجلّ يحدّد **هيئته**: معالجة العنوان، وشكل الشارة،
 * وكثافة الزخرفة، وترتيب الأزرار. المحوران مستقلّان فلا يتكرّر أحدهما
 * في الآخر — وهو ما يجعل عدد التركيبات حقيقياً لا وهمياً.
 */

/** معالجة العنوان الرئيسي. */
export type HeroTitle =
  | "gradient"   // تدرّج من الحبر إلى الذهب (الافتراضي)
  | "solid"      // لون واحد
  | "outline"    // مفرَّغ بحدّ
  | "underline"  // خطّ مذهّب تحته
  | "mark";      // مساحة ملوّنة خلف الاسم كالتظليل

/** شكل شارة الحالة أعلى العنوان. */
export type HeroPill = "capsule" | "plaque" | "dot" | "none";

/** كثافة الطبقات الزخرفية خلف القسم. */
export type HeroDecor =
  | "full"    // كوفي + تشكيل + شمسة + حرف الضاد
  | "soft"    // كوفي خافت فقط
  | "text"    // خلفية الحروف العربية وحدها
  | "none";   // بلا زخرفة

/** ترتيب الأزرار. */
export type HeroButtons = "row" | "stack" | "wide";

export type HeroStyle = {
  id: string;
  name: string;
  hint: string;
  title: HeroTitle;
  pill: HeroPill;
  decor: HeroDecor;
  buttons: HeroButtons;
};

function h(
  id: string, name: string, hint: string,
  title: HeroTitle, pill: HeroPill, decor: HeroDecor, buttons: HeroButtons
): HeroStyle {
  return { id, name, hint, title, pill, decor, buttons };
}

export const HERO_STYLES: HeroStyle[] = [
  h("classic", "الكلاسيكي", "عنوان متدرّج وشارة كبسولة وزخرفة كاملة", "gradient", "capsule", "full", "row"),
  h("classicSoft", "الكلاسيكي الهادئ", "زخرفة أخفّ وعنوان متدرّج", "gradient", "capsule", "soft", "row"),
  h("classicWide", "الكلاسيكي العريض", "أزرار بعرض العمود", "gradient", "capsule", "full", "wide"),
  h("solidPlaque", "اللوح", "شارة بأركان مقصوصة وعنوان بلون واحد", "solid", "plaque", "full", "row"),
  h("solidSoft", "الصريح", "عنوان بلون واحد وزخرفة خفيفة", "solid", "capsule", "soft", "row"),
  h("solidBare", "الصريح المجرّد", "بلا زخرفة إطلاقاً", "solid", "none", "none", "row"),
  h("outlineFull", "المفرَّغ", "عنوان مفرَّغ بحدّ", "outline", "capsule", "full", "row"),
  h("outlineText", "المفرَّغ الحروفي", "مفرَّغ وخلفية حروف عربية", "outline", "dot", "text", "row"),
  h("underlineFull", "المسطَّر", "خطّ مذهّب تحت العنوان", "underline", "capsule", "full", "row"),
  h("underlinePlaque", "المسطَّر باللوح", "خطّ تحت العنوان وشارة لوح", "underline", "plaque", "soft", "stack"),
  h("markFull", "المظلَّل", "مساحة ملوّنة خلف اسم المعلّمة", "mark", "capsule", "full", "row"),
  h("markSoft", "المظلَّل الهادئ", "تظليل وزخرفة خفيفة", "mark", "dot", "soft", "row"),
  h("markWide", "المظلَّل العريض", "تظليل وأزرار عريضة", "mark", "capsule", "text", "wide"),
  h("dotText", "النقطة", "شارة نقطة صغيرة وخلفية حروف", "gradient", "dot", "text", "row"),
  h("dotBare", "النقطة المجرّدة", "نقطة بلا زخرفة", "gradient", "dot", "none", "stack"),
  h("plaqueText", "اللوح الحروفي", "شارة لوح وخلفية حروف", "gradient", "plaque", "text", "row"),
  h("stackFull", "المتراكب", "أزرار فوق بعضها وزخرفة كاملة", "gradient", "capsule", "full", "stack"),
  h("noPillSoft", "بلا شارة", "يبدأ بالعنوان مباشرة", "gradient", "none", "soft", "row"),
  h("noPillWide", "بلا شارة عريض", "بلا شارة وأزرار عريضة", "solid", "none", "text", "wide"),
  h("minimal", "المبسّط", "عنوان صريح بلا شارة ولا زخرفة ولا تدرّج", "solid", "none", "none", "stack"),
];

export const DEFAULT_HERO_STYLE = HERO_STYLES[0].id;

export function findHeroStyle(id?: string): HeroStyle {
  return HERO_STYLES.find((x) => x.id === id) ?? HERO_STYLES[0];
}

export function heroClass(x: HeroStyle): string {
  return `hs-title-${x.title} hs-pill-${x.pill} hs-decor-${x.decor} hs-btn-${x.buttons}`;
}
