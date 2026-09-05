import { NextResponse } from "next/server";
import crypto from "crypto";
import { cookies } from "next/headers";
import { isHubHost } from "@/lib/hub/guard-host";
import { oidcConfigured, ownerAuthUrl } from "@/lib/hub/google-oidc";
import { upsertOwnerFromGoogle, setOwnerCookie } from "@/lib/hub/owner";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

/**
 * بدءُ دخول المدرّس بجوجل.
 * ------------------------------------------------------------------
 * يُنشئ `state` عشوائيّاً ويحفظه في كوكي httpOnly، فلا يُقبل ردٌّ من جوجل
 * لا يحمل الـstate نفسَه (حماية CSRF). ثمّ يحوّل إلى شاشة موافقة جوجل.
 *
 * **وبلا ضبطِ جوجل محلّيّاً** (تطويرٌ فقط، خارج فيرسل): يُقبل `?dev=بريد`
 * فيُنشأ حسابُ مدرّسٍ مباشرةً — ليُختبر التدفّقُ بلا حساب حقيقيّ. وهذا
 * البابُ مغلقٌ تماماً على فيرسل.
 */
export async function GET(req: Request) {
  if (!(await isHubHost())) return NextResponse.json({ error: "غير موجود" }, { status: 404 });

  const url = new URL(req.url);
  const next = sanitizeNext(url.searchParams.get("next"));

  /* بابُ التطوير — لا يعمل على الاستضافة */
  const dev = url.searchParams.get("dev");
  if (dev && !oidcConfigured() && !process.env.VERCEL) {
    const email = dev.trim().toLowerCase();
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      return NextResponse.json({ error: "بريد غير صالح" }, { status: 400 });
    }
    const owner = await upsertOwnerFromGoogle({ email, name: email.split("@")[0], googleSub: `dev:${email}` });
    await setOwnerCookie({ oid: owner.id, email: owner.email, name: owner.name });
    return NextResponse.redirect(new URL(next, url.origin));
  }

  if (!oidcConfigured()) {
    return NextResponse.json({ error: "الدخول بجوجل غير مُهيّأ بعد" }, { status: 503 });
  }

  const state = crypto.randomBytes(16).toString("hex");
  (await cookies()).set("hub_oauth_state", `${state}|${next}`, {
    httpOnly: true, sameSite: "lax", path: "/", maxAge: 600,
    secure: process.env.COOKIE_SECURE === "1" || process.env.VERCEL === "1",
  });
  return NextResponse.redirect(ownerAuthUrl(url.origin, state));
}

/** لا يُقبل إلّا مسارٌ داخليٌّ نسبيّ — منعاً للتحويل المفتوح. */
function sanitizeNext(raw: string | null): string {
  const v = (raw ?? "").trim();
  return v.startsWith("/") && !v.startsWith("//") ? v : "/start";
}
