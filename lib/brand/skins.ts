/**
 * محرّك مظهر بوابة الطالب.
 * ------------------------------------------------------------------
 * المظهر مفصول عن الكود تماماً: الثيم مجموعة متغيّرات CSS + زخرفة SVG،
 * والتخطيط مجموعة خيارات ترتيب. كلاهما بيانات لا شيفرة، فإضافة مظهر
 * جديد سطر في مصفوفة لا مكوّن جديد.
 *
 * لماذا متغيّرات مضمّنة بدل أصناف CSS؟ لأن عشرين ثيماً تعني عشرين كتلة
 * في ملف الأنماط تُحمَّل كلها لكل زائر. الحقن المضمّن يُرسل ثيماً واحداً
 * فقط — المستخدَم — فلا تُثقَل الصفحة بما لا يُعرض.
 *
 * الألوان بصيغة "H S% L%" (أجزاء HSL بلا الدالة) لأن نظام الثيم كلّه
 * مبنيّ عليها: hsl(var(--primary) / 0.4) لا تعمل مع لون جاهز.
 */

export type OrnamentId =
  | "kufi" | "shamsa" | "arabesque" | "waves" | "grid" | "stars"
  | "hexes" | "rays" | "knots" | "dots" | "none";

export type CardStyle = "plaque" | "soft" | "glass" | "outline" | "elevated";

export type StudentSkin = {
  id: string;
  name: string;
  /** وصف قصير يظهر في المنتقي. */
  hint: string;
  dark: boolean;
  ornament: OrnamentId;
  card: CardStyle;
  /** متغيّرات الثيم — أجزاء HSL. */
  vars: {
    background: string;
    foreground: string;
    card: string;
    muted: string;
    mutedForeground: string;
    border: string;
    primary: string;
    accent: string;
    glow: string;
    gold: string;
    goldDeep: string;
    goldLight: string;
  };
};

/** يبني مجموعة المتغيّرات من ستّة ألوان أساسية — يقلّل التكرار ويمنع السهو. */
function skin(
  id: string,
  name: string,
  hint: string,
  dark: boolean,
  ornament: OrnamentId,
  card: CardStyle,
  v: {
    bg: string; fg: string; card: string; muted: string; mutedFg: string; border: string;
    primary: string; accent: string; glow: string; gold: string; goldDeep: string; goldLight: string;
  }
): StudentSkin {
  return {
    id, name, hint, dark, ornament, card,
    vars: {
      background: v.bg, foreground: v.fg, card: v.card, muted: v.muted,
      mutedForeground: v.mutedFg, border: v.border, primary: v.primary,
      accent: v.accent, glow: v.glow, gold: v.gold, goldDeep: v.goldDeep, goldLight: v.goldLight,
    },
  };
}

/* ------------------------------------------------------------------ */
/*  عشرون مظهراً — كل واحد لوحة لونية وزخرفة وأسلوب بطاقات مختلف        */
/* ------------------------------------------------------------------ */

