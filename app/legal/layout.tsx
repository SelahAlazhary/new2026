import type { ReactNode } from "react";
import Link from "next/link";
import { RuleOrnament } from "@/components/brand/pattern";
import { getPublicDB, loadDB } from "@/lib/db/db";

export const dynamic = "force-dynamic";

export default async function LegalLayout({ children }: { children: ReactNode }) {
  await loadDB();
  const { content } = getPublicDB();

  return (
    <main className="legal-root">
      <div className="legal-bg" />
      <article className="legal-container">
        <Link href="/" className="legal-back">
          ← العودة إلى {content.brand}
        </Link>

        <div className="mt-8 flex justify-center">
          <RuleOrnament width={200} className="text-accent" />
        </div>

        <div className="legal-card">
          <div className="legal-card-glow" />
          <div
            className="
              legal-prose
              [&_h1]:font-display [&_h1]:text-3xl [&_h1]:font-bold
              [&_h2]:font-display [&_h2]:mt-9 [&_h2]:text-xl [&_h2]:font-bold
              [&_p]:mt-3 [&_p]:text-sm [&_p]:leading-loose
              [&_li]:mt-2 [&_li]:text-sm [&_li]:leading-loose
              [&_ul]:mt-3 [&_ul]:list-disc [&_ul]:ps-5
            "
          >
            {children}
          </div>
        </div>

        <p className="legal-footer">
          {content.brand} — {content.platformSubtitle}
        </p>
      </article>
    </main>
  );
}
