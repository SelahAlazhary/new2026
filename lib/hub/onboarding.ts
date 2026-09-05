import "server-only";
import { RESERVED_SLUGS, SLUG_RE } from "./resolve";
import { tenantIdBySlug } from "./registry";

/**
 * أدواتُ رحلة إنشاء المنصّة — اقتراحُ العنوان والتحقّقُ منه.
 * ------------------------------------------------------------------
 * الـslug هو النطاقُ الفرعيُّ للمنصّة، فلا بدّ أن يكون لاتينيّاً صالحاً
 * وفريداً وغيرَ محجوز. والاسمُ عربيٌّ غالباً، فيُحوَّل صوتيّاً — تحويلٌ
 * تقريبيٌّ يكفي بذرةً يعدّلها المدرّس، لا معجماً كاملاً.
 */

/** جدولُ تحويلٍ صوتيّ عربيّ → لاتينيّ (تقريبيّ، للبذرة لا للدقّة). */
const TRANSLIT: Record<string, string> = {
  ا: "a", أ: "a", إ: "e", آ: "a", ب: "b", ت: "t", ث: "th", ج: "g", ح: "h", خ: "kh",
  د: "d", ذ: "z", ر: "r", ز: "z", س: "s", ش: "sh", ص: "s", ض: "d", ط: "t", ظ: "z",
  ع: "a", غ: "gh", ف: "f", ق: "q", ك: "k", ل: "l", م: "m", ن: "n", ه: "h", و: "w",
  ي: "y", ى: "a", ة: "a", ء: "", ؤ: "w", ئ: "y",
  "٠": "0", "١": "1", "٢": "2", "٣": "3", "٤": "4", "٥": "5", "٦": "6", "٧": "7", "٨": "8", "٩": "9",
};

/** يقترح slug من اسمٍ عربيّ أو لاتينيّ. */
export function suggestSlug(name: string): string {
  const out = [...name.trim().toLowerCase()]
    .map((ch) => (TRANSLIT[ch] !== undefined ? TRANSLIT[ch] : /[a-z0-9]/.test(ch) ? ch : "-"))
    .join("")
    .replace(/-+/g, "-")
    .replace(/^-|-$/g, "")
    .slice(0, 30);
  return out.length >= 3 ? out : `t-${out}`.slice(0, 30);
}

export type SlugCheck = { ok: boolean; reason?: string };

/** يتحقّق من صيغة الـslug وحجزِه وتوفّره. */
export async function checkSlug(slug: string): Promise<SlugCheck> {
  const s = slug.trim().toLowerCase();
  if (!SLUG_RE.test(s)) return { ok: false, reason: "أحرف لاتينية صغيرة وأرقام وشرطة، ٣ إلى ٤٠ حرفاً" };
  if (RESERVED_SLUGS.has(s)) return { ok: false, reason: "هذا الاسم محجوز — اختر غيره" };
  const taken = await tenantIdBySlug(s);
  if (taken) return { ok: false, reason: "هذا الرابط مستخدم — جرّب اسماً آخر" };
  return { ok: true };
}

/** يبحث عن slug متاحٍ قريبٍ من المقترح (يضيف رقماً إن لزم). */
export async function availableSlug(base: string): Promise<string> {
  const seed = suggestSlug(base);
  if ((await checkSlug(seed)).ok) return seed;
  for (let i = 2; i <= 99; i++) {
    const candidate = `${seed}-${i}`.slice(0, 40);
    if ((await checkSlug(candidate)).ok) return candidate;
  }
  return `${seed}-${Date.now().toString(36).slice(-4)}`;
}

/** كلمةُ مرورٍ مولَّدة للوحة أدمن المنصّة — ١٦ حرفاً بلا ملتبسات. */
export function generatePassword(): string {
  const alpha = "abcdefghijkmnpqrstuvwxyz";
  const upper = "ABCDEFGHJKLMNPQRSTUVWXYZ";
  const digit = "23456789";
  const all = alpha + upper + digit;
  const crypto = require("crypto") as typeof import("crypto");
  const pick = (set: string) => set[crypto.randomInt(set.length)];
  /* يضمن حرفاً كبيراً ورقماً — سياسةُ كلمة المرور في `lib/guard.ts` */
  let out = pick(upper) + pick(digit) + pick(alpha);
  for (let i = 0; i < 13; i++) out += pick(all);
  return out.split("").sort(() => crypto.randomInt(3) - 1).join("");
}
