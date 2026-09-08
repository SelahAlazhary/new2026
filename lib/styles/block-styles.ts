/**
 * تصاميم الأقسام غير البطاقية: الأسئلة · الدعوة · الفوتر.
 * ------------------------------------------------------------------
 * هذه الثلاثة لا تشبه شبكةَ البطاقات ولا تشبه بعضها: الأسئلةُ طيّاتٌ
 * تُفتح، والدعوةُ لوحٌ واحد، والفوترُ أعمدةُ روابط. فسجلٌّ لكلٍّ منها
 * بمحاورَ تخصّه — لو جُمعت في سجلّ واحد لخرجت خياراتٌ لا معنى لها في
 * موضعها (شبكةُ أعمدة للأسئلة؟ طيّاتٌ للفوتر؟).
 */

/* ================================================================== */
/*  قسم الأسئلة                                                        */
/* ================================================================== */

/** سطح الطيّة. */
/** «brand» = هوية المنصّة كما هي؛ الافتراضي لا يُغيّر الشكل القائم. */
export type FaqSurface = "brand" | "card" | "glass" | "outline" | "flat" | "plaque";
/** علامة الفتح. */
export type FaqMark = "chevron" | "plus" | "arrow" | "dot" | "none";
/** ترتيب الطيّات. */
export type FaqFlow = "stack" | "joined" | "spaced" | "two";
/** إبراز الطيّة المفتوحة. */
export type FaqOpen = "tint" | "border" | "lift" | "rule";

export type FaqStyle = {
  id: string; name: string; hint: string;
  surface: FaqSurface; mark: FaqMark; flow: FaqFlow; open: FaqOpen;
};

function fq(
  id: string, name: string, hint: string,
  surface: FaqSurface, mark: FaqMark, flow: FaqFlow, open: FaqOpen
): FaqStyle {
  return { id, name, hint, surface, mark, flow, open };
}

export const FAQ_STYLES: FaqStyle[] = [
  fq("classic", "الأصلي", "هوية المنصّة كما هي وسهم ينقلب", "brand", "chevron", "stack", "tint"),
  fq("classicPlus", "الكلاسيكي بعلامة", "علامة زائد تصير ناقصاً", "card", "plus", "stack", "border"),
  fq("classicSpaced", "الكلاسيكي المتباعد", "فراغ أوسع بين الطيّات", "card", "chevron", "spaced", "lift"),
  fq("glassJoined", "الزجاجي الملتحم", "طيّات ملتصقة بحدّ فاصل", "glass", "chevron", "joined", "tint"),
  fq("glassDot", "الزجاجي بنقطة", "نقطة صغيرة بدل السهم", "glass", "dot", "spaced", "rule"),
  fq("glassTwo", "الزجاجي بعمودين", "عمودان على الشاشات الواسعة", "glass", "plus", "two", "border"),
  fq("outlineArrow", "المفرَّغ", "حدّ فقط وسهم جانبي", "outline", "arrow", "stack", "border"),
  fq("outlineJoined", "المفرَّغ الملتحم", "إطار واحد يضمّ الطيّات", "outline", "chevron", "joined", "tint"),
  fq("outlineTwo", "المفرَّغ بعمودين", "مفرَّغ في عمودين", "outline", "dot", "two", "rule"),
  fq("flatRule", "المسطّر", "بلا سطح — خطٌّ يفصل الطيّات", "flat", "chevron", "joined", "rule"),
  fq("flatNone", "المجرّد", "بلا سطح ولا علامة", "flat", "none", "stack", "tint"),
  fq("flatArrow", "المسطّح بسهم", "بلا سطح وسهم جانبي", "flat", "arrow", "spaced", "border"),
  fq("plaqueGold", "اللوح", "أركان مقصوصة كلوح المخطوط", "plaque", "chevron", "spaced", "border"),
  fq("plaquePlus", "اللوح بعلامة", "لوح وعلامة زائد", "plaque", "plus", "stack", "lift"),
  fq("plaqueTwo", "اللوح بعمودين", "ألواح في عمودين", "plaque", "dot", "two", "tint"),
  fq("cardLift", "المرتفع", "الطيّة المفتوحة ترتفع", "card", "arrow", "spaced", "lift"),
  fq("cardRule", "المسطَّر بالبطاقات", "خطّ مذهّب تحت المفتوحة", "card", "dot", "stack", "rule"),
  fq("cardTwo", "البطاقات بعمودين", "بطاقات في عمودين", "card", "none", "two", "lift"),
  fq("glassLift", "الزجاجي المرتفع", "زجاج والمفتوحة ترتفع", "glass", "arrow", "stack", "lift"),
  fq("minimal", "المبسّط", "أخفّ ما يكون — خطّ وعلامة نقطة", "flat", "dot", "joined", "border"),
];

