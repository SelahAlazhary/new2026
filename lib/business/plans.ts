import type { SitePlan, CoursePrice, CoursePriceKind, TermNo, Unit, PlanDiscount } from "@/lib/utils/types";
import { pickKey, parsePick } from "@/lib/business/picks";

/**
 * سعر الخطة بعد الخصم — مصدر واحد للحساب يستخدمه الموقع والبوابة واللوحة.
 * الخصم يسري فقط إذا كان مفعّلاً ولم تنتهِ مدّته.
 */
export type PricedPlan = {
  price: number;      // السعر المعروض (بعد الخصم)
  original: number;   // السعر قبل الخصم
  off: number;        // قيمة التوفير
  percent: number;    // نسبة التوفير ٪
  active: boolean;    // هل الخصم ساري؟
  label?: string;
  until?: string | null;
};

/**
 * هل هذه الخطة معروضة لهذا الطالب؟
 * الخطة بلا شعبة معروضة للجميع، وبشعبة تظهر لطلاب تلك الشعبة وحدهم.
 * الزائر (بلا حساب) يرى كل الخطط الظاهرة — لا شعبة تُقارَن بها بعد.
 */
export type PlanAudience = {
  stage?: string; grade?: string; system?: string;
  track?: string; branch?: string; gender?: string;
  /**
   * (توافق قديم) فصلٌ كان يُختار في الفئة.
   * لم يعد يُطابَق به: الفصل خرج من التسجيل، فلا طالبَ يحمل قيمةً له —
   * وشرطٌ لا يستطيع أحدٌ تحقيقه ليس تصفيةً بل حجبٌ صامت. والفصلُ صفةُ
   * الكورس أصلاً، ونطاقُ الخطة يحدّده بـ`scope: "term"`.
   */
  term?: string;
};

/** بيانات الطالب التي تُطابَق بها فئة الخطة — أسماء التسجيل نفسها. */
export type StudentProfile = {
  stage?: string; grade?: string; eduSystem?: string;
  track?: string; branch?: string; termName?: string; gender?: string;
};

export function planForStudent(
  plan: { track?: string; audience?: PlanAudience },
  student: StudentProfile | null | undefined
): boolean {
  /* الزائر يرى كل الخطط الظاهرة — لا بيانات تسجيل تُقارَن بها بعد. */
  if (!student) return true;

  /* `track` القديم يبقى مفهوماً، والفئة الجديدة تغلب عليه إن ضُبطت. */
  const a = plan.audience ?? {};
  const pairs: [string | undefined, string | undefined][] = [
    [a.stage, student.stage],
    [a.grade, student.grade],
    [a.system, student.eduSystem],
    [a.track ?? plan.track, student.track],
    [a.branch, student.branch],
    [a.gender, student.gender],
  ];

  /*
    قاعدتان تحكمان المطابقة:

    ١) الحقل الفارغ في الفئة لا يُضيّق شيئاً — الخطة العامّة تظهر للجميع
       بلا ضبط.

    ٢) والحقل الذي لا يملك الطالبُ قيمةً له لا يُقصيه.
       ------------------------------------------------------------------
       الإقصاءُ عند الجهل يجعل الخطةَ غيرَ مرئية لأحد: الفصل الدراسي لم
       يكن يُسأل عنه في التسجيل قبل أن يصير مبنيّاً، فلا أحدَ ممّن سجّل
       قبلَه يحمل قيمةً له — وخطةٌ مقيَّدة بفصلٍ تختفي عن الجميع بلا أن
       يُنبَّه أحد. والصواب أن يُقصي الشرطُ من خالفه لا من جُهل حالُه.
  */
  return pairs.every(([want, has]) => {
    const w = (want ?? "").trim();
    const h = (has ?? "").trim();
    return !w || !h || w === h;
  });
}

/**
 * الحقول التي تُضيّق الفئة ولا يملك هذا الطالب قيمةً لها.
 * تُستعمل في اللوحة لتنبيه المشرف: شرطٌ لا يُقصي أحداً ليس تصفية.
 */
