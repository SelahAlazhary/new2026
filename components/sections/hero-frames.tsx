"use client";

/**
 * HeroFrame — ٨ ألواح مخطوط للصورة، كلّها SVG متّجه بالكامل.
 * ------------------------------------------------------------
 * كل لوح مبنيّ على نفس الطبقات، بترتيب المُذهِّب في المخطوطات:
 *   defs (تذهيب + قصّ)  →  الصورة مقصوصة  →  الحدّ المذهّب المزدوج
 *   →  التزيين (خرز، منمنمات زاوية، أسنان كوفية، نقاط إعجام).
 * القياس ٤٠٠×٥٠٠ ثابت لكل الألواح حتى لا يتغيّر تخطيط الهيرو عند التبديل.
 * الحركة خفيفة وتُلغى تلقائياً مع prefers-reduced-motion.
 */
import { motion, useReducedMotion } from "framer-motion";
import { useUid } from "@/components/brand/use-uid";
import { archPath } from "@/components/brand/pattern";
import { mediaSrc } from "@/lib/utils/media";
import type { ImageFit } from "@/lib/utils/types";

export const FRAME_COUNT = 8;
export const FRAME_NAMES: Record<number, string> = {
  1: "سَرلَوح مذهّب",
  2: "شمسة المخطوط",
  3: "خاتم الكاتب",
  4: "لوح مثمّن",
  5: "قوس مفصّص",
  6: "طاق الدِّيوان",
  7: "مدارات القلم",
  8: "سَرلَوح مزدوج",
};

const W = 400;
const H = 500;

/* ---------- مسارات الأشكال (نقاط محسوبة لا تقديرية) ---------- */

/** مثمّن منتظم داخل صندوق. */
function octagonPath(w: number, h: number, inset = 0): string {
  const k = 0.2929; // 1 - cos45 = نسبة قطع الركن للمثمّن المنتظم
  const cx = w * k;
  const cy = h * k;
  const x0 = inset;
  const x1 = w - inset;
  const y0 = inset;
  const y1 = h - inset;
  return [
    `M${x0 + cx} ${y0}`,
    `H${x1 - cx}`,
    `L${x1} ${y0 + cy}`,
    `V${y1 - cy}`,
    `L${x1 - cx} ${y1}`,
    `H${x0 + cx}`,
    `L${x0} ${y1 - cy}`,
    `V${y0 + cy}`,
    "Z",
  ].join(" ");
}

/** قوس مفصّص: نصف علوي بفصوص متتابعة. */
function foilArchPath(w: number, h: number, lobes = 5, inset = 0): string {
  const x0 = inset;
  const x1 = w - inset;
  const shoulder = h * 0.46;
  const span = (x1 - x0) / lobes;
  const r = span / 2;
  let d = `M${x0} ${h - inset} V${shoulder}`;
  for (let i = 0; i < lobes; i++) {
    const from = x0 + i * span;
    const rise = i === Math.floor(lobes / 2) ? 1.35 : 1;
    d += ` A${r} ${r * rise} 0 0 1 ${from + span} ${shoulder}`;
  }
  d += ` V${h - inset} Z`;
  return d;
}

/** نقاط موزّعة على محيط دائرة (للخرز والعقد). */
function ring(cx: number, cy: number, r: number, count: number) {
  return Array.from({ length: count }, (_, i) => {
    const a = (i / count) * Math.PI * 2 - Math.PI / 2;
    return { x: cx + r * Math.cos(a), y: cy + r * Math.sin(a) };
  });
}

/* ---------- الغلاف المشترك ---------- */

function FrameShell({ children, float = true }: { children: React.ReactNode; float?: boolean }) {
  const reduce = useReducedMotion();
  return (
    <motion.svg
      viewBox={`0 0 ${W} ${H}`}
      className="h-auto w-full overflow-visible"
      role="presentation"
      animate={!reduce && float ? { y: [0, -9, 0] } : undefined}
      transition={{ duration: 7, repeat: Infinity, ease: "easeInOut" }}
    >
      {children}
    </motion.svg>
  );
}

