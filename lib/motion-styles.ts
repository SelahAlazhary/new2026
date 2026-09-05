/**
 * الحركة في المنصّة.
 * ------------------------------------------------------------------
 * الحركةُ لغةٌ لا زينة: سرعتُها تقول إن كان الموقع رشيقاً أم متمهّلاً،
 * ومنحنى تسارعها يقول إن كان صارماً أم ليّناً. ولذلك جُمعت في سجلّ
 * واحد يُضبط من اللوحة، بدل أن تُبعثر قيمُها في عشرات المكوّنات.
 *
 * التنفيذ بمتغيّرات CSS على جذر الصفحة:
 *   --mo-dur   مدّة الحركة
 *   --mo-ease  منحنى التسارع
 *   --mo-lift  مقدار الارتفاع عند المرور
 *   --mo-rise  مقدار الصعود عند الظهور
 * فتقرأها القواعدُ والمكوّنات معاً، ويتغيّر الموقع كلّه بقيمة واحدة.
 *
 * ولا ثلاثيَّ الأبعاد هنا — أُلغي بطلب صاحبة المنصّة.
 */

/** إيقاع الحركة. */
export type MoSpeed = "calm" | "normal" | "brisk" | "instant";

/** منحنى التسارع. */
export type MoEase = "smooth" | "spring" | "sharp" | "linear";

/** كيف تدخل العناصر عند التمرير إليها. */
/**
 * طريقةُ دخول العنصر.
 * و«الهبوط» (`drop`) عكسُ «الصعود»: ينزل العنصرُ من فوقٍ ويستقرّ. وهو
 * أنسبُ لصفحةٍ يُقرأ فيها من أعلى إلى أسفل — فالعينُ تسبق المحتوى إلى
 * موضعه، ثمّ يبلغه المحتوى.
 */
export type MoEnter = "rise" | "drop" | "fade" | "scale" | "slide" | "none";

/** ما يحدث عند مرور الفأرة. */
export type MoHover = "lift" | "glow" | "tilt" | "none";

/** حركة الخلفيات والزخارف. */
export type MoAmbient = "full" | "soft" | "none";

export type MotionStyle = {
  id: string;
  name: string;
  hint: string;
  speed: MoSpeed;
  ease: MoEase;
  enter: MoEnter;
  hover: MoHover;
  ambient: MoAmbient;
};

function mo(
  id: string, name: string, hint: string,
  speed: MoSpeed, ease: MoEase, enter: MoEnter, hover: MoHover, ambient: MoAmbient
): MotionStyle {
  return { id, name, hint, speed, ease, enter, hover, ambient };
}

