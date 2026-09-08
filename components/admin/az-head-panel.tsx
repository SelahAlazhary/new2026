"use client";

/**
 * التحكّمُ الكاملُ بلوح ترحيب الطالب.
 * ------------------------------------------------------------------
 * لوحُ الترحيب أوّلُ ما يراه الطالبُ في كلّ زيارة، وكان مقاساتٍ وألواناً
 * مكتوبةً في الشيفرة: من أراد اسماً أكبرَ أو بطاقةً أقلَّ انتظر تعديلاً.
 * فصار كلُّه ملكاً للأستاذ — عشرون تصميماً، وثلاثةُ ألوان، وستّةُ
 * مقاسات، وسبعةُ مفاتيحِ إظهار.
 *
 * **والحفظُ فوريٌّ لا بزرٍّ.** ضبطُ المظهر تجربةٌ لا نموذج: يُحرَّك المقاسُ
 * فيُرى أثرُه، ولو لزم زرُّ حفظٍ بعد كلّ تحريكٍ لصار الضبطُ عملاً.
 *
 * **ولا معاينةَ مصغّرةٌ هنا.** المعاينةُ الصغيرةُ تكذب: مقاسُ خطٍّ يبدو
 * صحيحاً في مربّعٍ صغيرٍ ويكبر في الشاشة. فزرُّ «افتح بوّابة الطالب»
 * يُريه في موضعه الحقيقيّ.
 */

import { useState } from "react";
import { Card } from "@/components/dashboard/ui";
import { AZ_HEAD_STYLES } from "@/lib/styles/az-head-styles";
import { AZ_CARD_STYLES } from "@/lib/styles/az-card-styles";
import type { AzHeadOptions } from "@/lib/utils/types";

/** مقاسٌ يُحرَّك — الرقمُ مكتوبٌ بجانبه فلا يُخمَّن. */
function Slide({
  label,
  value,
  min,
  max,
  onChange,
  suffix = "px",
}: {
  label: string;
  value: number;
  min: number;
  max: number;
  onChange: (v: number) => void;
  suffix?: string;
}) {
  return (
    <label className="block">
      <span className="mb-1 flex items-center justify-between text-[11px] font-semibold text-muted-foreground">
        {label}
        <span className="font-mono text-[11px] text-foreground">
          {value}
          {suffix}
        </span>
      </span>
      <input
        type="range"
        min={min}
        max={max}
        value={value}
        onChange={(e) => onChange(Number(e.target.value))}
        className="w-full accent-[var(--brand-primary,hsl(var(--primary)))]"
      />
    </label>
  );
}

/** مفتاحُ إظهار — والعبارةُ إيجابيّةٌ دائماً: «أظهر» لا «أخفِ». */
function Show({
  label,
  on,
  onChange,
}: {
  label: string;
  on: boolean;
  onChange: (v: boolean) => void;
}) {
  return (
    <label className="flex cursor-pointer items-center gap-2 rounded-xl border border-border px-3 py-2 text-[12px] font-bold">
      <input
        type="checkbox"
        checked={on}
        onChange={(e) => onChange(e.target.checked)}
        className="size-4 accent-[var(--brand-primary,hsl(var(--primary)))]"
      />
      {label}
    </label>
  );
}

/** لونٌ يُختار — ومعه زرُّ عودةٍ إلى لون التصميم. */
function Color({
  label,
  value,
  fallback,
  onChange,
}: {
  label: string;
  value?: string;
  fallback: string;
  onChange: (v?: string) => void;
}) {
  return (
    <div>
      <span className="mb-1 block text-[11px] font-semibold text-muted-foreground">{label}</span>
      <div className="flex items-center gap-2">
        <input
          type="color"
          value={value && value.startsWith("#") ? value : fallback}
          onChange={(e) => onChange(e.target.value)}
          className="size-9 shrink-0 cursor-pointer rounded-lg border border-border bg-transparent"
        />
        <input
          dir="ltr"
          className="inp flex-1 text-right text-[12px]"
          placeholder="من التصميم"
          value={value ?? ""}
          onChange={(e) => onChange(e.target.value || undefined)}
        />
        {value && (
          <button
            type="button"
            onClick={() => onChange(undefined)}
            className="shrink-0 rounded-lg border border-border px-2 py-1.5 text-[11px] font-bold text-muted-foreground transition hover:text-foreground"
          >
            إلغاء
          </button>
        )}
      </div>
    </div>
  );
}


