import { readAudit } from "@/lib/hub/audit";
import { actionLabel } from "@/lib/hub/labels";

export const dynamic = "force-dynamic";
export const metadata = { title: "سجلّ التدقيق" };

export default async function AuditPage() {
  const events = await readAudit({ limit: 300 });

  return (
    <>
      <header className="mb-5">
        <h1 className="font-display text-2xl font-bold">سجلّ التدقيق</h1>
        <p className="mt-1 text-[13px] text-muted-foreground">
          كلُّ فعلٍ وقع من لوحة المنصّات — بفاعله ووقته وعنوانه. لا يُحذف من هنا.
        </p>
      </header>

      {events.length === 0 ? (
        <p className="rounded-2xl border border-dashed border-black/15 p-10 text-center text-[13px] text-muted-foreground">
          السجلّ فارغ.
        </p>
      ) : (
        <div className="overflow-hidden rounded-2xl border border-black/[0.07] bg-white">
          <table className="w-full min-w-[680px] text-right text-[12.5px]">
            <thead>
              <tr className="border-b border-black/[0.08] bg-black/[0.02] text-[10px] text-muted-foreground">
                <th className="font-kufi px-4 py-3 font-bold">الوقت</th>
                <th className="font-kufi px-4 py-3 font-bold">من</th>
                <th className="font-kufi px-4 py-3 font-bold">الفعل</th>
                <th className="font-kufi px-4 py-3 font-bold">المنصّة</th>
                <th className="font-kufi px-4 py-3 font-bold">تفاصيل</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-black/[0.05]">
              {events.map((e) => (
                <tr key={e.id}>
                  <td className="whitespace-nowrap px-4 py-2.5 text-[11px] text-muted-foreground" dir="ltr">
                    {new Date(e.at).toLocaleString("ar-EG", { timeZone: "Africa/Cairo", dateStyle: "short", timeStyle: "medium" })}
                  </td>
                  <td className="px-4 py-2.5"><b className="font-kufi text-[11.5px]">{e.actor.name}</b></td>
                  <td className="px-4 py-2.5">{actionLabel(e.action)}</td>
                  <td className="px-4 py-2.5 text-[11px] text-muted-foreground" dir="ltr">{e.tenantId ?? "—"}</td>
                  <td className="max-w-[18rem] truncate px-4 py-2.5 text-[11px] text-muted-foreground" dir="auto">
                    {e.details ? JSON.stringify(e.details) : "—"}
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
