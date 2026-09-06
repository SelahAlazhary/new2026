"use client";

/**
 * رحلةُ إنشاء المنصّة — واجهةٌ واحدةٌ تقود المدرّسَ خطوةً خطوة.
 * ------------------------------------------------------------------
 * تقرأ حالتَها من `/api/start` وتستأنف من حيث وقف: من أغلق الصفحة في
 * منتصف الرحلة يعود فيجد اختياراتِه محفوظة. وكلُّ خطوةٍ تُحفظ في الخادم
 * فور إتمامها لا في آخر الرحلة — فلا يضيع شيء.
 */

import { useCallback, useEffect, useRef, useState } from "react";
import type { BrandPreset } from "@/lib/hub/presets";
import type { SaasPlan, Tenant } from "@/lib/hub/types";

type StartState = {
  owner: { name: string; email: string; picture?: string } | null;
  draft: Tenant | null;
  active: Tenant[];
  plans: SaasPlan[];
  planId: string | null;
};

const STEPS = ["name", "logo", "design", "domain", "review"] as const;
type Step = (typeof STEPS)[number];

export function OnboardingWizard({ devSignin, presets }: { devSignin: boolean; presets: BrandPreset[] }) {
  const [state, setState] = useState<StartState | null>(null);
  const [step, setStep] = useState<Step>("name");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [delivery, setDelivery] = useState<{ adminEmail: string; password: string | null; studentUrl: string; adminUrl: string } | null>(null);

  /* حقولُ التحرير */
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [slug, setSlug] = useState("");
  const [slugMsg, setSlugMsg] = useState<{ ok: boolean; text: string } | null>(null);
  const [logo, setLogo] = useState("");
  const [presetId, setPresetId] = useState("midad");
  const [colors, setColors] = useState({ primary: "#233b8b", gold: "#c99a3b", paper: "#fbf9f5" });
  const [domain, setDomain] = useState("");

  const load = useCallback(async () => {
    const res = await fetch("/api/start", { cache: "no-store" });
    const data: StartState = await res.json();
    setState(data);
    if (data.draft) {
      setName(data.draft.name ?? "");
      setDescription(data.draft.description ?? "");
      setSlug(data.draft.slug ?? "");
      setLogo(data.draft.logo ?? "");
      setPresetId(data.draft.brandPresetId ?? "midad");
      setColors(data.draft.brandColors ?? colors);
      setDomain(data.draft.customDomain ?? "");
      const s = data.draft.onboardingStep;
      if (STEPS.includes(s as Step)) setStep(s as Step);
    }
    return data;
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    load();
  }, [load]);

  /* استطلاعُ الموافقة: المسودّةُ المنتظِرة تُفحص كلَّ خمس ثوانٍ */
  const draft = state?.draft;
  const pending = draft?.status === "pending_approval";
  const poll = useRef<ReturnType<typeof setInterval> | null>(null);
  useEffect(() => {
    if (!pending) return;
    poll.current = setInterval(async () => {
      const data = await load();
      const mine = data.active.find((t) => t.id === draft?.id);
      if (mine?.status === "active") {
        if (poll.current) clearInterval(poll.current);
        await reveal(mine.id);
      }
    }, 5000);
    return () => { if (poll.current) clearInterval(poll.current); };
  }, [pending, draft?.id]); // eslint-disable-line react-hooks/exhaustive-deps

  const call = async (payload: Record<string, unknown>) => {
    setBusy(true);
    setError("");
    try {
      const res = await fetch("/api/start", {
        method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(payload),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) { setError(data.error ?? "تعذّر الحفظ"); return null; }
      return data;
    } catch {
      setError("تعذّر الاتصال بالخادم");
      return null;
    } finally {
      setBusy(false);
    }
  };

  const reveal = async (tenantId: string) => {
    const d = await call({ action: "reveal", tenantId });
    if (d?.ok) setDelivery({ adminEmail: d.adminEmail, password: d.password, studentUrl: d.studentUrl, adminUrl: d.adminUrl });
    await load();
  };

  const checkSlug = async (value: string) => {
    setSlug(value);
    setSlugMsg(null);
    if (value.length < 3) return;
    const d = await call({ action: "slug-check", slug: value });
    if (d) setSlugMsg({ ok: d.ok, text: d.ok ? "الرابط متاح ✓" : d.reason });
  };

  const pickPlan = async (planId: string) => {
    const d = await call({ action: "plan", planId });
    if (d?.ok) { await load(); setStep("name"); }
  };

  const saveStep = async (nextStep: Step | "submit", extra: Record<string, unknown>) => {
    const d = await call({ action: "save", step: nextStep === "submit" ? "review" : nextStep, ...extra });
    if (!d?.ok) return;
    if (nextStep === "submit") {
      const s = await call({ action: "submit" });
      if (s?.provisioned && s.result) {
        setDelivery({
          adminEmail: s.result.adminEmail, password: s.result.password,
          studentUrl: s.result.studentUrl, adminUrl: s.result.adminUrl,
        });
      }
      await load();
      return;
    }
    await load();
    setStep(nextStep);
  };

  const onLogo = (file: File) => {
    if (file.size > 2_000_000) { setError("الصورة كبيرة — أقصى ٢ ميجابايت"); return; }
    const reader = new FileReader();
    reader.onload = () => setLogo(String(reader.result));
    reader.readAsDataURL(file);
  };

  /* ============ العرض ============ */

  if (!state) return <Shell><p className="ob-loading">جارٍ التحميل…</p></Shell>;

  /* ١) غير مسجَّل → الدخول (جوجل أو بريد وكلمة مرور) */
  if (!state.owner) {
    return (
      <Shell>
        <Panel>
          <h1 className="ob-title">أنشئ منصّتك التعليمية</h1>
          <p className="ob-sub">ابدأ بتسجيل الدخول — بحساب جوجل أو بالبريد وكلمة المرور.</p>
          <a href="/api/hub/auth/google?next=/start" className="ob-google">
            <GoogleMark /> المتابعة بحساب جوجل
          </a>
          <div className="ob-or"><span>أو</span></div>
          <EmailAuth onDone={() => load()} />
          {devSignin && <DevSignin />}
        </Panel>
      </Shell>
    );
  }

  /* التسليم النهائيّ — بيانات الدخول (تُعرض مرّةً) */
  if (delivery) {
    return (
      <Shell>
        <Panel>
          <span className="ob-done-badge">تمّ إنشاء منصّتك 🎉</span>
          <h1 className="ob-title">منصّتك جاهزة</h1>
          <p className="ob-sub">احفظ بيانات الدخول الآن — كلمة المرور تُعرض هذه المرّة فقط.</p>
          <div className="ob-creds">
            <Cred label="رابط الطلاب" value={delivery.studentUrl} link />
            <Cred label="لوحة التحكّم" value={delivery.adminUrl} link />
            <Cred label="بريد الدخول" value={delivery.adminEmail} />
            <Cred label="كلمة المرور" value={delivery.password ?? "(احفظها من رسالة سابقة)"} mono />
          </div>
          <a href={delivery.adminUrl} className="ob-primary" target="_blank" rel="noreferrer">افتح لوحة منصّتك</a>
          <button type="button" className="ob-link" onClick={() => { setDelivery(null); load(); }}>العودة إلى منصّاتي</button>
        </Panel>
      </Shell>
    );
  }

  /* بانتظار الموافقة */
  if (pending) {
    return (
      <Shell>
        <Panel>
          <span className="ob-wait-spin" />
          <h1 className="ob-title">منصّتك قيد المراجعة</h1>
          <p className="ob-sub">
            راجعنا طلبك وسنفعّل منصّتك قريباً. تُحدَّث هذه الصفحة تلقائياً فور التفعيل،
            وستظهر بيانات الدخول هنا.
          </p>
          <OwnerBar owner={state.owner} />
        </Panel>
      </Shell>
    );
  }

  /* لا مسودّة → إمّا منصّات قائمة أو اختيار خطّة */
  if (!draft) {
    if (state.active.length) {
      return (
        <Shell>
          <Panel wide>
            <div className="ob-head-row">
              <div>
                <h1 className="ob-title">منصّاتي</h1>
                <p className="ob-sub">منصّاتك القائمة، أو أنشئ واحدة جديدة.</p>
              </div>
              <OwnerBar owner={state.owner} />
            </div>
            <ul className="ob-tenant-list">
              {state.active.map((t) => (
                <MyTenant key={t.id} t={t} onReveal={() => reveal(t.id)} />
              ))}
            </ul>
            <PlanGrid plans={state.plans} onPick={pickPlan} busy={busy} title="أنشئ منصّة جديدة" />
          </Panel>
        </Shell>
      );
    }
    return (
      <Shell>
        <Panel wide>
          <div className="ob-head-row">
            <div>
              <h1 className="ob-title">اختر خطّتك</h1>
              <p className="ob-sub">تبدأ بتجربة مجانية — بلا بطاقة بنكية.</p>
            </div>
            <OwnerBar owner={state.owner} />
          </div>
          {error && <p className="ob-error">{error}</p>}
          <PlanGrid plans={state.plans} onPick={pickPlan} busy={busy} />
        </Panel>
      </Shell>
    );
  }

  /* مسودّة onboarding → الخطوات */
  const idx = STEPS.indexOf(step);
  const allowDomain = draft.limits?.customDomain !== false;

  return (
    <Shell>
      <Panel wide>
        <Progress step={step} allowDomain={allowDomain} />
        {error && <p className="ob-error">{error}</p>}

        {step === "name" && (
          <Step title="اسم المنصّة" desc="ما يراه طلابك في كل مكان.">
            <label className="lbl">اسم المنصّة</label>
            <input className="inp w-full" value={name} onChange={(e) => setName(e.target.value)} maxLength={60} placeholder="مثال: أكاديمية النور" />
            <label className="lbl mt-3">وصف مختصر</label>
            <input className="inp w-full" value={description} onChange={(e) => setDescription(e.target.value)} maxLength={300} placeholder="المادة والمرحلة — مثال: الرياضيات للثانوية العامة" />
            <label className="lbl mt-3">رابط المنصّة</label>
            <div className="ob-slug">
              <input className="inp flex-1" dir="ltr" value={slug} onChange={(e) => checkSlug(e.target.value.toLowerCase())} placeholder="al-noor" />
              <span className="ob-slug-suffix" dir="ltr">.منصّتك</span>
            </div>
            {slugMsg && <p className={`ob-slug-msg ${slugMsg.ok ? "ok" : "bad"}`}>{slugMsg.text}</p>}
            <Nav
              onNext={() => saveStep("logo", { name, description, slug })}
              nextEnabled={name.trim().length >= 3 && (slugMsg?.ok ?? Boolean(draft.slug))}
              busy={busy}
            />
          </Step>
        )}

        {step === "logo" && (
          <Step title="شعار المنصّة" desc="صورةٌ أو شعارٌ يمثّل منصّتك (اختياري).">
            <div className="ob-logo-row">
              <div className="ob-logo-preview">
                {logo ? <img src={logo} alt="" /> : <span>لا صورة</span>}
              </div>
              <div>
                <label className="ob-upload">
                  اختر صورة
                  <input type="file" accept="image/*" hidden onChange={(e) => e.target.files?.[0] && onLogo(e.target.files[0])} />
                </label>
                {logo && <button type="button" className="ob-link" onClick={() => setLogo("")}>إزالة</button>}
                <p className="ob-hint">PNG أو JPG أو SVG — أقصى ٢ ميجابايت.</p>
              </div>
            </div>
            <Nav onBack={() => setStep("name")} onNext={() => saveStep("design", { logo })} nextEnabled busy={busy} skipLabel="تخطٍّ الآن" />
          </Step>
        )}

        {step === "design" && (
          <Step title="هويّة المنصّة" desc="اختر تصميماً ولوّنه كما تحب — يمكنك تغييره لاحقاً.">
            <div className="ob-preset-grid">
              {presets.map((pr) => (
                <button
                  key={pr.id}
                  type="button"
                  onClick={() => { setPresetId(pr.id); setColors(pr.colors); }}
                  className={`ob-preset ${presetId === pr.id ? "is-on" : ""}`}
                >
                  <span className="ob-preset-swatch" style={{ background: `linear-gradient(135deg, ${pr.colors.primary}, ${pr.colors.gold})` }} />
                  <b>{pr.name}</b>
                  <span className="ob-preset-hint">{pr.hint}</span>
                </button>
              ))}
            </div>
            <div className="ob-colors">
              {(["primary", "gold", "paper"] as const).map((k) => (
                <label key={k} className="ob-color">
                  <span>{k === "primary" ? "الأساسي" : k === "gold" ? "الذهبي" : "الورق"}</span>
                  <input type="color" value={colors[k]} onChange={(e) => setColors({ ...colors, [k]: e.target.value })} />
                </label>
              ))}
            </div>
            <Nav
              onBack={() => setStep("logo")}
              onNext={() => saveStep(allowDomain ? "domain" : "review", { presetId, colors })}
              nextEnabled busy={busy}
            />
          </Step>
        )}

        {step === "domain" && (
          <Step title="الدومين المخصّص" desc="اربط منصّتك بدومينك الخاص — أو تخطَّ الآن واربطه لاحقاً.">
            <label className="lbl">الدومين (اختياري)</label>
            <input className="inp w-full" dir="ltr" value={domain} onChange={(e) => setDomain(e.target.value)} placeholder="academy.example.com" />
            <p className="ob-hint">تحصل على رابطٍ فرعيّ مجّانيّ فوراً. ربط الدومين الخاص يتم من لوحتك بعد الإنشاء.</p>
            <Nav onBack={() => setStep("design")} onNext={() => saveStep("review", { customDomain: domain })} nextEnabled busy={busy} skipLabel="تخطٍّ" />
          </Step>
        )}

        {step === "review" && (
          <Step title="مراجعة وإنشاء" desc="تأكّد من البيانات، ثم أنشئ منصّتك.">
            <ul className="ob-review">
              <li><span>الاسم</span><b>{name || draft.name}</b></li>
              <li><span>الرابط</span><b dir="ltr">{slug || draft.slug}</b></li>
              {(description || draft.description) && <li><span>الوصف</span><b>{description || draft.description}</b></li>}
              <li><span>التصميم</span><b>{presets.find((p) => p.id === presetId)?.name}</b></li>
              {(domain || draft.customDomain) && <li><span>الدومين</span><b dir="ltr">{domain || draft.customDomain}</b></li>}
            </ul>
            <p className="ob-hint">بعد الإنشاء نراجع طلبك ونفعّل منصّتك، ثم تظهر بيانات الدخول هنا.</p>
            <Nav
              onBack={() => setStep(allowDomain ? "domain" : "design")}
              onNext={() => saveStep("submit", {})}
              nextEnabled busy={busy}
              nextLabel="أنشئ منصّتي"
            />
          </Step>
        )}
      </Panel>
    </Shell>
  );
}

/* ============ مكوّناتٌ صغيرة ============ */

function Shell({ children }: { children: React.ReactNode }) {
  return <div className="ob">{children}</div>;
}
function Panel({ children, wide }: { children: React.ReactNode; wide?: boolean }) {
  return <div className={`ob-panel ${wide ? "is-wide" : ""}`}>{children}</div>;
}
function Step({ title, desc, children }: { title: string; desc: string; children: React.ReactNode }) {
  return (
    <div className="ob-step">
      <h2 className="ob-step-title">{title}</h2>
      <p className="ob-step-desc">{desc}</p>
      {children}
    </div>
  );
}
function Nav({
  onNext, onBack, nextEnabled, busy, nextLabel = "التالي", skipLabel,
}: {
  onNext: () => void; onBack?: () => void; nextEnabled: boolean; busy: boolean; nextLabel?: string; skipLabel?: string;
}) {
  return (
    <div className="ob-nav">
      {onBack ? <button type="button" className="ob-back" onClick={onBack} disabled={busy}>السابق</button> : <span />}
      <button type="button" className="ob-primary" onClick={onNext} disabled={busy || !nextEnabled}>
        {busy ? "…" : skipLabel && !nextEnabled ? skipLabel : nextLabel}
      </button>
    </div>
  );
}
function Progress({ step, allowDomain }: { step: Step; allowDomain: boolean }) {
  const steps = STEPS.filter((s) => allowDomain || s !== "domain");
  const idx = steps.indexOf(step);
  const labels: Record<Step, string> = { name: "الاسم", logo: "الشعار", design: "التصميم", domain: "الدومين", review: "مراجعة" };
  return (
    <div className="ob-progress">
      {steps.map((s, i) => (
        <div key={s} className={`ob-progress-step ${i <= idx ? "done" : ""}`}>
          <span className="ob-progress-dot">{i + 1}</span>
          <span className="ob-progress-label">{labels[s]}</span>
        </div>
      ))}
    </div>
  );
}
function PlanGrid({ plans, onPick, busy, title }: { plans: SaasPlan[]; onPick: (id: string) => void; busy: boolean; title?: string }) {
  return (
    <>
      {title && <h2 className="ob-step-title mt-6">{title}</h2>}
      <div className="ob-plans">
        {plans.map((p) => (
          <div key={p.id} className={`ob-plan ${p.highlight ? "is-hot" : ""}`}>
            {p.badge && <span className="ob-plan-badge">{p.badge}</span>}
            <b className="ob-plan-name">{p.name}</b>
            {p.desc && <span className="ob-plan-desc">{p.desc}</span>}
            <div className="ob-plan-price">
              {p.priceEGP === 0 ? <span className="ob-plan-free">مجاناً</span> :
                <><b>{p.priceEGP.toLocaleString("ar-EG")}</b> <span>ج.م/{p.interval === "month" ? "شهر" : p.interval === "quarter" ? "٣ش" : "سنة"}</span></>}
            </div>
            {p.trialDays > 0 && <span className="ob-plan-trial">تجربة {p.trialDays.toLocaleString("ar-EG")} يوماً</span>}
            <button type="button" className={`ob-plan-cta ${p.highlight ? "is-hot" : ""}`} disabled={busy} onClick={() => onPick(p.id)}>
              اختر هذه الخطّة
            </button>
          </div>
        ))}
      </div>
    </>
  );
}
function MyTenant({ t, onReveal }: { t: Tenant; onReveal: () => void }) {
  const root = ""; // العنوان يُبنى في الخادم؛ هنا نعرض الـslug فقط
  return (
    <li className="ob-tenant">
      <span className="ob-tenant-logo">{(t.name || t.slug).charAt(0)}</span>
      <span className="ob-tenant-info">
        <b>{t.name || t.slug}</b>
        <span dir="ltr">{t.slug}</span>
      </span>
      <span className={`ob-tenant-status s-${t.status}`}>
        {t.status === "active" ? "نشطة" : t.status === "suspended" ? "موقوفة" : "منتهية"}
      </span>
    </li>
  );
}
function OwnerBar({ owner }: { owner: { name: string; email: string; picture?: string } }) {
  const logout = async () => {
    await fetch("/api/hub/auth/owner-logout", { method: "POST" });
    location.reload();
  };
  return (
    <div className="ob-owner">
      {owner.picture ? <img src={owner.picture} alt="" className="ob-owner-pic" /> : <span className="ob-owner-pic ob-owner-init">{owner.name.charAt(0)}</span>}
      <span className="ob-owner-info">
        <b>{owner.name}</b>
        <span>{owner.email}</span>
      </span>
      <button type="button" className="ob-link" onClick={logout}>خروج</button>
    </div>
  );
}
function Cred({ label, value, link, mono }: { label: string; value: string; link?: boolean; mono?: boolean }) {
  const [copied, setCopied] = useState(false);
  const copy = () => { navigator.clipboard?.writeText(value); setCopied(true); setTimeout(() => setCopied(false), 1500); };
  return (
    <div className="ob-cred">
      <span className="ob-cred-label">{label}</span>
      <span className={`ob-cred-value ${mono ? "mono" : ""}`} dir={link || mono ? "ltr" : "auto"}>{value}</span>
      <button type="button" className="ob-copy" onClick={copy}>{copied ? "نُسخ ✓" : "نسخ"}</button>
    </div>
  );
}
function EmailAuth({ onDone }: { onDone: () => void }) {
  const [mode, setMode] = useState<"login" | "register">("register");
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [website, setWebsite] = useState("");
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState("");

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setBusy(true);
    setErr("");
    try {
      const res = await fetch("/api/hub/auth/owner", {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ mode, name, email, password, website }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) { setErr(data.error ?? "تعذّر"); return; }
      onDone();
    } catch {
      setErr("تعذّر الاتصال بالخادم");
    } finally {
      setBusy(false);
    }
  };

  return (
    <form onSubmit={submit} className="ob-email">
      <div className="ob-tabs">
        <button type="button" className={mode === "register" ? "is-on" : ""} onClick={() => { setMode("register"); setErr(""); }}>حساب جديد</button>
        <button type="button" className={mode === "login" ? "is-on" : ""} onClick={() => { setMode("login"); setErr(""); }}>لديّ حساب</button>
      </div>
      {mode === "register" && (
        <input className="inp w-full" placeholder="اسمك" value={name} onChange={(e) => setName(e.target.value)} autoComplete="name" />
      )}
      <input className="inp w-full" type="email" dir="ltr" placeholder="البريد الإلكتروني" value={email} onChange={(e) => setEmail(e.target.value)} autoComplete="username" required />
      <input className="inp w-full" type="password" placeholder="كلمة المرور" value={password} onChange={(e) => setPassword(e.target.value)} autoComplete={mode === "register" ? "new-password" : "current-password"} required />
      {mode === "register" && <p className="ob-hint">٨ أحرف على الأقل، فيها حرف ورقم.</p>}
      <input type="text" name="website" tabIndex={-1} autoComplete="off" aria-hidden="true" value={website} onChange={(e) => setWebsite(e.target.value)} style={{ position: "absolute", left: "-9999px", width: 1, height: 1, opacity: 0 }} />
      {err && <p className="ob-error">{err}</p>}
      <button type="submit" className="ob-primary w-full" disabled={busy}>
        {busy ? "…" : mode === "register" ? "إنشاء حساب" : "دخول"}
      </button>
    </form>
  );
}
function DevSignin() {
  const [email, setEmail] = useState("");
  return (
    <div className="ob-dev">
      <p className="ob-dev-note">وضع التطوير — جوجل غير مُهيّأ. سجّل ببريد للتجربة:</p>
      <div className="ob-slug">
        <input className="inp flex-1" dir="ltr" placeholder="teacher@test.com" value={email} onChange={(e) => setEmail(e.target.value)} />
        <a className="ob-primary" href={`/api/hub/auth/google?dev=${encodeURIComponent(email)}&next=/start`}>دخول</a>
      </div>
    </div>
  );
}
function GoogleMark() {
  return (
    <svg viewBox="0 0 48 48" className="ob-google-mark" aria-hidden="true">
      <path fill="#EA4335" d="M24 9.5c3.5 0 6.6 1.2 9 3.6l6.7-6.7C35.6 2.6 30.2.5 24 .5 14.6.5 6.5 5.9 2.6 13.8l7.8 6.1C12.2 14 17.6 9.5 24 9.5z" />
      <path fill="#4285F4" d="M46.5 24.5c0-1.6-.1-3.1-.4-4.5H24v9h12.7c-.5 3-2.2 5.5-4.7 7.2l7.4 5.7c4.3-4 6.8-9.9 6.8-17.4z" />
      <path fill="#FBBC05" d="M10.4 28.4c-.5-1.5-.8-3-.8-4.4s.3-2.9.8-4.4l-7.8-6.1C1 16.7 0 20.2 0 24s1 7.3 2.6 10.5l7.8-6.1z" />
      <path fill="#34A853" d="M24 47.5c6.2 0 11.5-2 15.3-5.5l-7.4-5.7c-2 1.4-4.7 2.3-7.9 2.3-6.4 0-11.8-4.5-13.6-10.5l-7.8 6.1C6.5 42.1 14.6 47.5 24 47.5z" />
    </svg>
  );
}
