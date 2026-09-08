"use client";

/**
 * واجبُ الدرس — سؤالٌ بعد سؤال.
 * ------------------------------------------------------------------
 * كان الواجبُ عموداً واحداً: عشرةُ أسئلةٍ مفتوحةٍ معاً وزرُّ تسليمٍ في
 * ذيله. وهو يصلح لورقةٍ تُطبع ولا يصلح لشاشةِ هاتف — يمرّر الطالبُ فيتوه
 * موضعُه، ويرى تسعةً لم يُجب عنها فيقلق، ويُسلّم فيُفاجَأ بأنّه ترك سؤالاً
 * في الوسط.
 *
 * فصار مراحلَ:
 *
 *   ١ ــ **سؤالٌ واحدٌ في الشاشة** بعدّادٍ يقول أين هو من الكلّ. سؤالٌ
 *        واحدٌ يُقرأ كلُّه بلا تمرير، ولا يُزاحمه ما بعده.
 *   ٢ ــ **رجوعٌ إلى ما قبله** قبل التسليم — التذكّرُ يقع بعد سؤالين،
 *        ومن مُنع الرجوعَ فقد الإجابةَ التي تذكّرها.
 *   ٣ ــ **شاشةُ مراجعة**: كلُّ سؤالٍ وجوابُه في سطر، وما تُرك فارغاً
 *        مؤشَّرٌ بلونٍ — فلا يُسلَّم واجبٌ ناقصٌ بغير قصد.
 *   ٤ ــ **التصحيحُ بعد التسليم**: الصحيحُ أخضرُ والخطأُ أحمرُ ومعه
 *        الصوابُ — فالواجبُ تعلُّمٌ لا حكم.
 *
 * **والتصحيحُ في الخادم وحدَه.** الجوابُ الصحيحُ لا يصل المتصفّحَ قبل
 * التسليم — ولو وصل لقُرئ من أدوات المطوّر في ثانية. وما يُعرض هنا يأتي
 * في ردّ التسليم لا قبله.
 *
 * **والمحاولاتُ مفتوحةٌ وتُحفظ أعلى نتيجة**: الواجبُ تمرينٌ لا امتحانٌ
 * رسميّ، ومن أعاد فتعلّم أولى بأن يُحسَب له تعلُّمُه.
 */

import { useState } from "react";
import { Card } from "@/components/dashboard/ui";
import type { Lesson } from "@/lib/utils/types";

const ar = (n: number) => n.toLocaleString("ar-EG");

function Svg({ children, className = "size-4" }: { children: React.ReactNode; className?: string }) {
  return (
    <svg viewBox="0 0 24 24" className={className} fill="none" stroke="currentColor"
      strokeWidth="1.9" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      {children}
    </svg>
  );
}
const ICheck = () => <Svg><path d="M4.5 12.5l5 5 10-11" /></Svg>;
const IX = () => <Svg><path d="M6 6l12 12M18 6L6 18" /></Svg>;
const IBack = () => <Svg><path d="M5 12h14M13 6l6 6-6 6" /></Svg>;
const INext = () => <Svg><path d="M19 12H5M11 6l-6 6 6 6" /></Svg>;
const IList = () => <Svg><rect x="4" y="3" width="16" height="18" rx="2.5" /><path d="M9 8h6M9 12h6M9 16h3" /></Svg>;
const ISpin = () => <Svg className="size-4 animate-spin"><path d="M12 3a9 9 0 1 0 9 9" /></Svg>;

type Graded = { correct: number[]; score: number; total: number; percent: number; passed: boolean };

