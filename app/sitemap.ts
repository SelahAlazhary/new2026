import type { MetadataRoute } from "next";
import { getPublicDB, loadDB } from "@/lib/db";
import { siteUrl } from "@/lib/seo";
import { isHubRootRequest } from "@/lib/hub/guard-host";

export const dynamic = "force-dynamic";

/**
 * خريطة الموقع.
 * ------------------------------------------------------------------
 * الصفحات العامة وحدها: الرئيسية وأقسامها، والدخول والتسجيل.
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
    { url: `${base}/#features`, lastModified: now, changeFrequency: "monthly", priority: 0.7 },
    { url: `${base}/#plans`, lastModified: now, changeFrequency: "weekly", priority: 0.9 },
    { url: `${base}/#faq`, lastModified: now, changeFrequency: "monthly", priority: 0.6 },
    { url: `${base}/register`, lastModified: now, changeFrequency: "monthly", priority: 0.8 },
    { url: `${base}/login`, lastModified: now, changeFrequency: "yearly", priority: 0.3 },
  ];
}
