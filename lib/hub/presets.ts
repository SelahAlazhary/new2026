import type { SiteContent } from "@/lib/utils/types";

/**
 * حزمُ الهويّة — عشرون تصميماً متكاملاً يختار المدرّسُ منها هويّةَ منصّته.
 * ------------------------------------------------------------------
 * الحزمةُ ليست لوناً: هي **توليفةٌ كاملة** من مفاتيح المظهر القائمة في
 * المنصّة (ثيمُ الطالب، هيئةُ الأشكال، أسلوبُ الهيرو والخطط والأزرار
 * والحركة، تخطيطُ الرئيسية) + ثلاثةِ ألوانٍ افتراضيّة. فاختيارُ حزمةٍ
 * يغيّر شكلَ المنصّة كلَّها، لا لونَها وحدَه.
 *
 * ولا نظامَ ثيمٍ جديد يُبنى: كلُّ مفتاحٍ هنا مفتاحٌ يفهمه العرضُ أصلاً
 * (`lib/skins.ts` · `lib/designs.ts` · `*-styles.ts`)، فالحزمةُ بياناتٌ
 * لا شيفرة. والمدرّسُ يغيّر أيَّ مفتاحٍ تفصيليّ لاحقاً من لوحته إن شاء.
 */

export type BrandColors = { primary: string; gold: string; paper: string };

export type BrandPreset = {
  id: string;
  name: string;
  hint: string;
  dark: boolean;
  colors: BrandColors;
  /** مفاتيحُ المظهر التي تُكتب في `content` عند التجهيز. */
  content: Partial<SiteContent>;
};

function p(
  id: string, name: string, hint: string, dark: boolean, colors: BrandColors,
  keys: {
    skin: string; design: string; hero: string; layout: string;
    plans: string; button: string; motion: string;
  }
): BrandPreset {
  return {
    id, name, hint, dark, colors,
    content: {
      studentSkin: keys.skin,
      studentDesign: keys.design,
      heroStyle: keys.hero,
      homeLayout: keys.layout,
      plansStyle: keys.plans,
      buttonStyle: keys.button,
      motionStyle: keys.motion,
    } as Partial<SiteContent>,
  };
}

