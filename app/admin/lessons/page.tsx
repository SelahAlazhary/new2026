"use client";

/**
 * كلُّ الدروس — القسمُ الجامع.
 * ------------------------------------------------------------------
 * الدرسُ لا يُرى إلّا بفتح كورسه ثمّ مادّته. وذلك يكفي لمن يبني درساً
 * الآن؛ ولا يكفي لمن رفع مئةً ويريد واحداً بعينه — فيفتح الكورساتِ
 * واحداً واحداً يبحث فيها، ولا يعرف أين وقع الخللُ حتّى يشتكي طالب.
 *
 * وهذا يعرضها **كلَّها في جدولٍ واحد**، من كلّ كورسٍ وكلّ مادّة، تُبحث
 * بالاسم وتُصفّى بالكورس والحال، وتُعدَّل في مكانها.
 *
 * **والتعديلُ في الصفّ لا في شاشةٍ أخرى.** أكثرُ ما يُفعل بالدرس تصحيحُ
 * عنوانٍ أو رابطٍ أو مدّة، وثلاثتُها حقولٌ صغيرة. وإخراجُها إلى شاشةٍ
 * تُفتح وتُغلق يجعل تصحيحَ حرفٍ ثلاثَ نقرات.
 *
 * **ويُحفظ عند مغادرة الحقل لا مع كلّ حرف**: الحفظُ مع كلّ ضغطةِ مفتاحٍ
 * يكتب في القاعدة عشراتِ المرّات في الجملة الواحدة.
 *
 * **والكتابةُ من `withUnits`** — هي نفسُها التي يكتب بها محرّرُ الكورس،
 * فلا يفترق ما يُكتب هنا عمّا يُكتب هناك: `units` مصدرٌ، و`videos` مرآةٌ،
 * و`lessons` عدّاد.
 *
 * **ونقلُ الدرس بين الموادّ** هو أكثرُ ما يُحتاج إليه بعد التصحيح: من
 * قسّم كورساً بعد أن ملأه يجد دروسَه كلَّها في بابٍ واحد، فينقلها من هنا
 * بقائمةٍ واحدة بدل حذفٍ وإعادةِ إضافة.
 */

import { useEffect, useMemo, useState } from "react";
import { useSearchParams } from "next/navigation";
import Link from "next/link";
import {
  PlayCircle, Trash2, Gift, ListChecks, ExternalLink, AlertTriangle,
  Link2Off, Copy, ListVideo, Settings2, Paperclip,
} from "lucide-react";
import { DataTable } from "@/components/dashboard/ui";
import { PageBar } from "@/components/dashboard/page-bar";
import { Field, Select, Row } from "@/components/dashboard/form";
import { Section } from "@/components/dashboard/section";
import { useContent } from "@/components/content/content-provider";
import { courseUnits, withUnits } from "@/lib/business/course-units";
import { LessonModal } from "@/components/admin/lesson-modal";
import type { Lesson, Subject, Unit } from "@/lib/utils/types";

const ar = (n: number) => n.toLocaleString("ar-EG");

/** صفٌّ مسطَّح: الدرسُ ومعه من أين جاء. */
type Row = {
  lesson: Lesson;
  subject: Subject;
  unit: Unit;
  /** ترتيبُه داخل مادّته — يُعرض ويُستعمل في النقل. */
  index: number;
};

