import { NextResponse, type NextRequest } from "next/server";
import { classifyHost, isHubPath, type HostKind } from "@/lib/hub/resolve";

/**
 * الطبقة الأمامية للحماية (تعمل قبل أي صفحة أو مسار):
 * • ترويسات أمان صارمة على كل استجابة.
 * • صدّ الفحص الآلي لمسارات الاختراق المعروفة (.env، wp-admin، .git…).
 * • رفض الطلبات المعدِّلة القادمة من أصل خارجي (CSRF).
 *
 * الفحوص التي تحتاج قاعدة البيانات (الحظر، السجلّ) تتم داخل المسارات نفسها.
 */

/** مسارات يفحصها الروبوتات بحثاً عن ثغرات — تُردّ ٤٠٤ فوراً. */
const PROBES = [
  "/.env", "/.git", "/wp-admin", "/wp-login", "/xmlrpc.php", "/phpmyadmin",
  "/.aws", "/config.json", "/vendor/", "/.ssh", "/backup.sql", "/admin.php",
  "/.well-known/security.txt.bak", "/server-status",
];

/*
  بوتاتُ الاختراق والسرقة — تُحجب بوسمِ أداتها.
  ------------------------------------------------------------------
  هذه أدواتُ فحصِ ثغراتٍ وكشطِ محتوى تُعلن عن نفسها في `User-Agent`،
  ولا يستعملها متصفّحٌ بشرٌ ولا محرّكُ بحثٍ نظاميّ. فحجبُها بالوسمِ زهيدٌ
  ولا يُخطئ على أحد:

  · أدواتُ الهجوم (sqlmap · nikto · nmap · nuclei…) — لا غرضَ لها إلّا
    كشفُ ثغرةٍ لاستغلالها.
  · كاشطاتُ المحتوى (HTTrack · Scrapy · wget المرآتيّ) — تنسخ الموقعَ كلَّه.

  **ولا تُحجب محرّكاتُ البحث**: Googlebot و Bingbot يبقيان يفهرسان الصفحةَ
  العامّة — وإلّا لم يجدك الطلاب. والحجبُ بالوسمِ لا يكفي وحدَه (يُزوَّر)،
  لكنّه يصدّ الآليَّ الكسولَ — وهو الأكثر — ويُسجّله. والحصنُ الأعمقُ
  للجلسات والبيانات قائمٌ خلفه: توقيعٌ وربطُ جهازٍ وحدودُ إغراق.
*/
const BAD_BOTS = /(sqlmap|nikto|nmap|masscan|zgrab|nuclei|wpscan|acunetix|nessus|openvas|dirbuster|gobuster|ffuf|hydra|havij|arachni|w3af|skipfish|jaeles|xray|metasploit|httrack|scrapy|wget|libwww-perl|python-urllib|semrushbot|ahrefsbot|mj12bot|dotbot|petalbot|blexbot)/i;

const SECURITY_HEADERS: Record<string, string> = {
  "X-Frame-Options": "SAMEORIGIN",
  "X-Content-Type-Options": "nosniff",
  "Referrer-Policy": "strict-origin-when-cross-origin",
  "X-DNS-Prefetch-Control": "off",
  "Permissions-Policy": "camera=(), microphone=(), geolocation=(), interest-cohort=()",
  "Cross-Origin-Opener-Policy": "same-origin",
  "Cross-Origin-Resource-Policy": "same-origin",
};

/**
 * سياسة المحتوى: تسمح فقط بما تحتاجه المنصّة فعلاً
 * (خطوط جوجل، صور جوجل/يوتيوب، إطارات المشغّلات، اتصال فايربيز/جوجل).
 */
const CSP = [
  "default-src 'self'",
  "base-uri 'self'",
  "object-src 'none'",
  "form-action 'self'",
  "frame-ancestors 'self'",
  "script-src 'self' 'unsafe-inline' 'unsafe-eval'",
  "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com",
  "font-src 'self' data: https://fonts.gstatic.com",
  "img-src 'self' data: blob: https://i.ytimg.com https://*.googleusercontent.com https://*.ytimg.com https://drive.google.com",
  "media-src 'self' blob: https://drive.google.com",
  "connect-src 'self' https://*.firebaseio.com https://*.googleapis.com https://oauth2.googleapis.com",
  "frame-src 'self' https://www.youtube.com https://www.youtube-nocookie.com https://drive.google.com https://player.vimeo.com https://iframe.mediadelivery.net https://meet.google.com https://calendar.google.com",
  "worker-src 'self'",
  "manifest-src 'self'",
  "upgrade-insecure-requests",
].join("; ");

