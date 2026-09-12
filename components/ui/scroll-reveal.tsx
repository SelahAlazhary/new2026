"use client";

/**
 * أنيميشن التمرير — يكشف كلَّ عنصرٍ يحمل `data-reveal` عند بلوغه الشاشة،
 * ويُعيد إخفاءه حين يغادرها فيُعاد تشغيلُ الحركة في كلّ مرورٍ عليه —
 * لا مرّةً واحدةً بعد أوّل رسم.
 * ------------------------------------------------------------------
 * القاعدةُ الحاكمة: **لا يبقى محتوًى مخفيّاً أبداً.** الأنماطُ تُخفي كلَّ
 * عنصرٍ موسومٍ ابتداءً، فأيُّ خللٍ هنا يعني صفحةً بيضاء. ولذلك يُكشف
 * الكلُّ فوراً إن غاب `IntersectionObserver` أو وقع خطأ، ولا يُعاد
 * إخفاؤه ثانيةً في هذه الحالة — فلا يجازف بصفحةٍ بيضاء لعطلٍ في المتصفّح.
 *
 * وإعادةُ التشغيل تحتاج فرضَ إعادة تدفّقٍ (`reflow`) بين إزالة الصنف
 * وإضافته: المتصفّحُ لا يُعيد أنيميشنَ CSS إن أُزيل الصنفُ وأُعيد في
 * الجزء نفسِه دون قراءةِ خاصّيّةٍ تفرض حساب التخطيط بينهما.
 */

import { useEffect } from "react";

function revealAll() {
  document.querySelectorAll("[data-reveal]").forEach((el) => {
    el.classList.add("is-visible");
  });
}

export function ScrollRevealInit() {
  useEffect(() => {
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
      revealAll();
      return;
    }
    if (!("IntersectionObserver" in window)) {
      revealAll();
      return;
    }

    let io: IntersectionObserver;
    let mo: MutationObserver;
    let pending: ReturnType<typeof setTimeout> | null = null;
    const observed = new WeakSet<Element>();

    try {
      io = new IntersectionObserver(
        (entries) => {
          for (const e of entries) {
            const el = e.target as HTMLElement;
            if (e.isIntersecting) {
              /* إعادةُ الصنف بعد إزالته وفرضِ التدفّق — يُعيد تشغيل
                 الأنيميشن من أوّله في كلّ دخولٍ إلى الشاشة. */
              el.classList.remove("is-visible");
              void el.offsetWidth;
              el.classList.add("is-visible");
            } else {
              el.classList.remove("is-visible");
            }
          }
        },
        { threshold: 0.08, rootMargin: "0px 0px -40px 0px" },
      );

      const observe = () => {
        document.querySelectorAll("[data-reveal]").forEach((el) => {
          if (observed.has(el)) return;
          observed.add(el);
          io.observe(el);
        });
      };

      observe();

      /* مؤقّتٌ لا requestAnimationFrame: الأخيرُ لا يعمل في تبويبٍ مخفيّ،
         فتبقى العناصرُ الجديدةُ غيرَ مرصودةٍ حتّى يظهر التبويب. */
      mo = new MutationObserver(() => {
        if (pending) return;
        pending = setTimeout(() => {
          pending = null;
          observe();
        }, 50);
      });
      mo.observe(document.body, { childList: true, subtree: true });
    } catch {
      revealAll();
      return;
    }

    return () => {
      if (pending) clearTimeout(pending);
      io.disconnect();
      mo.disconnect();
    };
  }, []);

  return null;
}
