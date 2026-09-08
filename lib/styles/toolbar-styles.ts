/**
 * تصاميم شريط الأدوات العلوي (التول بار).
 * ------------------------------------------------------------------
 * الشريط يظهر في كل صفحة من لوحتَي الطالب والإدارة وفي الواجهة، فشكله
 * بُعد مستقلّ كالقوائم لا تابع للثيم.
 *
 * كان السجلّ تركيبَ محاور (سطح × بحث × حافّة × ارتفاع)، فخرجت عشرون
 * نسخة من شريط واحد لا عشرون شريطاً. أُضيف محورُ **الهيئة**: صورة
 * صريحة تملك صورة الشريط الظاهرة — محراب، عَقد، طُغراء، جناحان،
 * مخطوط ممزّق… والمحاور القديمة بقيت ضبطاً ثانوياً داخلها.
 *
 * الهيئة تُرسم على طبقة خلفية (‎::before‎) لا على الشريط نفسه، فالقصّ
 * لا يبتر قائمةً منسدلة ولا زرّاً يخرج عن حدوده.
 */

/** سطح الشريط — لونه وخامته. */
export type BarSurface =
  | "solid"     // لون السطح مصمتاً
  | "glass"     // زجاجي شفّاف بضباب
  | "outline"   // شفّاف بحدّ سفلي فقط
  | "gradient"  // تدرّج أفقي خفيف
  | "floating"  // بطاقة منفصلة عن الحوافّ
  | "ink";      // بلون الحبر — يقلب النصّ إلى فاتح

/**
 * هيئة الشريط — صورته الظاهرة.
 * هذا هو المحور الذي يجعل التصاميم مختلفة حقاً لا متشابهة بفروق لونية.
 */
export type BarArt =
  | "plain"       // بلا هيئة — الشريط كما هو
  | "mihrab"      // كوّة محراب تنزل من وسط الحافّة السفلى
  | "arcade"      // صفّ عقود مقوّسة أسفل الشريط
  | "serrated"    // حافّة سفلى مسنّنة كحرف المخطوط
  | "torn"        // حافّة ممزّقة كورق قديم
  | "plaque"      // لوح بأركان مقصوصة
  | "tughra"      // طُغراء مذهّبة على الطرف
  | "wings"       // جناحان: كتلتان بينهما فُرجة
  | "hang"        // معلَّق من السقف بحمّالتين
  | "kufi"        // شريط كوفي على الحافّة العليا
  | "shamsa"      // شمسة مضيئة خلف الوسط
  | "slant"       // حافّة سفلى مائلة
  | "frame"       // إطار مزدوج بخيطين
  | "inkdrop"     // قطرة حبر تتدلّى من الوسط
  | "page"        // ركن صفحة مطويّ
  | "belt"        // حزام بإبزيم في الوسط
  | "longshadow"  // ظلّ طويل مائل
  | "rule"        // شريط شفّاف وخيط مذهّب وحده
  | "float"       // كبسولة صغيرة تطفو فوق خيط
  | "pill"        // كبسولة عائمة بحوافّ دائرية كاملة
  | "pods"        // حُبيبات: الشعار والروابط والأدوات في أقراص منفصلة
  | "window";     // نافذة بقوائم رأسية

/** شكل حقل البحث. */
export type BarSearch =
  | "wide"    // حقل عريض
  | "pill"    // كبسولة مضغوطة
  | "icon"    // أيقونة تتوسّع عند التركيز
  | "none";   // بلا بحث

/** الفاصل أسفل الشريط. */
export type BarEdge = "line" | "shadow" | "gold" | "none";

/** ارتفاع الشريط. */
export type BarHeight = "compact" | "normal" | "tall";

/**
 * تثبيت الشريط.
 * ------------------------------------------------------------------
 * محورٌ مستقلّ عن الهيئة: الهيئة شكلُه، وهذا سلوكُه عند التمرير.
 *   pinned  = ملتصق بأعلى الشاشة يبقى ظاهراً.
 *   float   = يطفو بهامش عن الحوافّ ويبقى ظاهراً.
 *   static  = يمشي مع الصفحة فيختفي عند النزول.
 */
export type BarStick = "pinned" | "float" | "static" | "above";

export type ToolbarStyle = {
  id: string;
  name: string;
  hint: string;
  art: BarArt;
  surface: BarSurface;
  search: BarSearch;
  edge: BarEdge;
  height: BarHeight;
  /** الأزرار في كبسولة مجمّعة بدل متفرّقة. */
  grouped: boolean;
};

function tb(
  id: string, name: string, hint: string, art: BarArt,
  surface: BarSurface, search: BarSearch, edge: BarEdge, height: BarHeight, grouped: boolean
): ToolbarStyle {
  return { id, name, hint, art, surface, search, edge, height, grouped };
}

