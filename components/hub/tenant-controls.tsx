"use client";

/**
 * أدواتُ التحكّم في منصّةٍ واحدة.
 * ------------------------------------------------------------------
 * كلُّ زرٍّ هنا يغيّر ما يراه صاحبُ المنصّة أو طلابُه فوراً، فثلاثةُ
 * مبادئ في الواجهة:
 *
 *   ــ **لا حفظَ صامت**: كلُّ تغييرٍ يقول «تمّ» أو يقول لماذا لم يتمّ.
 *   ــ **الخطِرُ يُقاوم**: الإيقافُ يطلب سبباً يُعرض لصاحب المنصّة،
 *      والأرشفةُ تطلب كتابةَ معرّف المنصّة بيدك — لا نافذةَ «متأكّد؟»
 *      تُضغط بلا قراءة.
 *   ــ **الأثرُ مكتوبٌ قبل الفعل**: تحت كلّ مجموعةٍ سطرٌ يقول ماذا يقع
 *      عند الطالب وماذا يقع عند المشرف.
 */

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import type { HideableSection, Tenant, TenantFeature, TenantStatus } from "@/lib/hub/types";
import { STATUS_LABEL } from "@/components/hub/status-pill";

type Section = { key: HideableSection; label: string; hint: string };
type Feature = { key: TenantFeature; label: string; hint: string };