export const STUDENT_SKINS: StudentSkin[] = [
  skin("midad", "مِداد", "حبر نيلي وتذهيب — مظهر المنصّة الأصل", false, "kufi", "plaque", {
    bg: "38 42% 96%", fg: "224 44% 13%", card: "40 56% 99%", muted: "38 28% 92%",
    mutedFg: "222 12% 42%", border: "36 24% 85%", primary: "226 60% 34%",
    accent: "38 76% 50%", glow: "226 72% 46%", gold: "38 76% 50%", goldDeep: "32 68% 40%", goldLight: "44 88% 66%",
  }),
  skin("laylMidad", "ليل المِداد", "الحبر نفسه في وضع داكن", true, "kufi", "plaque", {
    bg: "223 46% 7%", fg: "40 24% 94%", card: "223 38% 11%", muted: "223 30% 16%",
    mutedFg: "220 12% 66%", border: "223 26% 21%", primary: "226 66% 52%",
    accent: "40 84% 58%", glow: "226 78% 60%", gold: "40 84% 58%", goldDeep: "34 72% 46%", goldLight: "46 92% 72%",
  }),
  skin("andalus", "أندلسي", "زيتوني وذهب عتيق", false, "arabesque", "soft", {
    bg: "60 26% 96%", fg: "162 34% 14%", card: "60 40% 99%", muted: "70 20% 92%",
    mutedFg: "160 10% 40%", border: "70 18% 85%", primary: "162 44% 25%",
    accent: "40 64% 50%", glow: "160 50% 34%", gold: "40 64% 50%", goldDeep: "34 60% 38%", goldLight: "44 78% 64%",
  }),
  skin("rumman", "رُمّاني", "عنّابي ونحاس", false, "knots", "plaque", {
    bg: "20 34% 96%", fg: "348 40% 16%", card: "24 50% 99%", muted: "18 26% 92%",
    mutedFg: "348 10% 42%", border: "18 22% 86%", primary: "348 56% 34%",
    accent: "26 74% 52%", glow: "350 64% 44%", gold: "26 74% 52%", goldDeep: "20 66% 40%", goldLight: "32 86% 66%",
  }),
  skin("nile", "نِيلي", "أزرق المحبرة وذهب فاتح", false, "waves", "glass", {
    bg: "200 40% 96%", fg: "202 44% 14%", card: "195 45% 99%", muted: "200 30% 92%",
    mutedFg: "202 12% 42%", border: "200 24% 85%", primary: "199 88% 28%",
    accent: "43 84% 54%", glow: "196 86% 40%", gold: "43 84% 54%", goldDeep: "36 72% 42%", goldLight: "46 92% 70%",
  }),
  skin("sahra", "صحراء", "رمل ونخيل — دافئ وهادئ", false, "dots", "soft", {
    bg: "36 46% 94%", fg: "28 36% 18%", card: "38 56% 98%", muted: "34 32% 90%",
    mutedFg: "28 12% 44%", border: "34 26% 84%", primary: "24 52% 38%",
    accent: "38 74% 52%", glow: "28 60% 48%", gold: "38 74% 52%", goldDeep: "30 66% 40%", goldLight: "44 86% 68%",
  }),
  skin("zaytoon", "زيتون", "أخضر ناعم بحبر داكن", false, "hexes", "outline", {
    bg: "96 22% 96%", fg: "140 30% 14%", card: "100 34% 99%", muted: "100 18% 92%",
    mutedFg: "140 8% 42%", border: "100 16% 85%", primary: "150 42% 28%",
    accent: "84 52% 42%", glow: "150 48% 36%", gold: "84 52% 42%", goldDeep: "88 46% 32%", goldLight: "80 62% 56%",
  }),
  skin("banafsaj", "بنفسج", "بنفسجي ملكي وذهب", false, "stars", "elevated", {
    bg: "270 30% 97%", fg: "268 40% 15%", card: "280 40% 99%", muted: "270 22% 93%",
    mutedFg: "268 10% 44%", border: "270 20% 87%", primary: "266 54% 40%",
    accent: "42 82% 56%", glow: "268 62% 52%", gold: "42 82% 56%", goldDeep: "36 70% 44%", goldLight: "48 90% 70%",
  }),
  skin("laylBanafsaj", "ليل البنفسج", "بنفسجي داكن بلمعة ذهبية", true, "stars", "glass", {
    bg: "268 42% 8%", fg: "280 20% 94%", card: "268 34% 12%", muted: "268 28% 17%",
    mutedFg: "272 12% 66%", border: "268 24% 22%", primary: "268 70% 62%",
    accent: "44 88% 62%", glow: "272 78% 66%", gold: "44 88% 62%", goldDeep: "38 76% 48%", goldLight: "50 94% 74%",
  }),
  skin("fayrouz", "فيروز", "أزرق مخضرّ مشرق", false, "waves", "soft", {
    bg: "185 34% 96%", fg: "190 40% 14%", card: "185 42% 99%", muted: "185 26% 92%",
    mutedFg: "190 10% 42%", border: "185 22% 85%", primary: "186 62% 30%",
    accent: "38 80% 52%", glow: "184 68% 40%", gold: "38 80% 52%", goldDeep: "32 70% 42%", goldLight: "44 88% 68%",
  }),
  skin("qirmiz", "قرمز", "أحمر عميق وورق كريمي", false, "knots", "elevated", {
    bg: "30 40% 96%", fg: "356 42% 16%", card: "34 52% 99%", muted: "28 30% 92%",
    mutedFg: "356 10% 42%", border: "28 24% 86%", primary: "356 62% 38%",
    accent: "32 78% 52%", glow: "358 70% 48%", gold: "32 78% 52%", goldDeep: "24 68% 42%", goldLight: "38 88% 68%",
  }),
  skin("laylQirmiz", "ليل القرمز", "أحمر داكن بحدّ نحاسي", true, "knots", "plaque", {
    bg: "356 34% 8%", fg: "30 22% 94%", card: "356 28% 12%", muted: "356 24% 17%",
    mutedFg: "10 12% 66%", border: "356 22% 22%", primary: "356 68% 52%",
    accent: "32 84% 58%", glow: "358 76% 58%", gold: "32 84% 58%", goldDeep: "26 74% 46%", goldLight: "40 92% 72%",
  }),
  skin("rukham", "رخام", "أبيض ورمادي ناعم — أقل زخرفة", false, "grid", "outline", {
    bg: "220 16% 97%", fg: "220 24% 16%", card: "0 0% 100%", muted: "220 14% 93%",
    mutedFg: "220 8% 44%", border: "220 14% 88%", primary: "220 40% 32%",
    accent: "220 30% 52%", glow: "220 48% 44%", gold: "40 40% 58%", goldDeep: "36 36% 46%", goldLight: "44 52% 72%",
  }),
  skin("faham", "فحم", "رمادي داكن بحدّ ذهبي رفيع", true, "grid", "outline", {
    bg: "220 18% 9%", fg: "220 14% 94%", card: "220 16% 13%", muted: "220 14% 18%",
    mutedFg: "220 8% 64%", border: "220 14% 23%", primary: "220 46% 60%",
    accent: "42 76% 58%", glow: "220 56% 62%", gold: "42 76% 58%", goldDeep: "36 66% 46%", goldLight: "48 86% 72%",
  }),
  skin("kahraman", "كهرمان", "عسلي دافئ بحبر بنّي", false, "rays", "soft", {
    bg: "42 52% 95%", fg: "28 42% 18%", card: "44 60% 99%", muted: "40 36% 91%",
    mutedFg: "28 14% 44%", border: "40 28% 85%", primary: "28 58% 34%",
    accent: "40 88% 50%", glow: "34 74% 46%", gold: "40 88% 50%", goldDeep: "32 76% 40%", goldLight: "46 94% 68%",
  }),
  skin("bahr", "بحر", "أزرق ليلي عميق", true, "waves", "glass", {
    bg: "212 52% 8%", fg: "205 24% 94%", card: "212 42% 12%", muted: "212 34% 17%",
    mutedFg: "208 14% 66%", border: "212 30% 22%", primary: "205 76% 56%",
    accent: "42 84% 60%", glow: "202 84% 60%", gold: "42 84% 60%", goldDeep: "36 72% 48%", goldLight: "48 92% 74%",
  }),
  skin("nakhil", "نخيل", "أخضر غامق وذهب — هادئ للعين", true, "arabesque", "plaque", {
    bg: "158 34% 8%", fg: "60 18% 94%", card: "158 28% 12%", muted: "158 24% 17%",
    mutedFg: "150 12% 66%", border: "158 22% 22%", primary: "156 52% 46%",
    accent: "44 82% 58%", glow: "154 60% 50%", gold: "44 82% 58%", goldDeep: "38 70% 46%", goldLight: "50 90% 72%",
  }),
  skin("warda", "وردة", "وردي هادئ وذهب فاتح", false, "dots", "elevated", {
    bg: "340 40% 97%", fg: "340 34% 18%", card: "345 50% 99%", muted: "340 28% 94%",
    mutedFg: "340 10% 46%", border: "340 24% 88%", primary: "338 48% 44%",
    accent: "38 80% 56%", glow: "340 58% 54%", gold: "38 80% 56%", goldDeep: "32 68% 46%", goldLight: "44 90% 72%",
  }),
  skin("sadaf", "صدف", "لؤلؤي بارد بلمسات فيروزية", false, "shamsa", "glass", {
    bg: "195 28% 97%", fg: "205 30% 16%", card: "195 40% 99%", muted: "195 20% 93%",
    mutedFg: "205 10% 44%", border: "195 18% 87%", primary: "198 48% 36%",
    accent: "176 52% 44%", glow: "192 58% 46%", gold: "42 62% 58%", goldDeep: "36 56% 46%", goldLight: "46 74% 72%",
  }),
  skin("sada", "سادة", "بلا زخرفة — تركيز كامل على المحتوى", false, "none", "outline", {
    bg: "40 20% 97%", fg: "225 20% 16%", card: "0 0% 100%", muted: "40 14% 93%",
    mutedFg: "225 8% 46%", border: "40 14% 88%", primary: "225 44% 34%",
    accent: "38 60% 50%", glow: "225 50% 44%", gold: "38 60% 50%", goldDeep: "32 54% 40%", goldLight: "44 72% 66%",
  }),
];

