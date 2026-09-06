"use client";

/**
 * لافتةُ الانتحال — تُعرض في لوحة المنصّة حين يتصفّحها أدمن المنصّات.
 * لا تُخفى ولا تُصغَّر: من يعبث باللوحة يجب أن يعرف أنّ كلَّ فعلٍ مسجَّل.
 */

import { useState } from "react";
import { ShieldAlert } from "lucide-react";

export function ImpersonateBanner({
  superName,
  tenantSlug,
}: {
  superName: string;
  tenantSlug: string;
}) {
  const [ending, setEnding] = useState(false);

  const end = async () => {
    setEnding(true);
    try {
      await fetch("/api/hub/impersonate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "end" }),
      });
      window.location.href = `/hub/tenants`;
    } catch {
      setEnding(false);
    }
  };

  return (
    <div className="sticky top-0 z-[9999] flex flex-wrap items-center justify-center gap-3 bg-amber-500 px-4 py-2 text-[12px] font-bold text-amber-950">
      <ShieldAlert className="size-4" />
      <span>
        تتصفّح بصفة أدمن المنصّات ({superName}) — المنصّة: {tenantSlug} — كلُّ فعلٍ مسجَّل
      </span>
      <button
        type="button"
        disabled={ending}
        onClick={end}
        className="rounded-full bg-amber-950 px-3 py-1 text-[11px] font-bold text-amber-100 transition hover:bg-amber-900 disabled:opacity-50"
      >
        {ending ? "جارٍ الخروج…" : "إنهاء الانتحال"}
      </button>
    </div>
  );
}
