"use client";

/**
 * شاشةُ الكورسات.
 * ------------------------------------------------------------------
 * كانت شاشةً واحدةً مسطّحة: نموذجُ إضافةٍ ثمانيةُ حقولٍ في شبكةٍ واحدة،
 * وجدولٌ تسعةُ أعمدةٍ يضمّ كورساتِ الصفوف كلِّها والفصلين معاً. فمن أراد
 * إضافةَ كورسٍ واجه ثمانيةَ حقولٍ متساويةِ الوزن لا يدري أيَّها لازمٌ
 * وأيَّها يُترك، ومن أراد كورساً بعينه بحث عنه في صفٍّ طويل.
 *
 * فقُسمت ثلاثةَ أقسام:
 *
 * ١ ــ **الإضافةُ ثلاثُ خطواتٍ مرقّمة**: تعريفٌ، ثمّ موضعٌ في المنهج، ثمّ
 *      سعرٌ ودروس. والحقلُ اللازمُ وحدَه في الأولى، وما له افتراضٌ صالحٌ
 *      في الثانية والثالثة — فمن ملأ الأولى وحفظ صحّ كورسُه.
 *
 * ٢ ــ **القائمةُ تنقسم بالفصلين**: قسمٌ للأوّل وقسمٌ للثاني، وعدّادُ كلٍّ
 *      في عنوانه. وهذا يُعيد الفصلين إلى الشاشة ظاهرَين — كانا خانةً في
 *      صفٍّ لا تُرى إلّا بعد التمرير عرضاً.
 *
 * ٣ ــ **وداخلَ الفصل تنقسم بالصفوف**: عنوانٌ صغيرٌ لكلّ صفٍّ وتحته
 *      كورساتُه. فالمنهجُ يُقرأ شجرةً كما هو في الواقع، لا قائمةً مسطّحة.
 *
 * والبحثُ فوقَ الكلّ يتخطّى القسمةَ كلَّها حين يُعرف الاسم.
 */

import { useMemo, useState } from "react";
import Link from "next/link";
import { Plus, X, BookOpen, GraduationCap, Wallet } from "lucide-react";

import { PageBar } from "@/components/dashboard/page-bar";
import { Section } from "@/components/dashboard/section";
import { Button } from "@/components/ui/primitives";
import { useContent } from "@/components/content/content-provider";
import { gradeHasTrack } from "@/lib/utils/data";
import { planPrice } from "@/lib/business/plans";
import { parsePick } from "@/lib/business/picks";
import type { Subject } from "@/lib/utils/types";
import { AdminCourseCard } from "@/components/admin/course-card";

const TERMS = [
  { id: 1 as const, label: "الفصل الدراسي الأول" },
  { id: 2 as const, label: "الفصل الدراسي الثاني" },
];

/** عنوانُ خطوةٍ في نموذج الإضافة — الرقمُ يجعل الترتيبَ مقروءاً بلا شرح. */
function Step({ n, title, hint, icon }: { n: number; title: string; hint: string; icon: React.ReactNode }) {
  return (
    <div className="mb-3 flex items-center gap-2.5">
      <span className="grid size-7 shrink-0 place-items-center rounded-full bg-primary/12 text-[0.7rem] font-extrabold text-primary">
        {n.toLocaleString("ar-EG")}
      </span>
      <span className="text-primary">{icon}</span>
      <div className="min-w-0">
        <p className="font-kufi text-sm font-bold leading-tight">{title}</p>
        <p className="truncate text-xs text-muted-foreground">{hint}</p>
      </div>
    </div>
  );
}

const inp =
  "w-full rounded-2xl border border-border bg-card/60 px-4 py-2.5 text-sm outline-none focus:border-primary/50";

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label className="block">
      <span className="mb-1 block text-xs font-semibold text-muted-foreground">{label}</span>
      {children}
    </label>
  );
}

