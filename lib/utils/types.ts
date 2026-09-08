import type { Maintenance } from "@/lib/business/maintenance";
/** أنواع البيانات المشتركة بين الموقع ولوحات التحكّم وطبقة التخزين. */

import type { ArtTint } from "@/lib/art/art-tint";
export type Layout = "dark" | "light";
/** بريسيتات المِداد — حبر غامق + تذهيب. الأسماء القديمة مقبولة للتوافق. */
export type Preset =
  | "midad" | "nile" | "andalus" | "rumman" | "custom"
  | "violet" | "emerald" | "ocean" | "crimson";

/**
 * نصّ يُكتب فوق غلاف الكورس ويُحرَّك بالماوس.
 * الموضع بالنسبة المئوية من اللوحة لا بالبكسل، فيثبت مكانه في كل المقاسات.
 */
/**
 * صورة تُلصَق فوق لوحة الغلاف وتُحرَّك بالماوس.
 * القياسات كلّها بالنسبة المئوية من اللوحة، فتثبت في كل المقاسات.
 */
export type CoverSticker = {
  id: string;
  src: string;        // رابط الصورة (بعد أي قصّ أو إزالة خلفية)
  x: number;          // ٠..١٠٠ — مركز الصورة أفقياً
  y: number;          // ٠..١٠٠ — مركز الصورة رأسياً
  size: number;       // ٥..١٠٠ — عرضها كنسبة من عرض اللوحة
  ratio?: number;     // نسبة أبعادها الأصلية (عرض ÷ ارتفاع) — تُقاس عند الرفع
  rotate?: number;    // -١٨٠..١٨٠ درجة
  opacity?: number;   // ٠..١٠٠
  round?: boolean;    // قصّها دائرية
};

export type CoverFont = "display" | "sans" | "kufi";

export type CoverText = {
  text: string;
  x: number;         // ٠..١٠٠ — من يسار اللوحة
  y: number;         // ٠..١٠٠ — من أعلى اللوحة
  size?: number;     // حجم الخطّ بوحدات اللوحة (الافتراضي ٢٦)
  font?: CoverFont;  // نوع الخطّ من خطوط الهوية الثلاثة
  bold?: boolean;
  color?: string;    // لون النصّ (HEX) — الافتراضي أبيض
  gradient?: boolean; // تدرّج بين لونين بدل لون واحد
  color2?: string;   // اللون الثاني للتدرّج
  align?: "right" | "center" | "left";
  outline?: boolean; // حدّ داكن يبقي النصّ مقروءاً فوق أي صورة
};

/**
 * زخرفة لوحة الغلاف (المربّعات خلف الصورة).
 * "auto" = تُشتقّ من معرّف الكورس · "none" = بلا زخرفة · وباقي القيم تختار نمطاً بعينه.
 */
export type CoverPattern = "auto" | "none" | "knot" | "squares" | "arches" | "weave";

/**
 * مرحلة دراسية في قسم «المراحل» بالصفحة الرئيسية.
 * الصورة اختيارية وتملأ الفراغ بجانب قائمة الفروع — وتقبل GIF متحرّكة
 * كما تقبل صورة ساكنة، فالمتصفّح يعرض الاثنتين بالوسم نفسه.
 */
export type StageCard = {
  id: string;
  name: string;
  note?: string;
  branches: string[];
  image?: string;
};

/** شكل حواف الإطار. */
export type FrameShape = "arch" | "rounded" | "square";

/**
 * ضبط صورة داخل إطارها — **بلا قصّ إطلاقاً**.
 * frame: "fixed" إطار ثابت والصورة كاملة بداخله · "image" الإطار يتبع نسبة الصورة فتملأه تماماً.
 */
export type ImageFit = {
  fit?: "cover" | "contain"; // (توافق قديم) — لم تعد تُستخدم للقصّ
  frame?: "fixed" | "image";
  shape?: FrameShape;
  radius?: number;  // نصف قطر الحواف (0..40)
  x?: number;       // إزاحة أفقية ٪ (‑40..40)
  y?: number;       // إزاحة رأسية ٪
  scale?: number;   // تكبير (0.6..2.5)
};

export type Theme = {
  layout: Layout;
  preset: Preset;
  customPrimary: string | null;
  /** الذهبي — للزخرفة والحدود؛ ويُشتقّ منه ذهبٌ غائرٌ للنصّ. */
  customGold?: string | null;
  /** لون الورق — خلفية الوضع الفاتح، وتُشتقّ منه البطاقةُ والحدّ. */
  customPaper?: string | null;
};

/* ---------- خطط الاشتراك (تُضاف وتُدار من لوحة الأدمن) ---------- */
/** نوع الخطة — يحدّد طريقة حساب مدّة الاشتراك:
 *  term   : ترم كامل — ينتهي في تاريخ محدّد (endsAt أو تاريخ نهاية الترم العام).
 *  month  : شهري — ينتهي بعد durationDays (٣٠ يوماً افتراضياً).
 *  custom : مخصّص — ينتهي بعد durationDays، أو دائم إذا كانت null.
 */
/**
 * نوع الخطة — وهو ما يحدّد متى تنتهي.
 *   term     ينتهي بتاريخ نهاية الترم (خاصٌّ بالخطة أو العامُّ للمنصّة).
 *   month    ينتهي بعد مدّة بالأيام (٣٠ افتراضاً).
 *   custom   مدّةٌ بالأيام تحدّدها.
 *   lifetime لا ينتهي أبداً — يبقى بعد الاشتراك دائماً.
 */
export type PlanKind = "term" | "month" | "custom" | "lifetime";
/** رقم الفصل الدراسي. */
export type TermNo = 1 | 2;

/** نطاق الخطة: كل المواد · كل مواد فصل دراسي · كورس محدّد. */
/**
 * نطاقُ الخطّة — ما تفتحه للطالب.
 * و«مختارة» أُضيفت لأنّ الثلاثةَ قبلها أحجامٌ ثابتة: من أراد «هذين
 * الكورسين ومادّتين من ثالث» لم يجد ما يعبّر عنه، فيُنشئ خططاً متداخلةً
 * لا يعرف الطالبُ أيَّها يشتري. انظر `lib/picks.ts`.
 */
export type PlanScope = "all" | "term" | "subject" | "picked";

/** خصم على خطة: نسبة أو مبلغ ثابت، مع مدّة اختيارية. */
export type PlanDiscount = {
  active: boolean;
  type: "percent" | "amount";
  value: number;
  label?: string;              // نص الشارة (مثال: «عرض بداية الترم»)
  until?: string | null;       // ينتهي الخصم عنده (اختياري)
};

export type SitePlan = {
  id: string;
  name: string;                 // اسم الخطة (حرّ — يكتبه الأدمن)
  kind: PlanKind;               // نوع الخطة
  scope: PlanScope;             // كل المواد / فصل دراسي / كورس محدّد
  subjectId?: string;           // عند scope = "subject"
  termNo?: TermNo;              // عند scope = "term" — أي فصل دراسي
  /**
   * عند scope = "picked" — مفاتيحُ ما تفتحه بعينه.
   * المفتاحُ معرّفُ كورسٍ («يُفتح كلُّه») أو `"معرّف::وحدة"» لمادّةٍ بعينها.
   * انظر `lib/picks.ts` — فالمفتاحُ نصٌّ ليُخزَّن في `Subscription.subjectId`
   * الذي حمل قبلَه `"*"` و`"T1"`، فلا تُرحَّل الاشتراكاتُ القديمة.
   */
  picks?: string[];
  price: number;                // السعر (ج.م)
  durationDays?: number | null; // مدة الاشتراك بالأيام (month/custom)
  endsAt?: string | null;       // تاريخ انتهاء ثابت (term) — يغلب على المدة
  badge?: string;               // شارة صغيرة (مثال: «الأوفر»)
  highlight?: boolean;          // إبراز الخطة في الصفحة الرئيسية
  color?: string;               // لون الخطة (HEX) — يلوّن بطاقتها وزخرفتها
  discount?: PlanDiscount;      // خصم على الخطة
  desc?: string;                // وصف مختصر
  cta?: string;                 // نص زر الخطة
  whatsapp?: string;            // رقم واتساب التفعيل لهذه الخطة (فارغ = رقم المنصّة العام)
  track?: string;               // شعبة الخطة: علمي/أدبي (فارغ = كل الشعب)
  /**
   * فئة الخطة — لمن تظهر بحسب بيانات تسجيله.
   * كل حقل فارغ = «الكل»، فالخطة العامّة لا تحتاج ضبطاً، والخطة
   * الموجَّهة تُضيّق بما تشاء من الحقول معاً.
   */
  audience?: {
    stage?: string;    // المرحلة الدراسية
    grade?: string;    // الصف
    system?: string;   // النظام التعليمي: أزهر / تربية وتعليم
    track?: string;    // الشعبة: علمي / أدبي
    branch?: string;   // فرع الشعبة العلمية: علوم / رياضة
    term?: string;     // الفصل الدراسي المختار عند التسجيل
    gender?: string;   // النوع
  };
  /**
   * صورة الخطة — تحلّ محلّ أيقونة النطاق في رأس البطاقة.
   * تقبل الساكنة والمتحرّكة (GIF/WebP)، والحجمُ بالبكسل لا بالأصناف
   * فيضبطه الأدمن بدقّة، و`imageCut` يُلغي خلفيةَ الصورة البيضاء دون
   * إتلاف حركتها.
   */
  image?: string;
  imageSize?: number;           // ضلع الصورة بالبكسل (٤٠..٢٠٠)
  imageCut?: boolean;           // إلغاء الخلفية البيضاء بالمزج
  perks?: string[];             // مزايا الخطة (نقاط)
  visible: boolean;             // إظهارها على الصفحة الرئيسية
  order?: number;               // ترتيب العرض
  createdAt: string;
};

