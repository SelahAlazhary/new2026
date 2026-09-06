"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import type { HubSettings } from "@/lib/hub/types";

export function HubSettingsForm({ settings }: { settings: HubSettings }) {
  const router = useRouter();
  const [name, setName] = useState(settings.brand.name);
  const [primary, setPrimary] = useState(settings.brand.primary);
  const [approval, setApproval] = useState(settings.approval);
  const [grace, setGrace] = useState(settings.gracePeriodDays);
  const [emailFrom, setEmailFrom] = useState(settings.emailFrom);
  const [paymobOn, setPaymobOn] = useState(settings.paymob.enabled);
  const [manualOn, setManualOn] = useState(settings.manualPay.enabled);
  const [methods, setMethods] = useState(settings.manualPay.methods.length ? settings.manualPay.methods : []);
  const [busy, setBusy] = useState(false);
  const [note, setNote] = useState<{ kind: "ok" | "err"; text: string } | null>(null);

  const addMethod = () => setMethods([...methods, { kind: "wallet", label: "", number: "", active: true }]);
  const setMethod = (i: number, patch: Partial<(typeof methods)[number]>) =>
    setMethods(methods.map((m, j) => (j === i ? { ...m, ...patch } : m)));
  const delMethod = (i: number) => setMethods(methods.filter((_, j) => j !== i));

  const save = async () => {
    setBusy(true);
    setNote(null);
    try {
      const res = await fetch("/api/hub/settings", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          brand: { name, primary },
          approval,
          gracePeriodDays: grace,
          emailFrom,
          paymob: { enabled: paymobOn },
          manualPay: { enabled: manualOn, methods },
        }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) setNote({ kind: "err", text: data.error ?? "تعذّر الحفظ" });
      else {
        setNote({ kind: "ok", text: "حُفظت الإعدادات" });
        router.refresh();
      }
    } catch {
      setNote({ kind: "err", text: "تعذّر الاتصال بالخادم" });
    } finally {
      setBusy(false);
    }
  };

  return (
    <section className="rounded-2xl border border-black/[0.07] bg-white p-4">
      {note && (
        <p
          role="status"
          className={`mb-3 rounded-xl px-3 py-2 text-[12px] font-bold ${
            note.kind === "ok" ? "bg-emerald-500/10 text-emerald-700" : "bg-rose-500/10 text-rose-600"
          }`}
        >
          {note.text}
        </p>
      )}

      <div className="grid gap-3 sm:grid-cols-2">
        <span>
          <label className="lbl" htmlFor="hb-name">اسم المنصّة الأمّ</label>
          <input id="hb-name" value={name} onChange={(e) => setName(e.target.value)} maxLength={60} className="inp w-full" />
        </span>
        <span>
          <label className="lbl" htmlFor="hb-color">اللون الأساسي</label>
          <span className="flex items-center gap-2">
            <input
              id="hb-color" type="color" value={primary} onChange={(e) => setPrimary(e.target.value)}
              className="h-10 w-14 cursor-pointer rounded-lg border border-black/10 bg-white p-1"
            />
            <input value={primary} onChange={(e) => setPrimary(e.target.value)} dir="ltr" className="inp flex-1" />
          </span>
        </span>
        <span>
          <label className="lbl" htmlFor="hb-approval">قبول المنصّات الجديدة</label>
          <select
            id="hb-approval" value={approval}
            onChange={(e) => setApproval(e.target.value as HubSettings["approval"])}
            className="inp w-full"
          >
            <option value="manual">يدويّ — لا تُفعَّل منصّة إلّا بموافقتك</option>
            <option value="auto_after_payment">تلقائيّ بعد الدفع</option>
          </select>
        </span>
        <span>
          <label className="lbl" htmlFor="hb-grace">مهلة بعد انتهاء الاشتراك (أيام)</label>
          <input
            id="hb-grace" type="number" min={0} max={60} dir="ltr" value={grace}
            onChange={(e) => setGrace(Number(e.target.value))} className="inp w-full"
          />
        </span>
        <span className="sm:col-span-2">
          <label className="lbl" htmlFor="hb-mail">بريد المُرسِل</label>
          <input
            id="hb-mail" value={emailFrom} onChange={(e) => setEmailFrom(e.target.value)}
            dir="ltr" placeholder="no-reply@example.com" className="inp w-full"
          />
        </span>
      </div>

      {/* ــ بوّابات الدفع ــ */}
      <div className="mt-5 border-t border-black/[0.07] pt-4">
        <h4 className="font-display text-[14px] font-bold">بوّابات دفع اشتراك المنصّات</h4>
        <p className="mb-3 mt-1 text-[11.5px] leading-relaxed text-muted-foreground">
          كيف يدفع المدرّسون اشتراكهم. مفاتيح بايموب السرّية في متغيّرات البيئة، وهنا التفعيل فقط.
        </p>

        <label className="mb-2 flex cursor-pointer items-center gap-2 text-[12.5px]">
          <input type="checkbox" checked={paymobOn} onChange={(e) => setPaymobOn(e.target.checked)} className="size-4 accent-[#1b2a4a]" />
          الدفع بالبطاقة عبر بايموب (يتطلّب ضبط مفاتيح PAYMOB_* في البيئة)
        </label>
        <label className="flex cursor-pointer items-center gap-2 text-[12.5px]">
          <input type="checkbox" checked={manualOn} onChange={(e) => setManualOn(e.target.checked)} className="size-4 accent-[#1b2a4a]" />
          التحويل اليدوي (إنستاباي / محفظة / بنك)
        </label>

        {manualOn && (
          <div className="mt-3 space-y-2">
            {methods.map((m, i) => (
              <div key={i} className="flex flex-wrap items-center gap-2 rounded-xl border border-black/[0.08] p-2">
                <select value={m.kind} onChange={(e) => setMethod(i, { kind: e.target.value as typeof m.kind })} className="inp w-auto text-[12px]">
                  <option value="instapay">إنستاباي</option>
                  <option value="wallet">محفظة</option>
                  <option value="bank">بنك</option>
                </select>
                <input value={m.label} onChange={(e) => setMethod(i, { label: e.target.value })} placeholder="الاسم المعروض" className="inp flex-1 text-[12px]" style={{ minWidth: "7rem" }} />
                <input value={m.number} onChange={(e) => setMethod(i, { number: e.target.value })} dir="ltr" placeholder="الرقم / العنوان" className="inp flex-1 text-[12px]" style={{ minWidth: "8rem" }} />
                <label className="flex items-center gap-1 text-[11px]">
                  <input type="checkbox" checked={m.active} onChange={(e) => setMethod(i, { active: e.target.checked })} className="size-3.5 accent-[#1b2a4a]" /> مفعّل
                </label>
                <button type="button" onClick={() => delMethod(i)} className="text-[11px] font-bold text-rose-600">حذف</button>
              </div>
            ))}
            <button type="button" onClick={addMethod} className="rounded-full border border-black/12 px-3 py-1.5 text-[12px] font-bold">+ إضافة طريقة</button>
          </div>
        )}
      </div>

      <button
        type="button" onClick={save} disabled={busy}
        className="mt-4 rounded-full bg-[#1b2a4a] px-4 py-2 text-[12px] font-bold text-white disabled:opacity-50"
      >
        {busy ? "جارٍ الحفظ…" : "حفظ الإعدادات"}
      </button>
    </section>
  );
}
