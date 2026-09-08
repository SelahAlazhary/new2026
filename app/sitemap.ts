import type { MetadataRoute } from "next";
import { getPublicDB, loadDB } from "@/lib/db/db";
import { siteUrl } from "@/lib/utils/seo";
import { isHubRootRequest } from "@/lib/hub/guard-host";

export const dynamic = "force-dynamic";

/**
 * خريطة الموقع.
 * ------------------------------------------------------------------
 * الصفحات العامة وحدها: الرئيسية، والتسجيل، والقانونية.
 * محرّكات البحث تتجاهل الأجزاء (fragments) في الروابط (#plans · #faq)
 * فلا تُدرج — تُفهرس كنسخ من الصفحة الرئيسية وتُضعف ميزانية الزحف.
 *
 * صفحات الكورسات لا تُدرج — محتواها خلف الاشتراك، وإدراج روابط تعيد
 * تحويل الزائر إلى صفحة الدخول يُضعف جودة الفهرسة لا يقوّيها.
 */
export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  if (await isHubRootRequest()) return [];
  await loadDB();
  const { content } = getPublicDB();
  const base = await siteUrl(content.url);
  if (!base) return [];

  const now = new Date();

  return [
    { url: `${base}/`, lastModified: now, changeFrequency: "daily", priority: 1 },
    { url: `${base}/register`, lastModified: now, changeFrequency: "monthly", priority: 0.8 },
    { url: `${base}/legal/terms`, lastModified: now, changeFrequency: "yearly", priority: 0.3 },
    { url: `${base}/legal/privacy`, lastModified: now, changeFrequency: "yearly", priority: 0.3 },
  ];
}
