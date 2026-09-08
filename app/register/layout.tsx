import type { ReactNode } from "react";
import type { Metadata } from "next";
import { getPublicDB, loadDB } from "@/lib/db/db";
import { siteUrl } from "@/lib/utils/seo";

export const dynamic = "force-dynamic";

/**
 * صفحة التسجيل صفحة هبوط حقيقية — كثير من الزيارات تصلها من البحث
 * مباشرة («التسجيل في منصة …»)، فتستحقّ عنواناً ووصفاً خاصّين بها
 * وعنواناً قانونياً مستقلّاً بدل أن ترث ميتاداتا الجذر.
 */
export async function generateMetadata(): Promise<Metadata> {
  await loadDB();
  const { content: c } = getPublicDB();
  const site = await siteUrl(c.url);
  const title = `إنشاء حساب طالب — ${c.teacher.subject}`;
  const description = `سجّل حسابك في ${c.brand} وابدأ ${c.teacher.subject} مع ${c.teacher.name}: دروس مسجّلة، تدريبات واختبارات، ومتابعة مستمرة.`;

  return {
    title,
    description,
    alternates: site ? { canonical: `${site}/register` } : undefined,
    openGraph: {
      type: "website",
      locale: "ar_EG",
      siteName: c.brand,
      title,
      description,
      url: site ? `${site}/register` : undefined,
    },
    robots: { index: true, follow: true },
  };
}

export default function RegisterLayout({ children }: { children: ReactNode }) {
  return children;
}