export function LessonQuiz({
  subjectId,
  lesson,
  fem,
  previous,
  onGraded,
}: {
  subjectId: string;
  lesson: Lesson;
  fem: boolean;
  previous: { score: number; total: number; percent: number; passed: boolean } | null;
  onGraded: () => Promise<void> | void;
}) {
  const questions = lesson.quiz?.questions ?? [];
  const total = questions.length;

  const [answers, setAnswers] = useState<number[]>(() => Array(total).fill(-1));
  /* `-1` مرحلةُ البداية، و`total` شاشةُ المراجعة، وما بينهما سؤال. */
  const [step, setStep] = useState(-1);
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState<string | null>(null);
  const [graded, setGraded] = useState<Graded | null>(null);

  const y = (v: string) => `${v}${fem ? "ي" : ""}`;
  const answered = answers.filter((a) => a >= 0).length;
  const missing = answers.reduce<number[]>((acc, a, i) => (a < 0 ? [...acc, i] : acc), []);

  const pick = (oi: number) =>
    setAnswers((prev) => prev.map((a, i) => (i === step ? oi : a)));

  const submit = async () => {
    setErr(null);
    setBusy(true);
    try {
      const res = await fetch("/api/quiz", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ subjectId, lessonId: lesson.id, answers }),
      });
      const data = await res.json();
      if (!res.ok) {
        setErr(data.error || "تعذّر تسليم الواجب");
        return;
      }
      setGraded({ correct: data.correct, ...data.result });
      await onGraded();
    } catch {
      setErr("تعذّر الاتصال — حاول مرّةً أخرى");
    } finally {
      setBusy(false);
    }
  };

  const restart = () => {
    setGraded(null);
    setAnswers(Array(total).fill(-1));
    setStep(-1);
    setErr(null);
  };

  const title = lesson.quiz?.title || "واجب الدرس";

  /* ---------------- الترويسة ---------------- */

  const head = (
    <div className="mb-4 flex flex-wrap items-center justify-between gap-2">
      <p className="inline-flex items-center gap-2 font-display font-extrabold">
        <span className="text-primary"><IList /></span>
        {title}
      </p>
      {graded ? (
        <span
          className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-bold ${
            graded.passed ? "bg-emerald-500/15 text-emerald-600" : "bg-rose-500/15 text-rose-500"
          }`}
        >
          {ar(graded.score)}/{ar(graded.total)} · {ar(graded.percent)}٪ {graded.passed ? "ناجح" : "لم تنجح"}
        </span>
      ) : previous ? (
        <span className="text-xs text-muted-foreground">
          أفضلُ نتيجةٍ لك: {ar(previous.score)}/{ar(previous.total)} ({ar(previous.percent)}٪)
        </span>
      ) : (
        <span className="text-xs text-muted-foreground">{ar(total)} أسئلة اختيار من متعدّد</span>
      )}
    </div>
  );

  /* شريطُ التقدّم — الطولُ يُقرأ أسرعَ من العدد */
  const bar = (
    <span className="mb-4 block h-1.5 overflow-hidden rounded-full bg-foreground/10">
      <span
        className="block h-full rounded-full bg-primary transition-[width] duration-500"
        style={{ width: `${Math.round(((step < 0 ? 0 : Math.min(step, total)) / total) * 100)}%` }}
      />
    </span>
  );

  /* ---------------- ١ ــ البداية ---------------- */

  if (!graded && step < 0) {
    return (
      <Card className="mt-6">
        {head}
        <p className="mb-4 text-sm leading-relaxed text-muted-foreground">
          {ar(total)} أسئلة، سؤالٌ في كلّ شاشة. {y("تستطيع")} الرجوعَ وتعديلَ إجاباتك قبل
          التسليم، والتصحيحُ يظهر فورَ تسليمك. والمحاولاتُ مفتوحةٌ — وتُحفظ أعلى نتيجة.
        </p>
        <button
          type="button"
          onClick={() => setStep(0)}
          className="rounded-full btn-glow px-6 py-2.5 text-sm font-bold text-white"
        >
          {previous ? y("أعد") + " المحاولة" : y("ابدأ") + " الواجب"}
        </button>
      </Card>
    );
  }

  /* ---------------- ٤ ــ النتيجة ---------------- */

  if (graded) {
    return (
      <Card className="mt-6">
        {head}
        <ul className="space-y-3">
          {questions.map((q, qi) => {
            const mine = answers[qi];
            const right = graded.correct[qi];
            const ok = mine === right;
            return (
              <li key={q.id} className={`rounded-2xl border p-4 ${ok ? "border-emerald-500/40" : "border-rose-500/40"}`}>
                <p className="mb-2 flex items-start gap-2 text-sm font-bold">
                  <span
                    className={`grid size-6 shrink-0 place-items-center rounded-full text-white ${
                      ok ? "bg-emerald-500" : "bg-rose-500"
                    }`}
                  >
                    {ok ? <ICheck /> : <IX />}
                  </span>
                  <span className="min-w-0">{q.text}</span>
                </p>
                <div className="ps-8 text-[13px] leading-relaxed">
                  <p className={ok ? "text-emerald-600" : "text-rose-500"}>
                    إجابتُك: {mine >= 0 ? q.options[mine] : "— لم تُجب"}
                  </p>
                  {!ok && (
                    <p className="text-emerald-600">الصواب: {q.options[right]}</p>
                  )}
                </div>
              </li>
            );
          })}
        </ul>

        <button
          type="button"
          onClick={restart}
          className="mt-4 rounded-full border border-border px-5 py-2.5 text-sm font-bold transition hover:border-primary hover:text-primary"
        >
          {y("أعد")} المحاولة
        </button>
      </Card>
    );
  }

  /* ---------------- ٣ ــ المراجعة ---------------- */

  if (step >= total) {
    return (
      <Card className="mt-6">
        {head}
        {bar}
        <p className="mb-3 text-sm font-bold">راجع إجاباتك قبل التسليم</p>

        <ul className="mb-4 space-y-2">
          {questions.map((q, qi) => {
            const a = answers[qi];
            return (
              <li key={q.id}>
                <button
                  type="button"
                  onClick={() => setStep(qi)}
                  className={`flex w-full items-center gap-3 rounded-2xl border p-3 text-right transition hover:border-primary/50 ${
                    a < 0 ? "border-amber-500/50 bg-amber-500/[0.06]" : "border-border"
                  }`}
                >
                  <span className="grid size-6 shrink-0 place-items-center rounded-full bg-primary/12 text-[11px] font-bold text-primary">
                    {ar(qi + 1)}
                  </span>
                  <span className="min-w-0 flex-1">
                    <span className="block truncate text-[13px] font-semibold">{q.text}</span>
                    <span className={`block truncate text-[12px] ${a < 0 ? "font-bold text-amber-600" : "text-muted-foreground"}`}>
                      {a >= 0 ? q.options[a] : "لم تُجب — اضغط للإجابة"}
                    </span>
                  </span>
                </button>
              </li>
            );
          })}
        </ul>

        {err && <p className="mb-3 rounded-2xl bg-rose-500/10 px-3 py-2 text-center text-xs font-bold text-rose-500">{err}</p>}

        {missing.length > 0 && (
          <p className="mb-3 rounded-2xl border border-amber-500/40 bg-amber-500/[0.07] px-3 py-2 text-center text-[12px] font-bold text-amber-700 dark:text-amber-400">
            {ar(missing.length)} سؤالاً بلا إجابة — تُحتسب خطأً إن سلّمتَ الآن.
          </p>
        )}

        <div className="flex flex-wrap items-center gap-3">
          <button
            type="button"
            onClick={() => setStep(total - 1)}
            className="inline-flex items-center gap-1.5 rounded-full border border-border px-5 py-2.5 text-sm font-bold transition hover:border-primary hover:text-primary"
          >
            <IBack /> رجوع
          </button>
          <button
            type="button"
            onClick={() => void submit()}
            disabled={busy}
            className="inline-flex items-center gap-2 rounded-full btn-glow px-6 py-2.5 text-sm font-bold text-white disabled:opacity-60"
          >
            {busy ? <ISpin /> : <ICheck />} تسليم الواجب
          </button>
        </div>
      </Card>
    );
  }

  /* ---------------- ٢ ــ سؤالٌ واحد ---------------- */

  const q = questions[step];

  return (
    <Card className="mt-6">
      {head}
      {bar}

      <p className="mb-1 text-[11px] font-bold text-muted-foreground">
        السؤال {ar(step + 1)} من {ar(total)} · {y("أجبت")} عن {ar(answered)}
      </p>
      <p className="mb-4 text-base font-bold leading-relaxed">{q.text}</p>

      <div className="grid gap-2.5 sm:grid-cols-2">
        {q.options.map((o, oi) => {
          const chosen = answers[step] === oi;
          return (
            <button
              key={oi}
              type="button"
              onClick={() => pick(oi)}
              className={`flex items-center gap-2.5 rounded-2xl border p-3.5 text-right text-sm transition ${
                chosen ? "border-primary bg-primary/10 font-bold text-primary" : "border-border hover:border-primary/40"
              }`}
            >
              <span className="grid size-5 shrink-0 place-items-center rounded-full border border-current text-[10px]">
                {chosen ? "●" : ""}
              </span>
              <span className="min-w-0 flex-1">{o}</span>
            </button>
          );
        })}
      </div>

      <div className="mt-4 flex flex-wrap items-center gap-3">
        <button
          type="button"
          onClick={() => setStep((s) => s - 1)}
          disabled={step === 0}
          className="inline-flex items-center gap-1.5 rounded-full border border-border px-5 py-2.5 text-sm font-bold transition hover:border-primary hover:text-primary disabled:opacity-40"
        >
          <IBack /> السابق
        </button>

        {/*
          «التالي» لا يُقفل على من لم يُجب.
          الإجبارُ يبدو حرصاً وهو حبس: من لم يعرف سؤالاً يتركه ويمضي
          ويرجع إليه من شاشة المراجعة — وهي تُبرز المتروكَ بلون.
        */}
        <button
          type="button"
          onClick={() => setStep((s) => s + 1)}
          className="inline-flex items-center gap-1.5 rounded-full btn-glow px-6 py-2.5 text-sm font-bold text-white"
        >
          {step === total - 1 ? "المراجعة" : "التالي"} <INext />
        </button>
      </div>
    </Card>
  );
}
