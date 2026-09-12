"use client";

import type { BrandColors, BrandPreset } from "@/lib/hub/presets";

/** شاشةُ الهبوط وحدَها — تُبنى مرّةً، وتُستعمل معاينةً كاملةً أو مصغَّرةً في القائمة. */
function LandingScreen() {
  return (
    <div className="pv-pro-screen pv-pro-landing">
      <div className="pv-pro-topbar">
        <span className="pv-pro-logo-pill" />
        <span className="pv-pro-nav-dots"><i /><i /><i /></span>
      </div>
      <div className="pv-pro-hero-block">
        <span className="pv-pro-badge-line" />
        <span className="pv-pro-h1" />
        <span className="pv-pro-h2" />
        <div className="pv-pro-hero-btns">
          <span className="pv-pro-cta">ابدأ الآن</span>
          <span className="pv-pro-cta-ghost">تعرّف أكثر</span>
        </div>
      </div>
      <div className="pv-pro-features">
        <div className="pv-pro-feat"><span className="pv-pro-feat-icon" /><span className="pv-pro-feat-text" /></div>
        <div className="pv-pro-feat"><span className="pv-pro-feat-icon" /><span className="pv-pro-feat-text" /></div>
        <div className="pv-pro-feat"><span className="pv-pro-feat-icon" /><span className="pv-pro-feat-text" /></div>
      </div>
    </div>
  );
}

function presetVars(preset: BrandPreset, colors: BrandColors): React.CSSProperties {
  const dark = preset.dark;
  return {
    "--pv-primary": colors.primary,
    "--pv-gold": colors.gold,
    "--pv-paper": colors.paper,
    "--pv-ink": dark ? "#f4f4f6" : "#1a2036",
    "--pv-dim": dark ? "#a7abbb" : "#6b6f7c",
    "--pv-card": dark ? "rgba(255,255,255,.06)" : "#ffffff",
    "--pv-line": dark ? "rgba(255,255,255,.08)" : "rgba(0,0,0,.07)",
    "--pv-glow": dark ? `${colors.primary}18` : `${colors.primary}0a`,
  } as React.CSSProperties;
}

export function PresetPreview({ preset, colors }: { preset: BrandPreset; colors: BrandColors }) {
  const dark = preset.dark;
  return (
    <div className="pv-pro" style={presetVars(preset, colors)} data-dark={dark ? "1" : undefined}>
      <div className="pv-pro-header">
        <span className="pv-pro-name">{preset.name}</span>
        <span className="pv-pro-hint">{preset.hint}</span>
      </div>
      <div className="pv-pro-screens">
        <LandingScreen />

        {/* بطاقة كورس */}
        <div className="pv-pro-screen pv-pro-course">
          <div className="pv-pro-cover">
            <span className="pv-pro-cover-play">▶</span>
          </div>
          <div className="pv-pro-course-body">
            <span className="pv-pro-course-tag" />
            <span className="pv-pro-course-title" />
            <span className="pv-pro-course-sub" />
            <div className="pv-pro-course-footer">
              <span className="pv-pro-price">١٥٠ ج.م</span>
              <span className="pv-pro-enroll">اشترك</span>
            </div>
          </div>
        </div>

        {/* لوحة الطالب */}
        <div className="pv-pro-screen pv-pro-dash">
          <div className="pv-pro-dash-head">
            <span className="pv-pro-dash-avatar" />
            <div className="pv-pro-dash-info"><span /><span /></div>
          </div>
          <div className="pv-pro-dash-stats">
            <div className="pv-pro-stat"><b>١٢</b><span>درس</span></div>
            <div className="pv-pro-stat"><b>٨٧٪</b><span>إتمام</span></div>
          </div>
          <div className="pv-pro-dash-rows">
            <div className="pv-pro-dash-row"><span className="pv-pro-dash-dot" /><span className="pv-pro-dash-bar" /></div>
            <div className="pv-pro-dash-row"><span className="pv-pro-dash-dot" /><span className="pv-pro-dash-bar short" /></div>
          </div>
          <span className="pv-pro-dash-cta">تابع الدرس</span>
        </div>
      </div>
    </div>
  );
}

/**
 * معاينةٌ مصغّرة — شاشةُ الهبوط وحدَها بألوان القالب، تحلّ محلّ المربّع
 * اللونيّ المجرّد في قائمة الاختيار. فمن يمرّ بالقوالب يرى شكلَ موقعه
 * فعلاً، لا تدرّجاً لونياً لا يمثّل شيئاً.
 */
export function PresetMiniPreview({ preset, colors }: { preset: BrandPreset; colors: BrandColors }) {
  return (
    <div className="pv-mini" style={presetVars(preset, colors)} data-dark={preset.dark ? "1" : undefined}>
      <LandingScreen />
    </div>
  );
}
