import type { MetadataRoute } from "next";
import { getPublicDB, loadDB } from "@/lib/db/db";
import { siteUrl } from "@/lib/utils/seo";
import { isHubRootRequest } from "@/lib/hub/guard-host";

export const dynamic = "force-dynamic";

/**
 * robots.txt
 * ------------------------------------------------------------------
 * الصفحة العامة وحدها مفتوحة للفهرسة. كل ما خلف تسجيل الدخول محجوب:
 * لوحة الإدارة وبوابة الطالب ومسارات الـAPI — لا لأنها سرّ (الخادم
 * يحميها) بل لأن فهرستها بلا معنى وتستهلك ميزانية زحف محرّك البحث.
 *
 * `/t/` محجوبٌ أيضاً: مسارُ تحويلٍ يضبط كوكي فحسب، ولا محتوى فيه.
 */
export default async function robots(): Promise<MetadataRoute.Robots> {
  if (await isHubRootRequest()) {
    return { rules: [{ userAgent: "*", allow: "/", disallow: ["/hub", "/api/", "/start"] }] };
  }
  await loadDB();
  const { content } = getPublicDB();
  const base = await siteUrl(content.url);

  return {
    rules: [
      {
        userAgent: "*",
        allow: "/",
        disallow: ["/admin", "/admin/", "/student", "/student/", "/api/", "/t/"],
      },
    ],
    ...(base ? { sitemap: `${base}/sitemap.xml`, host: base } : {}),
  };
}
