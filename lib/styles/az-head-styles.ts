/**
 * تصاميمُ لوح ترحيب الطالب.
 * ------------------------------------------------------------------
 * عشرون تصميماً تفترق في **أربعة محاور** لا في اللون وحده — ولو افترقت
 * في اللون فقط لكانت لوناً واحداً بعشرين اسمٍ:
 *
 *   • **الأرض**: مصمتةٌ · متدرّجةٌ · زجاجيّةٌ · مفرَّغةٌ · فاتحة.
 *   • **الزخرفة**: ظاهرةٌ · خافتةٌ · غائبة.
 *   • **البطاقة**: طافيةٌ نصفَ طفوٍ · داخلَ اللوح · شريطٌ ملتصق.
 *   • **الحافّة**: حادّةٌ · معتدلةٌ · دائريّة.
 *
 * **ولا لونَ مكتوبٌ في التصميم إلّا ما يميّزه.** الأصلُ من متغيّرات
 * العلامة، فمن بدّل هويّةَ منصّته تبدّلت التصاميمُ كلُّها معه. وما اختار
 * لوناً بعينه (الزمرّديُّ والنحاسيُّ) فذاك تعريفُه لا زينة.
 *
 * والألوانُ الثلاثةُ في `AzHeadOptions` تسبق التصميمَ: من ضبط لوناً أراده
 * هو، والتصميمُ يبقى بنيةً وحافّةً وزخرفة.
 */

export type AzPanel = "solid" | "gradient" | "glass" | "outline" | "paper";
export type AzCards = "float" | "inside" | "strip";
export type AzOrn = "on" | "faint" | "off";

export type AzHeadStyle = {
  id: string;
  name: string;
  hint: string;
  panel: AzPanel;
  cards: AzCards;
  orn: AzOrn;
  /** انحناءُ الحافّة بالبكسل — يُغلب بضبط الأستاذ إن ضبطه. */
  radius: number;
  /** لونُ الأرض حين يميّز التصميمَ؛ وإلّا فالكحليُّ الأصل. */
  panelColor?: string;
  /** لونُ التمييز حين يميّز التصميم؛ وإلّا فالذهبيُّ. */
  accent?: string;
  /** حبرٌ فاتحٌ أم داكن — يتبع الأرضَ لا الاختيار. */
  ink: "light" | "dark";
  /** لونُ الحافّة حين يميّز التصميمَ؛ وإلّا فمن لون التمييز. */
  edge?: string;
  /** ظلٌّ تحت البطاقات. */
  shadow: "none" | "soft" | "deep" | "glow";
  /** حشوُ اللوح. */
  pad: "tight" | "normal" | "airy";
};

const S = (
  id: string, name: string, hint: string,
  panel: AzPanel, cards: AzCards, orn: AzOrn, radius: number,
  ink: AzHeadStyle["ink"], shadow: AzHeadStyle["shadow"], pad: AzHeadStyle["pad"],
  panelColor?: string, accent?: string, edge?: string
): AzHeadStyle => ({ id, name, hint, panel, cards, orn, radius, ink, shadow, pad, panelColor, accent, edge });