/** لون عنصر: افتراضي (من الثيم) / لون واحد / متدرّج. */
export type ColorSpec = { mode: "theme" | "solid" | "gradient"; color?: string; from?: string; to?: string };
/** نمط عنصر واجهة: إخفاء + لون خلفية/زر + لون نص. */
export type ElementStyle = { hidden?: boolean; fill?: ColorSpec; text?: ColorSpec };

/** رابط دعم مخصّص يظهر للطالب في صفحة المساعدة. */
export type SupportLinkKind = "whatsapp" | "phone" | "email" | "telegram" | "facebook" | "youtube" | "link";
export type SupportLink = {
  id: string;
  kind: SupportLinkKind;
  label: string;      // العنوان الظاهر
  desc?: string;      // سطر صغير تحته
  value: string;      // الرقم/البريد/الرابط
  visible: boolean;
  order?: number;
};

export type Feature = { icon: string; tag: string; title: string; desc: string; span: string };
export type GradeInfo = { title: string; note: string };
export type CurriculumUnit = {
  unit: string;
  title: string;
  lessons: number;
  videos: number;
  hours: number;
  freeTrial: boolean;
  items: string[];
};
export type HonorStudent = { name: string; grade: string; score: string; quote: string };
export type Faq = { q: string; a: string };

/** المحتوى القابل للتعديل من لوحة الأدمن (هوية + نصوص + ألوان). */
/** شهادة طالب تُعرض في الصفحة الرئيسية (رأي أو تميّز). */
export type Testimonial = {
  id: string;
  name: string;           // اسم الطالب
  text: string;           // نصّ الشهادة
  badge?: string;         // وسام: «الأول على الدفعة»، «٩٨٪» …
  grade?: string;         // الصف أو المدرسة
  photo?: string;         // صورة الطالب (رابط أو درايف)
  rating?: number;        // ١..٥ — اختياري
  featured?: boolean;     // يُبرز في المقدّمة (الطالب الأول)
  hidden?: boolean;       // مخفيّة مؤقّتاً
};

