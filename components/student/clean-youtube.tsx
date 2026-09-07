"use client";

/**
 * مشغّلُ يوتيوب النظيف — المقطعُ وحدَه، ولا شيءَ من يوتيوب.
 * ------------------------------------------------------------------
 * إطارُ يوتيوب المضمَّن يعرض فوق المقطع: عنوانَه، وزرَّي «مشاهدة لاحقاً»
 * و«مشاركة»، وشعارَ «شاهد على يوتيوب»، ومقترحاتٍ عند الانتهاء — وكلُّها
 * تخرج بالطالب من المنصّة. ولا مُعامِلَ يُلغيها كلَّها؛ يوتيوب أبطل ذلك.
 *
 * **فالحلُّ أن يُعامَل الإطارُ كأنّه شاشةٌ صمّاء:**
 *   ١) `controls=0` فلا أزرارَ ليوتيوب، والأزرارُ كلُّها لنا.
 *   ٢) `pointer-events: none` على الإطار — لا ضغطةَ تبلغه أبداً، فلا
 *      عنوانَ يُضغط ولا شعارَ ولا مقترحاً.
 *   ٣) غطاءٌ معتِمٌ كلَّما لم يكن المقطعُ شغّالاً (قبل البدء، وعلى
 *      الإيقاف، وعند الانتهاء) — وهي اللحظاتُ التي يُظهر فيها يوتيوب
 *      عنوانَه وشعارَه ومقترحاتِه. فلا يُرى منها شيء.
 *   ٤) التحكّمُ بالرسائل (`postMessage`) وهو البروتوكولُ الذي تستعمله
 *      واجهةُ يوتيوب البرمجية نفسُها — بلا تحميل سكربتٍ خارجي، فلا
 *      تُفتح سياسةُ المحتوى (CSP) لنطاقٍ جديد.
 *
 * **وهذا إخفاءٌ لا تأمين** — معرّفُ المقطع في مصدر الصفحة لمن قصد. لكنّه
 * يزيل كلَّ ما يُرى ويُضغط، وهو ما يقع فعلاً. والتأمينُ الحقيقيُّ Bunny
 * Stream بروابطَ موقَّعة (انظر `toEmbed`).
 */

import { useCallback, useEffect, useRef, useState, type ReactNode } from "react";

const YT = "https://www.youtube-nocookie.com";

/** حالاتُ المشغّل كما يرسلها يوتيوب. */
const UNSTARTED = -1, ENDED = 0, PLAYING = 1, PAUSED = 2, BUFFERING = 3, CUED = 5;

const RATES = [1, 1.25, 1.5, 2, 0.75];

function fmt(s: number): string {
  if (!Number.isFinite(s) || s < 0) s = 0;
  const m = Math.floor(s / 60);
  const r = Math.floor(s % 60);
  const h = Math.floor(m / 60);
  const mm = h ? String(m % 60).padStart(2, "0") : String(m);
  return `${h ? `${h}:` : ""}${mm}:${String(r).padStart(2, "0")}`;
}

/* أيقوناتٌ صغيرة على شبكة ٢٤ وسُمك ١٫٥ — بأسلوب أيقونات الهوية */
const I = {
  play: <path d="M8 5.5v13l11-6.5z" fill="currentColor" stroke="none" />,
  pause: <><rect x="6" y="5" width="4" height="14" rx="1" fill="currentColor" stroke="none" /><rect x="14" y="5" width="4" height="14" rx="1" fill="currentColor" stroke="none" /></>,
  replay: <><path d="M4 12a8 8 0 1 0 2.5-5.8" /><path d="M4 4v5h5" /></>,
  vol: <><path d="M4 9v6h4l5 4V5L8 9z" /><path d="M16 9a4 4 0 0 1 0 6" /><path d="M18.5 6.5a8 8 0 0 1 0 11" /></>,
  mute: <><path d="M4 9v6h4l5 4V5L8 9z" /><path d="m16 9 5 6M21 9l-5 6" /></>,
  full: <><path d="M4 9V4h5M15 4h5v5M20 15v5h-5M9 20H4v-5" /></>,
  exit: <><path d="M9 4v5H4M15 9V4h5M20 15h-5v5M4 15h5v5" /></>,
};
function Icon({ d, className = "size-5" }: { d: ReactNode; className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.7} strokeLinecap="round" strokeLinejoin="round" className={className} aria-hidden="true">
      {d}
    </svg>
  );
}

