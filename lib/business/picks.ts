/**
 * الصلاحياتُ المختارة — خطّةٌ تفتح ما يُؤشَّر عليه بعينه.
 * ------------------------------------------------------------------
 * كانت الخطّةُ تفتح واحداً من ثلاثة: كلَّ المواد، أو فصلاً كاملاً، أو
 * كورساً بعينه. وهي ثلاثةُ أحجامٍ ثابتةٍ لا رابعَ لها — ومن أراد «هذين
 * الكورسين ومادّتَين من ثالث» لم يجد ما يعبّر عنه، فيُنشئ خططاً كثيرةً
 * متداخلةً لا يعرف الطالبُ أيَّها يشتري.
 *
 * فأُضيف نطاقٌ رابع: **مختارة**. الأستاذُ يؤشّر على ما تفتحه الخطّةُ في
 * شجرة المنهج — كورساً كاملاً، أو مادّةً بعينها داخلَه — والخطّةُ تفتح
 * ما أُشّر عليه لا أكثر.
 *
 * **والمفتاحُ نصٌّ واحدٌ لا حقلان.** الاشتراكُ يُخزَّن في `subjectId` وهو
 * نصّ، وقد حمل قبلَ اليوم `"*"` للكلّ و`"T1"` للفصل ومعرّفَ الكورس. فتُتبع
 * السنّةُ نفسُها: `"SUB-1::u-2"` للمادّة. ولا يُضاف حقلٌ إلى الاشتراكات
 * القديمة كلِّها ولا تُرحَّل القاعدة.
 *
 * والفاصلُ `::` لا `:` ولا `/`: معرّفاتُ الكورسات تُولَّد `SUB-<وقت>` وقد
 * تحمل شرطةً، والفاصلُ المضاعفُ لا يقع في معرّفٍ مولَّد فلا يلتبس.
 */

export const PICK_SEP = "::";

/** مفتاحُ صلاحيةٍ: كورسٌ كامل، أو مادّةٌ داخلَه. */
export function pickKey(subjectId: string, unitId?: string): string {
  return unitId ? `${subjectId}${PICK_SEP}${unitId}` : subjectId;
}

/** يفكّ المفتاحَ إلى جزأيه. */
export function parsePick(key: string): { subjectId: string; unitId?: string } {
  const i = key.indexOf(PICK_SEP);
  if (i < 0) return { subjectId: key };
  return { subjectId: key.slice(0, i), unitId: key.slice(i + PICK_SEP.length) };
}

/** هل هذا المفتاحُ يخصّ مادّةً بعينها لا كورساً كاملاً؟ */
export function isUnitKey(key: string): boolean {
  return key.includes(PICK_SEP);
}

/**
 * هل تفتح هذه المجموعةُ من المفاتيح الكورسَ كلَّه؟
 * مفتاحُ الكورس وحدَه يفتحه؛ ومفاتيحُ موادِّه تفتح موادَّها لا غير.
 */
export function picksOpenCourse(picks: string[] | undefined, subjectId: string): boolean {
  return (picks ?? []).includes(subjectId);
}

/** هل تفتح هذه المجموعةُ هذه المادّةَ — بمفتاحها أو بمفتاح كورسها؟ */
export function picksOpenUnit(picks: string[] | undefined, subjectId: string, unitId: string): boolean {
  const p = picks ?? [];
  return p.includes(subjectId) || p.includes(pickKey(subjectId, unitId));
}

/**
 * وصفٌ مقروءٌ لِما تفتحه الخطّة — يُكتب على بطاقتها وفي اللوحة.
 * والعدُّ لا التعداد: خطّةٌ تفتح إحدى عشرةَ مادّةً لا يُكتب اسمُها كلُّها
 * في شارةٍ صغيرة.
 */
export function picksLabel(
  picks: string[] | undefined,
  subjects: { id: string; name: string; units?: { id: string; title: string }[] }[]
): string {
  const p = picks ?? [];
  if (p.length === 0) return "لم يُختَر شيء بعد";

  const courses = p.filter((k) => !isUnitKey(k));
  const units = p.filter(isUnitKey);

  const parts: string[] = [];
  if (courses.length === 1) {
    parts.push(subjects.find((s) => s.id === courses[0])?.name ?? "كورس");
  } else if (courses.length > 1) {
    parts.push(`${courses.length.toLocaleString("ar-EG")} كورسات كاملة`);
  }
  if (units.length === 1) {
    const { subjectId, unitId } = parsePick(units[0]);
    const s = subjects.find((x) => x.id === subjectId);
    parts.push(s?.units?.find((u) => u.id === unitId)?.title ?? "مادّة");
  } else if (units.length > 1) {
    parts.push(`${units.length.toLocaleString("ar-EG")} مادّة`);
  }
  return parts.join(" · ");
}
