/**
 * لوح قسم الهيرو.
 * ------------------------------------------------------------------
 * سجلُّ الهيرو القائم (lib/hero-styles.ts) يحكم **ما بداخله**: معالجة
 * العنوان وشكل الشارة وكثافة الزخرفة وترتيب الأزرار. وهذا يحكم **اللوح
 * نفسه**: هل هو سطحٌ ممتدّ بلا حدّ، أم لوحٌ مستدير عائم، أم قوسٌ، أم
 * شكلٌ مقصوص — وبأيّ لونٍ وأيّ حافّة.
 *
 * محوران لا يتداخلان، فيُركَّبان بحرّية: أيّ هيئةٍ داخلية في أيّ لوح.
 *
 * واللونان (السطح والحافّة) خارج التصاميم عمداً: التصميمُ شكلٌ واللونُ
 * هوية — ومن أراد لوحاً مستديراً بلون منصّته لا يُجبَر على لونِ مصمّمه.
 */

/** سطح اللوح. */
export type ShellSurface =
  | "none"      // بلا لوح — الهيرو ممتدّ كما هو (الأصل)
  | "card"      // سطحٌ مصمت
  | "glass"     // زجاجي مضبّب
  | "gradient"  // تدرّج بين لونين
  | "ink"       // لوح الحبر — نصٌّ فاتح
  | "tint"      // غلالة خفيفة من لون الهوية
  /* ---- أنماطٌ مشهورة في واجهات اليوم ---- */
  | "mesh"      // تدرّجٌ شبكيّ: بقعٌ لونيّة تتداخل (Stripe · Linear)
  | "aurora"    // شفقٌ قطبي: أشرطةٌ لونيّة مائلة تسبح خلف المحتوى
  | "spotlight" // كشّافٌ من أعلى يُنير المنتصف ويُظلم الأطراف (Vercel)
  | "grid"      // شبكةٌ هندسية خافتة تتلاشى عند الحواف
  | "dots"      // نقاطٌ منتظمة كورق المهندس (Notion · Framer)
  | "noise"     // حبيباتٌ دقيقة تكسر نظافةَ السطح المصمت
  | "neu"       // نيومورفيزم: سطحٌ ناتئٌ بظلّين متقابلين
  | "brutal"    // بروتالِزم: لونٌ صريحٌ وحدٌّ أسود وظلٌّ صلب
  | "stripe"    // أشرطةٌ قطريّة رفيعة
  | "duotone";  // نصفان بلونين يلتقيان في المنتصف

/** حوافّ اللوح. */
export type ShellShape =
  | "square"    // بلا استدارة
  | "soft"      // استدارة خفيفة
  | "round"     // استدارة واسعة
  | "pill"      // دائري تماماً من الأسفل
  | "arch"      // قوسٌ من أعلى كالمحراب
  | "plaque"    // أركان مقصوصة كلوح المخطوط
  | "wave"      // حافّة سفلى متموّجة
  | "slant"     // حافّة سفلى مائلة (نمطٌ شائع في صفحات الهبوط)
  | "notch"     // حزٌّ في المنتصف السفلي
  | "blob"      // حوافُّ عضويّة غير منتظمة
  | "topRound"; // مستديرٌ من أعلى فقط، ممتدٌّ من أسفل

/** الحدّ. */
export type ShellEdge =
  | "none"
  | "hairline"  // خيطٌ رفيع
  | "gold"      // خيطٌ مذهّب
  | "thick"     // حدّ سميك
  | "glow"      // هالةٌ حول اللوح
  | "dashed"    // حدّ متقطّع
  | "sheen"     // خيطٌ مضيءٌ في الأعلى وحده (Linear · Vercel)
  | "hard"      // ظلٌّ صلبٌ مزاح بلا تمويه — البروتالِزم
  | "soft"      // ظلٌّ واسعٌ ناعمٌ يرفع اللوح
  | "double";   // حدّان: خارجيٌّ فاتحٌ وداخليٌّ داكن

