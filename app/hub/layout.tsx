import type { ReactNode } from "react";
import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { HubShell } from "@/components/hub/hub-shell";
import { requireSuper } from "@/lib/hub/session";
import { isHubHost } from "@/lib/hub/guard-host";
import { listTenants } from "@/lib/hub/registry";
import { notFound } from "next/navigation";

export const dynamic = "force-dynamic";
export const metadata = { title: "لوحة المنصّات", robots: { index: false } };

/**
 * غلافُ المنصّة الأمّ.
 * ------------------------------------------------------------------
 * ثلاثةُ أبوابٍ قبل أن يُرسم شيء:
 *   ١) **المضيف** — الـHub على الجذر وحدَه؛ ولو وصل الطلبُ من نطاق منصّةٍ
 *      (تجاوزاً للوسيط) فهو ٤٠٤، لا صفحةَ دخولٍ تُغري بالمحاولة.
 *   ٢) **الجلسة** — تُفحص في كلّ طلب، فحسابٌ أُوقف أو جهازٌ تغيّر لا
 *      ينفعه رمزٌ موقَّعٌ لم تنتهِ مدّتُه بعد.
 *   ٣) **صفحةُ الدخول** مستثناةٌ من الثانية وحدَها — وإلّا دارت الإحالة.
 */
export default async function HubLayout({ children }: { children: ReactNode }) {
  if (!(await isHubHost())) notFound();

  const path = (await headers()).get("x-pathname") ?? "";
  if (path.startsWith("/hub/login")) return <>{children}</>;

  const me = await requireSuper();
  if (!me) redirect("/hub/login");

  /* ما ينتظر قراراً — نقطةٌ على «الطلبات» تُغني عن فتحها كلَّ مرّة */
  const waiting = (await listTenants()).filter((t) => t.status === "pending_approval").length;

  return (
    <div className="admin-skin ad-root">
      <HubShell user={{ name: me.name, email: me.email }} waiting={waiting}>
        {children}
      </HubShell>
    </div>
  );
}