export type SiteContent = {
  brand: string;
  platformSubtitle: string;
  teacher: {
    name: string;
    subject: string;
    headline: string;
    tagline: string;
    bio: string;
    experienceYears: number;
    avatar: string;
    logo: string;
    rating: number;
    ratingCount: number;
    topStudents: number;
  };
  hero: {
    statusPill: string;
    frame?: number;         // (توافق قديم) رقم الإطار
    frameShape?: string;    // معرّف الشكل من lib/frame-shapes.ts
    frameColor?: string;    // لون الإطار (HEX) — فارغ = لون الثيم
    frameScale?: number;    // حجم الإطار ٦٠..١٤٠٪
    /** خطّ القاعدة أسفل الإطار — مطفأ افتراضياً، وكان يُرسم دائماً. */
    frameBaseRule?: boolean;
    /** ضبط الصورة داخل الإطار: الملء، الإزاحة الأفقية/الرأسية (٪)، والتكبير. */
    image?: ImageFit;
  };
  /** مظهر بوابة الطالب — الثيم والتخطيط (من lib/skins.ts). */
  /** الفصول الدراسية — تُدار من «الصفوف والفصول» وتظهر في التسجيل. */
  terms?: TermRow[];

  /** معرّفُ حزمة الهويّة المطبَّقة (من `lib/hub/presets.ts`) — للإبراز في تبويب «الهوية». */
  brandPresetId?: string;
  studentSkin?: string;
  studentLayout?: string;
  studentMobile?: string;
  /** بطاقات المراحل في الصفحة الرئيسية. */
  stages?: StageCard[];

  /**
   * ترويسةُ بوابة الطالب — تعلو ما في التخطيط الجاهز.
   * التخطيطاتُ تُركّب الترويسةَ والمؤشّراتِ والبطاقاتِ معاً، فمن أراد
   * ترويسةً بعينها لزمه تخطيطٌ كامل. وهذا يفرد الترويسةَ وحدَها.
   */
  /** جهةُ القائمة الجانبية في بوابة الطالب: right (الأصل) أو left. */
  navSide?: string;
  /** جهةُ القائمة الجانبية في اللوحة. */
  adminNavSide?: string;
  /** تصميمُ قائمة اللوحة — مستقلٌّ عن قائمة الطالب. */
  adminSideNav?: string;
  studentHeader?: string;
  /**
   * ضبطُ لوح ترحيب الطالب (الهيئة الأزهرية).
   * ------------------------------------------------------------------
   * كان اللوحُ مقاساتٍ مكتوبةً في الشيفرة: من أراد اسماً أكبرَ أو بطاقةً
   * أقلَّ انتظر تعديلاً. وهو أوّلُ ما يراه الطالبُ في كلّ زيارة — فأولى
   * ما يُملَك.
   *
   * **والغيابُ يعني الأصل**: قاعدةٌ لم تُضبط بعد تعمل كما كانت، ولا
   * يُطفأ شيءٌ لمجرّد أنّ الحقلَ لم يُكتب.
   */
  azHead?: AzHeadOptions;
  studentDesign?: string;
  sideNav?: string;
  dockStyle?: string;
  navIcons?: string;
  navColors?: { panel?: string; icon?: string; text?: string; active?: string };
  /** تصميم بطاقات المؤشّرات وألوانها — مستقلّ عن الثيم. */
  toolbarStyle?: string;
  /**
   * شريط الواجهة الرئيسية — مستقلّ عن شريط أدوات اللوحة.
   * كانا مفتاحاً واحداً، فتغييرُ أحدهما يغيّر الآخر: شريطُ الزائر
   * وشريطُ الطالب والمشرف شيء واحد، وهما شاشتان مختلفتان تماماً.
   * فارغاً يتبع شريطَ اللوحة كما كان، فلا يتغيّر شيء لمن لم يضبطه.
   */
  navbarStyle?: string;
  /** تثبيت شريط الواجهة: عائم · مثبّت · يمشي مع الصفحة. */
  navbarStick?: string;
  /** إخفاء شريط الواجهة — الصفحة تبدأ بالهيرو مباشرة. */
  navbarHidden?: boolean;
  /** إخفاء شريط أدوات اللوحة. */
  toolbarHidden?: boolean;
  /**
   * مصدر أيقونة التطبيق: الشعار المرفوع · صورة المعلّمة · علامة المنصّة.
   * فارغاً يبقى السلوك القديم — الشعارُ إن وُجد وإلا العلامة.
   */
  appIcon?: "logo" | "avatar" | "mark" | "custom";
  /**
   * صورة الأيقونة المرفوعة — عند `appIcon = "custom"`.
   * مستقلّةٌ عن الشعار عمداً: أيقونةُ الهاتف مربّعةٌ صغيرة تُقرأ من بعيد،
   * والشعارُ قد يكون عريضاً بنصٍّ دقيق — فما يصلح لأحدهما يفسد الآخر.
   */
  appIconImage?: string;
  /** تصميم زرّي الهيرو (lib/button-styles.ts). */
  buttonStyle?: string;
  /** قواعد الوهج — خلفياتٌ وحوافُّ مضيئة لعناصر مختارة. */
  /**
   * الشركة المطوّرة — سطرٌ تحت حقوق النشر باسمها ورابطها وشعارها.
   * اختياريٌّ كلُّه: من ترك الاسم فارغاً لم يظهر السطر أصلاً، ومن ترك
   * الرابط فارغاً ظهر الاسمُ نصّاً لا وصلةً معطوبة.
   */
  developer?: { name?: string; url?: string; logo?: string; hidden?: boolean };
  /** الصيانة: المنصّة كلُّها أو أقسامٌ بعينها (lib/maintenance.ts). */
  maintenance?: Maintenance;
  glow?: GlowRule[];
  /** لوح قسم الهيرو: شكلُه (lib/hero-shell.ts) وألوانُه وارتفاعُه. */
  /** إطار الأيقونات وحركتُها (lib/icon-frames.ts · lib/icon-motion.ts). */
  iconFrame?: string;
  iconFrameColors?: { bg?: string; bg2?: string; fg?: string; edge?: string };
  /** مكتبة الأيقونات المطبَّقة (lib/icon-libs.ts). */
  /** اسمُ الأستاذ في الرأس توقيعاً (lib/brand-signature.ts). */
  /** عمقُ الواجهة الرئيسية: off · soft · deep · tilt. */
  /**
   * طلبُ صلاحية Google Meet عند ربط جوجل.
   * الأصلُ لا: طلبُها يجعل التطبيق «حسّاساً» عند جوجل، فتظهر شاشةُ
   * «غير مُتحقَّق منه» لكلّ من يربط ويُفرض سقفُ مئة مستخدم.
   */
  googleMeet?: boolean;
  /** الحركة الدائمة (lib/ambient-motion.ts) وسرعتُها. */
  /** الخلفية الأزهرية المرسومة — طبقةٌ ثابتةٌ بحجم الشاشة. */
  azhariBackdrop?: boolean;
  /** ظلالُ العناصر (lib/shadow-styles.ts). */
  /**
   * ألوانُ «الهيئة والشكل» — لوحُ الترحيب والبطاقات في بوابة الطالب.
   * مستقلّةٌ عن ألوان الهوية: قد يريدها الأستاذ لوحاً أغمقَ أو أفتحَ من
   * أساسيّه دون أن يمسّ الهويةَ كلَّها.
   */
  /**
   * تلوينُ الصور المتحرّكة (lib/art-tint.ts).
   *
   * و`mode` اتّحادٌ مغلقٌ لا `string`: `artFilter` تتفرّع عليه تفرّعاً
   * شاملاً، فوضعٌ لا تعرفه يسقط من التفريع ويخرج بلا مرشّح. وكتابتُه
   * `string` كانت تُخفي ذلك حتّى وقتِ التشغيل.
   *
   * والاستيرادُ من `art-tint` لا يعقد حلقة: هي وحداتٌ صرفةٌ لا تستورد
   * هذا الملفّ.
   */
  artTint?: ArtTint;
  /** عمقُ الرسوم (lib/art-depth.ts) — بَثقٌ وإضاءةٌ تجعلها مجسَّمة. */
  artDepth?: string;
  designColors?: { panel?: string; panel2?: string; panelText?: string; tile?: string; edge?: string };
  /**
   * معالجةُ لوح الترحيب (lib/panel-styles.ts) — محورٌ ثانٍ فوق «الهيئة».
   * الهيئةُ تُبدّل الحافّة، وهذه تُبدّل السطحَ والتخطيطَ وثقلَ الخطّ.
   */
  studentPanel?: string;
  /**
   * موضعُ المؤشّرات: داخل لوح الترحيب أم تحته.
   * `auto` = يتبع التخطيطَ المختار، و«داخل»/«تحت» يعلوان عليه.
   */
  statsInPanel?: "auto" | "in" | "out";
  shadowStyle?: string;
  ambient?: string;
  ambientSpeed?: string;
  hero3d?: string;
  brandSignature?: string;
  /**
   * صورةُ توقيع الأستاذ — تحلّ محلَّ الاسم المكتوب في الرأس.
   * التوقيعُ الحقيقيُّ أصدقُ من أيّ خطٍّ يحاكيه، فإن رُفعت صورتُه سقط
   * الخطُّ ولم يُرسم.
   */
  signatureImage?: string;
  /** ارتفاعُ التوقيع بالبكسل (٢٠..٨٠) — العرضُ يتبعه بالنسبة. */
  signatureHeight?: number;
  /**
   * يقلب لونَه في الوضع الداكن.
   * الحبرُ الداكن يختفي على خلفيةٍ داكنة — فيُقلب أبيضَ نقيّاً.
   */
  signatureInvert?: boolean;
  iconLib?: string;
  /** مكتبةُ رسوم الموقع — ثماني لوحاتٍ في خمسِ تشطيبات (٤٠). */
  vectorLib?: string;
  iconCover?: string;
  iconMotion?: string;
  heroShell?: string;
  heroShellOpts?: { bg?: string; bg2?: string; edge?: string; text?: string; extra?: number };
  /** تنسيق الواجهة الرئيسية على الهاتف (lib/mobile-home.ts). */
  mobileHome?: string;
  /** إيقاع الحركة في المنصّة (lib/motion-styles.ts). */
  motionStyle?: string;
  /** تثبيت شريط اللوحة. */
  toolbarStick?: string;
  /** تصاميم أقسام الصفحة الرئيسية — كلٌّ مستقلّ. */
  heroStyle?: string;
  plansStyle?: string;
  /** تصاميم أقسام البطاقات — كلٌّ مستقلّ عن جاره. */
  stagesStyle?: string;
  featuresStyle?: string;
  testimonialsStyle?: string;
  faqStyle?: string;
  ctaStyle?: string;
  footerStyle?: string;
  tileStyle?: string;
  tileColors?: { bg?: string; bg2?: string; text?: string; icon?: string; accent?: string };
  /** صورة داخل بطاقة المؤشّر — زينة خلف الرقم لا محتوى. */
  tileArt?: { image?: string; mode?: "cover" | "corner" | "side" | "strip" | "badge"; opacity?: number; blur?: number };

  /** بوّابة الدفع — طرقها وبياناتها وتصميمها. */
  payments?: PaymentsConfig;

  /**
   * بادئة أكواد التفعيل — أوّل حروف الكود قبل الشرطة.
   * كانت ثابتة في الكود من منصّة سابقة، فبقيت حروفُ اسمٍ آخر على كل
   * كود يصل الطالب. صارت تُضبط من اللوحة.
   */
  codePrefix?: string;

  /**
   * زرّ تبديل الفاتح/الداكن.
   * مخفيّ افتراضياً: المظهر قرار هوية تضبطه الإدارة، وإظهار الزرّ يجعل
   * كل زائر يرى نسخة مختلفة قد لا تكون مضبوطة بالعناية نفسها.
   */
  showThemeToggle?: boolean;

  /**
   * حماية محتوى الكورس من الالتقاط.
   * لا تمنع لقطة الشاشة — لا يستطيع ذلك أي موقع — لكنها تعطّل الزرّ
   * الأيمن والطباعة والاختصارات، وتُخفي المحتوى عند فقد التركيز.
   */
  blockCapture?: boolean;
  /** تخطيط الواجهة الرئيسية (من lib/home-layouts.ts). */
  homeLayout?: string;

  /** خلفية الصفحة الرئيسية — صورة اختيارية خلف كل الأقسام. */
  background?: {
    image?: string;    // رابط الصورة (فارغ = بلا خلفية)
    fixed?: boolean;   // ثابتة لا تتحرّك مع التمرير، والعناصر تمرّ فوقها
    opacity?: number;  // ٠..١٠٠ — شدّة ظهورها خلف المحتوى
    blur?: number;     // ٠..٢٠ بكسل — ضباب يبقي النصوص مقروءة
    /** كيف تملأ الصورة الشاشة: تملأ (قد تُقصّ) · كاملة بحجمها · مكرّرة. */
    size?: "cover" | "contain" | "natural" | "tile";
    veil?: number;     // ٠..٩٠ — شدّة الحجاب فوق الصورة (تباين النصّ)
  };
  termEnd?: string;   // تاريخ نهاية الترم (ينتهي عنده اشتراك الترم الكامل)
  termPrice?: number; // سعر اشتراك الترم الكامل (كل المواد)
  /** مكان استضافة الملفات المرفوعة: خادم المنصّة أم Google Drive الحساب المربوط. */
  mediaHost?: "local" | "drive";
  /** نصوص قسم «الخطط» في الصفحة الرئيسية. */
  plansSection?: { eyebrow?: string; title?: string; desc?: string; note?: string };
  cta?: {
    registerLabel?: string;   // نص زر التسجيل في الناف-بار/الفوتر
    registerUrl?: string;     // وجهة زر التسجيل (افتراضي /register)
    heroPrimaryLabel?: string;// نص زر الهيرو الأساسي
    secondaryLabel?: string;  // نص زر الفيديو الثانوي
    videoUrl?: string;        // رابط الدرس المجاني (اختياري)
    whatsappLabel?: string;   // نص زر واتساب في الهيرو
    whatsappUrl?: string;     // وجهته — فارغ = رابط wa.me لرقم المنصّة
    whatsappText?: string;    // نصّ الرسالة الجاهزة عند فتح واتساب
  };
  /** تحكّم بالعناصر: إظهار/إخفاء وألوان الأزرار والنصوص. المفتاح = اسم العنصر. */
  ui?: Record<string, ElementStyle>;
  whatsapp: string;
  social: { facebook: string; youtube: string; telegram: string };
  /** روابط الدعم: الثلاثة الأساسية + روابط مخصّصة تُدار من لوحة الدعم. */
  support?: {
    email?: string;
    phone?: string;
    whatsapp?: string;
    note?: string;            // سطر توضيحي أسفل روابط الدعم
    links?: SupportLink[];    // روابط إضافية (تليجرام، مجموعة، رابط خارجي…)
  };
  url: string;
  theme: Theme;
  grades: GradeInfo[];
  features: Feature[];
  curriculum: CurriculumUnit[];
  honorStudents: HonorStudent[];
  faqs: Faq[];
  testimonials?: Testimonial[]; // شهادات الطلاب في الصفحة الرئيسية
};