/** اختيارٌ من صفٍّ — أوضحُ من قائمةٍ منسدلةٍ حين تكون الخياراتُ ثلاثةً أو أربعة. */
function Pick<T extends string | number>({
  label,
  value,
  options,
  onChange,
  hint,
}: {
  label: string;
  value: T;
  options: { v: T; t: string }[];
  onChange: (v: T) => void;
  hint?: string;
}) {
  return (
    <div>
      <span className="mb-1.5 block text-[11px] font-semibold text-muted-foreground">{label}</span>
      <div className="inline-flex flex-wrap rounded-2xl border border-border bg-card p-1">
        {options.map((op) => {
          const on = op.v === value;
          return (
            <button
              key={String(op.v)}
              type="button"
              onClick={() => onChange(op.v)}
              aria-pressed={on}
              style={on ? { background: "var(--brand-primary, hsl(var(--primary)))" } : undefined}
              className={`rounded-xl px-3.5 py-2 text-[12px] font-bold transition ${
                on ? "text-white" : "text-muted-foreground hover:text-foreground"
              }`}
            >
              {op.t}
            </button>
          );
        })}
      </div>
      {hint && <p className="mt-1.5 text-[10px] leading-relaxed text-muted-foreground">{hint}</p>}
    </div>
  );
}

const CARD_NAME: Record<string, string> = {
  progress: "متوسّط التقدّم",
  courses: "الكورسات",
  sub: "الاشتراك",
};

