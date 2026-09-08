import "server-only";
import crypto from "crypto";

/**
 * تخزين البيانات في Firebase Realtime Database عبر REST من الخادم.
 *
 * لماذا من الخادم؟ كل منطق المنصّة (الجلسات، الصلاحيات، الأكواد، تصحيح الاختبارات)
 * يُنفَّذ على الخادم؛ فلو تحدّث المتصفّح مع فايربيز مباشرة لسقطت هذه الحماية.
 * لذلك الخادم وحده يقرأ ويكتب، وقواعد فايربيز تبقى مغلقة تماماً أمام العملاء.
 *
 * المصادقة: حساب خدمة (Service Account) يُوقّع JWT ويستبدله برمز وصول،
 * أو سرّ قاعدة البيانات القديم (auth=) لمن لا يملك حساب خدمة.
 * كلاهما يُقرأ من متغيّرات البيئة فقط ولا يصل المتصفّح إطلاقاً.
 */

const SCOPES = [
  "https://www.googleapis.com/auth/userinfo.email",
  "https://www.googleapis.com/auth/firebase.database",
].join(" ");

export type FirebaseConfig = {
  databaseURL: string;
  clientEmail?: string;
  privateKey?: string;
  secret?: string;
};

function readConfig(): FirebaseConfig | null {
  const databaseURL = process.env.FIREBASE_DATABASE_URL?.trim();
  if (!databaseURL) return null;
  return {
    databaseURL: databaseURL.replace(/\/$/, ""),
    clientEmail: process.env.FIREBASE_CLIENT_EMAIL?.trim(),
    // المفتاح في .env يُكتب بسطر واحد مع \n
    privateKey: process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, "\n").trim(),
    secret: process.env.FIREBASE_DATABASE_SECRET?.trim(),
  };
}

/** مضبوط = يوجد عنوان قاعدة (ويمكن العمل باعتماد أو بقواعد مفتوحة). */
export function firebaseConfigured(): boolean {
  return Boolean(readConfig()?.databaseURL);
}

/** هل يوجد اعتماد خادم (حساب خدمة أو سرّ)؟ */
export function firebaseHasCredential(): boolean {
  const c = readConfig();
  return Boolean(c && (c.secret || (c.clientEmail && c.privateKey)));
}

/**
 * صالح للاستخدام: باعتماد (الوضع الآمن)،
 * أو بلا اعتماد إذا كانت القواعد مفتوحة (يعمل لكنه غير آمن — يُنبَّه عليه في اللوحة).
 */
export function firebaseSecure(): boolean {
  return firebaseConfigured();
}

/** فحص إن كانت القاعدة مفتوحة للعالم (قراءة بلا مصادقة). */
export async function firebaseRulesOpen(): Promise<boolean> {
  const c = readConfig();
  if (!c) return false;
  try {
    const res = await fetch(`${c.databaseURL}/.json?shallow=true`, { cache: "no-store" });
    return res.ok;
  } catch {
    return false;
  }
}

/** وصف حالة الربط للوحة (بلا أي أسرار). */
export function firebaseStatus(): {
  configured: boolean;
  databaseURL?: string;
  mode?: "service-account" | "secret" | "open";
  hasCredential: boolean;
} {
  const c = readConfig();
  if (!c) return { configured: false, hasCredential: false };
  const mode = c.clientEmail && c.privateKey ? "service-account" : c.secret ? "secret" : "open";
  return { configured: true, databaseURL: c.databaseURL, mode, hasCredential: firebaseHasCredential() };
}

/* ---------- رمز الوصول (حساب الخدمة) ---------- */

let cachedToken: { value: string; exp: number } | null = null;

function b64url(input: Buffer | string): string {
  return Buffer.from(input).toString("base64url");
}

/**
 * فرق ساعة الجهاز عن ساعة جوجل (مللي ثانية).
 * ساعة متقدّمة أو متأخّرة تُفشل توقيع JWT برسالة «Invalid JWT»،
 * لذا نقيس الفرق من ترويسة Date في ردّ جوجل ونصحّحه تلقائياً.
 */
