import Link from "next/link";
import { listTenants } from "@/lib/hub/registry";
import { StatusPill } from "@/components/hub/status-pill";
import { RequestActions } from "@/components/hub/request-actions";

export const dynamic = "force-dynamic";
export const metadata = { title: "الطلبات" };

/**
 * صندوقُ الوارد — ما ينتظر قراراً.
 * اليومَ فيه المنصّاتُ التي تنتظر موافقةً أو تجهيزاً؛ وتنضمّ إليه في
 * مراحلَ تالية الفواتيرُ اليدويّة والدوميناتُ التي تنتظر تحقّقاً.
 */
export default async function RequestsPage() {
  const all = await listTenants();
  const waiting = all.filter((t) => t.status === "pending_approval");
  const building = all.filter((t) => t.status === "onboarding");

  return (
    <>
      <header className="mb-5">
        <h1 className="font-display text-2xl font-bold">الطلبات</h1>
        <p className="mt-1 text-[13px] text-muted-foreground">ما ينتظر قراراً منك.</p>
      </header>

      <Group
        title="منصّات بانتظار الموافقة"
        empty="لا توجد منصّة تنتظر موافقة."
        items={waiting}
        cta="راجع"
        actions
      />
      <Group
        title="منصّات قيد الإنشاء"
        empty="لا توجد منصّة قيد الإنشاء."
        items={building}
        cta="اطّلع"
        hint="لم يُكمل أصحابُها خطوات التسجيل بعد — لا شيء يُخدم على عناوينها."
      />
    </>
  );
}

function Group({
  title, items, empty, cta, hint, actions = false,
}: {
  title: string;
  items: Awaited<ReturnType<typeof listTenants>>;
  empty: string;
  cta: string;
  hint?: string;
  actions?: boolean;
}) {
  return (
    <section className="mb-7">
      <h2 className="font-display mb-1 text-lg font-bold">{title}</h2>
      {hint && <p className="mb-2 text-[11.5px] text-muted-foreground">{hint}</p>}
      {items.length === 0 ? (
        <p className="rounded-2xl border border-dashed border-black/15 p-8 text-center text-[13px] text-muted-foreground">{empty}</p>
      ) : (
        <ul className="divide-y divide-black/[0.06] overflow-hidden rounded-2xl border border-black/[0.07] bg-white">
          {items.map((t) => (
            <li key={t.id} className="flex flex-wrap items-center gap-3 px-4 py-3">
              <span className="grid size-9 shrink-0 place-items-center rounded-xl bg-[#1b2a4a] text-[13px] font-bold text-white">
                {(t.name || t.slug).charAt(0)}
              </span>
              <span className="min-w-0 flex-1">
                <b className="block truncate text-[13px]">{t.name || t.slug}</b>
                <span className="block truncate text-[11px] text-muted-foreground" dir="ltr">{t.adminEmail || t.slug}</span>
              </span>
              <StatusPill status={t.status} />
              <Link
                href={`/hub/tenants/${t.id}`}
                className="rounded-full border border-black/12 px-3 py-1.5 text-[11.5px] font-bold"
              >
                {cta}
              </Link>
              {actions && <RequestActions tenantId={t.id} />}
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}
