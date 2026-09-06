"use client";

import { useState } from "react";
import { Eye } from "lucide-react";

export function ImpersonateBtn({ tenantId }: { tenantId: string }) {
  const [busy, setBusy] = useState(false);

  const go = async () => {
    setBusy(true);
    try {
      const res = await fetch("/api/hub/impersonate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "start", tenantId }),
      });
      const data = await res.json().catch(() => ({}));
      if (data.url) window.open(data.url, "_blank");
    } finally {
      setBusy(false);
    }
  };

  return (
    <button
      type="button"
      disabled={busy}
      onClick={go}
      className="flex items-center gap-1.5 rounded-full border border-amber-500/30 bg-amber-500/10 px-3 py-1.5 text-[11px] font-bold text-amber-800 transition hover:bg-amber-500/20 disabled:opacity-50"
    >
      <Eye className="size-3.5" />
      {busy ? "جارٍ…" : "الدخول كمدير"}
    </button>
  );
}
