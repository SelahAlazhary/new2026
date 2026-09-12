import Link from "next/link";
import { listTenants } from "@/lib/hub/registry";
import { StatusPill, STATUS_LABEL } from "@/components/hub/status-pill";
import type { TenantStatus } from "@/lib/hub/types";

export const dynamic = "force-dynamic";
export const metadata = { title: "المنصّات" };

const FILTERS: { key: string; label: string }[] = [
  { key: "all", label: "الكل" },
  { key: "active", label: STATUS_LABEL.active },
  { key: "pending_approval", label: STATUS_LABEL.pending_approval },
  { key: "suspended", label: "موقوفة/منتهية" },
  { key: "archived", label: STATUS_LABEL.archived },
];

export default async function TenantsPage({
  searchParams,
}: {
  searchParams: Promise<{ status?: string; q?: string }>;
}) {
  const { status = "all", q = "" } = await searchParams;
  const all = await listTenants();
  const needle = q.trim().toLowerCase();

  const list = all.filter((t) => {
    const okStatus =
      status === "all" ||
      (status === "suspended" ? t.status === "suspended" || t.status === "expired" : t.status === status);
    const okText = !needle || `${t.name} ${t.slug} ${t.adminEmail}`.toLowerCase().includes(needle);
    return okStatus && okText;
  });

  return (
    <>
      <header className="mb-5 flex flex-wrap items-end justify-between gap-3" data-reveal="down" data-reveal-duration="fast">
        <div>
          <h1 className="font-display text-2xl font-bold">المنصّات</h1>
          <p className="mt-1 text-[13px] text-muted-foreground">{all.length} منصّة — اضغط أيّها لفتح لوحة التحكّم فيها.</p>
        </div>
        <a
          href="/api/hub/export?type=tenants"
          download
          className="rounded-full border border-black/12 px-3 py-1.5 text-[11px] font-bold transition hover:border-black/25"
        >
          تصدير CSV
        </a>
      </header>

      <form className="mb-4 flex flex-wrap items-center gap-2" data-reveal="right" data-reveal-duration="fast">
        <input
          name="q" defaultValue={q} placeholder="ابحث باسم المنصّة أو رابطها…"
          className="inp min-w-[12rem] flex-1"
        />
        <select name="status" defaultValue={status} className="inp w-auto">
          {FILTERS.map((f) => (
            <option key={f.key} value={f.key}>{f.label}</option>
          ))}
        </select>
        <button type="submit" className="rounded-full bg-[#1b2a4a] px-4 py-2 text-[12px] font-bold text-white">تصفية</button>
      </form>

      {list.length === 0 ? (
        <p className="rounded-2xl border border-dashed border-black/15 p-10 text-center text-[13px] text-muted-foreground">
          لا توجد منصّة تطابق البحث.
        </p>
      ) : (
        <div className="overflow-hidden rounded-2xl border border-black/[0.07] bg-white" data-reveal="scale-up">
          <table className="w-full min-w-[640px] text-right text-[13px]">
            <thead>
              <tr className="border-b border-black/[0.08] bg-black/[0.02] text-[10px] text-muted-foreground">
                <th className="font-kufi px-4 py-3 font-bold">المنصّة</th>
                <th className="font-kufi px-4 py-3 font-bold">الرابط</th>
                <th className="font-kufi px-4 py-3 font-bold">الحالة</th>
                <th className="font-kufi px-4 py-3 font-bold">أقسام مخفيّة</th>
                <th className="font-kufi px-4 py-3 font-bold">أُنشئت</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-black/[0.05]">
              {list.map((t) => (
                <tr key={t.id} className="transition hover:bg-black/[0.02]">
                  <td className="px-4 py-3">
                    <Link href={`/hub/tenants/${t.id}`} className="flex items-center gap-2.5">
                      <span className="grid size-8 shrink-0 place-items-center rounded-lg bg-[#1b2a4a] text-[12px] font-bold text-white">
                        {(t.name || t.slug).charAt(0)}
                      </span>
                      <span className="min-w-0">
                        <b className="block truncate">{t.name || t.slug}</b>
                        {t.adminEmail && <span className="block truncate text-[11px] text-muted-foreground" dir="ltr">{t.adminEmail}</span>}
                      </span>
                    </Link>
                  </td>
                  <td className="px-4 py-3 text-[12px] text-muted-foreground" dir="ltr">{t.customDomain || t.slug}</td>
                  <td className="px-4 py-3"><StatusPill status={t.status as TenantStatus} /></td>
                  <td className="px-4 py-3 text-[12px] text-muted-foreground">
                    {t.hiddenSections.length ? `${t.hiddenSections.length} قسم` : "—"}
                  </td>
                  <td className="px-4 py-3 text-[11px] text-muted-foreground" dir="ltr">
                    {t.createdAt
                      ? new Date(t.createdAt).toLocaleDateString("ar-EG", { timeZone: "Africa/Cairo" })
                      : "—"}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </>
  );
}
