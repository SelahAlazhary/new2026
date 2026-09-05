"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

/**
 * قبولُ منصّةٍ أو رفضُها من صندوق الطلبات.
 * القبولُ يجهّز المنصّةَ ويفعّلها ويُنشئ حسابَ أدمنها؛ والرفضُ يعيدها
 * مسودّةً لصاحبها مع سببٍ يراه.
 */
export function RequestActions({ tenantId }: { tenantId: string }) {
  const router = useRouter();
  const [busy, setBusy] = useState<string | null>(null);
  const [rejecting, setRejecting] = useState(false);
  const [reason, setReason] = useState("");
  const [err, setErr] = useState("");

  const send = async (action: string, extra: Record<string, unknown> = {}) => {
    setBusy(action);
    setErr("");
    try {
      const res = await fetch("/api/hub/tenants", {
        method: "PATCH", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id: tenantId, action, ...extra }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) { setErr(data.error ?? "تعذّر"); return; }
      router.refresh();
    } catch {
      setErr("تعذّر الاتصال");
    } finally {
      setBusy(null);
    }
  };

  if (rejecting) {
    return (
      <div className="flex flex-wrap items-center gap-2">
        <input
          value={reason} onChange={(e) => setReason(e.target.value)}
          placeholder="سبب الرفض (يراه صاحب المنصّة)" maxLength={300}
          className="inp min-w-[12rem] flex-1 text-[12px]"
        />
        <button type="button" disabled={busy === "reject"} onClick={() => send("reject", { reason })}
          className="rounded-full bg-rose-600 px-3 py-1.5 text-[11.5px] font-bold text-white disabled:opacity-50">تأكيد الرفض</button>
        <button type="button" onClick={() => setRejecting(false)} className="text-[11.5px] text-muted-foreground underline">إلغاء</button>
      </div>
    );
  }

  return (
    <div className="flex items-center gap-2">
      {err && <span className="text-[11px] font-bold text-rose-600">{err}</span>}
      <button type="button" disabled={busy === "approve"} onClick={() => send("approve")}
        className="rounded-full bg-emerald-600 px-3.5 py-1.5 text-[11.5px] font-bold text-white disabled:opacity-50">
        {busy === "approve" ? "جارٍ التفعيل…" : "قبول وتفعيل"}
      </button>
      <button type="button" onClick={() => setRejecting(true)}
        className="rounded-full border border-black/12 px-3 py-1.5 text-[11.5px] font-bold">رفض</button>
    </div>
  );
}
