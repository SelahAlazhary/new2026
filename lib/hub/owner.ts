import "server-only";
import crypto from "crypto";
import { cookies } from "next/headers";
import { AUTH_SECRET } from "../secrets";
import type { TenantOwner } from "./types";
import { hubGet, hubList, hubSet, hubId } from "./store";

/**
 * حسابُ المدرّس على الموقع الأمّ (Owner) — من يُنشئ منصّةً ويملكها.
 * ------------------------------------------------------------------
 * هذا **غير** حساب أدمن المنصّة (الذي يدخل لوحتَه بالبريد وكلمة المرور)،
 * وغير حساب أدمن المنصّات (Super). هو صاحبُ العلاقة التجاريّة: يسجّل
 * بجوجل مرّةً، ويملك منصّةً أو أكثر.
 *
 * الجلسةُ كوكيٌّ منفصلة `hub_owner`، بسرٍّ مشتقٍّ أحاديّاً من `AUTH_SECRET`
 * — فلا يُقرأ من رمزِ مالكٍ رمزُ مشرفٍ ولا رمزُ Super. وعمرُها ثلاثون
 * يوماً: التسجيلُ رحلةٌ قد تُقطع وتُستأنف، فلا تُقفل بجلسةٍ قصيرة.
 */

const COOKIE = "hub_owner";
const MAX_AGE = 60 * 60 * 24 * 30;
const SECURE = process.env.COOKIE_SECURE === "1" || process.env.VERCEL === "1";
const SECRET = crypto.createHmac("sha256", AUTH_SECRET).update("hub-owner-v1").digest("base64url");

export type OwnerSession = { oid: string; email: string; name: string };

function b64(buf: Buffer) {
  return buf.toString("base64url");
}
function sign(p: string) {
  return b64(crypto.createHmac("sha256", SECRET).update(p).digest());
}

export function createOwnerToken(s: OwnerSession): string {
  const payload = b64(Buffer.from(JSON.stringify({ ...s, typ: "owner", iat: Date.now() })));
  return `${payload}.${sign(payload)}`;
}

export function verifyOwnerToken(token: string | undefined): OwnerSession | null {
  if (!token || !token.includes(".")) return null;
  const [payload, sig] = token.split(".");
  const expected = sign(payload);
  if (sig.length !== expected.length || !crypto.timingSafeEqual(Buffer.from(sig), Buffer.from(expected))) return null;
  try {
    const d = JSON.parse(Buffer.from(payload, "base64url").toString());
    if (d.typ !== "owner") return null;
    if (!d.iat || Date.now() - Number(d.iat) > MAX_AGE * 1000) return null;
    if (!d.oid || !d.email) return null;
    return { oid: d.oid, email: d.email, name: d.name ?? "" };
  } catch {
    return null;
  }
}

export async function setOwnerCookie(s: OwnerSession) {
  (await cookies()).set(COOKIE, createOwnerToken(s), {
    httpOnly: true, sameSite: "lax", path: "/", maxAge: MAX_AGE, secure: SECURE,
  });
}

export async function clearOwnerCookie() {
  (await cookies()).delete(COOKIE);
}

export async function getOwnerSession(): Promise<OwnerSession | null> {
  return verifyOwnerToken((await cookies()).get(COOKIE)?.value);
}

/** الحسابُ صاحبُ الجلسة — أو null (يُعاد فحصُ الحساب في كلّ طلب). */
export async function requireOwner(): Promise<TenantOwner | null> {
  const s = await getOwnerSession();
  if (!s) return null;
  const rec = await ownerById(s.oid);
  return rec && !rec.blocked ? rec : null;
}

/* ---------- التخزين ---------- */

export async function ownerById(id: string): Promise<TenantOwner | null> {
  return hubGet<TenantOwner>(`owners/${id}`);
}

export async function ownerByEmail(email: string): Promise<TenantOwner | null> {
  const e = email.trim().toLowerCase();
  const all = await hubList<TenantOwner>("owners");
  return Object.values(all).find((o) => o && (o.email ?? "").toLowerCase() === e) ?? null;
}

/**
 * يُنشئ حسابَ مدرّسٍ أو يحدّثه من هويّةِ جوجل.
 * المفتاحُ البريد: من دخل بحسابَي جوجل ببريدٍ واحدٍ فهو واحد. و`googleSub`
 * يُخزَّن للتحقّق الثابت (البريدُ قد يتغيّر، والـsub لا).
 */
export async function upsertOwnerFromGoogle(p: {
  email: string; name?: string; picture?: string; googleSub: string;
}): Promise<TenantOwner> {
  const existing = await ownerByEmail(p.email);
  const now = new Date().toISOString();
  if (existing) {
    const updated: TenantOwner = {
      ...existing,
      name: p.name || existing.name,
      picture: p.picture ?? existing.picture,
      googleSub: p.googleSub || existing.googleSub,
      lastLoginAt: now,
    };
    await hubSet(`owners/${existing.id}`, updated);
    return updated;
  }
  const id = hubId("own");
  const rec: TenantOwner = {
    id,
    email: p.email.trim().toLowerCase(),
    name: p.name || p.email.split("@")[0],
    picture: p.picture,
    googleSub: p.googleSub,
    tenantIds: [],
    createdAt: now,
    lastLoginAt: now,
  };
  await hubSet(`owners/${id}`, rec);
  return rec;
}

/** يربط منصّةً بمالكها. */
export async function linkTenantToOwner(ownerId: string, tenantId: string): Promise<void> {
  const rec = await ownerById(ownerId);
  if (!rec) return;
  if (!rec.tenantIds.includes(tenantId)) {
    await hubSet(`owners/${ownerId}`, { ...rec, tenantIds: [...rec.tenantIds, tenantId] });
  }
}

export async function listOwners(): Promise<TenantOwner[]> {
  const all = await hubList<TenantOwner>("owners");
  return Object.values(all).filter(Boolean).sort((a, b) => (b.createdAt ?? "").localeCompare(a.createdAt ?? ""));
}
