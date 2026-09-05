import "server-only";
import fs from "fs";
import path from "path";
import type { DB } from "./types";
import { firebaseConfigured, fbGet, fbSet, firebaseSecure, fbGetFrom, fbSetTo, type FirebaseConfig } from "./firebase";
import { orderNodes, markUp, markDown, writeTarget } from "./db-nodes";
import type { DbNode } from "./types";
import { currentTenantId, platformRoot } from "./hub/context";
import { defaultTenantId } from "./hub/registry";

/**
 * طبقة التخزين — لكلّ منصّةٍ مخبأُها وطابورُها وجذرُها.
 * ------------------------------------------------------------------
 * • عند ضبط فايربيز: **Firebase Realtime Database هي مصدر الحقيقة**؛
 *   تُقرأ عند الإقلاع وتُحدَّث بعد كل تغيير، والملف المحلي يبقى نسخة احتياطية للطوارئ.
 * • بلا فايربيز: الملف المحلي هو المصدر (تشغيل بلا إنترنت أو قبل الربط).
 *
 * **تعدّدُ المستأجرين.** كان هنا مخبأٌ واحدٌ وجذرٌ واحد `platform`. فصار
 * لكلّ منصّةٍ:
 *   ــ جذرٌ في فايربيز: `tenants/{id}/platform`
 *   ــ ملفٌّ محلّي:      `data/tenants/{id}/db.json`
 *   ــ مخبأٌ وطابورُ كتابةٍ مستقلّان (فكتابةُ منصّةٍ لا تنتظر أختَها)
 * والمعرّفُ يأتي من سياق الطلب (`lib/hub/context.ts`) لا من معامل — فكلُّ
 * الدوالّ العامّة هنا تحتفظ بتوقيعها القديم، ولا يُلمس تسعون بالمئة ممّا
 * يستدعيها. ولا سياقَ = خطأٌ صريح، لا بياناتٌ افتراضية.
 *
 * **والمنصّةُ الافتراضية** (المرحَّلة من الإصدار الواحد) تُقرأ من الجذر
 * القديم `platform` إن كان جذرُها الجديد فارغاً — قراءةً لا كتابة — فلا
 * تنقطع لحظةً بين النشر والترحيل. وأوّلُ حفظٍ يكتب في الجذر الجديد،
 * ومن بعده يُقرأ منه.
 *
 * الكتابة تمرّ بطابور متسلسل لكل منصّة يضمن ترتيب العمليات وعدم تداخلها،
 * ويمكن لأي مسار انتظار اكتمالها عبر flushStore() قبل الردّ على المستخدم.
 */

const DATA_DIR = path.join(process.cwd(), "data");
const LEGACY_DB_FILE = path.join(DATA_DIR, "db.json");
const LEGACY_ROOT = "platform";
/** مدّة صلاحية النسخة المخزّنة في الذاكرة قبل إعادة القراءة من فايربيز. */
const TTL = 15_000;
/** سقفُ المنصّات المخبّأة في ذاكرة نسخةٍ واحدة — الأقدمُ استعمالاً يُطرد. */
const MAX_TENANTS = 50;

type Cache = {
  data: DB | null;
  loadedAt: number;
  usedAt: number;
  pending: Promise<void>;
  lastError: string | null;
  lastSyncAt: string | null;
  source: "firebase" | "local";
  activeUrl: string;
};

const caches = new Map<string, Cache>();

function slot(id = currentTenantId()): Cache {
  let c = caches.get(id);
  if (!c) {
    c = { data: null, loadedAt: 0, usedAt: 0, pending: Promise.resolve(), lastError: null, lastSyncAt: null, source: "local", activeUrl: "" };
    caches.set(id, c);
    evict();
  }
  c.usedAt = Date.now();
  return c;
}

/** يطرد الأقدمَ استعمالاً حين يزيد العدد. */
function evict() {
  if (caches.size <= MAX_TENANTS) return;
  const byAge = [...caches.entries()].sort((a, b) => a[1].usedAt - b[1].usedAt);
  for (const [id] of byAge) {
    if (caches.size <= MAX_TENANTS) break;
    caches.delete(id);
  }
}

/**
 * فايربيز تحذف المصفوفات الفارغة، وتُعيد المصفوفة ككائن بمفاتيح رقمية إن كانت مثقوبة.
 * نُعيدها لشكلها الصحيح حتى يبقى باقي التطبيق يتعامل مع مصفوفات دائماً.
 */
const LIST_KEYS = ["users", "students", "subjects", "grades", "codes", "exams", "live", "tickets", "notifications", "plans", "gradeRequests"] as const;

