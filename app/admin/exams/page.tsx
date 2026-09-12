"use client";

/**
 * الاختبارات — تُبنى بالكامل داخل اللوحة (أسئلة اختيار من متعدّد)،
 * ويحلّها الطالب داخل المنصّة بمؤقّت وتصحيح تلقائي على الخادم.
 * الإجابات الصحيحة لا تغادر الخادم إطلاقاً.
 */
import { useState } from "react";
import {
  FileCheck2, Clock, Users, Percent, Trash2, Plus, X, Check, Pencil,
  ListChecks, ShieldCheck, Globe, Eye, EyeOff, BarChart3,
} from "lucide-react";
import { PageHeader, Card, StatusBadge, Progress, DataTable } from "@/components/dashboard/ui";
import { Button } from "@/components/ui/primitives";
import { useContent } from "@/components/content/content-provider";
import { TRACKS } from "@/lib/utils/data";
import type { Exam, ExamQuestion, LiveAudience } from "@/lib/utils/types";

type Draft = {
  title: string;
  subjectId: string;
  grade: string;
  track: string;
  duration: number;
  passScore: number;
  attempts: number;
  audience: LiveAudience;
  status: Exam["status"];
  questions: ExamQuestion[];
};

const EMPTY: Draft = {
  title: "", subjectId: "", grade: "كل الصفوف", track: "", duration: 20,
  passScore: 60, attempts: 0, audience: "subscribers", status: "منشور", questions: [],
};

