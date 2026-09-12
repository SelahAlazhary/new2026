"use client";

/**
 * مكوّنات لوحات التحكّم — «الديوان».
 * ------------------------------------------------------------
 * كل عنصر بصري هنا مرسوم بـSVG: الميداليات، والفواصل، والحلقات،
 * والمخطّطات، وزخارف الزوايا. لا حدود CSS مزخرفة ولا صور نقطية.
 * الألوان كلّها من الثيم، والحركة تتوقّف مع prefers-reduced-motion.
 */
import { SectionLocal } from "./section-tabs";
import type { ReactNode } from "react";
import { motion } from "framer-motion";
import { useUid } from "@/components/brand/use-uid";

const toneMap: Record<string, string> = {
  primary: "text-primary",
  emerald: "text-emerald-600",
  amber: "text-amber-600",
  violet: "text-violet-600",
  gold: "text-accent",
  blue: "text-blue-600",
  cyan: "text-cyan-600",
  navy: "text-slate-700",
  orange: "text-orange-600",
  rose: "text-rose-600",
};

/**
 * لونُ الحلقة المصمَتة لشارة الإحصاء — ثابتٌ لكلّ نبرة، لا مشتقٌّ من
 * الثيم إلا في «الأساسي» و«الذهبي»: البقيّةُ منظومةُ ألوانٍ تصنيفيّةٌ
 * (كالمخطّطات) يجب أن تبقى واحدةً بصرفِ النظر عن هويّة المنصّة.
 */
const TONE_ICON: Record<string, { bg: string; glow: string }> = {
  primary: { bg: "hsl(var(--primary))", glow: "0 0 0 1px hsl(var(--primary)/0.5), 0 0 16px 2px hsl(var(--primary)/0.45), 0 0 34px 6px hsl(var(--primary)/0.22)" },
  gold: { bg: "hsl(var(--accent))", glow: "0 0 0 1px hsl(var(--accent)/0.55), 0 0 16px 2px hsl(var(--accent)/0.5), 0 0 34px 6px hsl(var(--accent)/0.24)" },
  emerald: { bg: "#059669", glow: "0 0 0 1px rgba(5,150,105,0.5), 0 0 16px 2px rgba(16,185,129,0.45), 0 0 34px 6px rgba(16,185,129,0.2)" },
  amber: { bg: "#d97706", glow: "0 0 0 1px rgba(217,119,6,0.5), 0 0 16px 2px rgba(245,158,11,0.45), 0 0 34px 6px rgba(245,158,11,0.2)" },
  violet: { bg: "#7c3aed", glow: "0 0 0 1px rgba(124,58,237,0.5), 0 0 16px 2px rgba(139,92,246,0.45), 0 0 34px 6px rgba(139,92,246,0.2)" },
  blue: { bg: "#2563eb", glow: "0 0 0 1px rgba(37,99,235,0.5), 0 0 16px 2px rgba(59,130,246,0.45), 0 0 34px 6px rgba(59,130,246,0.2)" },
  cyan: { bg: "#0891b2", glow: "0 0 0 1px rgba(8,145,178,0.5), 0 0 16px 2px rgba(6,182,212,0.45), 0 0 34px 6px rgba(6,182,212,0.2)" },
  navy: { bg: "#1e3a5f", glow: "0 0 0 1px rgba(30,58,95,0.5), 0 0 16px 2px rgba(30,58,95,0.4), 0 0 34px 6px rgba(30,58,95,0.18)" },
  orange: { bg: "#ea580c", glow: "0 0 0 1px rgba(234,88,12,0.5), 0 0 16px 2px rgba(249,115,22,0.45), 0 0 34px 6px rgba(249,115,22,0.2)" },
  rose: { bg: "#e11d48", glow: "0 0 0 1px rgba(225,29,72,0.5), 0 0 16px 2px rgba(244,63,94,0.45), 0 0 34px 6px rgba(244,63,94,0.2)" },
};

/**
 * شارةُ أيقونةٍ مصمَتة — دائرةٌ ملوّنةٌ بحافّةٍ نيونيّة، أيقونتُها بيضاء.
 * لغةُ الإنفوجرافيك القياسيّة: دائرةٌ صلبةٌ لا ميداليةٌ شفّافة، لتُقرأ
 * فئةُ الرقم بالنظرة الأولى قبل قراءة رقمه.
 */
