"use client";

/**
 * الفاصل بين أقسام الصفحة الرئيسية — SVG بالكامل.
 * كل نوع بـviewBox ثابت وعرض ممتدّ، والسُمك ثابت بـvectorEffect فلا
 * يغلظ الخطّ عند التمدّد على الشاشات العريضة.
 */
import { useUid } from "@/components/brand/use-uid";
import type { HomeDivider } from "@/lib/layout/home-layouts";

export function SectionDivider({ kind }: { kind: HomeDivider }) {
  const uid = useUid("div");
  if (kind === "none") return null;

  if (kind === "wave") {
    return (
      <div aria-hidden="true" className="pointer-events-none -my-2 text-accent/35">
        <svg viewBox="0 0 1200 24" preserveAspectRatio="none" className="h-6 w-full" fill="none">
          <path
            d="M0 12 Q75 0 150 12 T300 12 T450 12 T600 12 T750 12 T900 12 T1050 12 T1200 12"
            stroke="currentColor"
            strokeWidth={1.5}
            vectorEffect="non-scaling-stroke"
          />
        </svg>
      </div>
    );
  }

  if (kind === "rule") {
    return (
      <div aria-hidden="true" className="pointer-events-none container -my-2">
        <svg viewBox="0 0 1200 8" preserveAspectRatio="none" className="h-2 w-full text-accent/30" fill="none">
          <defs>
            <linearGradient id={`${uid}-g`} x1="0" y1="0" x2="1200" y2="0" gradientUnits="userSpaceOnUse">
              <stop offset="0%" stopColor="currentColor" stopOpacity="0" />
              <stop offset="50%" stopColor="currentColor" stopOpacity="1" />
              <stop offset="100%" stopColor="currentColor" stopOpacity="0" />
            </linearGradient>
          </defs>
          <path d="M0 4h1200" stroke={`url(#${uid}-g)`} strokeWidth={1} vectorEffect="non-scaling-stroke" />
        </svg>
      </div>
    );
  }

  // ornament — شمسة صغيرة بين ذراعين متلاشيين
  return (
    <div aria-hidden="true" className="pointer-events-none flex justify-center py-2 text-accent/55">
      <svg width="200" height="18" viewBox="0 0 200 18" fill="none">
        <g stroke="currentColor" strokeWidth={1} fill="none" strokeLinecap="round">
          <path d="M0 9h74" opacity={0.35} />
          <path d="M200 9h-74" opacity={0.35} />
          <path d="M100 1 108 9 100 17 92 9Z" />
          <path d="M94.5 3.5 105.5 14.5M105.5 3.5 94.5 14.5" opacity={0.3} />
        </g>
        <circle cx="100" cy="9" r="1.8" fill="currentColor" />
        <circle cx="82" cy="9" r="1.2" fill="currentColor" opacity={0.6} />
        <circle cx="118" cy="9" r="1.2" fill="currentColor" opacity={0.6} />
      </svg>
    </div>
  );
}
