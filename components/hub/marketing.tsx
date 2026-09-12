"use client";

import { useState, useRef, useEffect, useMemo } from "react";
import Link from "next/link";
import { motion, AnimatePresence, useInView, useScroll, useTransform } from "framer-motion";
import type { SaasPlan } from "@/lib/hub/types";
import { planPrice } from "@/lib/business/plans";
import {
  ArrowLeft,
  ChevronDown,
  Check,
  Play,
} from "lucide-react";

/* ═══════════════════════════════════════════════════════════════
   SpotLight Studio — صفحة الموقع الأمّ
   تصميم فريد بهوية بصرية سينمائية: أنماط هندسية SVG مخصصة،
   تأثيرات ضوئية متحركة، وتخطيطات غير تقليدية.
   ═══════════════════════════════════════════════════════════════ */

const STEPS = [
  { n: "01", t: "سجّل حسابك في ثوانٍ", d: "تسجيل فوري عبر جوجل أو البريد بدون بطاقة بنكية.", glyph: "M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5" },
  { n: "02", t: "اختر خطّتك المناسبة", d: "خطط مرنة تتناسب مع حجم طلابك واحتياجاتك.", glyph: "M12 2v20M17 7l-5-5-5 5M7 17l5 5 5-5M2 12h20" },
  { n: "03", t: "خصّص هويتك وشعارك", d: "اسمك وألوانك وشعارك من تصاميم عصرية.", glyph: "M12 3a9 9 0 100 18 9 9 0 000-18zM12 8v8M8 12h8" },
  { n: "04", t: "أطلق منصتك واستقبل طلابك", d: "رابط مخصص ولوحة تحكم متكاملة جاهزة.", glyph: "M5 12l5 5L20 7" },
];

const FEATURES = [
  { tag: "محتوى وفيديو", t: "بث ودروس فائقة السرعة", d: "مشغل فيديو مخصص بدون إعلانات مع دعم البث المباشر والواجبات.", accent: "#8B5CF6", icon: "M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" },
  { tag: "أمان متقدم", t: "حماية المحتوى والعلامة المائية", d: "تقييد بجهاز واحد وعلامة مائية ديناميكية وحظر تسجيل الشاشة.", accent: "#7C3AED", icon: "M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" },
  { tag: "أموالك ومبيعاتك", t: "بوابات دفع محلية وأكواد", d: "فودافون كاش وإنستاباي والفيزا مع أكواد شحن فورية.", accent: "#10B981", icon: "M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z" },
  { tag: "علامتك التجارية", t: "دومين وهوية خاصة بك", d: "اربط نطاقك المخصص لتظهر كأكاديمية مستقلة باسمك.", accent: "#F59E0B", icon: "M21 12a9 9 0 01-9 9m9-9a9 9 0 00-9-9m9 9H3m9 9a9 9 0 01-9-9m9 9c1.657 0 3-4.03 3-9s-1.343-9-3-9m0 18c-1.657 0-3-4.03-3-9s1.343-9 3-9" },
  { tag: "تجربة الطلاب", t: "تطبيق PWA لجميع الأجهزة", d: "يعمل كتطبيق هاتف خفيف على جميع الأجهزة بدون تحميل.", accent: "#06B6D4", icon: "M12 18h.01M8 21h8a2 2 0 002-2V5a2 2 0 00-2-2H8a2 2 0 00-2 2v14a2 2 0 002 2z" },
  { tag: "ذكاء الإدارة", t: "لوحة تحكم وتقارير دقيقة", d: "تقارير درجات ونسب مشاهدة وإيرادات ومتابعة حضور.", accent: "#8B5CF6", icon: "M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" },
];

