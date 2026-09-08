"use client";

/**
 * تقاريرُ الطلاب — مقارنةٌ لا تفصيل.
 * ------------------------------------------------------------------
 * تقريرُ الطالب الواحد موجودٌ في `/admin/students/[id]`: نشاطُه وتقدّمُه
 * وتحويلاتُه ورسائلُه. وهو يجيب «كيف حالُ هذا الطالب؟».
 *
 * ولا يجيب السؤالَ الذي يُسأل أكثرَ منه: **«مَن يحتاجُ منّي شيئاً
 * اليوم؟»** — ومن أراد جوابَه فتح مئةَ تقريرٍ واحداً واحداً.
 *
 * فهذه الصفحةُ تُجيبه: صفٌّ لكلّ طالبٍ بمؤشّراته، تُرتَّب وتُصفّى بالحالة،
 * وفي صدرها عدّاداتٌ تُضغط فتُصفّي — «١٢ غائباً» ليست خبراً يُقرأ بل
 * زرّاً يُفتح على أسمائهم.
 *
 * **والمؤشّراتُ تُشتقّ ولا تُصنع**: كلُّ رقمٍ من بيانٍ مخزَّنٍ فعلاً — انظر
 * `lib/student-report.ts`. ولا يُخترع مؤشّرٌ لا سندَ له، فرقمٌ لا يُعرف
 * مصدرُه أسوأُ من غيابه: يُبنى عليه قرارٌ في حقّ طالب.
 */

import { useMemo, useState } from "react";
import Link from "next/link";
import { BarChart3, Download, ExternalLink, Users } from "lucide-react";
import { DataTable } from "@/components/dashboard/ui";
import { Button } from "@/components/ui/primitives";
import { PageBar } from "@/components/dashboard/page-bar";
import { Field, Select } from "@/components/dashboard/form";
import { Section } from "@/components/dashboard/section";
import { useContent } from "@/components/content/content-provider";
import {
  reportFor, reportsToCsv, STATE_LABEL, AWAY_DAYS,
  type StudentReport, type StudentState,
} from "@/lib/business/student-report";

const ar = (n: number) => n.toLocaleString("ar-EG");

type SortKey = "name" | "progress" | "seen" | "quiz" | "paid";

