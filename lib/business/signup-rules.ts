/**
 * قواعد بيانات التسجيل — مصدر واحد يتشاركه المتصفّح والخادم.
 * ------------------------------------------------------------------
 * التحقّق في المتصفّح للراحة، والفرض الحقيقي على الخادم لأن أي طلب
 * مباشر يتخطّى الواجهة. وجود القواعد في ملف واحد يمنع اختلافهما.
 *
 * كل دالة تعيد رسالة الخطأ بالعربية، أو null إن كانت القيمة سليمة.
 */
import {
  EGYPT_GOVERNORATES, TRACKS, STAGES, TRACK_STAGE,
  EDU_SYSTEMS, AZHAR, BRANCH_TRACK, SCIENCE_BRANCHES, gradeInStage,
} from "@/lib/utils/data";

export type SignupInput = {
  termName?: string;
  name?: string;
  phone?: string;
  eduSystem?: string;
  stage?: string;
  grade?: string;
  track?: string;
  branch?: string;
  gender?: string;
  school?: string;
  governorate?: string;
};

const s = (v: unknown) => String(v ?? "").trim();

/* ---------------- الحقول المشروطة ---------------- */

/**
 * الفصلان الدراسيان — ثابتان في المنصّة.
 * ------------------------------------------------------------------
 * كل منهج مصريّ فصلان لا أكثر، فليس هذا إعداداً يُضبط بل حقيقةٌ في
 * البنية. إبقاؤه إعداداً كان يفتح باباً لأخطاء لا طائل منها: فصلٌ ثالث،
 * أو اسمٌ لا يطابق ما تعنيه الكورسات بـ`term: 1` و`term: 2`.
 *
 * ولذلك لا يُضافان ولا يُحذفان، والدالةُ لا تقرأ إعداداً أصلاً — المعامل
 * باقٍ للتوافق مع المستدعين ولا يُستعمل.
 */
export const TERMS = [
  { id: "T1", name: "الفصل الدراسي الأول" },
  { id: "T2", name: "الفصل الدراسي الثاني" },
] as const;

/** الفصلان لكل مرحلة — يظهران متى اختيرت مرحلة. */
export function termsForStage(
  _terms?: readonly { id: string; name: string; stage?: string }[],
  stage?: string
) {
  return s(stage) ? [...TERMS] : [];
}

/**
 * الفصل الدراسي لا يُسأل عنه في التسجيل.
 * ------------------------------------------------------------------
 * الفصلُ صفةُ الكورس لا صفةُ الطالب: الطالب نفسه يدرس الفصلين، ويختار
 * بينهما من ألسنة شاشة الكورسات متى شاء. وسؤالُه عنه مرّةً واحدة عند
 * التسجيل يقيّده بما اختاره يومَها ولا يفيد شيئاً.
 *
 * الدالةُ باقيةٌ تعيد false دائماً، فلا يُكسر مستدعٍ ولا تبقى بيانات
 * قديمة تُقارَن بها.
 */
export function showsTerm(): boolean {
  return false;
}

/** الشعبة (علمي/أدبي) — في المرحلة الثانوية وحدها. */
export function showsTrack(f: SignupInput): boolean {
  return s(f.stage) === TRACK_STAGE;
}

/**
 * فرع الشعبة العلمية (علوم/رياضة) — بثلاثة شروط معاً:
 * ثانوية · شعبة علمي · نظام غير أزهري.
 * الأزهر لا يفرّع شعبته العلمية، والشعبة الأدبية لا تتفرّع أصلاً.
 */
export function showsBranch(f: SignupInput): boolean {
  return showsTrack(f) && s(f.track) === BRANCH_TRACK && s(f.eduSystem) !== AZHAR;
}

/* ---------------- تحقّق الحقول ---------------- */

/**
 * رقم الموبايل المصري: ١١ رقماً تبدأ بـ٠١ ثم ٠/١/٢/٥.
 * تُقبل الأرقام العربية-الهندية وتُطبَّع، وتُتجاهل المسافات والشرطات.
 */
export function normalizePhone(raw: unknown): string {
  return s(raw)
    .replace(/[٠-٩]/g, (d) => String("٠١٢٣٤٥٦٧٨٩".indexOf(d)))
    .replace(/[۰-۹]/g, (d) => String("۰۱۲۳۴۵۶۷۸۹".indexOf(d)))
    .replace(/[\s\-()+]/g, "");
}

