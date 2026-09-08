"use client";

import { useState, useRef, useEffect } from "react";
import Link from "next/link";
import { motion, AnimatePresence, useInView } from "framer-motion";
import type { SaasPlan } from "@/lib/hub/types";
import { planPrice } from "@/lib/business/plans";
import {
  Sparkles,
  ShieldCheck,
  Video,
  CreditCard,
  Globe,
  BarChart3,
  ArrowLeft,
  CheckCircle2,
  Zap,
  Smartphone,
  ChevronDown,
  Layers,
  Lock,
  Play,
  Award,
  Check,
  TrendingUp,
  Users,
  Star,
} from "lucide-react";

/**
 * صفحةُ الموقع الأمّ — «أنشئ منصّتك التعليمية».
 * واجهة عصرية فائقة الاحترافية — premium human-engineered design
 */

const STEPS = [
  {
    n: "01",
    t: "سجّل حسابك في ثوانٍ",
    d: "تسجيل فوري عبر جوجل أو البريد الإلكتروني بدون أي تعقيد أو بطاقة بنكية.",
    icon: Zap,
    color: "#7B4FB0",
    bg: "#f5f0ff",
  },
  {
    n: "02",
    t: "اختر خطّتك المناسبة",
    d: "اختر الخطة التي تناسب حجم طلابك واحتياجاتك مع إمكانية الترقية في أي وقت.",
    icon: Sparkles,
    color: "#5B3A8C",
    bg: "#f3eeff",
  },
  {
    n: "03",
    t: "خصّص هويتك وشعارك",
    d: "أدخل اسمك، ألوانك الخاصة، وشعارك من بين تصاميم عصرية جاهزة.",
    icon: Layers,
    color: "#7c3aed",
    bg: "#f5f3ff",
  },
  {
    n: "04",
    t: "أطلق منصتك واستقبل طلابك",
    d: "رابط مخصص لطلابك ولوحة تحكم متكاملة لإدارة الكورسات، الدفع، والاختبارات.",
    icon: Globe,
    color: "#059669",
    bg: "#ecfdf5",
  },
];

const FEATURES = [
  {
    icon: Video,
    tag: "محتوى وفيديو",
    t: "بث ودروس فائقة السرعة",
    d: "مشغل فيديو مخصص وسريع بدون إعلانات مع دعم البث المباشر والواجبات المرتبطة بكل درس.",
    accent: "#7B4FB0",
  },
  {
    icon: Lock,
    tag: "أمان متقدم",
    t: "حماية المحتوى والعلامة المائية",
    d: "تقييد الحساب بجهاز واحد، علامة مائية ديناميكية برقم وهاتف الطالب، وحظر برامج تسجيل الشاشة.",
    accent: "#7c3aed",
  },
  {
    icon: CreditCard,
    tag: "أموالك ومبيعاتك",
    t: "بوابات دفع محلية وأكواد",
    d: "استلم أموالك عبر فودافون كاش، إنستاباي، والفيزا مع نظام أكواد شحن فورية واشتراكات تلقائية.",
    accent: "#059669",
  },
  {
    icon: Globe,
    tag: "علامتك التجارية",
    t: "دومين وهوية خاصة بك",
    d: "اربط منصتك بنطاقك المخصص (.com أو .net) لتظهر كأكاديمية مستقلة تماماً باسمك وشعارك.",
    accent: "#d97706",
  },
  {
    icon: Smartphone,
    tag: "تجربة الطلاب",
    t: "تطبيق PWA لجميع الأجهزة",
    d: "منصتك تعمل كتطبيق هاتف خفيف وسريع على أجهزة أندرويد وآيفون والكمبيوتر بدون تحميل من المتجر.",
    accent: "#0891b2",
  },
  {
    icon: BarChart3,
    tag: "ذكاء الإدارة",
    t: "لوحة تحكم وتقارير دقيقة",
    d: "تقارير شاملة عن درجات الطلاب، نسب المشاهدة، الإيرادات اليومية، ومتابعة الحضور والغياب.",
    accent: "#5B3A8C",
  },
];