export function IconDot({
  size = 44,
  tone = "primary",
  className = "",
  children,
}: {
  size?: number;
  tone?: string;
  className?: string;
  children?: ReactNode;
}) {
  const t = TONE_ICON[tone] ?? TONE_ICON.primary;
  return (
    <span
      className={`grid shrink-0 place-items-center rounded-full text-white ${className}`}
      style={{ width: size, height: size, background: t.bg, boxShadow: t.glow }}
    >
      {children}
    </span>
  );
}

/* ------------------------------------------------------------------ */
/*  لبنات SVG مشتركة                                                   */
/* ------------------------------------------------------------------ */

/** ميدالية مثمّنة — حاضنة الأيقونات في اللوحة. */
export function Medallion({
  size = 44,
  className = "",
  children,
}: {
  size?: number;
  className?: string;
  children?: ReactNode;
}) {
  return (
    <span
      className={`relative grid shrink-0 place-items-center ${className}`}
      style={{ width: size, height: size }}
    >
      <svg viewBox="0 0 44 44" className="absolute inset-0 size-full" fill="none" aria-hidden="true">
        <path
          d="M22 2 30.5 5.5 38.5 13.5 38.5 30.5 30.5 38.5 22 42 13.5 38.5 5.5 30.5 5.5 13.5 13.5 5.5Z"
          fill="currentColor"
          fillOpacity="0.1"
        />
        <path
          d="M22 2 30.5 5.5 38.5 13.5 38.5 30.5 30.5 38.5 22 42 13.5 38.5 5.5 30.5 5.5 13.5 13.5 5.5Z"
          stroke="currentColor"
          strokeOpacity="0.34"
          strokeWidth="1"
        />
        <circle cx="22" cy="22" r="13.5" stroke="currentColor" strokeOpacity="0.16" strokeWidth="0.8" />
      </svg>
      <span className="relative grid place-items-center">{children}</span>
    </span>
  );
}

/** زخرفة زاوية كوفية دقيقة داخل البطاقات. */
export function CardCorner({ className = "" }: { className?: string }) {
  return (
    <svg
      aria-hidden="true"
      viewBox="0 0 72 72"
      className={`pointer-events-none absolute left-0 top-0 size-16 ${className}`}
      fill="none"
    >
      <g stroke="currentColor" strokeWidth="1" fill="none" opacity="0.5">
        <path d="M0 22h14V8h14" />
        <path d="M0 34h24V0" opacity="0.55" />
        <path d="M0 10h6V4" opacity="0.7" />
      </g>
      <rect x="26" y="10" width="4" height="4" fill="currentColor" opacity="0.45" />
    </svg>
  );
}

/** فاصل مذهّب أفقي — بديل الحدود الباهتة. */
export function GoldRule({ className = "" }: { className?: string }) {
  return (
    <svg aria-hidden="true" viewBox="0 0 200 6" preserveAspectRatio="none" className={`h-1.5 w-full ${className}`} fill="none">
      <path d="M0 3h78" stroke="currentColor" strokeWidth="1" opacity="0.28" />
      <path d="M200 3h-78" stroke="currentColor" strokeWidth="1" opacity="0.28" />
      <path d="M100 0 105 3 100 6 95 3Z" fill="currentColor" opacity="0.75" />
      <circle cx="88" cy="3" r="1.1" fill="currentColor" opacity="0.5" />
      <circle cx="112" cy="3" r="1.1" fill="currentColor" opacity="0.5" />
    </svg>
  );
}

/** خطّ اتجاه مصغّر (Sparkline) — يُشتقّ من مصفوفة أرقام. */
export function Sparkline({
  data,
  width = 120,
  height = 32,
  className = "",
}: {
  data: number[];
  width?: number;
  height?: number;
  className?: string;
}) {
  const uid = useUid("spark");
  if (!data.length) return null;
  const max = Math.max(...data, 1);
  const min = Math.min(...data, 0);
  const span = max - min || 1;
  const step = width / Math.max(1, data.length - 1);
  // RTL: أحدث نقطة على اليسار
  const pts = data.map((v, i) => [width - i * step, height - ((v - min) / span) * (height - 4) - 2]);
  const line = pts.map((p, i) => `${i ? "L" : "M"}${p[0].toFixed(1)} ${p[1].toFixed(1)}`).join(" ");
  const area = `${line} L0 ${height} L${width} ${height} Z`;

  return (
    <svg viewBox={`0 0 ${width} ${height}`} className={`w-full ${className}`} fill="none" aria-hidden="true">
      <defs>
        <linearGradient id={`${uid}-f`} x1="0" y1="0" x2="0" y2={height} gradientUnits="userSpaceOnUse">
          <stop offset="0%" stopColor="currentColor" stopOpacity="0.28" />
          <stop offset="100%" stopColor="currentColor" stopOpacity="0" />
        </linearGradient>
      </defs>
      <path d={area} fill={`url(#${uid}-f)`} />
      <path d={line} stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" />
      <circle cx={pts[pts.length - 1][0]} cy={pts[pts.length - 1][1]} r="2.2" fill="currentColor" />
    </svg>
  );
}

