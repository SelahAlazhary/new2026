"use client";

/**
 * لوحٌ يُطوى — للأقسام الطويلة في اللوحات.
 * ------------------------------------------------------------------
 * صفحاتُ الإدارة تعرض كلَّ شيءٍ دفعةً واحدةً في عمودٍ واحد: من أراد
 * إعداداً واحداً مرّ على عشرين، ومن نزل إلى آخر الصفحة نسي أوّلَها.
 * وهذا اللوحُ يجعل القسمَ عنواناً يُفتح عند الحاجة.
 *
 * وأربعةُ قيودٍ تجعله يصلح للاستعمال لا للزينة:
 *
 * ١ ــ **`height: auto` لا رقمٌ ثابت.** المحتوى يطول ويقصر — قائمةُ دروسٍ
 *      تُضاف إليها — فارتفاعٌ مكتوبٌ يقصّ أو يترك فراغاً. و`framer-motion`
 *      يقيس `auto` عند كلّ فتحة.
 *
 * ٢ ــ **`overflow: hidden` أثناء الحركة فقط.** لازمٌ وإلّا فاض المحتوى
 *      خارج الصندوق وهو ينطوي. ويُرفع بعد الفتح، وإلّا قُصّت القوائمُ
 *      المنسدلةُ والتلميحاتُ التي تخرج عن حدّ اللوح.
 *
 * ٣ ــ **العدّادُ يصعد إلى العنوان.** ما يُطوى يُخفى، فلو خُفي معه ما
 *      ينتظر عملاً صار الطيُّ يكتم. فالعددُ يُكتب على العنوان دائماً.
 *
 * ٤ ــ **`<button>` لا `<div onClick>`.** التبويبُ يبلغه، والمسافةُ
 *      والإدخالُ يفتحانه، وقارئُ الشاشة يقول «مطويّ/مفتوح» من
 *      `aria-expanded`.
 */

import { useEffect, useState, type ReactNode } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { setPref } from "@/lib/auth/consent";

export function Collapse({
  title,
  subtitle,
  icon,
  count,
  tone,
  actions,
  defaultOpen = false,
  /** يُحفظ المفتوحُ بين الزيارات حين يُعطى مفتاحاً. */
  storageKey,
  children,
  className = "",
}: {
  title: ReactNode;
  subtitle?: ReactNode;
  icon?: ReactNode;
  /** رقمٌ يُكتب على العنوان — يبقى ظاهراً وهو مطويّ. */
  count?: number;
  /** نبرةُ العدّاد: `alert` أحمرُ لما ينتظر عملاً، وإلّا ذهبٌ هادئ. */
  tone?: "alert" | "calm";
  /** أزرارٌ في العنوان — لا تفتح اللوح حين تُضغط. */
  actions?: ReactNode;
  defaultOpen?: boolean;
  storageKey?: string;
  children: ReactNode;
  className?: string;
}) {
  const [open, setOpen] = useState(defaultOpen);
  /* الحركةُ تُقصّ، والفتحُ المستقرُّ لا — فتظهر القوائمُ المنسدلة. */
  const [clip, setClip] = useState(true);

  useEffect(() => {
    if (!storageKey) return;
    try {
      const raw = localStorage.getItem(`mk.collapse.${storageKey}`);
      if (raw !== null) setOpen(raw === "1");
    } catch {
      /* تخزينٌ محجوب — يُمضى بالافتراضيّ */
    }
  }, [storageKey]);

  const toggle = () => {
    const next = !open;
    setOpen(next);
    setClip(true);
    if (storageKey) {
      try {
        setPref(`mk.collapse.${storageKey}`, next ? "1" : "0");
      } catch {
        /* التخزينُ زينةٌ لا شرط */
      }
    }
  };

  return (
    <div className={`overflow-hidden rounded-3xl border border-border bg-card/60 ${className}`}>
      <div className="flex items-center gap-3 pe-3">
        <button
          type="button"
          onClick={toggle}
          aria-expanded={open}
          className="flex min-w-0 flex-1 items-center gap-3 p-4 text-start transition hover:bg-muted/60"
        >
          {icon && <span className="shrink-0 text-primary">{icon}</span>}
          <span className="min-w-0 flex-1">
            <span className="font-kufi block truncate text-sm font-bold">{title}</span>
            {subtitle && (
              <span className="mt-0.5 block truncate text-xs text-muted-foreground">{subtitle}</span>
            )}
          </span>
          {count !== undefined && count > 0 && (
            <span
              className={`grid min-w-6 shrink-0 place-items-center rounded-full px-2 py-0.5 text-[11px] font-extrabold ${
                tone === "alert"
                  ? "bg-rose-500 text-white"
                  : "bg-[hsl(var(--gold)/0.28)] text-[hsl(var(--primary))]"
              }`}
            >
              {count.toLocaleString("ar-EG")}
            </span>
          )}
          <span
            className={`shrink-0 text-[hsl(var(--gold))] transition-transform duration-200 ${
              open ? "rotate-180" : ""
            }`}
          >
            <svg
              viewBox="0 0 24 24"
              className="size-4"
              fill="none"
              stroke="currentColor"
              strokeWidth="2.5"
              strokeLinecap="round"
              strokeLinejoin="round"
              aria-hidden="true"
            >
              <path d="M6 9l6 6 6-6" />
            </svg>
          </span>
        </button>
        {/* الأزرارُ خارج الزرّ لا داخله: زرٌّ في زرٍّ HTML غيرُ صحيح،
            وضغطُها كان يفتح اللوحَ ويطويه مع كلّ فعل. */}
        {actions && <div className="flex shrink-0 items-center gap-2">{actions}</div>}
      </div>

      <AnimatePresence initial={false}>
        {open && (
          <motion.div
            key="body"
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.26, ease: [0.22, 1, 0.36, 1] }}
            onAnimationComplete={() => setClip(false)}
            className={clip ? "overflow-hidden" : ""}
          >
            <div className="border-t border-border p-4">{children}</div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