export const DEFAULT_SKIN = STUDENT_SKINS[0].id;

export function findSkin(id?: string): StudentSkin {
  return STUDENT_SKINS.find((s) => s.id === id) ?? STUDENT_SKINS[0];
}

/* ------------------------------------------------------------------ */
/*  اشتقاق النسخة المقابلة (فاتح ↔ داكن)                                */
/* ------------------------------------------------------------------ */

/** يفكّ "H S% L%" إلى أجزائه. */
function parse(v: string): [number, number, number] {
  const m = /^(\d{1,3})\s+(\d{1,3})%\s+(\d{1,3})%$/.exec(v.trim());
  if (!m) return [0, 0, 50];
  return [Number(m[1]), Number(m[2]), Number(m[3])];
}
const build = (h: number, sat: number, l: number) =>
  `${Math.round(h)} ${Math.round(Math.max(0, Math.min(100, sat)))}% ${Math.round(Math.max(0, Math.min(100, l)))}%`;

/** إضاءة نسبية بمعادلة WCAG — تُستخدم لاختيار لون النصّ لا لتقديره بالعين. */
function relLum(v: string): number {
  const [h, sPct, lPct] = parse(v);
  const S = sPct / 100, L = lPct / 100;
  const C = (1 - Math.abs(2 * L - 1)) * S;
  const X = C * (1 - Math.abs(((h / 60) % 2) - 1));
  const m = L - C / 2;
  let r = 0, g = 0, b = 0;
  if (h < 60) [r, g, b] = [C, X, 0];
  else if (h < 120) [r, g, b] = [X, C, 0];
  else if (h < 180) [r, g, b] = [0, C, X];
  else if (h < 240) [r, g, b] = [0, X, C];
  else if (h < 300) [r, g, b] = [X, 0, C];
  else [r, g, b] = [C, 0, X];
  const lin = (c: number) => {
    const x = c + m;
    return x <= 0.03928 ? x / 12.92 : Math.pow((x + 0.055) / 1.055, 2.4);
  };
  return 0.2126 * lin(r) + 0.7152 * lin(g) + 0.0722 * lin(b);
}

