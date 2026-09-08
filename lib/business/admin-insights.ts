import type { PublicDB, User } from "@/lib/utils/types";
import { can, type AdminPerm } from "@/lib/auth/perms";
import { gatewayOn, activeMethods } from "@/lib/business/payments";
import { lessonCount } from "@/lib/business/course-units";
import { gradeInStage } from "@/lib/utils/data";

/**
 * ما يحتاج انتباه المشرف الآن.
 * ------------------------------------------------------------------
 * اللوحةُ كانت تعرض أرقاماً: كم طالباً، كم كورساً، كم إيراداً. والأرقام
 * تصف الماضي ولا تقول ما العمل. هذه الدالة تقلب السؤال: ما الذي يعطّل
 * المنصّة الآن، وما الذي ينتظر ردّاً، وما الذي نُصِب ولم يُكمَل؟
 *
 * قاعدتان تحكمان ما يُعرض:
 *   • لا يُعرض عملٌ لا يملك المشرف صلاحيتَه — تنبيهٌ لا يستطيع صاحبُه
 *     الاستجابةَ له إزعاجٌ لا إفادة.
 *   • لا يُعرض ما لا فعل له — «كل شيء تمام» ليس بنداً في قائمة مهامّ.
 */

export type InsightLevel = "urgent" | "warn" | "tip";

export type Insight = {
  id: string;
  level: InsightLevel;
  label: string;
  hint: string;
  href: string;
  perm: AdminPerm;
  /** عدد يُعرض شارةً بجانب البند. */
  count?: number;
};

const RANK: Record<InsightLevel, number> = { urgent: 0, warn: 1, tip: 2 };

