"use client";

import { useState, useRef, useDeferredValue } from "react";
import Link from "next/link";
import Image from "next/image";
import { motion, AnimatePresence, useInView } from "framer-motion";
import type { SaasPlan } from "@/lib/hub/types";
import { planPrice } from "@/lib/business/plans";
import { ArrowLeft, ChevronDown, Check, Video, ShieldCheck, Wallet, Globe2, Smartphone, BarChart3 } from "lucide-react";

const withoutHarakat = (text: string) => text.replace(/[\u0610-\u061A\u064B-\u065F\u0670\u06D6-\u06ED]/g, "");

/* ═══════════════════════════════════════════════════════════════
   SpotLight Studio — صفحة الموقع الأمّ · «الديوان»
   ───────────────────────────────────────────────────────────────
   كانت الصفحةُ بنفسجيّةَ SaaS: حلقاتٌ مداريّةٌ وشبكةُ bento وستّةُ
   ألوانِ تمييز — وهي هيئةٌ تراها في مئةِ موقعٍ غيرِها، ولا تشبه
   المنتَجَ الذي تبيعه في شيء.

   والمنصّاتُ التي تُباع هنا لها لغةٌ بصريّةٌ خاصّة: حبرٌ وذهب،
   وميدالياتٌ مثمّنة، وزخرفةٌ كوفيّةٌ في الزوايا، واسمٌ يُكتب بالرقعة.
   فصارت الصفحةُ تتكلّمها — يرى الزائرُ ما سيشتريه لا إعلاناً عنه.

   ولونُ تمييزٍ **واحد**: الذهب. والألوانُ الستّةُ كانت تُفقد التركيز.
   ═══════════════════════════════════════════════════════════════ */

const STEPS = [
  { t: "سجّل حسابك", d: "بجوجل أو بالبريد — بلا بطاقةٍ بنكيّة." },
  { t: "اختر خطّتك", d: "تُرقّى في أيّ وقتٍ ولا تُفقد بياناتُك." },
  { t: "اكتب هويّتك", d: "اسمُك وألوانُك وشعارُك في شاشةٍ واحدة." },
  { t: "افتح الباب", d: "رابطٌ خاصٌّ ولوحةٌ جاهزةٌ تستقبل طلابك." },
].map((item) => ({ t: withoutHarakat(item.t), d: withoutHarakat(item.d) }));

const FEATURES = [
  { t: "دروسٌ محميّةٌ وبثٌّ مباشر", d: "مشغّلٌ بلا إعلانات، وبثٌّ حيٌّ، وواجبٌ بعد كلّ درس.", tone: "navy", Icon: Video },
  { t: "حمايةُ المحتوى", d: "علامةٌ مائيّةٌ باسم الطالب، وقفلُ الحساب بجهازٍ واحد، وروابطُ بثٍّ مشفّرة.", tone: "blue", Icon: ShieldCheck },
  { t: "بوّاباتُ دفعٍ محليّة", d: "فودافون كاش وإنستاباي والفيزا، وأكوادُ شحنٍ تُفعَّل في ثانية.", tone: "green", Icon: Wallet },
  { t: "نطاقُك واسمُك", d: "اربط نطاقَك المملوكَ لك فتظهر أكاديميّةً مستقلّةً لا صفحةً على موقعِ غيرك.", tone: "cyan", Icon: Globe2 },
  { t: "تطبيقٌ بلا متجر", d: "يُثبَّت على الهاتف كتطبيقٍ خفيفٍ بلا تحميلٍ من متجر.", tone: "orange", Icon: Smartphone },
  { t: "تقاريرُ تُقرأ", d: "درجاتٌ ونسبُ مشاهدةٍ وإيرادٌ وحضور — أرقامٌ تُبنى عليها قرارات.", tone: "blue", Icon: BarChart3 },
].map((item) => ({ ...item, t: withoutHarakat(item.t), d: withoutHarakat(item.d) }));

/** أربعُ هيئاتِ دخولٍ متتابعةٌ — لا تكرارَ الشكل نفسِه على بطاقاتٍ متجاورة. */
const FEATURE_FROM = ["up", "right", "scale", "left"] as const;