export function AzHeadPanel({
  value,
  onChange,
}: {
  value: AzHeadOptions | undefined;
  onChange: (next: AzHeadOptions) => void;
}) {
  const o = value ?? {};
  const set = (patch: Partial<AzHeadOptions>) => onChange({ ...o, ...patch });
  const [tab, setTab] = useState<"style" | "cards" | "places" | "colors" | "sizes" | "parts">("style");

  /* الترتيبُ يُكمَّل بالباقي — بطاقةٌ تُضاف غداً لا يعرفها ضبطُ اليوم. */
  const ALL = ["progress", "courses", "sub"];
  const order = [...(o.order ?? []).filter((k) => ALL.includes(k)), ...ALL.filter((k) => !(o.order ?? []).includes(k))];
  const move = (i: number, dir: -1 | 1) => {
    const j = i + dir;
    if (j < 0 || j >= order.length) return;
    const next = [...order];
    [next[i], next[j]] = [next[j], next[i]];
    set({ order: next });
  };

  /*
    حارسُ التباين.
    ------------------------------------------------------------------
    اللوحةُ كانت تقبل حبراً بلون الأرض، فيختفي النصُّ كلُّه ويظنّ الأستاذُ
    المنصّةَ عطبت. وهو خطأٌ في اللوحة لا في اختياره: أداةٌ تسمح بضبطٍ
    يُعمي شاشتَها ولا تُنبّه، أداةٌ ناقصة.

    والحسابُ حسابُ WCAG نفسُه: النسبةُ دون ٤٫٥ لا يُقرأ بها نصُّ متن.
    ولا يُمنع الاختيار — قد يريده لسببٍ لا أعرفه — بل يُقال له ويُعرض
    عليه الإصلاح.
  */
  const lum = (hex: string) => {
    const h = hex.replace("#", "");
    if (h.length !== 6) return null;
    const v = [0, 2, 4].map((i) => {
      const c = parseInt(h.slice(i, i + 2), 16) / 255;
      return c <= 0.03928 ? c / 12.92 : Math.pow((c + 0.055) / 1.055, 2.4);
    });
    return 0.2126 * v[0] + 0.7152 * v[1] + 0.0722 * v[2];
  };
  const contrast = (() => {
    const a = lum(o.inkColor ?? "");
    const b = lum(o.panelColor ?? "");
    if (a === null || b === null) return null;
    return (Math.max(a, b) + 0.05) / (Math.min(a, b) + 0.05);
  })();
  const unreadable = contrast !== null && contrast < 4.5;

  const TABS = [
    { id: "style", label: "تصميم اللوح" },
    { id: "cards", label: "تصميم البطاقة" },
    { id: "places", label: "المواضع" },
    { id: "colors", label: "الألوان" },
    { id: "sizes", label: "المقاسات" },
    { id: "parts", label: "العناصر" },
  ] as const;

  return (
    <Card className="mb-6">
      <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
        <div className="min-w-0">
          <p className="font-display font-bold">لوح ترحيب الطالب</p>
          <p className="text-[11px] leading-relaxed text-muted-foreground">
            أوّلُ ما يراه الطالبُ في كلّ زيارة — تصميمُه وألوانُه ومقاساتُه وعناصرُه.
          </p>
        </div>
        <div className="flex shrink-0 items-center gap-2">
          <Show label="إظهار اللوح" on={!o.off} onChange={(v) => set({ off: !v })} />
          <a
            href="/student"
            target="_blank"
            rel="noreferrer"
            className="rounded-xl border border-border px-3 py-2 text-[11px] font-bold transition hover:border-primary/50 hover:text-primary"
          >
            افتح بوّابة الطالب
          </a>
        </div>
      </div>

      <div className="mb-4 inline-flex flex-wrap rounded-2xl border border-border bg-card p-1">
        {TABS.map((t) => {
          const on = tab === t.id;
          return (
            <button
              key={t.id}
              type="button"
              onClick={() => setTab(t.id)}
              aria-pressed={on}
              style={on ? { background: "var(--brand-primary, hsl(var(--primary)))" } : undefined}
              className={`rounded-xl px-4 py-2 text-[12px] font-bold transition ${
                on ? "text-white" : "text-muted-foreground hover:text-foreground"
              }`}
            >
              {t.label}
            </button>
          );
        })}
      </div>

      {tab === "style" && (
        <div className="grid gap-2.5 sm:grid-cols-2 lg:grid-cols-4">
          {AZ_HEAD_STYLES.map((x) => {
            const on = (o.style ?? "azhari") === x.id;
            return (
              <button
                key={x.id}
                type="button"
                onClick={() => set({ style: x.id })}
                className={`rounded-2xl border-2 p-3 text-right transition ${
                  on ? "border-primary shadow-bento" : "border-border hover:border-primary/50"
                }`}
              >
                {/* شريطُ عيّنةٍ يقول لونَ التصميم وحافّتَه بلا ادّعاء معاينة */}
                <span
                  className="mb-2 block h-9"
                  style={{
                    borderRadius: Math.min(x.radius, 16),
                    background: x.panelColor ?? "hsl(217 48% 13%)",
                    border: x.panel === "outline" ? "1px solid hsl(var(--gold)/0.5)" : undefined,
                    boxShadow: `inset -3rem 0 0 -2.6rem ${x.accent ?? "hsl(var(--gold))"}`,
                  }}
                />
                <span className="block truncate text-[12px] font-bold">{x.name}</span>
                <span className="block truncate text-[10px] text-muted-foreground">{x.hint}</span>
              </button>
            );
          })}
        </div>
      )}

      {tab === "cards" && (
        <div className="grid gap-2.5 sm:grid-cols-2 lg:grid-cols-4">
          {AZ_CARD_STYLES.map((x) => {
            const on = (o.cardStyle ?? "stack") === x.id;
            return (
              <button
                key={x.id}
                type="button"
                onClick={() => set({ cardStyle: x.id })}
                className={`rounded-2xl border-2 p-3 text-right transition ${
                  on ? "border-primary shadow-bento" : "border-border hover:border-primary/50"
                }`}
              >
                <span className="mb-2 block truncate text-[12px] font-bold">{x.name}</span>
                <span className="block truncate text-[10px] text-muted-foreground">{x.hint}</span>
              </button>
            );
          })}
          <p className="text-[11px] leading-relaxed text-muted-foreground sm:col-span-2 lg:col-span-4">
            تصميمُ البطاقة مستقلٌّ عن تصميم اللوح، فيتركّبان: عشرون بطاقةً في اثنين
            وعشرين لوحاً تعطي أربعمئةً وأربعين هيئة.
          </p>
        </div>
      )}

      {tab === "places" && (
        <div className="grid gap-5 sm:grid-cols-2">
          <Pick
            label="موضع اللوح في الصفحة"
            value={o.place ?? "top"}
            options={[{ v: "top", t: "أعلى الصفحة" }, { v: "bottom", t: "أسفلها" }]}
            onChange={(v) => set({ place: v })}
            hint="الأسفلُ لمن يريد الدروسَ أوّلاً والملخّصَ ذيلاً."
          />

          <Pick
            label="موضع البطاقات"
            value={o.cardsPos ?? "below"}
            options={[
              { v: "below", t: "تطفو أسفلَه" },
              { v: "above", t: "فوقه" },
              { v: "inside", t: "داخله" },
              { v: "side", t: "عمودٌ واحد" },
            ]}
            onChange={(v) => set({ cardsPos: v })}
            hint="ضبطُك يسبق ما يقترحه التصميم."
          />

          <Pick
            label="محاذاة الترحيب"
            value={o.align ?? "start"}
            options={[{ v: "start", t: "يمين" }, { v: "center", t: "وسط" }, { v: "end", t: "يسار" }]}
            onChange={(v) => set({ align: v })}
          />

          <Pick
            label="عدد الأعمدة"
            value={o.cols ?? 3}
            options={[{ v: 3, t: "٣" }, { v: 2, t: "٢" }, { v: 1, t: "١" }]}
            onChange={(v) => set({ cols: v })}
            hint="في الشاشات الواسعة — والهاتفُ عمودٌ واحدٌ دائماً."
          />

          {/*
            ترتيبُ البطاقات بالأسهم لا بالسحب: السحبُ لا يعمل بلوحة
            المفاتيح، وثلاثةُ عناصرَ لا تستحقّ بناءَه.
          */}
          <div className="sm:col-span-2">
            <span className="mb-1.5 block text-[11px] font-semibold text-muted-foreground">
              ترتيب البطاقات
            </span>
            <div className="flex flex-wrap gap-2">
              {order.map((k, i) => (
                <span
                  key={k}
                  className="inline-flex items-center gap-2 rounded-2xl border border-border bg-card px-3 py-2 text-[12px] font-bold"
                >
                  {CARD_NAME[k] ?? k}
                  <button
                    type="button"
                    aria-label="إلى اليمين"
                    disabled={i === 0}
                    onClick={() => move(i, -1)}
                    className="text-muted-foreground transition hover:text-primary disabled:opacity-30"
                  >
                    ›
                  </button>
                  <button
                    type="button"
                    aria-label="إلى اليسار"
                    disabled={i === order.length - 1}
                    onClick={() => move(i, 1)}
                    className="text-muted-foreground transition hover:text-primary disabled:opacity-30"
                  >
                    ‹
                  </button>
                </span>
              ))}
            </div>
          </div>
        </div>
      )}

      {tab === "colors" && (
        <div className="grid gap-3 sm:grid-cols-3">
          <Color label="أرضُ اللوح" value={o.panelColor} fallback="#132b4d" onChange={(v) => set({ panelColor: v })} />
          <Color label="لونُ التمييز" value={o.accentColor} fallback="#e0991f" onChange={(v) => set({ accentColor: v })} />
          <Color label="لونُ الحبر" value={o.inkColor} fallback="#ffffff" onChange={(v) => set({ inkColor: v })} />
          <Color label="لونُ الحافّة" value={o.edgeColor} fallback="#0b0f18" onChange={(v) => set({ edgeColor: v })} />
          {unreadable && (
            <div className="rounded-2xl border border-amber-500/45 bg-amber-500/[0.08] p-3 sm:col-span-3">
              <p className="text-[12px] font-bold text-amber-700 dark:text-amber-400">
                الحبرُ لا يُقرأ على هذه الأرض — التباينُ {contrast?.toFixed(2)}:1 والحدُّ الأدنى 4.5:1
              </p>
              <button
                type="button"
                onClick={() => set({ inkColor: undefined })}
                className="mt-2 rounded-xl border border-amber-500/50 px-3 py-1.5 text-[11px] font-bold text-amber-700 transition hover:bg-amber-500/10 dark:text-amber-400"
              >
                أعِد لونَ الحبر إلى الأصل
              </button>
            </div>
          )}
          <p className="text-[11px] leading-relaxed text-muted-foreground sm:col-span-3">
            المتروكُ فارغاً يأخذ لونَ التصميم المختار — ومن لا لونَ له يتبع هويّةَ منصّتك،
            فتتبدّل التصاميمُ كلُّها بتبديلها.
          </p>
        </div>
      )}

      {tab === "sizes" && (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          <Slide label="اسم الطالب" value={o.nameSize ?? 36} min={18} max={64} onChange={(v) => set({ nameSize: v })} />
          <Slide label="رقم البطاقة" value={o.valueSize ?? 44} min={20} max={80} onChange={(v) => set({ valueSize: v })} />
          <Slide label="عنوان البطاقة" value={o.titleSize ?? 14} min={10} max={22} onChange={(v) => set({ titleSize: v })} />
          <Slide label="سطر الحال" value={o.noteSize ?? 13} min={10} max={20} onChange={(v) => set({ noteSize: v })} />
          <Slide label="قطر الصورة" value={o.avatarSize ?? 72} min={40} max={120} onChange={(v) => set({ avatarSize: v })} />
          <Slide label="انحناء الحواف" value={o.radius ?? 28} min={0} max={48} onChange={(v) => set({ radius: v })} />
          <Slide label="قطر العدّاد" value={o.ringSize ?? 64} min={36} max={140} onChange={(v) => set({ ringSize: v })} />
        </div>
      )}

      {tab === "parts" && (
        <div className="grid gap-2.5 sm:grid-cols-2 lg:grid-cols-4">
          <Show label="بطاقة التقدّم" on={!o.hideProgress} onChange={(v) => set({ hideProgress: !v })} />
          <Show label="بطاقة الكورسات" on={!o.hideCourses} onChange={(v) => set({ hideCourses: !v })} />
          <Show label="بطاقة الاشتراك" on={!o.hideSub} onChange={(v) => set({ hideSub: !v })} />
          <Show label="أشرطة النسبة" on={!o.hideBars} onChange={(v) => set({ hideBars: !v })} />
          <Show label="الزخرفة الهندسيّة" on={!o.hideOrnament} onChange={(v) => set({ hideOrnament: !v })} />
          <Show label="صورة الحرف الأوّل" on={!o.hideAvatar} onChange={(v) => set({ hideAvatar: !v })} />
          <Show label="الصفّ الدراسيّ" on={!o.hideGrade} onChange={(v) => set({ hideGrade: !v })} />
        </div>
      )}
    </Card>
  );
}
