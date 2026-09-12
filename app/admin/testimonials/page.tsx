"use client";

/**
 * شهادات الطلاب — إضافة آراء الطلاب والمتفوّقين للصفحة الرئيسية.
 * الحفظ يمرّ على /api/testimonials الذي يفحص الصلاحية على الخادم.
 */

import { useCallback, useEffect, useRef, useState } from "react";
import Image from "next/image";
import { mediaSrc } from "@/lib/utils/media";
import type { Testimonial } from "@/lib/utils/types";
import {
  IconStar, IconTrophy, IconPlus, IconXCircle, IconSpinner, IconCheckCircle, IconArrowLeft, IconInstall,
} from "@/components/brand/icons";

const blank = (): Testimonial => ({
  id: `TST-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 6)}`,
  name: "",
  text: "",
});

export default function TestimonialsPage() {
  const [items, setItems] = useState<Testimonial[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [note, setNote] = useState<{ kind: "ok" | "err"; text: string } | null>(null);

  const load = useCallback(async () => {
    const res = await fetch("/api/testimonials");
    const data = await res.json();
    setItems(data.testimonials ?? []);
    setLoading(false);
  }, []);

  useEffect(() => { void load(); }, [load]);

  const say = (kind: "ok" | "err", text: string) => {
    setNote({ kind, text });
    setTimeout(() => setNote(null), 4000);
  };

  const save = async (next: Testimonial[]) => {
    setSaving(true);
    const res = await fetch("/api/testimonials", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ testimonials: next }),
    });
    const data = await res.json();
    setSaving(false);
    if (!res.ok) { say("err", data.error ?? "تعذّر الحفظ"); return; }
    setItems(data.testimonials ?? next);
    say("ok", "حُفظت الشهادات وظهرت في الصفحة الرئيسية");
  };

  const set = (id: string, patch: Partial<Testimonial>) =>
    setItems((prev) => prev.map((t) => (t.id === id ? { ...t, ...patch } : t)));

  /** طالب أول واحد فقط — تفعيل واحدة يُلغي البقية. */
  const setFeatured = (id: string) =>
    setItems((prev) => prev.map((t) => ({ ...t, featured: t.id === id ? !t.featured : false })));

  const move = (i: number, dir: -1 | 1) =>
    setItems((prev) => {
      const next = [...prev];
      const j = i + dir;
      if (j < 0 || j >= next.length) return prev;
      [next[i], next[j]] = [next[j], next[i]];
      return next;
    });

  const invalid = items.some((t) => !t.name.trim() || !t.text.trim());

  return (
    <div className="space-y-5">
      <header className="flex flex-wrap items-center gap-3" data-reveal="down" data-reveal-duration="fast">
        <span className="grid size-11 shrink-0 place-items-center rounded-2xl bg-primary/12 text-primary">
          <IconStar className="size-5" />
        </span>
        <div className="min-w-0 flex-1">
          <h1 className="font-display text-lg font-extrabold sm:text-xl">شهادات الطلاب</h1>
          <p className="text-xs text-muted-foreground">
            تظهر في الصفحة الرئيسية. حدّدي شهادة واحدة كـ«الطالب الأول» لتأخذ بطاقة عريضة في المقدّمة.
          </p>
        </div>
        <button
          onClick={() => setItems((p) => [...p, blank()])}
          className="inline-flex w-full items-center justify-center gap-2 rounded-full border border-border px-4 py-2.5 text-[13px] font-bold transition hover:border-primary/40 sm:w-auto"
        >
          <IconPlus className="size-4" /> شهادة جديدة
        </button>
        <button
          onClick={() => save(items)}
          disabled={saving || invalid}
          className="inline-flex w-full items-center justify-center gap-2 rounded-full btn-glow px-5 py-2.5 text-[13px] font-bold text-white disabled:opacity-60 sm:w-auto"
        >
          {saving ? <IconSpinner className="size-4 animate-spin" /> : <IconCheckCircle className="size-4" />}
          حفظ
        </button>
      </header>

      {note && (
        <p className={`rounded-2xl px-4 py-2.5 text-sm font-bold ${note.kind === "ok" ? "bg-emerald-500/12 text-emerald-600" : "bg-rose-500/12 text-rose-600"}`}>
          {note.text}
        </p>
      )}
      {invalid && (
        <p className="rounded-2xl bg-amber-500/12 px-4 py-2.5 text-sm font-bold text-amber-600">
          كل شهادة تحتاج اسماً ونصّاً قبل الحفظ.
        </p>
      )}

      {loading ? (
        <p className="text-sm text-muted-foreground">جارٍ التحميل…</p>
      ) : items.length === 0 ? (
        <div className="glass rounded-3xl p-8 text-center" data-reveal="scale">
          <IconStar className="mx-auto size-10 text-muted-foreground" />
          <p className="mt-3 font-display font-extrabold">لا توجد شهادات بعد</p>
          <p className="mt-1 text-sm text-muted-foreground">اضغطي «شهادة جديدة» لإضافة أول رأي طالب.</p>
        </div>
      ) : (
        <div className="space-y-4" data-reveal-group>
          {items.map((t, i) => (
            <section key={t.id} className="glass space-y-3 rounded-3xl p-4 sm:p-5" data-reveal="up">
              <div className="flex flex-wrap items-center gap-2">
                <Preview t={t} />
                <span className="min-w-0 flex-1 truncate text-sm font-bold">
                  {t.name || <span className="text-muted-foreground">شهادة بلا اسم</span>}
                </span>

                <div className="flex items-center gap-1.5">
                  <button onClick={() => move(i, -1)} disabled={i === 0} title="لأعلى"
                    className="grid size-8 place-items-center rounded-full border border-border text-muted-foreground transition hover:text-foreground disabled:opacity-30">
                    <IconArrowLeft className="size-4 rotate-90" />
                  </button>
                  <button onClick={() => move(i, 1)} disabled={i === items.length - 1} title="لأسفل"
                    className="grid size-8 place-items-center rounded-full border border-border text-muted-foreground transition hover:text-foreground disabled:opacity-30">
                    <IconArrowLeft className="size-4 -rotate-90" />
                  </button>
                  <button onClick={() => setItems((p) => p.filter((x) => x.id !== t.id))} title="حذف"
                    className="grid size-8 place-items-center rounded-full border border-rose-500/30 text-rose-600 transition hover:bg-rose-500/8">
                    <IconXCircle className="size-4" />
                  </button>
                </div>
              </div>

              <div className="grid gap-3 sm:grid-cols-2">
                <Field label="اسم الطالب" value={t.name} onChange={(v) => set(t.id, { name: v })} placeholder="اسم الطالب" />
                <Field label="الصف أو المدرسة" value={t.grade ?? ""} onChange={(v) => set(t.id, { grade: v })} placeholder="الثالث الثانوي — أزهري" />
                <Field label="الوسام" value={t.badge ?? ""} onChange={(v) => set(t.id, { badge: v })} placeholder="الأول على الدفعة · ٩٨٪" />
                <PhotoField value={t.photo ?? ""} onChange={(v) => set(t.id, { photo: v })} />
              </div>

              <label className="block">
                <span className="mb-1 block text-xs font-bold text-muted-foreground">نصّ الشهادة</span>
                <textarea
                  value={t.text}
                  rows={3}
                  onChange={(e) => set(t.id, { text: e.target.value })}
                  placeholder="ما قاله الطالب عن المنصّة…"
                  className="w-full rounded-2xl border border-border bg-card/60 px-4 py-2.5 text-sm outline-none transition focus:border-primary/50"
                />
              </label>

              <div className="flex flex-wrap items-center gap-2">
                <button
                  onClick={() => setFeatured(t.id)}
                  className={`inline-flex items-center gap-1.5 rounded-full px-3.5 py-2 text-xs font-bold transition ${
                    t.featured ? "bg-amber-500/15 text-amber-600 ring-1 ring-amber-500/30" : "border border-border text-muted-foreground hover:border-primary/40"
                  }`}
                >
                  <IconTrophy className="size-3.5" /> {t.featured ? "الطالب الأول" : "اجعلها الطالب الأول"}
                </button>

                <button
                  onClick={() => set(t.id, { hidden: !t.hidden })}
                  className={`rounded-full px-3.5 py-2 text-xs font-bold transition ${
                    t.hidden ? "bg-rose-500/12 text-rose-600" : "border border-border text-muted-foreground hover:border-primary/40"
                  }`}
                >
                  {t.hidden ? "مخفيّة" : "ظاهرة"}
                </button>

                <span className="flex items-center gap-1 rounded-full border border-border px-2.5 py-1.5">
                  {[1, 2, 3, 4, 5].map((n) => (
                    <button key={n} onClick={() => set(t.id, { rating: t.rating === n ? undefined : n })} aria-label={`${n} نجوم`}>
                      <IconStar className={`size-4 ${(t.rating ?? 0) >= n ? "text-amber-500" : "text-muted-foreground/30"}`} />
                    </button>
                  ))}
                </span>
              </div>
            </section>
          ))}
        </div>
      )}
    </div>
  );
}