export default function SubjectsPage() {
  const { db, save, content } = useContent();
  const subjects = db?.subjects ?? [];
  const grades = db?.grades ?? [];
  const plans = db?.plans ?? [];
  const [adding, setAdding] = useState(false);
  const [q, setQ] = useState("");
  const [form, setForm] = useState({ name: "", lessons: 0, grade: "كل الصفوف", track: "الكل", term: 1 as 1 | 2 });

  const add = async () => {
    if (!form.name.trim()) return;
    const s: Subject = {
      id: `SUB-${Date.now()}`, name: form.name.trim(), teacher: content.teacher.name,
      grade: form.grade, track: form.track, term: form.term, lessons: Number(form.lessons) || 0, students: 0,
      /* السعرُ صفرٌ دائماً: مصدرُه الخطّةُ لا الكورس. ويبقى الحقلُ في
         النوع لتوافق ما كُتب قبل النقل. */
      price: 0, videos: [], status: "مسودّة",
    };
    await save({ subjects: [...subjects, s] });
    /* الفصلُ يبقى على ما اختير: من يضيف كورساتِ فصلٍ يضيفها متتابعةً. */
    setForm({ name: "", lessons: 0, grade: form.grade, track: "الكل", term: form.term });
    setAdding(false);
  };
  const remove = (id: string) => save({ subjects: subjects.filter((s) => s.id !== id) });
  const toggle = (id: string) =>
    save({ subjects: subjects.map((s) => (s.id === id ? { ...s, status: s.status === "منشورة" ? "مسودّة" : "منشورة" } : s)) });
  /*
    السعرُ يُقرأ ولا يُكتب هنا.
    كان حقلاً في هذا الجدول وحقلاً في الكورس وحقلاً في الخطّة — ثلاثةُ
    أرقامٍ للشيء الواحد لا يُعرف أيُّها يُحصَّل. وصار مصدرُه واحداً: بوّابةُ
    الدفع. وهذا العمودُ يُري ما يدفعه الطالبُ فعلاً — أرخصَ خطّةٍ تفتح
    هذا الكورس — ويحيل إلى موضع تعديله.
  */
  const cheapestFor = (s: Subject) => {
    const open = plans.filter(
      (p) =>
        p.visible !== false &&
        (p.scope === "all" ||
          (p.scope === "term" && (p.termNo ?? 1) === (s.term ?? 1)) ||
          (p.scope === "subject" && p.subjectId === s.id) ||
          (p.scope === "picked" && (p.picks ?? []).some((k) => parsePick(k).subjectId === s.id)))
    );
    if (open.length === 0) return null;
    return open.reduce((a, b) => (planPrice(a).price <= planPrice(b).price ? a : b));
  };
  const setTrack = (id: string, track: string) =>
    save({ subjects: subjects.map((s) => (s.id === id ? { ...s, track } : s)) });
  const setTerm = (id: string, term: 1 | 2) =>
    save({ subjects: subjects.map((s) => (s.id === id ? { ...s, term } : s)) });

  const found = useMemo(() => {
    const k = q.trim();
    return k ? subjects.filter((s) => s.name.includes(k) || (s.grade ?? "").includes(k)) : subjects;
  }, [subjects, q]);

  /* ترتيبُ الصفوف من القاعدة لا بالأبجدية — «الأولى» قبل «الثالثة». */
  const gradeOrder = (g: string) => {
    const i = grades.findIndex((x) => x.name === g);
    return i < 0 ? 999 : i;
  };

  /*
    الكورسُ غلافٌ ودروس، وكلاهما لا يدخل خانةً في جدول. فصار بطاقةً
    يُرسم غلافُها بـ`CourseArt` نفسِه الذي يرسمه في بوابة الطالب — فما
    يراه الأستاذُ هنا هو ما يراه الطالبُ هناك، ولا يفاجئه فرقٌ بعد النشر.
  */
  const rows = (list: Subject[]) => (
    <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
      {list.map((s) => {
        const p = cheapestFor(s);
        return (
          <AdminCourseCard
            key={s.id}
            s={s}
            cheapest={p ? { plan: p, price: planPrice(p).price } : null}
            hasTrack={gradeHasTrack(s.grade)}
            onToggle={() => toggle(s.id)}
            onRemove={() => remove(s.id)}
            onTerm={(t) => setTerm(s.id, t)}
            onTrack={(t) => setTrack(s.id, t)}
          />
        );
      })}
    </div>
  );

  const inTermCount = (t: 1 | 2) => subjects.filter((s) => (s.term ?? 1) === t).length;

  /*
    الفصلُ المعروض.
    كانت الكورساتُ تُعرض بفصليها معاً في لوحين متتابعين، فيُمرَّر نصفُ
    الشاشة للوصول إلى الفصل الثاني. والأستاذُ يعمل في فصلٍ واحدٍ في
    الجلسة الواحدة — فيُختار، ويبقى «الاثنان» لمن أراد النظرةَ الشاملة.
  */
  const [termView, setTermView] = useState<1 | 2 | "all">(1);

  return (
    <>
      <PageBar
        title="الكورسات"
        subtitle={`${subjects.length.toLocaleString("ar-EG")} كورس — الفصل الأول ${inTermCount(1).toLocaleString("ar-EG")}، والفصل الثاني ${inTermCount(2).toLocaleString("ar-EG")}`}
        action={<Button className="px-5 py-2.5" onClick={() => setAdding((v) => !v)}><Plus className="size-4" /> إضافة كورس</Button>}
        search={{ value: q, onChange: setQ, placeholder: "ابحث باسم الكورس أو الصف" }}
      />

      {/* ---------- مبدِّلُ الفصل ---------- */}
      <div className="mb-5 flex flex-wrap items-center gap-2">
        <div className="relative inline-flex rounded-[1.35rem] border border-border bg-card p-1 shadow-sm">
          {([
            { id: 1 as const, label: "الفصل الأول" },
            { id: 2 as const, label: "الفصل الثاني" },
            { id: "all" as const, label: "الاثنان" },
          ]).map((t) => {
            const on = termView === t.id;
            const n = t.id === "all" ? subjects.length : inTermCount(t.id);
            return (
              <button
                key={String(t.id)}
                type="button"
                onClick={() => setTermView(t.id)}
                aria-pressed={on}
                className={`relative inline-flex items-center gap-2 rounded-[1.05rem] px-4 py-2.5 text-xs font-bold transition ${
                  on ? "btn-glow text-white shadow-bento" : "text-muted-foreground hover:text-foreground"
                }`}
              >
                {t.label}
                <span
                  className={`grid min-w-[1.4rem] place-items-center rounded-full px-1.5 py-0.5 text-[10px] font-extrabold ${
                    on ? "bg-white/22 text-white" : "bg-muted text-muted-foreground"
                  }`}
                >
                  {n.toLocaleString("ar-EG")}
                </span>
              </button>
            );
          })}
        </div>
        {q.trim() && (
          <span className="text-[11px] text-muted-foreground">
            البحثُ يتجاوز الفصلَ المختار — يبحث في الكورسات كلِّها.
          </span>
        )}
      </div>

      {adding && (
        <div className="glass mb-4 space-y-5 rounded-3xl p-5">
          <section>
            <Step n={1} title="تعريف الكورس" hint="الاسم وحدَه لازم — وما بعده له افتراضٌ صالح" icon={<BookOpen className="size-4" />} />
            <div className="grid gap-3 sm:grid-cols-2">
              <Field label="اسم الكورس">
                <input autoFocus value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} className={inp} placeholder="مثال: الفقه الشافعي — الباب الأول" />
              </Field>
              {/*
                الشعبةُ للثانويّ وحدَه.
                الإعداديُّ صفٌّ لا ينقسم، والتسجيلُ لا يعطي طالبَه شعبةً —
                فكورسٌ إعداديٌّ «علميّ» يُخفى عن طلابه كلِّهم بلا رسالةِ خطأ.
                والحقلُ يظهر بعد اختيار الصفّ في الخطوة الثانية.
              */}
              {gradeHasTrack(form.grade) ? (
                <Field label="الشعبة">
                  <select value={form.track} onChange={(e) => setForm({ ...form, track: e.target.value })} className={inp}>
                    <option value="الكل">الكل (علمي وأدبي)</option>
                    <option value="علمي">علمي</option>
                    <option value="أدبي">أدبي</option>
                  </select>
                </Field>
              ) : (
                <Field label="الشعبة">
                  <p className={`${inp} text-muted-foreground`}>لا شُعَب في المرحلة الإعدادية</p>
                </Field>
              )}
            </div>
          </section>

          <section className="border-t border-border/70 pt-4">
            <Step n={2} title="موضعه في المنهج" hint="الصفُّ والفصلُ — بهما يُعرض للطالب الصحيح" icon={<GraduationCap className="size-4" />} />
            <div className="grid gap-3 sm:grid-cols-2">
              <Field label="الصف الدراسي">
                <select
                  value={form.grade}
                  onChange={(e) => {
                    const g = e.target.value;
                    /* الإعداديُّ لا شعبةَ له — فتُمحى ولا تُحفظ من اختيارٍ سابق */
                    setForm({ ...form, grade: g, track: gradeHasTrack(g) ? form.track : "الكل" });
                  }}
                  className={inp}
                >
                  <option>كل الصفوف</option>
                  {grades.map((g) => <option key={g.id}>{g.name}</option>)}
                </select>
              </Field>
              <Field label="الفصل الدراسي">
                {/*
                  زرّان لا قائمةٌ منسدلة: خياران اثنان لا ثالثَ لهما، والقائمةُ
                  تُخفي أحدَهما دائماً وتحتاج ضغطتين لِما يُنجَز بواحدة.
                */}
                <div className="flex gap-2">
                  {TERMS.map((t) => (
                    <button
                      key={t.id}
                      type="button"
                      onClick={() => setForm({ ...form, term: t.id })}
                      className={`flex-1 rounded-2xl px-3 py-2.5 text-sm font-bold transition ${
                        form.term === t.id ? "btn-glow text-white" : "border border-border text-muted-foreground hover:text-foreground"
                      }`}
                    >
                      {t.label}
                    </button>
                  ))}
                </div>
              </Field>
            </div>
          </section>

          <section className="border-t border-border/70 pt-4">
            <Step n={3} title="الدروس" hint="رقمٌ تقديريٌّ يُعدَّل وحدَه كلّما أضفتَ درساً" icon={<Wallet className="size-4" />} />
            <div className="grid gap-3 sm:grid-cols-2">
              <Field label="عدد الدروس المتوقَّع">
                <input type="number" value={form.lessons} onChange={(e) => setForm({ ...form, lessons: Number(e.target.value) })} className={inp} />
              </Field>
              {/*
                ولا حقلَ سعرٍ هنا.
                كان سعرُ الكورس يُكتب في ثلاثة مواضع — هذا النموذج، والكورس
                نفسُه، والخطّة — فيصير للشيء الواحد ثلاثةُ أرقامٍ لا يُعرف
                أيُّها يُحصَّل. وصار مصدرُه واحداً: بوّابةُ الدفع.
              */}
              <div className="rounded-2xl border border-dashed border-border p-3">
                <p className="text-xs font-bold">السعر ومدّة التفعيل</p>
                <p className="mt-1 text-[11px] leading-relaxed text-muted-foreground">
                  يُضبَطان من <b>بوّابة الدفع</b> بعد إنشاء الكورس — أنشئ خطّةً هناك وحدّد ما تفتحه.
                </p>
              </div>
            </div>
          </section>

          <div className="flex items-center gap-2 border-t border-border/70 pt-4">
            <Button className="px-6 py-2.5" onClick={add}>حفظ الكورس</Button>
            <button onClick={() => setAdding(false)} className="grid size-10 place-items-center rounded-full border border-border"><X className="size-4" /></button>
            <p className="ms-auto text-xs text-muted-foreground">يُحفظ مسودّةً — يُنشر من الجدول بعد إضافة دروسه.</p>
          </div>
        </div>
      )}

      {subjects.length === 0 ? (
        <p className="rounded-3xl border border-dashed border-border p-10 text-center text-sm text-muted-foreground">
          لا توجد كورسات بعد. أضِف أول كورس ليظهر على الموقع.
        </p>
      ) : (
        <>
          {q.trim() ? (
            found.length === 0
              ? <p className="rounded-3xl border border-dashed border-border p-10 text-center text-sm text-muted-foreground">لا كورسَ بهذا الاسم.</p>
              : rows(found)
          ) : (
            <div className="space-y-3">
              {TERMS.filter((t) => termView === "all" || termView === t.id).map((t) => {
                const inTerm = subjects.filter((s) => (s.term ?? 1) === t.id);
                const byGrade = Array.from(new Set(inTerm.map((s) => s.grade || "كل الصفوف")))
                  .sort((a, b) => gradeOrder(a) - gradeOrder(b));
                return (
                  <Section
                    key={t.id}
                    title={t.label}
                    subtitle={inTerm.length ? `${byGrade.length.toLocaleString("ar-EG")} صفّاً دراسيّاً` : "لا كورسات في هذا الفصل بعد"}
                    icon={<BookOpen className="size-4" />}
                    count={inTerm.length}
                    /* يُفتح الفصلُ الذي فيه كورسات — والفارغُ لا يُفتح على فراغ */
                  >
                    {inTerm.length === 0 ? (
                      <p className="p-6 text-center text-sm text-muted-foreground">
                        لا كورسات في {t.label}. أضِف كورساً واختر هذا الفصل في الخطوة الثانية.
                      </p>
                    ) : (
                      <div className="space-y-5">
                        {byGrade.map((g) => (
                          <div key={g}>
                            <p className="font-kufi mb-2 flex items-center gap-2 text-xs font-bold text-muted-foreground">
                              <GraduationCap className="size-3.5" /> {g}
                              <span className="rounded-full bg-muted px-2 py-0.5 text-[10px] font-extrabold">
                                {inTerm.filter((s) => (s.grade || "كل الصفوف") === g).length.toLocaleString("ar-EG")}
                              </span>
                            </p>
                            {rows(inTerm.filter((s) => (s.grade || "كل الصفوف") === g))}
                          </div>
                        ))}
                      </div>
                    )}
                  </Section>
                );
              })}
            </div>
          )}
        </>
      )}
    </>
  );
}
