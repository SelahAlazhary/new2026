"use client";

import { useState } from "react";
import Link from "next/link";
import { UserPlus, Loader2, CheckCircle2, Eye, EyeOff } from "lucide-react";
import { AuthShell, inputCls } from "@/components/auth/auth-shell";
import { useContent } from "@/components/content/content-provider";
import {
  EGYPT_GOVERNORATES, TRACKS, STAGES, TRACK_STAGE,
  EDU_SYSTEMS, AZHAR, BRANCH_TRACK, SCIENCE_BRANCHES, gradeInStage } from "@/lib/utils/data";
import { showsTrack, showsBranch, signupProblem, normalizePhone } from "@/lib/business/signup-rules";
import { useMaintGate } from "@/components/brand/maint-gate";

export default function RegisterPage() {
  /* بوّابةُ الصيانة — المشرفون يمرّون والطلاب يرون اللوح. */
  const maintGate = useMaintGate("register");

  const { db, content } = useContent();
  const grades = db?.grades ?? [];
  const [form, setForm] = useState({ name: "", username: "", password: "", phone: "", eduSystem: EDU_SYSTEMS.length === 1 ? EDU_SYSTEMS[0] : "", stage: "", grade: "", track: "", branch: "", gender: "", school: "", governorate: "" });
  const [confirm, setConfirm] = useState("");
  const [showPass, setShowPass] = useState(false);
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState<string | null>(null);
  const [done, setDone] = useState(false);

  const set = (k: string, v: string) => setForm((f) => ({ ...f, [k]: v }));

  /* الفصول تُدار من اللوحة، فقد لا تكون هناك فصول أصلاً — عندها لا يظهر
     الحقل ولا يُطلب، فلا يتعطّل التسجيل على منصّة لم تُعرّف فصولها بعد. */
  const terms = content.terms ?? [];

  const needsTrack = showsTrack(form);
  const needsBranch = showsBranch(form);

  /* أي تغيير في الأعلى يمسح ما تحته — فلا تُرسل شعبة لمرحلة بلا شعب،
     ولا فرع علمي لنظام أزهري أو لشعبة أدبية. */
  const setEduSystem = (v: string) =>
    setForm((f) => ({ ...f, eduSystem: v, branch: v === AZHAR ? "" : f.branch }));

  const setStage = (v: string) =>
    setForm((f) => ({
      ...f,
      stage: v,
      /*
        والصفُّ يُمحى إن لم يعد من المرحلة الجديدة.
        وإلّا بقي «الأول الإعدادي» تحت مرحلةٍ «ثانوية» لأنّه اختير قبل
        تبديلها — فيُسجَّل تركيبٌ لا وجودَ له، ولا يُكشف إلّا بعد أشهرٍ حين
        تقول لوحةُ الخطط «لا يطابقها أحد» ولا يُفهم لماذا.
      */
      ...(gradeInStage(f.grade, v) ? {} : { grade: "" }),
      ...(v === TRACK_STAGE ? {} : { track: "", branch: "" }),
    }));

  const setTrack = (v: string) =>
    setForm((f) => ({ ...f, track: v, branch: v === BRANCH_TRACK ? f.branch : "" }));

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErr(null);
    if (!form.username.trim()) { setErr("البريد الإلكتروني مطلوب"); return; }
    if (!form.password) { setErr("كلمة المرور مطلوبة"); return; }
    if (form.password !== confirm) { setErr("كلمتا المرور غير متطابقتين"); return; }
    // نفس القواعد التي يفرضها الخادم — مصدرها ملف واحد فلا يختلفان
    const problem = signupProblem(
      { ...form, grade: form.grade || grades[0]?.name },
      grades.map((g) => g.name),
      terms
    );
    if (problem) { setErr(problem); return; }
    setBusy(true);
    const res = await fetch("/api/users", {
      method: "POST", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        ...form,
        phone: normalizePhone(form.phone),
        grade: form.grade || grades[0]?.name,
        track: needsTrack ? form.track : "",
        branch: needsBranch ? form.branch : "",
      }),
    });
    const data = await res.json();
    setBusy(false);
    if (!res.ok) { setErr(data.error || "تعذّر إنشاء الحساب"); return; }
    setDone(true);
  };

  if (done) {
    return (
      <AuthShell title="تم إنشاء الحساب" subtitle="خطوة أخيرة قبل البدء"
        footer={<Link href="/login" className="font-bold text-primary">الذهاب لتسجيل الدخول</Link>}>
        <div className="flex flex-col items-center gap-3 rounded-2xl border border-emerald-500/30 bg-emerald-500/10 p-6 text-center">
          <CheckCircle2 className="size-12 text-emerald-500" />
          <p className="font-display text-lg font-extrabold">تم إنشاء حسابك بنجاح</p>
          <p className="text-sm text-muted-foreground">يمكنك تسجيل الدخول الآن مباشرة. لفتح أي كورس، اشترِ كوده وفعّله من داخل حسابك.</p>
        </div>
      </AuthShell>
    );
  }

  if (maintGate) return maintGate;

  return (
    <AuthShell
      title="إنشاء حساب طالب"
      subtitle="سجّل بياناتك للبدء في دراسة اللغة العربية"
      footer={<>لديك حساب بالفعل؟ <Link href="/login" className="font-bold text-primary">تسجيل الدخول</Link></>}
    >
      <form onSubmit={submit} className="grid gap-3">
        <Field label="الاسم الكامل"><input required className={inputCls} value={form.name} onChange={(e) => set("name", e.target.value)} /></Field>
        <div className="grid grid-cols-2 gap-3">
          <Field label="البريد الإلكتروني"><input type="email" required dir="ltr" className={`${inputCls} text-right`} value={form.username} onChange={(e) => set("username", e.target.value)} placeholder="you@example.com" /></Field>
          <Field label="كلمة المرور">
            <PasswordInput
              value={form.password}
              onChange={(v) => set("password", v)}
              show={showPass}
              onToggle={() => setShowPass((v) => !v)}
              autoComplete="new-password"
            />
          </Field>
        </div>
        <Field label="تأكيد كلمة المرور">
          <PasswordInput
            value={confirm}
            onChange={setConfirm}
            show={showPass}
            onToggle={() => setShowPass((v) => !v)}
            autoComplete="new-password"
          />
          {/* تنبيه فوري بمجرّد الكتابة — لا ينتظر الضغط على «إنشاء الحساب» */}
          {confirm.length > 0 && confirm !== form.password && (
            <span className="mt-1 block text-[11px] font-bold text-rose-500">كلمتا المرور غير متطابقتين</span>
          )}
          {confirm.length > 0 && confirm === form.password && (
            <span className="mt-1 block text-[11px] font-bold text-emerald-600">متطابقتان</span>
          )}
        </Field>
        <div className="grid grid-cols-2 gap-3">
          <Field label="رقم الموبايل">
            <input
              required
              inputMode="numeric"
              dir="ltr"
              maxLength={11}
              placeholder="01xxxxxxxxx"
              className={`${inputCls} text-right`}
              value={form.phone}
              /* أرقام فقط وبحدّ ١١ خانة — يمنع الخطأ قبل وقوعه */
              onChange={(e) => set("phone", normalizePhone(e.target.value).slice(0, 11))}
            />
          </Field>
          {/*
            النظامُ التعليميّ لا يُسأل عنه إن كان واحداً.
            المنصّةُ أزهريّةٌ خالصة، وسؤالُ الطالب «اختر النظام» ثمّ عرضُ
            خيارٍ واحدٍ لا يُفيده شيئاً — بل يوهمه أنّ ثمّة بديلاً. فيُضبط
            تلقائياً ويُخفى الحقل. ولو عادت الأنظمةُ أكثرَ من واحد عاد
            الحقلُ من نفسه بلا تعديل.
          */}
          {EDU_SYSTEMS.length > 1 && (
            <Field label="النظام التعليمي">
              <select required className={inputCls} value={form.eduSystem} onChange={(e) => setEduSystem(e.target.value)}>
                <option value="">اختر النظام…</option>
                {EDU_SYSTEMS.map((sy) => <option key={sy} value={sy}>{sy}</option>)}
              </select>
            </Field>
          )}
        </div>
        <div className="grid grid-cols-2 gap-3">
          <Field label="المرحلة الدراسية">
            <select required className={inputCls} value={form.stage} onChange={(e) => setStage(e.target.value)}>
              <option value="">اختر المرحلة…</option>
              {STAGES.map((st) => <option key={st} value={st}>{st}</option>)}
            </select>
          </Field>
        </div>
        {/* الصف — ومعه الشعبة إن كانت المرحلة ثانوية، وإلا يتمدّد الصف وحده */}
        <div className={`grid gap-3 ${needsTrack ? "grid-cols-2" : ""}`}>
          <Field label="الصف الدراسي">
            <select required className={inputCls} value={form.grade} onChange={(e) => set("grade", e.target.value)}>
              <option value="">اختر الصف الدراسي…</option>
              {/* صفوفُ المرحلة المختارة وحدَها — والكلُّ قبل أن تُختار */}
              {grades.filter((g) => gradeInStage(g.name, form.stage)).map((g) => <option key={g.id} value={g.name}>{g.name}</option>)}
            </select>
          </Field>
          {needsTrack && (
            <Field label="الشعبة">
              <select required className={inputCls} value={form.track} onChange={(e) => setTrack(e.target.value)}>
                <option value="">اختر الشعبة…</option>
                {TRACKS.map((t) => <option key={t} value={t}>{t}</option>)}
              </select>
            </Field>
          )}
          {/* فرع الشعبة العلمية — لا يظهر للأزهر ولا للشعبة الأدبية */}
          {needsBranch && (
            <Field label="فرع الشعبة العلمية">
              <select required className={inputCls} value={form.branch} onChange={(e) => set("branch", e.target.value)}>
                <option value="">اختر الفرع…</option>
                {SCIENCE_BRANCHES.map((b) => <option key={b} value={b}>{b}</option>)}
              </select>
            </Field>
          )}
        </div>
        <div className="grid grid-cols-2 gap-3">
          <Field label="المحافظة">
            <select required className={inputCls} value={form.governorate} onChange={(e) => set("governorate", e.target.value)}>
              <option value="">اختر المحافظة…</option>
              {EGYPT_GOVERNORATES.map((g) => <option key={g} value={g}>{g}</option>)}
            </select>
          </Field>
          <Field label="النوع">
            <select required className={inputCls} value={form.gender} onChange={(e) => set("gender", e.target.value)}>
              <option value="">اختر النوع…</option>
              <option value="male">ذكر</option>
              <option value="female">أنثى</option>
            </select>
          </Field>
        </div>
        <Field label="اسم المدرسة"><input required className={inputCls} value={form.school} onChange={(e) => set("school", e.target.value)} /></Field>
        <p className="text-[11px] text-muted-foreground">كل الحقول مطلوبة.</p>
        {err && <p className="rounded-2xl bg-rose-500/10 px-3 py-2 text-xs font-bold text-rose-500">{err}</p>}
        <button type="submit" disabled={busy} className="mt-2 inline-flex items-center justify-center gap-2 rounded-2xl btn-glow py-3 text-sm font-bold text-white disabled:opacity-60">
          {busy ? <Loader2 className="size-4 animate-spin" /> : <UserPlus className="size-4" />} إنشاء الحساب
        </button>
      </form>
    </AuthShell>
  );
}

