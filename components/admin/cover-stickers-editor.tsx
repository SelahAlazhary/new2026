"use client";

/**
 * محرّر الصور الملصقة على غلاف الكورس.
 * ------------------------------------------------------------------
 * ترفع صورة (تمرّ باستوديو القصّ وإزالة الخلفية أولاً)، فتُلصق على
 * اللوحة ثم تسحبها بالماوس إلى مكانها وتضبط حجمها ودورانها.
 *
 * كل القياسات بالنسبة المئوية من اللوحة لا بالبكسل، فتثبت في كل
 * المقاسات: بطاقة الطالب الصغيرة والمعاينة الكبيرة سواء.
 *
 * السحب بـPointer Events مع setPointerCapture — يعمل بالماوس واللمس
 * والقلم بالكود نفسه، والحفظ عند رفع الإصبع لا مع كل حركة.
 */
import { useRef, useState, type PointerEvent as RPointerEvent } from "react";
import { ImagePlus, Trash2, Loader2, Wand2 } from "lucide-react";
import { CourseArt } from "@/components/brand/course-art";
import { ImageStudio } from "@/components/admin/image-studio";
import { ZoomBar } from "@/components/admin/zoom-bar";
import { useContent } from "@/components/content/content-provider";
import type { CoverSticker, Subject } from "@/lib/utils/types";

const clamp = (v: number, lo = 0, hi = 100) => Math.max(lo, Math.min(hi, v));
const ar = (n: number) => n.toLocaleString("ar-EG");

