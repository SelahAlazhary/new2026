import type { PayMethod, PayRequest, SitePlan, Subject } from "@/lib/utils/types";
import { planPrice } from "@/lib/business/plans";

/**
 * منطق بوّابة الدفع المشترك بين المتصفّح والخادم.
 * ------------------------------------------------------------------
 * كل تحقّق هنا يُستدعى مرّتين: في الواجهة ليرى الطالب خطأه فوراً، وفي
 * الخادم لأن الواجهة لا تُؤتمَن. مصدر واحد فلا تفترق القاعدتان.
 */

/** أيقونة/تسمية نوع الطريقة. */
export const KIND_LABEL: Record<string, string> = {
  wallet: "محفظة هاتف",
  bank: "حساب بنكي",
  instapay: "إنستاباي",
  fawry: "فوري",
  link: "رابط دفع",
  other: "تحويل",
};

/** اسم الحقل الذي يُحوَّل إليه — يختلف باختلاف النوع فلا يصحّ توحيده. */
export function numberLabel(kind: string): string {
  switch (kind) {
    case "bank": return "رقم الحساب / IBAN";
    case "instapay": return "عنوان إنستاباي";
    case "fawry": return "كود فوري";
    case "link": return "رابط الدفع";
    case "wallet": return "رقم المحفظة";
    default: return "بيانات التحويل";
  }
}

/** تطبيع الأرقام العربية إلى لاتينية — الطالب يكتب بلوحة عربية كثيراً. */
export function normalizeDigits(v: string): string {
  return (v ?? "").replace(/[٠-٩]/g, (d) => String("٠١٢٣٤٥٦٧٨٩".indexOf(d)));
}

/**
 * هل تعمل بوّابة الدفع؟
 * ------------------------------------------------------------------
 * البوّابة بلا طريقة دفع واحدة شاشةٌ فارغة يقف عندها الطالب، فوجودُ
 * طريقةٍ مفعَّلة شرطٌ لعملها لا مجرّد تحسين.
 *
 * والتشغيل قرارٌ صريح من اللوحة: لا تعمل البوّابة بمجرّد إضافة طريقة،
 * ولا تُفاجئ الطالبَ بمسار شراءٍ لم يُراجَع بعد.
 */
export function gatewayOn(cfg?: { enabled?: boolean; methods?: PayMethod[] }): boolean {
  /* التفعيل قرارٌ صريح — لا تعمل البوّابة حتى تُشغَّل من اللوحة. */
  if (cfg?.enabled !== true) return false;
  /* ومفعَّلةً بلا طريقة دفع تبقى شاشةً فارغة يقف عندها الطالب، فيعود
     الشراء إلى واتساب حتى تُضاف طريقة واحدة على الأقلّ. */
  return activeMethods(cfg.methods).length > 0;
}

/** الطرق المعروضة للطالب — المفعَّلة وحدها، مرتّبة. */
export function activeMethods(list: PayMethod[] | undefined): PayMethod[] {
  return (list ?? [])
    .filter((m) => m.active && (m.number ?? "").trim())
    .sort((a, b) => (a.order ?? 0) - (b.order ?? 0));
}

/** سعر الخطة النهائي — البوّابة تحسبه من الخطة لا من الواجهة. */
export function planAmount(plan: SitePlan): number {
  return planPrice(plan).price;
}

/**
 * نطاق الخطة كمعرّف كورس — يطابق ما تفعله أكواد التفعيل:
 * «كل المواد» = *، «فصل دراسي» = T1/T2، وإلا معرّف الكورس.
 */
export function planTarget(plan: SitePlan, fallbackSubjectId?: string): string {
  if (plan.scope === "all") return "*";
  if (plan.scope === "term") return `T${plan.termNo ?? 1}`;
  return plan.subjectId || fallbackSubjectId || "";
}

export function targetName(target: string, subjects: Subject[]): string {
  if (target === "*") return "كل المواد";
  if (/^T[12]$/.test(target)) return `كل مواد الفصل ${target === "T2" ? "الثاني" : "الأول"}`;
  return subjects.find((s) => s.id === target)?.name ?? "كورس";
}

