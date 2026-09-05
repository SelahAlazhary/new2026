import Link from "next/link";
import type { SaasPlan } from "@/lib/hub/types";
import { planPrice } from "@/lib/plans";

/**
 * صفحةُ الموقع الأمّ — «أنشئ منصّتك التعليمية».
 * ------------------------------------------------------------------
 * هذه واجهةُ الجذر حين يكون موقعَ إنشاء المنصّات: موجّهةٌ **للمدرّس** لا
 * للطالب. لا ذكرَ لمنصّةٍ بعينها، ولا دخولَ طالب — الطالبُ لا علاقةَ له
 * بالجذر، منصّتُه على نطاقها الفرعيّ.
 */

const STEPS = [
  { n: "١", t: "سجّل بجوجل", d: "بضغطة واحدة، بلا كلمات مرور." },
  { n: "٢", t: "اختر خطّتك", d: "تجربة مجانية تبدأ فوراً." },
  { n: "٣", t: "صمّم هويّتك", d: "اسمٌ وشعارٌ و٢٠ تصميماً جاهزاً." },
  { n: "٤", t: "استلم منصّتك", d: "رابطٌ للطلاب ولوحةُ تحكّم كاملة." },
];

const FEATURES = [
  { t: "كل شيء جاهز", d: "كورسات، دروس فيديو، اختبارات تُصحَّح فوراً، بث مباشر، وإشعارات على الهاتف." },
  { t: "هويّتك أنت", d: "عشرون تصميماً فريداً، ألوانٌ تختارها، وشعارُ منصّتك — بلا سطر برمجة." },
  { t: "دفعٌ وأكواد", d: "بوّابة دفع لطلابك وأكواد تفعيل، واشتراكات تنتهي وتتجدّد تلقائياً." },
  { t: "دومين خاص", d: "اربط منصّتك بدومينك الخاص، أو ابدأ برابطٍ فرعيّ مجّاناً." },
  { t: "حماية للمحتوى", d: "حساب بجهاز واحد، علامة مائية على الفيديو، وحجب النسخ." },
  { t: "تحكّم كامل", d: "لوحةٌ تدير بها كل شيء: الطلاب، المحتوى، الأسعار، والتقارير." },
];

export function Marketing({ plans, brand }: { plans: SaasPlan[]; brand: string }) {
  return (
    <div className="mkt">
      {/* شريط علويّ */}
      <header className="mkt-bar">
        <span className="mkt-logo">{brand}</span>
        <nav className="mkt-bar-nav">
          <a href="#plans">الأسعار</a>
          <a href="#how">كيف يعمل</a>
          <Link href="/start" className="mkt-bar-cta">ابدأ الآن</Link>
        </nav>
      </header>

      {/* الهيرو */}
      <section className="mkt-hero">
        <span className="mkt-eyebrow">منصّتك التعليمية — جاهزة في دقائق</span>
        <h1 className="mkt-title">
          أنشئ منصّتك التعليمية<br />
          <span className="mkt-title-em">باسمك وهويّتك</span>
        </h1>
        <p className="mkt-sub">
          كل ما يحتاجه مدرّسٌ ليُعلّم أونلاين: كورسات وفيديو واختبارات وبثّ ودفع —
          على منصّةٍ باسمك ورابطك، بلا برمجة ولا إعداد تقنيّ.
        </p>
        <div className="mkt-hero-cta">
          <Link href="/start" className="mkt-primary">أنشئ منصّتك مجاناً</Link>
          <a href="#how" className="mkt-ghost">كيف يعمل؟</a>
        </div>
        <p className="mkt-note">تبدأ بتجربة مجانية · بلا بطاقة بنكية</p>
      </section>

      {/* الخطوات */}
      <section id="how" className="mkt-steps">
        {STEPS.map((s) => (
          <div key={s.n} className="mkt-step">
            <span className="mkt-step-n">{s.n}</span>
            <b className="mkt-step-t">{s.t}</b>
            <span className="mkt-step-d">{s.d}</span>
          </div>
        ))}
      </section>

      {/* المزايا */}
      <section className="mkt-features">
        <h2 className="mkt-h2">كل ما تحتاجه في مكان واحد</h2>
        <div className="mkt-grid">
          {FEATURES.map((f) => (
            <div key={f.t} className="mkt-feat">
              <b className="mkt-feat-t">{f.t}</b>
              <p className="mkt-feat-d">{f.d}</p>
            </div>
          ))}
        </div>
      </section>

      {/* الخطط */}
      <section id="plans" className="mkt-plans">
        <h2 className="mkt-h2">خطط واضحة تنمو مع منصّتك</h2>
        <div className="mkt-plan-grid">
          {plans.map((p) => {
            const price = planPrice({ price: p.priceEGP, discount: p.discount });
            return (
              <div key={p.id} className={`mkt-plan ${p.highlight ? "is-hot" : ""}`}>
                {p.badge && <span className="mkt-plan-badge">{p.badge}</span>}
                <b className="mkt-plan-name">{p.name}</b>
                {p.desc && <span className="mkt-plan-desc">{p.desc}</span>}
                <div className="mkt-plan-price">
                  {p.priceEGP === 0 ? (
                    <span className="mkt-plan-free">مجاناً</span>
                  ) : (
                    <>
                      <span className="mkt-plan-num">{price.price.toLocaleString("ar-EG")}</span>
                      <span className="mkt-plan-cur">ج.م / {p.interval === "month" ? "شهر" : p.interval === "quarter" ? "٣ أشهر" : "سنة"}</span>
                    </>
                  )}
                </div>
                {p.trialDays > 0 && <span className="mkt-plan-trial">تجربة {p.trialDays.toLocaleString("ar-EG")} يوماً مجاناً</span>}
                <Link href="/start" className={`mkt-plan-cta ${p.highlight ? "is-hot" : ""}`}>اختر {p.name}</Link>
              </div>
            );
          })}
        </div>
      </section>

      {/* دعوة أخيرة */}
      <section className="mkt-final">
        <h2 className="mkt-final-h">جاهزٌ لتبدأ التدريس أونلاين؟</h2>
        <Link href="/start" className="mkt-primary mkt-primary-lg">أنشئ منصّتك الآن</Link>
      </section>

      <footer className="mkt-foot">
        <span>{brand}</span>
        <span className="mkt-foot-dim">منصّةٌ لإنشاء المنصّات التعليمية</span>
      </footer>
    </div>
  );
}
