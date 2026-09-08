/**
 * حركاتُ الأيقونات.
 * ------------------------------------------------------------------
 * أربعون حركةً تُختار واحدةً منها فتسري على أيقونات المنصّة كلِّها.
 *
 * **ولماذا واحدةٌ لا أربعون معاً؟** لأنّ الحركةَ لغةٌ لا زينة: صفحةٌ كلُّ
 * أيقونةٍ فيها تتحرّك حركةً مختلفة لا تقول شيئاً — تقول ضجيجاً. فالوحدةُ
 * هنا هي التصميم.
 *
 * وحركاتُ «عند المرور» لا تدور بلا سبب: تنتظر اليدَ فتردّ عليها. وهي
 * الأنسب للوحة، والدائمةُ أنسبُ للواجهة.
 */

export type IconMotionTrigger = "always" | "hover";

export type IconMotion = {
  id: string;
  name: string;
  trigger: IconMotionTrigger;
};

function m(id: string, name: string, trigger: IconMotionTrigger): IconMotion {
  return { id, name, trigger };
}

export const ICON_MOTIONS: IconMotion[] = [
  m("spin", "الدوران", "always"),
  m("spinSlow", "الدوران البطيء", "always"),
  m("pulse", "النبض", "always"),
  m("heartbeat", "دقّةُ القلب", "always"),
  m("breathe", "التنفّس", "always"),
  m("bob", "التمايل لأعلى", "always"),
  m("float", "الطفو", "always"),
  m("sway", "الميلان", "always"),
  m("swing", "التأرجح", "always"),
  m("pendulum", "البندول", "always"),
  m("rock", "الترنّح", "always"),
  m("wobble", "الاهتزاز", "always"),
  m("jelly", "الهلام", "always"),
  m("blink", "الوميض", "always"),
  m("fade", "الخفوت", "always"),
  m("glowSoft", "الوهج الخافت", "always"),
  m("shimmer", "اللمعان", "always"),
  m("flash", "الوهجة", "always"),
  m("drift", "الانسياب", "always"),
  m("orbit", "المدار", "always"),
  m("radar", "الرادار", "always"),
  m("ripple", "التموّج", "always"),
  m("tilt", "الميل الثابت", "always"),
  m("twist", "اللَّيّ", "always"),
  m("flip", "الانقلاب", "always"),
  m("roll", "التدحرج", "always"),
  m("hop", "القفز", "always"),
  m("bounce", "الارتداد", "always"),
  m("drop", "السقوط", "always"),
  m("nudge", "الدفعة", "always"),
  m("shake", "الرجفة", "always"),
  m("spring", "النابض", "always"),
  m("draw", "الرسم", "always"),
  m("dash", "الخطّ الزاحف", "always"),
  m("popHover", "القفزة عند المرور", "hover"),
  m("turnHover", "الدورة عند المرور", "hover"),
  m("tiltHover", "الميل عند المرور", "hover"),
  m("jumpHover", "الوثبة عند المرور", "hover"),
  m("shakeHover", "الرجفة عند المرور", "hover"),
  m("none", "بلا حركة", "always"),
];

/** الأصلُ: بلا حركة — الحركةُ تُطلب ولا تُفرض. */
export const DEFAULT_ICON_MOTION = "none";

export function findIconMotion(id?: string): IconMotion {
  return ICON_MOTIONS.find((x) => x.id === id) ?? ICON_MOTIONS[ICON_MOTIONS.length - 1];
}

export function iconMotionClass(x: IconMotion): string {
  return x.id === "none" ? "" : `ivm-${x.id}`;
}