export function phoneProblem(raw: unknown): string | null {
  const v = normalizePhone(raw);
  if (!v) return "رقم الموبايل مطلوب";
  if (!/^\d+$/.test(v)) return "رقم الموبايل يجب أن يكون أرقاماً فقط";
  if (v.length !== 11) return `رقم الموبايل يجب أن يكون ١١ رقماً (أدخلت ${v.length.toLocaleString("ar-EG")})`;
  if (!/^01[0125]\d{8}$/.test(v)) return "رقم الموبايل غير صحيح — يبدأ بـ ٠١٠ أو ٠١١ أو ٠١٢ أو ٠١٥";
  return null;
}

/** الاسم: حروف عربية أو لاتينية ومسافات، من كلمتين على الأقل. */
export function nameProblem(raw: unknown): string | null {
  const v = s(raw).replace(/\s+/g, " ");
  if (!v) return "الاسم الكامل مطلوب";
  if (v.length < 4) return "الاسم قصير جداً";
  if (v.length > 60) return "الاسم طويل جداً";
  if (!/^[؀-ۿݐ-ݿA-Za-z\s'.-]+$/.test(v)) return "الاسم يجب أن يكون حروفاً فقط";
  if (v.split(" ").filter(Boolean).length < 2) return "اكتب الاسم الكامل (اسمان على الأقل)";
  return null;
}

/** اسم المدرسة: نصّ معقول بلا رموز غريبة. */
export function schoolProblem(raw: unknown): string | null {
  const v = s(raw);
  if (!v) return "اسم المدرسة مطلوب";
  if (v.length < 3) return "اسم المدرسة قصير جداً";
  if (v.length > 80) return "اسم المدرسة طويل جداً";
  return null;
}

/** قيمة يجب أن تكون من قائمة معروفة — يمنع حقن قيم من طلب مباشر. */
function oneOf(raw: unknown, allowed: readonly string[], missing: string, invalid: string): string | null {
  const v = s(raw);
  if (!v) return missing;
  return allowed.includes(v) ? null : invalid;
}

/**
 * تحقّق كامل من بيانات التسجيل الذاتي.
 * يعيد أول خطأ يقابله، أو null إن كان كل شيء سليماً.
 * (البريد وكلمة المرور يتحقّق منهما lib/guard.ts.)
 */
export function signupProblem(
  f: SignupInput,
  gradeNames: readonly string[],
  terms: readonly { id: string; name: string; stage?: string }[] = []
): string | null {
  return (
    nameProblem(f.name) ??
    phoneProblem(f.phone) ??
    oneOf(f.eduSystem, EDU_SYSTEMS, "النظام التعليمي مطلوب", "النظام التعليمي غير صحيح") ??
    oneOf(f.stage, STAGES, "المرحلة الدراسية مطلوبة", "المرحلة الدراسية غير صحيحة") ??
    // الصفوف يضبطها الأدمن، فتُقارن بالموجود فعلاً وقت التسجيل
    oneOf(f.grade, gradeNames, "الصف الدراسي مطلوب", "الصف الدراسي غير صحيح") ??
    /*
      والصفُّ من المرحلة المختارة.
      كانت الشاشةُ تعرض الصفوفَ الستّةَ كلَّها مهما اختار المرحلة، فيُقبل
      «ثانوية · الأول الإعدادي» — تركيبٌ لا وجودَ له، ولا يظهر أثرُه إلّا
      بعد أشهرٍ حين لا تطابقه خطّةٌ ولا يُفهم لماذا. والشاشةُ صُفِّيت،
      ويبقى القيدُ هنا لأنّ الطلبَ يُرسَل من غيرها أيضاً.
    */
    (gradeInStage(f.grade, f.stage) ? null : "الصف الدراسي لا يتبع المرحلة المختارة") ??
    (showsTrack(f) ? oneOf(f.track, TRACKS, "الشعبة مطلوبة", "الشعبة غير صحيحة") : null) ??
    (showsBranch(f)
      ? oneOf(f.branch, SCIENCE_BRANCHES, "فرع الشعبة العلمية مطلوب", "فرع الشعبة العلمية غير صحيح")
      : null) ??
    oneOf(f.governorate, EGYPT_GOVERNORATES, "المحافظة مطلوبة", "المحافظة غير صحيحة") ??
    oneOf(f.gender, ["male", "female"], "النوع مطلوب", "النوع غير صحيح") ??
    schoolProblem(f.school)
  );
}
