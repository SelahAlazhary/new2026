import "server-only";
import { getDB } from "@/lib/db/db";
import { sendToUsers } from "@/lib/integrations/push";
import { targetName, newActivationCode } from "@/lib/business/payments";
import { fbClaimOnce, fbReleaseClaim } from "@/lib/db/firebase";
import { tenantPath } from "@/lib/hub/context";
import type { DB, PayRequest, PayRequestStatus, Code, Notification } from "@/lib/utils/types";

/**
 * البتّ في طلب الدفع — قبولاً أو رفضاً.
 * ------------------------------------------------------------------
 * مكتبةٌ لا مسار، لأن مساريْن ينادياها: لوحة الإدارة وويبهوك تليجرام.
 * وضعُها في ملف `route` كان يجعل أحدهما يستورد من الآخر، فيعتمد على
 * تفصيل داخلي في تغليف المسارات لا على واجهة معلَنة.
 *
 * تُعدّل الطلب في مكانه وتُنشئ الكود والإشعار؛ والحفظ على المستدعي —
 * فيحفظ مرّة واحدة مهما تعدّدت التعديلات.
 */

const MAX_NOTE = 400;

function now() {
  return new Date().toISOString();
}

function clip(v: unknown, max: number): string {
  return String(v ?? "").trim().slice(0, max);
}

/**
 * بتٌّ ذرّيٌّ — الطلبُ يُبَتّ فيه مرّةً واحدةً في العالم كلِّه.
 * ------------------------------------------------------------------
 * `decide` يفحص `r.status` ويُغيّره، وهو آمنٌ داخل النسخة الواحدة. لكنّ
 * البتَّ يأتي من مصدرين — اللوحة وبوت تليجرام — وقد يقعان معاً على
 * نسختي Vercel مختلفتين، أو يبتّ مشرفان في اللحظة نفسِها. فتُولَّد
 * دفعةٌ واحدةٌ كودين، أو يُصفّى قبولٌ بكتابةٍ كاملةٍ من نسخةٍ قديمة.
 *
 * فتُطلب مطالبةٌ ذرّيّةٌ على `decisions/<id>` قبل البتّ: من يفوز يبتّ،
 * ومن يخسر يُقال له «بُتَّ في هذا الطلب بالفعل». وإن ردّ `decide` خطأً
 * (ككودٍ مستخدَم) تُحرَّر المطالبةُ ليصحّ إعادةُ المحاولة — فالخطأُ ليس
 * بتّاً.
 */
export async function decideOnce(
  r: PayRequest,
  action: string,
  body: { code?: unknown; reason?: unknown },
  by: string
): Promise<{ ok: true; status: PayRequestStatus } | { error: string }> {
  const claimed = await fbClaimOnce(tenantPath(`decisions/${r.id}`), { by, action, at: now() });
  if (!claimed) return { error: "بُتَّ في هذا الطلب بالفعل" };
  const result = decide(r, action, body, by);
  if ("error" in result) {
    /* لم يقع بتٌّ — تُحرَّر المطالبةُ فتصحّ إعادةُ المحاولة */
    await fbReleaseClaim(tenantPath(`decisions/${r.id}`));
  }
  return result;
}

export function decide(
  r: PayRequest,
  action: string,
  body: { code?: unknown; reason?: unknown },
  by: string
): { ok: true; status: PayRequestStatus } | { error: string } {
  const db = getDB();

  if (action === "approve") {
    const cfg = db.content.payments;
    const manual = clip(body.code, 40).toUpperCase();
    const taken = new Set(db.codes.map((c) => c.code));
    if (manual && taken.has(manual)) return { error: "هذا الكود مستخدم بالفعل" };

    const code = manual || (cfg?.autoCode === false ? "" : newActivationCode(taken, db.content.codePrefix));
    if (!code) return { error: "اكتب كود التفعيل — التوليد التلقائي مطفأ" };

    const target = r.subjectId || "*";
    const plan = db.plans.find((p) => p.id === r.planId);
    const fresh: Code = {
      code,
      planId: r.planId,
      planName: r.planName,
      plan: plan?.kind === "term" ? "ترم" : "شهر",
      subjectId: target,
      subjectName: r.subjectName ?? targetName(target, db.subjects),
      status: "متاح",
      createdAt: now().slice(0, 10),
      payId: r.id,
    };
    db.codes = [fresh, ...db.codes];

    r.status = "approved";
    r.code = code;
    r.handledAt = now();
    r.handledBy = by;
    r.readByAdmin = true;

    /* كودٌ لكورس بعينه يقود إليه مباشرة، والعامُّ يقود إلى الكورسات —
       فلا يفترق الرابطُ عمّا يفتحه زرُّ «فعّل الآن» في الإشعار. */
    const scoped = target !== "*" && !/^T[12]$/.test(target) ? target : "";
    pushNotification(db, {
      title: "تم قبول تحويلك ✅",
      body: `تم قبول تحويلك لخطة «${r.planName}». هذا كود التفعيل — فعّله بضغطة واحدة.`,
      userId: r.userId,
      link: scoped ? `/student/course/${scoped}` : "/student/subjects",
      code,
      codeSubjectId: scoped || undefined,
    });
    return { ok: true, status: "approved" };
  }

  if (action === "reject") {
    const reason = clip(body.reason, MAX_NOTE);
    r.status = "rejected";
    r.reason = reason || "بيانات التحويل غير مطابقة";
    r.handledAt = now();
    r.handledBy = by;
    r.readByAdmin = true;

    pushNotification(db, {
      title: "لم يُقبل التحويل",
      body: r.reason,
      userId: r.userId,
      link: "/student/subjects",
    });
    return { ok: true, status: "rejected" };
  }

  return { error: "إجراء غير معروف" };
}

function pushNotification(db: DB, n: Omit<Notification, "id" | "createdAt">) {
  db.notifications = [
    { id: `N-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 5)}`, createdAt: now(), ...n },
    ...db.notifications,
  ].slice(0, 500);
}

/**
 * إشعار جهاز الطالب بحصيلة البتّ.
 * تنبيهٌ إضافي فوق إشعار المنصّة — فشلُه لا يُسقط شيئاً، والإشعار
 * داخل المنصّة يبقى هو المصدر.
 */
export async function notifyStudent(db: DB, r: PayRequest, status: PayRequestStatus) {
  const user = db.users.find((u) => u.id === r.userId);
  if (!user) return;
  await sendToUsers([user], {
    title: status === "approved" ? "تم قبول تحويلك ✅" : "لم يُقبل التحويل",
    body: status === "approved"
      ? `كود تفعيل «${r.planName}»: ${r.code}`
      : r.reason || "راجع بيانات التحويل ثم أعد الإرسال",
    url: "/student/subjects",
  }).catch(() => { /* الإشعار تنبيه لا شرط */ });
}