const FAQS = [
  { q: "كيف أستلم أموالي من اشتراكات الطلاب؟", a: "تصلك كاملةً ومباشرةً على حسابك البنكي أو محفظتك الإلكترونية (فودافون كاش، إنستاباي، أو بوّابات الدفع) — بلا وسيطٍ ولا تأخير." },
  { q: "كيف تحمي المنصّة فيديوهاتي من التسريب؟", a: "بثلاث طبقات: علامةٌ مائيّةٌ متحرّكةٌ تحمل اسمَ الطالب ورقمه، وقفلُ الحساب بجهازٍ واحد، وتشفيرُ روابط البثّ لمنع التحميل." },
  { q: "هل أحتاج خبرةً برمجيّة؟", a: "لا. تكتب اسمك، وترفع دروسك، وتحدّد أسعارك — من لوحةٍ عربيّةٍ كاملة. ولا سطرَ كودٍ واحد." },
  { q: "هل أربط نطاقاً خاصّاً بي؟", a: "نعم، أيَّ نطاقٍ تملكه. أو تستعمل النطاقَ الفرعيَّ المجّانيَّ الذي يُمنح لك فور التسجيل." },
  { q: "كيف أغيّر خطّتي لاحقاً؟", a: "من لوحة التحكّم في أيّ وقت. ودروسُك وبياناتُ طلابك تبقى كما هي." },
].map((item) => ({ q: withoutHarakat(item.q), a: withoutHarakat(item.a) }));

const TRUST = [
  { v: "+٢٬٤٠٠", l: "معلّمٌ ومحاضر" },
  { v: "+٨٦٬٠٠٠", l: "طالبٌ مسجّل" },
  { v: "٩٨٫٤٪", l: "رضا المستخدمين" },
].map((item) => ({ ...item, l: withoutHarakat(item.l) }));

/* ── لبناتٌ مرسومةٌ بالـSVG — من مفردات المنصّات نفسِها ───────── */

/** ميداليةٌ مثمّنة — حاضنةُ الأرقام والأيقونات في لوحات المنصّات. */
function Seal({ children, size = 56 }: { children: React.ReactNode; size?: number }) {
  return (
    <span className="mkt-seal" style={{ width: size, height: size }}>
      <span className="mkt-seal-in">{children}</span>
    </span>
  );
}

/** فاصلٌ مذهّبٌ بمعيَّنٍ في وسطه — يفصل الأقسامَ بدل تكديس البطاقات. */
function Rule({ className = "" }: { className?: string }) {
  return (
    <svg viewBox="0 0 240 8" preserveAspectRatio="none" className={`mkt-rule ${className}`} fill="none" aria-hidden="true">
      <path d="M0 4h96" stroke="currentColor" strokeWidth="1" opacity="0.3" />
      <path d="M240 4h-96" stroke="currentColor" strokeWidth="1" opacity="0.3" />
      <path d="M120 0 125 4 120 8 115 4Z" fill="currentColor" opacity="0.8" />
      <circle cx="106" cy="4" r="1.2" fill="currentColor" opacity="0.5" />
      <circle cx="134" cy="4" r="1.2" fill="currentColor" opacity="0.5" />
    </svg>
  );
}

/** زخرفةُ زاويةٍ كوفيّة — تُعلّم البطاقاتِ بلا إطارٍ ثقيل. */
function Corner({ className = "" }: { className?: string }) {
  return (
    <svg viewBox="0 0 72 72" className={`mkt-corner ${className}`} fill="none" aria-hidden="true">
      <g stroke="currentColor" strokeWidth="1" opacity="0.45">
        <path d="M0 22h14V8h14" />
        <path d="M0 34h24V0" opacity="0.55" />
        <path d="M0 10h6V4" opacity="0.7" />
      </g>
      <rect x="26" y="10" width="4" height="4" fill="currentColor" opacity="0.4" />
    </svg>
  );
}

