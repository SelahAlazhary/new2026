"use client";

/**
 * إدارةُ الدرس — أربعةُ ألسنة.
 * ------------------------------------------------------------------
 * كان كلُّ ما يخصّ الدرس عموداً واحداً: العنوانُ والرابطُ والمدّةُ
 * والمرفقاتُ والأسئلةُ فوق بعضها. وهي أعمالٌ أربعةٌ لا عملٌ واحد — من
 * جاء ليكتب سؤالاً مرّ على حقول الفيديو، ومن جاء ليبدّل الفيديو مرّ على
 * الأسئلة.
 *
 * فصارت ألسنةً: **المحتوى** (اسمُه ونشرُه ووصفُه) · **الفيديو** (مزوّدُه
 * ومعرّفاته) · **الواجب** (اسمُه ونشرُه وأسئلتُه) · **المرفقات**
 * (مستنداتُه). ولسانٌ واحدٌ مفتوحٌ في كلّ مرّة، فالشاشةُ قصيرةٌ والمهمّةُ
 * واحدة.
 *
 * **ولا نافذةَ عائمة**: اللوحُ يُفتح تحت الدرس في شجرة المنهج، فيبقى
 * موضعُ الدرس من منهجه مرئيّاً وهو يُحرَّر.
 *
 * والألوانُ من متغيّرات العلامة، والأيقوناتُ رسومٌ داخليّةٌ بـ
 * `currentColor` — تتبع السِّمةَ الفاتحةَ والداكنة بلا نسخةٍ ثانية.
 */

import { useState, type ReactNode } from "react";
import { AnimatePresence, motion } from "framer-motion";
import type { Lesson, Material, Quiz, QuizQuestion } from "@/lib/utils/types";

/* ------------------------------------------------------------------ */
/*  الأيقونات                                                          */
/* ------------------------------------------------------------------ */

function Svg({ children, className = "size-4" }: { children: ReactNode; className?: string }) {
  return (
    <svg
      viewBox="0 0 24 24"
      className={className}
      fill="none"
      stroke="currentColor"
      strokeWidth="1.75"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      {children}
    </svg>
  );
}

const IDoc = () => (
  <Svg>
    <path d="M6 3h7l5 5v13a1 1 0 0 1-1 1H6a1 1 0 0 1-1-1V4a1 1 0 0 1 1-1z" />
    <path d="M13 3v5h5" />
  </Svg>
);
const IFilm = () => (
  <Svg>
    <rect x="3" y="6" width="13" height="12" rx="2.5" />
    <path d="M16 10.5l5-2.5v8l-5-2.5z" />
  </Svg>
);
const IList = () => (
  <Svg>
    <rect x="4" y="3" width="16" height="18" rx="2.5" />
    <path d="M9 8h6M9 12h6M9 16h3" />
  </Svg>
);
const IClip = () => (
  <Svg>
    <path d="M20 11.5l-7.6 7.6a4.5 4.5 0 0 1-6.4-6.4l8-8a3 3 0 0 1 4.3 4.3l-8 8a1.5 1.5 0 0 1-2.2-2.1l7.3-7.3" />
  </Svg>
);
const IPlus = () => <Svg><path d="M12 5v14M5 12h14" /></Svg>;
const ITrash = () => (
  <Svg>
    <path d="M4 7h16" />
    <path d="M9 7V5.5A1.5 1.5 0 0 1 10.5 4h3A1.5 1.5 0 0 1 15 5.5V7" />
    <path d="M6.5 7l.8 11.2A2 2 0 0 0 9.3 20h5.4a2 2 0 0 0 2-1.8L17.5 7" />
  </Svg>
);
const ICheck = () => <Svg><path d="M4.5 12.5l5 5 10-11" /></Svg>;

/* ------------------------------------------------------------------ */
/*  قِطعٌ مشتركة                                                       */
/* ------------------------------------------------------------------ */

const ar = (n: number) => n.toLocaleString("ar-EG");

/** حقلٌ بعنوانه — العنوانُ فوق الحقل لا داخله، فيبقى بعد الكتابة. */
function Field({ label, hint, children }: { label: string; hint?: string; children: ReactNode }) {
  return (
    <label className="block">
      <span className="mb-1 block text-[11px] font-semibold text-muted-foreground">{label}</span>
      {children}
      {hint && <span className="mt-1 block text-[10px] leading-relaxed text-muted-foreground">{hint}</span>}
    </label>
  );
}

