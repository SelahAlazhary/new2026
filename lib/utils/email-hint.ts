/**
 * تصحيحُ خطأ النطاق في البريد.
 * ------------------------------------------------------------------
 * أكثرُ ما يُفشل الدخولَ ليس نسيانَ كلمة المرور — بل حرفاً في النطاق:
 * `gmial.com` و`gmai.com` و`hotmial.com`. والخادمُ يردّ «بيانات الدخول
 * غير صحيحة» — وهو صادقٌ ولا يفيد: الطالبُ يُعيد كتابةَ كلمة المرور
 * مرّاتٍ وهي صحيحة، حتّى يُقفل عليه الحساب.
 *
 * **ولا يُصحَّح تلقائياً.** التصحيحُ من تلقاء النفس يُفسد بريداً صحيحاً
 * على نطاقٍ يشبه المشهور، وصاحبُه لا يدري لماذا لا يدخل. فيُعرض
 * الاقتراحُ ويُترك القرارُ له.
 *
 * **والقياسُ بمسافة التحرير** (عدد الإضافات والحذوفات والإبدالات التي
 * تحوّل نصّاً إلى آخر): حرفٌ أو حرفان يُقترح، وأكثرُ من ذلك نطاقٌ آخرُ
 * لا خطأٌ مطبعيّ.
 */

const COMMON = [
  "gmail.com", "hotmail.com", "outlook.com", "yahoo.com", "icloud.com",
  "live.com", "protonmail.com", "aol.com", "mail.com", "yandex.com",
];

/** مسافةُ التحرير — تنفيذٌ بصفَّين لا بمصفوفةٍ كاملة. */
function distance(a: string, b: string): number {
  if (a === b) return 0;
  if (!a.length || !b.length) return Math.max(a.length, b.length);
  let prev = Array.from({ length: b.length + 1 }, (_, i) => i);
  for (let i = 1; i <= a.length; i++) {
    const cur = [i];
    for (let j = 1; j <= b.length; j++) {
      cur[j] = Math.min(
        prev[j] + 1,
        cur[j - 1] + 1,
        prev[j - 1] + (a[i - 1] === b[j - 1] ? 0 : 1)
      );
    }
    prev = cur;
  }
  return prev[b.length];
}

/**
 * بريدٌ مقترَحٌ بدل المكتوب، أو `null` إن كان سليماً أو بعيداً عن المشهور.
 * ولا يُقترح شيءٌ للنطاق المطابق: `gmail.com` صحيحٌ فلا يُقترح عليه.
 */
export function emailHint(raw: string): string | null {
  const v = raw.trim().toLowerCase();
  const at = v.lastIndexOf("@");
  if (at <= 0 || at === v.length - 1) return null;

  const local = v.slice(0, at);
  const domain = v.slice(at + 1);
  if (COMMON.includes(domain)) return null;
  /* نطاقٌ بلا نقطةٍ ناقصٌ أصلاً — ولا يُقاس عليه */
  if (!domain.includes(".")) return null;

  let best: { d: string; n: number } | null = null;
  for (const d of COMMON) {
    const n = distance(domain, d);
    if (n <= 2 && (!best || n < best.n)) best = { d, n };
  }
  return best ? `${local}@${best.d}` : null;
}