export function CleanYouTube({
  videoId,
  title,
  children,
}: {
  videoId: string;
  title?: string;
  /** العلامةُ المائيّة — تُرسم فوق المقطع وتحت الأزرار. */
  children?: ReactNode;
}) {
  const box = useRef<HTMLDivElement>(null);
  const frame = useRef<HTMLIFrameElement>(null);
  const [src, setSrc] = useState("");
  const [ready, setReady] = useState(false);
  const [state, setState] = useState(UNSTARTED);
  const [started, setStarted] = useState(false);
  const [time, setTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [muted, setMuted] = useState(false);
  const [volume, setVolume] = useState(100);
  const [rate, setRate] = useState(1);
  const [bar, setBar] = useState(true);
  const [full, setFull] = useState(false);
  const hideTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  /* آخرُ وقتٍ وصل من يوتيوب ومتى — لتحريك المؤشّر بين رسالتين */
  const last = useRef({ t: 0, at: 0 });

  /* العنوانُ يُبنى في المتصفّح: `origin` يجب أن يطابق الصفحةَ، ولا تُعرف على الخادم */
  useEffect(() => {
    const origin = encodeURIComponent(window.location.origin);
    setSrc(
      `${YT}/embed/${videoId}?enablejsapi=1&controls=0&rel=0&modestbranding=1&iv_load_policy=3&disablekb=1&playsinline=1&fs=0&showinfo=0&cc_load_policy=0&origin=${origin}`
    );
    setReady(false); setState(UNSTARTED); setStarted(false); setTime(0); setDuration(0);
  }, [videoId]);

  const post = useCallback((msg: Record<string, unknown>) => {
    frame.current?.contentWindow?.postMessage(JSON.stringify({ ...msg, id: "clean-yt", channel: "widget" }), YT);
  }, []);
  const cmd = useCallback((func: string, args: unknown[] = []) => post({ event: "command", func, args }), [post]);

  /* الاستماعُ لرسائل الإطار — من نطاق يوتيوب ومن إطارنا نحن لا غيره */
  useEffect(() => {
    const onMsg = (e: MessageEvent) => {
      if (e.origin !== YT || e.source !== frame.current?.contentWindow) return;
      let data: { event?: string; info?: Record<string, unknown> | number } | null = null;
      try { data = typeof e.data === "string" ? JSON.parse(e.data) : e.data; } catch { return; }
      if (!data || typeof data !== "object") return;

      if (data.event === "onReady") {
        setReady(true);
        post({ event: "listening" });
        return;
      }
      if (data.event === "onStateChange" && typeof data.info === "number") {
        apply(data.info);
        return;
      }
      if ((data.event === "infoDelivery" || data.event === "initialDelivery") && data.info && typeof data.info === "object") {
        const info = data.info as Record<string, unknown>;
        if (typeof info.playerState === "number") apply(info.playerState);
        if (typeof info.currentTime === "number") { setTime(info.currentTime); last.current = { t: info.currentTime, at: Date.now() }; }
        if (typeof info.duration === "number" && info.duration > 0) setDuration(info.duration);
        if (typeof info.muted === "boolean") setMuted(info.muted);
        if (typeof info.volume === "number") setVolume(info.volume);
        if (typeof info.playbackRate === "number") setRate(info.playbackRate);
      }
    };
    const apply = (s: number) => {
      setState(s);
      if (s === PLAYING) setStarted(true);
    };
    window.addEventListener("message", onMsg);
    return () => window.removeEventListener("message", onMsg);
  }, [post]);

  /* بعد تحميل الإطار: «أنا أستمع» — فيبدأ يوتيوب يرسل حالتَه ووقتَه */
  const onLoad = () => {
    post({ event: "listening" });
    /* بعضُ النسخ لا تردّ على الأولى قبل جاهزيّتها — تُعاد مرّتين */
    setTimeout(() => post({ event: "listening" }), 600);
    setTimeout(() => post({ event: "listening" }), 1800);
  };

  /* مؤشّرُ الوقت يتحرّك بين الرسائل فلا يقفز */
  useEffect(() => {
    if (state !== PLAYING) return;
    const id = setInterval(() => {
      const { t, at } = last.current;
      if (at) setTime(Math.min(duration || Infinity, t + ((Date.now() - at) / 1000) * rate));
    }, 250);
    return () => clearInterval(id);
  }, [state, duration, rate]);

  /* شريطُ الأزرار يختفي أثناء التشغيل بعد سكون الماوس */
  const poke = useCallback(() => {
    setBar(true);
    if (hideTimer.current) clearTimeout(hideTimer.current);
    hideTimer.current = setTimeout(() => setBar(false), 2600);
  }, []);
  useEffect(() => {
    if (state !== PLAYING) { setBar(true); if (hideTimer.current) clearTimeout(hideTimer.current); }
    else poke();
  }, [state, poke]);

  useEffect(() => {
    const onFs = () => setFull(Boolean(document.fullscreenElement));
    document.addEventListener("fullscreenchange", onFs);
    return () => document.removeEventListener("fullscreenchange", onFs);
  }, []);

  const playing = state === PLAYING || (state === BUFFERING && started);
  /* الغطاءُ حين لا يُعرض مقطع: هنا يُظهر يوتيوب عنوانَه وشعارَه ومقترحاتِه */
  const covered = !ready || !playing;

  const toggle = () => {
    if (!ready) return;
    if (state === ENDED) { cmd("seekTo", [0, true]); cmd("playVideo"); return; }
    if (playing) cmd("pauseVideo"); else cmd("playVideo");
  };
  const seek = (v: number) => {
    setTime(v); last.current = { t: v, at: Date.now() };
    cmd("seekTo", [v, true]);
  };
  const toggleMute = () => { if (muted) cmd("unMute"); else cmd("mute"); setMuted(!muted); };
  const setVol = (v: number) => { setVolume(v); cmd("setVolume", [v]); if (v > 0 && muted) { cmd("unMute"); setMuted(false); } };
  const cycleRate = () => {
    const next = RATES[(RATES.indexOf(rate) + 1) % RATES.length] ?? 1;
    setRate(next); cmd("setPlaybackRate", [next]);
  };
  const [pseudoFull, setPseudoFull] = useState(false);
  const toggleFull = () => {
    const el = box.current;
    if (!el) return;
    if (el.requestFullscreen) {
      if (document.fullscreenElement) void document.exitFullscreen(); else void el.requestFullscreen();
    } else {
      /* iOS لا يدعم ملءَ الشاشة لعنصرٍ غير الفيديو — يُملأ إطارُ الصفحة بدله */
      setPseudoFull((v) => !v);
    }
  };

  const onKey = (e: React.KeyboardEvent) => {
    if (e.target !== e.currentTarget) return;
    const k = e.key.toLowerCase();
    if (k === " " || k === "k") { e.preventDefault(); toggle(); }
    else if (k === "arrowright") { e.preventDefault(); seek(Math.min(duration, time + 5)); }
    else if (k === "arrowleft") { e.preventDefault(); seek(Math.max(0, time - 5)); }
    else if (k === "m") toggleMute();
    else if (k === "f") toggleFull();
    poke();
  };

  const pct = duration ? (time / duration) * 100 : 0;
  const isFull = full || pseudoFull;

  return (
    <div
      ref={box}
      tabIndex={0}
      onKeyDown={onKey}
      onMouseMove={poke}
      onTouchStart={poke}
      className={`clean-yt relative select-none overflow-hidden bg-black outline-none ${pseudoFull ? "fixed inset-0 z-[200]" : "size-full"}`}
      aria-label={title ? `مشغّل: ${title}` : "مشغّل الفيديو"}
      data-state={state}
    >
      {/* الإطارُ أصمّ — لا ضغطةَ تبلغه */}
      {src && (
        <iframe
          ref={frame}
          src={src}
          title={title ?? "فيديو الدرس"}
          onLoad={onLoad}
          allow="autoplay; encrypted-media; picture-in-picture"
          className="pointer-events-none absolute inset-0 size-full"
          tabIndex={-1}
        />
      )}

      {/* طبقةُ الضغط: تشغيلٌ وإيقافٌ لا خروج */}
      <div
        className="absolute inset-0 z-10 cursor-pointer"
        onClick={toggle}
        onDoubleClick={toggleFull}
        onContextMenu={(e) => e.preventDefault()}
      />

      {/* الغطاءُ حين لا يُعرض مقطع */}
      <div
        className={`pointer-events-none absolute inset-0 z-[15] grid place-items-center bg-black transition-opacity duration-300 ${covered ? "opacity-100" : "opacity-0"}`}
        aria-hidden={!covered}
      >
        {/* صورةُ المقطع نفسِه مموّهة — خلفيةٌ لا علامة */}
        <img
          src={`https://i.ytimg.com/vi/${videoId}/hqdefault.jpg`}
          alt=""
          className="absolute inset-0 size-full object-cover opacity-40 blur-[2px] scale-105"
          draggable={false}
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-black/50" />
        <div className="relative flex flex-col items-center gap-3 px-6 text-center text-white">
          <span className="grid size-16 place-items-center rounded-full bg-white/15 ring-1 ring-white/30 backdrop-blur-sm transition">
            {!ready && src ? (
              <span className="size-6 animate-spin rounded-full border-2 border-white/30 border-t-white" />
            ) : (
              <Icon d={state === ENDED ? I.replay : I.play} className="size-8" />
            )}
          </span>
          {title && <p className="font-display max-w-md text-base font-bold drop-shadow sm:text-lg">{title}</p>}
          <p className="text-[11px] text-white/70">
            {!ready && src ? "جارٍ التحميل…" : state === ENDED ? "انتهى الدرس — اضغط للإعادة" : state === PAUSED ? "متوقّف — اضغط للمتابعة" : "اضغط للتشغيل"}
          </p>
        </div>
      </div>

      {/* مؤشّرُ التحميل أثناء التشغيل */}
      {state === BUFFERING && started && (
        <span className="pointer-events-none absolute left-1/2 top-1/2 z-[16] size-9 -translate-x-1/2 -translate-y-1/2 animate-spin rounded-full border-2 border-white/30 border-t-white" />
      )}

      {children}

      {/* شريطُ الأزرار */}
      <div
        className={`absolute inset-x-0 bottom-0 z-[25] bg-gradient-to-t from-black/85 to-transparent px-3 pb-2 pt-8 text-white transition-opacity duration-300 ${bar || covered ? "opacity-100" : "pointer-events-none opacity-0"}`}
        onClick={(e) => e.stopPropagation()}
        onDoubleClick={(e) => e.stopPropagation()}
      >
        <input
          type="range"
          min={0}
          max={Math.max(1, duration)}
          step={0.1}
          value={Math.min(time, duration || time)}
          onChange={(e) => seek(Number(e.target.value))}
          aria-label="موضع التشغيل"
          disabled={!ready}
          className="clean-yt-seek block h-1.5 w-full cursor-pointer appearance-none rounded-full bg-white/25 accent-white"
          style={{ background: `linear-gradient(to left, hsl(var(--gold, 40 80% 55%)) ${pct}%, rgba(255,255,255,.25) ${pct}%)` }}
        />
        <div className="mt-1.5 flex items-center gap-1.5">
          <button type="button" onClick={toggle} aria-label={playing ? "إيقاف" : "تشغيل"} className="grid size-9 place-items-center rounded-full transition hover:bg-white/15">
            <Icon d={state === ENDED ? I.replay : playing ? I.pause : I.play} />
          </button>
          <span className="font-kufi text-[11px] tabular-nums text-white/85" dir="ltr">{fmt(time)} / {fmt(duration)}</span>
          <span className="flex-1" />
          <button type="button" onClick={cycleRate} aria-label="سرعة التشغيل" className="font-kufi rounded-full px-2.5 py-1 text-[11px] font-bold tabular-nums transition hover:bg-white/15" dir="ltr">
            {rate}×
          </button>
          <div className="group flex items-center gap-1">
            <button type="button" onClick={toggleMute} aria-label={muted ? "تشغيل الصوت" : "كتم الصوت"} className="grid size-9 place-items-center rounded-full transition hover:bg-white/15">
              <Icon d={muted || volume === 0 ? I.mute : I.vol} />
            </button>
            <input
              type="range" min={0} max={100} value={muted ? 0 : volume}
              onChange={(e) => setVol(Number(e.target.value))}
              aria-label="مستوى الصوت"
              className="hidden h-1 w-20 cursor-pointer appearance-none rounded-full bg-white/30 accent-white sm:block"
            />
          </div>
          <button type="button" onClick={toggleFull} aria-label={isFull ? "الخروج من ملء الشاشة" : "ملء الشاشة"} className="grid size-9 place-items-center rounded-full transition hover:bg-white/15">
            <Icon d={isFull ? I.exit : I.full} />
          </button>
        </div>
      </div>
    </div>
  );
}

/** معرّفُ مقطع يوتيوب من أيّ صيغة رابط — أو null. */
export function youtubeId(url?: string | null): string | null {
  if (!url) return null;
  const m = url.trim().match(/(?:youtu\.be\/|youtube(?:-nocookie)?\.com\/(?:watch\?(?:.*&)?v=|embed\/|shorts\/|live\/))([\w-]{6,})/);
  return m ? m[1] : null;
}