const contrast = (a: string, b: string) => {
  const x = relLum(a), y = relLum(b);
  return (Math.max(x, y) + 0.05) / (Math.min(x, y) + 0.05);
};

/**
 * لون النصّ فوق سطح ملوّن — أبيض أو حبر داكن، أيّهما أوضح.
 * لا يُكتب الأبيض متحوتاً: بعض الثيمات حبرها فاتح (بحر، نخيل، فيروز)
 * فيسقط الأبيض فوقه تحت عتبة WCAG ويصير النصّ غير مقروء.
 */
export function bestOn(surface: string): string {
  const white = "0 0% 100%";
  const ink = "224 44% 10%";
  return contrast(white, surface) >= contrast(ink, surface) ? white : ink;
}

/**
 * يضمن أن سطحاً ملوّناً يحمل نصّاً مقروءاً.
 * بعض الألوان تقع في «المنطقة الوسطى» حيث لا الأبيض ولا الحبر يجتاز
 * العتبة (٤٫٥). فبدل قبول نصّ باهت، تُخفَّض إضاءة اللون خطوة خطوة حتى
 * يجتاز الأبيض — الصبغة تبقى كما هي فلا تتغيّر هويّة الثيم، وحدها
 * الإضاءة تتحرّك بالقدر اللازم.
 */
export function ensureReadable(surface: string, min = 4.6): string {
  const [h, sat, l] = parse(surface);
  for (let step = 0; step <= 24; step++) {
    const cand = build(h, sat, Math.max(8, l - step * 2));
    if (contrast("0 0% 100%", cand) >= min) return cand;
  }
  return build(h, sat, 8);
}

