"use client";

/**
 * زخارف المظاهر — طبقة SVG خلف بوابة الطالب.
 * ------------------------------------------------------------------
 * لكل زخرفة بلاطة SVG تُكرَّر بـ`patternUnits="userSpaceOnUse"` فيثبت
 * مقاسها مهما اتّسعت الشاشة، وفوقها قناع تلاشٍ فلا تزاحم المحتوى.
 *
 * كلّها ترث اللون من الثيم عبر currentColor، فالزخرفة الواحدة تبدو
 * مختلفة تماماً بين مظهر وآخر — وهذا مقصود: عدد المظاهر حاصل ضرب
 * اللوحة اللونية في الزخرفة، لا مجرّد تكرار.
 */
import { useUid } from "./use-uid";
import type { OrnamentId } from "@/lib/brand/skins";

/** بلاطة كل زخرفة: مقاسها ومحتواها. */
function tile(id: OrnamentId, t: number) {
  const m = t / 2;
  const q = t / 4;

  switch (id) {
    case "kufi": // متاهة كوفية مربّعة
      return (
        <g fill="none" stroke="currentColor" strokeWidth={t * 0.055} strokeLinecap="square">
          <path d={`M${q * 0.5} ${t - q * 0.5}V${q * 0.5}H${m}`} />
          <path d={`M${m} ${q * 0.5}V${m}H${q * 1.5}V${t - q * 0.5}H${t - q * 0.5}V${q * 1.5}`} />
        </g>
      );

    case "shamsa": // شمسة إشعاعية
      return (
        <g fill="none" stroke="currentColor" strokeWidth={t * 0.04}>
          <circle cx={m} cy={m} r={q * 1.5} />
          <circle cx={m} cy={m} r={q * 0.8} />
          {Array.from({ length: 12 }, (_, i) => {
            const a = (i / 12) * Math.PI * 2;
            return (
              <path
                key={i}
                d={`M${m + Math.cos(a) * q * 0.9} ${m + Math.sin(a) * q * 0.9} L${m + Math.cos(a) * q * 1.5} ${m + Math.sin(a) * q * 1.5}`}
              />
            );
          })}
        </g>
      );

    case "arabesque": // فروع نباتية متعاكسة
      return (
        <g fill="none" stroke="currentColor" strokeWidth={t * 0.045} strokeLinecap="round">
          <path d={`M0 ${m} Q${q} 0 ${m} ${m} T${t} ${m}`} />
          <path d={`M0 ${m} Q${q} ${t} ${m} ${m} T${t} ${m}`} opacity={0.55} />
          <circle cx={m} cy={m} r={t * 0.045} fill="currentColor" stroke="none" />
        </g>
      );

    case "waves": // موج متتابع
      return (
        <g fill="none" stroke="currentColor" strokeWidth={t * 0.05} strokeLinecap="round">
          <path d={`M0 ${q * 1.2} Q${q} ${q * 0.2} ${m} ${q * 1.2} T${t} ${q * 1.2}`} />
          <path d={`M0 ${q * 2.8} Q${q} ${q * 1.8} ${m} ${q * 2.8} T${t} ${q * 2.8}`} opacity={0.6} />
        </g>
      );

    case "grid": // شبكة دقيقة بعُقد
      return (
        <g stroke="currentColor" strokeWidth={t * 0.025} fill="none">
          <path d={`M0 0H${t}M0 0V${t}`} />
          <circle cx={0} cy={0} r={t * 0.05} fill="currentColor" stroke="none" opacity={0.8} />
          <circle cx={m} cy={m} r={t * 0.03} fill="currentColor" stroke="none" opacity={0.5} />
        </g>
      );

    case "stars": // نجوم ثمانية
      return (
        <g fill="none" stroke="currentColor" strokeWidth={t * 0.04} strokeLinejoin="round">
          <path d={`M${q} ${q}h${m}v${m}h-${m}Z`} />
          <path d={`M${m} ${q * 0.4} L${t - q * 0.4} ${m} L${m} ${t - q * 0.4} L${q * 0.4} ${m}Z`} />
        </g>
      );

    case "hexes": // نسيج سداسي
      return (
        <g fill="none" stroke="currentColor" strokeWidth={t * 0.04} strokeLinejoin="round">
          <path d={`M${m} ${q * 0.3} L${t - q * 0.5} ${q * 1.2} V${t - q * 1.2} L${m} ${t - q * 0.3} L${q * 0.5} ${t - q * 1.2} V${q * 1.2}Z`} />
        </g>
      );

    case "rays": // أشعّة مائلة
      return (
        <g stroke="currentColor" strokeWidth={t * 0.04} strokeLinecap="round">
          <path d={`M0 ${t} L${t} 0`} />
          <path d={`M0 ${m} L${m} 0`} opacity={0.5} />
          <path d={`M${m} ${t} L${t} ${m}`} opacity={0.5} />
        </g>
      );

    case "knots": // ضفائر متشابكة
      return (
        <g fill="none" stroke="currentColor" strokeWidth={t * 0.05} strokeLinecap="round">
          <path d={`M0 ${m} q${q} -${q} ${m} 0 t${m} 0`} />
          <path d={`M${m} 0 q-${q} ${q} 0 ${m} t0 ${m}`} opacity={0.6} />
        </g>
      );

    case "dots": // نقاط منتظمة
      return (
        <g fill="currentColor">
          <circle cx={q} cy={q} r={t * 0.045} />
          <circle cx={q * 3} cy={q * 3} r={t * 0.045} />
          <circle cx={q * 3} cy={q} r={t * 0.028} opacity={0.6} />
          <circle cx={q} cy={q * 3} r={t * 0.028} opacity={0.6} />
        </g>
      );

    default:
      return null;
  }
}

export function SkinOrnament({
  id,
  density = 84,
  opacity = 0.5,
  className = "",
}: {
  id: OrnamentId;
  density?: number;
  opacity?: number;
  className?: string;
}) {
  const uid = useUid("orn");
  if (id === "none") return null;
  const t = density;

  return (
    <svg
      aria-hidden="true"
      focusable="false"
      className={`pointer-events-none fixed inset-0 -z-10 size-full text-primary/20 ${className}`}
      preserveAspectRatio="none"
    >
      <defs>
        <pattern id={`${uid}-t`} width={t} height={t} patternUnits="userSpaceOnUse">
          {tile(id, t)}
        </pattern>
        {/* تلاشٍ من الأعلى — الزخرفة حاضرة خلف الترويسة وتخفت عند المحتوى */}
        <linearGradient id={`${uid}-f`} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#fff" stopOpacity={opacity} />
          <stop offset="55%" stopColor="#fff" stopOpacity={opacity * 0.35} />
          <stop offset="100%" stopColor="#fff" stopOpacity={0} />
        </linearGradient>
        <mask id={`${uid}-m`}>
          <rect width="100%" height="100%" fill={`url(#${uid}-f)`} />
        </mask>
      </defs>
      <rect width="100%" height="100%" fill={`url(#${uid}-t)`} mask={`url(#${uid}-m)`} />
    </svg>
  );
}