export type HeroShell = {
  id: string;
  name: string;
  hint: string;
  surface: ShellSurface;
  shape: ShellShape;
  edge: ShellEdge;
  /** لوحٌ منفصلٌ عن حوافّ الشاشة بهامش. */
  inset: boolean;
};

function hs(
  id: string, name: string, hint: string,
  surface: ShellSurface, shape: ShellShape, edge: ShellEdge, inset: boolean
): HeroShell {
  return { id, name, hint, surface, shape, edge, inset };
}

export const HERO_SHELLS: HeroShell[] = [
  hs("plain", "الأصلي", "بلا لوح — القسم ممتدٌّ كما هو", "none", "square", "none", false),
  hs("cardSoft", "اللوح الناعم", "سطحٌ مصمت باستدارة خفيفة", "card", "soft", "hairline", true),
  hs("cardRound", "اللوح المستدير", "استدارة واسعة وحدٌّ رفيع", "card", "round", "hairline", true),
  hs("cardGold", "اللوح المذهّب", "مستدير بخيطٍ مذهّب", "card", "round", "gold", true),
  hs("cardPlaque", "لوح المخطوط", "أركان مقصوصة وخيط ذهبي", "card", "plaque", "gold", true),
  hs("glassRound", "الزجاجي", "زجاج مضبّب باستدارة واسعة", "glass", "round", "hairline", true),
  hs("glassGlow", "الزجاجي المتوهّج", "زجاج وهالةٌ حوله", "glass", "round", "glow", true),
  hs("glassArch", "الزجاجي المقوَّس", "قوسٌ من أعلى كالمحراب", "glass", "arch", "gold", true),
  hs("gradientRound", "المتدرّج", "تدرّجٌ بين لونين", "gradient", "round", "none", true),
  hs("gradientArch", "القوس المتدرّج", "تدرّجٌ بحافّة مقوّسة", "gradient", "arch", "none", false),
  hs("gradientWave", "الموجة المتدرّجة", "حافّة سفلى متموّجة", "gradient", "wave", "none", false),
  hs("inkRound", "لوح الحبر", "حبرٌ داكن ونصٌّ فاتح", "ink", "round", "gold", true),
  hs("inkArch", "قوس الحبر", "حبرٌ بقوسٍ من أعلى", "ink", "arch", "none", false),
  hs("inkWave", "موجة الحبر", "حبرٌ بحافّة متموّجة", "ink", "wave", "none", false),
  hs("inkPill", "كبسولة الحبر", "حبرٌ دائريٌّ من الأسفل", "ink", "pill", "gold", true),
  hs("tintSoft", "المُغلَّل", "غلالةٌ خفيفة من لون الهوية", "tint", "soft", "none", false),
  hs("tintRound", "المُغلَّل المستدير", "غلالةٌ باستدارة واسعة", "tint", "round", "dashed", true),
  hs("outlineRound", "المفرَّغ", "حدٌّ سميك بلا تعبئة", "none", "round", "thick", true),
  hs("outlineWave", "المفرَّغ المتموّج", "حدٌّ سميك وحافّة موجية", "none", "wave", "thick", false),
  hs("squareBleed", "الممتدّ الحادّ", "بلا استدارة ولا هامش — خطٌّ سفليٌّ فقط", "card", "square", "hairline", false),

  /* ---------- عشرون هيئةً من أنماط الواجهات المشهورة ---------- */
  hs("mesh", "التدرّج الشبكي", "بقعٌ لونيّة تتداخل — نمط Stripe", "mesh", "round", "none", true),
  hs("meshGlow", "الشبكي المتوهّج", "بقعٌ لونيّة وهالةٌ حولها", "mesh", "round", "glow", true),
  hs("aurora", "الشفق", "أشرطةٌ لونيّة مائلة تسبح خلف النصّ", "aurora", "topRound", "none", false),
  hs("auroraSheen", "الشفق ببريق", "شفقٌ وخيطٌ مضيءٌ في أعلاه", "aurora", "round", "sheen", true),
  hs("spotlight", "الكشّاف", "ضوءٌ من أعلى يُنير المنتصف — نمط Vercel", "spotlight", "square", "none", false),
  hs("spotlightCard", "الكشّاف المحصور", "كشّافٌ في لوحٍ مستدير", "spotlight", "round", "sheen", true),
  hs("grid", "الشبكة الهندسية", "خطوطٌ خافتة تتلاشى عند الحواف", "grid", "square", "none", false),
  hs("gridCard", "الشبكة المحصورة", "شبكةٌ في لوحٍ ناعم", "grid", "soft", "hairline", true),
  hs("dots", "ورق المهندس", "نقاطٌ منتظمة — نمط Notion", "dots", "round", "hairline", true),
  hs("dotsBleed", "النقاط الممتدّة", "نقاطٌ تملأ العرض بلا لوح", "dots", "square", "none", false),
  hs("noise", "الحبيبي", "حبيباتٌ دقيقة تكسر نظافةَ السطح", "noise", "round", "hairline", true),
  hs("neu", "النيومورفيزم", "سطحٌ ناتئٌ بظلّين متقابلين", "neu", "round", "none", true),
  hs("neuSoft", "النيومورفيزم الناعم", "نتوءٌ خفيفٌ باستدارةٍ واسعة", "neu", "soft", "none", true),
  hs("brutal", "البروتالِزم", "لونٌ صريحٌ وحدٌّ أسود وظلٌّ صلب", "brutal", "square", "hard", true),
  hs("brutalRound", "البروتالِزم الناعم", "بروتالِزم باستدارةٍ خفيفة", "brutal", "soft", "hard", true),
  hs("stripe", "الأشرطة القطريّة", "خطوطٌ رفيعة مائلة", "stripe", "slant", "none", false),
  hs("duotone", "النصفان", "لونان يلتقيان في المنتصف", "duotone", "notch", "none", false),
  hs("blob", "العضوي", "حوافُّ غير منتظمة كالبقعة", "gradient", "blob", "soft", true),
  hs("floatCard", "اللوح الطافي", "ظلٌّ واسعٌ يرفعه عن الصفحة", "card", "round", "soft", true),
  hs("doubleEdge", "الحدّ المزدوج", "حدّان: خارجيٌّ فاتحٌ وداخليٌّ داكن", "card", "round", "double", true),
];