/** يضبط الإضاءة مع إبقاء الصبغة والتشبّع (مع تعديل طفيف للتشبّع). */
function at(v: string, l: number, satMul = 1): string {
  const [h, sat] = parse(v);
  return build(h, sat * satMul, l);
}

/**
 * يشتقّ النسخة الداكنة من لوحة فاتحة.
 * الأسطح تُقلب إضاءتها والألوان الدالّة تُرفع إضاءتها لتبقى مقروءة على
 * الداكن — رفع الإضاءة ضروري: لون بإضاءة ٣٠٪ يصلح نصّاً على ورق أبيض
 * ولا يُرى على خلفية بإضاءة ٨٪.
 */
export function deriveDark(v: StudentSkin["vars"]): StudentSkin["vars"] {
  return {
    background: at(v.background, 8, 1.1),
    foreground: at(v.foreground, 94, 0.5),
    card: at(v.background, 12, 1.0),
    muted: at(v.background, 17, 0.9),
    mutedForeground: at(v.mutedForeground, 66, 0.7),
    border: at(v.background, 22, 0.8),
    /* الحبر يُرفع قليلاً ليُرى على الخلفية الداكنة، لكن بسقف: لو ارتفع
       أكثر سقط تباين النصّ الأبيض فوقه — وهو أهمّ استعمال له (لوح
       الترحيب والأزرار الأساسية). القيمتان مقيستان بمعادلة WCAG. */
    primary: at(v.primary, Math.min(42, Math.max(32, parse(v.primary)[2] + 12)), 1),
    accent: at(v.accent, Math.max(58, parse(v.accent)[2] + 8), 1),
    glow: at(v.glow, Math.max(58, parse(v.glow)[2] + 16), 1),
    gold: at(v.gold, Math.max(58, parse(v.gold)[2] + 8), 1),
    goldDeep: at(v.goldDeep, Math.max(46, parse(v.goldDeep)[2] + 6), 1),
    goldLight: at(v.goldLight, Math.max(72, parse(v.goldLight)[2] + 6), 1),
  };
}

/** يشتقّ النسخة الفاتحة من لوحة داكنة — العملية المعاكسة. */
export function deriveLight(v: StudentSkin["vars"]): StudentSkin["vars"] {
  return {
    background: at(v.background, 96, 0.8),
    foreground: at(v.foreground, 14, 2.2),
    card: at(v.background, 99, 0.6),
    muted: at(v.background, 92, 0.7),
    mutedForeground: at(v.mutedForeground, 42, 1.2),
    border: at(v.background, 86, 0.6),
    primary: at(v.primary, Math.min(38, parse(v.primary)[2] - 14), 1),
    accent: at(v.accent, Math.min(52, parse(v.accent)[2] - 6), 1),
    glow: at(v.glow, Math.min(46, parse(v.glow)[2] - 12), 1),
    gold: at(v.gold, Math.min(52, parse(v.gold)[2] - 6), 1),
    goldDeep: at(v.goldDeep, Math.min(42, parse(v.goldDeep)[2] - 4), 1),
    goldLight: at(v.goldLight, Math.min(68, parse(v.goldLight)[2] - 4), 1),
  };
}

/** النسختان معاً — المعرَّفة يدوياً والمشتقّة. */
export function skinModes(s: StudentSkin): { light: StudentSkin["vars"]; dark: StudentSkin["vars"] } {
  return s.dark
    ? { dark: s.vars, light: deriveLight(s.vars) }
    : { light: s.vars, dark: deriveDark(s.vars) };
}

/** يبني كتلة أنماط لثيم واحد بنسختيه — تُحقن كوسم style واحد. */
export function skinCss(s: StudentSkin): string {
  const { light, dark } = skinModes(s);
  const decl = (raw: StudentSkin["vars"]) => {
    /* الحبر مقروءاً دائماً: هو خلفية لوح الترحيب والأزرار الأساسية. */
    const v = { ...raw, primary: ensureReadable(raw.primary) };
    return [
      `--background:${v.background}`,
      `--foreground:${v.foreground}`,
      `--card:${v.card}`,
      `--card-foreground:${v.foreground}`,
      `--muted:${v.muted}`,
      `--muted-foreground:${v.mutedForeground}`,
      `--border:${v.border}`,
      `--primary:${v.primary}`,
      `--primary-foreground:${bestOn(v.primary)}`,
      `--accent:${v.accent}`,
      `--accent-foreground:${v.foreground}`,
      `--glow:${v.glow}`,
      `--gold:${v.gold}`,
      `--gold-deep:${v.goldDeep}`,
      `--gold-light:${v.goldLight}`,
    ].join(";");
  };

  /* النسخة الفاتحة هي الأساس، والداكنة تُطبَّق حين يختار الزائر الداكن —
     فيبقى تفضيله محترماً مهما كان الثيم الذي اختاره الأدمن. */
  return (
    `[data-skin="${s.id}"]{${decl(light)}}` +
    `[data-layout="dark"] [data-skin="${s.id}"]{${decl(dark)}}`
  );
}