export default function AllLessons() {
  const { db, save } = useContent();
  const subjects = useMemo(() => db?.subjects ?? [], [db]);

  /*
    الكورسُ قد يأتي من الرابط: من ضغط «٧ دروساً» في شاشة الموادّ يقصد
    دروسَ ذلك الكورس، فتُفتح مصفّاةً لا على الكلّ.
  */
  const params = useSearchParams();
  const [q, setQ] = useState("");
  const [course, setCourse] = useState("");
  useEffect(() => {
    const c = params.get("course");
    if (c) setCourse(c);
  }, [params]);
  const [flag, setFlag] = useState<"all" | "free" | "quiz" | "broken">("all");
  /* الدرسُ المفتوحُ في نافذة الإدارة — مفتاحُه لا كائنُه، ليبقى مرتبطاً
     بالقاعدة فيُحدَّث معها بعد الحفظ. */
  const [openKey, setOpenKey] = useState<string | null>(null);

  const rows: Row[] = useMemo(() => {
    const out: Row[] = [];
    subjects.forEach((s) => {
      courseUnits(s).forEach((u) => {
        (u.lessons ?? []).forEach((l, i) => out.push({ lesson: l, subject: s, unit: u, index: i }));
      });
    });
    return out;
  }, [subjects]);

  /*
    الروابطُ المكرّرة تُحسب مرّةً على الكلّ لا لكلّ صفّ.
    وهي أكثرُ خطأٍ يقع عند الرفع: يُنسخ رابطُ درسٍ ويُلصق في التالي ويُنسى
    تبديلُه — فيرى الطالبُ الدرسَ نفسَه مرّتين ولا يشتكي أحدٌ إلّا متأخّراً.
  */
  const dupUrls = useMemo(() => {
    const seen = new Map<string, number>();
    rows.forEach((r) => {
      const u = (r.lesson.url ?? "").trim();
      if (u) seen.set(u, (seen.get(u) ?? 0) + 1);
    });
    return new Set([...seen.entries()].filter(([, n]) => n > 1).map(([u]) => u));
  }, [rows]);

  const broken = (l: Lesson) => !(l.url ?? "").trim() || dupUrls.has((l.url ?? "").trim());

  const shown = rows.filter((r) => {
    if (course && r.subject.id !== course) return false;
    if (flag === "free" && !r.lesson.isFree) return false;
    if (flag === "quiz" && !(r.lesson.quiz?.enabled && (r.lesson.quiz.questions?.length ?? 0) > 0)) return false;
    if (flag === "broken" && !broken(r.lesson)) return false;
    const k = q.trim();
    if (!k) return true;
    return r.lesson.title.includes(k) || r.subject.name.includes(k) || r.unit.title.includes(k);
  });

  /** يكتب كورساً واحداً بعد تعديل موادّه — بالتركيب نفسِه في كل موضع. */
  const writeCourse = (s: Subject, next: Unit[]) =>
    save({ subjects: subjects.map((x) => (x.id === s.id ? withUnits(s, next) : x)) });

  const patch = (r: Row, p: Partial<Lesson>) =>
    writeCourse(
      r.subject,
      courseUnits(r.subject).map((u) =>
        u.id !== r.unit.id ? u : { ...u, lessons: (u.lessons ?? []).map((l) => (l.id === r.lesson.id ? { ...l, ...p } : l)) }
      )
    );

  const remove = (r: Row) =>
    writeCourse(
      r.subject,
      courseUnits(r.subject).map((u) =>
        u.id !== r.unit.id ? u : { ...u, lessons: (u.lessons ?? []).filter((l) => l.id !== r.lesson.id) }
      )
    );

  /* النقلُ حذفٌ من مادّةٍ وإضافةٌ إلى أخرى في كتابةٍ واحدة — لئلّا يقع
     الدرسُ بين الاثنتين إن انقطعت الكتابةُ في المنتصف. */
  const moveTo = (r: Row, unitId: string) => {
    if (unitId === r.unit.id) return;
    writeCourse(
      r.subject,
      courseUnits(r.subject).map((u) => {
        if (u.id === r.unit.id) return { ...u, lessons: (u.lessons ?? []).filter((l) => l.id !== r.lesson.id) };
        if (u.id === unitId) return { ...u, lessons: [...(u.lessons ?? []), r.lesson] };
        return u;
      })
    );
  };

  const inp = "w-full rounded-xl border border-border bg-card/60 px-2.5 py-1.5 text-xs outline-none focus:border-primary/50";
  const needAttention = rows.filter((r) => broken(r.lesson)).length;

  return (
    <>
      <PageBar
        title="كل الدروس"
        subtitle={`${ar(rows.length)} درساً في ${ar(subjects.length)} كورساً — تُبحث وتُعدَّل من مكانها`}
        search={{ value: q, onChange: setQ, placeholder: "ابحث باسم الدرس أو الكورس أو المادّة" }}
        activeFilters={(course ? 1 : 0) + (flag !== "all" ? 1 : 0)}
        onClearFilters={() => { setCourse(""); setFlag("all"); }}
        filters={
          <Row cols={2}>
            <Field label="الكورس">
              <Select value={course} onChange={(e) => setCourse(e.target.value)}>
                <option value="">كل الكورسات</option>
                {subjects.map((s) => <option key={s.id} value={s.id}>{s.name}</option>)}
              </Select>
            </Field>
            <Field label="الحال">
              <Select value={flag} onChange={(e) => setFlag(e.target.value as typeof flag)}>
                <option value="all">الكل</option>
                <option value="free">المجّانية</option>
                <option value="quiz">ما عليه اختبار</option>
                <option value="broken">تحتاج انتباهاً</option>
              </Select>
            </Field>
          </Row>
        }
      />

      <div className="mb-4 grid gap-3 sm:grid-cols-4">
        <Stat label="إجمالي الدروس" value={ar(rows.length)} icon={<ListVideo className="size-4" />} />
        <Stat label="دروس مجّانية" value={ar(rows.filter((r) => r.lesson.isFree).length)} icon={<Gift className="size-4" />} />
        <Stat
          label="عليها اختبار"
          value={ar(rows.filter((r) => r.lesson.quiz?.enabled && (r.lesson.quiz.questions?.length ?? 0) > 0).length)}
          icon={<ListChecks className="size-4" />}
        />
        <Stat label="تحتاج انتباهاً" value={ar(needAttention)} icon={<AlertTriangle className="size-4" />} alert={needAttention > 0} />
      </div>

      <Section
        title="كل الدروس المرفوعة"
        subtitle="من كلّ كورسٍ وكلّ مادّة — العنوانُ والرابطُ والمدّةُ تُعدَّل في الصفّ، وتُحفظ عند مغادرة الحقل"
        icon={<ListVideo className="size-4" />}
        count={shown.length}
      >
        {rows.length === 0 ? (
          <p className="rounded-2xl border border-dashed border-border p-10 text-center text-sm text-muted-foreground">
            لا دروس بعد. أضِف درساً من داخل أيّ كورس.
          </p>
        ) : shown.length === 0 ? (
          <p className="rounded-2xl border border-dashed border-border p-10 text-center text-sm text-muted-foreground">
            لا درسَ يطابق البحث.
          </p>
        ) : (
          <DataTable head={["الدرس", "الكورس والمادّة", "الرابط", "المدّة", "مجّاني", "إجراءات"]}>
            {shown.map((r) => {
              const units = courseUnits(r.subject);
              const bad = broken(r.lesson);
              return (
                <tr key={`${r.subject.id}-${r.unit.id}-${r.lesson.id}`} className="align-top transition hover:bg-muted/40">
                  <td className="px-3 py-3">
                    <div className="flex items-start gap-2">
                      <span className={`mt-0.5 grid size-7 shrink-0 place-items-center rounded-xl ${bad ? "bg-rose-500/12 text-rose-500" : "bg-primary/12 text-primary"}`}>
                        {bad ? <AlertTriangle className="size-3.5" /> : <PlayCircle className="size-4" />}
                      </span>
                      <div className="min-w-[11rem] flex-1">
                        <input
                          defaultValue={r.lesson.title}
                          onBlur={(e) => {
                            const v = e.target.value.trim();
                            if (v && v !== r.lesson.title) patch(r, { title: v });
                          }}
                          className={inp}
                        />
                        <span className="mt-1 flex flex-wrap items-center gap-2">
                          {r.lesson.quiz?.enabled && (r.lesson.quiz.questions?.length ?? 0) > 0 && (
                            <span className="inline-flex items-center gap-1 text-[10px] font-bold text-emerald-600 dark:text-emerald-400">
                              <ListChecks className="size-3" /> {ar(r.lesson.quiz.questions.length)} أسئلة
                            </span>
                          )}
                          {(r.lesson.materials?.length ?? 0) > 0 && (
                            <span className="inline-flex items-center gap-1 text-[10px] font-bold text-primary">
                              <Paperclip className="size-3" /> {ar(r.lesson.materials!.length)} مرفقاً
                            </span>
                          )}
                        </span>
                      </div>
                    </div>
                  </td>

                  <td className="px-3 py-3">
                    <p className="mb-1 truncate text-xs font-bold">{r.subject.name}</p>
                    {/* النقلُ بين موادّ الكورس نفسِه — والنقلُ بين الكورسات
                        ليس نقلاً بل درسٌ آخر، فلا يُعرض هنا. */}
                    <select
                      value={r.unit.id}
                      onChange={(e) => moveTo(r, e.target.value)}
                      className={`${inp} !py-1`}
                      title="نقلُ الدرس إلى مادّةٍ أخرى في الكورس نفسِه"
                    >
                      {units.map((u) => <option key={u.id} value={u.id}>{u.title}</option>)}
                    </select>
                  </td>

                  <td className="px-3 py-3">
                    <div className="flex min-w-[12rem] items-center gap-1.5">
                      <input
                        defaultValue={r.lesson.url}
                        dir="ltr"
                        onBlur={(e) => {
                          const v = e.target.value.trim();
                          if (v !== r.lesson.url) patch(r, { url: v });
                        }}
                        className={`${inp} text-left font-mono text-[10px]`}
                        placeholder="https://…"
                      />
                      {r.lesson.url && (
                        <a href={r.lesson.url} target="_blank" rel="noreferrer" title="فتح الرابط"
                          className="grid size-7 shrink-0 place-items-center rounded-lg border border-border text-muted-foreground transition hover:border-primary hover:text-primary">
                          <ExternalLink className="size-3.5" />
                        </a>
                      )}
                    </div>
                    {!(r.lesson.url ?? "").trim() && (
                      <span className="mt-1 inline-flex items-center gap-1 text-[10px] font-bold text-rose-600 dark:text-rose-400">
                        <Link2Off className="size-3" /> بلا رابط — لا يعمل عند الطالب
                      </span>
                    )}
                    {dupUrls.has((r.lesson.url ?? "").trim()) && (
                      <span className="mt-1 inline-flex items-center gap-1 text-[10px] font-bold text-amber-600 dark:text-amber-400">
                        <Copy className="size-3" /> الرابطُ نفسُه في درسٍ آخر
                      </span>
                    )}
                  </td>

                  <td className="px-3 py-3">
                    <input
                      defaultValue={r.lesson.duration ?? ""}
                      onBlur={(e) => {
                        const v = e.target.value.trim();
                        if (v !== (r.lesson.duration ?? "")) patch(r, { duration: v || undefined });
                      }}
                      className={`${inp} !w-20`}
                      placeholder="١٢:٤٠"
                    />
                  </td>

                  <td className="px-3 py-3">
                    <label className="inline-flex cursor-pointer items-center gap-1.5">
                      <input
                        type="checkbox"
                        checked={Boolean(r.lesson.isFree)}
                        onChange={(e) => patch(r, { isFree: e.target.checked })}
                        className="size-4 accent-[hsl(var(--primary))]"
                      />
                      <Gift className={`size-3.5 ${r.lesson.isFree ? "text-emerald-500" : "text-muted-foreground/50"}`} />
                    </label>
                  </td>

                  <td className="px-3 py-3">
                    <div className="flex items-center gap-1">
                      {/* الاختبارُ والملفّاتُ أكبرُ من صفّ — تُفتح في محرّر الكورس */}
                      <button
                        onClick={() => setOpenKey(`${r.subject.id}|${r.unit.id}|${r.lesson.id}`)}
                        title="إدارة الدرس — الفيديو والواجب والمرفقات"
                        className="grid size-8 place-items-center rounded-full border border-border text-primary transition hover:border-primary"
                      >
                        <Settings2 className="size-4" />
                      </button>
                      <Link
                        href={`/admin/courses/${r.subject.id}`}
                        title="فتح الكورس"
                        className="grid size-8 place-items-center rounded-full border border-border text-muted-foreground transition hover:border-primary hover:text-primary"
                      >
                        <ListChecks className="size-4" />
                      </Link>
                      <button
                        onClick={() => remove(r)}
                        title="حذف الدرس"
                        className="grid size-8 place-items-center rounded-full border border-border text-rose-500 transition hover:border-rose-500"
                      >
                        <Trash2 className="size-4" />
                      </button>
                    </div>
                  </td>
                </tr>
              );
            })}
          </DataTable>
        )}
      </Section>

      {/*
        النافذةُ تُبنى من القاعدة لا من نسخةٍ محفوظةٍ في الحالة: بعد الحفظ
        تُعاد قراءةُ الدرس فتُرى التعديلاتُ فيها فوراً.
      */}
      {(() => {
        if (!openKey) return null;
        const [sid, uid, lid] = openKey.split("|");
        const r = rows.find((x) => x.subject.id === sid && x.unit.id === uid && x.lesson.id === lid);
        if (!r) return null;
        return (
          <LessonModal
            lesson={r.lesson}
            courseName={r.subject.name}
            unitName={r.unit.title}
            onClose={() => setOpenKey(null)}
            onSave={(next) => { patch(r, next); setOpenKey(null); }}
          />
        );
      })()}
    </>
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