export function TenantControls({
  tenant,
  sections,
  features,
}: {
  tenant: Tenant;
  sections: Section[];
  features: Feature[];
}) {
  const router = useRouter();
  const [pending, start] = useTransition();
  const [busy, setBusy] = useState<string | null>(null);
  const [note, setNote] = useState<{ kind: "ok" | "err"; text: string } | null>(null);

  const [hidden, setHidden] = useState<Set<string>>(new Set(tenant.hiddenSections));
  const [off, setOff] = useState<Set<string>>(
    new Set(Object.entries(tenant.features ?? {}).filter(([, v]) => v === false).map(([k]) => k))
  );
  const [reason, setReason] = useState(tenant.suspendReason ?? "");
  const [confirm, setConfirm] = useState("");
  const [limits, setLimits] = useState(tenant.limits);
  const [notes, setNotes] = useState(tenant.notes ?? "");

  const send = async (action: string, payload: Record<string, unknown>, label: string) => {
    setBusy(action);
    setNote(null);
    try {
      const res = await fetch("/api/hub/tenants", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id: tenant.id, action, ...payload }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        setNote({ kind: "err", text: data.error ?? "تعذّر الحفظ" });
        return false;
      }
      setNote({ kind: "ok", text: `${label} — تمّ` });
      start(() => router.refresh());
      return true;
    } catch {
      setNote({ kind: "err", text: "تعذّر الاتصال بالخادم" });
      return false;
    } finally {
      setBusy(null);
    }
  };

  const toggle = (set: Set<string>, key: string) => {
    const next = new Set(set);
    next.has(key) ? next.delete(key) : next.add(key);
    return next;
  };

  const saveFeatures = () => {
    /* تُرسل الميزاتُ كلُّها صراحةً — المطفأةُ `false` والباقيةُ `true`،
       فلا يبقى مفتاحٌ غامضٌ معناه «لم يُذكر». */
    const map: Record<string, boolean> = {};
    for (const f of features) map[f.key] = !off.has(f.key);
    return send("features", { features: map }, "الميزات");
  };

  const working = (k: string) => busy === k || pending;

  return (
    <div className="space-y-5">
      {note && (
        <p
          role="status"
          className={`rounded-xl px-3 py-2 text-[12px] font-bold ${
            note.kind === "ok" ? "bg-emerald-500/10 text-emerald-700" : "bg-rose-500/10 text-rose-600"
          }`}
        >
          {note.text}
        </p>
      )}

      {/* ــــ الحالة ــــ */}
      <Box title="حالة المنصّة" hint="الموقوفةُ يقرأها صاحبُها ولا يكتب، ويرى طلابُها صفحةَ توقّف.">
        <div className="flex flex-wrap items-center gap-2">
          {(["active", "suspended", "expired"] as TenantStatus[]).map((s) => (
            <button
              key={s}
              type="button"
              disabled={working("status") || tenant.status === s}
              onClick={() => send("status", { status: s, reason }, `الحالة: ${STATUS_LABEL[s]}`)}
              className={`rounded-full px-4 py-2 text-[12px] font-bold transition disabled:opacity-45 ${
                tenant.status === s ? "bg-[#1b2a4a] text-white" : "border border-black/12 bg-white hover:border-black/25"
              }`}
            >
              {STATUS_LABEL[s]}
            </button>
          ))}
        </div>
        <label className="lbl mt-3">سبب الإيقاف (يُعرض لصاحب المنصّة)</label>
        <input
          value={reason}
          onChange={(e) => setReason(e.target.value)}
          maxLength={300}
          placeholder="مثال: لم يصل تجديد الاشتراك لهذا الشهر"
          className="inp w-full"
        />
      </Box>

      {/* ــــ الأقسام ــــ */}
      <Box
        title="الأقسام الظاهرة في لوحة صاحب المنصّة"
        hint="القسمُ المخفيّ يختفي من قائمته، ويُرفض تعديلُ بياناته حتى لو أُرسل المسارُ يدوياً. والميزةُ نفسُها تبقى تعمل لطلابه."
      >
        <div className="grid gap-1.5 sm:grid-cols-2">
          {sections.map((s) => {
            const isHidden = hidden.has(s.key);
            return (
              <label
                key={s.key}
                className={`flex cursor-pointer items-start gap-2.5 rounded-xl border p-2.5 transition ${
                  isHidden ? "border-rose-300/70 bg-rose-500/[0.06]" : "border-black/[0.08] bg-white hover:border-black/20"
                }`}
              >
                <input
                  type="checkbox"
                  checked={!isHidden}
                  onChange={() => setHidden(toggle(hidden, s.key))}
                  className="mt-0.5 size-4 accent-[#1b2a4a]"
                />
                <span className="min-w-0">
                  <b className="block text-[12.5px]">{s.label}</b>
                  <span className="block text-[11px] leading-relaxed text-muted-foreground">{s.hint}</span>
                </span>
              </label>
            );
          })}
        </div>
        <Save
          busy={working("sections")}
          onClick={() => send("sections", { hiddenSections: [...hidden] }, "الأقسام")}
          count={hidden.size}
          countLabel="قسم مخفيّ"
        />
      </Box>

      {/* ــــ الميزات ــــ */}
      <Box
        title="الميزات المفعّلة"
        hint="الميزةُ المطفأة تُغلق مساراتِها للجميع — للطالب وللمشرف — وتردّ ٤٠٣ برسالة «غير مفعّلة في خطّتك»."
      >
        <div className="grid gap-1.5 sm:grid-cols-2">
          {features.map((f) => {
            const isOff = off.has(f.key);
            return (
              <label
                key={f.key}
                className={`flex cursor-pointer items-start gap-2.5 rounded-xl border p-2.5 transition ${
                  isOff ? "border-rose-300/70 bg-rose-500/[0.06]" : "border-black/[0.08] bg-white hover:border-black/20"
                }`}
              >
                <input
                  type="checkbox"
                  checked={!isOff}
                  onChange={() => setOff(toggle(off, f.key))}
                  className="mt-0.5 size-4 accent-[#1b2a4a]"
                />
                <span className="min-w-0">
                  <b className="block text-[12.5px]">{f.label}</b>
                  <span className="block text-[11px] leading-relaxed text-muted-foreground">{f.hint}</span>
                </span>
              </label>
            );
          })}
        </div>
        <Save busy={working("features")} onClick={saveFeatures} count={off.size} countLabel="ميزة مطفأة" />
      </Box>

      {/* ــــ الحدود ــــ */}
      <Box title="حدود المنصّة" hint="الفراغُ = بلا حدّ. تُفرض على الخادم عند الإضافة، فلا تُتجاوز من الواجهة.">
        <div className="grid gap-3 sm:grid-cols-2">
          {([
            ["maxStudents", "أقصى عدد طلاب"],
            ["maxSubjects", "أقصى عدد كورسات"],
            ["maxAdmins", "أقصى عدد مشرفين"],
            ["maxStorageMB", "مساحة الملفّات (ميجابايت)"],
          ] as const).map(([key, label]) => (
            <span key={key}>
              <label className="lbl" htmlFor={`lim-${key}`}>{label}</label>
              <input
                id={`lim-${key}`}
                type="number"
                min={0}
                dir="ltr"
                value={limits[key] ?? ""}
                onChange={(e) => setLimits({ ...limits, [key]: e.target.value === "" ? null : Number(e.target.value) })}
                placeholder="بلا حدّ"
                className="inp w-full"
              />
            </span>
          ))}
        </div>
        <label className="mt-3 flex cursor-pointer items-center gap-2 text-[12.5px]">
          <input
            type="checkbox"
            checked={limits.customDomain}
            onChange={(e) => setLimits({ ...limits, customDomain: e.target.checked })}
            className="size-4 accent-[#1b2a4a]"
          />
          يسمح بربط دومين مخصّص
        </label>
        <Save busy={working("limits")} onClick={() => send("limits", { limits }, "الحدود")} />
      </Box>

      {/* ــــ ملاحظات ــــ */}
      <Box title="ملاحظات داخلية" hint="لا يراها صاحبُ المنصّة — للتوثيق بينكم فقط.">
        <textarea
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
          rows={3}
          maxLength={2000}
          className="inp w-full"
          placeholder="اتّفاق خاص، تاريخ مكالمة، سبب استثناء…"
        />
        <Save busy={working("notes")} onClick={() => send("notes", { notes }, "الملاحظات")} />
      </Box>

      {/* ــــ الأرشفة ــــ */}
      <Box
        title="أرشفة المنصّة"
        hint="المؤرشفةُ تختفي كلّياً: عنوانُها يردّ ٤٠٤ للجميع. بياناتُها تبقى في القاعدة، لكن لا شيءَ يُخدم منها."
        danger
      >
        <label className="lbl">اكتب معرّف المنصّة للتأكيد</label>
        <input
          value={confirm}
          onChange={(e) => setConfirm(e.target.value)}
          dir="ltr"
          placeholder={tenant.slug}
          className="inp w-full"
        />
        <button
          type="button"
          disabled={working("archive") || confirm !== tenant.slug}
          onClick={() => send("status", { status: "archived", confirm }, "الأرشفة")}
          className="mt-3 rounded-full bg-rose-600 px-4 py-2 text-[12px] font-bold text-white transition disabled:opacity-40"
        >
          أرشفة نهائية
        </button>
      </Box>
    </div>
  );
}

function Box({
  title, hint, children, danger = false,
}: {
  title: string; hint: string; children: React.ReactNode; danger?: boolean;
}) {
  return (
    <section className={`rounded-2xl border bg-white p-4 ${danger ? "border-rose-300/60" : "border-black/[0.07]"}`}>
      <h3 className="font-display text-[15px] font-bold">{title}</h3>
      <p className="mb-3 mt-1 text-[11.5px] leading-relaxed text-muted-foreground">{hint}</p>
      {children}
    </section>
  );
}

function Save({
  busy, onClick, count, countLabel,
}: {
  busy: boolean; onClick: () => void; count?: number; countLabel?: string;
}) {
  return (
    <div className="mt-3 flex items-center gap-3">
      <button
        type="button"
        disabled={busy}
        onClick={onClick}
        className="rounded-full bg-[#1b2a4a] px-4 py-2 text-[12px] font-bold text-white transition disabled:opacity-50"
      >
        {busy ? "جارٍ الحفظ…" : "حفظ"}
      </button>
      {count !== undefined && count > 0 && (
        <span className="font-kufi text-[11px] text-muted-foreground">{count} {countLabel}</span>
      )}
    </div>
  );
}