/** يحوّل الثيم إلى متغيّرات CSS جاهزة للحقن على عنصر واحد. */
export function skinVars(s: StudentSkin): React.CSSProperties {
  const v = s.vars;
  return {
    ["--background" as string]: v.background,
    ["--foreground" as string]: v.foreground,
    ["--card" as string]: v.card,
    ["--card-foreground" as string]: v.foreground,
    ["--muted" as string]: v.muted,
    ["--muted-foreground" as string]: v.mutedForeground,
    ["--border" as string]: v.border,
    ["--primary" as string]: v.primary,
    ["--primary-foreground" as string]: "0 0% 100%",
    ["--accent" as string]: v.accent,
    ["--accent-foreground" as string]: v.foreground,
    ["--glow" as string]: v.glow,
    ["--gold" as string]: v.gold,
    ["--gold-deep" as string]: v.goldDeep,
    ["--gold-light" as string]: v.goldLight,
  };
}

/* ------------------------------------------------------------------ */
/*  عشرون تخطيطاً — ترتيب العناصر داخل البوابة                          */
/* ------------------------------------------------------------------ */

/** شكل لوح الترحيب. */
/** «azhari» لوحٌ كحليٌّ بزخرفةٍ هندسيةٍ وبطاقاتٍ تطفو على حافّته. */
export type HeaderStyle = "banner" | "compact" | "split" | "stacked" | "minimal" | "azhari";
/** شكل صفّ المؤشّرات. */
export type StatsStyle = "row" | "grid" | "inline" | "rail";
/** شكل بطاقات الكورسات. */
/**
 * شكلُ بطاقات الكورسات.
 * و«الصفوف» أُضيفت لأنّ الأربعةَ قبلها كلُّها تعرض غلافَ الكورس — بعرضٍ
 * أوسعَ أو أضيق. ومن عنده كورساتٌ كثيرةٌ لا يريد لكلٍّ لوحةً بحجم كفّ،
 * بل سطراً يُقرأ: شارةٌ وعنوانٌ وخطُّ تقدّم.
 */
export type CardsStyle = "list" | "grid2" | "grid3" | "compact" | "rows";

export type StudentLayout = {
  id: string;
  name: string;
  hint: string;
  header: HeaderStyle;
  stats: StatsStyle;
  cards: CardsStyle;
  /** المؤشّرات داخل لوح الترحيب أم تحته. */
  statsInHeader: boolean;
};

function lay(
  id: string, name: string, hint: string,
  header: HeaderStyle, stats: StatsStyle, cards: CardsStyle, statsInHeader: boolean
): StudentLayout {
  return { id, name, hint, header, stats, cards, statsInHeader };
}

