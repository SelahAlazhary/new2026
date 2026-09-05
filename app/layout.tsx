import type { ReactNode } from "react";
import type { Metadata, Viewport } from "next";
import { IBM_Plex_Sans_Arabic, Aref_Ruqaa } from "next/font/google";
import localFont from "next/font/local";
import { ContentProvider } from "@/components/content/content-provider";
import { glowCss } from "@/lib/glow";
import { brandCss } from "@/lib/brand-theme";
import { artFilter } from "@/lib/art-tint";
import { safeJsonForScript } from "@/lib/safe-json";
import { depthFilter, depthLit } from "@/lib/art-depth";
import { AzhariBackdrop } from "@/components/brand/azhari-backdrop";
import { ToTop } from "@/components/brand/to-top";
import { CookieConsent } from "@/components/brand/cookie-consent";
import { findIconFrame, iconFrameClass, iconFrameVars } from "@/lib/icon-frames";
import { findIconMotion, iconMotionClass } from "@/lib/icon-motion";
import { findIconCover, iconCoverClass } from "@/lib/icon-covers";
import { findVectorLib, vectorLibClass } from "@/lib/vector-libs";
import { RouteTransition } from "@/components/ui/route-transition";
import { RegisterSW } from "@/components/pwa/register-sw";
import { headers } from "next/headers";
import { getPublicDB, getScopedDB, loadDB } from "@/lib/db";
import { TenantNotFound, currentTenant } from "@/lib/hub/context";
import { isHubPath } from "@/lib/hub/resolve";
import { pageGate } from "@/lib/hub/gate";
import { touchSession } from "@/lib/session";
import { defaultContent } from "@/lib/defaults";
import { buildJsonLd, buildKeywords, siteUrl } from "@/lib/seo";
import "./globals.css";

export const dynamic = "force-dynamic";

/**
 * الخطوط.
 * • Lalezar             : خطّ العناوين والهوية — عربي عريض ذو شخصية قوية
 *                          (ملف محلّي داخل المستودع، لا يعتمد على شبكة خارجية).
 * • IBM Plex Sans Arabic : متن الواجهة — وضوح عالٍ على الشاشات وأوزان كاملة.
 * Lalezar وزن واحد (٤٠٠) وهو خطّ عرض لا متن، لذلك يُستعمل في العناوين
 * والشارات والزخرفة، ويبقى المتن على Plex حفاظاً على قابلية القراءة.
 */
const lalezar = localFont({
  src: "./fonts/Lalezar-Regular.ttf",
  weight: "400",
  style: "normal",
  variable: "--font-display",
  display: "swap",
});
/*
  خطُّ الرقعة — للتوقيع وحدَه لا للمتن.
  وهو خطُّ المكاتبة والتوقيع في العربية تاريخياً، فالاسمُ به يبدو أثرَ
  يدٍ لا حرفاً مطبوعاً. ويُستضاف مع البناء فلا ينتظره الزائر.
*/
const ruqaa = Aref_Ruqaa({
  subsets: ["arabic", "latin"],
  weight: ["400", "700"],
  variable: "--font-sig",
  display: "swap",
});
const plex = IBM_Plex_Sans_Arabic({
  subsets: ["arabic", "latin"],
  weight: ["300", "400", "500", "600", "700"],
  variable: "--font-sans",
  display: "swap",
});

/** إعدادات العرض — viewport-fit=cover ضروري لاحترام حوّاف الشاشة في التطبيق المثبّت. */
export async function generateViewport(): Promise<Viewport> {
  if (await onHub()) return { width: "device-width", initialScale: 1, viewportFit: "cover", themeColor: "#1b2a4a" };
  /* يربط الطلبَ بمنصّته أوّلاً — وبلا منصّةٍ يُعاد الافتراضيُّ بلا كسر */
  try {
    await loadDB();
  } catch (e) {
    if (e instanceof TenantNotFound) return { width: "device-width", initialScale: 1, viewportFit: "cover", themeColor: "#233b8b" };
    throw e;
  }
  const { content } = getPublicDB();
  const preset: Record<string, string> = {
    midad: "#233b8b", nile: "#095e86", andalus: "#245c4b", rumman: "#87263a",
    violet: "#233b8b", emerald: "#245c4b", ocean: "#095e86", crimson: "#87263a",
  };
  const primary =
    (content.theme.preset === "custom" && content.theme.customPrimary) ||
    preset[content.theme.preset] ||
    preset.midad;
  return {
    width: "device-width",
    initialScale: 1,
    viewportFit: "cover",
    themeColor: primary,
  };
}