/** ظهورٌ عند التمرير — والهيرو مستثنًى، يُرى ساكناً من أوّل رسم. */
function Reveal({
  children,
  delay = 0,
  className = "",
  from = "up",
}: {
  children: React.ReactNode;
  delay?: number;
  className?: string;
  from?: "up" | "right" | "left" | "scale";
}) {
  const ref = useRef<HTMLDivElement>(null);
  const inView = useInView(ref, { once: false, margin: "-70px" });
  /* بلا مراقبِ تقاطعٍ لا يُحجب شيء: المحتوى أولى من الحركة. */
  const observable = typeof IntersectionObserver !== "undefined";
  const shown = inView || !observable;

  const start =
    from === "right" ? { opacity: 0, x: 28 }
      : from === "left" ? { opacity: 0, x: -28 }
        : from === "scale" ? { opacity: 0, scale: 0.94 }
          : { opacity: 0, y: 26 };

  return (
    <div ref={ref} className={className}>
      <motion.div
        className={`mkt-reveal-content ${shown ? "is-visible" : ""}`}
        initial={start}
        animate={shown ? { opacity: 1, x: 0, y: 0, scale: 1 } : start}
        transition={{ duration: 0.62, delay, ease: [0.22, 1, 0.36, 1] }}
      >
        {children}
      </motion.div>
    </div>
  );
}

/* ── الأطروحة: اسمُك يصير أكاديميّة ──────────────────────────── */

/** يحوّل الاسمَ العربيَّ إلى slug لاتينيٍّ صالحٍ للعنوان. */
function toSlug(name: string): string {
  const map: Record<string, string> = {
    ا: "a", أ: "a", إ: "a", آ: "a", ى: "a", ب: "b", ت: "t", ث: "th", ج: "g",
    ح: "h", خ: "kh", د: "d", ذ: "z", ر: "r", ز: "z", س: "s", ش: "sh", ص: "s",
    ض: "d", ط: "t", ظ: "z", ع: "a", غ: "gh", ف: "f", ق: "q", ك: "k", ل: "l",
    م: "m", ن: "n", ه: "h", ة: "a", و: "w", ي: "y", ء: "", ئ: "", ؤ: "",
  };
  const out = [...name.trim().toLowerCase()]
    .map((ch) => (/[a-z0-9]/.test(ch) ? ch : ch === " " ? "-" : (map[ch] ?? "")))
    .join("")
    .replace(/-+/g, "-")
    .replace(/^-|-$/g, "");
  return out.slice(0, 24);
}

/**
 * لوحُ التوقيع — أطروحةُ الصفحة في تفاعلٍ واحد.
 * الزائرُ يكتب اسمَه فيراه توقيعاً بالرقعة على بابِ أكاديميّته، وعنواناً
 * يُشتقّ منه. وهذا هو المنتَجُ نفسُه لا وصفاً له.
 */
function SignaturePanel({ brand }: { brand: string }) {
  const [name, setName] = useState("");
  /* الاشتقاقُ يتأخّر عن الكتابة فلا يُعاد الرسمُ مع كلّ حرف */
  const shown = useDeferredValue(name.trim());
  const slug = toSlug(shown) || "your-name";

  return (
    <div className="mkt-sig">
      <Corner className="mkt-sig-corner" />

      <label className="mkt-sig-field">
        <span className="mkt-sig-label">{withoutHarakat("اكتب اسمك كما تريده أن يُعرف")}</span>
        <input
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder={withoutHarakat("مثال: أ. محمد كامل")}
          maxLength={32}
          className="mkt-sig-input"
          aria-label="اسمك"
        />
      </label>

      {/* بابُ الأكاديميّة */}
      <div className="mkt-door">
        <div className="mkt-door-chrome">
          <span className="mkt-door-dot" />
          <span className="mkt-door-dot" />
          <span className="mkt-door-dot" />
          <span className="mkt-door-url" dir="ltr">
            {slug}
            <span className="mkt-door-url-dim">.{brand.toLowerCase().replace(/\s+/g, "")}.com</span>
          </span>
        </div>

        <div className="mkt-door-body">
          <Seal size={44}>
            <span className="mkt-door-initial">{(shown || "ا").slice(0, 1)}</span>
          </Seal>

          <p className="mkt-door-sig">{shown || "اسمك هنا"}</p>
          <Rule className="mkt-door-rule" />
          <p className="mkt-door-tag">{withoutHarakat("أكاديميّةٌ مستقلّةٌ — دروسٌ واختباراتٌ وبثٌّ مباشر")}</p>

          <div className="mkt-door-row">
            <span className="mkt-door-chip">لوحة المعلّم</span>
            <span className="mkt-door-chip">بوّابة الطالب</span>
            <span className="mkt-door-chip">{withoutHarakat("مشغّل محميّ")}</span>
          </div>
        </div>
      </div>
    </div>
  );
}