export const STUDENT_LAYOUTS: StudentLayout[] = [
  lay("classic", "الكلاسيكي", "لوح ترحيب عريض والمؤشّرات بداخله", "banner", "row", "grid2", true),
  lay("classicWide", "الكلاسيكي الواسع", "نفس الترتيب بثلاثة أعمدة للكورسات", "banner", "row", "grid3", true),
  lay("focus", "التركيز", "ترحيب مضغوط وكورسات قائمة", "compact", "inline", "list", true),
  lay("split", "المنقسم", "الترحيب يمين والتقدّم يسار", "split", "grid", "grid2", false),
  lay("splitWide", "المنقسم الواسع", "منقسم بثلاثة أعمدة للكورسات", "split", "grid", "grid3", false),
  lay("stack", "المتراكب", "ترحيب فوق ومؤشّرات تحته منفصلة", "stacked", "grid", "grid2", false),
  lay("rail", "الشريط الجانبي", "المؤشّرات شريط رأسي بجانب المحتوى", "compact", "rail", "grid2", false),
  lay("railWide", "الشريط الواسع", "شريط رأسي وثلاثة أعمدة", "compact", "rail", "grid3", false),
  lay("minimal", "المبسّط", "بلا لوح ترحيب — عنوان فقط", "minimal", "row", "grid2", false),
  lay("minimalList", "المبسّط بقائمة", "مبسّط والكورسات قائمة", "minimal", "inline", "list", false),
  lay("dense", "المكثّف", "بطاقات صغيرة وأكبر عدد في الشاشة", "compact", "row", "compact", true),
  lay("denseGrid", "المكثّف الشبكي", "مكثّف بثلاثة أعمدة", "compact", "grid", "grid3", false),
  lay("hero", "الواجهة", "لوح ترحيب كبير والمؤشّرات تحته", "banner", "grid", "grid2", false),
  lay("heroList", "الواجهة بقائمة", "لوح كبير وكورسات قائمة", "banner", "row", "list", false),
  lay("cardFirst", "الكورسات أولاً", "الكورسات في الأعلى والمؤشّرات تحتها", "minimal", "grid", "grid3", false),
  lay("balanced", "المتوازن", "توزيع متساوٍ بين الترحيب والمؤشّرات", "split", "row", "grid2", true),
  lay("compactRail", "المضغوط الجانبي", "ترحيب صغير وشريط مؤشّرات", "minimal", "rail", "grid2", false),
  lay("stackList", "المتراكب بقائمة", "متراكب والكورسات قائمة", "stacked", "row", "list", false),
  lay("wide", "العريض", "كل شيء بعرض الشاشة الكامل", "banner", "inline", "grid3", true),
  lay("studio", "الاستوديو", "ترحيب منقسم وشريط مؤشّرات وقائمة", "split", "rail", "list", false),
  /*
    اللائحة — ترحيبٌ منقسمٌ وحلقةُ تقدّمٍ بجانبه، والكورساتُ صفوفٌ رفيعة.
    وهي أكثفُ تخطيطٍ في القائمة: تُري ضعفَ ما تُريه الشبكةُ في الشاشة
    نفسِها، وتصلح لمن كورساتُه كثيرة.
  */
  lay("sheet", "اللائحة", "ترحيب منقسم، والكورسات صفوف رفيعة بلا أغلفة", "split", "row", "rows", false),
  lay("sheetInk", "اللائحة بالمؤشّرات", "اللائحة والمؤشّرات داخل لوح الترحيب", "split", "row", "rows", true),
];

export const DEFAULT_LAYOUT = STUDENT_LAYOUTS[0].id;

export function findLayout(id?: string): StudentLayout {
  return STUDENT_LAYOUTS.find((l) => l.id === id) ?? STUDENT_LAYOUTS[0];
}

/* ------------------------------------------------------------------ */
/*  عشرون تنسيقاً للهاتف — سلوك البوابة على الشاشات الصغيرة            */
/* ------------------------------------------------------------------ */

/**
 * الهاتف ليس نسخة مصغّرة من سطح المكتب: شريط التنقّل وموضعه، وعدد
 * الأعمدة، وارتفاع البطاقات، وحجم الخطّ — كلّها قرارات مستقلّة.
 * لذلك للهاتف تنسيقه الخاص لا مجرّد نقاط توقّف على تخطيط الشاشة الكبيرة.
 */

/** شريط التنقّل السفلي. */
export type MobileNav =
  | "dock"     // شريط عائم منفصل عن الحافة (افتراضي)
  | "bar"      // شريط ملتصق بعرض الشاشة
  | "pill"     // كبسولة مضغوطة في الوسط
  | "labels"   // أيقونات بعناوين تحتها
  | "icons";   // أيقونات فقط بلا عناوين

/** بطاقات الكورسات على الهاتف. */
export type MobileCards =
  | "stack"    // بطاقة كاملة العرض بصورة جانبية
  | "wide"     // صورة فوق والنصّ تحتها
  | "row"      // صفّ مضغوط بصورة صغيرة
  | "two";     // عمودان

/** كثافة الحشو والخطّ. */
export type MobileDensity = "cozy" | "compact" | "roomy";