/*
  ============================================================
  حاجزُ الإغراق الحجميّ (طبقةٌ أماميّة)
  ------------------------------------------------------------
  الحدودُ في المسارات تمنع إساءةً بعينها — تخمينَ كلمةِ مرورٍ أو استهلاكَ
  كودٍ — بحسابٍ أو عنوان. وهذا يمنع **الحجمَ** وحدَه: سيلاً من الطلبات على
  أيّ مسارٍ كان، حتّى العامّ منه، من مصدرٍ واحد.

  **وعتبتُه عاليةٌ عمداً.** المدرسةُ والجامعةُ تُخرجان عشراتِ الطلاب من
  عنوانٍ واحد، فحدٌّ ضيّقٌ يُقفل على البريء. فستُّ مئةِ طلبٍ في عشر ثوانٍ
  — ستّون في الثانية — لا يبلغها متصفّحٌ بشرٌ ولا فصلٌ يتصفّح، ويبلغها
  السكربتُ الذي يُغرق. فمن دونها لا يُمَسّ أحد، ومن فوقها يُصدّ عشرين
  ثانية.

  **وهو أفضلُ جهدٍ لا حصنٌ مطلق**: الوسيطُ يعمل على حافّة Edge، ولكلّ
  نسخةٍ عدّادُها — فالإغراقُ الموزَّعُ على نسخٍ كثيرةٍ يتخطّاه. والحصنُ
  الحقيقيُّ ضدّ الإغراق الموزَّع طبقةُ Vercel/CDN الأماميّة، وهي قائمةٌ
  دون هذا. وهذا يُوقف المصدرَ الواحدَ العنيف — وهو الأشيع.
  ============================================================
*/
const HITS = new Map<string, { n: number; first: number }>();
const FLOOD_MAX = 600;
const FLOOD_WINDOW = 10_000;
const FLOOD_BLOCK = 20_000;

function floodBlocked(ip: string): boolean {
  const now = Date.now();
  // كنسٌ كسولٌ يمنع نموَّ الخريطة بلا حدّ
  if (HITS.size > 5000) {
    for (const [k, v] of HITS) if (now - v.first > FLOOD_BLOCK) HITS.delete(k);
  }
  const h = HITS.get(ip);
  if (!h || now - h.first > FLOOD_WINDOW) {
    HITS.set(ip, { n: 1, first: now });
    return false;
  }
  h.n += 1;
  return h.n > FLOOD_MAX;
}

/*
  ============================================================
  حلُّ المستأجر من المضيف (تعدّدُ المنصّات)
  ------------------------------------------------------------
  الوسيطُ لا يملك قاعدةَ بيانات، فلا يعرف المنصّاتِ بأسمائها. لكنّه
  يعرف **شكلَ** العنوان: `{slug}.{ROOT_DOMAIN}` منصّةٌ، والجذرُ جذر.
  فيصنّف المضيفَ ويضع النتيجةَ في ترويستين يقرؤهما الخادم:
    x-host-kind   root | tenant | custom | invalid
    x-tenant-slug الـslug إن كان مستأجراً
  **وتُمحى الترويستان إن جاءتا من العميل** — وإلّا انتحل أحدُهم منصّةً
  بترويسةٍ يكتبها. فالمصدرُ الوحيدُ لهما هذا الوسيط.

  محلّياً: `?tenant=slug` يُثبّت كوكي `dev_tenant` فتُخدم تلك المنصّةُ على
  localhost بلا نطاقٍ فرعيّ — للتطوير وحدَه، ولا يعمل على فيرسل.
  ============================================================
*/
const TENANT_HEADERS = ["x-host-kind", "x-tenant-slug", "x-tenant-id"];
const DEV = !process.env.VERCEL;

function resolveHost(req: NextRequest): HostKind {
  const host = req.headers.get("x-forwarded-host") ?? req.headers.get("host");
  let kind = classifyHost(host, process.env.ROOT_DOMAIN);
  if (DEV && kind.kind === "root") {
    const dev = req.cookies.get("dev_tenant")?.value?.trim().toLowerCase();
    if (dev) kind = { kind: "tenant", slug: dev };
  }
  return kind;
}

function stampTenant(h: Headers, kind: HostKind) {
  for (const k of TENANT_HEADERS) h.delete(k);
  h.set("x-host-kind", kind.kind);
  h.set("x-tenant-slug", kind.kind === "tenant" ? kind.slug : "");
}