const DIAGRAM_ITEMS = [
  { label: "التسجيل", detail: "حسابك في دقيقة", tone: "blue" },
  { label: "الهوية", detail: "اسمك وشعارك", tone: "green" },
  { label: "المحتوى", detail: "دروسك واختباراتك", tone: "cyan" },
  { label: "الطلاب", detail: "بوابة خاصة بهم", tone: "navy" },
  { label: "الدفع", detail: "اشتراكاتك بسهولة", tone: "orange" },
  { label: "التحليلات", detail: "أرقام واضحة", tone: "blue" },
] as const;

function PlatformDiagram({ brand }: { brand: string }) {
  return (
    <div className="mkt-diagram" aria-label="مراحل إنشاء منصتك">
      <svg className="mkt-diagram-lines" viewBox="0 0 520 420" aria-hidden="true">
        <path d="M260 210 260 55M260 210 445 108M260 210 445 312M260 210 260 365M260 210 75 312M260 210 75 108" />
      </svg>
      <div className="mkt-diagram-center">
        <span className="mkt-diagram-center-mark">{brand.slice(0, 1) || "S"}</span>
        <b>منصتك</b>
        <small>جاهزة للنمو</small>
      </div>
      {DIAGRAM_ITEMS.map((item, index) => (
        <div key={item.label} className={`mkt-diagram-node mkt-diagram-node-${index + 1} tone-${item.tone}`}>
          <span className="mkt-diagram-node-icon">{index + 1}</span>
          <span className="mkt-diagram-node-copy">
            <b>{item.label}</b>
            <small>{item.detail}</small>
          </span>
        </div>
      ))}
    </div>
  );
}

/* ══════════════════════════════════════════════════════════ */
/*  المكوّن الرئيسي                                            */
/* ══════════════════════════════════════════════════════════ */

