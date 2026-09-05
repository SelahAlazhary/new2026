import { notFound } from "next/navigation";
import { isHubHost } from "@/lib/hub/guard-host";
import { oidcConfigured } from "@/lib/hub/google-oidc";
import { OnboardingWizard } from "@/components/hub/onboarding-wizard";
import { BRAND_PRESETS } from "@/lib/hub/presets";

export const dynamic = "force-dynamic";
export const metadata = { title: "أنشئ منصّتك", robots: { index: false } };

export default async function StartPage() {
  if (!(await isHubHost())) notFound();
  /* بابُ الدخول التطويريّ يظهر فقط بلا ضبط جوجل وخارج الاستضافة */
  const devSignin = !oidcConfigured() && !process.env.VERCEL;
  return <OnboardingWizard devSignin={devSignin} presets={BRAND_PRESETS} />;
}
