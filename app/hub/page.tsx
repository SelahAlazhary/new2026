import Link from "next/link";
import { listTenants } from "@/lib/hub/registry";
import { readAudit } from "@/lib/hub/audit";
import { StatusPill } from "@/components/hub/status-pill";
import { actionLabel } from "@/lib/hub/labels";

export const dynamic = "force-dynamic";
export const metadata = { title: "نظرة عامة" };

/** أرقامٌ صمّاءُ لا تُعرض: كلُّ رقمٍ هنا يقود إلى شاشةٍ تُفعل فيها شيئاً. */
export default async function HubOverview() {
  const tenants = await listTenants();
  const events = await readAudit({ limit: 8 });

  const by = (s: string) => tenants.filter((t) => t.status === s).length;
  const cards = [
    { label: "منصّات نشطة", value: by("active"), href: "/hub/tenants?status=active", tone: "ok" as const },
    { label: "بانتظار الموافقة", value: by("pending_approval"), href: "/hub/requests", tone: "wait" as const },
    { label: "موقوفة أو منتهية", value: by("suspended") + by("expired"), href: "/hub/tenants?status=suspended", tone: "bad" as const },
    { label: "إجمالي المنصّات", value: tenants.length, href: "/hub/tenants", tone: "plain" as const },
  ];

  const tone: Record<string, string> = {
    ok: "text-emerald-600 bg-emerald-500/10",
    wait: "text-amber-600 bg-amber-500/10",
    bad: "text-rose-600 bg-rose-500/10",
    plain: "text-[#1b2a4a] bg-black/[0.04]",
  };

  return (
    <>
      <header className="mb-6">
        <h1 className="font-display text-2xl font-bold">نظرة عامة</h1>
        <p className="mt-1 text-[13px] text-muted-foreground">حالةُ المنصّات وآخرُ ما جرى عليها.</p>
      </header>

      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        {cards.map((c) => (
          <Link
            key={c.label}
            href={c.href}
            className="rounded-2xl border border-black/[0.07] bg-white p-4 transition hover:border-black/15"
          >
            <span className={`font-kufi inline-flex rounded-full px-2 py-0.5 text-[10px] font-bold ${tone[c.tone]}`}>
              {c.label}
            </span>
            <p className="font-display mt-3 text-3xl font-bold leading-none">{c.value}</p>
          </Link>
        ))}
      </div>

      <section className="mt-8">
        <div className="mb-3 flex items-end justify-between">
          <h2 className="font-display text-lg font-bold">أحدثُ المنصّات</h2>
          <Link href="/hub/tenants" className="text-[12px] text-muted-foreground underline underline-offset-4">الكل</Link>
        </div>
        {tenants.length === 0 ? (
          <p className="rounded-2xl border border-dashed border-black/15 p-8 text-center text-[13px] text-muted-foreground">
            لا توجد منصّات بعد.
          </p>
        ) : (
          <ul className="divide-y divide-black/[0.06] overflow-hidden rounded-2xl border border-black/[0.07] bg-white">
            {tenants.slice(0, 6).map((t) => (
              <li key={t.id}>
                <Link href={`/hub/tenants/${t.id}`} className="flex items-center gap-3 px-4 py-3 transition hover:bg-black/[0.02]">
                  <span className="grid size-9 shrink-0 place-items-center rounded-xl bg-[#1b2a4a] text-[13px] font-bold text-white">
                    {(t.name || t.slug).charAt(0)}
                  </span>
                  <span className="min-w-0 flex-1">
                    <b className="block truncate text-[13px]">{t.name || t.slug}</b>
                    <span className="block truncate text-[11px] text-muted-foreground" dir="ltr">{t.slug}</span>
                  </span>
                  <StatusPill status={t.status} />
                </Link>
              </li>
            ))}
          </ul>
        )}
      </section>

      <section className="mt-8">
        <div className="mb-3 flex items-end justify-between">
          <h2 className="font-display text-lg font-bold">آخرُ ما جرى</h2>
          <Link href="/hub/audit" className="text-[12px] text-muted-foreground underline underline-offset-4">السجلّ كاملاً</Link>
        </div>
        {events.length === 0 ? (
          <p className="rounded-2xl border border-dashed border-black/15 p-8 text-center text-[13px] text-muted-foreground">
            لا أحداث بعد.
          </p>
        ) : (
          <ul className="divide-y divide-black/[0.06] overflow-hidden rounded-2xl border border-black/[0.07] bg-white text-[12.5px]">
            {events.map((e) => (
              <li key={e.id} className="flex flex-wrap items-center gap-2 px-4 py-2.5">
                <b className="font-kufi text-[11px]">{e.actor.name}</b>
                <span className="text-muted-foreground">{actionLabel(e.action)}</span>
                {e.tenantId && <span className="text-muted-foreground" dir="ltr">· {e.tenantId}</span>}
                <span className="ms-auto text-[11px] text-muted-foreground" dir="ltr">
                  {new Date(e.at).toLocaleString("ar-EG", { timeZone: "Africa/Cairo", dateStyle: "short", timeStyle: "short" })}
                </span>
              </li>
            ))}
          </ul>
        )}
      </section>
    </>
  );
}
