"use client";

/**
 * خيارات سعر الكورس.
 * ------------------------------------------------------------------
 * الكورس كان بسعر واحد اسمه «السعر الشهري»، فمن أراد بيعه بالترم أو
 * بالحصّة اضطرّ لصنع خطة في قسم الخطط لكل كورس. هنا تُضاف الخيارات
 * إلى الكورس نفسه، وتظهر للطالب في بوّابة الدفع كخطط عادية.
 *
 * أوّل خيار يبقى مرآةً لحقل `price` القديم، فالتحليلات والشاشات التي
 * تقرأ سعراً واحداً تظلّ تعمل بلا تعديل.
 */

import { Plus, Trash2, Star, Percent } from "lucide-react";
import { COURSE_PRICE_KINDS, planPrice } from "@/lib/business/plans";
import type { CoursePrice, CoursePriceKind, Subject } from "@/lib/utils/types";

/**
 * محرّرُ الكورس — غلافٌ رقيق.
 * يُبقي قاعدةَ «السعر الأساسي يتبع أوّل خيار»: مصدرٌ واحدٌ لا رقمان
 * يفترقان. والمحرّرُ نفسُه عامٌّ يُستعمل للمادّة أيضاً (`PricesEditor`) —
 * فلا تُنسخ مئةُ سطرٍ من الواجهة لتفعل الشيءَ نفسَه بحقلٍ آخر.
 */
export function CoursePricesEditor({
  subject,
  onChange,
}: {
  subject: Subject;
  onChange: (patch: Partial<Subject>) => void;
}) {
  return (
    <PricesEditor
      value={subject.prices ?? []}
      fallbackPrice={subject.price ?? 0}
      onChange={(next) => onChange({ prices: next, price: next[0]?.price ?? subject.price ?? 0 })}
    />
  );
}