/** يحوّل عنوان الموقع إلى URL صالح، ويسقط لعنوان محلي إن كان فارغاً أو تالفاً. */
function safeUrl(raw?: string): URL {
  try {
    if (raw) return new URL(raw);
  } catch {
    /* عنوان غير صالح — نتجاهله */
  }
  return new URL("http://localhost:3000");
}

/** ميتاداتا ديناميكية من قاعدة البيانات (العنوان/الوصف/الأيقونة/OG). */
/** هل هذا الطلبُ لصفحةٍ من صفحات المنصّة الأمّ؟ (المسارُ من الوسيط) */
async function onHub(): Promise<boolean> {
  try {
    return isHubPath((await headers()).get("x-pathname") ?? "");
  } catch {
    return false;
  }
}

export async function generateMetadata(): Promise<Metadata> {
  /* الـHub لا يرث هويّةَ منصّةٍ ولا يُفهرس */
  if (await onHub()) {
    return { title: { default: "لوحة المنصّات", template: "%s | لوحة المنصّات" }, robots: { index: false, follow: false } };
  }
  try {
    await loadDB();
  } catch (e) {
    if (e instanceof TenantNotFound) return { title: "لا توجد منصّة على هذا العنوان", robots: { index: false, follow: false } };
    throw e;
  }
  const pub = getPublicDB();
  const c = pub.content;
  const site = await siteUrl(c.url);
  // أيقونة الموقع (favicon) = شعار الأستاذة أو صورتها
  const icon = c.teacher?.logo || c.teacher?.avatar || "/teacher.svg";
  return {
    // عنوان الموقع قد يكون فارغاً قبل ضبطه من اللوحة — لا نكسر البناء بسببه
    metadataBase: safeUrl(site || c.url),
    title: { default: `${c.brand} | ${c.platformSubtitle}`, template: `%s | ${c.brand}` },
    description: c.teacher.bio,
    openGraph: {
      type: "website", locale: "ar_EG", url: site || undefined, siteName: c.brand,
      title: `${c.teacher.subject} مع ${c.teacher.name}`,
      description: c.teacher.tagline,
      images: [{ url: icon, width: 1200, height: 630, alt: c.brand }],
    },
    twitter: {
      card: "summary_large_image",
      title: `${c.teacher.subject} مع ${c.teacher.name}`,
      description: c.teacher.tagline,
      images: [icon],
    },
    keywords: buildKeywords(c, pub.subjects ?? []),
    authors: [{ name: c.teacher.name }],
    creator: c.teacher.name,
    publisher: c.brand,
    category: "education",
    // العنوان القانوني يمنع تشتّت الترتيب بين نسخ الرابط (بـwww وبدونه…)
    alternates: site ? { canonical: site } : undefined,
    robots: {
      index: true,
      follow: true,
      googleBot: {
        index: true,
        follow: true,
        "max-image-preview": "large",
        "max-snippet": -1,
        "max-video-preview": -1,
      },
    },
    manifest: "/manifest.webmanifest",
    applicationName: c.brand,
    appleWebApp: {
      capable: true,
      title: c.brand,
      statusBarStyle: "black-translucent",
    },
    icons: {
      icon,
      apple: [{ url: "/api/pwa-icon?size=180", sizes: "180x180", type: "image/png" }],
    },
    formatDetection: { telephone: false },
  };
}

