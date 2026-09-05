# 🏗️ برومبت تحويل المنصّة إلى نظام SaaS متعدّد المنصّات (Multi-Tenant)

> **طريقة الاستخدام:** انسخ هذا الملف كاملاً في أوّل رسالة لمساعد البرمجة داخل مجلّد المشروع `C:\Users\pc\Downloads\mohamed-kamal`. اقرأ `HANDOFF.md` و`DEPLOY.md` و`AGENTS.md` أوّلاً، ثم نفّذ المراحل بالترتيب المذكور في §12 ولا تنتقل لمرحلة قبل اكتمال اختبارات المرحلة السابقة.

---

## 0) الدور والسياق

أنت مهندس برمجيات أوّل (Staff Engineer) متخصّص في Next.js App Router وأنظمة SaaS متعدّدة المستأجرين. أمامك منصّة تعليمية عربية (RTL) **مكتملة وتعمل في الإنتاج** لمدرّس واحد:

- **التقنيات:** Next.js 16.3 (App Router · Turbopack) · React 19 · TypeScript · Tailwind v3 · Framer Motion · Firebase Realtime Database عبر REST من الخادم فقط · Google OAuth (Meet + Drive) · Web Push · Vercel.
- **البنية الحالية المهمّة (لا تُعِد كتابتها، ابنِ فوقها):**
  - `lib/store.ts` طبقة التخزين: ذاكرة مؤقّتة ١٥ ثانية + طابور كتابة، والجذر في فايربيز ثابت `ROOT = "platform"`.
  - `lib/db.ts` → `loadDB / getDB / saveDB / flushDB / getScopedDB` (الحمولة مقيّدة بدور صاحب الجلسة).
  - `lib/session.ts` كوكي `emz_session` موقّعة HMAC تحمل `{uid, role, name}`.
  - `lib/perms.ts` صلاحيات مشرفي اللوحة (`AdminPerm` · `can()` · `permForPath()` · `permForDbKey()` · `APPEARANCE_KEYS`).
  - `app/admin/layout.tsx` يفلتر `adminNav` بالصلاحيات ويحمي المسار عبر ترويسة `x-pathname` من `middleware.ts`.
  - `lib/skins.ts` (٢٠ ثيم لوني لبوابة الطالب) · `lib/designs.ts` (٢٠ هيئة أشكال) · `lib/brand-theme.ts` (`brandVars` من ٣ ألوان: primary/gold/paper) · عشرات ملفّات `*-styles.ts` لكل جزء من الواجهة.
  - `lib/payments.ts` + `/admin/payments` بوّابة دفع **الطالب للمدرّس** (تحويل يدوي + بوت تليجرام). هذه تبقى كما هي؛ المطلوب بوّابة **ثانية** منفصلة لاشتراك المدرّس في المنصّة الأم.
  - `lib/google.ts` تدفّق OAuth كامل (نطاقات calendar + drive.file + openid email).
  - `middleware.ts` ترويسات أمان + CSP + صدّ البوتات + CSRF + حاجز إغراق.
  - `lib/guard.ts` · `lib/security.ts` · `lib/device.ts` (ربط الحساب بجهاز واحد).

**الهدف:** تحويل هذا الكود إلى **منصّة أمّ (Hub)** يملكها «أدمن المنصّات» (Super Admin)، يشترك فيها المدرّسون، فتُنشأ لكل مدرّس **منصّة مستقلّة تماماً** (لوحة أدمن + بوّابة طالب + صفحة هبوط) على نطاق فرعي أو دومين خاص، مع عزل بيانات كامل وتحكّم مركزي شامل.

---

## 1) قواعد غير قابلة للتفاوض

1. **لا كسر لأي ميزة قائمة.** كل ما في `HANDOFF.md` §6 يجب أن يعمل داخل كل منصّة مستأجر كما يعمل الآن.
2. **عزل البيانات مطلق.** لا يوجد مسار واحد يُرجع بيانات مستأجر لآخر. أي `getDB()` بلا سياق مستأجر يجب أن **يرمي خطأً** لا أن يُرجع بيانات افتراضية.
3. **كل فحص صلاحية على الخادم.** إخفاء رابط أو زر ليس حماية. الأقسام المخفيّة من الـHub تُرفض على مستوى `layout` و`API` معاً.
4. **لا بيانات وهمية.** المنصّة الجديدة تبدأ فارغة (كما هو الحال الآن).
5. **الأسرار في متغيّرات البيئة فقط**، ولا يصل أي رمز/مفتاح للمتصفّح.
6. **الأسلوب الحالي للكود يُحترم:** تعليقات عربية تشرح «لماذا»، مكوّنات SVG يدوية في الواجهة العامّة، Tailwind، لا مكتبات UI جديدة ثقيلة. أي مكتبة جديدة تُبرَّر في التعليق.
7. **قابلية الترحيل:** بيانات المنصّة الحالية في `platform/` تُرحَّل إلى أوّل مستأجر بسكربت قابل للإعادة (idempotent) بلا فقد.
8. **كل مرحلة تنتهي بـ `npm run build` ناجح + اختبارات المرحلة.**

---

## 2) نموذج البيانات الجديد (Hub Schema)

أنشئ `lib/hub/types.ts`. الجذر الجديد في فايربيز:

```
hub/
  tenants/{tenantId}          Tenant
  owners/{ownerId}            TenantOwner      (حساب المدرّس على الـHub — دخول جوجل)
  saasPlans/{planId}          SaasPlan
  subscriptions/{subId}       SaasSubscription
  invoices/{invoiceId}        SaasInvoice
  domains/{domainId}          CustomDomain
  audit/{eventId}             AuditEvent
  settings                    HubSettings
  superAdmins/{id}            SuperAdmin
tenants/{tenantId}/platform/  ← نسخة كاملة من مخطّط DB الحالي (content, users, subjects…)
```

```ts
export type TenantStatus = "onboarding" | "pending_approval" | "active" | "suspended" | "expired" | "archived";

export type Tenant = {
  id: string;                       // مثال: "t_8f3a…"
  slug: string;                     // النطاق الفرعي: {slug}.ROOT_DOMAIN — فريد، أحرف لاتينية صغيرة وأرقام وشرطة
  name: string;                     // اسم المنصّة
  description?: string;
  logo?: string;                    // رابط الشعار/صورة المدرّس
  ownerId: string;                  // TenantOwner.id
  status: TenantStatus;
  suspendReason?: string;           // يُعرض للمدرّس عند الإيقاف
  createdAt: string;
  activatedAt?: string;
  onboardingStep: "plan" | "payment" | "approval" | "name" | "logo" | "design" | "domain" | "done";
  brandPresetId: string;            // من الـ20 (انظر §7)
  brandColors: { primary: string; gold: string; paper: string };
  /** الأقسام المخفيّة من لوحة أدمن هذه المنصّة — يضبطها الـSuper Admin فقط. */
  hiddenSections: AdminPerm[];      // نفس مفاتيح lib/perms.ts + "maintenance" + "databases"
  /** مفاتيح ميزات تُطفأ لهذه المنصّة (تُفحص على الخادم). */
  features: Partial<Record<TenantFeature, boolean>>;
  limits: TenantLimits;             // نسخة من حدود الخطة وقت التفعيل (تُجمَّد حتى تجديد)
  customDomain?: string;            // بعد التحقّق
  adminEmail: string;               // بريد لوحة أدمن المنصّة (= بريد جوجل المدرّس افتراضاً)
  stats?: TenantStats;              // تُحدَّث دورياً — للعرض في الـHub
  notes?: string;                   // ملاحظات داخلية للـSuper Admin
};

export type TenantFeature =
  | "liveMeet" | "youtube" | "telegramBot" | "bunny" | "drive" | "webPush"
  | "studentPayments" | "codes" | "exams" | "backup" | "customDomain" | "team" | "captureGuard";

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

export type TenantOwner = {
  id: string;
  email: string;                    // من جوجل — فريد
  name: string;
  picture?: string;
  googleSub: string;                // معرّف جوجل الثابت (sub في id_token)
  phone?: string;
  tenantIds: string[];              // مدرّس واحد قد يملك أكثر من منصّة لاحقاً
  createdAt: string;
  lastLoginAt?: string;
  blocked?: boolean;
};

export type SaasPlan = {
  id: string; name: string; desc?: string;
  interval: "month" | "quarter" | "year";
  priceEGP: number; discount?: PlanDiscount;   // أعد استخدام النوع من lib/types.ts
  trialDays: number;
  limits: TenantLimits;
  features: TenantFeature[];
  highlight?: boolean; badge?: string; color?: string; order: number; visible: boolean;
};

export type SaasSubscription = {
  id: string; tenantId: string; planId: string;
  status: "trialing" | "pending_payment" | "pending_approval" | "active" | "past_due" | "canceled" | "expired";
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
  providerRef?: string;             // معرّف الطلب عند بايموب
  receiptUrl?: string;              // إيصال التحويل اليدوي
  manualMethod?: { kind: "instapay" | "wallet" | "bank"; senderNumber?: string; note?: string };
  createdAt: string; paidAt?: string; reviewedBy?: string; reviewNote?: string;
  idempotencyKey: string;
};

export type CustomDomain = {
  id: string; tenantId: string; domain: string;   // بلا بروتوكول، أحرف صغيرة
  status: "pending_dns" | "verifying" | "active" | "failed" | "removed";
  vercelVerification?: { type: string; domain: string; value: string }[];
  lastCheckedAt?: string; error?: string; createdAt: string; activatedAt?: string;
};

export type AuditEvent = {
  id: string; at: string;
  actor: { kind: "super" | "owner" | "system"; id: string; name: string };
  action: string;                   // "tenant.suspend" | "tenant.hideSection" | "invoice.approve" | "impersonate.start" …
  tenantId?: string; details?: Record<string, unknown>; ip?: string;
};

export type HubSettings = {
  rootDomain: string;               // مثال: "platforms.example.com" — يُقرأ من env أيضاً
  brand: { name: string; logo?: string; primary: string };
  paymob: { enabled: boolean; integrationIds: { card?: number; wallet?: number } };
  manualPay: { enabled: boolean; methods: { kind: "instapay" | "wallet" | "bank"; label: string; number: string; active: boolean }[] };
  approval: "manual" | "auto_after_payment";
  gracePeriodDays: number;          // مهلة بعد انتهاء الاشتراك قبل الإيقاف
  emailFrom: string;
};
```

قواعد فايربيز في `firebase/database.rules.json`: أضف `hub` و`tenants` بقواعد **مغلقة بالكامل** (`.read/.write = false`) مع `.validate` بنيوي للحقول الحرجة (`slug` نمط `^[a-z0-9-]{3,40}$`، `status` من القائمة، `priceEGP >= 0`).