export function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl;

  // فحص آلي معروف → يُسجَّل ثم يُردّ ٤٠٤ بلا أي تفاصيل
  const lower = pathname.toLowerCase();
  if (PROBES.some((p) => lower.startsWith(p) || lower.includes(p))) {
    return report(req, "probe", pathname);
  }

  /* بوتُ اختراقٍ أو كشطٍ يُعلن عن أداته → يُسجَّل ويُردّ بلا تفصيل. */
  const ua = req.headers.get("user-agent") ?? "";
  if (BAD_BOTS.test(ua)) {
    return report(req, "bot", pathname);
  }

  /* ــــ المستأجر ــــ */
  const hostKind = resolveHost(req);

  /* مضيفٌ لا يصلح منصّةً (مستوًى أعمق من الفرعي) → ٤٠٤ صامت */
  if (hostKind.kind === "invalid") {
    return new NextResponse("Not Found", { status: 404, headers: { "Cache-Control": "no-store" } });
  }

  /* مساراتُ الـHub على الجذر وحده — على نطاق منصّةٍ لا وجودَ لها */
  if (hostKind.kind !== "root" && isHubPath(pathname)) {
    return new NextResponse("Not Found", { status: 404, headers: { "Cache-Control": "no-store" } });
  }

  /* تبديلُ منصّة التطوير: ?tenant=slug يُثبّت الكوكي، و?tenant= (فارغ) يمحوها */
  if (DEV && req.nextUrl.searchParams.has("tenant")) {
    const url = req.nextUrl.clone();
    const want = (url.searchParams.get("tenant") ?? "").trim().toLowerCase();
    url.searchParams.delete("tenant");
    const res = NextResponse.redirect(url);
    if (want) res.cookies.set("dev_tenant", want, { path: "/", httpOnly: true, sameSite: "lax" });
    else res.cookies.delete("dev_tenant");
    return res;
  }

  /* حاجزُ الإغراق — يُصدّ المصدرُ الواحدُ العنيف قبل أن يبلغ المسار. */
  const ip =
    req.headers.get("x-forwarded-for")?.split(",")[0].trim() ||
    req.headers.get("x-real-ip") ||
    "unknown";
  if (floodBlocked(ip)) {
    return new NextResponse("Too Many Requests", {
      status: 429,
      headers: { "Retry-After": String(FLOOD_BLOCK / 1000), "Cache-Control": "no-store" },
    });
  }

  // الطلبات المعدِّلة يجب أن تأتي من نفس الموقع
  if (["POST", "PUT", "PATCH", "DELETE"].includes(req.method)) {
    const origin = req.headers.get("origin");
    if (origin) {
      try {
        if (new URL(origin).host !== req.headers.get("host")) {
          return report(req, "csrf", pathname);
        }
      } catch {
        return report(req, "csrf", pathname);
      }
    }
  }

  // تمرير المسار للطبقة الخادمية (تستخدمه لوحة الإدارة لفحص الصلاحيات)
  const forwarded = new Headers(req.headers);
  forwarded.set("x-pathname", pathname);
  stampTenant(forwarded, hostKind);
  const res = NextResponse.next({ request: { headers: forwarded } });
  for (const [k, v] of Object.entries(SECURITY_HEADERS)) res.headers.set(k, v);
  res.headers.set("Content-Security-Policy", CSP);

  /*
    منعُ فهرسة المناطق الخاصّة نهائيّاً.
    ------------------------------------------------------------------
    `robots.txt` يقول للزاحف «لا تزحف»، لكنّ رابطاً مُنِع في `robots.txt`
    قد يظهر في نتائج البحث **عنواناً بلا وصف** إن وُجد له رابطٌ من مكان.
    والمنعُ القاطعُ من الظهور هو `noindex` — وأقواه ترويسةُ
    `X-Robots-Tag`: يقرؤها Google على كلّ استجابةٍ ولو لم يقرأ HTML.

    فتُوضع على اللوحة وبوّابة الطالب والدخول والـAPI: لا فهرسةَ، ولا
    اتّباعَ روابط، ولا أرشفة. والصفحةُ العامّةُ وحدَها تبقى مفهرسةً —
    وإلّا لم يجدك الطلاب.
  */
  if (/^\/(admin|student|login|api)(\/|$)/.test(pathname)) {
    res.headers.set("X-Robots-Tag", "noindex, nofollow, noarchive, nosnippet");
  }
  return res;
}

/** تحويل الطلب المصدود إلى مسار التسجيل (Node) ليُدوَّن في سجلّ الأمان. */
function report(req: NextRequest, kind: "csrf" | "probe" | "bot", path: string) {
  const url = req.nextUrl.clone();
  url.pathname = "/api/security/report";
  url.search = "";
  const headers = new Headers(req.headers);
  headers.set("x-blocked-kind", kind);
  headers.set("x-blocked-path", path);
  /* يُدوَّن في سجلّ المنصّة التي وقع عليها الفحص */
  stampTenant(headers, resolveHost(req));
  return NextResponse.rewrite(url, { request: { headers } });
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico).*)"],
};
