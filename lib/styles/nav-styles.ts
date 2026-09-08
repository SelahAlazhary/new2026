/**
 * تصاميم القوائم — الجانبية على الحاسوب والسفلية على الهاتف.
 * ------------------------------------------------------------------
 * القائمة أكثر ما يراه الطالب: تظهر في كل صفحة يفتحها. لذلك شكلها بُعد
 * مستقلّ عن الثيم والهيئة والتخطيط، له سجلّه الخاص.
 *
 * كلّها بيانات → أصناف CSS على غلاف البوابة، والأنماط معرَّفة مرّة واحدة
 * في ملف الأنماط. مؤشّر العنصر النشط وحده يُرسم SVG لأنه شكل حقيقي
 * (لوح مقصوص، قوس، شعلة) لا يُعبَّر عنه بحدّ أو خلفية.
 */

/* ------------------------------------------------------------------ */
/*  القائمة الجانبية (الحاسوب)                                         */
/* ------------------------------------------------------------------ */

/** سطح اللوح الجانبي. */
export type SidePanel =
  | "solid"     // لون مصمت
  | "gradient"  // تدرّج رأسي
  | "glass"     // زجاجي شفّاف
  | "outline"   // شفّاف بحدّ
  | "floating"  // بطاقة منفصلة عن الحافّة
  | "rail";     // شريط رفيع جداً

/** شكل مؤشّر العنصر النشط. */
export type ActiveMark =
  | "pill"      // كبسولة خلف العنصر
  | "bar"       // شريط على الحافّة
  | "plaque"    // لوح بأركان مقصوصة
  | "notch"     // حزّ يدخل في اللوح
  | "glow"      // توهّج خلفي
  | "underline" // خطّ تحت العنوان
  | "dot"       // نقطة صغيرة
  | "frame";    // إطار مفرَّغ

/** شكل حاضنة الأيقونة. */
export type IconHolder = "plain" | "box" | "circle" | "medallion";

export type SideNavStyle = {
  id: string;
  name: string;
  hint: string;
  panel: SidePanel;
  active: ActiveMark;
  icon: IconHolder;
  /** العناوين تحت الأيقونات بدل جانبها. */
  stacked: boolean;
};

function sd(
  id: string, name: string, hint: string,
  panel: SidePanel, active: ActiveMark, icon: IconHolder, stacked: boolean
): SideNavStyle {
  return { id, name, hint, panel, active, icon, stacked };
}

export const SIDE_NAV_STYLES: SideNavStyle[] = [
  sd("classic", "الكلاسيكي", "لوح مصمت وكبسولة خلف النشط", "solid", "pill", "plain", false),
  sd("classicBox", "الكلاسيكي المؤطَّر", "أيقونات في مربّعات", "solid", "pill", "box", false),
  sd("gradientBar", "المتدرّج", "تدرّج رأسي وشريط على الحافّة", "gradient", "bar", "plain", false),
  sd("gradientGlow", "المتدرّج المتوهّج", "تدرّج وتوهّج خلف النشط", "gradient", "glow", "circle", false),
  sd("glassPill", "الزجاجي", "لوح زجاجي وكبسولة ناعمة", "glass", "pill", "circle", false),
  sd("glassFrame", "الزجاجي المفرَّغ", "زجاج وإطار مفرَّغ للنشط", "glass", "frame", "plain", false),
  sd("outlineBar", "المفرَّغ", "بلا خلفية — حدّ وشريط", "outline", "bar", "plain", false),
  sd("outlineDot", "المفرَّغ المنقَّط", "حدّ ونقطة صغيرة للنشط", "outline", "dot", "plain", false),
  sd("floatCard", "البطاقة العائمة", "لوح منفصل عن الحافّة", "floating", "pill", "box", false),
  sd("floatPlaque", "البطاقة المذهّبة", "لوح عائم ومؤشّر بأركان مقصوصة", "floating", "plaque", "medallion", false),
  sd("plaqueNotch", "المحزَّز", "حزّ يدخل في اللوح عند النشط", "solid", "notch", "plain", false),
  sd("plaqueMedal", "الميدالية", "أيقونات في ميداليات مثمّنة", "solid", "plaque", "medallion", false),
  sd("railIcons", "الشريط", "شريط رفيع بأيقونات فقط", "rail", "pill", "circle", true),
  sd("railBar", "الشريط المخطَّط", "شريط رفيع ومؤشّر جانبي", "rail", "bar", "plain", true),
  sd("stackLabels", "العناوين تحت", "الأيقونة فوق والعنوان تحتها", "solid", "pill", "box", true),
  sd("stackGlow", "العناوين المتوهّجة", "عناوين تحت الأيقونات مع توهّج", "gradient", "glow", "circle", true),
  sd("underline", "المسطَّر", "خطّ تحت العنوان النشط", "solid", "underline", "plain", false),
  sd("underlineGlass", "المسطَّر الزجاجي", "زجاج وخطّ تحت النشط", "glass", "underline", "plain", false),
  sd("minimalDot", "المبسّط", "شريط رفيع بلا حاضنات — نقطة فقط", "rail", "dot", "plain", false),
  sd("royal", "الملكي", "تدرّج ولوح مذهّب وميداليات", "gradient", "plaque", "medallion", false),
];