---

## 3) سياق المستأجر (Tenant Context) — قلب النظام

### 3-أ) حلّ المستأجر من الطلب — `lib/hub/resolve.ts` + `middleware.ts`
- **ترتيب الحلّ:** (١) دومين مخصّص نشط في `hub/domains` ← (٢) نطاق فرعي `{slug}.{ROOT_DOMAIN}` ← (٣) محلّياً فقط: `?tenant=slug` أو كوكي `dev_tenant` ← (٤) لا مستأجر = طلب على الـHub نفسه.
- لأن الوسيط Edge بلا قاعدة بيانات: احتفظ بخريطة `domain → tenantId` في **Vercel Edge Config** (أو KV) تُحدَّث عند كل تغيير دومين، ولها بديل محلّي `data/domains.json`. الوسيط يضع `x-tenant-id` و`x-tenant-slug` و`x-hub: 1`. **يرفض ويعيد كتابة** أي ترويسة `x-tenant-*` قادمة من العميل (منع الانتحال).
- مسارات الـHub (`/hub/*`, `/start/*`, `/api/hub/*`) تعمل على الجذر فقط. طلب لها على نطاق مستأجر → ٤٠٤.
- مسارات المنصّة (`/`, `/admin`, `/student`, `/login`, `/register`, `/api/*`) على الجذر بلا مستأجر → تحويل إلى `/start` (أو صفحة تعريف بالـHub).

### 3-ب) تمرير السياق داخل الخادم — `lib/hub/context.ts`
- استخدم `AsyncLocalStorage<{ tenantId: string; slug: string }>` يُفتح في بداية كل Route Handler وLayout عبر دالّة واحدة `withTenant()`/`requireTenant()` تقرأ الترويسات من `headers()`.
- **عدّل `lib/store.ts`:** الذاكرة المؤقّتة تصبح `Map<tenantId, Cache>` وطابور الكتابة `Map<tenantId, Promise>`، والجذر يصبح `tenants/${tenantId}/platform`. `ensureStore()` بلا `tenantId` يرمي `TenantContextMissing`. اضبط سقفاً لعدد المستأجرين في الذاكرة (LRU ٥٠) حتى لا تنمو بلا حدّ.
- `lib/db.ts`: لا تغيير في توقيع الدوال العامّة؛ تقرأ `tenantId` من السياق. هذا يُبقي ٩٠٪ من المسارات كما هي.
- `lib/guard.ts` و`lib/security.ts` و`middleware.ts`: مفاتيح الحدود والحظر تُسبَق بـ`tenantId:` حتى لا يحجب طالب مشاغب على منصّة طلابَ منصّة أخرى.
- `lib/session.ts`: أضف `tid` داخل الرمز؛ `verifyToken` يرفض الرمز إن اختلف `tid` عن مستأجر الطلب. الكوكي نفسها معزولة بالنطاق أصلاً، لكن هذا يحمي من نسخ الكوكي بين دومين مخصّص ونطاق فرعي لنفس المنصّة أو غيرها.
- **التكاملات لكل مستأجر:** `integrations.google`, `youtubeApiKey`, `telegram`, `bunny`, `push` تبقى داخل `tenants/{id}/platform/integrations` (كل مدرّس يربط حسابه). عنوان عودة جوجل يصبح ثابتاً على الجذر `https://{ROOT_DOMAIN}/api/google/callback` مع `state` يحمل `tenantId` موقّعاً، ثم يُعاد التوجيه لنطاق المستأجر.
- **الوسائط:** `/api/media/[id]` و`/api/file/[name]` يتحقّقان أن الملف مذكور في بيانات **هذا** المستأجر فقط.
- **النسخ الاحتياطي:** `lib/backup.ts` يعمل لكل مستأجر على حدة؛ الـcron `/api/cron/backup` يمرّ على المستأجرين النشطين بدفعات (والمجاني لا يفعّله إلا إذا كانت الميزة `backup` مفتوحة).

### 3-ج) حالة المستأجر تُفرض في كل مكان
دالّة واحدة `tenantGate(tenant)` تُستدعى في `app/layout.tsx` وفي بداية كل API:
- `suspended` / `expired` → الطالب والزائر يريان صفحة «المنصّة متوقّفة مؤقّتاً» (بهوية المنصّة الأم، بلا تفاصيل)، والأدمن يرى لوحته **للقراءة فقط** مع لافتة السبب وزر «تجديد الاشتراك» يفتح الـHub. كل `POST/PUT/PATCH/DELETE` على `/api/*` → ٤٠٢.
- `archived` → ٤٠٤ كامل.
- `onboarding`/`pending_approval` → لا شيء يُخدم على نطاق المستأجر بعد.
- انتهاء `currentPeriodEnd` + `gracePeriodDays` → Cron يومي `/api/cron/hub-billing` يحوّل الحالة إلى `expired` ويرسل بريداً قبلها بـ٧ و٣ و١ يوم.

---

## 4) الـHub: لوحة أدمن المنصّات (Super Admin) — `/hub/*`

