import "server-only";

/**
 * دخولُ المدرّس بجوجل (OpenID Connect).
 * ------------------------------------------------------------------
 * يُعيد استعمالَ `GOOGLE_CLIENT_ID/SECRET` نفسِهما، لكن بنطاقاتٍ أضيق —
 * `openid email profile` فقط، لا Drive ولا Calendar: الدخولُ هويّةٌ لا
 * صلاحيّةٌ على حساب المدرّس.
 *
 * **والتحقّقُ من `id_token` عبر نقطة `tokeninfo` من جوجل**: تتحقّق من
 * التوقيع والصلاحيّة وتُعيد الحقولَ مُتحقَّقاً منها. وهذا أمتنُ من فكّ
 * الرمز يدويّاً ومطابقةِ مفاتيح JWK — خطوةٌ يسهل أن تُنفَّذ خطأً فتُقبل
 * رموزٌ مزوّرة. وكلفتُها نداءٌ واحدٌ يقع مرّةً في الدخول.
 *
 * وعنوانُ العودة **على الجذر دائماً** `/api/hub/auth/google/callback` —
 * فلا يُسجَّل في Google Cloud إلّا واحد، ولا يتغيّر بتغيّر المنصّات.
 */

const AUTH_URL = "https://accounts.google.com/o/oauth2/v2/auth";
const TOKEN_URL = "https://oauth2.googleapis.com/token";
const TOKENINFO_URL = "https://oauth2.googleapis.com/tokeninfo";

export function oidcConfigured(): boolean {
  return Boolean(process.env.GOOGLE_CLIENT_ID && process.env.GOOGLE_CLIENT_SECRET);
}

function callbackUrl(origin: string): string {
  /* ثابتٌ على الجذر، ويقبل تخصيصاً صريحاً لبيئةٍ معيّنة */
  return process.env.HUB_GOOGLE_REDIRECT_URI || new URL("/api/hub/auth/google/callback", origin).toString();
}

export function ownerAuthUrl(origin: string, state: string): string {
  const p = new URLSearchParams({
    client_id: process.env.GOOGLE_CLIENT_ID!,
    redirect_uri: callbackUrl(origin),
    response_type: "code",
    scope: "openid email profile",
    state,
    prompt: "select_account",
    include_granted_scopes: "false",
  });
  return `${AUTH_URL}?${p.toString()}`;
}

export type GoogleIdentity = { email: string; name?: string; picture?: string; sub: string };

/** يبدّل الرمزَ بهويّةٍ متحقَّقٍ منها — أو يرمي. */
export async function exchangeOwnerCode(origin: string, code: string): Promise<GoogleIdentity> {
  const res = await fetch(TOKEN_URL, {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      code,
      client_id: process.env.GOOGLE_CLIENT_ID!,
      client_secret: process.env.GOOGLE_CLIENT_SECRET!,
      redirect_uri: callbackUrl(origin),
      grant_type: "authorization_code",
    }).toString(),
    cache: "no-store",
  });
  const tokens = (await res.json().catch(() => ({}))) as { id_token?: string; error_description?: string; error?: string };
  if (!res.ok || !tokens.id_token) {
    throw new Error(tokens.error_description || tokens.error || "تعذّر الاتصال بجوجل");
  }
  return verifyIdToken(tokens.id_token);
}

/** يتحقّق من `id_token` ويُعيد الهويّة — التوقيعُ والجمهورُ والمُصدِر وصحّةُ البريد. */
export async function verifyIdToken(idToken: string): Promise<GoogleIdentity> {
  const res = await fetch(`${TOKENINFO_URL}?id_token=${encodeURIComponent(idToken)}`, { cache: "no-store" });
  if (!res.ok) throw new Error("رمز جوجل غير صالح");
  const c = (await res.json()) as Record<string, string | boolean>;

  if (c.aud !== process.env.GOOGLE_CLIENT_ID) throw new Error("رمز جوجل لتطبيقٍ آخر");
  if (c.iss !== "accounts.google.com" && c.iss !== "https://accounts.google.com") throw new Error("مُصدِر غير موثوق");
  if (String(c.email_verified) !== "true") throw new Error("بريد جوجل غير مُوثَّق");
  if (!c.email || !c.sub) throw new Error("بيانات جوجل ناقصة");

  return {
    email: String(c.email),
    name: c.name ? String(c.name) : undefined,
    picture: c.picture ? String(c.picture) : undefined,
    sub: String(c.sub),
  };
}