const FAQS = [
  {
    q: "كيف أستلم أموالي من اشتراكات الطلاب؟",
    a: "تحصل على أموالك كاملة ومباشرة على حسابك البنكي أو محفظتك الإلكترونية (فودافون كاش، إنستاباي، أو بوابات الدفع الإلكتروني) بدون أي وسيط أو تأخير.",
  },
  {
    q: "كيف تحمي المنصة فيديوهاتي من التسريب والسرقة؟",
    a: "نستخدم نظام حماية متعدد الطبقات يشمل وضع علامة مائية متحركة باسم ورقم الطالب فوق الفيديو، قفل الحساب بجهاز واحد (Device Lock)، وتشفير روابط البث لمنع التحميل ببرامج التنزيل.",
  },
  {
    q: "هل أحتاج لأي خبرة برمجية أو تقنية لإنشاء المنصة؟",
    a: "إطلاقاً! المنصة جاهزة وتعمل بنقرة زر واحدة. ما عليك سوى كتابة اسمك ورفع دروسك وتحديد أسعار باقاتك من خلال لوحة تحكم عربية سهلة وبسيطة.",
  },
  {
    q: "هل يمكنني ربط دومين خاص (مثلاً myname.com)؟",
    a: "نعم، يمكنك ربط أي دومين تملكه بمنصتك بكل سهولة، أو استخدام الدومين الفرعي المجاني الذي نمنحه لك فور التسجيل.",
  },
  {
    q: "كيف أغيّر خطّتي أو أترقّى لاحقاً؟",
    a: "يمكنك الترقية أو تغيير خطتك في أي وقت من لوحة التحكم. جميع دروسك وبيانات طلابك تبقى محفوظة بالكامل عند التبديل بين الخطط.",
  },
];

const STATS = [
  { v: "+٢,٤٠٠", l: "معلم ومحاضر", icon: Users },
  { v: "+٨٦,٠٠٠", l: "طالب مسجّل", icon: TrendingUp },
  { v: "٩٨.٤٪", l: "معدل رضا المستخدمين", icon: Star },
];

/* ── مكوّن ظهور عند الدخول في نطاق الرؤية ── */
function FadeIn({
  children,
  delay = 0,
  className = "",
}: {
  children: React.ReactNode;
  delay?: number;
  className?: string;
}) {
  const ref = useRef<HTMLDivElement>(null);
  const inView = useInView(ref, { once: true, margin: "-60px" });

  return (
    <div ref={ref} className={className}>
      <motion.div
        initial={{ opacity: 0, y: 18 }}
        animate={inView ? { opacity: 1, y: 0 } : { opacity: 0, y: 18 }}
        transition={{ duration: 0.5, delay, ease: [0.22, 1, 0.36, 1] }}
      >
        {children}
      </motion.div>
    </div>
  );
}

