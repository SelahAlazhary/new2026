import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { isHubHost } from "@/lib/hub/guard-host";
import { exchangeOwnerCode } from "@/lib/hub/google-oidc";
import { upsertOwnerFromGoogle, setOwnerCookie } from "@/lib/hub/owner";
import { audit } from "@/lib/hub/audit";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

/**
 * عودةُ جوجل بعد الموافقة.
 * يتحقّق من `state` مقابل الكوكي، ثمّ يبدّل الرمزَ بهويّةٍ متحقَّقٍ منها،
 * فيُنشئ حسابَ المدرّس ويفتح جلستَه ويعيده إلى حيث كان (`next`).
 */
export async function GET(req: Request) {
  if (!(await isHubHost())) return NextResponse.json({ error: "غير موجود" }, { status: 404 });

  const url = new URL(req.url);
  const code = url.searchParams.get("code");
  const state = url.searchParams.get("state");
  const err = url.searchParams.get("error");

  const store = await cookies();
  const saved = store.get("hub_oauth_state")?.value ?? "";
  store.delete("hub_oauth_state");
  const [savedState, next = "/start"] = saved.split("|");

  const fail = (msg: string) => NextResponse.redirect(new URL(`/start?error=${encodeURIComponent(msg)}`, url.origin));

  if (err) return fail("أُلغي الدخول بجوجل");
  if (!code || !state || !savedState || state !== savedState) return fail("طلب غير صالح، أعد المحاولة");

  try {
    const identity = await exchangeOwnerCode(url.origin, code);
    const owner = await upsertOwnerFromGoogle({
      email: identity.email, name: identity.name, picture: identity.picture, googleSub: identity.sub,
    });
    await setOwnerCookie({ oid: owner.id, email: owner.email, name: owner.name });
    await audit("owner.login", { kind: "owner", id: owner.id, name: owner.name });
    return NextResponse.redirect(new URL(next.startsWith("/") ? next : "/start", url.origin));
  } catch (e) {
    return fail((e as Error).message || "تعذّر الدخول بجوجل");
  }
}
