"use client";

import Link from "next/link";
import { Users, BadgeCheck, KeyRound, Wallet, Radio, FileCheck2, ChevronLeft, TrendingUp } from "lucide-react";
import { enrollTrend } from "@/lib/business/dashboard-data";
import { StatCard, PageHeader, Card, StatusBadge } from "@/components/dashboard/ui";
import { useContent } from "@/components/content/content-provider";
import { adminInsights } from "@/lib/business/admin-insights";

export default function AdminOverview() {
  const { db, session } = useContent();
  const me = db?.users?.find((u) => u.id === session?.uid);
  const insights = adminInsights(db, me);
  const students = (db?.users ?? []).filter((u) => u.role === "student");
  const subjects = db?.subjects ?? [];
  const codes = db?.codes ?? [];
  const live = db?.live ?? [];
  const tickets = db?.tickets ?? [];
  const payments = db?.payments ?? [];
  const pendingPays = payments.filter((p) => p.status === "pending");

  const plans = db?.plans ?? [];
  const usedCodes = codes.filter((c) => c.status === "مستخدم");
  // الإيراد = مجموع أسعار الخطط التي فُعّلت أكوادها (وللأكواد القديمة: سعر الكورس)
  /*
    الإيراد من التحويلات المقبولة حين تكون البوّابة تعمل — وهي مالٌ
    وصل فعلاً بمبلغه المسجَّل، لا سعرَ خطةٍ قد يكون تغيّر بعد التفعيل.
    وما قبلها يبقى محسوباً بالأكواد المفعَّلة كما كان.
  */
  const approved = payments.filter((p) => p.status === "approved");
  const paidIds = new Set(approved.map((p) => p.id));
  const revenue =
    approved.reduce((sum, p) => sum + (p.amount ?? 0), 0) +
    usedCodes
      .filter((c) => !c.payId || !paidIds.has(c.payId))
      .reduce(
        (sum, c) => sum + (plans.find((p) => p.id === c.planId)?.price ?? subjects.find((s) => s.id === c.subjectId)?.price ?? 0),
        0
      );
  const stats = [
    { label: "إجمالي الطلاب", value: students.length, delta: "", tone: "primary", icon: <Users className="size-5" /> },
    { label: "الكورسات المنشورة", value: subjects.filter((s) => s.status === "منشورة").length, delta: "", tone: "emerald", icon: <BadgeCheck className="size-5" /> },
    { label: "تحويلات تنتظر المراجعة", value: pendingPays.length, delta: "", tone: "amber", icon: <KeyRound className="size-5" /> },
    { label: "إيراد محقّق (ج.م)", value: revenue, delta: "", tone: "violet", icon: <Wallet className="size-5" /> },
  ];
  const max = Math.max(...enrollTrend);

  return (
    <>
      <PageHeader title="نظرة عامة" subtitle="ملخّص أداء المنصّة" />

      {/*
        ما يحتاج انتباهك.
        ------------------------------------------------------------------
        الأرقام تصف الماضي ولا تقول ما العمل. هذه القائمة تقلب السؤال:
        ما الذي يعطّل المنصّة الآن، وما الذي ينتظر ردّاً، وما نُصِب ولم
        يُكمَل — ولا يُعرض منها إلا ما يملك هذا المشرف صلاحيتَه.
      */}
      {insights.length > 0 && (
        <div className="mb-6 grid gap-2.5">
          {insights.map((x) => {
            const tone =
              x.level === "urgent"
                ? "border-rose-500/40 bg-rose-500/[0.07] hover:border-rose-500/70"
                : x.level === "warn"
                  ? "border-amber-500/40 bg-amber-500/[0.07] hover:border-amber-500/70"
                  : "border-border bg-card hover:border-primary/50";
            const dot =
              x.level === "urgent" ? "bg-rose-500" : x.level === "warn" ? "bg-amber-500" : "bg-primary";
            return (
              <Link
                key={x.id}
                href={x.href}
                className={`flex flex-wrap items-center gap-3 rounded-2xl border px-4 py-3 transition ${tone}`}
              >
                <span className={`size-2 shrink-0 rounded-full ${dot}`} />
                <span className="font-display text-sm font-extrabold">{x.label}</span>
                {x.count ? (
                  <span className={`grid min-w-6 place-items-center rounded-full px-2 py-0.5 text-[11px] font-extrabold text-white ${dot}`}>
                    {x.count.toLocaleString("ar-EG")}
                  </span>
                ) : null}
                <span className="min-w-0 flex-1 truncate text-xs text-muted-foreground">{x.hint}</span>
                <span className="shrink-0 text-xs font-bold text-muted-foreground">افتح ←</span>
              </Link>
            );
          })}
        </div>
      )}

      {insights.length === 0 && (
        <div className="mb-6 flex items-center gap-3 rounded-2xl border border-emerald-500/35 bg-emerald-500/[0.07] px-4 py-3">
          <span className="size-2 shrink-0 rounded-full bg-emerald-500" />
          <span className="font-display text-sm font-extrabold text-emerald-700 dark:text-emerald-400">
            لا شيء ينتظرك — المنصّة تعمل
          </span>
        </div>
      )}

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {stats.map((s, i) => (
          <StatCard key={s.label} index={i} label={s.label} value={s.value.toLocaleString("ar-EG")} delta={s.delta} tone={s.tone} icon={s.icon} />
        ))}
      </div>

      <div className="mt-6 grid gap-6 lg:grid-cols-3">
        <Card className="lg:col-span-2">
          <div className="mb-6 flex items-center justify-between">
            <div>
              <p className="font-display text-lg font-extrabold">نمو التسجيلات</p>
              <p className="text-xs text-muted-foreground">آخر ١٢ شهراً</p>
            </div>
            <span className="inline-flex items-center gap-1 rounded-full bg-emerald-500/12 px-2.5 py-1 text-xs font-bold text-emerald-500"><TrendingUp className="size-3.5" /> +١٨٪</span>
          </div>
          <div className="flex h-48 items-end gap-2">
            {enrollTrend.map((v, i) => (
              <div key={i} className="group flex flex-1 flex-col items-center gap-2">
                <div className="flex w-full flex-1 items-end">
                  <div className="w-full rounded-t-lg bg-gradient-to-t from-primary/40 to-primary transition-all group-hover:from-primary group-hover:to-accent" style={{ height: `${(v / max) * 100}%` }} />
                </div>
              </div>
            ))}
          </div>
        </Card>

        <Card>
          <div className="mb-4 flex items-center justify-between">
            <p className="font-display text-lg font-extrabold">البث المباشر</p>
            <Radio className="size-5 text-primary" />
          </div>
          <div className="space-y-3">
            {live.map((l) => (
              <div key={l.id} className="flex items-center justify-between rounded-2xl border border-border p-3">
                <div className="min-w-0"><p className="truncate text-sm font-bold">{l.title}</p><p className="text-[11px] text-muted-foreground">{l.time}</p></div>
                <StatusBadge status={l.status} />
              </div>
            ))}
          </div>
        </Card>
      </div>

      <div className="mt-6 grid gap-6 lg:grid-cols-2">
        <Card>
          <div className="mb-4 flex items-center justify-between">
            <p className="font-display text-lg font-extrabold">أحدث الطلاب</p>
            <Link href="/admin/students" className="inline-flex items-center gap-1 text-xs font-bold text-primary">الكل <ChevronLeft className="size-4" /></Link>
          </div>
          <div className="space-y-2">
            {students.length === 0 && <p className="py-6 text-center text-sm text-muted-foreground">لا يوجد طلاب بعد.</p>}
            {students.slice(0, 6).map((s) => (
              <div key={s.id} className="flex items-center gap-3 rounded-2xl p-2 transition hover:bg-muted">
                <span className="grid size-9 place-items-center rounded-full bg-primary/12 text-sm font-bold text-primary">{s.name.charAt(0)}</span>
                <div className="min-w-0 flex-1"><p className="truncate text-sm font-semibold">{s.name}</p><p className="text-[11px] text-muted-foreground" dir="ltr">{s.username}</p></div>
                <span className="text-[11px] text-muted-foreground">{new Set((s.subscriptions ?? []).map((x) => x.subjectId)).size} كورس</span>
              </div>
            ))}
          </div>
        </Card>

        <Card>
          <div className="mb-4 flex items-center justify-between">
            <p className="font-display text-lg font-extrabold">تذاكر الدعم</p>
            <Link href="/admin/support" className="inline-flex items-center gap-1 text-xs font-bold text-primary">الكل <ChevronLeft className="size-4" /></Link>
          </div>
          <div className="space-y-2">
            {tickets.map((t) => (
              <div key={t.id} className="flex items-center gap-3 rounded-2xl p-2 transition hover:bg-muted">
                <FileCheck2 className="size-4 shrink-0 text-muted-foreground" />
                <div className="min-w-0 flex-1"><p className="truncate text-sm font-semibold">{t.subject}</p><p className="text-[11px] text-muted-foreground">{t.student} · {t.time}</p></div>
                <StatusBadge status={t.status} />
              </div>
            ))}
          </div>
        </Card>
      </div>
    </>
  );
}
