"use client";

/**
 * معاينات المظهر — مصغّرات SVG لبوابة الطالب.
 * ------------------------------------------------------------------
 * كل معاينة رسم SVG واحد بـviewBox ثابت ونسبة أبعاد ثابتة، فلا يتمدّد
 * ولا تتشوّه زواياه، ويُرسم بألوان الثيم نفسها وزخرفته — فما يراه
 * الأدمن هو ما سيراه الطالب، لا مربّعات ألوان مجرّدة.
 */
import { useUid } from "@/components/brand/use-uid";
import type { StudentSkin, StudentLayout, OrnamentId } from "@/lib/brand/skins";
import type { HomeLayout } from "@/lib/layout/home-layouts";
import type { MobileLayout } from "@/lib/brand/skins";
import { shapeStyle, type StudentDesign } from "@/lib/brand/designs";
import { EdgeArtLayer } from "@/components/brand/edge-art";
import type { SideNavStyle, DockStyle } from "@/lib/styles/nav-styles";
import type { FrameShape } from "@/lib/art/frame-shapes";
import type { TileStyle, TileColors, TileArt } from "@/lib/styles/tile-styles";
import type { ToolbarStyle } from "@/lib/styles/toolbar-styles";
import type { PlansStyle } from "@/lib/styles/plans-styles";
import type { HeroStyle } from "@/lib/styles/hero-styles";
import type { PayStyle } from "@/lib/styles/pay-styles";
import type { SectionStyle } from "@/lib/styles/section-styles";
import type { FaqStyle, CtaStyle, FooterStyle } from "@/lib/styles/block-styles";
import type { MobileHome } from "@/lib/layout/mobile-home";
import { motionVars, type MotionStyle } from "@/lib/styles/motion-styles";
import type { ButtonStyle } from "@/lib/styles/button-styles";
import type { HeroShell, HeroShellOpts } from "@/lib/layout/hero-shell";
import { iconFrameClass, iconFrameVars, type IconFrame } from "@/lib/icons/icon-frames";
import { iconMotionClass, type IconMotion } from "@/lib/icons/icon-motion";
import { iconCoverClass, type IconCover } from "@/lib/icons/icon-covers";

const W = 160;
const H = 108;

const hsl = (v: string, a = 1) => (a === 1 ? `hsl(${v})` : `hsl(${v} / ${a})`);

/** بلاطة زخرفة مصغّرة — نسخة مبسّطة تكفي في هذا المقاس. */
function miniTile(id: OrnamentId, t: number, color: string) {
  const m = t / 2;
  const common = { fill: "none", stroke: color, strokeWidth: t * 0.07 } as const;
  switch (id) {
    case "kufi":
      return <path d={`M${t * 0.2} ${t * 0.8}V${t * 0.2}H${m}V${m}H${t * 0.8}`} {...common} />;
    case "shamsa":
      return <circle cx={m} cy={m} r={t * 0.28} {...common} />;
    case "arabesque":
      return <path d={`M0 ${m} Q${t * 0.25} 0 ${m} ${m} T${t} ${m}`} {...common} />;
    case "waves":
      return <path d={`M0 ${m} Q${t * 0.25} ${t * 0.25} ${m} ${m} T${t} ${m}`} {...common} />;
    case "grid":
      return <path d={`M0 0H${t}M0 0V${t}`} {...common} strokeWidth={t * 0.05} />;
    case "stars":
      return <path d={`M${m} ${t * 0.15} L${t * 0.85} ${m} L${m} ${t * 0.85} L${t * 0.15} ${m}Z`} {...common} />;
    case "hexes":
      return <path d={`M${m} ${t * 0.12} L${t * 0.86} ${t * 0.32} V${t * 0.68} L${m} ${t * 0.88} L${t * 0.14} ${t * 0.68} V${t * 0.32}Z`} {...common} />;
    case "rays":
      return <path d={`M0 ${t} L${t} 0`} {...common} />;
    case "knots":
      return <path d={`M0 ${m} q${t * 0.25} -${t * 0.25} ${m} 0 t${m} 0`} {...common} />;
    case "dots":
      return <circle cx={m} cy={m} r={t * 0.12} fill={color} />;
    default:
      return null;
  }
}

/** خلفية المعاينة: لون الصفحة + الزخرفة. */
function Backdrop({ skin, uid }: { skin: StudentSkin; uid: string }) {
  const v = skin.vars;
  const t = 22;
  return (
    <>
      <defs>
        <pattern id={`${uid}-p`} width={t} height={t} patternUnits="userSpaceOnUse">
          {miniTile(skin.ornament, t, hsl(v.primary, 0.16))}
        </pattern>
      </defs>
      <rect width={W} height={H} fill={hsl(v.background)} />
      {skin.ornament !== "none" && <rect width={W} height={H} fill={`url(#${uid}-p)`} />}
    </>
  );
}

/** بطاقة داخل المعاينة — شكلها يتبع أسلوب بطاقات الثيم. */
function MiniCard({
  skin, x, y, w, h,
}: { skin: StudentSkin; x: number; y: number; w: number; h: number }) {
  const v = skin.vars;
  const cut = Math.min(5, h * 0.25);

  if (skin.card === "plaque") {
    // لوح بأركان مقصوصة
    const d = `M${x + cut} ${y} H${x + w - cut} L${x + w} ${y + cut} V${y + h - cut} L${x + w - cut} ${y + h} H${x + cut} L${x} ${y + h - cut} V${y + cut}Z`;
    return (
      <>
        <path d={d} fill={hsl(v.card)} />
        <path d={d} fill="none" stroke={hsl(v.gold, 0.7)} strokeWidth={0.9} />
      </>
    );
  }
  if (skin.card === "outline") {
    return <rect x={x} y={y} width={w} height={h} rx={3} fill="none" stroke={hsl(v.border)} strokeWidth={1.1} />;
  }
  if (skin.card === "glass") {
    return (
      <>
        <rect x={x} y={y} width={w} height={h} rx={5} fill={hsl(v.card, 0.65)} />
        <rect x={x} y={y} width={w} height={h} rx={5} fill="none" stroke={hsl(v.foreground, 0.12)} strokeWidth={0.8} />
      </>
    );
  }
  if (skin.card === "elevated") {
    return (
      <>
        <rect x={x + 0.8} y={y + 1.6} width={w} height={h} rx={6} fill={hsl(v.foreground, 0.1)} />
        <rect x={x} y={y} width={w} height={h} rx={6} fill={hsl(v.card)} />
      </>
    );
  }
  // soft
  return <rect x={x} y={y} width={w} height={h} rx={6} fill={hsl(v.card)} />;
}

/* ------------------------------------------------------------------ */
/*  معاينة الثيم                                                       */
/* ------------------------------------------------------------------ */

export function SkinPreview({ skin }: { skin: StudentSkin }) {
  const uid = useUid("sp");
  const v = skin.vars;

  return (
    <svg viewBox={`0 0 ${W} ${H}`} className="block w-full rounded-2xl" style={{ aspectRatio: `${W} / ${H}` }}>
      <Backdrop skin={skin} uid={uid} />

      {/* شريط جانبي */}
      <rect x={W - 30} y={0} width={30} height={H} fill={hsl(v.primary)} />
      <rect x={W - 25} y={10} width={20} height={4} rx={2} fill={hsl(v.gold, 0.9)} />
      {[22, 32, 42, 52].map((y) => (
        <rect key={y} x={W - 25} y={y} width={20} height={3} rx={1.5} fill="#fff" opacity={y === 22 ? 0.85 : 0.35} />
      ))}

      {/* لوح ترحيب */}
      <rect x={8} y={9} width={W - 46} height={26} rx={5} fill={hsl(v.primary)} />
      <rect x={13} y={15} width={38} height={4} rx={2} fill={hsl(v.goldLight, 0.9)} />
      <rect x={13} y={23} width={24} height={3} rx={1.5} fill="#fff" opacity={0.5} />
      <circle cx={W - 55} cy={22} r={8} fill="none" stroke="#fff" strokeOpacity={0.25} strokeWidth={2.5} />
      <circle
        cx={W - 55} cy={22} r={8}
        fill="none" stroke={hsl(v.gold)} strokeWidth={2.5} strokeLinecap="round"
        strokeDasharray={`${2 * Math.PI * 8 * 0.65} ${2 * Math.PI * 8}`}
        transform={`rotate(-90 ${W - 55} 22)`}
      />

      {/* مؤشّرات */}
      {[0, 1, 2].map((i) => (
        <MiniCard key={i} skin={skin} x={8 + i * 36} y={40} w={32} h={20} />
      ))}

      {/* كورسات */}
      <MiniCard skin={skin} x={8} y={66} w={50} h={32} />
      <MiniCard skin={skin} x={62} y={66} w={50} h={32} />
      <rect x={12} y={70} width={20} height={14} rx={2} fill={hsl(v.accent, 0.55)} />
      <rect x={66} y={70} width={20} height={14} rx={2} fill={hsl(v.accent, 0.55)} />
      <rect x={12} y={88} width={40} height={3} rx={1.5} fill={hsl(v.foreground, 0.35)} />
      <rect x={66} y={88} width={40} height={3} rx={1.5} fill={hsl(v.foreground, 0.35)} />
    </svg>
  );
}

/* ------------------------------------------------------------------ */
/*  معاينة التخطيط                                                     */
/* ------------------------------------------------------------------ */

export function LayoutPreview({ layout, skin }: { layout: StudentLayout; skin: StudentSkin }) {
  const uid = useUid("lp");
  const v = skin.vars;
  const L = 8;                 // الهامش الأيسر
  const R = W - 30;            // بداية الشريط الجانبي
  const inner = R - L - 6;     // العرض المتاح

  /* --- الترويسة --- */
  const headH =
    layout.header === "banner" ? 28 :
    layout.header === "compact" ? 18 :
    layout.header === "stacked" ? 22 :
    layout.header === "split" ? 26 : 10;

  const headY = 8;
  const statsY = headY + headH + 5;

  /* --- المؤشّرات --- */
  const railMode = layout.stats === "rail";
  const statsH = layout.stats === "inline" ? 12 : layout.stats === "grid" ? 26 : 18;
  const contentX = railMode ? L + 26 : L;
  const contentW = railMode ? inner - 26 : inner;
  const cardsY = railMode ? statsY : statsY + (layout.statsInHeader ? 0 : statsH + 6);

  /* --- الكورسات --- */
  const cols = layout.cards === "grid3" ? 3 : layout.cards === "list" ? 1 : 2;
  const gap = 4;
  const cardW = (contentW - gap * (cols - 1)) / cols;
  const cardH = layout.cards === "list" ? 12 : layout.cards === "compact" ? 16 : 22;
  const rows = layout.cards === "list" ? 3 : 2;

  return (
    <svg viewBox={`0 0 ${W} ${H}`} className="block w-full rounded-2xl" style={{ aspectRatio: `${W} / ${H}` }}>
      <Backdrop skin={skin} uid={uid} />

      {/* الشريط الجانبي ثابت في كل التخطيطات */}
      <rect x={R + 6} y={0} width={W - R - 6} height={H} fill={hsl(v.primary)} />
      {[10, 20, 28, 36].map((y) => (
        <rect key={y} x={R + 11} y={y} width={14} height={3} rx={1.5} fill="#fff" opacity={y === 10 ? 0.9 : 0.35} />
      ))}

      {/* الترويسة */}
      {layout.header === "minimal" ? (
        <>
          <rect x={L} y={headY} width={44} height={5} rx={2.5} fill={hsl(v.foreground, 0.7)} />
          <rect x={L} y={headY + 8} width={26} height={3} rx={1.5} fill={hsl(v.accent, 0.8)} />
        </>
      ) : layout.header === "split" ? (
        <>
          <rect x={L} y={headY} width={inner * 0.58} height={headH} rx={5} fill={hsl(v.primary)} />
          <rect x={L + inner * 0.62} y={headY} width={inner * 0.38} height={headH} rx={5} fill={hsl(v.card)} />
          <circle
            cx={L + inner * 0.81} cy={headY + headH / 2} r={7}
            fill="none" stroke={hsl(v.accent)} strokeWidth={2.5} strokeLinecap="round"
            strokeDasharray={`${2 * Math.PI * 7 * 0.7} ${2 * Math.PI * 7}`}
            transform={`rotate(-90 ${L + inner * 0.81} ${headY + headH / 2})`}
          />
        </>
      ) : (
        <>
          <rect x={L} y={headY} width={inner} height={headH} rx={5} fill={hsl(v.primary)} />
          <rect x={L + 5} y={headY + 5} width={34} height={4} rx={2} fill={hsl(v.goldLight, 0.9)} />
          {headH > 20 && <rect x={L + 5} y={headY + 13} width={22} height={3} rx={1.5} fill="#fff" opacity={0.5} />}
          {/* المؤشّرات داخل اللوح */}
          {layout.statsInHeader &&
            [0, 1, 2].map((i) => (
              <rect
                key={i}
                x={L + inner - 8 - (3 - i) * 15}
                y={headY + headH - 12}
                width={13}
                height={8}
                rx={2}
                fill="#fff"
                opacity={0.22}
              />
            ))}
        </>
      )}

      {/* المؤشّرات خارج اللوح */}
      {!layout.statsInHeader && !railMode && (
        <>
          {layout.stats === "inline" ? (
            <MiniCard skin={skin} x={L} y={statsY} w={inner} h={statsH} />
          ) : (
            [0, 1, 2].map((i) => {
              const w = (inner - 8) / 3;
              return <MiniCard key={i} skin={skin} x={L + i * (w + 4)} y={statsY} w={w} h={statsH} />;
            })
          )}
        </>
      )}

      {/* شريط المؤشّرات الرأسي */}
      {railMode && [0, 1, 2].map((i) => (
        <MiniCard key={i} skin={skin} x={L} y={statsY + i * 20} w={22} h={16} />
      ))}

      {/* الكورسات */}
      {Array.from({ length: rows }).map((_, r) =>
        Array.from({ length: cols }).map((_, c) => {
          const x = contentX + c * (cardW + gap);
          const y = cardsY + r * (cardH + gap);
          if (y + cardH > H - 4) return null;
          return (
            <g key={`${r}-${c}`}>
              <MiniCard skin={skin} x={x} y={y} w={cardW} h={cardH} />
              <rect x={x + 3} y={y + 3} width={Math.min(14, cardW * 0.3)} height={cardH - 6} rx={2} fill={hsl(v.accent, 0.5)} />
              <rect x={x + Math.min(14, cardW * 0.3) + 6} y={y + 5} width={Math.max(6, cardW * 0.4)} height={3} rx={1.5} fill={hsl(v.foreground, 0.35)} />
            </g>
          );
        })
      )}
    </svg>
  );
}

/* ------------------------------------------------------------------ */
/*  معاينة تخطيط الواجهة الرئيسية                                      */
/* ------------------------------------------------------------------ */

/** ألوان المعاينة من ثيم المنصّة نفسه لا من مظهر الطالب. */
const SITE = {
  bg: "38 42% 96%",
  card: "40 56% 99%",
  fg: "224 44% 13%",
  primary: "226 60% 34%",
  accent: "38 76% 50%",
  border: "36 24% 85%",
};

/** لون تمثيلي لكل قسم — يجعل الترتيب مقروءاً من المصغّرة. */
const SECTION_TONE: Record<string, string> = {
  freeLive: "356 62% 52%",
  stages: "199 70% 42%",
  features: "226 60% 44%",
  plans: "38 76% 50%",
  testimonials: "266 50% 52%",
  faq: "162 44% 38%",
};

