"use client";

/**
 * إطار صورة الهيرو — مولّد من سجلّ الأشكال.
 * ------------------------------------------------------------------
 * راسم واحد لكل الأشكال بدل كتلة JSX لكل إطار: الشكل يأتي من
 * `lib/frame-shapes.ts` كدالّة مسار، والراسم يستدعيها ثلاث مرّات —
 * للقصّ، وللحدّ الخارجي، وللخيط الداخلي — فلا يتفرّق تعريف الشكل ولا
 * ينسى أحدهما التحديث.
 *
 * القياس ٤٠٠×٥٠٠ وviewBox ثابت، فلا تشويه مهما اتّسع العمود.
 * اللون والحجم من إعدادات المنصّة، والصورة تُضبط داخل الإطار بلا قصّ
 * تلقائي — ما يخرج عنه يخرج بإرادة الأدمن من أدوات المحاذاة.
 */
import { motion, useReducedMotion } from "framer-motion";
import { useUid } from "@/components/brand/use-uid";
import { findFrame } from "@/lib/art/frame-shapes";
import { mediaSrc } from "@/lib/utils/media";
import type { ImageFit } from "@/lib/utils/types";

const W = 400;
const H = 500;

export function HeroFrame({
  frame,
  avatar,
  alt,
  img,
  color,
  scale = 100,
  baseRule = false,
}: {
  frame?: string | number;
  avatar: string;
  alt: string;
  img?: ImageFit;
  /** لون الإطار (HEX). فارغ = لون الثيم. */
  color?: string;
  /** حجم الإطار كنسبة مئوية (٦٠..١٤٠). */
  scale?: number;
  /** خطّ القاعدة أسفل الإطار — مطفأ افتراضياً. */
  baseRule?: boolean;
}) {
  const uid = useUid("hf");
  const reduce = useReducedMotion();
  const shape = findFrame(frame);

  const outer = shape.path(W, H, 6);
  const inner = shape.path(W, H, 22);

  /* ضبط الصورة: تكبير من المركز ثم إزاحة — تحويل واحد بلا تشويه. */
  const s = Math.min(3, Math.max(0.5, img?.scale ?? 1));
  const dx = ((img?.x ?? 0) / 100) * W;
  const dy = ((img?.y ?? 0) / 100) * H;
  const tf = `translate(${W / 2 + dx} ${H / 2 + dy}) scale(${s}) translate(${-W / 2} ${-H / 2})`;
  const par = (img?.fit ?? "contain") === "cover" ? "xMidYMid slice" : "xMidYMid meet";

  const stroke = color || "hsl(var(--primary))";
  const size = Math.max(60, Math.min(140, scale)) / 100;

  return (
    <div className="mx-auto" style={{ width: `${size * 100}%`, maxWidth: "100%" }}>
      <motion.svg
        viewBox={`0 0 ${W} ${H}`}
        className="h-auto w-full overflow-visible"
        role="presentation"
        animate={!reduce ? { y: [0, -9, 0] } : undefined}
        transition={{ duration: 7, repeat: Infinity, ease: "easeInOut" }}
      >
        <defs>
          <clipPath id={`${uid}-c`}>
            <path d={outer} />
          </clipPath>
          {/* حجاب سفلي يفصل الصورة عمّا تحتها بلا حدّ حادّ */}
          <linearGradient id={`${uid}-v`} x1="0" y1={H * 0.55} x2="0" y2={H} gradientUnits="userSpaceOnUse">
            <stop offset="0%" stopColor="hsl(var(--background))" stopOpacity="0" />
            <stop offset="100%" stopColor="hsl(var(--background))" stopOpacity="0.55" />
          </linearGradient>
        </defs>

        <g clipPath={`url(#${uid}-c)`}>
          <rect width={W} height={H} fill="hsl(var(--muted))" />
          {avatar && (
            <g transform={tf}>
              <image href={mediaSrc(avatar)} x="0" y="0" width={W} height={H} preserveAspectRatio={par}>
                <title>{alt}</title>
              </image>
            </g>
          )}
          <rect width={W} height={H} fill={`url(#${uid}-v)`} />
        </g>

        {/* الحدّ الخارجي */}
        <path d={outer} fill="none" stroke={stroke} strokeWidth={2.4} strokeOpacity={0.65} strokeLinejoin="round" />

        {/* الخيط الداخلي — لا يليق بكل الأشكال */}
        {shape.innerRule && (
          <path d={inner} fill="none" stroke={stroke} strokeWidth={1.1} strokeOpacity={0.3} strokeLinejoin="round" />
        )}

        {/*
          القاعدة المذهّبة — اختيارية ومطفأة افتراضياً.
          كانت تُرسم تحت كل إطار مهما كان شكلُه، فتبدو خطّاً غريباً معلَّقاً
          أسفل الأشكال التي لا تحتاج تثبيتاً بصرياً.
        */}
        {baseRule && (
          <path d={`M${W * 0.12} ${H - 3} H${W * 0.88}`} stroke={stroke} strokeWidth={3} strokeOpacity={0.45} strokeLinecap="round" />
        )}
      </motion.svg>
    </div>
  );
}
