import "server-only";
import fs from "fs";
import path from "path";
import { fbGet, fbSet, firebaseConfigured } from "../firebase";
import type { Tenant } from "./types";
import { UNLIMITED } from "./types";

/**
 * سجلُّ المستأجرين — من الـslug إلى المعرّف، ومن المعرّف إلى بطاقة المنصّة.
 * ------------------------------------------------------------------
 * يُقرأ في **كلّ طلب** (لحلّ المضيف)، فلا بدّ أن يكون رخيصاً: ذاكرةٌ
 * مؤقّتة لدقيقة، وقراءةٌ ضحلة من `hub/slugs/{slug}` لا من الشجرة كلّها.
 * والنفيُ يُخبَّأ أيضاً (١٥ ثانية) — وإلّا صار كلُّ مضيفٍ مجهول ضربةً
 * على القاعدة.
 *
 * **المنصّةُ الافتراضية.** قبل أن يُبنى الـHub كانت منصّةٌ واحدة، وهي
 * تبقى: معرّفُها `DEFAULT_TENANT_ID` (وإلّا `default`)، وتُخدم على الجذر
 * محلّياً وعلى الإنتاج حتى يُقلَب `ROOT_HOST_MODE=hub` عند إطلاق الـHub.
 *
 * **وبلا فايربيز** (تطويرٌ محلّي) يُقرأ السجلُّ من `data/hub.json` — فتُنشأ
 * منصّاتٌ للتجربة بلا سحابة.
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
const slugCache = new Map<string, Slot<string>>();
const tenantCache = new Map<string, Slot<Tenant>>();

function fresh<T>(s: Slot<T> | undefined): boolean {
  if (!s) return false;
  return Date.now() - s.at < (s.value === null ? TTL_MISS : TTL_HIT);
}

/** يُسقط ما خُبّئ عن منصّةٍ — بعد تعديلها من الـHub. */
export function forgetTenant(id: string, slug?: string) {
  tenantCache.delete(id);
  if (slug) slugCache.delete(slug);
  for (const [k, v] of slugCache) if (v.value === id) slugCache.delete(k);
}

/* ---------- السجلّ المحلّي (بلا سحابة) ---------- */

const HUB_FILE = path.join(process.cwd(), "data", "hub.json");
const READ_ONLY_FS = Boolean(process.env.VERCEL || process.env.AWS_LAMBDA_FUNCTION_NAME);

type LocalHub = { tenants: Record<string, Tenant>; slugs: Record<string, string> };

function readLocalHub(): LocalHub {
  try {
    if (!READ_ONLY_FS && fs.existsSync(HUB_FILE)) {
      const raw = JSON.parse(fs.readFileSync(HUB_FILE, "utf-8")) as Partial<LocalHub>;
      return { tenants: raw.tenants ?? {}, slugs: raw.slugs ?? {} };
    }
  } catch {
    /* ملفٌ تالف — يُعامل كفارغ */
  }
  return { tenants: {}, slugs: {} };
}

function writeLocalHub(h: LocalHub) {
  if (READ_ONLY_FS) return;
  try {
    fs.mkdirSync(path.dirname(HUB_FILE), { recursive: true });
    fs.writeFileSync(HUB_FILE, JSON.stringify(h, null, 2), "utf-8");
  } catch {
    /* قرصٌ غير قابل للكتابة */
  }
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
    if (firebaseConfigured()) {
      const v = await fbGet<string>(`hub/slugs/${s}`);
      id = typeof v === "string" && v ? v : null;
    } else {
      id = readLocalHub().slugs[s] ?? null;
    }
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
    if (firebaseConfigured()) {
      t = await fbGet<Tenant>(`hub/tenants/${id}`);
    } else {
      t = readLocalHub().tenants[id] ?? null;
    }
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

/** كلُّ المنصّات — للمهامّ المجدولة (النسخ الاحتياطي…). */
export async function listTenants(): Promise<Tenant[]> {
  let map: Record<string, Tenant> = {};
  try {
    map = (firebaseConfigured()
      ? (await fbGet<Record<string, Tenant>>("hub/tenants")) ?? {}
      : readLocalHub().tenants) ?? {};
  } catch {
    map = {};
  }
  const list = Object.values(map).filter((t) => t && t.id).map(normalizeTenant);
  if (!list.some((t) => t.id === defaultTenantId())) list.unshift(implicitDefaultTenant());
  return list;
}

/* ---------- الكتابة (تُستعمل من الـHub وسكربت الترحيل) ---------- */

export async function upsertTenant(t: Tenant): Promise<void> {
  if (firebaseConfigured()) {
    await fbSet(`hub/tenants/${t.id}`, t);
    await fbSet(`hub/slugs/${t.slug}`, t.id);
  } else {
    const h = readLocalHub();
    /* إن تغيّر الـslug يُمحى القديم من الفهرس */
    for (const [s, id] of Object.entries(h.slugs)) if (id === t.id && s !== t.slug) delete h.slugs[s];
    h.tenants[t.id] = t;
    h.slugs[t.slug] = t.id;
    writeLocalHub(h);
  }
  forgetTenant(t.id, t.slug);
}
