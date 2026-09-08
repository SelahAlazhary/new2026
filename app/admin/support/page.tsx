"use client";

import { useState } from "react";
import {
  LifeBuoy, MessageCircle, AlertCircle, Plus, Trash2, Eye, EyeOff, Link2, Check,
} from "lucide-react";
import { PageHeader, Card, StatusBadge, StatCard } from "@/components/dashboard/ui";
import { useContent } from "@/components/content/content-provider";
import { Button } from "@/components/ui/primitives";
import { SUPPORT_KINDS, supportHref } from "@/lib/utils/support";
import type { Ticket, SupportLink } from "@/lib/utils/types";
import { Section } from "@/components/dashboard/section";

const priorityColor: Record<string, string> = { عالية: "text-rose-500", متوسطة: "text-amber-500", منخفضة: "text-sky-500" };
const cycle: Record<Ticket["status"], Ticket["status"]> = { "مفتوحة": "قيد المعالجة", "قيد المعالجة": "مغلقة", "مغلقة": "مفتوحة" };

export default function SupportPage() {
  const { db, save, content, saveContent } = useContent();
  const support = content.support ?? {};
  const links = support.links ?? [];
  const [nl, setNl] = useState<{ kind: SupportLink["kind"]; label: string; value: string; desc: string }>({
    kind: "whatsapp", label: "", value: "", desc: "",
  });
  const [savedFlag, setSavedFlag] = useState(false);

  const setSupport = (patch: Partial<NonNullable<typeof content.support>>) =>
    saveContent({ support: { ...support, ...patch } });

  const addLink = () => {
    if (!nl.value.trim()) return;
    const link: SupportLink = {
      id: `SL-${Date.now()}`,
      kind: nl.kind,
      label: nl.label.trim() || SUPPORT_KINDS.find((k) => k.id === nl.kind)?.label || "دعم",
      desc: nl.desc.trim() || undefined,
      value: nl.value.trim(),
      visible: true,
      order: links.length,
    };
    void setSupport({ links: [...links, link] });
    setNl({ kind: "whatsapp", label: "", value: "", desc: "" });
  };
  const patchLink = (id: string, patch: Partial<SupportLink>) =>
    setSupport({ links: links.map((l) => (l.id === id ? { ...l, ...patch } : l)) });
  const removeLink = (id: string) => setSupport({ links: links.filter((l) => l.id !== id) });
  const moveLink = (i: number, dir: -1 | 1) => {
    const arr = [...links];
    const j = i + dir;
    if (j < 0 || j >= arr.length) return;
    [arr[i], arr[j]] = [arr[j], arr[i]];
    void setSupport({ links: arr.map((l, k) => ({ ...l, order: k })) });
  };
  const tickets = db?.tickets ?? [];
  const [tab, setTab] = useState<"الكل" | "مفتوحة" | "قيد المعالجة" | "مغلقة">("الكل");

  const rows = tickets.filter((t) => tab === "الكل" || t.status === tab);
  const open = tickets.filter((t) => t.status === "مفتوحة").length;
  const advance = (id: string) =>
    save({ tickets: tickets.map((t) => (t.id === id ? { ...t, status: cycle[t.status] } : t)) });

  return (
    <>
      <PageHeader title="الدعم" subtitle="روابط التواصل التي تظهر للطالب + تذاكر الدعم" />

      {/* ---------- روابط الدعم ---------- */}
      <Section className="mb-6" title={<><Link2 className="size-5 text-primary" /> روابط الدعم</>}>
        <p className="mb-4 text-xs text-muted-foreground">تظهر للطالب في صفحة «المساعدة» — عدّلها متى شئت وتُحفظ فور الخروج من الحقل.</p>

        <div className="grid gap-3 sm:grid-cols-3">
          <label><span className="lbl">واتساب الدعم (دولي بلا +)</span>
            <input dir="ltr" className="inp text-right" defaultValue={support.whatsapp ?? ""} placeholder="201000000000"
              onBlur={(e) => { void setSupport({ whatsapp: e.target.value.trim() }); setSavedFlag(true); setTimeout(() => setSavedFlag(false), 1500); }} />
          </label>
          <label><span className="lbl">هاتف الدعم</span>
            <input dir="ltr" className="inp text-right" defaultValue={support.phone ?? ""} placeholder="+20100"
              onBlur={(e) => void setSupport({ phone: e.target.value.trim() })} />
          </label>
          <label><span className="lbl">بريد الدعم</span>
            <input dir="ltr" type="email" className="inp text-right" defaultValue={support.email ?? ""} placeholder="support@example.com"
              onBlur={(e) => void setSupport({ email: e.target.value.trim() })} />
          </label>
          <label className="sm:col-span-3"><span className="lbl">سطر توضيحي أسفل الروابط (اختياري)</span>
            <input className="inp" defaultValue={support.note ?? ""} placeholder="الرد خلال ساعة طوال أيام الأسبوع"
              onBlur={(e) => void setSupport({ note: e.target.value.trim() })} />
          </label>
        </div>
        {savedFlag && <p className="mt-2 inline-flex items-center gap-1 text-xs font-bold text-emerald-500"><Check className="size-3.5" /> حُفظ</p>}

        <div className="mt-6 border-t border-border pt-5">
          <p className="mb-3 text-sm font-bold">روابط إضافية</p>

          {links.length > 0 && (
            <div className="mb-4 space-y-2">
              {links.map((l, i) => (
                <div key={l.id} className={`flex flex-wrap items-center gap-2 rounded-2xl border border-border p-3 ${l.visible ? "" : "opacity-60"}`}>
                  <div className="flex flex-col text-muted-foreground">
                    <button onClick={() => moveLink(i, -1)} disabled={i === 0} className="hover:text-primary disabled:opacity-30">▲</button>
                    <button onClick={() => moveLink(i, 1)} disabled={i === links.length - 1} className="hover:text-primary disabled:opacity-30">▼</button>
                  </div>
                  <span className="rounded-full bg-primary/12 px-2 py-0.5 text-[10px] font-bold text-primary">
                    {SUPPORT_KINDS.find((k) => k.id === l.kind)?.label ?? l.kind}
                  </span>
                  <input className="inp w-36" value={l.label} onChange={(e) => patchLink(l.id, { label: e.target.value })} />
                  <input dir="ltr" className="inp min-w-44 flex-1 text-right" value={l.value} onChange={(e) => patchLink(l.id, { value: e.target.value })} />
                  <a href={supportHref(l)} target="_blank" rel="noreferrer" title="فتح"
                    className="grid size-8 place-items-center rounded-full border border-border text-muted-foreground transition hover:border-primary hover:text-primary">
                    <Link2 className="size-4" />
                  </a>
                  <button onClick={() => patchLink(l.id, { visible: !l.visible })} title="إظهار/إخفاء"
                    className="grid size-8 place-items-center rounded-full border border-border text-primary transition hover:border-primary">
                    {l.visible ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
                  </button>
                  <button onClick={() => removeLink(l.id)} title="حذف"
                    className="grid size-8 place-items-center rounded-full border border-border text-rose-500 transition hover:border-rose-500">
                    <Trash2 className="size-4" />
                  </button>
                </div>
              ))}
            </div>
          )}

          <div className="flex flex-wrap items-end gap-2 rounded-2xl border border-dashed border-border p-3">
            <label className="w-32"><span className="lbl">النوع</span>
              <select className="inp" value={nl.kind} onChange={(e) => setNl({ ...nl, kind: e.target.value as SupportLink["kind"] })}>
                {SUPPORT_KINDS.map((k) => <option key={k.id} value={k.id}>{k.label}</option>)}
              </select>
            </label>
            <label className="w-36"><span className="lbl">العنوان</span>
              <input className="inp" value={nl.label} onChange={(e) => setNl({ ...nl, label: e.target.value })} placeholder="مجموعة الطلاب" />
            </label>
            <label className="min-w-44 flex-1"><span className="lbl">الرقم / الرابط</span>
              <input dir="ltr" className="inp text-right" value={nl.value} onChange={(e) => setNl({ ...nl, value: e.target.value })}
                onKeyDown={(e) => e.key === "Enter" && addLink()} placeholder="https://t.me/…" />
            </label>
            <label className="min-w-36 flex-1"><span className="lbl">وصف مختصر</span>
              <input className="inp" value={nl.desc} onChange={(e) => setNl({ ...nl, desc: e.target.value })} placeholder="للاستفسارات العامة" />
            </label>
            <Button className="px-5 py-2.5" onClick={addLink}><Plus className="size-4" /> إضافة</Button>
          </div>
        </div>
      </Section>

      <div className="mb-6 grid gap-4 sm:grid-cols-3">
        <StatCard index={0} label="تذاكر مفتوحة" value={open} tone="primary" icon={<LifeBuoy className="size-5" />} />
        <StatCard index={1} label="متوسط زمن الرد" value="١٤ د" tone="emerald" icon={<MessageCircle className="size-5" />} />
        <StatCard index={2} label="عالية الأولوية" value={tickets.filter((t) => t.priority === "عالية").length} tone="amber" icon={<AlertCircle className="size-5" />} />
      </div>

      <div className="mb-4 flex gap-1">
        {(["الكل", "مفتوحة", "قيد المعالجة", "مغلقة"] as const).map((f) => (
          <button key={f} onClick={() => setTab(f)} className={`rounded-full px-4 py-2 text-xs font-bold transition ${tab === f ? "btn-glow text-white" : "border border-border text-muted-foreground hover:text-foreground"}`}>{f}</button>
        ))}
      </div>

      <div className="space-y-3">
        {rows.map((t) => (
          <Card key={t.id} className="!p-4">
            <div className="flex flex-wrap items-center gap-3">
              <span className="grid size-10 place-items-center rounded-2xl bg-primary/12 text-primary"><MessageCircle className="size-5" /></span>
              <div className="min-w-0 flex-1"><p className="font-semibold">{t.subject}</p><p className="text-xs text-muted-foreground">{t.student} · <span className="font-mono">{t.id}</span> · {t.time}</p></div>
              <span className={`inline-flex items-center gap-1 text-xs font-bold ${priorityColor[t.priority]}`}><AlertCircle className="size-3.5" /> {t.priority}</span>
              <StatusBadge status={t.status} />
              <button onClick={() => advance(t.id)} className="rounded-full border border-border px-4 py-1.5 text-xs font-bold transition hover:border-primary hover:text-primary">تغيير الحالة</button>
            </div>
          </Card>
        ))}
      </div>
    </>
  );
}