/* ---------- كيانات لوحة الأدمن ---------- */
export type Student = {
  id: string;
  name: string;
  grade: string;
  phone: string;
  status: "نشط" | "موقوف" | "بانتظار التفعيل";
  device: string;
  joined: string;
};
/* ---------- الاختبار التفاعلي على الدرس (اختياري) ---------- */
export type QuizQuestion = {
  id: string;
  text: string;       // نص السؤال
  options: string[];  // الاختيارات (٢ فأكثر)
  correct: number;    // رقم الاختيار الصحيح — لا يُرسل للطالب أبداً
};
export type Quiz = {
  enabled: boolean;     // تشغيل/إيقاف الاختبار على هذا الدرس (اختياري للأدمن)
  passScore?: number;   // نسبة النجاح ٪ (افتراضي ٦٠)
  questions: QuizQuestion[];
  /**
   * اسمُ الواجب — يراه الطالبُ فوق الأسئلة.
   * «اختبار» وحدَها لا تُميّز واجبَ الدرس الأوّل من الثاني في قائمة
   * نتائجه، والاسمُ يفعل.
   */
  title?: string;
  /**
   * منشورٌ أم مسوَّدة.
   * `enabled` تقول إنّ للدرس واجباً، و`published` تقول إنّه جاهزٌ
   * ليُرى. والأستاذُ يكتب أسئلتَه على مهلٍ ثمّ ينشرها دفعةً واحدة —
   * فلا يُمتحَن طالبٌ في سؤالٍ نصفِ مكتوب.
   */
  published?: boolean;
};
/** نتيجة محاولة طالب على اختبار درس. */
export type QuizResult = {
  subjectId: string;
  lessonId: string;
  score: number;   // عدد الإجابات الصحيحة
  total: number;   // عدد الأسئلة
  percent: number; // النسبة ٪
  passed: boolean;
  at: string;
  /**
   * ما اختاره الطالبُ في كلّ سؤال — فهرسُ الخيار، و`-1` لما تركه.
   * ------------------------------------------------------------------
   * **ولماذا تُحفظ؟** لأنّ «٥٠٪» تقول إنّه أخطأ ولا تقول **أين**. والمعلّمُ
   * يفتح التقريرَ ليعرف أيَّ بابٍ لم يفهمه — لا ليعرف أنّه لم يفهم.
   * وبدونها يبقى التقريرُ حكماً بلا تفصيل.
   *
   * **واختيارية**: النتائجُ المحفوظةُ قبل هذا الحقل لا تحمله، وتُعرض
   * درجتُها بلا تفصيل. ولا تُخترع لها إجاباتٌ — الفراغُ يُقال ولا يُملأ
   * بالحدس.
   */
  answers?: number[];
};

export type Lesson = {
  id: string;
  title: string;
  url: string;        // رابط الفيديو (YouTube/Vimeo/Bunny/mp4)
  duration?: string;
  isFree?: boolean;   // درس تجريبي مجاني
  quiz?: Quiz;        // اختبار تفاعلي على الفيديو (اختياري)
  /**
   * مرفقاتُ الدرس — مذكّرةٌ أو ملزمةٌ أو رابطٌ خارجيّ.
   * ------------------------------------------------------------------
   * وكانت الملفّاتُ للكورس وللمادّة فقط. والملفُّ في الغالب يخصّ درساً
   * بعينه — مذكّرةَ هذا الدرس لا مذكّرةَ الكورس كلِّه — فيُرفع على الكورس
   * ويُترك للطالب أن يعرف أيُّها لأيّ درس.
   *
   * وهي `Material` نفسُها لا نوعٌ ثانٍ: العنوانُ والرابطُ وكفى.
   */
  materials?: Material[];

  /* ---------- النشرُ والوصف ---------- */
  /**
   * منشورٌ للطالب؟ الغيابُ يعني نعم.
   * ------------------------------------------------------------------
   * الافتراضُ «منشور» لا «مسوّدة»: آلافُ الدروس القديمة لا تحمل الحقلَ،
   * وجعلُ غيابِه إخفاءً يُطفئ المنهجَ كلَّه عند أوّل نشرةٍ للبرنامج.
   */
  published?: boolean;
  /** موعدُ ظهورٍ مجدول (ISO). قبلَه لا يراه الطالبُ ولو كان منشوراً. */
  publishAt?: string;
  /** وصفٌ يُقرأ تحت العنوان — ما في الدرس ولماذا يُشاهد. */
  description?: string;

  /* ---------- مصدرُ الفيديو ---------- */
  /**
   * مزوّدُ الفيديو. و`url` تبقى مصدرَ الحقيقة للتشغيل — تُبنى من هذه
   * الحقول عند الحفظ، فما كُتب قبل اليوم يعمل بلا ترحيل.
   */
  provider?: "youtube" | "bunny";
  /** معرّفُ الفيديو عند المزوّد. */
  videoId?: string;
  /** معرّفُ المكتبة — لـBunny Stream وحدَه. */
  libraryId?: string;
};
export type Material = {
  id: string;
  title: string;
  url: string;        // رابط الملف (PDF/مستند) — يُرفع أو رابط خارجي
  /**
   * نوعُ الملفّ — يُستنتج من الامتداد عند الرفع.
   * يُرسم به رمزٌ يميّز المستندَ من العرض التقديميّ في القائمة، فيعرف
   * الطالبُ ما سيفتح قبل أن يفتحه.
   */
  kind?: "pdf" | "doc" | "slides" | "other";
};
/**
 * خيار سعر للكورس.
 * ------------------------------------------------------------------
 * الكورس كان بسعر واحد اسمه «السعر الشهري»، فمن أراد بيعه بالترم أو
 * بالحصّة اضطرّ لصنع خطة منفصلة في قسم الخطط. هذه الخيارات تُباع من
 * بطاقة الكورس نفسها: لكلٍّ اسمه ومدّته وسعره وخصمه.
 */
export type CoursePriceKind = "month" | "term" | "lesson" | "once" | "custom";

export type CoursePrice = {
  id: string;
  label: string;          // «شهري» · «الترم كامل» · «حصّة واحدة»
  kind: CoursePriceKind;
  price: number;
  durationDays?: number | null;  // فارغ = يتبع نوعه
  badge?: string;
  highlight?: boolean;
  desc?: string;
  discount?: PlanDiscount;
};

/**
 * وحدةٌ داخل الكورس.
 * ------------------------------------------------------------------
 * كان الكورسُ قائمةَ دروسٍ مسطّحة: ثلاثون درساً في عمودٍ واحدٍ لا يُعرف
 * أين ينتهي بابٌ ويبدأ آخر. والمنهجُ الشرعيُّ يُدرَّس أبواباً — «الطهارة»
 * ثمّ «الصلاة» ثمّ «الزكاة» — فالوحدةُ هي البابُ، وبها يُقرأ الكورسُ
 * منهجاً لا قائمةَ فيديوهات.
 *
 * والمسارُ: **الكورس ← وحدة ← دروس.**
 */
