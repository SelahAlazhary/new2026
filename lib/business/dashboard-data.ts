/** إعدادات تنقّل اللوحات + بذور تصوّرات بسيطة. البيانات الفعلية تأتي من قاعدة البيانات عبر useContent(). */

export type NavItem = { href: string; label: string; icon: string };

export const adminNav: NavItem[] = [
  { href: "/admin", label: "نظرة عامة", icon: "LayoutDashboard" },
  { href: "/admin/appearance", label: "المظهر والتخطيط", icon: "Palette" },
  { href: "/admin/customize", label: "تخصيص الموقع", icon: "Palette" },
  { href: "/admin/students", label: "الطلاب", icon: "Users" },
  { href: "/admin/grades", label: "الصفوف", icon: "Layers" },
  { href: "/admin/subjects", label: "الكورسات", icon: "BookOpen" },
  { href: "/admin/units", label: "الموادّ", icon: "Layers" },
  { href: "/admin/lessons", label: "كل الدروس", icon: "ListVideo" },
  { href: "/admin/plans", label: "الخطط", icon: "Wallet" },
  { href: "/admin/payments", label: "بوّابة الدفع", icon: "Wallet" },
  { href: "/admin/codes", label: "أكواد التفعيل", icon: "KeyRound" },
  { href: "/admin/exams", label: "الاختبارات", icon: "FileCheck2" },
  { href: "/admin/live", label: "البث المباشر", icon: "Radio" },
  { href: "/admin/youtube", label: "قناة اليوتيوب", icon: "Youtube" },
  { href: "/admin/notifications", label: "الإشعارات", icon: "Bell" },
  { href: "/admin/reports", label: "تقارير الطلاب", icon: "BarChart3" },
  { href: "/admin/analytics", label: "التحليلات", icon: "BarChart3" },
  { href: "/admin/security", label: "الأمان", icon: "Shield" },
  { href: "/admin/backup", label: "النسخ الاحتياطي", icon: "Database" },
  { href: "/admin/databases", label: "قواعد البيانات", icon: "Database" },
  { href: "/admin/maintenance", label: "الصيانة", icon: "Wrench" },
  { href: "/admin/testimonials", label: "شهادات الطلاب", icon: "Star" },
  { href: "/admin/support", label: "الدعم", icon: "LifeBuoy" },
  { href: "/admin/support/chat", label: "محادثات الدعم", icon: "Bell" },
  { href: "/admin/team", label: "المشرفون", icon: "Shield" },
];

/**
 * تجميعُ قائمة الإدارة.
 * ------------------------------------------------------------------
 * اثنان وعشرون رابطاً في عمودٍ واحدٍ مسطّح: من أراد «أكواد التفعيل» مسح
 * الاثنين والعشرين حتّى يبلغها، ومن دخل «قواعد البيانات» لم يعرف أنّها
 * أخت «النسخ الاحتياطي». والطولُ وحدَه يُخفي: أواخرُ القائمة تحت حافّة
 * الشاشة لا تُرى إلّا بتمرير.
 *
 * والتجميعُ **بالعمل لا بالنوع**: من فتح «الطلاب» غالباً يريد خطّةً أو
 * كوداً أو دفعة، لا مادّةً ولا مظهراً. فكلُّ مجموعةٍ سؤالٌ واحدٌ يجيب عنه
 * الأدمن في جلسةٍ واحدة.
 *
 * و«نظرة عامة» تبقى خارج المجموعات: هي المقصدُ الأوّل بعد الدخول، ووضعُها
 * داخل مجموعةٍ تُطوى يجعل أوّلَ ما يُراد أبعدَ ما يُنال.
 *
 * والترتيبُ هنا مصدرُ الحقيقة للتجميع فقط — **الصلاحياتُ تُصفّى قبله**،
 * فما لا يملكه المشرفُ لا يصل هذه الدالّة أصلاً، ومجموعةٌ خلت من روابطها
 * كلِّها تسقط ولا تُعرض عنواناً فارغاً.
 */
export type NavGroup = { id: string; label: string; icon: string; items: NavItem[] };

const GROUPS: { id: string; label: string; icon: string; hrefs: string[] }[] = [
  {
    id: "study",
    label: "المحتوى الدراسي",
    icon: "BookOpen",
    hrefs: ["/admin/grades", "/admin/subjects", "/admin/units", "/admin/lessons", "/admin/exams", "/admin/live", "/admin/youtube"],
  },
  {
    id: "people",
    label: "الطلاب والاشتراكات",
    icon: "Users",
    hrefs: ["/admin/students", "/admin/reports", "/admin/plans", "/admin/payments", "/admin/codes"],
  },
  {
    id: "look",
    label: "المظهر والموقع",
    icon: "Palette",
    hrefs: ["/admin/appearance", "/admin/customize", "/admin/testimonials"],
  },
  {
    id: "talk",
    label: "التواصل والدعم",
    icon: "Bell",
    hrefs: ["/admin/notifications", "/admin/support", "/admin/support/chat"],
  },
  {
    id: "system",
    label: "النظام والبيانات",
    icon: "Shield",
    hrefs: [
      "/admin/analytics",
      "/admin/security",
      "/admin/backup",
      "/admin/databases",
      "/admin/maintenance",
      "/admin/team",
    ],
  },
];

/** يقسم قائمةً مُصفّاةً بالصلاحيات إلى وحيدٍ ومجموعات. */
export function groupNav(items: NavItem[]): { solo: NavItem[]; groups: NavGroup[] } {
  const by = new Map(items.map((i) => [i.href, i]));
  const taken = new Set<string>();

  const groups: NavGroup[] = [];
  for (const g of GROUPS) {
    const got = g.hrefs.map((h) => by.get(h)).filter((x): x is NavItem => Boolean(x));
    got.forEach((i) => taken.add(i.href));
    if (got.length) groups.push({ id: g.id, label: g.label, icon: g.icon, items: got });
  }

  /* ما لم يُذكر في مجموعةٍ يبقى وحيداً بترتيبه الأصلي — فرابطٌ جديدٌ
     يُضاف غداً يظهر فوراً ولا يختفي لأنّه نُسي هنا. */
  return { solo: items.filter((i) => !taken.has(i.href)), groups };
}

export const studentNav: NavItem[] = [
  { href: "/student", label: "الرئيسية", icon: "Home" },
  { href: "/student/subjects", label: "موادي", icon: "BookOpen" },
  { href: "/student/exams", label: "الاختبارات", icon: "FileCheck2" },
  { href: "/student/live", label: "البث المباشر", icon: "Radio" },
  { href: "/student/notifications", label: "الإشعارات", icon: "Bell" },
  { href: "/student/account", label: "حسابي", icon: "Users" },
  { href: "/student/help", label: "المساعدة", icon: "LifeBuoy" },
];

/** بذور تصوّرات (يمكن لاحقاً اشتقاقها من بيانات فعلية). */
export const enrollTrend = [120, 180, 240, 210, 320, 380, 420, 460, 540, 610, 680, 760];
export const revenueByGrade = [
  { grade: "التمهيدي", value: 96000 },
  { grade: "المتوسط", value: 158000 },
  { grade: "المتقدّم", value: 174500 },
];
