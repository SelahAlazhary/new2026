"use client";

/**
 * حالةُ الحفظ في الواجهة.
 * ------------------------------------------------------------------
 * **النجاحُ هادئٌ والفشلُ عالٍ.** الحفظُ يقع عند كلّ مغادرةِ حقل، ونافذةٌ
 * تُهنّئ بكلّ حفظٍ تصير ضجيجاً يُتعلَّم تجاهلُه — ومعه يُتجاهل الخطأ. فشارةٌ
 * صغيرةٌ تظهر لحظتين ثمّ تذهب للنجاح، ولوحٌ **لا يُغلق نفسَه** للفشل.
 *
 * ولوحُ الفشل يُغلق بيد صاحبه وحدَه: خطأٌ يمرّ ويختفي قبل أن يُقرأ لم
 * يُبلَّغ أصلاً — والمعلومةُ التي فيه أنّ ما كُتب **لم يُحفظ**.
 */

import { useEffect, useState } from "react";
import { Check, Loader2, AlertTriangle, X } from "lucide-react";
import { getSaveState, onSaveState, saveSettled, type SaveState } from "@/lib/utils/save-state";

export function SaveStatus() {
  const [s, setS] = useState<SaveState>({ kind: "idle" });

  useEffect(() => {
    setS(getSaveState());
    return onSaveState(setS);
  }, []);

  /* «حُفظ» تذهب وحدَها بعد ثانيتين — والخطأُ يبقى */
  useEffect(() => {
    if (s.kind !== "saved") return;
    const t = setTimeout(saveSettled, 2000);
    return () => clearTimeout(t);
  }, [s]);

  if (s.kind === "idle") return null;

  if (s.kind === "error") {
    return (
      <div
        role="alert"
        className="fixed inset-x-0 bottom-4 z-[95] flex justify-center px-4 lg:pr-[18.5rem]"
      >
        <div className="flex max-w-lg items-start gap-3 rounded-2xl border border-rose-500/40 bg-rose-500/[0.12] px-4 py-3 shadow-[0_8px_28px_-12px_rgba(16,24,40,.35)] backdrop-blur-xl">
          <AlertTriangle className="mt-0.5 size-4 shrink-0 text-rose-600 dark:text-rose-400" />
          <div className="min-w-0">
            <p className="text-xs font-extrabold text-rose-700 dark:text-rose-400">{s.title ?? "لم يُحفظ التعديل"}</p>
            <p className="mt-0.5 text-[11px] leading-relaxed text-rose-700/85 dark:text-rose-300/85">
              {s.message}
              {s.title ? " — أعد المحاولة." : " — أعد المحاولة، والحقلُ عاد إلى قيمته المحفوظة."}
            </p>
          </div>
          <button
            onClick={() => location.reload()}
            className="shrink-0 rounded-full border border-rose-500/40 px-2.5 py-1 text-[10px] font-bold text-rose-700 transition hover:bg-rose-500/15 dark:text-rose-300"
          >
            تحديث
          </button>
        </div>
      </div>
    );
  }

  return (
    <span
      className={`font-kufi inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[10px] font-bold ${
        s.kind === "saving"
          ? "bg-muted text-muted-foreground"
          : "bg-emerald-500/15 text-emerald-700 dark:text-emerald-400"
      }`}
    >
      {s.kind === "saving" ? <Loader2 className="size-3 animate-spin" /> : <Check className="size-3" />}
      {s.kind === "saving" ? "يحفظ…" : "حُفظ"}
    </span>
  );
}
