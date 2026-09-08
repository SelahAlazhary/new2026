"use client";

/**
 * شجرةُ المنهج — الوحداتُ ودروسُها في لوحٍ واحد.
 * ------------------------------------------------------------------
 * كانت إدارةُ الكورس ثلاثةَ أقسامٍ متجاورة: «إضافة درس» و«مواد الكورس
 * ودروسها» و«ملفات الكورس». وثلاثتُها شيءٌ واحدٌ مقطَّع: من أراد درساً
 * جديداً في المادّة الثالثة نزل إلى قسمٍ فوق، واختار المادّةَ من قائمةٍ
 * لا يراها وهو ينظر إليها، ثمّ عاد ليتأكّد أنّه أضافها في موضعها.
 *
 * فصارت **شجرةً واحدة**: الوحدةُ لوحٌ يُفتح فتظهر دروسُه، والإضافةُ في
 * ذيل الوحدة نفسِها فلا تُسأل «في أيّ مادّة؟» — الجوابُ أنّك فيها.
 * والدرسُ يُدار في موضعه فينفتح تحته لا في نافذةٍ تحجب ما حوله.
 *
 * **ولا نافذةَ عائمةً ولا لوحَ جانبيّ**: كلُّ شيءٍ في متن الصفحة، فيُقرأ
 * الترتيبُ كما يقرؤه الطالبُ آخرَ الأمر.
 *
 * والألوانُ من متغيّرات العلامة وحدَها (`--brand-primary` و
 * `--brand-accent`)، والأيقوناتُ رسومٌ داخليّةٌ بـ`currentColor` — فتتبع
 * السِّمةَ الفاتحةَ والداكنةَ بلا نسخةٍ ثانية.
 */

import { useMemo, useRef, useState, type ReactNode } from "react";
import { AnimatePresence, motion } from "framer-motion";
import type { Lesson, Quiz } from "@/lib/utils/types";
import { LessonManager } from "./lesson-manager";

export type CurriculumUnit = { id: string; title: string; lessons?: Lesson[] };

type Props = {
  /** اسمُ الكورس — يُذكر في الفراغ حين لا وحدةَ بعد. */
  courseName: string;
  units: CurriculumUnit[];

  onAddUnit: () => void;
  onRenameUnit: (uid: string, title: string) => void;
  onRemoveUnit: (uid: string) => void;
  /** نقلُ وحدةٍ من موضعٍ إلى موضع — للسحب وللسهمين معاً. */
  onReorderUnit: (from: number, to: number) => void;

  onReorderLesson: (uid: string, from: number, to: number) => void;
  /** نقلُ درسٍ إلى وحدةٍ أخرى — سحباً أو اختياراً. */
  onMoveLessonTo: (lid: string, uid: string) => void;
  onPatchLesson: (lid: string, patch: Partial<Lesson>) => void;
  onDuplicateLesson: (lid: string) => void;
  onRemoveLesson: (lid: string) => void;
  onSetQuiz: (lid: string, quiz: Quiz | undefined) => void;

  /** إحصاءُ محاولات الواجب — يُعرض في لسانه إن وُجد. */
  quizResults?: (lid: string) => { attempts: number; avg: number; passed: number };
  /** نموذجُ إضافة درسٍ إلى وحدةٍ بعينها. */
  renderAddLesson: (unitId: string) => ReactNode;
  /** لسانُ «الإعدادات» — ملفّاتُ الكورس وما إليها. */
  renderSettings?: ReactNode;
};

/* ------------------------------------------------------------------ */
/*  الأيقونات — رسومٌ داخليّةٌ تأخذ لونَها من النصّ                       */
/* ------------------------------------------------------------------ */

/**
 * مصنعُ الأيقونات.
 * كلُّها مقاسٌ واحدٌ (24) وحدٌّ واحد، فلا تختلف ثخانةُ الخطّ من أيقونةٍ
 * إلى جارتها — وهو أوّلُ ما يُفسد صفَّ أزرارٍ صغيرة.
 */
function ico(path: ReactNode, opts?: { fill?: boolean }) {
  return function Ico({ className = "size-4" }: { className?: string }) {
    return (
      <svg
        viewBox="0 0 24 24"
        className={className}
        fill={opts?.fill ? "currentColor" : "none"}
        stroke={opts?.fill ? "none" : "currentColor"}
        strokeWidth="1.75"
        strokeLinecap="round"
        strokeLinejoin="round"
        aria-hidden="true"
      >
        {path}
      </svg>
    );
  };
}

