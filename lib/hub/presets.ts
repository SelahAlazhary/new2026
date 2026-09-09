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

export type SubjectCategory = "stem" | "arabic" | "english" | "humanities" | "tech" | "religious" | "arts" | "general";
export type StageCategory = "primary" | "middle" | "secondary" | "university" | "professional";
export type PersonalityCategory = "academic" | "modern" | "energetic" | "calm";

export type BrandPreset = {
  id: string;
  name: string;
  hint: string;
  dark: boolean;
  colors: BrandColors;
  content: Partial<SiteContent>;
  subjects: SubjectCategory[];
  stages: StageCategory[];
  personality: PersonalityCategory;
};

export type IdentityAnswers = {
  subject: SubjectCategory;
  stage: StageCategory;
  personality: PersonalityCategory;
  preferDark: boolean;
};

function p(
  id: string, name: string, hint: string, dark: boolean, colors: BrandColors,
  keys: { skin: string; design: string; hero: string; layout: string; plans: string; button: string; motion: string },
  meta: { subjects: SubjectCategory[]; stages: StageCategory[]; personality: PersonalityCategory },
): BrandPreset {
  return {
    id, name, hint, dark, colors,
    content: {
      studentSkin: keys.skin, studentDesign: keys.design, heroStyle: keys.hero,
      homeLayout: keys.layout, plansStyle: keys.plans, buttonStyle: keys.button, motionStyle: keys.motion,
    } as Partial<SiteContent>,
    subjects: meta.subjects, stages: meta.stages, personality: meta.personality,
  };
}

