import "server-only";
import { hubGet, hubSet } from "./store";

/**
 * تسليمُ بيانات الدخول — مرّةً واحدة.
 * ------------------------------------------------------------------
 * كلمةُ المرور المولَّدة تُخزَّن في المنصّة **مُجزّأةً** فلا تُقرأ. لكنّ
 * المدرّسَ يحتاج نصَّها مرّةً ليدخل. فتُحفظ هنا نصّاً لحظةً واحدةً بين
 * التجهيز والكشف، ثمّ **تُحذف بمجرّد أن تُقرأ**.
 *
 * وهذا مقايضةٌ واعية: نصٌّ في القاعدة دقائقَ معدودة، مقابلَ ألّا تمرّ
 * كلمةُ المرور في رابطٍ ولا بريدٍ غير مؤمَّن. والكشفُ لصاحب الجلسة وحدَه.
 */

type Delivery = { password: string; adminEmail: string; createdAt: string };

export async function storeDelivery(tenantId: string, d: Delivery): Promise<void> {
  await hubSet(`deliveries/${tenantId}`, d);
}

/** يقرأ التسليمَ **ويحذفه** — فلا يُكشف مرّتين. */
export async function revealDelivery(tenantId: string): Promise<Delivery | null> {
  const d = await hubGet<Delivery>(`deliveries/${tenantId}`);
  if (d) await hubSet(`deliveries/${tenantId}`, null);
  return d;
}
