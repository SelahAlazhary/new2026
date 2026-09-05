import "server-only";
import type { Tenant } from "./types";
import { UNLIMITED } from "./types";
import { hubGet, hubSet, hubList } from "./store";

/**
 * سجلُّ المستأجرين — من الـslug إلى المعرّف، ومن المعرّف إلى بطاقة المنصّة.
 * ------------------------------------------------------------------
 * يُقرأ في **كلّ طلب** (لحلّ المضيف)، فلا بدّ أن يكون رخيصاً: ذاكرةٌ
 * مؤقّتة لدقيقة، وقراءةُ عقدةٍ واحدة (`hub/slugs/{slug}`) لا الشجرةِ كلِّها.
 * والنفيُ يُخبَّأ أيضاً (١٥ ثانية) — وإلّا صار كلُّ مضيفٍ مجهول ضربةً
 * على القاعدة.
 *
 * **المنصّةُ الافتراضية.** قبل أن يُبنى الـHub كانت منصّةٌ واحدة، وهي
 * تبقى: معرّفُها `DEFAULT_TENANT_ID` (وإلّا `default`)، وتُخدم على الجذر
 * محلّياً وعلى الإنتاج حتى يُقلَب `ROOT_HOST_MODE=hub` عند إطلاق الـHub.
 *
 * والتخزينُ كلُّه في `lib/hub/store.ts` — فايربيز أو `data/hub.json`.
 */

const TTL_HIT = 60_000;
const TTL_MISS = 15_000;

export function defaultTenantId(): string {
  return (process.env.DEFAULT_TENANT_ID?.trim() || "default").toLowerCase();
}
export function defaultTenantSlug(): string {
  return (process.env.DEFAULT_TENANT_SLUG?.trim() || defaultTenantId()).toLowerCase();
}

/** هل يخدم الجذرُ المنصّةَ الافتراضية (قبل إطلاق الـHub) أم الـHub نفسَه؟ */
export function rootServesDefaultTenant(): boolean {
  return (process.env.ROOT_HOST_MODE?.trim() || "tenant") !== "hub";
}

/** بطاقةُ المنصّة الافتراضية إن لم تُسجَّل بعد في الـHub (قبل الترحيل). */
export function implicitDefaultTenant(): Tenant {
  const id = defaultTenantId();
  return {
    id,
    slug: defaultTenantSlug(),
    name: "",
    ownerId: "",
    status: "active",
    createdAt: "",
    onboardingStep: "done",
    brandPresetId: "midad",
    brandColors: { primary: "#233b8b", gold: "#c99a3b", paper: "#fbf9f5" },
    hiddenSections: [],
    features: {},
    limits: UNLIMITED,
    adminEmail: "",
  };
}

/* ---------- الذاكرة المؤقّتة ---------- */

type Slot<T> = { value: T | null; at: number };

/**
 * المخبأُ على `globalThis` لا في الوحدة — وهذا ليس تزيّناً.
 * ------------------------------------------------------------------
 * Next يحزم **الصفحاتِ ومساراتِ API في رسمين مستقلّين**، فالوحدةُ الواحدة
 * تُحمَّل مرّتين في العملية نفسِها ولكلّ نسخةٍ حالتُها. والنتيجةُ التي
 * وقعت فعلاً: يُخفي أدمنُ المنصّات قسماً من مسارٍ في API فيُصدّق المسارُ
 * ويكذّبه التخطيطُ — القسمُ يُرفض تعديلُه ويبقى رابطُه في القائمة دقيقةً
 * كاملة (عمرَ المخبأ).
 *
 * و`globalThis` مشتركٌ بين الرسمين في العملية الواحدة، فالإبطالُ يبلغ
 * الاثنين في اللحظة. ويبقى ما بين **نسخ الخادم** على فيرسل متأخّراً
 * بعمر المخبأ (دقيقة) — وهذا حدُّ ما يُصنع بلا إشارةٍ مشتركة، وهو مقبولٌ
 * لبطاقةٍ تتغيّر مرّةً في الشهر.
 */
const g = globalThis as unknown as {
  __hubSlugCache?: Map<string, Slot<string>>;
  __hubTenantCache?: Map<string, Slot<Tenant>>;
};
const slugCache = (g.__hubSlugCache ??= new Map<string, Slot<string>>());
const tenantCache = (g.__hubTenantCache ??= new Map<string, Slot<Tenant>>());

function fresh<T>(s: Slot<T> | undefined): boolean {
  if (!s) return false;
  return Date.now() - s.at < (s.value === null ? TTL_MISS : TTL_HIT);
}