export function CoverStickersEditor({
  subject,
  onChange,
}: {
  subject: Subject;
  onChange: (next: CoverSticker[]) => void;
}) {
  const { uploadImage } = useContent();
  const list = subject.coverStickers ?? [];
  const fileRef = useRef<HTMLInputElement>(null);
  const boxRef = useRef<HTMLDivElement>(null);

  const [editing, setEditing] = useState<File | null>(null);
  const [busy, setBusy] = useState(false);
  const [active, setActive] = useState<string | null>(null);
  const [zoom, setZoom] = useState(1);
  /** موضع أثناء السحب — محلي حتى لا يُحفظ مع كل حركة. */
  const [live, setLive] = useState<{ id: string; x: number; y: number } | null>(null);

  const shown = list.map((st) =>
    live && live.id === st.id ? { ...st, x: live.x, y: live.y } : st
  );

  const patch = (id: string, p: Partial<CoverSticker>) =>
    onChange(list.map((s) => (s.id === id ? { ...s, ...p } : s)));

  const remove = (id: string) => {
    onChange(list.filter((s) => s.id !== id));
    if (active === id) setActive(null);
  };

  /** الصورة الخارجة من الاستوديو تُرفع وتُلصق في وسط اللوحة. */
  const addFromStudio = async (out: File, ratio: number) => {
    setBusy(true);
    const url = await uploadImage(out);
    setBusy(false);
    setEditing(null);
    if (!url) return;
    const id = `st-${Date.now().toString(36)}`;
    onChange([...list, { id, src: url, x: 50, y: 50, size: 28, ratio, opacity: 100, rotate: 0 }]);
    setActive(id);
  };

  /* ---------- السحب ---------- */
  const toPercent = (e: RPointerEvent<HTMLElement>) => {
    const box = boxRef.current?.getBoundingClientRect();
    if (!box?.width || !box.height) return null;
    return {
      x: clamp(((e.clientX - box.left) / box.width) * 100),
      y: clamp(((e.clientY - box.top) / box.height) * 100),
    };
  };

  const onDown = (id: string) => (e: RPointerEvent<HTMLButtonElement>) => {
    e.preventDefault();
    e.currentTarget.setPointerCapture(e.pointerId);
    setActive(id);
    setLive({ id, x: list.find((s) => s.id === id)?.x ?? 50, y: list.find((s) => s.id === id)?.y ?? 50 });
  };

  const onMove = (id: string) => (e: RPointerEvent<HTMLButtonElement>) => {
    if (live?.id !== id) return;
    const p = toPercent(e);
    if (p) setLive({ id, ...p });
  };

  const onUp = (id: string) => (e: RPointerEvent<HTMLButtonElement>) => {
    if (live?.id !== id) return;
    e.currentTarget.releasePointerCapture(e.pointerId);
    patch(id, { x: live.x, y: live.y });
    setLive(null);
  };

  const onKey = (st: CoverSticker) => (e: React.KeyboardEvent) => {
    const step = e.shiftKey ? 5 : 1;
    const map: Record<string, [number, number]> = {
      ArrowUp: [0, -step], ArrowDown: [0, step], ArrowLeft: [-step, 0], ArrowRight: [step, 0],
    };
    const d = map[e.key];
    if (!d) return;
    e.preventDefault();
    patch(st.id, { x: clamp(st.x + d[0]), y: clamp(st.y + d[1]) });
  };

  const sel = list.find((s) => s.id === active) ?? null;

  return (
    <div className="grid gap-4 lg:grid-cols-[minmax(0,22rem)_1fr]">
      {/* ---------- المعاينة ---------- */}
      <div>
        <div className="mb-1 flex items-center justify-between gap-2">
          <span className="lbl mb-0">اسحب الصور إلى أماكنها</span>
          <ZoomBar zoom={zoom} onZoom={setZoom} />
        </div>
        {/* التكبير يوسّع الصندوق نفسه فيبقى قياس السحب صحيحاً */}
        <div className="overflow-auto rounded-2xl">
          <div ref={boxRef} style={{ width: `${zoom * 100}%` }} className="relative select-none overflow-hidden rounded-2xl">
          <CourseArt
            seed={subject.id}
            title={subject.name}
            cover={subject.cover}
            coverFit={subject.coverFit}
            coverRatio={subject.coverRatio}
            coverColor={subject.coverColor}
            coverPattern={subject.coverPattern}
            coverText={subject.coverText}
            coverStickers={shown}
            progress={42}
          />

          {/* مقبض لكل صورة */}
          {shown.map((st) => (
            <button
              key={st.id}
              type="button"
              aria-label={`حرّك الصورة ${st.id}`}
              onPointerDown={onDown(st.id)}
              onPointerMove={onMove(st.id)}
              onPointerUp={onUp(st.id)}
              onPointerCancel={onUp(st.id)}
              onKeyDown={onKey(st)}
              style={{ left: `${st.x}%`, top: `${st.y}%`, touchAction: "none" }}
              className={`absolute size-6 -translate-x-1/2 -translate-y-1/2 rounded-full border-2 transition ${
                active === st.id
                  ? "cursor-grabbing border-primary bg-primary/40"
                  : "cursor-grab border-white/80 bg-black/40 hover:border-primary"
              }`}
            />
          ))}
          </div>
        </div>
        <p className="mt-1.5 text-[10px] leading-relaxed text-muted-foreground">
          اضغط على مقبض صورة لتحديدها ثم اسحبه، أو استخدم الأسهم (مع Shift لخطوة أكبر).
        </p>

        <input
          ref={fileRef}
          type="file"
          accept="image/*"
          hidden
          onChange={(e) => {
            const f = e.target.files?.[0];
            if (f) setEditing(f);
            e.target.value = "";
          }}
        />
        <button
          type="button"
          onClick={() => fileRef.current?.click()}
          disabled={busy}
          className="mt-3 inline-flex items-center gap-2 rounded-full border border-border px-4 py-2 text-xs font-bold transition hover:border-primary hover:text-primary disabled:opacity-60"
        >
          {busy ? <Loader2 className="size-4 animate-spin" /> : <ImagePlus className="size-4" />}
          إضافة صورة
        </button>
      </div>

      {/* ---------- خصائص الصورة المحدّدة ---------- */}
      <div className="grid content-start gap-3">
        {list.length === 0 && (
          <p className="rounded-2xl border border-dashed border-border p-4 text-center text-xs text-muted-foreground">
            لا توجد صور بعد. اضغط «إضافة صورة» — ستُفتح أداة القصّ وإزالة الخلفية قبل اللصق.
          </p>
        )}

        {list.length > 0 && (
          <div className="flex flex-wrap gap-2">
            {list.map((st) => (
              <button
                key={st.id}
                type="button"
                onClick={() => setActive(st.id)}
                className={`size-12 overflow-hidden rounded-xl border-2 transition ${
                  active === st.id ? "border-primary" : "border-border hover:border-primary/50"
                }`}
              >
                {/* معاينة مصغّرة للصورة نفسها */}
                <img src={st.src} alt="" className="size-full object-contain" />
              </button>
            ))}
          </div>
        )}

        {sel && (
          <>
            <SliderRow label="الحجم" unit="٪ من عرض اللوحة" value={sel.size} min={5} max={100}
              onChange={(v) => patch(sel.id, { size: v })} />
            <SliderRow label="الدوران" unit="درجة" value={sel.rotate ?? 0} min={-180} max={180}
              onChange={(v) => patch(sel.id, { rotate: v })} />
            <SliderRow label="الشفافية" unit="٪" value={sel.opacity ?? 100} min={10} max={100}
              onChange={(v) => patch(sel.id, { opacity: v })} />

            <div className="flex flex-wrap gap-2">
              <button
                type="button"
                onClick={() => patch(sel.id, { round: !sel.round })}
                className={`rounded-full border px-3.5 py-1.5 text-xs font-bold transition ${
                  sel.round ? "border-primary bg-primary/10 text-primary" : "border-border hover:border-primary/40"
                }`}
              >
                قصّ دائري
              </button>
              <button
                type="button"
                onClick={() => patch(sel.id, { x: 50, y: 50, size: 28, rotate: 0, opacity: 100 })}
                className="rounded-full border border-border px-3.5 py-1.5 text-xs font-bold transition hover:border-primary hover:text-primary"
              >
                إعادة الضبط
              </button>
              <button
                type="button"
                onClick={() => remove(sel.id)}
                className="inline-flex items-center gap-1.5 rounded-full border border-border px-3.5 py-1.5 text-xs font-bold text-rose-500 transition hover:border-rose-500"
              >
                <Trash2 className="size-3.5" /> حذف الصورة
              </button>
            </div>

            <p className="text-[10px] leading-relaxed text-muted-foreground">
              <Wand2 className="ms-0 me-1 inline size-3" />
              لقصّ الصورة أو إزالة خلفيتها من جديد، احذفها وأضفها مرّة أخرى — تُفتح الأداة عند كل إضافة.
            </p>
          </>
        )}
      </div>

      {/* ---------- استوديو القصّ وإزالة الخلفية ---------- */}
      {editing && (
        <ImageStudio file={editing} onCancel={() => setEditing(null)} onDone={addFromStudio} />
      )}
    </div>
  );
}

function SliderRow({
  label, unit, value, min, max, onChange,
}: {
  label: string; unit: string; value: number; min: number; max: number; onChange: (v: number) => void;
}) {
  return (
    <label className="block">
      <span className="mb-1 flex items-center justify-between text-[11px] font-semibold text-muted-foreground">
        <span>{label}</span>
        <span className="font-bold text-foreground">{ar(value)} {unit}</span>
      </span>
      <input
        type="range" min={min} max={max} value={value}
        onChange={(e) => onChange(Number(e.target.value))}
        className="w-full accent-[hsl(var(--primary))]"
      />
    </label>
  );
}
