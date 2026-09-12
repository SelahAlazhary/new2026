"use client";

/**
 * أنيميشن التمرير — يكشف كلَّ عنصرٍ يحمل `data-reveal` عند بلوغه الشاشة.
 * ------------------------------------------------------------------
 * القاعدةُ الحاكمة: **لا يبقى محتوًى مخفيّاً أبداً.** الأنماطُ تُخفي كلَّ
 * عنصرٍ موسومٍ ابتداءً، فأيُّ خللٍ هنا يعني صفحةً بيضاء. ولذلك يُكشف
 * الكلُّ فوراً إن غاب `IntersectionObserver` أو وقع خطأ.
 */

import { useEffect } from "react";

function revealAll() {
  document.querySelectorAll("[data-reveal]:not(.is-visible)").forEach((el) => {
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

    try {
      io = new IntersectionObserver(
        (entries) => {
          for (const e of entries) {
            if (!e.isIntersecting) continue;
            e.target.classList.add("is-visible");
            io.unobserve(e.target);
          }
        },
        { threshold: 0.08, rootMargin: "0px 0px -40px 0px" },
      );

      const observe = () => {
        document
          .querySelectorAll("[data-reveal]:not(.is-visible)")
          .forEach((el) => io.observe(el));
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
