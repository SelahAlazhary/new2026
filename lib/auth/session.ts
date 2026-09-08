import "server-only";
import { cookies } from "next/headers";
import crypto from "crypto";
import type { Role } from "@/lib/utils/types";

/**
 * جلسات موقّعة (HMAC) بدون تخزين على السيرفر — مناسبة للتشغيل المحلي.
 * السرّ من AUTH_SECRET أو قيمة تطوير احتياطية.
 */
import { AUTH_SECRET as SECRET } from "@/lib/auth/secrets";
import { tryCurrentTenant, bindTenant } from "@/lib/hub/context";
import { defaultTenantId } from "@/lib/hub/registry";
/**
 * علم Secure للكوكي: يُفعَّل يدوياً عند النشر على HTTPS (COOKIE_SECURE=1).
 * لا يُشتق من NODE_ENV لأن التشغيل الإنتاجي على http://localhost شائع،
 * وكوكي Secure على HTTP لا تُرسَل أبداً فيفقد الجميع جلساتهم.
 */
const SECURE = process.env.COOKIE_SECURE === "1";
const COOKIE = "emz_session";
const MAX_AGE = 60 * 60 * 24 * 365; // سنة — جلسة دائمة تُجدَّد تلقائياً مع كل زيارة

export type Session = { uid: string; role: Role; name: string };

function b64url(buf: Buffer) {
  return buf.toString("base64").replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
}
function sign(payload: string) {
  return b64url(crypto.createHmac("sha256", SECRET).update(payload).digest());
}

/**
 * الرمزُ يحمل معرّفَ منصّته `tid`.
 * ------------------------------------------------------------------
 * الكوكي معزولةٌ بالمضيف أصلاً، لكنّ المنصّةَ الواحدة قد تُخدم على
 * نطاقٍ فرعيّ ودومينٍ مخصّص، والرمزُ يُنسخ بين الأجهزة. فيُربط الرمزُ
 * بمنصّته ويُرفض على غيرها — كوكي منصّة «أ» لا تفتح شيئاً على «ب» ولو
 * تطابق معرّفُ المستخدم مصادفةً.
 *
 * والرمزُ القديم (قبل تعدّد المنصّات) بلا `tid` يُقبل على المنصّة
 * الافتراضية وحدَها ثمّ يُستبدل برمزٍ موسومٍ عند أوّل زيارة — فلا يخرج
 * طالبٌ من حسابه بسبب الترحيل.
 */
export function createToken(s: Session): string {
  const tid = tryCurrentTenant()?.id;
  const payload = b64url(Buffer.from(JSON.stringify({ ...s, tid, iat: Date.now() })));
  return `${payload}.${sign(payload)}`;
}

type Parsed = { session: Session; legacy: boolean };

function parseToken(token: string | undefined): Parsed | null {
  if (!token || !token.includes(".")) return null;
  const [payload, sig] = token.split(".");
  const expected = sign(payload);
  // مقارنة زمن-ثابت
  if (sig.length !== expected.length || !crypto.timingSafeEqual(Buffer.from(sig), Buffer.from(expected))) {
    return null;
  }
  try {
    const data = JSON.parse(Buffer.from(payload.replace(/-/g, "+").replace(/_/g, "/"), "base64").toString());
    // انتهاء صلاحية حقيقي: رمز قديم لا يُقبل حتى لو بقيت الكوكي على الجهاز
    if (!data.iat || Date.now() - Number(data.iat) > MAX_AGE * 1000) return null;
    if (!data.uid || (data.role !== "admin" && data.role !== "student")) return null;

    /* ربطُ الرمز بمنصّته — بلا سياقٍ لا يُقبل شيء (الفشلُ مغلق) */
    const here = tryCurrentTenant()?.id;
    if (!here) return null;
    const legacy = typeof data.tid !== "string" || !data.tid;
    if (legacy ? here !== defaultTenantId() : data.tid !== here) return null;

    return { session: { uid: data.uid, role: data.role, name: data.name }, legacy };
  } catch {
    return null;
  }
}

export function verifyToken(token: string | undefined): Session | null {
  return parseToken(token)?.session ?? null;
}

/** قراءة الجلسة الحالية (Server Components / Route Handlers). */
export async function getSession(): Promise<Session | null> {
  /*
    التخطيطاتُ المتداخلة (admin/student) تسأل عن الجلسة قبل `loadDB()`،
    وNext يرسمها على التوازي مع الجذر — فلا يُفترض أنّ أحداً ربط المنصّةَ
    قبلنا. الربطُ هنا رخيصٌ (ذاكرةٌ مؤقّتة) ولا يفعل شيئاً إن كان قائماً.
    وبلا منصّةٍ (مضيفٌ مجهول) لا جلسةَ أصلاً.
  */
  try {
    await bindTenant();
  } catch {
    return null;
  }
  const store = await cookies();
  return verifyToken(store.get(COOKIE)?.value);
}

/** تمديد صلاحية الكوكي عند كل استخدام (جلسة دائمة ما دام الطالب يفتح المنصّة). */
export async function touchSession(): Promise<Session | null> {
  try {
    await bindTenant();
  } catch {
    return null;
  }
  const store = await cookies();
  const raw = store.get(COOKIE)?.value;
  const parsed = parseToken(raw);
  const session = parsed?.session ?? null;
  if (session && raw) {
    try {
      /* الرمزُ القديم بلا `tid` يُستبدل بموسومٍ — مرّةً واحدة ثمّ يُمدَّد كما هو */
      const value = parsed!.legacy ? createToken(session) : raw;
      store.set(COOKIE, value, { httpOnly: true, sameSite: "lax", path: "/", maxAge: MAX_AGE, secure: SECURE });
    } catch {
      /* لا يمكن الكتابة في بعض السياقات — القراءة تكفي */
    }
  }
  return session;
}

export async function setSessionCookie(s: Session) {
  const store = await cookies();
  store.set(COOKIE, createToken(s), {
    httpOnly: true,
    sameSite: "lax",
    path: "/",
    maxAge: MAX_AGE,
    secure: SECURE,
  });
}

export async function clearSessionCookie() {
  const store = await cookies();
  store.delete(COOKIE);
}
