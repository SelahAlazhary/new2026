/**
 * تصنيفُ المضيف (Host) — نقيٌّ بلا أيّ اعتمادٍ على الخادم.
 * ------------------------------------------------------------------
 * يعمل في الوسيط (Edge) وفي Node معاً، فلا يستورد شيئاً من `server-only`
 * ولا من قاعدة البيانات. مهمّته واحدة: من عنوان الطلب، أيُّ منصّةٍ تُقصد؟
 *
 *   {slug}.{ROOT_DOMAIN}   → منصّةُ مستأجر
 *   {ROOT_DOMAIN} / www.   → الجذر (الـHub)
 *   {slug}.localhost       → منصّةُ مستأجر محلّياً (المتصفّحات تحلّها بلا ضبط)
 *   localhost / 127.0.0.1  → الجذر محلّياً
 *   *.vercel.app           → الجذر (روابط المعاينة)
 *   غير ذلك                → دومينٌ مخصّص (يُحلّ من خريطة الدومينات — M6)
 *
 * ولماذا `www` جذرٌ لا مستأجرٌ اسمُه «www»؟ لأنّ الناسَ يكتبونها بالعادة،
 * ومستأجرٌ بهذا الاسم محجوزٌ أصلاً (انظر RESERVED_SLUGS).
 */

export type HostKind =
  | { kind: "root" }
  | { kind: "tenant"; slug: string }
  | { kind: "custom"; host: string }
  | { kind: "invalid" };

/** ما لا يجوز أن يكون slug لمنصّة — مسارٌ للـHub أو التباسٌ شائع. */
export const RESERVED_SLUGS = new Set([
  "www", "admin", "api", "hub", "app", "mail", "static", "cdn", "assets", "start",
  "login", "register", "student", "dev", "test", "staging", "vercel", "ftp", "smtp",
  "imap", "pop", "ns1", "ns2", "support", "help", "docs", "status", "billing", "pay",
]);

export const SLUG_RE = /^[a-z0-9](?:[a-z0-9-]{1,38}[a-z0-9])?$/;

/** يُنظّف المضيف: أحرفٌ صغيرة بلا منفذ. */
export function cleanHost(raw: string | null | undefined): string {
  const h = (raw ?? "").trim().toLowerCase();
  if (!h) return "";
  /* IPv6 بين قوسين قد يحمل منفذاً بعد القوس */
  if (h.startsWith("[")) return h.replace(/\]:\d+$/, "]");
  return h.replace(/:\d+$/, "");
}

export function classifyHost(rawHost: string | null | undefined, rootDomain?: string | null): HostKind {
  const host = cleanHost(rawHost);
  if (!host) return { kind: "root" };

  const root = cleanHost(rootDomain);

  /* التشغيلُ المحلّي — بلا أيّ ضبط */
  if (host === "localhost" || host === "127.0.0.1" || host === "[::1]" || host === "0.0.0.0") {
    return { kind: "root" };
  }
  if (host.endsWith(".localhost")) {
    const slug = host.slice(0, -".localhost".length);
    if (slug === "www") return { kind: "root" };
    return SLUG_RE.test(slug) && !slug.includes(".") ? { kind: "tenant", slug } : { kind: "invalid" };
  }

  if (root) {
    if (host === root || host === `www.${root}`) return { kind: "root" };
    if (host.endsWith(`.${root}`)) {
      const slug = host.slice(0, -(root.length + 1));
      /* مستوًى أعمق (a.b.root) ليس منصّة — يُرفض بلا تفصيل */
      if (slug.includes(".")) return { kind: "invalid" };
      if (slug === "www") return { kind: "root" };
      return SLUG_RE.test(slug) ? { kind: "tenant", slug } : { kind: "invalid" };
    }
  }

  /* معاينةُ فيرسل تخدم الجذر */
  if (host.endsWith(".vercel.app")) return { kind: "root" };

  return { kind: "custom", host };
}

/** مساراتُ الـHub — تعمل على الجذر وحده. */
export function isHubPath(pathname: string): boolean {
  return /^\/(hub|start|api\/hub)(\/|$)/.test(pathname);
}