let clockSkewMs = 0;

function buildAssertion(c: FirebaseConfig): string {
  // ننقص ٣٠ ثانية كهامش أمان ضدّ فروق الساعة الصغيرة
  const now = Math.floor((Date.now() - clockSkewMs) / 1000) - 30;
  const header = b64url(JSON.stringify({ alg: "RS256", typ: "JWT" }));
  const claim = b64url(
    JSON.stringify({
      iss: c.clientEmail,
      scope: SCOPES,
      aud: "https://oauth2.googleapis.com/token",
      iat: now,
      exp: now + 3600,
    })
  );
  const signature = crypto
    .createSign("RSA-SHA256")
    .update(`${header}.${claim}`)
    .sign(c.privateKey!)
    .toString("base64url");
  return `${header}.${claim}.${signature}`;
}

async function requestToken(c: FirebaseConfig) {
  const res = await fetch("https://oauth2.googleapis.com/token", {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      grant_type: "urn:ietf:params:oauth:grant-type:jwt-bearer",
      assertion: buildAssertion(c),
    }).toString(),
    cache: "no-store",
  });
  const data = (await res.json().catch(() => ({}))) as Record<string, string>;
  return { res, data };
}

/*
  الرموز تُخزَّن لكل حساب خدمة على حدة.
  ------------------------------------------------------------------
  كان الرمزُ واحداً مخزَّناً لجميع القواعد، فلمّا صارت القواعد أكثر من
  واحدة أخذت الثانيةُ رمزَ الأولى — فتُرفض. المفتاحُ هو البريد نفسه.
*/
const tokens = new Map<string, { value: string; exp: number }>();

async function accessToken(c: FirebaseConfig): Promise<string | null> {
  if (!c.clientEmail || !c.privateKey) return null;
  const key = c.clientEmail;
  const hit = tokens.get(key);
  if (hit && hit.exp - 60_000 > Date.now()) return hit.value;

  let { res, data } = await requestToken(c);

  // ساعة الجهاز غير مضبوطة: نقيس الفرق من ردّ جوجل ونعيد المحاولة مرّة واحدة
  if (!res.ok && /JWT|iat|exp|timeframe/i.test(String(data.error_description ?? data.error ?? ""))) {
    const serverDate = res.headers.get("date");
    const t = serverDate ? Date.parse(serverDate) : NaN;
    if (Number.isFinite(t)) {
      clockSkewMs = Date.now() - t;
      ({ res, data } = await requestToken(c));
    }
  }

  if (!res.ok || !data.access_token) {
    const off = Math.round(clockSkewMs / 1000);
    const extra = Math.abs(off) > 30 ? ` (ساعة الجهاز تختلف عن الوقت الحقيقي بـ ${off} ثانية)` : "";
    throw new Error((data.error_description || data.error || "تعذّر الحصول على رمز فايربيز") + extra);
  }
  const fresh = { value: data.access_token, exp: Date.now() + Number(data.expires_in ?? 3600) * 1000 };
  tokens.set(key, fresh);
  return fresh.value;
}

/** عنوان المسار مع بيانات الاعتماد. */
export async function urlFor(c: FirebaseConfig, path: string, query = ""): Promise<string> {
  const base = `${c.databaseURL.replace(/\/$/, "")}/${path.replace(/^\//, "")}.json`;
  const token = await accessToken(c);
  const auth = token
    ? `access_token=${token}`
    : c.secret
      ? `auth=${encodeURIComponent(c.secret)}`
      : "";
  const qs = [auth, query].filter(Boolean).join("&");
  return qs ? `${base}?${qs}` : base;
}

