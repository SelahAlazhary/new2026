"use client";

import { useState } from "react";
import type { SaasPlan, TenantFeature } from "@/lib/hub/types";

const ALL_FEATURES: { key: TenantFeature; label: string }[] = [
  { key: "exams", label: "امتحانات" },
  { key: "codes", label: "أكواد اشتراك" },
  { key: "studentPayments", label: "مدفوعات الطلاب" },
  { key: "webPush", label: "إشعارات ويب" },
  { key: "captureGuard", label: "حماية لقطات" },
  { key: "liveMeet", label: "بث مباشر" },
  { key: "youtube", label: "يوتيوب" },
  { key: "drive", label: "ملفّات" },
  { key: "backup", label: "نسخ احتياطي" },
  { key: "team", label: "فريق عمل" },
  { key: "telegramBot", label: "بوت تيليجرام" },
  { key: "bunny", label: "فيديو Bunny" },
  { key: "customDomain", label: "دومين خاص" },
];

const EMPTY: SaasPlan = {
  id: "", name: "", desc: "", interval: "month", priceEGP: 0, trialDays: 0,
  limits: { maxStudents: 60, maxSubjects: 4, maxAdmins: 1, maxStorageMB: 500, customDomain: false },
  features: ["exams", "codes", "studentPayments", "webPush", "captureGuard"],
  order: 0, visible: true, color: "#3b6fb0",
};

