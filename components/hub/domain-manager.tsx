"use client";

/**
 * إدارةُ الدومين المخصّص لمنصّة.
 * إضافة / تحقّق يدويّ / حذف — مع عرض سجلّات TXT/CNAME للنسخ.
 */

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import type { CustomDomain } from "@/lib/hub/types";
import { Globe, Trash2, RefreshCw, Copy, Check } from "lucide-react";

const STATUS_LABELS: Record<CustomDomain["status"], string> = {
  pending_dns: "بانتظار DNS",
  verifying: "جارٍ التحقّق",
  active: "نشط",
  failed: "فشل",
  removed: "محذوف",
};
const STATUS_COLORS: Record<CustomDomain["status"], string> = {
  pending_dns: "bg-amber-500/10 text-amber-700",
  verifying: "bg-blue-500/10 text-blue-700",
  active: "bg-emerald-500/10 text-emerald-700",
  failed: "bg-rose-500/10 text-rose-600",
  removed: "bg-zinc-500/10 text-zinc-500",
};

export function DomainManager({
  tenantId,
  domains,
  canAdd,
}: {
  tenantId: string;
  domains: CustomDomain[];
  canAdd: boolean;
}) {
  const router = useRouter();
  const [pending, start] = useTransition();
  const [busy, setBusy] = useState(false);
  const [note, setNote] = useState<{ kind: "ok" | "err"; text: string } | null>(null);
  const [newDomain, setNewDomain] = useState("");

  const act = async (body: Record<string, unknown>, ok: string) => {
    setBusy(true);
    setNote(null);
    try {
      const res = await fetch("/api/hub/domains", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        setNote({ kind: "err", text: data.error ?? "تعذّر" });
        return;
      }
      setNote({ kind: "ok", text: ok });
      setNewDomain("");
      start(() => router.refresh());
    } catch {
      setNote({ kind: "err", text: "تعذّر الاتصال" });
    } finally {
      setBusy(false);
    }
  };

  return (
    <section className="rounded-2xl border border-black/[0.07] bg-white p-4">
      <div className="flex items-center gap-2">
        <Globe className="size-4 text-muted-foreground" />
        <h3 className="font-display text-[15px] font-bold">الدومين المخصّص</h3>
      </div>
      <p className="mb-3 mt-1 text-[11.5px] leading-relaxed text-muted-foreground">
        اربط المنصّة بدومين صاحبها — يُضاف إلى مشروع فيرسل ويُتحقَّق تلقائياً.
      </p>

      {note && (
        <p className={`mb-3 rounded-xl px-3 py-2 text-[12px] font-bold ${note.kind === "ok" ? "bg-emerald-500/10 text-emerald-700" : "bg-rose-500/10 text-rose-600"}`}>
          {note.text}
        </p>
      )}

      {/* الدومينات الحالية */}
      {domains.length > 0 && (
        <ul className="mb-3 divide-y divide-black/[0.06]">
          {domains.map((d) => (
            <li key={d.id} className="py-2.5">
              <div className="flex flex-wrap items-center gap-2">
                <span className="font-medium" dir="ltr">{d.domain}</span>
                <span className={`rounded-full px-2.5 py-0.5 text-[10px] font-bold ${STATUS_COLORS[d.status]}`}>
                  {STATUS_LABELS[d.status]}
                </span>
                <span className="ms-auto flex gap-1">
                  {d.status !== "active" && d.status !== "removed" && (
                    <button
                      type="button"
                      disabled={busy || pending}
                      onClick={() => act({ action: "verify", domainId: d.id }, "فُحص")}
                      title="فحص DNS الآن"
                      className="rounded-lg p-1.5 text-muted-foreground transition hover:bg-black/5"
                    >
                      <RefreshCw className="size-3.5" />
                    </button>
                  )}
                  <button
                    type="button"
                    disabled={busy || pending}
                    onClick={() => act({ action: "remove", domainId: d.id }, "حُذف")}
                    title="حذف الدومين"
                    className="rounded-lg p-1.5 text-rose-500/70 transition hover:bg-rose-500/5"
                  >
                    <Trash2 className="size-3.5" />
                  </button>
                </span>
              </div>

              {/* سجلّات التحقّق */}
              {d.vercelVerification && d.vercelVerification.length > 0 && d.status !== "active" && (
                <div className="mt-2 rounded-xl bg-amber-500/[0.06] p-2.5 text-[11px]">
                  <p className="mb-1 font-bold text-amber-800">أضف سجلّ DNS التالي:</p>
                  {d.vercelVerification.map((v, i) => (
                    <VerificationRow key={i} rec={v} />
                  ))}
                </div>
              )}

              {d.error && <p className="mt-1 text-[11px] text-rose-500">{d.error}</p>}
            </li>
          ))}
        </ul>
      )}

      {/* إضافة دومين جديد */}
      {canAdd && (
        <div className="flex items-end gap-2">
          <span className="flex-1">
            <label className="lbl">دومين جديد</label>
            <input
              value={newDomain}
              onChange={(e) => setNewDomain(e.target.value.toLowerCase())}
              placeholder="example.com"
              dir="ltr"
              className="inp w-full"
            />
          </span>
          <button
            type="button"
            disabled={busy || pending || !newDomain.trim()}
            onClick={() => act({ action: "add", tenantId, domain: newDomain }, "أُضيف — انتظر التحقّق")}
            className="rounded-full bg-[#1b2a4a] px-4 py-2 text-[12px] font-bold text-white transition disabled:opacity-40"
          >
            {busy ? "جارٍ…" : "ربط"}
          </button>
        </div>
      )}
      {!canAdd && domains.length === 0 && (
        <p className="text-[12px] text-muted-foreground">ميزة الدومين المخصّص غير مفعّلة في هذه المنصّة.</p>
      )}
    </section>
  );
}

function VerificationRow({ rec }: { rec: { type: string; domain: string; value: string } }) {
  const [copied, setCopied] = useState(false);
  const copy = (text: string) => {
    navigator.clipboard.writeText(text).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    });
  };
  return (
    <div className="mt-1 flex items-center gap-2 rounded-lg bg-white/60 px-2 py-1 text-[11px]">
      <span className="font-bold text-amber-800">{rec.type}</span>
      <span className="min-w-0 truncate" dir="ltr">{rec.domain}</span>
      <span className="text-muted-foreground">→</span>
      <span className="min-w-0 flex-1 truncate font-mono" dir="ltr">{rec.value}</span>
      <button type="button" onClick={() => copy(rec.value)} className="shrink-0 rounded p-1 transition hover:bg-black/5" title="نسخ">
        {copied ? <Check className="size-3 text-emerald-600" /> : <Copy className="size-3 text-muted-foreground" />}
      </button>
    </div>
  );
}