export const BRAND_PRESETS: BrandPreset[] = [
  p("midad", "المِداد الكلاسيكي", "مخطوطٌ مذهّبٌ على ورقٍ كريميّ — للمعلّم الذي يثق بالأصالة", false,
    { primary: "#233b8b", gold: "#c99a3b", paper: "#fbf9f5" },
    { skin: "midad", design: "plaqueGold", hero: "classic", layout: "classic", plans: "classicCrown", button: "plaque", motion: "classic" },
    { subjects: ["arabic", "religious", "humanities"], stages: ["secondary", "university"], personality: "academic" }),

  p("flat", "الحديث المسطّح", "حوافّ ناعمة ومساحات هادئة — بساطةٌ عصريّةٌ بلا زخرفة", false,
    { primary: "#2f5fd0", gold: "#5b6b86", paper: "#ffffff" },
    { skin: "rukham", design: "soft", hero: "solidSoft", layout: "center", plans: "softScale", button: "pillGhost", motion: "briskFade" },
    { subjects: ["stem", "tech", "english", "general"], stages: ["secondary", "university", "professional"], personality: "modern" }),

  p("andalus", "الأندلسي", "زيتونيٌّ وذهبٌ عتيقٌ — رائحةُ الأندلس في كلّ زاوية", false,
    { primary: "#245c4b", gold: "#b8912f", paper: "#f6f6ec" },
    { skin: "andalus", design: "arch", hero: "classicSoft", layout: "classicAiry", plans: "classicLift", button: "plaqueGlow", motion: "calmRise" },
    { subjects: ["arabic", "religious", "humanities"], stages: ["middle", "secondary"], personality: "calm" }),

  p("laylGlass", "الزجاجي الداكن", "ليلٌ عميقٌ ولمعةٌ ذهبيّة — أناقةٌ تقنيّة", true,
    { primary: "#3b6fb0", gold: "#d9b45a", paper: "#0d1220" },
    { skin: "laylMidad", design: "dome", hero: "solidPlaque", layout: "center", plans: "glassLift", button: "pillFoil", motion: "fadeGlow" },
    { subjects: ["stem", "tech", "english"], stages: ["secondary", "university", "professional"], personality: "modern" }),

  p("paper", "الورقي الدافئ", "رملٌ ونخيلٌ ودفءٌ — كأنّك تقرأ على ضوء شمعة", false,
    { primary: "#8a5a2b", gold: "#c8912f", paper: "#f7f0e4" },
    { skin: "sahra", design: "fold", hero: "classic", layout: "stack", plans: "softBadge", button: "plaque", motion: "calmFade" },
    { subjects: ["arabic", "humanities", "religious", "general"], stages: ["middle", "secondary"], personality: "calm" }),

  p("techSharp", "التقني الحادّ", "أركانٌ حادّةٌ وإيقاعٌ رشيق — لمن يعلّم بالكود والمنطق", false,
    { primary: "#1f2937", gold: "#3b82f6", paper: "#f3f4f6" },
    { skin: "faham", design: "chevron", hero: "outlineFull", layout: "salesFirst", plans: "softScale", button: "pillSlide", motion: "briskRise" },
    { subjects: ["tech", "stem"], stages: ["secondary", "university", "professional"], personality: "modern" }),

  p("mihrab", "القبّة والمحراب", "أقواسٌ وقبابٌ — عمارةٌ إسلاميّةٌ تُلهم الطالب", false,
    { primary: "#1b5e6e", gold: "#c99a3b", paper: "#f4f7f6" },
    { skin: "fayrouz", design: "arch", hero: "classicWide", layout: "classic", plans: "classicCrown", button: "plaqueGlow", motion: "springLift" },
    { subjects: ["religious", "arabic", "humanities"], stages: ["middle", "secondary", "university"], personality: "academic" }),

  p("kids", "المرحلة الابتدائية", "ألوانٌ مبهجةٌ وأشكالٌ مفصّصة — عالمٌ ملوّنٌ للصغار", false,
    { primary: "#7c3aed", gold: "#f59e0b", paper: "#fdf7ff" },
    { skin: "banafsaj", design: "scallop", hero: "solidSoft", layout: "centerWide", plans: "softGlow", button: "roundFoil", motion: "springScale" },
    { subjects: ["general", "arts", "arabic", "english"], stages: ["primary"], personality: "energetic" }),

  p("marble", "الرخامي الهادئ", "أبيضُ ورماديٌّ ناعمٌ — هدوءٌ يليق بالجامعات", false,
    { primary: "#334155", gold: "#9c8656", paper: "#f8fafc" },
    { skin: "rukham", design: "outline", hero: "outlineText", layout: "classicAiry", plans: "glassCircle", button: "pillText", motion: "linearFade" },
    { subjects: ["general", "humanities", "stem"], stages: ["university", "professional"], personality: "calm" }),

  p("neon", "الليلي النيون", "داكنٌ بلمعاتٍ كهربائيّة — للطالب الذي يسهر يدرس", true,
    { primary: "#22d3ee", gold: "#e879f9", paper: "#0b0f1a" },
    { skin: "bahr", design: "dome", hero: "solidPlaque", layout: "salesCompact", plans: "glassLift", button: "pillFoil", motion: "scaleGlow" },
    { subjects: ["tech", "stem", "english"], stages: ["secondary", "university"], personality: "energetic" }),

  p("desert", "الصحراوي", "كثبانٌ وشمسٌ دافئة — أصالةٌ مصريّةٌ خالصة", false,
    { primary: "#a15c2b", gold: "#d99a3c", paper: "#faf3e7" },
    { skin: "kahraman", design: "wave", hero: "classicSoft", layout: "stack", plans: "softBadge", button: "plaque", motion: "calmRise" },
    { subjects: ["arabic", "humanities", "religious"], stages: ["middle", "secondary"], personality: "calm" }),

  p("teal", "الفيروزي البحري", "أزرقُ مخضرٌّ منعش — كنسمة بحر في يوم دراسيّ", false,
    { primary: "#0e7490", gold: "#eab308", paper: "#f0fafb" },
    { skin: "fayrouz", design: "wave", hero: "classicWide", layout: "center", plans: "softScale", button: "pillSlide", motion: "slideSmooth" },
    { subjects: ["stem", "english", "general"], stages: ["middle", "secondary"], personality: "modern" }),

  p("academic", "الأكاديمي الجامعي", "كحليٌّ رصينٌ بخطوطٍ واضحة — ثقةٌ واحتراف", false,
    { primary: "#1e3a5f", gold: "#8b6f3e", paper: "#f7f8fa" },
    { skin: "midad", design: "plaque", hero: "classic", layout: "classic", plans: "classicLift", button: "plaqueGhost", motion: "classic" },
    { subjects: ["stem", "humanities", "general"], stages: ["university", "professional"], personality: "academic" }),

  p("magazine", "المجلّة", "تايبوغرافي كبيرٌ ومساحاتٌ جريئة — صفحاتٌ تلفت الأنظار", false,
    { primary: "#b91c1c", gold: "#1f2937", paper: "#fffdf8" },
    { skin: "qirmiz", design: "bare", hero: "outlineFull", layout: "mirror", plans: "classicCrown", button: "pillText", motion: "sharpTilt" },
    { subjects: ["english", "arts", "general"], stages: ["university", "professional"], personality: "energetic" }),

  p("elevated", "البطاقات المرتفعة", "ظلالٌ ناعمةٌ وارتفاعٌ لطيف — خفّةٌ تدعو للتركيز", false,
    { primary: "#4338ca", gold: "#c99a3b", paper: "#f5f5ff" },
    { skin: "banafsaj", design: "soft", hero: "solidSoft", layout: "classicAiry", plans: "softGlow", button: "roundFoil", motion: "springLift" },
    { subjects: ["general", "stem", "english"], stages: ["secondary", "university"], personality: "calm" }),

  p("ribbon", "الشرائط والمطويّات", "أطرافٌ مطويّةٌ وشرائطُ — إبداعٌ يُسعد العين", false,
    { primary: "#9d174d", gold: "#d99a3c", paper: "#fdf6f8" },
    { skin: "warda", design: "ribbon", hero: "classicSoft", layout: "center", plans: "classicLift", button: "plaqueGlow", motion: "springTilt" },
    { subjects: ["arts", "arabic", "general"], stages: ["primary", "middle"], personality: "energetic" }),

  p("kufi", "الهندسي الكوفي", "تبليطٌ هندسيٌّ وكوفيٌّ مربّع — دقّةٌ في كلّ بلاطة", false,
    { primary: "#155e4c", gold: "#b8912f", paper: "#f4f6f2" },
    { skin: "zaytoon", design: "hex", hero: "classicWide", layout: "classic", plans: "classicCrown", button: "plaque", motion: "calmRise" },
    { subjects: ["arabic", "religious", "humanities"], stages: ["secondary", "university"], personality: "academic" }),

  p("chalk", "اللوح والطباشير", "لوحٌ داكنٌ وخطٌّ طباشيريّ — حنينٌ للفصل الحقيقيّ", true,
    { primary: "#e5e7eb", gold: "#f2c14e", paper: "#14201b" },
    { skin: "faham", design: "torn", hero: "outlineText", layout: "stack", plans: "glassCircle", button: "pillGhost", motion: "linearRise" },
    { subjects: ["stem", "general", "arabic"], stages: ["primary", "middle", "secondary"], personality: "academic" }),

  p("spring", "الربيعي الفاتح", "أخضرُ فاتحٌ ومشرقٌ — انتعاشٌ يبعث على التفاؤل", false,
    { primary: "#16a34a", gold: "#eab308", paper: "#f4fdf6" },
    { skin: "nakhil", design: "scallop", hero: "solidSoft", layout: "centerWide", plans: "softScale", button: "pillSlide", motion: "briskFade" },
    { subjects: ["general", "arts", "stem"], stages: ["primary", "middle"], personality: "energetic" }),

  p("royal", "الملكي البنفسجي", "بنفسجيٌّ ملكيٌّ وذهبٌ فاخر — فخامةٌ تفرض الاحترام", true,
    { primary: "#a78bfa", gold: "#fbbf24", paper: "#160f22" },
    { skin: "laylBanafsaj", design: "plaqueGold", hero: "solidPlaque", layout: "center", plans: "glassLift", button: "pillFoil", motion: "scaleGlow" },
    { subjects: ["general", "stem", "english"], stages: ["secondary", "university"], personality: "modern" }),
];

export function presetById(id?: string): BrandPreset {
  return BRAND_PRESETS.find((x) => x.id === id) ?? BRAND_PRESETS[0];
}

export function matchPresets(answers: IdentityAnswers): BrandPreset[] {
  const scored = BRAND_PRESETS.map((preset) => {
    let score = 0;
    if (preset.subjects.includes(answers.subject)) score += 3;
    if (preset.stages.includes(answers.stage)) score += 2;
    if (preset.personality === answers.personality) score += 3;
    if (preset.dark === answers.preferDark) score += 2;
    return { preset, score };
  });
  scored.sort((a, b) => b.score - a.score);
  return scored.map((s) => s.preset);
}
