"use client";

import { useState } from "react";
import { Users, BookOpen, Plus, Trash2, X } from "lucide-react";
import { PageHeader, Card } from "@/components/dashboard/ui";
import { Button } from "@/components/ui/primitives";
import { useContent } from "@/components/content/content-provider";
import { TERMS } from "@/lib/business/signup-rules";
import type { GradeRow, TermRow } from "@/lib/utils/types";
import { STAGES } from "@/lib/utils/data";
import { Section } from "@/components/dashboard/section";

const SWATCHES = ["#12b981", "#2b8bf6", "#7c3aed", "#e11d48", "#f59e0b", "#0ea5e9"];

export default function GradesPage() {
  const { db, save, content, saveContent } = useContent();
  const grades = db?.grades ?? [];
  const [adding, setAdding] = useState(false);
  const [name, setName] = useState("");
  const [color, setColor] = useState(SWATCHES[0]);

  const add = async () => {
    if (!name.trim()) return;
    const g: GradeRow = { id: `G-${Date.now()}`, name: name.trim(), students: 0, subjects: 0, color };
    await save({ grades: [...grades, g] });
    setName(""); setAdding(false);
  };
  const remove = (id: string) => save({ grades: grades.filter((g) => g.id !== id) });

  return (
    <>
      <PageHeader title="الصفوف والفصول" subtitle="الصفوف تُضاف وتُحذف · والفصلان ثابتان في المنصّة"
        action={<Button className="px-5 py-2.5" onClick={() => setAdding((v) => !v)}><Plus className="size-4" /> إضافة صف</Button>} />

      {adding && (
        <Card className="mb-4">
          <div className="flex flex-wrap items-end gap-3">
            <label className="flex-1"><span className="mb-1 block text-xs font-semibold text-muted-foreground">اسم الصف</span>
              <input autoFocus value={name} onChange={(e) => setName(e.target.value)} onKeyDown={(e) => e.key === "Enter" && add()}
                placeholder="مثال: الصف الأول الثانوي" className="w-full rounded-2xl border border-border bg-card/60 px-4 py-2.5 text-sm outline-none focus:border-primary/50" />
            </label>
            <div>
              <span className="mb-1 block text-xs font-semibold text-muted-foreground">اللون</span>
              <div className="flex gap-1.5">
                {SWATCHES.map((c) => (
                  <button key={c} onClick={() => setColor(c)} className={`size-8 rounded-lg ring-2 transition ${color === c ? "ring-primary" : "ring-transparent"}`} style={{ background: c }} />
                ))}
              </div>
            </div>
            <Button className="px-5 py-2.5" onClick={add}>حفظ</Button>
            <button onClick={() => setAdding(false)} className="grid size-10 place-items-center rounded-full border border-border"><X className="size-4" /></button>
          </div>
        </Card>
      )}

      {grades.length === 0 ? (
        <p className="rounded-3xl border border-dashed border-border p-10 text-center text-sm text-muted-foreground">لا توجد صفوف دراسية. أضِف أول صف ليظهر على الموقع.</p>
      ) : (
        <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3" data-reveal-group>
          {grades.map((g) => (
            <div key={g.id}>
              <Card className="group relative overflow-hidden">
                <span className="pointer-events-none absolute -left-6 -top-6 size-24 rounded-full opacity-20 blur-2xl transition group-hover:opacity-40" style={{ background: g.color }} />
                <div className="flex items-start justify-between">
                  <span className="mb-4 grid size-12 place-items-center rounded-2xl text-white" style={{ background: g.color }}><BookOpen className="size-6" /></span>
                  <button onClick={() => remove(g.id)} title="حذف" className="grid size-8 place-items-center rounded-full border border-border text-rose-500 transition hover:border-rose-500"><Trash2 className="size-4" /></button>
                </div>
                <h3 className="font-display text-lg font-extrabold">{g.name}</h3>
                <div className="mt-4 flex items-center gap-4 text-sm text-muted-foreground">
                  <span className="inline-flex items-center gap-1"><Users className="size-4" /> {g.students.toLocaleString("ar-EG")} طالب</span>
                  <span className="inline-flex items-center gap-1"><BookOpen className="size-4" /> {g.subjects} مواد</span>
                </div>
              </Card>
            </div>
          ))}
        </div>
      )}

      {/* ---------------- الفصول الدراسية ---------------- */}
      <TermsCard />
    </>
  );
}

/**
 * الفصلان الدراسيان — عرضٌ لا إعداد.
 * ------------------------------------------------------------------
 * كل منهج مصريّ فصلان لا أكثر، فليس هذا إعداداً يُضبط بل حقيقةٌ في
 * البنية. إبقاؤه إعداداً كان يفتح باباً لأخطاء لا طائل منها: فصلٌ ثالث،
 * أو اسمٌ لا يطابق ما تعنيه الكورسات بـ‎term: 1‎ و‎term: 2‎.
 */
function TermsCard() {
  return (
    <Section title="الفصلان الدراسيان">
      <p className="mt-0.5 text-xs leading-relaxed text-muted-foreground">
        ثابتان في المنصّة ولا يُضافان ولا يُحذفان. يظهران للطالب عند التسجيل،
        وتُقسَّم بهما الكورسات من شاشة الكورس نفسه.
      </p>

      <div className="mt-4 grid gap-2 sm:grid-cols-2">
        {TERMS.map((t, i) => (
          <div
            key={t.id}
            className="flex items-center gap-3 rounded-2xl border border-border px-4 py-3"
          >
            <span className="font-display grid size-8 shrink-0 place-items-center rounded-xl bg-primary/10 text-sm font-extrabold text-primary">
              {(i + 1).toLocaleString("ar-EG")}
            </span>
            <span className="min-w-0">
              <span className="block truncate text-sm font-bold">{t.name}</span>
              <span className="block font-mono text-[10px] text-muted-foreground">{t.id}</span>
            </span>
          </div>
        ))}
      </div>
    </Section>
  );
}
