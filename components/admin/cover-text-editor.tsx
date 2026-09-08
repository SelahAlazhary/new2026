"use client";

/**
 * محرّر نصّ غلاف الكورس.
 * ------------------------------------------------------------------
 * معاينة حيّة بلوحة الغلاف نفسها، وفوقها مقبض يُسحب بالماوس (أو باللمس)
 * فيتحرّك النصّ إلى مكانه. الموضع يُحفظ بالنسبة المئوية لا بالبكسل،
 * فيثبت في كل المقاسات — بطاقة الطالب الصغيرة والمعاينة الكبيرة سواء.
 *
 * السحب يستخدم Pointer Events مع setPointerCapture: يعمل بالماوس واللمس
 * والقلم بالكود نفسه، ولا يفلت المقبض إذا خرج المؤشّر من الصندوق.
 * الحفظ يقع مرّة واحدة عند رفع الإصبع لا مع كل حركة — فلا يُغرق الخادم.
 *
 * لوحة المفاتيح بديل للسحب (الأسهم) حتى يبقى الضبط ممكناً بلا ماوس.
 */
import { useRef, useState, type PointerEvent as RPointerEvent } from "react";
import { CourseArt, COVER_FONTS } from "@/components/brand/course-art";
import { ZoomBar } from "@/components/admin/zoom-bar";
import type { CoverFont, CoverText, Subject } from "@/lib/utils/types";

const DEFAULTS: CoverText = {
  text: "",
  x: 50,
  y: 50,
  size: 26,
  font: "display",
  bold: true,
  color: "#ffffff",
  gradient: false,
  color2: "#e0991f",
  align: "center",
  outline: true,
};

const clamp = (v: number) => Math.max(0, Math.min(100, v));