const FAQS = [
  { q: "كيف أستلم أموالي من اشتراكات الطلاب؟", a: "تحصل على أموالك كاملة ومباشرة على حسابك البنكي أو محفظتك الإلكترونية (فودافون كاش، إنستاباي، أو بوابات الدفع) بدون أي وسيط أو تأخير." },
  { q: "كيف تحمي المنصة فيديوهاتي من التسريب؟", a: "نستخدم نظام حماية متعدد الطبقات يشمل علامة مائية متحركة باسم ورقم الطالب، قفل الحساب بجهاز واحد، وتشفير روابط البث لمنع التحميل." },
  { q: "هل أحتاج لأي خبرة برمجية أو تقنية؟", a: "إطلاقاً! المنصة جاهزة وتعمل بنقرة زر. ما عليك سوى كتابة اسمك ورفع دروسك وتحديد أسعار باقاتك من لوحة تحكم عربية سهلة." },
  { q: "هل يمكنني ربط دومين خاص (مثلاً myname.com)؟", a: "نعم، يمكنك ربط أي دومين تملكه بمنصتك بكل سهولة، أو استخدام الدومين الفرعي المجاني الذي نمنحه لك فور التسجيل." },
  { q: "كيف أغيّر خطّتي أو أترقّى لاحقاً؟", a: "يمكنك الترقية أو تغيير خطتك في أي وقت من لوحة التحكم. جميع دروسك وبيانات طلابك تبقى محفوظة بالكامل." },
];

const TRUST_STATS = [
  { value: "+٢,٤٠٠", label: "معلم ومحاضر" },
  { value: "+٨٦,٠٠٠", label: "طالب مسجّل" },
  { value: "٩٨.٤٪", label: "معدل رضا المستخدمين" },
];

/* ── زخارف SVG مخصصة ────────────────────────────────── */

function OrbitRings({ className = "" }: { className?: string }) {
  return (
    <svg viewBox="0 0 600 600" fill="none" className={className} aria-hidden="true">
      <circle cx="300" cy="300" r="120" stroke="rgba(139,92,246,0.06)" strokeWidth="1" />
      <circle cx="300" cy="300" r="200" stroke="rgba(139,92,246,0.04)" strokeWidth="1" strokeDasharray="8 12" />
      <circle cx="300" cy="300" r="280" stroke="rgba(139,92,246,0.03)" strokeWidth="1" strokeDasharray="4 16" />
      <circle cx="420" cy="300" r="4" fill="#8B5CF6" opacity="0.6">
        <animateTransform attributeName="transform" type="rotate" from="0 300 300" to="360 300 300" dur="20s" repeatCount="indefinite" />
      </circle>
      <circle cx="300" cy="100" r="3" fill="#F59E0B" opacity="0.5">
        <animateTransform attributeName="transform" type="rotate" from="0 300 300" to="-360 300 300" dur="30s" repeatCount="indefinite" />
      </circle>
      <circle cx="500" cy="300" r="2.5" fill="#10B981" opacity="0.4">
        <animateTransform attributeName="transform" type="rotate" from="0 300 300" to="360 300 300" dur="40s" repeatCount="indefinite" />
      </circle>
      <circle cx="580" cy="300" r="2" fill="#7C3AED" opacity="0.3">
        <animateTransform attributeName="transform" type="rotate" from="180 300 300" to="540 300 300" dur="50s" repeatCount="indefinite" />
      </circle>
    </svg>
  );
}

function GridPattern({ className = "" }: { className?: string }) {
  return (
    <svg viewBox="0 0 400 400" fill="none" className={className} aria-hidden="true">
      <defs>
        <pattern id="mk-grid" x="0" y="0" width="40" height="40" patternUnits="userSpaceOnUse">
          <path d="M40 0H0v40" stroke="rgba(139,92,246,0.04)" strokeWidth="0.5" fill="none" />
        </pattern>
        <radialGradient id="mk-grid-fade" cx="50%" cy="50%" r="50%">
          <stop offset="0%" stopColor="white" />
          <stop offset="100%" stopColor="white" stopOpacity="0" />
        </radialGradient>
        <mask id="mk-grid-mask">
          <rect width="400" height="400" fill="url(#mk-grid-fade)" />
        </mask>
      </defs>
      <rect width="400" height="400" fill="url(#mk-grid)" mask="url(#mk-grid-mask)" />
    </svg>
  );
}