const IChevron = ico(<path d="M6 9l6 6 6-6" />);
const IPencil = ico(
  <>
    <path d="M4 20h4L19 9a2.1 2.1 0 0 0-3-3L5 17v3z" />
    <path d="M14.5 6.5l3 3" />
  </>
);
const ITrash = ico(
  <>
    <path d="M4 7h16" />
    <path d="M9 7V5.5A1.5 1.5 0 0 1 10.5 4h3A1.5 1.5 0 0 1 15 5.5V7" />
    <path d="M6.5 7l.8 11.2A2 2 0 0 0 9.3 20h5.4a2 2 0 0 0 2-1.8L17.5 7" />
    <path d="M10.5 11v5M13.5 11v5" />
  </>
);
const IPlus = ico(<path d="M12 5v14M5 12h14" />);
const ICopy = ico(
  <>
    <rect x="9" y="9" width="11" height="11" rx="2.5" />
    <path d="M15 5.5A1.5 1.5 0 0 0 13.5 4h-7A2.5 2.5 0 0 0 4 6.5v7A1.5 1.5 0 0 0 5.5 15" />
  </>
);
const ISliders = ico(
  <>
    <path d="M5 6h14M5 12h14M5 18h14" />
    <circle cx="9" cy="6" r="2" />
    <circle cx="15" cy="12" r="2" />
    <circle cx="8" cy="18" r="2" />
  </>
);
const ICheck = ico(<path d="M4.5 12.5l5 5 10-11" />);
const IX = ico(<path d="M6 6l12 12M18 6L6 18" />);
const IVideo = ico(
  <>
    <rect x="3" y="6" width="13" height="12" rx="2.5" />
    <path d="M16 10.5l5-2.5v8l-5-2.5z" />
  </>
);
const IPaper = ico(
  <>
    <path d="M6 3h7l5 5v13a1 1 0 0 1-1 1H6a1 1 0 0 1-1-1V4a1 1 0 0 1 1-1z" />
    <path d="M13 3v5h5" />
  </>
);
const IQuiz = ico(
  <>
    <rect x="4" y="3" width="16" height="18" rx="2.5" />
    <path d="M9 8h6M9 12h6M9 16h3" />
  </>
);
const IStack = ico(
  <>
    <path d="M12 3l9 4.5-9 4.5-9-4.5L12 3z" />
    <path d="M3 12l9 4.5L21 12" />
    <path d="M3 16.5L12 21l9-4.5" />
  </>
);
const IClock = ico(
  <>
    <circle cx="12" cy="12" r="8.5" />
    <path d="M12 7.5V12l3 1.8" />
  </>
);

/** مقبضُ السحب — ستُّ نقاطٍ، وهي العلامةُ المتعارفة. */
function IGrip({ className = "size-4" }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" className={className} fill="currentColor" aria-hidden="true">
      {[8, 12, 16].map((y) =>
        [9, 15].map((x) => <circle key={`${x}-${y}`} cx={x} cy={y} r="1.35" />)
      )}
    </svg>
  );
}

/* ------------------------------------------------------------------ */
/*  قِطعٌ صغيرة                                                        */
/* ------------------------------------------------------------------ */

/**
 * شارةُ نوع.
 * `tone="gold"` للذهبيّ و`"navy"` للأساس — واللونان من متغيّرات العلامة،
 * فلا يُكتب لونٌ صريحٌ ينكسر عند تبديل السِّمة.
 */