### 4-أ) الدخول
- دور جديد `super` في `Role`. حساب الـSuper Admin الأوّل من `SUPER_ADMIN_EMAIL` + `SUPER_ADMIN_PASSWORD` (يُنشأ عند أوّل تشغيل كما يُنشأ الأدمن الآن)، ويمكن ربطه بجوجل لاحقاً (allow-list بالبريد).
- كوكي منفصلة `hub_session` بنفس آلية HMAC، ربط جهاز واحد مثل الأدمن، مع صمّام `SUPER_DEVICE_LOCK=0`.
- كل مسار `/api/hub/*` يتحقّق `requireSuper()`، وكل حدث يُسجَّل في `hub/audit`.

### 4-ب) الشاشات (قشرة `components/hub/hub-shell.tsx` بنفس أسلوب `admin-shell.tsx`: شريط أيقونات + لوح أقسام)
1. **نظرة عامة:** عدد المنصّات بحسب الحالة · إيراد الشهر (فواتير مدفوعة) · اشتراكات تنتهي خلال ٧ أيام · طلبات بانتظار الموافقة (تفعيل + فواتير يدوية + دومينات) · آخر أحداث الأمان عبر كل المنصّات · رسم بياني SVG يدوي (بلا مكتبة) للنموّ الشهري.
2. **المنصّات** (`/hub/tenants`): جدول قابل للبحث والفلترة (الحالة/الخطة/تاريخ الإنشاء/آخر نشاط) → صفحة المنصّة `/hub/tenants/[id]` بتبويبات:
   - **الملخّص:** الهوية، المالك، الروابط (رابط الطالب · رابط اللوحة · الدومين)، الإحصاءات الحيّة من `TenantStats`.
   - **الاشتراك:** الخطة الحالية، الفترة، الفواتير، أزرار: **تفعيل** · **إيقاف (مع سبب يُعرض للمدرّس)** · **تمديد يدوي بعدد أيام** · **تغيير الخطة** · **إلغاء** · **أرشفة** (بتأكيد مزدوج بكتابة الـslug).
   - **الأقسام والميزات:** قائمة كل أقسام لوحة أدمن المنصّة (من `PERMS` في `lib/perms.ts` + `maintenance` + `databases` + `reports` + `support/chat`) بمفتاح إظهار/إخفاء لكل قسم، وقائمة `TenantFeature` بمفاتيح تشغيل. الحفظ فوري ويُطبَّق من الطلب التالي (يستدعي `invalidate(tenantId)`).
   - **الدومين:** حالة الدومين المخصّص، سجلّات DNS المطلوبة، زر «تحقّق الآن»، إزالة.
   - **الحدود:** تعديل `limits` يدوياً (تغلب على حدود الخطة).
   - **الفريق:** مشرفو المنصّة (قراءة) + زر «إعادة تعيين كلمة مرور المالك» + «جهاز جديد».
   - **السجلّ:** كل أحداث الـaudit الخاصّة بهذه المنصّة.
   - **الدخول كمدير المنصّة (Impersonation):** يفتح لوحة المنصّة في تبويب جديد بجلسة مؤقّتة (٣٠ دقيقة) عليها **لافتة حمراء ثابتة** «أنت تتصفّح كـSuper Admin — كل تعديل يُسجَّل»، وتُسجَّل بداية ونهاية الجلسة في audit. تُنفَّذ برمز موقّع يحمل `{tid, superId, exp}` يُستبدل بكوكي `emz_session` على نطاق المستأجر عبر `/api/hub/impersonate/enter` → تحويل إلى `https://{slug}.{root}/api/auth/impersonate?token=…`.
3. **الطلبات** (`/hub/requests`): صندوق وارد موحّد: منصّات بانتظار الموافقة (بطاقة فيها بيانات المدرّس والخطة وحالة الدفع → قبول/رفض بسبب) · فواتير يدوية بانتظار المراجعة (عرض الإيصال → اعتماد/رفض) · دومينات بانتظار التحقّق.
4. **خطط الاشتراك** (`/hub/plans`): CRUD كامل لـ`SaasPlan` بنفس محرّر الخطط الحالي في `/admin/plans` (أعد استخدام مكوّناته)، بحدود وميزات وتجربة مجانية.
5. **الفواتير والإيراد** (`/hub/billing`): كل الفواتير، فلترة، تصدير CSV، إعدادات بايموب والتحويل اليدوي.
6. **المدرّسون** (`/hub/owners`): حسابات جوجل، منصّاتهم، حظر حساب.
7. **الأمان الشامل** (`/hub/security`): تجميع `security.events` من كل المستأجرين + حظر عنوان عالمي (يُطبَّق على كل المنصّات).
8. **الإعدادات** (`/hub/settings`): `HubSettings` + هوية الـHub + قوالب البريد + Super Admins آخرون.
9. **سجلّ التدقيق** (`/hub/audit`).

### 4-ج) إخفاء الأقسام — التنفيذ الملزم
- `lib/perms.ts`: أضف `sectionHidden(tenant, perm)` وأدمجها في `can()` عبر وسيط: `canInTenant(user, perm, tenant)`. **لا تُعدَّل `can()` القديمة** لتبقى اختبارات الصلاحيات كما هي؛ كل استدعاء في `app/admin/**` و`app/api/**` يتحوّل إلى `canInTenant`.
- `app/admin/layout.tsx`: القائمة تُفلتَر بالصلاحية **وبالإخفاء**، والمسار المخفي → `redirect("/admin?hidden=1")` برسالة «هذا القسم غير متاح في خطتك».
- `PUT /api/content`: مفاتيح `permForDbKey()`/`permForContentKeys()` المرتبطة بقسم مخفي تُرفض ٤٠٣ حتى لو أُرسلت يدوياً.
- `getScopedDB()`: لا يُرسل للأدمن بيانات قسم مخفي (مثلاً `youtube`, `payments`, `security.events`) — تقليل لا إخفاء فقط.
- الميزات المطفأة (`features`): كل مسار يخصّها (مثل `/api/google/*`, `/api/telegram/*`, `/api/bunny`) يرجع ٤٠٣ برسالة موحّدة، وواجهتها تعرض بطاقة «الميزة غير مفعّلة في خطتك — ترقية».