export const MOTION_STYLES: MotionStyle[] = [
  mo("classic", "الأصلي", "الحركة كما هي في المنصّة", "normal", "smooth", "rise", "lift", "full"),
  mo("calmRise", "المتمهّل", "حركة أبطأ وأهدأ", "calm", "smooth", "rise", "lift", "soft"),
  mo("calmFade", "المتمهّل الذائب", "ظهور بالتلاشي وحده", "calm", "smooth", "fade", "none", "soft"),
  mo("briskRise", "الرشيق", "سريع وحاسم", "brisk", "sharp", "rise", "lift", "full"),
  mo("briskFade", "الرشيق الذائب", "سريع بتلاشٍ خفيف", "brisk", "sharp", "fade", "glow", "soft"),
  mo("springLift", "النابض", "ارتداد خفيف في نهاية الحركة", "normal", "spring", "rise", "lift", "full"),
  mo("springScale", "النابض المكبِّر", "العناصر تكبر عند ظهورها", "normal", "spring", "scale", "lift", "full"),
  mo("springTilt", "النابض المائل", "ميلٌ خفيف عند المرور", "normal", "spring", "rise", "tilt", "soft"),
  mo("slideSmooth", "المنزلق", "دخول من الجانب", "normal", "smooth", "slide", "lift", "soft"),
  mo("slideBrisk", "المنزلق السريع", "انزلاق سريع", "brisk", "sharp", "slide", "glow", "none"),
  mo("scaleGlow", "المكبِّر المتوهّج", "تكبير عند الظهور وتوهّج عند المرور", "normal", "smooth", "scale", "glow", "full"),
  mo("scaleCalm", "المكبِّر الهادئ", "تكبير بطيء بلا حركة خلفية", "calm", "smooth", "scale", "none", "none"),
  mo("fadeGlow", "الذائب المتوهّج", "تلاشٍ وتوهّج", "normal", "smooth", "fade", "glow", "soft"),
  mo("linearRise", "المنتظم", "سرعة ثابتة بلا تسارع", "normal", "linear", "rise", "lift", "soft"),
  mo("linearFade", "المنتظم الذائب", "ثابت وذائب", "calm", "linear", "fade", "none", "none"),
  mo("sharpTilt", "الحادّ", "منحنى صارم وميل عند المرور", "brisk", "sharp", "slide", "tilt", "none"),
  mo("staticHover", "الساكن المتفاعل", "بلا دخول — يتفاعل عند المرور فقط", "brisk", "smooth", "none", "lift", "soft"),
  mo("staticGlow", "الساكن المتوهّج", "بلا دخول وتوهّج عند المرور", "normal", "smooth", "none", "glow", "soft"),
  mo("instantAll", "الفوري", "بلا انتظار — كل شيء حاضر", "instant", "linear", "none", "none", "none"),
  mo("still", "السكون", "بلا حركة إطلاقاً — أخفّ على الأجهزة الضعيفة", "instant", "linear", "none", "none", "none"),
  /* الهبوط — الأقسامُ والبطاقاتُ تنزل من أعلى وتستقرّ في مواضعها */
  mo("dropSettle", "الهبوط", "الأقسام تهبط من أعلى وتستقرّ", "normal", "smooth", "drop", "lift", "soft"),
  mo("dropSpring", "الهبوط النابض", "هبوطٌ ينتهي بارتدادةٍ خفيفة", "normal", "spring", "drop", "lift", "full"),
  mo("dropCalm", "الهبوط المتمهّل", "هبوطٌ بطيءٌ هادئ بلا حركة خلفية", "calm", "smooth", "drop", "none", "none"),
];

export const DEFAULT_MOTION = MOTION_STYLES[0].id;

export function findMotion(id?: string): MotionStyle {
  return MOTION_STYLES.find((x) => x.id === id) ?? MOTION_STYLES[0];
}

const DUR: Record<MoSpeed, string> = {
  calm: "0.85s",
  normal: "0.55s",
  brisk: "0.3s",
  instant: "0.01s",
};

const EASE: Record<MoEase, string> = {
  smooth: "cubic-bezier(0.22, 1, 0.36, 1)",
  spring: "cubic-bezier(0.34, 1.56, 0.64, 1)",
  sharp: "cubic-bezier(0.4, 0, 0.2, 1)",
  linear: "linear",
};

/**
 * متغيّرات الحركة — تُحقن على الغلاف فتقرأها القواعد والمكوّنات معاً.
 * «السكون» يُصفّر المسافات أيضاً لا المدّة وحدها، وإلا بقيت العناصر
 * تقفز قفزةً فورية بدل ألّا تتحرّك.
 */
export function motionVars(x: MotionStyle): React.CSSProperties {
  const still = x.id === "still" || x.speed === "instant";
  return {
    "--mo-dur": DUR[x.speed],
    "--mo-ease": EASE[x.ease],
    "--mo-lift": x.hover === "lift" ? "-4px" : "0px",
    /* الهبوطُ قيمةٌ سالبة: العنصرُ يبدأ فوق موضعه فينزل إليه */
    "--mo-rise": still || x.enter === "none" ? "0px" : x.enter === "rise" ? "22px" : x.enter === "drop" ? "-26px" : "0px",
    "--mo-slide": still || x.enter !== "slide" ? "0px" : "34px",
    /* الهبوطُ يصغّر قليلاً جدّاً — يكفي ليُحسّ بالاستقرار ولا يُرى تكبيراً */
    "--mo-scale":
      still || x.enter === "none" ? "1" : x.enter === "scale" ? "0.94" : x.enter === "drop" ? "0.985" : "1",
    /* مسافةُ هبوط الأقسام الكبيرة — أوسعُ من مسافة البطاقة فيُرى الفرق */
    "--mo-drop": still || x.enter === "none" ? "0px" : "30px",
  } as React.CSSProperties;
}

export function motionClass(x: MotionStyle): string {
  return `mo-enter-${x.enter} mo-hover-${x.hover} mo-amb-${x.ambient} mo-speed-${x.speed}`;
}