export function adminInsights(
  db: PublicDB | null | undefined,
  me: Pick<User, "role" | "owner" | "adminPerms"> | null | undefined
): Insight[] {
  if (!db) return [];
  const out: Insight[] = [];
  const content = db.content;

  /* ---------- مالٌ ينتظر ---------- */
  const pendingPays = (db.payments ?? []).filter((p) => p.status === "pending");
  if (pendingPays.length > 0) {
    out.push({
      id: "pay-pending",
      level: "urgent",
      count: pendingPays.length,
      label: "تحويلات تنتظر المراجعة",
      hint: `${pendingPays.map((p) => p.student).slice(0, 3).join(" · ")}${pendingPays.length > 3 ? " …" : ""}`,
      href: "/admin/payments",
      perm: "payments",
    });
  }

  /* مالٌ وصل ولم يُستعمل كودُه — يعني طالباً دفع ولم يدرس بعد */
  const unusedPaid = (db.payments ?? []).filter((p) => p.status === "approved" && p.code && !p.redeemedAt);
  if (unusedPaid.length > 0) {
    out.push({
      id: "pay-unused",
      level: "warn",
      count: unusedPaid.length,
      label: "أكواد مدفوعة لم تُفعَّل بعد",
      hint: "طلابٌ دفعوا ولم يستعملوا كودهم — قد يحتاجون تذكيراً",
      href: "/admin/payments",
      perm: "payments",
    });
  }

  /* ---------- طلابٌ ينتظرون ردّاً ---------- */
  const waiting = (db.tickets ?? []).filter((t) =>
    (t.messages ?? []).some((m) => m.from === "student" && !m.readByAdmin)
  );
  if (waiting.length > 0) {
    out.push({
      id: "support",
      level: "urgent",
      count: waiting.length,
      label: "رسائل دعم تنتظر ردّاً",
      hint: waiting.map((t) => t.student).slice(0, 3).join(" · "),
      href: "/admin/support/chat",
      perm: "support",
    });
  }

  /* ---------- إعدادٌ نُصِب ولم يُكمَل ---------- */
  const methods = activeMethods(content.payments?.methods);
  if (content.payments?.enabled === true && methods.length === 0) {
    out.push({
      id: "pay-no-methods",
      level: "urgent",
      label: "بوّابة الدفع مشغّلة بلا طريقة دفع",
      hint: "الطالب لن يرى أين يحوّل — أضف طريقة واحدة على الأقلّ",
      href: "/admin/payments",
      perm: "payments",
    });
  }
  if (methods.length > 0 && !gatewayOn(content.payments)) {
    out.push({
      id: "pay-off",
      level: "tip",
      label: "طرق الدفع جاهزة والبوّابة مطفأة",
      hint: "الشراء ما زال يمرّ عبر واتساب — شغّلها ليتمّ داخل المنصّة",
      href: "/admin/payments",
      perm: "payments",
    });
  }

  /* ---------- كورساتٌ لا تُفيد أحداً ---------- */
  const emptyPublished = (db.subjects ?? []).filter(
    (s) => s.status === "منشورة" && lessonCount(s) === 0
  );
  if (emptyPublished.length > 0) {
    out.push({
      id: "course-empty",
      level: "warn",
      count: emptyPublished.length,
      label: "كورسات منشورة بلا دروس",
      hint: emptyPublished.map((s) => s.name).slice(0, 3).join(" · "),
      href: "/admin/subjects",
      perm: "subjects",
    });
  }

  const drafts = (db.subjects ?? []).filter(
    (s) => s.status === "مسودّة" && lessonCount(s) > 0
  );
  if (drafts.length > 0) {
    out.push({
      id: "course-draft",
      level: "tip",
      count: drafts.length,
      label: "كورسات جاهزة لم تُنشَر",
      hint: `${drafts.map((s) => s.name).slice(0, 3).join(" · ")} — فيها دروس ولا يراها أحد`,
      href: "/admin/subjects",
      perm: "subjects",
    });
  }

  /* ---------- خططٌ لا تُشترى ---------- */
  const freePlans = (db.plans ?? []).filter((p) => p.visible && (p.price ?? 0) <= 0);
  if (freePlans.length > 0) {
    out.push({
      id: "plan-free",
      level: "warn",
      count: freePlans.length,
      label: "خطط ظاهرة بسعر صفر",
      hint: freePlans.map((p) => p.name).slice(0, 3).join(" · "),
      href: "/admin/plans",
      perm: "plans",
    });
  }

  if ((db.subjects ?? []).length > 0 && (db.plans ?? []).filter((p) => p.visible).length === 0) {
    const noOwnPrices = (db.subjects ?? []).every((s) => (s.prices?.length ?? 0) === 0);
    if (noOwnPrices) {
      out.push({
        id: "plan-none",
        level: "urgent",
        label: "لا خطط ولا أسعار — لا أحد يستطيع الشراء",
        hint: "أضف خطة في «الخطط» أو خيارات سعر داخل الكورس",
        href: "/admin/plans",
        perm: "plans",
      });
    }
  }

  /* ---------- طلابٌ عالقون ---------- */
  const suspended = (db.users ?? []).filter((u) => u.role === "student" && !u.active);
  if (suspended.length > 0) {
    out.push({
      id: "students-off",
      level: "tip",
      count: suspended.length,
      label: "حسابات طلاب موقوفة",
      hint: "لا يستطيعون الدخول حتى تُفعَّل",
      href: "/admin/students",
      perm: "students",
    });
  }

  /* ---------- بثٌّ نُسي مفتوحاً ---------- */
  const liveOn = (db.live ?? []).filter((l) => l.status === "مباشر");
  if (liveOn.length > 1) {
    out.push({
      id: "live-many",
      level: "warn",
      count: liveOn.length,
      label: "أكثر من بثّ معلَّم «مباشر»",
      hint: "الطالب يرى أوّلها فقط — أغلق ما انتهى",
      href: "/admin/live",
      perm: "live",
    });
  }

  /* ---------- إشعارٌ لا يصل ---------- */
  const students = (db.users ?? []).filter((u) => u.role === "student");
  const subscribed = students.filter((u) => (u.pushDevices ?? 0) > 0).length;

  if (db.integrations?.push === false) {
    out.push({
      id: "push-off",
      level: "warn",
      label: "إشعارات الأجهزة غير مضبوطة",
      hint: "كود التفعيل لن يصل الطالبَ وهو مغلقٌ للموقع — تحتاج مفاتيح VAPID على الاستضافة",
      href: "/admin/notifications",
      perm: "notifications",
    });
  } else if (students.length > 0 && subscribed === 0) {
    out.push({
      id: "push-none",
      level: "tip",
      label: "لا أحد فعّل إشعارات جهازه",
      hint: "الإشعارات تصل داخل المنصّة فقط حتى يسمح الطالب بها من صفحة الإشعارات",
      href: "/admin/notifications",
      perm: "notifications",
    });
  }

  /* ---------- تكاملُ الأقسام: ما يُكسَر حين يُعدَّل قسمٌ وحدَه ----------
     أخطرُ ما في لوحةٍ متعدّدةِ الأقسام ليس خطأً داخلَ قسم، بل تعارضاً
     بين قسمين: كورسٌ يُحذف وتبقى خطّتُه، وصفٌّ يُسمّى في الصفوف بغير ما
     يُكتب في الكورس، وكودٌ يُولَّد لخطّةٍ ذهبت. ولا يظهر شيءٌ من ذلك في
     الشاشة التي عُدِّلت — بل في شاشةٍ أخرى، أو عند الطالب وحدَه.
     فتُفحص الروابطُ هنا مرّةً واحدةً، ويُعرض ما انكسر منها.            */

  const subjects = db.subjects ?? [];
  const plans = db.plans ?? [];
  const codes = db.codes ?? [];
  const grades = db.grades ?? [];

  /* كورسٌ محذوفٌ وخطّتُه باقية — تُعرض للطالب وتُفضي إلى لا شيء */
  const orphanPlans = plans.filter(
    (p) => p.scope === "subject" && p.subjectId && !subjects.some((s) => s.id === p.subjectId)
  );
  if (orphanPlans.length > 0) {
    out.push({
      id: "plan-orphan",
      level: "urgent",
      count: orphanPlans.length,
      label: "خطط تُشير إلى كورسات محذوفة",
      hint: `${orphanPlans.map((p) => p.name).slice(0, 3).join(" · ")} — من يشتريها لا يفتح شيئاً`,
      href: "/admin/plans",
      perm: "plans",
    });
  }

  /*
    كورسٌ لا سبيلَ إلى شرائه.
    لا خطّةٌ تشمله ولا سعرَ في بطاقته — فهو منشورٌ يراه الطالبُ ولا يملك
    زرّاً يفتحه. والشمولُ ثلاثةُ أوجه: خطّةُ «كلّ المواد»، أو خطّةُ فصلٍ
    هو فصلُه، أو خطّةٌ باسمه.
  */
  const unbuyable = subjects.filter((s) => {
    if (s.status !== "منشورة") return false;
    if ((s.prices?.length ?? 0) > 0 || (s.price ?? 0) > 0) return false;
    return !plans.some(
      (p) =>
        p.visible !== false &&
        (p.scope === "all" ||
          (p.scope === "term" && (p.termNo ?? 1) === (s.term ?? 1)) ||
          (p.scope === "subject" && p.subjectId === s.id))
    );
  });
  if (unbuyable.length > 0) {
    out.push({
      id: "course-unbuyable",
      level: "urgent",
      count: unbuyable.length,
      label: "كورسات منشورة لا سبيل إلى شرائها",
      hint: `${unbuyable.map((s) => s.name).slice(0, 3).join(" · ")} — لا خطّة تشملها ولا سعر في بطاقتها`,
      href: "/admin/plans",
      perm: "plans",
    });
  }

  /*
    كورسٌ لصفٍّ لا وجودَ له في «الصفوف».
    الكورسُ يُعرض للطالب بمطابقة اسم صفّه؛ فحرفٌ يختلف يُخفيه عن كلّ
    طالبٍ ولا يظهر خطأٌ في أيّ شاشة — الكورسُ في اللوحة، والطالبُ لا يراه.
  */
  const gradeNames = new Set(grades.map((g) => g.name));
  const strayGrade = subjects.filter(
    (s) => s.grade && s.grade !== "كل الصفوف" && !gradeNames.has(s.grade)
  );
  if (strayGrade.length > 0 && grades.length > 0) {
    out.push({
      id: "course-stray-grade",
      level: "urgent",
      count: strayGrade.length,
      label: "كورسات لصفوف غير مسجَّلة",
      hint: `${Array.from(new Set(strayGrade.map((s) => s.grade))).slice(0, 3).join(" · ")} — لا طالبَ يراها`,
      href: "/admin/subjects",
      perm: "subjects",
    });
  }

  /* صفٌّ مسجَّلٌ ولا كورسَ فيه — طالبُه يفتح «الكورسات» على فراغ */
  const emptyGrades = grades.filter(
    (g) => !subjects.some((s) => s.grade === g.name || s.grade === "كل الصفوف")
  );
  if (emptyGrades.length > 0 && subjects.length > 0) {
    out.push({
      id: "grade-empty",
      level: "warn",
      count: emptyGrades.length,
      label: "صفوف بلا كورسات",
      hint: `${emptyGrades.map((g) => g.name).slice(0, 3).join(" · ")} — طلابها يفتحون شاشةً فارغة`,
      href: "/admin/subjects",
      perm: "subjects",
    });
  }

  /* فصلٌ دراسيٌّ خالٍ والآخرُ عامر — يُنبَّه ولا يُعدّ خطأً */
  if (subjects.length > 0) {
    const t1 = subjects.filter((s) => (s.term ?? 1) === 1).length;
    const t2 = subjects.filter((s) => (s.term ?? 1) === 2).length;
    if (t1 > 0 && t2 === 0) {
      out.push({
        id: "term2-empty",
        level: "tip",
        label: "الفصل الدراسي الثاني بلا كورسات",
        hint: "تبويبُه يظهر للطالب فارغاً — أضِف كورساته أو انقل ما يخصّه",
        href: "/admin/subjects",
        perm: "subjects",
      });
    } else if (t2 > 0 && t1 === 0) {
      out.push({
        id: "term1-empty",
        level: "tip",
        label: "الفصل الدراسي الأول بلا كورسات",
        hint: "تبويبُه يظهر للطالب فارغاً — راجع فصلَ كل كورس",
        href: "/admin/subjects",
        perm: "subjects",
      });
    }
  }

  /* كودٌ متاحٌ لخطّةٍ أو كورسٍ ذهب — يُفعَّل فلا يفتح شيئاً */
  const deadCodes = codes.filter((c) => {
    if (c.status !== "متاح") return false;
    const planGone = !!c.planId && !plans.some((p) => p.id === c.planId);
    const subGone =
      !!c.subjectId &&
      c.subjectId !== "*" &&
      !/^T[12]$/.test(c.subjectId) &&
      !subjects.some((s) => s.id === c.subjectId);
    return planGone || subGone;
  });
  if (deadCodes.length > 0) {
    out.push({
      id: "code-dead",
      level: "warn",
      count: deadCodes.length,
      label: "أكواد متاحة لخطط أو كورسات محذوفة",
      hint: "الطالبُ يُفعّلها ولا يُفتح له شيء — احذفها أو أعِد الخطة",
      href: "/admin/codes",
      perm: "codes",
    });
  }

  /* اختبارٌ منشورٌ بلا أسئلةٍ ولا رابط */
  const hollowExams = (db.exams ?? []).filter(
    (e) => e.status === "منشور" && (e.questions?.length ?? 0) === 0 && !e.url?.trim()
  );
  if (hollowExams.length > 0) {
    out.push({
      id: "exam-hollow",
      level: "urgent",
      count: hollowExams.length,
      label: "اختبارات منشورة بلا أسئلة",
      hint: hollowExams.map((e) => e.title).slice(0, 3).join(" · "),
      href: "/admin/exams",
      perm: "exams",
    });
  }

  /*
    بثٌّ فات موعدُه وما زال «مجدولاً».
    مهلةُ ساعتين تحتمل تأخّرَ البداية ولا تُنبّه على درسٍ يجري الآن.
  */
  const late = (db.live ?? []).filter((l) => {
    if (l.status !== "مجدول" || !l.startsAt) return false;
    const t = Date.parse(l.startsAt);
    return Number.isFinite(t) && Date.now() - t > 2 * 3600 * 1000;
  });
  if (late.length > 0) {
    out.push({
      id: "live-late",
      level: "warn",
      count: late.length,
      label: "بثّ مجدول فات موعدُه",
      hint: `${late.map((l) => l.title).slice(0, 3).join(" · ")} — يبقى في قائمة الطالب منتظَراً`,
      href: "/admin/live",
      perm: "live",
    });
  }

  /*
    اشتراكاتٌ توشك أن تنتهي.
    وهذه ليست عطلاً بل فرصةٌ تفوت: من ذكّرته قبل الانتهاء بأسبوعٍ جدّد،
    ومن علم بعده انقطع.
  */
  const soon = (db.users ?? []).filter((u) => {
    if (u.role !== "student") return false;
    return (u.subscriptions ?? []).some((sub) => {
      if (!sub.expiresAt) return false;
      const t = Date.parse(sub.expiresAt);
      if (!Number.isFinite(t)) return false;
      const days = (t - Date.now()) / 86400000;
      return days > 0 && days <= 7;
    });
  });
  if (soon.length > 0) {
    out.push({
      id: "subs-ending",
      level: "tip",
      count: soon.length,
      label: "اشتراكات تنتهي خلال أسبوع",
      hint: `${soon.map((u) => u.name).slice(0, 3).join(" · ")} — تذكيرُهم الآن يجدّد اشتراكهم`,
      href: "/admin/students",
      perm: "students",
    });
  }

  /*
    طلابٌ صفُّهم يخالف مرحلتَهم.
    كانت شاشةُ التسجيل تعرض الصفوفَ الستّةَ كلَّها مهما اختار الطالبُ
    مرحلتَه، فسُجّل من اختار «ثانوية» ثمّ «الأول الإعدادي». وقد صُفّيت
    الشاشةُ وقُيّد الخادم، لكنّ من سجّل قبل ذلك يبقى بسجلٍّ متناقض: لا
    تطابقه خطّةٌ مقيَّدةٌ بمرحلته ولا بصفّه، وتقول اللوحةُ «لا يطابقها
    أحد» ولا يُفهم لماذا. فيُعرض ليُصحَّح من صفحة الطالب.
  */
  const mixedStage = (db.users ?? []).filter(
    (u) => u.role === "student" && !gradeInStage(u.grade, u.stage)
  );
  if (mixedStage.length > 0) {
    out.push({
      id: "student-stage-mismatch",
      level: "warn",
      count: mixedStage.length,
      label: "طلاب صفُّهم يخالف مرحلتَهم",
      hint: `${mixedStage.map((u) => `${u.name} (${u.stage} · ${u.grade})`).slice(0, 2).join(" · ")} — لا تطابقهم خطّة`,
      href: "/admin/students",
      perm: "students",
    });
  }

  /* ---------- هويةٌ ناقصة ---------- */
  if (!content.whatsapp?.trim()) {
    out.push({
      id: "no-wa",
      level: "warn",
      label: "رقم واتساب المنصّة غير مضبوط",
      hint: "أزرار التواصل في الموقع بلا وجهة",
      href: "/admin/customize",
      perm: "customize",
    });
  }

  return out
    .filter((x) => can(me, x.perm))
    .sort((a, b) => RANK[a.level] - RANK[b.level] || (b.count ?? 0) - (a.count ?? 0));
}

/**
 * عدّادات القوائم — تُعرض شارةً بجانب القسم.
 * الشارةُ تقول «هنا عملٌ ينتظر»، فلا تُوضع إلا حيث ينتظر عمل فعلاً.
 */
export function navBadges(
  db: PublicDB | null | undefined
): Record<string, number> {
  if (!db) return {};
  const out: Record<string, number> = {};

  const pending = (db.payments ?? []).filter((p) => p.status === "pending").length;
  if (pending) out["/admin/payments"] = pending;

  const waiting = (db.tickets ?? []).filter((t) =>
    (t.messages ?? []).some((m) => m.from === "student" && !m.readByAdmin)
  ).length;
  if (waiting) out["/admin/support/chat"] = waiting;

  /*
    طلباتُ نقل المرحلة تُشار في القائمة.
    وبدونها تبقى داخل صفحة الطلاب لا يعلم بها أحدٌ حتّى يفتحها — والطالبُ
    ينتظر. والشارةُ تصعد إلى مجموعة «الطلاب والاشتراكات» حين تُطوى.
  */
  const moves = (db.gradeRequests ?? []).filter((r) => r.status === "قيد المراجعة").length;
  if (moves) out["/admin/students"] = moves;

  return out;
}
