/**
 * حالةُ الحفظ — مذياعٌ صغيرٌ تسمعه الواجهة.
 * ------------------------------------------------------------------
 * `save()` كانت تُرجع `true`/`false`، **ولا مستدعيَ واحدٌ يفحصها**. فإن
 * فشل الحفظ — انقطاعُ شبكةٍ، أو صلاحيةٌ ناقصة، أو خادمٌ ردّ بخطأ — أُعيد
 * تحميلُ البيانات صامتاً فعاد الحقلُ إلى ما كان، ولا يُقال شيء. فيظنّ
 * الأستاذُ أنّه حفظ وهو لم يحفظ، أو يظنّ الحقلَ لا يقبل التعديل.
 *
 * وهذا لا يُصلَح بفحص القيمة في كلّ مستدعٍ: المواضعُ عشراتٌ، وسيُنسى
 * بعضُها، وسيُنسى في كلّ ما يُكتب غداً. فيُنقل الإبلاغُ إلى `save()`
 * نفسِها، وتسمعه الواجهةُ من هنا.
 *
 * **والنجاحُ هادئٌ والفشلُ عالٍ.** الحفظُ يقع عند كلّ مغادرةِ حقل، ونافذةٌ
 * تُهنّئ بكلّ حفظٍ تصير ضجيجاً يُتعلَّم تجاهلُه — ومعه يُتجاهل الخطأ. فحالةٌ
 * صغيرةٌ في شريط الأدوات للنجاح، ولوحٌ ظاهرٌ لا يُغلق نفسَه للفشل.
 *
 * **ولا React هنا**: مذياعٌ من وحدةٍ عاديّة، فتناديه `save()` وهي دالّةٌ
 * في مزوّدٍ لا يعرف الواجهةَ التي تعرض الحالة.
 */

export type SaveState =
  | { kind: "idle" }
  | { kind: "saving" }
  | { kind: "saved"; at: number }
  /**
   * `title` عنوانُ اللوح. اللوحُ نفسُه يخدم الحفظَ وغيرَه — ومنذ صار
   * `ErrorWatch` يبثّ فيه الإخفاقاتِ الصامتة لم يعد كلُّ خطأٍ حفظاً،
   * وقولُ «لم يُحفظ التعديل» لعطبِ عمليّةٍ أخرى يوجّه القارئَ إلى
   * الموضع الخطأ. فالافتراضُ للحفظ، ومن أراد غيرَه سمّاه.
   */
  | { kind: "error"; message: string; title?: string; at: number };

type Listener = (s: SaveState) => void;

let current: SaveState = { kind: "idle" };
const listeners = new Set<Listener>();

export function getSaveState(): SaveState {
  return current;
}

export function onSaveState(fn: Listener): () => void {
  listeners.add(fn);
  return () => { listeners.delete(fn); };
}

function emit(s: SaveState) {
  current = s;
  listeners.forEach((fn) => fn(s));
}

export function saveStarted() {
  emit({ kind: "saving" });
}

export function saveSucceeded() {
  emit({ kind: "saved", at: Date.now() });
}

export function saveFailed(message: string, title?: string) {
  emit({ kind: "error", message, title, at: Date.now() });
}

/** يُطفأ الإبلاغُ الهادئ بعد حين — والخطأُ لا يُطفأ إلّا بقراءته. */
export function saveSettled() {
  if (current.kind === "saved") emit({ kind: "idle" });
}
