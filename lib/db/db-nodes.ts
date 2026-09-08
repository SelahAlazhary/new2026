import "server-only";
import type { DbNode } from "@/lib/utils/types";

/**
 * قواعد البيانات — واحدةٌ رئيسية وفروعٌ تحلّ محلَّها.
 * ------------------------------------------------------------------
 * الغرضان اللذان بُنيت لهما:
 *   • **السعة**: قاعدةٌ واحدة تمتلئ، والفروعُ تستوعب ما بعدها.
 *   • **الاستمرار**: إن تعطّلت الرئيسية أو امتلأت تولّى فرعٌ مكانَها
 *     تلقائياً بلا تدخّل — الموقعُ لا ينتظر أحداً ليعمل.
 *
 * **مسألةُ الدجاجة والبيضة.** قائمةُ الفروع تُحفظ داخل القاعدة نفسها،
 * فكيف تُقرأ والرئيسيةُ معطّلة؟ الجواب: كلُّ قاعدةٍ تحمل نسخةً كاملة —
 * ومنها القائمةُ نفسُها. فأيُّ قاعدةٍ تردّ تعرف أخواتِها. وتبقى قاعدةٌ
 * واحدة على الأقلّ في متغيّرات البيئة تصلح مدخلاً حين لا يُعرف شيء بعد.
 *
 * **وحالةُ الصحّة في الذاكرة لا في القاعدة.** كتابةُ «هذه معطّلة» في
 * قاعدةٍ معطّلة عبثٌ؛ وحفظُها في الذاكرة يعني أن كلّ نسخةٍ من الخادم
 * تكتشف العطل بنفسها — وهو الصواب، فالعطلُ قد يكون شبكياً بين نسخةٍ
 * وقاعدة لا عطلاً في القاعدة.
 */

/** كم يبقى العطل مسجّلاً قبل إعادة المحاولة. */
const COOLDOWN = 60_000;

/** حالةٌ عابرة لكل قاعدة — لا تُحفَظ. */
type Health = { failedAt: number; error: string; bytes?: number; open?: boolean; at?: number };
const health = new Map<string, Health>();

/** القاعدة المضبوطة في متغيّرات البيئة — المدخلُ الذي لا يعتمد على شيء. */
export function envNode(): DbNode | null {
  const url = process.env.FIREBASE_DATABASE_URL?.trim();
  if (!url) return null;
  return {
    id: "env",
    name: "القاعدة الأساسية (من الاستضافة)",
    url: url.replace(/\/$/, ""),
    clientEmail: process.env.FIREBASE_CLIENT_EMAIL?.trim(),
    privateKey: process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, "\n").trim(),
    secret: process.env.FIREBASE_DATABASE_SECRET?.trim(),
    role: "primary",
    enabled: true,
  };
}

/**
 * ترتيب القواعد للمحاولة.
 * الرئيسيةُ أوّلاً ثم الفروع بترتيبها، والمعطَّلةُ حديثاً تُؤخَّر لا
 * تُحذف — فقد يكون العطلُ لحظةً عابرة.
 */
export function orderNodes(stored: DbNode[] | undefined, now = Date.now()): DbNode[] {
  const env = envNode();
  const list = [...(stored ?? [])].filter((n) => n.enabled && n.url);

  /* قاعدةُ البيئة تُدرَج ما لم تُذكر بعنوانها في القائمة المحفوظة. */
  if (env && !list.some((n) => sameUrl(n.url, env.url))) list.unshift(env);

  const rank = (n: DbNode) => {
    const h = health.get(n.url);
    const down = h && now - h.failedAt < COOLDOWN ? 1000 : 0;
    return down + (n.role === "primary" ? 0 : 1) + (n.order ?? 0) / 1000;
  };
  return list.sort((a, b) => rank(a) - rank(b));
}

function sameUrl(a: string, b: string): boolean {
  return a.replace(/\/$/, "").toLowerCase() === b.replace(/\/$/, "").toLowerCase();
}

/** تُعلَّم قاعدةٌ معطّلة فتُؤخَّر عن التالية. */
export function markDown(url: string, error: string) {
  const prev = health.get(url);
  health.set(url, {
    failedAt: Date.now(),
    error: error.slice(0, 200),
    bytes: prev?.bytes,
    open: prev?.open,
    at: Date.now(),
  });
}

/**
 * تُعلَّم قاعدةٌ مفتوحةُ القواعد.
 * وهذه ليست حالةَ عطل: القاعدةُ تعمل تماماً — وهذا وجهُ الخطر. فتُحفظ
 * منفصلةً عن العطل فلا تُرتَّب بها ولا تُستبعَد، وتُعرض تحذيراً.
 */
export function markOpen(url: string, open: boolean) {
  const prev = health.get(url) ?? { failedAt: 0, error: "" };
  health.set(url, { ...prev, open, at: Date.now() });
}

/** تُعلَّم سليمة فتعود إلى مكانها. */
export function markUp(url: string, bytes?: number) {
  const prev = health.get(url);
  health.set(url, { failedAt: 0, error: "", bytes: bytes ?? prev?.bytes, open: prev?.open, at: Date.now() });
}

/** حالةُ قاعدة الآن — للعرض في اللوحة. */
export function nodeHealth(url: string, now = Date.now()) {
  const h = health.get(url);
  if (!h) {
    return {
      ok: null as boolean | null,
      error: "",
      bytes: undefined as number | undefined,
      open: false,
      at: 0,
    };
  }
  const down = h.failedAt > 0 && now - h.failedAt < COOLDOWN;
  return { ok: !down, error: down ? h.error : "", bytes: h.bytes, open: Boolean(h.open), at: h.at ?? 0 };
}

/**
 * هل امتلأت؟
 * ------------------------------------------------------------------
 * فايربيز لا يعطي حجمَ القاعدة عبر REST، فالحجمُ يُقاس بما نقرؤه فعلاً
 * — وهو الحجمُ الذي يهمّنا على أي حال، فهو ما يُنقل في كل قراءة.
 * والسعةُ تُضبط لكل قاعدة، وتجاوزُ عتبتها ينقل الكتابةَ إلى التالية.
 */
export function isFull(n: DbNode): boolean {
  const cap = n.capacityMB ?? 0;
  if (cap <= 0) return false;
  const bytes = health.get(n.url)?.bytes ?? 0;
  return bytes > cap * 1024 * 1024 * 0.92;   // ٩٢٪ — يُنتقل قبل الامتلاء لا بعده
}

/** نسبةُ الامتلاء للعرض (٠..١٠٠) أو null إن لم تُضبط سعة. */
export function fillPercent(n: DbNode): number | null {
  const cap = n.capacityMB ?? 0;
  if (cap <= 0) return null;
  const bytes = health.get(n.url)?.bytes ?? 0;
  return Math.min(100, Math.round((bytes / (cap * 1024 * 1024)) * 100));
}

/** القاعدةُ التي يُكتب فيها الآن: أوّلُ سليمةٍ غيرِ ممتلئة. */
export function writeTarget(stored: DbNode[] | undefined): DbNode | null {
  const ordered = orderNodes(stored);
  return ordered.find((n) => !isFull(n)) ?? ordered[0] ?? null;
}
