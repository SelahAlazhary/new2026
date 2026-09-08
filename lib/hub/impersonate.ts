import "server-only";
import crypto from "crypto";
import { cookies } from "next/headers";
import { AUTH_SECRET } from "@/lib/auth/secrets";
import { tenantById } from "./registry";
import { hubGet } from "./store";
import { runInTenant, ctxForTenantId } from "./context";
import { loadDB, getDB } from "@/lib/db/db";
import { audit } from "./audit";
import type { SuperAdmin } from "./types";

/**
 * انتحالُ شخصيّة مشرف منصّة — يدخل أدمنُ المنصّات لوحةَ المنصّة كمديرها.
 * ------------------------------------------------------------------
 * **الأمان:**
 *   ــ كوكي `hub_impersonate` موقّعة HMAC تحمل معرّفَ أدمن المنصّات
 *      ومعرّفَ المنصّة ووقتَ الانتهاء (ساعة واحدة).
 *   ــ كوكي `emz_session` تُنشأ لمشرف المنصّة (أوّل admin أو owner).
 *   ــ كلُّ دخول وخروج يُدوَّن في سجلّ التدقيق.
 *   ــ لوحةُ الإدارة تعرض لافتةً لا تُخفى: «تتصفّح بصفة أدمن المنصّات».
 *
 * **ولا يبقى أبداً:** ساعةٌ ثمّ تنتهي الكوكيتان. والخروجُ من الانتحال
 * يمحوهما فوراً.
 */

const IMP_COOKIE = "hub_impersonate";
const IMP_MAX_AGE = 60 * 60;
const SECURE = process.env.COOKIE_SECURE === "1" || process.env.VERCEL === "1";

const IMP_SECRET: string =
  process.env.HUB_SESSION_SECRET?.trim() ||
  crypto.createHmac("sha256", AUTH_SECRET).update("impersonate-v1").digest("base64url");

function signImp(payload: string): string {
  return crypto.createHmac("sha256", IMP_SECRET).update(payload).digest("base64url");
}

type ImpersonateData = {
  superId: string;
  superName: string;
  tenantId: string;
  tenantSlug: string;
  exp: number;
};

function createImpToken(d: ImpersonateData): string {
  const payload = Buffer.from(JSON.stringify(d)).toString("base64url");
  return `${payload}.${signImp(payload)}`;
}

function verifyImpToken(token: string | undefined): ImpersonateData | null {
  if (!token || !token.includes(".")) return null;
  const [payload, sig] = token.split(".");
  const expected = signImp(payload);
  if (sig.length !== expected.length || !crypto.timingSafeEqual(Buffer.from(sig), Buffer.from(expected))) return null;
  try {
    const d = JSON.parse(Buffer.from(payload, "base64url").toString()) as ImpersonateData;
    if (Date.now() > d.exp) return null;
    return d;
  } catch {
    return null;
  }
}

export async function getImpersonation(): Promise<ImpersonateData | null> {
  try {
    return verifyImpToken((await cookies()).get(IMP_COOKIE)?.value);
  } catch {
    return null;
  }
}

export async function startImpersonation(
  sup: SuperAdmin,
  tenantId: string
): Promise<{ ok: boolean; url?: string; error?: string }> {
  const tenant = await tenantById(tenantId);
  if (!tenant || tenant.status === "archived") return { ok: false, error: "المنصّة غير موجودة" };

  const ctx = await ctxForTenantId(tenantId);
  const adminUser = await runInTenant(ctx, async () => {
    await loadDB();
    const db = getDB();
    return (db.users ?? []).find((u) => u.role === "admin") ?? null;
  });
  if (!adminUser) return { ok: false, error: "لا يوجد مشرف في هذه المنصّة" };

  const data: ImpersonateData = {
    superId: sup.id,
    superName: sup.name,
    tenantId: tenant.id,
    tenantSlug: tenant.slug,
    exp: Date.now() + IMP_MAX_AGE * 1000,
  };

  const store = await cookies();
  store.set(IMP_COOKIE, createImpToken(data), {
    httpOnly: true, sameSite: "lax", path: "/", maxAge: IMP_MAX_AGE, secure: SECURE,
  });

  /* جلسةُ المنصّة — تنتهي مع الانتحال */
  const { createToken } = await import("@/lib/auth/session");
  const sessionToken = await runInTenant(ctx, () => {
    return Promise.resolve(createToken({ uid: adminUser.id, role: adminUser.role, name: adminUser.name }));
  });
  store.set("emz_session", sessionToken, {
    httpOnly: true, sameSite: "lax", path: "/", maxAge: IMP_MAX_AGE, secure: SECURE,
  });

  await audit("impersonate.start", { kind: "super", id: sup.id, name: sup.name }, {
    tenantId, details: { adminUid: adminUser.id },
  });

  const rootDomain = process.env.ROOT_DOMAIN?.trim();
  const url = rootDomain
    ? `https://${tenant.slug}.${rootDomain}/admin`
    : `http://localhost:3000/admin?tenant=${tenant.slug}`;
  return { ok: true, url };
}

export async function endImpersonation(): Promise<void> {
  const imp = await getImpersonation();
  const store = await cookies();
  store.delete(IMP_COOKIE);
  store.delete("emz_session");
  if (imp) {
    await audit("impersonate.end", { kind: "super", id: imp.superId, name: imp.superName }, {
      tenantId: imp.tenantId,
    });
  }
}
