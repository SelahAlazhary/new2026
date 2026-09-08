"use client";

/**
 * مُنصِتُ الإخفاقات الصامتة.
 * ------------------------------------------------------------------
 * حدُّ الخطأ يلتقط ما عطِب في **الرسم**، ولا يلتقط ما عطِب في **العمل**:
 * `fetch` يُرفَض فلا يُمسَك، أو دالّةٌ غيرُ متزامنةٍ ترمي بعد أن رُسمت
 * الشاشة. فيضغط الأستاذُ الزرَّ ولا يقع شيء — لا حفظٌ ولا رسالة — فيظنّ
 * الزرَّ معطّلاً ويعيد الضغط.
 *
 * وهذا لا يُصلَح بإضافة `catch` في كلّ موضع: المواضعُ عشراتٌ وسيُنسى
 * بعضُها، وسيُنسى في كلّ ما يُكتب غداً. فيُنصَت للنافذة نفسِها: كلُّ وعدٍ
 * مرفوضٍ لم يُمسَك يصير لوحَ فشلٍ ظاهراً — وهو لوحُ الحفظ نفسُه، فالمشرفُ
 * تعلّم مكانَه ولا يُعلَّم مكاناً ثانياً.
 *
 * **ويُكتَم التكرار**: خطأٌ يقع في حلقةٍ لا يملأ الشاشة، ورسالةٌ واحدةٌ
 * تكفي عن مئة.
 */

import { useEffect } from "react";
import { saveFailed } from "@/lib/utils/save-state";

/** نصُّ ما رُفض به الوعد — قد يكون خطأً أو أيَّ قيمةٍ أخرى. */
function textOf(v: unknown): string {
  if (v instanceof Error) return v.message || v.name;
  if (typeof v === "string") return v;
  try {
    return JSON.stringify(v).slice(0, 200);
  } catch {
    return String(v);
  }
}

/*
  أخطاءٌ لا تُعرض: ضجيجُ الأدوات لا عطبُ المنصّة. إلغاءُ طلبٍ عند مغادرة
  الصفحة أمرٌ طبيعيٌّ لا خبرَ فيه، وانقطاعُ مقبس التطوير يخصّ المطوّر.
*/
const QUIET = [
  "AbortError",
  "The user aborted a request",
  "ResizeObserver loop",
  "Failed to fetch dynamically imported module",
  "hmr",
  "_next/static",
];

export function ErrorWatch() {
  useEffect(() => {
    let last = "";
    let lastAt = 0;

    const report = (msg: string) => {
      if (!msg) return;
      if (QUIET.some((q) => msg.toLowerCase().includes(q.toLowerCase()))) return;

      /* الرسالةُ نفسُها خلال ثوانٍ خمسٍ لا تُعاد */
      const now = Date.now();
      if (msg === last && now - lastAt < 5000) return;
      last = msg;
      lastAt = now;

      saveFailed(msg, "تعذّرت العملية");
    };

    const onReject = (e: PromiseRejectionEvent) => report(textOf(e.reason));
    const onError = (e: ErrorEvent) => {
      /*
        أخطاءُ تحميل المصادر (صورةٌ لم تُجلب) تصل هنا بلا `error` — وهي
        ليست عطبَ منطقٍ فلا تُبلَّغ.
      */
      if (!e.error) return;
      report(textOf(e.error));
    };

    window.addEventListener("unhandledrejection", onReject);
    window.addEventListener("error", onError);
    return () => {
      window.removeEventListener("unhandledrejection", onReject);
      window.removeEventListener("error", onError);
    };
  }, []);

  return null;
}