export const TOOLBAR_STYLES: ToolbarStyle[] = [
  tb("classic", "الكلاسيكي", "سطح مصمت وحدّ سفلي — الأصل الهادئ",
    "plain", "solid", "wide", "line", "normal", false),

  tb("mihrab", "المحراب", "كوّة مقوّسة تنزل من وسط الحافّة يجلس فيها الشعار",
    "mihrab", "solid", "wide", "gold", "tall", false),

  tb("arcade", "العَقد", "صفّ عقود أندلسية أسفل الشريط",
    "arcade", "gradient", "pill", "none", "tall", true),

  tb("serrated", "المسنَّن", "حافّة سفلى مسنّنة كطرف المخطوط",
    "serrated", "ink", "wide", "none", "normal", false),

  tb("torn", "المخطوط الممزّق", "ورقة قديمة ممزّقة الطرف",
    "torn", "gradient", "icon", "none", "normal", false),

  tb("plaque", "اللوح", "أركان مقصوصة وخيط ذهبي داخلي",
    "plaque", "solid", "pill", "gold", "normal", true),

  tb("tughra", "الطُغراء", "زخرفة مذهّبة تلتفّ على طرف الشريط",
    "tughra", "glass", "wide", "gold", "tall", false),

  tb("wings", "الجناحان", "كتلتان بينهما فُرجة — الشعار في جهة والأدوات في أخرى",
    "wings", "floating", "pill", "shadow", "normal", true),

  tb("hang", "المعلَّق", "شريط يتدلّى من السقف بحمّالتين",
    "hang", "floating", "wide", "shadow", "normal", false),

  tb("kufi", "الكوفي", "شريط زخرفة كوفية على الحافّة العليا",
    "kufi", "solid", "wide", "line", "normal", false),

  tb("shamsa", "الشمسة", "هالة مضيئة خلف الوسط وحلقة ذهبية",
    "shamsa", "ink", "pill", "none", "tall", true),

  tb("slant", "المائل", "حافّة سفلى مائلة تكسر الأفق",
    "slant", "gradient", "wide", "none", "normal", false),

  tb("frame", "الإطار المزدوج", "خيطان متوازيان يحيطان بالشريط",
    "frame", "outline", "wide", "none", "normal", false),

  tb("inkdrop", "قطرة الحبر", "قطرة تتدلّى من وسط الحافّة",
    "inkdrop", "ink", "icon", "none", "normal", true),

  tb("page", "الصفحة", "ركن مطويّ كصفحة كتاب",
    "page", "solid", "wide", "shadow", "normal", false),

  tb("belt", "الحزام", "كتلة إبزيم في الوسط يمرّ بها الشريط",
    "belt", "ink", "none", "none", "compact", true),

  tb("longshadow", "الظلّ الطويل", "ظلّ مائل ممتدّ أسفل الشريط",
    "longshadow", "solid", "pill", "none", "compact", false),

  tb("rule", "الخيط", "شفّاف تماماً وخيط مذهّب وحده",
    "rule", "outline", "icon", "gold", "compact", false),

  tb("float", "الكبسولة الطافية", "كبسولة صغيرة تطفو فوق خيط بعرض الصفحة",
    "float", "floating", "none", "line", "compact", true),

  tb("window", "النافذة", "إطار نافذة بقوائم رأسية تفصل الأقسام",
    "window", "glass", "wide", "line", "tall", false),

  tb("pill", "الكبسولة العائمة", "حوافّ دائرية كاملة يطفو بهامش عن كل الجهات",
    "pill", "glass", "pill", "none", "normal", true),

  tb("pods", "الحُبيبات", "الشعار والروابط والأدوات في أقراص عائمة منفصلة",
    "pods", "floating", "icon", "none", "compact", true),
];

export const DEFAULT_TOOLBAR = TOOLBAR_STYLES[0].id;

export function findToolbar(id?: string): ToolbarStyle {
  return TOOLBAR_STYLES.find((x) => x.id === id) ?? TOOLBAR_STYLES[0];
}

/**
 * صنف التثبيت — يُمرَّر مستقلّاً عن التصميم لأنه إعدادٌ لا هيئة.
 * فارغاً يبقى السلوك الأصلي (عائم كما كان).
 */
export function stickClass(v?: string): string {
  return v === "pinned" || v === "static" || v === "float" || v === "above" ? `tb-stick-${v}` : "";
}

export const BAR_STICKS: { id: BarStick; label: string; hint: string }[] = [
  { id: "float", label: "عائم", hint: "يطفو بهامش عن الحوافّ ويبقى ظاهراً" },
  { id: "pinned", label: "مثبّت", hint: "ملتصق بأعلى الشاشة بعرضها" },
  { id: "static", label: "يمشي مع الصفحة", hint: "يختفي عند النزول" },
  /*
    «أعلى المحتوى» غيرُ «يمشي مع الصفحة»: الثاني `absolute` فيبقى فوق
    القسم يحجب أعلاه، والأوّلُ في تدفّق الصفحة فيدفع المحتوى لأسفل ولا
    يعلوه شيء.
  */
  { id: "above", label: "أعلى المحتوى", hint: "في تدفّق الصفحة — يدفعها لأسفل ولا يعلوها" },
];

export function toolbarClass(x: ToolbarStyle): string {
  return [
    `tb-art-${x.art}`,
    `tb-surface-${x.surface}`,
    `tb-search-${x.search}`,
    `tb-edge-${x.edge}`,
    `tb-height-${x.height}`,
    x.grouped ? "tb-grouped" : "",
  ].filter(Boolean).join(" ");
}