---

## 5) رحلة المدرّس (Onboarding) — `/start/*`

مسار واحد بخطوات محفوظة في `Tenant.onboardingStep`؛ إعادة فتح `/start` تعيد المدرّس لخطوته. الواجهة بنفس لغة SVG الحالية (`components/brand/*`)، RTL، متجاوبة، مع شريط تقدّم بالخطوات.

| # | الشاشة | المطلوب بالضبط |
|---|--------|----------------|
| 1 | **الدخول بجوجل** `/start` | زر «المتابعة بحساب جوجل» فقط (لا كلمة مرور). OIDC عبر `GOOGLE_CLIENT_ID` نفسه بنطاقات `openid email profile`، عنوان عودة `/api/hub/auth/google/callback`، تحقّق من `id_token` (توقيع + `aud` + `iss` + `email_verified`). يُنشأ/يُحدَّث `TenantOwner` ويُضبط `hub_owner_session`. حماية `state` بكوكي httpOnly. |
| 2 | **خطط الاشتراك** `/start/plan` | بطاقات `SaasPlan` المرئية بنفس تصميم بطاقات الخطط الحالية (`components/sections/plans.tsx` مع الخصم والعدّاد). اختيار خطة → إنشاء `Tenant{status:"onboarding"}` + `SaasSubscription{status:"pending_payment"}` (أو `trialing` إن كانت التجربة > ٠ فيتخطّى الدفع). |
| 3 | **الدفع** `/start/pay` | انظر §6. بعد النجاح: `subscription.status = "pending_approval"`، `tenant.status = "pending_approval"`. |
| 4 | **بانتظار الموافقة** `/start/approval` | شاشة حالة تُحدَّث كل ٣٠ ثانية (polling) + بريد عند القبول. عند الرفض: السبب + زر مراسلة الدعم. إن كان `HubSettings.approval = "auto_after_payment"` تُتخطّى. |
| 5 | **اسم المنصّة ووصفها** `/start/name` | اسم (٣–٦٠ حرفاً) + وصف (≤ ٣٠٠) + **الـslug** يُقترح تلقائياً من الاسم (تحويل صوتي عربي→لاتيني) مع فحص توفّر لحظي وقائمة محجوزة (`www, admin, api, hub, app, mail, static…`). معاينة الرابط `https://{slug}.{root}`. |
| 6 | **الصورة / الشعار** `/start/logo` | رفع صورة (≤ ٥MB، png/jpg/webp/svg) مع قصّ دائري/مربّع بمعاينة — أعد استخدام `components/admin/image-studio.tsx`. التخزين: **مخزن الـHub المركزي** (Vercel Blob أو حساب Drive الخاص بالـHub عبر `uploadToDrive` بحساب الـHub) لأن المدرّس لم يربط حسابه بعد. الرابط يُكتب في `tenant.logo` ثم في `content.teacher.logo/avatar` عند التجهيز. |
| 7 | **الهوية والتصميم** `/start/design` | انظر §7. معاينة حيّة لثلاث شاشات (الهبوط · بوابة الطالب · اللوحة) داخل إطارات هاتف/سطح مكتب، اختيار واحد من ٢٠ + منتقي ٣ ألوان (primary/gold/paper) مع فحص تباين تلقائي (WCAG ≥ ٤٫٥ للنصّ) ورسالة تحذير. |
| 8 | **الدومين (اختياري)** `/start/domain` | سؤال «هل تمتلك دومين؟» → نعم: حقل دومين + انظر §8. لا/لاحقاً: تخطٍّ. يظهر فقط إن كانت `limits.customDomain = true`، وإلا بطاقة «متاح في خطة أعلى». |
| 9 | **التسليم** `/start/done` | **تجهيز المنصّة** (`provisionTenant()` §9) ثم شاشة تسليم تعرض **مرّة واحدة**: بريد لوحة الأدمن · كلمة مرور مولَّدة (١٦ حرفاً، نسخ) · رابط اللوحة `https://{slug}.{root}/admin` · رابط الطلاب `https://{slug}.{root}` · رابط الدومين إن فُعّل · زر «إرسال البيانات لبريدي» · زر «افتح لوحتي الآن» (دخول تلقائي عبر رمز مرّة واحدة). كلمة المرور تُخزَّن مجزّأة فقط (scrypt كما في `hashPassword`)؛ إعادة التعيين من الـHub أو من «نسيت كلمة المرور» ببريد. |

بعد الاكتمال: `tenant.status = "active"`، `onboardingStep = "done"`، ويصبح `/start` صفحة «منصّاتي» (قائمة منصّات المدرّس + أزرار الدخول والفوترة).