export type Unit = {
  id: string;
  title: string;
  desc?: string;
  /**
   * خياراتُ سعر المادّة — حين تُباع وحدَها.
   * ------------------------------------------------------------------
   * وهي `CoursePrice` نفسُها التي تُباع بها الكورسات، لا نوعٌ ثانٍ يفعل
   * الشيءَ نفسَه بحقولٍ أخرى: فالمادّةُ تُباع شهراً أو ترماً أو مرّةً
   * واحدةً كما يُباع الكورس، ومحرّرُ الأسعار واحدٌ لهما.
   *
   * وفراغُها = لا تُباع وحدَها، فتُفتح باشتراك الكورس أو بخطّةٍ تشملها.
   */
  prices?: CoursePrice[];
  lessons: Lesson[];
  /** ملفّاتُ الوحدة — تُضاف إلى ملفّات الكورس ولا تُلغيها. */
  materials?: Material[];
};

/** ضبطُ لوح ترحيب الطالب — كلُّه اختياريّ، والغيابُ هو الأصل. */
export type AzHeadOptions = {
  /** معرّفُ تصميم اللوح — انظر `AZ_HEAD_STYLES`. */
  style?: string;
  /** معرّفُ تصميم البطاقة — انظر `AZ_CARD_STYLES`. مستقلٌّ عن اللوح. */
  cardStyle?: string;
  /** مضاعِفُ حجم عدّاد النسبة (الحلقة). */
  ringSize?: number;

  /* ---------- المواضع ---------- */
  /**
   * موضعُ اللوح في الصفحة: `top` قبل كلّ شيء (الأصل)، `bottom` بعد
   * المحتوى. والثاني لمن يريد الدروسَ أوّلاً والملخّصَ ذيلاً.
   */
  place?: "top" | "bottom";
  /**
   * موضعُ البطاقات من اللوح:
   * `below` تطفو على حافّته السفلى (الأصل) · `above` فوقه · `inside`
   * داخلَه · `side` عموداً بجانب الترحيب.
   */
  cardsPos?: "below" | "above" | "inside" | "side";
  /** محاذاةُ الترحيب: البدايةُ (يمينٌ في العربيّة) · الوسطُ · النهاية. */
  align?: "start" | "center" | "end";
  /** عددُ أعمدة البطاقات في الشاشة الواسعة. */
  cols?: 1 | 2 | 3;
  /** ترتيبُ البطاقات — مفاتيحُها بالترتيب المطلوب. */
  order?: string[];
  /** ألوانٌ تسبق التصميم: من ضبط لوناً أراده هو. */
  panelColor?: string;
  accentColor?: string;
  inkColor?: string;
  /** لونُ الحافّة — يسبق لونَ التصميم ولونَ التمييز. */
  edgeColor?: string;
  /** إخفاءُ اللوح كلِّه. */
  off?: boolean;
  /** إخفاءُ بطاقةٍ بعينها. */
  hideProgress?: boolean;
  hideCourses?: boolean;
  hideSub?: boolean;
  /** إخفاءُ أشرطة النسبة أسفل الأرقام. */
  hideBars?: boolean;
  /** إخفاءُ الزخرفة الهندسيّة في خلفيّة اللوح. */
  hideOrnament?: boolean;
  /** إخفاءُ صورة الحرف الأوّل. */
  hideAvatar?: boolean;
  /** إخفاءُ الصفّ الدراسيّ تحت الاسم. */
  hideGrade?: boolean;
  /** مقاساتٌ بالبكسل — تُحقن متغيّراتِ CSS. */
  nameSize?: number;   // اسمُ الطالب
  valueSize?: number;  // الرقمُ في البطاقة
  titleSize?: number;  // عنوانُ البطاقة
  noteSize?: number;   // سطرُ الحال
  avatarSize?: number; // قطرُ الصورة
  /** انحناءُ حوافّ اللوح والبطاقات. */
  radius?: number;
};

export type Subject = {
  id: string;
  name: string;
  teacher: string;
  grade: string;      // الصف الدراسي (أو "كل الصفوف")
  track: string;      // الشعبة: "علمي" | "أدبي" | "الكل"
  term?: TermNo;      // الفصل الدراسي (١ أو ٢) — يُقسَّم به عرض الكورسات
  /**
   * كورسٌ مُتاحٌ مجّاناً للجميع.
   * ------------------------------------------------------------------
   * يفتح دروسَه لكلّ طالبٍ بلا شراءٍ ولا كود. وهو للكورس التجريبيّ الذي
   * يُغري بالباقي، ولموسمٍ يُفتح فيه المنهجُ كلُّه — لا للنسيان: من فتحه
   * يرى في اللوحة شارةً تقول إنّه مفتوح.
   */
  free?: boolean;
  /**
   * ما يحدث حين يضغط طالبٌ لا يملكه.
   * `gateway`   = يُساق إلى بوّابة الدفع فوراً — الكورسُ يُباع كتلةً واحدة.
   * `materials` = تُفتح له موادُّ الكورس وفي كلٍّ سعرُها وزرُّ شرائها —
   *               فيشتري ما يحتاج ويترك ما لا يحتاج.
   * والافتراضُ `gateway`: هو ما كانت عليه المنصّةُ قبل الخيار، فالكورساتُ
   * القائمةُ لا يتغيّر سلوكُها بلا قرار.
   */
  entryMode?: "gateway" | "materials";
  lessons: number;    // للعرض (يُحدَّث تلقائياً من عدد الدروس)
  students: number;
  price: number;      // (توافق قديم) السعر الأساسي — أوّل خيار حين تُضبط الخيارات
  /** خيارات السعر: شهري · ترم · حصّة … تُباع من بطاقة الكورس مباشرة. */
  prices?: CoursePrice[];
  cover?: string;     // صورة غلاف الكورس (اختياري)
  coverFit?: ImageFit;// ضبط الغلاف داخل بطاقة الكورس (محاذاة/تكبير/حواف)
  /**
   * لافتةُ صفحة الكورس — صورةٌ عريضةٌ مستقلّةٌ عن غلاف البطاقة.
   * ------------------------------------------------------------------
   * **ولماذا لا يكفي `cover`؟** لأنّ المقاسين مختلفان اختلافاً لا يُصلحه
   * قصّ: بطاقةُ الكورس مربّعةٌ تقريباً، وصدرُ صفحته شريطٌ نسبتُه ٢١:٨.
   * فغلافٌ مربّعٌ يُقصّ إلى الشريط يفقد أعلاه وأسفلَه — والوجوهُ
   * والعناوينُ فيهما — أو يُمدّ فيخرج ممسوخاً.
   *
   * وقد وقع ذلك فعلاً: كورسٌ غلافُه رسمٌ مربّعٌ خرج في صدر صفحته قلنسوةً
   * ممدودةً بلا معنى.
   *
   * فصارت لافتةً تُرفع وحدَها بمقاسها. وفراغُها = لا لافتةَ أصلاً، ولا
   * يُستعاض عنها بالغلاف — فعرضُ المقصوص أسوأُ من ألّا يُعرض شيء.
   */
  banner?: string;
  /** موضعُ القصّ الرأسيّ للّافتة ٪ (٠ أعلاها · ١٠٠ أسفلُها · الأصل ٣٥). */
  bannerY?: number;
  coverRatio?: number;// نسبة أبعاد الغلاف الأصلية (عرض ÷ ارتفاع) — تُقاس تلقائياً
  coverColor?: string;// لون خلفية اللوحة (HEX). فارغ = ألوان الثيم
  coverPattern?: CoverPattern; // زخرفة اللوحة. فارغ = تُختار تلقائياً من معرّف الكورس
  coverText?: CoverText;       // نصّ يُكتب على الغلاف ويُوضع بالسحب
  coverStickers?: CoverSticker[]; // صور تُلصَق فوق الغلاف وتُحرَّك بالسحب
  /**
   * وحداتُ الكورس — وكلُّ وحدةٍ فيها دروسُها.
   *
   * **و`videos` تبقى ولا تُحذف.** أربعةٌ وخمسون كورساً في القاعدة تكتب
   * دروسَها فيها، وحذفُها يُفرغها كلَّها دفعةً واحدة. فالقراءةُ تمرّ
   * بـ`courseUnits()`: من كان له `units` قُرئت، ومن لم يكن لُفَّت دروسُه
   * المسطّحة في وحدةٍ واحدة. فيعمل القديمُ والجديدُ معاً بلا ترحيلٍ
   * يُخاطر بالمحتوى.
   */
  units?: Unit[];
  videos: Lesson[];   // (توافق) دروسُ الكورس قبل نظام الوحدات
  materials?: Material[]; // مواد وملفات الكورس (PDF…)
  status: "منشورة" | "مسودّة";
};
/**
 * طلبُ نقلِ مرحلة.
 * ------------------------------------------------------------------
 * الطالبُ يُسجَّل في مرحلةٍ ثمّ يترقّى، أو يكتشف أنّه سجّل في الخطأ. وترْكُ
 * الحقل مفتوحاً له يجعل المرحلةَ بلا معنى: من أراد محتوى الثانوي بدّل
 * حقلَه وأخذه. فالنقلُ **طلبٌ يُقرّه الأستاذ**، والحقلُ لا يُكتب إلّا من
 * جهته.
 *
 * والرجوعُ إلى المرحلة السابقة طلبٌ كالذهاب — لا فرقَ في المسار: كلاهما
 * تغييرُ مرحلةٍ يُقرّه من يملك المحتوى.
 */
