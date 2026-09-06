"use client";

import type { BrandColors, BrandPreset } from "@/lib/hub/presets";

/**
 * معاينةٌ حيّةٌ لهويّة المنصّة داخل رحلة الإنشاء.
 * ------------------------------------------------------------------
 * لا تُشغّل المنصّةَ كاملةً في إطار — ذلك ثقيلٌ ويحتاج قاعدةً مجهّزة قبل
 * أوانها. بل ترسم **نموذجاً مصغّراً** لثلاث شاشات (هبوط · بطاقة كورس ·
 * لوحة) بالألوان المختارة، فيرى المدرّسُ أثرَ اختياره فوراً بلا انتظار.
 *
 * الألوانُ تُحقن متغيّراتٍ على الحاوية، فكلُّ تغييرٍ في المنتقي ينعكس في
 * اللحظة بلا إعادة رسمٍ للشجرة.
 */
export function PresetPreview({ preset, colors }: { preset: BrandPreset; colors: BrandColors }) {
  const dark = preset.dark;
  const vars = {
    "--pv-primary": colors.primary,
    "--pv-gold": colors.gold,
    "--pv-paper": colors.paper,
    "--pv-ink": dark ? "#f4f4f6" : "#1a2036",
    "--pv-dim": dark ? "#a7abbb" : "#6b6f7c",
    "--pv-card": dark ? "#ffffff14" : "#ffffff",
    "--pv-line": dark ? "#ffffff22" : "#00000012",
  } as React.CSSProperties;

  return (
    <div className="pv" style={vars} data-dark={dark ? "1" : undefined}>
      {/* شاشةُ الهبوط */}
      <div className="pv-screen pv-landing">
        <div className="pv-bar">
          <span className="pv-logo" />
          <span className="pv-navdots"><i /><i /><i /></span>
        </div>
        <div className="pv-hero">
          <span className="pv-eyebrow" />
          <span className="pv-h1" />
          <span className="pv-h1 short" />
          <span className="pv-btn">ابدأ الآن</span>
        </div>
      </div>

      {/* بطاقةُ كورس */}
      <div className="pv-screen pv-course">
        <div className="pv-cover" />
        <span className="pv-line-1" />
        <span className="pv-line-2" />
        <span className="pv-price">١٥٠ ج.م</span>
      </div>

      {/* لوحةُ الطالب */}
      <div className="pv-screen pv-panel">
        <div className="pv-panel-head" />
        <div className="pv-panel-row"><span /><b /></div>
        <div className="pv-panel-row"><span /><b /></div>
        <span className="pv-chip">تابع الدرس</span>
      </div>
    </div>
  );
}