function Pill({
  tone = "navy",
  icon,
  children,
}: {
  tone?: "navy" | "gold" | "muted";
  icon?: ReactNode;
  children: ReactNode;
}) {
  /*
    الذهبيُّ أرضٌ لا حبر. `--brand-accent` لونٌ فاتحٌ (‏#e5caa5‏)، وكتابتُه
    نصّاً على تشبُّعٍ منه تعطي تبايناً ١٫٥:١ — أي نصّاً لا يُقرأ. فالذهبيُّ
    خلفيّةٌ وحدٌّ، والحبرُ من الأساس دائماً، فتبقى الشارةُ دافئةَ الهويّة
    مقروءةً في السِّمتين.
  */
  const style =
    tone === "gold"
      ? {
          color: "var(--brand-primary)",
          background: "color-mix(in srgb, var(--brand-accent) 34%, transparent)",
          boxShadow: "inset 0 0 0 1px color-mix(in srgb, var(--brand-accent) 75%, transparent)",
        }
      : tone === "navy"
      ? { color: "var(--brand-primary)", background: "color-mix(in srgb, var(--brand-primary) 10%, transparent)" }
      : undefined;

  return (
    <span
      style={style}
      className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-bold leading-none ${
        tone === "muted" ? "bg-foreground/[0.06] text-muted-foreground" : ""
      }`}
    >
      {icon}
      {children}
    </span>
  );
}

/** زرُّ أيقونةٍ صغير — الهدفُ اللمسيُّ ٣٢px ولو كان الرسمُ ١٦px. */
function IconBtn({
  title,
  onClick,
  danger,
  children,
}: {
  title: string;
  onClick: () => void;
  danger?: boolean;
  children: ReactNode;
}) {
  return (
    <button
      type="button"
      title={title}
      aria-label={title}
      onClick={onClick}
      className={`grid size-8 shrink-0 place-items-center rounded-xl border border-border/70 bg-card/60 text-muted-foreground transition hover:border-current ${
        danger ? "hover:text-rose-500" : "hover:text-[var(--brand-primary)]"
      }`}
    >
      {children}
    </button>
  );
}

/** عدَدٌ عربيٌّ بالأرقام الهنديّة — المنصّةُ كلُّها عليها. */
function num(n: number): string {
  return n.toLocaleString("ar-EG");
}

/* ------------------------------------------------------------------ */
/*  المكوّن                                                            */
/* ------------------------------------------------------------------ */

export function Curriculum({
  courseName,
  units,
  onAddUnit,
  onRenameUnit,
  onRemoveUnit,
  onReorderUnit,
  onReorderLesson,
  onMoveLessonTo,
  onPatchLesson,
  onDuplicateLesson,
  onRemoveLesson,
  onSetQuiz,
  quizResults,
  renderAddLesson,
  renderSettings,
}: Props) {
  const [tab, setTab] = useState<"curriculum" | "settings">("curriculum");

  /* الوحداتُ المفتوحة — أكثرُ من واحدةٍ تُفتح معاً، فالمقارنةُ بينها مقصودة */
  const [open, setOpen] = useState<Set<string>>(() => new Set(units[0] ? [units[0].id] : []));
  const [renaming, setRenaming] = useState<string | null>(null);
  const [draft, setDraft] = useState("");
  const [managing, setManaging] = useState<string | null>(null);
  const [adding, setAdding] = useState<string | null>(null);

  /*
    السحبُ يُمسك في مرجعٍ لا في حالة: تغييرُ الحالة في `dragover` يُعيد
    الرسمَ عشراتِ المرّات في الثانية فيتقطّع السحب. ولا يُعرض منه إلّا
    الهدفُ الحاليّ، وهو وحدَه في حالة.
  */
  const dragUnit = useRef<number | null>(null);
  const dragLesson = useRef<{ uid: string; index: number; lid: string } | null>(null);
  const [overUnit, setOverUnit] = useState<number | null>(null);
  const [overLesson, setOverLesson] = useState<string | null>(null);

  const stats = useMemo(() => {
    const lessons = units.reduce((n, u) => n + (u.lessons?.length ?? 0), 0);
    return { units: units.length, lessons };
  }, [units]);

  const toggle = (id: string) =>
    setOpen((s) => {
      const next = new Set(s);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });

  const startRename = (u: CurriculumUnit) => {
    setRenaming(u.id);
    setDraft(u.title);
  };

  const commitRename = () => {
    if (renaming && draft.trim()) onRenameUnit(renaming, draft.trim());
    setRenaming(null);
  };

  /* ---------------- الشريطُ العلويّ ---------------- */

  const header = (
    <div className="mb-5 flex flex-wrap items-center justify-between gap-3">
      <div className="flex flex-wrap items-center gap-3">
        {/* لسانان لا أكثر — والمنهجُ هو الأصل */}
        <div className="inline-flex rounded-2xl border border-border bg-card p-1">
          {(
            [
              { id: "curriculum" as const, label: "المنهج" },
              { id: "settings" as const, label: "الإعدادات" },
            ]
          ).map((t) => {
            const on = tab === t.id;
            return (
              <button
                key={t.id}
                type="button"
                onClick={() => setTab(t.id)}
                aria-pressed={on}
                style={on ? { background: "var(--brand-primary)" } : undefined}
                className={`rounded-xl px-4 py-2 text-xs font-bold transition ${
                  on ? "text-white shadow-sm" : "text-muted-foreground hover:text-foreground"
                }`}
              >
                {t.label}
              </button>
            );
          })}
        </div>

        <span
          style={{
            color: "var(--brand-primary)",
            background: "color-mix(in srgb, var(--brand-primary) 8%, transparent)",
          }}
          className="inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 text-[11px] font-bold"
        >
          <IStack className="size-3.5" />
          {num(stats.units)} وحدة • {num(stats.lessons)} درس
        </span>
      </div>

      <button
        type="button"
        onClick={onAddUnit}
        style={{ background: "var(--brand-primary)" }}
        className="inline-flex items-center gap-1.5 rounded-2xl px-4 py-2.5 text-xs font-bold text-white transition hover:opacity-90"
      >
        <IPlus className="size-4" />
        إضافة وحدة
      </button>
    </div>
  );

  if (tab === "settings") {
    return (
      <div>
        {header}
        {renderSettings ?? (
          <p className="rounded-2xl border border-dashed border-border p-8 text-center text-[13px] text-muted-foreground">
            لا إعداداتٍ لهذا الكورس بعد.
          </p>
        )}
      </div>
    );
  }

  /* ---------------- درسٌ واحد ---------------- */

  const lessonRow = (u: CurriculumUnit, l: Lesson, i: number) => {
    const isManaging = managing === l.id;
    const mats = l.materials?.length ?? 0;
    const qs = l.quiz?.questions?.length ?? 0;

    return (
      <li key={l.id}>
        <div
          draggable
          onDragStart={() => {
            dragLesson.current = { uid: u.id, index: i, lid: l.id };
          }}
          onDragEnd={() => {
            dragLesson.current = null;
            setOverLesson(null);
          }}
          onDragOver={(e) => {
            if (!dragLesson.current) return;
            e.preventDefault();
            setOverLesson(l.id);
          }}
          onDragLeave={() => setOverLesson((v) => (v === l.id ? null : v))}
          onDrop={(e) => {
            e.preventDefault();
            const d = dragLesson.current;
            setOverLesson(null);
            if (!d || d.lid === l.id) return;
            /* داخلَ الوحدة ترتيبٌ، وبين وحدتين نقلٌ — والفرقُ في المصدر لا في الهدف */
            if (d.uid === u.id) onReorderLesson(u.id, d.index, i);
            else onMoveLessonTo(d.lid, u.id);
            dragLesson.current = null;
          }}
          style={
            overLesson === l.id
              ? { borderColor: "var(--brand-primary)", background: "color-mix(in srgb, var(--brand-primary) 5%, var(--brand-bg))" }
              : undefined
          }
          className="group flex items-center gap-2.5 rounded-2xl border border-border/60 bg-card px-3 py-2.5 transition hover:border-[color:var(--brand-accent)] hover:shadow-sm"
        >
          {/* المقبضُ في جهة البداية — واليمينُ هي البدايةُ في العربيّة */}
          <span className="cursor-grab text-muted-foreground/50 transition group-hover:text-[var(--brand-accent)] active:cursor-grabbing">
            <IGrip className="size-4" />
          </span>

          <div className="min-w-0 flex-1">
            <p className="truncate text-[13px] font-bold">{l.title}</p>
            <div className="mt-1 flex flex-wrap items-center gap-1.5">
              {l.url && (
                <Pill tone="navy" icon={<IVideo className="size-3" />}>
                  فيديو
                </Pill>
              )}
              {qs > 0 && (
                <Pill tone="gold" icon={<IQuiz className="size-3" />}>
                  واجب {num(qs)}
                </Pill>
              )}
              {mats > 0 && (
                <Pill tone="muted" icon={<IPaper className="size-3" />}>
                  مرفق {num(mats)}
                </Pill>
              )}
              {l.duration && (
                <Pill tone="muted" icon={<IClock className="size-3" />}>
                  {l.duration}
                </Pill>
              )}
              {l.isFree && <Pill tone="gold">مجانيّ</Pill>}
            </div>
          </div>

          {/* الأفعالُ في جهة النهاية — يسارُ الشاشة في العربيّة */}
          <div className="flex shrink-0 items-center gap-1.5">
            <button
              type="button"
              onClick={() => setManaging(isManaging ? null : l.id)}
              aria-expanded={isManaging}
              style={
                isManaging
                  ? { background: "var(--brand-primary)", borderColor: "var(--brand-primary)" }
                  : undefined
              }
              className={`inline-flex items-center gap-1.5 rounded-xl border border-border/70 px-2.5 py-1.5 text-[11px] font-bold transition ${
                isManaging ? "text-white" : "text-muted-foreground hover:text-[var(--brand-primary)]"
              }`}
            >
              <ISliders className="size-3.5" />
              إدارة
            </button>
            <IconBtn title="نسخ الدرس" onClick={() => onDuplicateLesson(l.id)}>
              <ICopy className="size-4" />
            </IconBtn>
            <IconBtn title="حذف الدرس" danger onClick={() => onRemoveLesson(l.id)}>
              <ITrash className="size-4" />
            </IconBtn>
          </div>
        </div>

        {/* لوحُ الإدارة ينفتح تحت الدرس نفسِه — لا نافذةَ تحجب ما حوله */}
        <AnimatePresence initial={false}>
          {isManaging && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: "auto", opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              transition={{ duration: 0.24, ease: [0.22, 1, 0.36, 1] }}
              className="overflow-hidden"
            >
              <div className="mt-2 rounded-2xl border border-[color:var(--brand-accent)] bg-[color:var(--brand-bg)] p-4">
                {lessonEditor(u, l)}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </li>
    );
  };

  /* ---------------- لوحُ إدارة الدرس ---------------- */

  /*
    المحرّرُ لم يعد هنا.
    ------------------------------------------------------------------
    كان عموداً واحداً: العنوانُ والرابطُ والمدّةُ والمرفقاتُ والأسئلةُ فوق
    بعضها. وهي أعمالٌ أربعةٌ لا عملٌ واحد — من جاء ليكتب سؤالاً مرّ على
    حقول الفيديو. فصار `LessonManager` بألسنته الأربعة، والشجرةُ تكتفي
    بأن تفتحه في موضع الدرس.
  */
  const lessonEditor = (u: CurriculumUnit, l: Lesson) => (
    <LessonManager
      lesson={l}
      units={units.map((x) => ({ id: x.id, title: x.title }))}
      unitId={u.id}
      onPatch={(patch) => onPatchLesson(l.id, patch)}
      onMoveTo={(uid) => onMoveLessonTo(l.id, uid)}
      onSetQuiz={(q) => onSetQuiz(l.id, q)}
      results={quizResults?.(l.id)}
    />
  );

  /* ---------------- وحدةٌ واحدة ---------------- */

  const unitCard = (u: CurriculumUnit, i: number) => {
    const lessons = u.lessons ?? [];
    const isOpen = open.has(u.id);
    const isRenaming = renaming === u.id;

    return (
      <li
        key={u.id}
        draggable={!isRenaming}
        onDragStart={(e) => {
          if (dragLesson.current) return; /* سحبُ درسٍ لا يجرّ وحدتَه معه */
          e.stopPropagation();
          dragUnit.current = i;
        }}
        onDragEnd={() => {
          dragUnit.current = null;
          setOverUnit(null);
        }}
        onDragOver={(e) => {
          if (dragUnit.current === null) return;
          e.preventDefault();
          setOverUnit(i);
        }}
        onDragLeave={() => setOverUnit((v) => (v === i ? null : v))}
        onDrop={(e) => {
          const from = dragUnit.current;
          setOverUnit(null);
          if (from === null || from === i) return;
          e.preventDefault();
          e.stopPropagation();
          onReorderUnit(from, i);
          dragUnit.current = null;
        }}
        style={
          overUnit === i
            ? { borderColor: "var(--brand-primary)" }
            : { borderColor: "color-mix(in srgb, var(--brand-accent) 55%, transparent)" }
        }
        className="overflow-hidden rounded-3xl border bg-[color:var(--brand-bg)] shadow-sm transition"
      >
        {/* ترويسةُ الوحدة */}
        <div className="flex items-center gap-2.5 px-4 py-3.5">
          <span className="cursor-grab text-muted-foreground/50 transition hover:text-[var(--brand-accent)] active:cursor-grabbing">
            <IGrip className="size-4" />
          </span>

          {isRenaming ? (
            <input
              autoFocus
              className="inp flex-1"
              value={draft}
              onChange={(e) => setDraft(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter") commitRename();
                if (e.key === "Escape") setRenaming(null);
              }}
            />
          ) : (
            <button
              type="button"
              onClick={() => toggle(u.id)}
              className="flex min-w-0 flex-1 items-center gap-2.5 text-right"
            >
              <span className="truncate font-display text-[15px] font-extrabold">{u.title}</span>
              <Pill tone="gold">{num(lessons.length)} دروس</Pill>
            </button>
          )}

          <div className="flex shrink-0 items-center gap-1.5">
            {isRenaming ? (
              <>
                <IconBtn title="حفظ الاسم" onClick={commitRename}>
                  <ICheck className="size-4" />
                </IconBtn>
                <IconBtn title="إلغاء" onClick={() => setRenaming(null)}>
                  <IX className="size-4" />
                </IconBtn>
              </>
            ) : (
              <>
                <IconBtn title={isOpen ? "طيّ الوحدة" : "فتح الوحدة"} onClick={() => toggle(u.id)}>
                  <motion.span
                    animate={{ rotate: isOpen ? 180 : 0 }}
                    transition={{ duration: 0.2 }}
                    className="grid place-items-center"
                  >
                    <IChevron className="size-4" />
                  </motion.span>
                </IconBtn>
                <IconBtn title="تعديل الاسم" onClick={() => startRename(u)}>
                  <IPencil className="size-4" />
                </IconBtn>
                <IconBtn title="حذف الوحدة" danger onClick={() => onRemoveUnit(u.id)}>
                  <ITrash className="size-4" />
                </IconBtn>
              </>
            )}
          </div>
        </div>

        {/* الدروسُ ونموذجُ الإضافة */}
        <AnimatePresence initial={false}>
          {isOpen && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: "auto", opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              transition={{ duration: 0.26, ease: [0.22, 1, 0.36, 1] }}
              className="overflow-hidden"
            >
              <div className="border-t border-border/50 px-4 pb-4 pt-3">
                {lessons.length === 0 ? (
                  <p className="rounded-2xl border border-dashed border-border px-4 py-5 text-center text-[12px] text-muted-foreground">
                    لا دروسَ في هذه الوحدة بعد.
                  </p>
                ) : (
                  <ul className="space-y-2">{lessons.map((l, k) => lessonRow(u, l, k))}</ul>
                )}

                {/* الإضافةُ في ذيل الوحدة — فلا يُسأل «في أيّ وحدة؟» */}
                <div className="mt-3">
                  {adding === u.id ? (
                    <div className="rounded-2xl border border-[color:var(--brand-accent)] p-3">
                      <div className="mb-2 flex items-center justify-between">
                        <p className="text-[11px] font-bold text-muted-foreground">درسٌ جديد في «{u.title}»</p>
                        <IconBtn title="إغلاق" onClick={() => setAdding(null)}>
                          <IX className="size-4" />
                        </IconBtn>
                      </div>
                      {renderAddLesson(u.id)}
                    </div>
                  ) : (
                    <button
                      type="button"
                      onClick={() => setAdding(u.id)}
                      style={{ color: "var(--brand-primary)" }}
                      className="flex w-full items-center justify-center gap-1.5 rounded-2xl border border-dashed border-[color:var(--brand-accent)] py-2.5 text-[12px] font-bold transition hover:bg-[color:var(--brand-accent)]/10"
                    >
                      <IPlus className="size-4" />
                      إضافة درس
                    </button>
                  )}
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </li>
    );
  };

  /* ---------------- الشجرة ---------------- */

  return (
    <div>
      {header}

      {units.length === 0 ? (
        <div className="rounded-3xl border border-dashed border-border p-10 text-center">
          <span
            style={{ color: "var(--brand-primary)", background: "color-mix(in srgb, var(--brand-primary) 8%, transparent)" }}
            className="mx-auto mb-3 grid size-12 place-items-center rounded-full"
          >
            <IStack className="size-6" />
          </span>
          <p className="font-display mb-1 font-bold">لا وحداتٍ في «{courseName}» بعد</p>
          <p className="mb-4 text-[12px] text-muted-foreground">
            الوحدةُ بابٌ أو شهر، وفيها دروسُه. ابدأ بواحدةٍ ثمّ أضِف دروسَها.
          </p>
          <button
            type="button"
            onClick={onAddUnit}
            style={{ background: "var(--brand-primary)" }}
            className="inline-flex items-center gap-1.5 rounded-2xl px-5 py-2.5 text-xs font-bold text-white transition hover:opacity-90"
          >
            <IPlus className="size-4" />
            إضافة وحدة
          </button>
        </div>
      ) : (
        <ul className="space-y-3">{units.map((u, i) => unitCard(u, i))}</ul>
      )}
    </div>
  );
}
