import "server-only";
import crypto from "crypto";
import { getDB } from "@/lib/db/db";

/**
 * توقيعُ روابط Bunny Stream.
 * ------------------------------------------------------------------
 * **الثغرةُ التي يسدّها:** رابطُ التشغيل اليوم ثابتٌ ومكشوف —
 * `iframe.mediadelivery.net/embed/<library>/<video>`. من نسخه من مصدر
 * الصفحة أعطاه من شاء، ويعمل من أيّ مكانٍ وإلى الأبد، بلا حسابٍ ولا
 * اشتراك. وكلُّ ما بُني في المنصّة من حراسةٍ لا يمسّ هذا الرابطَ بشيء.
 *
 * والتوقيعُ يُنهيها: الرابطُ يحمل بصمةً وتاريخَ انتهاء، وBunny يرفضه
 * بعدها. فالمنسوخُ يموت في دقائق، ولا يُولَّد رابطٌ إلّا للطالب الذي
 * يملك الكورس — والتوليدُ في الخادم، فالمفتاحُ لا يبلغ المتصفّح أبداً.
 *
 * **والصيغةُ صيغةُ Bunny لا اجتهادٌ منّا:**
 *   `SHA256(tokenKey + path + expires)` بترميز base64 آمنٍ للروابط،
 *   يُرسَل في `token` مع `expires`.
 *
 * وما دام المفتاحُ غيرَ مضبوطٍ يبقى الرابطُ كما هو — فالتشغيلُ لا يتوقّف
 * انتظاراً لإعدادٍ لم يُضبط بعد.
 */

/** أقلُّ عمرٍ وأكثرُه — الدقيقةُ لا تكفي لتحميل مشغّل، والستّ ساعاتِ تكفي أطولَ درس. */
const TTL_MIN = 60;
const TTL_MAX = 21_600;
const TTL_DEFAULT = 4 * 60 * 60;

export function bunnyConfig(): { key?: string; libraryId?: string; ttl: number } {
  const b = getDB().integrations?.bunny;
  /*
    البيئةُ تسبق القاعدة: من وضع المفتاحَ في `BUNNY_TOKEN_KEY` أراده
    خارجَ قاعدة البيانات — وهو أحرزُ، فالنسخُ الاحتياطيّةُ لا تحمله.
  */
  const key = process.env.BUNNY_TOKEN_KEY || b?.tokenKey || undefined;
  const ttl = Math.min(TTL_MAX, Math.max(TTL_MIN, b?.ttl ?? TTL_DEFAULT));
  return { key, libraryId: b?.libraryId, ttl };
}

export function bunnyConfigured(): boolean {
  return Boolean(bunnyConfig().key);
}

/**
 * بصمةُ Bunny.
 * ------------------------------------------------------------------
 * **ولـBunny صيغتان لا واحدة، وخلطُهما يحجب الفيديو:**
 *
 *   • **رمزُ الشبكة (CDN)** لملفٍّ يُطلب مباشرةً: `SHA256(key + path +
 *     expires)` بترميز base64 آمنٍ للروابط.
 *   • **رمزُ التضمين (Embed)** لمشغّلٍ في `iframe`: `SHA256(key +
 *     videoId + expires)` بترميز سُدسيّ عشريّ — لا المسارُ ولا base64.
 *
 * وكنتُ أُوقّع رابطَ التضمين بصيغة الشبكة، فيردّه Bunny بـ«This content
 * is blocked» لمن فعّل `Embed view token authentication`. والعجيبُ أنّ
 * الخطأ لا يظهر إلّا بعد تفعيل الحماية — فقبله يمرّ الرابطُ بلا فحص،
 * ويبدو كلُّ شيءٍ سليماً.
 */
function signCdn(key: string, path: string, expires: number): string {
  return crypto
    .createHash("sha256")
    .update(key + path + String(expires))
    .digest("base64")
    .replace(/\+/g, "-")
    .replace(/\//g, "_")
    .replace(/=+$/, "");
}

function signEmbed(key: string, videoId: string, expires: number): string {
  return crypto.createHash("sha256").update(key + videoId + String(expires)).digest("hex");
}

/**
 * يُوقّع رابطَ تضمينٍ لـBunny. وما ليس رابطَ Bunny يُعاد كما هو —
 * فالدالّةُ تُنادى على كلّ درسٍ ولا تعرف مزوّدَه سلفاً.
 */
export function signBunnyUrl(url: string): string {
  const { key, ttl } = bunnyConfig();
  if (!key || !url) return url;

  let u: URL;
  try {
    u = new URL(url);
  } catch {
    return url;
  }
  if (!/(^|\.)mediadelivery\.net$/.test(u.hostname)) return url;

  /* رابطٌ موقَّعٌ سلفاً لا يُوقَّع مرّتين — التوقيعُ الثاني يُبطل الأوّل. */
  if (u.searchParams.has("token")) return url;

  const expires = Math.floor(Date.now() / 1000) + ttl;

  /*
    مسارُ التضمين: `/embed/<library>/<videoId>` — ومنه يُؤخذ المعرّف.
    وما لم يطابق هذا الشكلَ لا يُوقَّع أصلاً: توقيعٌ بصيغةٍ مظنونةٍ أسوأُ
    من تركِ الرابط — فالأوّلُ يحجب، والثاني يعمل حتى تُضبط الحماية.
  */
  const m = u.pathname.match(/^\/embed\/[^/]+\/([^/?#]+)/);
  if (m) {
    u.searchParams.set("token", signEmbed(key, m[1], expires));
    u.searchParams.set("expires", String(expires));
    return u.toString();
  }

  if (/^\/[^/]+\//.test(u.pathname) && !u.pathname.startsWith("/embed/")) {
    u.searchParams.set("token", signCdn(key, u.pathname, expires));
    u.searchParams.set("expires", String(expires));
    return u.toString();
  }

  return url;
}
