"use client";

/**
 * محرّرُ الصلاحيات المختارة — شجرةُ المنهج بمربّعات اختيار.
 * ------------------------------------------------------------------
 * الخطّةُ «المختارة» تفتح ما يُؤشَّر عليه بعينه. والتأشيرُ يقع على مستويين:
 * كورسٌ كامل، أو مادّةٌ داخلَه.
 *
 * **وثلاثُ قواعدَ تجعلها تُقرأ بلا شرح:**
 *
 * ١ ــ **الكورسُ يبتلع موادَّه.** من أشّر على الكورس فقد أشّر على كلّ ما
 *      فيه — فتُعطَّل مربّعاتُ موادِّه وتُعرض مؤشَّرةً، ولا يُخزَّن مفتاحُ
 *      مادّةٍ مع مفتاح كورسها. وإلّا حُفظت مفاتيحُ زائدةٌ إن حُذف الكورسُ
 *      من الاختيار بقيت موادُّه مفتوحة.
 *
 * ٢ ــ **الحالةُ الوسطى تُرى.** كورسٌ أُشّر على بعض موادِّه ليس مؤشَّراً
 *      ولا خالياً — فمربّعُه `indeterminate`، وهي حالةٌ لا تُضبط في HTML
 *      إلّا من الشيفرة، فتُضبط عبر `ref`.
 *
 * ٣ ــ **الكورسُ المطويّ يقول ما فيه.** العدُّ في العنوان يُغني عن الفتح:
 *      من رأى «٣ من ٧» عرف موضعَه بلا أن يفتح.
 *
 * **والبحثُ يُصفّي الشجرةَ لا يُسطّحها**: يبقى الكورسُ عنواناً لموادِّه
 * المطابقة، فلا تُنتزع المادّةُ من سياقها فيلتبس أيُّ كورسٍ هي منه.
 */

import { useMemo, useRef, useState, useEffect } from "react";
import { ChevronDown, Search, BookOpen, Layers, X } from "lucide-react";
import { courseUnits } from "@/lib/business/course-units";
import { pickKey, isUnitKey, parsePick } from "@/lib/business/picks";
import type { Subject } from "@/lib/utils/types";

function Box({
  checked, mixed, disabled, onChange,
}: {
  checked: boolean;
  mixed?: boolean;
  disabled?: boolean;
  onChange: () => void;
}) {
  const ref = useRef<HTMLInputElement>(null);
  /* `indeterminate` خاصيّةُ عنصرٍ لا سمةٌ في HTML — لا تُضبط إلّا هكذا */
  useEffect(() => {
    if (ref.current) ref.current.indeterminate = Boolean(mixed) && !checked;
  }, [mixed, checked]);

  return (
    <input
      ref={ref}
      type="checkbox"
      checked={checked}
      disabled={disabled}
      onChange={onChange}
      className="size-4 shrink-0 accent-[hsl(var(--primary))] disabled:opacity-60"
    />
  );
}