**دخول المدرّس للوحته لاحقاً:** بالبريد + كلمة المرور المولَّدة (المسار الحالي `/login`) **أو** زر «الدخول بجوجل» على صفحة `/login` الخاصّة بمنصّته (يُقبل فقط إن طابق `googleSub` مالك المنصّة). قفل الجهاز الواحد يبقى كما هو.

---

## 6) بوّابة دفع اشتراك المنصّة (SaaS Billing) — `lib/hub/billing/*`

- **تجريد مزوّد:** `interface BillingProvider { createCheckout(invoice): Promise<{url|iframeUrl}>; verifyWebhook(req): Promise<WebhookEvent|null>; refund?(invoice) }` بتنفيذين:
  1. **Paymob** (`paymob.ts`): مصر — بطاقات + محافظ (Vodafone Cash…) + فوري. التدفّق: auth token → order → payment key → iframe/redirect. Webhook `POST /api/hub/billing/paymob/webhook` يتحقّق من **HMAC** بالترتيب الرسمي للحقول، ويُعالَج **بشكل idempotent** عبر `invoice.idempotencyKey` و`providerRef` (نفس الحدث مرّتين = لا شيء). المسار **مستثنى من فحص CSRF** في `middleware.ts` (بمطابقة المسار حرفياً) ومن حاجز الإغراق. أضف `https://accept.paymob.com` إلى `frame-src` و`connect-src` في CSP **للجذر فقط**.
  2. **تحويل يدوي** (`manual.ts`): إنستاباي/محفظة/بنك من `HubSettings.manualPay` — المدرّس يرفع صورة الإيصال + رقم المحوِّل → `invoice.status = "pending"` → يعتمدها الـSuper Admin من «الطلبات».
- **الحالة تُشتقّ من الفواتير لا من الواجهة:** `activateSubscription(invoice)` هي الدالّة الوحيدة التي تجعل الاشتراك `active` وتحسب `currentPeriodEnd` (شهر/ربع/سنة من تاريخ الدفع، أو من نهاية الفترة الحالية عند التجديد المبكّر).
- **التجديد:** قبل انتهاء الفترة بـ٧ أيام يُنشأ `invoice` جديدة ويُرسل بريد + لافتة في لوحة المدرّس. لا خصم تلقائي من البطاقة في الإصدار الأوّل (Paymob tokenization مرحلة لاحقة).
- **الترقية/التخفيض:** تغيير الخطة يُنشئ فاتورة بفرق تناسبي (proration) بسيط موثّق في التعليق.
- **بريد إلكتروني:** `lib/hub/mail.ts` عبر Resend (أو SMTP) — قوالب عربية RTL: قبول المنصّة، بيانات الدخول، فاتورة، تذكير انتهاء، إيقاف. المفاتيح في env.
- **الاختبارات:** محاكاة webhook بتوقيع صحيح/خاطئ/مكرّر · فاتورة يدوية تُعتمد ثم تُرفض لا تغيّر شيئاً · انتهاء الفترة يُفعّل المهلة ثم الإيقاف.

---

## 7) الهوية والتصميم: ٢٠ تصميماً مميّزاً + تغيير الألوان — `lib/brand-presets.ts`

المنصّة تملك بالفعل مفاتيح كثيرة للمظهر (`studentSkin` · `studentDesign` · `studentLayout` · `heroStyle` · `homeLayout` · `plansStyle` · `sideNav` · `dockStyle` · `tileStyle` · `toolbarStyle` · `buttonStyle` · `iconLib` · `iconFrame` · `motionStyle` · `glow` · `shadowStyle` · `stagesStyle` · `featuresStyle` · `faqStyle` · `ctaStyle` · `footerStyle` · `heroShell` · `hero.frame` · `theme.customPrimary/customGold/customPaper`…). **لا تبنِ نظام ثيم جديداً** — ابنِ فوقها:

- **`BrandPreset`** = حزمة كاملة من كل هذه المفاتيح + خطوط (اختر من `app/fonts` وGoogle Fonts العربية المسموحة في CSP: Cairo, Tajawal, Almarai, Amiri, Lalezar, Changa, Marhey, Noto Kufi…) + الزخرفة + ثلاثة ألوان افتراضية + وصف قصير.
- **٢٠ حزمة مختلفة بصرياً فعلاً** (لا مجرّد تبديل لون). أمثلة إلزامية للتنوّع: مخطوط مذهّب كلاسيكي · حديث مسطّح بلا زخرفة · أندلسي · زجاجي داكن · ورقي دافئ · تقني حادّ الأركان · قبّة ومحراب · مفصّص ملوّن للمرحلة الابتدائية · رخامي هادئ · ليلي نيون للثانوي · صحراوي · فيروزي بحري · أكاديمي جامعي · مجلّة (تايبوغرافي كبير) · بطاقات مرتفعة بظلال · شرائط ومطويّات · هندسي كوفي · لوح أسود وطباشير · ربيعي فاتح · ملكي بنفسجي.
- **منتقي الألوان** يكتب `theme.customPrimary/customGold/customPaper` و`designColors` و`navColors` و`tileColors` عبر `brandVars()` الموجودة، وتُطبَّق على **الثلاث شاشات معاً** (الهبوط · الطالب · اللوحة) مع معاينة SSR بلا وميض.
- **صفحة `/admin/appearance`** تحصل على تبويب جديد «الهوية» يعرض الـ٢٠ نفسها + الألوان، فيستطيع المدرّس تغيير هويّته لاحقاً بضغطة (وتبقى المفاتيح التفصيلية الحالية لمن يريد التعمّق).
- كل حزمة تملك **صورة معاينة مولَّدة** (`/api/hub/preset-preview/[id]` عبر `next/og` أو SVG ثابت) لا لقطة شاشة يدوية.

