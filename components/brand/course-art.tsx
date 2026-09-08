"use client";

/**
 * لوحة غلاف الكورس — SVG بالكامل.
 * • بغلاف مرفوع: الصورة تُقصّ داخل شكل قوسي بحدّ زخرفي وحجاب تدرّجي أسفلها.
 * • بلا غلاف: تُولَّد لوحة هندسية من معرّف الكورس نفسه (٤ زخارف × ٦ زوايا لون)،
 *   فيبقى لكل كورس هويّة بصرية ثابتة ومميّزة بلا صور.
 * • حلقة التقدّم وشارة القفل مرسومتان داخل نفس الـSVG (لا عناصر HTML فوقها).
 * كل المعرّفات فريدة عبر useUid، والحركة تحترم prefers-reduced-motion.
 */
import { motion, useReducedMotion } from "framer-motion";
import { useUid } from "./use-uid";
import { mediaSrc } from "@/lib/utils/media";
import type { CoverFont, CoverPattern, CoverSticker, CoverText, FrameShape, ImageFit } from "@/lib/utils/types";

const W = 400;
const H = 225;

/**
 * يشتقّ طرفَي تدرّج من لون واحد: اللون كما هو، ودرجة أفتح قليلاً بميل
 * لوني بسيط — فيبدو التدرّج طبيعياً بدل لونين متطابقين.
 * يقبل #rgb و#rrggbb؛ وأي قيمة غير صالحة تعيد null فيرجع اللوحة لألوان الثيم.
 */
function gradientFrom(hex?: string): { from: string; to: string } | null {
  if (!hex) return null;
  const m = /^#?([0-9a-f]{3}|[0-9a-f]{6})$/i.exec(hex.trim());
  if (!m) return null;
  let v = m[1];
  if (v.length === 3) v = v[0] + v[0] + v[1] + v[1] + v[2] + v[2];
  const r = parseInt(v.slice(0, 2), 16) / 255;
  const g = parseInt(v.slice(2, 4), 16) / 255;
  const b = parseInt(v.slice(4, 6), 16) / 255;

  const max = Math.max(r, g, b), min = Math.min(r, g, b);
  const l = (max + min) / 2;
  const d = max - min;
  const s = d === 0 ? 0 : d / (1 - Math.abs(2 * l - 1));
  let h = 0;
  if (d !== 0) {
    if (max === r) h = ((g - b) / d) % 6;
    else if (max === g) h = (b - r) / d + 2;
    else h = (r - g) / d + 4;
    h *= 60;
    if (h < 0) h += 360;
  }
  const H = Math.round(h), S = Math.round(s * 100), L = Math.round(l * 100);
  return {
    from: `hsl(${H} ${S}% ${L}%)`,
    to: `hsl(${(H + 16) % 360} ${Math.min(100, S + 6)}% ${Math.min(92, L + 13)}%)`,
  };
}

