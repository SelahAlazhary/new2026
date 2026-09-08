import "server-only";
import { fbGet, fbSet } from "@/lib/db/firebase";
import { firebaseUsable } from "@/lib/db/store";
import { CAP } from "@/lib/business/activity";
import type { Activity } from "@/lib/utils/types";
import { tenantPath } from "@/lib/hub/context";

/**
 * سجلُّ النشاط — خارج قاعدة المنصّة عمداً.
 * ------------------------------------------------------------------
 * قاعدةُ المنصّة تُقرأ **كاملةً** في كل طلب (بذاكرةٍ مؤقّتة لخمس عشرة
 * ثانية). فلو سكن السجلُّ فيها لكان ثمنُه ستّةَ كيلوبايت لكل طالب
 * تُقرأ في كل مرّة: عند خمسة آلاف طالب واحدٌ وثلاثون ميجابايت في كل
 * قراءة — لا في التخزين وحده بل في الشبكة والذاكرة معاً.
 *
 * ولذلك يسكن في مسارٍ مستقلّ لكل طالب: يُكتب عند نشاطه، ولا يُقرأ إلا
 * حين يفتح المشرفُ تقريرَه. والقاعدةُ الرئيسية تحتفظ بالمجاميع وحدها
 * (آخر ظهور · عدد الزيارات · الدقائق) وهي عشراتُ البايتات لا آلافُها.
 *
 * وبلا فايربيز تعمل المنصّة كما هي بلا سجلّ — التتبّعُ إضافةٌ لا شرط.
 */

function path(userId: string): string {
  /* المعرّفات مقيّدة الشكل أصلاً، والتنقية هنا حرصٌ على ألّا يخرج
     مسارٌ عن جذره مهما جاء المعرّفُ من حيث جاء. والجذرُ تحت منصّة
     الطالب: `tenants/{id}/activity/{uid}`. */
  return tenantPath(`activity/${userId.replace(/[^A-Za-z0-9_-]/g, "")}`);
}

/** سجلُّ طالب — الأحدث أوّلاً، أو فارغٌ إن لم يوجد. */
export async function readActivity(userId: string): Promise<Activity[]> {
  if (!firebaseUsable() || !userId) return [];
  try {
    const list = await fbGet<Activity[]>(path(userId));
    return Array.isArray(list) ? list : [];
  } catch {
    return [];   // السجلُّ ليس شرطاً لعرض التقرير
  }
}

/**
 * يُضيف حدثاً إلى حلقة الطالب.
 * القراءةُ قبل الكتابة مقصورةٌ على حلقةٍ واحدة صغيرة، لا على القاعدة.
 */
export async function appendActivity(userId: string, a: Activity): Promise<void> {
  if (!firebaseUsable() || !userId) return;
  try {
    const list = await readActivity(userId);
    await fbSet(path(userId), [a, ...list].slice(0, CAP));
  } catch {
    /* التتبّعُ لا يُفشِل طلباً */
  }
}

/** يُمحى مع الحساب — السجلُّ يحمل ما فعله صاحبُه، فلا يبقى بعده. */
export async function dropActivity(userId: string): Promise<void> {
  if (!firebaseUsable() || !userId) return;
  try {
    await fbSet(path(userId), null);
  } catch {
    /* تجاهل */
  }
}