export const DEFAULT_HERO_SHELL = HERO_SHELLS[0].id;

export function findHeroShell(id?: string): HeroShell {
  return HERO_SHELLS.find((x) => x.id === id) ?? HERO_SHELLS[0];
}

export function heroShellClass(x: HeroShell): string {
  return `hsh-surface-${x.surface} hsh-shape-${x.shape} hsh-edge-${x.edge}${x.inset ? " hsh-inset" : ""}`;
}

/** إعدادات اللوح التي ليست شكلاً: ألوانُه وارتفاعُه. */
export type HeroShellOpts = {
  /** لون السطح. */
  bg?: string;
  /** اللون الثاني للتدرّج. */
  bg2?: string;
  /** لون الحافّة. */
  edge?: string;
  /** لون النصّ داخل اللوح. */
  text?: string;
  /**
   * زيادة الارتفاع لأسفل بالبكسل (٠..٤٠٠).
   * تُضاف حشواً سفلياً لا ارتفاعاً ثابتاً — فيبقى القسم يتمدّد بمحتواه
   * ولا يُقصّ منه شيء على الشاشات الضيّقة.
   */
  extra?: number;
};

/** متغيّرات اللوح — الفارغ لا يُكتب فيرث لون الثيم. */
export function heroShellVars(c: HeroShellOpts | undefined): React.CSSProperties {
  const v: Record<string, string> = {};
  if (c?.bg) v["--hsh-bg"] = c.bg;
  if (c?.bg2) v["--hsh-bg2"] = c.bg2;
  if (c?.edge) v["--hsh-edge"] = c.edge;
  if (c?.text) v["--hsh-text"] = c.text;
  const extra = Math.max(0, Math.min(400, c?.extra ?? 0));
  if (extra > 0) v["--hsh-extra"] = `${extra}px`;
  return v as React.CSSProperties;
}