/**
 * يُسقط ما خُبّئ عن منصّةٍ — بعد تعديلها من الـHub.
 * والإسقاطُ محلّيٌّ لهذه النسخة: نسخُ فيرسل الأخرى تلحق بعد دقيقةٍ على
 * الأكثر (عمرُ المخبأ)، وهو مقبولٌ لبياناتٍ تتغيّر مرّةً في الشهر.
 */
export function forgetTenant(id: string, slug?: string) {
  tenantCache.delete(id);
  if (slug) slugCache.delete(slug);
  for (const [k, v] of slugCache) if (v.value === id) slugCache.delete(k);
}

/* ---------- القراءة ---------- */

/** معرّفُ المنصّة من الـslug — أو null إن لم توجد. */
export async function tenantIdBySlug(slug: string): Promise<string | null> {
  const s = slug.trim().toLowerCase();
  if (!s) return null;
  if (s === defaultTenantSlug()) return defaultTenantId();

  const hit = slugCache.get(s);
  if (fresh(hit)) return hit!.value;

  let id: string | null = null;
  try {
    const v = await hubGet<string>(`slugs/${s}`);
    id = typeof v === "string" && v ? v : null;
  } catch {
    /* تعذّرت القراءة — يُعامل كمجهول ويُعاد بعد قليل */
    id = hit?.value ?? null;
  }
  slugCache.set(s, { value: id, at: Date.now() });
  return id;
}

/** بطاقةُ منصّة بمعرّفها — الافتراضيةُ تُرجَع ضمنيّاً إن لم تُسجَّل بعد. */
export async function tenantById(id: string): Promise<Tenant | null> {
  const hit = tenantCache.get(id);
  if (fresh(hit)) return hit!.value;

  let t: Tenant | null = null;
  try {
    t = await hubGet<Tenant>(`tenants/${id}`);
  } catch {
    t = hit?.value ?? null;
  }
  if (!t && id === defaultTenantId()) t = implicitDefaultTenant();
  if (t) t = normalizeTenant(t);
  tenantCache.set(id, { value: t, at: Date.now() });
  return t;
}

/** فايربيز يُسقط المصفوفات والكائنات الفارغة — تُعاد. */
function normalizeTenant(t: Tenant): Tenant {
  return {
    ...t,
    hiddenSections: Array.isArray(t.hiddenSections) ? t.hiddenSections : [],
    features: t.features ?? {},
    limits: t.limits ?? UNLIMITED,
    brandColors: t.brandColors ?? implicitDefaultTenant().brandColors,
    status: t.status ?? "active",
    onboardingStep: t.onboardingStep ?? "done",
  };
}

/** كلُّ المنصّات — للـHub وللمهامّ المجدولة. */
export async function listTenants(): Promise<Tenant[]> {
  let map: Record<string, Tenant> = {};
  try {
    map = await hubList<Tenant>("tenants");
  } catch {
    map = {};
  }
  const list = Object.values(map).filter((t) => t && t.id).map(normalizeTenant);
  if (!list.some((t) => t.id === defaultTenantId())) list.unshift(implicitDefaultTenant());
  return list.sort((a, b) => (b.createdAt ?? "").localeCompare(a.createdAt ?? ""));
}

/* ---------- الكتابة ---------- */

export async function upsertTenant(t: Tenant): Promise<void> {
  const before = await hubGet<Tenant>(`tenants/${t.id}`);
  await hubSet(`tenants/${t.id}`, t);
  await hubSet(`slugs/${t.slug}`, t.id);
  /* إن تغيّر الـslug يُمحى القديمُ من الفهرس فلا يبقى عنوانٌ يشير إلى منصّةٍ باسمٍ آخر */
  if (before?.slug && before.slug !== t.slug) await hubSet(`slugs/${before.slug}`, null);
  forgetTenant(t.id, t.slug);
  if (before?.slug) forgetTenant(t.id, before.slug);
}

/** تعديلٌ جزئيٌّ على بطاقة منصّة — يقرأ ثمّ يكتب البطاقةَ وحدَها. */
export async function patchTenant(id: string, patch: Partial<Tenant>): Promise<Tenant | null> {
  const cur = (await hubGet<Tenant>(`tenants/${id}`)) ?? (id === defaultTenantId() ? implicitDefaultTenant() : null);
  if (!cur) return null;
  const next = normalizeTenant({ ...cur, ...patch, id: cur.id });
  await upsertTenant(next);
  return next;
}