/**
 * صورة الطالب — ترفع إلى Google Drive مباشرة.
 * الملف لا يُخزَّن على الخادم إطلاقاً، والصورة تُعرض عبر وسيط المنصّة.
 */
function PhotoField({ value, onChange }: { value: string; onChange: (v: string) => void }) {
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState<string | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const src = mediaSrc(value);

  const pick = async (file?: File | null) => {
    if (!file) return;
    if (!file.type.startsWith("image/")) { setErr("اختاري ملف صورة"); return; }
    setErr(null);
    setBusy(true);
    const fd = new FormData();
    fd.append("file", file);
    fd.append("target", "drive"); // درايف دائماً — لا تخزين محلي
    const res = await fetch("/api/upload", { method: "POST", body: fd });
    const data = await res.json().catch(() => ({}));
    setBusy(false);
    if (!res.ok) { setErr(data.error ?? "تعذّر الرفع"); return; }
    onChange(data.url as string);
  };

  return (
    <div>
      <span className="mb-1 block text-xs font-bold text-muted-foreground">صورة الطالب</span>
      <div className="flex items-center gap-3">
        {src ? (
          <span className="relative size-14 shrink-0 overflow-hidden rounded-2xl ring-1 ring-border">
            <Image src={src} alt="" width={56} height={56} className="size-full object-cover" unoptimized />
          </span>
        ) : (
          <span className="grid size-14 shrink-0 place-items-center rounded-2xl border border-dashed border-border text-muted-foreground">
            <IconInstall className="size-5" />
          </span>
        )}

        <div className="flex min-w-0 flex-1 flex-wrap gap-2">
          <input
            ref={inputRef}
            type="file"
            accept="image/*"
            className="hidden"
            onChange={(e) => void pick(e.target.files?.[0])}
          />
          <button
            type="button"
            onClick={() => inputRef.current?.click()}
            disabled={busy}
            className="inline-flex items-center gap-1.5 rounded-full border border-border px-3.5 py-2 text-xs font-bold transition hover:border-primary/40 disabled:opacity-60"
          >
            {busy ? <IconSpinner className="size-3.5 animate-spin" /> : <IconInstall className="size-3.5" />}
            {busy ? "جارٍ الرفع…" : src ? "تغيير الصورة" : "رفع صورة إلى درايف"}
          </button>
          {src && (
            <button
              type="button"
              onClick={() => onChange("")}
              className="inline-flex items-center gap-1.5 rounded-full border border-rose-500/30 px-3.5 py-2 text-xs font-bold text-rose-600 transition hover:bg-rose-500/8"
            >
              <IconXCircle className="size-3.5" /> إزالة
            </button>
          )}
        </div>
      </div>
      {err && <p className="mt-1 text-[11px] font-bold text-rose-500">{err}</p>}
      {!src && !err && (
        <p className="mt-1 text-[11px] text-muted-foreground">اختياري — بلا صورة يظهر أوّل حرف من الاسم.</p>
      )}
    </div>
  );
}

function Preview({ t }: { t: Testimonial }) {
  const src = mediaSrc(t.photo);
  if (!src) {
    return (
      <span className="grid size-10 shrink-0 place-items-center rounded-2xl btn-glow text-sm font-bold text-white">
        {t.name.charAt(0) || "؟"}
      </span>
    );
  }
  return (
    <span className="relative size-10 shrink-0 overflow-hidden rounded-2xl ring-1 ring-border">
      <Image src={src} alt={t.name} width={40} height={40} className="size-full object-cover" unoptimized />
    </span>
  );
}

function Field({
  label, value, onChange, placeholder,
}: { label: string; value: string; onChange: (v: string) => void; placeholder?: string }) {
  return (
    <label className="block">
      <span className="mb-1 block text-xs font-bold text-muted-foreground">{label}</span>
      <input
        value={value}
        placeholder={placeholder}
        onChange={(e) => onChange(e.target.value)}
        className="w-full rounded-2xl border border-border bg-card/60 px-4 py-2.5 text-sm outline-none transition focus:border-primary/50"
      />
    </label>
  );
}
