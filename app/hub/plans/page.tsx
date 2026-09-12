import { listPlans } from "@/lib/hub/plans";
import { PlansEditor } from "@/components/hub/plans-editor";

export const dynamic = "force-dynamic";
export const metadata = { title: "خطط الاشتراك" };

export default async function HubPlansPage() {
  const plans = await listPlans();
  return (
    <>
      <header className="mb-5" data-reveal="down" data-reveal-duration="fast">
        <h1 className="font-display text-2xl font-bold">خطط الاشتراك</h1>
        <p className="mt-1 text-[13px] text-muted-foreground">أنشئ وعدّل الخطط التي يختارها المدرّسون عند إنشاء منصّاتهم.</p>
      </header>
      <PlansEditor initial={plans} />
    </>
  );
}
