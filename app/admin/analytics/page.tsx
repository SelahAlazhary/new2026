"use client";

import { TrendingUp, Users, Wallet, PlayCircle, Clock } from "lucide-react";
import { enrollTrend } from "@/lib/business/dashboard-data";
import { PageHeader, Card, StatCard, Progress } from "@/components/dashboard/ui";
import { useContent } from "@/components/content/content-provider";

export default function AnalyticsPage() {
  const { db } = useContent();
  const students = (db?.users ?? []).filter((u) => u.role === "student");
  const active = students;
  const subjects = db?.subjects ?? [];
  const usedCodes = (db?.codes ?? []).filter((c) => c.status === "مستخدم");
  const revenue = usedCodes.reduce((sum, c) => sum + (subjects.find((s) => s.id === c.subjectId)?.price ?? 0), 0);

  // توزّع الطلاب حسب المحافظة (لتجميع بيانات الأماكن)
  const byGov = students.reduce<Record<string, number>>((acc, s) => {
    const g = s.governorate || "غير محدّد";
    acc[g] = (acc[g] ?? 0) + 1;
    return acc;
  }, {});
  const govRows = Object.entries(byGov).sort((a, b) => b[1] - a[1]);
  const maxGov = Math.max(1, ...govRows.map(([, n]) => n));

  const maxTrend = Math.max(...enrollTrend);

  return (
    <>
      <PageHeader title="التحليلات" subtitle="مؤشّرات الأداء الرئيسية والاتجاهات" />

      <div className="mb-6 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard index={0} label="طلاب نشطون" value={active.length.toLocaleString("ar-EG")} delta="+٩٪" tone="primary" icon={<Users className="size-5" />} />
        <StatCard index={1} label="معدّل إكمال الدروس" value="٧٤٪" delta="+٦٪" tone="emerald" icon={<PlayCircle className="size-5" />} />
        <StatCard index={2} label="متوسط وقت المشاهدة" value="٤٢ د/يوم" delta="+٤د" tone="amber" icon={<Clock className="size-5" />} />
        <StatCard index={3} label="إيراد تقديري" value={`${revenue.toLocaleString("ar-EG")} ج.م`} delta="+١٨٪" tone="violet" icon={<Wallet className="size-5" />} />
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        <Card className="lg:col-span-2">
          <div className="mb-6 flex items-center justify-between">
            <p className="font-display text-lg font-extrabold">اتجاه التسجيل الشهري</p>
            <span className="inline-flex items-center gap-1 rounded-full bg-emerald-500/12 px-2.5 py-1 text-xs font-bold text-emerald-500"><TrendingUp className="size-3.5" /> نمو مستمر</span>
          </div>
          <div className="flex h-56 items-end gap-2">
            {enrollTrend.map((v, i) => (
              <div key={i} className="flex flex-1 flex-col items-center justify-end gap-2">
                <div className="w-full rounded-t-lg bg-gradient-to-t from-primary/40 to-primary" style={{ height: `${(v / maxTrend) * 100}%` }} />
                <span className="text-[11px] text-muted-foreground">{i + 1}</span>
              </div>
            ))}
          </div>
        </Card>

        <Card>
          <p className="mb-1 font-display text-lg font-extrabold">توزّع الطلاب حسب المحافظة</p>
          <p className="mb-5 text-xs text-muted-foreground">لتجميع بيانات أماكن الطلاب</p>
          {govRows.length === 0 ? (
            <p className="py-8 text-center text-sm text-muted-foreground">لا توجد بيانات بعد.</p>
          ) : (
            <div className="max-h-72 space-y-4 overflow-y-auto pl-1">
              {govRows.map(([g, n]) => (
                <div key={g}>
                  <div className="mb-1.5 flex items-center justify-between text-sm"><span className="font-semibold">{g}</span><span className="text-muted-foreground">{n.toLocaleString("ar-EG")} طالب</span></div>
                  <Progress value={(n / maxGov) * 100} />
                </div>
              ))}
            </div>
          )}
        </Card>
      </div>
    </>
  );
}
