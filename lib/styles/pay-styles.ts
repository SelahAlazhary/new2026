/**
 * تصاميم بوّابة الدفع.
 * ------------------------------------------------------------------
 * البوّابة شاشةُ قرارٍ يدفع عندها الطالب ماله، فشكلها يستحقّ تحكّماً
 * مستقلّاً كبقية الأقسام. أربعة محاور تُركَّب فتُنتج عشرين هيئة فريدة:
 *
 *   سطح البطاقة · ترتيب طرق الدفع · شكل مؤشّر الخطوات · بروز البيانات.
 *
 * كلّها بيانات → أصناف على الغلاف، والأنماط معرَّفة مرّة واحدة في
 * globals.css — فلا يتضخّم الـCSS بعشرين نسخة متشابهة.
 */

/** سطح بطاقات البوّابة. */
export type PaySurface =
  | "solid"     // مصمتة بحدّ (الافتراضي)
  | "glass"     // زجاجية مضبّبة
  | "outline"   // حدّ فقط
  | "soft"      // بلا حدّ، ظلّ ناعم
  | "plaque";   // أركان مقصوصة كلوح المخطوط

/** ترتيب طرق الدفع. */
export type PayList =
  | "rows"      // صفّ لكل طريقة (الافتراضي)
  | "grid"      // شبكة بطاقات
  | "tabs"      // ألسنة أفقية
  | "compact";  // صفوف مضغوطة بأيقونة صغيرة

/** شكل مؤشّر خطوات الدفع. */
export type PaySteps =
  | "dots"      // نقاط
  | "bar"       // شريط تقدّم
  | "numbers"   // أرقام في دوائر
  | "none";     // بلا مؤشّر

/** بروز بيانات التحويل (الرقم الذي يُحوَّل إليه). */
export type PayDetails =
  | "card"      // داخل بطاقة ملوّنة
  | "mono"      // رقم كبير بخطّ ثابت
  | "ticket"    // كتذكرة بحزّين
  | "plain";    // نصّ عادي

export type PayStyle = {
  id: string;
  name: string;
  hint: string;
  surface: PaySurface;
  list: PayList;
  steps: PaySteps;
  details: PayDetails;
};

function p(
  id: string, name: string, hint: string,
  surface: PaySurface, list: PayList, steps: PaySteps, details: PayDetails
): PayStyle {
  return { id, name, hint, surface, list, steps, details };
}

export const PAY_STYLES: PayStyle[] = [
  p("classic", "الكلاسيكي", "صفوف مصمتة ونقاط للخطوات", "solid", "rows", "dots", "card"),
  p("classicBar", "الكلاسيكي بشريط", "شريط تقدّم بدل النقاط", "solid", "rows", "bar", "card"),
  p("classicMono", "الكلاسيكي الثابت", "الرقم بخطّ ثابت كبير", "solid", "rows", "numbers", "mono"),
  p("gridSolid", "الشبكة", "طرق الدفع بطاقات في شبكة", "solid", "grid", "dots", "card"),
  p("gridGlass", "الشبكة الزجاجية", "شبكة ببطاقات زجاجية", "glass", "grid", "bar", "card"),
  p("glassRows", "الزجاجي", "صفوف زجاجية مضبّبة", "glass", "rows", "dots", "card"),
  p("glassMono", "الزجاجي الثابت", "زجاج ورقم بخطّ ثابت", "glass", "rows", "numbers", "mono"),
  p("glassTicket", "الزجاجي بتذكرة", "بيانات التحويل كتذكرة", "glass", "compact", "bar", "ticket"),
  p("outlineRows", "المفرَّغ", "حدّ فقط بلا تعبئة", "outline", "rows", "dots", "plain"),
  p("outlineTabs", "المفرَّغ بألسنة", "طرق الدفع ألسنة أفقية", "outline", "tabs", "numbers", "card"),
  p("outlineTicket", "المفرَّغ بتذكرة", "حدّ وبيانات كتذكرة", "outline", "rows", "bar", "ticket"),
  p("softRows", "الناعم", "بلا حدود وظلّ خفيف", "soft", "rows", "dots", "card"),
  p("softGrid", "الناعم الشبكي", "شبكة ناعمة بلا حدود", "soft", "grid", "numbers", "mono"),
  p("softTabs", "الناعم بألسنة", "ألسنة ناعمة وشريط تقدّم", "soft", "tabs", "bar", "card"),
  p("softBare", "الناعم المجرّد", "بلا مؤشّر خطوات إطلاقاً", "soft", "compact", "none", "plain"),
  p("plaqueRows", "اللوح", "أركان مقصوصة كلوح المخطوط", "plaque", "rows", "numbers", "card"),
  p("plaqueTicket", "اللوح بتذكرة", "لوح وبيانات كتذكرة", "plaque", "rows", "bar", "ticket"),
  p("plaqueGrid", "اللوح الشبكي", "ألواح في شبكة", "plaque", "grid", "dots", "mono"),
  p("compactMono", "المضغوط", "صفوف مضغوطة ورقم ثابت", "solid", "compact", "numbers", "mono"),
  p("tabsTicket", "الألسنة", "ألسنة وبيانات كتذكرة بلا مؤشّر", "solid", "tabs", "none", "ticket"),
];

export const DEFAULT_PAY_STYLE = PAY_STYLES[0].id;

export function findPayStyle(id?: string): PayStyle {
  return PAY_STYLES.find((x) => x.id === id) ?? PAY_STYLES[0];
}

export function payClass(x: PayStyle): string {
  return `pg-surface-${x.surface} pg-list-${x.list} pg-steps-${x.steps} pg-details-${x.details}`;
}

/** ألوان البوّابة — كلّها اختيارية، والفارغ يرث لون الثيم. */
export function payColorVars(c: { bg?: string; accent?: string; text?: string } | undefined): React.CSSProperties {
  const v: Record<string, string> = {};
  if (c?.bg) v["--pg-bg"] = c.bg;
  if (c?.accent) v["--pg-accent"] = c.accent;
  if (c?.text) v["--pg-text"] = c.text;
  return v as React.CSSProperties;
}

/** أنواع طرق الدفع بأسمائها العربية — تُعرض في اللوحة وتُستخدم في التسميات. */
export const PAY_KINDS: { id: string; label: string; hint: string }[] = [
  { id: "wallet", label: "محفظة هاتف", hint: "فودافون كاش · اتصالات كاش · أورنج · وي" },
  { id: "bank", label: "حساب بنكي", hint: "رقم حساب أو IBAN" },
  { id: "instapay", label: "إنستاباي", hint: "عنوان إنستاباي أو رابطه" },
  { id: "fawry", label: "فوري", hint: "كود فوري أو رقم الدفع" },
  { id: "link", label: "رابط دفع", hint: "بوّابة خارجية يفتحها الطالب" },
  { id: "other", label: "أخرى", hint: "أي وسيلة تحويل غير ما سبق" },
];
