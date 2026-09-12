"use client";

import { useState } from "react";
import { Bell, Send, Trash2 } from "lucide-react";
import { PageHeader, Card } from "@/components/dashboard/ui";
import { Button } from "@/components/ui/primitives";
import { useContent } from "@/components/content/content-provider";
import { TRACKS } from "@/lib/utils/data";
import { Section } from "@/components/dashboard/section";

export default function NotificationsPage() {
  const { db, save, refresh } = useContent();
  const [sending, setSending] = useState(false);
  const [result, setResult] = useState<string | null>(null);
  const notifications = db?.notifications ?? [];
  const grades = db?.grades ?? [];
  const students = (db?.users ?? []).filter((u) => u.role === "student");
  const [f, setF] = useState({ title: "", body: "", grade: "", track: "", userId: "" });

  /** الإرسال يحفظ الإشعار داخل المنصّة ويدفعه لأجهزة الطلاب المشتركين. */
  const send = async () => {
    if (!f.title.trim() || !f.body.trim()) return;
    setSending(true);
    setResult(null);
    try {
      const res = await fetch("/api/notifications", {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: f.title, body: f.body,
          userId: f.userId || undefined,
          grade: f.userId ? undefined : f.grade || undefined,
          track: f.userId ? undefined : f.track || undefined,
        }),
      });
      const data = await res.json();
      if (!res.ok) { setResult(data.error || "تعذّر الإرسال"); return; }
      setResult(
        !data.pushConfigured
          ? "تم الحفظ في المنصّة (إشعارات الأجهزة غير مضبوطة على الخادم)"
          : data.delivery.sent > 0
            ? `تم الإرسال ووصل إلى ${data.delivery.sent} جهاز`
            : "تم الحفظ — لا توجد أجهزة مفعّلة للإشعارات بعد"
      );
      setF({ title: "", body: "", grade: "", track: "", userId: "" });
      await refresh();
    } finally {
      setSending(false);
    }
  };
  const nameOf = (uid?: string) => students.find((u) => u.id === uid)?.name;
  const remove = async (id: string) => {
    await fetch("/api/notifications", {
      method: "DELETE", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id }),
    });
    await refresh();
  };

  return (
    <>
      <PageHeader title="الإشعارات" subtitle="أرسل إشعارات لكل الطلاب أو لصف/شعبة محدّدة" />

      <Section className="mb-6" title="إشعار جديد">
        <div className="grid gap-3">
          <label><span className="mb-1 block text-xs font-semibold text-muted-foreground">العنوان</span>
            <input value={f.title} onChange={(e) => setF({ ...f, title: e.target.value })} className="inp" placeholder="مثال: موعد بث مباشر" /></label>
          <label><span className="mb-1 block text-xs font-semibold text-muted-foreground">النص</span>
            <textarea rows={3} value={f.body} onChange={(e) => setF({ ...f, body: e.target.value })} className="inp" placeholder="تفاصيل الإشعار…" /></label>
          <div className="grid gap-3 sm:grid-cols-4">
            <label><span className="mb-1 block text-xs font-semibold text-muted-foreground">طالب بعينه (اختياري)</span>
              <select value={f.userId} onChange={(e) => setF({ ...f, userId: e.target.value })} className="inp">
                <option value="">كل الطلاب</option>
                {students.map((u) => <option key={u.id} value={u.id}>{u.name}{u.grade ? ` — ${u.grade}` : ""}</option>)}
              </select></label>
            <label><span className="mb-1 block text-xs font-semibold text-muted-foreground">الصف (اختياري)</span>
              <select value={f.grade} disabled={Boolean(f.userId)} onChange={(e) => setF({ ...f, grade: e.target.value })} className="inp disabled:opacity-50">
                <option value="">كل الصفوف</option>{grades.map((g) => <option key={g.id}>{g.name}</option>)}
              </select></label>
            <label><span className="mb-1 block text-xs font-semibold text-muted-foreground">الشعبة (اختياري)</span>
              <select value={f.track} disabled={Boolean(f.userId)} onChange={(e) => setF({ ...f, track: e.target.value })} className="inp disabled:opacity-50">
                <option value="">الكل</option>{TRACKS.map((t) => <option key={t}>{t}</option>)}
              </select></label>
            <div className="flex items-end">
              <Button className="w-full px-5 py-2.5" onClick={send} disabled={sending}>
                <Send className="size-4" /> {sending ? "جارٍ الإرسال…" : "إرسال"}
              </Button>
            </div>
          </div>
        </div>
        {result && (
          <p className="mt-3 rounded-2xl bg-primary/10 px-3 py-2 text-center text-xs font-bold text-primary">{result}</p>
        )}
        <p className="mt-3 text-[11px] text-muted-foreground">
          الإشعار يظهر داخل بوابة الطالب، ويصل أيضاً كإشعار على شاشة الجهاز لكل طالب فعّل الإشعارات من تطبيقه.
        </p>
      </Section>

      {notifications.length === 0 ? (
        <p className="rounded-3xl border border-dashed border-border p-10 text-center text-sm text-muted-foreground">لا توجد إشعارات بعد.</p>
      ) : (
        <div className="space-y-3" data-reveal-group>
          {notifications.map((n) => (
            <div key={n.id}>
              <Card className="!p-4">
                <div className="flex items-start gap-3">
                  <span className="grid size-10 shrink-0 place-items-center rounded-2xl bg-primary/12 text-primary"><Bell className="size-5" /></span>
                  <div className="min-w-0 flex-1">
                    <p className="flex flex-wrap items-center gap-1.5 font-bold">
                      {n.title}
                      {/* رسالةٌ إلى طالبٍ بعينه لا إلى المشرف — تُعلَّم صراحةً */}
                      {n.userId && (
                        <span className="rounded-full bg-primary/12 px-2 py-0.5 text-[10px] font-bold text-primary">
                          إلى الطالب
                        </span>
                      )}
                    </p>
                    <p className="text-sm text-muted-foreground">{n.body}</p>
                    <p className="mt-1 text-[11px] text-muted-foreground">
                      {new Date(n.createdAt).toLocaleString("ar-EG", { timeZone: "Africa/Cairo" })}
                      {n.userId && ` · ${nameOf(n.userId) ?? "طالب محذوف"}`}
                      {n.grade && ` · ${n.grade}`}{n.track && ` · ${n.track}`}
                      {!n.grade && !n.track && !n.userId && " · للجميع"}
                    </p>
                  </div>
                  <button onClick={() => remove(n.id)} title="حذف" className="grid size-8 shrink-0 place-items-center rounded-full border border-border text-rose-500 transition hover:border-rose-500"><Trash2 className="size-4" /></button>
                </div>
              </Card>
            </div>
          ))}
        </div>
      )}
    </>
  );
}