function FloatingGlyph({ d, size = 24, color = "#8B5CF6", delay = 0, duration = 6, x = 0, y = 0 }: { d: string; size?: number; color?: string; delay?: number; duration?: number; x?: number; y?: number }) {
  return (
    <motion.svg
      viewBox="0 0 24 24"
      width={size}
      height={size}
      fill="none"
      stroke={color}
      strokeWidth="1.5"
      strokeLinecap="round"
      strokeLinejoin="round"
      className="pointer-events-none absolute"
      style={{ left: `${x}%`, top: `${y}%`, opacity: 0.12 }}
      animate={{ y: [0, -12, 0], rotate: [0, 5, -5, 0] }}
      transition={{ duration, delay, repeat: Infinity, ease: "easeInOut" }}
    >
      <path d={d} />
    </motion.svg>
  );
}

/* ── مكوّن ظهور عند الدخول في نطاق الرؤية ── */
type RevealDir = "up" | "down" | "left" | "right" | "scale" | "blur" | "flip" | "zoom";

const REVEAL_FROM: Record<RevealDir, Record<string, number>> = {
  up: { opacity: 0, y: 32 },
  down: { opacity: 0, y: -28 },
  left: { opacity: 0, x: -32 },
  right: { opacity: 0, x: 32 },
  scale: { opacity: 0, scale: 0.9 },
  blur: { opacity: 0, y: 14, filter: "blur(8px)" } as never,
  flip: { opacity: 0, rotateY: -14, x: 24 },
  zoom: { opacity: 0, scale: 1.1 },
};

const REVEAL_TO = { opacity: 1, y: 0, x: 0, scale: 1, rotateY: 0, filter: "blur(0px)" };

function Reveal({
  children,
  delay = 0,
  className = "",
  direction = "up",
}: {
  children: React.ReactNode;
  delay?: number;
  className?: string;
  direction?: RevealDir;
}) {
  const ref = useRef<HTMLDivElement>(null);
  const inView = useInView(ref, { once: true, margin: "-80px" });
  const initial = REVEAL_FROM[direction];

  return (
    <div ref={ref} className={className}>
      <motion.div
        initial={initial}
        animate={inView ? REVEAL_TO : initial}
        transition={{ duration: 0.65, delay, ease: [0.22, 1, 0.36, 1] }}
        style={direction === "flip" ? { perspective: 800 } : undefined}
      >
        {children}
      </motion.div>
    </div>
  );
}

/* ── أيقونة SVG مخصصة ── */
function FeatureIcon({ d, color, size = 24 }: { d: string; color: string; size?: number }) {
  return (
    <svg viewBox="0 0 24 24" width={size} height={size} fill="none" stroke={color} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
      <path d={d} />
    </svg>
  );
}

/* ── شريط ثقة متحرك ── */
function TrustBar() {
  return (
    <div className="mkt-trust">
      {TRUST_STATS.map((s, i) => (
        <div key={s.label} className="mkt-trust-item">
          {i > 0 && <span className="mkt-trust-sep" />}
          <span className="mkt-trust-val">{s.value}</span>
          <span className="mkt-trust-label">{s.label}</span>
        </div>
      ))}
    </div>
  );
}

/* ══════════════════════════════════════════════════════════ */
/*  المكوّن الرئيسي                                         */
/* ══════════════════════════════════════════════════════════ */