function toArray(value: unknown): unknown[] {
  if (Array.isArray(value)) return value.filter((v) => v !== null && v !== undefined);
  if (value && typeof value === "object") {
    return Object.entries(value as Record<string, unknown>)
      .filter(([k]) => /^\d+$/.test(k))
      .sort((a, b) => Number(a[0]) - Number(b[0]))
      .map(([, v]) => v)
      .filter((v) => v !== null && v !== undefined);
  }
  return [];
}

function normalizeLists(db: DB): DB {
  const out = db as unknown as Record<string, unknown>;
  for (const k of LIST_KEYS) out[k] = toArray(out[k]);
  // مصفوفات داخلية داخل الكيانات
  (out.subjects as { videos?: unknown; materials?: unknown; units?: unknown }[]).forEach((s) => {
    s.videos = toArray(s.videos);
    /*
      Firebase يُعيد المصفوفةَ الفارغةَ عدماً والمصفوفةَ المتقطّعةَ كائناً.
      فلولا التطبيعُ هنا لانفجر `.map` على وحدةٍ حُذف آخرُ درسٍ منها —
      ودروسُ الوحدة تُطبَّع كما تُطبَّع دروسُ الكورس، فهي المصفوفةُ
      المتغيّرةُ الآن لا تلك.
    */
    s.units = toArray(s.units).map((u) => {
      const unit = u as { lessons?: unknown; materials?: unknown };
      return { ...unit, lessons: toArray(unit.lessons), materials: toArray(unit.materials) };
    });
    s.materials = toArray(s.materials);
  });
  (out.users as { subscriptions?: unknown; quizResults?: unknown; examAttempts?: unknown; pushSubs?: unknown; enrolled?: unknown; readNotifications?: unknown }[]).forEach((u) => {
    if (u.subscriptions !== undefined) u.subscriptions = toArray(u.subscriptions);
    if (u.quizResults !== undefined) u.quizResults = toArray(u.quizResults);
    if (u.examAttempts !== undefined) u.examAttempts = toArray(u.examAttempts);
    if (u.pushSubs !== undefined) u.pushSubs = toArray(u.pushSubs);
    if (u.enrolled !== undefined) u.enrolled = toArray(u.enrolled);
    if (u.readNotifications !== undefined) u.readNotifications = toArray(u.readNotifications);
  });
  (out.exams as { questions?: unknown }[]).forEach((e) => { e.questions = toArray(e.questions); });
  const sec = out.security as { events?: unknown; bans?: unknown } | undefined;
  if (sec) { sec.events = toArray(sec.events); sec.bans = toArray(sec.bans); }
  return db;
}

/* ---------- الملف المحلي ---------- */

/** هل نظام الملفات قابل للكتابة؟ (على فيرسل وما شابهه: لا) */
const READ_ONLY_FS = Boolean(process.env.VERCEL || process.env.AWS_LAMBDA_FUNCTION_NAME);

/** ملفُّ المنصّة الحالية. */
function dbFile(id = currentTenantId()): string {
  return path.join(DATA_DIR, "tenants", id.replace(/[^A-Za-z0-9_-]/g, ""), "db.json");
}

export function readLocal(): DB | null {
  try {
    if (READ_ONLY_FS) return null;
    const file = dbFile();
    if (fs.existsSync(file)) return JSON.parse(fs.readFileSync(file, "utf-8")) as DB;
    /* توافقٌ: المنصّةُ الافتراضية قبل الترحيل المحلّي تقرأ الملفَّ القديم */
    if (currentTenantId() === defaultTenantId() && fs.existsSync(LEGACY_DB_FILE)) {
      return JSON.parse(fs.readFileSync(LEGACY_DB_FILE, "utf-8")) as DB;
    }
    return null;
  } catch {
    return null;
  }
}

/**
 * الكتابة المحلية تُستخدم فقط في وضع «بلا سحابة» (تشغيل محلي قبل الربط).
 * عند تفعيل فايربيز — أو على استضافة بنظام ملفات للقراءة فقط — لا يُكتب شيء على القرص.
 */
export function writeLocal(db: DB) {
  if (firebaseUsable() || READ_ONLY_FS) return;
  try {
    const file = dbFile();
    fs.mkdirSync(path.dirname(file), { recursive: true });
    fs.writeFileSync(file, JSON.stringify(db, null, 2), "utf-8");
  } catch {
    /* قرص غير قابل للكتابة — البيانات في السحابة على أي حال */
  }
}

/* ---------- القراءة ---------- */

/** هل يُسمح باستخدام فايربيز؟ (مضبوط + قواعده مقفلة أو موثّق باعتماد) */
export function firebaseUsable(): boolean {
  return firebaseConfigured() && firebaseSecure();
}