---

## 8) الدومين المخصّص — `lib/hub/domains.ts`

- **النطاق الفرعي التلقائي:** أضف `*.{ROOT_DOMAIN}` إلى مشروع Vercel مرّة واحدة (موثّق في `DEPLOY.md`)، وسجّل `CNAME * → cname.vercel-dns.com`.
- **دومين المدرّس:** عند الإضافة: (١) تحقّق من الصيغة وعدم التكرار عبر المستأجرين · (٢) `POST https://api.vercel.com/v10/projects/{VERCEL_PROJECT_ID}/domains` بـ`VERCEL_TOKEN` (+ `teamId` إن وُجد) · (٣) اعرض للمدرّس سجلّات DNS المطلوبة كما تعيدها فيرسل (A `76.76.21.21` للجذر أو CNAME للفرعي + TXT `_vercel` للتحقّق) بأزرار نسخ وشرح مصوّر لأشهر المزوّدين · (٤) زر «تحقّق الآن» يستدعي `GET …/domains/{domain}/verify` و`/config`، وCron كل ١٠ دقائق للدومينات `pending_dns` (بحدّ ٧ أيام ثم `failed`) · (٥) عند `active`: تحديث Edge Config (`domain → tenantId`)، و`tenant.customDomain`، وتحويل `301` من النطاق الفرعي إلى الدومين (يبقى الفرعي يعمل كبديل للدخول إن تعطّل DNS).
- الشهادة تُصدرها فيرسل تلقائياً. إزالة الدومين تحذفه من فيرسل وEdge Config.
- `GOOGLE_REDIRECT_URI` يبقى على الجذر (لا حاجة لتسجيل كل دومين في Google Cloud) — انظر §3-ب.
- الكوكي: `emz_session` تُضبط على host الطلب فقط (لا `domain=` عام) حتى لا تتسرّب بين المستأجرين.

---

## 9) تجهيز المنصّة — `lib/hub/provision.ts`

`provisionTenant(tenantId)` (idempotent، تُسجَّل كل خطوة):
1. إنشاء `tenants/{id}/platform` من `seed()` الحالي مع: `content.brand = tenant.name`، `platformSubtitle = description`، `teacher.name = owner.name`، `teacher.logo/avatar = tenant.logo`، `content.url = https://{slug}.{root}`، مفاتيح المظهر من `BrandPreset` + `brandColors`، `support.email = owner.email`.
2. مستخدم أدمن واحد `owner: true` ببريد `tenant.adminEmail` وكلمة المرور المولَّدة (مجزّأة)، `googleSub` للدخول بجوجل.
3. `hiddenSections` و`features` و`limits` من الخطة.
4. تفريغ ذاكرة المخزن لهذا المستأجر، وتسجيل الدومين الفرعي في Edge Config.
5. بريد التسليم.

**الحدود تُفرض في الكود:** `POST /api/users` (طالب جديد) يرفض عند بلوغ `maxStudents` برسالة واضحة، وكذلك الكورسات والمشرفون ورفع الملفات (`maxStorageMB` يُقدَّر من مجموع أحجام الرفع المسجّلة).

---

## 10) عزل تجربة الطالب

- الطالب على `{slug}.{root}` أو الدومين المخصّص يرى **منصّة مدرّسه فقط**: لا ذكر للـHub ولا لمنصّات أخرى في أي شاشة أو `manifest.ts` أو `robots.ts` أو `sitemap.ts` (كلها تُولَّد من بيانات المستأجر وعنوانه).
- PWA لكل منصّة: `manifest.ts` باسمها وأيقونتها ولونها، و`start_url` بنطاقها، و`scope` بنطاقها، وservice worker واحد لكنه معزول بالـorigin تلقائياً.
- `/api/content` للزائر والطالب لا يُخرج أي حقل من `hub/` أو `tenant` سوى ما يلزم للعرض (`name, logo, brandColors`).
- الـSEO: `lib/seo.ts` يقرأ عنوان المستأجر؛ `X-Robots-Tag` كما هو للمناطق الخاصّة.
- سطر «مدعوم بواسطة {Hub}» في الفوتر **اختياري** يتحكّم فيه الـSuper Admin لكل منصّة (`features.poweredBy`).

---

## 11) الأمان الإضافي (إلزامي)

- اختبار آلي جديد `test_tenancy.py` (بنفس أسلوب `test_security.py`) يغطّي: طلب بيانات مستأجر B بجلسة من A → ٤٠١/٤٠٤ · انتحال ترويسة `x-tenant-id` → تُتجاهل · كوكي منسوخة بين نطاقين → مرفوضة · قسم مخفي عبر URL مباشر وعبر `PUT /api/content` → ٤٠٣ · منصّة موقوفة → قراءة فقط · webhook بتوقيع خاطئ → ٤٠٠ ولا تغيير · impersonation منتهية → ٤٠١.
- كل مسارات الـHub لها حدّ معدّل خاص، وصندوق الطلبات يفحص أحجام الملفّات وأنواعها (الإيصالات).
- الـSuper Admin لا يرى كلمات مرور ولا رموز تكاملات المستأجرين أبداً؛ «إعادة تعيين» تُولّد جديدة فقط.
- سجلّ التدقيق **لا يُحذف** من الواجهة؛ الاحتفاظ ١٨ شهراً.