/** بصمة ثابتة من نصّ (لاختيار الزخرفة والزاوية) — نفس الكورس ينتج نفس اللوحة دائماً. */
function hash(seed: string): number {
  let h = 2166136261;
  for (let i = 0; i < seed.length; i++) {
    h ^= seed.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return Math.abs(h);
}

/** مستطيل بزوايا دائرية. */
function roundedPath(w: number, h: number, r: number): string {
  const rad = Math.max(0, Math.min(r, Math.min(w, h) / 2));
  return [
    `M${rad} 0`,
    `H${w - rad}`, `a${rad} ${rad} 0 0 1 ${rad} ${rad}`,
    `V${h - rad}`, `a${rad} ${rad} 0 0 1 ${-rad} ${rad}`,
    `H${rad}`, `a${rad} ${rad} 0 0 1 ${-rad} ${-rad}`,
    `V${rad}`, `a${rad} ${rad} 0 0 1 ${rad} ${-rad}`,
    "Z",
  ].join(" ");
}

/** شكل اللوحة: مستطيل بزوايا دائرية وقمّة مقوّسة خفيفة. */
function platePath(w: number, h: number, r = 22): string {
  const rise = h * 0.09; // ارتفاع تقوّس القمّة
  return [
    `M0 ${h - r}`,
    `V${rise + r}`,
    `Q0 ${rise} ${r} ${rise * 0.62}`,
    `Q${w / 2} 0 ${w - r} ${rise * 0.62}`,
    `Q${w} ${rise} ${w} ${rise + r}`,
    `V${h - r}`,
    `q0 ${r} ${-r} ${r}`,
    `H${r}`,
    `q${-r} 0 ${-r} ${-r}`,
    "Z",
  ].join(" ");
}

/** خطوط الهوية المتاحة لنصّ الغلاف. */
export const COVER_FONTS: { id: CoverFont; label: string; css: string }[] = [
  { id: "display", label: "نسخ (Amiri)", css: "var(--font-display)" },
  { id: "sans", label: "واضح (Plex)", css: "var(--font-sans)" },
  { id: "kufi", label: "كوفي", css: "var(--font-kufi)" },
];

/** ترتيب الأنماط — يربط اسم الزخرفة برقمها في tileMotif. */
export const COVER_PATTERNS: { id: Exclude<CoverPattern, "auto" | "none">; label: string; kind: number }[] = [
  { id: "knot", label: "خاتم ثماني", kind: 0 },
  { id: "squares", label: "تعشيق مربّعات", kind: 1 },
  { id: "arches", label: "أقواس", kind: 2 },
  { id: "weave", label: "نسيج سداسي", kind: 3 },
];

/* ---------- زخارف البلاطات (٤ أنماط) ---------- */
function tileMotif(kind: number, t: number) {
  const m = t / 2;
  const q = t / 4;
  switch (kind) {
    case 0: // خاتم ثماني متشابك
      return (
        <>
          <rect x={q} y={q} width={m} height={m} />
          <path d={`M${m} 0 L${t} ${m} L${m} ${t} L0 ${m} Z`} />
          <circle cx={m} cy={m} r={q / 2} />
        </>
      );
    case 1: // تعشيق مربّعات
      return (
        <>
          <rect x={q * 0.6} y={q * 0.6} width={t - q * 1.2} height={t - q * 1.2} />
          <rect x={m - q * 0.7} y={m - q * 0.7} width={q * 1.4} height={q * 1.4} transform={`rotate(45 ${m} ${m})`} />
          <path d={`M0 0 L${t} ${t} M${t} 0 L0 ${t}`} opacity={0.35} />
        </>
      );
    case 2: // أقواس متتابعة
      return (
        <>
          <path d={`M0 ${t} V${m} A${m} ${m} 0 0 1 ${t} ${m} V${t}`} />
          <path d={`M${q} ${t} V${m + q * 0.4} A${q * 1.2} ${q * 1.2} 0 0 1 ${t - q} ${m + q * 0.4} V${t}`} opacity={0.5} />
        </>
      );
    default: // نسيج سداسي
      return (
        <>
          <path d={`M${m} 0 L${t} ${q} V${t - q} L${m} ${t} L0 ${t - q} V${q} Z`} />
          <path d={`M${m} ${q * 0.7} L${t - q * 0.7} ${q * 1.2} V${t - q * 1.2} L${m} ${t - q * 0.7} L${q * 0.7} ${t - q * 1.2} V${q * 1.2} Z`} opacity={0.4} />
        </>
      );
  }
}

export function CourseArt({
  seed,
  title,
  cover,
  coverFit,
  coverRatio,
  coverColor,
  coverPattern,
  coverText,
  coverStickers,
  progress,
  locked = false,
  className = "",
}: {
  seed: string;
  title: string;
  cover?: string;
  coverFit?: ImageFit;
  coverRatio?: number;
  /** لون خلفية اللوحة (HEX). فارغ = ألوان الثيم. */
  coverColor?: string;
  /** زخرفة اللوحة — "none" تزيلها، و"auto"/فارغ تختارها من المعرّف. */
  coverPattern?: CoverPattern;
  /** نصّ يُكتب فوق اللوحة ويُوضع بالسحب من اللوحة. */
  coverText?: CoverText;
  /** صور تُلصَق فوق اللوحة وتُحرَّك بالسحب. */
  coverStickers?: CoverSticker[];
  progress?: number;
  locked?: boolean;
  className?: string;
}) {
  const uid = useUid("art");
  const reduce = useReducedMotion();
  const bg = gradientFrom(coverColor);
  const h = hash(seed || title);
  /* الزخرفة: اختيار الأدمن يسبق الاشتقاق التلقائي، و"none" تلغيها تماماً */
  const chosen = COVER_PATTERNS.find((p) => p.id === coverPattern);
  const showTiles = coverPattern !== "none";
  const motif = chosen ? chosen.kind : h % 4;
  const angle = [0, 15, 30, 45, 60, 75][h % 6];
  const tile = 52 + (h % 3) * 10;
  /* ---------- الإطار ----------
   * مقاس البطاقة ثابت دائماً (١٦:٩) فلا تتمدّد مهما كانت نسبة الصورة.
   * الصورة تُعرض كاملة عند التكبير ١٠٠٪، وما يزيد عن الإطار عند التكبير
   * يُقصّ بإرادة الأدمن من أدوات المحاذاة — لا قصّ تلقائي إطلاقاً.
   */
  const artH = H;

  const shape: FrameShape = coverFit?.shape ?? "arch";
  const radius = coverFit?.radius ?? 22;
  const plate =
    shape === "arch" ? platePath(W, artH, radius)
      : shape === "square" ? roundedPath(W, artH, 0)
        : roundedPath(W, artH, radius);

  // ضبط الغلاف (محاذاة/تكبير) — تحويل من المركز بلا تشويه
  const fitScale = Math.min(3, Math.max(0.5, coverFit?.scale ?? 1));
  const fitDx = ((coverFit?.x ?? 0) / 100) * W;
  const fitDy = ((coverFit?.y ?? 0) / 100) * artH;
  const coverTransform = `translate(${W / 2 + fitDx} ${artH / 2 + fitDy}) scale(${fitScale}) translate(${-W / 2} ${-artH / 2})`;
  // الصورة كاملة دائماً — لا قصّ في أي وضع
  const coverPar = "xMidYMid meet";
  // عند التكبير يقصّ الأدمن بنفسه (تملأ الإطار)، وعند ١٠٠٪ تبقى كاملة بهامش بسيط
  const inset = fitScale > 1.02 ? 0 : 8;

  // حلقة التقدّم (تُرسم فقط للكورسات المفتوحة)
  const showRing = typeof progress === "number" && !locked;
  const rr = 21;
  const rc = 2 * Math.PI * rr;

  return (
    <svg
      viewBox={`0 0 ${W} ${artH}`}
      className={`h-auto w-full ${className}`}
      role="img"
      aria-label={title}
      preserveAspectRatio="xMidYMid meet"
    >
      <defs>
        <clipPath id={`${uid}-plate`}>
          <path d={plate} />
        </clipPath>

        {/* أرضية متدرّجة — من لون الكورس إن ضُبط، وإلا من ألوان الثيم */}
        <linearGradient id={`${uid}-bg`} x1="0" y1="0" x2={W} y2={artH} gradientUnits="userSpaceOnUse">
          <stop offset="0%" stopColor={bg ? bg.from : "hsl(var(--primary))"} stopOpacity={0.92} />
          <stop offset="100%" stopColor={bg ? bg.to : "hsl(var(--accent))"} stopOpacity={0.92} />
        </linearGradient>

        {/* حجاب سفلي يضمن قراءة النصوص فوق الصورة */}
        <linearGradient id={`${uid}-veil`} x1="0" y1={artH * 0.35} x2="0" y2={artH} gradientUnits="userSpaceOnUse">
          <stop offset="0%" stopColor="#04121b" stopOpacity="0" />
          <stop offset="100%" stopColor="#04121b" stopOpacity="0.55" />
        </linearGradient>

        {/* بلاطة الزخرفة */}
        <pattern
          id={`${uid}-tile`}
          width={tile}
          height={tile}
          patternUnits="userSpaceOnUse"
          patternTransform={`rotate(${angle})`}
        >
          <g fill="none" stroke="#fff" strokeWidth={1} strokeOpacity={0.5} strokeLinejoin="round">
            {tileMotif(motif, tile)}
          </g>
        </pattern>

        {/* تلاشي الزخرفة من الأعلى */}
        <radialGradient id={`${uid}-fade`} cx="22%" cy="8%" r="105%">
          <stop offset="0%" stopColor="#fff" stopOpacity={0.85} />
          <stop offset="70%" stopColor="#fff" stopOpacity={0.22} />
          <stop offset="100%" stopColor="#fff" stopOpacity={0} />
        </radialGradient>
        <mask id={`${uid}-fademask`}>
          <rect width={W} height={artH} fill={`url(#${uid}-fade)`} />
        </mask>
      </defs>

      <g clipPath={`url(#${uid}-plate)`}>
        {cover ? (
          <>
            {/* أرضية مزخرفة خلف الصورة: تظهر في الهوامش حين تُعرض الصورة كاملة بلا قصّ */}
            <rect width={W} height={artH} fill={`url(#${uid}-bg)`} />
            {showTiles && <rect width={W} height={artH} fill={`url(#${uid}-tile)`} mask={`url(#${uid}-fademask)`} />}
            <g transform={coverTransform}>
              <image
                href={mediaSrc(cover)}
                x={inset}
                y={inset}
                width={W - inset * 2}
                height={artH - inset * 2}
                preserveAspectRatio={coverPar}
              />
            </g>
            {/* حجاب خفيف أسفل الصورة لقراءة الشارات — لا يمسّ حدودها */}
            <rect width={W} height={artH} fill={`url(#${uid}-veil)`} opacity={0.55} />
          </>
        ) : (
          <>
            <rect width={W} height={artH} fill={`url(#${uid}-bg)`} />
            {showTiles && <rect width={W} height={artH} fill={`url(#${uid}-tile)`} mask={`url(#${uid}-fademask)`} />}
            {/* خاتم كبير في القلب */}
            <g
              fill="none"
              stroke="#fff"
              strokeOpacity={0.85}
              strokeWidth={1.6}
              strokeLinejoin="round"
              transform={`translate(${W / 2} ${artH / 2})`}
            >
              <rect x={-34} y={-34} width={68} height={68} rx={2} />
              <path d="M0 -48 L48 0 L0 48 L-48 0 Z" />
              <path d="M0 -22 L15 -15 L22 0 L15 15 L0 22 L-15 15 L-22 0 L-15 -15 Z" fill="#fff" fillOpacity={0.16} />
            </g>
            <rect width={W} height={artH} fill={`url(#${uid}-veil)`} opacity={0.5} />
          </>
        )}
      </g>

      {/* حدّ اللوحة + خطّ داخلي رفيع */}
      <path d={plate} fill="none" stroke="#fff" strokeOpacity={0.35} strokeWidth={1.5} />
      <path
        d={shape === "arch" ? platePath(W - 14, artH - 14, Math.max(0, radius - 5))
          : roundedPath(W - 14, artH - 14, shape === "square" ? 0 : Math.max(0, radius - 5))}
        transform="translate(7 7)"
        fill="none"
        stroke="#fff"
        strokeOpacity={0.18}
        strokeWidth={1}
      />

      {/* عقدة الزاوية العلوية */}
      <g stroke="#fff" strokeOpacity={0.35} strokeWidth={1} fill="none">
        <path d={`M${W - 16} 26 v22 a20 20 0 0 1 -20 20 h-18`} />
        <path d={`M${W - 16} 40 v8 a32 32 0 0 1 -32 32 h-8`} strokeOpacity={0.2} />
      </g>

      {/* الصور الملصقة — تُرسم تحت النصّ ليبقى النصّ فوقها دائماً */}
      {(coverStickers ?? []).map((st) => {
        if (!st.src) return null;
        const w = (Math.max(3, Math.min(100, st.size)) / 100) * W;
        const h = w / (st.ratio && st.ratio > 0 ? st.ratio : 1);
        const cx = (Math.max(0, Math.min(100, st.x)) / 100) * W;
        const cy = (Math.max(0, Math.min(100, st.y)) / 100) * artH;
        const rot = st.rotate ?? 0;
        return (
          <g key={st.id} transform={`rotate(${rot} ${cx} ${cy})`} opacity={(st.opacity ?? 100) / 100}>
            {st.round && (
              <defs>
                <clipPath id={`${uid}-st-${st.id}`}>
                  <ellipse cx={cx} cy={cy} rx={w / 2} ry={h / 2} />
                </clipPath>
              </defs>
            )}
            <image
              href={mediaSrc(st.src)}
              x={cx - w / 2}
              y={cy - h / 2}
              width={w}
              height={h}
              preserveAspectRatio="xMidYMid meet"
              clipPath={st.round ? `url(#${uid}-st-${st.id})` : undefined}
            />
          </g>
        );
      })}

      {/* نصّ الغلاف — موضعه بالنسبة المئوية فيثبت في كل المقاسات */}
      {coverText?.text?.trim() && (() => {
        const t = coverText;
        const size = Math.max(8, Math.min(72, t.size ?? 26));
        const anchor: "start" | "middle" | "end" =
          t.align === "left" ? "start" : t.align === "right" ? "end" : "middle";
        const font = COVER_FONTS.find((f) => f.id === (t.font ?? "display"))?.css ?? "var(--font-display)";
        const lines = t.text.split("\n").slice(0, 4);
        const fill = t.gradient ? `url(#${uid}-txt)` : (t.color || "#ffffff");
        return (
          <>
            {t.gradient && (
              <defs>
                <linearGradient id={`${uid}-txt`} x1="0" y1="0" x2={W} y2="0" gradientUnits="userSpaceOnUse">
                  <stop offset="0%" stopColor={t.color || "#ffffff"} />
                  <stop offset="100%" stopColor={t.color2 || "hsl(var(--gold))"} />
                </linearGradient>
              </defs>
            )}
            <text
              x={(Math.max(0, Math.min(100, t.x)) / 100) * W}
              y={(Math.max(0, Math.min(100, t.y)) / 100) * artH}
              textAnchor={anchor}
              dominantBaseline="middle"
              fontSize={size}
              fontWeight={t.bold === false ? 500 : 700}
              fontFamily={font}
              fill={fill}
              /* paint-order يرسم الحدّ خلف التعبئة، فيبقى النصّ مقروءاً فوق أي صورة */
              paintOrder="stroke"
              stroke={t.outline === false ? "none" : "#04121b"}
              strokeWidth={t.outline === false ? 0 : Math.max(2, size * 0.16)}
              strokeOpacity={0.55}
              strokeLinejoin="round"
              style={{ direction: "rtl" }}
            >
              {lines.map((ln, i) => (
                <tspan
                  key={i}
                  x={(Math.max(0, Math.min(100, t.x)) / 100) * W}
                  dy={i === 0 ? -((lines.length - 1) * size * 0.6) : size * 1.2}
                >
                  {ln}
                </tspan>
              ))}
            </text>
          </>
        );
      })()}

      {/* حلقة التقدّم */}
      {showRing && (
        <g transform={`translate(${34} ${artH - 34})`}>
          <circle r={rr + 7} fill="#04121b" fillOpacity={0.45} />
          <circle r={rr} fill="none" stroke="#fff" strokeOpacity={0.3} strokeWidth={4} />
          <motion.circle
            r={rr}
            fill="none"
            stroke="#fff"
            strokeWidth={4}
            strokeLinecap="round"
            transform="rotate(-90)"
            strokeDasharray={rc}
            initial={reduce ? { strokeDashoffset: rc * (1 - (progress ?? 0) / 100) } : { strokeDashoffset: rc }}
            animate={{ strokeDashoffset: rc * (1 - (progress ?? 0) / 100) }}
            transition={{ duration: reduce ? 0 : 1.1, ease: [0.22, 1, 0.36, 1] }}
          />
          <text
            textAnchor="middle"
            dominantBaseline="central"
            fill="#fff"
            fontSize="14"
            fontWeight="800"
            fontFamily="var(--font-display), sans-serif"
          >
            {Math.round(progress ?? 0)}٪
          </text>
        </g>
      )}

      {/* شارة القفل */}
      {locked && (
        <g transform={`translate(${W - 46} ${artH - 40})`}>
          <circle r={22} fill="#04121b" fillOpacity={0.5} />
          <g stroke="#fff" strokeWidth={1.6} fill="none" strokeLinecap="round" strokeLinejoin="round">
            <rect x={-9} y={-3} width={18} height={13} rx={3} />
            <path d="M-5 -3v-4a5 5 0 0 1 10 0v4" />
            <path d="M0 2.5v3" />
          </g>
        </g>
      )}
    </svg>
  );
}