/**
 * يضمن وجود نسخة حديثة في الذاكرة. يُستدعى في بداية كل طلب.
 * seed: بذرة تُكتب إذا كانت القاعدة فارغة تماماً (أول تشغيل).
 */
export async function ensureStore(seed?: () => DB): Promise<DB> {
  const c = slot();
  const fresh = c.data && Date.now() - c.loadedAt < TTL;
  if (fresh) return c.data!;

  if (firebaseUsable()) {
    try {
      /*
        تُجرَّب القواعد بترتيبها حتى تردّ واحدة.
        ------------------------------------------------------------
        بقاعدةٍ واحدة يبقى السلوك كما كان حرفاً بحرف — محاولةٌ واحدة
        ثم الخطأ. والفروعُ لا تُزاد إلا حين تُضاف، فلا تُدفع كلفةٌ لم
        تُطلب.
      */
      const remote = await readChain(c);
      if (remote && toArrayLength(remote.users)) {
        normalizeLists(remote);
        c.data = remote;
        c.loadedAt = Date.now();
        c.source = "firebase";
        c.lastError = null;
        return remote;
      }
      // القاعدة السحابية فارغة: ارفع المحلي (أو البذرة) إليها
      const local = readLocal() ?? seed?.() ?? null;
      if (local) {
        await fbSet(platformRoot(), { ...local, _syncedAt: new Date().toISOString() });
        c.data = local;
        c.loadedAt = Date.now();
        c.source = "firebase";
        c.lastSyncAt = new Date().toISOString();
        return local;
      }
    } catch (e) {
      c.lastError = (e as Error).message;
      // حماية حاسمة: لا نستبدل بيانات السحابة ببذرة فارغة عند تعذّر الوصول.
      // نُبقي آخر نسخة في الذاكرة إن وُجدت، وإلا نُفشل الطلب بوضوح بدل مسح البيانات.
      if (c.data) return c.data;
      const emergency = readLocal();
      if (emergency) {
        c.data = emergency;
        c.loadedAt = 0;
        c.source = "local";
        return emergency;
      }
      throw new Error(`تعذّر الوصول إلى قاعدة البيانات السحابية${c.lastError ? ` — ${c.lastError}` : ""}`);
    }
  }

  const local = readLocal() ?? seed?.() ?? null;
  if (!local) throw new Error("لا توجد بيانات");
  if (!firebaseUsable()) writeLocal(local);
  c.data = local;
  c.loadedAt = Date.now();
  c.source = "local";
  return local;
}

/** النسخة الحالية من الذاكرة (أو الملف المحلي إن لم تُحمّل بعد). */
export function peek(seed?: () => DB): DB {
  const c = slot();
  if (c.data) return c.data;
  const local = readLocal() ?? seed?.();
  if (!local) throw new Error("لا توجد بيانات");
  c.data = local;
  c.loadedAt = 0; // تُعاد القراءة من فايربيز في أول فرصة
  writeLocalIfMissing(local);
  return local;
}

function writeLocalIfMissing(db: DB) {
  if (!fs.existsSync(dbFile())) writeLocal(db);
}

/* ---------- الكتابة ---------- */

/** يحفظ فوراً محلياً، ويُدرج الكتابة السحابية في الطابور. */
export function commit(db: DB) {
  const c = slot();
  c.data = db;
  c.loadedAt = Date.now();
  writeLocal(db);

  if (!firebaseUsable()) return;
  const root = platformRoot();
  c.pending = c.pending
    .then(() => writeChain(c, root, { ...db, _syncedAt: new Date().toISOString() }))
    .then(() => {
      c.lastSyncAt = new Date().toISOString();
      c.lastError = null;
    })
    .catch((e: Error) => {
      c.lastError = e.message;
    });
}

/** انتظار اكتمال كل الكتابات المعلّقة (يُستدعى قبل الردّ في المسارات المهمّة). */
export async function flushStore(): Promise<{ ok: boolean; error: string | null }> {
  const c = slot();
  await c.pending;
  return { ok: !c.lastError, error: c.lastError };
}

/** إسقاط النسخة المخزّنة لإجبار قراءة جديدة — للمنصّة الحالية. */
export function invalidate() {
  const c = caches.get(currentTenantId());
  if (c) c.loadedAt = 0;
}

/** إسقاطُ مخبأ منصّةٍ بعينها — بعد تعديلها من الـHub. */
export function invalidateTenant(id: string) {
  const c = caches.get(id);
  if (c) c.loadedAt = 0;
}

function toArrayLength(v: unknown): number {
  return Array.isArray(v) ? v.length : v && typeof v === "object" ? Object.keys(v).length : 0;
}

