"use client";

/**
 * تثبيت المنصّة كتطبيق (PWA).
 * • أندرويد/ويندوز: نلتقط beforeinstallprompt ونعرض زر تثبيت حقيقي.
 * • iOS (سفاري لا يدعم الحدث): نعرض خطوات «مشاركة ← إضافة إلى الشاشة الرئيسية».
 * • إذا كان التطبيق مثبّتاً بالفعل (display-mode: standalone) لا يظهر شيء.
 */
import { useCallback, useEffect, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { IconInstall, IconShare, IconPlus, IconClose, IconCheckCircle } from "@/components/brand/icons";
import { CornerKnot } from "@/components/brand/pattern";
import { setPref } from "@/lib/auth/consent";

type InstallPromptEvent = Event & {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: "accepted" | "dismissed" }>;
};

const DISMISS_KEY = "emz_install_dismissed";

export function isStandalone(): boolean {
  if (typeof window === "undefined") return false;
  return (
    window.matchMedia("(display-mode: standalone)").matches ||
    // سفاري iOS
    (window.navigator as Navigator & { standalone?: boolean }).standalone === true
  );
}

export function InstallApp({ className = "" }: { className?: string }) {
  const [deferred, setDeferred] = useState<InstallPromptEvent | null>(null);
  const [installed, setInstalled] = useState(false);
  const [dismissed, setDismissed] = useState(true); // نبدأ مخفيّين حتى تُقرأ الحالة
  const [ios, setIos] = useState(false);
  const [showIosSteps, setShowIosSteps] = useState(false);

  useEffect(() => {
    if (isStandalone()) { setInstalled(true); return; }
    try { setDismissed(localStorage.getItem(DISMISS_KEY) === "1"); } catch { setDismissed(false); }

    const ua = window.navigator.userAgent;
    setIos(/iphone|ipad|ipod/i.test(ua) && /safari/i.test(ua) && !/crios|fxios/i.test(ua));

    const onPrompt = (e: Event) => {
      e.preventDefault();
      setDeferred(e as InstallPromptEvent);
    };
    const onInstalled = () => { setInstalled(true); setDeferred(null); };

    window.addEventListener("beforeinstallprompt", onPrompt);
    window.addEventListener("appinstalled", onInstalled);
    return () => {
      window.removeEventListener("beforeinstallprompt", onPrompt);
      window.removeEventListener("appinstalled", onInstalled);
    };
  }, []);

  const install = useCallback(async () => {
    if (!deferred) return;
    await deferred.prompt();
    const { outcome } = await deferred.userChoice;
    setDeferred(null);
    if (outcome === "accepted") setInstalled(true);
  }, [deferred]);

  const dismiss = () => {
    setDismissed(true);
    try { setPref(DISMISS_KEY, "1"); } catch { /* تجاهل */ }
  };

  // لا نعرض شيئاً: مثبّت بالفعل، أو مُستبعَد، أو متصفّح لا يدعم التثبيت
  if (installed || dismissed || (!deferred && !ios)) return null;

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      className={`glass relative overflow-hidden rounded-2xl p-3.5 shadow-bento sm:rounded-3xl sm:p-5 ${className}`}
    >
      <CornerKnot size={72} className="pointer-events-none absolute bottom-0 left-0 hidden text-primary/40 sm:block" />
      <div className="relative flex flex-wrap items-center gap-3 pl-9 sm:gap-4 sm:pl-11">
        <span className="grid size-10 shrink-0 place-items-center rounded-xl bg-primary/12 text-primary sm:size-12 sm:rounded-2xl">
          <IconInstall anim="bob" className="size-5 sm:size-6" />
        </span>
        <div className="min-w-0 flex-1">
          <p className="font-display text-sm font-extrabold sm:text-base">ثبّت المنصّة كتطبيق</p>
          <p className="mt-0.5 text-[11px] leading-snug text-muted-foreground sm:text-xs sm:leading-relaxed">
            افتح دروسك من أيقونة على شاشة جهازك مباشرة — بشاشة كاملة وبلا شريط متصفّح.
          </p>
        </div>

        {ios ? (
          <button
            onClick={() => setShowIosSteps((v) => !v)}
            className="inline-flex w-full items-center justify-center gap-2 rounded-full btn-glow px-5 py-2.5 text-[13px] font-bold text-white sm:w-auto sm:text-sm"
          >
            <IconShare className="size-4" /> طريقة التثبيت
          </button>
        ) : (
          <button
            onClick={install}
            className="inline-flex w-full items-center justify-center gap-2 rounded-full btn-glow px-5 py-2.5 text-[13px] font-bold text-white sm:w-auto sm:text-sm"
          >
            <IconInstall className="size-4" /> تثبيت التطبيق
          </button>
        )}

        <button onClick={dismiss} aria-label="إخفاء" className="absolute left-0 top-0 z-10 grid size-7 place-items-center rounded-full border border-border bg-background/70 text-muted-foreground transition hover:text-foreground sm:size-8">
          <IconClose className="size-3.5 sm:size-4" />
        </button>
      </div>

      <AnimatePresence initial={false}>
        {showIosSteps && (
          <motion.ol
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.3, ease: [0.22, 1, 0.36, 1] }}
            className="relative mt-3 space-y-2 overflow-hidden border-t border-border pt-3 text-xs text-muted-foreground sm:mt-4 sm:pt-4 sm:text-sm"
          >
            <li className="flex items-center gap-2">
              <IconShare className="size-4 shrink-0 text-primary" /> اضغط زر «مشاركة» في شريط سفاري.
            </li>
            <li className="flex items-center gap-2">
              <IconPlus className="size-4 shrink-0 text-primary" /> اختر «إضافة إلى الشاشة الرئيسية».
            </li>
            <li className="flex items-center gap-2">
              <IconCheckCircle className="size-4 shrink-0 text-primary" /> اضغط «إضافة» — ستجد أيقونة المنصّة على شاشتك.
            </li>
          </motion.ol>
        )}
      </AnimatePresence>
    </motion.div>
  );
}
