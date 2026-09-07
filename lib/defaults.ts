/**
 * القيم الافتراضية (Seed).
 * المنصة تبدأ فارغة من أي بيانات — لا طلاب/مواد/أكواد/اختبارات وهمية.
 * كل المحتوى الفعلي يُضاف من لوحة الأدمن، والحسابات تُنشأ من التسجيل.
 * تبقى فقط: نصوص الواجهة (قابلة للتعديل) + حساب المالك (الأدمن).
 */
import type {
  SiteContent, SitePlan, Student, Subject, GradeRow, Code, Exam, Live, Ticket,
} from "./types";

export const defaultContent: SiteContent = {
  brand: "منصّتي التعليمية",
  platformSubtitle: "",
  developer: { name: "EX-EG" },
  teacher: {
    name: "",
    subject: "",
    headline: "",
    tagline: "",
    bio: "",
    experienceYears: 0,
    avatar: "/teacher.svg",
    logo: "",
    rating: 0,
    ratingCount: 0,
    topStudents: 0,
  },
  hero: { statusPill: "", frame: 1 },
  plansSection: {
    eyebrow: "الخطط",
    title: "اختر خطة اشتراكك",
    desc: "",
    note: "",
  },
  cta: {
    registerLabel: "سجّل الآن",
    registerUrl: "/register",
    heroPrimaryLabel: "أنشئ حساب طالب",
    secondaryLabel: "",
    videoUrl: "",
    whatsappLabel: "تواصل معنا",
    whatsappUrl: "",
    whatsappText: "السلام عليكم، أود الاستفسار عن الاشتراك",
  },
  whatsapp: "",
  social: { facebook: "", youtube: "", telegram: "" },
  support: { email: "", phone: "", whatsapp: "" },
  url: "",
  theme: { layout: "light", preset: "midad", customPrimary: null },
  grades: [],
  features: [],
  curriculum: [],
  honorStudents: [],
  faqs: [],
};

/* المنصة تبدأ فارغة تماماً — كل شيء يُضاف من لوحة الأدمن. */
/** لا توجد خطط افتراضية — تُضاف كلها من «/admin/plans». */
export const defaultPlans: SitePlan[] = [];
export const defaultStudents: Student[] = [];
export const defaultSubjects: Subject[] = [];
export const defaultGrades: GradeRow[] = [];
export const defaultCodes: Code[] = [];
export const defaultExams: Exam[] = [];
export const defaultLive: Live[] = [];
export const defaultTickets: Ticket[] = [];
export const defaultNotifications: import("./types").Notification[] = [];

