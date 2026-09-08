"use client";

/**
 * قناة اليوتيوب — ربط القناة، جلب كل فيديوهاتها، والتحكّم الكامل بها:
 * إظهار/إخفاء لكل فيديو · تثبيت في المقدّمة · إعادة ترتيب · إضافة الفيديو كدرس لكورس ·
 * القسم إداري بحت — لا تظهر القناة ولا فيديوهاتها في الموقع العام ولا في بوابة الطالب.
 */
import { useState } from "react";
import Image from "next/image";
import { motion } from "framer-motion";
import {
  Youtube, RefreshCw, Link2, Loader2, Eye, EyeOff, Star, Plus, Trash2,
  ExternalLink, Search, Check, PlaySquare,
} from "lucide-react";
import { PageHeader, Card, StatCard } from "@/components/dashboard/ui";
import { Button } from "@/components/ui/primitives";
import { useContent } from "@/components/content/content-provider";
import type { Lesson, YoutubeVideo } from "@/lib/utils/types";
import { isSplit } from "@/lib/business/course-units";

export default function YoutubePage() {
  const { db, save, refresh } = useContent();
  const yt = db?.youtube;
  const subjects = db?.subjects ?? [];
  const videos = yt?.videos ?? [];

  const [channel, setChannel] = useState("");
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState<string | null>(null);
  const [err, setErr] = useState<string | null>(null);
  const [q, setQ] = useState("");
  const [addTo, setAddTo] = useState<{ video: YoutubeVideo; subjectId: string } | null>(null);

  const sync = async (input?: string) => {
    const target = (input ?? channel ?? "").trim() || yt?.url || yt?.channelId || "";
    if (!target) { setErr("أدخل رابط القناة أو معرّفها"); return; }
    setBusy(true); setErr(null); setMsg(null);
    try {
      const res = await fetch("/api/youtube", {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ channel: target }),
      });
      const data = await res.json();
      if (!res.ok) { setErr(data.error || "تعذّرت المزامنة"); return; }
      await refresh();
      setChannel("");
      setMsg(
        `تمّت مزامنة ${data.youtube.videos.length.toLocaleString("ar-EG")} فيديو` +
        (data.source === "rss" ? " (أحدث الفيديوهات)" : "")
      );
    } finally {
      setBusy(false);
    }
  };

  const disconnect = async () => {
    setBusy(true);
    await fetch("/api/youtube", { method: "DELETE" });
    await refresh();
    setBusy(false);
    setMsg("تم فصل القناة");
  };

  /** تعديل إعدادات القناة أو فيديو بعينه (يُحفظ عبر مسار المحتوى). */
  const patchChannel = (patch: Partial<NonNullable<typeof yt>>) =>
    yt && save({ youtube: { ...yt, ...patch } });
  const patchVideo = (id: string, patch: Partial<YoutubeVideo>) =>
    yt && save({ youtube: { ...yt, videos: videos.map((v) => (v.id === id ? { ...v, ...patch } : v)) } });

  const move = (i: number, dir: -1 | 1) => {
    const arr = [...videos].sort((a, b) => (a.order ?? 0) - (b.order ?? 0));
    const j = i + dir;
    if (j < 0 || j >= arr.length) return;
    [arr[i], arr[j]] = [arr[j], arr[i]];
    patchChannel({ videos: arr.map((v, k) => ({ ...v, order: k })) });
  };

  /** إضافة الفيديو كدرس داخل كورس. */
  const addAsLesson = () => {
    if (!addTo?.subjectId) return;
    const subject = subjects.find((s) => s.id === addTo.subjectId);
    if (!subject) return;
    const lesson: Lesson = {
      id: `L-${Date.now()}`,
      title: addTo.video.title,
      url: `https://www.youtube.com/watch?v=${addTo.video.id}`,
    };
    /*
      الفيديو يُضاف إلى آخرِ وحدةٍ في الكورس المقسَّم، وإلى القائمة
      المسطّحة في غير المقسَّم. وإضافتُه إلى `videos` دائماً تُخفيه في
      المقسَّم: القراءةُ هناك تمرّ بالوحدات وحدَها فلا يظهر أبداً.
    */
    const split = isSplit(subject);
    const nextUnits = split
      ? subject.units!.map((u, i) =>
          i === subject.units!.length - 1 ? { ...u, lessons: [...(u.lessons ?? []), lesson] } : u,
        )
      : undefined;
    const nextVideos = split ? subject.videos ?? [] : [...(subject.videos ?? []), lesson];
    save({
      subjects: subjects.map((s) =>
        s.id === subject.id ? { ...s, videos: nextVideos, lessons: nextVideos.length } : s
      ),
    });
    setMsg(`أُضيف «${addTo.video.title}» كدرس في «${subject.name}»`);
    setAddTo(null);
  };

  const sorted = [...videos].sort(
    (a, b) => Number(b.featured ?? false) - Number(a.featured ?? false) || (a.order ?? 0) - (b.order ?? 0)
  );
  const rows = sorted.filter((v) => !q || v.title.includes(q));
  const visible = videos.filter((v) => !v.hidden).length;

  return (
    <>
      <PageHeader
        title="قناة اليوتيوب"
        subtitle={yt?.channelId ? `${videos.length.toLocaleString("ar-EG")} فيديو · ${visible.toLocaleString("ar-EG")} ظاهر على الموقع` : "اربط قناتك لعرض فيديوهاتها والتحكّم بها"}
        action={
          yt?.channelId ? (
            <div className="flex gap-2">
              <Button variant="outline" className="px-4 py-2.5" onClick={() => sync()} disabled={busy}>
                {busy ? <Loader2 className="size-4 animate-spin" /> : <RefreshCw className="size-4" />} تحديث
              </Button>
              <a href={yt.url} target="_blank" rel="noreferrer"
                className="inline-flex items-center gap-1.5 rounded-full border border-border px-4 py-2.5 text-sm font-bold transition hover:border-primary hover:text-primary">
                <ExternalLink className="size-4" /> فتح القناة
              </a>
            </div>
          ) : undefined
        }
      />

      {(msg || err) && (
        <div className={`mb-4 rounded-2xl px-4 py-3 text-sm font-bold ${err ? "bg-rose-500/12 text-rose-600" : "bg-emerald-500/12 text-emerald-600"}`}>
          {err || msg}
        </div>
      )}

      {/* ---------- ربط القناة ---------- */}
      <Card className="mb-6">
        <div className="flex flex-wrap items-center gap-4">
          <span className="grid size-12 shrink-0 place-items-center rounded-2xl bg-rose-500/12 text-rose-500">
            {yt?.thumbnail ? (
              <Image src={yt.thumbnail} alt="" width={48} height={48} unoptimized referrerPolicy="no-referrer" className="size-full rounded-2xl object-cover" />
            ) : (
              <Youtube className="size-6" />
            )}
          </span>
          <div className="min-w-0 flex-1">
            <p className="font-display font-extrabold">{yt?.title || "لم تُربط قناة بعد"}</p>
            <p className="text-xs text-muted-foreground">
              {yt?.channelId ? (
                <>
                  <span dir="ltr" className="font-mono">{yt.channelId}</span>
                  {yt.syncedAt && ` · آخر تحديث ${new Date(yt.syncedAt).toLocaleString("ar-EG", { timeZone: "Africa/Cairo" })}`}

                </>
              ) : (
                "الصق رابط القناة (‎@اسم أو /channel/UC…) ثم اضغط ربط"
              )}
            </p>
          </div>
          {yt?.channelId && (
            <button onClick={disconnect} disabled={busy}
              className="inline-flex items-center gap-1.5 rounded-full border border-border px-4 py-2 text-xs font-bold text-rose-500 transition hover:border-rose-500 disabled:opacity-60">
              <Trash2 className="size-3.5" /> فصل القناة
            </button>
          )}
        </div>

        <div className="mt-4 flex flex-wrap items-end gap-2">
          <label className="min-w-56 flex-1">
            <span className="lbl">رابط القناة أو معرّفها</span>
            <input value={channel} onChange={(e) => setChannel(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && sync()}
              dir="ltr" className="inp text-right" placeholder="https://www.youtube.com/@channel  أو  UCxxxxxxxx" />
          </label>
          <Button className="px-5 py-2.5" onClick={() => sync()} disabled={busy}>
            {busy ? <Loader2 className="size-4 animate-spin" /> : <Link2 className="size-4" />}
            {yt?.channelId ? "تغيير القناة" : "ربط وجلب الفيديوهات"}
          </Button>
        </div>

      </Card>

      {yt?.channelId && (
        <>
          {/* ---------- إعدادات العرض ---------- */}
          <div className="mb-6 grid gap-4 sm:grid-cols-3">
            <StatCard label="إجمالي الفيديوهات" value={videos.length.toLocaleString("ar-EG")} tone="primary" icon={<PlaySquare className="size-5" />} index={0} />
            <StatCard label="ظاهرة على الموقع" value={visible.toLocaleString("ar-EG")} tone="emerald" icon={<Eye className="size-5" />} index={1} />
            <StatCard label="مثبّتة" value={videos.filter((v) => v.featured).length.toLocaleString("ar-EG")} tone="amber" icon={<Star className="size-5" />} index={2} />
          </div>

          {/* ---------- الفيديوهات ---------- */}
          <div className="mb-4 relative sm:max-w-xs">
            <Search className="absolute right-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
            <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="ابحث في الفيديوهات…"
              className="w-full rounded-full border border-border bg-card/60 py-2 pr-10 pl-4 text-sm outline-none focus:border-primary/50" />
          </div>

          <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
            {rows.map((v, i) => (
              <motion.div key={v.id} initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: Math.min(i, 8) * 0.04 }}>
                <Card className={`flex h-full flex-col !p-3 ${v.hidden ? "opacity-60" : ""}`}>
                  <div className="relative mb-3 aspect-video overflow-hidden rounded-2xl bg-muted">
                    {v.thumbnail && (
                      <Image src={v.thumbnail} alt={v.title} fill unoptimized referrerPolicy="no-referrer" className="object-cover" />
                    )}
                    {v.featured && (
                      <span className="absolute right-2 top-2 inline-flex items-center gap-1 rounded-full bg-amber-500 px-2 py-0.5 text-[10px] font-bold text-white">
                        <Star className="size-3" /> مثبّت
                      </span>
                    )}
                    {v.hidden && (
                      <span className="absolute left-2 top-2 inline-flex items-center gap-1 rounded-full bg-black/60 px-2 py-0.5 text-[10px] font-bold text-white">
                        <EyeOff className="size-3" /> مخفي
                      </span>
                    )}
                  </div>

                  <p className="line-clamp-2 text-sm font-bold leading-relaxed">{v.title}</p>
                  <p className="mt-1 text-[11px] text-muted-foreground">
                    {v.publishedAt ? new Date(v.publishedAt).toLocaleDateString("ar-EG", { timeZone: "Africa/Cairo" }) : "—"}
                    {v.views ? ` · ${v.views.toLocaleString("ar-EG")} مشاهدة` : ""}
                  </p>

                  <div className="mt-auto flex flex-wrap items-center gap-1 border-t border-border pt-3">
                    <button onClick={() => patchVideo(v.id, { hidden: !v.hidden })}
                      title={v.hidden ? "إظهار على الموقع" : "إخفاء عن الموقع"}
                      className="grid size-8 place-items-center rounded-full border border-border text-primary transition hover:border-primary">
                      {v.hidden ? <Eye className="size-4" /> : <EyeOff className="size-4" />}
                    </button>
                    <button onClick={() => patchVideo(v.id, { featured: !v.featured })} title="تثبيت"
                      className={`grid size-8 place-items-center rounded-full border transition ${v.featured ? "border-amber-500 text-amber-500" : "border-border text-muted-foreground hover:border-primary hover:text-primary"}`}>
                      <Star className="size-4" />
                    </button>
                    <button onClick={() => move(sorted.indexOf(v), -1)} title="تقديم"
                      className="grid size-8 place-items-center rounded-full border border-border text-muted-foreground transition hover:border-primary hover:text-primary">▲</button>
                    <button onClick={() => move(sorted.indexOf(v), 1)} title="تأخير"
                      className="grid size-8 place-items-center rounded-full border border-border text-muted-foreground transition hover:border-primary hover:text-primary">▼</button>
                    <a href={`https://www.youtube.com/watch?v=${v.id}`} target="_blank" rel="noreferrer" title="فتح على يوتيوب"
                      className="grid size-8 place-items-center rounded-full border border-border text-muted-foreground transition hover:border-primary hover:text-primary">
                      <ExternalLink className="size-4" />
                    </a>
                    <button onClick={() => setAddTo({ video: v, subjectId: subjects[0]?.id ?? "" })}
                      disabled={subjects.length === 0} title="إضافة كدرس في كورس"
                      className="mr-auto inline-flex items-center gap-1 rounded-full border border-primary/40 px-3 py-1.5 text-[11px] font-bold text-primary transition hover:bg-primary/10 disabled:opacity-40">
                      <Plus className="size-3.5" /> كدرس
                    </button>
                  </div>
                </Card>
              </motion.div>
            ))}
          </div>

          {rows.length === 0 && (
            <p className="rounded-3xl border border-dashed border-border p-10 text-center text-sm text-muted-foreground">لا توجد نتائج.</p>
          )}
        </>
      )}

      {/* نافذة إضافة كدرس */}
      {addTo && (
        <div onClick={() => setAddTo(null)} className="fixed inset-0 z-[120] grid place-items-center bg-black/60 p-4 backdrop-blur-sm">
          <div onClick={(e) => e.stopPropagation()} className="glass w-full max-w-md rounded-3xl p-6 shadow-bento">
            <h3 className="font-display text-lg font-extrabold">إضافة الفيديو كدرس</h3>
            <p className="mt-1 line-clamp-2 text-xs text-muted-foreground">{addTo.video.title}</p>
            <label className="mt-4 block">
              <span className="lbl">اختر الكورس</span>
              <select value={addTo.subjectId} onChange={(e) => setAddTo({ ...addTo, subjectId: e.target.value })} className="inp">
                {subjects.map((s) => <option key={s.id} value={s.id}>{s.name}</option>)}
              </select>
            </label>
            <div className="mt-5 flex gap-2">
              <Button className="px-5 py-2.5" onClick={addAsLesson}><Check className="size-4" /> إضافة</Button>
              <button onClick={() => setAddTo(null)} className="rounded-full border border-border px-4 py-2.5 text-sm font-bold">إلغاء</button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
