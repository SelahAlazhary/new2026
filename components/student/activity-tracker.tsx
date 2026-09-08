"use client";

/**
 * مراسلُ النشاط.
 * ------------------------------------------------------------------
 * يُبلّغ الخادمَ بما يفتحه الطالب. ثلاث قواعد تحكمه حتى لا يتحوّل
 * التتبّعُ إلى عبء على المنصّة وعلى جهاز الطالب:
 *
 *   • **لا شيء يُرسَل والتبويبُ مخفيّ.** الصفحةُ التي لا تُرى لا تُقرأ.
 *   • **الزمنُ يُحسب بالفارق لا بمؤقّت.** المؤقّتُ يظلّ يعدّ والجهازُ
 *     نائم، فيُسجَّل مكوثٌ لم يقع.
 *   • **يُرسَل عند المغادرة لا كل دقيقة.** طلبٌ واحد لكل صفحة بدل
 *     عشرات — و`sendBeacon` يضمن وصولَه بعد إغلاق التبويب.
 *
 * ولا يُركَّب إلا في بوابة الطالب: نشاطُ المشرف ليس تقريراً يُقرأ.
 */

import { useEffect, useRef } from "react";
import { usePathname } from "next/navigation";
import type { ActivityKind } from "@/lib/utils/types";

/** المسار كنوعِ حدث ومرجعٍ مقروء. */
function classify(path: string): { kind: ActivityKind; ref: string } {
  const course = path.match(/^\/student\/course\/([^/?#]+)/);
  if (course) return { kind: "lesson", ref: course[1] };
  if (path.startsWith("/student/exams/")) return { kind: "exam", ref: path.split("/")[3] ?? "" };
  if (path.startsWith("/student/live")) return { kind: "live", ref: "" };
  return { kind: "view", ref: path.replace(/^\/student\/?/, "") || "الرئيسية" };
}

function send(payload: Record<string, unknown>) {
  const body = JSON.stringify(payload);
  /* beacon يصل بعد إغلاق التبويب — و`fetch` قد يُلغى معه. */
  if (typeof navigator !== "undefined" && navigator.sendBeacon) {
    navigator.sendBeacon("/api/activity", new Blob([body], { type: "application/json" }));
    return;
  }
  void fetch("/api/activity", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body,
    keepalive: true,
  }).catch(() => { /* التتبّع لا يُفشِل شيئاً */ });
}

export function ActivityTracker() {
  const path = usePathname();
  /* لحظةُ بدء المكوث في هذه الصفحة — تُصفَّر عند إخفاء التبويب. */
  const since = useRef<number>(Date.now());
  const spent = useRef(0);

  useEffect(() => {
    const { kind, ref } = classify(path);
    since.current = Date.now();
    spent.current = 0;

    const stopCounting = () => {
      if (document.hidden) {
        spent.current += Date.now() - since.current;
      } else {
        since.current = Date.now();
      }
    };

    const flush = () => {
      const total = spent.current + (document.hidden ? 0 : Date.now() - since.current);
      const minutes = Math.round(total / 60_000);
      send({ kind, ref, minutes });
    };

    document.addEventListener("visibilitychange", stopCounting);
    window.addEventListener("pagehide", flush);

    return () => {
      document.removeEventListener("visibilitychange", stopCounting);
      window.removeEventListener("pagehide", flush);
      flush();   // تغيّر المسار = مغادرةُ الصفحة السابقة
    };
  }, [path]);

  return null;
}