export function HomeLayoutPreview({ layout }: { layout: HomeLayout }) {
  const uid = useUid("hp");
  const pad = layout.width === "narrow" ? 26 : layout.width === "wide" ? 6 : 14;
  const gap = layout.density === "tight" ? 2 : layout.density === "airy" ? 6 : 4;
  const innerW = W - pad * 2;

  /* --- الهيرو --- */
  const heroH = layout.hero === "compact" ? 16 : layout.hero === "stacked" ? 30 : 26;
  const heroY = 10;

  /* --- الأقسام --- */
  let y = heroY + heroH + gap + 3;
  const bars: { id: string; y: number; h: number }[] = [];
  for (const id of layout.order) {
    const h = 7;
    if (y + h > H - 3) break;
    bars.push({ id, y, h });
    y += h + gap;
  }

  return (
    <svg viewBox={`0 0 ${W} ${H}`} className="block w-full rounded-2xl" style={{ aspectRatio: `${W} / ${H}` }}>
      <rect width={W} height={H} fill={hsl(SITE.bg)} />

      {/* شريط علوي */}
      <rect x={pad} y={3} width={innerW} height={5} rx={2.5} fill={hsl(SITE.card)} />
      <rect x={pad + 2} y={4.6} width={12} height={2} rx={1} fill={hsl(SITE.primary, 0.8)} />
      <rect x={pad + innerW - 14} y={4.4} width={12} height={2.4} rx={1.2} fill={hsl(SITE.accent)} />

      {/* الهيرو بأشكاله */}
      {layout.hero === "compact" ? (
        <>
          <rect x={pad + innerW * 0.2} y={heroY + 3} width={innerW * 0.6} height={4} rx={2} fill={hsl(SITE.fg, 0.75)} />
          <rect x={pad + innerW * 0.3} y={heroY + 10} width={innerW * 0.4} height={3} rx={1.5} fill={hsl(SITE.accent)} />
        </>
      ) : layout.hero === "centered" ? (
        <>
          <rect x={pad + innerW * 0.2} y={heroY} width={innerW * 0.6} height={4} rx={2} fill={hsl(SITE.fg, 0.75)} />
          <rect x={pad + innerW * 0.32} y={heroY + 7} width={innerW * 0.36} height={3} rx={1.5} fill={hsl(SITE.accent)} />
          <rect x={pad + innerW * 0.3} y={heroY + 13} width={innerW * 0.4} height={heroH - 14} rx={3} fill={hsl(SITE.primary, 0.75)} />
        </>
      ) : layout.hero === "stacked" ? (
        <>
          <rect x={pad + innerW * 0.25} y={heroY} width={innerW * 0.5} height={16} rx={3} fill={hsl(SITE.primary, 0.75)} />
          <rect x={pad + innerW * 0.15} y={heroY + 19} width={innerW * 0.7} height={4} rx={2} fill={hsl(SITE.fg, 0.7)} />
          <rect x={pad + innerW * 0.3} y={heroY + 25} width={innerW * 0.4} height={3} rx={1.5} fill={hsl(SITE.accent)} />
        </>
      ) : (
        // منقسم أو معكوس — الصورة على أحد الجانبين
        <>
          <rect
            x={layout.hero === "reversed" ? pad : pad + innerW * 0.55}
            y={heroY}
            width={innerW * 0.45}
            height={heroH}
            rx={4}
            fill={hsl(SITE.primary, 0.75)}
          />
          <rect
            x={layout.hero === "reversed" ? pad + innerW * 0.5 : pad}
            y={heroY + 3}
            width={innerW * 0.4}
            height={4}
            rx={2}
            fill={hsl(SITE.fg, 0.75)}
          />
          <rect
            x={layout.hero === "reversed" ? pad + innerW * 0.5 : pad}
            y={heroY + 10}
            width={innerW * 0.28}
            height={3}
            rx={1.5}
            fill={hsl(SITE.accent)}
          />
          <rect
            x={layout.hero === "reversed" ? pad + innerW * 0.5 : pad}
            y={heroY + 17}
            width={innerW * 0.22}
            height={5}
            rx={2.5}
            fill={hsl(SITE.primary)}
          />
        </>
      )}

      {/* الأقسام بترتيبها — لكل قسم لونه فيُقرأ الترتيب من المصغّرة */}
      {bars.map((b, i) => (
        <g key={b.id}>
          {i > 0 && layout.divider !== "none" && (
            layout.divider === "wave" ? (
              <path
                d={`M${pad} ${b.y - gap / 2} q${innerW / 6} -2 ${innerW / 3} 0 t${innerW / 3} 0 t${innerW / 3} 0`}
                fill="none" stroke={hsl(SITE.accent, 0.5)} strokeWidth={0.7}
              />
            ) : layout.divider === "rule" ? (
              <path d={`M${pad + 8} ${b.y - gap / 2} H${pad + innerW - 8}`} stroke={hsl(SITE.accent, 0.45)} strokeWidth={0.7} />
            ) : (
              <g stroke={hsl(SITE.accent, 0.6)} strokeWidth={0.7} fill="none">
                <path d={`M${pad + 18} ${b.y - gap / 2} H${W / 2 - 4}`} opacity={0.5} />
                <path d={`M${W / 2 + 4} ${b.y - gap / 2} H${pad + innerW - 18}`} opacity={0.5} />
                <path d={`M${W / 2} ${b.y - gap / 2 - 2.2} l2.2 2.2 -2.2 2.2 -2.2 -2.2Z`} />
              </g>
            )
          )}
          <rect x={pad} y={b.y} width={innerW} height={b.h} rx={2.5} fill={hsl(SITE.card)} />
          <rect x={pad} y={b.y} width={3} height={b.h} rx={1.5} fill={hsl(SECTION_TONE[b.id] ?? SITE.primary)} />
          <rect x={pad + 7} y={b.y + 2} width={innerW * 0.35} height={2} rx={1} fill={hsl(SITE.fg, 0.28)} />
        </g>
      ))}

      <rect x={0} y={H - 4} width={W} height={4} fill={hsl(SITE.primary, 0.85)} />
      <rect id={uid} width={0} height={0} />
    </svg>
  );
}

/* ------------------------------------------------------------------ */
/*  معاينة تنسيق الهاتف — إطار جهاز رأسي                                */
/* ------------------------------------------------------------------ */

const PW = 74;   // عرض إطار الجهاز
const PH = 132;  // ارتفاعه

export function MobilePreview({ mobile, skin }: { mobile: MobileLayout; skin: StudentSkin }) {
  const v = skin.vars;
  const pad = mobile.density === "compact" ? 4 : mobile.density === "roomy" ? 8 : 6;
  const inner = PW - pad * 2;

  /* الترحيب */
  const headH = mobile.slimHeader ? 14 : 24;
  const headY = 12;

  /* المؤشّرات */
  const statsY = headY + headH + pad;
  const statsH = 14;

  /* الكورسات */
  const cardsY = statsY + statsH + pad;
  const two = mobile.cards === "two";
  const cols = two ? 2 : 1;
  const cardW = (inner - (two ? 3 : 0)) / cols;
  const cardH = mobile.cards === "row" ? 10 : mobile.cards === "wide" ? 26 : two ? 22 : 16;

  /* شريط التنقّل */
  const navH = mobile.nav === "labels" ? 15 : mobile.nav === "pill" ? 10 : 12;
  const navY = PH - navH - (mobile.nav === "bar" ? 0 : 3);
  const navW = mobile.nav === "bar" ? PW : mobile.nav === "pill" ? PW * 0.62 : PW - 8;
  const navX = mobile.nav === "bar" ? 0 : (PW - navW) / 2;
  const tabs = 5;

  return (
    <svg viewBox={`0 0 ${PW} ${PH}`} className="mx-auto block h-auto w-full max-w-[7rem]" style={{ aspectRatio: `${PW} / ${PH}` }}>
      {/* جسم الجهاز */}
      <rect x="0.6" y="0.6" width={PW - 1.2} height={PH - 1.2} rx="9" fill={hsl(v.background)} stroke={hsl(v.foreground, 0.28)} strokeWidth="1.2" />
      {/* النوتش */}
      <rect x={PW / 2 - 9} y="3" width="18" height="3.2" rx="1.6" fill={hsl(v.foreground, 0.3)} />

      {/* الترحيب */}
      <rect x={pad} y={headY} width={inner} height={headH} rx={mobile.slimHeader ? 4 : 6} fill={hsl(v.primary)} />
      <rect x={pad + 3} y={headY + 4} width={inner * 0.42} height={2.6} rx={1.3} fill={hsl(v.goldLight, 0.9)} />
      {!mobile.slimHeader && (
        <rect x={pad + 3} y={headY + 10} width={inner * 0.26} height={2.2} rx={1.1} fill="#fff" opacity={0.45} />
      )}

      {/* المؤشّرات — ممرّرة أفقياً أم ملتفّة */}
      {mobile.scrollStats ? (
        <>
          {[0, 1, 2].map((i) => (
            <MiniCard key={i} skin={skin} x={pad + i * (inner * 0.42 + 2)} y={statsY} w={inner * 0.42} h={statsH} />
          ))}
          {/* البطاقة الثالثة مقطوعة عند الحافة — إشارة إلى التمرير */}
          <rect x={PW - pad} y={statsY} width={pad} height={statsH} fill={hsl(v.background)} />
        </>
      ) : (
        [0, 1, 2].map((i) => {
          const w = (inner - 4) / 3;
          return <MiniCard key={i} skin={skin} x={pad + i * (w + 2)} y={statsY} w={w} h={statsH} />;
        })
      )}

      {/* الكورسات */}
      {Array.from({ length: two ? 4 : 3 }).map((_, i) => {
        const c = two ? i % 2 : 0;
        const r = two ? Math.floor(i / 2) : i;
        const x = pad + c * (cardW + 3);
        const y = cardsY + r * (cardH + pad * 0.6);
        if (y + cardH > navY - 3) return null;
        return (
          <g key={i}>
            <MiniCard skin={skin} x={x} y={y} w={cardW} h={cardH} />
            {mobile.cards === "wide" || two ? (
              <rect x={x + 2} y={y + 2} width={cardW - 4} height={cardH * 0.55} rx={2} fill={hsl(v.accent, 0.5)} />
            ) : (
              <rect x={x + 2} y={y + 2} width={mobile.cards === "row" ? 7 : 11} height={cardH - 4} rx={2} fill={hsl(v.accent, 0.5)} />
            )}
          </g>
        );
      })}

      {/* شريط التنقّل */}
      <rect x={navX} y={navY} width={navW} height={navH} rx={mobile.nav === "bar" ? 0 : 5} fill={hsl(v.card)} stroke={hsl(v.gold, 0.5)} strokeWidth="0.7" />
      {Array.from({ length: tabs }).map((_, i) => {
        const w = navW / tabs;
        const cx = navX + w * i + w / 2;
        return (
          <g key={i}>
            <circle cx={cx} cy={navY + (mobile.nav === "labels" ? 5.5 : navH / 2)} r="1.9" fill={hsl(i === 0 ? v.primary : v.foreground, i === 0 ? 1 : 0.35)} />
            {mobile.nav === "labels" && (
              <rect x={cx - 3.4} y={navY + 9.5} width="6.8" height="1.6" rx="0.8" fill={hsl(v.foreground, 0.3)} />
            )}
          </g>
        );
      })}
    </svg>
  );
}

/* ------------------------------------------------------------------ */
/*  معاينة الهيئة — الشكل لا اللون                                     */
/* ------------------------------------------------------------------ */

/**
 * تُرسم بعناصر HTML لا SVG: الأشكال نفسها مبنيّة على `clip-path`، فرسمها
 * بالعنصر الحقيقي يُظهر الشكل كما سيبدو تماماً بدل محاكاته بمسار SVG قد
 * يختلف عنه. زخرفة الحافّة وحدها SVG — وهي كذلك في الصفحة الحقيقية.
 */
