import type { ReactNode } from "react";
import Link from "next/link";
import { RuleOrnament } from "@/components/brand/pattern";
import { getPublicDB, loadDB } from "@/lib/db/db";

export const dynamic = "force-dynamic";

/**
 * غلاف الصفحات القانونية (الخصوصية والشروط).
 * صفحات عامة تماماً — لا تتطلّب حساباً، ولا تعرض أي بيانات مستخدمين.
 * وجودها شرط لنشر تطبيق جوجل خارج وضع الاختبار.
 */
export default async function LegalLayout({ children }: { children: ReactNode }) {
  await loadDB();
  const { content } = getPublicDB();

  return (
    <main className="relative min-h-screen overflow-x-hidden py-20">

      <article className="container max-w-3xl">
        <Link
          href="/"
          className="font-kufi text-xs text-muted-foreground transition hover:text-primary"
        >
          ← العودة إلى {content.brand}
        </Link>

        <div className="mt-8 flex justify-center">
          <RuleOrnament width={200} className="text-accent" />
        </div>

        <div
          className="
            glass mt-8 rounded-4xl p-7 shadow-bento sm:p-10
            [&_h1]:font-display [&_h1]:text-3xl [&_h1]:font-bold
            [&_h2]:font-display [&_h2]:mt-9 [&_h2]:text-xl [&_h2]:font-bold [&_h2]:text-primary
            [&_p]:mt-3 [&_p]:text-sm [&_p]:leading-loose [&_p]:text-muted-foreground
            [&_li]:mt-2 [&_li]:text-sm [&_li]:leading-loose [&_li]:text-muted-foreground
            [&_ul]:mt-3 [&_ul]:list-disc [&_ul]:ps-5
            [&_strong]:text-foreground
          "
        >
          {children}
        </div>

        <p className="font-kufi mt-8 text-center text-[11px] text-muted-foreground">
          {content.brand} — {content.platformSubtitle}
        </p>
      </article>
    </main>
  );
}
