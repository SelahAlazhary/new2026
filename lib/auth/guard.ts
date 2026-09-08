import "server-only";
import { headers } from "next/headers";
import { tryCurrentTenant } from "@/lib/hub/context";

/**
 * طبقة الحماية المشتركة للمسارات:
 * • تحديد المعدّل (Rate limiting) لمنع تخمين كلمات المرور وإنشاء الحسابات آلياً.
 * • قفل مؤقّت للحساب بعد محاولات فاشلة متتالية.
 * • فحص أصل الطلب (Origin) لصدّ هجمات CSRF على المسارات المعدِّلة.
 * • قواعد قوّة كلمة المرور.
 *
 * العدّادات في ذاكرة العملية — تكفي لخادم واحد، وتُصفَّر عند إعادة التشغيل.
 */

type Bucket = { count: number; first: number; blockedUntil?: number };
const buckets = new Map<string, Bucket>();

/** تنظيف دوري خفيف حتى لا تنمو الذاكرة. */
function sweep(now: number) {
  if (buckets.size < 500) return;
  for (const [k, b] of buckets) {
    if (now - b.first > 3_600_000 && (!b.blockedUntil || b.blockedUntil < now)) buckets.delete(k);
  }
}

export type LimitResult = { ok: boolean; retryAfter?: number; remaining?: number };

/**
 * حدّ للمحاولات: مثلاً limit(key, 10, 60_000) = ١٠ محاولات في الدقيقة.
 * عند التجاوز يُحظر المفتاح لمدّة blockMs.
 */
/**
 * المفتاحُ يُسبَق بمعرّف المنصّة.
 * عدّاداتُ الذاكرة مشتركةٌ بين كلّ المنصّات في النسخة الواحدة، فلولا هذا
 * لحجب طالبٌ مشاغبٌ على منصّةٍ طلابَ منصّةٍ أخرى من العنوان نفسِه —
 * مدرسةٌ واحدة، منصّتان، عنوانٌ واحد.
 */
function scoped(key: string): string {
  return `${tryCurrentTenant()?.id ?? "-"}:${key}`;
}

export function limit(key: string, max: number, windowMs: number, blockMs = windowMs): LimitResult {
  key = scoped(key);
  const now = Date.now();
  sweep(now);
  const b = buckets.get(key);

  if (b?.blockedUntil && b.blockedUntil > now) {
    return { ok: false, retryAfter: Math.ceil((b.blockedUntil - now) / 1000) };
  }
  if (!b || now - b.first > windowMs) {
    buckets.set(key, { count: 1, first: now });
    return { ok: true, remaining: max - 1 };
  }
  b.count += 1;
  if (b.count > max) {
    b.blockedUntil = now + blockMs;
    return { ok: false, retryAfter: Math.ceil(blockMs / 1000) };
  }
  return { ok: true, remaining: max - b.count };
}

/** تصفير عدّاد بعد نجاح العملية (مثل تسجيل دخول صحيح). */
export function resetLimit(key: string) {
  buckets.delete(scoped(key));
}

/**
 * عناوين لا يجوز حظرها إطلاقاً: الخادم نفسه والشبكة المحلية.
 * حظرها يعني قفل صاحبة المنصّة خارج لوحتها — وهو ضرر أكبر من أي هجوم.
 */
export function isTrustedIp(ip: string): boolean {
  const v = (ip || "").replace(/^::ffff:/, "");
  return (
    v === "local" ||
    v === "::1" ||
    v === "127.0.0.1" ||
    v.startsWith("127.") ||
    v.startsWith("10.") ||
    v.startsWith("192.168.") ||
    /^172\.(1[6-9]|2\d|3[01])\./.test(v)
  );
}

/** عنوان الطالب التقريبي (خلف بروكسي أيضاً). */
export async function clientIp(): Promise<string> {
  const h = await headers();
  const fwd = h.get("x-forwarded-for");
  if (fwd) return fwd.split(",")[0].trim();
  return h.get("x-real-ip") ?? "local";
}

/**
 * فحص المصدر: يجب أن يكون Origin/Referer من نفس مضيف الطلب.
 * يمنع أي موقع خارجي من إرسال طلبات نيابة عن مستخدم مسجّل.
 */
export async function sameOrigin(req: Request): Promise<boolean> {
  const h = await headers();
  const origin = h.get("origin");
  const referer = h.get("referer");
  const host = h.get("host");
  if (!host) return false;
  const candidate = origin ?? referer;
  if (!candidate) return true; // طلبات الخادم/الأدوات بلا Origin — لا نكسر التشغيل المحلي
  try {
    return new URL(candidate).host === host;
  } catch {
    return false;
  }
}

/** قوّة كلمة المرور — رسالة عربية واضحة أو null إن كانت مقبولة. */
export function passwordProblem(password: string): string | null {
  const p = String(password ?? "");
  if (p.length < 8) return "كلمة المرور قصيرة — ٨ أحرف على الأقل";
  if (!/[A-Za-z؀-ۿ]/.test(p)) return "أضِف حرفاً واحداً على الأقل لكلمة المرور";
  if (!/\d/.test(p)) return "أضِف رقماً واحداً على الأقل لكلمة المرور";
  const weak = ["12345678", "password", "11111111", "00000000", "qwertyui", "abcd1234", "123456789"];
  if (weak.includes(p.toLowerCase())) return "كلمة المرور شائعة جداً — اختر واحدة أقوى";
  return null;
}

/** بريد/اسم مستخدم بشكل معقول. */
export function invalidUsername(username: string): string | null {
  const u = String(username ?? "").trim();
  if (u.length < 5 || u.length > 200) return "البريد غير صالح";
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(u) && !/^\+?\d{8,15}$/.test(u)) {
    return "أدخل بريداً إلكترونياً صحيحاً";
  }
  return null;
}
