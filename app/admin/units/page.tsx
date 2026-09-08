"use client";

/**
 * الموادّ — القسمُ الجامع.
 * ------------------------------------------------------------------
 * الموادُّ تُدار من داخل كلّ كورسٍ على حدة، وذلك يكفي لمن يبني كورساً
 * واحداً. أمّا من عنده كورساتٌ كثيرةٌ فلا يرى بنيةَ المنهج أبداً: لا يعرف
 * أيُّ كورسٍ قُسِّم وأيُّه ما زال قائمةً مسطّحة، ولا أين تتراكم الدروسُ بلا
 * باب. فهذا يعرض **الشجرةَ كلَّها في شاشةٍ واحدة**.
 *
 * والمسار: **الكورس ← مادّة ← دروس.** فالمادّةُ لا توجد إلّا داخل كورس،
 * وربطُها به هو أن تُنشأ فيه — ولذلك يُختار الكورسُ أوّلاً.
 *
 * ------------------------------------------------------------------
 * **وأربعةُ أعطالٍ كانت فيه، هذه علاجُها:**
 *
 * ١ ــ **الإضافةُ كانت زرّاً أعمى**: يُنشئ «المادّة ٢» باسمٍ مؤقّتٍ ثمّ
 *      تُعاد تسميتُها. فصارت نموذجاً يُكتب فيه الاسمُ والوصفُ والموضعُ قبل
 *      الإنشاء — ويقبل **قائمةً كاملة**: المنهجُ يُكتب سطراً سطراً
 *      (الطهارة · الصلاة · الزكاة) فتُنشأ مرّةً واحدةً مرتَّبة، وهي
 *      الطريقةُ التي يُدخل بها الأستاذُ منهجَه فعلاً.
 *
 * ٢ ــ **التسميةُ كانت تكتب في القاعدة مع كلّ حرف** (`onChange` يحفظ):
 *      اسمٌ من عشرين حرفاً = عشرون كتابةً. فصار الحفظُ عند مغادرة الحقل.
 *
 * ٣ ــ **`desc` كان في النوع ولا يُحرَّر**: الطالبُ يراه على بطاقة المادّة،
 *      والأستاذُ لا يجد أين يكتبه.
 *
 * ٤ ــ **الحذفُ بلا تأكيد**: يمحو المادّةَ ويضمّ دروسَها إلى ما قبلها في
 *      نقرةٍ واحدة، ولا يُقال له أين ذهبت. فصار يسأل ويُخبر.
 *
 * **والكتابةُ من `withUnits`** — هي نفسُها في محرّر الكورس وفي «كلّ
 * الدروس»، فلا تفترق الحقولُ الثلاثة (`units` · `videos` · `lessons`).
 */

import { useMemo, useState } from "react";
import Link from "next/link";
import {
  Search, Plus, Trash2, ChevronUp, ChevronDown, ListVideo, Layers,
  AlertTriangle, Check, X, BookOpen,
} from "lucide-react";
import { PageHeader } from "@/components/dashboard/ui";
import { Button } from "@/components/ui/primitives";
import { Section } from "@/components/dashboard/section";
import { useContent } from "@/components/content/content-provider";
import { courseUnits, withUnits, lessonCount, LEGACY_UNIT_ID } from "@/lib/business/course-units";
import type { Subject, Unit } from "@/lib/utils/types";

const ar = (n: number) => n.toLocaleString("ar-EG");
const inp = "w-full rounded-2xl border border-border bg-card/60 px-3 py-2.5 text-sm outline-none focus:border-primary/50";