export default function ExamsPage() {
  const { db, save } = useContent();
  const exams = db?.exams ?? [];
  const subjects = db?.subjects ?? [];
  const grades = db?.grades ?? [];
  const students = (db?.users ?? []).filter((u) => u.role === "student");

  const [editing, setEditing] = useState<string | null>(null);
  const [open, setOpen] = useState(false);
  const [d, setD] = useState<Draft>(EMPTY);
  const [q, setQ] = useState({ text: "", options: ["", "", "", ""], correct: 0, points: 1 });
  const [results, setResults] = useState<string | null>(null);

  const set = (patch: Partial<Draft>) => setD((prev) => ({ ...prev, ...patch }));

  const startAdd = () => { setEditing(null); setD(EMPTY); setOpen(true); };
  const startEdit = (e: Exam) => {
    setEditing(e.id);
    setD({
      title: e.title, subjectId: e.subjectId ?? "", grade: e.grade, track: e.track ?? "",
      duration: e.duration, passScore: e.passScore ?? 60, attempts: e.attempts ?? 0,
      audience: e.audience ?? "subscribers", status: e.status, questions: e.questions ?? [],
    });
    setOpen(true);
  };

  const addQuestion = () => {
    const options = q.options.map((o) => o.trim()).filter(Boolean);
    if (!q.text.trim() || options.length < 2) return;
    set({
      questions: [
        ...d.questions,
        {
          id: `EQ-${Date.now()}`,
          text: q.text.trim(),
          options,
          correct: Math.min(q.correct, options.length - 1),
          points: Math.max(1, Number(q.points) || 1),
        },
      ],
    });
    setQ({ text: "", options: ["", "", "", ""], correct: 0, points: 1 });
  };
  const removeQuestion = (id: string) => set({ questions: d.questions.filter((x) => x.id !== id) });
  const moveQuestion = (i: number, dir: -1 | 1) => {
    const j = i + dir;
    if (j < 0 || j >= d.questions.length) return;
    const arr = [...d.questions];
    [arr[i], arr[j]] = [arr[j], arr[i]];
    set({ questions: arr });
  };

  const commit = () => {
    if (!d.title.trim()) return;
    const subject = subjects.find((s) => s.id === d.subjectId);
    const current = exams.find((e) => e.id === editing);
    const exam: Exam = {
      id: editing ?? `EX-${Date.now()}`,
      title: d.title.trim(),
      subject: subject?.name || "عام",
      subjectId: d.subjectId || undefined,
      grade: d.grade,
      track: d.track || undefined,
      questions: d.questions,
      duration: Number(d.duration) || 0,
      passScore: Number(d.passScore) || 60,
      attempts: Number(d.attempts) || 0,
      audience: d.audience,
      submissions: current?.submissions ?? 0,
      avg: current?.avg ?? 0,
      createdAt: current?.createdAt ?? new Date().toISOString(),
      status: d.status,
    };
    save({ exams: editing ? exams.map((e) => (e.id === editing ? exam : e)) : [exam, ...exams] });
    setOpen(false); setEditing(null); setD(EMPTY);
  };

  const remove = (id: string) => save({ exams: exams.filter((e) => e.id !== id) });
  const toggleStatus = (id: string) =>
    save({ exams: exams.map((e) => (e.id === id ? { ...e, status: e.status === "منشور" ? "مجدول" : "منشور" } : e)) });

  /** أفضل محاولة لكل طالب في اختبار. */
  const attemptsOf = (examId: string) =>
    students
      .map((u) => {
        const tries = (u.examAttempts ?? []).filter((a) => a.examId === examId);
        if (!tries.length) return null;
        const best = tries.reduce((a, b) => (b.percent > a.percent ? b : a));
        return { name: u.name, grade: u.grade, tries: tries.length, ...best };
      })
      .filter(Boolean) as Array<{ name: string; grade?: string; tries: number; score: number; total: number; percent: number; passed: boolean; at: string }>;

  const totalPoints = d.questions.reduce((n, x) => n + (x.points ?? 1), 0);

  return (
    <>
      <PageHeader
        title="الاختبارات"
        subtitle="ابنِ الاختبار وأسئلته هنا — الطالب يحلّه داخل المنصّة والتصحيح تلقائي"
        action={<Button className="px-5 py-2.5" onClick={startAdd}><Plus className="size-4" /> اختبار جديد</Button>}
      />

      {open && (
        <Card className="mb-6">
          <div className="mb-4 flex items-center justify-between">
            <h3 className="font-display font-extrabold">{editing ? "تعديل الاختبار" : "اختبار جديد"}</h3>
            <button onClick={() => { setOpen(false); setEditing(null); }} className="grid size-8 place-items-center rounded-full border border-border"><X className="size-4" /></button>
          </div>

          {/* بيانات الاختبار */}
          <div className="grid gap-3 sm:grid-cols-6">
            <label className="sm:col-span-3"><span className="lbl">عنوان الاختبار</span>
              <input value={d.title} onChange={(e) => set({ title: e.target.value })} className="inp" placeholder="اختبار الوحدة الأولى — النحو" />
            </label>
            <label className="sm:col-span-3"><span className="lbl">الكورس (اختياري)</span>
              <select value={d.subjectId} onChange={(e) => set({ subjectId: e.target.value })} className="inp">
                <option value="">عام (غير مرتبط بكورس)</option>
                {subjects.map((s) => <option key={s.id} value={s.id}>{s.name}</option>)}
              </select>
            </label>
            <label className="sm:col-span-2"><span className="lbl">الصف</span>
              <select value={d.grade} onChange={(e) => set({ grade: e.target.value })} className="inp">
                <option>كل الصفوف</option>
                {grades.map((g) => <option key={g.id}>{g.name}</option>)}
              </select>
            </label>
            <label><span className="lbl">الشعبة</span>
              <select value={d.track} onChange={(e) => set({ track: e.target.value })} className="inp">
                <option value="">الكل</option>
                {TRACKS.map((t) => <option key={t}>{t}</option>)}
              </select>
            </label>
            <label><span className="lbl">المدة (دقيقة)</span>
              <input type="number" min={0} value={d.duration} onChange={(e) => set({ duration: Number(e.target.value) })} className="inp" />
            </label>
            <label><span className="lbl">نسبة النجاح ٪</span>
              <input type="number" min={0} max={100} value={d.passScore} onChange={(e) => set({ passScore: Number(e.target.value) })} className="inp" />
            </label>
            <label><span className="lbl">المحاولات (٠ = مفتوح)</span>
              <input type="number" min={0} value={d.attempts} onChange={(e) => set({ attempts: Number(e.target.value) })} className="inp" />
            </label>
            <label className="sm:col-span-2"><span className="lbl">من يدخل الاختبار</span>
              <select value={d.audience} onChange={(e) => set({ audience: e.target.value as LiveAudience })} className="inp">
                <option value="subscribers">المشتركون فقط</option>
                <option value="all">كل الطلاب المسجّلين</option>
              </select>
            </label>
            <label className="sm:col-span-2"><span className="lbl">الحالة</span>
              <select value={d.status} onChange={(e) => set({ status: e.target.value as Exam["status"] })} className="inp">
                <option value="منشور">منشور (متاح للطلاب)</option>
                <option value="مجدول">مجدول (مخفي)</option>
              </select>
            </label>
          </div>

          {/* الأسئلة */}
          <div className="mt-6 border-t border-border pt-5">
            <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
              <p className="inline-flex items-center gap-2 font-display font-extrabold">
                <ListChecks className="size-5 text-primary" /> الأسئلة
              </p>
              <span className="text-xs text-muted-foreground">
                {d.questions.length.toLocaleString("ar-EG")} سؤال · {totalPoints.toLocaleString("ar-EG")} درجة
              </span>
            </div>

            {d.questions.length > 0 && (
              <div className="mb-4 space-y-2">
                {d.questions.map((item, i) => (
                  <div key={item.id} className="rounded-2xl border border-border bg-card/50 p-3">
                    <div className="flex items-start gap-2">
                      <div className="flex flex-col text-muted-foreground">
                        <button onClick={() => moveQuestion(i, -1)} disabled={i === 0} className="hover:text-primary disabled:opacity-30">▲</button>
                        <button onClick={() => moveQuestion(i, 1)} disabled={i === d.questions.length - 1} className="hover:text-primary disabled:opacity-30">▼</button>
                      </div>
                      <span className="grid size-6 shrink-0 place-items-center rounded-full bg-primary/12 text-xs font-bold text-primary">{i + 1}</span>
                      <div className="min-w-0 flex-1">
                        <p className="text-sm font-semibold">{item.text}</p>
                        <ul className="mt-1 flex flex-wrap gap-2 text-xs">
                          {item.options.map((o, k) => (
                            <li key={k} className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 ${k === item.correct ? "bg-emerald-500/15 font-bold text-emerald-500" : "bg-muted text-muted-foreground"}`}>
                              {k === item.correct && <Check className="size-3" />}{o}
                            </li>
                          ))}
                        </ul>
                      </div>
                      <span className="shrink-0 rounded-full bg-muted px-2 py-0.5 text-[10px] font-bold text-muted-foreground">{item.points ?? 1} درجة</span>
                      <button onClick={() => removeQuestion(item.id)} title="حذف" className="grid size-7 shrink-0 place-items-center rounded-full border border-border text-rose-500 transition hover:border-rose-500"><X className="size-3.5" /></button>
                    </div>
                  </div>
                ))}
              </div>
            )}

            <div className="grid gap-2 rounded-2xl border border-dashed border-border p-3">
              <input value={q.text} onChange={(e) => setQ({ ...q, text: e.target.value })} className="inp" placeholder="نص السؤال…" />
              <div className="grid gap-2 sm:grid-cols-2">
                {q.options.map((o, i) => (
                  <label key={i} className="flex items-center gap-2">
                    <input type="radio" name="exam-correct" checked={q.correct === i} onChange={() => setQ({ ...q, correct: i })} className="size-4 accent-[hsl(var(--primary))]" />
                    <input value={o} onChange={(e) => setQ({ ...q, options: q.options.map((x, k) => (k === i ? e.target.value : x)) })}
                      className="inp" placeholder={`الاختيار ${i + 1}${i === 0 ? " (حدّد الصحيح بالدائرة)" : ""}`} />
                  </label>
                ))}
              </div>
              <div className="flex flex-wrap items-center gap-2">
                <label className="inline-flex items-center gap-2 text-xs text-muted-foreground">
                  الدرجة
                  <input type="number" min={1} value={q.points} onChange={(e) => setQ({ ...q, points: Number(e.target.value) })} className="w-20 rounded-xl border border-border bg-card/60 px-2 py-1 text-xs outline-none" />
                </label>
                <Button className="px-5 py-2" onClick={addQuestion}><Plus className="size-4" /> إضافة السؤال</Button>
              </div>
            </div>
          </div>

          <div className="mt-5 flex items-center gap-2 border-t border-border pt-4">
            <Button className="px-5 py-2.5" onClick={commit}><Check className="size-4" /> {editing ? "حفظ التعديل" : "حفظ الاختبار"}</Button>
            <button onClick={() => { setOpen(false); setEditing(null); }} className="rounded-full border border-border px-4 py-2.5 text-sm font-bold">إلغاء</button>
            {d.questions.length === 0 && <span className="text-xs text-amber-500">أضِف سؤالاً واحداً على الأقل ليبدأ الطلاب الاختبار.</span>}
          </div>
        </Card>
      )}

      {exams.length === 0 ? (
        <p className="rounded-3xl border border-dashed border-border p-10 text-center text-sm text-muted-foreground">
          لا توجد اختبارات بعد. أنشئ أول اختبار وأضِف أسئلته.
        </p>
      ) : (
        <div className="grid gap-4 lg:grid-cols-2" data-reveal-group>
          {exams.map((e) => {
            const subscribersOnly = (e.audience ?? "subscribers") === "subscribers";
            const rows = attemptsOf(e.id);
            return (
              <div key={e.id}>
                <Card>
                  <div className="mb-3 flex items-start justify-between gap-2">
                    <div className="min-w-0">
                      <h3 className="font-display text-lg font-extrabold">{e.title}</h3>
                      <p className="text-xs text-muted-foreground">{e.subject} · {e.grade}{e.track ? ` · ${e.track}` : ""}</p>
                    </div>
                    <StatusBadge status={e.status} />
                  </div>

                  <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
                    <Stat icon={<FileCheck2 className="size-4" />} label="سؤال" value={e.questions.length} />
                    <Stat icon={<Clock className="size-4" />} label="دقيقة" value={e.duration || "—"} />
                    <Stat icon={<Users className="size-4" />} label="طالب" value={e.submissions} />
                    <Stat icon={<Percent className="size-4" />} label="متوسط" value={`${e.avg}٪`} />
                  </div>

                  <div className="mt-3">
                    <Progress value={e.avg} />
                  </div>

                  <div className="mt-3 flex flex-wrap items-center gap-2">
                    <span className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-bold ${subscribersOnly ? "bg-violet-500/15 text-violet-500" : "bg-sky-500/15 text-sky-500"}`}>
                      {subscribersOnly ? <ShieldCheck className="size-3" /> : <Globe className="size-3" />}
                      {subscribersOnly ? "المشتركون فقط" : "كل الطلاب"}
                    </span>
                    <span className="rounded-full bg-muted px-2 py-0.5 text-[10px] font-bold text-muted-foreground">
                      النجاح {e.passScore ?? 60}٪ · {e.attempts ? `${e.attempts} محاولة` : "محاولات مفتوحة"}
                    </span>
                  </div>

                  <div className="mt-4 flex items-center gap-1 border-t border-border pt-4">
                    <button onClick={() => setResults(results === e.id ? null : e.id)}
                      className="inline-flex items-center gap-1.5 rounded-full border border-border px-4 py-2 text-xs font-bold transition hover:border-primary hover:text-primary">
                      <BarChart3 className="size-3.5" /> النتائج ({rows.length.toLocaleString("ar-EG")})
                    </button>
                    <button onClick={() => toggleStatus(e.id)} title="نشر/إخفاء" className="mr-auto grid size-8 place-items-center rounded-full border border-border text-primary transition hover:border-primary">
                      {e.status === "منشور" ? <Eye className="size-4" /> : <EyeOff className="size-4" />}
                    </button>
                    <button onClick={() => startEdit(e)} title="تعديل" className="grid size-8 place-items-center rounded-full border border-border text-primary transition hover:border-primary"><Pencil className="size-4" /></button>
                    <button onClick={() => remove(e.id)} title="حذف" className="grid size-8 place-items-center rounded-full border border-border text-rose-500 transition hover:border-rose-500"><Trash2 className="size-4" /></button>
                  </div>

                  {results === e.id && (
                    <div className="mt-4">
                      {rows.length === 0 ? (
                        <p className="rounded-2xl border border-dashed border-border p-4 text-center text-xs text-muted-foreground">لم يحلّه أحد بعد.</p>
                      ) : (
                        <DataTable head={["الطالب", "الصف", "الدرجة", "النسبة", "الحالة", "المحاولات", "التاريخ"]}>
                          {rows.map((r) => (
                            <tr key={r.name + r.at} className="transition hover:bg-muted/50">
                              <td className="px-4 py-2 font-semibold">{r.name}</td>
                              <td className="px-4 py-2 text-muted-foreground">{r.grade ?? "—"}</td>
                              <td className="px-4 py-2">{r.score}/{r.total}</td>
                              <td className="px-4 py-2 font-bold text-primary">{r.percent}٪</td>
                              <td className="px-4 py-2">
                                <span className={`rounded-full px-2 py-0.5 text-[10px] font-bold ${r.passed ? "bg-emerald-500/15 text-emerald-500" : "bg-rose-500/15 text-rose-500"}`}>
                                  {r.passed ? "ناجح" : "راسب"}
                                </span>
                              </td>
                              <td className="px-4 py-2 text-muted-foreground">{r.tries}</td>
                              <td className="px-4 py-2 text-muted-foreground">{new Date(r.at).toLocaleDateString("ar-EG", { timeZone: "Africa/Cairo" })}</td>
                            </tr>
                          ))}
                        </DataTable>
                      )}
                    </div>
                  )}
                </Card>
              </div>
            );
          })}
        </div>
      )}
    </>
  );
}

function Stat({ icon, label, value }: { icon: React.ReactNode; label: string; value: React.ReactNode }) {
  return (
    <div className="rounded-2xl border border-border p-2.5 text-center">
      <span className="mx-auto mb-1 grid size-7 place-items-center rounded-xl bg-primary/12 text-primary">{icon}</span>
      <p className="font-display text-sm font-extrabold">{typeof value === "number" ? value.toLocaleString("ar-EG") : value}</p>
      <p className="text-[10px] text-muted-foreground">{label}</p>
    </div>
  );
}
