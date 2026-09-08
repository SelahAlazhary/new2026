/**
 * موافقةُ الكوكيز — وما تعنيه هنا فعلاً.
 * ------------------------------------------------------------------
 * أكثرُ لوافتِ الكوكيز على الشبكة كاذبة: تعرض «ضروريّ» و«تحليلات»
 * و«إعلانات» وتُسجّل الاختيارَ ثمّ لا تغيّر شيئاً. وهذه لا تفعل ذلك.
 *
 * **وما تستعمله هذه المنصّة معلومٌ ومحصور:**
 *
 * ــ **كوكي الجلسة** (`httpOnly`, `sameSite=lax`): هو الذي يُبقيك داخلاً.
 *   وبلا حفظه لا يوجد تسجيلُ دخول أصلاً — فهو ضروريٌّ لا يُستأذَن فيه،
 *   وهذا موقفُ اللائحة الأوروبية نفسِها من الكوكي الضروريّ.
 *
 * ــ **كوكي مؤقّتة لربط جوجل**: تُكتب لحظةَ الربط وتُمحى بعده.
 *
 * ــ **تفضيلاتٌ في جهازك** (تخزينٌ محلّيٌّ لا كوكي، ولا يُرسَل للخادم):
 *   المظهرُ الفاتح والداكن، والأقسامُ التي فتحتَها، وما شاهدتَه من دروس.
 *
 * **ولا شيءَ غيرَ ذلك**: لا تحليلات، ولا إعلانات، ولا كوكيَ طرفٍ ثالث،
 * ولا بكسل تتبّع. فلا يُعرض خيارٌ لِما لا وجودَ له.
 *
 * **والخيارُ المعروضُ يعمل**: من اختار «الضروريّ فقط» لا تُكتب تفضيلاتُه
 * في جهازه — يبقى الموقعُ عاملاً، ولا يُتذكَّر شيءٌ بين الزيارات.
 */

export type Consent = "all" | "essential";

export const CONSENT_KEY = "mk.consent";

/** حدثٌ يُطلَق عند تغيّر الموافقة — تسمعه المكوّنات فتُعيد قراءتها. */
export const CONSENT_EVENT = "mk-consent-change";

/** ما اختاره الزائر، أو `null` إن لم يُسأل بعد. */
export function readConsent(): Consent | null {
  if (typeof window === "undefined") return null;
  try {
    const v = localStorage.getItem(CONSENT_KEY);
    return v === "all" || v === "essential" ? v : null;
  } catch {
    /*
      المتصفّحُ قد يمنع التخزينَ كلَّه (نافذةٌ خاصّة، أو إعدادٌ صارم).
      وعندها لا يُحفَظ اختيارٌ ولا يُقرأ — والموقعُ يعمل، واللافتةُ تظهر
      في كلّ زيارة. وهذا أصدقُ من ادّعاء موافقةٍ لم تُحفظ.
    */
    return null;
  }
}

export function writeConsent(v: Consent): void {
  try {
    localStorage.setItem(CONSENT_KEY, v);
  } catch { /* تجاهل */ }
  try {
    window.dispatchEvent(new CustomEvent(CONSENT_EVENT, { detail: v }));
  } catch { /* تجاهل */ }
}

/**
 * هل يُسمح بحفظ تفضيلٍ في الجهاز؟
 * ------------------------------------------------------------------
 * قبل السؤال: **نعم**. اللافتةُ تُعرض عند أوّل زيارة، ومنعُ الحفظ قبل
 * الإجابة يُفقد المظهرَ الذي بدّله الزائرُ في الثانية الأولى — وهو ليس
 * تتبّعاً ولا يخرج من جهازه. وبعد الاختيار يُحترم الاختيار.
 *
 * وهذه هي البوّابةُ الوحيدة: كلُّ كاتبٍ للتفضيلات يمرّ منها، فلا يبقى
 * موضعٌ يكتب متجاوزاً الاختيار.
 */
export function mayStorePrefs(): boolean {
  return readConsent() !== "essential";
}

/** حفظُ تفضيلٍ — يُهمَل إن لم يُسمح، ولا يرمي أبداً. */
export function setPref(key: string, value: string): void {
  if (!mayStorePrefs()) return;
  try { localStorage.setItem(key, value); } catch { /* تجاهل */ }
}

/** قراءةُ تفضيل — تقرأ دائماً: ما كُتب قبل المنع لا يُخفى عن صاحبه. */
export function getPref(key: string): string | null {
  try { return localStorage.getItem(key); } catch { return null; }
}

/**
 * محوُ التفضيلات المحفوظة — يُنفَّذ عند اختيار «الضروريّ فقط».
 * والاختيارُ بلا محوٍ نصفُ وفاء: يمنع الجديدَ ويُبقي القديم.
 * ومفتاحُ الموافقةِ نفسُه يبقى، وإلّا سُئل الزائرُ في كلّ زيارة عن شيءٍ
 * قد أجاب عنه.
 */
export function clearPrefs(keep: string[] = [CONSENT_KEY]): void {
  try {
    const drop: string[] = [];
    for (let i = 0; i < localStorage.length; i++) {
      const k = localStorage.key(i);
      if (k && !keep.includes(k)) drop.push(k);
    }
    drop.forEach((k) => localStorage.removeItem(k));
  } catch { /* تجاهل */ }
}