/** حلقة نسبة مئوية — SVG بحركة رسم. */
export function Donut({
  value,
  size = 92,
  stroke = 9,
  label,
  className = "",
}: {
  value: number;
  size?: number;
  stroke?: number;
  label?: string;
  className?: string;
}) {
  const uid = useUid("donut");
  const pct = Math.max(0, Math.min(100, value));
  const r = (100 - stroke) / 2;
  const c = 2 * Math.PI * r;

  return (
    <span className={`relative grid place-items-center ${className}`} style={{ width: size, height: size }}>
      <svg viewBox="0 0 100 100" className="size-full -rotate-90" fill="none" aria-hidden="true">
        <defs>
          <linearGradient id={`${uid}-g`} x1="0" y1="0" x2="100" y2="100" gradientUnits="userSpaceOnUse">
            <stop offset="0%" stopColor="hsl(var(--primary))" />
            <stop offset="100%" stopColor="hsl(var(--accent))" />
          </linearGradient>
        </defs>
        <circle cx="50" cy="50" r={r} stroke="hsl(var(--muted))" strokeWidth={stroke} />
        <motion.circle
          cx="50"
          cy="50"
          r={r}
          stroke={`url(#${uid}-g)`}
          strokeWidth={stroke}
          strokeLinecap="round"
          strokeDasharray={c}
          initial={{ strokeDashoffset: c }}
          whileInView={{ strokeDashoffset: c - (pct / 100) * c }}
          viewport={{ once: false }}
          transition={{ duration: 1, ease: "easeOut" }}
        />
      </svg>
      <span className="absolute text-center leading-none">
        <span className="font-display block text-lg font-bold">{pct.toLocaleString("ar-EG")}٪</span>
        {label && <span className="font-kufi mt-1 block text-[11px] text-muted-foreground">{label}</span>}
      </span>
    </span>
  );
}

/* ------------------------------------------------------------------ */
/*  بطاقات ورؤوس الصفحات                                               */
/* ------------------------------------------------------------------ */

/**
 * أربعُ هيئات دخولٍ مختلفة — تتناوب بترتيب البطاقة لا تتكرّر كلّها بشكلٍ
 * واحد: صفٌّ من أربع بطاقاتٍ يدخل كلٌّ منها بحركةٍ غير حركة جارتها.
 */
const STAT_ENTRANCE = [
  { initial: { opacity: 0, y: 26, scale: 0.94 }, show: { opacity: 1, y: 0, scale: 1 } },
  { initial: { opacity: 0, x: 34, rotate: 2 }, show: { opacity: 1, x: 0, rotate: 0 } },
  { initial: { opacity: 0, x: -34, rotate: -2 }, show: { opacity: 1, x: 0, rotate: 0 } },
  { initial: { opacity: 0, scale: 0.8, rotate: -4 }, show: { opacity: 1, scale: 1, rotate: 0 } },
];