export const AZ_HEAD_STYLES: AzHeadStyle[] = [
  S("azhari",    "الأزهري",          "كحليٌّ وزخرفةٌ ذهبيّةٌ ظاهرة",      "solid",    "float",  "on",    28, "light", "deep",  "normal"),
  S("night",     "ليلٌ صافٍ",         "كحليٌّ بلا زخرفة — النصُّ وحدَه",   "solid",    "float",  "off",   28, "light", "deep",  "normal"),
  S("royal",     "ملكيّ",            "تدرّجٌ كحليٌّ إلى بنفسجيّ",         "gradient", "float",  "faint", 28, "light", "deep",  "normal", "linear-gradient(135deg,hsl(232 46% 16%),hsl(258 42% 22%))"),
  S("gold",      "ذهبيٌّ فاخر",       "أرضٌ داكنةٌ وذهبٌ قويّ",           "solid",    "float",  "on",    28, "light", "glow",  "normal", "hsl(220 45% 10%)"),
  S("glass",     "زجاجيّ",           "أرضٌ شفّافةٌ وضبابٌ خلفها",        "glass",    "float",  "faint", 30, "light", "soft",  "normal"),
  S("paper",     "ورقيّ",            "أرضٌ فاتحةٌ وحبرٌ داكن",           "paper",    "float",  "faint", 26, "dark",  "soft",  "normal"),
  S("inverted",  "مقلوب",            "لوحٌ فاتحٌ وبطاقاتٌ داكنة",        "paper",    "inside", "off",   26, "dark",  "soft",  "normal"),
  S("sharp",     "حادّ",             "حوافُّ مستقيمةٌ بلا انحناء",       "solid",    "float",  "on",     4, "light", "deep",  "normal"),
  S("round",     "دائريّ",           "انحناءٌ واسعٌ في كلّ شيء",         "solid",    "float",  "on",    40, "light", "deep",  "normal"),
  S("outline",   "مفرَّغ",            "حدٌّ بلا أرض — أخفُّ ما يكون",     "outline",  "float",  "faint", 28, "dark",  "none",  "normal"),
  S("glow",      "متوهّج",           "هالةٌ ذهبيّةٌ تحت البطاقات",       "solid",    "float",  "on",    28, "light", "glow",  "normal"),
  S("flat",      "مسطّح",            "بلا ظلٍّ ولا عمق",                "solid",    "float",  "off",   20, "light", "none",  "normal"),
  S("tight",     "مضغوط",           "حشوٌ ضيّقٌ يُري أكثرَ في الشاشة",   "solid",    "inside", "faint", 22, "light", "soft",  "tight"),
  S("airy",      "فسيح",             "حشوٌ واسعٌ وراحةٌ للعين",          "solid",    "float",  "faint", 32, "light", "deep",  "airy"),
  S("strip",     "شريطيّ",           "البطاقاتُ شريطٌ ملتصقٌ بالقاع",    "solid",    "strip",  "on",    28, "light", "none",  "normal"),
  S("embedded",  "مُدمَج",            "البطاقاتُ داخلَ اللوح لا تطفو",    "solid",    "inside", "on",    28, "light", "none",  "normal"),
  S("emerald",   "زمرّديّ",          "أخضرُ عميقٌ وتمييزٌ فاتح",         "gradient", "float",  "faint", 28, "light", "deep",  "normal", "linear-gradient(135deg,hsl(168 55% 12%),hsl(190 50% 16%))", "hsl(158 64% 62%)"),
  S("copper",    "نحاسيّ",           "بنّيٌّ دافئٌ ونحاسٌ لامع",          "gradient", "float",  "on",    28, "light", "deep",  "normal", "linear-gradient(135deg,hsl(20 40% 14%),hsl(30 38% 20%))", "hsl(28 78% 62%)"),
  S("ink",       "حبريّ",            "أسودُ قريبٌ وتمييزٌ هادئ",         "solid",    "float",  "faint", 24, "light", "soft",  "normal", "hsl(220 22% 9%)"),
  /*
    الزجاجيُّ بحافّةٍ سوداء: الأرضُ شفّافةٌ فلا حدَّ لها إلّا الحافّة —
    والسوداءُ تُثبّتها على أيّ خلفيّةٍ تحتها، فاتحةً كانت أو داكنة.
    وهو أثرٌ لا يُنال بلونٍ من الهويّة: الهويّةُ تُبدَّل والسوادُ لا يُبدَّل.
  */
  S("glassInk",  "زجاجيٌّ بحافّةٍ سوداء", "شفّافٌ وحدٌّ أسودُ حادّ",  "glass",    "float",  "faint", 24, "light", "soft",  "normal", undefined, undefined, "hsl(220 25% 6%)"),
  S("glassNight","زجاجيٌّ ليليّ",         "شفّافٌ وحدٌّ أسودُ وزخرفة",  "glass",    "inside", "on",    30, "light", "deep",  "airy",   undefined, undefined, "hsl(0 0% 0%)"),

  S("dawn",      "فجريّ",            "تدرّجٌ فاتحٌ وحبرٌ داكن",           "gradient", "float",  "off",   30, "dark",  "soft",  "airy",   "linear-gradient(135deg,hsl(38 60% 94%),hsl(210 45% 92%))"),
];

export const DEFAULT_AZ_HEAD = AZ_HEAD_STYLES[0].id;

export function findAzHead(id?: string): AzHeadStyle {
  return AZ_HEAD_STYLES.find((x) => x.id === id) ?? AZ_HEAD_STYLES[0];
}

/** حشوُ اللوح بالبكسل — قيمتان: أعلى وأسفل. */
export function azPad(p: AzHeadStyle["pad"]): { top: number; lift: number } {
  if (p === "tight") return { top: 24, lift: 48 };
  if (p === "airy") return { top: 48, lift: 76 };
  return { top: 36, lift: 64 };
}

/** ظلُّ البطاقة. */
export function azShadow(s: AzHeadStyle["shadow"], accent: string): string {
  if (s === "none") return "none";
  if (s === "soft") return "0 10px 26px -18px rgba(16,24,40,.45)";
  if (s === "glow") return `0 18px 40px -22px ${accent}`;
  return "0 22px 46px -24px rgba(0,0,0,.85)";
}
