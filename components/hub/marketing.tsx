"use client";

import { useState } from "react";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";
import type { SaasPlan } from "@/lib/hub/types";
import { planPrice } from "@/lib/plans";
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
} from "lucide-react";

/**
 * صفحةُ الموقع الأمّ — «أنشئ منصّتك التعليمية».
 * واجهة عصرية فائقة الاحترافية (World-class EdTech SaaS)
 */

const STEPS = [
  {
    n: "01",
    t: "سجّل حسابك في ثوانٍ",
    d: "تسجيل فوري عبر جوجل أو البريد الإلكتروني بدون أي تعقيد أو بطاقة بنكية.",
    icon: Zap,
  },
  {
    n: "02",
    t: "اختر خطّتك المناسبة",
    d: "ابدأ بتجربة مجانية فورية مع وصول كامل لكافة الأدوات ومميزات التدريس.",
    icon: Sparkles,
  },
  {
    n: "03",
    t: "خصّص هويتك وشعارك",
    d: "أدخل اسمك، ألوانك الخاصة، وشعارك من بين تصاميم عصرية جاهزة.",
    icon: Layers,
  },
  {
    n: "04",
    t: "أطلق منصتك واستقبل طلابك",
    d: "رابط مخصص لطلابك ولوحة تحكم متكاملة لإدارة الكورسات، الدفع، والاختبارات.",
    icon: Globe,
  },
];

const FEATURES = [
  {
    icon: Video,
    tag: "شروحات وفيديو",
    t: "بث ودروس فائقة السرعة",
    d: "مشغل فيديو مخصص وسريع بدون إعلانات مع دعم البث المباشر المباشر والواجبات المرتبطة بكل درس.",
  },
  {
    icon: Lock,
    tag: "أمان متقدم",
    t: "حماية المحتوى والعلامة المائية",
    d: "تقييد الحساب بجهاز واحد، علامة مائية ديناميكية برقم وهاتف الطالب، وحظر برامج تسجيل الشاشة.",
  },
  {
    icon: CreditCard,
    tag: "أموالك ومبيعاتك",
    t: "بوابات دفع محلية وأكواد",
    d: "استلم أموالك عبر فودافون كاش، إنستاباي، والفيزا مع نظام أكواد شحن فورية واشتراكات تلقائية.",
  },
  {
    icon: Globe,
    tag: "علامتك التجارية",
    t: "دومين وهوية خاصة بك",
    d: "اربط منصتك بنطاقك المخصص (.com أو .net) لتظهر كأكاديمية مستقلة تماماً باسمك وشعارك.",
  },
  {
    icon: Smartphone,
    tag: "تجربة الطلاب",
    t: "تطبيق PWA لجميع الأجهزة",
    d: "منصتك تعمل كتطبيق هاتف خفيف وسريع على أجهزة أندرويد وآيفون والكمبيوتر بدون تحميل من المتجر.",
  },
  {
    icon: BarChart3,
    tag: "ذكاء الإدارة",
    t: "لوحة تحكم وتقارير دقيقة",
    d: "تقارير شاملة عن درجات الطلاب، نسب المشاهدة، الإيرادات اليومية، ومتابعة الحضور والغياب.",
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
    q: "ماذا يحدث بعد انتهاء الفترة التجريبية المجانية؟",
    a: "تبقى جميع دروسك وبيانات طلابك محفوظة بالكامل كما هي. يمكنك الترقية إلى أي خطة مدفوعة تناسب عدد طلابك وميزانيتك للاستمرار دون انقطاع.",
  },
];

