/**
 * الوهج — خلفياتٌ وحوافُّ مضيئة لعناصر المنصّة.
 * ------------------------------------------------------------------
 * قاعدةٌ واحدة تُطبَّق على عنصرٍ أو عدّةٍ أو الكلّ، ولكلٍّ لونُه ووضعُه
 * وشدّتُه. والقواعدُ تُترجَم إلى CSS مرّةً على الخادم وتُحقن في الجذر،
 * فتعمل في الواجهة وبوابة الطالب واللوحة معاً بلا تكرار.
 *
 * **ثلاث طبقاتٍ لا اثنتان:**
 *   ١ ــ التعبئة: خلفيةُ العنصر نفسِه تصير لوناً أو تدرّجاً.
 *   ٢ ــ الهالة: ضوءٌ يتسرّب من حوله.
 *   ٣ ــ الحافّة: خيطٌ مضيء على حدّه.
 *
 * **ولماذا لا عناصر زائفة؟** كانت الطبقاتُ تُرسم في `::before` و`::after`،
 * وهما مشغولان أصلاً: زخارفُ شريط الأدوات وحوافُّ البطاقات وسطوحُ
 * المؤشّرات كلُّها تسكنهما. فكان الوهجُ يمحو تلك الزخارف ويُخرِّب
 * العناصر. فصار يُرسَم بخصائص لا يزاحم بها أحداً:
 *   • `background` للتعبئة — وهي خلفيةُ العنصر لا طبقةٌ فوقه.
 *   • `filter: drop-shadow` للهالة — تتبع شكلَ العنصر الحقيقي حتى
 *     المقصوصَ بـ`clip-path`، ولا تُلغي ظلَّ التصميم كما يفعل
 *     `box-shadow`.
 *   • `outline` للحافّة — خارج تدفّق التخطيط فلا تُزحزح شيئاً، وتتبع
 *     الاستدارة، ولا يستعملها تصميمٌ آخر.
 */

import type { GlowMode, GlowRule, GlowTarget } from "@/lib/utils/types";
export type { GlowMode, GlowRule, GlowTarget };

export const TARGET_LABEL: Record<GlowTarget, string> = {
  all: "كل العناصر",
  cards: "البطاقات",
  buttons: "الأزرار",
  bar: "الشريط العلوي",
  hero: "قسم الهيرو",
  plans: "بطاقات الخطط",
  sections: "بطاقات الأقسام",
  faq: "طيّات الأسئلة",
  cta: "لوح الدعوة",
  footer: "الفوتر",
  tiles: "بطاقات المؤشّرات",
  sidebar: "القائمة الجانبية",
  courses: "بطاقات الكورسات",
};

export const MODE_LABEL: Record<GlowMode, string> = {
  solid: "لون واحد",
  gradient: "تدرّج بين لونين",
  rgb: "قوس قزح متحرّك",
};

/**
 * المحدِّدات لكل هدف.
 * تُكتب هنا مرّةً واحدة، فلا تتفرّق أسماءُ الأصناف بين الملفّات.
 */
const SELECTORS: Record<GlowTarget, string[]> = {
  all: [".sx-card", ".plan-card", ".stat-tile", ".fq-item", ".ct-panel", ".site-bar", ".course-card"],
  cards: [".sx-card", ".plan-card", ".stat-tile", ".fq-item", ".course-card"],
  buttons: [".hero-actions > *", ".btn-glow", ".ui-btn", ".btn-foil"],
  bar: [".site-bar", ".app-body > header"],
  hero: ["#hero .hero-media > *"],
  plans: [".plan-card"],
  sections: ["#stages .sx-card", "#features .sx-card", "#testimonials .sx-card"],
  faq: [".fq-item"],
  cta: [".ct-panel"],
  footer: [".site-footer"],
  tiles: [".stat-tile"],
  sidebar: ["aside nav a"],
  courses: [".course-card"],
};

/** ألوانُ قوس القزح — يشترك فيها الطلاءُ والحركة. */
const SPECTRUM = ["#ff0040", "#ff8a00", "#ffe600", "#22dd55", "#00d4ff", "#7c3aed", "#ff0040"];

/** يُنظِّف لوناً قادماً من اللوحة — لا يدخل إلى CSS ما لم يكن لوناً. */
function safeColor(v?: string): string | undefined {
  return v && /^#[0-9a-fA-F]{3,8}$/.test(v.trim()) ? v.trim() : undefined;
}

/** لونٌ مخفَّف بنسبةٍ مئوية — الشفافيةُ في اللون نفسِه لا في العنصر. */
function fade(c: string, pct: number): string {
  return `color-mix(in srgb, ${c} ${Math.round(pct)}%, transparent)`;
}

