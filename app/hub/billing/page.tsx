import { listInvoices } from "@/lib/hub/invoices";
import { listTenants } from "@/lib/hub/registry";
import { getHubSettings } from "@/lib/hub/settings";
import { InvoiceActions } from "@/components/hub/invoice-actions";

export const dynamic = "force-dynamic";
export const metadata = { title: "الفواتير والإيراد" };

const STATUS_LABEL: Record<string, string> = {
  pending: "بانتظار المراجعة", paid: "مدفوعة", failed: "فشلت", refunded: "مُستردّة", rejected: "مرفوضة",
};
const STATUS_TONE: Record<string, string> = {
  pending: "bg-amber-500/12 text-amber-700", paid: "bg-emerald-500/12 text-emerald-700",
  failed: "bg-rose-500/12 text-rose-600", rejected: "bg-rose-500/12 text-rose-600", refunded: "bg-black/[0.06] text-muted-foreground",
};

export default async function BillingPage() {
  const [invoices, tenants, settings] = await Promise.all([listInvoices(), listTenants(), getHubSettings()]);
  const name = (id: string) => tenants.find((t) => t.id === id)?.name || tenants.find((t) => t.id === id)?.slug || id;
  const paid = invoices.filter((i) => i.status === "paid");
  const revenue = paid.reduce((s, i) => s + i.amountEGP, 0);
  const thisMonth = paid.filter((i) => i.paidAt && new Date(i.paidAt).getMonth() === new Date().getMonth()).reduce((s, i) => s + i.amountEGP, 0);
  const pending = invoices.filter((i) => i.status === "pending");

  return (
    <>
      <header className="mb-5" data-reveal="down" data-reveal-duration="fast">
        <h1 className="font-display text-2xl font-bold">الفواتير والإيراد</h1>
        <p className="mt-1 text-[13px] text-muted-foreground">اعتماد التحويلات اليدوية ومتابعة الدفعات.</p>
      </header>

      <div className="mb-5 grid gap-3 sm:grid-cols-3" data-reveal-group>
        <Stat label="إيراد الشهر" value={`${thisMonth.toLocaleString("ar-EG")} ج.م`} tone="ok" />
        <Stat label="الإيراد الكلّي" value={`${revenue.toLocaleString("ar-EG")} ج.م`} tone="plain" />
        <Stat label="بانتظار المراجعة" value={pending.length.toLocaleString("ar-EG")} tone="wait" />
      </div>

      {!settings.manualPay.enabled && !settings.paymob.enabled && (
        <p className="mb-4 rounded-2xl border border-amber-500/35 bg-amber-500/10 px-4 py-3 text-[12.5px] text-amber-800">
          لم تُفعّل أيّ بوّابة دفع بعد. فعّل التحويل اليدوي أو بايموب من <b>الإعدادات</b> ليتمكّن المدرّسون من الدفع.
        </p>
      )}

      {invoices.length === 0 ? (
        <p className="rounded-2xl border border-dashed border-black/15 p-10 text-center text-[13px] text-muted-foreground">لا فواتير بعد.</p>
      ) : (
        <div className="overflow-hidden rounded-2xl border border-black/[0.07] bg-white" data-reveal="stretch">
          <table className="w-full min-w-[720px] text-right text-[12.5px]">
            <thead>
              <tr className="border-b border-black/[0.08] bg-black/[0.02] text-[10px] text-muted-foreground">
                <th className="font-kufi px-4 py-3 font-bold">المنصّة</th>
                <th className="font-kufi px-4 py-3 font-bold">المبلغ</th>
                <th className="font-kufi px-4 py-3 font-bold">الطريقة</th>
                <th className="font-kufi px-4 py-3 font-bold">الحالة</th>
                <th className="font-kufi px-4 py-3 font-bold">التاريخ</th>
                <th className="font-kufi px-4 py-3 font-bold">إجراء</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-black/[0.05]">
              {invoices.map((inv) => (
                <tr key={inv.id}>
                  <td className="px-4 py-3"><b>{name(inv.tenantId)}</b></td>
                  <td className="px-4 py-3 tabular-nums">{inv.amountEGP.toLocaleString("ar-EG")} ج.م</td>
                  <td className="px-4 py-3 text-muted-foreground">
                    {inv.provider === "manual" ? `تحويل${inv.manualMethod?.senderNumber ? ` · ${inv.manualMethod.senderNumber}` : ""}` : "بطاقة"}
                  </td>
                  <td className="px-4 py-3">
                    <span className={`rounded-full px-2.5 py-1 text-[10px] font-bold ${STATUS_TONE[inv.status] ?? ""}`}>{STATUS_LABEL[inv.status] ?? inv.status}</span>
                  </td>
                  <td className="px-4 py-3 text-[11px] text-muted-foreground" dir="ltr">
                    {new Date(inv.createdAt).toLocaleDateString("ar-EG", { timeZone: "Africa/Cairo" })}
                  </td>
                  <td className="px-4 py-3">
                    {inv.status === "pending" && inv.provider === "manual"
                      ? <InvoiceActions id={inv.id} receiptUrl={inv.receiptUrl} />
                      : <span className="text-[11px] text-muted-foreground">—</span>}
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

function Stat({ label, value, tone }: { label: string; value: string; tone: "ok" | "wait" | "plain" }) {
  const t: Record<string, string> = { ok: "text-emerald-600 bg-emerald-500/10", wait: "text-amber-600 bg-amber-500/10", plain: "text-[#1b2a4a] bg-black/[0.04]" };
  return (
    <div className="rounded-2xl border border-black/[0.07] bg-white p-4" data-reveal="scale-up">
      <span className={`font-kufi inline-flex rounded-full px-2 py-0.5 text-[10px] font-bold ${t[tone]}`}>{label}</span>
      <p className="font-display mt-2.5 text-2xl font-bold leading-none">{value}</p>
    </div>
  );
}
