"use client";

import { forwardRef, type ButtonHTMLAttributes, type ReactNode } from "react";
import { motion } from "framer-motion";
import { RuleOrnament } from "@/components/brand/pattern";
import { ShariMotion, type ShariMotionId } from "@/components/brand/shari-motion";
import { ShariVector, type ShariVectorId } from "@/components/brand/shari-vector";

/* ---------------- الزر ---------------- */
type Variant = "glow" | "outline" | "ghost";
type Props = ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: Variant;
  as?: "button" | "a";
  href?: string;
  style?: React.CSSProperties;
  target?: string;
  children: ReactNode;
};

const base =
  "ui-btn relative inline-flex items-center justify-center gap-2 rounded-full px-6 py-3 text-sm font-bold transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 focus-visible:ring-offset-background disabled:opacity-60";

const variants: Record<Variant, string> = {
  glow: "btn-glow text-white overflow-hidden",
  outline: "border border-border bg-card/60 hover:border-primary/60 hover:text-primary",
  ghost: "hover:bg-muted text-foreground",
};

export const Button = forwardRef<HTMLButtonElement, Props>(function Button(
  { variant = "glow", className = "", as = "button", href, style, target, children, ...rest },
  ref
) {
  const cls = `${base} ${variants[variant]} ${className}`;
  if (as === "a") {
    return (
      <motion.a
        href={href}
        target={target}
        style={style}
        whileHover={{ scale: 1.03 }}
        whileTap={{ scale: 0.97 }}
        className={cls}
      >
        {children}
      </motion.a>
    );
  }
  return (
    <motion.button
      ref={ref}
      style={style}
      whileHover={{ scale: 1.03 }}
      whileTap={{ scale: 0.97 }}
      className={cls}
      {...(rest as any)}
    >
      {children}
    </motion.button>
  );
});

/* ---------------- شارة صغيرة ---------------- */
export function Pill({ children, className = "" }: { children: ReactNode; className?: string }) {
  return (
    <span
      className={`inline-flex items-center gap-2 rounded-full border border-border bg-card/70 px-3 py-1 text-xs font-semibold ${className}`}
    >
      {children}
    </span>
  );
}

/* ---------------- عنوان قسم ---------------- */
export function SectionHeading({
  eyebrow,
  anim,
  vector,
  title,
  desc,
  center = true,
}: {
  eyebrow?: string;
  /** علامةٌ متحرّكة تتصدّر القسم. */
  anim?: ShariMotionId;
  /**
   * رسمٌ متجهٌ يتصدّر القسم — يُقدَّم على `anim` حين يجتمعان.
   * والفرقُ بينهما ليس في الشكل: `anim` صورةٌ نقطيّةٌ بحجمٍ واحدٍ تُنقل
   * من الخادم، و`vector` مساراتٌ تُرسم بألوان الهوية — فتتبع اللوحةَ
   * المختارة وتكبر بلا تحبّب ولا تزن شيئاً.
   */
  vector?: ShariVectorId;
  title: ReactNode;
  desc?: string;
  center?: boolean;
}) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 24 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: false, margin: "-80px" }}
      transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
      /* sx-head: خطّاف تصميم القسم — المعالجة تأتي من CSS لا من هنا. */
      className={`sx-head mb-12 max-w-2xl ${center ? "mx-auto text-center" : ""}`}
    >
      {/*
        العلامةُ المتحرّكة فوق العنوان الصغير لا بجانبه: بجانبه تُزاحم
        الكلمةَ وتكسر سطرَها على الشاشات الضيّقة، وفوقه تتصدّر القسمَ
        وتبقى العينُ تنزل إلى العنوان طبيعياً.
      */}
      {vector ? (
        <span className={`mb-3 flex ${center ? "justify-center" : ""}`}>
          <ShariVector id={vector} size={128} />
        </span>
      ) : anim ? (
        <span className={`mb-3 flex ${center ? "justify-center" : ""}`}>
          <ShariMotion id={anim} size={124} />
        </span>
      ) : null}
      {eyebrow && (
        <span className={`mb-4 flex items-center gap-3 text-xs font-bold tracking-[0.18em] text-primary ${center ? "justify-center" : ""}`}>
          {center && <RuleOrnament width={64} className="hidden text-primary sm:block" />}
          {eyebrow}
          <RuleOrnament width={64} className="hidden text-primary sm:block" />
        </span>
      )}
      <h2 className="font-display text-3xl font-extrabold leading-[1.5] [text-wrap:balance] sm:text-4xl md:text-[2.6rem]">
        {title}
      </h2>
      {desc && <p className="mt-4 text-base text-muted-foreground sm:text-lg">{desc}</p>}
    </motion.div>
  );
}

/* ---------------- حاوية قسم مع كشف عند التمرير ---------------- */
export function Reveal({
  children,
  delay = 0,
  className = "",
}: {
  children: ReactNode;
  delay?: number;
  className?: string;
}) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 28 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: false, margin: "-60px" }}
      transition={{ duration: 0.6, delay, ease: [0.22, 1, 0.36, 1] }}
      className={className}
    >
      {children}
    </motion.div>
  );
}