export type GradeRequestStatus = "قيد المراجعة" | "مقبول" | "مرفوض";

export type GradeRequest = {
  id: string;
  userId: string;
  userName: string;
  /** المرحلةُ وقتَ الطلب — تُحفظ لأنّ حقلَ الطالب يتغيّر بعد القبول. */
  from: string;
  to: string;
  reason?: string;
  status: GradeRequestStatus;
  at: string;
  decidedAt?: string;
  decidedBy?: string;
  /** ردُّ الأستاذ عند الرفض — يراه الطالبُ في حسابه. */
  note?: string;
};

export type GradeRow = { id: string; name: string; students: number; subjects: number; color: string };

/**
 * الفصل الدراسي — يُضاف من اللوحة لا يُكتب في الكود.
 * `stage` يربط الفصل بمرحلة بعينها؛ الفصل بلا مرحلة يظهر لكل المراحل.
 */
export type TermRow = {
  id: string;
  name: string;
  stage?: string;
  order?: number;
};
export type SubPlan = "ترم" | "شهر";
export type Code = {
  code: string;
  subjectId: string;    // نطاق الكود: كورس محدّد أو "*" (كل المواد)
  subjectName: string;
  plan?: SubPlan;       // (توافق قديم) نوع الاشتراك
  planId?: string;      // الخطة التي وُلِّد منها الكود — مصدر المدّة والسعر
  planName?: string;    // اسم الخطة وقت التوليد (للعرض)
  status: "متاح" | "مستخدم" | "منتهي";
  student?: string;
  studentId?: string;   // معرّف الطالب الذي فعّل الكود
  usedAt?: string;      // تاريخ التفعيل
  createdAt: string;
  /** طلب الدفع الذي صدر عنه هذا الكود — يربط التفعيل بالتحويل. */
  payId?: string;
};
/* ---------- الاختبارات (تُبنى داخل اللوحة) ---------- */
export type ExamQuestion = {
  id: string;
  text: string;
  options: string[];
  correct: number;   // لا يُرسل للطالب أبداً
  points?: number;   // درجة السؤال (١ افتراضياً)
};

/** محاولة طالب على اختبار. */
export type ExamAttempt = {
  examId: string;
  score: number;     // الدرجة المحصّلة
  total: number;     // الدرجة الكلية
  percent: number;
  passed: boolean;
  at: string;
  answers: number[];
};

export type Exam = {
  id: string;
  title: string;
  subject: string;
  subjectId?: string;       // لربط الاختبار بكورس (وللصلاحية)
  grade: string;
  track?: string;
  questions: ExamQuestion[];// أسئلة الاختبار داخل المنصّة
  duration: number;         // بالدقائق (٠ = بلا وقت)
  passScore?: number;       // نسبة النجاح ٪ (٦٠ افتراضياً)
  attempts?: number;        // عدد المحاولات المسموحة (٠/فارغ = غير محدود)
  audience?: LiveAudience;  // المشتركون فقط / كل الطلاب
  submissions: number;
  avg: number;
  url?: string;             // (توافق) رابط خارجي اختياري بدل الأسئلة
  createdAt?: string;
  status: "منشور" | "مجدول";
};
/** من يُسمح له بفتح رابط البث. */
export type LiveAudience =
  | "subscribers"  // المشتركون فقط (اشتراك ساري)
  | "all"          // كل الطلاب المسجّلين (حتى غير المشتركين)
  | "public";      // بث مجاني للجميع — حتى الزوّار بلا حساب (يظهر على الصفحة الرئيسية)

export type Live = {
  id: string;
  title: string;
  subject: string;
  grade: string;
  track?: string;         // الشعبة (اختياري)
  time: string;           // نص الموعد للعرض
  startsAt?: string;      // بداية الجلسة (ISO) — يُستخدم مع Google Calendar
  endsAt?: string;        // نهايتها (ISO)
  viewers: number;
  url?: string;           // رابط Meet/البث — لا يُرسل لمن لا يملك صلاحية
  audience?: LiveAudience; // الافتراضي: المشتركون فقط
  subjectId?: string;     // اشتراك أي كورس يفتح البث (فارغ = أي اشتراك ساري)
  meetEventId?: string;   // معرّف الحدث في Google Calendar (للحذف/التتبّع)
  createdBy?: "google" | "manual";
  /** نوع الجلسة: بث للمشاهدة فقط أم اجتماع تفاعلي. */
  kind?: "broadcast" | "meeting";
  endedAt?: string;       // وقت إنهاء البث
  status: "مباشر" | "مجدول" | "منتهي";
};
export type Notification = {
  id: string;
  title: string;
  body: string;
  createdAt: string;
  grade?: string;   // موجّه لصف معيّن (اختياري)
  track?: string;   // موجّه لشعبة معيّنة (اختياري)
  userId?: string;  // موجّه لطالب واحد بعينه (اختياري)
  link?: string;    // رابط اختياري داخل المنصة
  /**
   * كود تفعيل مرفق — يُعرض في بطاقة قابلة للنسخ مع زرّ تفعيل مباشر.
   * دفنُ الكود في نصّ الإشعار يُجبر الطالب على تحديده ونسخه يدوياً،
   * وهو أكثر ما يُخطئ فيه.
   */
  code?: string;
  /** الكورس الذي يفتحه الكود — يلزم لزرّ التفعيل المباشر. */
  codeSubjectId?: string;
};
/** رسالة داخل محادثة الدعم. */
export type ChatMessage = {
  id: string;
  from: "student" | "support";
  text: string;
  at: string;
  authorName?: string;      // اسم من ردّ من فريق الدعم
  readByStudent?: boolean;
  readByAdmin?: boolean;
};

/** محادثة دعم واحدة لكل طالب. */
export type Ticket = {
  id: string;
  userId?: string;          // صاحب المحادثة
  student: string;          // اسم الطالب
  subject: string;
  priority: "عالية" | "متوسطة" | "منخفضة";
  status: "مفتوحة" | "قيد المعالجة" | "مغلقة";
  time: string;             // وقت الفتح (نص للعرض)
  messages?: ChatMessage[];
  lastAt?: string;          // آخر نشاط — للترتيب
};

/* ---------- المستخدمون (الحسابات) ---------- */
export type Role = "admin" | "student";
import type { AdminPerm } from "@/lib/auth/perms";

export type User = {
  id: string;
  name: string;
  role: Role;
  username: string; // بريد أو رقم موبايل
  passwordHash: string;
  salt: string;
  active: boolean;
  phone?: string;
  grade?: string;
  stage?: string;        // المرحلة: ابتدائية/إعدادية/ثانوية
  eduSystem?: string;    // النظام التعليمي: تربية وتعليم/أزهر
  termName?: string;     // الفصل الدراسي المختار عند التسجيل
  track?: string;        // الشعبة: علمي/أدبي — للمرحلة الثانوية وحدها
  branch?: string;       // فرع الشعبة العلمية: علوم/رياضة — لتربية وتعليم وحدها
  gender?: "male" | "female"; // النوع — لصيغة المخاطبة في النصوص
  school?: string;       // اسم المدرسة
  governorate?: string;  // المحافظة (لتجميع بيانات الأماكن فقط)
  progress?: Record<string, number>; // subjectId -> %
  enrolled?: string[];               // (توافق قديم)
  subscriptions?: Subscription[];    // مصدر الوصول الفعلي
  quizResults?: QuizResult[];        // نتائج اختبارات الدروس
  examAttempts?: ExamAttempt[];      // محاولات الاختبارات
  pushSubs?: PushSub[];              // أجهزة مشتركة في إشعارات النظام (لا تُرسل للواجهة)
  deviceId?: string;                 // الجهاز المرتبط بالحساب (طالب واحد = جهاز واحد)
  deviceLabel?: string;              // وصف الجهاز للعرض في اللوحة
  deviceBoundAt?: string;            // تاريخ الارتباط
  deviceResetAt?: string;            // آخر سماح من الأدمن بجهاز جديد
  readNotifications?: string[];      // معرّفات الإشعارات المقروءة

  /* ---------- التتبّع ---------- */
  /*
    السجلُّ نفسُه ليس هنا: قاعدةُ المنصّة تُقرأ كاملةً في كل طلب، فستّةُ
    كيلوبايت لكل طالب تُقرأ في كل مرّة ثمنٌ لا يُدفع. يسكن في مسارٍ
    مستقلّ (lib/activity-store.ts) ولا يُقرأ إلا عند فتح التقرير.
    وهنا المجاميع وحدها — عشراتُ البايتات لا آلافُها.
  */
  lastSeen?: string;      // آخر ظهور
  visits?: number;        // عدد مرّات الدخول
  minutes?: number;       // دقائق المشاهدة التقريبية
  source?: string;        // من أين جاء إلى المنصّة أوّل مرّة
  landing?: string;       // أوّل صفحة دخل منها
  owner?: boolean;                   // مالكة المنصّة — كل الصلاحيات ولا تُحذف
  adminPerms?: AdminPerm[];          // صلاحيات المشرف (تُتجاهل للمالكة)
  createdAt: string;
};