export function Marketing({ plans, brand }: { plans: SaasPlan[]; brand: string }) {
  const [activeTab, setActiveTab] = useState<"teacher" | "student" | "player">("teacher");
  const [openFaq, setOpenFaq] = useState<number | null>(0);

  return (
    <div className="mkt font-sans selection:bg-indigo-500/20 selection:text-indigo-900">
      {/* ---------------- شريط علويّ زجاجي عائم ---------------- */}
      <header className="mkt-bar">
        <div className="flex items-center gap-3">
          <span className="mkt-logo text-xl tracking-tight text-slate-900 flex items-center gap-2">
            <span className="size-8 rounded-xl bg-gradient-to-br from-blue-700 to-indigo-800 text-white flex items-center justify-center font-bold text-sm shadow-md shadow-blue-900/20">
              {brand.slice(0, 1) || "م"}
            </span>
            {brand}
          </span>
          <span className="hidden sm:inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-bold bg-blue-50 text-blue-700 border border-blue-200/60">
            <Sparkles className="size-3" /> الجيل الثاني
          </span>
        </div>

        <nav className="mkt-bar-nav">
          <a href="#how" className="hidden sm:block font-semibold text-slate-600 transition hover:text-blue-700">كيف يعمل؟</a>
          <a href="#features" className="hidden sm:block font-semibold text-slate-600 transition hover:text-blue-700">المميزات</a>
          <a href="#plans" className="font-semibold text-slate-600 transition hover:text-blue-700">الأسعار</a>
          <a href="#faq" className="hidden md:block font-semibold text-slate-600 transition hover:text-blue-700">الأسئلة</a>
          <Link href="/start" className="mkt-bar-cta inline-flex items-center gap-1.5 shadow-md shadow-blue-700/25">
            ابدأ الآن مجاناً <ArrowLeft className="size-3.5" />
          </Link>
        </nav>
      </header>

      {/* ---------------- قسم الهيرو الرئيسي ---------------- */}
      <section className="mkt-hero relative overflow-hidden">
        {/* هالات ضوئية ناعمة في الخلفية */}
        <div className="pointer-events-none absolute -top-24 left-1/2 -z-10 h-96 w-[42rem] -translate-x-1/2 rounded-full bg-gradient-to-br from-blue-400/20 via-indigo-400/15 to-amber-300/15 blur-3xl" />

        <div className="mkt-eyebrow inline-flex items-center gap-2">
          <span className="flex size-2 rounded-full bg-amber-500 animate-pulse" />
          <span>المنصة السحابية الأولى لإطلاق أكاديميتك التعليمية أونلاين</span>
        </div>

        <h1 className="mkt-title mt-4 text-slate-950 font-black tracking-tight [text-wrap:balance]">
          أنشئ منصّتك التعليمية المتكاملة
          <br />
          <span className="mkt-title-em">باسمك وهويّتك الكاملة</span>
        </h1>

        <p className="mkt-sub text-slate-600 font-medium">
          كل ما تحتاجه كمعلم ومحاضر للتدريس أونلاين باحترافية: كورسات، دروس فيديو محمية، اختبارات تلقائية، بث مباشر، وبوابات دفع — على منصة مستقلة برابطك الخاص وبدون كتابة سطر كود واحد.
        </p>

        <div className="mkt-hero-cta">
          <Link href="/start" className="mkt-primary mkt-primary-lg inline-flex items-center gap-2 font-bold shadow-xl shadow-blue-700/25">
            أنشئ منصّتك مجاناً الآن <ArrowLeft className="size-4" />
          </Link>
          <a href="#demo" className="mkt-ghost inline-flex items-center gap-2">
            <Play className="size-4 text-blue-700 fill-blue-700/20" /> استكشف المنصة
          </a>
        </div>

        <p className="mkt-note flex items-center justify-center gap-2 text-xs font-semibold text-slate-500">
          <CheckCircle2 className="size-3.5 text-emerald-600" /> تجربة مجانية كاملة 14 يوماً
          <span className="text-slate-300">•</span>
          <CheckCircle2 className="size-3.5 text-emerald-600" /> إطلاق فوري في دقيقة
          <span className="text-slate-300">•</span>
          <CheckCircle2 className="size-3.5 text-emerald-600" /> بدون بطاقة ائتمانية
        </p>

        {/* ---------------- معاينة الواجهة التفاعلية (Interactive Showcase) ---------------- */}
        <div id="demo" className="mt-14 w-full max-w-5xl mx-auto rounded-3xl border border-slate-200/80 bg-white/80 p-3 shadow-2xl shadow-blue-900/10 backdrop-blur-xl">
          {/* شريط التحكم بالمعاينة */}
          <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-100 px-4 pb-3 pt-2">
            <div className="flex items-center gap-1.5">
              <span className="size-3 rounded-full bg-rose-400/80" />
              <span className="size-3 rounded-full bg-amber-400/80" />
              <span className="size-3 rounded-full bg-emerald-400/80" />
              <span className="mr-3 text-xs font-mono font-bold text-slate-400">yourname.platform.edu</span>
            </div>

            <div className="flex items-center gap-1 rounded-xl bg-slate-100/80 p-1 text-xs font-bold">
              <button
                type="button"
                onClick={() => setActiveTab("teacher")}
                className={`rounded-lg px-3 py-1.5 transition ${activeTab === "teacher" ? "bg-white text-blue-700 shadow-sm" : "text-slate-600 hover:text-slate-900"}`}
              >
                لوحة المعلم
              </button>
              <button
                type="button"
                onClick={() => setActiveTab("student")}
                className={`rounded-lg px-3 py-1.5 transition ${activeTab === "student" ? "bg-white text-blue-700 shadow-sm" : "text-slate-600 hover:text-slate-900"}`}
              >
                بوابة الطالب
              </button>
              <button
                type="button"
                onClick={() => setActiveTab("player")}
                className={`rounded-lg px-3 py-1.5 transition ${activeTab === "player" ? "bg-white text-blue-700 shadow-sm" : "text-slate-600 hover:text-slate-900"}`}
              >
                مشغل الفيديو المحمي
              </button>
            </div>
          </div>

          {/* محتوى الشاشة التجريبية */}
          <div className="overflow-hidden rounded-2xl bg-gradient-to-b from-slate-50/50 to-white p-6 text-right">
            {activeTab === "teacher" && (
              <div className="space-y-5">
                <div className="grid grid-cols-1 sm:grid-cols-4 gap-3">
                  <div className="rounded-2xl border border-slate-100 bg-white p-4 shadow-sm">
                    <span className="text-xs font-bold text-slate-400">إجمالي الطلاب</span>
                    <p className="mt-1 text-2xl font-black text-slate-900">١,٤٨٢</p>
                    <span className="mt-1 inline-flex items-center text-[11px] font-bold text-emerald-600">+١٤٪ هذا الشهر</span>
                  </div>
                  <div className="rounded-2xl border border-slate-100 bg-white p-4 shadow-sm">
                    <span className="text-xs font-bold text-slate-400">المبيعات الإجمالية</span>
                    <p className="mt-1 text-2xl font-black text-blue-700">٨٤,٥٠٠ <span className="text-xs">ج.م</span></p>
                    <span className="mt-1 inline-flex items-center text-[11px] font-bold text-emerald-600">تسليم فوري ومباشر</span>
                  </div>
                  <div className="rounded-2xl border border-slate-100 bg-white p-4 shadow-sm">
                    <span className="text-xs font-bold text-slate-400">الدروس المكتملة</span>
                    <p className="mt-1 text-2xl font-black text-slate-900">٩٦.٤٪</p>
                    <span className="mt-1 inline-flex items-center text-[11px] font-bold text-indigo-600">تفاعل قياسي</span>
                  </div>
                  <div className="rounded-2xl border border-slate-100 bg-white p-4 shadow-sm">
                    <span className="text-xs font-bold text-slate-400">حماية الأجهزة النشطة</span>
                    <p className="mt-1 text-2xl font-black text-emerald-600">١٠٠٪</p>
                    <span className="mt-1 inline-flex items-center text-[11px] font-bold text-slate-500">لا تسريب أو مشاركة</span>
                  </div>
                </div>

                <div className="rounded-2xl border border-slate-100 bg-white p-5 shadow-sm flex flex-col sm:flex-row items-center justify-between gap-4">
                  <div className="flex items-center gap-4">
                    <div className="size-12 rounded-2xl bg-blue-100 text-blue-700 flex items-center justify-center font-bold text-lg">
                      📚
                    </div>
                    <div>
                      <h4 className="font-bold text-slate-900 text-base">مراجعة ليلة الامتحان — الصف الثالث الثانوي</h4>
                      <p className="text-xs text-slate-500 mt-0.5">٣ فصول · ١٢ فيديو مسجل · ٤ اختبارات تدريبية</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="px-3 py-1 rounded-full text-xs font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
                      نشط ومنشور للطلاب
                    </span>
                  </div>
                </div>
              </div>
            )}

            {activeTab === "student" && (
              <div className="space-y-4">
                <div className="rounded-2xl bg-gradient-to-r from-blue-900 via-indigo-900 to-slate-900 text-white p-6 shadow-md">
                  <span className="text-xs font-semibold text-blue-200">مرحباً بك يا بطل ✨</span>
                  <h3 className="text-xl font-bold mt-1">تابع دروسك واستعد للاختبار القادم</h3>
                  <div className="mt-4 flex flex-wrap gap-4 text-xs">
                    <span className="bg-white/10 px-3 py-1 rounded-full">الفرع: النحو والبلاغة</span>
                    <span className="bg-white/10 px-3 py-1 rounded-full">الواجب القادم: الأحد ٨ مساءً</span>
                  </div>
                </div>
              </div>
            )}

            {activeTab === "player" && (
              <div className="space-y-3">
                <div className="relative aspect-video w-full rounded-2xl bg-slate-950 flex flex-col items-center justify-center text-white overflow-hidden shadow-inner">
                  <div className="absolute top-4 right-4 rounded-lg bg-black/60 px-3 py-1 text-[11px] font-mono text-amber-300 backdrop-blur-md">
                    WATERMARK: 010****3912 (محمد أحمد)
                  </div>
                  <div className="size-16 rounded-full bg-blue-600/90 text-white flex items-center justify-center shadow-lg shadow-blue-500/40 cursor-pointer hover:scale-105 transition">
                    <Play className="size-7 fill-white ml-0.5" />
                  </div>
                  <p className="mt-4 font-bold text-sm text-slate-200">مشغل محمي ضد برامج تصوير الشاشة والتحميل الخارجي</p>
                </div>
              </div>
            )}
          </div>
        </div>
      </section>

      {/* ---------------- الخطوات الأربع ---------------- */}
      <section id="how" className="mkt-steps">
        <div className="col-span-full text-center mb-4">
          <span className="text-xs font-bold uppercase tracking-widest text-blue-700 bg-blue-50 px-3 py-1 rounded-full border border-blue-200/50">
            خطوات بسيطة وسريعة
          </span>
          <h2 className="text-2xl sm:text-3xl font-black text-slate-900 mt-2">كيف تبدأ تدريسك في ٤ خطوات؟</h2>
        </div>

        {STEPS.map((s) => {
          const Icon = s.icon;
          return (
            <div key={s.n} className="mkt-step group relative transition-all duration-300 hover:-translate-y-1.5 hover:shadow-xl hover:shadow-blue-900/5 hover:border-blue-300">
              <div className="flex items-center justify-between mb-2">
                <span className="mkt-step-n font-mono">{s.n}</span>
                <span className="size-9 rounded-xl bg-blue-50 text-blue-700 flex items-center justify-center transition group-hover:bg-blue-700 group-hover:text-white">
                  <Icon className="size-4" />
                </span>
              </div>
              <b className="mkt-step-t text-slate-900">{s.t}</b>
              <span className="mkt-step-d text-slate-600">{s.d}</span>
            </div>
          );
        })}
      </section>

      {/* ---------------- المزايا بنظام Bento Grid ---------------- */}
      <section id="features" className="mkt-features">
        <div className="text-center mb-8">
          <span className="text-xs font-bold uppercase tracking-widest text-amber-700 bg-amber-50 px-3 py-1 rounded-full border border-amber-200/50">
            كل ما تحتاجه للنجاح
          </span>
          <h2 className="mkt-h2 mt-2 text-slate-950 font-black">أدوات متطورة مصممة خصيصاً للمدرسين</h2>
          <p className="text-slate-500 text-sm max-w-xl mx-auto mt-2">
            تم بناء المنصة على تجربة آلاف الطلاب والمعلمين في مصر والشرق الأوسط لتوفر لك أعلى نسب التزام وأسهل إدارة لمحتواك.
          </p>
        </div>

        <div className="mkt-grid">
          {FEATURES.map((f) => {
            const Icon = f.icon;
            return (
              <div key={f.t} className="mkt-feat group relative overflow-hidden transition-all duration-300 hover:-translate-y-1.5 hover:shadow-xl hover:shadow-blue-900/5 hover:border-blue-300">
                <div className="flex items-center justify-between mb-3">
                  <span className="size-11 rounded-2xl bg-gradient-to-br from-blue-50 to-indigo-50 border border-blue-100 text-blue-700 flex items-center justify-center group-hover:scale-110 transition duration-300">
                    <Icon className="size-5" />
                  </span>
                  <span className="text-[11px] font-bold text-slate-400 bg-slate-50 px-2.5 py-0.5 rounded-full border border-slate-100">
                    {f.tag}
                  </span>
                </div>
                <b className="mkt-feat-t text-slate-900 text-lg block">{f.t}</b>
                <p className="mkt-feat-d text-slate-600 text-sm mt-2 leading-relaxed">{f.d}</p>
              </div>
            );
          })}
        </div>
      </section>

      {/* ---------------- الخطط والأسعار ---------------- */}
      <section id="plans" className="mkt-plans">
        <div className="text-center mb-8">
          <span className="text-xs font-bold uppercase tracking-widest text-blue-700 bg-blue-50 px-3 py-1 rounded-full border border-blue-200/50">
            استثمار واضح بلا مفاجآت
          </span>
          <h2 className="mkt-h2 mt-2 text-slate-950 font-black">خطط مرنة تنمو مع تزايد طلابك</h2>
          <p className="text-slate-500 text-sm max-w-lg mx-auto mt-2">
            ابدأ بتجربة مجانية فورية ويمكنك الترقية أو التبديل في أي وقت حسب احتياجاتك.
          </p>
        </div>

        <div className="mkt-plan-grid">
          {plans.map((p) => {
            const price = planPrice({ price: p.priceEGP, discount: p.discount });
            const isHot = Boolean(p.highlight);

            return (
              <div
                key={p.id}
                className={`mkt-plan transition-all duration-300 hover:shadow-2xl hover:shadow-blue-900/10 ${
                  isHot ? "is-hot ring-2 ring-blue-700" : ""
                }`}
              >
                {p.badge && (
                  <span className="mkt-plan-badge flex items-center gap-1 font-bold shadow-md shadow-amber-500/20">
                    <Sparkles className="size-3" /> {p.badge}
                  </span>
                )}

                <div className="flex items-center justify-between">
                  <b className="mkt-plan-name text-slate-900 text-xl">{p.name}</b>
                  {isHot && (
                    <span className="size-7 rounded-full bg-blue-100 text-blue-700 flex items-center justify-center">
                      <Award className="size-4" />
                    </span>
                  )}
                </div>

                {p.desc && <span className="mkt-plan-desc text-slate-500 text-xs">{p.desc}</span>}

                <div className="mkt-plan-price my-2 border-y border-slate-100 py-3">
                  {p.priceEGP === 0 ? (
                    <span className="mkt-plan-free text-3xl font-black text-blue-700">مجاناً</span>
                  ) : (
                    <div className="flex items-baseline gap-1">
                      <span className="mkt-plan-num text-3xl font-black text-slate-900">
                        {price.price.toLocaleString("ar-EG")}
                      </span>
                      <span className="mkt-plan-cur text-xs font-bold text-slate-500">
                        ج.م / {p.interval === "month" ? "شهر" : p.interval === "quarter" ? "٣ أشهر" : "سنة"}
                      </span>
                    </div>
                  )}
                </div>

                {p.trialDays > 0 && (
                  <span className="mkt-plan-trial inline-flex items-center gap-1 text-xs font-bold text-emerald-700 bg-emerald-50 px-2.5 py-1 rounded-full border border-emerald-200/60 w-fit">
                    <CheckCircle2 className="size-3" /> تجربة {p.trialDays.toLocaleString("ar-EG")} يوماً مجاناً
                  </span>
                )}

                <ul className="my-4 space-y-2 text-xs font-medium text-slate-600">
                  <li className="flex items-center gap-2">
                    <Check className="size-3.5 text-blue-700" />
                    <span>{p.limits?.maxStudents ? `حتى ${p.limits.maxStudents} طالب` : "عدد طلاب غير محدود"}</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <Check className="size-3.5 text-blue-700" />
                    <span>{p.limits?.customDomain ? "دومين خاص مخصص" : "دومين فرعي سريع مجاني"}</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <Check className="size-3.5 text-blue-700" />
                    <span>حماية متقدمة وعلامة مائية</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <Check className="size-3.5 text-blue-700" />
                    <span>دعم فني سريع طوال الأسبوع</span>
                  </li>
                </ul>

                <Link
                  href="/start"
                  className={`mkt-plan-cta mt-auto font-bold inline-flex items-center justify-center gap-1.5 shadow-sm ${
                    isHot ? "is-hot shadow-md shadow-blue-700/25" : ""
                  }`}
                >
                  اختر {p.name} <ArrowLeft className="size-3.5" />
                </Link>
              </div>
            );
          })}
        </div>
      </section>

      {/* ---------------- الأسئلة الشائعة ---------------- */}
      <section id="faq" className="max-w-3xl mx-auto px-4 mt-20">
        <div className="text-center mb-8">
          <span className="text-xs font-bold uppercase tracking-widest text-slate-500 bg-slate-100 px-3 py-1 rounded-full">
            إجابات واضحة
          </span>
          <h2 className="text-2xl sm:text-3xl font-black text-slate-900 mt-2">الأسئلة الأكثر شيوعاً</h2>
        </div>

        <div className="space-y-3">
          {FAQS.map((faq, idx) => {
            const isOpen = openFaq === idx;
            return (
              <div
                key={idx}
                className="overflow-hidden rounded-2xl border border-slate-200/80 bg-white transition hover:border-slate-300"
              >
                <button
                  type="button"
                  onClick={() => setOpenFaq(isOpen ? null : idx)}
                  className="w-full p-4 text-right flex items-center justify-between gap-4 font-bold text-slate-900 text-sm sm:text-base"
                >
                  <span>{faq.q}</span>
                  <ChevronDown
                    className={`size-4 shrink-0 text-slate-400 transition-transform duration-200 ${
                      isOpen ? "rotate-180 text-blue-700" : ""
                    }`}
                  />
                </button>
                <AnimatePresence initial={false}>
                  {isOpen && (
                    <motion.div
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: "auto", opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      transition={{ duration: 0.25 }}
                    >
                      <div className="px-4 pb-4 pt-1 text-xs sm:text-sm leading-relaxed text-slate-600 border-t border-slate-100">
                        {faq.a}
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            );
          })}
        </div>
      </section>

      {/* ---------------- دعوة ختامية فائقة الجاذبية ---------------- */}
      <section className="mkt-final relative">
        <div className="rounded-3xl bg-gradient-to-br from-blue-900 via-indigo-900 to-slate-950 p-8 sm:p-14 text-center text-white shadow-2xl shadow-blue-900/30 overflow-hidden relative">
          <div className="pointer-events-none absolute -top-12 -right-12 size-60 rounded-full bg-blue-500/20 blur-3xl" />
          <div className="pointer-events-none absolute -bottom-12 -left-12 size-60 rounded-full bg-amber-400/15 blur-3xl" />

          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-white/10 text-amber-300 border border-white/15 mb-4">
            <Sparkles className="size-3.5" /> ابدأ مجاناً اليوم
          </span>
          <h2 className="mkt-final-h text-2xl sm:text-4xl font-black text-white leading-tight">
            جاهز لتصبح صاحب أكاديمية تعليمية متكاملة؟
          </h2>
          <p className="text-blue-200/90 text-sm sm:text-base max-w-xl mx-auto mb-8 leading-relaxed">
            انضم الآن لمئات المعلمين الذين نقلوا تدريسهم إلى مستوى احترافي غير مسبوق وضاعفوا أعداد طلابهم.
          </p>
          <Link
            href="/start"
            className="mkt-primary mkt-primary-lg inline-flex items-center gap-2 font-bold bg-white !text-blue-950 hover:bg-slate-100 shadow-2xl"
          >
            أنشئ منصّتك الآن مجاناً <ArrowLeft className="size-4" />
          </Link>
        </div>
      </section>

      {/* ---------------- الفوتر ---------------- */}
      <footer className="mkt-foot">
        <div className="flex flex-col sm:flex-row items-center justify-between w-full max-w-5xl px-4 py-4 gap-4">
          <div className="flex items-center gap-2">
            <span className="size-6 rounded-lg bg-blue-700 text-white flex items-center justify-center text-xs font-bold">
              {brand.slice(0, 1) || "م"}
            </span>
            <span className="font-bold text-slate-800">{brand}</span>
            <span className="text-xs text-slate-400">· منصّة إنشاء المنصّات التعليمية</span>
          </div>

          <div className="flex items-center gap-6 text-xs text-slate-500 font-medium">
            <a href="#plans" className="hover:text-blue-700 transition">الأسعار</a>
            <a href="#features" className="hover:text-blue-700 transition">المميزات</a>
            <Link href="/login" className="hover:text-blue-700 transition">دخول لوحة التحكم</Link>
            <Link href="/start" className="hover:text-blue-700 transition font-bold text-blue-700">إنشاء منصة</Link>
          </div>
        </div>

        <div className="text-[11px] text-slate-400 mt-2 border-t border-slate-100 pt-3 w-full text-center">
          جميع الحقوق محفوظة © {new Date().getFullYear()} {brand}. تم التصميم بأعلى معايير الجودة والأمان.
        </div>
      </footer>
    </div>
  );
}
