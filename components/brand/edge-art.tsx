"use client";

/**
 * زخارف الحوافّ — SVG يُرسم على حافّة اللوح.
 * ------------------------------------------------------------------
 * هذه الأشكال منحنية، ولا تُعبَّر عنها بـ`clip-path: polygon()`. لذلك
 * تُرسم SVG ممتدّاً على الحافّة وحدها بـ`preserveAspectRatio="none"` —
 * والتمدّد هنا طبيعي لا تشويه، لأن الموجة والفصوص تتّسع أفقياً بطبعها،
 * بخلاف الأركان المقصوصة التي يفسدها التمدّد.
 *
 * كلّها aria-hidden وترث اللون من الأب عبر currentColor.
 */
import type { EdgeArt } from "@/lib/brand/designs";

/** يبني مسار فصوص متتابعة على عرض ١٢٠ وحدة. */
function scallopPath(lobes: number, h: number, up: boolean): string {
  const w = 120 / lobes;
  let d = `M0 ${up ? h : 0}`;
  for (let i = 0; i < lobes; i++) {
    d += ` a${w / 2} ${h} 0 0 ${up ? 1 : 0} ${w} 0`;
  }
  d += ` V${up ? 0 : h} H0 Z`;
  return d;
}

/** أسنان حادّة. */
function zigzagPath(teeth: number, h: number): string {
  const w = 120 / teeth;
  let d = "M0 0";
  for (let i = 0; i < teeth; i++) {
    d += ` l${w / 2} ${h} l${w / 2} ${-h}`;
  }
  d += " V0 Z";
  return d;
}

/** شُرَف معمارية مربّعة. */
function teethPath(count: number, h: number): string {
  const w = 120 / count;
  let d = `M0 ${h}`;
  for (let i = 0; i < count; i++) {
    d += ` v${-h} h${w / 2} v${h} h${w / 2}`;
  }
  d += ` V${h} Z`;
  return d;
}

export function EdgeArtLayer({
  kind,
  className = "",
}: {
  kind: EdgeArt;
  className?: string;
}) {
  if (kind === "none") return null;

  /* الموج والمسنّن على الحافّة السفلى؛ والباقي على العليا. */
  const bottom = kind === "wave" || kind === "zigzag";

  const common = {
    "aria-hidden": true as const,
    preserveAspectRatio: "none" as const,
    className: `pointer-events-none absolute inset-x-0 ${bottom ? "bottom-0" : "top-0"} ${className}`,
  };

  if (kind === "wave") {
    return (
      <svg {...common} viewBox="0 0 120 10" height="10" width="100%">
        <path d="M0 10 Q15 0 30 5 T60 5 T90 5 T120 5 V10 Z" fill="currentColor" opacity={0.35} />
        <path d="M0 10 Q15 2 30 7 T60 7 T90 7 T120 7 V10 Z" fill="currentColor" opacity={0.55} />
      </svg>
    );
  }

  if (kind === "scallop") {
    return (
      <svg {...common} viewBox="0 0 120 8" height="8" width="100%">
        <path d={scallopPath(10, 8, false)} fill="currentColor" opacity={0.5} />
      </svg>
    );
  }

  if (kind === "zigzag") {
    return (
      <svg {...common} viewBox="0 0 120 8" height="8" width="100%">
        <path d={zigzagPath(14, 8)} fill="currentColor" opacity={0.5} />
      </svg>
    );
  }

  if (kind === "teeth") {
    return (
      <svg {...common} viewBox="0 0 120 7" height="7" width="100%">
        <path d={teethPath(12, 7)} fill="currentColor" opacity={0.5} />
      </svg>
    );
  }

  if (kind === "dome") {
    return (
      <svg {...common} viewBox="0 0 120 14" height="14" width="100%">
        <path d="M0 14 Q60 -6 120 14 Z" fill="currentColor" opacity={0.45} />
      </svg>
    );
  }

  if (kind === "arch") {
    return (
      <svg {...common} viewBox="0 0 120 14" height="14" width="100%">
        {/* قوس مدبّب: كتفان ثم قمّة */}
        <path d="M0 14 V8 Q0 2 60 0 Q120 2 120 8 V14 Z" fill="currentColor" opacity={0.45} />
      </svg>
    );
  }

  // beads — خرز على الحافّة العليا
  return (
    <svg {...common} viewBox="0 0 120 6" height="6" width="100%">
      <g fill="currentColor" opacity={0.6}>
        {Array.from({ length: 24 }, (_, i) => (
          <circle key={i} cx={2.5 + i * 5} cy={3} r={1.3} />
        ))}
      </g>
    </svg>
  );
}