export default function ReportsPage() {
  const { db } = useContent();
  const [q, setQ] = useState("");
  const [state, setState] = useState<StudentState | "">("");
  const [grade, setGrade] = useState("");
  const [sort, setSort] = useState<SortKey>("seen");

  const rows = useMemo<StudentReport[]>(() => {
    const students = (db?.users ?? []).filter((u) => u.role === "student");
    const subjects = db?.subjects ?? [];
    const pays = db?.payments ?? [];
    return students.map((u) => reportFor(u, subjects, pays));
  }, [db]);

  const grades = useMemo(
    () => [...new Set(rows.map((r) => r.grade).filter(Boolean))] as string[],
    [rows],
  );

  /* العدّاداتُ تُحسب من الكلّ لا من المصفّى — وإلّا صارت تعدّ نفسَها */
  const tally = useMemo(() => {
    const t: Record<StudentState, number> = { new: 0, active: 0, slow: 0, stalled: 0, done: 0, none: 0 };
    for (const r of rows) t[r.state] += 1;
    return t;
  }, [rows]);

  const shown = useMemo(() => {
    const needle = q.trim();
    const out = rows.filter((r) =>
      (!needle || r.name.includes(needle)) &&
      (!state || r.state === state) &&
      (!grade || r.grade === grade));

    /*
      الترتيبُ الافتراضيُّ بالغياب: من طال غيابُه أوّلاً.
      وغيرُ المسجَّل ظهورُه يُدفع إلى الآخر لا إلى الأوّل — غيابٌ لا يُعرف
      ليس أشدَّ من غيابٍ يُعرف، ووضعُه في الصدارة يزيح من يُحتاج إليه.
    */
    const by: Record<SortKey, (a: StudentReport, b: StudentReport) => number> = {
      name: (a, b) => a.name.localeCompare(b.name, "ar"),
      progress: (a, b) => a.progress - b.progress,
      quiz: (a, b) => (a.quizAvg ?? 101) - (b.quizAvg ?? 101),
      paid: (a, b) => b.paid - a.paid,
      seen: (a, b) => (b.daysSinceSeen ?? -1) - (a.daysSinceSeen ?? -1),
    };
    return [...out].sort(by[sort]);
  }, [rows, q, state, grade, sort]);

  /*
    التنزيلُ من الذاكرة لا من الخادم: البياناتُ محسوبةٌ هنا أصلاً، وطلبُ
    الخادم يُعيد حسابَ ما بين يدي المتصفّح.
  */
  const download = () => {
    const blob = new Blob([reportsToCsv(shown)], { type: "text/csv;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `تقارير-الطلاب-${new Date().toISOString().slice(0, 10)}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const activeFilters = (state ? 1 : 0) + (grade ? 1 : 0);

  return (
    <>
      <PageBar
        title="تقارير الطلاب"
        subtitle={`${ar(rows.length)} طالباً · المعروض ${ar(shown.length)}`}
        search={{ value: q, onChange: setQ, placeholder: "ابحث باسم الطالب…" }}
        activeFilters={activeFilters}
        onClearFilters={() => { setState(""); setGrade(""); }}
        action={
          <Button onClick={download} disabled={shown.length === 0}>
            <Download className="size-4" /> تنزيل CSV
          </Button>
        }
        filters={
          <>
            <Field label="الحالة">
              <Select value={state} onChange={(e) => setState(e.target.value as StudentState | "")}>
                <option value="">كل الحالات</option>
                {(Object.keys(STATE_LABEL) as StudentState[]).map((k) => (
                  <option key={k} value={k}>{STATE_LABEL[k]} ({ar(tally[k])})</option>
                ))}
              </Select>
            </Field>
            <Field label="الصفّ">
              <Select value={grade} onChange={(e) => setGrade(e.target.value)}>
                <option value="">كل الصفوف</option>
                {grades.map((g) => <option key={g} value={g}>{g}</option>)}
              </Select>
            </Field>
            <Field label="الترتيب">
              <Select value={sort} onChange={(e) => setSort(e.target.value as SortKey)}>
                <option value="seen">الأطولُ غياباً أوّلاً</option>
                <option value="progress">الأقلُّ تقدّماً أوّلاً</option>
                <option value="quiz">الأضعفُ درجاتٍ أوّلاً</option>
                <option value="paid">الأكثرُ دفعاً أوّلاً</option>
                <option value="name">بالاسم</option>
              </Select>
            </Field>
          </>
        }
      />

      {/*
        العدّاداتُ أزرارٌ لا أخبار.
        «١٢ غائباً» رقمٌ يُقرأ ثمّ يُنسى إن لم يُفتح على أسمائهم. فضغطُها
        يُصفّي القائمةَ عليهم — والمعروضةُ منها تُضغط ثانيةً فتُلغى.
      */}
      <Section
        title="نظرةٌ عامّة"
        subtitle="اضغط عدّاداً لتُصفّى القائمةُ عليه"
        icon={<BarChart3 className="size-4" />}
        group="reports"
      >
        <div className="rp-tally">
          {(["stalled", "slow", "new", "active", "done", "none"] as StudentState[]).map((k) => (
            <button
              key={k}
              type="button"
              onClick={() => setState((cur) => (cur === k ? "" : k))}
              className="rp-t"
              data-k={k}
              data-on={state === k ? "1" : "0"}
            >
              <span className="rp-t-n">{ar(tally[k])}</span>
              <span className="rp-t-l">{STATE_LABEL[k]}</span>
            </button>
          ))}
        </div>
        <p className="mt-3 text-xs leading-relaxed text-muted-foreground">
          «غائب» = مشتركٌ بدأ ولم يظهر منذ {ar(AWAY_DAYS)} يوماً أو أكثر.
          و«لم يبدأ» = مشتركٌ تقدّمُه صفر. وعددُ الدروس المنجَزة مشتقٌّ من
          نسبة التقدّم — فالإنجازُ يُحفظ في جهاز الطالب ويُرسَل مجموعُه لا تفصيلُه.
        </p>
      </Section>

      <Section
        title="الطلاب"
        subtitle="اضغط اسمَ الطالب لتقريره المفصَّل"
        icon={<Users className="size-4" />}
        count={shown.length}
        group="reports"
      >
        {shown.length === 0 ? (
          <p className="py-10 text-center text-sm text-muted-foreground">
            {rows.length === 0 ? "لا طلابَ مسجَّلين بعد." : "لا طالبَ يطابق التصفية."}
          </p>
        ) : (
          <DataTable head={["الطالب", "الحالة", "الكورسات", "التقدّم", "الدروس", "الواجبات", "المدفوع", "آخر ظهور", ""]}>
            {shown.map((r) => (
              <tr key={r.id} className="border-b border-border/60 last:border-0">
                <td className="px-4 py-3">
                  <span className="block font-bold">{r.name}</span>
                  <span className="block text-[11px] text-muted-foreground">{r.grade ?? "—"}</span>
                </td>
                <td className="px-4 py-3">
                  <span className="rp-b" data-k={r.state}>{STATE_LABEL[r.state]}</span>
                </td>
                <td className="px-4 py-3 tabular-nums">{ar(r.activeCourses)}</td>
                <td className="px-4 py-3">
                  <span className="rp-bar"><span className="rp-bar-i" style={{ inlineSize: `${r.progress}%` }} /></span>
                  <span className="rp-bar-n">{ar(r.progress)}٪</span>
                </td>
                <td className="px-4 py-3 tabular-nums text-muted-foreground">
                  {ar(r.lessonsDone)} / {ar(r.lessonsTotal)}
                </td>
                <td className="px-4 py-3 tabular-nums">
                  {r.quizzes === 0 ? <span className="text-muted-foreground">—</span>
                    : <>{ar(r.quizAvg ?? 0)}٪ <span className="text-[11px] text-muted-foreground">({ar(r.quizzes)})</span></>}
                </td>
                <td className="px-4 py-3 tabular-nums">{r.paid ? `${ar(r.paid)} ج.م` : <span className="text-muted-foreground">—</span>}</td>
                <td className="px-4 py-3 tabular-nums">
                  {r.daysSinceSeen === null ? <span className="text-muted-foreground">لم يُسجَّل</span>
                    : r.daysSinceSeen === 0 ? "اليوم"
                      : <span className={r.daysSinceSeen >= AWAY_DAYS ? "font-bold text-rose-500" : ""}>
                          منذ {ar(r.daysSinceSeen)} يوماً
                        </span>}
                </td>
                <td className="px-4 py-3">
                  <Link
                    href={`/admin/students/${r.id}`}
                    title="التقرير المفصَّل"
                    className="inline-flex items-center gap-1.5 whitespace-nowrap rounded-full border border-border px-3 py-1.5 text-[11px] font-bold text-muted-foreground transition hover:border-primary hover:text-primary"
                  >
                    <ExternalLink className="size-3.5" /> التفصيل
                  </Link>
                </td>
              </tr>
            ))}
          </DataTable>
        )}
      </Section>
    </>
  );
}