/** اشتراك إشعارات الجهاز (Web Push) — سرّ لا يُرسل لأي واجهة. */
/** نوع الحدث المسجَّل في حلقة نشاط الطالب. */
export type ActivityKind =
  | "login" | "view" | "lesson" | "quiz" | "exam" | "pay" | "redeem" | "live";

/**
 * حدثٌ واحد — مضغوطٌ عمداً.
 * حروفٌ لا كلمات في النوع، ومراجعُ لا نسخٌ من الأسماء: الاسمُ يُقرأ من
 * الكورس وقت العرض، فلا يتكرّر في كل سطر.
 */
export type Activity = {
  id: string;
  at: string;
  kind: ActivityKind;
  /** ما الذي مُسّ: معرّف كورس أو درس أو مسار صفحة. */
  ref?: string;
  /** تفصيلٌ قصير حين يلزم (درجة · مبلغ · اسم). */
  meta?: string;
};

/** وضع لون الوهج. */
export type GlowMode = "solid" | "gradient" | "rgb";

/** ما الذي يُضاء. */
export type GlowTarget =
  | "all" | "cards" | "buttons" | "bar" | "hero" | "plans"
  | "sections" | "faq" | "cta" | "footer" | "tiles" | "sidebar" | "courses";

/**
 * قاعدةُ وهج — تُطبَّق على عنصرٍ أو عدّةٍ أو الكلّ.
 * طبقتان لا ظلٌّ واحد: الظلُّ لا يقبل تدرّجاً ولا يدور، والحوافُّ
 * المضيئة تحتاج تدرّجاً على الحدّ نفسِه.
 */
export type GlowRule = {
  id: string;
  targets: GlowTarget[];
  /** تعبئة خلفية العنصر نفسِه باللون أو التدرّج. */
  fill?: boolean;
  /** هالةٌ مضيئة حول العنصر. */
  bg: boolean;
  /** حافّةٌ مضيئة على حدّ العنصر. */
  edge: boolean;
  mode: GlowMode;
  c1?: string;
  c2?: string;
  intensity?: number;
  speed?: number;
  enabled?: boolean;
};

export type PushSub = {
  id: string;
  endpoint: string;
  p256dh: string;
  auth: string;
  ua?: string;
  createdAt: string;
};

export type Subscription = {
  id: string;
  /** مفتاح النطاق: "*" كل المواد · "T1"/"T2" فصل دراسي كامل · معرّف كورس. */
  subjectId: string;
  scope?: PlanScope;         // نطاق الاشتراك (للعرض والتوضيح)
  termNo?: TermNo;           // الفصل الدراسي عند نطاق الفصل
  plan: SubPlan;             // ترم/شهر (للعرض والتوافق)
  planId?: string;           // الخطة المصدر
  planName?: string;         // اسم الخطة وقت التفعيل
  activatedAt: string;
  expiresAt?: string | null; // null = بلا انتهاء
};
/** مستخدم بدون بيانات سرّية (للعرض في الواجهة). */
export type PublicUser = Omit<User, "passwordHash" | "salt" | "pushSubs"> & {
  /** عدد الأجهزة المشتركة في الإشعارات فقط — بلا أي بيانات اشتراك. */
  pushDevices?: number;
};

/* ---------- التكاملات الخارجية (أسرار — لا تغادر السيرفر) ---------- */
export type GoogleIntegration = {
  connected: boolean;
  email?: string;         // حساب جوجل المربوط
  accessToken?: string;   // سرّ
  refreshToken?: string;  // سرّ
  expiryDate?: number;    // ms منذ epoch
  scope?: string;
  connectedAt?: string;
  driveFolderId?: string; // مجلّد الوسائط في Drive
};
/** سجلّ نسخة احتياطية واحدة. */
export type BackupEntry = {
  at: string;
  reason: "manual" | "auto";
  size: number;              // حجم النسخة بالبايت
  driveFileId?: string;
  driveName?: string;
  firebase?: boolean;
  error?: string;
};

/**
 * قاعدةُ بياناتٍ في السلسلة.
 * الرئيسيةُ تُقرأ ويُكتب فيها، والفروعُ نُسخٌ تحلّ محلَّها إن تعطّلت أو
 * امتلأت. وكلُّها تحمل النسخةَ نفسَها — ومنها قائمةُ القواعد ذاتُها،
 * فأيُّ قاعدةٍ تردّ تعرف أخواتِها.
 */
export type DbNode = {
  id: string;
  name: string;
  /** عنوان قاعدة Realtime Database. */
  url: string;
  /** اعتمادُ الوصول — سرٌّ قديم أو حسابُ خدمة. لا يغادر الخادم. */
  secret?: string;
  clientEmail?: string;
  privateKey?: string;
  role: "primary" | "branch";
  enabled: boolean;
  order?: number;
  /** السعة بالميجابايت — تجاوزُ ٩٢٪ منها ينقل الكتابة للتالية. */
  capacityMB?: number;
  addedAt?: string;
};

export type Integrations = {
  google?: GoogleIntegration;
  driveBackupFolderId?: string;
  lastBackupAt?: string;
  backups?: BackupEntry[];
  /** مفتاح YouTube Data API — سرّ يُحفظ على الخادم ولا يُرسل للواجهة إطلاقاً. */
  youtubeApiKey?: string;
  /** بوت تليجرام — التوكن سرّ لا يُرسل للواجهة إطلاقاً. */
  telegram?: TelegramIntegration;
  /** سلسلةُ قواعد البيانات — تُنسخ في كلٍّ منها فتعرف أخواتِها. */
  databases?: DbNode[];
  /**
   * Bunny Stream — مفتاحُ التوقيع سرٌّ لا يُرسل للواجهة إطلاقاً.
   * به تُوقَّع روابطُ التشغيل فتنتهي بعد دقائق، فالمنسوخُ منها يموت.
   */
  bunny?: BunnyIntegration;
};

export type BunnyIntegration = {
  /** `Token Authentication Key` من لوحة Bunny — سرٌّ يبقى على الخادم. */
  tokenKey?: string;
  /** معرّفُ المكتبة الافتراضيّ — ليس سرّاً، يظهر في الرابط نفسِه. */
  libraryId?: string;
  /** عمرُ الرابط بالثواني (٦٠–٢١٦٠٠). القصيرُ أأمن، والطويلُ يحتمل درساً كاملاً. */
  ttl?: number;
};
/** ما يُسمح بإرساله للواجهة عن التكاملات (بلا أي رموز). */
export type PublicIntegrations = {
  google?: { connected: boolean; email?: string; connectedAt?: string; configured: boolean };
  /** هل مفتاح يوتيوب مضبوط؟ (وجوده فقط — لا قيمته) */
  youtubeApiKey?: boolean;
  /** هل مفاتيح إشعارات الأجهزة مضبوطة؟ — بلا مفاتيح لا يصل شيء والموقع مغلق. */
  push?: boolean;
  /** حالة بوت تليجرام — بلا توكن: وجوده ومعرّف المحادثة واسمه فقط. */
  telegram?: { configured: boolean; enabled: boolean; chatId?: string; username?: string; webhookSetAt?: string };
  /** عدد قواعد البيانات المضبوطة — بلا عناوين ولا اعتمادات. */
  databases?: number;
  /** حالةُ Bunny — وجودُ المفتاح لا قيمتُه، والمكتبةُ ليست سرّاً. */
  bunny?: { configured: boolean; libraryId?: string; ttl?: number };
};