/**
 * ما يُطلب من المحوِّل يتبع طريقةَ التحويل.
 * ------------------------------------------------------------------
 * كان الحقلُ واحداً لكلّ الطرق: «الرقم أو الحساب الذي حوّلت منه»
 * بلوحةٍ رقميّة. وهو صحيحٌ للمحفظة وحدَها.
 *
 * فمن حوّل بإنستاباي أو بحوالةٍ بنكيّة ليس عنده «رقمٌ» يكتبه: عنده
 * رقمُ حسابٍ، أو اسمُ مستخدمٍ فيه نقطةٌ وحروفٌ لاتينيّة، أو اسمُه
 * كما ظهر في الحوالة. ولوحةٌ رقميّةٌ تفتح له لا تكتب شيئاً من ذلك.
 */
export function senderIsPhone(kind?: string): boolean {
  return kind === "wallet" || kind === "fawry";
}

/** عنوانُ الحقل بحسب الطريقة. */
export function senderLabel(kind?: string): string {
  return senderIsPhone(kind)
    ? "رقم الهاتف الذي حوّلت منه"
    : "حسابك أو اسم المستخدم أو اسمك";
}

/** ما يُكتب في الحقل مثالاً. */
export function senderPlaceholder(kind?: string): string {
  switch (kind) {
    case "wallet":
    case "fawry": return "01xxxxxxxxx";
    case "instapay": return "name@instapay أو اسمك كما في الحوالة";
    case "bank": return "رقم الحساب أو IBAN أو اسمك كما في الحوالة";
    default: return "حسابك أو اسمك كما ظهر في التحويل";
  }
}

/**
 * فحصُ ما كُتب.
 * رقمُ الهاتف المصريّ أحدَ عشرَ رقماً لا أقلَّ ولا أكثر — وعشرةٌ أو اثنا
 * عشرَ خطأُ كتابةٍ يُبطل مطابقةَ التحويل في كشف الحساب، فيُردّ الطلبُ
 * وقد دفع الطالبُ فعلاً. والفحصُ هنا يمنعه قبل الإرسال لا بعده.
 *
 * وغيرُ الهاتف لا يُقاس بعدد: رقمُ حسابٍ واسمُ مستخدمٍ واسمٌ عربيٌّ
 * أطوالُها مختلفة، فيكفي ألّا يكون فارغاً ولا حرفاً واحداً.
 */
export function senderProblem(kind: string | undefined, raw: string): string | null {
  const v = (raw ?? "").trim();
  if (!v) return senderIsPhone(kind)
    ? "اكتب رقم الهاتف الذي حوّلت منه"
    : "اكتب حسابك أو اسم المستخدم أو اسمك";

  if (senderIsPhone(kind)) {
    const digits = normalizeDigits(v).replace(/\D/g, "");
    if (digits.length !== 11) return "رقم الهاتف أحدَ عشرَ رقماً — راجِعه";
    return null;
  }
  if (v.length < 3) return "اكتب حسابك أو اسم المستخدم أو اسمك كاملاً";
  return null;
}

/** ما ينقص الطلب — نصّ عربي واحد أو null إن كان سليماً. */
export function requestProblem(
  f: { methodId?: string; methodKind?: string; senderName?: string; senderAccount?: string; receipt?: string },
  rules: { requireReceipt?: boolean; requireSender?: boolean }
): string | null {
  if (!(f.methodId ?? "").trim()) return "اختر طريقة الدفع";
  /*
    الرقم المُحوَّل منه هو ما يُطابَق به التحويل في كشف الحساب — بدونه
    تبقى المراجعة تخميناً، فهو مطلوب دائماً لا بحسب الإعداد. وشكلُه
    يتبع الطريقة — انظر `senderProblem`.
  */
  const sender = senderProblem(f.methodKind, f.senderAccount ?? "");
  if (sender) return sender;
  if (rules.requireSender !== false && !(f.senderName ?? "").trim()) {
    return "اكتب اسم من حوّل المبلغ";
  }
  if (rules.requireReceipt !== false && !(f.receipt ?? "").trim()) {
    return "أرفق صورة إيصال التحويل";
  }
  return null;
}

/** البادئة الافتراضية. */
export const DEFAULT_CODE_PREFIX = "EX-EG";

/**
 * تنقية البادئة: حروف وأرقام لاتينية وشرطة، من حرفين إلى عشرة.
 * ------------------------------------------------------------------
 * الشرطة مسموحة داخل البادئة («EX-EG») ولا تُلبس شيئاً: الكود يُطابَق
 * كنصّ كامل عند التفعيل ولا يُقسَّم على شرطاته. لكنها لا تصلح طرفاً
 * ولا مكرّرة، وإلا خرج الكود بشرطتين متلاصقتين أو بدأ بفاصل.
 */