export function audienceBlindSpots(
  plan: { track?: string; audience?: PlanAudience },
  student: StudentProfile
): string[] {
  const a = plan.audience ?? {};
  const rows: [string | undefined, string | undefined, string][] = [
    [a.stage, student.stage, "المرحلة"],
    [a.grade, student.grade, "الصف"],
    [a.system, student.eduSystem, "النظام التعليمي"],
    [a.track ?? plan.track, student.track, "الشعبة"],
    [a.branch, student.branch, "فرع الشعبة"],
    [a.gender, student.gender, "النوع"],
  ];
  return rows
    .filter(([w, h]) => (w ?? "").trim() && !(h ?? "").trim())
    .map(([, , label]) => label);
}

/** وصف الفئة بالعربية — يُعرض في اللوحة وفي بطاقة الخطة. */
export function audienceLabel(plan: { track?: string; audience?: PlanAudience }): string {
  const a = plan.audience ?? {};
  const parts = [a.stage, a.grade, a.system, a.track ?? plan.track, a.branch, a.gender]
    .map((v) => (v ?? "").trim())
    .filter(Boolean);
  return parts.length ? parts.join(" · ") : "كل الطلاب";
}

/**
 * رقم واتساب التفعيل لخطة بعينها.
 * لكل خطة رقم اختياري — تُوجَّه به رسائل تفعيلها إلى المسؤول عنها،
 * وإن تُرك فارغاً رجعت الخطة إلى رقم المنصّة العام.
 * يُطبَّع الرقم من الأرقام العربية والمسافات والرموز.
 */
export function planWaLink(plan: { whatsapp?: string } | null | undefined, fallback: string, text: string): string {
  const raw = (plan?.whatsapp ?? "").trim() || fallback;
  const num = raw
    .replace(/[٠-٩]/g, (d) => String("٠١٢٣٤٥٦٧٨٩".indexOf(d)))
    .replace(/[^\d]/g, "");
  return `https://wa.me/${num}?text=${encodeURIComponent(text)}`;
}

/*
  والمعاملُ سعرٌ وخصمٌ لا خطّةٌ كاملة.
  الدالّةُ لا تقرأ من الخطّة إلّا هذين، واشتراطُ `SitePlan` كاملةً يمنع
  استعمالَها على خيار سعرٍ (`CoursePrice`) وهو الشيءُ نفسُه في الحساب —
  فيُنسخ الحسابُ في موضعٍ ثانٍ ويفترق الرقمان.
*/
export function planPrice(
  plan: { price?: number; discount?: PlanDiscount },
  now = Date.now()
): PricedPlan {
  const original = Math.max(0, plan.price ?? 0);
  const d = plan.discount;
  const notExpired = !d?.until || new Date(d.until).getTime() > now;
  const active = Boolean(d?.active && d.value > 0 && notExpired);

  if (!active || !d) {
    return { price: original, original, off: 0, percent: 0, active: false };
  }

  const off = d.type === "percent"
    ? Math.round((original * Math.min(100, d.value)) / 100)
    : Math.min(original, Math.round(d.value));
  const price = Math.max(0, original - off);

  return {
    price,
    original,
    off,
    percent: original ? Math.round((off / original) * 100) : 0,
    active: off > 0,
    label: d.label,
    until: d.until ?? null,
  };
}

/** لون الخطة (أو لون الثيم الافتراضي). */
export function planColor(plan: SitePlan): string | undefined {
  return plan.color && /^#?[0-9a-fA-F]{3,8}$/.test(plan.color) ? plan.color : undefined;
}

/* ------------------------------------------------------------------ */
/*  خيارات سعر الكورس                                                  */
/* ------------------------------------------------------------------ */

/** مدّة كل نوع بالأيام — الترم يتبع تاريخ نهايته لا عدداً. */
const KIND_DAYS: Record<string, number | null> = {
  month: 30,
  lesson: 7,
  once: null,
  term: null,
  custom: null,
};

