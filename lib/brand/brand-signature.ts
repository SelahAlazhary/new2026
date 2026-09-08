/**
 * اسمُ الأستاذ توقيعاً.
 * ------------------------------------------------------------------
 * الاسمُ في الرأس كان يُكتب بخطّ العناوين كأيّ عنوان. والتوقيعُ شيءٌ
 * آخر: هو **أثرُ يدٍ** لا حرفٌ مطبوع — فيه ميلٌ وخطٌّ تحته وحركةُ قلم.
 *
 * **ولماذا خطُّ الرقعة؟** لأنّه خطُّ المكاتبة والتوقيع في العربية
 * تاريخياً — لا الكوفيُّ ولا الثلث. وهو الأقربُ إلى ما تكتبه اليدُ
 * فعلاً، فلا يبدو الاسمُ خطّاً زخرفياً مُتكلَّفاً بل إمضاءً.
 *
 * والخطُّ يُستضاف مع البناء (`next/font`) لا يُجلَب وقتَ العرض — فلا
 * ينتظره الزائر ولا يُفتقد إن سقطت شبكةُ جوجل.
 */

export type SigStyle =
  | "off"        // الاسم كما هو — بخطّ العناوين
  | "plain"      // بخطّ الرقعة وحده
  | "underline"  // وتحته خطٌّ مستقيم
  | "flourish"   // وتحته خطٌّ ينساب كذيل التوقيع
  | "tilt"       // مائلٌ قليلاً كما تميل اليد
  | "stamp";     // مائلٌ بذيلٍ وحبرٍ أغمق — أقربُ ما يكون لإمضاء

export type Signature = {
  id: SigStyle;
  name: string;
  hint: string;
  /** هل يُرسم الذيلُ تحته. */
  tail: "none" | "rule" | "swash";
  /** ميلٌ بالدرجات. */
  tilt: number;
};

function s(id: SigStyle, name: string, hint: string, tail: Signature["tail"], tilt: number): Signature {
  return { id, name, hint, tail, tilt };
}

export const SIGNATURES: Signature[] = [
  s("off", "بلا توقيع", "الاسم بخطّ العناوين كما كان", "none", 0),
  s("plain", "الرقعة", "خطُّ المكاتبة العربي — بلا زخرفة", "none", 0),
  s("underline", "الرقعة وخطّ", "خطٌّ مستقيمٌ تحت الاسم", "rule", 0),
  s("flourish", "الرقعة بذيل", "ذيلٌ ينساب تحته كتوقيع", "swash", 0),
  s("tilt", "المائل", "ميلةٌ خفيفةٌ كما تميل اليد", "none", -4),
  s("stamp", "الإمضاء", "مائلٌ بذيلٍ — أقربُ ما يكون لإمضاء", "swash", -5),
];

export const DEFAULT_SIGNATURE: SigStyle = "off";

export function findSignature(id?: string): Signature {
  return SIGNATURES.find((x) => x.id === id) ?? SIGNATURES[0];
}

export function signatureClass(x: Signature): string {
  return x.id === "off" ? "" : `sig sig-${x.id}`;
}