export function PicksEditor({
  subjects,
  value,
  onChange,
}: {
  subjects: Subject[];
  value: string[];
  onChange: (next: string[]) => void;
}) {
  const [q, setQ] = useState("");
  const [open, setOpen] = useState<Set<string>>(new Set());

  const picks = useMemo(() => new Set(value), [value]);

  const shown = useMemo(() => {
    const k = q.trim();
    if (!k) return subjects.map((s) => ({ s, units: courseUnits(s) }));
    return subjects
      .map((s) => {
        const units = courseUnits(s);
        if (s.name.includes(k)) return { s, units };
        const hit = units.filter((u) => u.title.includes(k));
        return hit.length ? { s, units: hit } : null;
      })
      .filter(Boolean) as { s: Subject; units: ReturnType<typeof courseUnits> }[];
  }, [subjects, q]);

  const toggleCourse = (s: Subject) => {
    const next = new Set(picks);
    if (next.has(s.id)) {
      next.delete(s.id);
    } else {
      next.add(s.id);
      /* مفاتيحُ موادِّه تُطرح: الكورسُ يفتحها كلَّها، ومفتاحٌ زائدٌ يبقى
         مفتوحاً لو رُفع الكورسُ لاحقاً. */
      for (const u of courseUnits(s)) next.delete(pickKey(s.id, u.id));
    }
    onChange([...next]);
  };

  const toggleUnit = (s: Subject, unitId: string) => {
    const next = new Set(picks);
    const key = pickKey(s.id, unitId);
    if (next.has(key)) next.delete(key);
    else next.add(key);
    onChange([...next]);
  };

  const clear = () => onChange([]);

  const courses = value.filter((k) => !isUnitKey(k)).length;
  const units = value.filter(isUnitKey).length;

  return (
    <div className="rounded-2xl border border-border">
      <div className="flex flex-wrap items-center gap-2 border-b border-border p-3">
        <span className="font-kufi text-xs font-bold">ما تفتحه هذه الخطّة</span>
        <span className="rounded-full bg-primary/12 px-2.5 py-0.5 text-[10px] font-bold text-primary">
          {courses > 0 && `${courses.toLocaleString("ar-EG")} كورساً كاملاً`}
          {courses > 0 && units > 0 && " · "}
          {units > 0 && `${units.toLocaleString("ar-EG")} مادّة`}
          {courses === 0 && units === 0 && "لم يُختَر شيء"}
        </span>
        {value.length > 0 && (
          <button type="button" onClick={clear}
            className="ms-auto inline-flex items-center gap-1 rounded-full border border-border px-2.5 py-1 text-[10px] font-bold text-muted-foreground transition hover:border-rose-500 hover:text-rose-500">
            <X className="size-3" /> مسح الاختيار
          </button>
        )}
      </div>

      <div className="relative border-b border-border">
        <Search className="pointer-events-none absolute end-3 top-1/2 size-3.5 -translate-y-1/2 text-muted-foreground" />
        <input
          value={q}
          onChange={(e) => setQ(e.target.value)}
          placeholder="ابحث عن كورس أو مادّة…"
          className="w-full bg-transparent py-2.5 pe-9 ps-3 text-xs outline-none"
        />
      </div>

      <div className="max-h-80 overflow-y-auto p-2">
        {shown.length === 0 ? (
          <p className="p-6 text-center text-xs text-muted-foreground">
            {subjects.length === 0 ? "لا كورسات بعد — أضِف كورساً أوّلاً." : "لا نتيجة."}
          </p>
        ) : (
          shown.map(({ s, units: us }) => {
            const all = picks.has(s.id);
            const someKeys = us.filter((u) => picks.has(pickKey(s.id, u.id)));
            const isOpen = open.has(s.id) || Boolean(q.trim());

            return (
              <div key={s.id} className="mb-1 rounded-xl border border-border/70">
                <div className="flex items-center gap-2 p-2.5">
                  <Box checked={all} mixed={someKeys.length > 0} onChange={() => toggleCourse(s)} />
                  <BookOpen className="size-3.5 shrink-0 text-primary" />
                  <button
                    type="button"
                    onClick={() =>
                      setOpen((prev) => {
                        const n = new Set(prev);
                        if (n.has(s.id)) n.delete(s.id); else n.add(s.id);
                        return n;
                      })
                    }
                    className="flex min-w-0 flex-1 items-center gap-2 text-right"
                  >
                    <span className="min-w-0 flex-1 truncate text-xs font-bold">{s.name}</span>
                    <span className="shrink-0 text-[10px] text-muted-foreground">
                      {all
                        ? "الكورس كلُّه"
                        : `${someKeys.length.toLocaleString("ar-EG")} من ${us.length.toLocaleString("ar-EG")}`}
                    </span>
                    <ChevronDown className={`size-3.5 shrink-0 text-muted-foreground transition ${isOpen ? "rotate-180" : ""}`} />
                  </button>
                </div>

                {isOpen && (
                  <div className="border-t border-border/70 p-2 ps-7">
                    {us.map((u) => (
                      <label key={u.id} className={`flex items-center gap-2 rounded-lg p-1.5 text-xs ${all ? "opacity-60" : "hover:bg-muted/60"}`}>
                        <Box
                          checked={all || picks.has(pickKey(s.id, u.id))}
                          disabled={all}
                          onChange={() => toggleUnit(s, u.id)}
                        />
                        <Layers className="size-3 shrink-0 text-muted-foreground" />
                        <span className="min-w-0 flex-1 truncate">{u.title}</span>
                        <span className="shrink-0 text-[10px] text-muted-foreground">
                          {(u.lessons ?? []).length.toLocaleString("ar-EG")} درساً
                        </span>
                      </label>
                    ))}
                  </div>
                )}
              </div>
            );
          })
        )}
      </div>

      {/*
        تحذيرُ المفاتيح اليتيمة.
        كورسٌ أو مادّةٌ حُذفت وبقي مفتاحُها في الخطّة: الخطّةُ تُباع وتفتح
        لا شيء. ولا يظهر ذلك في الشجرة لأنّ ما حُذف لا يُعرض فيها.
      */}
      {(() => {
        const dead = value.filter((k) => {
          const { subjectId, unitId } = parsePick(k);
          const s = subjects.find((x) => x.id === subjectId);
          if (!s) return true;
          return Boolean(unitId) && !courseUnits(s).some((u) => u.id === unitId);
        });
        if (dead.length === 0) return null;
        return (
          <div className="flex items-center gap-2 border-t border-border bg-rose-500/10 p-2.5 text-[10px] font-bold text-rose-600 dark:text-rose-400">
            <span className="min-w-0 flex-1">
              {dead.length.toLocaleString("ar-EG")} مفتاحاً يُشير إلى كورسٍ أو مادّةٍ محذوفة — تفتح لا شيء.
            </span>
            <button
              type="button"
              onClick={() => onChange(value.filter((k) => !dead.includes(k)))}
              className="shrink-0 rounded-full border border-rose-500/50 px-2 py-0.5 transition hover:bg-rose-500/15"
            >
              احذفها
            </button>
          </div>
        );
      })()}
    </div>
  );
}
