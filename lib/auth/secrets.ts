import "server-only";
import crypto from "crypto";

/**
 * الأسرار التشغيلية — قاعدة واحدة: لا سرّ ثابت معروف في الإنتاج أبداً.
 * ------------------------------------------------------------------
 * الكود عامّ على GitHub، فأي قيمة احتياطية مكتوبة فيه هي قيمة يعرفها
 * الجميع. الاعتماد عليها في الإنتاج يعني:
 *   • AUTH_SECRET معروف   ← يمكن تزوير كوكي جلسة أدمن كاملة.
 *   • ADMIN_PASSWORD معروف ← يمكن الدخول للوحة مباشرة.
 *
 * لذلك:
 *   • في التطوير (بلا HTTPS): قيمة ثابتة مريحة، فالجلسات لا تسقط مع كل تعديل.
 *   • في الإنتاج بلا ضبط: سرّ عشوائي يُولَّد عند الإقلاع — لا يُخمَّن أبداً.
 *     النتيجة: الموقع يعمل، لكن الجلسات تسقط عند كل إعادة تشغيل،
 *     وحساب الأدمن يُنشأ بكلمة مرور عشوائية لا يعرفها أحد (أي: مقفل)
 *     حتى تُضبط متغيّرات البيئة. الفشل هنا «مغلق» لا «مفتوح».
 */

/** الإنتاج = يعمل خلف HTTPS (نفس العلم الذي تعتمده الكوكي الآمنة). */
const IS_PROD = process.env.COOKIE_SECURE === "1" || process.env.VERCEL === "1";

/** سرّ عشوائي واحد لعمر العملية — يُستخدم فقط حين لا يُضبط سرّ حقيقي. */
const EPHEMERAL = crypto.randomBytes(48).toString("base64url");

/** سرّ توقيع الجلسات والأجهزة. */
export const AUTH_SECRET: string =
  process.env.AUTH_SECRET?.trim() ||
  (IS_PROD ? EPHEMERAL : "dev-only-secret-set-AUTH_SECRET");

/** هل نعمل بسرّ مؤقّت؟ (تُعرض تحذيراً في لوحة الحماية) */
export const AUTH_SECRET_IS_EPHEMERAL = !process.env.AUTH_SECRET?.trim() && IS_PROD;

/** بريد الأدمن الأوّل. */
export const ADMIN_EMAIL: string =
  process.env.ADMIN_EMAIL?.trim() || "admin@example.com";

/**
 * كلمة مرور الأدمن الأوّل.
 * بلا ضبط في الإنتاج: كلمة عشوائية طويلة — الحساب يُنشأ لكنه غير قابل للدخول،
 * وهذا مقصود: أفضل من حساب مفتوح بكلمة مرور منشورة في المستودع.
 */
export const ADMIN_PASSWORD: string =
  process.env.ADMIN_PASSWORD?.trim() ||
  (IS_PROD ? crypto.randomBytes(24).toString("base64url") : "ChangeMe@2026");

/** هل حساب الأدمن مقفل لعدم ضبط كلمة مروره؟ */
export const ADMIN_PASSWORD_UNSET = !process.env.ADMIN_PASSWORD?.trim() && IS_PROD;

if (IS_PROD && (AUTH_SECRET_IS_EPHEMERAL || ADMIN_PASSWORD_UNSET)) {
  // تحذير واضح في سجلّ الخادم — لا يكشف أي قيمة
  console.warn(
    "[أمان] متغيّرات بيئة ناقصة في الإنتاج:" +
      (AUTH_SECRET_IS_EPHEMERAL ? " AUTH_SECRET (الجلسات تسقط عند كل إقلاع)" : "") +
      (ADMIN_PASSWORD_UNSET ? " ADMIN_PASSWORD (حساب الأدمن مقفل)" : "") +
      " — اضبطها في إعدادات المشروع ثم أعد النشر."
  );
}