/* ---------- قناة يوتيوب ---------- */
export type YoutubeVideo = {
  id: string;            // معرّف الفيديو على يوتيوب
  title: string;
  publishedAt?: string;
  thumbnail?: string;
  description?: string;
  duration?: string;
  views?: number;
  hidden?: boolean;      // مخفي عن الموقع (يبقى ظاهراً في اللوحة)
  featured?: boolean;    // مثبّت في المقدّمة
  order?: number;
};

export type YoutubeChannel = {
  channelId?: string;
  handle?: string;         // @اسم القناة
  title?: string;
  url?: string;
  thumbnail?: string;
  subscribers?: number;
  videoCount?: number;
  syncedAt?: string;       // آخر مزامنة
  source?: "api" | "rss";  // مصدر الجلب
  videos: YoutubeVideo[];
};

/* ---------- سجلّ الأمان ---------- */
export type SecurityKind =
  | "login_failed"        // كلمة مرور خاطئة
  | "login_ok"            // دخول ناجح
  | "unauthorized_admin"  // محاولة وصول لمسار إداري بلا صلاحية
  | "device_mismatch"     // دخول من جهاز غير المرتبط
  | "bad_code"            // كود تفعيل خاطئ
  | "rate_limited"        // تجاوز حدّ المحاولات
  | "path_probe"          // فحص مسارات معروفة (اختراق آلي)
  | "bot_blocked"         // بوت اختراق أو كشط عُرف من وسمه
  | "bot_trap"            // ملء حقل الفخّ في نموذج الدخول — آلةٌ لا إنسان
  | "csrf_blocked"        // طلب من أصل خارجي
  | "media_denied"        // طلب ملف غير مسجّل في المنصّة
  | "banned_hit"          // عنوان محظور حاول الدخول
  | "signup"              // إنشاء حساب
  | "admin_added"         // إضافة مشرف
  | "admin_changed"       // تعديل صلاحيات مشرف
  | "admin_removed"       // حذف مشرف
  | "perm_denied"         // مشرف حاول قسماً بلا صلاحية
  | "db_promote"          // فرعٌ تولّى مكان الرئيسية (عطل أو امتلاء)
  | "db_open_rules"       // قاعدة قواعدُها مفتوحة للعالم
  | "db_down";            // قاعدة سقطت في الفحص

export type SecurityEvent = {
  id: string;
  at: string;
  kind: SecurityKind;
  ip: string;
  ua?: string;
  detail?: string;
  userId?: string;
  username?: string;
  severity: "info" | "high";
};

export type SecurityBan = { ip: string; until: string; reason: string; at: string };

/* ---------- قاعدة البيانات الكاملة ---------- */

/* ------------------------------------------------------------------ */
/*  بوّابة الدفع                                                       */
/* ------------------------------------------------------------------ */

/**
 * نوع طريقة الدفع — يحدّد أيقونتها وشكل بياناتها ونصّ تعليماتها.
 * ليس مجرّد تسمية: المحفظة تُنسَّق رقماً، والبنك يُنسَّق حساباً واسم بنك،
 * والرابط يُفتح، فلا يصحّ أن يُعرض الثلاثة بالقالب نفسه.
 */
export type PayMethodKind =
  | "wallet"    // محفظة هاتف (فودافون كاش · اتصالات كاش · أورنج · وي)
  | "bank"      // حساب بنكي / IBAN
  | "instapay"  // إنستاباي
  | "fawry"     // فوري
  | "link"      // رابط دفع خارجي
  | "other";    // غير ذلك

export type PayMethod = {
  id: string;
  kind: PayMethodKind;
  name: string;        // «فودافون كاش»
  holder?: string;     // اسم صاحب الحساب
  number: string;      // الرقم / الـIBAN / الرابط
  extra?: string;      // بيانات إضافية (اسم البنك، رقم الحساب، الفرع…)
  note?: string;       // تعليمات يراها الطالب
  logo?: string;       // شعار مرفوع (اختياري)
  color?: string;      // لون البطاقة (HEX) — فارغ = لون الثيم
  active: boolean;     // معطّلة لا تظهر للطالب
  order?: number;
};

/** حالة طلب الدفع. */
export type PayRequestStatus = "pending" | "approved" | "rejected";

/**
 * طلب دفع من طالب.
 * لقطة كاملة وقت الطلب (الاسم والسعر واسم الخطة) لا مراجع فقط — فلو
 * حُذفت الخطة أو تغيّر سعرها بقي الطلب مفهوماً كما قُدّم.
 */
export type PayRequest = {
  id: string;
  at: string;
  userId: string;
  student: string;
  phone?: string;
  grade?: string;
  track?: string;
  planId: string;
  planName: string;
  subjectId?: string;
  subjectName?: string;
  amount: number;
  methodId: string;
  methodName: string;
  /**
   * الحساب الذي حُوِّل إليه — رقمه واسم صاحبه وقت الطلب.
   * صار للمنصّة أكثرُ من حساب تُعرض معاً، فاسمُ الطريقة وحده لا يقول
   * أيَّ حسابٍ يُراجَع كشفُه.
   */
  methodNumber?: string;
  methodHolder?: string;
  senderName?: string;    // اسم المُحوِّل كما كتبه الطالب
  senderAccount?: string; // الرقم أو الحساب الذي حُوِّل منه
  senderRef?: string;    // رقم العملية
  receipt?: string;      // صورة التحويل
  note?: string;         // ملاحظة الطالب
  status: PayRequestStatus;
  code?: string;         // كود التفعيل الصادر عند القبول
  reason?: string;       // سبب الرفض
  handledAt?: string;
  handledBy?: string;
  /** حالة الإرسال لبوت تليجرام — تُعرض في اللوحة فيُعرف إن فشل التنبيه. */
  telegram?: "sent" | "failed" | "off";
  readByAdmin?: boolean;
  /** متى فعّل الطالب الكود — فيُعرف المدفوعُ الذي لم يُستعمل بعد. */
  redeemedAt?: string;
};

/** إعدادات البوّابة — بياناتها ونصوصها وشروطها. */
export type PaymentsConfig = {
  enabled?: boolean;         // مطفأة = يبقى الشراء عبر واتساب كما كان
  methods?: PayMethod[];
  title?: string;
  desc?: string;
  note?: string;             // تنبيه أسفل البوّابة
  requireReceipt?: boolean;  // إلزام صورة التحويل (افتراضي: نعم)
  requireSender?: boolean;   // إلزام اسم/رقم المُحوِّل
  autoCode?: boolean;        // توليد كود التفعيل تلقائياً عند القبول
  style?: string;            // تصميم البوّابة (lib/pay-styles.ts)
  colors?: { bg?: string; accent?: string; text?: string };
};

/** تكامل بوت تليجرام — التوكن سرّ لا يغادر الخادم. */
export type TelegramIntegration = {
  token?: string;
  chatId?: string;
  /** سرّ ترويسة الويبهوك — يمنع أن يُطعِم أحدٌ البوتَ تحديثات مزوّرة. */
  webhookSecret?: string;
  webhookSetAt?: string;
  username?: string;         // @اسم البوت (للعرض)
  enabled?: boolean;
  /** محادثة الدعم على تليجرام — فارغةً تُستعمل محادثة التنبيهات. */
  supportChatId?: string;
  /** إيقاف جسر الدعم وحده دون إيقاف تنبيهات الدفع. */
  supportOff?: boolean;
  /**
   * المعرّفات المسموح لها بمخاطبة البوت والبتّ في الطلبات.
   * فارغةً: محادثة التنبيهات وحدها. البوت عامّ على تليجرام — أي أحد
   * يعرف اسمه يستطيع مراسلته، فبدون هذه القائمة يرى غريبٌ أسماء
   * الطلاب ومبالغهم بأمر واحد.
   */
  allowedIds?: string[];
};

export type DB = {
  integrations?: Integrations;
  security?: { events: SecurityEvent[]; bans: SecurityBan[] };
  youtube?: YoutubeChannel;
  content: SiteContent;
  plans: SitePlan[];
  students: Student[];
  subjects: Subject[];
  grades: GradeRow[];
  /** طلباتُ نقل المراحل — تُقرّ من لوحة الطلاب. */
  gradeRequests?: GradeRequest[];
  codes: Code[];
  exams: Exam[];
  live: Live[];
  tickets: Ticket[];
  notifications: Notification[];
  /** طلبات الدفع الواردة من الطلاب. */
  payments?: PayRequest[];
  users: User[];
};

/** ما يُرسل للواجهة عبر /api/content (بدون كلمات المرور ولا رموز التكاملات). */
export type PublicDB = Omit<DB, "users" | "integrations"> & {
  users: PublicUser[];
  integrations?: PublicIntegrations;
};