/** تدرّج التذهيب المشترك — يُعرَّف مرّة لكل لوح. */
function GoldDefs({ uid }: { uid: string }) {
  return (
    <defs>
      <linearGradient id={`${uid}-gold`} x1="0" y1="0" x2={W} y2={H} gradientUnits="userSpaceOnUse">
        <stop offset="0%" stopColor="hsl(var(--gold-deep))" />
        <stop offset="42%" stopColor="hsl(var(--gold-light))" />
        <stop offset="100%" stopColor="hsl(var(--gold))" />
      </linearGradient>
      <linearGradient id={`${uid}-ink`} x1="0" y1="0" x2={W} y2={H} gradientUnits="userSpaceOnUse">
        <stop offset="0%" stopColor="hsl(var(--primary))" />
        <stop offset="100%" stopColor="hsl(var(--glow))" />
      </linearGradient>
    </defs>
  );
}

/** منمنمة زاوية — تُوضع في أركان الألواح المستطيلة. */
function CornerIllum({ uid, x, y, flipX = false, flipY = false }: { uid: string; x: number; y: number; flipX?: boolean; flipY?: boolean }) {
  return (
    <g transform={`translate(${x} ${y}) scale(${flipX ? -1 : 1} ${flipY ? -1 : 1})`}>
      <g fill="none" stroke={`url(#${uid}-gold)`} strokeWidth={1.2} opacity={0.85}>
        {/* ضفيرة الركن */}
        <path d="M0 46 V16 A16 16 0 0 1 16 0 H46" />
        <path d="M10 46 V22 A12 12 0 0 1 22 10 H46" opacity={0.6} />
        {/* أسنان كوفية */}
        <path d="M24 10 V2 M34 10 V2 M10 24 H2 M10 34 H2" opacity={0.55} />
        {/* ورقة نباتية */}
        <path d="M24 26 c10 0 16 -6 16 -16 -10 0 -16 6 -16 16Z" opacity={0.5} />
      </g>
      <circle cx="22" cy="22" r="1.8" fill={`url(#${uid}-gold)`} opacity={0.8} />
    </g>
  );
}

/** الصورة مقصوصة على شكل، مع تدرّج تلاشٍ سفلي.
 *  img: ضبط الأدمن للصورة داخل الإطار (ملء/إزاحة/تكبير). */
function Portrait({
  uid,
  shape,
  avatar,
  alt,
  img,
}: {
  uid: string;
  shape: string;
  avatar: string;
  alt: string;
  img?: ImageFit;
}) {
  const scale = Math.min(3, Math.max(0.5, img?.scale ?? 1));
  const dx = ((img?.x ?? 0) / 100) * W;
  const dy = ((img?.y ?? 0) / 100) * H;
  // التكبير من مركز اللوحة ثم الإزاحة — يعطي تحكّماً سلساً بلا تشويه
  const transform = `translate(${W / 2 + dx} ${H / 2 + dy}) scale(${scale}) translate(${-W / 2} ${-H / 2})`;
  // الافتراضي «كاملة» — لا يُقصّ أي جزء من الصورة، والمحاذاة تُضبط يدوياً من اللوحة
  const par = (img?.fit ?? "contain") === "cover" ? "xMidYMid slice" : "xMidYMid meet";
  return (
    <>
      <defs>
        <clipPath id={`${uid}-clip`}>
          <path d={shape} />
        </clipPath>
        <linearGradient id={`${uid}-veil`} x1="0" y1={H * 0.58} x2="0" y2={H} gradientUnits="userSpaceOnUse">
          <stop offset="0%" stopColor="hsl(var(--background))" stopOpacity="0" />
          <stop offset="100%" stopColor="hsl(var(--background))" stopOpacity="0.5" />
        </linearGradient>
      </defs>
      <g clipPath={`url(#${uid}-clip)`}>
        {/* أرضية ورقية بدل الرمادي */}
        <rect width={W} height={H} fill="hsl(var(--muted))" />
        <rect width={W} height={H} fill={`url(#${uid}-ink)`} opacity="0.06" />
        {avatar ? (
          <g transform={transform}>
            <image href={mediaSrc(avatar)} x="0" y="0" width={W} height={H} preserveAspectRatio={par}>
              <title>{alt}</title>
            </image>
          </g>
        ) : null}
        <rect width={W} height={H} fill={`url(#${uid}-veil)`} />
      </g>
    </>
  );
}

