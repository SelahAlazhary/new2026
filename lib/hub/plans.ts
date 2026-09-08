import "server-only";
import type { SaasPlan, SaasSubscription } from "./types";
import { UNLIMITED } from "./types";
import { hubGet, hubList, hubSet, hubId } from "./store";

/**
 * خططُ اشتراك المنصّات — ما يشتريه المدرّسُ ليملك منصّة.
 * ------------------------------------------------------------------
 * غيرُ خطط الطلاب (`lib/plans.ts`): تلك يبيعها المدرّسُ لطلابه، وهذه
 * يبيعها الموقعُ الأمّ للمدرّسين. لكلٍّ سعرٌ وفترةٌ وحدودٌ وميزات.
 *
 * وبذورٌ افتراضيّةٌ تُكتب مرّةً إن كانت القائمةُ فارغة — فالموقعُ يعمل من
 * أوّل لحظةٍ ويعدّلها أدمنُ المنصّات لاحقاً.
 */

async function migratePlans(list: SaasPlan[]): Promise<void> {
  for (const def of DEFAULT_PLANS) {
    const existing = list.find((p) => p.id === def.id);
    if (!existing) continue;
    let changed = false;
    if (existing.priceEGP === 0 && def.priceEGP > 0) { existing.priceEGP = def.priceEGP; changed = true; }
    if (existing.trialDays > 0) { existing.trialDays = 0; changed = true; }
    if (changed) await hubSet(`saasPlans/${existing.id}`, existing);
  }
}

export async function listPlans(): Promise<SaasPlan[]> {
  const all = await hubList<SaasPlan>("saasPlans");
  const list = Object.values(all).filter((p) => p && p.id);
  if (!list.length) {
    await seedPlans();
    return DEFAULT_PLANS;
  }
  await migratePlans(list);
  return list.sort((a, b) => (a.order ?? 0) - (b.order ?? 0));
}

export async function visiblePlans(): Promise<SaasPlan[]> {
  return (await listPlans()).filter((p) => p.visible);
}

export async function planById(id: string): Promise<SaasPlan | null> {
  const list = await listPlans();
  return list.find((p) => p.id === id) ?? null;
}

async function seedPlans(): Promise<void> {
  for (const p of DEFAULT_PLANS) await hubSet(`saasPlans/${p.id}`, p);
}

export const DEFAULT_PLANS: SaasPlan[] = [
  {
    id: "starter", name: "البداية", desc: "لبدء منصّتك — كل الأساسيات",
    interval: "month", priceEGP: 199, trialDays: 0,
    limits: { maxStudents: 60, maxSubjects: 4, maxAdmins: 1, maxStorageMB: 500, customDomain: false },
    features: ["exams", "codes", "studentPayments", "webPush", "captureGuard"],
    order: 0, visible: true, color: "#3b6fb0",
  },
  {
    id: "pro", name: "الاحترافية", desc: "لمنصّة تنمو — بلا حدود على الطلاب",
    interval: "month", priceEGP: 499, trialDays: 0,
    limits: { maxStudents: null, maxSubjects: null, maxAdmins: 3, maxStorageMB: 5000, customDomain: true },
    features: ["exams", "codes", "studentPayments", "webPush", "captureGuard", "liveMeet", "youtube", "drive", "backup", "team", "telegramBot"],
    order: 1, visible: true, highlight: true, badge: "الأكثر اختياراً", color: "#c99a3b",
  },
  {
    id: "elite", name: "المتكاملة", desc: "كل شيء + دومين خاص ومساحة أكبر",
    interval: "month", priceEGP: 999, trialDays: 0,
    limits: UNLIMITED,
    features: ["exams", "codes", "studentPayments", "webPush", "captureGuard", "liveMeet", "youtube", "drive", "backup", "team", "telegramBot", "bunny", "customDomain"],
    order: 2, visible: true, color: "#1b7a5a",
  },
];

/* ---------- CRUD الخطط ---------- */

export async function upsertPlan(plan: SaasPlan): Promise<SaasPlan> {
  if (!plan.id) plan = { ...plan, id: hubId("plan") };
  await hubSet(`saasPlans/${plan.id}`, plan);
  return plan;
}

export async function deletePlan(id: string): Promise<void> {
  await hubSet(`saasPlans/${id}`, null);
}

/* ---------- الاشتراك ---------- */

export async function subscriptionById(id: string): Promise<SaasSubscription | null> {
  return hubGet<SaasSubscription>(`subscriptions/${id}`);
}

export async function subscriptionForTenant(tenantId: string): Promise<SaasSubscription | null> {
  const all = await hubList<SaasSubscription>("subscriptions");
  return Object.values(all).find((s) => s && s.tenantId === tenantId) ?? null;
}

/** يحسب نهايةَ الفترة من الآن بحسب دوريّة الخطة. */
export function periodEnd(interval: SaasPlan["interval"], from = new Date()): string {
  const d = new Date(from);
  if (interval === "month") d.setMonth(d.getMonth() + 1);
  else if (interval === "quarter") d.setMonth(d.getMonth() + 3);
  else d.setFullYear(d.getFullYear() + 1);
  return d.toISOString();
}

/**
 * يُنشئ اشتراكاً لمنصّةٍ عند اختيار الخطّة — تبدأ `pending_payment` دائماً.
 */
export async function createSubscription(tenantId: string, plan: SaasPlan): Promise<SaasSubscription> {
  const now = new Date().toISOString();
  const sub: SaasSubscription = {
    id: hubId("sub"),
    tenantId,
    planId: plan.id,
    status: "pending_payment",
    startedAt: now,
    currentPeriodEnd: periodEnd(plan.interval),
    history: [{ at: now, from: "-", to: "pending_payment", by: "system" }],
  };
  await hubSet(`subscriptions/${sub.id}`, sub);
  return sub;
}

export async function setSubscriptionStatus(
  id: string,
  status: SaasSubscription["status"],
  by: "system" | "super" | "owner",
  note?: string
): Promise<void> {
  const sub = await subscriptionById(id);
  if (!sub) return;
  const at = new Date().toISOString();
  await hubSet(`subscriptions/${id}`, {
    ...sub,
    status,
    history: [...(sub.history ?? []), { at, from: sub.status, to: status, by, note }],
  });
}