export function Marketing({ plans, brand }: { plans: SaasPlan[]; brand: string }) {
  const [activeTab, setActiveTab] = useState<"teacher" | "student" | "player">("teacher");
  const [openFaq, setOpenFaq] = useState<number | null>(0);
  const heroRef = useRef<HTMLElement>(null);
  const { scrollYProgress } = useScroll({ target: heroRef, offset: ["start start", "end start"] });
  const heroOpacity = useTransform(scrollYProgress, [0, 0.6], [1, 0]);
  const heroScale = useTransform(scrollYProgress, [0, 0.6], [1, 0.96]);

  return (
    <div className="mkt font-sans selection:bg-purple-500/20 selection:text-white">

      {/* ════════════════ شريط التنقل ════════════════ */}
      <header className="mkt-bar">
        <div className="flex items-center gap-3">
          <span className="mkt-brand-mark">{brand.slice(0, 1) || "S"}</span>
          <span className="mkt-logo">{brand}</span>
        </div>
        <nav className="mkt-bar-nav">
          <a href="#how" className="hidden sm:block">كيف يعمل؟</a>
          <a href="#features" className="hidden sm:block">المميزات</a>
          <a href="#plans">الأسعار</a>
          <a href="#faq" className="hidden md:block">الأسئلة</a>
          <Link href="/start" className="mkt-bar-cta">ابدأ الآن <ArrowLeft className="size-3.5" /></Link>
        </nav>
      </header>

      {/* ════════════════ الهيرو ════════════════ */}
      <motion.section ref={heroRef} className="mkt-hero" style={{ opacity: heroOpacity, scale: heroScale }}>
        {/* زخارف خلفية */}
        <OrbitRings className="mkt-hero-orbits" />
        <GridPattern className="mkt-hero-grid-pat" />

        <FloatingGlyph d="M12 2L2 7l10 5 10-5-10-5z" x={8} y={15} size={28} color="#8B5CF6" delay={0} duration={7} />
        <FloatingGlyph d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" x={85} y={20} size={22} color="#F59E0B" delay={1.5} duration={8} />
        <FloatingGlyph d="M21 12a9 9 0 01-9 9m9-9a9 9 0 00-9-9m9 9H3" x={12} y={65} size={20} color="#10B981" delay={3} duration={9} />
        <FloatingGlyph d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6" x={90} y={70} size={18} color="#7C3AED" delay={2} duration={7.5} />

        <div className="mkt-hero-content">
          <motion.div
            className="mkt-eyebrow"
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
          >
            <span className="mkt-eyebrow-dot" />
            <span>المنصة السحابية الأولى لإطلاق أكاديميتك التعليمية</span>
          </motion.div>

          <motion.h1
            className="mkt-title"
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.1, ease: [0.22, 1, 0.36, 1] }}
          >
            أنشئ منصّتك التعليمية
            <span className="mkt-title-em">باسمك وهويّتك</span>
          </motion.h1>

          <motion.p
            className="mkt-sub"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.2, ease: [0.22, 1, 0.36, 1] }}
          >
            كورسات، دروس فيديو محمية، اختبارات، بث مباشر، وبوابات دفع —
            على منصة مستقلة برابطك الخاص وبدون كتابة سطر كود.
          </motion.p>

          <motion.div
            className="mkt-hero-actions"
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.3, ease: [0.22, 1, 0.36, 1] }}
          >
            <Link href="/start" className="mkt-cta-primary">
              <span className="mkt-cta-primary-bg" />
              <span className="relative flex items-center gap-2">أنشئ منصّتك الآن <ArrowLeft className="size-4" /></span>
            </Link>
            <a href="#demo" className="mkt-cta-ghost">
              <Play className="size-4" />
              استكشف المنصة
            </a>
          </motion.div>

          <motion.div
            className="mkt-hero-checks"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.4, delay: 0.45 }}
          >
            {["إطلاق فوري في دقيقة", "دعم فني متواصل", "حماية متقدمة لمحتواك"].map((txt) => (
              <span key={txt} className="mkt-hero-check">
                <svg viewBox="0 0 16 16" width="14" height="14" fill="none"><circle cx="8" cy="8" r="7" stroke="#10B981" strokeWidth="1.5" opacity="0.5" /><path d="M5 8l2 2 4-4" stroke="#10B981" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" /></svg>
                {txt}
              </span>
            ))}
          </motion.div>
        </div>

        {/* شريط الثقة */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.55 }}
        >
          <TrustBar />
        </motion.div>

        {/* ─── معاينة تفاعلية ─── */}
        <motion.div
          id="demo"
          className="mkt-demo"
          initial={{ opacity: 0, y: 40, scale: 0.97 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          transition={{ duration: 0.7, delay: 0.6, ease: [0.22, 1, 0.36, 1] }}
        >
          <div className="mkt-demo-chrome">
            <div className="mkt-demo-dots">
              <span /><span /><span />
              <span className="mkt-demo-url">yourname.platform.edu</span>
            </div>
            <div className="mkt-demo-tabs">
              {(["teacher", "student", "player"] as const).map((tab) => (
                <button
                  key={tab}
                  type="button"
                  onClick={() => setActiveTab(tab)}
                  className={`mkt-demo-tab ${activeTab === tab ? "is-active" : ""}`}
                >
                  {tab === "teacher" ? "لوحة المعلم" : tab === "student" ? "بوابة الطالب" : "مشغل الفيديو"}
                </button>
              ))}
            </div>
          </div>

          <div className="mkt-demo-screen">
            <AnimatePresence mode="wait">
              {activeTab === "teacher" && (
                <motion.div key="teacher" initial={{ opacity: 0, x: 16 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -16 }} transition={{ duration: 0.3 }} className="space-y-4">
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                    {[
                      { l: "إجمالي الطلاب", v: "١٬٤٨٢", s: "+١٤٪ هذا الشهر", sc: "#10B981" },
                      { l: "المبيعات", v: "٨٤٬٥٠٠ ج.م", s: "تسليم فوري", sc: "#10B981" },
                      { l: "نسبة الإكمال", v: "٩٦.٤٪", s: "تفاعل قياسي", sc: "#a78bfa" },
                      { l: "حماية الأجهزة", v: "١٠٠٪", s: "لا تسريب", sc: "rgba(255,255,255,0.3)" },
                    ].map((item, i) => (
                      <div key={i} className="mkt-demo-stat">
                        <span className="mkt-demo-stat-label">{item.l}</span>
                        <p className="mkt-demo-stat-val">{item.v}</p>
                        <span className="mkt-demo-stat-sub" style={{ color: item.sc }}>{item.s}</span>
                      </div>
                    ))}
                  </div>
                  <div className="mkt-demo-course">
                    <div className="mkt-demo-course-icon">📚</div>
                    <div className="flex-1 min-w-0">
                      <h4 className="mkt-demo-course-name">مراجعة ليلة الامتحان — الصف الثالث الثانوي</h4>
                      <p className="mkt-demo-course-meta">٣ فصول · ١٢ فيديو · ٤ اختبارات</p>
                    </div>
                    <span className="mkt-demo-course-badge">نشط</span>
                  </div>
                </motion.div>
              )}
              {activeTab === "student" && (
                <motion.div key="student" initial={{ opacity: 0, x: 16 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -16 }} transition={{ duration: 0.3 }}>
                  <div className="mkt-demo-student-card">
                    <span className="mkt-demo-student-greeting">مرحباً بك يا بطل</span>
                    <h3 className="mkt-demo-student-title">تابع دروسك واستعد للاختبار القادم</h3>
                    <div className="mkt-demo-student-tags">
                      <span>الفرع: النحو والبلاغة</span>
                      <span>الواجب القادم: الأحد ٨ مساءً</span>
                    </div>
                  </div>
                </motion.div>
              )}
              {activeTab === "player" && (
                <motion.div key="player" initial={{ opacity: 0, x: 16 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -16 }} transition={{ duration: 0.3 }}>
                  <div className="mkt-demo-player">
                    <div className="mkt-demo-watermark">WATERMARK: 010****XXXX</div>
                    <div className="mkt-demo-play-btn">
                      <Play className="size-7 fill-white ml-0.5" />
                    </div>
                    <p className="mkt-demo-player-label">مشغل محمي ضد تصوير الشاشة والتحميل</p>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </motion.div>
      </motion.section>

      {/* ════════════════ الخطوات ════════════════ */}
      <section id="how" className="mkt-steps-section">
        <Reveal>
          <div className="mkt-section-header">
            <span className="mkt-section-tag mkt-section-tag--purple">خطوات بسيطة</span>
            <h2 className="mkt-h2">كيف تبدأ تدريسك<br/><span className="mkt-h2-em">في ٤ خطوات فقط؟</span></h2>
          </div>
        </Reveal>

        <div className="mkt-timeline">
          <div className="mkt-timeline-line" />
          {STEPS.map((s, i) => (
            <Reveal key={s.n} delay={i * 0.1} direction={i % 2 === 0 ? "left" : "right"}>
              <div className="mkt-timeline-node">
                <div className="mkt-timeline-dot">
                  <span className="mkt-timeline-dot-n">{s.n}</span>
                </div>
                <div className="mkt-timeline-card">
                  <div className="mkt-timeline-card-icon">
                    <FeatureIcon d={s.glyph} color="#8B5CF6" size={20} />
                  </div>
                  <b className="mkt-timeline-card-title">{s.t}</b>
                  <span className="mkt-timeline-card-desc">{s.d}</span>
                </div>
              </div>
            </Reveal>
          ))}
        </div>
      </section>

      {/* ════════════════ المميزات ════════════════ */}
      <section id="features" className="mkt-features-section">
        <Reveal direction="blur">
          <div className="mkt-section-header">
            <span className="mkt-section-tag mkt-section-tag--amber">كل ما تحتاجه</span>
            <h2 className="mkt-h2">أدوات متطورة<br/><span className="mkt-h2-em">مصمّمة خصيصاً للمدرسين</span></h2>
            <p className="mkt-section-sub">
              بنيت على تجربة آلاف الطلاب والمعلمين لتوفر أعلى نسب التزام وأسهل إدارة.
            </p>
          </div>
        </Reveal>

        <div className="mkt-bento">
          {FEATURES.map((f, i) => {
            const isWide = i === 0 || i === 3;
            return (
              <Reveal key={f.t} delay={i * 0.07} direction="scale" className={isWide ? "mkt-bento-wide" : ""}>
                <div className="mkt-bento-card group">
                  <div className="mkt-bento-card-glow" style={{ background: `radial-gradient(circle at 30% 30%, ${f.accent}12, transparent 70%)` }} />
                  <div className="mkt-bento-card-inner">
                    <div className="mkt-bento-head">
                      <span className="mkt-bento-icon" style={{ color: f.accent, borderColor: `${f.accent}25` }}>
                        <FeatureIcon d={f.icon} color={f.accent} size={22} />
                      </span>
                      <span className="mkt-bento-tag" style={{ color: f.accent, background: `${f.accent}10`, borderColor: `${f.accent}20` }}>{f.tag}</span>
                    </div>
                    <b className="mkt-bento-title">{f.t}</b>
                    <p className="mkt-bento-desc">{f.d}</p>
                    <div className="mkt-bento-accent-line" style={{ background: `linear-gradient(90deg, ${f.accent}, transparent)` }} />
                  </div>
                </div>
              </Reveal>
            );
          })}
        </div>
      </section>

      {/* ════════════════ الأسعار ════════════════ */}
      <section id="plans" className="mkt-pricing-section">
        <Reveal direction="down">
          <div className="mkt-section-header">
            <span className="mkt-section-tag mkt-section-tag--purple">أسعار شفافة</span>
            <h2 className="mkt-h2">خطط مرنة<br/><span className="mkt-h2-em">تنمو مع تزايد طلابك</span></h2>
            <p className="mkt-section-sub">
              اختر الخطة المناسبة ويمكنك الترقية في أي وقت.
            </p>
          </div>
        </Reveal>

        <div className="mkt-plan-grid">
          {plans.map((p, i) => {
            const price = planPrice({ price: p.priceEGP, discount: p.discount });
            const isHot = Boolean(p.highlight);
            return (
              <Reveal key={p.id} delay={i * 0.08} direction="flip">
                <div className={`mkt-plan ${isHot ? "is-hot" : ""}`}>
                  {isHot && <div className="mkt-plan-glow" />}
                  {p.badge && (
                    <span className="mkt-plan-badge">
                      <svg viewBox="0 0 16 16" width="12" height="12" fill="none"><path d="M8 1l2.2 4.5L15 6.3l-3.5 3.4.8 4.8L8 12.2 3.7 14.5l.8-4.8L1 6.3l4.8-.8L8 1z" fill="#F59E0B" /></svg>
                      {p.badge}
                    </span>
                  )}
                  <b className="mkt-plan-name">{p.name}</b>
                  {p.desc && <span className="mkt-plan-desc">{p.desc}</span>}

                  <div className="mkt-plan-price">
                    <span className="mkt-plan-num">{price.price.toLocaleString("ar-EG")}</span>
                    <span className="mkt-plan-cur">ج.م / {p.interval === "month" ? "شهر" : p.interval === "quarter" ? "٣ أشهر" : "سنة"}</span>
                  </div>

                  <ul className="mkt-plan-features">
                    {[
                      p.limits?.maxStudents ? `حتى ${p.limits.maxStudents} طالب` : "عدد طلاب غير محدود",
                      p.limits?.customDomain ? "دومين خاص مخصص" : "دومين فرعي مجاني",
                      "حماية متقدمة وعلامة مائية",
                      "دعم فني طوال الأسبوع",
                    ].map((feat, fi) => (
                      <li key={fi}>
                        <Check className="size-3.5 shrink-0" style={{ color: isHot ? "#8B5CF6" : "#10B981" }} />
                        <span>{feat}</span>
                      </li>
                    ))}
                  </ul>

                  <Link href="/start" className={`mkt-plan-cta ${isHot ? "is-hot" : ""}`}>
                    اختر {p.name} <ArrowLeft className="size-3.5" />
                  </Link>
                </div>
              </Reveal>
            );
          })}
        </div>
      </section>

      {/* ════════════════ الأسئلة الشائعة ════════════════ */}
      <section id="faq" className="mkt-faq-section">
        <Reveal direction="blur">
          <div className="mkt-section-header">
            <span className="mkt-section-tag mkt-section-tag--dim">إجابات واضحة</span>
            <h2 className="mkt-h2">الأسئلة<br/><span className="mkt-h2-em">الأكثر شيوعاً</span></h2>
          </div>
        </Reveal>

        <div className="mkt-faq-list">
          {FAQS.map((faq, idx) => {
            const isOpen = openFaq === idx;
            return (
              <Reveal key={idx} delay={idx * 0.04} direction={idx % 2 === 0 ? "left" : "right"}>
                <div className={`mkt-faq-item ${isOpen ? "is-open" : ""}`}>
                  <button type="button" onClick={() => setOpenFaq(isOpen ? null : idx)} className="mkt-faq-q">
                    <span>{faq.q}</span>
                    <ChevronDown className={`size-4 shrink-0 transition-transform duration-300 ${isOpen ? "rotate-180" : ""}`} style={{ color: isOpen ? "#8B5CF6" : "rgba(255,255,255,0.2)" }} />
                  </button>
                  <AnimatePresence initial={false}>
                    {isOpen && (
                      <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: "auto", opacity: 1 }} exit={{ height: 0, opacity: 0 }} transition={{ duration: 0.3, ease: [0.22, 1, 0.36, 1] }}>
                        <div className="mkt-faq-a">{faq.a}</div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              </Reveal>
            );
          })}
        </div>
      </section>

      {/* ════════════════ الدعوة الختامية ════════════════ */}
      <section className="mkt-final-section">
        <Reveal direction="zoom">
          <div className="mkt-final-card">
            <div className="mkt-final-glow mkt-final-glow--1" />
            <div className="mkt-final-glow mkt-final-glow--2" />
            <OrbitRings className="mkt-final-orbits" />

            <span className="mkt-final-tag">
              <svg viewBox="0 0 16 16" width="14" height="14" fill="none"><path d="M8 1l2.2 4.5L15 6.3l-3.5 3.4.8 4.8L8 12.2 3.7 14.5l.8-4.8L1 6.3l4.8-.8L8 1z" fill="#F59E0B" /></svg>
              ابدأ اليوم
            </span>

            <h2 className="mkt-final-h">جاهز لإطلاق أكاديميتك؟</h2>
            <p className="mkt-final-sub">انضم لمئات المعلمين الذين نقلوا تدريسهم لمستوى احترافي.</p>
            <Link href="/start" className="mkt-final-cta">أنشئ منصّتك الآن <ArrowLeft className="size-4" /></Link>
          </div>
        </Reveal>
      </section>

      {/* ════════════════ الفوتر ════════════════ */}
      <footer className="mkt-foot">
        <div className="mkt-foot-inner">
          <div className="mkt-foot-brand">
            <span className="mkt-brand-mark mkt-brand-mark--sm">{brand.slice(0, 1) || "S"}</span>
            <span className="mkt-foot-name">{brand}</span>
            <span className="mkt-foot-tagline">· منصّة إنشاء الأكاديميات</span>
          </div>
          <div className="mkt-foot-links">
            <a href="#plans">الأسعار</a>
            <a href="#features">المميزات</a>
            <Link href="/login">دخول</Link>
            <Link href="/start" className="mkt-foot-start">إنشاء منصة</Link>
          </div>
        </div>
        <div className="mkt-foot-copy">
          جميع الحقوق محفوظة © {new Date().getFullYear()} {brand}
        </div>
      </footer>
    </div>
  );
}
