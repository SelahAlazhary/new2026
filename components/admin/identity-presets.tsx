"use client";

import { useState } from "react";
import { Check, Loader2 } from "lucide-react";
import { BRAND_PRESETS, presetById, type BrandColors } from "@/lib/hub/presets";
import { PresetPreview } from "@/components/hub/preset-preview";
import { useContent } from "@/components/content/content-provider";

/**
 * تبويبُ «الهوية» — تغييرُ هويّة المنصّة كلِّها بضغطة.
 * ------------------------------------------------------------------
 * الحزمةُ نفسُها المستعملة في رحلة الإنشاء (`lib/hub/presets.ts`): تطبيقُها
 * يكتب كلَّ مفاتيح المظهر + الألوان الثلاثة دفعةً واحدة، فيتبدّل شكلُ
 * المنصّة كلِّه. والمفاتيحُ التفصيليّةُ تبقى في بقيّة التبويبات لمن يريد
 * ضبطاً أدقّ بعد ذلك.
 */
export function IdentityPresets() {
  const { content, saveContent } = useContent();
  const [busy, setBusy] = useState<string | null>(null);
  const [preview, setPreview] = useState<string>(() => content.brandPresetId ?? "midad");

  const current: BrandColors = {
    primary: content.theme?.customPrimary ?? "#233b8b",
    gold: content.theme?.customGold ?? "#c99a3b",
    paper: content.theme?.customPaper ?? "#fbf9f5",
  };
  const shown = presetById(preview);

  const apply = async (id: string) => {
    const p = presetById(id);
    setBusy(id);
    try {
      await saveContent({
        ...p.content,
        brandPresetId: p.id,
        theme: {
          ...content.theme,
          layout: p.dark ? "dark" : "light",
          preset: "custom",
          customPrimary: p.colors.primary,
          customGold: p.colors.gold,
          customPaper: p.colors.paper,
        },
      });
    } finally {
      setBusy(null);
    }
  };

  const applied = content.brandPresetId;

  return (
    <div>
      <p className="mb-4 text-sm text-muted-foreground">
        اختر هويّةً كاملة لمنصّتك — تصميمٌ وألوانٌ وحركة معاً. تُطبَّق فوراً على الموقع وبوابة الطالب،
        ويمكنك بعدها ضبط أي تفصيل من التبويبات الأخرى.
      </p>

      {/* معاينةٌ حيّة للحزمة المحوَّم عليها */}
      <div className="mb-5 rounded-3xl border border-border bg-card/50 p-4">
        <div className="mb-2 flex items-center justify-between">
          <b className="font-display text-sm">{shown.name}</b>
          <span className="text-[11px] text-muted-foreground">{shown.hint}</span>
        </div>
        <PresetPreview preset={shown} colors={preview === applied ? current : shown.colors} />
      </div>

      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
        {BRAND_PRESETS.map((p) => {
          const isApplied = applied === p.id;
          return (
            <button
              key={p.id}
              type="button"
              onMouseEnter={() => setPreview(p.id)}
              onFocus={() => setPreview(p.id)}
              onClick={() => apply(p.id)}
              disabled={busy !== null}
              className={`relative overflow-hidden rounded-2xl border p-3 text-right transition ${
                isApplied ? "border-primary ring-2 ring-primary/30" : "border-border hover:border-primary/50"
              }`}
            >
              <span
                className="mb-2 block h-12 rounded-xl"
                style={{ background: `linear-gradient(135deg, ${p.colors.primary}, ${p.colors.gold})` }}
              />
              <b className="block text-[12.5px]">{p.name}</b>
              <span className="block text-[10.5px] leading-relaxed text-muted-foreground">{p.hint}</span>
              {isApplied && (
                <span className="absolute left-2 top-2 grid size-6 place-items-center rounded-full bg-primary text-white">
                  <Check className="size-3.5" />
                </span>
              )}
              {busy === p.id && (
                <span className="absolute inset-0 grid place-items-center bg-card/70">
                  <Loader2 className="size-5 animate-spin text-primary" />
                </span>
              )}
            </button>
          );
        })}
      </div>
    </div>
  );
}