export function cleanPrefix(v?: string): string {
  const out = String(v ?? "")
    .toUpperCase()
    .replace(/[^A-Z0-9-]/g, "")
    .replace(/-{2,}/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 10)
    .replace(/-+$/, "");
  return out.replace(/-/g, "").length >= 2 ? out : DEFAULT_CODE_PREFIX;
}

/** كود تفعيل جديد — نفس صيغة شاشة الأكواد فلا يختلف شكلان في المنصّة. */
export function newActivationCode(taken: Set<string>, prefix?: string): string {
  const p = cleanPrefix(prefix);
  const seg = () => Math.random().toString(36).slice(2).padEnd(4, "0").slice(0, 4).toUpperCase();
  for (let i = 0; i < 200; i++) {
    const code = `${p}-${seg()}-${seg()}`;
    if (!taken.has(code)) return code;
  }
  return `${p}-${Date.now().toString(36).toUpperCase().slice(-8)}`;
}

/**
 * هل حوّل الطالب من الرقم المسجَّل في حسابه؟
 * ------------------------------------------------------------------
 * هذا هو الفحصُ الذي يجريه المشرف بعينه في كل طلب، فأولى أن يُجرى له.
 * تُقارَن آخرُ تسعة أرقام: الصيغُ تختلف بمقدّمات دولية وأصفار وفواصل،
 * والمقارنةُ الحرفية ترفض رقمين متطابقين لاختلاف كتابتهما.
 */
export function sameNumber(a?: string, b?: string): boolean | null {
  const tail = (v?: string) => normalizeDigits(v ?? "").replace(/\D/g, "").slice(-9);
  const x = tail(a), y = tail(b);
  if (x.length < 9 || y.length < 9) return null;   // لا يكفي للحكم
  return x === y;
}

export const STATUS_LABEL: Record<PayRequest["status"], string> = {
  pending: "قيد المراجعة",
  approved: "مقبول",
  rejected: "مرفوض",
};

/**
 * طرق الدفع الشائعة في مصر — قوالبُ جاهزة.
 * ------------------------------------------------------------------
 * البوّابة بلا طرق شاشةٌ فارغة، وإضافةُ كلِّ طريقة من الصفر كتابةٌ
 * متكرّرة: الاسم والنوع واللون. القوالبُ تملأ ذلك كلَّه ولا تترك
 * لصاحبة المنصّة إلا ما لا يعرفه غيرُها — الرقمَ واسمَ صاحب الحساب.
 */
export const METHOD_TEMPLATES: {
  name: string;
  kind: PayMethod["kind"];
  color: string;
  note?: string;
}[] = [
  { name: "فودافون كاش", kind: "wallet", color: "#e60000", note: "حوّل من تطبيق فودافون كاش أو بكود ‎*9*7#‎" },
  { name: "اتصالات كاش", kind: "wallet", color: "#8dc63f", note: "حوّل من تطبيق اتصالات كاش" },
  { name: "أورنج كاش", kind: "wallet", color: "#ff7900", note: "حوّل من تطبيق أورنج كاش" },
  { name: "وي باي", kind: "wallet", color: "#7b2d8b", note: "حوّل من تطبيق WE Pay" },
  { name: "إنستاباي", kind: "instapay", color: "#6d3bd6", note: "حوّل إلى عنوان إنستاباي من تطبيق بنكك" },
  { name: "فوري", kind: "fawry", color: "#ffb600", note: "ادفع من أقرب منفذ فوري بالكود" },
  { name: "حساب بنكي", kind: "bank", color: "#1f4e79", note: "حوّل من تطبيق بنكك أو من الفرع" },
];

/** يبني طرقاً من القوالب بمعرّفات جديدة — بلا أرقام، فهي وحدها ما يُكتب. */
export function methodsFromTemplates(startOrder = 0): PayMethod[] {
  return METHOD_TEMPLATES.map((t, i) => ({
    id: `M-${Date.now().toString(36)}-${i}`,
    kind: t.kind,
    name: t.name,
    number: "",
    note: t.note,
    color: t.color,
    /* تُضاف معطّلة: طريقةٌ بلا رقم تُعرض على الطالب شاشةَ حيرة. */
    active: false,
    order: startOrder + i,
  }));
}