/**
 * مضيفٌ لا منصّةَ عليه — صفحةٌ صغيرة بلا أيّ بيانات.
 * ------------------------------------------------------------------
 * الجذرُ هو من يرسم `<html>`، فلا يُرمى `notFound()` هنا (لا حدودَ فوقه
 * تلتقطه). ولا تُذكر منصّةٌ أخرى ولا الـHub: الزائرُ على عنوانٍ خاطئ لا
 * يُعطى خريطةً لما سواه.
 */
function NoTenant() {
  return (
    <html lang="ar" dir="rtl">
      <body style={{ margin: 0, minHeight: "100vh", display: "grid", placeItems: "center", background: "#fbf9f5", color: "#1c2340", fontFamily: "system-ui, sans-serif" }}>
        <main style={{ textAlign: "center", padding: "2rem" }}>
          <p style={{ fontSize: "3rem", margin: 0 }}>٤٠٤</p>
          <h1 style={{ fontSize: "1.25rem", margin: "0.5rem 0" }}>لا توجد منصّة على هذا العنوان</h1>
          <p style={{ opacity: 0.7, fontSize: "0.9rem" }}>تأكّد من الرابط الذي وصلك من معلّمك.</p>
        </main>
      </body>
    </html>
  );
}

/**
 * صفحةُ التوقّف — تُعرض للطالب والزائر حين تُوقَف المنصّة أو ينتهي اشتراكُها.
 * ولا تُذكر فيها تفاصيلُ الحساب ولا اسمُ المنصّة الأمّ: الطالبُ ليس طرفاً
 * في اشتراكِ معلّمه، ولا يُحمَّل خبراً ماليّاً لا يخصّه.
 */
function PausedPage({ brand, message }: { brand?: string; message: string }) {
  return (
    <html lang="ar" dir="rtl">
      <body style={{ margin: 0, minHeight: "100vh", display: "grid", placeItems: "center", background: "#fbf9f5", color: "#1c2340", fontFamily: "system-ui, sans-serif" }}>
        <main style={{ textAlign: "center", padding: "2rem", maxWidth: "34rem" }}>
          <span style={{ fontSize: "2.6rem" }} aria-hidden="true">⏸</span>
          <h1 style={{ fontSize: "1.35rem", margin: "0.75rem 0 0.35rem" }}>{brand ? `${brand} — متوقّفة مؤقّتاً` : "المنصّة متوقّفة مؤقّتاً"}</h1>
          <p style={{ opacity: 0.75, fontSize: "0.95rem", lineHeight: 1.9 }}>{message}</p>
          <p style={{ opacity: 0.55, fontSize: "0.8rem", marginTop: "1.5rem" }}>حسابك ودروسك محفوظة، وتعود كما هي فور عودة المنصّة.</p>
        </main>
      </body>
    </html>
  );
}

/**
 * جذرُ المنصّة الأمّ — بلا مزوّد محتوًى ولا خلفيّةِ هوية.
 * ------------------------------------------------------------------
 * صفحاتُ الـHub لا تنتمي لمنصّةٍ بعينها، فلا `ContentProvider` لها ولا
 * ثيمَ مستأجرٍ ولا زخرفة. والخطوطُ تبقى — فالهويّةُ البصريّةُ واحدة.
 */
function HubRoot({ children, fontClass }: { children: ReactNode; fontClass: string }) {
  return (
    <html lang="ar" dir="rtl" data-layout="light" suppressHydrationWarning>
      <body className={`${fontClass} font-sans`}>{children}</body>
    </html>
  );
}