export function Marketing({ plans, brand }: { plans: SaasPlan[]; brand: string }) {
  const [openFaq, setOpenFaq] = useState<number | null>(0);

  return (
    <div className="mkt font-sans">
      {/* ════════ شريط التنقل ════════ */}
      <header className="mkt-bar">
        <Link href="/" className="mkt-brand">
          <Seal size={34}>
            <Image src="/logo.jpg" alt={brand} width={34} height={34} className="mkt-logo-img" />
          </Seal>
          <span className="mkt-brand-name">{brand}</span>
        </Link>

        <nav className="mkt-nav">
          <a href="#how" className="hidden sm:block">الطريق</a>
          <a href="#features" className="hidden sm:block">ما تملكه</a>
          <a href="#plans">الأسعار</a>
          <a href="#faq" className="hidden md:block">أسئلة</a>
          <Link href="/start" className="mkt-nav-cta">
            ابدأ <ArrowLeft className="size-3.5" />
          </Link>
        </nav>
      </header>

      {/*
        ════════ الهيرو ════════
        يُرى ساكناً من أوّل رسم: لا `opacity: 0` ينتظر جافاسكربت.
        كانت الترويسةُ محجوبةً حتّى يعمل framer-motion، فمن بطؤت شبكتُه
        رأى صفحةً فارغةً — وهي أوّلُ ما يراه زائرٌ لم يعرفنا بعد.
      */}
      <section className="mkt-hero">
        <div className="mkt-hero-wash" aria-hidden="true" />

        <Reveal from="right" className="mkt-hero-reveal">
        <div className="mkt-hero-text">
          <span className="mkt-hero-logo">
            <Seal size={52}>
              <Image src="/logo.jpg" alt={brand} width={52} height={52} className="mkt-logo-img" />
            </Seal>
          </span>
          <h1 className="mkt-h1">
            {withoutHarakat("اسمُك على الباب")}
            <span className="mkt-h1-em">{withoutHarakat("لا اسمُ أحدٍ سواك")}</span>
          </h1>

          <p className="mkt-lede">
            {withoutHarakat("أكاديميّةٌ كاملةٌ برابطك: دروسٌ محميّة، واختبارات، وبثٌّ مباشر، وبوّاباتُ دفعٍ محليّة — تُفتح في دقيقة، بلا سطرِ كود.")}
          </p>

          <div className="mkt-cta-row">
            <Link href="/start" className="mkt-cta">
              {withoutHarakat("أنشئ منصّتك الآن")} <ArrowLeft className="size-4" />
            </Link>
            <a href="#how" className="mkt-cta-ghost">كيف تسير؟</a>
          </div>
        </div>
        </Reveal>

        <Reveal from="scale" className="mkt-hero-reveal">
          <PlatformDiagram brand={brand} />
        </Reveal>

        <Reveal delay={0.15} from="up" className="mkt-hero-reveal">
          <div className="mkt-trust">
            {TRUST.map((s) => (
              <div key={s.l} className="mkt-trust-item">
                <span className="mkt-trust-v">{s.v}</span>
                <span className="mkt-trust-l">{s.l}</span>
              </div>
            ))}
          </div>
        </Reveal>
      </section>

      {/* ════════ الطريق ════════ */}
      <section id="how" className="mkt-section">
        <Reveal>
          <header className="mkt-head">
            <Rule className="mkt-head-rule" />
            <h2 className="mkt-h2">{withoutHarakat("أربعُ خطواتٍ ثمّ تفتح")}</h2>
            <p className="mkt-head-sub">{withoutHarakat("لا تركيبَ ولا استضافةَ ولا انتظار.")}</p>
          </header>
        </Reveal>

        <ol className="mkt-steps">
          {STEPS.map((s, i) => (
            <Reveal key={s.t} delay={i * 0.07} from="right">
              <li className="mkt-step">
                <Seal size={52}>
                  <span className="mkt-step-n">{(i + 1).toLocaleString("ar-EG")}</span>
                </Seal>
                <div className="mkt-step-body">
                  <b className="mkt-step-t">{s.t}</b>
                  <span className="mkt-step-d">{s.d}</span>
                </div>
              </li>
            </Reveal>
          ))}
        </ol>
      </section>

      {/* ════════ ما تملكه ════════ */}
      <section id="features" className="mkt-section">
        <Reveal>
          <header className="mkt-head">
            <Rule className="mkt-head-rule" />
            <h2 className="mkt-h2">{withoutHarakat("ما تملكه فعلاً")}</h2>
            <p className="mkt-head-sub">{withoutHarakat("لا مزايا تُعدّ، بل ما ستستعمله كلّ يوم.")}</p>
          </header>
        </Reveal>

        <div className="mkt-feats">
          {FEATURES.map((f, i) => (
            <Reveal key={f.t} delay={(i % 3) * 0.07} from={FEATURE_FROM[i % FEATURE_FROM.length]}>
              <article className="mkt-feat">
                <Corner className="mkt-feat-corner" />
                <span className={`mkt-feat-icon tone-${f.tone}`}>
                  <f.Icon className="size-5" />
                </span>
                <b className="mkt-feat-t">{f.t}</b>
                <p className="mkt-feat-d">{f.d}</p>
              </article>
            </Reveal>
          ))}
        </div>
      </section>

      {/* ════════ الأسعار ════════ */}
      <section id="plans" className="mkt-section">
        <Reveal>
          <header className="mkt-head">
            <Rule className="mkt-head-rule" />
            <h2 className="mkt-h2">{withoutHarakat("كشفُ الأسعار")}</h2>
            <p className="mkt-head-sub">{withoutHarakat("تُرقّى أو تُخفّض في أيّ وقتٍ — وبياناتُك تبقى.")}</p>
          </header>
        </Reveal>

        <div className="mkt-plans">
          {plans.map((p, i) => {
            const price = planPrice({ price: p.priceEGP, discount: p.discount });
            const hot = Boolean(p.highlight);
            return (
              <Reveal key={p.id} delay={i * 0.08} from="up">
                <div className={`mkt-plan ${hot ? "is-hot" : ""}`}>
                  {hot && <span className="mkt-plan-ribbon">{withoutHarakat(p.badge || "الأكثر اختياراً")}</span>}

                  <b className="mkt-plan-name">{withoutHarakat(p.name)}</b>
                  {p.desc && <span className="mkt-plan-desc">{withoutHarakat(p.desc)}</span>}

                  <Rule className="mkt-plan-rule" />

                  <div className="mkt-plan-price">
                    <span className="mkt-plan-num">{price.price.toLocaleString("ar-EG")}</span>
                    <span className="mkt-plan-cur">
                      ج.م / {p.interval === "month" ? "شهر" : p.interval === "quarter" ? "٣ أشهر" : "سنة"}
                    </span>
                  </div>

                  <ul className="mkt-plan-feats">
                    {[
                      p.limits?.maxStudents ? `حتى ${p.limits.maxStudents.toLocaleString("ar-EG")} طالب` : withoutHarakat("طلابٌ بلا حدّ"),
                      p.limits?.customDomain ? withoutHarakat("نطاقٌ خاصٌّ بك") : withoutHarakat("نطاقٌ فرعيٌّ مجّاني"),
                      withoutHarakat("حمايةٌ وعلامةٌ مائيّة"),
                      withoutHarakat("دعمٌ طوال الأسبوع"),
                    ].map((t) => (
                      <li key={t}>
                        <Check className="size-3.5 shrink-0" />
                        <span>{t}</span>
                      </li>
                    ))}
                  </ul>

                  <Link href="/start" className={`mkt-plan-cta ${hot ? "is-hot" : ""}`}>
                    {withoutHarakat(`اختر ${p.name}`)} <ArrowLeft className="size-3.5" />
                  </Link>
                </div>
              </Reveal>
            );
          })}
        </div>
      </section>

      {/* ════════ الأسئلة ════════ */}
      <section id="faq" className="mkt-section">
        <Reveal>
          <header className="mkt-head">
            <Rule className="mkt-head-rule" />
            <h2 className="mkt-h2">{withoutHarakat("أسئلةٌ تُسأل كثيراً")}</h2>
          </header>
        </Reveal>

        <div className="mkt-faqs">
          {FAQS.map((f, i) => {
            const open = openFaq === i;
            return (
              <Reveal key={f.q} delay={i * 0.04} from={i % 2 ? "left" : "right"}>
                <div className={`mkt-faq ${open ? "is-open" : ""}`}>
                  <button type="button" onClick={() => setOpenFaq(open ? null : i)} className="mkt-faq-q">
                    <span>{f.q}</span>
                    <ChevronDown className={`mkt-faq-chev ${open ? "is-open" : ""}`} />
                  </button>
                  <AnimatePresence initial={false}>
                    {open && (
                      <motion.div
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: "auto", opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        transition={{ duration: 0.28, ease: [0.22, 1, 0.36, 1] }}
                        className="overflow-hidden"
                      >
                        <p className="mkt-faq-a">{f.a}</p>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              </Reveal>
            );
          })}
        </div>
      </section>

      {/* ════════ الدعوة الختاميّة ════════ */}
      <section className="mkt-section">
        <Reveal from="scale">
          <div className="mkt-final">
            <Corner className="mkt-final-corner" />
            <Seal size={56}>
              <Image src="/logo.jpg" alt={brand} width={56} height={56} className="mkt-logo-img" />
            </Seal>
            <h2 className="mkt-final-h">الباب مفتوح</h2>
            <p className="mkt-final-p">
              {withoutHarakat("أنشئ منصّتك الآن — تكتب اسمك، وتختار خطّتك، وتفتح. ولا شيءَ يُدفع قبل أن ترى ما بنيته.")}
            </p>
            <Link href="/start" className="mkt-cta">
              {withoutHarakat("أنشئ منصّتك")} <ArrowLeft className="size-4" />
            </Link>
          </div>
        </Reveal>
      </section>

      {/* ════════ الفوتر ════════ */}
      <footer className="mkt-foot">
        <div className="mkt-foot-row">
          <span className="mkt-foot-brand">{brand}</span>
          <nav className="mkt-foot-links">
            <a href="#features">ما تملكه</a>
            <a href="#plans">الأسعار</a>
            <a href="#faq">أسئلة</a>
            <Link href="/start" className="mkt-foot-start">ابدأ الآن</Link>
          </nav>
        </div>
        <p className="mkt-foot-copy">
          {withoutHarakat(`${brand} — منصّةٌ لإطلاق الأكاديميّات التعليميّة. جميع الحقوق محفوظة.`)}
        </p>
      </footer>
    </div>
  );
}