export function PricesEditor({
  value,
  onChange,
  fallbackPrice = 0,
}: {
  value: CoursePrice[];
  onChange: (next: CoursePrice[]) => void;
  /** سعرٌ يُقترح لأوّل خيارٍ يُضاف — سعرُ الكورس الأساسيّ حين يوجد. */
  fallbackPrice?: number;
}) {
  const list = value;
  const commit = onChange;

  const add = () =>
    commit([
      ...list,
      {
        id: `CP-${Date.now().toString(36)}`,
        label: list.length === 0 ? "شهري" : "خيار جديد",
        kind: list.length === 0 ? "month" : "term",
        price: list.length === 0 ? fallbackPrice : 0,
      },
    ]);

  const patch = (id: string, p: Partial<CoursePrice>) =>
    commit(list.map((x) => (x.id === id ? { ...x, ...p } : x)));

  const remove = (id: string) => commit(list.filter((x) => x.id !== id));

  const move = (id: string, dir: -1 | 1) => {
    const i = list.findIndex((x) => x.id === id);
    const j = i + dir;
    if (i < 0 || j < 0 || j >= list.length) return;
    const next = [...list];
    [next[i], next[j]] = [next[j], next[i]];
    commit(next);
  };

  return (
    <div className="grid gap-4">
      {list.length === 0 && (
        <div className="rounded-2xl border border-dashed border-border p-5 text-center">
          <p className="text-sm font-bold">لا خيارات أسعار بعد</p>
          <p className="mt-1 text-xs text-muted-foreground">
            {fallbackPrice > 0
              ? `يُباع الآن بسعرٍ واحد (${fallbackPrice.toLocaleString("ar-EG")} ج.م). أضف خيارات ليختار الطالب بين الشهري والترم والحصّة.`
              : "لا يُباع وحدَه بعد — أضف خيار سعرٍ ليظهر للطالب زرُّ شرائه."}
          </p>
        </div>
      )}

      {list.map((p, i) => {
        const priced = planPrice({ price: p.price, discount: p.discount } as never);
        return (
          <div key={p.id} className="grid gap-3 rounded-2xl border border-border p-4">
            <div className="grid gap-3 sm:grid-cols-4">
              <label>
                <span className="mb-1 block text-xs font-semibold text-muted-foreground">اسم الخيار</span>
                <input
                  value={p.label}
                  onChange={(e) => patch(p.id, { label: e.target.value })}
                  placeholder="شهري"
                  className="w-full rounded-2xl border border-border bg-card/60 px-3 py-2 text-sm outline-none focus:border-primary/50"
                />
              </label>

              <label>
                <span className="mb-1 block text-xs font-semibold text-muted-foreground">النوع</span>
                <select
                  value={p.kind}
                  onChange={(e) => patch(p.id, { kind: e.target.value as CoursePriceKind })}
                  className="w-full rounded-2xl border border-border bg-card/60 px-3 py-2 text-sm outline-none focus:border-primary/50"
                >
                  {COURSE_PRICE_KINDS.map((k) => (
                    <option key={k.id} value={k.id}>{k.label}</option>
                  ))}
                </select>
                <span className={`mt-1 block text-[10px] ${
                  p.kind === "once" ? "font-bold text-emerald-600" : "text-muted-foreground"
                }`}>
                  {COURSE_PRICE_KINDS.find((k) => k.id === p.kind)?.hint}
                </span>
              </label>

              <label>
                <span className="mb-1 block text-xs font-semibold text-muted-foreground">السعر (ج.م)</span>
                <input
                  type="number"
                  value={p.price}
                  onChange={(e) => patch(p.id, { price: Number(e.target.value) || 0 })}
                  className="w-full rounded-2xl border border-border bg-card/60 px-3 py-2 text-sm outline-none focus:border-primary/50"
                />
              </label>

              {p.kind === "custom" ? (
                <label>
                  <span className="mb-1 block text-xs font-semibold text-muted-foreground">المدّة (أيام)</span>
                  <input
                    type="number"
                    value={p.durationDays ?? 0}
                    onChange={(e) => patch(p.id, { durationDays: Number(e.target.value) || 0 })}
                    className="w-full rounded-2xl border border-border bg-card/60 px-3 py-2 text-sm outline-none focus:border-primary/50"
                  />
                </label>
              ) : (
                <label>
                  <span className="mb-1 block text-xs font-semibold text-muted-foreground">شارة (اختياري)</span>
                  <input
                    value={p.badge ?? ""}
                    onChange={(e) => patch(p.id, { badge: e.target.value })}
                    placeholder="الأوفر"
                    className="w-full rounded-2xl border border-border bg-card/60 px-3 py-2 text-sm outline-none focus:border-primary/50"
                  />
                </label>
              )}
            </div>

            <label>
              <span className="mb-1 block text-xs font-semibold text-muted-foreground">وصف مختصر (اختياري)</span>
              <input
                value={p.desc ?? ""}
                onChange={(e) => patch(p.id, { desc: e.target.value })}
                placeholder="يفتح كل دروس الكورس لمدّة شهر"
                className="w-full rounded-2xl border border-border bg-card/60 px-3 py-2 text-sm outline-none focus:border-primary/50"
              />
            </label>

            {/* خصم على هذا الخيار */}
            <div className="flex flex-wrap items-center gap-2">
              <button
                type="button"
                onClick={() =>
                  patch(p.id, {
                    discount: p.discount?.active
                      ? undefined
                      : { active: true, type: "percent", value: 10 },
                  })
                }
                className={`inline-flex items-center gap-1.5 rounded-full border px-3 py-1.5 text-[11px] font-bold transition ${
                  p.discount?.active ? "border-primary bg-primary/10 text-primary" : "border-border hover:border-primary/40"
                }`}
              >
                <Percent className="size-3.5" /> خصم
              </button>

              {p.discount?.active && (
                <>
                  <select
                    value={p.discount.type}
                    onChange={(e) => patch(p.id, { discount: { ...p.discount!, type: e.target.value as "percent" | "amount" } })}
                    className="rounded-xl border border-border bg-card/60 px-2.5 py-1.5 text-[11px] font-bold outline-none"
                  >
                    <option value="percent">نسبة ٪</option>
                    <option value="amount">مبلغ ج.م</option>
                  </select>
                  <input
                    type="number"
                    value={p.discount.value}
                    onChange={(e) => patch(p.id, { discount: { ...p.discount!, value: Number(e.target.value) || 0 } })}
                    className="w-20 rounded-xl border border-border bg-card/60 px-2.5 py-1.5 text-[11px] outline-none"
                  />
                  <input
                    value={p.discount.label ?? ""}
                    onChange={(e) => patch(p.id, { discount: { ...p.discount!, label: e.target.value } })}
                    placeholder="عرض بداية الترم"
                    className="w-44 rounded-xl border border-border bg-card/60 px-2.5 py-1.5 text-[11px] outline-none"
                  />
                  <span className="text-[11px] font-bold text-emerald-600">
                    يصير {priced.price.toLocaleString("ar-EG")} ج.م
                  </span>
                </>
              )}

              <button
                type="button"
                onClick={() => patch(p.id, { highlight: !p.highlight })}
                className={`inline-flex items-center gap-1.5 rounded-full border px-3 py-1.5 text-[11px] font-bold transition ${
                  p.highlight ? "border-accent bg-accent/10 text-accent" : "border-border hover:border-accent/40"
                }`}
              >
                <Star className="size-3.5" /> مميّز
              </button>

              <div className="mr-auto flex items-center gap-1.5">
                <button type="button" onClick={() => move(p.id, -1)} disabled={i === 0}
                  className="rounded-xl border border-border px-2.5 py-1.5 text-[11px] font-bold disabled:opacity-40">▲</button>
                <button type="button" onClick={() => move(p.id, 1)} disabled={i === list.length - 1}
                  className="rounded-xl border border-border px-2.5 py-1.5 text-[11px] font-bold disabled:opacity-40">▼</button>
                <button type="button" onClick={() => remove(p.id)}
                  className="rounded-xl border border-border px-2.5 py-1.5 text-muted-foreground transition hover:border-rose-500/50 hover:text-rose-500">
                  <Trash2 className="size-3.5" />
                </button>
              </div>
            </div>
          </div>
        );
      })}

      <button
        type="button"
        onClick={add}
        className="inline-flex w-fit items-center gap-1.5 rounded-2xl bg-primary px-4 py-2 text-xs font-bold text-white"
      >
        <Plus className="size-4" /> خيار سعر جديد
      </button>
    </div>
  );
}