export const BRAND_PRESETS: BrandPreset[] = [
  p("midad", "المِداد الكلاسيكي", "مخطوطٌ مذهّبٌ على ورقٍ كريميّ", false,
    { primary: "#233b8b", gold: "#c99a3b", paper: "#fbf9f5" },
    { skin: "midad", design: "plaqueGold", hero: "classic", layout: "classic", plans: "classicCrown", button: "plaque", motion: "classic" }),
  p("flat", "الحديث المسطّح", "بلا زخرفة — حوافّ ناعمة ومساحات هادئة", false,
    { primary: "#2f5fd0", gold: "#5b6b86", paper: "#ffffff" },
    { skin: "rukham", design: "soft", hero: "solidSoft", layout: "center", plans: "softScale", button: "pillGhost", motion: "briskFade" }),
  p("andalus", "الأندلسي", "زيتونيٌّ وذهبٌ عتيقٌ وزخرفةُ أرابيسك", false,
    { primary: "#245c4b", gold: "#b8912f", paper: "#f6f6ec" },
    { skin: "andalus", design: "arch", hero: "classicSoft", layout: "classicAiry", plans: "classicLift", button: "plaqueGlow", motion: "calmRise" }),
  p("laylGlass", "الزجاجي الداكن", "ليلٌ عميقٌ ولمعةٌ ذهبيّة", true,
    { primary: "#3b6fb0", gold: "#d9b45a", paper: "#0d1220" },
    { skin: "laylMidad", design: "dome", hero: "solidPlaque", layout: "center", plans: "glassLift", button: "pillFoil", motion: "fadeGlow" }),
  p("paper", "الورقي الدافئ", "رملٌ ونخيلٌ ودفءٌ هادئ", false,
    { primary: "#8a5a2b", gold: "#c8912f", paper: "#f7f0e4" },
    { skin: "sahra", design: "fold", hero: "classic", layout: "stack", plans: "softBadge", button: "plaque", motion: "calmFade" }),
  p("techSharp", "التقني الحادّ", "أركانٌ حادّةٌ وإيقاعٌ رشيق", false,
    { primary: "#1f2937", gold: "#3b82f6", paper: "#f3f4f6" },
    { skin: "faham", design: "chevron", hero: "outlineFull", layout: "salesFirst", plans: "softScale", button: "pillSlide", motion: "briskRise" }),
  p("mihrab", "القبّة والمحراب", "أقواسٌ وقبابٌ معماريّة", false,
    { primary: "#1b5e6e", gold: "#c99a3b", paper: "#f4f7f6" },
    { skin: "fayrouz", design: "arch", hero: "classicWide", layout: "classic", plans: "classicCrown", button: "plaqueGlow", motion: "springLift" }),
  p("kids", "المرحلة الابتدائية", "مفصّصٌ ملوّنٌ بهيجٌ للصغار", false,
    { primary: "#7c3aed", gold: "#f59e0b", paper: "#fdf7ff" },
    { skin: "banafsaj", design: "scallop", hero: "solidSoft", layout: "centerWide", plans: "softGlow", button: "roundFoil", motion: "springScale" }),
  p("marble", "الرخامي الهادئ", "أبيضُ ورماديٌّ ناعمٌ بحدٍّ ذهبيّ", false,
    { primary: "#334155", gold: "#9c8656", paper: "#f8fafc" },
    { skin: "rukham", design: "outline", hero: "outlineText", layout: "classicAiry", plans: "glassCircle", button: "pillText", motion: "linearFade" }),
  p("neon", "الليلي النيون", "داكنٌ بلمعاتٍ للثانوي", true,
    { primary: "#22d3ee", gold: "#e879f9", paper: "#0b0f1a" },
    { skin: "bahr", design: "dome", hero: "solidPlaque", layout: "salesCompact", plans: "glassLift", button: "pillFoil", motion: "scaleGlow" }),
  p("desert", "الصحراوي", "كثبانٌ وشمسٌ دافئة", false,
    { primary: "#a15c2b", gold: "#d99a3c", paper: "#faf3e7" },
    { skin: "kahraman", design: "wave", hero: "classicSoft", layout: "stack", plans: "softBadge", button: "plaque", motion: "calmRise" }),
  p("teal", "الفيروزي البحري", "أزرقُ مخضرٌّ منعش", false,
    { primary: "#0e7490", gold: "#eab308", paper: "#f0fafb" },
    { skin: "fayrouz", design: "wave", hero: "classicWide", layout: "center", plans: "softScale", button: "pillSlide", motion: "slideSmooth" }),
  p("academic", "الأكاديمي الجامعي", "رصينٌ كحليٌّ بخطوطٍ واضحة", false,
    { primary: "#1e3a5f", gold: "#8b6f3e", paper: "#f7f8fa" },
    { skin: "midad", design: "plaque", hero: "classic", layout: "classic", plans: "classicLift", button: "plaqueGhost", motion: "classic" }),
  p("magazine", "المجلّة", "تايبوغرافي كبيرٌ ومساحاتٌ جريئة", false,
    { primary: "#b91c1c", gold: "#1f2937", paper: "#fffdf8" },
    { skin: "qirmiz", design: "bare", hero: "outlineFull", layout: "mirror", plans: "classicCrown", button: "pillText", motion: "sharpTilt" }),
  p("elevated", "البطاقات المرتفعة", "ظلالٌ ناعمةٌ وارتفاعٌ لطيف", false,
    { primary: "#4338ca", gold: "#c99a3b", paper: "#f5f5ff" },
    { skin: "banafsaj", design: "soft", hero: "solidSoft", layout: "classicAiry", plans: "softGlow", button: "roundFoil", motion: "springLift" }),
  p("ribbon", "الشرائط والمطويّات", "أطرافٌ مطويّةٌ وشرائطُ زخرفيّة", false,
    { primary: "#9d174d", gold: "#d99a3c", paper: "#fdf6f8" },
    { skin: "warda", design: "ribbon", hero: "classicSoft", layout: "center", plans: "classicLift", button: "plaqueGlow", motion: "springTilt" }),
  p("kufi", "الهندسي الكوفي", "تبليطٌ هندسيٌّ وكوفيٌّ مربّع", false,
    { primary: "#155e4c", gold: "#b8912f", paper: "#f4f6f2" },
    { skin: "zaytoon", design: "hex", hero: "classicWide", layout: "classic", plans: "classicCrown", button: "plaque", motion: "calmRise" }),
  p("chalk", "اللوح والطباشير", "لوحٌ داكنٌ وخطٌّ طباشيريّ", true,
    { primary: "#e5e7eb", gold: "#f2c14e", paper: "#14201b" },
    { skin: "faham", design: "torn", hero: "outlineText", layout: "stack", plans: "glassCircle", button: "pillGhost", motion: "linearRise" }),
  p("spring", "الربيعي الفاتح", "أخضرُ فاتحٌ ومشرقٌ ونديّ", false,
    { primary: "#16a34a", gold: "#eab308", paper: "#f4fdf6" },
    { skin: "nakhil", design: "scallop", hero: "solidSoft", layout: "centerWide", plans: "softScale", button: "pillSlide", motion: "briskFade" }),
  p("royal", "الملكي البنفسجي", "بنفسجيٌّ ملكيٌّ وذهبٌ فاخر", true,
    { primary: "#a78bfa", gold: "#fbbf24", paper: "#160f22" },
    { skin: "laylBanafsaj", design: "plaqueGold", hero: "solidPlaque", layout: "center", plans: "glassLift", button: "pillFoil", motion: "scaleGlow" }),
];

export function presetById(id?: string): BrandPreset {
  return BRAND_PRESETS.find((x) => x.id === id) ?? BRAND_PRESETS[0];
}
