"use client";

/**
 * لافتةُ الكوكيز.
 * ------------------------------------------------------------------
 * **وهي تقول الحقَّ ولا تُجمّله.** أكثرُ اللوافت تعرض «نستعمل الكوكيز
 * لتحسين تجربتك» — جملةٌ لا تعني شيئاً، ثمّ زرٌّ واحدٌ كبيرٌ للموافقة
 * وزرٌّ رماديٌّ صغيرٌ للرفض لا يفعل شيئاً. وهنا:
 *
 * ١ ــ **يُذكر ما يُحفظ بالاسم**، لا «كوكيز» مبهمة: كوكي الجلسة، وكوكي
 *      ربط جوجل المؤقّتة، وتفضيلاتُ الجهاز الثلاثة.
 *
 * ٢ ــ **ولا يُعرض خيارٌ لِما لا وجودَ له**: لا تحليلات ولا إعلانات في
 *      هذه المنصّة، فلا مربّعَ لهما. ومربّعٌ لخدمةٍ غيرِ موجودةٍ خداعٌ
 *      وإن بدا احترازاً.
 *
 * ٣ ــ **والزرّان متساويان في الوزن**. زرُّ الرفض الباهتُ الصغيرُ حيلةُ
 *      تصميمٍ معروفة، والتصميمُ الذي يدفع إلى إجابةٍ بعينها ليس اختياراً.
 *
 * ٤ ــ **و«الضروريّ فقط» يعمل فعلاً**: يمنع كتابةَ التفضيلات ويمحو ما
 *      كُتب منها. انظر `lib/consent.ts`.
 *
 * **ولا تُعرض على الخادم.** حالتُها تُقرأ من الجهاز، ورسمُها قبل القراءة
 * يُظهرها لحظةً لمن أجاب عنها من قبل.
 */

import { useEffect, useState } from "react";
import Link from "next/link";
import { Cookie, ChevronDown, ShieldCheck } from "lucide-react";
import { readConsent, writeConsent, clearPrefs, type Consent } from "@/lib/auth/consent";

const ITEMS = [
  {
    name: "كوكي الجلسة",
    need: "ضروريّة",
    what: "تُبقيك داخلاً بعد تسجيل الدخول. بلا حفظها لا يوجد تسجيلُ دخولٍ أصلاً — ولا تُقرأ من جافاسكربت (httpOnly).",
  },
  {
    name: "كوكي ربط جوجل",
    need: "ضروريّة · مؤقّتة",
    what: "تُكتب لحظةَ ربط حساب جوجل لحماية العملية، وتُمحى فور انتهائها.",
  },
  {
    name: "تفضيلاتُ جهازك",
    need: "اختياريّة",
    what: "المظهرُ الفاتح والداكن، والأقسامُ التي فتحتَها، وما شاهدتَه من دروس. تُحفظ في جهازك وحدَه ولا تُرسَل إلى أيّ خادم.",
  },
];

export function CookieConsent() {
  const [state, setState] = useState<Consent | null | "unknown">("unknown");
  const [more, setMore] = useState(false);

  useEffect(() => setState(readConsent()), []);

  const choose = (v: Consent) => {
    /* المحوُ قبل الكتابة: لو كُتبت الموافقةُ أوّلاً لمحاها المحوُ نفسُه. */
    if (v === "essential") clearPrefs();
    writeConsent(v);
    setState(v);
  };

  /* `unknown` = لم تُقرأ بعد · `null` = قُرئت ولم يُجب — وهي وحدَها تُظهر اللافتة */
  if (state !== null) return null;

  return (
    <div
      role="dialog"
      aria-label="إشعار ملفّات تعريف الارتباط"
      className="fixed inset-x-0 bottom-0 z-[90] p-3 sm:p-4"
    >
      <div className="glass mx-auto max-w-3xl overflow-hidden rounded-3xl border border-border shadow-2xl">
        <div className="flex items-start gap-3 p-4">
          <span className="grid size-10 shrink-0 place-items-center rounded-2xl bg-[hsl(var(--gold)/0.18)] text-primary">
            <Cookie className="size-5" />
          </span>
          <div className="min-w-0 flex-1">
            <p className="font-display text-sm font-extrabold">ملفّات تعريف الارتباط</p>
            <p className="mt-1 text-xs leading-relaxed text-muted-foreground">
              هذه المنصّة تحفظ كوكي جلسةٍ واحدةً تُبقيك داخلاً، وتحفظ تفضيلاتِك في جهازك وحدَه.
              <b className="text-foreground"> ولا تستعمل تحليلاتٍ ولا إعلاناتٍ ولا أيَّ تتبّعٍ لطرفٍ ثالث.</b>
            </p>

            <button
              type="button"
              onClick={() => setMore((v) => !v)}
              className="mt-2 inline-flex items-center gap-1 text-[11px] font-bold text-primary transition hover:opacity-80"
            >
              {more ? "إخفاء التفاصيل" : "ما الذي يُحفظ بالضبط؟"}
              <ChevronDown className={`size-3 transition ${more ? "rotate-180" : ""}`} />
            </button>

            {more && (
              <ul className="mt-3 space-y-2 border-t border-border pt-3">
                {ITEMS.map((it) => (
                  <li key={it.name} className="text-[11px] leading-relaxed">
                    <span className="font-bold">{it.name}</span>
                    <span className={`mx-1.5 rounded-full px-1.5 py-0.5 text-[11px] font-bold ${
                      it.need === "اختياريّة"
                        ? "bg-[hsl(var(--gold)/0.22)] text-primary"
                        : "bg-emerald-500/15 text-emerald-600 dark:text-emerald-400"
                    }`}>
                      {it.need}
                    </span>
                    <span className="text-muted-foreground">{it.what}</span>
                  </li>
                ))}
                <li className="flex items-start gap-1.5 pt-1 text-[11px] leading-relaxed text-muted-foreground">
                  <ShieldCheck className="mt-0.5 size-3 shrink-0 text-emerald-500" />
                  <span>
                    «الضروريّ فقط» يمنع حفظَ التفضيلات ويمحو ما حُفظ منها — والموقعُ يبقى عاملاً،
                    ولا يُتذكَّر مظهرُك ولا تقدّمُك بين الزيارات.
                  </span>
                </li>
              </ul>
            )}
          </div>
        </div>

        {/*
          الزرّان متساويان في الوزن والحجم.
          زرُّ الرفض الباهتُ الصغيرُ حيلةٌ معروفة، والتصميمُ الذي يدفع إلى
          إجابةٍ بعينها ليس اختياراً.
        */}
        <div className="flex flex-wrap items-center gap-2 border-t border-border bg-muted/40 p-3">
          <button
            type="button"
            onClick={() => choose("all")}
            className="btn-glow flex-1 rounded-full px-5 py-2.5 text-xs font-bold text-white sm:flex-none sm:px-8"
          >
            موافق — احفظ تفضيلاتي
          </button>
          <button
            type="button"
            onClick={() => choose("essential")}
            className="flex-1 rounded-full border border-border px-5 py-2.5 text-xs font-bold transition hover:border-primary hover:text-primary sm:flex-none sm:px-8"
          >
            الضروريّ فقط
          </button>
          <Link
            href="/legal/privacy"
            className="ms-auto text-[11px] font-bold text-muted-foreground underline-offset-4 transition hover:text-primary hover:underline"
          >
            سياسة الخصوصية
          </Link>
        </div>
      </div>
    </div>
  );
}
