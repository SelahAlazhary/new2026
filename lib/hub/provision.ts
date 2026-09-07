import "server-only";
import type { DB, SiteContent, User } from "../types";
import { defaultContent } from "../defaults";
import { hashPassword } from "../db";
import { ensureStore, commit } from "../store";
import { runInTenant, ctxForTenantId } from "./context";
import { patchTenant, tenantById } from "./registry";
import { subscriptionForTenant, planById } from "./plans";
import { linkTenantToOwner, ownerById } from "./owner";
import { presetById } from "./presets";
import type { Tenant } from "./types";
import { generatePassword } from "./onboarding";
import { audit } from "./audit";
import { storeDelivery } from "./delivery";

/**
 * تجهيزُ منصّة — من بطاقةٍ في الـHub إلى قاعدةٍ عاملة.
 * ------------------------------------------------------------------
 * يُنشئ `tenants/{id}/platform` من بذرةٍ فارغة (كما تبدأ أيُّ منصّة): لا
 * طلابَ ولا مواد، وحسابُ أدمنٍ واحدٌ للمدرّس، وهويّةٌ من اختياره. ثمّ
 * يقلب حالةَ المنصّة إلى `active`.
 *
 * **قابلٌ للإعادة (idempotent):** إن كانت القاعدةُ مجهّزةً من قبل (فيها
 * مستخدم) لا يُكتب فوقها — فإعادةُ الاستدعاء لا تمحو بيانات. ويُعيد كلمةَ
 * المرور **مرّةً واحدةً فقط** عند التجهيز الأوّل؛ بعدها لا سبيلَ لقراءتها
 * (مُجزّأة)، بل تُعاد تعيينُها.
 */

export type ProvisionResult = {
  tenant: Tenant;
  adminEmail: string;
  /** كلمةُ المرور الخام — تُعرض مرّةً واحدة ثمّ لا تُخزَّن إلّا مُجزّأة. */
  password: string | null;
  studentUrl: string;
  adminUrl: string;
  alreadyProvisioned: boolean;
};

/** يبني محتوى المنصّة من اختيارات المدرّس فوق المحتوى الافتراضي. */
function buildContent(t: Tenant, ownerEmail: string, base: string): SiteContent {
  const preset = presetById(t.brandPresetId);
  return {
    ...defaultContent,
    brand: t.name || defaultContent.brand,
    platformSubtitle: t.description || "",
    url: base,
    teacher: {
      ...defaultContent.teacher,
      name: t.name || defaultContent.teacher.name,
      subject: t.description || defaultContent.teacher.subject,
      avatar: t.logo || defaultContent.teacher.avatar,
      logo: t.logo || "",
    },
    support: { ...defaultContent.support, email: ownerEmail },
    theme: {
      layout: preset.dark ? "dark" : "light",
      preset: "custom",
      customPrimary: t.brandColors.primary,
      customGold: t.brandColors.gold,
      customPaper: t.brandColors.paper,
    },
    /* مفاتيحُ المظهر من الحزمة المختارة (تُوسَّع في M4) */
    ...preset.content,
  };
}

export async function provisionTenant(tenantId: string): Promise<ProvisionResult> {
  const tenant = await tenantById(tenantId);
  if (!tenant) throw new Error("لا توجد منصّة بهذا المعرّف");

  const owner = tenant.ownerId ? await ownerById(tenant.ownerId) : null;
  const ownerEmail = tenant.adminEmail || owner?.email || "";
  const root = process.env.ROOT_DOMAIN?.trim();
  const base = tenant.customDomain
    ? `https://${tenant.customDomain}`
    : root
      ? root.endsWith(".vercel.app")
        ? `https://${root}/t/${tenant.slug}`
        : `https://${tenant.slug}.${root}`
      : `http://${tenant.slug}.localhost:3000`;

  const ctx = await ctxForTenantId(tenantId);

  let password: string | null = null;
  let already = false;

  await runInTenant(ctx, async () => {
    const existing = await ensureStore(() => emptySeed());
    /* مجهّزةٌ من قبل: لا نكتب فوق بياناتٍ قائمة */
    if (existing.users?.some((u) => u.role === "admin")) {
      already = true;
      return;
    }

    password = generatePassword();
    const { salt, passwordHash } = hashPassword(password);
    const admin: User = {
      id: "USR-1000",
      name: tenant.name || "مدير المنصّة",
      role: "admin",
      owner: true,
      username: ownerEmail,
      passwordHash,
      salt,
      active: true,
      googleSub: owner?.googleSub,
      createdAt: new Date().toISOString(),
    } as User;

    const db: DB = { ...emptySeed(), content: buildContent(tenant, ownerEmail, base), users: [admin] };
    commit(db);
  });

  await patchTenant(tenantId, {
    status: "active",
    activatedAt: tenant.activatedAt ?? new Date().toISOString(),
    onboardingStep: "done",
    adminEmail: ownerEmail,
  });
  if (tenant.ownerId) await linkTenantToOwner(tenant.ownerId, tenantId);

  const sub = await subscriptionForTenant(tenantId);
  if (sub) {
    const plan = await planById(sub.planId);
    if (plan) {
      /* حدودُ الخطة وميزاتُها تُثبَّت على المنصّة وقتَ التفعيل */
      await patchTenant(tenantId, {
        limits: plan.limits,
        features: Object.fromEntries(
          FEATURE_KEYS.map((k) => [k, plan.features.includes(k)])
        ) as Tenant["features"],
      });
    }
  }

  /* كلمةُ المرور تُسلَّم مرّةً واحدة — تُحفظ للكشف ثمّ تُحذف عند قراءتها */
  if (password) await storeDelivery(tenantId, { password, adminEmail: ownerEmail, createdAt: new Date().toISOString() });

  await audit("tenant.provisioned", { kind: "system", id: "provision", name: "التجهيز الآليّ" }, { tenantId });

  const fresh = (await tenantById(tenantId))!;
  return {
    tenant: fresh,
    adminEmail: ownerEmail,
    password,
    studentUrl: base,
    adminUrl: `${base}/admin`,
    alreadyProvisioned: already,
  };
}

/** بذرةٌ فارغة تماماً — لا بيانات وهميّة (كما تبدأ أيُّ منصّة). */
function emptySeed(): DB {
  return {
    content: defaultContent,
    plans: [],
    students: [],
    subjects: [],
    grades: [],
    codes: [],
    exams: [],
    live: [],
    tickets: [],
    notifications: [],
    users: [],
  };
}

import type { TenantFeature } from "./types";
const FEATURE_KEYS: TenantFeature[] = [
  "liveMeet", "youtube", "telegramBot", "bunny", "drive", "webPush",
  "studentPayments", "codes", "exams", "backup", "customDomain", "team", "captureGuard",
];