export const DEFAULT_FAQ_STYLE = FAQ_STYLES[0].id;
export function findFaqStyle(id?: string): FaqStyle {
  return FAQ_STYLES.find((x) => x.id === id) ?? FAQ_STYLES[0];
}
export function faqClass(x: FaqStyle): string {
  return `fq-surface-${x.surface} fq-mark-${x.mark} fq-flow-${x.flow} fq-open-${x.open}`;
}

/* ================================================================== */
/*  قسم الدعوة                                                         */
/* ================================================================== */

/** شكل لوح الدعوة. */
export type CtaShape = "round" | "plaque" | "arch" | "ticket" | "band" | "split";
/** خلفية اللوح. */
/** «brand» = لوح الهوية المتوهّج كما هو. */
export type CtaFill = "brand" | "ink" | "gradient" | "glass" | "outline" | "shamsa";
/** ترتيب المحتوى. */
export type CtaLayout = "center" | "split" | "stack";
/** كثافة الزخرفة. */
export type CtaDecor = "full" | "soft" | "none";

export type CtaStyle = {
  id: string; name: string; hint: string;
  shape: CtaShape; fill: CtaFill; layout: CtaLayout; decor: CtaDecor;
};

function ct(
  id: string, name: string, hint: string,
  shape: CtaShape, fill: CtaFill, layout: CtaLayout, decor: CtaDecor
): CtaStyle {
  return { id, name, hint, shape, fill, layout, decor };
}

export const CTA_STYLES: CtaStyle[] = [
  ct("classic", "الأصلي", "لوح الهوية المتوهّج كما هو", "round", "brand", "center", "full"),
  ct("classicSoft", "الكلاسيكي الهادئ", "زخرفة أخفّ", "round", "ink", "center", "soft"),
  ct("classicSplit", "الكلاسيكي المنقسم", "النصّ يمين والأزرار يسار", "round", "ink", "split", "full"),
  ct("gradientCenter", "المتدرّج", "تدرّج بين لونين", "round", "gradient", "center", "full"),
  ct("gradientBand", "الشريط المتدرّج", "شريط بعرض الصفحة", "band", "gradient", "split", "soft"),
  ct("gradientArch", "القوس المتدرّج", "حافّة علوية مقوّسة", "arch", "gradient", "center", "full"),
  ct("plaqueInk", "اللوح", "أركان مقصوصة كلوح المخطوط", "plaque", "ink", "center", "full"),
  ct("plaqueGlass", "اللوح الزجاجي", "لوح مقصوص زجاجي", "plaque", "glass", "split", "soft"),
  ct("archInk", "القوس", "حافّة مقوّسة كالمحراب", "arch", "ink", "stack", "full"),
  ct("archShamsa", "قوس الشمسة", "شمسة مضيئة خلف القوس", "arch", "shamsa", "center", "full"),
  ct("ticketInk", "التذكرة", "حزّان جانبيان كتذكرة", "ticket", "ink", "center", "soft"),
  ct("ticketGradient", "التذكرة المتدرّجة", "تذكرة بتدرّج", "ticket", "gradient", "split", "none"),
  ct("bandInk", "الشريط", "شريط ممتدّ بلا حوافّ", "band", "ink", "split", "soft"),
  ct("bandOutline", "الشريط المفرَّغ", "شريط بحدّ فقط", "band", "outline", "center", "none"),
  ct("glassCenter", "الزجاجي", "لوح زجاجي مضبّب", "round", "glass", "center", "soft"),
  ct("glassStack", "الزجاجي المتراكب", "أزرار فوق بعضها", "round", "glass", "stack", "full"),
  ct("outlineCenter", "المفرَّغ", "حدّ فقط بلا تعبئة", "round", "outline", "center", "soft"),
  ct("outlineSplit", "المفرَّغ المنقسم", "مفرَّغ ومنقسم", "round", "outline", "split", "none"),
  ct("splitShamsa", "المنقسم بالشمسة", "شمسة وتقسيم أفقي", "split", "shamsa", "split", "full"),
  ct("minimal", "المبسّط", "بلا شكل ولا زخرفة", "band", "outline", "stack", "none"),
];