export function storeState() {
  const c = slot();
  return {
    source: c.source,
    lastSyncAt: c.lastSyncAt,
    lastError: c.lastError,
    cachedAt: c.loadedAt ? new Date(c.loadedAt).toISOString() : null,
    firebaseUsable: firebaseUsable(),
  };
}


/* ================================================================== */
/*  سلسلة القواعد                                                      */
/* ================================================================== */
/*
  الغرضان: السعةُ والاستمرار. قاعدةٌ تمتلئ فتستوعب التاليةُ ما بعدها،
  وقاعدةٌ تتعطّل فتحلّ التاليةُ محلَّها بلا تدخّل.

  وكلُّ قاعدةٍ تحمل النسخةَ كاملةً — ومنها قائمةُ القواعد نفسُها. فأيُّ
  قاعدةٍ تردّ تعرف أخواتِها، وتُحلّ بذلك مسألةُ «كيف نقرأ القائمة
  والرئيسيةُ معطّلة؟».
*/

/** القواعد المعروفة الآن: المحفوظةُ في آخر نسخةٍ قُرئت + قاعدةُ البيئة. */
function knownNodes(c: Cache): DbNode[] {
  return orderNodes(c.data?.integrations?.databases);
}

/** يُحوّل القاعدة إلى إعدادِ اتصال. */
function asConfig(n: DbNode): FirebaseConfig {
  return {
    databaseURL: n.url,
    clientEmail: n.clientEmail,
    privateKey: n.privateKey,
    secret: n.secret,
  };
}

/**
 * يقرأ من أوّل قاعدةٍ تردّ.
 * الأخطاءُ تُجمع فلا تضيع، وتُرفع آخرُها إن سقطت السلسلةُ كلُّها.
 *
 * والمنصّةُ الافتراضية إن خلا جذرُها الجديد تُقرأ من الجذر القديم
 * `platform` — قراءةً فقط؛ فأوّلُ حفظٍ يكتب الجديدَ ويُغني عن القديم.
 */
async function readChain(c: Cache): Promise<DB | null> {
  const nodes = knownNodes(c);
  const root = platformRoot();
  const legacy = currentTenantId() === defaultTenantId();

  /* بلا فروع: المسار القديم نفسُه بلا زيادة. */
  if (nodes.length <= 1) {
    const data = await fbGet<DB>(root);
    if (data || !legacy) return data;
    return fbGet<DB>(LEGACY_ROOT);
  }

  let last: Error | null = null;
  for (const n of nodes) {
    try {
      let { data, bytes } = await fbGetFrom<DB>(asConfig(n), root);
      if (!data && legacy) ({ data, bytes } = await fbGetFrom<DB>(asConfig(n), LEGACY_ROOT));
      markUp(n.url, bytes);
      if (data) {
        c.activeUrl = n.url;
        return data;
      }
    } catch (e) {
      last = e as Error;
      markDown(n.url, (e as Error).message);
    }
  }
  if (last) throw last;
  return null;
}

/**
 * يكتب في القاعدة العاملة، ثم يَنسخ إلى البقيّة.
 * النسخُ لا يُنتظَر ولا يُفشِل: الكتابةُ نجحت متى قبلتها قاعدةٌ واحدة،
 * والبقيّةُ نسخٌ للأمان تلحق متى استطاعت.
 */
async function writeChain(c: Cache, root: string, payload: DB & { _syncedAt: string }): Promise<void> {
  const nodes = knownNodes(c);

  if (nodes.length <= 1) {
    await fbSet(root, payload);
    return;
  }

  const target = writeTarget(c.data?.integrations?.databases) ?? nodes[0];
  let wrote = false;
  let last: Error | null = null;

  /* الهدفُ أوّلاً، فإن أبى جُرِّبت البقيّة بترتيبها. */
  for (const n of [target, ...nodes.filter((x) => x.url !== target.url)]) {
    try {
      await fbSetTo(asConfig(n), root, payload);
      markUp(n.url);
      c.activeUrl = n.url;
      wrote = true;
      break;
    } catch (e) {
      last = e as Error;
      markDown(n.url, (e as Error).message);
    }
  }

  if (!wrote && last) throw last;

  /* نسخُ الأمان — بلا انتظار وبلا إفشال. */
  for (const n of nodes) {
    if (n.url === c.activeUrl) continue;
    void fbSetTo(asConfig(n), root, payload)
      .then(() => markUp(n.url))
      .catch((e: Error) => markDown(n.url, e.message));
  }
}

/** عنوانُ القاعدة التي يُقرأ منها ويُكتب فيها الآن — للعرض في اللوحة. */
export function activeNodeUrl(): string {
  return slot().activeUrl;
}
