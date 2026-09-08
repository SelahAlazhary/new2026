/**
 * إطارات الأيقونات.
 * ------------------------------------------------------------------
 * الأيقونةُ في المنصّة لا تقف عاريةً: تحتها لوحٌ صغير يفصلها عمّا حولها
 * ويعطيها وزناً. وهذا اللوحُ كان مكتوباً في كلّ موضعٍ على حدة — في
 * بطاقة المؤشّر شيءٌ وفي بطاقة الميزة شيءٌ آخر — فلا يتغيّر إلا بتعديل
 * أربعة ملفّات.
 *
 * فصار سجلّاً واحداً: عشرون إطاراً تُركَّب من شكلٍ وتعبئةٍ وحدّ، تُكتب
 * أصنافُها مرّةً في الجذر فتسري على كلّ أيقونةٍ في المنصّة.
 *
 * واللونُ خارج التصميم كعادة هذه السجلّات: الشكلُ هيئةٌ واللونُ هوية.
 */

export type IconShape =
  | "none" | "soft" | "round" | "circle" | "squircle"
  | "plaque" | "arch" | "shamsa" | "shield" | "ticket" | "hex";

export type IconFill = "none" | "tint" | "solid" | "gradient" | "glass";

export type IconEdge = "none" | "hair" | "gold" | "thick" | "dash" | "inset" | "raise";

export type IconFrame = {
  id: string;
  name: string;
  hint: string;
  shape: IconShape;
  fill: IconFill;
  edge: IconEdge;
};

function f(
  id: string, name: string, hint: string,
  shape: IconShape, fill: IconFill, edge: IconEdge
): IconFrame {
  return { id, name, hint, shape, fill, edge };
}

export const ICON_FRAMES: IconFrame[] = [
  f("bare", "بلا إطار", "الأيقونة وحدَها", "none", "none", "none"),
  f("soft", "الناعم", "مربّع باستدارة خفيفة", "soft", "tint", "none"),
  f("round", "المستدير", "استدارة واسعة", "round", "tint", "none"),
  f("circle", "الدائري", "دائرةٌ كاملة", "circle", "tint", "none"),
  f("squircle", "المربّع الدائري", "بين المربّع والدائرة", "squircle", "tint", "none"),
  f("plaque", "لوح المخطوط", "أركان مقصوصة", "plaque", "tint", "gold"),
  f("arch", "المحراب", "قوسٌ من أعلى", "arch", "tint", "none"),
  f("shamsa", "الشمسة", "ثمانيُّ الأضلاع", "shamsa", "tint", "gold"),
  f("shield", "الدرع", "مدبَّبٌ من أسفل", "shield", "solid", "none"),
  f("ticket", "التذكرة", "حزّان جانبيان", "ticket", "tint", "hair"),
  f("hex", "السداسي", "ستّةُ أضلاع", "hex", "tint", "none"),
  f("outline", "المفرَّغ", "حدٌّ بلا تعبئة", "round", "none", "thick"),
  f("hairline", "الخيط", "حدٌّ رفيعٌ وسطحٌ شفّاف", "soft", "none", "hair"),
  f("goldRing", "الحلقة المذهّبة", "دائرةٌ بخيطٍ ذهبي", "circle", "none", "gold"),
  f("solid", "المصمت", "لونُ الهوية كاملاً", "round", "solid", "none"),
  f("gradient", "المتدرّج", "تدرّجٌ بين لونين", "round", "gradient", "none"),
  f("glassy", "الزجاجي", "سطحٌ مضبّب", "round", "glass", "hair"),
  f("shadowed", "الغائر", "ظلٌّ داخليٌّ يُغوِّره", "round", "tint", "inset"),
  f("raised", "البارز", "ظلٌّ تحته يرفعه", "round", "solid", "raise"),
  f("dashed", "المتقطّع", "حدٌّ متقطّع", "round", "none", "dash"),
];

export const DEFAULT_ICON_FRAME = ICON_FRAMES[0].id;

export function findIconFrame(id?: string): IconFrame {
  return ICON_FRAMES.find((x) => x.id === id) ?? ICON_FRAMES[0];
}

export function iconFrameClass(x: IconFrame): string {
  return `ic-shape-${x.shape} ic-fill-${x.fill} ic-edge-${x.edge}`;
}

/** ألوانُ الإطار — الفارغُ يرث لون الثيم فلا يُفرض لونٌ لم يُطلب. */
export function iconFrameVars(
  c: { bg?: string; bg2?: string; fg?: string; edge?: string } | undefined
): React.CSSProperties {
  const v: Record<string, string> = {};
  if (c?.bg) v["--ic-bg"] = c.bg;
  if (c?.bg2) v["--ic-bg2"] = c.bg2;
  if (c?.fg) v["--ic-fg"] = c.fg;
  if (c?.edge) v["--ic-edge"] = c.edge;
  return v as React.CSSProperties;
}
