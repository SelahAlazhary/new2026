import "server-only";
import crypto from "crypto";
import { cookies, headers } from "next/headers";
import { AUTH_SECRET } from "@/lib/auth/secrets";
import { hashPassword, verifyPassword } from "@/lib/db/db";
import { ensureDeviceId, deviceLabel } from "@/lib/auth/device";
import type { SuperAdmin } from "./types";
import { hubGet, hubList, hubSet, hubId } from "./store";

/**
 * جلسةُ أدمن المنصّات (Super Admin).
 * ------------------------------------------------------------------
 * **كوكيٌّ منفصلةٌ وسرٌّ منفصل.** لو شاركت جلسةَ المنصّات جلسةَ الطالب
 * رمزاً واحداً لصار تسريبُ سرٍّ في منصّةٍ واحدةٍ مفتاحاً للمنصّات كلِّها.
 * فالسرُّ من `HUB_SESSION_SECRET`، وإن لم يُضبط اشتُقّ من `AUTH_SECRET`
 * باشتقاقٍ أحاديّ (HMAC) — فلا يُعرف من أحدهما الآخر، ويبقى الضبطُ
 * الصريحُ هو الأصحّ.
 *
 * **وعمرُها اثنتا عشرة ساعةً لا سنة.** جلسةُ الطالب دائمةٌ عمداً (يفتح
 * منصّتَه كلَّ يوم)، وهذه سلطةٌ على منصّاتٍ كثيرة: تنتهي بانتهاء يوم
 * العمل، ولا تُجدَّد بالتصفّح.
 *
 * **والجهازُ يُربط** كما يُربط جهازُ المشرف — وصمّامُه `SUPER_DEVICE_LOCK=0`
 * لاستعادة الدخول إن فُقد الجهاز.
 */

const COOKIE = "hub_session";
const MAX_AGE = 60 * 60 * 12;
const SECURE = process.env.COOKIE_SECURE === "1" || process.env.VERCEL === "1";

const SECRET: string =
  process.env.HUB_SESSION_SECRET?.trim() ||
  crypto.createHmac("sha256", AUTH_SECRET).update("hub-session-v1").digest("base64url");

export type SuperSession = { sid: string; name: string; email: string };

function b64url(buf: Buffer) {
  return buf.toString("base64url");
}
function sign(payload: string) {
  return b64url(crypto.createHmac("sha256", SECRET).update(payload).digest());
}

export function createSuperToken(s: SuperSession): string {
  const payload = b64url(Buffer.from(JSON.stringify({ ...s, typ: "super", iat: Date.now() })));
  return `${payload}.${sign(payload)}`;
}

export function verifySuperToken(token: string | undefined): SuperSession | null {
  if (!token || !token.includes(".")) return null;
  const [payload, sig] = token.split(".");
  const expected = sign(payload);
  if (sig.length !== expected.length || !crypto.timingSafeEqual(Buffer.from(sig), Buffer.from(expected))) return null;
  try {
    const d = JSON.parse(Buffer.from(payload, "base64url").toString());
    /* نوعُ الرمز مكتوبٌ داخلَه: رمزُ منصّةٍ لا يُقرأ رمزَ هَبٍ ولو تشابه السرّ */
    if (d.typ !== "super") return null;
    if (!d.iat || Date.now() - Number(d.iat) > MAX_AGE * 1000) return null;
    if (!d.sid || !d.email) return null;
    return { sid: d.sid, name: d.name ?? "", email: d.email };
  } catch {
    return null;
  }
}

export async function setSuperCookie(s: SuperSession) {
  (await cookies()).set(COOKIE, createSuperToken(s), {
    httpOnly: true, sameSite: "lax", path: "/", maxAge: MAX_AGE, secure: SECURE,
  });
}

export async function clearSuperCookie() {
  (await cookies()).delete(COOKIE);
}

export async function getSuperSession(): Promise<SuperSession | null> {
  return verifySuperToken((await cookies()).get(COOKIE)?.value);
}

/* ---------- الحساب ---------- */

export async function superById(id: string): Promise<SuperAdmin | null> {
  return hubGet<SuperAdmin>(`superAdmins/${id}`);
}

export async function superByEmail(email: string): Promise<SuperAdmin | null> {
  const e = email.trim().toLowerCase();
  const all = await hubList<SuperAdmin>("superAdmins");
  return Object.values(all).find((s) => s && (s.email ?? "").toLowerCase() === e) ?? null;
}

export async function listSupers(): Promise<SuperAdmin[]> {
  const all = await hubList<SuperAdmin>("superAdmins");
  return Object.values(all).filter(Boolean).sort((a, b) => (a.createdAt ?? "").localeCompare(b.createdAt ?? ""));
}

/**
 * حسابُ المنصّات الأوّل — يُنشأ من البيئة عند أوّل محاولة دخول.
 * وبلا `SUPER_ADMIN_PASSWORD` **لا يُنشأ حساب**: أفضلُ من حسابٍ بكلمةٍ
 * معروفةٍ في مستودعٍ عامّ (القاعدةُ نفسُها في `lib/secrets.ts`).
 */
export async function ensureFirstSuper(): Promise<void> {
  const email = process.env.SUPER_ADMIN_EMAIL?.trim().toLowerCase();
  const password = process.env.SUPER_ADMIN_PASSWORD?.trim();
  if (!email || !password) return;
  if (await superByEmail(email)) return;
  const { salt, passwordHash } = hashPassword(password);
  const id = hubId("sa");
  const rec: SuperAdmin = {
    id, name: "أدمن المنصّات", email,
    passwordHash, salt,
    createdAt: new Date().toISOString(), active: true,
  };
  await hubSet(`superAdmins/${id}`, rec);
}

export async function checkSuperPassword(email: string, password: string): Promise<SuperAdmin | null> {
  const rec = await superByEmail(email);
  if (!rec || !rec.active) return null;
  const ok = verifyPassword(password, { passwordHash: rec.passwordHash, salt: rec.salt } as never);
  return ok ? rec : null;
}

/** ربطُ الحساب بجهازٍ واحد — والصمّامُ يرفعه عند فقد الجهاز. */
export function superDeviceLocked(): boolean {
  return process.env.SUPER_DEVICE_LOCK !== "0";
}

export async function bindSuperDevice(rec: SuperAdmin): Promise<void> {
  const device = await ensureDeviceId();
  const h = await headers();
  await hubSet(`superAdmins/${rec.id}`, {
    ...rec, deviceId: device, deviceLabel: deviceLabel(h.get("user-agent")),
  });
}

/**
 * الحسابُ صاحبُ الجلسة الحالية — أو `null`.
 * يُفحص في **كلّ** مسارٍ وصفحةٍ في الـHub: الرمزُ موقَّعٌ لكنّه لا يعرف
 * أنّ الحسابَ حُذف أو أُوقف أو انتقل جهازُه.
 */
export async function requireSuper(): Promise<SuperAdmin | null> {
  const session = await getSuperSession();
  if (!session) return null;
  const rec = await superById(session.sid);
  if (!rec || !rec.active) return null;
  if (superDeviceLocked() && rec.deviceId) {
    const { readDeviceId } = await import("@/lib/auth/device");
    const device = await readDeviceId();
    if (device !== rec.deviceId) return null;
  }
  return rec;
}