export default async function RootLayout({ children }: { children: ReactNode }) {
  const fontClass = `${plex.variable} ${lalezar.variable} ${ruqaa.variable}`;
  if (await onHub()) return <HubRoot fontClass={fontClass}>{children}</HubRoot>;

  try {
    await loadDB(); // مصدر الحقيقة (فايربيز إن ضُبط) — ويربط الطلبَ بمنصّته
  } catch (e) {
    if (e instanceof TenantNotFound) return <NoTenant />;
    throw e;
  }
  const session = await touchSession(); // يمدّد الجلسة الدائمة

  /*
    حالةُ المنصّة تُفرض قبل أن يُرسم شيء (انظر `lib/hub/gate.ts`):
    المؤرشفةُ وغيرُ المجهّزة لا تُخدم، والموقوفةُ يراها الطالبُ صفحةَ
    توقّف — ويدخلها **صاحبُها** ليرى بياناتِه ويجدّد، فالكتابةُ وحدَها
    هي المحجوبة (٤٠٢ في `tenantRoute`).
  */
  const gate = pageGate(currentTenant().tenant);
  if (!gate.ok) {
    if (gate.kind !== "paused") return <NoTenant />;
    if (session?.role !== "admin") {
      return <PausedPage brand={getPublicDB().content?.brand} message={gate.message} />;
    }
  }
  // الحمولة الأولى (SSR) مقيّدة بدور صاحب الجلسة — لا تسرّب بيانات لغير أصحابها
  const db = getScopedDB(session);
  const theme = db.content?.theme ?? defaultContent.theme;
  /* البيانات المهيكلة تُبنى من الحمولة العامة لا من حمولة صاحب الجلسة:
     حمولة الطالب مُصفّاة بصفّه، ولو بُنيت منها لاختلف الوصف المهيكل من
     زائر لآخر — وجوجل يريد وصفاً ثابتاً يطابق ما تعرضه الصفحة للعموم. */
  const pub = getPublicDB();
  /* الوهج من الحمولة العامّة — تنسيقُ الصفحة واحدٌ لكل من يراها. */
  const glow = glowCss(pub.content?.glow);
  /*
    هويةُ الألوان تُحقن على الخادم لا في المتصفّح: لو كُتبت بعد الترطيب
    ومض الثيمُ الافتراضيُّ لحظةً ثمّ انقلب — وهو أظهرُ ما يكون على أوّل
    زيارة، وهي التي تُبنى عليها الانطباعات.
  */
  /*
    تلوينُ الصور المتحرّكة — يُحقن متغيّراً واحداً تقرؤه كلُّ صورة.
    والحقنُ على الخادم لا في المتصفّح: لو كُتب بعد الترطيب ظهرت الصورةُ
    بألوانها الأصلية لحظةً ثمّ انقلبت، وهو أظهرُ ما يكون في صورةٍ متحرّكة.
  */
  const tint = artFilter(db.content?.artTint, {
    primary: theme.customPrimary ?? undefined,
    gold: theme.customGold ?? undefined,
  });
  /*
    والعمقُ يُوصل بالتلوين في سلسلةٍ واحدة لا في متغيّرٍ ثانٍ.
    خاصيّةُ `filter` لا تقبل متغيّرَين أحدُهما فارغ: `filter: var(--a) var(--b)`
    تسقط كلُّها إن خلا أحدُهما. والوصلُ هنا يجعلها قيمةً واحدةً صحيحةً
    دائماً، أو لا شيءَ فلا تُكتب أصلاً.

    والترتيبُ مقصود: اللونُ أوّلاً على البكسل، ثمّ البَثقُ على الناتج —
    وعكسُه يُلوّن الجانبَ المبثوقَ مع الجسم فيختفي الجانب.
  */
  const depth = depthFilter(db.content?.artDepth);
  const artFx = [tint, depth].filter(Boolean).join(" ");

  const brand = theme.preset === "custom"
    ? brandCss({
        primary: theme.customPrimary ?? undefined,
        gold: theme.customGold ?? undefined,
        paper: theme.customPaper ?? undefined,
      })
    : "";
  const base = await siteUrl(pub.content?.url);
  const jsonLd = buildJsonLd(pub.content ?? defaultContent, {
    base,
    subjects: pub.subjects ?? [],
    plans: pub.plans ?? [],
  });

  return (
    <html
      lang="ar"
      dir="rtl"
      data-layout={theme.layout}
      data-preset={theme.preset}
      suppressHydrationWarning
    >
      <head>
        {/*
          بياناتُ الفهرسة تُفلَّت قبل الحقن.
          `JSON.stringify` لا يُفلّت `<` — فحقلٌ فيه `</script>` يُغلق
          الوسمَ باكراً وما بعده يُقرأ كوداً. وحقولُ هذه البيانات تُكتب من
          اللوحة (اسمُ الأستاذ وأسماءُ الكورسات والخطط)، ومشرفٌ بصلاحيةِ
          قسمٍ واحدٍ يبلغ بها كلَّ صفحةٍ في الموقع العامّ.
          انظر `lib/safe-json.ts`.
        */}
        {jsonLd.map((block, i) => (
          <script key={i} type="application/ld+json" dangerouslySetInnerHTML={{ __html: safeJsonForScript(block) }} />
        ))}
        {/*
          الوهج — يُترجَم من القواعد مرّةً على الخادم ويُحقن في الجذر،
          فيعمل في الواجهة وبوابة الطالب واللوحة معاً بلا تكرار. ولا
          يُكتب شيءٌ إن لم تكن قاعدةٌ مفعّلة.
        */}
        {brand && <style dangerouslySetInnerHTML={{ __html: brand }} />}
        {artFx && <style dangerouslySetInnerHTML={{ __html: `:root{--art-filter:${artFx}}` }} />}
        {/* شدّةُ الإضاءة — أقوى في المجسَّمة منها في البارزة */}
        {depthLit(db.content?.artDepth) && (
          <style dangerouslySetInnerHTML={{ __html: `:root{--art-lit:${db.content?.artDepth === "deep" ? "0.55" : "0.34"}}` }} />
        )}
        {glow && <style dangerouslySetInnerHTML={{ __html: glow }} />}
      </head>
      <body
        /*
          أصنافُ الأيقونات على `<body>` لا على صفحةٍ بعينها: كانت على
          جذر الواجهة وجذر اللوحة كلٌّ على حدة، فما اختير في اللوحة لم
          يسرِ على صفحات الدخول والتسجيل والقانونية. وهنا تسري على
          المنصّة كلِّها بلا استثناء.
        */
        style={iconFrameVars(pub.content?.iconFrameColors)}
        className={`${fontClass} font-sans ${iconFrameClass(findIconFrame(pub.content?.iconFrame))} ${iconCoverClass(findIconCover(pub.content?.iconCover))} ${iconMotionClass(findIconMotion(pub.content?.iconMotion))} ${vectorLibClass(findVectorLib(pub.content?.vectorLib))}`}
      >
        {/*
          الخلفيةُ خارج كلّ ما يتحرّك.
          `position: fixed` تتصرّف تصرّفَ `absolute` إن كان في أسلافها
          عنصرٌ عليه `transform` — وانتقالُ الصفحات يضع واحداً. فكانت
          الخلفيةُ تنزلق مع المحتوى بدل أن تثبت. فمكانُها هنا: تحت
          `<body>` مباشرةً، لا سلفَ متحرّكٌ فوقها.
        */}
        {pub.content?.azhariBackdrop !== false && <AzhariBackdrop />}
        <ContentProvider initialDB={db} initialSession={session}>
          <RouteTransition>{children}</RouteTransition>
          {/*
            زرُّ العودة خارج انتقال الصفحات.
            `position: fixed` تتصرّف تصرّفَ `absolute` إن كان في أسلافها
            عنصرٌ عليه `transform` — وانتقالُ الصفحات يضع واحداً. فكان
            الزرُّ يستقرّ في قاع المستند لا في زاوية الشاشة، فلا يراه أحد.
          */}
          <ToTop />
          {/*
            لافتةُ الكوكيز — تحت `<body>` لا داخلَ انتقال الصفحات، للسبب
            نفسِه الذي أخرج زرَّ العودة: `fixed` تتصرّف تصرّفَ `absolute`
            تحت سلفٍ عليه `transform`، فتستقرّ اللافتةُ في قاع المستند.
          */}
          <CookieConsent />
          <RegisterSW />
        </ContentProvider>
      </body>
    </html>
  );
}
