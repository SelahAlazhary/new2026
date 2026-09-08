"use client";

/**
 * منتقي مكتبة الحركة.
 * ------------------------------------------------------------------
 * مئةُ صورةٍ متحرّكة من مجال التعليم، تُعرض كما ستظهر تماماً — لأنّ ما
 * يُعرض هنا هو الصورةُ نفسُها لا رسمٌ يمثّلها: `<img>` بالرابط ذاته الذي
 * سيُحفظ.
 *
 * والبحثُ بالاسم العربي وبالمعرّف معاً، فمن كتب «ذرّة» أو «atom» وجدها.
 */

import { useMemo, useState } from "react";
import { X, Search } from "lucide-react";
import { MOTION_ART, MOTION_LIBS, motionArtUrl, type MotionLibId } from "@/lib/art/motion-art";

export function MotionArtPicker({
  onPick,
  onClose,
}: {
  /** يُستدعى برابط الصورة جاهزاً للحفظ. */
  onPick: (url: string) => void;
  onClose: () => void;
}) {
  const [q, setQ] = useState("");
  /* «الكل» ليس مكتبةً بل غيابُ التصفية — فيبقى البحثُ عامّاً لمن لا يعرف أين يجد. */
  const [lib, setLib] = useState<MotionLibId | "all">("all");

  const list = useMemo(() => {
    const s = q.trim().toLowerCase();
    const base = lib === "all" ? MOTION_ART : MOTION_ART.filter((x) => x.lib === lib);
    if (!s) return base;
    return base.filter((x) => x.name.includes(s) || x.id.toLowerCase().includes(s));
  }, [q, lib]);

  return (
    <div className="fixed inset-0 z-[120] grid place-items-center bg-black/50 p-4 backdrop-blur-sm">
      <div className="flex max-h-[86vh] w-full max-w-3xl flex-col overflow-hidden rounded-3xl border border-border bg-card shadow-bento">
        <div className="flex items-center gap-3 border-b border-border p-4">
          <div className="relative flex-1">
            <Search className="pointer-events-none absolute right-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
            <input
              autoFocus
              value={q}
              onChange={(e) => setQ(e.target.value)}
              placeholder="ابحث… كتاب · ذرّة · نجمة"
              className="w-full rounded-2xl border border-border bg-background py-2.5 pe-4 ps-10 text-sm outline-none focus:border-primary/60"
            />
          </div>
          <button
            type="button"
            onClick={onClose}
            className="grid size-10 shrink-0 place-items-center rounded-2xl border border-border text-muted-foreground transition hover:border-primary/40 hover:text-primary"
          >
            <X className="size-4" />
          </button>
        </div>

        {/* المكاتب — تصفيةٌ لا بحث */}
        <div className="flex flex-wrap gap-1.5 border-b border-border px-4 py-3">
          {([{ id: "all" as const, name: "الكل" }, ...MOTION_LIBS]).map((L) => {
            const on = lib === L.id;
            const n = L.id === "all" ? MOTION_ART.length : MOTION_ART.filter((x) => x.lib === L.id).length;
            return (
              <button
                key={L.id}
                type="button"
                onClick={() => setLib(L.id as MotionLibId | "all")}
                className={`rounded-full border px-3 py-1.5 text-[11px] font-bold transition ${
                  on ? "border-primary bg-primary/10 text-primary" : "border-border text-muted-foreground hover:border-primary/40"
                }`}
              >
                {L.name} <span className="opacity-60">{n.toLocaleString("ar-EG")}</span>
              </button>
            );
          })}
        </div>

        <div className="min-h-0 flex-1 overflow-y-auto p-4">
          <p className="mb-3 text-[11px] leading-relaxed text-muted-foreground">
            خمسُ مكاتبَ كاملة من العلوم والفلك والرياضيات والمدرسة والدراسة — صورٌ متحرّكة
            خفيفةٌ شفّافةُ الخلفية، تُحفظ داخل المنصّة نفسِها فلا تعتمد على خادمٍ خارجي ولا
            يموت رابطُها. {list.length.toLocaleString("ar-EG")} من{" "}
            {MOTION_ART.length.toLocaleString("ar-EG")}.
          </p>

          <div className="grid grid-cols-3 gap-2.5 sm:grid-cols-5 md:grid-cols-6">
            {list.map((x) => (
              <button
                key={x.id}
                type="button"
                title={x.name}
                onClick={() => {
                  onPick(motionArtUrl(x));
                  onClose();
                }}
                className="group grid place-items-center gap-1.5 rounded-2xl border border-border p-2.5 transition hover:border-primary hover:bg-primary/5"
              >
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={motionArtUrl(x)} alt={x.name} width={44} height={44} className="size-11" />
                <span className="line-clamp-1 text-[10px] font-semibold text-muted-foreground group-hover:text-primary">
                  {x.name}
                </span>
              </button>
            ))}
          </div>

          {list.length === 0 && (
            <p className="py-10 text-center text-sm text-muted-foreground">لا نتيجة لهذا البحث.</p>
          )}
        </div>
      </div>
    </div>
  );
}
