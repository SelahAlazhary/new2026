import Link from "next/link";
import { notFound } from "next/navigation";
import { tenantById } from "@/lib/hub/registry";
import { readAudit } from "@/lib/hub/audit";
import { SECTIONS, FEATURES, featureOn } from "@/lib/hub/sections";
import { getHubSettings } from "@/lib/hub/settings";
import { listDomains } from "@/lib/hub/domains";
import { TenantControls } from "@/components/hub/tenant-controls";
import { DomainManager } from "@/components/hub/domain-manager";
import { ImpersonateBtn } from "@/components/hub/impersonate-btn";
import { StatusPill } from "@/components/hub/status-pill";
import { actionLabel } from "@/lib/hub/labels";

export const dynamic = "force-dynamic";

export default async function TenantPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const tenant = await tenantById(id);
  if (!tenant) notFound();

  const [events, settings, domains] = await Promise.all([
    readAudit({ tenantId: id, limit: 40 }),
    getHubSettings(),
    listDomains(id),
  ]);

  const root = settings.rootDomain;
  const base = tenant.customDomain
    ? `https://${tenant.customDomain}`
    : root
      ? `https://${tenant.slug}.${root}`
      : `http://${tenant.slug}.localhost:3000`;

  const rows: [string, string][] = [
    ["معرّف المنصّة", tenant.id],
    ["الرابط المختصر", tenant.slug],
    ["بريد لوحة الإدارة", tenant.adminEmail || "—"],
    ["الدومين المخصّص", tenant.customDomain || "لم يُربط"],
    ["أُنشئت", tenant.createdAt ? new Date(tenant.createdAt).toLocaleString("ar-EG", { timeZone: "Africa/Cairo" }) : "—"],
    ["فُعّلت", tenant.activatedAt ? new Date(tenant.activatedAt).toLocaleString("ar-EG", { timeZone: "Africa/Cairo" }) : "—"],
  ];

  return (
    <>
      <nav className="mb-3 text-[12px] text-muted-foreground">
        <Link href="/hub/tenants" className="underline underline-offset-4">المنصّات</Link>
        <span> ← {tenant.name || tenant.slug}</span>
      </nav>

      <header className="mb-6 flex flex-wrap items-center gap-3" data-reveal="down" data-reveal-duration="fast">
        <span className="grid size-12 shrink-0 place-items-center rounded-2xl bg-[#1b2a4a] text-lg font-bold text-white">
          {(tenant.name || tenant.slug).charAt(0)}
        </span>
        <div className="min-w-0 flex-1">
          <h1 className="font-display truncate text-2xl font-bold">{tenant.name || tenant.slug}</h1>
          <p className="truncate text-[12px] text-muted-foreground" dir="ltr">{base}</p>
        </div>
        <StatusPill status={tenant.status} />
        {tenant.status === "active" && <ImpersonateBtn tenantId={tenant.id} />}
      </header>

      <div className="grid gap-5 lg:grid-cols-[1fr_20rem]">
        <div className="order-2 lg:order-1">
          <TenantControls tenant={tenant} sections={SECTIONS} features={FEATURES} />

          <div className="mt-5">
            <DomainManager tenantId={tenant.id} domains={domains} canAdd={featureOn(tenant, "customDomain")} />
          </div>

          <section className="mt-5 rounded-2xl border border-black/[0.07] bg-white p-4" data-reveal="stretch">
            <h3 className="font-display text-[15px] font-bold">سجلّ هذه المنصّة</h3>
            <p className="mb-3 mt-1 text-[11.5px] text-muted-foreground">كلُّ ما جرى عليها من لوحة المنصّات — لا يُحذف.</p>
            {events.length === 0 ? (
              <p className="py-6 text-center text-[12px] text-muted-foreground">لا أحداث بعد.</p>
            ) : (
              <ul className="divide-y divide-black/[0.06] text-[12.5px]">
                {events.map((e) => (
                  <li key={e.id} className="flex flex-wrap items-center gap-2 py-2">
                    <b className="font-kufi text-[11px]">{e.actor.name}</b>
                    <span className="text-muted-foreground">{actionLabel(e.action)}</span>
                    {e.details?.to ? <span className="font-kufi text-[11px] text-muted-foreground">← {String(e.details.to)}</span> : null}
                    <span className="ms-auto text-[11px] text-muted-foreground" dir="ltr">
                      {new Date(e.at).toLocaleString("ar-EG", { timeZone: "Africa/Cairo", dateStyle: "short", timeStyle: "short" })}
                    </span>
                  </li>
                ))}
              </ul>
            )}
          </section>
        </div>

        <aside className="order-1 space-y-4 lg:order-2">
          <section className="rounded-2xl border border-black/[0.07] bg-white p-4" data-reveal="left">
            <h3 className="font-display text-[15px] font-bold">الروابط</h3>
            <div className="mt-3 space-y-2 text-[12px]">
              <a href={base} target="_blank" rel="noreferrer" className="block truncate rounded-xl bg-black/[0.03] px-3 py-2 underline-offset-4 hover:underline" dir="ltr">
                {base}
              </a>
              <a href={`${base}/admin`} target="_blank" rel="noreferrer" className="block truncate rounded-xl bg-black/[0.03] px-3 py-2 underline-offset-4 hover:underline" dir="ltr">
                {base}/admin
              </a>
            </div>
          </section>

          <section className="rounded-2xl border border-black/[0.07] bg-white p-4" data-reveal="left" data-reveal-delay="2">
            <h3 className="font-display text-[15px] font-bold">بيانات</h3>
            <dl className="mt-3 space-y-2 text-[12px]">
              {rows.map(([k, v]) => (
                <div key={k} className="flex items-start justify-between gap-3">
                  <dt className="shrink-0 text-muted-foreground">{k}</dt>
                  <dd className="min-w-0 truncate text-left font-medium" dir="auto">{v}</dd>
                </div>
              ))}
            </dl>
          </section>
        </aside>
      </div>
    </>
  );
}
