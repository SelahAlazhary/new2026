import type { AdminPerm } from "@/lib/auth/perms";
import type { PlanDiscount } from "@/lib/utils/types";

/**
 * أنواعُ المنصّة الأمّ (Hub) — ما يعيش خارج قاعدة أيّ منصّة بعينها.
 * ------------------------------------------------------------------
 * قاعدةُ كلّ منصّة (`tenants/{id}/platform`) هي مخطّطُ `DB` القديم حرفاً
 * بحرف. وما هنا هو ما يُدار من فوقها: المستأجرون وأصحابُهم وخططُ
 * الاشتراك في الـHub وفواتيرُه ودوميناتُه وسجلُّ تدقيقه.
 *
 * الجذر في فايربيز:
 *   hub/tenants/{tenantId} · hub/slugs/{slug} · hub/owners/{ownerId}
 *   hub/saasPlans/{planId} · hub/subscriptions/{subId} · hub/invoices/{id}
 *   hub/domains/{domainId} · hub/audit/{eventId} · hub/settings
 *   hub/superAdmins/{id}
 *   tenants/{tenantId}/platform   ← DB المنصّة كاملة
 *   tenants/{tenantId}/backups · activity · claims · decisions
 */

export type TenantStatus =
  | "onboarding"
  | "pending_approval"
  | "active"
  | "suspended"
  | "expired"
  | "archived";

export type OnboardingStep =
  | "plan" | "payment" | "approval" | "name" | "logo" | "identity" | "design" | "domain" | "review" | "pay" | "done";

/**
 * قسمٌ من لوحة أدمن المنصّة يُخفى من الـHub.
 * صلاحياتُ `lib/perms.ts` + أقسامٌ لا صلاحيةَ خاصّةً لها في القديم.
 */
export type HideableSection = AdminPerm | "maintenance" | "databases" | "reports" | "supportChat";

export type TenantFeature =
  | "liveMeet" | "youtube" | "telegramBot" | "bunny" | "drive" | "webPush"
  | "studentPayments" | "codes" | "exams" | "backup" | "customDomain" | "team"
  | "captureGuard" | "poweredBy";

export type TenantLimits = {
  maxStudents: number | null;       // null = بلا حدّ
  maxSubjects: number | null;
  maxAdmins: number | null;
  maxStorageMB: number | null;
  customDomain: boolean;
};

export type TenantStats = {
  students: number; activeSubs: number; subjects: number; lessons: number;
  admins: number; lastActivityAt?: string; revenueEGP: number; securityEvents30d: number;
  estimatedBytes?: number; updatedAt: string;
};

export type Tenant = {
  id: string;                       // مثال: "t_8f3a…" — ثابتٌ لا يتغيّر
  slug: string;                     // النطاق الفرعي: {slug}.ROOT_DOMAIN — فريد
  name: string;                     // اسم المنصّة
  description?: string;
  logo?: string;
  ownerId: string;                  // TenantOwner.id — فارغٌ للمنصّة المرحَّلة حتى يُربط
  status: TenantStatus;
  suspendReason?: string;
  createdAt: string;
  activatedAt?: string;
  onboardingStep: OnboardingStep;
  brandPresetId: string;
  brandColors: { primary: string; gold: string; paper: string };
  /** الأقسام المخفيّة من لوحة أدمن هذه المنصّة — يضبطها الـSuper Admin فقط. */
  hiddenSections: HideableSection[];
  /** ميزاتٌ تُطفأ لهذه المنصّة (تُفحص على الخادم). */
  features: Partial<Record<TenantFeature, boolean>>;
  limits: TenantLimits;
  customDomain?: string;
  subscriptionId?: string;
  adminEmail: string;
  stats?: TenantStats;
  notes?: string;
};

export type TenantOwner = {
  id: string;
  email: string;
  name: string;
  picture?: string;
  /** معرّف جوجل الثابت — فارغٌ لمن سجّل بالبريد وكلمة المرور. */
  googleSub: string;
  /** تجزئة كلمة المرور (scrypt) — لمن سجّل بالبريد. جوجل وحدها بلا كلمة مرور. */
  passwordHash?: string;
  salt?: string;
  phone?: string;
  tenantIds: string[];
  createdAt: string;
  lastLoginAt?: string;
  blocked?: boolean;
};

export type SaasPlan = {
  id: string; name: string; desc?: string;
  interval: "month" | "quarter" | "year";
  priceEGP: number; discount?: PlanDiscount;
  trialDays: number;
  limits: TenantLimits;
  features: TenantFeature[];
  highlight?: boolean; badge?: string; color?: string; order: number; visible: boolean;
};

export type SaasSubscriptionStatus =
  | "trialing" | "pending_payment" | "pending_approval" | "active" | "past_due" | "canceled" | "expired";

export type SaasSubscription = {
  id: string; tenantId: string; planId: string;
  status: SaasSubscriptionStatus;
  startedAt: string; currentPeriodEnd: string;
  cancelAtPeriodEnd?: boolean;
  approvedBy?: string; approvedAt?: string;
  history: { at: string; from: string; to: string; by: "system" | "super" | "owner"; note?: string }[];
};

export type SaasInvoice = {
  id: string; tenantId: string; subscriptionId: string; planId: string;
  amountEGP: number; currency: "EGP";
  provider: "paymob" | "manual";
  status: "pending" | "paid" | "failed" | "refunded" | "rejected";
  providerRef?: string;
  receiptUrl?: string;
  manualMethod?: { kind: "instapay" | "wallet" | "bank"; senderNumber?: string; senderName?: string; transactionRef?: string; note?: string };
  createdAt: string; paidAt?: string; reviewedBy?: string; reviewNote?: string;
  idempotencyKey: string;
};

export type CustomDomain = {
  id: string; tenantId: string; domain: string;
  status: "pending_dns" | "verifying" | "active" | "failed" | "removed";
  vercelVerification?: { type: string; domain: string; value: string }[];
  lastCheckedAt?: string; error?: string; createdAt: string; activatedAt?: string;
};

export type AuditEvent = {
  id: string; at: string;
  actor: { kind: "super" | "owner" | "system"; id: string; name: string };
  action: string;
  tenantId?: string; details?: Record<string, unknown>; ip?: string;
};

export type HubSettings = {
  rootDomain: string;
  brand: { name: string; logo?: string; primary: string };
  paymob: { enabled: boolean; integrationIds: { card?: number; wallet?: number } };
  manualPay: {
    enabled: boolean;
    methods: { kind: "instapay" | "wallet" | "bank"; label: string; number: string; active: boolean }[];
  };
  approval: "manual" | "auto_after_payment";
  gracePeriodDays: number;
  emailFrom: string;
};

export type SuperAdmin = {
  id: string; name: string; email: string;
  passwordHash: string; salt: string;
  deviceId?: string; deviceLabel?: string;
  createdAt: string; active: boolean;
};

/** الحدود الافتراضية لمنصّةٍ بلا خطّة (المرحَّلة أو التجريبية). */
export const UNLIMITED: TenantLimits = {
  maxStudents: null, maxSubjects: null, maxAdmins: null, maxStorageMB: null, customDomain: true,
};