/* ---------- الألواح ---------- */

export function HeroFrame({ frame, avatar, alt, img }: { frame: number; avatar: string; alt: string; img?: ImageFit }) {
  const f = Math.min(Math.max(frame || 1, 1), FRAME_COUNT);
  const uid = useUid(`hf${f}`);
  const reduce = useReducedMotion();
  const gold = `url(#${uid}-gold)`;
  const ink = `url(#${uid}-ink)`;

  /* 1) سَرلَوح مذهّب — قوس مدبّب بحدّ ذهبي مزدوج وقاعدة مزخرفة */
  if (f === 1) {
    const outer = archPath(W, H, 6);
    const inner = archPath(W - 34, H - 34, 6);
    return (
      <FrameShell>
        <GoldDefs uid={uid} />
        <Portrait uid={uid} shape={outer} avatar={avatar} alt={alt} img={img} />
        <path d={outer} fill="none" stroke={gold} strokeWidth={2.6} />
        <g transform="translate(17 17)">
          <path d={inner} fill="none" stroke={gold} strokeWidth={1} strokeOpacity={0.55} />
        </g>
        {/* خرز على كتف القوس */}
        <g fill={gold} opacity={0.75}>
          {[0.18, 0.28, 0.72, 0.82].map((p, i) => (
            <circle key={i} cx={W * p} cy={H * 0.2 + Math.abs(0.5 - p) * 120} r={2.4} />
          ))}
        </g>
        {/* قاعدة اللوح */}
        <path d={`M40 ${H - 6} H${W - 40}`} stroke={gold} strokeWidth={3.4} strokeLinecap="round" />
        <path d={`M64 ${H - 18} H${W - 64}`} stroke={gold} strokeWidth={1.2} strokeOpacity={0.5} strokeLinecap="round" />
        {/* نقاط إعجام أسفل القاعدة */}
        <g fill={gold} opacity={0.7}>
          <circle cx={W / 2 - 12} cy={H - 30} r={2} />
          <circle cx={W / 2} cy={H - 34} r={2} />
          <circle cx={W / 2 + 12} cy={H - 30} r={2} />
        </g>
      </FrameShell>
    );
  }

  /* 2) شمسة المخطوط — مدالية دائرية بخرز دوّار */
  if (f === 2) {
    const cx = W / 2;
    const cy = H / 2;
    const r = 178;
    return (
      <FrameShell>
        <GoldDefs uid={uid} />
        <Portrait uid={uid} shape={`M${cx - r} ${cy}a${r} ${r} 0 1 0 ${r * 2} 0a${r} ${r} 0 1 0 ${-r * 2} 0`} avatar={avatar} alt={alt} img={img} />
        <circle cx={cx} cy={cy} r={r} fill="none" stroke={gold} strokeWidth={2.6} />
        <circle cx={cx} cy={cy} r={r - 12} fill="none" stroke={gold} strokeWidth={1} strokeOpacity={0.45} />
        <motion.g
          animate={reduce ? undefined : { rotate: 360 }}
          transition={{ duration: 90, repeat: Infinity, ease: "linear" }}
          style={{ originX: `${cx}px`, originY: `${cy}px` }}
        >
          {/* خرز مذهّب ١٦ حبّة */}
          {ring(cx, cy, r + 15, 16).map((p, i) => (
            <circle key={i} cx={p.x} cy={p.y} r={i % 2 ? 2 : 3.4} fill={gold} opacity={0.85} />
          ))}
          {/* فصوص الشمسة */}
          {ring(cx, cy, r + 34, 8).map((p, i) => (
            <path key={`p${i}`} d={`M${p.x - 6} ${p.y} L${p.x} ${p.y - 7} L${p.x + 6} ${p.y} L${p.x} ${p.y + 7} Z`} fill={gold} opacity={0.55} />
          ))}
          <circle cx={cx} cy={cy} r={r + 15} fill="none" stroke={gold} strokeWidth={0.9} strokeOpacity={0.3} />
        </motion.g>
      </FrameShell>
    );
  }

  /* 3) خاتم الكاتب — مثمّن مقصوص مع ثماني متشابك */
  if (f === 3) {
    const box = 356;
    const x = (W - box) / 2;
    const y = (H - box) / 2;
    const shape = `M${x + box * 0.2929} ${y} H${x + box * 0.7071} L${x + box} ${y + box * 0.2929} V${y + box * 0.7071} L${x + box * 0.7071} ${y + box} H${x + box * 0.2929} L${x} ${y + box * 0.7071} V${y + box * 0.2929} Z`;
    const c = { x: x + box / 2, y: y + box / 2 };
    const h = box / 2;
    return (
      <FrameShell>
        <GoldDefs uid={uid} />
        <Portrait uid={uid} shape={shape} avatar={avatar} alt={alt} img={img} />
        <path d={shape} fill="none" stroke={gold} strokeWidth={2.6} />
        <g fill="none" stroke={gold} strokeOpacity={0.5} strokeWidth={1.2}>
          <rect x={c.x - h * 0.72} y={c.y - h * 0.72} width={h * 1.44} height={h * 1.44} />
          <path d={`M${c.x} ${c.y - h} L${c.x + h} ${c.y} L${c.x} ${c.y + h} L${c.x - h} ${c.y} Z`} />
        </g>
        {/* نقاط الأركان */}
        <g fill={gold} opacity={0.8}>
          {ring(c.x, c.y, h + 12, 8).map((p, i) => (
            <circle key={i} cx={p.x} cy={p.y} r={2.6} />
          ))}
        </g>
      </FrameShell>
    );
  }

  /* 4) لوح مثمّن — حدّ مذهّب سميك ومنمنمات في الأركان */
  if (f === 4) {
    const shape = octagonPath(W, H, 8);
    return (
      <FrameShell>
        <GoldDefs uid={uid} />
        <Portrait uid={uid} shape={shape} avatar={avatar} alt={alt} img={img} />
        <path d={shape} fill="none" stroke={gold} strokeWidth={3} />
        <path d={octagonPath(W - 30, H - 30, 8)} transform="translate(15 15)" fill="none" stroke={gold} strokeWidth={1} strokeOpacity={0.45} />
        {[
          [W * 0.2929, 8],
          [W - W * 0.2929, 8],
          [W * 0.2929, H - 8],
          [W - W * 0.2929, H - 8],
        ].map(([px, py], i) => (
          <circle key={i} cx={px} cy={py} r={4.2} fill={gold} />
        ))}
        {/* أسنان كوفية على الضلعين الرأسيين */}
        <g stroke={gold} strokeWidth={1.2} strokeOpacity={0.45}>
          <path d={`M8 ${H * 0.4} h10 M8 ${H * 0.5} h10 M8 ${H * 0.6} h10`} />
          <path d={`M${W - 8} ${H * 0.4} h-10 M${W - 8} ${H * 0.5} h-10 M${W - 8} ${H * 0.6} h-10`} />
        </g>
      </FrameShell>
    );
  }

  /* 5) قوس مفصّص — فصوص متتابعة أعلى اللوح */
  if (f === 5) {
    const shape = foilArchPath(W, H, 5, 8);
    return (
      <FrameShell>
        <GoldDefs uid={uid} />
        <Portrait uid={uid} shape={shape} avatar={avatar} alt={alt} img={img} />
        <path d={shape} fill="none" stroke={gold} strokeWidth={2.6} />
        <path d={foilArchPath(W - 32, H - 30, 5, 8)} transform="translate(16 14)" fill="none" stroke={gold} strokeWidth={1} strokeOpacity={0.45} />
        <path d={`M28 ${H - 8} H${W - 28}`} stroke={gold} strokeWidth={3.4} strokeLinecap="round" />
        {/* خرز بين الفصوص */}
        <g fill={gold} opacity={0.7}>
          {[1, 2, 3, 4].map((i) => (
            <circle key={i} cx={8 + ((W - 16) / 5) * i} cy={H * 0.46} r={2.6} />
          ))}
        </g>
      </FrameShell>
    );
  }

  /* 6) طاق الدِّيوان — لوح بزوايا دائرية ومنمنمات مذهّبة */
  if (f === 6) {
    const r = 46;
    const shape = `M${8 + r} 8 H${W - 8 - r} A${r} ${r} 0 0 1 ${W - 8} ${8 + r} V${H - 8 - r} A${r} ${r} 0 0 1 ${W - 8 - r} ${H - 8} H${8 + r} A${r} ${r} 0 0 1 8 ${H - 8 - r} V${8 + r} A${r} ${r} 0 0 1 ${8 + r} 8 Z`;
    return (
      <FrameShell>
        <GoldDefs uid={uid} />
        <Portrait uid={uid} shape={shape} avatar={avatar} alt={alt} img={img} />
        <path d={shape} fill="none" stroke={gold} strokeWidth={2.6} />
        <CornerIllum uid={uid} x={14} y={14} />
        <CornerIllum uid={uid} x={W - 14} y={14} flipX />
        <CornerIllum uid={uid} x={14} y={H - 14} flipY />
        <CornerIllum uid={uid} x={W - 14} y={H - 14} flipX flipY />
      </FrameShell>
    );
  }

  /* 7) مدارات القلم — قرص مع مدارين ونقطتَي حبر */
  if (f === 7) {
    const cx = W / 2;
    const cy = H / 2;
    const r = 168;
    return (
      <FrameShell>
        <GoldDefs uid={uid} />
        <Portrait uid={uid} shape={`M${cx - r} ${cy}a${r} ${r} 0 1 0 ${r * 2} 0a${r} ${r} 0 1 0 ${-r * 2} 0`} avatar={avatar} alt={alt} img={img} />
        <circle cx={cx} cy={cy} r={r} fill="none" stroke={gold} strokeWidth={2.6} />
        <motion.g
          animate={reduce ? undefined : { rotate: 360 }}
          transition={{ duration: 40, repeat: Infinity, ease: "linear" }}
          style={{ originX: `${cx}px`, originY: `${cy}px` }}
        >
          <ellipse cx={cx} cy={cy} rx={r + 26} ry={r - 34} fill="none" stroke={gold} strokeWidth={1.2} strokeOpacity={0.5} />
          <circle cx={cx + r + 26} cy={cy} r={5.5} fill={gold} />
        </motion.g>
        <motion.g
          animate={reduce ? undefined : { rotate: -360 }}
          transition={{ duration: 54, repeat: Infinity, ease: "linear" }}
          style={{ originX: `${cx}px`, originY: `${cy}px` }}
        >
          <ellipse cx={cx} cy={cy} rx={r - 30} ry={r + 22} fill="none" stroke={ink} strokeWidth={1} strokeOpacity={0.4} />
          <circle cx={cx} cy={cy - r - 22} r={4.5} fill={ink} opacity={0.75} />
        </motion.g>
      </FrameShell>
    );
  }

  /* 8) سَرلَوح مزدوج — قوس داخل إطار مذهّب مزدوج */
  const arch = archPath(W - 48, H - 48, 0);
  return (
    <FrameShell>
      <GoldDefs uid={uid} />
      <g transform="translate(24 24)">
        <Portrait uid={uid} shape={arch} avatar={avatar} alt={alt} img={img} />
        <path d={arch} fill="none" stroke={gold} strokeWidth={2.6} />
      </g>
      <rect x="6" y="6" width={W - 12} height={H - 12} rx="18" fill="none" stroke={gold} strokeWidth={1.8} strokeOpacity={0.85} />
      <rect x="14" y="14" width={W - 28} height={H - 28} rx="14" fill="none" stroke={gold} strokeWidth={1} strokeOpacity={0.4} strokeDasharray="5 9" />
      <CornerIllum uid={uid} x={12} y={12} />
      <CornerIllum uid={uid} x={W - 12} y={12} flipX />
    </FrameShell>
  );
}
