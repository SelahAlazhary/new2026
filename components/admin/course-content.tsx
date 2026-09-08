"use client";

/**
 * إدارةُ محتوى الكورس — ثلاثةُ مستوياتٍ في مكانٍ واحد.
 * ------------------------------------------------------------------
 * الموادُّ ← دروسُ مادّة ← تعديلُ درس. والانتقالُ بينها **يستبدل المتنَ في
 * موضعه** لا يفتح نافذةً ولا يطوي لوحاً:
 *
 *   • **النافذةُ** تحجب ما تحتها فلا يُعرف أين أنت من الشجرة، وتقفل
 *     تمريرَ الصفحة فيُحبَس المتنُ في صندوقٍ داخل صندوق.
 *   • **الطيُّ** يُبقي إخوةَ المفتوح حوله، فمادّةٌ فيها أربعون درساً
 *     تدفع أخواتِها خارج الشاشة ويضيع موضعُها.
 *
 * والاستبدالُ يحلّ الاثنين: شاشةٌ واحدةٌ في كلّ مرّة، وأثرٌ ظاهرٌ أعلاها
 * يقول أين أنت ويردّك بضغطة.
 *
 * **والأثرُ ليس زينة:** بلا أثرٍ يصير الرجوعُ زرَّ «عودة» واحداً لا يقول
 * إلى أين — ومن نزل ثلاثَ درجاتٍ لا يعرف كم يصعد.
 *
 * **ولا لونَ مثبَّتاً:** كلُّ ما هنا `--brand-primary` و`--brand-accent`
 * وأصنافُ الثيم — فيتبدّل مع الهوية في الفاتح والداكن.
 */

import { useMemo, useState, type ReactNode } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { CourseArt } from "@/components/brand/course-art";
import type { Lesson, Quiz } from "@/lib/utils/types";

/* ============================================================
   الأيقونات — مسارات محضة تأخذ لونَ ما حولها
   ============================================================ */
type IcoProps = { className?: string };
const ico = (d: ReactNode) =>
  function I({ className = "size-4" }: IcoProps) {
    return (
      <svg viewBox="0 0 24 24" className={className} fill="none" stroke="currentColor"
        strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
        {d}
      </svg>
    );
  };

const IcoPlus = ico(<><path d="M12 5v14M5 12h14" /></>);
const IcoBack = ico(<><path d="M5 12h14M12 5l-7 7 7 7" /></>);
const IcoTrash = ico(<><path d="M4 7h16M9 7V5h6v2M6 7l1 13h10l1-13" /></>);
const IcoUp = ico(<path d="M12 19V5M6 11l6-6 6 6" />);
const IcoDown = ico(<path d="M12 5v14M6 13l6 6 6-6" />);
const IcoPlay = ico(<><circle cx="12" cy="12" r="9" /><path d="M10.5 8.5 16 12l-5.5 3.5z" /></>);
const IcoLayers = ico(<><path d="m12 3 9 4.5-9 4.5-9-4.5z" /><path d="m3 12 9 4.5 9-4.5M3 16.5 12 21l9-4.5" /></>);
const IcoFile = ico(<><path d="M14 3H7a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2V8z" /><path d="M14 3v5h5" /></>);

/* ============================================================
   الأنواع
   ============================================================ */
export type ContentUnit = { id: string; title: string; lessons?: Lesson[] };

export type CourseContentProps = {
  courseName: string;
  units: ContentUnit[];
  onAddUnit: () => void;
  onRenameUnit: (uid: string, title: string) => void;
  onRemoveUnit: (uid: string) => void;
  onMoveUnit: (index: number, dir: -1 | 1) => void;
  onMoveLesson: (uid: string, index: number, dir: -1 | 1) => void;
  onMoveLessonTo: (lid: string, uid: string) => void;
  onPatchLesson: (lid: string, patch: Partial<Lesson>) => void;
  onRemoveLesson: (lid: string) => void;
  onSetQuiz: (lid: string, quiz: Quiz | undefined) => void;
  quizStats: (lid: string) => unknown;
  /** محرّرُ الأسئلة — يُمرَّر ليبقى هذا المكوّن حرّاً من تفاصيله. */
  renderQuiz: (lesson: Lesson) => ReactNode;
  /** نموذجُ إضافة الدرس — يُعرض في مستوى الدروس. */
  renderAddLesson: (unitId: string) => ReactNode;
};

const slide = {
  initial: { opacity: 0, x: -18 },
  animate: { opacity: 1, x: 0 },
  exit: { opacity: 0, x: 18 },
  transition: { duration: 0.22, ease: [0.22, 1, 0.36, 1] as const },
};