---

## 12) خطّة التنفيذ (مراحل — كل مرحلة PR مستقلّ ببناء ناجح)

1. **M1 — سياق المستأجر:** `lib/hub/context.ts` · تعديل `store.ts`/`db.ts`/`session.ts`/`guard.ts`/`security.ts` · `middleware.ts` (حلّ النطاق + ترويسات) · سكربت `scripts/migrate-to-tenants.mjs` يرحّل `platform/` إلى `tenants/{DEFAULT_TENANT_ID}/platform` ويُنشئ `hub/tenants/{id}` للمنصّة الحالية · **المنصّة الحالية تعمل على نطاقها الفرعي بلا أي فرق.**
2. **M2 — الـHub الأساسي:** أنواع + قواعد فايربيز + دخول Super Admin + شاشات المنصّات/الطلبات/الإعدادات + إيقاف/تفعيل + إخفاء الأقسام والميزات + audit.
3. **M3 — الدخول بجوجل للمدرّس + الخطط + الـOnboarding (بلا دفع، بموافقة يدوية) + `provisionTenant` + شاشة التسليم + البريد.**
4. **M4 — ٢٠ حزمة هوية + المعاينة الحيّة + منتقي الألوان + تبويب «الهوية» في `/admin/appearance`.**
5. **M5 — بوّابة الدفع (يدوي ثم Paymob) + الفواتير + التجديد + Cron الفوترة + المهلة.**
6. **M6 — الدومين المخصّص (Vercel API + Edge Config + Cron التحقّق).**
7. **M7 — الإحصاءات (`TenantStats` عبر Cron ساعي) + الأمان الشامل + Impersonation + تصدير CSV + `test_tenancy.py` + تحديث `HANDOFF.md`/`DEPLOY.md`/`.env.example`.**

---

## 13) متغيّرات البيئة الجديدة (أضفها إلى `.env.example` مع شرح عربي)

```
ROOT_DOMAIN=                 # النطاق الجذري للمنصّات الفرعية (مثال: platforms.example.com)
HUB_URL=                     # https://ROOT_DOMAIN
DEFAULT_TENANT_ID=           # معرّف المنصّة الحالية بعد الترحيل
SUPER_ADMIN_EMAIL= / SUPER_ADMIN_PASSWORD=
SUPER_DEVICE_LOCK=1
HUB_SESSION_SECRET=          # منفصل عن AUTH_SECRET
VERCEL_TOKEN= / VERCEL_PROJECT_ID= / VERCEL_TEAM_ID=
EDGE_CONFIG=                 # اتصال Vercel Edge Config لخريطة الدومينات
PAYMOB_API_KEY= / PAYMOB_HMAC_SECRET= / PAYMOB_CARD_INTEGRATION_ID= / PAYMOB_WALLET_INTEGRATION_ID= / PAYMOB_IFRAME_ID=
RESEND_API_KEY= / MAIL_FROM=
HUB_MEDIA_PROVIDER=blob|drive   # مخزن شعارات الـOnboarding
BLOB_READ_WRITE_TOKEN=
```

---

## 14) معايير القبول النهائية (Definition of Done)

- [ ] مدرّس جديد يكمل الرحلة كاملة (جوجل → خطة → دفع يدوي → موافقة الـHub → اسم → شعار → تصميم → دومين اختياري → تسليم) ويدخل لوحته من الرابط المُسلَّم بكلمة المرور المولَّدة **وبجوجل**.
- [ ] طالب يسجّل على `{slug}.{root}` ويشترك ويشاهد درساً، ولا يرى أي أثر للـHub أو لمنصّة أخرى.
- [ ] الـSuper Admin يخفي قسم «قناة اليوتيوب» و«قواعد البيانات» من منصّة معيّنة → يختفيان من القائمة، والمسار المباشر يُعاد، وحفظ مفاتيحهما يُرفض ٤٠٣.
- [ ] إيقاف منصّة → طلابها يرون صفحة التوقّف، ولوحتها للقراءة فقط، وإعادة التفعيل تعيد كل شيء فوراً.
- [ ] Impersonation يعمل بلافتة وسجلّ، وينتهي تلقائياً.
- [ ] دومين مخصّص يمرّ من `pending_dns` إلى `active` ويخدم المنصّة بشهادة صالحة، والنطاق الفرعي يحوّل إليه.
- [ ] webhook بايموب المكرّر لا ينشئ اشتراكاً مزدوجاً؛ التوقيع الخاطئ يُرفض.
- [ ] المنصّة الحالية بعد الترحيل: كل اختبارات `test_security.py` (٢٨) + اختبارات التكامل (٤٤) ناجحة بلا تعديل على منطقها، و`test_tenancy.py` ناجح.
- [ ] `npm run build` بلا تحذيرات نوعية، و`HANDOFF.md` محدَّث بقسم «المنصّة الأم» يشرح كل ما سبق لمن يكمل بعدك.

**ابدأ الآن بالمرحلة M1. قبل كتابة أي كود، اعرض في رسالة واحدة: قائمة الملفّات التي ستمسّها في M1 مع سطر لكل ملف يشرح التغيير، ثم نفّذ.**