export const COURSE_PRICE_KINDS: { id: CoursePriceKind; label: string; hint: string }[] = [
  { id: "once", label: "دائم", hint: "يعمل دائماً بعد الاشتراك ولا ينتهي" },
  { id: "term", label: "حتى نهاية الترم", hint: "ينتهي بتاريخ نهاية الترم العام" },
  { id: "month", label: "شهري", hint: "يفتح الكورس ٣٠ يوماً" },
  { id: "lesson", label: "حصّة واحدة", hint: "وصول قصير (٧ أيام)" },
  { id: "custom", label: "مدّة مخصّصة", hint: "تحدّد عدد الأيام بنفسك" },
];

/**
 * خيارات سعر الكورس كخطط.
 * ------------------------------------------------------------------
 * تُحوَّل إلى شكل الخطة لأن كل ما بعدها — البوّابة، الأكواد، حساب
 * السعر، مدّة الاشتراك — مبنيّ على الخطة. تحويلها هنا يعني مساراً
 * واحداً للشراء لا مسارين يفترقان في السلوك.
 *
 * المعرّف مسبوق بـ`CP:` فلا يلتبس بخطة حقيقية، ويُعاد بناؤه من الكورس
 * وقت الحاجة فلا يُخزَّن مرّتين.
 */
export function coursePricePlans(subject: {
  id: string; name: string; term?: TermNo; prices?: CoursePrice[];
}): SitePlan[] {
  return (subject.prices ?? [])
    .filter((p) => (p.label ?? "").trim())
    .map((p, i) => ({
      id: `CP:${subject.id}:${p.id}`,
      name: p.label.trim(),
      /*
        «مرّة واحدة» كانت تسقط إلى «شهري» فتنتهي بعد ثلاثين يوماً — وهي
        بيعٌ لوصولٍ دائم. صارت تُنقل إلى نوعها الصحيح.
      */
      kind: p.kind === "term" ? "term"
        : p.kind === "once" ? "lifetime"
          : p.kind === "custom" ? "custom" : "month",
      scope: "subject",
      subjectId: subject.id,
      termNo: subject.term,
      price: Math.max(0, p.price ?? 0),
      durationDays: p.durationDays ?? KIND_DAYS[p.kind] ?? null,
      endsAt: null,
      badge: p.badge,
      highlight: p.highlight,
      desc: p.desc,
      discount: p.discount,
      visible: true,
      order: i,
      createdAt: "",
    }));
}

/**
 * خططٌ ضمنيّةٌ من أسعار الموادّ.
 * ------------------------------------------------------------------
 * حين يبيع الأستاذُ الموادَّ مفرَّقةً، كلُّ خيارِ سعرٍ في مادّةٍ خطّةٌ نطاقُها
 * «مختارة» ومفتاحُها تلك المادّةُ وحدَها. فلا تُنشَأ خططٌ محفوظةٌ لكلّ
 * مادّةٍ في القاعدة — والمنهجُ عشراتُ الموادّ، فتُغرَق شاشةُ الخطط بما لا
 * يُقرأ.
 *
 * والمعرّفُ `UP:` ليُميَّز عن `CP:` (سعرِ كورس) وعن خطّةٍ محفوظة، فيُحلّ
 * عند التفعيل من مصدره لا من `db.plans`.
 */
export function unitPricePlans(subject: {
  id: string; name: string; term?: TermNo; units?: Unit[];
}): SitePlan[] {
  const out: SitePlan[] = [];
  (subject.units ?? []).forEach((u) => {
    (u.prices ?? [])
      .filter((p) => (p.label ?? "").trim() && (p.price ?? 0) >= 0)
      .forEach((p, i) => {
        out.push({
          id: `UP:${subject.id}:${u.id}:${p.id}`,
          name: `${u.title} — ${p.label.trim()}`,
          kind: p.kind === "term" ? "term"
            : p.kind === "once" ? "lifetime"
              : p.kind === "custom" ? "custom" : "month",
          scope: "picked",
          picks: [pickKey(subject.id, u.id)],
          termNo: subject.term,
          price: Math.max(0, p.price ?? 0),
          durationDays: p.durationDays ?? KIND_DAYS[p.kind] ?? null,
          endsAt: null,
          badge: p.badge,
          highlight: p.highlight,
          desc: p.desc,
          discount: p.discount,
          visible: true,
          order: 100 + i,
          createdAt: "",
        });
      });
  });
  return out;
}

