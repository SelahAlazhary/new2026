"use client";

/**
 * هبوطُ الأقسام — تنزل إلى مواضعها حين تبلغها العين.
 * ------------------------------------------------------------------
 * **لماذا لا تكفي `animation` وحدَها؟** الحركةُ القائمة في المنصّة
 * (`mo-in`) تعمل عند تحميل الصفحة: فقسمٌ في أسفلها يكون قد «دخل» قبل
 * أن يراه أحد، فيصل إليه الزائرُ ساكناً. فالحركةُ تُربط بالوصول لا
 * بالتحميل.
 *
 * **ولماذا مستمعُ تمريرٍ لا `IntersectionObserver`؟** المراقبُ أدقُّ
 * وأخفُّ حين تُراقَب مئاتُ العناصر، وهنا ثمانيةٌ لا أكثر. وهو يُحسَب
 * في دورة الرسم، فحيثُ لا تُنتَج إطاراتٌ (تبويبٌ خلفيّ، نافذةٌ محجوبة،
 * متصفّحٌ بلا رسم) لا يُبلَّغ أبداً — وقد وقع ذلك فعلاً عند الفحص:
 * أقسامٌ ظاهرةٌ في الشاشة بقيت شفّافةً لأنّ المراقبَ لم يُنادَ قطّ.
 * والقياسُ المباشر (`getBoundingClientRect`) لا يعتمد على الرسم.
 *
 * **وثلاثةُ أبوابٍ للخروج** — الحركةُ زينةٌ لا يجوز أن تُخفي محتوًى:
 *   ١) `prefers-reduced-motion` — يُعرض المحتوى فوراً بلا حركة.
 *   ٢) بلا جافاسكربت — القاعدةُ كلُّها داخل `@media (scripting: enabled)`
 *      فلا يبقى المحتوى شفّافاً أبداً إن لم يعمل شيء.
 *   ٣) غلافٌ فارغ (قسمٌ بلا بيانات يُرجع عدماً) — يُعرض ولا يُنتظر،
 *      وإلّا بقي شفّافاً لو امتلأ لاحقاً.
 */

import { useEffect, useRef, useState, type ReactNode } from "react";

/** كم يُقترب القسمُ من أسفل الشاشة قبل أن يهبط (٠٫٩ = بعد ٩٠٪ من ارتفاعها). */
const TRIGGER = 0.9;

export function Descend({
  children,
  /** تأخيرٌ بالمللي ثانية — لتتابع عناصرَ متجاورة. */
  delay = 0,
  className = "",
}: {
  children: ReactNode;
  delay?: number;
  className?: string;
}) {
  const ref = useRef<HTMLDivElement>(null);
  const [shown, setShown] = useState(false);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;

    if (window.matchMedia?.("(prefers-reduced-motion: reduce)").matches || el.offsetHeight === 0) {
      setShown(true);
      return;
    }

    let done = false;
    let timer: ReturnType<typeof setTimeout> | null = null;

    const stop = () => {
      done = true;
      window.removeEventListener("scroll", onMove);
      window.removeEventListener("resize", onMove);
      if (timer) clearTimeout(timer);
    };

    const check = () => {
      if (done) return;
      const r = el.getBoundingClientRect();
      const vh = window.innerHeight || document.documentElement.clientHeight;
      if (r.top < vh * TRIGGER && r.bottom > 0) {
        setShown(true);
        stop();
      }
    };

    /* خانقٌ بسيط: فحصٌ كلَّ ثمانين مللي ثانية على الأكثر مهما كثُر التمرير */
    function onMove() {
      if (done || timer) return;
      timer = setTimeout(() => {
        timer = null;
        check();
      }, 80);
    }

    /*
      الفحصُ الأوّل بعد مهلةٍ صفريّة لا فوراً: الصفحةُ تُرسم مخفيّةً أوّلاً
      ثمّ تهبط — ولو كُشف في اللحظة نفسِها لظهر القسمُ الأعلى بلا حركة.
    */
    timer = setTimeout(() => {
      timer = null;
      check();
    }, 0);

    window.addEventListener("scroll", onMove, { passive: true });
    window.addEventListener("resize", onMove);
    return stop;
  }, []);

  return (
    <div
      ref={ref}
      className={`descend ${shown ? "is-in" : ""} ${className}`}
      style={delay ? ({ "--descend-delay": `${delay}ms` } as React.CSSProperties) : undefined}
    >
      {children}
    </div>
  );
}