export default function AdminUnits() {
  const { db, save } = useContent();
  const subjects = useMemo(() => db?.subjects ?? [], [db]);

  const [q, setQ] = useState("");
  const [only, setOnly] = useState<"all" | "split" | "flat" | "empty">("all");

  /* نموذجُ الإضافة */
  const [target, setTarget] = useState("");
  const [names, setNames] = useState("");
  const [desc, setDesc] = useState("");
  const [where, setWhere] = useState<"end" | "start">("end");

  /* تأكيدُ الحذف — معرّفُ المادّة المطلوب حذفُها */
  const [confirming, setConfirming] = useState<string | null>(null);

  const totalUnits = subjects.reduce((n, s) => n + courseUnits(s).length, 0);
  const splitCount = subjects.filter((s) => s.units?.length).length;
  const emptyUnits = subjects.reduce((n, s) => n + courseUnits(s).filter((u) => (u.lessons ?? []).length === 0).length, 0);

  const rows = subjects.filter((s) => {
    if (q && !s.name.includes(q) && !s.grade.includes(q)) return false;
    const split = Boolean(s.units?.length);
    if (only === "split") return split;
    if (only === "flat") return !split;
    if (only === "empty") return courseUnits(s).some((u) => (u.lessons ?? []).length === 0);
    return true;
  });

  const write = (course: Subject, next: Unit[]) =>
    save({ subjects: subjects.map((s) => (s.id === course.id ? withUnits(course, next) : s)) });

  /**
   * إنشاءُ موادَّ من قائمةِ أسماء.
   *
   * **وأوّلُ إضافةٍ تُثبّت المادّةَ الملفوفة.** الكورسُ غيرُ المقسَّم له
   * مادّةٌ واحدةٌ معرّفُها `u-legacy` تُبنى في القراءة لا في القاعدة؛ ولو
   * أُضيفت إليها ثانيةٌ وبقي معرّفُها لظنّ المُخزِّنُ الكورسَ غيرَ مقسَّمٍ
   * وكتبه مسطّحاً — فتضيع الثانيةُ فورَ إنشائها.
   */
  const create = () => {
    const course = subjects.find((s) => s.id === target);
    if (!course) return;
    const list = names.split("\n").map((x) => x.trim()).filter(Boolean);
    if (list.length === 0) return;

    const units = courseUnits(course);
    const base =
      units[0]?.id === LEGACY_UNIT_ID
        ? [{ ...units[0], id: `u${Date.now().toString(36)}`, title: units[0].title || "المادّة الأولى" }]
        : units;

    const made: Unit[] = list.map((title, i) => ({
      id: `u${Date.now().toString(36)}${i}`,
      title,
      /* الوصفُ للأولى وحدَها حين تُنشأ عدّة: وصفٌ واحدٌ يُكرَّر على خمسٍ
         ليس وصفاً. */
      desc: i === 0 && desc.trim() ? desc.trim() : undefined,
      lessons: [],
    }));

    write(course, where === "start" ? [...made, ...base] : [...base, ...made]);
    setNames("");
    setDesc("");
  };

  const patch = (course: Subject, uid: string, p: Partial<Unit>) =>
    write(course, courseUnits(course).map((u) => (u.id === uid ? { ...u, ...p } : u)));

  const moveUnit = (course: Subject, i: number, dir: -1 | 1) => {
    const units = [...courseUnits(course)];
    const j = i + dir;
    if (j < 0 || j >= units.length) return;
    [units[i], units[j]] = [units[j], units[i]];
    write(course, units);
  };

  /** حذفُ مادّةٍ يُعيد دروسَها إلى ما قبلها — ولا يحذفها معها. */
  const removeUnit = (course: Subject, uid: string) => {
    const units = courseUnits(course);
    if (units.length <= 1) return;
    const i = units.findIndex((u) => u.id === uid);
    const keep = units[i].lessons ?? [];
    const rest = units.filter((u) => u.id !== uid);
    const at = Math.max(0, i - 1);
    write(course, rest.map((u, k) => (k === at ? { ...u, lessons: [...(u.lessons ?? []), ...keep] } : u)));
    setConfirming(null);
  };

  const count = names.split("\n").map((x) => x.trim()).filter(Boolean).length;

  return (
    <>
      <PageHeader
        title="الموادّ"
        subtitle={`المسار: الكورس ← مادّة ← دروس · ${ar(splitCount)} من ${ar(subjects.length)} كورساً مقسَّم · ${ar(totalUnits)} مادّة`}
      />

      <div className="mb-4 grid gap-3 sm:grid-cols-3">
        <Stat label="مواد في كل الكورسات" value={ar(totalUnits)} icon={<Layers className="size-4" />} />
        <Stat label="كورسات مقسَّمة" value={`${ar(splitCount)} / ${ar(subjects.length)}`} icon={<BookOpen className="size-4" />} />
        <Stat label="مواد بلا دروس" value={ar(emptyUnits)} icon={<AlertTriangle className="size-4" />} alert={emptyUnits > 0} />
      </div>

      <Section
        className="mb-4"
        title="إضافة موادّ"
        subtitle="اكتب المنهجَ سطراً سطراً فتُنشأ الموادُّ مرّةً واحدةً بترتيبها"
        icon={<Plus className="size-4" />}
      >
        <div className="grid gap-3 sm:grid-cols-2">
          <label className="block">
            <span className="mb-1 block text-xs font-semibold text-muted-foreground">الكورس</span>
            <select value={target} onChange={(e) => setTarget(e.target.value)} className={inp}>
              <option value="">— اختر الكورس —</option>
              {subjects.map((s) => (
                <option key={s.id} value={s.id}>
                  {s.name} — {s.grade}
                </option>
              ))}
            </select>
          </label>

          <label className="block">
            <span className="mb-1 block text-xs font-semibold text-muted-foreground">الموضع</span>
            {/*
              زرّان لا قائمة: خياران اثنان، والقائمةُ تُخفي أحدَهما دائماً
              وتحتاج ضغطتين لِما يُنجَز بواحدة.
            */}
            <div className="flex gap-2">
              {([["end", "في آخر المنهج"], ["start", "في أوّله"]] as const).map(([k, label]) => (
                <button
                  key={k}
                  type="button"
                  onClick={() => setWhere(k)}
                  className={`flex-1 rounded-2xl px-3 py-2.5 text-sm font-bold transition ${
                    where === k ? "btn-glow text-white" : "border border-border text-muted-foreground hover:text-foreground"
                  }`}
                >
                  {label}
                </button>
              ))}
            </div>
          </label>

          <label className="block sm:col-span-2">
            <span className="mb-1 block text-xs font-semibold text-muted-foreground">
              أسماء الموادّ — سطرٌ لكلّ مادّة
            </span>
            <textarea
              rows={4}
              value={names}
              onChange={(e) => setNames(e.target.value)}
              className={inp}
              placeholder={"الطهارة\nالصلاة\nالزكاة\nالصوم"}
            />
            <span className="mt-1 block text-[10px] text-muted-foreground">
              {count > 0 ? `ستُنشأ ${ar(count)} مادّة بهذا الترتيب.` : "اكتب اسماً واحداً أو عدّة أسماء."}
            </span>
          </label>

          <label className="block sm:col-span-2">
            <span className="mb-1 block text-xs font-semibold text-muted-foreground">
              وصفُ المادّة الأولى (اختياري) — يراه الطالبُ على بطاقتها
            </span>
            <input value={desc} onChange={(e) => setDesc(e.target.value)} className={inp} placeholder="مثال: أحكام المياه والنجاسات" />
          </label>
        </div>

        <div className="mt-4 flex flex-wrap items-center gap-3 border-t border-border pt-4">
          <Button className="px-6 py-2.5" onClick={create} disabled={!target || count === 0}>
            <Plus className="size-4" /> {count > 1 ? `إنشاء ${ar(count)} موادّ` : "إنشاء المادّة"}
          </Button>
          {!target && <p className="text-xs text-muted-foreground">اختر الكورس أوّلاً.</p>}
        </div>
      </Section>

      <Section
        title="موادّ الكورسات"
        subtitle="المادّةُ بابٌ من المنهج والدروسُ داخلها. وتقسيمُ كورسٍ لا يحذف منه شيئاً — إنّما يوزّع دروسَه على أبوابها."
        icon={<Layers className="size-4" />}
        count={rows.length}
        actions={
          <div className="flex flex-wrap items-center gap-2">
            <div className="relative">
              <Search className="pointer-events-none absolute end-2.5 top-1/2 size-3.5 -translate-y-1/2 text-muted-foreground" />
              <input
                value={q}
                onChange={(e) => setQ(e.target.value)}
                placeholder="ابحث بالكورس أو المرحلة"
                className="w-48 rounded-xl border border-border bg-card/60 py-1.5 pe-8 ps-3 text-xs outline-none focus:border-primary/50"
              />
            </div>
            <select value={only} onChange={(e) => setOnly(e.target.value as typeof only)}
              className="rounded-xl border border-border bg-card/60 px-2.5 py-1.5 text-xs outline-none focus:border-primary/50">
              <option value="all">الكل</option>
              <option value="split">المقسَّمة</option>
              <option value="flat">غير المقسَّمة</option>
              <option value="empty">فيها مادّة فارغة</option>
            </select>
          </div>
        }
      >
        {rows.length === 0 ? (
          <p className="rounded-2xl border border-dashed border-border p-10 text-center text-sm text-muted-foreground">
            {subjects.length === 0 ? "لا كورسات بعد." : "لا كورسات مطابقة."}
          </p>
        ) : (
          <div className="space-y-4">
            {rows.map((course) => {
              const units = courseUnits(course);
              const split = Boolean(course.units?.length);
              return (
                <div key={course.id} className="rounded-2xl border border-border/70">
                  <div className="flex flex-wrap items-center gap-3 border-b border-border/70 bg-muted/30 px-3 py-2.5">
                    <span className="grid size-8 shrink-0 place-items-center rounded-xl bg-[hsl(var(--gold)/0.22)] text-primary">
                      <BookOpen className="size-4" />
                    </span>
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm font-bold">{course.name}</p>
                      <p className="text-[11px] text-muted-foreground">
                        {course.grade} · {split ? `${ar(units.length)} مادّة` : "غير مقسَّم"} · {ar(lessonCount(course))} درساً
                      </p>
                    </div>
                    <button
                      type="button"
                      onClick={() => { setTarget(course.id); window.scrollTo({ top: 0, behavior: "smooth" }); }}
                      className="rounded-full border border-border px-3 py-1.5 text-[11px] font-bold text-muted-foreground transition hover:border-primary hover:text-primary"
                    >
                      + مادّة هنا
                    </button>
                    <Link
                      href={`/admin/courses/${course.id}`}
                      className="rounded-full border border-border px-3 py-1.5 text-[11px] font-bold text-muted-foreground transition hover:border-primary hover:text-primary"
                    >
                      فتح الكورس
                    </Link>
                  </div>

                  <div className="space-y-2 p-3">
                    {units.map((u, i) => {
                      const n = (u.lessons ?? []).length;
                      const asking = confirming === `${course.id}:${u.id}`;
                      return (
                        <div key={u.id} className={`rounded-2xl border p-2.5 ${n === 0 ? "border-amber-500/40 bg-amber-500/[0.05]" : "border-border bg-card/60"}`}>
                          <div className="flex flex-wrap items-center gap-2.5">
                            <span className="grid size-8 shrink-0 place-items-center rounded-full bg-[hsl(var(--gold)/0.22)] text-xs font-extrabold text-primary">
                              {ar(i + 1)}
                            </span>
                            {/*
                              الاسمُ حقلٌ يُكتب فيه مباشرةً — التسميةُ أكثرُ ما
                              يُفعل بالمادّة. ويُحفظ عند مغادرة الحقل لا مع كلّ
                              حرف: اسمٌ من عشرين حرفاً كان عشرين كتابةً.
                            */}
                            <input
                              defaultValue={u.title}
                              onBlur={(e) => {
                                const v = e.target.value.trim();
                                if (v && v !== u.title) patch(course, u.id, { title: v });
                              }}
                              className="min-w-40 flex-1 rounded-xl border border-transparent bg-transparent px-2 py-1 text-sm font-bold outline-none transition hover:border-border focus:border-primary/50 focus:bg-card"
                            />
                            <Link
                              href={`/admin/lessons?course=${course.id}`}
                              title="دروسُ هذا الكورس"
                              className={`inline-flex shrink-0 items-center gap-1 rounded-full px-2.5 py-1 text-[11px] font-bold transition ${
                                n === 0 ? "bg-amber-500/15 text-amber-700 dark:text-amber-400" : "bg-muted text-muted-foreground hover:text-primary"
                              }`}
                            >
                              <ListVideo className="size-3" /> {n === 0 ? "بلا دروس" : `${ar(n)} درساً`}
                            </Link>

                            <div className="flex shrink-0 items-center gap-1">
                              <IconBtn onClick={() => moveUnit(course, i, -1)} disabled={i === 0} title="أعلى"><ChevronUp className="size-3.5" /></IconBtn>
                              <IconBtn onClick={() => moveUnit(course, i, 1)} disabled={i === units.length - 1} title="أسفل"><ChevronDown className="size-3.5" /></IconBtn>
                              <IconBtn
                                onClick={() => setConfirming(asking ? null : `${course.id}:${u.id}`)}
                                disabled={units.length <= 1}
                                title={units.length <= 1 ? "لا تُحذف المادّةُ الوحيدة" : "حذف المادّة"}
                                danger
                              >
                                <Trash2 className="size-3.5" />
                              </IconBtn>
                            </div>
                          </div>

                          {/* الوصفُ — يراه الطالبُ على بطاقة المادّة */}
                          <input
                            defaultValue={u.desc ?? ""}
                            onBlur={(e) => {
                              const v = e.target.value.trim();
                              if (v !== (u.desc ?? "")) patch(course, u.id, { desc: v || undefined });
                            }}
                            placeholder="وصفٌ مختصر يراه الطالب (اختياري)"
                            className="mt-2 w-full rounded-xl border border-transparent bg-transparent px-2 py-1 text-xs text-muted-foreground outline-none transition hover:border-border focus:border-primary/50 focus:bg-card"
                          />

                          {/*
                            التأكيدُ يقول أين تذهب الدروس.
                            الحذفُ كان نقرةً واحدةً تضمّ دروسَ المادّة إلى ما
                            قبلها بلا خبر — فيظنّ الأستاذُ أنّها حُذفت معها.
                          */}
                          {asking && (
                            <div className="mt-2 flex flex-wrap items-center gap-2 rounded-xl bg-rose-500/10 px-3 py-2">
                              <p className="min-w-0 flex-1 text-[11px] font-bold text-rose-700 dark:text-rose-400">
                                تُحذف «{u.title}»
                                {n > 0 && i > 0 && <> — و{ar(n)} درساً فيها تنتقل إلى «{units[i - 1].title}» ولا تُحذف.</>}
                                {n > 0 && i === 0 && <> — و{ar(n)} درساً فيها تنتقل إلى «{units[1]?.title}» ولا تُحذف.</>}
                              </p>
                              <button onClick={() => removeUnit(course, u.id)}
                                className="inline-flex items-center gap-1 rounded-full bg-rose-500 px-3 py-1 text-[11px] font-bold text-white">
                                <Check className="size-3" /> احذف
                              </button>
                              <button onClick={() => setConfirming(null)}
                                className="inline-flex items-center gap-1 rounded-full border border-border px-3 py-1 text-[11px] font-bold text-muted-foreground">
                                <X className="size-3" /> تراجع
                              </button>
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </Section>
    </>
  );
}

function IconBtn({
  children, onClick, disabled, title, danger,
}: {
  children: React.ReactNode;
  onClick: () => void;
  disabled?: boolean;
  title: string;
  danger?: boolean;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      title={title}
      className={`grid size-7 place-items-center rounded-full border border-border transition disabled:opacity-30 ${
        danger ? "text-rose-500 hover:border-rose-500" : "text-muted-foreground hover:border-primary hover:text-primary"
      }`}
    >
      {children}
    </button>
  );
}

function Stat({ label, value, icon, alert }: { label: string; value: string; icon: React.ReactNode; alert?: boolean }) {
  return (
    <div className={`glass flex items-center gap-3 rounded-2xl border p-3 ${alert ? "border-rose-500/40" : "border-border/70"}`}>
      <span className={`grid size-9 shrink-0 place-items-center rounded-xl ${alert ? "bg-rose-500/12 text-rose-500" : "bg-[hsl(var(--gold)/0.22)] text-primary"}`}>
        {icon}
      </span>
      <div className="min-w-0">
        <p className="font-display text-lg font-extrabold leading-none [font-variant-numeric:tabular-nums]">{value}</p>
        <p className="mt-0.5 truncate text-[11px] text-muted-foreground">{label}</p>
      </div>
    </div>
  );
}