export function Marketing({ plans, brand }: { plans: SaasPlan[]; brand: string }) {
  const [activeTab, setActiveTab] = useState<"teacher" | "student" | "player">("teacher");
  const [openFaq, setOpenFaq] = useState<number | null>(0);

  return (
    <div className="mkt font-sans selection:bg-purple-500/20 selection:text-purple-900">

      {/* ════════════════ شريط التنقل ════════════════ */}
      <header className="mkt-bar">
        <div className="flex items-center gap-3">
          <span
            className="size-9 rounded-xl flex items-center justify-center font-black text-sm text-white shadow-lg"
            style={{ background: "linear-gradient(135deg, #7B4FB0, #5B3A8C)" }}
          >
            {brand.slice(0, 1) || "S"}
          </span>
          <span className="mkt-logo">{brand}</span>
          <span
            className="hidden sm:inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-bold border"
            style={{ background: "#f5f0ff", color: "#7B4FB0", borderColor: "rgba(123,79,176,0.2)" }}
          >
            <Sparkles className="size-3" /> الجيل الثاني
          </span>
        </div>

        <nav className="mkt-bar-nav">
          <a href="#how"      className="hidden sm:block">كيف يعمل؟</a>
          <a href="#features" className="hidden sm:block">المميزات</a>
          <a href="#plans"                               >الأسعار</a>
          <a href="#faq"      className="hidden md:block">الأسئلة</a>
          <Link href="/start" className="mkt-bar-cta">
            ابدأ الآن <ArrowLeft className="size-3.5" />
          </Link>
        </nav>
      </header>

      {/* ════════════════ الهيرو ════════════════ */}
      <section className="mkt-hero">

        <motion.div
          initial={{ opacity: 0, scale: 0.92 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
        >
          <div className="mkt-eyebrow">
            <span className="flex size-2 rounded-full bg-amber-500 animate-pulse" />
            <span>المنصة السحابية الأولى لإطلاق أكاديميتك التعليمية أونلاين</span>
          </div>
        </motion.div>

        <motion.h1
          className="mkt-title"
          initial={{ opacity: 0, y: 24 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.55, delay: 0.08, ease: [0.22, 1, 0.36, 1] }}
        >
          أنشئ منصّتك التعليمية المتكاملة
          <span className="mkt-title-em">باسمك وهويّتك الكاملة</span>
        </motion.h1>

        <motion.p
          className="mkt-sub"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.16, ease: [0.22, 1, 0.36, 1] }}
        >
          كل ما تحتاجه كمعلم ومحاضر للتدريس أونلاين باحترافية: كورسات، دروس فيديو محمية، اختبارات تلقائية، بث مباشر، وبوابات دفع — على منصة مستقلة برابطك الخاص وبدون كتابة سطر كود واحد.
        </motion.p>

        <motion.div
          className="mkt-hero-cta"
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.45, delay: 0.24, ease: [0.22, 1, 0.36, 1] }}
        >
          <Link href="/start" className="mkt-primary mkt-primary-lg">
            أنشئ منصّتك الآن <ArrowLeft className="size-4" />
          </Link>
          <a href="#demo" className="mkt-ghost">
            <Play className="size-4" style={{ color: "#7B4FB0", fill: "rgba(123,79,176,0.15)" }} />
            استكشف المنصة
          </a>
        </motion.div>

        <motion.p
          className="mkt-note flex items-center justify-center gap-2"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.4, delay: 0.36 }}
        >
          <CheckCircle2 className="size-3.5" style={{ color: "#059669" }} /> إطلاق فوري في دقيقة
          <span style={{ color: "#cbd5e1" }}>•</span>
          <CheckCircle2 className="size-3.5" style={{ color: "#059669" }} /> دعم فني متواصل
          <span style={{ color: "#cbd5e1" }}>•</span>
          <CheckCircle2 className="size-3.5" style={{ color: "#059669" }} /> حماية متقدمة لمحتواك
        </motion.p>

        {/* ─── إحصائيات الثقة ─── */}
        <motion.div
          className="mt-10 flex flex-wrap justify-center gap-6"
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.45, delay: 0.44 }}
        >
          {STATS.map((s) => {
            const Icon = s.icon;
            return (
              <div
                key={s.l}
                className="flex items-center gap-2.5 px-4 py-2.5 rounded-2xl"
                style={{
                  background: "rgba(255,255,255,0.85)",
                  border: "1px solid rgba(30,60,120,0.09)",
                  backdropFilter: "blur(8px)",
                  boxShadow: "0 2px 12px -4px rgba(10,20,60,0.08)",
                }}
              >
                <span
                  className="size-7 rounded-xl flex items-center justify-center"
                  style={{ background: "#f5f0ff", color: "#7B4FB0" }}
                >
                  <Icon className="size-3.5" />
                </span>
                <div className="text-right">
                  <div className="font-black text-sm" style={{ color: "#0a0f1e", letterSpacing: "-0.02em" }}>{s.v}</div>
                  <div className="text-xs font-medium" style={{ color: "#8496b5" }}>{s.l}</div>
                </div>
              </div>
            );
          })}
        </motion.div>

        {/* ─── معاينة الواجهة التفاعلية ─── */}
        <motion.div
          id="demo"
          className="mt-14 w-full max-w-5xl mx-auto"
          style={{
            borderRadius: "1.5rem",
            border: "1px solid rgba(30,60,120,0.1)",
            background: "rgba(255,255,255,0.9)",
            padding: "0.75rem",
            boxShadow: "0 4px 6px -1px rgba(10,20,60,0.04), 0 24px 56px -16px rgba(10,20,60,0.12)",
            backdropFilter: "blur(16px)",
          }}
          initial={{ opacity: 0, y: 32, scale: 0.98 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          transition={{ duration: 0.65, delay: 0.5, ease: [0.22, 1, 0.36, 1] }}
        >
          {/* شريط التحكم */}
          <div
            className="flex flex-wrap items-center justify-between gap-3 px-4 pb-3 pt-2"
            style={{ borderBottom: "1px solid rgba(30,60,120,0.07)" }}
          >
            <div className="flex items-center gap-1.5">
              <span className="size-3 rounded-full bg-rose-400/80" />
              <span className="size-3 rounded-full bg-amber-400/80" />
              <span className="size-3 rounded-full bg-emerald-400/80" />
              <span
                className="mr-3 text-xs font-mono font-bold"
                style={{ color: "#8496b5" }}
              >
                yourname.platform.edu
              </span>
            </div>

            <div
              className="flex items-center gap-1 rounded-xl p-1 text-xs font-bold"
              style={{ background: "rgba(30,60,120,0.06)" }}
            >
              {(["teacher", "student", "player"] as const).map((tab) => (
                <button
                  key={tab}
                  type="button"
                  onClick={() => setActiveTab(tab)}
                  className="rounded-lg px-3 py-1.5 transition-all"
                  style={
                    activeTab === tab
                      ? {
                          background: "#fff",
                          color: "#7B4FB0",
                          boxShadow: "0 1px 4px rgba(10,20,60,0.08)",
                        }
                      : { color: "#526080" }
                  }
                >
                  {tab === "teacher" ? "لوحة المعلم" : tab === "student" ? "بوابة الطالب" : "مشغل الفيديو المحمي"}
                </button>
              ))}
            </div>
          </div>

          {/* محتوى الشاشة التجريبية */}
          <div
            className="overflow-hidden rounded-2xl p-6 text-right"
            style={{ background: "linear-gradient(160deg, #f8faff 0%, #ffffff 100%)" }}
          >
            <AnimatePresence mode="wait">
              {activeTab === "teacher" && (
                <motion.div
                  key="teacher"
                  initial={{ opacity: 0, x: 12 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -12 }}
                  transition={{ duration: 0.28, ease: [0.22, 1, 0.36, 1] }}
                  className="space-y-4"
                >
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                    {[
                      { l: "إجمالي الطلاب", v: "١٬٤٨٢", s: "+١٤٪ هذا الشهر", sc: "#059669", bg: "#f0fdf4" },
                      { l: "المبيعات الإجمالية", v: "٨٤٬٥٠٠ ج.م", s: "تسليم فوري ومباشر", sc: "#059669", bg: "#f0fdf4" },
                      { l: "الدروس المكتملة", v: "٩٦.٤٪", s: "تفاعل قياسي", sc: "#5B3A8C", bg: "#f3eeff" },
                      { l: "حماية الأجهزة", v: "١٠٠٪", s: "لا تسريب أو مشاركة", sc: "#526080", bg: "#f8faff" },
                    ].map((item, i) => (
                      <div
                        key={i}
                        className="rounded-2xl p-4"
                        style={{
                          background: "#fff",
                          border: "1px solid rgba(30,60,120,0.07)",
                          boxShadow: "0 2px 8px -4px rgba(10,20,60,0.06)",
                        }}
                      >
                        <span className="text-xs font-bold" style={{ color: "#8496b5" }}>{item.l}</span>
                        <p className="mt-1 text-xl font-black" style={{ color: "#0a0f1e", letterSpacing: "-0.03em" }}>{item.v}</p>
                        <span className="mt-1 inline-flex items-center text-[11px] font-bold" style={{ color: item.sc }}>{item.s}</span>
                      </div>
                    ))}
                  </div>

                  <div
                    className="rounded-2xl p-4 flex flex-col sm:flex-row items-center justify-between gap-4"
                    style={{
                      background: "#fff",
                      border: "1px solid rgba(30,60,120,0.07)",
                      boxShadow: "0 2px 8px -4px rgba(10,20,60,0.06)",
                    }}
                  >
                    <div className="flex items-center gap-4">
                      <div
                        className="size-12 rounded-2xl flex items-center justify-center font-bold text-lg"
                        style={{ background: "#f5f0ff", color: "#7B4FB0" }}
                      >
                        📚
                      </div>
                      <div>
                        <h4 className="font-bold text-sm" style={{ color: "#0a0f1e" }}>مراجعة ليلة الامتحان — الصف الثالث الثانوي</h4>
                        <p className="text-xs mt-0.5" style={{ color: "#8496b5" }}>٣ فصول · ١٢ فيديو مسجل · ٤ اختبارات تدريبية</p>
                      </div>
                    </div>
                    <span
                      className="px-3 py-1 rounded-full text-xs font-bold border"
                      style={{ background: "#f0fdf4", color: "#059669", borderColor: "rgba(5,150,105,0.2)" }}
                    >
                      نشط ومنشور للطلاب
                    </span>
                  </div>
                </motion.div>
              )}

              {activeTab === "student" && (
                <motion.div
                  key="student"
                  initial={{ opacity: 0, x: 12 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -12 }}
                  transition={{ duration: 0.28, ease: [0.22, 1, 0.36, 1] }}
                  className="space-y-4"
                >
                  <div
                    className="rounded-2xl p-6 text-white"
                    style={{
                      background: "linear-gradient(135deg, #2D1B69, #7B4FB0, #5B3A8C)",
                      boxShadow: "0 12px 40px -12px rgba(123,79,176,0.4)",
                    }}
                  >
                    <span className="text-xs font-semibold" style={{ color: "#D4C4E8" }}>مرحباً بك يا بطل ✨</span>
                    <h3 className="text-lg font-bold mt-1">تابع دروسك واستعد للاختبار القادم</h3>
                    <div className="mt-4 flex flex-wrap gap-3 text-xs">
                      <span
                        className="px-3 py-1 rounded-full font-semibold"
                        style={{ background: "rgba(255,255,255,0.12)", backdropFilter: "blur(4px)" }}
                      >
                        الفرع: النحو والبلاغة
                      </span>
                      <span
                        className="px-3 py-1 rounded-full font-semibold"
                        style={{ background: "rgba(255,255,255,0.12)", backdropFilter: "blur(4px)" }}
                      >
                        الواجب القادم: الأحد ٨ مساءً
                      </span>
                    </div>
                  </div>
                </motion.div>
              )}

              {activeTab === "player" && (
                <motion.div
                  key="player"
                  initial={{ opacity: 0, x: 12 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -12 }}
                  transition={{ duration: 0.28, ease: [0.22, 1, 0.36, 1] }}
                  className="space-y-3"
                >
                  <div
                    className="relative aspect-video w-full rounded-2xl flex flex-col items-center justify-center text-white overflow-hidden"
                    style={{
                      background: "linear-gradient(135deg, #0a0f1e, #1a2240)",
                      boxShadow: "inset 0 0 60px rgba(0,0,0,0.4)",
                    }}
                  >
                    <div
                      className="absolute top-3 right-3 rounded-lg px-3 py-1 text-[11px] font-mono"
                      style={{ background: "rgba(0,0,0,0.5)", color: "#fbbf24", backdropFilter: "blur(8px)" }}
                    >
                      WATERMARK: 010****XXXX (اسم الطالب)
                    </div>
                    <div
                      className="size-16 rounded-full flex items-center justify-center shadow-lg cursor-pointer transition hover:scale-105"
                      style={{
                        background: "linear-gradient(135deg, #7B4FB0, #5B3A8C)",
                        boxShadow: "0 8px 32px rgba(123,79,176,0.5)",
                      }}
                    >
                      <Play className="size-7 fill-white ml-0.5" />
                    </div>
                    <p className="mt-4 font-bold text-sm" style={{ color: "#D4C4E8" }}>مشغل محمي ضد برامج تصوير الشاشة والتحميل الخارجي</p>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </motion.div>
      </section>

      {/* ════════════════ الخطوات ════════════════ */}
      <section id="how" className="mkt-steps">
        <div className="col-span-full text-center mb-6">
          <FadeIn>
            <span
              className="text-xs font-bold uppercase tracking-widest px-3.5 py-1.5 rounded-full border"
              style={{ color: "#7B4FB0", background: "#f5f0ff", borderColor: "rgba(123,79,176,0.2)" }}
            >
              خطوات بسيطة وسريعة
            </span>
            <h2 className="mkt-h2 mt-3">كيف تبدأ تدريسك في ٤ خطوات؟</h2>
          </FadeIn>
        </div>

        {STEPS.map((s, i) => {
          const Icon = s.icon;
          return (
            <FadeIn key={s.n} delay={i * 0.07}>
              <div className="mkt-step group h-full">
                <div className="flex items-center justify-between mb-3">
                  <span
                    className="mkt-step-n font-mono"
                    style={{ color: s.color, background: s.bg, borderColor: `${s.color}22` }}
                  >
                    {s.n}
                  </span>
                  <span
                    className="size-10 rounded-xl flex items-center justify-center transition-all duration-300 group-hover:scale-110"
                    style={{
                      background: s.bg,
                      color: s.color,
                      border: `1px solid ${s.color}22`,
                    }}
                  >
                    <Icon className="size-4.5" />
                  </span>
                </div>
                <b className="mkt-step-t">{s.t}</b>
                <span className="mkt-step-d">{s.d}</span>
              </div>
            </FadeIn>
          );
        })}
      </section>

      {/* ════════════════ المميزات ════════════════ */}
      <section id="features" className="mkt-features">
        <FadeIn>
          <div className="text-center mb-10">
            <span
              className="text-xs font-bold uppercase tracking-widest px-3.5 py-1.5 rounded-full border"
              style={{ color: "#d97706", background: "#fffbeb", borderColor: "rgba(217,119,6,0.25)" }}
            >
              كل ما تحتاجه للنجاح
            </span>
            <h2 className="mkt-h2 mt-3">أدوات متطورة مصممة خصيصاً للمدرسين</h2>
            <p className="text-sm max-w-xl mx-auto mt-3 leading-relaxed" style={{ color: "#526080" }}>
              تم بناء المنصة على تجربة آلاف الطلاب والمعلمين في مصر والشرق الأوسط لتوفر لك أعلى نسب التزام وأسهل إدارة لمحتواك.
            </p>
          </div>
        </FadeIn>

        <div className="mkt-grid">
          {FEATURES.map((f, i) => {
            const Icon = f.icon;
            return (
              <FadeIn key={f.t} delay={i * 0.06}>
                <div className="mkt-feat group h-full relative overflow-hidden">
                  {/* خط جانبي ملوّن */}
                  <div
                    className="absolute inset-inline-end-0 top-6 bottom-6 w-0.5 rounded-full opacity-0 group-hover:opacity-100 transition-opacity duration-300"
                    style={{ background: f.accent }}
                  />
                  <div className="flex items-center justify-between mb-4">
                    <span
                      className="size-12 rounded-2xl flex items-center justify-center transition-all duration-300 group-hover:scale-110"
                      style={{
                        background: `${f.accent}14`,
                        color: f.accent,
                        border: `1px solid ${f.accent}22`,
                        boxShadow: `0 4px 12px -4px ${f.accent}25`,
                      }}
                    >
                      <Icon className="size-5" />
                    </span>
                    <span
                      className="text-[11px] font-bold px-2.5 py-1 rounded-full border"
                      style={{
                        color: f.accent,
                        background: `${f.accent}10`,
                        borderColor: `${f.accent}22`,
                      }}
                    >
                      {f.tag}
                    </span>
                  </div>
                  <b className="mkt-feat-t block">{f.t}</b>
                  <p className="mkt-feat-d">{f.d}</p>
                </div>
              </FadeIn>
            );
          })}
        </div>
      </section>

      {/* ════════════════ الأسعار ════════════════ */}
      <section id="plans" className="mkt-plans">
        <FadeIn>
          <div className="text-center mb-2">
            <span
              className="text-xs font-bold uppercase tracking-widest px-3.5 py-1.5 rounded-full border"
              style={{ color: "#7B4FB0", background: "#f5f0ff", borderColor: "rgba(123,79,176,0.2)" }}
            >
              استثمار واضح بلا مفاجآت
            </span>
            <h2 className="mkt-h2 mt-3">خطط مرنة تنمو مع تزايد طلابك</h2>
            <p className="text-sm max-w-lg mx-auto mt-3 leading-relaxed" style={{ color: "#526080" }}>
              اختر الخطة المناسبة لك ويمكنك الترقية أو التبديل في أي وقت حسب احتياجاتك.
            </p>
          </div>
        </FadeIn>

        <div className="mkt-plan-grid">
          {plans.map((p, i) => {
            const price = planPrice({ price: p.priceEGP, discount: p.discount });
            const isHot = Boolean(p.highlight);

            return (
              <FadeIn key={p.id} delay={i * 0.07}>
                <div className={`mkt-plan h-full ${isHot ? "is-hot" : ""}`}>
                  {p.badge && (
                    <span className="mkt-plan-badge">
                      <Sparkles className="size-3" /> {p.badge}
                    </span>
                  )}

                  <div className="flex items-center justify-between mt-1">
                    <b className="mkt-plan-name">{p.name}</b>
                    {isHot && (
                      <span
                        className="size-8 rounded-full flex items-center justify-center"
                        style={{ background: "#f5f0ff", color: "#7B4FB0" }}
                      >
                        <Award className="size-4" />
                      </span>
                    )}
                  </div>

                  {p.desc && <span className="mkt-plan-desc">{p.desc}</span>}

                  <div className="mkt-plan-price">
                    <span className="mkt-plan-num">
                      {price.price.toLocaleString("ar-EG")}
                    </span>
                    <span className="mkt-plan-cur">
                      ج.م / {p.interval === "month" ? "شهر" : p.interval === "quarter" ? "٣ أشهر" : "سنة"}
                    </span>
                  </div>

                  <ul className="my-4 space-y-2.5 text-xs font-medium" style={{ color: "#526080" }}>
                    {[
                      p.limits?.maxStudents ? `حتى ${p.limits.maxStudents} طالب` : "عدد طلاب غير محدود",
                      p.limits?.customDomain ? "دومين خاص مخصص" : "دومين فرعي سريع مجاني",
                      "حماية متقدمة وعلامة مائية",
                      "دعم فني سريع طوال الأسبوع",
                    ].map((feat, fi) => (
                      <li key={fi} className="flex items-center gap-2">
                        <Check className="size-3.5 shrink-0" style={{ color: isHot ? "#7B4FB0" : "#059669" }} />
                        <span>{feat}</span>
                      </li>
                    ))}
                  </ul>

                  <Link
                    href="/start"
                    className={`mkt-plan-cta ${isHot ? "is-hot" : ""}`}
                  >
                    اختر {p.name} <ArrowLeft className="size-3.5" />
                  </Link>
                </div>
              </FadeIn>
            );
          })}
        </div>
      </section>

      {/* ════════════════ الأسئلة الشائعة ════════════════ */}
      <section id="faq" className="max-w-3xl mx-auto px-5 mt-24">
        <FadeIn>
          <div className="text-center mb-10">
            <span
              className="text-xs font-bold uppercase tracking-widest px-3.5 py-1.5 rounded-full border"
              style={{ color: "#526080", background: "#f8faff", borderColor: "rgba(30,60,120,0.1)" }}
            >
              إجابات واضحة
            </span>
            <h2 className="mkt-h2 mt-3">الأسئلة الأكثر شيوعاً</h2>
          </div>
        </FadeIn>

        <div className="space-y-2.5">
          {FAQS.map((faq, idx) => {
            const isOpen = openFaq === idx;
            return (
              <FadeIn key={idx} delay={idx * 0.04}>
                <div
                  className="overflow-hidden rounded-2xl transition-all"
                  style={{
                    border: isOpen
                      ? "1.5px solid rgba(123,79,176,0.2)"
                      : "1px solid rgba(30,60,120,0.09)",
                    background: isOpen
                      ? "linear-gradient(135deg, #f8fbff, #ffffff)"
                      : "#ffffff",
                    boxShadow: isOpen
                      ? "0 8px 24px -8px rgba(123,79,176,0.1)"
                      : "0 2px 8px -4px rgba(10,20,60,0.04)",
                  }}
                >
                  <button
                    type="button"
                    onClick={() => setOpenFaq(isOpen ? null : idx)}
                    className="w-full p-4 text-right flex items-center justify-between gap-4 font-bold text-sm sm:text-base"
                    style={{ color: isOpen ? "#7B4FB0" : "#0a0f1e" }}
                  >
                    <span>{faq.q}</span>
                    <ChevronDown
                      className="size-4 shrink-0 transition-transform duration-250"
                      style={{
                        transform: isOpen ? "rotate(180deg)" : "rotate(0deg)",
                        color: isOpen ? "#7B4FB0" : "#8496b5",
                      }}
                    />
                  </button>
                  <AnimatePresence initial={false}>
                    {isOpen && (
                      <motion.div
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: "auto", opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        transition={{ duration: 0.28, ease: [0.22, 1, 0.36, 1] }}
                      >
                        <div
                          className="px-4 pb-4 pt-1 text-xs sm:text-sm leading-relaxed"
                          style={{
                            color: "#526080",
                            borderTop: "1px solid rgba(123,79,176,0.08)",
                          }}
                        >
                          {faq.a}
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              </FadeIn>
            );
          })}
        </div>
      </section>

      {/* ════════════════ الدعوة الختامية ════════════════ */}
      <section className="mkt-final">
        <FadeIn>
          <div
            className="rounded-3xl p-8 sm:p-14 text-center text-white overflow-hidden relative"
            style={{
              background: "linear-gradient(135deg, #1A0F3C 0%, #4A2D7A 35%, #7B4FB0 65%, #5B3A8C 100%)",
              boxShadow: "0 32px 80px -24px rgba(123,79,176,0.45)",
            }}
          >
            {/* هالات ضوء */}
            <div
              className="pointer-events-none absolute -top-16 -right-16 size-72 rounded-full opacity-30"
              style={{ background: "radial-gradient(circle, rgba(255,255,255,0.25), transparent)" }}
            />
            <div
              className="pointer-events-none absolute -bottom-16 -left-16 size-72 rounded-full opacity-25"
              style={{ background: "radial-gradient(circle, rgba(251,191,36,0.4), transparent)" }}
            />

            <span
              className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold mb-5"
              style={{ background: "rgba(255,255,255,0.12)", color: "#fbbf24", border: "1px solid rgba(255,255,255,0.15)" }}
            >
              <Sparkles className="size-3.5" /> ابدأ اليوم
            </span>

            <h2 className="mkt-final-h">
              جاهز لتصبح صاحب أكاديمية تعليمية متكاملة؟
            </h2>
            <p
              className="text-sm sm:text-base max-w-xl mx-auto mb-10 leading-relaxed"
              style={{ color: "rgba(191,219,254,0.9)" }}
            >
              انضم الآن لمئات المعلمين الذين نقلوا تدريسهم إلى مستوى احترافي غير مسبوق وضاعفوا أعداد طلابهم.
            </p>
            <Link
              href="/start"
              className="mkt-primary mkt-primary-lg inline-flex items-center gap-2 font-bold"
              style={{ background: "#fff", color: "#1a3ebf" }}
            >
              أنشئ منصّتك الآن <ArrowLeft className="size-4" />
            </Link>
          </div>
        </FadeIn>
      </section>

      {/* ════════════════ الفوتر ════════════════ */}
      <footer className="mkt-foot">
        <div className="flex flex-col sm:flex-row items-center justify-between w-full max-w-5xl px-4 py-4 gap-4">
          <div className="flex items-center gap-2">
            <span
              className="size-7 rounded-lg flex items-center justify-center text-xs font-bold text-white"
              style={{ background: "linear-gradient(135deg, #7B4FB0, #5B3A8C)" }}
            >
              {brand.slice(0, 1) || "S"}
            </span>
            <span className="font-bold" style={{ color: "#0a0f1e" }}>{brand}</span>
            <span className="text-xs" style={{ color: "#8496b5" }}>· منصّة إنشاء الأكاديميات التعليمية</span>
          </div>

          <div className="flex items-center gap-6 text-xs font-medium" style={{ color: "#526080" }}>
            <a href="#plans"    className="transition hover:text-[#7B4FB0]">الأسعار</a>
            <a href="#features" className="transition hover:text-[#7B4FB0]">المميزات</a>
            <Link href="/login" className="transition hover:text-[#7B4FB0]">دخول لوحة التحكم</Link>
            <Link href="/start" className="font-bold hover:opacity-80 transition" style={{ color: "#7B4FB0" }}>إنشاء منصة</Link>
          </div>
        </div>

        <div
          className="text-[11px] mt-2 pt-3 w-full text-center"
          style={{
            borderTop: "1px solid rgba(30,60,120,0.07)",
            color: "#8496b5",
          }}
        >
          جميع الحقوق محفوظة © {new Date().getFullYear()} {brand}. تم التصميم بأعلى معايير الجودة والأمان.
        </div>
      </footer>
    </div>
  );
}