export const DEFAULT_SIDE_NAV = SIDE_NAV_STYLES[0].id;

/**
 * نمطُ لوحٍ اختِير صراحةً — أو لا شيء.
 * ------------------------------------------------------------------
 * `findSideNav` تُرجع الكلاسيكيَّ لِما لم يُختر، وهو صوابٌ للطالب فلوحُه
 * مبنيٌّ على هذه الأصناف. أمّا اللوحةُ فبناؤها `ad-root` مستقلٌّ، وطبعُ
 * أصنافِ `sn-` عليها بلا طلبٍ يجعلها ترث تنسيقاً لم يُرِده أحد — وقواعدُ
 * `sn-` تقع على `aside` مجرّداً فتُصيب كلَّ لوحٍ في الشجرة.
 * فمَن لم يختر لا يُطبع عليه شيء.
 */
export function sideNavClassIfPicked(id?: string): string {
  const x = SIDE_NAV_STYLES.find((s) => s.id === id);
  return x ? sideNavClass(x) : "";
}

export function findSideNav(id?: string): SideNavStyle {
  return SIDE_NAV_STYLES.find((x) => x.id === id) ?? SIDE_NAV_STYLES[0];
}

/**
 * جهةُ اللوح الجانبيّ.
 * ------------------------------------------------------------------
 * جهةٌ فيزيائيّةٌ لا منطقيّة (`right`/`left` لا `start`/`end`): المنصّةُ
 * عربيّةٌ فالمنطقيُّ يعني اليمينَ دائماً، ومن أراد اللوحَ يساراً في واجهةٍ
 * عربيّةٍ أرادَه يساراً على الشاشة لا «في نهاية السطر».
 */
export type NavSide = "right" | "left";

export function navSideClass(v: string | undefined, scope: "student" | "admin"): string {
  return v === "left" ? `nav-left-${scope}` : "";
}

export function sideNavClass(x: SideNavStyle): string {
  return [
    `sn-panel-${x.panel}`,
    `sn-active-${x.active}`,
    `sn-icon-${x.icon}`,
    x.stacked ? "sn-stacked" : "",
  ].filter(Boolean).join(" ");
}

/* ------------------------------------------------------------------ */
/*  ألوان القائمة وأيقوناتها                                            */
/* ------------------------------------------------------------------ */

/**
 * مجموعة الأيقونات.
 * الأيقونات نفسها من مجموعة الهوية؛ ما يتغيّر هو أسلوب رسمها: خطّية
 * رفيعة أو سميكة أو ممتلئة أو مزدوجة. أسلوب واحد لكل القائمة، فلا
 * تختلط الأساليب في شريط واحد — وهو أكثر ما يُفسد اتّساق الواجهات.
 */
export type IconSet = "line" | "bold" | "filled" | "duo";

export const ICON_SETS: { id: IconSet; name: string; hint: string }[] = [
  { id: "line", name: "خطّية", hint: "خطوط رفيعة — الأهدأ" },
  { id: "bold", name: "سميكة", hint: "خطوط أثقل وأوضح من بعيد" },
  { id: "filled", name: "ممتلئة", hint: "أشكال مصمتة" },
  { id: "duo", name: "مزدوجة", hint: "خطّ ومساحة بلونين" },
];

export const DEFAULT_ICON_SET: IconSet = "line";

/** ألوان القائمة القابلة للضبط — كلّها اختيارية وتسقط للثيم. */
export type NavColors = {
  /** خلفية اللوح الجانبي. */
  panel?: string;
  /** لون الأيقونات. */
  icon?: string;
  /** لون نصّ العناوين — مستقلّ عن الأيقونات، فقد يُراد نصّ هادئ وأيقونة بارزة. */
  text?: string;
  /** لون العنصر النشط ومؤشّره. */
  active?: string;
};