/** كل الحقول إجبارية، فالنجمة تظهر على كلٍّ منها. */
function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label className="block">
      <span className="mb-1 block text-xs font-semibold text-muted-foreground">
        {label} <span className="text-rose-500">*</span>
      </span>
      {children}
    </label>
  );
}

/**
 * حقل كلمة مرور بزرّ معاينة.
 * الزرّ داخل الحقل لا بجانبه، فلا يزحزح التخطيط عند ظهوره، ومقاسه
 * ٤٤px على اللمس ليبقى هدفاً مريحاً. `aria-pressed` يخبر قارئ الشاشة
 * بحالة الإظهار، والزرّ خارج تسلسل التبويب حتى لا يعترض تنقّل الكيبورد
 * بين الحقول.
 */
function PasswordInput({
  value,
  onChange,
  show,
  onToggle,
  autoComplete,
}: {
  value: string;
  onChange: (v: string) => void;
  show: boolean;
  onToggle: () => void;
  autoComplete?: string;
}) {
  return (
    <span className="relative block">
      <input
        type={show ? "text" : "password"}
        required
        autoComplete={autoComplete}
        className={`${inputCls} pl-11`}
        value={value}
        onChange={(e) => onChange(e.target.value)}
      />
      <button
        type="button"
        tabIndex={-1}
        onClick={onToggle}
        aria-pressed={show}
        aria-label={show ? "إخفاء كلمة المرور" : "إظهار كلمة المرور"}
        title={show ? "إخفاء كلمة المرور" : "إظهار كلمة المرور"}
        className="absolute inset-y-0 left-0 grid w-11 place-items-center text-muted-foreground transition hover:text-primary"
      >
        {show ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
      </button>
    </span>
  );
}