/** خطة بمعرّفها — من الخطط المحفوظة أو من خيارات أسعار الكورسات. */
export function resolvePlan(
  id: string,
  plans: SitePlan[],
  subjects: { id: string; name: string; term?: TermNo; prices?: CoursePrice[]; units?: Unit[] }[]
): SitePlan | undefined {
  const direct = plans.find((p) => p.id === id);
  if (direct) return direct;

  /* `CP:` سعرُ كورس · `UP:` سعرُ مادّة — كلاهما خطّةٌ ضمنيّةٌ لا تُحفظ في
     القاعدة، فتُبنى من مصدرها عند الحاجة. */
  const cp = id.match(/^CP:([^:]+):/);
  if (cp) {
    const subject = subjects.find((s) => s.id === cp[1]);
    return subject ? coursePricePlans(subject).find((p) => p.id === id) : undefined;
  }
  const up = id.match(/^UP:([^:]+):/);
  if (up) {
    const subject = subjects.find((s) => s.id === up[1]);
    return subject ? unitPricePlans(subject).find((p) => p.id === id) : undefined;
  }
  return undefined;
}

/**
 * خطط الشراء المعروضة لهذا الطالب في هذا السياق.
 * ------------------------------------------------------------------
 * خيارات سعر الكورس أوّلاً (الأقرب إليه) ثم خطط المنصّة التي تشمله.
 * بلا كورس — كصفحة الدفع العامّة — تُعرض خطط «كل المواد» والفصول.
 *
 * مصدر واحد يستخدمه صندوق الشراء وصفحة الدفع، فلا تفترق القائمتان.
 */
export function plansFor(
  subject: { id: string; name: string; term?: TermNo; prices?: CoursePrice[]; units?: Unit[] } | undefined,
  plans: SitePlan[],
  student: StudentProfile | null | undefined
): SitePlan[] {
  /*
    الخططُ وحدَها تُباع.
    كانت أسعارُ الكورس وأسعارُ المادّة تُحوَّل خططاً ضمنيّةً وتُعرض مع
    المحفوظة — أي ثلاثةُ مصادرَ للسعر الواحد. وصار المصدرُ واحداً:
    ما يُنشئه الأستاذُ في بوّابة الدفع.

    ويبقى `coursePricePlans` و`unitPricePlans` لـ`resolvePlan` وحدَه:
    كودٌ وُلِّد قديماً من خيار سعرٍ يجب أن يظلّ قابلاً للتفعيل — والطالبُ
    دفع ثمنَه، فلا يُبطَل عليه بتغييرٍ في اللوحة.
  */
  const own: SitePlan[] = [];
  const site = plans
    .filter((p) => {
      /* الخطة المخفيّة مخفيّة عن الطالب أيضاً — لا عن الموقع وحده.
         كانت حمولةُ الطالب تحمل الخطط كلَّها، والصفحةُ لا تفحص الظهور،
         فكان يرى في شاشة الشراء ما أُخفي عمداً. */
      if (!p.visible) return false;
      if (!planForStudent(p, student)) return false;
      /* بلا كورس — كصفحة الدفع العامّة — تُعرض كلُّ خططه المتاحة.
         قصرُها على «كل المواد» والفصول كان يُفرغ الصفحة تماماً في منصّة
         خططُها كلُّها مرتبطة بكورسات. */
      if (!subject) return true;
      /*
        والخطّةُ المختارةُ تظهر لكلّ كورسٍ تمسّه — كورساً كاملاً كان أو
        مادّةً منه. فمن فتح كورساً تشمله خطّةُ حزمةٍ رآها فيه، ولا يُطالَب
        بأن يبحث عنها في كورسٍ آخر من الحزمة نفسِها.
      */
      if (p.scope === "picked") {
        return (p.picks ?? []).some((k) => parsePick(k).subjectId === subject.id);
      }
      return (
        p.scope === "all" ||
        (p.scope === "term" && p.termNo === (subject.term ?? 1)) ||
        p.subjectId === subject.id
      );
    })
    .sort((a, b) => (a.order ?? 0) - (b.order ?? 0) || a.price - b.price);
  return [...own, ...site];
}