export function CoverTextEditor({
  subject,
  onChange,
}: {
  subject: Subject;
  /** يُستدعى بالنصّ الجديد — والحفظ من المستدعي. */
  onChange: (next: CoverText) => void;
}) {
  const t: CoverText = { ...DEFAULTS, ...(subject.coverText ?? {}) };
  const boxRef = useRef<HTMLDivElement>(null);
  const [drag, setDrag] = useState(false);
  const [zoom, setZoom] = useState(1);
  /** موضع أثناء السحب — محلي حتى لا يُحفظ مع كل حركة. */
  const [live, setLive] = useState<{ x: number; y: number } | null>(null);

  const pos = live ?? { x: t.x, y: t.y };
  const patch = (p: Partial<CoverText>) => onChange({ ...t, ...p });

  /** يحوّل إحداثيات المؤشّر إلى نسبة مئوية من اللوحة. */
  const toPercent = (e: RPointerEvent<HTMLElement>) => {
    const box = boxRef.current?.getBoundingClientRect();
    if (!box || !box.width || !box.height) return null;
    return {
      x: clamp(((e.clientX - box.left) / box.width) * 100),
      y: clamp(((e.clientY - box.top) / box.height) * 100),
    };
  };

  const onDown = (e: RPointerEvent<HTMLButtonElement>) => {
    e.preventDefault();
    e.currentTarget.setPointerCapture(e.pointerId);
    setDrag(true);
  };

  const onMove = (e: RPointerEvent<HTMLButtonElement>) => {
    if (!drag) return;
    const p = toPercent(e);
    if (p) setLive(p);
  };

  const onUp = (e: RPointerEvent<HTMLButtonElement>) => {
    if (!drag) return;
    e.currentTarget.releasePointerCapture(e.pointerId);
    setDrag(false);
    if (live) patch(live);
    setLive(null);
  };

  /** الأسهم تحرّك النصّ خطوة (وخطوة أكبر مع Shift). */
  const onKey = (e: React.KeyboardEvent) => {
    const step = e.shiftKey ? 5 : 1;
    const map: Record<string, [number, number]> = {
      ArrowUp: [0, -step], ArrowDown: [0, step],
      ArrowLeft: [-step, 0], ArrowRight: [step, 0],
    };
    const d = map[e.key];
    if (!d) return;
    e.preventDefault();
    patch({ x: clamp(t.x + d[0]), y: clamp(t.y + d[1]) });
  };

  const hasText = Boolean(t.text.trim());

  return (
    <div className="grid gap-4 lg:grid-cols-[minmax(0,22rem)_1fr]">
      {/* ---------- المعاينة والسحب ---------- */}
      <div>
        <div className="mb-1 flex items-center justify-between gap-2">
          <span className="lbl mb-0">اسحب النصّ إلى مكانه</span>
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
            coverText={{ ...t, x: pos.x, y: pos.y }}
            progress={42}
          />

          {hasText && (
            <button
              type="button"
              aria-label="اسحب لتحريك النصّ"
              onPointerDown={onDown}
              onPointerMove={onMove}
              onPointerUp={onUp}
              onPointerCancel={onUp}
              onKeyDown={onKey}
              style={{ left: `${pos.x}%`, top: `${pos.y}%`, touchAction: "none" }}
              className={`absolute -translate-x-1/2 -translate-y-1/2 rounded-full border-2 border-dashed px-3 py-1.5 text-[10px] font-bold transition ${
                drag
                  ? "cursor-grabbing border-primary bg-primary/25 text-white"
                  : "cursor-grab border-white/70 bg-black/35 text-white hover:border-primary"
              }`}
            >
              ✥ حرّك
            </button>
          )}
          </div>
        </div>
        <p className="mt-1.5 text-[10px] leading-relaxed text-muted-foreground">
          اسحب المقبض بالماوس، أو ركّز عليه واستخدم الأسهم (مع Shift لخطوة أكبر).
          الموضع محفوظ بالنسبة المئوية فيثبت في كل المقاسات.
        </p>
      </div>

      {/* ---------- الخصائص ---------- */}
      <div className="grid content-start gap-3">
        <label className="block">
          <span className="lbl">النصّ</span>
          <textarea
            rows={2}
            className="inp resize-none"
            value={t.text}
            onChange={(e) => patch({ text: e.target.value })}
            placeholder="مثال: النحو من الصفر"
          />
          <span className="mt-1 block text-[10px] text-muted-foreground">
            اتركه فارغاً لإخفاء النصّ. يمكن كتابة حتى ٤ أسطر.
          </span>
        </label>

        <div className="grid gap-3 sm:grid-cols-2">
          <label className="block">
            <span className="lbl">نوع الخطّ</span>
            <select
              className="inp"
              value={t.font}
              onChange={(e) => patch({ font: e.target.value as CoverFont })}
            >
              {COVER_FONTS.map((f) => (
                <option key={f.id} value={f.id}>{f.label}</option>
              ))}
            </select>
          </label>

          <label className="block">
            <span className="lbl">المحاذاة</span>
            <select
              className="inp"
              value={t.align}
              onChange={(e) => patch({ align: e.target.value as CoverText["align"] })}
            >
              <option value="center">وسط</option>
              <option value="right">يمين</option>
              <option value="left">يسار</option>
            </select>
          </label>
        </div>

        <label className="block">
          <span className="lbl">
            حجم النصّ <span className="font-bold text-foreground">{(t.size ?? 26).toLocaleString("ar-EG")}</span>
          </span>
          <input
            type="range" min={8} max={72} step={1}
            value={t.size}
            onChange={(e) => patch({ size: Number(e.target.value) })}
            className="w-full accent-[hsl(var(--primary))]"
          />
        </label>

        <div className="grid gap-3 sm:grid-cols-2">
          <label className="block">
            <span className="lbl">لون النصّ</span>
            <input
              type="color"
              value={t.color}
              onChange={(e) => patch({ color: e.target.value })}
              className="h-10 w-full cursor-pointer rounded-2xl border border-border bg-transparent p-1"
            />
          </label>
          {t.gradient && (
            <label className="block">
              <span className="lbl">اللون الثاني</span>
              <input
                type="color"
                value={t.color2}
                onChange={(e) => patch({ color2: e.target.value })}
                className="h-10 w-full cursor-pointer rounded-2xl border border-border bg-transparent p-1"
              />
            </label>
          )}
        </div>

        <div className="flex flex-wrap gap-2">
          <Toggle on={Boolean(t.gradient)} onClick={() => patch({ gradient: !t.gradient })}>
            متدرّج
          </Toggle>
          <Toggle on={t.bold !== false} onClick={() => patch({ bold: t.bold === false })}>
            عريض
          </Toggle>
          <Toggle on={t.outline !== false} onClick={() => patch({ outline: t.outline === false })}>
            حدّ داكن
          </Toggle>
          <button
            type="button"
            onClick={() => patch({ x: 50, y: 50, size: 26 })}
            className="rounded-full border border-border px-3.5 py-1.5 text-xs font-bold transition hover:border-primary hover:text-primary"
          >
            إعادة الضبط
          </button>
        </div>
      </div>
    </div>
  );
}

function Toggle({
  on,
  onClick,
  children,
}: {
  on: boolean;
  onClick: () => void;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`rounded-full border px-3.5 py-1.5 text-xs font-bold transition ${
        on ? "border-primary bg-primary/10 text-primary" : "border-border hover:border-primary/40"
      }`}
    >
      {children}
    </button>
  );
}
