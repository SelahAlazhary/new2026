"use client";

/**
 * البث المباشر — إنشاء جلسات Google Meet مباشرة من اللوحة، وتحديد من يراها:
 * «المشتركون فقط» أو «كل الطلاب المسجّلين».
 * الرابط لا يُرسل للمتصفّح إلا لمن يحقّ له فتحه (تُفرض القاعدة على الخادم).
 */
import { useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import { motion } from "framer-motion";
import {
  Radio, Users, Calendar, Plus, Trash2, X, Video, Link2, Copy, Check,
  Loader2, LogOut, ShieldCheck, Globe, AlertTriangle, Gift, Tv, Users2, Square, PlayCircle,
} from "lucide-react";
import { PageHeader, Card, StatusBadge } from "@/components/dashboard/ui";
import { Section } from "@/components/dashboard/section";
import { Button } from "@/components/ui/primitives";
import { useContent } from "@/components/content/content-provider";
import { TRACKS } from "@/lib/utils/data";
import type { Live, LiveAudience } from "@/lib/utils/types";

/** الموعد الافتراضي: بعد ساعة، بصيغة datetime-local. */
function defaultStart(): string {
  const d = new Date(Date.now() + 60 * 60 * 1000);
  d.setMinutes(0, 0, 0);
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

const CALLBACK_MSG: Record<string, string> = {
  connected: "تم ربط حساب جوجل بنجاح ✅",
  denied: "أُلغيت الموافقة من جوجل.",
  state: "انتهت صلاحية الطلب — حاول الربط مرة أخرى.",
  nocode: "لم يصل كود التفويض من جوجل.",
  failed: "تعذّر إتمام الربط — تأكّد أن عنوان العودة المسجّل في Google Cloud مطابق تماماً للعنوان الظاهر بالأسفل.",
  unauthorized: "غير مصرّح.",
};

type Form = {
  title: string;
  subjectId: string;
  grade: string;
  track: string;
  startsAt: string;
  duration: number;
  audience: LiveAudience;
  status: Live["status"];
  url: string;
  kind: "broadcast" | "meeting";
};

export default function LivePage() {
  const { db, save, refresh } = useContent();
  const live = db?.live ?? [];
  const subjects = db?.subjects ?? [];
  const grades = db?.grades ?? [];
  const google = db?.integrations?.google;
  const params = useSearchParams();
  const callback = params.get("google");

  const now = live.find((l) => l.status === "مباشر");
  const [mode, setMode] = useState<"meet" | "manual" | null>(null);
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState<string | null>(null);
  const [copied, setCopied] = useState<string | null>(null);
  const [showUri, setShowUri] = useState(false); // عنوان العودة يظهر عند الطلب فقط
  const [notice, setNotice] = useState<string | null>(null); // رسائل العمليات (بدء/إنهاء البث)
  const [gcfg, setGcfg] = useState<{ redirectUri: string; origin: string; clientIdHead: string; pinned: boolean } | null>(null);
  const [f, setF] = useState<Form>({
    title: "", subjectId: "", grade: "كل الصفوف", track: "", startsAt: defaultStart(),
    duration: 60, audience: "subscribers", status: "مجدول", url: "", kind: "broadcast",
  });

  useEffect(() => { if (callback === "connected") void refresh(); }, [callback, refresh]);

  // عنوان العودة الفعلي — يُعرض للنسخ في Google Cloud Console (حلّ redirect_uri_mismatch)
  useEffect(() => {
    (async () => {
      try {
        const res = await fetch("/api/google/status", { cache: "no-store" });
        if (res.ok) setGcfg(await res.json());
      } catch { /* غير مؤثّر */ }
    })();
  }, []);

  const set = (patch: Partial<Form>) => setF((prev) => ({ ...prev, ...patch }));
  const reset = () => { setF({ ...f, title: "", url: "", subjectId: "" }); setMode(null); setErr(null); };

  /** إنشاء اجتماع حقيقي عبر Google Meet. */
  const createMeet = async () => {
    setErr(null);
    if (!f.title.trim()) { setErr("أدخل عنوان الجلسة"); return; }
    setBusy(true);
    try {
      const res = await fetch("/api/google/meet", {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: f.title, subjectId: f.subjectId || undefined, grade: f.grade,
          track: f.track || undefined, startsAt: new Date(f.startsAt).toISOString(),
          durationMinutes: f.duration, audience: f.audience, status: f.status, kind: f.kind,
        }),
      });
      const data = await res.json();
      if (!res.ok) { setErr(data.error || "تعذّر إنشاء الاجتماع"); return; }
      await refresh();
      reset();
    } finally {
      setBusy(false);
    }
  };

  /** جلسة يدوية برابط جاهز (Meet/يوتيوب/زووم…). */
  const addManual = () => {
    if (!f.title.trim()) { setErr("أدخل عنوان الجلسة"); return; }
    const subject = subjects.find((s) => s.id === f.subjectId);
    const iso = new Date(f.startsAt).toISOString();
    const l: Live = {
      id: `LV-${Date.now()}`,
      title: f.title.trim(),
      subject: subject?.name || "—",
      subjectId: f.subjectId || undefined,
      grade: f.grade,
      track: f.track || undefined,
      time: new Date(iso).toLocaleString("ar-EG", { timeZone: "Africa/Cairo", weekday: "long", day: "numeric", month: "long", hour: "numeric", minute: "2-digit" }),
      startsAt: iso,
      viewers: 0,
      url: f.url.trim() || undefined,
      audience: f.audience,
      kind: f.kind,
      createdBy: "manual",
      status: f.status,
    };
    save({ live: [l, ...live] });
    reset();
  };

  /** حذف الجلسة — يُنهي الاجتماع/البث عند جوجل فوراً ثم يحذفها. */
  const remove = async (l: Live) => {
    setBusy(true);
    await fetch("/api/live", {
      method: "DELETE", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id: l.id }),
    });
    await refresh();
    setBusy(false);
  };

  /** تغيير الحالة: «مباشر» يُرسل إشعاراً فورياً لأجهزة الطلاب، و«منتهي» يقطع البث حالاً. */
  const setStatus = async (l: Live, status: Live["status"]) => {
    setBusy(true); setErr(null);
    try {
      const res = await fetch("/api/live", {
        method: "PATCH", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id: l.id, status }),
      });
      const data = await res.json();
      if (!res.ok) { setErr(data.error || "تعذّر تحديث الحالة"); return; }
      await refresh();
      if (status === "مباشر") {
        setErr(null);
        setNotice(data.delivery?.sent
          ? `بدأ البث — وصل الإشعار إلى ${data.delivery.sent} جهاز`
          : "بدأ البث — لا توجد أجهزة مفعّلة للإشعارات بعد");
      }
      if (status === "منتهي") setNotice("أُنهي البث وأُغلق الرابط");
    } finally {
      setBusy(false);
    }
  };

  const setAudience = (id: string, audience: LiveAudience) =>
    save({ live: live.map((l) => (l.id === id ? { ...l, audience } : l)) });

  const copy = (url: string) => { navigator.clipboard?.writeText(url); setCopied(url); setTimeout(() => setCopied(null), 1500); };

  const disconnect = async () => {
    setBusy(true);
    await fetch("/api/google/disconnect", { method: "POST" });
    await refresh();
    setBusy(false);
  };

  return (
    <>
      <PageHeader
        title="البث المباشر"
        subtitle="أنشئ اجتماع Google Meet وحدّد من يمكنه دخوله"
        action={
          <div className="flex gap-2">
            <Button variant="outline" className="px-4 py-2.5" onClick={() => { setMode("manual"); setErr(null); }}>
              <Link2 className="size-4" /> جلسة برابط
            </Button>
            <Button className="px-5 py-2.5" onClick={() => { setMode("meet"); setErr(null); }} disabled={!google?.connected}>
              <Video className="size-4" /> اجتماع Google Meet
            </Button>
          </div>
        }
      />

      {notice && (
        <div className="mb-4 rounded-2xl bg-emerald-500/12 px-4 py-3 text-sm font-bold text-emerald-600">{notice}</div>
      )}

      {callback && CALLBACK_MSG[callback] && (
        <div className={`mb-4 rounded-2xl px-4 py-3 text-sm font-bold ${callback === "connected" ? "bg-emerald-500/12 text-emerald-600" : "bg-amber-500/12 text-amber-600"}`}>
          {CALLBACK_MSG[callback]}
        </div>
      )}

      {/* ---------- ربط حساب جوجل ---------- */}
      <Section
          title="ربط Google Meet"
        subtitle="تُربط مرّةً فتُنشَأ روابطُ الاجتماعات وحدَها بلا نسخٍ ولصق"
        icon={<Video className="size-4" />}
        className="mb-6"
      >
        <div className="flex flex-wrap items-center gap-4">
          <span className={`grid size-11 shrink-0 place-items-center rounded-2xl ${google?.connected ? "bg-emerald-500/12 text-emerald-500" : "bg-primary/12 text-primary"}`}>
            <Video className="size-5" />
          </span>
          <div className="min-w-0 flex-1">
            <p className="font-display font-extrabold">Google Meet</p>
            {!google?.configured ? (
              <p className="inline-flex items-center gap-1 text-xs text-amber-600">
                <AlertTriangle className="size-3.5" /> بيانات التطبيق غير مضبوطة على الخادم (.env.local)
              </p>
            ) : google.connected ? (
              <p className="text-xs text-muted-foreground">
                مربوط بحساب <span className="font-bold text-foreground">{google.email ?? "جوجل"}</span>
                {google.connectedAt && ` · منذ ${new Date(google.connectedAt).toLocaleDateString("ar-EG", { timeZone: "Africa/Cairo" })}`}
              </p>
            ) : (
              <p className="text-xs text-muted-foreground">اربط حساب المعلّمة لإنشاء روابط اجتماعات تلقائياً من هنا.</p>
            )}
          </div>
          {google?.connected ? (
            <button onClick={disconnect} disabled={busy}
              className="inline-flex items-center gap-1.5 rounded-full border border-border px-4 py-2 text-xs font-bold text-rose-500 transition hover:border-rose-500 disabled:opacity-60">
              <LogOut className="size-3.5" /> فكّ الربط
            </button>
          ) : (
            <a href="/api/google/auth"
              className={`inline-flex items-center gap-1.5 rounded-full btn-glow px-5 py-2.5 text-xs font-bold text-white ${google?.configured ? "" : "pointer-events-none opacity-50"}`}>
              <Video className="size-4" /> ربط حساب جوجل
            </a>
          )}
        </div>

        {/* عنوان العودة — مخفيّ إلا عند طلبه من زرّ صغير عند الحاجة */}
        {google?.configured && gcfg && showUri && (
          <div className="mt-4 rounded-2xl border border-dashed border-border p-3">
            <div className="flex items-center gap-2">
              <code dir="ltr" className="min-w-0 flex-1 truncate rounded-xl bg-muted px-3 py-2 text-left text-xs">{gcfg.redirectUri}</code>
              <button onClick={() => copy(gcfg.redirectUri)} title="نسخ"
                className="grid size-9 shrink-0 place-items-center rounded-full border border-border text-muted-foreground transition hover:border-primary hover:text-primary">
                {copied === gcfg.redirectUri ? <Check className="size-4 text-emerald-500" /> : <Copy className="size-4" />}
              </button>
            </div>
          </div>
        )}

        {google?.configured && !google?.connected && (
          <button onClick={() => setShowUri((v) => !v)}
            className="mt-3 text-[11px] font-bold text-muted-foreground underline-offset-4 hover:underline">
            {showUri ? "إخفاء عنوان العودة" : "لا يعمل الربط؟ اعرض عنوان العودة"}
          </button>
        )}
      </Section>

      {/* ---------- نموذج الإنشاء ---------- */}
      {mode && (
        <Section
          title={mode === "meet" ? "اجتماع Google Meet جديد" : "جلسة برابط خارجي"}
          subtitle="موعدُها وصفُّها ومن يفتحها"
          icon={<Radio className="size-4" />}
          className="mb-6"
        >
          <div className="mb-4 flex items-center justify-between">
            <h3 className="font-display font-extrabold">
              {mode === "meet" ? "اجتماع Google Meet جديد" : "جلسة برابط خارجي"}
            </h3>
            <button onClick={reset} className="grid size-8 place-items-center rounded-full border border-border"><X className="size-4" /></button>
          </div>

          <div className="grid gap-3 sm:grid-cols-6">
            <label className="sm:col-span-3"><span className="lbl">عنوان الجلسة</span>
              <input value={f.title} onChange={(e) => set({ title: e.target.value })} className="inp" placeholder="مراجعة البلاغة — الباب الأول" />
            </label>
            <label className="sm:col-span-3"><span className="lbl">الكورس (اختياري — يحدّد مشتركيه)</span>
              <select value={f.subjectId} onChange={(e) => set({ subjectId: e.target.value })} className="inp">
                <option value="">أي كورس (يكفي أي اشتراك ساري)</option>
                {subjects.map((s) => <option key={s.id} value={s.id}>{s.name}</option>)}
              </select>
            </label>
            <label className="sm:col-span-2"><span className="lbl">الموعد</span>
              <input type="datetime-local" dir="ltr" value={f.startsAt} onChange={(e) => set({ startsAt: e.target.value })} className="inp text-right" />
            </label>
            <label className="sm:col-span-1"><span className="lbl">المدة (دقيقة)</span>
              <input type="number" min={15} step={15} value={f.duration} onChange={(e) => set({ duration: Number(e.target.value) })} className="inp" />
            </label>
            <label className="sm:col-span-1"><span className="lbl">الصف</span>
              <select value={f.grade} onChange={(e) => set({ grade: e.target.value })} className="inp">
                <option>كل الصفوف</option>
                {grades.map((g) => <option key={g.id}>{g.name}</option>)}
              </select>
            </label>
            <label className="sm:col-span-1"><span className="lbl">الشعبة</span>
              <select value={f.track} onChange={(e) => set({ track: e.target.value })} className="inp">
                <option value="">الكل</option>
                {TRACKS.map((t) => <option key={t}>{t}</option>)}
              </select>
            </label>
            <label className="sm:col-span-1"><span className="lbl">الحالة</span>
              <select value={f.status} onChange={(e) => set({ status: e.target.value as Live["status"] })} className="inp">
                <option value="مجدول">مجدول</option>
                <option value="مباشر">مباشر الآن</option>
                <option value="منتهي">مسجّل/منتهي</option>
              </select>
            </label>
            {mode === "manual" && (
              <label className="sm:col-span-6"><span className="lbl">رابط البث</span>
                <input value={f.url} onChange={(e) => set({ url: e.target.value })} dir="ltr" className="inp text-right" placeholder="https://meet.google.com/xxx-xxxx-xxx" />
              </label>
            )}

            {/* نوع الجلسة */}
            <div className="sm:col-span-6">
              <span className="lbl">نوع الجلسة</span>
              <div className="grid gap-3 sm:grid-cols-2">
                <AudienceOption
                  active={f.kind === "broadcast"}
                  onClick={() => set({ kind: "broadcast" })}
                  icon={<Tv className="size-5" />}
                  title="بث مباشر (مشاهدة فقط)"
                  desc="الطلاب يشاهدون ولا يشاركون بكاميرا أو ميكروفون — الأنسب للدروس"
                />
                <AudienceOption
                  active={f.kind === "meeting"}
                  onClick={() => set({ kind: "meeting" })}
                  icon={<Users2 className="size-5" />}
                  title="اجتماع تفاعلي"
                  desc="جلسة نقاش يشارك فيها الطلاب بالصوت والصورة"
                />
              </div>
            </div>

            {/* من يمكنه رؤية البث */}
            <div className="sm:col-span-6">
              <span className="lbl">من يمكنه دخول البث؟</span>
              <div className="grid gap-3 sm:grid-cols-3">
                <AudienceOption
                  active={f.audience === "subscribers"}
                  onClick={() => set({ audience: "subscribers" })}
                  icon={<ShieldCheck className="size-5" />}
                  title="المشتركون فقط"
                  desc={f.subjectId ? "أصحاب اشتراك ساري في الكورس المحدّد" : "أصحاب أي اشتراك ساري (شهري أو ترم كامل)"}
                />
                <AudienceOption
                  active={f.audience === "all"}
                  onClick={() => set({ audience: "all" })}
                  icon={<Globe className="size-5" />}
                  title="كل الطلاب المسجّلين"
                  desc="أي طالب لديه حساب حتى لو لم يشترك بعد"
                />
                <AudienceOption
                  active={f.audience === "public"}
                  onClick={() => set({ audience: "public" })}
                  icon={<Gift className="size-5" />}
                  title="بث مجاني للجميع"
                  desc="يظهر على الصفحة الرئيسية ويفتحه أي زائر بلا حساب"
                />
              </div>
            </div>

            {err && <p className="sm:col-span-6 rounded-2xl bg-rose-500/10 px-3 py-2 text-center text-xs font-bold text-rose-500">{err}</p>}

            <div className="flex items-end gap-2 sm:col-span-6">
              {mode === "meet" ? (
                <Button className="px-5 py-2.5" onClick={createMeet} disabled={busy}>
                  {busy ? <Loader2 className="size-4 animate-spin" /> : <Video className="size-4" />} إنشاء الاجتماع
                </Button>
              ) : (
                <Button className="px-5 py-2.5" onClick={addManual}><Plus className="size-4" /> حفظ الجلسة</Button>
              )}
              <button onClick={reset} className="rounded-full border border-border px-4 py-2.5 text-sm font-bold">إلغاء</button>
            </div>
          </div>
        </Section>
      )}

      {/* ---------- الجلسة الجارية ---------- */}
      {now && (
        <Section
          title="الجلسة الجارية الآن"
          subtitle="ما يراه الطلابُ مفتوحاً هذه اللحظة"
          icon={<Radio className="size-4" />}
          tone="alert"
          className="mb-6"
        >
          <div className="flex flex-wrap items-center gap-4">
            <span className="relative grid size-12 shrink-0 place-items-center rounded-2xl bg-rose-500/12 text-rose-500">
              <Radio className="size-6" />
              <span className="absolute inset-0 animate-pulse-ring rounded-2xl bg-rose-500/30" />
            </span>
            <div className="min-w-0 flex-1">
              <StatusBadge status="مباشر" />
              <h3 className="mt-1 font-display text-xl font-extrabold">{now.title}</h3>
              <p className="text-sm text-muted-foreground">{now.subject} · {now.grade}</p>
            </div>
            <div className="flex items-center gap-2 text-sm">
              <Users className="size-4 text-primary" />
              <span className="font-bold">{now.viewers.toLocaleString("ar-EG")}</span>
              <span className="text-muted-foreground">مشاهد</span>
            </div>
            {now.url && (
              <a href={now.url} target="_blank" rel="noreferrer" className="rounded-full btn-glow px-5 py-2.5 text-xs font-bold text-white">فتح البث</a>
            )}
          </div>
        </Section>
      )}

      {/* ---------- كل الجلسات ---------- */}
      <Section
        title="كل الجلسات"
        subtitle="المجدولةُ والمنتهية — تُعدَّل أو تُحذف من بطاقتها"
        icon={<Radio className="size-4" />}
        count={live.length}
      >
      {live.length === 0 ? (
        <p className="rounded-3xl border border-dashed border-border p-10 text-center text-sm text-muted-foreground">
          لا توجد جلسات بث بعد.
        </p>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {live.map((l, i) => {
            const audience = l.audience ?? "subscribers";
            const subscribersOnly = audience === "subscribers";
            const isPublic = audience === "public";
            return (
              <motion.div key={l.id} initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.06 }}>
                <Card className="flex h-full flex-col">
                  <div className="mb-3 flex items-center justify-between">
                    <span className="grid size-10 place-items-center rounded-2xl bg-primary/12 text-primary"><Radio className="size-5" /></span>
                    <div className="flex items-center gap-2">
                      <StatusBadge status={l.status} />
                      <button onClick={() => remove(l)} disabled={busy} title="حذف (يُنهي البث فوراً)"
                        className="grid size-8 place-items-center rounded-full border border-border text-rose-500 transition hover:border-rose-500 disabled:opacity-50">
                        <Trash2 className="size-4" />
                      </button>
                    </div>
                  </div>
                  <h3 className="font-display font-extrabold">{l.title}</h3>
                  <p className="text-xs text-muted-foreground">{l.subject} · {l.grade}{l.track ? ` · ${l.track}` : ""}</p>
                  <div className="mt-2 flex items-center gap-1 text-xs text-muted-foreground"><Calendar className="size-3.5" /> {l.time}</div>

                  <div className="mt-3 flex flex-wrap items-center gap-2">
                    <span className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-bold ${
                      (l.kind ?? "broadcast") === "meeting" ? "bg-sky-500/15 text-sky-600" : "bg-rose-500/15 text-rose-600"
                    }`}>
                      {(l.kind ?? "broadcast") === "meeting" ? <Users2 className="size-3" /> : <Tv className="size-3" />}
                      {(l.kind ?? "broadcast") === "meeting" ? "اجتماع تفاعلي" : "بث مباشر"}
                    </span>
                    {l.createdBy === "google" && (
                      <span className="inline-flex items-center gap-1 rounded-full bg-emerald-500/12 px-2 py-0.5 text-[10px] font-bold text-emerald-500">Google Meet</span>
                    )}
                    <span className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-bold ${
                      isPublic ? "bg-emerald-500/15 text-emerald-500"
                        : subscribersOnly ? "bg-violet-500/15 text-violet-500"
                          : "bg-sky-500/15 text-sky-500"
                    }`}>
                      {isPublic ? <Gift className="size-3" /> : subscribersOnly ? <ShieldCheck className="size-3" /> : <Globe className="size-3" />}
                      {isPublic ? "بث مجاني للجميع" : subscribersOnly ? "المشتركون فقط" : "كل الطلاب"}
                    </span>
                  </div>

                  <div className="mt-4 flex flex-wrap items-center gap-2 border-t border-border pt-4">
                    {l.status !== "مباشر" ? (
                      <button onClick={() => setStatus(l, "مباشر")} disabled={busy}
                        className="inline-flex items-center gap-1.5 rounded-full btn-glow px-4 py-2 text-xs font-bold text-white disabled:opacity-60">
                        <PlayCircle className="size-3.5" /> ابدأ البث وأشعِر الطلاب
                      </button>
                    ) : (
                      <button onClick={() => setStatus(l, "منتهي")} disabled={busy}
                        className="inline-flex items-center gap-1.5 rounded-full border border-rose-500/50 px-4 py-2 text-xs font-bold text-rose-500 transition hover:bg-rose-500/10 disabled:opacity-60">
                        <Square className="size-3.5" /> إنهاء البث الآن
                      </button>
                    )}
                  </div>

                  <div className="mt-2 flex items-center gap-2">
                    <select
                      value={l.audience ?? "subscribers"}
                      onChange={(e) => setAudience(l.id, e.target.value as LiveAudience)}
                      className="flex-1 rounded-xl border border-border bg-card/60 px-2 py-1.5 text-xs outline-none focus:border-primary/50"
                    >
                      <option value="subscribers">المشتركون فقط</option>
                      <option value="all">كل الطلاب المسجّلين</option>
                      <option value="public">بث مجاني للجميع</option>
                    </select>
                    {l.url && (
                      <button onClick={() => copy(l.url!)} title="نسخ الرابط"
                        className="grid size-8 shrink-0 place-items-center rounded-full border border-border text-muted-foreground transition hover:border-primary hover:text-primary">
                        {copied === l.url ? <Check className="size-4 text-emerald-500" /> : <Copy className="size-4" />}
                      </button>
                    )}
                  </div>
                </Card>
              </motion.div>
            );
          })}
        </div>
)}
      </Section>
    </>
  );
}

function AudienceOption({
  active, onClick, icon, title, desc,
}: {
  active: boolean; onClick: () => void; icon: React.ReactNode; title: string; desc: string;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-pressed={active}
      className={`flex items-start gap-3 rounded-2xl border p-4 text-right transition ${
        active ? "border-primary bg-primary/5" : "border-border hover:border-primary/40"
      }`}
    >
      <span className={`grid size-9 shrink-0 place-items-center rounded-xl ${active ? "bg-primary/15 text-primary" : "bg-muted text-muted-foreground"}`}>
        {icon}
      </span>
      <span className="min-w-0">
        <span className="block text-sm font-bold">{title}</span>
        <span className="mt-0.5 block text-[11px] leading-relaxed text-muted-foreground">{desc}</span>
      </span>
    </button>
  );
}
