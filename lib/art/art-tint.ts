/**
 * تلوينُ الصور المتحرّكة.
 * ------------------------------------------------------------------
 * الصورُ المتحرّكة نقطيّةٌ بألوانٍ مخبوزةٍ في إطاراتها — لا يمكن تبديلُ
 * لونٍ فيها كما يُبدَّل في SVG. فتُلوَّن بمرشّحٍ يعمل على البكسل نفسِه.
 *
 * **والمعادلةُ محسوبةٌ لا مجرَّبة:**
 *
 *   `grayscale(1)` يُسقط ألوانَها كلَّها فتصير رماديّةً — وهذا لازمٌ
 *   قبل كلّ شيء: تلوينُ صورةٍ متعدّدةِ الألوان بلا تسويةٍ أوّلاً يُنتج
 *   ألواناً عشوائيّةً لأنّ كلَّ لونٍ يدور من موضعه هو.
 *
 *   ثمّ `sepia(1)` يصبغ الرماديَّ بلونٍ واحدٍ ثابتٍ معلوم — درجتُه
 *   تقارب ٣٥° وإشباعُه ٢٣٪ وضياؤه ٣٥٪. وهذا هو **المرجع** الذي يُقاس
 *   منه.
 *
 *   فيُدار إلى الدرجة المطلوبة بـ`hue-rotate(target − 35)`، ويُضبط
 *   الإشباعُ والضياءُ بنسبتَي المطلوب إلى المرجع.
 *
 * فالنتيجةُ صورةٌ أحاديّةُ اللون بأيّ لونٍ يُطلب — تحتفظ بتفاصيلها
 * وحركتها، وتستوي مع الهوية.
 *
 * **ولماذا لا تُولَّد نسخٌ ملوّنة؟** لأنّها اثنتا عشرةَ صورةً × كلُّ لونٍ
 * يُجرَّب — ملفّاتٌ تتكاثر ولا تُحذف، وتغييرُ اللون ينتظر بناءً جديداً.
 * والمرشّحُ يُحسب في المتصفّح فيتبدّل اللونُ بضغطة.
 */

/** مرجعُ `sepia` — منه تُقاس كلُّ إزاحة. */
const SEPIA_H = 35;
const SEPIA_S = 23;
const SEPIA_L = 35;

export type TintMode = "original" | "ink" | "gold" | "mono" | "soft" | "custom";

export type ArtTint = {
  mode?: TintMode;
  /** اللون المطلوب حين يكون الوضع «مخصّص». */
  color?: string;
  /** شدّةُ التلوين ٠..١٠٠ — دونها تبقى ألوانُ الصورة ممتزجةً بالجديد. */
  strength?: number;
};

export const TINT_MODES: { id: TintMode; name: string; hint: string }[] = [
  { id: "original", name: "ألوانها الأصلية", hint: "كما جاءت — بلا تلوين" },
  { id: "ink", name: "كحليّ", hint: "بلون الهوية الأساسي" },
  { id: "gold", name: "ذهبيّ", hint: "بلون الهوية الذهبي" },
  { id: "mono", name: "رماديّ", hint: "بلا لون — أهدأ ما يكون" },
  { id: "soft", name: "مخفَّف", hint: "ألوانها الأصلية أقلَّ صخباً" },
  { id: "custom", name: "لون مخصّص", hint: "أيُّ لونٍ تختاره" },
];

function hexToHsl(hex: string): [number, number, number] {
  const h = hex.replace("#", "").trim();
  const full = h.length === 3 ? h.split("").map((c) => c + c).join("") : h;
  const r = parseInt(full.slice(0, 2), 16) / 255;
  const g = parseInt(full.slice(2, 4), 16) / 255;
  const b = parseInt(full.slice(4, 6), 16) / 255;
  const mx = Math.max(r, g, b);
  const mn = Math.min(r, g, b);
  const l = (mx + mn) / 2;
  const d = mx - mn;
  let hue = 0;
  let s = 0;
  if (d) {
    s = l > 0.5 ? d / (2 - mx - mn) : d / (mx + mn);
    switch (mx) {
      case r: hue = ((g - b) / d) % 6; break;
      case g: hue = (b - r) / d + 2; break;
      default: hue = (r - g) / d + 4;
    }
    hue *= 60;
    if (hue < 0) hue += 360;
  }
  return [hue, s * 100, l * 100];
}

/** مرشّحٌ يُحوّل أيَّ صورةٍ إلى أحاديّةِ اللون باللون المطلوب. */
export function tintFilter(hex: string): string {
  const [h, s, l] = hexToHsl(hex);
  const rot = Math.round(h - SEPIA_H);
  /* الحدُّ الأعلى يمنع إشباعاً يُحرق التفاصيل في الألوان المشبعة جداً. */
  const sat = Math.max(0.2, Math.min(6, s / SEPIA_S)).toFixed(2);
  const bri = Math.max(0.35, Math.min(2.4, l / SEPIA_L)).toFixed(2);
  return `grayscale(1) sepia(1) hue-rotate(${rot}deg) saturate(${sat}) brightness(${bri})`;
}

/**
 * المرشّحُ النهائيُّ من الإعداد.
 * ويعود فارغاً في الوضع الأصليّ — فلا يُكتب مرشّحٌ لا يفعل شيئاً، وكلُّ
 * مرشّحٍ يُنشئ طبقةَ تركيبٍ جديدةً في المتصفّح ولو كان محايداً.
 */
export function artFilter(
  /* يُقبل النصُّ الحرّ كما يأتي من القاعدة، ويُصحَّح هنا — لا يُطالَب
     المستدعي بتضييقه، فالقاعدةُ لا تحفظ أنواعاً. */
  t: { mode?: string; color?: string; strength?: number } | undefined,
  brand: { primary?: string; gold?: string }
): string {
  const known = TINT_MODES.some((m) => m.id === t?.mode);
  const mode = (known ? t!.mode : "original") as TintMode;
  if (mode === "original") return "";
  if (mode === "mono") return "grayscale(1)";
  if (mode === "soft") return "saturate(0.55) brightness(1.04)";

  const hex =
    mode === "ink" ? (brand.primary || "#2c456a")
      : mode === "gold" ? (brand.gold || "#e5caa5")
        : (t?.color || "#2c456a");

  const f = tintFilter(hex);
  const strength = Math.max(0, Math.min(100, t?.strength ?? 100));
  /*
    الشدّةُ دون المئة تُمزَج بالأصل.
    ولا سبيلَ لمزج مرشّحين في خاصيّةٍ واحدة، فتُخفَّف بالإشباع: كلّما
    قلّت الشدّةُ عاد شيءٌ من ألوان الصورة الأصلية عبر تقليل الرمادنة.
  */
  if (strength >= 99) return f;
  return f.replace("grayscale(1)", `grayscale(${(strength / 100).toFixed(2)})`);
}
