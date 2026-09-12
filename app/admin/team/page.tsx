"use client";

import { useCallback, useEffect, useState } from "react";
import { PERMS, DEFAULT_PERMS, type AdminPerm } from "@/lib/auth/perms";
import {
  IconShield, IconPlus, IconClose, IconCheckCircle, IconSpinner, IconXCircle, IconPhone, IconTrophy,
} from "@/components/brand/icons";

/**
 * المشرفون — إضافة بريد كمشرف وتحديد صلاحياته بدقّة.
 * القسم كلّه محجوز لمالكة المنصّة (يُفحص على الخادم أيضاً).
 */

type Admin = {
  id: string;
  name: string;
  username: string;
  active: boolean;
  owner: boolean;
  adminPerms: AdminPerm[];
  deviceLabel?: string;
  deviceBoundAt?: string;
  hasDevice: boolean;
  createdAt: string;
};

export default function TeamPage() {
  const [admins, setAdmins] = useState<Admin[]>([]);
  const [meId, setMeId] = useState("");
  const [loading, setLoading] = useState(true);
  const [denied, setDenied] = useState(false);
  const [busy, setBusy] = useState<string | null>(null);
  const [note, setNote] = useState<{ kind: "ok" | "err"; text: string } | null>(null);

  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({ name: "", username: "", password: "", perms: DEFAULT_PERMS as AdminPerm[] });

  const load = useCallback(async () => {
    setLoading(true);
    const res = await fetch("/api/admins");
    if (res.status === 403 || res.status === 401) { setDenied(true); setLoading(false); return; }
    const data = await res.json();
    setAdmins(data.admins ?? []);
    setMeId(data.me ?? "");
    setLoading(false);
  }, []);

  useEffect(() => { void load(); }, [load]);

  const say = (kind: "ok" | "err", text: string) => {
    setNote({ kind, text });
    setTimeout(() => setNote(null), 4000);
  };

  const add = async () => {
    setBusy("add");
    const res = await fetch("/api/admins", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(form),
    });
    const data = await res.json();
    setBusy(null);
    if (!res.ok) { say("err", data.error ?? "تعذّرت الإضافة"); return; }
    say("ok", `أُضيف ${form.name} كمشرف`);
    setForm({ name: "", username: "", password: "", perms: DEFAULT_PERMS });
    setShowForm(false);
    void load();
  };

  const patch = async (id: string, body: Record<string, unknown>, msg: string) => {
    setBusy(id);
    const res = await fetch("/api/admins", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id, ...body }),
    });
    const data = await res.json();
    setBusy(null);
    if (!res.ok) { say("err", data.error ?? "تعذّر التعديل"); return; }
    say("ok", msg);
    void load();
  };

  const remove = async (a: Admin) => {
    if (!confirm(`حذف المشرف «${a.name}» نهائياً؟`)) return;
    setBusy(a.id);
    const res = await fetch(`/api/admins?id=${encodeURIComponent(a.id)}`, { method: "DELETE" });
    const data = await res.json();
    setBusy(null);
    if (!res.ok) { say("err", data.error ?? "تعذّر الحذف"); return; }
    say("ok", "حُذف المشرف");
    void load();
  };

  /**
   * نقل الملكية — خطوة لا رجعة فيها، لذا تأكيد بكتابة اسم المشرف.
   */
  const transfer = async (a: Admin) => {
    const typed = prompt(
      `نقل ملكية المنصّة إلى «${a.name}»؟\n\n` +
        `بعدها يملك كل شيء — بما فيه سحب صلاحياتك — ولن تستردّيها إلا بموافقته.\n` +
        `أنتِ ستبقين مشرفة بكل الصلاحيات عدا إدارة المشرفين.\n\n` +
        `للتأكيد اكتبي اسمه بالضبط:`
    );
    if (typed === null) return;
    if (typed.trim() !== a.name.trim()) { say("err", "الاسم غير مطابق — أُلغي النقل"); return; }
    await patch(a.id, { transferOwner: true }, `أصبح ${a.name} مالك المنصّة`);
  };

  const togglePerm = (a: Admin, perm: AdminPerm) => {
    const next = a.adminPerms.includes(perm)
      ? a.adminPerms.filter((p) => p !== perm)
      : [...a.adminPerms, perm];
    void patch(a.id, { perms: next }, "حُدّثت الصلاحيات");
  };

  if (denied) {
    return (
      <div className="glass rounded-3xl p-8 text-center">
        <IconShield className="mx-auto size-10 text-muted-foreground" />
        <p className="mt-3 font-display text-lg font-extrabold">هذا القسم لمالكة المنصّة</p>
        <p className="mt-1 text-sm text-muted-foreground">إدارة المشرفين وصلاحياتهم متاحة لحساب المالكة وحده.</p>
      </div>
    );
  }

  return (
    <div className="space-y-5">
      <header className="flex flex-wrap items-center gap-3" data-reveal="down" data-reveal-duration="fast">
        <span className="grid size-11 shrink-0 place-items-center rounded-2xl bg-primary/12 text-primary">
          <IconShield className="size-5" />
        </span>
        <div className="min-w-0 flex-1">
          <h1 className="font-display text-lg font-extrabold sm:text-xl">المشرفون</h1>
          <p className="text-xs text-muted-foreground">أضيفي بريداً كمشرف وحدّدي بدقّة ما يراه ويعدّله.</p>
        </div>
        <button
          onClick={() => setShowForm((v) => !v)}
          className="inline-flex w-full items-center justify-center gap-2 rounded-full btn-glow px-5 py-2.5 text-[13px] font-bold text-white sm:w-auto sm:text-sm"
        >
          {showForm ? <IconClose className="size-4" /> : <IconPlus className="size-4" />}
          {showForm ? "إلغاء" : "إضافة مشرف"}
        </button>
      </header>

      {note && (
        <p className={`rounded-2xl px-4 py-2.5 text-sm font-bold ${note.kind === "ok" ? "bg-emerald-500/12 text-emerald-600" : "bg-rose-500/12 text-rose-600"}`}>
          {note.text}
        </p>
      )}

      {showForm && (
        <section className="glass space-y-4 rounded-3xl p-4 sm:p-5" data-reveal="stretch" data-reveal-duration="fast">
          <div className="grid gap-3 sm:grid-cols-3">
            <Field label="الاسم" value={form.name} onChange={(v) => setForm({ ...form, name: v })} placeholder="اسم المشرف" />
            <Field label="البريد الإلكتروني" value={form.username} onChange={(v) => setForm({ ...form, username: v })} placeholder="name@example.com" type="email" />
            <Field label="كلمة المرور" value={form.password} onChange={(v) => setForm({ ...form, password: v })} placeholder="٨ أحرف على الأقل مع رقم" type="password" />
          </div>

          <div>
            <p className="mb-2 text-xs font-bold text-muted-foreground">الصلاحيات</p>
            <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
              {PERMS.filter((p) => p.key !== "team").map((p) => {
                const on = form.perms.includes(p.key);
                return (
                  <button
                    key={p.key}
                    type="button"
                    onClick={() =>
                      setForm({
                        ...form,
                        perms: on ? form.perms.filter((x) => x !== p.key) : [...form.perms, p.key],
                      })
                    }
                    className={`rounded-2xl border p-3 text-right transition ${
                      on ? "border-primary/40 bg-primary/8" : "border-border hover:border-primary/30"
                    }`}
                  >
                    <span className="flex items-center gap-2 text-sm font-bold">
                      <span className={`grid size-4 shrink-0 place-items-center rounded-md border ${on ? "border-primary bg-primary text-white" : "border-border"}`}>
                        {on && <IconCheckCircle className="size-3" />}
                      </span>
                      {p.label}
                    </span>
                    <span className="mt-1 block text-[11px] leading-snug text-muted-foreground">{p.hint}</span>
                  </button>
                );
              })}
            </div>
          </div>

          <button
            onClick={add}
            disabled={busy === "add"}
            className="inline-flex w-full items-center justify-center gap-2 rounded-full btn-glow px-5 py-2.5 text-sm font-bold text-white disabled:opacity-60 sm:w-auto"
          >
            {busy === "add" ? <IconSpinner className="size-4 animate-spin" /> : <IconPlus className="size-4" />}
            إضافة المشرف
          </button>
        </section>
      )}

      {loading ? (
        <p className="text-sm text-muted-foreground">جارٍ التحميل…</p>
      ) : (
        <div className="space-y-4" data-reveal-group>
          {admins.map((a) => (
            <section key={a.id} className="glass rounded-3xl p-4 sm:p-5" data-reveal="up">
              <div className="flex flex-wrap items-center gap-3">
                <span className="grid size-11 shrink-0 place-items-center rounded-2xl btn-glow text-sm font-bold text-white">
                  {a.name.charAt(0)}
                </span>
                <div className="min-w-0 flex-1">
                  <p className="flex flex-wrap items-center gap-2 font-display font-extrabold">
                    {a.name}
                    {a.owner && <span className="rounded-full bg-amber-500/15 px-2 py-0.5 text-[10px] font-bold text-amber-600">المالكة</span>}
                    {a.id === meId && <span className="rounded-full bg-primary/12 px-2 py-0.5 text-[10px] font-bold text-primary">أنتِ</span>}
                    {!a.active && <span className="rounded-full bg-rose-500/12 px-2 py-0.5 text-[10px] font-bold text-rose-600">موقوف</span>}
                  </p>
                  <p className="truncate text-xs text-muted-foreground">{a.username}</p>
                  <p className="mt-0.5 flex items-center gap-1 text-[11px] text-muted-foreground">
                    <IconPhone className="size-3.5" />
                    {a.hasDevice ? `مرتبط بـ ${a.deviceLabel ?? "جهاز"}` : "لم يُربط بجهاز بعد"}
                  </p>
                </div>

                <div className="flex w-full flex-wrap gap-2 sm:w-auto">
                  {a.hasDevice && (
                    <button
                      onClick={() => patch(a.id, { resetDevice: true }, "فُكّ الارتباط — أوّل دخول تالٍ يربط الحساب بالجهاز الجديد")}
                      disabled={busy === a.id}
                      className="inline-flex flex-1 items-center justify-center gap-1.5 rounded-full border border-border px-3.5 py-2 text-xs font-bold transition hover:border-primary/40 disabled:opacity-60 sm:flex-none"
                    >
                      <IconPhone className="size-3.5" /> نقل لجهاز جديد
                    </button>
                  )}
                  {!a.owner && (
                    <>
                      <button
                        onClick={() => patch(a.id, { active: !a.active }, a.active ? "أُوقف المشرف" : "أُعيد تفعيله")}
                        disabled={busy === a.id}
                        className="inline-flex flex-1 items-center justify-center rounded-full border border-border px-3.5 py-2 text-xs font-bold transition hover:border-primary/40 disabled:opacity-60 sm:flex-none"
                      >
                        {a.active ? "إيقاف" : "تفعيل"}
                      </button>
                      <button
                        onClick={() => transfer(a)}
                        disabled={busy === a.id}
                        title="نقل ملكية المنصّة إلى هذا الحساب"
                        className="inline-flex flex-1 items-center justify-center gap-1.5 rounded-full border border-amber-500/40 px-3.5 py-2 text-xs font-bold text-amber-600 transition hover:bg-amber-500/8 disabled:opacity-60 sm:flex-none"
                      >
                        <IconTrophy className="size-3.5" /> نقل الملكية
                      </button>
                      <button
                        onClick={() => remove(a)}
                        disabled={busy === a.id}
                        className="inline-flex flex-1 items-center justify-center gap-1.5 rounded-full border border-rose-500/30 px-3.5 py-2 text-xs font-bold text-rose-600 transition hover:bg-rose-500/8 disabled:opacity-60 sm:flex-none"
                      >
                        <IconXCircle className="size-3.5" /> حذف
                      </button>
                    </>
                  )}
                </div>
              </div>

              <div className="mt-4 border-t border-border pt-3">
                <p className="mb-2 text-xs font-bold text-muted-foreground">
                  {a.owner ? "تملك كل الصلاحيات ولا يمكن تعديلها" : "اضغطي على الصلاحية لمنحها أو سحبها"}
                </p>
                <div className="flex flex-wrap gap-1.5">
                  {PERMS.filter((p) => p.key !== "team" || a.owner).map((p) => {
                    const on = a.owner || a.adminPerms.includes(p.key);
                    return (
                      <button
                        key={p.key}
                        type="button"
                        disabled={a.owner || busy === a.id}
                        onClick={() => togglePerm(a, p.key)}
                        title={p.hint}
                        className={`rounded-full px-3 py-1.5 text-[11px] font-bold transition disabled:cursor-default ${
                          on
                            ? "bg-primary/12 text-primary ring-1 ring-primary/25"
                            : "border border-border text-muted-foreground hover:border-primary/30"
                        }`}
                      >
                        {p.label}
                      </button>
                    );
                  })}
                </div>
              </div>
            </section>
          ))}
        </div>
      )}
    </div>
  );
}

function Field({
  label, value, onChange, placeholder, type = "text",
}: {
  label: string; value: string; onChange: (v: string) => void; placeholder?: string; type?: string;
}) {
  return (
    <label className="block">
      <span className="mb-1 block text-xs font-bold text-muted-foreground">{label}</span>
      <input
        type={type}
        value={value}
        placeholder={placeholder}
        onChange={(e) => onChange(e.target.value)}
        className="w-full rounded-2xl border border-border bg-card/60 px-4 py-2.5 text-sm outline-none transition focus:border-primary/50"
      />
    </label>
  );
}
