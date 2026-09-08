"use client";

/**
 * محرّرُ الواجب التفاعليّ لدرسٍ واحد.
 * ------------------------------------------------------------------
 * كان مكوّناً محلّيّاً داخل صفحة محرّر الكورس. فلمّا صارت للدرس نافذةُ
 * إدارةٍ تُفتح من «كلّ الدروس» أيضاً، وجب أن يكون في موضعٍ واحدٍ يُستعمل
 * من الاثنين — وإلّا نُسخ في موضعين وافترقا بعد أوّل تعديل.
 */

import { useState } from "react";
import { Plus, Trash2, Check, X, ListChecks } from "lucide-react";
import { Card } from "@/components/dashboard/ui";
import { Button } from "@/components/ui/primitives";
import type { Lesson, Quiz, QuizQuestion } from "@/lib/utils/types";

/* ---------- محرّر الاختبار التفاعلي لدرس واحد (اختياري) ---------- */
export function QuizEditor({
  lesson, onChange, results,
}: {
  lesson: Lesson;
  onChange: (q: Quiz | undefined) => void;
  results?: { attempts: number; avg: number; passed: number };
}) {
  /*
    الاختبارُ يُبنى حقلاً حقلاً لا بـ`??` واحدة.
    ------------------------------------------------------------------
    كانت `lesson.quiz ?? {…}` تحرس غيابَ الاختبار كلِّه ولا تحرس غيابَ ما
    بداخله. و**Firebase لا يخزّن المصفوفات الفارغة**: درسٌ فُعِّل اختبارُه
    ثمّ حُذفت أسئلتُه يعود `{ enabled: true, passScore: 60 }` بلا مفتاح
    `questions` أصلاً — فتسقط `quiz.questions.length` بـ«Cannot read
    properties of undefined»، وتذهب الشاشةُ كلُّها عند فتح تعديل الدرس.

    وهذا ليس خطأً في هذا الملفّ وحدَه بل في كلّ ما يقرأ مصفوفةً من
    القاعدة: الغائبُ والفارغُ شيءٌ واحدٌ عندها. فالقراءةُ تُطبِّع دائماً.
  */
  const quiz: Quiz = {
    enabled: lesson.quiz?.enabled ?? false,
    passScore: lesson.quiz?.passScore ?? 60,
    questions: lesson.quiz?.questions ?? [],
  };
  const [q, setQ] = useState({ text: "", options: ["", "", "", ""], correct: 0 });

  const update = (patch: Partial<Quiz>) => onChange({ ...quiz, ...patch });
  const addQuestion = () => {
    const options = q.options.map((o) => o.trim()).filter(Boolean);
    if (!q.text.trim() || options.length < 2) return;
    const correct = Math.min(q.correct, options.length - 1);
    const item: QuizQuestion = { id: `Q-${Date.now()}`, text: q.text.trim(), options, correct };
    update({ enabled: true, questions: [...quiz.questions, item] });
    setQ({ text: "", options: ["", "", "", ""], correct: 0 });
  };
  const removeQuestion = (qid: string) =>
    update({ questions: quiz.questions.filter((x) => x.id !== qid) });
  const setOption = (i: number, v: string) =>
    setQ((prev) => ({ ...prev, options: prev.options.map((o, k) => (k === i ? v : o)) }));

  return (
    <div className="mt-3 rounded-2xl border border-border bg-muted/30 p-4">
      <div className="mb-3 flex flex-wrap items-center justify-between gap-3">
        <label className="inline-flex cursor-pointer items-center gap-2 text-sm font-bold">
          <input type="checkbox" checked={quiz.enabled} onChange={(e) => update({ enabled: e.target.checked })} className="size-4 accent-[hsl(var(--primary))]" />
          تفعيل اختبار تفاعلي على هذا الفيديو
        </label>
        <label className="inline-flex items-center gap-2 text-xs text-muted-foreground">
          نسبة النجاح
          <input type="number" min={0} max={100} value={quiz.passScore ?? 60}
            onChange={(e) => update({ passScore: Math.max(0, Math.min(100, Number(e.target.value))) })}
            className="w-20 rounded-xl border border-border bg-card/60 px-2 py-1 text-xs outline-none" />
          ٪
        </label>
        {(results?.attempts ?? 0) > 0 && results && (
          <span className="text-xs text-muted-foreground">
            {results.attempts.toLocaleString("ar-EG")} محاولة · متوسط {results.avg}٪ · ناجح {results.passed.toLocaleString("ar-EG")}
          </span>
        )}
      </div>

      {quiz.questions.length > 0 && (
        <div className="mb-4 space-y-2">
          {quiz.questions.map((item, i) => (
            <div key={item.id} className="rounded-2xl border border-border bg-card/50 p-3">
              <div className="flex items-start gap-2">
                <span className="grid size-6 shrink-0 place-items-center rounded-full bg-primary/12 text-xs font-bold text-primary">{i + 1}</span>
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-semibold">{item.text}</p>
                  <ul className="mt-1 flex flex-wrap gap-2 text-xs">
                    {item.options.map((o, k) => (
                      <li key={k} className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 ${k === item.correct ? "bg-emerald-500/15 font-bold text-emerald-500" : "bg-muted text-muted-foreground"}`}>
                        {k === item.correct && <Check className="size-3" />}{o}
                      </li>
                    ))}
                  </ul>
                </div>
                <button onClick={() => removeQuestion(item.id)} title="حذف السؤال" className="grid size-7 shrink-0 place-items-center rounded-full border border-border text-rose-500 transition hover:border-rose-500"><X className="size-3.5" /></button>
              </div>
            </div>
          ))}
        </div>
      )}

      <div className="grid gap-2">
        <input value={q.text} onChange={(e) => setQ({ ...q, text: e.target.value })} className="inp" placeholder="نص السؤال…" />
        <div className="grid gap-2 sm:grid-cols-2">
          {q.options.map((o, i) => (
            <label key={i} className="flex items-center gap-2">
              <input type="radio" name={`correct-${lesson.id}`} checked={q.correct === i} onChange={() => setQ({ ...q, correct: i })} className="size-4 accent-[hsl(var(--primary))]" />
              <input value={o} onChange={(e) => setOption(i, e.target.value)} className="inp" placeholder={`الاختيار ${i + 1}${i === 0 ? " (حدّد الصحيح بالدائرة)" : ""}`} />
            </label>
          ))}
        </div>
        <Button className="w-fit px-5 py-2" onClick={addQuestion}><Plus className="size-4" /> إضافة السؤال</Button>
      </div>
    </div>
  );
}
