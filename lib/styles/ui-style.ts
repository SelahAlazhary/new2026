import type { CSSProperties } from "react";
import type { ColorSpec, ElementStyle, SiteContent } from "@/lib/utils/types";

/** يقرأ نمط عنصر من المحتوى بالمفتاح. */
export function el(content: SiteContent, key: string): ElementStyle {
  return content.ui?.[key] ?? {};
}
export function isHidden(content: SiteContent, key: string): boolean {
  return Boolean(content.ui?.[key]?.hidden);
}

/** خلفية زر: افتراضي = يترك btn-glow، لون واحد، أو متدرّج. */
export function fillStyle(spec?: ColorSpec): CSSProperties | undefined {
  if (!spec || spec.mode === "theme") return undefined;
  if (spec.mode === "solid") return { background: spec.color, boxShadow: "none" };
  return { background: `linear-gradient(100deg, ${spec.from ?? "#7c3aed"}, ${spec.to ?? "#c026d3"})` };
}

/** نمط زر مجمّع (خلفية + لون نص). */
export function btnStyle(e?: ElementStyle): CSSProperties | undefined {
  if (!e) return undefined;
  const fill = fillStyle(e.fill) ?? {};
  const txt = e.text && e.text.mode === "solid" ? { color: e.text.color } : {};
  const merged = { ...fill, ...txt };
  return Object.keys(merged).length ? merged : undefined;
}

/** لون نص: لون واحد أو نص متدرّج (background-clip). */
export function textStyle(spec?: ColorSpec): CSSProperties | undefined {
  if (!spec || spec.mode === "theme") return undefined;
  if (spec.mode === "solid") return { color: spec.color };
  return {
    backgroundImage: `linear-gradient(100deg, ${spec.from ?? "#7c3aed"}, ${spec.to ?? "#c026d3"})`,
    WebkitBackgroundClip: "text",
    backgroundClip: "text",
    color: "transparent",
  };
}