/* ============================================================
   المكوّن
   ============================================================ */
export function CourseContent(p: CourseContentProps) {
  /*
    موضعان لا ثلاثة: المادّةُ المفتوحةُ والدرسُ المفتوح. والمستوى يُشتقّ
    منهما ولا يُخزَّن — حالةٌ ثالثةٌ تُخزَّن تعني ثلاثَ حالاتٍ يجب أن
    تتّسق، وأوّلُ ما يقع أن تتناقض.
  */
  const [unitId, setUnitId] = useState<string | null>(null);
  const [lessonId, setLessonId] = useState<string | null>(null);

  const unit = useMemo(() => p.units.find((u) => u.id === unitId) ?? null, [p.units, unitId]);
  const lesson = useMemo(
    () => (unit?.lessons ?? []).find((l) => l.id === lessonId) ?? null,
    [unit, lessonId]
  );

  /* المادّةُ إن حُذفت أو الدرسُ إن نُقل، يعود المستوى إلى ما فوقه. */
  const level: 1 | 2 | 3 = lesson ? 3 : unit ? 2 : 1;

  const crumb = (label: string, onClick?: () => void, last = false) => (
    <button
      key={label}
      type="button"
      onClick={onClick}
      disabled={!onClick}
      className={`max-w-[12rem] truncate rounded-xl px-2.5 py-1 text-[11px] font-bold transition ${
        last
          ? "bg-[var(--brand-primary,hsl(var(--primary)))] text-white"
          : "text-muted-foreground hover:bg-muted hover:text-foreground"
      }`}
    >
      {label}
    </button>
  );

  return (
    <div className="grid gap-4">
      {/* ---------- الأثر ---------- */}
      <div className="sticky top-2 z-20 flex flex-wrap items-center gap-1 rounded-2xl border border-border bg-[var(--brand-bg,hsl(var(--background)))]/92 px-2.5 py-2 backdrop-blur">
        {crumb(p.courseName, level > 1 ? () => { setUnitId(null); setLessonId(null); } : undefined, level === 1)}
        {unit && (
          <>
            <span aria-hidden className="text-[var(--brand-accent,hsl(var(--gold)))]">‹</span>
            {crumb(unit.title, level > 2 ? () => setLessonId(null) : undefined, level === 2)}
          </>
        )}
        {lesson && (
          <>
            <span aria-hidden className="text-[var(--brand-accent,hsl(var(--gold)))]">‹</span>
            {crumb(lesson.title, undefined, true)}
          </>
        )}

        <span className="mr-auto flex items-center gap-1.5">
          {level === 1 && (
            <button
              type="button"
              onClick={p.onAddUnit}
              className="inline-flex items-center gap-1.5 rounded-xl bg-[var(--brand-primary,hsl(var(--primary)))] px-3 py-1.5 text-[11px] font-bold text-white"
            >
              <IcoPlus className="size-3.5" /> إضافة مادّة
            </button>
          )}
          {level > 1 && (
            <button
              type="button"
              onClick={() => (level === 3 ? setLessonId(null) : setUnitId(null))}
              className="inline-flex items-center gap-1.5 rounded-xl border border-border px-3 py-1.5 text-[11px] font-bold text-muted-foreground transition hover:border-[var(--brand-primary,hsl(var(--primary)))] hover:text-[var(--brand-primary,hsl(var(--primary)))]"
            >
              <IcoBack className="size-3.5" />
              {level === 3 ? "عودةٌ للدروس" : "عودةٌ للموادّ"}
            </button>
          )}
        </span>
      </div>

      <AnimatePresence mode="wait" initial={false}>
        {/* ==================== ١ ــ الموادّ ==================== */}
        {level === 1 && (
          <motion.div key="units" {...slide} className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
            {p.units.length === 0 && (
              <p className="col-span-full rounded-3xl border border-dashed border-border p-10 text-center text-sm text-muted-foreground">
                لا موادَّ بعد — أضِف أوّلَ مادّة.
              </p>
            )}
            {p.units.map((u, i) => (
              <div key={u.id} className="group overflow-hidden rounded-3xl border border-border bg-card transition hover:border-[var(--brand-primary,hsl(var(--primary)))]/45">
                <button type="button" onClick={() => setUnitId(u.id)} className="relative block w-full text-right">
                  <CourseArt seed={u.id} title={u.title} className="aspect-[16/9] w-full" />
                  <span className="absolute inset-0 grid place-items-center bg-black/25 text-white transition group-hover:bg-black/10">
                    <IcoLayers className="size-7 drop-shadow" />
                  </span>
                </button>
                <div className="grid gap-2 p-3">
                  <input
                    value={u.title}
                    onChange={(e) => p.onRenameUnit(u.id, e.target.value)}
                    className="w-full rounded-xl border border-transparent bg-transparent px-2 py-1 text-sm font-bold outline-none transition hover:border-border focus:border-[var(--brand-primary,hsl(var(--primary)))]/50 focus:bg-background"
                  />
                  <div className="flex items-center gap-1.5">
                    <button
                      type="button"
                      onClick={() => setUnitId(u.id)}
                      className="inline-flex flex-1 items-center justify-center gap-1.5 rounded-2xl bg-[var(--brand-accent,hsl(var(--gold)))]/25 px-3 py-2 text-[11px] font-bold text-[var(--brand-primary,hsl(var(--primary)))]"
                    >
                      <IcoPlay className="size-3.5" />
                      {(u.lessons ?? []).length.toLocaleString("ar-EG")} درساً
                    </button>
                    <button type="button" onClick={() => p.onMoveUnit(i, -1)} disabled={i === 0} title="أعلى"
                      className="grid size-8 place-items-center rounded-2xl border border-border text-muted-foreground transition hover:text-[var(--brand-primary,hsl(var(--primary)))] disabled:opacity-30">
                      <IcoUp className="size-3.5" />
                    </button>
                    <button type="button" onClick={() => p.onMoveUnit(i, 1)} disabled={i === p.units.length - 1} title="أسفل"
                      className="grid size-8 place-items-center rounded-2xl border border-border text-muted-foreground transition hover:text-[var(--brand-primary,hsl(var(--primary)))] disabled:opacity-30">
                      <IcoDown className="size-3.5" />
                    </button>
                    <button type="button" onClick={() => p.onRemoveUnit(u.id)} disabled={p.units.length <= 1}
                      title="حذف المادّة — دروسُها تنتقل إلى ما قبلها ولا تُحذف"
                      className="grid size-8 place-items-center rounded-2xl border border-border text-rose-500 transition hover:border-rose-500 disabled:opacity-30">
                      <IcoTrash className="size-3.5" />
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </motion.div>
        )}

        {/* ==================== ٢ ــ الدروس ==================== */}
        {level === 2 && unit && (
          <motion.div key={`lessons-${unit.id}`} {...slide} className="grid gap-4">
            {p.renderAddLesson(unit.id)}

            {(unit.lessons ?? []).length === 0 ? (
              <p className="rounded-3xl border border-dashed border-border p-10 text-center text-sm text-muted-foreground">
                مادّةٌ فارغة — أضِف أوّلَ درسٍ فيها.
              </p>
            ) : (
              <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
                {(unit.lessons ?? []).map((v, i) => (
                  <div key={v.id} className="group overflow-hidden rounded-3xl border border-border bg-card transition hover:border-[var(--brand-primary,hsl(var(--primary)))]/45">
                    <button type="button" onClick={() => setLessonId(v.id)} className="relative block w-full text-right">
                      <CourseArt seed={v.id} title={v.title} className="aspect-[16/9] w-full" />
                      <span className="absolute inset-0 grid place-items-center bg-black/25 text-white transition group-hover:bg-black/10">
                        <IcoPlay className="size-7 drop-shadow" />
                      </span>
                      <span className="absolute right-2 top-2 flex items-center gap-1.5">
                        {v.isFree && <span className="rounded-full bg-emerald-500 px-2 py-0.5 text-[10px] font-bold text-white">مجاني</span>}
                        {v.duration && <span className="rounded-full bg-black/60 px-2 py-0.5 text-[10px] font-bold text-white">{v.duration}</span>}
                      </span>
                    </button>
                    <div className="grid gap-2 p-3">
                      <p className="truncate text-sm font-bold">
                        {(i + 1).toLocaleString("ar-EG")}. {v.title}
                      </p>
                      <div className="flex items-center gap-1.5">
                        <button type="button" onClick={() => setLessonId(v.id)}
                          className="inline-flex flex-1 items-center justify-center gap-1.5 rounded-2xl bg-[var(--brand-primary,hsl(var(--primary)))] px-3 py-2 text-[11px] font-bold text-white">
                          تعديل الدرس
                        </button>
                        <button type="button" onClick={() => p.onMoveLesson(unit.id, i, -1)} disabled={i === 0} title="أعلى"
                          className="grid size-8 place-items-center rounded-2xl border border-border text-muted-foreground transition hover:text-[var(--brand-primary,hsl(var(--primary)))] disabled:opacity-30">
                          <IcoUp className="size-3.5" />
                        </button>
                        <button type="button" onClick={() => p.onMoveLesson(unit.id, i, 1)} disabled={i === (unit.lessons ?? []).length - 1} title="أسفل"
                          className="grid size-8 place-items-center rounded-2xl border border-border text-muted-foreground transition hover:text-[var(--brand-primary,hsl(var(--primary)))] disabled:opacity-30">
                          <IcoDown className="size-3.5" />
                        </button>
                        <button type="button" onClick={() => p.onRemoveLesson(v.id)} title="حذف"
                          className="grid size-8 place-items-center rounded-2xl border border-border text-rose-500 transition hover:border-rose-500">
                          <IcoTrash className="size-3.5" />
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </motion.div>
        )}

        {/* ==================== ٣ ــ تعديلُ الدرس ==================== */}
        {level === 3 && unit && lesson && (
          <motion.div key={`edit-${lesson.id}`} {...slide} className="grid gap-4">
            <div className="grid gap-4 lg:grid-cols-[18rem_1fr]">
              <div className="overflow-hidden rounded-3xl border border-border">
                <CourseArt seed={lesson.id} title={lesson.title} className="aspect-[16/9] w-full" />
              </div>

              <div className="grid gap-3">
                <label className="block">
                  <span className="mb-1 block text-[11px] font-semibold text-muted-foreground">عنوان الدرس</span>
                  <input defaultValue={lesson.title} className="inp"
                    onBlur={(e) => p.onPatchLesson(lesson.id, { title: e.target.value.trim() || lesson.title })} />
                </label>
                <label className="block">
                  <span className="mb-1 block text-[11px] font-semibold text-muted-foreground">رابط الفيديو</span>
                  <input defaultValue={lesson.url} dir="ltr" className="inp text-right"
                    onBlur={(e) => p.onPatchLesson(lesson.id, { url: e.target.value.trim() || lesson.url })} />
                </label>

                <div className="flex flex-wrap items-end gap-3">
                  <label className="min-w-32 flex-1">
                    <span className="mb-1 block text-[11px] font-semibold text-muted-foreground">المدّة</span>
                    <input defaultValue={lesson.duration ?? ""} placeholder="١٢:٤٥" className="inp"
                      onBlur={(e) => p.onPatchLesson(lesson.id, { duration: e.target.value.trim() || undefined })} />
                  </label>
                  <label className="flex items-center gap-2 rounded-2xl border border-border px-3.5 py-2.5 text-xs font-bold">
                    <input type="checkbox" checked={Boolean(lesson.isFree)}
                      onChange={(e) => p.onPatchLesson(lesson.id, { isFree: e.target.checked })}
                      className="size-4 accent-[var(--brand-primary,hsl(var(--primary)))]" />
                    درسٌ مجانيّ
                  </label>
                  {p.units.length > 1 && (
                    <label className="min-w-40">
                      <span className="mb-1 block text-[11px] font-semibold text-muted-foreground">المادّة</span>
                      <select value={unit.id} className="inp"
                        onChange={(e) => { p.onMoveLessonTo(lesson.id, e.target.value); setUnitId(e.target.value); }}>
                        {p.units.map((u) => <option key={u.id} value={u.id}>{u.title}</option>)}
                      </select>
                    </label>
                  )}
                </div>

                <p className="text-[10px] leading-relaxed text-muted-foreground">
                  الحقولُ تُحفظ عند مغادرتها — لا زرَّ حفظٍ يُنسى فتضيع الكتابة، ولا حفظاً مع كلّ
                  حرفٍ يكتب على القاعدة عشراتِ المرّات في الجملة الواحدة.
                </p>

                <button type="button" onClick={() => { p.onRemoveLesson(lesson.id); setLessonId(null); }}
                  className="inline-flex w-fit items-center gap-1.5 rounded-2xl border border-border px-3.5 py-2.5 text-xs font-bold text-rose-500 transition hover:border-rose-500">
                  <IcoTrash className="size-4" /> حذف الدرس
                </button>
              </div>
            </div>

            {/* أسئلةُ الدرس */}
            <div className="rounded-3xl border border-border p-3 sm:p-4">
              <p className="font-display mb-1 flex items-center gap-2 text-sm font-bold">
                <IcoFile className="size-4 text-[var(--brand-accent,hsl(var(--gold)))]" /> أسئلةُ الدرس
              </p>
              <p className="mb-3 text-[11px] leading-relaxed text-muted-foreground">
                تُعرض على الطالب بعد المشاهدة وتُصحَّح فوراً. والدرسُ بلا سؤالٍ يُشاهَد ولا يُتقَن.
              </p>
              {p.renderQuiz(lesson)}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