export type MobileLayout = {
  id: string;
  name: string;
  hint: string;
  nav: MobileNav;
  cards: MobileCards;
  density: MobileDensity;
  /** لوح ترحيب مصغّر على الهاتف بدل الكامل. */
  slimHeader: boolean;
  /** المؤشّرات تُمرَّر أفقياً بدل أن تلتفّ. */
  scrollStats: boolean;
};

function m(
  id: string, name: string, hint: string,
  nav: MobileNav, cards: MobileCards, density: MobileDensity,
  slimHeader: boolean, scrollStats: boolean
): MobileLayout {
  return { id, name, hint, nav, cards, density, slimHeader, scrollStats };
}

export const MOBILE_LAYOUTS: MobileLayout[] = [
  m("dockStack", "العائم", "شريط عائم وبطاقات كاملة العرض", "dock", "stack", "cozy", false, false),
  m("dockWide", "العائم بصور", "شريط عائم وصورة فوق كل كورس", "dock", "wide", "cozy", false, false),
  m("dockTwo", "العائم بعمودين", "شريط عائم وبطاقتان في الصفّ", "dock", "two", "compact", true, true),
  m("barStack", "الملتصق", "شريط بعرض الشاشة وبطاقات كاملة", "bar", "stack", "cozy", false, false),
  m("barRow", "الملتصق المضغوط", "شريط ملتصق وصفوف مضغوطة", "bar", "row", "compact", true, true),
  m("barWide", "الملتصق بصور", "شريط ملتصق وصور كبيرة", "bar", "wide", "roomy", false, false),
  m("pillStack", "الكبسولة", "شريط كبسولة وبطاقات كاملة", "pill", "stack", "cozy", true, false),
  m("pillRow", "الكبسولة المضغوطة", "كبسولة وصفوف مضغوطة", "pill", "row", "compact", true, true),
  m("pillTwo", "الكبسولة بعمودين", "كبسولة وبطاقتان في الصفّ", "pill", "two", "compact", true, true),
  m("labelsStack", "العناوين", "أيقونات بعناوين وبطاقات كاملة", "labels", "stack", "cozy", false, false),
  m("labelsWide", "العناوين بصور", "أيقونات بعناوين وصور كبيرة", "labels", "wide", "roomy", false, false),
  m("labelsTwo", "العناوين بعمودين", "أيقونات بعناوين وعمودان", "labels", "two", "compact", true, true),
  m("iconsStack", "الأيقونات", "أيقونات فقط وبطاقات كاملة", "icons", "stack", "cozy", true, false),
  m("iconsRow", "الأيقونات المضغوطة", "أيقونات فقط وصفوف مضغوطة", "icons", "row", "compact", true, true),
  m("iconsTwo", "الأيقونات بعمودين", "أيقونات فقط وعمودان", "icons", "two", "compact", true, true),
  m("roomyStack", "الفسيح", "تباعد مريح وخطّ أكبر", "dock", "stack", "roomy", false, false),
  m("roomyWide", "الفسيح بصور", "فسيح وصور كبيرة", "bar", "wide", "roomy", false, true),
  m("denseRow", "المكثّف", "أكبر عدد كورسات في الشاشة بلا تمرير جانبي", "icons", "row", "compact", true, false),
  m("readerWide", "القارئ", "صور كبيرة وترحيب مصغّر", "pill", "wide", "roomy", true, false),
  m("focusRow", "التركيز", "بلا ترحيب وصفوف مضغوطة", "labels", "row", "compact", true, true),
];

export const DEFAULT_MOBILE = MOBILE_LAYOUTS[0].id;

export function findMobile(id?: string): MobileLayout {
  return MOBILE_LAYOUTS.find((x) => x.id === id) ?? MOBILE_LAYOUTS[0];
}

/**
 * أصناف التنسيق — تُطبَّق على غلاف البوابة وتسري بمحدّدات الأبناء.
 * كلّها داخل نطاق الهاتف فقط، فلا تمسّ سطح المكتب.
 */
export function mobileClass(x: MobileLayout): string {
  const density =
    x.density === "compact" ? "mb-density-compact"
      : x.density === "roomy" ? "mb-density-roomy"
        : "mb-density-cozy";
  return [
    `mb-nav-${x.nav}`,
    `mb-cards-${x.cards}`,
    density,
    x.slimHeader ? "mb-slim-header" : "",
    x.scrollStats ? "mb-scroll-stats" : "",
  ].filter(Boolean).join(" ");
}
