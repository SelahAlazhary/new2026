"use client";

/**
 * معاينةُ الكورس كما يراه طالبٌ يملكه.
 * ------------------------------------------------------------------
 * كان الأستاذُ لا يرى ما بناه إلّا بحسابِ طالبٍ اشترى الكورس فعلاً: يخرج
 * من لوحته، ويدخل بحسابٍ آخر، ويمرّ على بوّابة الدفع — ثلاثُ خطواتٍ
 * ليتأكّد أنّ درساً يعمل. فكثيرٌ لا يتأكّد أصلاً، ويكتشف العطبَ من شكوى
 * طالب.
 *
 * فصارت المعاينةُ في اللوحة: يُفتح `UnitView` نفسُه — لا نسخةٌ منه تفترق
 * عنه بعد أوّل تعديل — بـ`owned` مفتوحاً، فتُتجاوز بوّابةُ الدفع.
 *
 * **ولا تمسّ هذه الصفحةُ حراسةَ بوّابة الطالب بشيء.** لا تعديلَ في
 * `app/student/layout.tsx` ولا في `subjectActive`: المعاينةُ مسارٌ في
 * اللوحة، يحرسه حارسُ اللوحة نفسُه — فمن لا يملك اللوحة لا يبلغها. وفتحُ
 * `owned` هنا لا يفتح شيئاً هناك.
 *
 * والشريطُ الأصفرُ فوقها ليس زينة: شاشةٌ تُشبه بوّابةَ الطالب تماماً
 * تُنسي أينَ صاحبُها — فيُقال له صراحةً إنّه في معاينة، وإنّ تقدّمَه هنا
 * لا يُحسب لأحد.
 */

import { use, useMemo, useState } from "react";
import Link from "next/link";
import { useContent } from "@/components/content/content-provider";
import { UnitView } from "@/components/student/unit-view";
import { courseUnits } from "@/lib/business/course-units";

export default function CoursePreview({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const { db } = useContent();
  const subject = db?.subjects.find((s) => s.id === id);
  const units = useMemo(() => (subject ? courseUnits(subject) : []), [subject]);
  const [idx, setIdx] = useState(0);

  if (!subject) {
    return (
      <div className="grid min-h-[50vh] place-items-center">
        <div className="text-center">
          <p className="font-display mb-2 text-lg font-extrabold">لا كورسَ بهذا المعرّف</p>
          <Link href="/admin/subjects" className="text-sm font-bold text-primary hover:underline">
            كلّ الكورسات
          </Link>
        </div>
      </div>
    );
  }

  const unit = units[Math.min(idx, units.length - 1)];

  return (
    <>
      {/* بيانُ المعاينة — شاشةٌ تُشبه بوّابةَ الطالب تُنسي أين صاحبُها */}
      <div
        style={{
          background: "color-mix(in srgb, var(--brand-accent) 30%, transparent)",
          boxShadow: "inset 0 0 0 1px color-mix(in srgb, var(--brand-accent) 70%, transparent)",
        }}
        className="mb-5 flex flex-wrap items-center justify-between gap-3 rounded-2xl px-4 py-3"
      >
        <p className="text-[13px] font-bold leading-relaxed" style={{ color: "var(--brand-primary)" }}>
          معاينة — تشاهد الكورسَ كما يراه طالبٌ يملكه. تقدّمُك هنا لا يُحسب لأحد.
        </p>
        <Link
          href={`/admin/courses/${id}`}
          className="shrink-0 rounded-xl border border-border bg-card px-3.5 py-1.5 text-[12px] font-bold transition hover:border-primary/50 hover:text-primary"
        >
          رجوع إلى التحرير
        </Link>
      </div>

      {/* اختيارُ الوحدة — الطالبُ ينتقل بينها بصفحات، والمعاينةُ بقائمة */}
      {units.length > 1 && (
        <div className="mb-4 flex flex-wrap gap-2">
          {units.map((u, i) => {
            const on = i === Math.min(idx, units.length - 1);
            return (
              <button
                key={u.id}
                type="button"
                onClick={() => setIdx(i)}
                aria-pressed={on}
                style={on ? { background: "var(--brand-primary)" } : undefined}
                className={`rounded-xl border px-3.5 py-2 text-[12px] font-bold transition ${
                  on ? "border-transparent text-white" : "border-border text-muted-foreground hover:text-foreground"
                }`}
              >
                {u.title}
              </button>
            );
          })}
        </div>
      )}

      {unit ? (
        /*
          `owned` مفتوحٌ هنا وحدَه — وهو أثرُ المعاينة كلُّه. والمكوّنُ هو
          مكوّنُ الطالب نفسُه، فما يُرى هنا هو ما يُرى هناك بالضبط.
        */
        <UnitView
          course={subject}
          unit={unit}
          owned
          backHref={`/admin/courses/${id}`}
          backLabel="رجوع إلى التحرير"
        />
      ) : (
        <p className="rounded-2xl border border-dashed border-border p-10 text-center text-sm text-muted-foreground">
          لا وحداتٍ في هذا الكورس بعد.
        </p>
      )}
    </>
  );
}