export function PlansEditor({ initial }: { initial: SaasPlan[] }) {
  const [plans, setPlans] = useState(initial);
  const [editing, setEditing] = useState<SaasPlan | null>(null);
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState("");

  const call = async (body: Record<string, unknown>) => {
    setBusy(true); setMsg("");
    try {
      const res = await fetch("/api/hub/plans", {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) { setMsg(data.error ?? "تعذّر"); return null; }
      return data;
    } catch { setMsg("تعذّر الاتصال"); return null; }
    finally { setBusy(false); }
  };

  const reload = async () => {
    const res = await fetch("/api/hub/plans", { cache: "no-store" });
    if (res.ok) setPlans(await res.json());
  };

  const save = async () => {
    if (!editing) return;
    const d = await call({ action: "upsert", ...editing });
    if (d?.ok) { setEditing(null); await reload(); setMsg("تمّ الحفظ"); }
  };

  const remove = async (id: string) => {
    const d = await call({ action: "delete", id });
    if (d?.ok) { await reload(); setMsg("تمّ الحذف"); }
  };

  if (editing) {
    return <PlanForm plan={editing} onChange={setEditing} onSave={save} onCancel={() => setEditing(null)} busy={busy} msg={msg} />;
  }

  return (
    <div>
      {msg && <p className="mb-3 rounded-xl bg-emerald-50 px-3 py-2 text-[12px] font-bold text-emerald-700">{msg}</p>}
      <div className="mb-4 flex items-center justify-between">
        <span className="text-[13px] text-muted-foreground">{plans.length} خطّة</span>
        <button type="button" className="rounded-lg bg-primary px-4 py-2 text-[13px] font-bold text-white" onClick={() => setEditing({ ...EMPTY })}>
          + خطّة جديدة
        </button>
      </div>
      <div className="space-y-3">
        {plans.map((p) => (
          <div key={p.id} className="flex items-center gap-3 rounded-xl border border-black/[0.07] bg-white p-4">
            <span className="grid size-10 shrink-0 place-items-center rounded-lg text-[13px] font-extrabold text-white" style={{ background: p.color || "#3b6fb0" }}>
              {p.name.charAt(0)}
            </span>
            <div className="min-w-0 flex-1">
              <div className="flex items-center gap-2">
                <b className="text-[14px]">{p.name}</b>
                {p.highlight && <span className="rounded bg-amber-100 px-1.5 py-0.5 text-[10px] font-bold text-amber-700">{p.badge || "مميّزة"}</span>}
                {!p.visible && <span className="rounded bg-red-50 px-1.5 py-0.5 text-[10px] font-bold text-red-600">مخفيّة</span>}
              </div>
              <p className="text-[12px] text-muted-foreground">
                {`${p.priceEGP} ج.م/${p.interval === "month" ? "شهر" : p.interval === "quarter" ? "٣ شهور" : "سنة"}`}
                {` · ${p.features.length} ميزة`}
              </p>
            </div>
            <div className="flex gap-2">
              <button type="button" className="rounded-lg border px-3 py-1.5 text-[12px] font-bold" onClick={() => setEditing({ ...p })}>تعديل</button>
              <button type="button" className="rounded-lg border border-red-200 px-3 py-1.5 text-[12px] font-bold text-red-600 hover:bg-red-50" disabled={busy} onClick={() => { if (confirm(`حذف «${p.name}»؟`)) remove(p.id); }}>حذف</button>
            </div>
          </div>
        ))}
        {plans.length === 0 && <p className="py-8 text-center text-[13px] text-muted-foreground">لا خطط بعد — أنشئ واحدة.</p>}
      </div>
    </div>
  );
}

function PlanForm({ plan, onChange, onSave, onCancel, busy, msg }: {
  plan: SaasPlan; onChange: (p: SaasPlan) => void;
  onSave: () => void; onCancel: () => void; busy: boolean; msg: string;
}) {
  const set = <K extends keyof SaasPlan>(k: K, v: SaasPlan[K]) => onChange({ ...plan, [k]: v });
  const setLimit = (k: keyof SaasPlan["limits"], v: number | null | boolean) =>
    onChange({ ...plan, limits: { ...plan.limits, [k]: v } });

  const toggleFeature = (f: TenantFeature) => {
    const has = plan.features.includes(f);
    set("features", has ? plan.features.filter((x) => x !== f) : [...plan.features, f]);
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="font-display text-lg font-bold">{plan.id ? "تعديل الخطّة" : "خطّة جديدة"}</h2>
        <button type="button" className="text-[13px] text-muted-foreground underline" onClick={onCancel}>رجوع</button>
      </div>
      {msg && <p className="rounded-xl bg-red-50 px-3 py-2 text-[12px] font-bold text-red-600">{msg}</p>}

      <section className="rounded-xl border border-black/[0.07] bg-white p-4 space-y-3">
        <h3 className="text-[13px] font-bold">المعلومات الأساسية</h3>
        <div className="grid gap-3 sm:grid-cols-2">
          <label className="block">
            <span className="text-[12px] text-muted-foreground">اسم الخطّة</span>
            <input className="inp mt-1 w-full" value={plan.name} onChange={(e) => set("name", e.target.value)} maxLength={60} />
          </label>
          <label className="block">
            <span className="text-[12px] text-muted-foreground">الوصف</span>
            <input className="inp mt-1 w-full" value={plan.desc ?? ""} onChange={(e) => set("desc", e.target.value)} maxLength={300} />
          </label>
        </div>
        <div className="grid gap-3 sm:grid-cols-3">
          <label className="block">
            <span className="text-[12px] text-muted-foreground">السعر (ج.م)</span>
            <input className="inp mt-1 w-full" type="number" min={0} value={plan.priceEGP} onChange={(e) => set("priceEGP", Number(e.target.value) || 0)} />
          </label>
          <label className="block">
            <span className="text-[12px] text-muted-foreground">الدورة</span>
            <select className="inp mt-1 w-full" value={plan.interval} onChange={(e) => set("interval", e.target.value as SaasPlan["interval"])}>
              <option value="month">شهري</option>
              <option value="quarter">ربع سنوي</option>
              <option value="year">سنوي</option>
            </select>
          </label>
          <label className="block">
            <span className="text-[12px] text-muted-foreground">اللون</span>
            <input className="inp mt-1 w-full" type="color" value={plan.color || "#3b6fb0"} onChange={(e) => set("color", e.target.value)} />
          </label>
        </div>
        <div className="grid gap-3 sm:grid-cols-3">
          <label className="block">
            <span className="text-[12px] text-muted-foreground">الترتيب</span>
            <input className="inp mt-1 w-full" type="number" value={plan.order} onChange={(e) => set("order", Number(e.target.value) || 0)} />
          </label>
          <label className="block">
            <span className="text-[12px] text-muted-foreground">اللون</span>
            <input className="mt-1 h-9 w-full cursor-pointer rounded-lg border p-0.5" type="color" value={plan.color || "#3b6fb0"} onChange={(e) => set("color", e.target.value)} />
          </label>
          <label className="block">
            <span className="text-[12px] text-muted-foreground">الشارة</span>
            <input className="inp mt-1 w-full" value={plan.badge ?? ""} onChange={(e) => set("badge", e.target.value)} maxLength={40} placeholder="مثلاً: الأكثر اختياراً" />
          </label>
        </div>
        <div className="flex flex-wrap gap-4 pt-1">
          <label className="flex items-center gap-2 text-[12px]">
            <input type="checkbox" checked={plan.visible} onChange={(e) => set("visible", e.target.checked)} />
            مرئيّة للمدرّسين
          </label>
          <label className="flex items-center gap-2 text-[12px]">
            <input type="checkbox" checked={plan.highlight ?? false} onChange={(e) => set("highlight", e.target.checked)} />
            مميّزة (highlight)
          </label>
        </div>
      </section>

      <section className="rounded-xl border border-black/[0.07] bg-white p-4 space-y-3">
        <h3 className="text-[13px] font-bold">الحدود</h3>
        <div className="grid gap-3 sm:grid-cols-2">
          <LimitField label="حدّ الطلاب" value={plan.limits.maxStudents} onChange={(v) => setLimit("maxStudents", v)} />
          <LimitField label="حدّ المواد" value={plan.limits.maxSubjects} onChange={(v) => setLimit("maxSubjects", v)} />
          <LimitField label="حدّ المشرفين" value={plan.limits.maxAdmins} onChange={(v) => setLimit("maxAdmins", v)} />
          <LimitField label="المساحة (ميجابايت)" value={plan.limits.maxStorageMB} onChange={(v) => setLimit("maxStorageMB", v)} />
        </div>
        <label className="flex items-center gap-2 text-[12px]">
          <input type="checkbox" checked={plan.limits.customDomain} onChange={(e) => setLimit("customDomain", e.target.checked)} />
          يسمح بدومين خاص
        </label>
      </section>

      <section className="rounded-xl border border-black/[0.07] bg-white p-4 space-y-3">
        <h3 className="text-[13px] font-bold">الميزات</h3>
        <div className="grid gap-2 sm:grid-cols-2">
          {ALL_FEATURES.map((f) => (
            <label key={f.key} className="flex items-center gap-2 text-[12px]">
              <input type="checkbox" checked={plan.features.includes(f.key)} onChange={() => toggleFeature(f.key)} />
              {f.label}
            </label>
          ))}
        </div>
      </section>

      <div className="flex items-center justify-between pt-2">
        <button type="button" className="rounded-lg border px-4 py-2 text-[13px] font-bold" onClick={onCancel} disabled={busy}>إلغاء</button>
        <button type="button" className="rounded-lg bg-primary px-6 py-2 text-[13px] font-bold text-white disabled:opacity-50" onClick={onSave} disabled={busy || !plan.name.trim()}>
          {busy ? "…" : plan.id ? "حفظ التعديلات" : "إنشاء الخطّة"}
        </button>
      </div>
    </div>
  );
}

function LimitField({ label, value, onChange }: { label: string; value: number | null; onChange: (v: number | null) => void }) {
  const unlimited = value === null;
  return (
    <label className="block">
      <span className="text-[12px] text-muted-foreground">{label}</span>
      <div className="mt-1 flex items-center gap-2">
        <input className="inp flex-1" type="number" min={1} disabled={unlimited} value={unlimited ? "" : value} placeholder={unlimited ? "بلا حدّ" : ""} onChange={(e) => onChange(Number(e.target.value) || 1)} />
        <label className="flex shrink-0 items-center gap-1 text-[11px] text-muted-foreground">
          <input type="checkbox" checked={unlimited} onChange={(e) => onChange(e.target.checked ? null : 60)} />
          بلا حدّ
        </label>
      </div>
    </label>
  );
}
