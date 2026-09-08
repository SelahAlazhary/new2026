/**
 * تصاميم بطاقات المؤشّرات — مستقلّة عن الثيم.
 * ------------------------------------------------------------------
 * البطاقات كانت تتبع الثيم والهيئة معاً، فلم يكن تغيير لونها ممكناً
 * إلا بتغيير هوية المنصّة كلّها. هذا القسم يفصلها: شكلها ولونها
 * وتنسيقها الداخلي وصورتها بيدك وحدها، والثيم يبقى كما هو.
 *
 * كل حقل لوني اختياري — الفارغ لا يُكتب متغيّراً فترث البطاقة لون
 * الثيم، فلا يجبرك ضبطُ لون على ضبط البقية.
 */

/** شكل سطح البطاقة. */
export type TileSurface =
  | "glass"    // زجاجي شفّاف (الافتراضي فوق لوح الحبر)
  | "solid"    // مصمت بلون البطاقة
  | "outline"  // مفرَّغ بحدّ فقط
  | "gradient" // تدرّج بين لونين
  | "flat"     // بلا حدّ ولا ظلّ
  | "tint"     // غلالة خفيفة من لون البطاقة
  | "sheen";   // لمعة مائلة فوق سطح مصمت

/** ترتيب محتوى البطاقة. */
export type TileLayout =
  | "stacked"  // أيقونة فوق ورقم تحتها (الافتراضي)
  | "inline"   // أيقونة يمين والرقم يسارها
  | "centered" // كل شيء متمركز
  | "minimal"  // رقم وعنوان فقط بلا أيقونة
  | "split"    // الأيقونة في كتلة ملوّنة جانبية
  | "overlay"; // الشارة تطفو في الركن والرقم يملأ البطاقة

/** شكل شارة الأيقونة. */
export type TileIcon = "rounded" | "circle" | "square" | "medallion" | "none";

export type TileStyle = {
  id: string;
  name: string;
  hint: string;
  surface: TileSurface;
  layout: TileLayout;
  icon: TileIcon;
};

function t(
  id: string, name: string, hint: string,
  surface: TileSurface, layout: TileLayout, icon: TileIcon
): TileStyle {
  return { id, name, hint, surface, layout, icon };
}

export const TILE_STYLES: TileStyle[] = [
  t("glassStack", "الزجاجي", "شفّاف وأيقونة فوق الرقم", "glass", "stacked", "rounded"),
  t("glassInline", "الزجاجي الأفقي", "أيقونة بجانب الرقم", "glass", "inline", "circle"),
  t("glassOverlay", "الزجاجي الطافي", "الشارة تطفو في الركن والرقم يملأ", "glass", "overlay", "circle"),
  t("solidStack", "المصمت", "لون كامل وأيقونة فوق", "solid", "stacked", "rounded"),
  t("solidCenter", "المصمت المتمركز", "كل شيء في الوسط", "solid", "centered", "circle"),
  t("solidSplit", "المصمت المنقسم", "الأيقونة في كتلة ملوّنة جانبية", "solid", "split", "rounded"),
  t("outlineStack", "المفرَّغ", "حدّ فقط بلا تعبئة", "outline", "stacked", "square"),
  t("outlineMin", "المفرَّغ المبسّط", "بلا أيقونة — رقم وعنوان", "outline", "minimal", "none"),
  t("outlineSplit", "المفرَّغ المنقسم", "حدّ وكتلة جانبية للأيقونة", "outline", "split", "square"),
  t("gradStack", "المتدرّج", "تدرّج بين لونين", "gradient", "stacked", "rounded"),
  t("gradCenter", "المتدرّج المتمركز", "تدرّج وكل شيء في الوسط", "gradient", "centered", "medallion"),
  t("gradOverlay", "المتدرّج الطافي", "تدرّج ورقم يملأ البطاقة", "gradient", "overlay", "rounded"),
  t("flatInline", "المسطّح", "بلا حدّ ولا ظلّ", "flat", "inline", "none"),
  t("flatMin", "المسطّح المجرّد", "لا حدّ ولا شارة — رقم وعنوان", "flat", "minimal", "none"),
  t("medalStack", "الميدالية", "أيقونة في ميدالية مثمّنة", "glass", "stacked", "medallion"),
  t("squareInline", "المربّع", "شارة مربّعة بجانب الرقم", "solid", "inline", "square"),
  t("minimalCenter", "المجرّد", "رقم كبير في الوسط بلا شيء", "flat", "centered", "none"),
  t("tintStack", "المُغلَّل", "غلالة خفيفة من لون البطاقة", "tint", "stacked", "circle"),
  t("tintSplit", "المُغلَّل المنقسم", "غلالة وكتلة جانبية للأيقونة", "tint", "split", "medallion"),
  t("sheenCenter", "اللامع", "لمعة مائلة فوق سطح مصمت", "sheen", "centered", "rounded"),
];