/** يبني متغيّرات لون القائمة — الفارغ لا يُكتب فيرث من الثيم. */
export function navColorVars(c: NavColors | undefined): React.CSSProperties {
  const v: Record<string, string> = {};
  if (c?.panel) v["--nav-panel"] = c.panel;
  if (c?.icon) v["--nav-icon"] = c.icon;
  if (c?.text) v["--nav-text"] = c.text;
  if (c?.active) v["--nav-active"] = c.active;
  return v as React.CSSProperties;
}

/* ------------------------------------------------------------------ */
/*  القائمة السفلية (الهاتف)                                           */
/* ------------------------------------------------------------------ */

/** شكل الشريط نفسه. */
export type DockShape =
  | "float"   // عائم منفصل عن الحافّة
  | "flat"    // ملتصق بعرض الشاشة
  | "pill"    // كبسولة مضغوطة في الوسط
  | "arc"     // حافّة عليا مقوّسة
  | "tray"    // درج بحافّة مستقيمة وظلّ مرتفع
  | "cut";    // أركان علوية مقصوصة

/** ما يميّز العنصر النشط. */
export type DockMark =
  | "pill"    // كبسولة خلفه
  | "lift"    // يرتفع فوق الشريط
  | "dot"     // نقطة تحته
  | "glow"    // توهّج
  | "bar";    // شريط فوقه

export type DockStyle = {
  id: string;
  name: string;
  hint: string;
  shape: DockShape;
  mark: DockMark;
  labels: boolean;
};

function dk(id: string, name: string, hint: string, shape: DockShape, mark: DockMark, labels: boolean): DockStyle {
  return { id, name, hint, shape, mark, labels };
}

export const DOCK_STYLES: DockStyle[] = [
  dk("floatPill", "العائم", "شريط عائم وكبسولة خلف النشط", "float", "pill", true),
  dk("floatLift", "العائم المرتفع", "الأيقونة النشطة ترتفع فوق الشريط", "float", "lift", true),
  dk("floatDot", "العائم المنقَّط", "نقطة تحت النشط", "float", "dot", true),
  dk("floatGlow", "العائم المتوهّج", "توهّج خلف النشط", "float", "glow", false),
  dk("flatPill", "الملتصق", "شريط بعرض الشاشة وكبسولة", "flat", "pill", true),
  dk("flatBar", "الملتصق المخطَّط", "شريط فوق العنصر النشط", "flat", "bar", true),
  dk("flatDot", "الملتصق المنقَّط", "ملتصق ونقطة تحت النشط", "flat", "dot", false),
  dk("flatLift", "الملتصق المرتفع", "ملتصق والنشط يرتفع", "flat", "lift", true),
  dk("pillPill", "الكبسولة", "كبسولة مضغوطة في الوسط", "pill", "pill", false),
  dk("pillGlow", "الكبسولة المتوهّجة", "كبسولة وتوهّج", "pill", "glow", false),
  dk("pillLift", "الكبسولة المرتفعة", "كبسولة والنشط يرتفع", "pill", "lift", false),
  dk("arcPill", "المقوَّس", "حافّة عليا مقوّسة", "arc", "pill", true),
  dk("arcLift", "المقوَّس المرتفع", "قوس والنشط يرتفع في وسطه", "arc", "lift", true),
  dk("arcDot", "المقوَّس المنقَّط", "قوس ونقطة", "arc", "dot", false),
  dk("trayBar", "الدرج", "درج بظلّ مرتفع وشريط", "tray", "bar", true),
  dk("trayPill", "الدرج بكبسولة", "درج وكبسولة خلف النشط", "tray", "pill", true),
  dk("trayGlow", "الدرج المتوهّج", "درج وتوهّج", "tray", "glow", false),
  dk("cutPill", "المقصوص", "أركان علوية مقصوصة وكبسولة", "cut", "pill", true),
  dk("cutBar", "المقصوص المخطَّط", "أركان مقصوصة وشريط", "cut", "bar", false),
  dk("cutLift", "المقصوص المرتفع", "أركان مقصوصة والنشط يرتفع", "cut", "lift", true),
];

export const DEFAULT_DOCK = DOCK_STYLES[0].id;

export function findDock(id?: string): DockStyle {
  return DOCK_STYLES.find((x) => x.id === id) ?? DOCK_STYLES[0];
}

export function dockClass(x: DockStyle): string {
  return [
    `dk-shape-${x.shape}`,
    `dk-mark-${x.mark}`,
    x.labels ? "dk-labels" : "dk-nolabels",
  ].join(" ");
}
