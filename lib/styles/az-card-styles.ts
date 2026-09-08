/**
 * تصاميمُ بطاقةِ المؤشّر.
 * ------------------------------------------------------------------
 * مستقلّةٌ عن تصميم اللوح: اللوحُ أرضٌ وزخرفةٌ وحافّة، والبطاقةُ **ترتيبُ
 * ما بداخلها**. وفصلُهما يجعل الاثنين يتركّبان — عشرون بطاقةً في اثنين
 * وعشرين لوحاً تُعطي أربعمئةٍ وأربعين هيئة، ولو جُمعا في قائمةٍ واحدةٍ
 * لكانت اثنتين وعشرين لا أكثر.
 *
 * وتفترق في أربعة أشياء:
 *
 *   • **الترتيب**: عمودٌ · صفٌّ · وسطٌ · مشطورٌ · سطرٌ واحد.
 *   • **الزينة**: لا شيءَ · شريطٌ جانبيٌّ · شريطٌ علويٌّ · أيقونةٌ شبحيّةٌ
 *     في الخلفيّة · تدرّجٌ · حدٌّ سميكٌ · خطٌّ سفليّ.
 *   • **حجمُ الرقم** نسبةً إلى المقاس المضبوط — فيبقى ضبطُ الأستاذ
 *     مسموعاً ويتبدّل معه التصميم.
 *   • **شريطُ النسبة**: ظاهرٌ أم لا.
 */

export type AzCardLayout = "stack" | "row" | "center" | "split" | "line";
export type AzCardDeco =
  | "none" | "sideBar" | "topBar" | "ghost" | "gradient" | "thick" | "underline";

export type AzCardStyle = {
  id: string;
  name: string;
  hint: string;
  layout: AzCardLayout;
  deco: AzCardDeco;
  /** مضاعِفُ حجم الرقم — يُضرب في المقاس المضبوط لا يُبدله. */
  scale: number;
  /** شريطُ النسبة أسفلَ الرقم. */
  bar: boolean;
  /** إظهارُ الأيقونة. */
  icon: boolean;
};

const C = (
  id: string, name: string, hint: string,
  layout: AzCardLayout, deco: AzCardDeco, scale: number, bar: boolean, icon: boolean
): AzCardStyle => ({ id, name, hint, layout, deco, scale, bar, icon });

export const AZ_CARD_STYLES: AzCardStyle[] = [
  C("stack",     "العمود",           "أيقونةٌ فعنوانٌ فرقمٌ فشريط",       "stack",  "none",      1,    true,  true),
  C("stackBare", "العمود المجرَّد",   "بلا شريطٍ ولا زينة",               "stack",  "none",      1,    false, true),
  C("row",       "الصفّ",            "أيقونةٌ جانبيّةٌ ونصٌّ بجوارها",     "row",    "none",      0.85, true,  true),
  C("rowBare",   "الصفّ المجرَّد",    "صفٌّ بلا شريط",                    "row",    "none",      0.85, false, true),
  C("center",    "الوسط",            "كلُّ شيءٍ في المنتصف",              "center", "none",      1,    true,  true),
  C("centerBig", "الوسط الضخم",      "رقمٌ عملاقٌ في المنتصف",           "center", "none",      1.5,  false, false),
  C("split",     "المشطور",          "الرقمُ جهةٌ والعنوانُ جهة",         "split",  "none",      1.1,  true,  true),
  C("line",      "السطر",            "سطرٌ واحدٌ مضغوط",                 "line",   "none",      0.7,  false, true),
  C("sideBar",   "الشريط الجانبيّ",   "خطٌّ ملوَّنٌ على الحافّة",           "stack",  "sideBar",   1,    true,  true),
  C("topBar",    "الشريط العلويّ",    "خطٌّ ملوَّنٌ فوق البطاقة",           "stack",  "topBar",    1,    true,  true),
  C("underline", "الخطّ السفليّ",     "خطٌّ تحت البطاقة بلا حدود",        "stack",  "underline", 1,    false, true),
  C("ghost",     "الأيقونة الشبحيّة", "أيقونةٌ كبيرةٌ باهتةٌ في الخلفيّة",  "stack",  "ghost",     1.1,  true,  false),
  C("ghostRow",  "الشبحيّ الصفّيّ",   "شبحٌ في الخلفيّة ونصٌّ في صفّ",      "row",    "ghost",     0.9,  false, false),
  C("gradient",  "المتدرّج",          "تدرّجٌ خفيفٌ في أرض البطاقة",       "stack",  "gradient",  1,    true,  true),
  C("gradRow",   "المتدرّج الصفّيّ",  "تدرّجٌ وترتيبٌ في صفّ",             "row",    "gradient",  0.85, false, true),
  C("thick",     "الحدّ السميك",      "حدٌّ عريضٌ يفصل بوضوح",             "stack",  "thick",     1,    true,  true),
  C("thickBig",  "السميك الضخم",     "حدٌّ عريضٌ ورقمٌ كبير",             "stack",  "thick",     1.35, false, true),
  C("barOnly",   "الشريط وحدَه",      "عنوانٌ وشريطٌ بلا رقمٍ كبير",       "line",   "sideBar",   0.6,  true,  true),
  C("numFirst",  "الرقم أوّلاً",      "الرقمُ فوق والعنوانُ تحته",         "stack",  "none",      1.2,  false, false),
  C("plate",     "اللوحة",           "وسطٌ متدرّجٌ وحدٌّ سميك",           "center", "gradient",  1.25, true,  true),
];

export const DEFAULT_AZ_CARD = AZ_CARD_STYLES[0].id;

export function findAzCard(id?: string): AzCardStyle {
  return AZ_CARD_STYLES.find((x) => x.id === id) ?? AZ_CARD_STYLES[0];
}
