"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

/** اعتمادُ فاتورةٍ يدويّة أو رفضُها، مع معاينة الإيصال. */
export function InvoiceActions({ id, receiptUrl }: { id: string; receiptUrl?: string }) {
  const router = useRouter();
  const [busy, setBusy] = useState<string | null>(null);
  const [show, setShow] = useState(false);
  const [reason, setReason] = useState("");
  const [rejecting, setRejecting] = useState(false);

  const send = async (action: string, extra: Record<string, unknown> = {}) => {
    setBusy(action);
    try {
      const res = await fetch("/api/hub/invoices", {
        method: "PATCH", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id, action, ...extra }),
      });
      if (res.ok) router.refresh();
    } finally {
      setBusy(null);
    }
  };

  return (
    <div className="flex flex-wrap items-center gap-2">
      {receiptUrl && (
        <button type="button" onClick={() => setShow(true)} className="text-[11px] font-bold text-primary underline underline-offset-2">الإيصال</button>
      )}
      {rejecting ? (
        <>
          <input value={reason} onChange={(e) => setReason(e.target.value)} placeholder="سبب الرفض" className="inp text-[11px]" style={{ minWidth: "8rem" }} />
          <button type="button" disabled={busy === "reject"} onClick={() => send("reject", { reason })} className="rounded-full bg-rose-600 px-3 py-1 text-[11px] font-bold text-white">تأكيد</button>
          <button type="button" onClick={() => setRejecting(false)} className="text-[11px] text-muted-foreground underline">إلغاء</button>
        </>
      ) : (
        <>
          <button type="button" disabled={busy === "approve"} onClick={() => send("approve")} className="rounded-full bg-emerald-600 px-3 py-1 text-[11px] font-bold text-white disabled:opacity-50">
            {busy === "approve" ? "…" : "اعتماد"}
          </button>
          <button type="button" onClick={() => setRejecting(true)} className="rounded-full border border-black/12 px-3 py-1 text-[11px] font-bold">رفض</button>
        </>
      )}

      {show && receiptUrl && (
        <div className="fixed inset-0 z-[120] grid place-items-center bg-black/70 p-4" onClick={() => setShow(false)}>
          <div className="max-h-[85vh] max-w-lg overflow-auto rounded-2xl bg-white p-3" onClick={(e) => e.stopPropagation()}>
            {/* الإيصالُ صورةٌ رفعها المدرّس — تُعرض للمراجعة فقط */}
            <img src={receiptUrl} alt="إيصال التحويل" className="w-full rounded-lg" />
            <button type="button" onClick={() => setShow(false)} className="mt-2 w-full rounded-full bg-[#1b2a4a] py-2 text-[12px] font-bold text-white">إغلاق</button>
          </div>
        </div>
      )}
    </div>
  );
}