/** بطاقة إحصائية — شارةُ أيقونةٍ نيونيّةٌ صلبة، رقمٌ بخطّ المخطوط، وخطّ اتجاهٍ اختياري. */
export function StatCard({
  label,
  value,
  delta,
  icon,
  tone = "primary",
  index = 0,
  trend,
}: {
  label: string;
  value: ReactNode;
  delta?: string;
  icon: ReactNode;
  tone?: string;
  index?: number;
  /** أرقام اختيارية لرسم خطّ اتجاه أسفل البطاقة. */
  trend?: number[];
}) {
  const t = toneMap[tone] ?? toneMap.primary;
  const anim = STAT_ENTRANCE[index % STAT_ENTRANCE.length];
  return (
    <motion.div
      initial={anim.initial}
      whileInView={anim.show}
      viewport={{ once: false, margin: "0px 0px -40px 0px" }}
      transition={{ delay: (index % 4) * 0.08, duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
      className="glass relative overflow-hidden rounded-3xl p-5 shadow-bento"
    >
      <CardCorner className="text-accent/45" />

      <div className="relative flex items-start justify-between">
        <IconDot size={44} tone={tone}>
          {icon}
        </IconDot>
        {delta && (
          <span className="font-kufi rounded-full bg-emerald-500/12 px-2 py-0.5 text-[10px] font-bold text-emerald-600">
            {delta}
          </span>
        )}
      </div>

      <p className="font-display mt-4 text-[1.7rem] font-bold leading-none">{value}</p>
      <p className="font-kufi mt-2 text-[10px] tracking-wide text-muted-foreground">{label}</p>

      {trend && trend.length > 1 ? (
        <div className={`mt-3 ${t}`}>
          <Sparkline data={trend} />
        </div>
      ) : (
        <GoldRule className="mt-4 text-accent" />
      )}
    </motion.div>
  );
}

/** رأس الصفحة — عنوان بخطّ المخطوط وفاصل مذهّب. */
export function PageHeader({
  title,
  subtitle,
  action,
}: {
  title: string;
  subtitle?: string;
  action?: ReactNode;
}) {
  return (
    <div className="mb-7" data-reveal="down" data-reveal-duration="fast">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="font-display text-2xl font-bold sm:text-3xl">{title}</h1>
          {subtitle && <p className="mt-1.5 text-sm text-muted-foreground">{subtitle}</p>}
        </div>
        {action}
      </div>
      <div className="mt-4 max-w-[16rem] text-accent">
        <GoldRule />
      </div>
    </div>
  );
}

/** بطاقة عامة. */
export function Card({ children, className = "" }: { children: ReactNode; className?: string }) {
  /* ما في البطاقة محتوًى لا قسمُ صفحة — انظر `SectionLocal`. */
  return (
    <div className={`glass rounded-3xl p-5 shadow-bento ${className}`} data-reveal="up">
      <SectionLocal>{children}</SectionLocal>
    </div>
  );
}

/** شارة حالة ملوّنة. */
export function StatusBadge({ status }: { status: string }) {
  const map: Record<string, string> = {
    نشط: "bg-emerald-500/14 text-emerald-600",
    منشور: "bg-emerald-500/14 text-emerald-600",
    منشورة: "bg-emerald-500/14 text-emerald-600",
    متاح: "bg-emerald-500/14 text-emerald-600",
    مكتمل: "bg-emerald-500/14 text-emerald-600",
    مغلقة: "bg-emerald-500/14 text-emerald-600",
    مباشر: "bg-rose-500/15 text-rose-500",
    "بانتظار التفعيل": "bg-accent/18 text-accent",
    مسودّة: "bg-accent/18 text-accent",
    مجدول: "bg-accent/18 text-accent",
    "قيد المعالجة": "bg-accent/18 text-accent",
    مفتوحة: "bg-sky-500/15 text-sky-600",
    مستخدم: "bg-sky-500/15 text-sky-600",
    موقوف: "bg-rose-500/15 text-rose-500",
    منتهي: "bg-muted text-muted-foreground",
    مسجّل: "bg-sky-500/15 text-sky-600",
  };
  return (
    <span
      className={`font-kufi inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-[10px] font-bold ${
        map[status] ?? "bg-muted text-muted-foreground"
      }`}
    >
      {status === "مباشر" && <span className="size-1.5 animate-pulse rounded-full bg-current" />}
      {status}
    </span>
  );
}

/** شريط تقدّم — مسار SVG بحدّ ذهبي. */
export function Progress({ value, color }: { value: number; color?: string }) {
  const pct = Math.max(0, Math.min(100, value));
  return (
    <div className="relative h-2.5 w-full overflow-hidden rounded-full bg-muted ring-1 ring-inset ring-accent/20">
      <motion.div
        initial={{ width: 0 }}
        whileInView={{ width: `${pct}%` }}
        viewport={{ once: false }}
        transition={{ duration: 0.9, ease: "easeOut" }}
        className="h-full rounded-full"
        style={{
          background: color ?? "linear-gradient(90deg, hsl(var(--primary)), hsl(var(--accent)))",
        }}
      />
    </div>
  );
}

/** جدول بيانات متجاوب برأس مذهّب. */
export function DataTable({ head, children }: { head: string[]; children: ReactNode }) {
  return (
    <div className="glass overflow-hidden rounded-3xl shadow-bento" data-reveal="scale-up">
      <div className="overflow-x-auto">
        <table className="w-full min-w-[640px] text-right text-sm">
          <thead>
            <tr className="border-b border-accent/25 bg-accent/[0.06] text-xs text-muted-foreground">
              {head.map((h) => (
                <th key={h} className="font-kufi whitespace-nowrap px-4 py-3 text-[10px] font-bold tracking-wide">
                  {h}
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-border">{children}</tbody>
        </table>
      </div>
    </div>
  );
}