export function glowCss(rules: GlowRule[] | undefined): string {
  const on = (rules ?? []).filter(
    (r) => r.enabled !== false && r.targets?.length && (r.fill || r.bg || r.edge)
  );
  if (on.length === 0) return "";

  const out: string[] = [];

  on.slice(0, 24).forEach((r, i) => {
    const c1 = safeColor(r.c1) || "#7c3aed";
    const c2 = safeColor(r.c2) || "#0ea5e9";
    const sel = Array.from(new Set(r.targets.flatMap((t) => SELECTORS[t] ?? []))).join(",");
    if (!sel) return;

    const pct = Math.max(5, Math.min(100, r.intensity ?? 55));
    const spin = Math.max(2, Math.min(30, r.speed ?? 8));
    const rgb = r.mode === "rgb";
    const anim = `glw-${i}`;

    const decl: string[] = [];

    /* ---------- ١ ــ التعبئة: خلفيةُ العنصر نفسِه ---------- */
    if (r.fill) {
      if (r.mode === "gradient") {
        decl.push(`background-image:linear-gradient(140deg,${fade(c1, pct)},${fade(c2, pct)})`);
      } else if (rgb) {
        decl.push(
          `background-image:linear-gradient(120deg,${SPECTRUM.map((c) => fade(c, pct)).join(",")})`,
          "background-size:300% 100%"
        );
      } else {
        /* لونٌ واحد: صورةٌ مسطّحة لا لونُ خلفية — فتعلو لونَ الثيم
           بلا حاجةٍ إلى `!important` يكسر التصاميم. */
        decl.push(`background-image:linear-gradient(${fade(c1, pct)},${fade(c1, pct)})`);
      }
    }

    /* ---------- ٢ ــ الهالة: ضوءٌ يتسرّب من حول العنصر ---------- */
    if (r.bg && !rgb) {
      const blur = 10 + Math.round(pct * 0.22);
      const halo =
        r.mode === "gradient"
          ? `drop-shadow(-6px 6px ${blur}px ${fade(c1, pct)}) drop-shadow(6px -6px ${blur}px ${fade(c2, pct)})`
          : `drop-shadow(0 0 ${blur}px ${fade(c1, pct)}) drop-shadow(0 0 ${Math.round(blur / 2)}px ${fade(c1, pct * 0.7)})`;
      decl.push(`filter:${halo}`);
    }

    /* ---------- ٣ ــ الحافّة: خيطٌ على حدّ العنصر ---------- */
    if (r.edge && !rgb) {
      const w = pct > 70 ? 3 : pct > 40 ? 2 : 1.5;
      decl.push(
        `outline:${w}px solid ${fade(c1, Math.max(45, pct))}`,
        `outline-offset:${-Math.round(w)}px`
      );
    }

    /* قوسُ القزح لونٌ يتنقّل، فيُكتب حركةً لا قيمةً ثابتة. */
    if (rgb && (r.bg || r.edge)) {
      const blur = 10 + Math.round(pct * 0.22);
      const w = pct > 70 ? 3 : pct > 40 ? 2 : 1.5;
      const frames = SPECTRUM.map((c, k) => {
        const at = Math.round((k / (SPECTRUM.length - 1)) * 100);
        const props: string[] = [];
        if (r.bg) props.push(`filter:drop-shadow(0 0 ${blur}px ${fade(c, pct)})`);
        if (r.edge) props.push(`outline-color:${fade(c, Math.max(45, pct))}`);
        return `${at}%{${props.join(";")}}`;
      }).join("");
      out.push(`@keyframes ${anim}{${frames}}`);
      if (r.edge) {
        decl.push(`outline:${w}px solid ${fade(SPECTRUM[0], Math.max(45, pct))}`, `outline-offset:${-Math.round(w)}px`);
      }
      decl.push(`animation:${anim} ${spin}s linear infinite`);
    } else if (rgb && r.fill) {
      /* تعبئةٌ قزحية بلا هالة: يزحف الطيفُ عبر السطح. */
      out.push(`@keyframes ${anim}{to{background-position:300% 0}}`);
      decl.push(`animation:${anim} ${spin}s linear infinite`);
    }

    if (decl.length) out.push(`${sel}{${decl.join(";")}}`);
  });

  if (out.length === 0) return "";

  /* من فضّل تقليل الحركة لا تدور عنده الألوان — يبقى الوهجُ ساكناً على
     أوّل لونٍ في طيفه. والإيقافُ محصورٌ في عناصر الوهج وحدَها، فلا
     تتوقّف حركةُ المنصّة كلِّها من أجل قاعدةٍ واحدة. */
  const animated = Array.from(
    new Set(
      on.filter((r) => r.mode === "rgb").flatMap((r) => r.targets.flatMap((t) => SELECTORS[t] ?? []))
    )
  ).join(",");
  if (animated) {
    out.push(`@media (prefers-reduced-motion: reduce){${animated}{animation:none!important}}`);
  }

  return out.join("\n");
}

/** قاعدةٌ جديدة بقيمٍ معقولة. */
export function newGlowRule(): GlowRule {
  return {
    id: `GL-${Date.now().toString(36)}`,
    targets: ["cards"],
    fill: false,
    bg: true,
    edge: false,
    mode: "gradient",
    c1: "#7c3aed",
    c2: "#0ea5e9",
    intensity: 55,
    speed: 8,
    enabled: true,
  };
}