/**
 * مفتاحُ تشغيل.
 * `<button role="switch">` لا `<div onClick>`: التبويبُ يبلغه، والمسافةُ
 * تقلبه، وقارئُ الشاشة يقول «مشغّل/متوقّف» من `aria-checked`.
 */
function Toggle({
  on,
  onChange,
  label,
  hint,
}: {
  on: boolean;
  onChange: (v: boolean) => void;
  label: string;
  hint?: string;
}) {
  return (
    <div className="flex items-center justify-between gap-3 rounded-2xl border border-border/70 px-3.5 py-3">
      <span className="min-w-0">
        <span className="block text-[12px] font-bold">{label}</span>
        {hint && <span className="mt-0.5 block text-[10px] leading-relaxed text-muted-foreground">{hint}</span>}
      </span>
      <button
        type="button"
        role="switch"
        aria-checked={on}
        aria-label={label}
        onClick={() => onChange(!on)}
        style={on ? { background: "var(--brand-primary)" } : undefined}
        className={`relative h-6 w-11 shrink-0 rounded-full transition ${on ? "" : "bg-foreground/15"}`}
      >
        {/*
          المقبضُ ينزلق في اتّجاه القراءة عند التشغيل: يبدأ عند `start`
          (يمينُ الشاشة في العربيّة) ويمضي إلى `end`. وعكسُه يجعل المطفأَ
          يبدو مشغّلاً لمن يقرأ من اليمين.
        */}
        <span
          className={`absolute top-0.5 size-5 rounded-full bg-white shadow transition-all ${
            on ? "start-[1.375rem]" : "start-0.5"
          }`}
        />
      </button>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/*  اللوح                                                              */
/* ------------------------------------------------------------------ */

type Tab = "content" | "video" | "quiz" | "files";

export function LessonManager({
  lesson,
  units,
  unitId,
  onPatch,
  onMoveTo,
  onSetQuiz,
  results,
}: {
  lesson: Lesson;
  /** وحداتُ الكورس — لنقل الدرس بينها. */
  units: { id: string; title: string }[];
  unitId: string;
  onPatch: (patch: Partial<Lesson>) => void;
  onMoveTo: (uid: string) => void;
  onSetQuiz: (q: Quiz | undefined) => void;
  /** إحصاءُ المحاولات — يُعرض إن وُجد. */
  results?: { attempts: number; avg: number; passed: number };
}) {
  const [tab, setTab] = useState<Tab>("content");

  /*
    الاختبارُ يُبنى حقلاً حقلاً: Firebase لا يخزّن المصفوفةَ الفارغة،
    فدرسٌ حُذفت أسئلتُه يعود بلا مفتاح `questions` أصلاً.
  */
  const quiz: Quiz = {
    enabled: lesson.quiz?.enabled ?? false,
    passScore: lesson.quiz?.passScore ?? 60,
    questions: lesson.quiz?.questions ?? [],
    title: lesson.quiz?.title,
    published: lesson.quiz?.published,
  };
  const mats = lesson.materials ?? [];

  const TABS: { id: Tab; label: string; icon: ReactNode; count?: number }[] = [
    { id: "content", label: "المحتوى", icon: <IDoc /> },
    { id: "video", label: "الفيديو", icon: <IFilm /> },
    { id: "quiz", label: "الواجب", icon: <IList />, count: quiz.questions.length },
    { id: "files", label: "المرفقات", icon: <IClip />, count: mats.length },
  ];

  return (
    <div>
      {/* شريطُ الألسنة */}
      <div className="mb-4 flex flex-wrap gap-1.5 rounded-2xl border border-border bg-card p-1">
        {TABS.map((t) => {
          const on = tab === t.id;
          return (
            <button
              key={t.id}
              type="button"
              onClick={() => setTab(t.id)}
              aria-pressed={on}
              style={on ? { background: "var(--brand-primary)" } : undefined}
              className={`inline-flex items-center gap-1.5 rounded-xl px-3.5 py-2 text-[12px] font-bold transition ${
                on ? "text-white" : "text-muted-foreground hover:text-foreground"
              }`}
            >
              {t.icon}
              {t.label}
              {t.count !== undefined && t.count > 0 && (
                <span
                  className={`rounded-full px-1.5 text-[10px] leading-4 ${
                    on ? "bg-white/25" : "bg-foreground/[0.08]"
                  }`}
                >
                  {ar(t.count)}
                </span>
              )}
            </button>
          );
        })}
      </div>

      <AnimatePresence mode="wait">
        <motion.div
          key={tab}
          initial={{ opacity: 0, y: 6 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -6 }}
          transition={{ duration: 0.18 }}
        >
          {tab === "content" && (
            <ContentTab lesson={lesson} units={units} unitId={unitId} onPatch={onPatch} onMoveTo={onMoveTo} />
          )}
          {tab === "video" && <VideoTab lesson={lesson} onPatch={onPatch} />}
          {tab === "quiz" && <QuizTab quiz={quiz} onSetQuiz={onSetQuiz} results={results} />}
          {tab === "files" && <FilesTab mats={mats} onPatch={onPatch} />}
        </motion.div>
      </AnimatePresence>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/*  ١ ــ المحتوى                                                       */
/* ------------------------------------------------------------------ */

function ContentTab({
  lesson,
  units,
  unitId,
  onPatch,
  onMoveTo,
}: {
  lesson: Lesson;
  units: { id: string; title: string }[];
  unitId: string;
  onPatch: (p: Partial<Lesson>) => void;
  onMoveTo: (uid: string) => void;
}) {
  /* الغيابُ يعني «منشور» — انظر تعليقَ `published` في الأنواع. */
  const published = lesson.published !== false;

  return (
    <div className="space-y-3.5">
      <div className="grid gap-3 sm:grid-cols-2">
        <Field label="اسم الدرس">
          <input className="inp" value={lesson.title} onChange={(e) => onPatch({ title: e.target.value })} />
        </Field>
        <Field label="الوحدة">
          <select className="inp" value={unitId} onChange={(e) => e.target.value !== unitId && onMoveTo(e.target.value)}>
            {units.map((u) => (
              <option key={u.id} value={u.id}>{u.title}</option>
            ))}
          </select>
        </Field>
      </div>

      <Field label="وصف الدرس" hint="سطران يقولان ما في الدرس ولماذا يُشاهد — يظهران تحت عنوانه عند الطالب.">
        <textarea
          rows={3}
          className="inp resize-y"
          value={lesson.description ?? ""}
          onChange={(e) => onPatch({ description: e.target.value || undefined })}
          placeholder="مثال: شرحُ الحديث الأوّل من الأربعين النوويّة — سندُه ومعناه وما يُستفاد منه."
        />
      </Field>

      <div className="grid gap-3 sm:grid-cols-2">
        <Toggle
          on={published}
          onChange={(v) => onPatch({ published: v })}
          label="منشور للطلاب"
          hint="المسوّدةُ لا يراها أحدٌ حتى تُنشر."
        />
        <Toggle
          on={!!lesson.isFree}
          onChange={(v) => onPatch({ isFree: v })}
          label="معاينة مجانية"
          hint="يُفتح لغير المشتركين — درسٌ يُغري بالباقي."
        />
      </div>

      <div className="grid gap-3 sm:grid-cols-2">
        <Field
          label="جدولة الظهور"
          hint="قبل هذا الموعد لا يراه الطالبُ ولو كان منشوراً. اتركه فارغاً ليظهر فور نشره."
        >
          {/*
            `datetime-local` بلا منطقة زمنيّة، وهو المقصود: الأستاذُ يكتب
            الساعةَ التي يريدها بتوقيته، والمقارنةُ تقع بتوقيت المتصفّح
            نفسِه — فما كُتب هو ما يقع.
          */}
          <input
            type="datetime-local"
            className="inp"
            value={lesson.publishAt ?? ""}
            onChange={(e) => onPatch({ publishAt: e.target.value || undefined })}
          />
        </Field>
        <Field label="المدّة" hint="تظهر على بطاقة الدرس — تُكتب يدوياً.">
          <input
            className="inp"
            value={lesson.duration ?? ""}
            placeholder="١٢:٤٥"
            onChange={(e) => onPatch({ duration: e.target.value || undefined })}
          />
        </Field>
      </div>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/*  ٢ ــ الفيديو                                                       */
/* ------------------------------------------------------------------ */

/** يُبنى رابطُ التشغيل من المزوّد ومعرّفاته — `url` تبقى مصدرَ الحقيقة. */
function buildUrl(provider: "youtube" | "bunny", videoId: string, libraryId?: string): string {
  const v = videoId.trim();
  if (!v) return "";
  if (provider === "youtube") {
    /* يقبل المعرّفَ وحدَه أو رابطاً كاملاً — فلا يُطالَب الأستاذُ بقصّه. */
    const m = v.match(/(?:v=|youtu\.be\/|embed\/|shorts\/)([A-Za-z0-9_-]{11})/);
    return `https://www.youtube.com/watch?v=${m ? m[1] : v}`;
  }
  return `https://iframe.mediadelivery.net/embed/${(libraryId ?? "").trim()}/${v}`;
}

function VideoTab({ lesson, onPatch }: { lesson: Lesson; onPatch: (p: Partial<Lesson>) => void }) {
  const provider = lesson.provider ?? (lesson.url.includes("mediadelivery") ? "bunny" : "youtube");
  const videoId = lesson.videoId ?? "";
  const libraryId = lesson.libraryId ?? "";

  const set = (patch: Partial<Lesson>) => {
    const next = { provider, videoId, libraryId, ...patch };
    onPatch({
      ...patch,
      /* الرابطُ يُعاد بناؤه مع كلّ تغيير — فلا يفترق عمّا في الحقول. */
      url: buildUrl(next.provider!, next.videoId ?? "", next.libraryId),
    });
  };

  return (
    <div className="space-y-3.5">
      {lesson.url ? (
        <p className="rounded-2xl border border-emerald-500/35 bg-emerald-500/[0.07] px-3.5 py-2.5 text-[11px] font-semibold text-emerald-700 dark:text-emerald-400">
          يوجد فيديو حاليّاً — يمكنك استبداله أو حذفه.
        </p>
      ) : (
        <p className="rounded-2xl border border-dashed border-border px-3.5 py-2.5 text-[11px] text-muted-foreground">
          لا فيديوَ لهذا الدرس بعد.
        </p>
      )}

      <Field label="مزوّد الفيديو">
        <select
          className="inp"
          value={provider}
          onChange={(e) => set({ provider: e.target.value as "youtube" | "bunny" })}
        >
          <option value="bunny">Bunny Stream (مفضّل)</option>
          <option value="youtube">YouTube</option>
        </select>
      </Field>

      <div className="grid gap-3 sm:grid-cols-2">
        <Field
          label={provider === "bunny" ? "معرّف الفيديو (Video ID)" : "معرّف الفيديو أو رابطه"}
          hint={provider === "youtube" ? "الصق الرابطَ كاملاً أو المعرّفَ وحدَه — كلاهما يعمل." : undefined}
        >
          <input
            dir="ltr"
            className="inp text-right"
            value={videoId}
            onChange={(e) => set({ videoId: e.target.value })}
            placeholder={provider === "bunny" ? "71f8dbdc-71bb-4a2b-87d7-f22b6aaae684" : "dQw4w9WgXcQ"}
          />
        </Field>

        {/* مكتبةُ Bunny وحدَها — ويوتيوب لا مكتبةَ له، فإظهارُ حقلٍ لا يُملأ حشو */}
        {provider === "bunny" && (
          <Field label="معرّف المكتبة (Library ID)">
            <input
              dir="ltr"
              className="inp text-right"
              value={libraryId}
              onChange={(e) => set({ libraryId: e.target.value })}
              placeholder="718182"
            />
          </Field>
        )}
      </div>

      <Field label="رابط التشغيل المُولَّد" hint="يُبنى من الحقول أعلاه — لا يُكتب يدوياً.">
        <input dir="ltr" readOnly className="inp text-right opacity-70" value={lesson.url} />
      </Field>

      {lesson.url && (
        <button
          type="button"
          onClick={() => onPatch({ url: "", videoId: undefined, libraryId: undefined })}
          className="inline-flex items-center gap-1.5 rounded-xl border border-rose-500/40 px-3 py-1.5 text-[11px] font-bold text-rose-600 transition hover:bg-rose-500/10"
        >
          <ITrash />
          حذف الفيديو
        </button>
      )}
    </div>
  );
}

/* ------------------------------------------------------------------ */
/*  ٣ ــ الواجب                                                        */
/* ------------------------------------------------------------------ */

function QuizTab({
  quiz,
  onSetQuiz,
  results,
}: {
  quiz: Quiz;
  onSetQuiz: (q: Quiz | undefined) => void;
  results?: { attempts: number; avg: number; passed: number };
}) {
  const [draft, setDraft] = useState({ text: "", options: ["", "", "", ""], correct: 0 });
  const up = (patch: Partial<Quiz>) => onSetQuiz({ ...quiz, ...patch });

  const addQuestion = () => {
    const options = draft.options.map((o) => o.trim()).filter(Boolean);
    if (!draft.text.trim() || options.length < 2) return;
    const item: QuizQuestion = {
      id: `Q-${Date.now()}`,
      text: draft.text.trim(),
      options,
      correct: Math.min(draft.correct, options.length - 1),
    };
    up({ enabled: true, questions: [...quiz.questions, item] });
    setDraft({ text: "", options: ["", "", "", ""], correct: 0 });
  };

  return (
    <div className="space-y-3.5">
      <div className="grid gap-3 sm:grid-cols-2">
        <Field label="اسم الواجب">
          <input
            className="inp"
            value={quiz.title ?? ""}
            onChange={(e) => up({ title: e.target.value || undefined })}
            placeholder="مثال: واجب الحديث الأوّل"
          />
        </Field>
        <Field label="نسبة النجاح ٪" hint="من بلغها نجح — والتصحيحُ فوريّ.">
          <input
            type="number"
            min={0}
            max={100}
            className="inp"
            value={quiz.passScore ?? 60}
            onChange={(e) => up({ passScore: Math.max(0, Math.min(100, Number(e.target.value))) })}
          />
        </Field>
      </div>

      <div className="grid gap-3 sm:grid-cols-2">
        <Toggle on={quiz.enabled} onChange={(v) => up({ enabled: v })} label="تفعيل الواجب على الدرس" />
        <Toggle
          on={quiz.published !== false}
          onChange={(v) => up({ published: v })}
          label="منشور للطلاب"
          hint="اكتب أسئلتك على مهلٍ ثمّ انشرها دفعةً واحدة."
        />
      </div>

      {/*
        التصحيحُ الآليّ ليس خياراً يُطفأ: السؤالُ اختياريٌّ من متعدّد،
        وجوابُه الصحيحُ مخزَّنٌ معه — فالنتيجةُ تُحسب لحظةَ التسليم. ويُقال
        هذا صراحةً كي لا يُبحث عن مفتاحٍ لا وجودَ له.
      */}
      <p
        style={{ color: "var(--brand-primary)", background: "color-mix(in srgb, var(--brand-primary) 7%, transparent)" }}
        className="flex items-center gap-2 rounded-2xl px-3.5 py-2.5 text-[11px] font-semibold leading-relaxed"
      >
        <ICheck />
        التصحيحُ آليٌّ — يرى الطالبُ نتيجتَه فورَ التسليم، ويُحفظ له عددُ محاولاته.
      </p>

      {results && results.attempts > 0 && (
        <p className="text-[11px] text-muted-foreground">
          {ar(results.attempts)} محاولة · متوسّط {ar(results.avg)}٪ · ناجح {ar(results.passed)}
        </p>
      )}

      {/* الأسئلة */}
      {quiz.questions.length > 0 && (
        <ul className="space-y-2">
          {quiz.questions.map((q, i) => (
            <li key={q.id} className="rounded-2xl border border-border/70 bg-card p-3">
              <div className="flex items-start gap-2">
                <span
                  style={{ color: "var(--brand-primary)", background: "color-mix(in srgb, var(--brand-primary) 10%, transparent)" }}
                  className="grid size-6 shrink-0 place-items-center rounded-full text-[11px] font-bold"
                >
                  {ar(i + 1)}
                </span>
                <div className="min-w-0 flex-1">
                  <p className="text-[13px] font-semibold">{q.text}</p>
                  <ul className="mt-1.5 flex flex-wrap gap-1.5">
                    {q.options.map((o, k) => (
                      <li
                        key={k}
                        style={
                          k === q.correct
                            ? { color: "var(--brand-primary)", background: "color-mix(in srgb, var(--brand-primary) 12%, transparent)" }
                            : undefined
                        }
                        className={`rounded-full px-2 py-0.5 text-[11px] ${
                          k === q.correct ? "font-bold" : "bg-foreground/[0.05] text-muted-foreground"
                        }`}
                      >
                        {k === q.correct && "✓ "}
                        {o}
                      </li>
                    ))}
                  </ul>
                </div>
                <button
                  type="button"
                  aria-label="حذف السؤال"
                  onClick={() => up({ questions: quiz.questions.filter((x) => x.id !== q.id) })}
                  className="grid size-8 shrink-0 place-items-center rounded-xl border border-border/70 text-muted-foreground transition hover:border-rose-500/50 hover:text-rose-500"
                >
                  <ITrash />
                </button>
              </div>
            </li>
          ))}
        </ul>
      )}

      {/* سؤالٌ جديد */}
      <div className="rounded-2xl border border-dashed border-[color:var(--brand-accent)] p-3.5">
        <p className="mb-2.5 text-[11px] font-bold text-muted-foreground">سؤالٌ جديد</p>

        <Field label="نصّ السؤال">
          <input
            className="inp"
            value={draft.text}
            onChange={(e) => setDraft({ ...draft, text: e.target.value })}
            placeholder="مثال: ما راوي الحديث الأوّل؟"
          />
        </Field>

        <p className="mb-1.5 mt-3 text-[11px] font-semibold text-muted-foreground">
          الاختيارات — اضغط الدائرةَ لتحديد الصحيح
        </p>
        <ul className="space-y-2">
          {draft.options.map((o, i) => (
            <li key={i} className="flex items-center gap-2">
              <button
                type="button"
                role="radio"
                aria-checked={draft.correct === i}
                aria-label={`الاختيار ${ar(i + 1)} صحيح`}
                onClick={() => setDraft({ ...draft, correct: i })}
                style={draft.correct === i ? { borderColor: "var(--brand-primary)", background: "var(--brand-primary)" } : undefined}
                className={`grid size-6 shrink-0 place-items-center rounded-full border-2 transition ${
                  draft.correct === i ? "text-white" : "border-border text-transparent"
                }`}
              >
                <ICheck />
              </button>
              <input
                className="inp flex-1"
                value={o}
                onChange={(e) =>
                  setDraft({ ...draft, options: draft.options.map((v, k) => (k === i ? e.target.value : v)) })
                }
                placeholder={`الاختيار ${ar(i + 1)}`}
              />
            </li>
          ))}
        </ul>

        <button
          type="button"
          onClick={addQuestion}
          style={{ background: "var(--brand-primary)" }}
          className="mt-3 inline-flex items-center gap-1.5 rounded-2xl px-4 py-2 text-[12px] font-bold text-white transition hover:opacity-90"
        >
          <IPlus />
          إضافة السؤال
        </button>
      </div>

      {quiz.questions.length > 0 && (
        <button
          type="button"
          onClick={() => onSetQuiz(undefined)}
          className="inline-flex items-center gap-1.5 text-[11px] font-bold text-rose-500 transition hover:underline"
        >
          <ITrash />
          إزالة الواجب من هذا الدرس
        </button>
      )}
    </div>
  );
}

/* ------------------------------------------------------------------ */
/*  ٤ ــ المرفقات                                                      */
/* ------------------------------------------------------------------ */

/** نوعُ الملفّ من امتداده — يُرسم به رمزٌ ولا يُسأل عنه الأستاذ. */
export function kindOf(nameOrUrl: string): NonNullable<Material["kind"]> {
  const e = (nameOrUrl.split("?")[0].split(".").pop() ?? "").toLowerCase();
  if (e === "pdf") return "pdf";
  if (["doc", "docx", "rtf", "odt"].includes(e)) return "doc";
  if (["ppt", "pptx", "odp", "key"].includes(e)) return "slides";
  return "other";
}

const KIND_LABEL: Record<NonNullable<Material["kind"]>, string> = {
  pdf: "PDF",
  doc: "مستند Word",
  slides: "عرض تقديمي",
  other: "ملف",
};

function FilesTab({ mats, onPatch }: { mats: Material[]; onPatch: (p: Partial<Lesson>) => void }) {
  const set = (next: Material[]) => onPatch({ materials: next.length ? next : undefined });

  return (
    <div className="space-y-3.5">
      <p className="rounded-2xl border border-dashed border-border px-3.5 py-2.5 text-[11px] leading-relaxed text-muted-foreground">
        مذكّرةٌ أو ملزمةٌ أو عرضٌ تقديميّ — PDF أو Word أو PowerPoint. تظهر تحت الدرس
        عند الطالب، ويُعرف نوعُها من امتدادها فلا تُسأل عنه.
      </p>

      {mats.length > 0 && (
        <ul className="space-y-2">
          {mats.map((m, i) => {
            const kind = m.kind ?? kindOf(m.url || m.title);
            return (
              <li key={m.id} className="rounded-2xl border border-border/70 bg-card p-3">
                <div className="mb-2 flex items-center gap-2">
                  <span
                    style={{ color: "var(--brand-primary)", background: "color-mix(in srgb, var(--brand-primary) 10%, transparent)" }}
                    className="grid size-8 shrink-0 place-items-center rounded-xl"
                  >
                    <IDoc />
                  </span>
                  <span className="min-w-0 flex-1 truncate text-[12px] font-bold">
                    {m.title || "بلا اسم"}
                  </span>
                  <span
                    style={{
                      color: "var(--brand-primary)",
                      background: "color-mix(in srgb, var(--brand-accent) 34%, transparent)",
                      boxShadow: "inset 0 0 0 1px color-mix(in srgb, var(--brand-accent) 75%, transparent)",
                    }}
                    className="shrink-0 rounded-full px-2 py-0.5 text-[10px] font-bold"
                  >
                    {KIND_LABEL[kind]}
                  </span>
                  <button
                    type="button"
                    aria-label="حذف المرفق"
                    onClick={() => set(mats.filter((_, k) => k !== i))}
                    className="grid size-8 shrink-0 place-items-center rounded-xl border border-border/70 text-muted-foreground transition hover:border-rose-500/50 hover:text-rose-500"
                  >
                    <ITrash />
                  </button>
                </div>

                <div className="grid gap-2 sm:grid-cols-2">
                  <input
                    className="inp"
                    placeholder="اسم المرفق"
                    value={m.title}
                    onChange={(e) => set(mats.map((v, k) => (k === i ? { ...v, title: e.target.value } : v)))}
                  />
                  <input
                    dir="ltr"
                    className="inp text-right"
                    placeholder="https://…"
                    value={m.url}
                    onChange={(e) =>
                      set(mats.map((v, k) => (k === i ? { ...v, url: e.target.value, kind: kindOf(e.target.value) } : v)))
                    }
                  />
                </div>
              </li>
            );
          })}
        </ul>
      )}

      <button
        type="button"
        /*
          السطرُ يُضاف فارغاً ليُملأ — لكنّه **لا يُحفظ فارغاً**.
          كان الخروجُ قبل ملئه يُبقيه في القاعدة، فتظهر للطالب بطاقةُ ملفٍّ
          بلا اسمٍ ولا رابط، وضغطُها يُنزّل صفحةَ الموقع نفسَها.
          فيُصفّى ما لا رابطَ له عند كلّ كتابة.
        */
        onClick={() => set([...mats.filter((m) => String(m.url ?? "").trim()), { id: `M-${Date.now()}`, title: "", url: "" }])}
        style={{ color: "var(--brand-primary)" }}
        className="flex w-full items-center justify-center gap-1.5 rounded-2xl border border-dashed border-[color:var(--brand-accent)] py-2.5 text-[12px] font-bold transition hover:bg-[color:var(--brand-accent)]/10"
      >
        <IPlus />
        إضافة مرفق
      </button>
    </div>
  );
}