async function url(path: string, query = ""): Promise<string> {
  const c = readConfig();
  if (!c) throw new Error("فايربيز غير مضبوط");
  const base = `${c.databaseURL}/${path.replace(/^\//, "")}.json`;
  const token = await accessToken(c);
  const auth = token
    ? `access_token=${token}`
    : c.secret
      ? `auth=${encodeURIComponent(c.secret)}`
      : ""; // قواعد مفتوحة — بلا مصادقة
  const qs = [auth, query].filter(Boolean).join("&");
  return qs ? `${base}?${qs}` : base;
}

/* ---------- ترميز المفاتيح ---------- */
/**
 * Realtime Database تمنع في أسماء المفاتيح: . $ # [ ] / ورموز التحكّم.
 * وبياناتنا فيها مفاتيح مثل «hero.statusPill»، لذا نُرمّزها عند الكتابة
 * ونفكّها عند القراءة — فتُحفظ البيانات كما هي بلا فقدان.
 */
const BAD_KEY = /[.$#[\]/]/g;
const ESCAPES: Record<string, string> = { ".": "~d~", "$": "~s~", "#": "~h~", "[": "~l~", "]": "~r~", "/": "~f~" };
const UNESCAPES: Record<string, string> = Object.fromEntries(Object.entries(ESCAPES).map(([k, v]) => [v, k]));

function encodeKey(k: string): string {
  return k.replace(BAD_KEY, (c) => ESCAPES[c] ?? c);
}
function decodeKey(k: string): string {
  return k.replace(/~[dshlrf]~/g, (m) => UNESCAPES[m] ?? m);
}

/** ترميز عميق للمفاتيح + إسقاط undefined (فايربيز ترفضها). */
export function encodeForFirebase(value: unknown): unknown {
  if (Array.isArray(value)) return value.map(encodeForFirebase);
  if (value && typeof value === "object") {
    const out: Record<string, unknown> = {};
    for (const [k, v] of Object.entries(value as Record<string, unknown>)) {
      if (v === undefined) continue;
      out[encodeKey(k)] = encodeForFirebase(v);
    }
    return out;
  }
  return value;
}

/** فكّ الترميز عند القراءة. */
export function decodeFromFirebase(value: unknown): unknown {
  if (Array.isArray(value)) return value.map(decodeFromFirebase);
  if (value && typeof value === "object") {
    const out: Record<string, unknown> = {};
    for (const [k, v] of Object.entries(value as Record<string, unknown>)) {
      out[decodeKey(k)] = decodeFromFirebase(v);
    }
    return out;
  }
  return value;
}

/* ---------- عمليات القراءة والكتابة ---------- */

export async function fbGet<T>(path: string): Promise<T | null> {
  const res = await fetch(await url(path), { cache: "no-store" });
  if (!res.ok) throw new Error(`فايربيز: فشل القراءة (${res.status})`);
  const data = await res.json();
  return (data === null ? null : (decodeFromFirebase(data) as T));
}

export async function fbSet(path: string, value: unknown): Promise<void> {
  const res = await fetch(await url(path), {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(encodeForFirebase(value) ?? null),
    cache: "no-store",
  });
  if (!res.ok) {
    const detail = await res.text().catch(() => "");
    throw new Error(`فايربيز: فشل الكتابة (${res.status})${detail ? ` — ${detail.slice(0, 160)}` : ""}`);
  }
}

/**
 * مطالبةٌ ذرّيّةٌ على عقدةٍ — تنجح مرّةً واحدةً في العالم كلِّه.
 * ------------------------------------------------------------------
 * **لماذا؟** المخزنُ يكتب الشجرةَ كاملةً بـ`PUT` (آخرُ كاتبٍ يفوز)،
 * وله مخبأٌ عمرُه خمسَ عشرةَ ثانية. فعلى Vercel — نُسخٌ متعدّدة، كلٌّ
 * بمخبئها — يقرأ اثنان الكودَ «متاحاً» في نافذةٍ واحدةٍ فيُستهلك مرّتين،
 * أو يُصفّى قبولُ دفعةٍ بكتابةٍ من نسخةٍ قديمة.
 *
 * وحلُّه ذرّيّةٌ على مستوى Firebase نفسِه: تُنشأ العقدةُ من العدم بكتابةٍ
 * **مشروطةٍ بـETag**. من يكتب أوّلاً يفوز (200)، والثاني يُرفض (412) —
 * جُرّب حيّاً على قاعدة الإنتاج. فالمفتاحُ يُطالَب مرّةً واحدة مهما تعدّدت
 * النُّسخ.
 *
 * يعيد `true` إن طالبتَه أنت الآن، و`false` إن كان مطالَباً — سواءٌ من
 * قبلُ أو في السباق نفسِه.
 */
export async function fbClaimOnce(path: string, payload: unknown): Promise<boolean> {
  const c = readConfig();
  if (!c) return true; // بلا فايربيز: عمليّةٌ واحدة، لا سباقَ عبر نُسخ
  // ١) ETag الحاليّ (وقيمتُه) — `null_etag` للعقدة الفارغة
  const getRes = await fetch(await url(path), { headers: { "X-Firebase-ETag": "true" }, cache: "no-store" });
  if (getRes.ok) {
    const cur = await getRes.json();
    if (cur !== null && cur !== undefined) return false; // مطالَبٌ من قبل
  }
  const etag = getRes.headers.get("etag") ?? "null_etag";
  // ٢) كتابةٌ مشروطة: تنجح فقط إن لم تتغيّر العقدةُ منذ القراءة
  const putRes = await fetch(await url(path), {
    method: "PUT",
    headers: { "Content-Type": "application/json", "if-match": etag },
    body: JSON.stringify(encodeForFirebase(payload) ?? null),
    cache: "no-store",
  });
  if (putRes.status === 412) return false; // فاز غيرُك في السباق
  if (!putRes.ok) throw new Error(`فايربيز: فشل المطالبة (${putRes.status})`);
  return true;
}

/** إلغاءُ مطالبةٍ — للتراجع إن فشل ما بعدها. */
export async function fbReleaseClaim(path: string): Promise<void> {
  const c = readConfig();
  if (!c) return;
  await fetch(await url(path), { method: "DELETE", cache: "no-store" }).catch(() => {});
}

export async function fbUpdate(path: string, value: Record<string, unknown>): Promise<void> {
  const res = await fetch(await url(path), {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(encodeForFirebase(value)),
    cache: "no-store",
  });
  if (!res.ok) throw new Error(`فايربيز: فشل التحديث (${res.status})`);
}

/** فحص سريع للاتصال (يُستخدم في لوحة الأدمن). */
export async function fbPing(): Promise<{ ok: boolean; error?: string }> {
  try {
    await fbGet("__health");
    await fbSet("__health", { at: new Date().toISOString() });
    return { ok: true };
  } catch (e) {
    return { ok: false, error: (e as Error).message };
  }
}

/* ------------------------------------------------------------------ */
/*  قراءة وكتابة على قاعدةٍ بعينها                                     */
/*  ------------------------------------------------------------------ */
/*  المسارات أعلاه تعمل على القاعدة المضبوطة في البيئة. وهذه تأخذ       */
/*  القاعدةَ صراحةً — تلزم لسلسلة القواعد حيث تُجرَّب واحدةٌ بعد أخرى.   */

/** يقرأ من قاعدةٍ محدّدة، ويعيد الحجمَ المقروء معه. */
export async function fbGetFrom<T>(
  c: FirebaseConfig,
  path: string
): Promise<{ data: T | null; bytes: number }> {
  const res = await fetch(await urlFor(c, path), { cache: "no-store" });
  if (!res.ok) throw new Error(`فايربيز: فشل القراءة (${res.status})`);
  const text = await res.text();
  const raw = text ? JSON.parse(text) : null;
  return {
    data: raw === null ? null : (decodeFromFirebase(raw) as T),
    /* الحجمُ المقروء هو ما يُنقل في كل قراءة — وهو المقياس الذي يهمّ. */
    bytes: text.length,
  };
}

/** يكتب في قاعدةٍ محدّدة. */
export async function fbSetTo(c: FirebaseConfig, path: string, value: unknown): Promise<void> {
  const res = await fetch(await urlFor(c, path), {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(encodeForFirebase(value) ?? null),
    cache: "no-store",
  });
  if (!res.ok) {
    const detail = await res.text().catch(() => "");
    throw new Error(`فايربيز: فشل الكتابة (${res.status})${detail ? ` — ${detail.slice(0, 160)}` : ""}`);
  }
}

/** فحصٌ سريع لقاعدة — يُستعمل في اللوحة وفي اختيار القاعدة العاملة. */
export async function fbPingNode(c: FirebaseConfig): Promise<{ ok: boolean; error?: string }> {
  const r = await fbProbe(c, false);
  return { ok: r.ok, error: r.error };
}

export type FbProbe = {
  /** تردّ وتُقرأ. */
  ok: boolean;
  /** تقبل الكتابة (يُفحص فقط حين يُطلب). */
  writable: boolean | null;
  /**
   * قواعدُها مفتوحة: قُرئت وكُتبت بلا اعتماد.
   * هذا **ليس نجاحاً** بل ثغرة — أيُّ أحدٍ يعرف العنوان يقرأ بيانات
   * الطلاب ويكتب فيها. فيُرفع تحذيراً لا يُبتلع.
   */
  openRules: boolean;
  /** حجمُ ما قُرئ — به تُقاس السعة. */
  bytes: number;
  status: number;
  error?: string;
};

/**
 * فحصٌ حقيقي لقاعدة.
 * ------------------------------------------------------------------
 * **لماذا لا يكفي `fetch` وحدَه؟** `fetch` لا يرمي على ٤٠٤ ولا على
 * ٤٠١ — يرمي على عطل الشبكة فقط. فكان الفحصُ القديم يُمرّر كلَّ عنوانٍ
 * لا وجود له وكلَّ قاعدةٍ ترفض الوصول، ويقول «تعمل». فهنا تُقرأ الحالةُ
 * نفسُها لا مجرّد وصول الطلب.
 *
 * وتُميَّز ثلاثُ حالات لا واحدة: لا تردّ · تردّ وترفض · تردّ وتقبل.
 * والثالثةُ تنقسم: تقبل باعتمادٍ (سليمة) أو تقبل بلا اعتماد (مفتوحة).
 */
export async function fbProbe(c: FirebaseConfig, write = true): Promise<FbProbe> {
  const out: FbProbe = { ok: false, writable: null, openRules: false, bytes: 0, status: 0 };
  const hasCred = Boolean(c.secret || (c.clientEmail && c.privateKey));

  try {
    const res = await fetch(await urlFor(c, "platform", "shallow=true"), { cache: "no-store" });
    out.status = res.status;
    const text = await res.text().catch(() => "");
    out.bytes = text.length;

    if (!res.ok) {
      out.error =
        res.status === 401 || res.status === 403
          ? "ترفض الوصول — قواعدُها مقفلة ولا اعتماد معها"
          : res.status === 404
            ? "لا توجد قاعدةٌ بهذا العنوان"
            : `ردَّت بالحالة ${res.status}`;
      return out;
    }
    out.ok = true;
  } catch (e) {
    out.error = `لا تردّ: ${(e as Error).message}`;
    return out;
  }

  if (!write) return out;

  try {
    const res = await fetch(await urlFor(c, "platform/_probe"), {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ at: new Date().toISOString() }),
      cache: "no-store",
    });
    out.writable = res.ok;
    if (!res.ok) {
      out.error = res.status === 401 || res.status === 403
        ? "تقبل القراءة ولا تقبل الكتابة — قواعدُها تمنع الكتابة"
        : `فشلت الكتابة (${res.status})`;
    } else if (!hasCred) {
      /* كُتب فيها بلا اعتماد: مفتوحةٌ للعالم. */
      out.openRules = true;
    }
  } catch (e) {
    out.writable = false;
    out.error = `فشلت الكتابة: ${(e as Error).message}`;
  }

  return out;
}
