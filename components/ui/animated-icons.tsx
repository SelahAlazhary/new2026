"use client";

/**
 * أيقونات مُتحرّكة وتفاعلات دقيقة (Micro-interactions).
 * • PlayRipple  : زر تشغيل بموجات إشعاع (animate-ping).
 * • SparkleStar : نجمة تتلألأ بدوران خفيف.
 * • DrawCheck   : علامة صح تُرسَم عند الظهور في العرض.
 * • Stars       : صف تقييم 4.9/5.
 */

import { useEffect, useRef, useState } from "react";
import { IconStar, IconPlay } from "@/components/brand/icons";
import { motion, useInView } from "framer-motion";

export function PlayRipple({ onClick, label = "شاهد درساً مجانياً" }: { onClick?: () => void; label?: string }) {
  return (
    <button
      onClick={onClick}
      aria-label={label}
      className="group relative inline-flex items-center gap-3"
    >
      <span className="relative flex size-14 items-center justify-center rounded-full btn-glow text-white">
        <span className="absolute inset-0 animate-pulse-ring rounded-full bg-primary/40" />
        <span className="absolute inset-0 animate-pulse-ring rounded-full bg-primary/30 [animation-delay:.6s]" />
        <IconPlay className="size-5 translate-x-[1px]" />
      </span>
      <span className="font-semibold transition group-hover:text-primary">{label}</span>
    </button>
  );
}

export function SparkleStar({ className = "" }: { className?: string }) {
  return <IconStar filled className={`animate-twinkle ${className}`} />;
}

export function Stars({ value = 4.9 }: { value?: number }) {
  return (
    <span className="inline-flex items-center gap-0.5" aria-label={`تقييم ${value} من 5`}>
      {Array.from({ length: 5 }).map((_, i) => (
        <IconStar
          key={i}
          filled={i < Math.round(value)}
          className={`size-4 ${i < Math.round(value) ? "text-amber-400" : "text-muted-foreground/40"}`}
        />
      ))}
    </span>
  );
}

/** علامة صح تُرسم بالـ stroke عند دخولها إطار العرض */
export function DrawCheck({ className = "" }: { className?: string }) {
  const ref = useRef<SVGSVGElement>(null);
  const inView = useInView(ref, { once: false, margin: "-40px" });
  return (
    <svg
      ref={ref}
      viewBox="0 0 24 24"
      fill="none"
      className={`size-5 text-primary ${className}`}
    >
      <path
        d="M4 12.5l5 5 11-11"
        stroke="currentColor"
        strokeWidth={2.5}
        strokeLinecap="round"
        strokeLinejoin="round"
        className="draw-check"
        data-drawn={inView ? "true" : "false"}
      />
    </svg>
  );
}

/** عدّاد يزحف من 0 إلى القيمة عند الظهور */
export function CountUp({
  to,
  suffix = "",
  prefix = "",
  duration = 1400,
}: {
  to: number;
  suffix?: string;
  prefix?: string;
  duration?: number;
}) {
  const ref = useRef<HTMLSpanElement>(null);
  const inView = useInView(ref, { once: false });
  const [val, setVal] = useState(0);

  useEffect(() => {
    if (!inView) return;
    let raf = 0;
    const start = performance.now();
    const tick = (now: number) => {
      const p = Math.min((now - start) / duration, 1);
      const eased = 1 - Math.pow(1 - p, 3);
      setVal(Math.round(eased * to));
      if (p < 1) raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [inView, to, duration]);

  return (
    <span ref={ref}>
      {prefix}
      {val.toLocaleString("ar-EG")}
      {suffix}
    </span>
  );
}

/** سهم CTA بحركة نابضة عند الهوفر (RTL: يتحرّك يساراً) */
export function SpringArrow() {
  return (
    <motion.span
      className="inline-block"
      variants={{ rest: { x: 0 }, hover: { x: -4 } }}
      transition={{ type: "spring", stiffness: 400, damping: 15 }}
    >
      ←
    </motion.span>
  );
}