export const DEFAULT_CTA_STYLE = CTA_STYLES[0].id;
export function findCtaStyle(id?: string): CtaStyle {
  return CTA_STYLES.find((x) => x.id === id) ?? CTA_STYLES[0];
}
export function ctaClass(x: CtaStyle): string {
  return `ct-shape-${x.shape} ct-fill-${x.fill} ct-layout-${x.layout} ct-decor-${x.decor}`;
}

/* ================================================================== */
/*  الفوتر                                                             */
/* ================================================================== */

/** توزيع أعمدة الفوتر. */
export type FtCols = "wide" | "even" | "stack" | "center" | "two";
/** الفاصل أعلى الفوتر. */
export type FtEdge = "line" | "gold" | "arch" | "zigzag" | "none";
/** خلفية الفوتر. */
export type FtFill = "surface" | "ink" | "muted" | "gradient";

export type FooterStyle = {
  id: string; name: string; hint: string;
  cols: FtCols; edge: FtEdge; fill: FtFill;
};

function ft(
  id: string, name: string, hint: string,
  cols: FtCols, edge: FtEdge, fill: FtFill
): FooterStyle {
  return { id, name, hint, cols, edge, fill };
}

export const FOOTER_STYLES: FooterStyle[] = [
  ft("classic", "الكلاسيكي", "عمود هوية عريض وخطّ فاصل", "wide", "line", "surface"),
  ft("classicGold", "الكلاسيكي المذهّب", "فاصل ذهبي", "wide", "gold", "surface"),
  ft("classicMuted", "الكلاسيكي الرمادي", "خلفية أهدأ", "wide", "line", "muted"),
  ft("evenLine", "المتساوي", "أعمدة متساوية العرض", "even", "line", "surface"),
  ft("evenGold", "المتساوي المذهّب", "أعمدة متساوية وفاصل ذهبي", "even", "gold", "muted"),
  ft("evenInk", "المتساوي الحبري", "أعمدة على لوح الحبر", "even", "none", "ink"),
  ft("archInk", "القوس الحبري", "حافّة علوية مقوّسة", "wide", "arch", "ink"),
  ft("archSurface", "القوس", "قوس على خلفية الصفحة", "even", "arch", "surface"),
  ft("zigzagGold", "المسنَّن", "حافّة علوية مسنّنة", "wide", "zigzag", "muted"),
  ft("zigzagInk", "المسنَّن الحبري", "مسنّن على الحبر", "even", "zigzag", "ink"),
  ft("stackLine", "المتراكب", "أعمدة فوق بعضها", "stack", "line", "surface"),
  ft("stackGold", "المتراكب المذهّب", "متراكب وفاصل ذهبي", "stack", "gold", "muted"),
  ft("centerLine", "المتمركز", "كل شيء في الوسط", "center", "line", "surface"),
  ft("centerGold", "المتمركز المذهّب", "متمركز وفاصل ذهبي", "center", "gold", "surface"),
  ft("centerInk", "المتمركز الحبري", "متمركز على لوح الحبر", "center", "none", "ink"),
  ft("twoLine", "العمودان", "عمودان فقط", "two", "line", "surface"),
  ft("twoMuted", "العمودان الهادئان", "عمودان بخلفية أهدأ", "two", "gold", "muted"),
  ft("gradientWide", "المتدرّج", "تدرّج خفيف خلف الفوتر", "wide", "none", "gradient"),
  ft("gradientCenter", "المتدرّج المتمركز", "تدرّج ومحتوى متمركز", "center", "arch", "gradient"),
  ft("minimal", "المبسّط", "سطر واحد بلا أعمدة ولا فاصل", "center", "none", "surface"),
];

export const DEFAULT_FOOTER_STYLE = FOOTER_STYLES[0].id;
export function findFooterStyle(id?: string): FooterStyle {
  return FOOTER_STYLES.find((x) => x.id === id) ?? FOOTER_STYLES[0];
}
export function footerClass(x: FooterStyle): string {
  return `ft-cols-${x.cols} ft-edge-${x.edge} ft-fill-${x.fill}`;
}