export function DesignPreview({ design, skin }: { design: StudentDesign; skin: StudentSkin }) {
  const v = skin.vars;
  return (
    <div
      className="relative w-full overflow-hidden rounded-2xl p-3"
      style={{ background: hsl(v.background), aspectRatio: `${W} / ${H}` }}
    >
      {/* لوح الترحيب */}
      <div
        className="relative overflow-hidden"
        style={{ ...shapeStyle(design.panel), background: hsl(v.primary), height: "42%" }}
      >
        <span className="absolute inset-x-0 top-0 text-[hsl(var(--gold-light))]" style={{ color: hsl(v.goldLight) }}>
          <EdgeArtLayer kind={design.edge} />
        </span>
        <div className="relative p-2.5">
          <div className="h-1.5 w-10 rounded-full" style={{ background: hsl(v.goldLight, 0.9) }} />
          <div className="mt-1.5 h-2 w-16 rounded-full bg-white/45" />
        </div>
      </div>

      {/* بطاقات */}
      <div className="mt-2 grid grid-cols-3 gap-1.5" style={{ height: "24%" }}>
        {[0, 1, 2].map((i) => (
          <div
            key={i}
            className="h-full"
            style={{
              ...shapeStyle(design.tile),
              background: hsl(v.card),
              boxShadow:
                design.border === "none"
                  ? undefined
                  : `inset 0 0 0 1px ${hsl(v.gold, design.border === "dashed" ? 0.35 : 0.55)}`,
            }}
          />
        ))}
      </div>

      <div className="mt-2 grid grid-cols-2 gap-1.5" style={{ height: "22%" }}>
        {[0, 1].map((i) => (
          <div
            key={i}
            className="h-full"
            style={{
              ...shapeStyle(design.tile),
              background: hsl(v.card),
              boxShadow: design.border === "none" ? undefined : `inset 0 0 0 1px ${hsl(v.gold, 0.5)}`,
            }}
          />
        ))}
      </div>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/*  معاينة القائمة الجانبية                                            */
/* ------------------------------------------------------------------ */

export function SideNavPreview({ nav, skin }: { nav: SideNavStyle; skin: StudentSkin }) {
  const v = skin.vars;
  const rail = nav.panel === "rail";
  const float = nav.panel === "floating";
  const w = rail ? 26 : 46;
  const x = float ? W - w - 5 : W - w;
  const y = float ? 5 : 0;
  const h = float ? H - 10 : H;
  const rowH = rail || nav.stacked ? 19 : 15;
  const top = 26;

  const panelFill =
    nav.panel === "outline" ? "none"
      : nav.panel === "glass" ? hsl(v.card, 0.6)
        : nav.panel === "gradient" ? `url(#sn-${nav.id})`
          : hsl(v.primary);

  const onDark = nav.panel === "solid" || nav.panel === "gradient" || nav.panel === "floating";
  const label = onDark ? "#fff" : hsl(v.foreground);

  return (
    <svg viewBox={`0 0 ${W} ${H}`} className="block w-full rounded-2xl" style={{ aspectRatio: `${W} / ${H}` }}>
      <defs>
        <linearGradient id={`sn-${nav.id}`} x1="0" y1={y} x2="0" y2={y + h} gradientUnits="userSpaceOnUse">
          <stop offset="0%" stopColor={hsl(v.primary)} />
          <stop offset="100%" stopColor={hsl(v.glow, 0.85)} />
        </linearGradient>
      </defs>

      <rect width={W} height={H} fill={hsl(v.background)} />

      {/* محتوى الصفحة — سياق يوضّح موضع القائمة */}
      <rect x={6} y={10} width={W - w - 14} height={22} rx={4} fill={hsl(v.card)} />
      <rect x={6} y={38} width={W - w - 14} height={30} rx={4} fill={hsl(v.card)} />
      <rect x={6} y={74} width={W - w - 14} height={26} rx={4} fill={hsl(v.card)} />

      <rect
        x={x} y={y} width={w} height={h}
        rx={float ? 8 : 0}
        fill={panelFill}
        stroke={nav.panel === "outline" ? hsl(v.border) : "none"}
        strokeWidth={nav.panel === "outline" ? 1 : 0}
      />

      <rect x={x + 6} y={10} width={w - 12} height={4} rx={2} fill={hsl(v.gold, 0.9)} />

      {[0, 1, 2, 3, 4].map((i) => {
        const iy = top + i * rowH;
        const on = i === 1;
        const icx = rail || nav.stacked ? x + w / 2 : x + w - 9;
        const icy = nav.stacked ? iy + 5 : iy + rowH / 2 - 1;

        return (
          <g key={i}>
            {on && nav.active === "pill" && (
              <rect x={x + 4} y={iy} width={w - 8} height={rowH - 3} rx={5} fill={hsl(v.gold, 0.18)} stroke={hsl(v.gold, 0.4)} strokeWidth={0.8} />
            )}
            {on && nav.active === "bar" && (
              <rect x={x} y={iy} width={2.5} height={rowH - 3} rx={1.2} fill={hsl(v.gold)} />
            )}
            {on && nav.active === "plaque" && (
              <path
                d={`M${x + 8} ${iy} H${x + w - 8} L${x + w - 4} ${iy + 4} V${iy + rowH - 7} L${x + w - 8} ${iy + rowH - 3} H${x + 8} L${x + 4} ${iy + rowH - 7} V${iy + 4}Z`}
                fill={hsl(v.gold, 0.18)} stroke={hsl(v.gold, 0.5)} strokeWidth={0.8}
              />
            )}
            {on && nav.active === "notch" && (
              <path
                d={`M${x + w} ${iy} H${x + 8} a5 5 0 0 0 -5 5 V${iy + rowH - 8} a5 5 0 0 0 5 5 H${x + w}Z`}
                fill={hsl(v.gold, 0.2)}
              />
            )}
            {on && nav.active === "glow" && (
              <ellipse cx={x + w / 2} cy={iy + rowH / 2 - 1} rx={w / 2 - 3} ry={rowH / 2} fill={hsl(v.gold, 0.22)} />
            )}
            {on && nav.active === "underline" && (
              <rect x={x + 6} y={iy + rowH - 5} width={w - 12} height={1.6} rx={0.8} fill={hsl(v.gold)} />
            )}
            {on && nav.active === "dot" && (
              <circle cx={x + 5} cy={iy + rowH / 2 - 1} r={1.8} fill={hsl(v.gold)} />
            )}
            {on && nav.active === "frame" && (
              <rect x={x + 4} y={iy} width={w - 8} height={rowH - 3} rx={5} fill="none" stroke={hsl(v.gold, 0.7)} strokeWidth={1.1} />
            )}

            {nav.icon === "box" && <rect x={icx - 4} y={icy - 4} width={8} height={8} rx={2} fill={hsl(v.gold, 0.2)} />}
            {nav.icon === "circle" && <circle cx={icx} cy={icy} r={4.2} fill={hsl(v.gold, 0.2)} />}
            {nav.icon === "medallion" && (
              <path
                d={`M${icx} ${icy - 4.6} L${icx + 3.2} ${icy - 3.2} L${icx + 4.6} ${icy} L${icx + 3.2} ${icy + 3.2} L${icx} ${icy + 4.6} L${icx - 3.2} ${icy + 3.2} L${icx - 4.6} ${icy} L${icx - 3.2} ${icy - 3.2}Z`}
                fill={hsl(v.gold, 0.2)} stroke={hsl(v.gold, 0.45)} strokeWidth={0.6}
              />
            )}
            <circle cx={icx} cy={icy} r={1.7} fill={on ? hsl(v.gold) : label} opacity={on ? 1 : 0.55} />

            {!rail && !nav.stacked && (
              <rect x={x + 6} y={icy - 1} width={w - 24} height={2.4} rx={1.2} fill={label} opacity={on ? 0.95 : 0.4} />
            )}
            {nav.stacked && (
              <rect x={x + w / 2 - 7} y={icy + 6} width={14} height={2} rx={1} fill={label} opacity={on ? 0.95 : 0.4} />
            )}
          </g>
        );
      })}
    </svg>
  );
}

/* ------------------------------------------------------------------ */
/*  معاينة القائمة السفلية                                             */
/* ------------------------------------------------------------------ */

export function DockPreview({ dock, skin }: { dock: DockStyle; skin: StudentSkin }) {
  const v = skin.vars;
  const DW = 74;
  const DH = 132;
  const tabs = 5;

  const full = dock.shape === "flat" || dock.shape === "tray";
  const barW = dock.shape === "pill" ? DW * 0.62 : full ? DW : DW - 8;
  const barX = full ? 0 : (DW - barW) / 2;
  const barH = dock.labels ? 15 : 11;
  const barY = DH - barH - (full ? 0 : 4);

  /* القوس والمقصوص شكلان لا يُعبَّر عنهما بمستطيل، فيُرسمان بمسار. */
  const barPath =
    dock.shape === "arc"
      ? `M${barX} ${barY + barH} V${barY + 7} Q${barX + barW / 2} ${barY - 5} ${barX + barW} ${barY + 7} V${barY + barH} Z`
      : dock.shape === "cut"
        ? `M${barX + 6} ${barY} H${barX + barW - 6} L${barX + barW} ${barY + 6} V${barY + barH} H${barX} V${barY + 6} Z`
        : null;

  return (
    <svg viewBox={`0 0 ${DW} ${DH}`} className="mx-auto block h-auto w-full max-w-[7rem]" style={{ aspectRatio: `${DW} / ${DH}` }}>
      <rect x="0.6" y="0.6" width={DW - 1.2} height={DH - 1.2} rx="9" fill={hsl(v.background)} stroke={hsl(v.foreground, 0.28)} strokeWidth="1.2" />
      <rect x={DW / 2 - 9} y="3" width="18" height="3.2" rx="1.6" fill={hsl(v.foreground, 0.3)} />

      <rect x={6} y={12} width={DW - 12} height={22} rx={4} fill={hsl(v.primary)} />
      <rect x={6} y={38} width={DW - 12} height={16} rx={3} fill={hsl(v.card)} />
      <rect x={6} y={58} width={DW - 12} height={16} rx={3} fill={hsl(v.card)} />
      <rect x={6} y={78} width={DW - 12} height={16} rx={3} fill={hsl(v.card)} />

      {barPath ? (
        <path d={barPath} fill={hsl(v.card)} stroke={hsl(v.gold, 0.5)} strokeWidth="0.7" />
      ) : (
        <rect
          x={barX} y={barY} width={barW} height={barH}
          rx={dock.shape === "pill" ? barH / 2 : full ? (dock.shape === "tray" ? 5 : 0) : 5}
          fill={hsl(v.card)} stroke={hsl(v.gold, 0.5)} strokeWidth="0.7"
        />
      )}
      {dock.shape === "tray" && (
        <rect x={barX} y={barY - 2} width={barW} height={2} fill={hsl(v.primary, 0.18)} />
      )}

      {Array.from({ length: tabs }).map((_, i) => {
        const cw = barW / tabs;
        const cx = barX + cw * i + cw / 2;
        const on = i === 1;
        const lift = on && dock.mark === "lift" ? -4 : 0;
        const cy = barY + (dock.labels ? 5 : barH / 2) + lift;

        return (
          <g key={i}>
            {on && dock.mark === "pill" && (
              <rect x={cx - cw / 2 + 1.5} y={barY + 1.5 + lift} width={cw - 3} height={barH - 3} rx={3} fill={hsl(v.accent, 0.2)} />
            )}
            {on && dock.mark === "lift" && <circle cx={cx} cy={cy} r={5.5} fill={hsl(v.primary)} />}
            {on && dock.mark === "dot" && <circle cx={cx} cy={barY + barH - 2.5} r={1.5} fill={hsl(v.accent)} />}
            {on && dock.mark === "glow" && (
              <ellipse cx={cx} cy={cy} rx={cw / 2 - 1} ry={barH / 2 - 1} fill={hsl(v.accent, 0.28)} />
            )}
            {on && dock.mark === "bar" && (
              <rect x={cx - cw / 2 + 2} y={barY + 1} width={cw - 4} height={1.6} rx={0.8} fill={hsl(v.accent)} />
            )}

            <circle cx={cx} cy={cy} r={1.8} fill={on && dock.mark === "lift" ? "#fff" : hsl(on ? v.primary : v.foreground, on ? 1 : 0.4)} />
            {dock.labels && (
              <rect x={cx - 3.2} y={barY + 9.5 + lift} width={6.4} height={1.5} rx={0.75} fill={hsl(v.foreground, on ? 0.75 : 0.32)} />
            )}
          </g>
        );
      })}
    </svg>
  );
}

/* ------------------------------------------------------------------ */
/*  معاينة إطار الصورة                                                 */
/* ------------------------------------------------------------------ */

export function FramePreview({
  shape,
  color,
  skin,
}: {
  shape: FrameShape;
  color?: string;
  skin: StudentSkin;
}) {
  const v = skin.vars;
  const FW = 80;
  const FH = 100;
  const stroke = color || hsl(v.primary);
  const outer = shape.path(FW, FH, 3);
  const inner = shape.path(FW, FH, 11);
  const uid = useUid("fp");

  return (
    <svg viewBox={`0 0 ${FW} ${FH}`} className="mx-auto block h-auto w-full max-w-[6.5rem]" style={{ aspectRatio: `${FW} / ${FH}` }}>
      <defs>
        <clipPath id={`${uid}-c`}>
          <path d={outer} />
        </clipPath>
      </defs>
      {/* صورة تمثيلية: هيئة شخص مبسّطة تُظهر ما يقصّه الإطار */}
      <g clipPath={`url(#${uid}-c)`}>
        <rect width={FW} height={FH} fill={hsl(v.muted)} />
        <circle cx={FW / 2} cy={FH * 0.38} r={FW * 0.17} fill={hsl(v.primary, 0.45)} />
        <path
          d={`M${FW * 0.2} ${FH} q${FW * 0.3} -${FH * 0.34} ${FW * 0.6} 0 Z`}
          fill={hsl(v.primary, 0.45)}
        />
      </g>
      <path d={outer} fill="none" stroke={stroke} strokeWidth={1.6} strokeOpacity={0.75} strokeLinejoin="round" />
      {shape.innerRule && (
        <path d={inner} fill="none" stroke={stroke} strokeWidth={0.8} strokeOpacity={0.35} strokeLinejoin="round" />
      )}
    </svg>
  );
}

/* ------------------------------------------------------------------ */
/*  معاينة بطاقة المؤشّر                                               */
/* ------------------------------------------------------------------ */

export function TilePreview({
  tile,
  colors,
  art,
  skin,
}: {
  tile: TileStyle;
  colors?: TileColors;
  /** الصورة المرفوعة — تُرسم في المعاينة كما تُرسم في البطاقة الحقيقية. */
  art?: TileArt;
  skin: StudentSkin;
}) {
  const v = skin.vars;
  const bg =
    colors?.bg ||
    (tile.surface === "solid" || tile.surface === "sheen" ? hsl(v.card)
      : tile.surface === "gradient" ? hsl(v.primary)
        : tile.surface === "tint" ? hsl(v.primary)
          : tile.surface === "glass" ? hsl(v.card, 0.5)
            : "transparent");
  const bg2 = colors?.bg2 || hsl(v.glow);
  const text = colors?.text || hsl(v.foreground);
  const badge = colors?.icon || hsl(v.gold);
  const accent = colors?.accent || hsl(v.gold, 0.5);

  const fill =
    tile.surface === "gradient" ? `linear-gradient(140deg, ${bg}, ${bg2})` : bg;
  const ring = tile.surface === "flat" ? "none" : `inset 0 0 0 ${tile.surface === "outline" ? 1.6 : 1}px ${accent}`;

  const badgeShape =
    tile.icon === "circle" ? "9999px"
      : tile.icon === "square" ? "3px"
        : "7px";

  const centered = tile.layout === "centered";
  const inline = tile.layout === "inline";
  const split = tile.layout === "split";
  const overlay = tile.layout === "overlay";

  /* موضع الصورة — يطابق قواعد ‎.tl-art-*‎ في globals.css */
  const artOn = Boolean(art?.image) && art?.mode !== "badge";
  const artStyle: React.CSSProperties | undefined = artOn
    ? {
      position: "absolute",
      backgroundImage: `url(${art!.image})`,
      backgroundRepeat: "no-repeat",
      opacity: Math.max(5, Math.min(100, art?.opacity ?? 22)) / 100,
      filter: `blur(${Math.max(0, Math.min(12, art?.blur ?? 0)) * 0.4}px)`,
      ...(art?.mode === "corner"
        ? { insetInlineStart: -4, bottom: -4, width: "45%", aspectRatio: "1", backgroundSize: "contain", backgroundPosition: "bottom left" }
        : art?.mode === "side"
          ? { insetInlineEnd: 0, top: 0, bottom: 0, width: "38%", backgroundSize: "cover", backgroundPosition: "center", maskImage: "linear-gradient(to left, #000 55%, transparent)", WebkitMaskImage: "linear-gradient(to left, #000 55%, transparent)" }
          : art?.mode === "strip"
            ? { insetInline: 0, top: 0, height: "38%", backgroundSize: "cover", backgroundPosition: "center", maskImage: "linear-gradient(to bottom, #000 45%, transparent)", WebkitMaskImage: "linear-gradient(to bottom, #000 45%, transparent)" }
            : { inset: 0, backgroundSize: "cover", backgroundPosition: "center" }),
    }
    : undefined;

  const badgeEl = tile.icon !== "none" && (
    <span
      style={{
        width: 22,
        height: 22,
        background: art?.image && art.mode === "badge" ? `center/cover url(${art.image})` : badge,
        borderRadius: tile.icon === "medallion" ? 0 : badgeShape,
        clipPath:
          tile.icon === "medallion"
            ? "polygon(50% 0, 85% 15%, 100% 50%, 85% 85%, 50% 100%, 15% 85%, 0 50%, 15% 15%)"
            : undefined,
        flexShrink: 0,
      }}
    />
  );

  const numEl = (size: string) => (
    <span style={{ color: text, fontWeight: 700, fontSize: size, lineHeight: 1, position: "relative" }}>٧٥٪</span>
  );
  const labelEl = (
    <p style={{ color: text, opacity: 0.7, fontSize: "0.6rem", marginTop: 6, position: "relative" }}>متوسّط تقدّمك</p>
  );

  return (
    <div
      className="grid w-full place-items-center rounded-2xl p-3"
      style={{ background: hsl(v.background), aspectRatio: "160 / 108" }}
    >
      <div
        className="relative w-full max-w-[9rem] overflow-hidden p-3"
        style={{
          background: fill,
          boxShadow: ring,
          borderRadius: "0.9rem",
          textAlign: centered ? "center" : "right",
        }}
      >
        {/* غلالة المُغلَّل ولمعة اللامع — طبقتان خلف النصّ لا فوقه */}
        {tile.surface === "tint" && (
          <span style={{ position: "absolute", inset: 0, background: hsl(v.card), opacity: 0.82 }} />
        )}
        {tile.surface === "sheen" && (
          <span style={{ position: "absolute", inset: 0, background: "linear-gradient(115deg, transparent 38%, hsl(0 0% 100% / 0.22) 50%, transparent 62%)" }} />
        )}
        {artOn && <span style={artStyle} />}

        {split ? (
          <div style={{ position: "relative", display: "flex", alignItems: "center", gap: "0.5rem" }}>
            <span style={{ background: accent, borderRadius: "0.55rem", padding: "0.3rem", display: "grid", flex: "none" }}>
              {badgeEl}
            </span>
            <span style={{ minWidth: 0, flex: 1 }}>
              {numEl("1.2rem")}
              {labelEl}
            </span>
          </div>
        ) : overlay ? (
          <div style={{ position: "relative", minHeight: 58 }}>
            <span style={{ position: "absolute", insetInlineStart: 0, top: 0 }}>{badgeEl}</span>
            <p style={{ marginTop: 26 }}>{numEl("1.5rem")}</p>
            {labelEl}
          </div>
        ) : (
          <>
            <div
              style={{
                position: "relative",
                display: "flex",
                alignItems: "center",
                gap: "0.5rem",
                justifyContent: centered ? "center" : "space-between",
                flexDirection: inline ? "row-reverse" : "row",
              }}
            >
              {badgeEl}
              {inline && numEl("1.1rem")}
            </div>

            {!inline && (
              <p style={{ marginTop: 10, position: "relative" }}>{numEl("1.35rem")}</p>
            )}
            {labelEl}
          </>
        )}
      </div>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/*  معاينة شريط الأدوات                                                */
/* ------------------------------------------------------------------ */

export function ToolbarPreview({ bar, skin }: { bar: ToolbarStyle; skin: StudentSkin }) {
  const v = skin.vars;
  const uid = useUid("tb");

  const ink = bar.surface === "ink";
  const gold = hsl(v.gold);
  const fg = ink ? "#fff" : hsl(v.foreground);

  const H_BAR = bar.height === "compact" ? 15 : bar.height === "tall" ? 25 : 20;
  const side = 30;                    // شريط جانبي يوضّح السياق
  const top = bar.art === "hang" ? 7
    : bar.art === "pill" || bar.art === "pods" ? 6
      : bar.art === "wings" || bar.art === "float" ? 5 : 0;
  const bx = 0;
  const bw = W - side;
  const by = top;

  const fill =
    bar.surface === "outline" || bar.art === "rule" ? "none"
      : bar.surface === "glass" ? hsl(v.card, 0.6)
        : bar.surface === "gradient" ? `url(#${uid}-g)`
          : ink ? hsl(v.primary)
            : hsl(v.card);

  /* ---------------- صورة الشريط لكل هيئة ---------------- */
  const b = by, r = bx + bw, bot = by + H_BAR, cx = bx + bw / 2;

  function silhouette(): string {
    switch (bar.art) {
      case "mihrab":
        /* كوّة مقوّسة في وسط الحافّة السفلى */
        return `M${bx} ${b} H${r} V${bot} H${cx + 20} A20 7 0 0 0 ${cx - 20} ${bot} H${bx} Z`;
      case "arcade": {
        /* صفّ عقود متتالية */
        const step = 11;
        let d = `M${bx} ${b} H${r} V${bot - 5} `;
        for (let x = r; x > bx; x -= step) {
          d += `A${step / 2} 5 0 0 1 ${Math.max(bx, x - step)} ${bot - 5} `;
        }
        return d + `V${b} Z`;
      }
      case "serrated": {
        const step = 7;
        let d = `M${bx} ${b} H${r} V${bot - 4} `;
        let up = true;
        for (let x = r; x > bx; x -= step / 2) {
          d += `L${Math.max(bx, x - step / 2)} ${up ? bot : bot - 4} `;
          up = !up;
        }
        return d + `V${b} Z`;
      }
      case "torn": {
        const step = 9;
        let d = `M${bx} ${b} H${r} V${bot - 5} `;
        for (let x = r, i = 0; x > bx; x -= step, i++) {
          const dip = i % 2 ? 5 : 2.5;
          d += `Q${x - step / 2} ${bot - 5 + dip} ${Math.max(bx, x - step)} ${bot - 5} `;
        }
        return d + `V${b} Z`;
      }
      case "plaque": {
        const c = 5;
        return `M${bx + c} ${b} H${r - c} L${r} ${b + c} V${bot - c} L${r - c} ${bot} H${bx + c} L${bx} ${bot - c} V${b + c} Z`;
      }
      case "tughra":
        return `M${bx} ${b} H${r} V${bot} H${bx + 12} A12 12 0 0 1 ${bx} ${bot - 12} Z`;
      case "slant":
        return `M${bx} ${b} H${r} V${bot} L${bx} ${bot - 7} Z`;
      case "page":
        return `M${bx} ${b} H${r} V${bot - 8} L${r - 8} ${bot} H${bx} Z`;
      case "inkdrop":
        return `M${bx} ${b} H${r} V${bot} H${cx + 11} A11 8 0 0 1 ${cx - 11} ${bot} H${bx} Z`;
      default:
        return "";
    }
  }

  const path = silhouette();
  const rx =
    bar.art === "float" || bar.art === "pill" ? H_BAR / 2
      : bar.art === "wings" ? 5
        : bar.art === "hang" ? 0
          : bar.art === "frame" ? 4
            : bar.art === "window" ? 7
              : bar.surface === "floating" ? 5 : 0;

  return (
    <svg viewBox={`0 0 ${W} ${H}`} className="block w-full rounded-2xl" style={{ aspectRatio: `${W} / ${H}` }}>
      <defs>
        <linearGradient id={`${uid}-g`} x1={bx} y1="0" x2={bx + bw} y2="0" gradientUnits="userSpaceOnUse">
          <stop offset="0%" stopColor={hsl(v.card)} />
          <stop offset="100%" stopColor={hsl(v.muted)} />
        </linearGradient>
        <clipPath id={`${uid}-wings`}>
          <rect x={bx} y={b} width={bw / 2 - 7} height={H_BAR} />
          <rect x={cx + 7} y={b} width={bw / 2 - 7} height={H_BAR} />
        </clipPath>
      </defs>

      <rect width={W} height={H} fill={hsl(v.background)} />

      {/* شريط جانبي — سياق يوضّح موضع التول بار */}
      <rect x={W - side} y={0} width={side} height={H} fill={hsl(v.card)} />
      <rect x={W - side + 6} y={9} width={18} height={3} rx={1.5} fill={hsl(v.foreground, 0.35)} />
      {[0, 1, 2, 3].map((i) => (
        <rect key={i} x={W - side + 6} y={20 + i * 8} width={18} height={2.5} rx={1.2} fill={hsl(v.foreground, 0.16)} />
      ))}

      {/* الظلّ الطويل يُرسم أوّلاً فيقع خلف الشريط */}
      {bar.art === "longshadow" && (
        <path d={`M${bx} ${bot} H${r} L${r - 14} ${H} H${bx} Z`} fill={hsl(v.primary, 0.18)} />
      )}
      {bar.art === "shamsa" && (
        <ellipse cx={cx} cy={b} rx={34} ry={20} fill={gold} opacity={0.28} />
      )}

      {/* الحمّالتان قبل الشريط */}
      {bar.art === "hang" && (
        <>
          <rect x={bx + bw * 0.22} y={0} width={1.2} height={top} fill={gold} opacity={0.7} />
          <rect x={bx + bw * 0.78} y={0} width={1.2} height={top} fill={gold} opacity={0.7} />
        </>
      )}

      {/* الحُبيبات: ثلاثة أقراص بدل شريط واحد */}
      {bar.art === "pods" ? (
        <g>
          <rect x={bx} y={b} width={26} height={H_BAR} rx={H_BAR / 2} fill={fill} />
          <rect x={bx + 30} y={b} width={bw - 74} height={H_BAR} rx={H_BAR / 2} fill={fill} />
          <rect x={r - 40} y={b} width={40} height={H_BAR} rx={H_BAR / 2} fill={fill} />
        </g>
      ) : null}

      {/* حلقة الكبسولة العائمة */}
      {bar.art === "pill" && (
        <rect x={bx - 1.6} y={b - 1.6} width={bw + 3.2} height={H_BAR + 3.2} rx={(H_BAR + 3.2) / 2}
          fill="none" stroke={gold} strokeWidth={0.7} opacity={0.45} />
      )}

      {/* جسم الشريط */}
      {bar.art === "pods" ? null : path ? (
        <path d={path} fill={fill} stroke={bar.surface === "outline" ? hsl(v.border) : "none"} strokeWidth={0.8} />
      ) : (
        <rect
          x={bx} y={b} width={bw} height={H_BAR}
          rx={bar.art === "hang" ? 0 : rx}
          fill={fill}
          stroke={bar.surface === "outline" || bar.art === "frame" || bar.art === "window" ? hsl(v.border) : "none"}
          strokeWidth={bar.art === "frame" || bar.art === "window" ? 1.1 : 0.8}
          clipPath={bar.art === "wings" ? `url(#${uid}-wings)` : undefined}
        />
      )}

      {/* حليات كل هيئة */}
      {bar.art === "mihrab" && (
        <path d={`M${cx + 20} ${bot} A20 7 0 0 0 ${cx - 20} ${bot}`} fill="none" stroke={gold} strokeWidth={1} />
      )}
      {bar.art === "plaque" && (
        <rect x={bx + 3} y={b + 3} width={bw - 6} height={H_BAR - 6} rx={3} fill="none" stroke={gold} strokeWidth={0.7} opacity={0.65} />
      )}
      {bar.art === "frame" && (
        <rect x={bx + 2.5} y={b + 2.5} width={bw - 5} height={H_BAR - 5} rx={2.5} fill="none" stroke={gold} strokeWidth={0.7} opacity={0.6} />
      )}
      {bar.art === "tughra" && (
        <g fill="none" stroke={gold} strokeWidth={0.9} opacity={0.8}>
          <circle cx={bx + 10} cy={b + H_BAR / 2} r={6.5} />
          <circle cx={bx + 19} cy={b + H_BAR / 2 - 1.5} r={4.5} opacity={0.7} />
          <circle cx={bx + 26} cy={b + H_BAR / 2 + 1.5} r={3} opacity={0.5} />
        </g>
      )}
      {bar.art === "kufi" && (
        <g fill={gold} opacity={0.6}>
          {Array.from({ length: Math.floor(bw / 8) }).map((_, i) => (
            <rect key={i} x={bx + i * 8} y={b} width={3.5} height={2.2} />
          ))}
        </g>
      )}
      {bar.art === "shamsa" && (
        <circle cx={cx} cy={b + H_BAR / 2} r={9} fill="none" stroke={gold} strokeWidth={0.9} opacity={0.7} />
      )}
      {bar.art === "slant" && (
        <path d={`M${bx} ${bot - 7} L${r} ${bot}`} stroke={gold} strokeWidth={1.2} fill="none" />
      )}
      {bar.art === "page" && (
        <path d={`M${r} ${bot - 8} L${r - 8} ${bot} L${r} ${bot} Z`} fill={gold} opacity={0.5} />
      )}
      {bar.art === "belt" && (
        <rect x={cx - 11} y={b} width={22} height={H_BAR} fill={gold} opacity={0.45} />
      )}
      {bar.art === "rule" && (
        <rect x={bx + 6} y={bot - 1.6} width={bw - 12} height={1.6} rx={0.8} fill={gold} />
      )}
      {bar.art === "float" && (
        <rect x={bx} y={bot + 5} width={bw} height={0.8} fill={hsl(v.border)} />
      )}
      {bar.art === "window" && (
        <g stroke={hsl(v.border)} strokeWidth={1}>
          <line x1={bx + bw * 0.28} y1={b} x2={bx + bw * 0.28} y2={bot} />
          <line x1={bx + bw * 0.72} y1={b} x2={bx + bw * 0.72} y2={bot} />
        </g>
      )}

      {/* الحافّة السفلى (المحور الثانوي) */}
      {bar.edge === "gold" && !path && bar.art === "plain" && (
        <rect x={bx} y={bot - 1.2} width={bw} height={1.2} fill={gold} />
      )}
      {bar.edge === "line" && bar.art === "plain" && (
        <rect x={bx} y={bot} width={bw} height={0.8} fill={hsl(v.border)} />
      )}

      {/* المحتوى: الشعار · البحث · الأدوات */}
      {(() => {
        const my = b + H_BAR / 2;
        const searchW = bar.search === "none" ? 0 : bar.search === "icon" ? 11 : bar.search === "pill" ? 28 : 48;
        const gapMid = bar.art === "wings" ? 14 : 0;
        return (
          <g>
            {/* الشعار */}
            <circle cx={bx + (bar.art === "tughra" ? 34 : 9)} cy={my} r={4} fill={ink ? "#fff" : hsl(v.primary)} opacity={ink ? 0.9 : 1} />
            <rect x={bx + (bar.art === "tughra" ? 40 : 15)} y={my - 1.5} width={20} height={3} rx={1.5} fill={fg} opacity={0.65} />

            {/* البحث */}
            {searchW > 0 && (
              <rect
                x={cx - searchW / 2 + gapMid} y={my - 3.5} width={searchW} height={7}
                rx={3.5}
                fill={ink ? "#fff" : hsl(v.muted)}
                opacity={ink ? 0.18 : 1}
              />
            )}

            {/* الأدوات */}
            {bar.grouped && (
              <rect x={r - 34} y={my - 5} width={31} height={10} rx={5} fill={ink ? "#fff" : hsl(v.muted)} opacity={ink ? 0.14 : 0.85} />
            )}
            {[0, 1, 2].map((i) => (
              <circle key={i} cx={r - 8 - i * 9.5} cy={my} r={2.6} fill={fg} opacity={0.5} />
            ))}
          </g>
        );
      })()}
    </svg>
  );
}

/* ------------------------------------------------------------------ */
/*  معاينة قسم الخطط                                                   */
/* ------------------------------------------------------------------ */

export function PlansPreview({ style, skin }: { style: PlansStyle; skin: StudentSkin }) {
  const v = skin.vars;
  const tone = hsl(v.primary);
  const list = style.grid === "list";
  const cols = list ? 1 : style.grid === "two" || style.grid === "wide" ? 2 : 3;
  const n = list ? 3 : cols;

  const pad = 8;
  const gap = 4;
  const inner = W - pad * 2;
  const cw = list ? inner : (inner - gap * (cols - 1)) / cols;
  const ch = list ? 18 : 62;
  const top = 30;
  const featured = list ? 1 : Math.floor(cols / 2);

  /** شكل البطاقة — القصّ يُرسم مساراً لأنه شكل حقيقي لا حدّ. */
  const cardPath = (x: number, y: number, w: number, h: number) => {
    if (style.surface === "plaque") {
      const c = 6;
      return `M${x + c} ${y} H${x + w - c} L${x + w} ${y + c} V${y + h - c} L${x + w - c} ${y + h} H${x + c} L${x} ${y + h - c} V${y + c} Z`;
    }
    if (style.surface === "ticket") {
      const m = y + h / 2;
      return `M${x} ${y} H${x + w} V${m - 4} L${x + w - 3} ${m} L${x + w} ${m + 4} V${y + h} H${x} V${m + 4} L${x + 3} ${m} L${x} ${m - 4} Z`;
    }
    return null;
  };

  return (
    <svg viewBox={`0 0 ${W} ${H}`} className="block w-full rounded-2xl" style={{ aspectRatio: `${W} / ${H}` }}>
      <rect width={W} height={H} fill={hsl(v.background)} />

      {/* عنوان القسم */}
      <rect x={W / 2 - 26} y={10} width={52} height={4} rx={2} fill={hsl(v.foreground, 0.6)} />
      <rect x={W / 2 - 16} y={18} width={32} height={2.5} rx={1.2} fill={hsl(v.accent)} />

      {Array.from({ length: n }).map((_, i) => {
        const on = i === featured;
        const x = list ? pad : pad + i * (cw + gap);
        const y = list ? top + i * (ch + gap) : top - (on && style.featured === "lift" ? 5 : 0);
        const h = ch + (on && style.featured === "scale" ? 6 : 0);
        const w = cw + (on && style.featured === "scale" ? 4 : 0);
        const xx = x - (on && style.featured === "scale" ? 2 : 0);
        const d = cardPath(xx, y, w, h);

        const fill =
          style.surface === "outline" ? "none"
            : style.surface === "glass" ? hsl(v.card, 0.6)
              : hsl(v.card);
        const stroke =
          style.featured === "border" && on ? tone
            : style.surface === "outline" ? hsl(v.border)
              : style.surface === "soft" ? "none"
                : hsl(v.border);

        return (
          <g key={i}>
            {/* هالة الخطة المميّزة */}
            {on && style.featured === "glow" && (
              <rect x={xx - 2} y={y - 2} width={w + 4} height={h + 4} rx={7} fill={tone} opacity={0.16} />
            )}

            {d ? (
              <path d={d} fill={fill} stroke={stroke} strokeWidth={on ? 1.4 : 0.8} />
            ) : (
              <rect x={xx} y={y} width={w} height={h} rx={5} fill={fill} stroke={stroke} strokeWidth={on ? 1.4 : 0.8} />
            )}

            {/* تاج علوي */}
            {on && style.featured === "crown" && (
              <rect x={xx} y={y} width={w} height={2.5} rx={1.2} fill={tone} />
            )}

            {/* السعر بأشكاله */}
            {style.price === "circle" ? (
              <>
                <circle cx={xx + w / 2} cy={y + h * 0.42} r={Math.min(13, w / 3)} fill={tone} opacity={0.14} />
                <circle cx={xx + w / 2} cy={y + h * 0.42} r={Math.min(13, w / 3)} fill="none" stroke={tone} strokeWidth={1} opacity={0.5} />
                <rect x={xx + w / 2 - 7} y={y + h * 0.42 - 1.5} width={14} height={3.5} rx={1.7} fill={tone} />
              </>
            ) : style.price === "badge" ? (
              <>
                {/* الشارة في موضع السعر — وموضعه يحدّده نمط العرض لا هذا الفرع */}
                <rect x={xx + 5} y={y + h * 0.3} width={Math.min(34, w - 10)} height={9} rx={4.5} fill={tone} opacity={0.16} />
                <rect x={xx + 8} y={y + h * 0.3 + 3} width={Math.min(20, w - 16)} height={3} rx={1.5} fill={tone} />
              </>
            ) : (
              <rect
                x={xx + 5}
                y={y + (style.price === "top" ? 5 : h * 0.32)}
                width={Math.min(22, w - 10)}
                height={5}
                rx={2.5}
                fill={tone}
              />
            )}

            {/* الاسم والمزايا */}
            <rect x={xx + 5} y={y + (style.price === "top" ? 15 : h * 0.16)} width={Math.min(26, w - 10)} height={3} rx={1.5} fill={hsl(v.foreground, 0.5)} />
            {!list && (
              <>
                <rect x={xx + 5} y={y + h * 0.55} width={w - 12} height={2} rx={1} fill={hsl(v.foreground, 0.22)} />
                <rect x={xx + 5} y={y + h * 0.63} width={w - 16} height={2} rx={1} fill={hsl(v.foreground, 0.22)} />
                <rect x={xx + 5} y={y + h * 0.71} width={w - 20} height={2} rx={1} fill={hsl(v.foreground, 0.22)} />
              </>
            )}

            {/* الزرّ */}
            <rect
              x={xx + 5}
              y={y + h - 11}
              width={w - 10}
              height={7}
              rx={3.5}
              fill={on ? tone : "none"}
              stroke={on ? "none" : tone}
              strokeWidth={0.9}
            />
          </g>
        );
      })}
    </svg>
  );
}

/* ------------------------------------------------------------------ */
/*  معاينة قسم الهيرو                                                  */
/* ------------------------------------------------------------------ */

export function HeroStylePreview({ style, skin }: { style: HeroStyle; skin: StudentSkin }) {
  const v = skin.vars;
  const uid = useUid("hs");
  const tone = hsl(v.primary);
  const gold = hsl(v.gold);

  const pad = 8;
  const colW = (W - pad * 2) * 0.55;
  const imgX = pad + colW + 6;
  const imgW = W - imgX - pad;

  const stack = style.buttons === "stack";
  const wide = style.buttons === "wide";
  const btnW = stack || wide ? colW : colW * 0.45;

  let y = 26;

  return (
    <svg viewBox={`0 0 ${W} ${H}`} className="block w-full rounded-2xl" style={{ aspectRatio: `${W} / ${H}` }}>
      <defs>
        <linearGradient id={`${uid}-t`} x1={pad} y1="0" x2={pad + colW} y2="0" gradientUnits="userSpaceOnUse">
          <stop offset="0%" stopColor={tone} />
          <stop offset="100%" stopColor={gold} />
        </linearGradient>
        <pattern id={`${uid}-k`} width="10" height="10" patternUnits="userSpaceOnUse">
          <path d="M2 8V2H5V5H8" fill="none" stroke={tone} strokeWidth="0.7" opacity="0.35" />
        </pattern>
      </defs>

      <rect width={W} height={H} fill={hsl(v.background)} />

      {/* الزخرفة بكثافتها */}
      {(style.decor === "full" || style.decor === "soft") && (
        <rect width={W} height={H * 0.7} fill={`url(#${uid}-k)`} opacity={style.decor === "full" ? 0.5 : 0.25} />
      )}
      {(style.decor === "full" || style.decor === "text") && (
        <g fill={tone} opacity={0.09} fontSize="26" fontWeight="700">
          <text x={W * 0.18} y={H * 0.45}>ض</text>
          <text x={W * 0.62} y={H * 0.85}>ن</text>
        </g>
      )}
      {style.decor === "full" && (
        <circle cx={imgX + imgW / 2} cy={H * 0.45} r={30} fill="none" stroke={gold} strokeWidth="0.8" opacity={0.3} />
      )}

      {/* شريط علوي */}
      <rect x={pad} y={6} width={W - pad * 2} height={7} rx={3.5} fill={hsl(v.card)} />

      {/* الشارة */}
      {style.pill !== "none" && (
        <>
          {style.pill === "capsule" && (
            <rect x={pad} y={y} width={40} height={8} rx={4} fill={gold} opacity={0.18} />
          )}
          {style.pill === "plaque" && (
            <path
              d={`M${pad + 3} ${y} H${pad + 37} L${pad + 40} ${y + 3} V${y + 5} L${pad + 37} ${y + 8} H${pad + 3} L${pad} ${y + 5} V${y + 3} Z`}
              fill={gold}
              opacity={0.2}
            />
          )}
          {style.pill === "dot" && <circle cx={pad + 3} cy={y + 4} r={2} fill={gold} />}
          <rect x={pad + (style.pill === "dot" ? 8 : 5)} y={y + 3} width={22} height={2} rx={1} fill={tone} opacity={0.65} />
        </>
      )}

      {/* العنوان بمعالجته */}
      {(() => {
        const ty = style.pill === "none" ? 28 : 44;
        const tw = colW * 0.9;
        return (
          <g>
            {style.title === "mark" && (
              <rect x={pad - 1} y={ty - 6} width={tw * 0.62} height={11} rx={2.5} fill={gold} opacity={0.25} />
            )}
            <rect
              x={pad}
              y={ty - 4}
              width={tw * 0.6}
              height={7}
              rx={2}
              fill={style.title === "gradient" ? `url(#${uid}-t)` : style.title === "outline" ? "none" : tone}
              stroke={style.title === "outline" ? tone : "none"}
              strokeWidth={style.title === "outline" ? 1 : 0}
            />
            <rect x={pad} y={ty + 6} width={tw * 0.85} height={5} rx={2} fill={hsl(v.foreground, 0.4)} />
            {style.title === "underline" && (
              <rect x={pad} y={ty + 4.5} width={tw * 0.6} height={1.8} rx={0.9} fill={gold} />
            )}
          </g>
        );
      })()}

      {/* النبذة */}
      <rect x={pad} y={style.pill === "none" ? 46 : 62} width={colW * 0.95} height={3} rx={1.5} fill={hsl(v.foreground, 0.2)} />
      <rect x={pad} y={style.pill === "none" ? 52 : 68} width={colW * 0.7} height={3} rx={1.5} fill={hsl(v.foreground, 0.2)} />

      {/* الأزرار */}
      {(() => {
        const by = style.pill === "none" ? 62 : 78;
        return stack ? (
          <>
            <rect x={pad} y={by} width={btnW} height={9} rx={4.5} fill={tone} />
            <rect x={pad} y={by + 12} width={btnW} height={9} rx={4.5} fill="none" stroke={tone} strokeWidth={0.9} />
          </>
        ) : (
          <>
            <rect x={pad} y={by} width={btnW} height={9} rx={4.5} fill={tone} />
            <rect x={pad + btnW + 4} y={by} width={btnW} height={9} rx={4.5} fill="none" stroke={tone} strokeWidth={0.9} />
          </>
        );
      })()}

      {/* الصورة */}
      <rect x={imgX} y={26} width={imgW} height={H - 38} rx={6} fill={tone} opacity={0.75} />
      <circle cx={imgX + imgW / 2} cy={H * 0.42} r={imgW * 0.22} fill="#fff" opacity={0.25} />
    </svg>
  );
}

/* ------------------------------------------------------------------ */
/*  معاينة بوّابة الدفع                                                */
/* ------------------------------------------------------------------ */

export function PayPreview({
  style, colors, skin,
}: {
  style: PayStyle;
  colors?: { bg?: string; accent?: string; text?: string };
  skin: StudentSkin;
}) {
  const v = skin.vars;
  const accent = colors?.accent || hsl(v.primary);
  const surface = colors?.bg || hsl(v.card);
  const text = colors?.text || hsl(v.foreground);
  const border = hsl(v.border);

  const pad = 9;
  const inner = W - pad * 2;

  /* سطح البطاقة — القصّ مسارٌ لأنه شكل حقيقي لا حدّ */
  const plaque = (x: number, y: number, w: number, h: number) => {
    const c = 4;
    return `M${x + c} ${y} H${x + w - c} L${x + w} ${y + c} V${y + h - c} L${x + w - c} ${y + h} H${x + c} L${x} ${y + h - c} V${y + c} Z`;
  };

  const fill =
    style.surface === "outline" ? "none"
      : style.surface === "glass" ? hsl(v.card, 0.55)
        : surface;
  const stroke = style.surface === "soft" ? "none" : border;
  const strokeW = style.surface === "outline" ? 1.4 : 0.8;
  const radius = style.surface === "soft" ? 6 : style.surface === "glass" ? 5.5 : 4.5;

  /* ترتيب الطرق */
  const tabs = style.list === "tabs";
  const grid = style.list === "grid";
  const compact = style.list === "compact";
  const n = tabs ? 3 : grid ? 4 : 3;
  const mh = tabs ? 9 : grid ? 20 : compact ? 10 : 14;
  const gap = compact ? 2.5 : 3.5;
  const cols = grid ? 2 : tabs ? 3 : 1;
  const mw = (inner - gap * (cols - 1)) / cols;

  const listTop = 30;
  const listH = Math.ceil(n / cols) * (mh + gap) - gap;
  const detTop = listTop + listH + 5;
  const detH = Math.max(12, H - detTop - pad);

  return (
    <svg viewBox={`0 0 ${W} ${H}`} className="block w-full rounded-2xl" style={{ aspectRatio: `${W} / ${H}` }}>
      <rect width={W} height={H} fill={hsl(v.background)} />

      {/* العنوان */}
      <rect x={pad} y={8} width={44} height={4} rx={2} fill={text} opacity={0.65} />
      <rect x={pad} y={15} width={62} height={2.5} rx={1.2} fill={text} opacity={0.25} />

      {/* مؤشّر الخطوات */}
      {style.steps !== "none" && (
        <g>
          {Array.from({ length: 3 }).map((_, i) => {
            const on = i === 1;
            if (style.steps === "bar") {
              const w = (inner - 4) / 3;
              return (
                <rect key={i} x={pad + i * (w + 2)} y={23} width={w} height={2} rx={1}
                  fill={i <= 1 ? accent : border} />
              );
            }
            if (style.steps === "numbers") {
              return (
                <circle key={i} cx={pad + 5 + i * 12} cy={24} r={4}
                  fill={on || i === 0 ? accent : hsl(v.muted)} opacity={on || i === 0 ? 1 : 0.9} />
              );
            }
            return (
              <rect key={i} x={pad + i * 9} y={23} width={on ? 7 : 3} height={3} rx={1.5}
                fill={on ? accent : border} />
            );
          })}
        </g>
      )}

      {/* طرق الدفع */}
      {Array.from({ length: n }).map((_, i) => {
        const col = i % cols;
        const row = Math.floor(i / cols);
        const x = pad + col * (mw + gap);
        const y = listTop + row * (mh + gap);
        const on = i === 0;
        const d = style.surface === "plaque" ? plaque(x, y, mw, mh) : null;
        const rx = tabs ? mh / 2 : radius;

        return (
          <g key={i}>
            {d ? (
              <path d={d} fill={on ? accent : fill} fillOpacity={on ? 0.12 : 1}
                stroke={on ? accent : stroke} strokeWidth={on ? 1.6 : strokeW} />
            ) : (
              <rect x={x} y={y} width={mw} height={mh} rx={rx}
                fill={on ? accent : fill} fillOpacity={on ? 0.12 : 1}
                stroke={on ? accent : stroke} strokeWidth={on ? 1.6 : strokeW} />
            )}

            {/* أيقونة الطريقة واسمها */}
            {!tabs && (
              <rect x={x + 3} y={y + (grid ? 3 : mh / 2 - (compact ? 2.5 : 3.5))}
                width={compact ? 5 : 7} height={compact ? 5 : 7} rx={2} fill={accent} opacity={0.55} />
            )}
            <rect
              x={tabs ? x + mw / 2 - 8 : grid ? x + 3 : x + (compact ? 11 : 13)}
              y={tabs ? y + mh / 2 - 1.2 : grid ? y + 12 : y + mh / 2 - (compact ? 1.2 : 3)}
              width={tabs ? 16 : grid ? mw - 8 : mw - (compact ? 16 : 20)}
              height={2.4} rx={1.2} fill={text} opacity={0.6}
            />
            {!compact && !tabs && (
              <rect x={grid ? x + 3 : x + 13} y={grid ? y + 16 : y + mh / 2 + 1.5}
                width={grid ? mw - 14 : mw - 30} height={2} rx={1} fill={text} opacity={0.25} />
            )}
          </g>
        );
      })}

      {/* بيانات التحويل */}
      {(() => {
        if (style.details === "plain") {
          return (
            <g>
              <rect x={pad} y={detTop + 2} width={30} height={2.4} rx={1.2} fill={text} opacity={0.4} />
              <rect x={pad} y={detTop + 8} width={58} height={3.4} rx={1.5} fill={text} opacity={0.75} />
              <rect x={pad} y={detTop + detH - 1} width={inner} height={0.8} fill={border} />
            </g>
          );
        }
        const box =
          style.details === "ticket"
            ? `M${pad} ${detTop} H${pad + inner} V${detTop + detH / 2 - 3} L${pad + inner - 2} ${detTop + detH / 2} L${pad + inner} ${detTop + detH / 2 + 3} V${detTop + detH} H${pad} V${detTop + detH / 2 + 3} L${pad + 2} ${detTop + detH / 2} L${pad} ${detTop + detH / 2 - 3} Z`
            : null;
        const bg = style.details === "mono" ? hsl(v.muted) : accent;
        const op = style.details === "mono" ? 1 : 0.12;
        return (
          <g>
            {box ? (
              <path d={box} fill={surface} stroke={border} strokeWidth={0.8} />
            ) : (
              <rect x={pad} y={detTop} width={inner} height={detH} rx={4} fill={bg} fillOpacity={op}
                stroke={style.details === "card" ? accent : border} strokeOpacity={style.details === "card" ? 0.4 : 1} strokeWidth={0.8} />
            )}
            <rect x={pad + 5} y={detTop + 3.5} width={26} height={2.2} rx={1.1} fill={text} opacity={0.4} />
            <rect x={pad + 5} y={detTop + 8.5} width={style.details === "mono" ? 66 : 52}
              height={style.details === "mono" ? 4.5 : 3.4} rx={1.5} fill={text}
              opacity={style.details === "mono" ? 0.85 : 0.7} />
          </g>
        );
      })()}
    </svg>
  );
}

/* ------------------------------------------------------------------ */
/*  معاينة أقسام البطاقات                                              */
/* ------------------------------------------------------------------ */

export function SectionPreview({ style, skin }: { style: SectionStyle; skin: StudentSkin }) {
  const v = skin.vars;
  const tone = hsl(v.primary);
  const gold = hsl(v.gold);
  const text = hsl(v.foreground);

  const pad = 9;
  const inner = W - pad * 2;

  /* الشبكة — الأعمدة والصفوف بحسب المحور */
  const list = style.grid === "list";
  const cols = list ? 1 : style.grid === "two" || style.grid === "wide" ? 2 : 3;
  const rows = list ? 3 : style.grid === "three" || style.grid === "auto" ? 2 : 2;
  const n = list ? 3 : cols * rows;

  const gap = 3.5;
  const cw = (inner - gap * (cols - 1)) / cols;
  const ch = list ? 13 : 21;

  /* العنوان بمعالجته */
  const headH = style.head === "badge" ? 24 : style.head === "rule" ? 22 : 17;
  const top = headH + 6;

  const cardFill =
    style.card === "outline" ? "none"
      : style.card === "glass" || style.card === "brand" ? hsl(v.card, 0.55)
        : style.card === "tint" ? tone
          : hsl(v.card);
  const cardOpacity = style.card === "tint" ? 0.12 : 1;
  const cardStroke =
    style.card === "soft" ? "none"
      : style.card === "plaque" || style.card === "brand" ? gold
        : style.card === "tint" ? tone
          : hsl(v.border);

  /* شكل البطاقة — القصّ مسارٌ لأنه شكل حقيقي لا حدّ */
  const shape = (x: number, y: number, w: number, h: number) => {
    if (style.card === "plaque") {
      const c = 3.5;
      return `M${x + c} ${y} H${x + w - c} L${x + w} ${y + c} V${y + h - c} L${x + w - c} ${y + h} H${x + c} L${x} ${y + h - c} V${y + c} Z`;
    }
    if (style.card === "ticket") {
      const m = y + h / 2;
      return `M${x} ${y} H${x + w} V${m - 2.6} L${x + w - 1.6} ${m} L${x + w} ${m + 2.6} V${y + h} H${x} V${m + 2.6} L${x + 1.6} ${m} L${x} ${m - 2.6} Z`;
    }
    return null;
  };

  return (
    <svg viewBox={`0 0 ${W} ${H}`} className="block w-full rounded-2xl" style={{ aspectRatio: `${W} / ${H}` }}>
      <rect width={W} height={H} fill={hsl(v.background)} />

      {/* العنوان */}
      {(() => {
        const startAligned = style.head === "start" || style.head === "split";
        const cx = startAligned ? pad : W / 2;
        const anchorX = (w: number) => (startAligned ? pad : W / 2 - w / 2);
        return (
          <g>
            {style.head === "badge" && (
              <>
                <circle cx={W / 2} cy={9} r={4.5} fill={gold} opacity={0.2} />
                <path d={`M${W / 2} 6.5 L${W / 2 + 1} 8.6 L${W / 2 + 2.4} 9 L${W / 2 + 1} 9.9 L${W / 2} 12 L${W / 2 - 1} 9.9 L${W / 2 - 2.4} 9 L${W / 2 - 1} 8.6 Z`} fill={gold} />
              </>
            )}
            {style.head === "rule" && (
              <rect x={W / 2 - 30} y={7} width={60} height={0.8} fill={gold} opacity={0.7} />
            )}

            <rect x={anchorX(46)} y={style.head === "badge" ? 16 : style.head === "rule" ? 11 : 7} width={46} height={5} rx={2.5} fill={text} opacity={0.68} />
            <rect
              x={style.head === "split" ? W - pad - 40 : anchorX(62)}
              y={style.head === "split" ? 9 : style.head === "badge" ? 24 : style.head === "rule" ? 19 : 15}
              width={style.head === "split" ? 40 : 62}
              height={3}
              rx={1.5}
              fill={text}
              opacity={0.24}
            />
            {style.head === "rule" && (
              <rect x={W / 2 - 30} y={25} width={60} height={0.8} fill={gold} opacity={0.7} />
            )}
            {startAligned && <rect x={pad} y={style.head === "split" ? 17 : 22} width={18} height={1.4} rx={0.7} fill={gold} />}
            {cx < 0 && null}
          </g>
        );
      })()}

      {/* البطاقات */}
      {Array.from({ length: n }).map((_, i) => {
        const col = i % cols;
        const row = Math.floor(i / cols);
        const stagger = style.grid === "stagger" && col % 2 === 1 ? 3.5 : 0;
        const x = pad + col * (cw + gap);
        const y = top + row * (ch + gap) + stagger;
        if (y + ch > H - 2) return null;
        const d = shape(x, y, cw, ch);

        return (
          <g key={i}>
            {d ? (
              <path d={d} fill={cardFill} fillOpacity={cardOpacity} stroke={cardStroke} strokeWidth={style.card === "outline" ? 1.2 : 0.7} />
            ) : (
              <rect
                x={x} y={y} width={cw} height={ch}
                rx={style.card === "soft" ? 6 : style.card === "outline" ? 4 : 5}
                fill={cardFill} fillOpacity={cardOpacity}
                stroke={cardStroke} strokeWidth={style.card === "outline" ? 1.2 : 0.7}
              />
            )}

            {/* زخرفة الحافّة */}
            {style.edge === "top" && <rect x={x} y={y} width={cw} height={1.4} fill={tone} />}
            {style.edge === "side" && <rect x={x} y={y} width={1.4} height={ch} fill={tone} />}
            {style.edge === "corner" && (
              <path d={`M${x + cw - 7} ${y} H${x + cw} V${y + 7}`} fill="none" stroke={gold} strokeWidth={0.8} opacity={0.75} />
            )}
            {style.edge === "glow" && i === 0 && (
              <rect x={x - 1.5} y={y - 1.5} width={cw + 3} height={ch + 3} rx={6} fill="none" stroke={tone} strokeWidth={1.4} opacity={0.3} />
            )}

            {/* محتوى البطاقة */}
            <rect x={x + 4} y={y + 4} width={7} height={7} rx={2} fill={tone} opacity={0.5} />
            <rect x={x + (list ? 15 : 4)} y={y + (list ? 4.5 : 14)} width={Math.min(cw - 20, 30)} height={2.6} rx={1.3} fill={text} opacity={0.55} />
            {ch > 15 && (
              <>
                <rect x={x + (list ? 15 : 4)} y={y + (list ? 9.5 : 19)} width={cw - (list ? 20 : 8)} height={2} rx={1} fill={text} opacity={0.2} />
                {!list && <rect x={x + 4} y={y + 23} width={cw - 14} height={2} rx={1} fill={text} opacity={0.2} />}
              </>
            )}
          </g>
        );
      })}
    </svg>
  );
}

/* ------------------------------------------------------------------ */
/*  معاينة قسم الأسئلة                                                 */
/* ------------------------------------------------------------------ */

export function FaqPreview({ style, skin }: { style: FaqStyle; skin: StudentSkin }) {
  const v = skin.vars;
  const tone = hsl(v.primary);
  const gold = hsl(v.gold);
  const text = hsl(v.foreground);

  const pad = 10;
  const two = style.flow === "two";
  const cols = two ? 2 : 1;
  const gap = style.flow === "spaced" ? 5 : style.flow === "joined" ? 0 : 3;
  const inner = W - pad * 2;
  const iw = (inner - (two ? 4 : 0)) / cols;
  const n = two ? 4 : 3;
  const top = 24;
  const ih = two ? 13 : 16;

  const fill =
    style.surface === "outline" || style.surface === "flat" ? "none"
      : style.surface === "glass" || style.surface === "brand" ? hsl(v.card, 0.55)
        : hsl(v.card);
  const stroke =
    style.surface === "flat" ? "none"
      : style.surface === "plaque" || style.surface === "brand" ? gold
        : hsl(v.border);

  const plaque = (x: number, y: number, w: number, h: number) => {
    const c = 3;
    return `M${x + c} ${y} H${x + w - c} L${x + w} ${y + c} V${y + h - c} L${x + w - c} ${y + h} H${x + c} L${x} ${y + h - c} V${y + c} Z`;
  };

  return (
    <svg viewBox={`0 0 ${W} ${H}`} className="block w-full rounded-2xl" style={{ aspectRatio: `${W} / ${H}` }}>
      <rect width={W} height={H} fill={hsl(v.background)} />

      {/* العنوان */}
      <rect x={W / 2 - 24} y={8} width={48} height={4.5} rx={2.2} fill={text} opacity={0.6} />
      <rect x={W / 2 - 34} y={16} width={68} height={2.6} rx={1.3} fill={text} opacity={0.22} />

      {/* إطار الملتحم */}
      {style.flow === "joined" && (
        <rect x={pad} y={top} width={inner} height={Math.min(n, 3) * ih} rx={4} fill="none" stroke={hsl(v.border)} strokeWidth={0.9} />
      )}

      {Array.from({ length: n }).map((_, i) => {
        const col = i % cols;
        const row = Math.floor(i / cols);
        const x = pad + col * (iw + 4);
        const y = top + row * (ih + gap);
        if (y + ih > H - 3) return null;
        const open = i === 0;
        const d = style.surface === "plaque" && style.flow !== "joined" ? plaque(x, y, iw, ih) : null;

        return (
          <g key={i}>
            {style.flow === "joined" ? (
              i > 0 && <rect x={pad} y={y} width={inner} height={0.7} fill={hsl(v.border)} />
            ) : d ? (
              <path d={d} fill={open && style.open === "tint" ? tone : fill} fillOpacity={open && style.open === "tint" ? 0.09 : 1}
                stroke={open && style.open === "border" ? tone : stroke} strokeWidth={open ? 1.3 : 0.8} />
            ) : (
              <rect x={x} y={y - (open && style.open === "lift" ? 1.5 : 0)} width={iw} height={ih} rx={4}
                fill={open && style.open === "tint" ? tone : fill} fillOpacity={open && style.open === "tint" ? 0.09 : 1}
                stroke={open && style.open === "border" ? tone : stroke} strokeWidth={open ? 1.3 : 0.8} />
            )}

            {open && style.open === "rule" && (
              <rect x={x} y={y + ih - 1.4} width={iw} height={1.4} fill={gold} />
            )}

            {/* السؤال */}
            <rect x={x + 4} y={y + 5} width={iw - 20} height={2.8} rx={1.4} fill={text} opacity={0.6} />

            {/* العلامة */}
            {style.mark !== "none" && (
              style.mark === "dot" ? (
                <circle cx={x + iw - 7} cy={y + 6.4} r={open ? 2.4 : 1.7} fill={open ? gold : hsl(v.border)} />
              ) : (
                <g stroke={open ? tone : text} strokeOpacity={open ? 1 : 0.45} strokeWidth={1.1} fill="none" strokeLinecap="round">
                  {style.mark === "plus" ? (
                    <>
                      <path d={`M${x + iw - 10} ${y + 6.4} H${x + iw - 4}`} />
                      {!open && <path d={`M${x + iw - 7} ${y + 3.4} V${y + 9.4}`} />}
                    </>
                  ) : style.mark === "arrow" ? (
                    <path d={open ? `M${x + iw - 10} ${y + 5} L${x + iw - 7} ${y + 8} L${x + iw - 4} ${y + 5}` : `M${x + iw - 8.5} ${y + 3.6} L${x + iw - 5.5} ${y + 6.4} L${x + iw - 8.5} ${y + 9.2}`} />
                  ) : (
                    <path d={open ? `M${x + iw - 10} ${y + 8} L${x + iw - 7} ${y + 5} L${x + iw - 4} ${y + 8}` : `M${x + iw - 10} ${y + 5} L${x + iw - 7} ${y + 8} L${x + iw - 4} ${y + 5}`} />
                  )}
                </g>
              )
            )}

            {/* الجواب — للمفتوحة وحدها */}
            {open && ih > 14 && (
              <>
                <rect x={x + 4} y={y + 10.5} width={iw - 10} height={1.8} rx={0.9} fill={text} opacity={0.18} />
                <rect x={x + 4} y={y + 13.5} width={iw - 22} height={1.8} rx={0.9} fill={text} opacity={0.18} />
              </>
            )}
          </g>
        );
      })}
    </svg>
  );
}

/* ------------------------------------------------------------------ */
/*  معاينة قسم الدعوة                                                  */
/* ------------------------------------------------------------------ */

export function CtaPreview({ style, skin }: { style: CtaStyle; skin: StudentSkin }) {
  const v = skin.vars;
  const uid = useUid("ct");
  const tone = hsl(v.primary);
  const gold = hsl(v.gold);

  const band = style.shape === "band";
  const pad = band ? 0 : 11;
  const x = pad;
  const y = 16;
  const w = W - pad * 2;
  const h = H - y - (band ? 0 : 14);

  const ink = style.fill !== "glass" && style.fill !== "outline";
  const fg = ink ? "#fff" : hsl(v.foreground);

  const fill =
    style.fill === "gradient" || style.fill === "brand" ? `url(#${uid}-g)`
      : style.fill === "glass" ? hsl(v.card, 0.6)
        : style.fill === "outline" ? "none"
          : tone;

  const shape = () => {
    if (style.shape === "plaque") {
      const c = 7;
      return `M${x + c} ${y} H${x + w - c} L${x + w} ${y + c} V${y + h - c} L${x + w - c} ${y + h} H${x + c} L${x} ${y + h - c} V${y + c} Z`;
    }
    if (style.shape === "ticket") {
      const m = y + h / 2;
      return `M${x} ${y} H${x + w} V${m - 5} L${x + w - 3} ${m} L${x + w} ${m + 5} V${y + h} H${x} V${m + 5} L${x + 3} ${m} L${x} ${m - 5} Z`;
    }
    if (style.shape === "split") {
      return `M${x} ${y} H${x + w} V${y + h} L${x} ${y + h - 8} Z`;
    }
    return null;
  };

  const d = shape();
  const rx = style.shape === "arch" ? 0 : band ? 0 : 9;

  const split = style.layout === "split";
  const stack = style.layout === "stack";
  const cx = split ? x + 8 : x + w / 2;
  const anchor = (bw: number) => (split ? x + 8 : x + w / 2 - bw / 2);

  return (
    <svg viewBox={`0 0 ${W} ${H}`} className="block w-full rounded-2xl" style={{ aspectRatio: `${W} / ${H}` }}>
      <defs>
        <linearGradient id={`${uid}-g`} x1={x} y1={y} x2={x + w} y2={y + h} gradientUnits="userSpaceOnUse">
          <stop offset="0%" stopColor={tone} />
          <stop offset="100%" stopColor={hsl(v.glow)} />
        </linearGradient>
        <clipPath id={`${uid}-arch`}>
          <path d={`M${x} ${y + h} V${y + 20} A${w / 2} 20 0 0 1 ${x + w} ${y + 20} V${y + h} Z`} />
        </clipPath>
      </defs>

      <rect width={W} height={H} fill={hsl(v.background)} />

      {/* اللوح */}
      {style.shape === "arch" ? (
        <path d={`M${x} ${y + h} V${y + 20} A${w / 2} 20 0 0 1 ${x + w} ${y + 20} V${y + h} Z`}
          fill={fill} stroke={style.fill === "outline" ? tone : "none"} strokeWidth={1.3} />
      ) : d ? (
        <path d={d} fill={fill} stroke={style.fill === "outline" ? tone : "none"} strokeWidth={1.3} />
      ) : (
        <rect x={x} y={y} width={w} height={h} rx={rx} fill={fill}
          stroke={style.fill === "outline" ? tone : "none"} strokeWidth={1.3} />
      )}

      {/* الشمسة */}
      {style.fill === "shamsa" && (
        <ellipse cx={x + w / 2} cy={y} rx={w * 0.45} ry={h * 0.55} fill={gold} opacity={0.32}
          clipPath={style.shape === "arch" ? `url(#${uid}-arch)` : undefined} />
      )}

      {/* الزخرفة */}
      {style.decor !== "none" && (
        <g opacity={style.decor === "soft" ? 0.16 : 0.32}>
          {Array.from({ length: 7 }).map((_, i) => (
            <path key={i} d={`M${x + 6 + i * (w / 7)} ${y + h - 6} v-5 h4 v3`} fill="none"
              stroke={ink ? "#fff" : tone} strokeWidth={0.7} />
          ))}
        </g>
      )}

      {/* المحتوى */}
      <rect x={anchor(52)} y={y + h * 0.3} width={52} height={4.5} rx={2.2} fill={fg} opacity={0.9} />
      <rect x={anchor(38)} y={y + h * 0.3 + 8} width={38} height={2.6} rx={1.3} fill={fg} opacity={0.55} />

      {/* الأزرار */}
      {stack ? (
        <>
          <rect x={anchor(40)} y={y + h - 16} width={40} height={6} rx={3} fill={ink ? "#fff" : tone} />
          <rect x={anchor(40)} y={y + h - 8} width={40} height={6} rx={3} fill="none" stroke={ink ? "#fff" : tone} strokeWidth={0.9} opacity={0.8} />
        </>
      ) : split ? (
        <>
          <rect x={x + w - 60} y={y + h / 2 - 3} width={26} height={6.5} rx={3.2} fill={ink ? "#fff" : tone} />
          <rect x={x + w - 31} y={y + h / 2 - 3} width={24} height={6.5} rx={3.2} fill="none" stroke={ink ? "#fff" : tone} strokeWidth={0.9} opacity={0.8} />
        </>
      ) : (
        <>
          <rect x={x + w / 2 - 29} y={y + h - 12} width={27} height={6.5} rx={3.2} fill={ink ? "#fff" : tone} />
          <rect x={x + w / 2 + 2} y={y + h - 12} width={27} height={6.5} rx={3.2} fill="none" stroke={ink ? "#fff" : tone} strokeWidth={0.9} opacity={0.8} />
        </>
      )}
      {cx < 0 && null}
    </svg>
  );
}

/* ------------------------------------------------------------------ */
/*  معاينة الفوتر                                                      */
/* ------------------------------------------------------------------ */

export function FooterPreview({ style, skin }: { style: FooterStyle; skin: StudentSkin }) {
  const v = skin.vars;
  const uid = useUid("ft");
  const gold = hsl(v.gold);
  const ink = style.fill === "ink";
  const fg = ink ? "#fff" : hsl(v.foreground);

  const top = 30;
  const h = H - top;
  const pad = 9;
  const inner = W - pad * 2;

  const fill =
    style.fill === "ink" ? hsl(v.primary)
      : style.fill === "muted" ? hsl(v.muted)
        : style.fill === "gradient" ? `url(#${uid}-g)`
          : hsl(v.background);

  /* توزيع الأعمدة */
  const center = style.cols === "center";
  const stack = style.cols === "stack";
  const cols = center || stack ? 1 : style.cols === "two" ? 2 : style.cols === "even" ? 4 : 3;
  const widths =
    style.cols === "wide" ? [0.44, 0.28, 0.28] : Array.from({ length: cols }, () => 1 / cols);

  /* الحافّة العلوية */
  const edge = () => {
    if (style.edge === "arch") {
      return `M0 ${H} V${top + 12} A${W / 2} 12 0 0 1 ${W} ${top + 12} V${H} Z`;
    }
    if (style.edge === "zigzag") {
      const step = 9;
      let d = `M0 ${H} V${top + 4} `;
      let up = true;
      for (let x = 0; x < W; x += step / 2) {
        d += `L${Math.min(W, x + step / 2)} ${up ? top : top + 4} `;
        up = !up;
      }
      return d + `V${H} Z`;
    }
    return null;
  };
  const ed = edge();

  return (
    <svg viewBox={`0 0 ${W} ${H}`} className="block w-full rounded-2xl" style={{ aspectRatio: `${W} / ${H}` }}>
      <defs>
        <linearGradient id={`${uid}-g`} x1="0" y1={H} x2="0" y2={top} gradientUnits="userSpaceOnUse">
          <stop offset="0%" stopColor={hsl(v.muted)} />
          <stop offset="100%" stopColor={hsl(v.background)} />
        </linearGradient>
      </defs>

      <rect width={W} height={H} fill={hsl(v.background)} />

      {/* محتوى الصفحة فوق الفوتر — سياق */}
      <rect x={pad} y={7} width={W - pad * 2} height={14} rx={4} fill={hsl(v.card)} />

      {/* جسم الفوتر */}
      {ed ? (
        <path d={ed} fill={fill} />
      ) : (
        <rect x={0} y={top} width={W} height={h} fill={fill} />
      )}

      {/* الفاصل */}
      {style.edge === "line" && <rect x={0} y={top} width={W} height={0.8} fill={hsl(v.border)} />}
      {style.edge === "gold" && <rect x={0} y={top} width={W} height={1.6} fill={gold} opacity={0.75} />}

      {/* الأعمدة */}
      {(() => {
        const y0 = top + (ed ? 16 : 8);
        let x = pad;
        return widths.map((frac, i) => {
          const cw = inner * frac - (i < widths.length - 1 ? 3 : 0);
          const cx = center ? W / 2 : x;
          const at = (w: number) => (center ? W / 2 - w / 2 : x);
          const g = (
            <g key={i}>
              {i === 0 && (
                <>
                  <circle cx={center ? W / 2 : x + 4} cy={y0 + 3} r={3.2} fill={ink ? "#fff" : hsl(v.primary)} opacity={0.85} />
                  {!center && <rect x={x + 10} y={y0 + 1.6} width={22} height={3} rx={1.5} fill={fg} opacity={0.7} />}
                </>
              )}
              {i > 0 && <rect x={at(18)} y={y0} width={18} height={2.6} rx={1.3} fill={gold} opacity={0.8} />}
              {[0, 1, 2].map((k) => (
                <rect
                  key={k}
                  x={at(Math.min(cw, 34) - k * 4)}
                  y={y0 + (i === 0 ? 10 : 7) + k * 5}
                  width={Math.min(cw, 34) - k * 4}
                  height={2}
                  rx={1}
                  fill={fg}
                  opacity={0.22}
                />
              ))}
              {cx < 0 && null}
            </g>
          );
          x += inner * frac;
          return g;
        });
      })()}
    </svg>
  );
}

/* ------------------------------------------------------------------ */
/*  معاينة تنسيق الواجهة على الهاتف                                     */
/* ------------------------------------------------------------------ */

export function MobileHomePreview({ mh, skin }: { mh: MobileHome; skin: StudentSkin }) {
  const v = skin.vars;
  const tone = hsl(v.primary);
  const gold = hsl(v.gold);
  const text = hsl(v.foreground);

  /* هاتف رأسيّ داخل الإطار الأفقي — النسبة الحقيقية أصدق من مربّع */
  const PW = 58;
  const PH = 100;
  const px = (W - PW) / 2;
  const py = (H - PH) / 2;
  const pad = 4;
  const ix = px + pad;
  const iw = PW - pad * 2;

  const tight = mh.flow === "tight";
  const gap = tight ? 3 : 5;
  let y = py + 9;

  const rows: React.ReactNode[] = [];
  const push = (n: React.ReactNode) => rows.push(<g key={rows.length}>{n}</g>);

  /* الهيرو */
  const media = (h: number, opts: { faded?: boolean; small?: boolean } = {}) => (
    <rect
      x={opts.small ? ix + iw / 2 - 7 : ix}
      y={y}
      width={opts.small ? 14 : iw}
      height={h}
      rx={3}
      fill={tone}
      opacity={opts.faded ? 0.18 : 0.75}
    />
  );
  const heroText = () => (
    <>
      <rect x={ix} y={y} width={iw * 0.8} height={4} rx={2} fill={text} opacity={0.7} />
      <rect x={ix} y={y + 6} width={iw * 0.6} height={2.4} rx={1.2} fill={text} opacity={0.28} />
      <rect x={ix} y={y + 12} width={iw * 0.55} height={6} rx={3} fill={tone} />
    </>
  );

  if (mh.hero === "behind") {
    push(<>{media(34, { faded: true })}</>);
    push(<g transform={`translate(0,${6})`}>{heroText()}</g>);
    y += 34 + gap;
  } else if (mh.hero === "imageFirst") {
    push(media(24));
    y += 24 + 4;
    push(heroText());
    y += 20 + gap;
  } else if (mh.hero === "textOnly") {
    push(heroText());
    y += 20 + gap;
  } else if (mh.hero === "compact") {
    push(<>{media(14, { small: true })}</>);
    y += 14 + 3;
    push(heroText());
    y += 20 + gap;
  } else {
    push(heroText());
    y += 20 + 4;
    push(media(22));
    y += 22 + gap;
  }

  /* الأقسام */
  const secH = tight ? 13 : 17;
  for (let i = 0; i < 3 && y + secH < py + PH - 8; i++) {
    const banded = mh.flow === "banded" && i % 2 === 1;
    const carded = mh.flow === "carded";
    push(
      <>
        {banded && <rect x={px} y={y - 2} width={PW} height={secH + 4} fill={hsl(v.muted)} />}
        {carded && (
          <rect x={ix} y={y - 1} width={iw} height={secH + 2} rx={4}
            fill={hsl(v.card)} stroke={hsl(v.border)} strokeWidth={0.5} />
        )}
        {mh.cards === "two" ? (
          <>
            <rect x={ix + 2} y={y + 2} width={iw / 2 - 3.5} height={secH - 4} rx={2.5} fill={hsl(v.card)} stroke={hsl(v.border)} strokeWidth={0.5} />
            <rect x={ix + iw / 2 + 1.5} y={y + 2} width={iw / 2 - 3.5} height={secH - 4} rx={2.5} fill={hsl(v.card)} stroke={hsl(v.border)} strokeWidth={0.5} />
          </>
        ) : mh.cards === "scroll" ? (
          <>
            <rect x={ix + 2} y={y + 2} width={iw * 0.72} height={secH - 4} rx={2.5} fill={hsl(v.card)} stroke={hsl(v.border)} strokeWidth={0.5} />
            <rect x={ix + 2 + iw * 0.76} y={y + 2} width={iw * 0.72} height={secH - 4} rx={2.5} fill={hsl(v.card)} stroke={hsl(v.border)} strokeWidth={0.5} opacity={0.55} />
          </>
        ) : (
          <rect x={ix + 2} y={y + 2} width={iw - 4} height={secH - 4} rx={2.5} fill={hsl(v.card)} stroke={hsl(v.border)} strokeWidth={0.5} />
        )}
      </>
    );
    y += secH + gap;
  }

  return (
    <svg viewBox={`0 0 ${W} ${H}`} className="block w-full rounded-2xl" style={{ aspectRatio: `${W} / ${H}` }}>
      <rect width={W} height={H} fill={hsl(v.muted)} />

      {/* جسم الهاتف */}
      <rect x={px} y={py} width={PW} height={PH} rx={7} fill={hsl(v.background)} stroke={hsl(v.border)} strokeWidth={0.8} />
      {/* الشقّ العلوي */}
      <rect x={px + PW / 2 - 7} y={py + 2.5} width={14} height={2.4} rx={1.2} fill={hsl(v.border)} />
      {/* الشريط العلوي */}
      <rect x={ix} y={py + 7} width={iw} height={0} fill="none" />

      <g clipPath="none">{rows}</g>

      {/* الدعوة الثابتة */}
      {mh.cta === "bar" && (
        <>
          <rect x={px} y={py + PH - 13} width={PW} height={13} fill={hsl(v.background)} opacity={0.95} />
          <rect x={ix} y={py + PH - 10} width={iw - 10} height={7} rx={3.5} fill={tone} />
          <rect x={ix + iw - 8} y={py + PH - 10} width={8} height={7} rx={2.5} fill="none" stroke={gold} strokeWidth={0.8} />
        </>
      )}
      {mh.cta === "float" && (
        <circle cx={ix + 7} cy={py + PH - 8} r={5.5} fill={tone} />
      )}

      {/* حدّ الهاتف فوق كل شيء ليقصّ ما تجاوزه بصرياً */}
      <rect x={px} y={py} width={PW} height={PH} rx={7} fill="none" stroke={hsl(v.border)} strokeWidth={1.4} />
    </svg>
  );
}

/* ------------------------------------------------------------------ */
/*  معاينة الحركة — متحرّكة فعلاً                                       */
/* ------------------------------------------------------------------ */

export function MotionPreview({ mo, skin }: { mo: MotionStyle; skin: StudentSkin }) {
  const v = skin.vars;
  const tone = hsl(v.primary);
  const gold = hsl(v.gold);
  const uid = useUid("mo");

  /* المدّة والمنحنى من السجلّ نفسه — فالمعاينة تتحرّك كما سيتحرّك الموقع،
     لا كما نتخيّله. */
  const vars = motionVars(mo) as Record<string, string>;
  const dur = vars["--mo-dur"] ?? "0.55s";
  const ease = vars["--mo-ease"] ?? "ease";
  const rise = parseFloat(vars["--mo-rise"] ?? "0");
  const slide = parseFloat(vars["--mo-slide"] ?? "0");
  const scale = parseFloat(vars["--mo-scale"] ?? "1");
  const still = mo.enter === "none" || mo.speed === "instant";

  const cards = [0, 1, 2];
  const cw = 40;
  const ch = 44;
  const gap = 6;
  const x0 = (W - (cw * 3 + gap * 2)) / 2;
  const y0 = (H - ch) / 2 + 4;

  return (
    <svg viewBox={`0 0 ${W} ${H}`} className="block w-full rounded-2xl" style={{ aspectRatio: `${W} / ${H}` }}>
      <style>{`
        @keyframes ${uid}-in {
          0%   { opacity: 0; transform: translate(${slide}px, ${rise}px) scale(${scale}); }
          70%  { opacity: 1; }
          100% { opacity: 1; transform: translate(0,0) scale(1); }
        }
        .${uid}-c {
          transform-box: fill-box;
          transform-origin: center;
          animation: ${uid}-in ${dur} ${ease} both;
          animation-iteration-count: infinite;
          animation-direction: normal;
          animation-delay: var(--d, 0s);
          animation-duration: calc(${dur} * 3);
        }
        .${uid}-amb { animation: ${uid}-spin 9s linear infinite; transform-box: fill-box; transform-origin: center; }
        @keyframes ${uid}-spin { to { transform: rotate(360deg); } }
      `}</style>

      <rect width={W} height={H} fill={hsl(v.background)} />

      {/* الزخرفة المتحرّكة */}
      {mo.ambient !== "none" && (
        <g opacity={mo.ambient === "soft" ? 0.18 : 0.38}>
          <circle
            className={mo.ambient === "full" ? `${uid}-amb` : undefined}
            cx={W / 2} cy={H / 2} r={40} fill="none" stroke={gold} strokeWidth={0.9}
            strokeDasharray="6 5"
          />
        </g>
      )}

      {/* عنوان صغير */}
      <rect x={W / 2 - 22} y={10} width={44} height={3.4} rx={1.7} fill={hsl(v.foreground)} opacity={0.45} />

      {cards.map((i) => (
        <g key={i} className={still ? undefined : `${uid}-c`} style={{ ["--d" as string]: `${i * 0.14}s` }}>
          <rect
            x={x0 + i * (cw + gap)} y={y0} width={cw} height={ch} rx={6}
            fill={hsl(v.card)} stroke={i === 1 && mo.hover !== "none" ? tone : hsl(v.border)}
            strokeWidth={i === 1 && mo.hover !== "none" ? 1.4 : 0.7}
          />
          <rect x={x0 + i * (cw + gap) + 5} y={y0 + 6} width={9} height={9} rx={2.5} fill={tone} opacity={0.5} />
          <rect x={x0 + i * (cw + gap) + 5} y={y0 + 20} width={cw - 14} height={2.6} rx={1.3} fill={hsl(v.foreground)} opacity={0.45} />
          <rect x={x0 + i * (cw + gap) + 5} y={y0 + 26} width={cw - 20} height={2} rx={1} fill={hsl(v.foreground)} opacity={0.2} />
          {/* البطاقة الوسطى تُظهر أثر المرور المختار */}
          {i === 1 && mo.hover === "glow" && (
            <rect x={x0 + cw + gap - 1.5} y={y0 - 1.5} width={cw + 3} height={ch + 3} rx={7}
              fill="none" stroke={gold} strokeWidth={1.2} opacity={0.75} />
          )}
        </g>
      ))}

      {/* أثر المرور: رفع أو ميل يُرسم على الوسطى */}
      {mo.hover === "lift" && (
        <rect x={x0 + cw + gap} y={y0 - 5} width={cw} height={ch} rx={6} fill="none" stroke={tone} strokeWidth={1.2} strokeDasharray="3 3" opacity={0.7} />
      )}
      {mo.hover === "tilt" && (
        <rect x={x0 + cw + gap} y={y0} width={cw} height={ch} rx={6} fill="none" stroke={tone} strokeWidth={1.2}
          strokeDasharray="3 3" opacity={0.7} transform={`rotate(-3 ${x0 + cw + gap + cw / 2} ${y0 + ch / 2})`} />
      )}
    </svg>
  );
}

/* ------------------------------------------------------------------ */
/*  معاينة زرّي الهيرو                                                 */
/* ------------------------------------------------------------------ */

export function ButtonPreview({ style, skin }: { style: ButtonStyle; skin: StudentSkin }) {
  const v = skin.vars;
  const tone = hsl(v.primary);
  const gold = hsl(v.gold);
  const text = hsl(v.foreground);

  const bw = 58;
  const bh = 17;
  const gap = 7;
  const x1 = W / 2 - bw - gap / 2;
  const x2 = W / 2 + gap / 2;
  const y = H / 2 - bh / 2 + 6;

  /* شكل الزرّ — مسارٌ لأن القصّ شكلٌ حقيقي لا حدّ */
  const shape = (x: number, inset = 0) => {
    const X = x + inset, Y = y + inset, w = bw - inset * 2, h = bh - inset * 2;
    switch (style.shape) {
      case "plaque": {
        const c = 4 - inset * 0.6;
        return `M${X + c} ${Y} H${X + w - c} L${X + w} ${Y + c} V${Y + h - c} L${X + w - c} ${Y + h} H${X + c} L${X} ${Y + h - c} V${Y + c} Z`;
      }
      case "ticket": {
        const m = Y + h / 2;
        return `M${X} ${Y} H${X + w} V${m - 3} L${X + w - 1.6} ${m} L${X + w} ${m + 3} V${Y + h} H${X} V${m + 3} L${X + 1.6} ${m} L${X} ${m - 3} Z`;
      }
      case "slant":
        return `M${X} ${Y} H${X + w} L${X + w - 5} ${Y + h} H${X} Z`;
      case "arch":
        return `M${X} ${Y + h - 3} V${Y + h / 2} A${w / 2} ${h / 2} 0 0 1 ${X + w} ${Y + h / 2} V${Y + h - 3} Q${X + w} ${Y + h} ${X + w - 3} ${Y + h} H${X + 3} Q${X} ${Y + h} ${X} ${Y + h - 3} Z`;
      default:
        return null;
    }
  };

  const rx = style.shape === "pill" ? bh / 2 : style.shape === "round" ? 5 : style.shape === "square" ? 1 : 0;

  /* الزرّ الثاني — علاقتُه بالأوّل هي التصميم */
  const secondFill =
    style.pair === "ghost" || style.pair === "outline" ? hsl(v.background)
      : style.pair === "solid" ? hsl(v.muted)
        : hsl(v.card);
  const secondStroke =
    style.pair === "outline" ? tone : style.pair === "solid" ? "none" : gold;
  const secondW = style.pair === "outline" ? 2.2 : 1.2;

  const d1 = shape(x1);
  const d2 = shape(x2);

  return (
    <svg viewBox={`0 0 ${W} ${H}`} className="block w-full rounded-2xl" style={{ aspectRatio: `${W} / ${H}` }}>
      <rect width={W} height={H} fill={hsl(v.background)} />

      {/* عنوان مصغّر يعطي الزرّين سياقهما */}
      <rect x={W / 2 - 34} y={16} width={68} height={5} rx={2.5} fill={text} opacity={0.55} />
      <rect x={W / 2 - 24} y={26} width={48} height={3} rx={1.5} fill={text} opacity={0.22} />

      {/* الزرّ الأوّل — يقود */}
      {d1 ? (
        <path d={d1} fill={tone} />
      ) : (
        <rect x={x1} y={y} width={bw} height={bh} rx={rx} fill={tone} />
      )}
      <rect x={x1 + 12} y={y + bh / 2 - 1.6} width={bw - 24} height={3.2} rx={1.6} fill="#fff" opacity={0.9} />

      {/* حلقة التوهّج */}
      {style.hover === "glow" && (
        <rect x={x1 - 2.5} y={y - 2.5} width={bw + 5} height={bh + 5} rx={rx + 2.5}
          fill="none" stroke={gold} strokeWidth={1.4} opacity={0.5} />
      )}

      {/* الزرّ الثاني — يُساند */}
      {style.pair === "text" ? (
        <>
          <rect x={x2 + 10} y={y + bh / 2 - 1.6} width={bw - 26} height={3.2} rx={1.6} fill={tone} opacity={0.85} />
          <rect x={x2 + 10} y={y + bh / 2 + 4} width={bw - 26} height={1.4} rx={0.7} fill={gold} opacity={0.7} />
        </>
      ) : d2 ? (
        <path d={d2} fill={secondFill} stroke={secondStroke === "none" ? undefined : secondStroke} strokeWidth={secondW} />
      ) : (
        <rect x={x2} y={y} width={bw} height={bh} rx={rx}
          fill={secondFill} stroke={secondStroke === "none" ? undefined : secondStroke} strokeWidth={secondW} />
      )}
      {style.pair !== "text" && (
        <rect x={x2 + 12} y={y + bh / 2 - 1.6} width={bw - 24} height={3.2} rx={1.6}
          fill={style.pair === "solid" ? text : tone} opacity={0.75} />
      )}

      {/* البريق الزاحف */}
      {style.hover === "slide" && (
        <path d={`M${x1 + 14} ${y} l6 0 -9 ${bh} -6 0 Z`} fill="#fff" opacity={0.35} />
      )}

      {/* أثر الارتفاع */}
      {style.hover === "lift" && (
        <rect x={x1} y={y + bh + 2} width={bw} height={1.6} rx={0.8} fill={tone} opacity={0.18} />
      )}
    </svg>
  );
}

/**
 * معاينة لوح الهيرو.
 * ------------------------------------------------------------------
 * اللوحُ هنا مرسومٌ بمسارٍ حقيقي لا بحدٍّ يوحي بالشكل: القوسُ قوسٌ
 * والموجةُ موجةٌ والأركانُ مقصوصةٌ فعلاً — فما تراه في البطاقة هو ما
 * يقع في الصفحة، لا تقريبٌ له.
 */
export function HeroShellPreview({
  shell,
  skin,
  opts,
}: {
  shell: HeroShell;
  skin: StudentSkin;
  opts?: HeroShellOpts;
}) {
  const uid = useUid("hsh");
  const v = skin.vars;
  const tone = hsl(v.primary);
  const gold = hsl(v.gold);
  const text = opts?.text || hsl(v.foreground);

  /* هامشُ اللوح — الممتدُّ يلامس الحوافّ والمنفصلُ يبتعد */
  const m = shell.inset ? 7 : 0;
  const x = m, y = m, w = W - m * 2, h = H - m * 2;
  const grow = Math.max(0, Math.min(400, opts?.extra ?? 0)) / 400;

  /* ---------- مسار الشكل ---------- */
  const RADIUS: Record<string, number> = {
    square: 0, soft: 6, round: 12, pill: 12, arch: 12,
    plaque: 0, wave: 0, slant: 0, notch: 8, blob: 0, topRound: 12,
  };

  const path = (() => {
    const R = RADIUS[shell.shape] ?? 0;
    switch (shell.shape) {
      case "arch": {
        const a = Math.min(w / 2, h * 0.55);
        return `M${x} ${y + h - 5} V${y + a} A${w / 2} ${a} 0 0 1 ${x + w} ${y + a} V${y + h - 5} Q${x + w} ${y + h} ${x + w - 5} ${y + h} H${x + 5} Q${x} ${y + h} ${x} ${y + h - 5} Z`;
      }
      case "pill": {
        const a = Math.min(w / 2, h * 0.45);
        return `M${x} ${y + 8} Q${x} ${y} ${x + 8} ${y} H${x + w - 8} Q${x + w} ${y} ${x + w} ${y + 8} V${y + h - a} A${w / 2} ${a} 0 0 1 ${x} ${y + h - a} Z`;
      }
      case "plaque": {
        const c = 12;
        return `M${x + c} ${y} H${x + w - c} L${x + w} ${y + c} V${y + h - c} L${x + w - c} ${y + h} H${x + c} L${x} ${y + h - c} V${y + c} Z`;
      }
      case "wave": {
        const n = 4, sw = w / n, b = y + h - 9;
        let d = `M${x} ${y} H${x + w} V${b}`;
        for (let i = 0; i < n; i++) d += ` A${sw / 2} 9 0 0 1 ${x + w - (i + 1) * sw} ${b}`;
        return d + " Z";
      }
      case "slant":
        return `M${x} ${y} H${x + w} V${y + h} H${x} V${y + h - 14} Z`;
      case "notch":
        return `M${x + 6} ${y} H${x + w - 6} Q${x + w} ${y} ${x + w} ${y + 6} V${y + h} H${x + w / 2 + 14} L${x + w / 2} ${y + h - 7} L${x + w / 2 - 14} ${y + h} H${x} V${y + 6} Q${x} ${y} ${x + 6} ${y} Z`;
      case "blob":
        return `M${x} ${y + h * 0.26} Q${x} ${y} ${x + w * 0.42} ${y} Q${x + w} ${y} ${x + w} ${y + h * 0.22} Q${x + w} ${y + h} ${x + w * 0.6} ${y + h} Q${x} ${y + h} ${x} ${y + h * 0.26} Z`;
      case "topRound":
        return `M${x} ${y + h} V${y + 14} Q${x} ${y} ${x + 14} ${y} H${x + w - 14} Q${x + w} ${y} ${x + w} ${y + 14} V${y + h} Z`;
      default:
        return `M${x + R} ${y} H${x + w - R} Q${x + w} ${y} ${x + w} ${y + R} V${y + h - R} Q${x + w} ${y + h} ${x + w - R} ${y + h} H${x + R} Q${x} ${y + h} ${x} ${y + h - R} V${y + R} Q${x} ${y} ${x + R} ${y} Z`;
    }
  })();

  const g = (n: string) => `${uid}-${n}`;
  const bg1 = opts?.bg;
  const bg2 = opts?.bg2;

  /* ---------- السطح ---------- */
  const ink = shell.surface === "ink" || shell.surface === "spotlight";
  const fill = (() => {
    switch (shell.surface) {
      case "none": return "none";
      case "gradient": return `url(#${g("grad")})`;
      case "ink": return bg1 || tone;
      case "tint": return bg1 || tone;
      case "glass": return bg1 || hsl(v.card);
      case "spotlight": return bg1 || tone;
      case "duotone": return `url(#${g("duo")})`;
      case "brutal": return bg1 || gold;
      case "neu": return bg1 || hsl(v.muted);
      default: return bg1 || hsl(v.card);
    }
  })();
  const fillOpacity = shell.surface === "tint" ? 0.14 : shell.surface === "glass" ? 0.62 : 1;

  const edgeColor = opts?.edge || (shell.edge === "thick" ? tone : shell.edge === "hard" ? text : gold);
  const edgeW: Record<string, number> = {
    none: 0, hairline: 1, gold: 1.4, thick: 3, glow: 1.2, dashed: 1.6,
    sheen: 0, hard: 0, soft: 0, double: 1.6,
  };
  const ew = edgeW[shell.edge] ?? 0;

  const headline = opts?.text || (ink || shell.surface === "brutal" ? (shell.surface === "brutal" ? text : "#ffffff") : text);

  return (
    <svg viewBox={`0 0 ${W} ${H}`} className="block w-full rounded-2xl" style={{ aspectRatio: `${W} / ${H}` }}>
      <defs>
        <linearGradient id={g("grad")} x1="0" y1="0" x2="1" y2="1">
          <stop offset="0" stopColor={bg1 || hsl(v.card)} />
          <stop offset="1" stopColor={bg2 || hsl(v.muted)} />
        </linearGradient>
        <linearGradient id={g("duo")} x1="0" y1="0" x2="1" y2="0">
          <stop offset="0" stopColor={bg1 || tone} stopOpacity="0.16" />
          <stop offset="0.5" stopColor={bg1 || tone} stopOpacity="0.16" />
          <stop offset="0.5" stopColor={bg2 || gold} stopOpacity="0.22" />
          <stop offset="1" stopColor={bg2 || gold} stopOpacity="0.22" />
        </linearGradient>
        <radialGradient id={g("spot")} cx="0.5" cy="0" r="0.85">
          <stop offset="0" stopColor={gold} stopOpacity="0.55" />
          <stop offset="1" stopColor={gold} stopOpacity="0" />
        </radialGradient>
        <pattern id={g("grid")} width="12" height="12" patternUnits="userSpaceOnUse">
          <path d="M12 0H0V12" fill="none" stroke={text} strokeOpacity="0.12" strokeWidth="0.8" />
        </pattern>
        <pattern id={g("dots")} width="7" height="7" patternUnits="userSpaceOnUse">
          <circle cx="1.2" cy="1.2" r="1" fill={text} fillOpacity="0.2" />
        </pattern>
        <pattern id={g("stripe")} width="10" height="10" patternUnits="userSpaceOnUse" patternTransform="rotate(-38)">
          <rect width="3" height="10" fill={tone} fillOpacity="0.13" />
        </pattern>
        <clipPath id={g("clip")}><path d={path} /></clipPath>
        <filter id={g("blur")} x="-40%" y="-40%" width="180%" height="180%">
          <feGaussianBlur stdDeviation="4" />
        </filter>
      </defs>

      <rect width={W} height={H} fill={hsl(v.background)} />

      {/* الظلال تُرسم قبل اللوح فتقع تحته */}
      {shell.edge === "glow" && <path d={path} fill={edgeColor} opacity={0.4} filter={`url(#${g("blur")})`} />}
      {shell.edge === "soft" && <path d={path} fill={text} opacity={0.28} filter={`url(#${g("blur")})`} transform="translate(0 5)" />}
      {shell.edge === "hard" && <path d={path} fill={edgeColor} transform="translate(4 4)" />}
      {shell.surface === "neu" && (
        <>
          <path d={path} fill={text} opacity={0.18} filter={`url(#${g("blur")})`} transform="translate(4 4)" />
          <path d={path} fill="#ffffff" opacity={0.85} filter={`url(#${g("blur")})`} transform="translate(-4 -4)" />
        </>
      )}

      {shell.surface !== "none" && <path d={path} fill={fill} fillOpacity={fillOpacity} />}

      {/* طبقاتُ النقش — مقصوصةٌ على شكل اللوح فلا تتجاوزه */}
      <g clipPath={`url(#${g("clip")})`}>
        {shell.surface === "mesh" && (
          <>
            <ellipse cx={x + w * 0.16} cy={y + h * 0.24} rx={38} ry={26} fill={bg2 || tone} opacity={0.32} filter={`url(#${g("blur")})`} />
            <ellipse cx={x + w * 0.86} cy={y + h * 0.16} rx={30} ry={22} fill={gold} opacity={0.3} filter={`url(#${g("blur")})`} />
            <ellipse cx={x + w * 0.62} cy={y + h * 0.95} rx={34} ry={24} fill={bg2 || tone} opacity={0.26} filter={`url(#${g("blur")})`} />
          </>
        )}
        {shell.surface === "aurora" && (
          <>
            <rect x={x - 20} y={y} width={30} height={h * 2} fill={bg2 || tone} opacity={0.32} transform={`rotate(16 ${W / 2} ${H / 2})`} filter={`url(#${g("blur")})`} />
            <rect x={x + w * 0.34} y={y - 10} width={26} height={h * 2} fill={gold} opacity={0.3} transform={`rotate(-14 ${W / 2} ${H / 2})`} filter={`url(#${g("blur")})`} />
            <rect x={x + w * 0.7} y={y} width={22} height={h * 2} fill={tone} opacity={0.24} transform={`rotate(20 ${W / 2} ${H / 2})`} filter={`url(#${g("blur")})`} />
          </>
        )}
        {shell.surface === "spotlight" && <rect x={x} y={y} width={w} height={h} fill={`url(#${g("spot")})`} />}
        {shell.surface === "grid" && <rect x={x} y={y} width={w} height={h} fill={`url(#${g("grid")})`} />}
        {shell.surface === "dots" && <rect x={x} y={y} width={w} height={h} fill={`url(#${g("dots")})`} />}
        {shell.surface === "stripe" && <rect x={x} y={y} width={w} height={h} fill={`url(#${g("stripe")})`} />}
        {shell.surface === "noise" && (
          <g fill={text} fillOpacity={0.16}>
            {Array.from({ length: 90 }, (_, i) => (
              <circle key={i} cx={x + ((i * 37) % w)} cy={y + ((i * 53) % h)} r={0.5} />
            ))}
          </g>
        )}
      </g>

      {/* الحدّ */}
      {ew > 0 && (
        <path d={path} fill="none" stroke={edgeColor} strokeWidth={ew}
          strokeDasharray={shell.edge === "dashed" ? "5 4" : undefined} />
      )}
      {shell.surface === "brutal" && <path d={path} fill="none" stroke={opts?.edge || text} strokeWidth={2.4} />}
      {shell.edge === "sheen" && (
        <path d={`M${x + 8} ${y + 0.8} H${x + w - 8}`} stroke={edgeColor} strokeWidth={1.4} strokeLinecap="round" opacity={0.9} />
      )}
      {shell.edge === "double" && (
        <path d={path} fill="none" stroke="#ffffff" strokeWidth={1} opacity={0.6} transform="scale(0.985)"
          style={{ transformOrigin: "center" }} />
      )}

      {/* محتوى الهيرو مصغَّراً: صورةٌ وعنوانٌ وزرّان */}
      <circle cx={W / 2} cy={y + 26} r={11} fill={ink ? "#ffffff" : tone} opacity={ink ? 0.9 : 0.85} />
      <rect x={W / 2 - 32} y={y + 43} width={64} height={5} rx={2.5} fill={headline} opacity={0.85} />
      <rect x={W / 2 - 22} y={y + 52} width={44} height={3} rx={1.5} fill={headline} opacity={0.4} />
      <rect x={W / 2 - 30} y={y + 61} width={28} height={9} rx={3} fill={ink ? "#ffffff" : tone} opacity={0.9} />
      <rect x={W / 2 + 2} y={y + 61} width={28} height={9} rx={3} fill="none" stroke={gold} strokeWidth={1} />

      {grow > 0 && (
        <rect x={x + 6} y={y + h - 6 - grow * (h - 84)} width={w - 12} height={Math.max(2, grow * (h - 84))}
          rx={2} fill={tone} opacity={0.16} />
      )}
    </svg>
  );
}

/**
 * معاينة إطار الأيقونة.
 * ------------------------------------------------------------------
 * هذه المعاينة **حيّةٌ بالأصناف نفسِها** لا رسمٌ يحاكيها: تُلبَس البطاقةُ
 * صنفَ الإطار وصنفَ الحركة، فما يقع في المعاينة هو ما يقع في المنصّة —
 * بما فيه الحركة، تُرى تدور قبل أن تُختار.
 */
export function IconFramePreview({
  frame,
  motion,
  cover,
  colors,
}: {
  frame: IconFrame;
  motion?: IconMotion;
  cover?: IconCover;
  colors?: { bg?: string; bg2?: string; fg?: string; edge?: string };
}) {
  return (
    <div
      className={`grid h-[72px] place-items-center rounded-2xl bg-muted/50 ${iconFrameClass(frame)} ${cover ? iconCoverClass(cover) : ""} ${motion ? iconMotionClass(motion) : ""}`}
      style={iconFrameVars(colors)}
    >
      <span className="ic-frame grid size-11 place-items-center text-primary">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.6}
          strokeLinecap="round" strokeLinejoin="round" className="size-5">
          <path d="M4 5.5A2.5 2.5 0 0 1 6.5 3H19v15H6.5A2.5 2.5 0 0 0 4 20.5z" />
          <path d="M8 8h7M8 12h5" />
        </svg>
      </span>
    </div>
  );
}