export const DEFAULT_TILE = TILE_STYLES[0].id;

export function findTile(id?: string): TileStyle {
  return TILE_STYLES.find((x) => x.id === id) ?? TILE_STYLES[0];
}

export function tileClass(x: TileStyle): string {
  return `tl-surface-${x.surface} tl-layout-${x.layout} tl-icon-${x.icon}`;
}

/** ألوان البطاقة — كلّها اختيارية. */
export type TileColors = {
  /** خلفية البطاقة. */
  bg?: string;
  /** اللون الثاني للتدرّج. */
  bg2?: string;
  /** لون الرقم والعنوان. */
  text?: string;
  /** لون شارة الأيقونة. */
  icon?: string;
  /** لون الحدّ والحلقة. */
  accent?: string;
};

/** الفارغ لا يُكتب — فترث البطاقة لون الثيم بدل أن يُفرض عليها لون. */
export function tileColorVars(c: TileColors | undefined): React.CSSProperties {
  const v: Record<string, string> = {};
  if (c?.bg) v["--tile-bg"] = c.bg;
  if (c?.bg2) v["--tile-bg2"] = c.bg2;
  if (c?.text) v["--tile-text"] = c.text;
  if (c?.icon) v["--tile-icon"] = c.icon;
  if (c?.accent) v["--tile-accent"] = c.accent;
  return v as React.CSSProperties;
}

/* ------------------------------------------------------------------ */
/*  صورة داخل البطاقة                                                  */
/* ------------------------------------------------------------------ */

/**
 * موضع الصورة المرفوعة داخل البطاقة.
 * الصورة طبقة زينة لا محتوى، فهي دائماً خلف النصّ ولها شفافية مضبوطة
 * حتى لا يضيع الرقم — وهو أهمّ ما في البطاقة.
 */
export type TileArtMode =
  | "cover"   // تملأ البطاقة خلف كل شيء
  | "corner"  // في الركن البعيد كعلامة مائية
  | "side"    // عمود على الحافّة الأمامية
  | "strip"   // شريط علوي بعرض البطاقة
  | "badge";  // تحلّ محلّ أيقونة الشارة

export type TileArt = {
  image?: string;      // رابط الصورة (فارغ = بلا صورة)
  mode?: TileArtMode;  // موضعها
  opacity?: number;    // ٥..١٠٠
  blur?: number;       // ٠..١٢ بكسل
};

export const TILE_ART_MODES: { id: TileArtMode; name: string; hint: string }[] = [
  { id: "cover", name: "تملأ البطاقة", hint: "خلف كل شيء بشفافية" },
  { id: "corner", name: "علامة في الركن", hint: "صغيرة في الركن البعيد" },
  { id: "side", name: "عمود جانبي", hint: "على الحافّة الأمامية" },
  { id: "strip", name: "شريط علوي", hint: "بعرض البطاقة من فوق" },
  { id: "badge", name: "داخل الشارة", hint: "تحلّ محلّ الأيقونة" },
];

export const DEFAULT_TILE_ART: TileArt = { image: "", mode: "cover", opacity: 22, blur: 0 };

/** يُقصّ المدى فلا تصل الشفافية إلى حدّ يُخفي الرقم أو يُغرقه. */
export function tileArtVars(a: TileArt | undefined): React.CSSProperties {
  if (!a?.image) return {};
  const op = Math.max(5, Math.min(100, a.opacity ?? 22)) / 100;
  const blur = Math.max(0, Math.min(12, a.blur ?? 0));
  return {
    "--tile-art": `url(${JSON.stringify(a.image)})`,
    "--tile-art-op": String(op),
    "--tile-art-blur": `${blur}px`,
  } as React.CSSProperties;
}

/** صنف الوضع — يُضاف فقط حين توجد صورة فعلاً. */
export function tileArtClass(a: TileArt | undefined): string {
  return a?.image ? `tl-art-${a.mode ?? "cover"}` : "";
}
