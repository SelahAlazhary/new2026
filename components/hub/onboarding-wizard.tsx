"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import type { BrandPreset, SubjectCategory, StageCategory, PersonalityCategory, IdentityAnswers } from "@/lib/hub/presets";
import { matchPresets } from "@/lib/hub/presets";
import type { SaasPlan, Tenant } from "@/lib/hub/types";
import { PresetPreview } from "@/components/hub/preset-preview";

type ManualMethod = { kind: "instapay" | "wallet" | "bank"; label: string; number: string; active: boolean };
type Payment = {
  needPayment: boolean;
  amountEGP: number;
  manual: ManualMethod[];
  paymob: boolean;
  lastInvoice: { status: string; provider: string } | null;
};
type StartState = {
  owner: { name: string; email: string; picture?: string } | null;
  draft: Tenant | null;
  active: Tenant[];
  plans: SaasPlan[];
  planId: string | null;
  subStatus: string | null;
  payment: Payment | null;
};

const STEPS = ["name", "logo", "identity", "design", "review"] as const;
type Step = (typeof STEPS)[number];

const SUBJECT_OPTIONS: { id: SubjectCategory; label: string; icon: string }[] = [
  { id: "stem", label: "رياضيات وعلوم", icon: "M4 2h2v4h4V2h2v4h4V2h2v6H4V2zm0 8h14v2H4v-2zm2 4h10v2H6v-2z" },
  { id: "arabic", label: "لغة عربية وأدب", icon: "M12 2C6.5 2 2 6.5 2 12s4.5 10 10 10 10-4.5 10-10S17.5 2 12 2zm-1 15H9v-2h2v2zm4-4H7v-2h8v2zm2-4H5V7h12v2z" },
  { id: "english", label: "لغة إنجليزية", icon: "M5 4v2h6.5l-3.5 9H5v2h14v-2h-6.5l3.5-9H19V4H5z" },
  { id: "humanities", label: "تاريخ وجغرافيا", icon: "M12 2C6.5 2 2 6.5 2 12s4.5 10 10 10 10-4.5 10-10S17.5 2 12 2zm0 2c1.9 0 3.7.7 5 1.8-1 .7-2.3 1.2-3.5 1.5-.4-1-1-1.8-1.5-2.3V4zM4 12c0-2 .7-3.8 2-5.2.5 1.5 1.5 2.8 2.8 3.7L7 14.5c-1.8-.3-2.6-1.2-3-2.5zm8 8c-3.3 0-6-2-7.2-4.8C6 16 8 16.5 10 16l2 4zm1-4.5L11 12l3-4 3 4-2 3.5h-2z" },
  { id: "tech", label: "حاسب آلي وبرمجة", icon: "M9.4 16.6L4.8 12l4.6-4.6L8 6l-6 6 6 6 1.4-1.4zm5.2 0l4.6-4.6-4.6-4.6L16 6l6 6-6 6-1.4-1.4z" },
  { id: "religious", label: "تربية دينية وقرآن", icon: "M18 2H6c-1.1 0-2 .9-2 2v16c0 1.1.9 2 2 2h12c1.1 0 2-.9 2-2V4c0-1.1-.9-2-2-2zM6 4h5v8l-2.5-1.5L6 12V4z" },
  { id: "arts", label: "فنون وإبداع", icon: "M12 2C6.5 2 2 6.5 2 12s4.5 10 10 10c.6 0 1-.4 1-1 0-.3-.1-.5-.2-.7-.1-.2-.2-.4-.2-.6 0-.6.4-1 1-1h1.8c3 0 5.5-2.5 5.5-5.5C21 5.9 17 2 12 2zM6.5 13c-.8 0-1.5-.7-1.5-1.5S5.7 10 6.5 10 8 10.7 8 11.5 7.3 13 6.5 13zm3-4C8.7 9 8 8.3 8 7.5S8.7 6 9.5 6s1.5.7 1.5 1.5S10.3 9 9.5 9zm5 0c-.8 0-1.5-.7-1.5-1.5S13.7 6 14.5 6s1.5.7 1.5 1.5S15.3 9 14.5 9zm3 4c-.8 0-1.5-.7-1.5-1.5s.7-1.5 1.5-1.5 1.5.7 1.5 1.5-.7 1.5-1.5 1.5z" },
  { id: "general", label: "تعليم عام / أخرى", icon: "M12 3L1 9l4 2.2v6L12 21l7-3.8v-6l2-1.1V17h2V9L12 3zm6.8 6L12 12.7 5.2 9 12 5.3 18.8 9zM17 15.7l-5 2.7-5-2.7v-3.9l5 2.7 5-2.7v3.9z" },
];

const STAGE_OPTIONS: { id: StageCategory; label: string }[] = [
  { id: "primary", label: "ابتدائي" },
  { id: "middle", label: "إعدادي" },
  { id: "secondary", label: "ثانوي" },
  { id: "university", label: "جامعي" },
  { id: "professional", label: "تدريب مهني" },
];

const PERSONALITY_OPTIONS: { id: PersonalityCategory; label: string; desc: string; gradient: string }[] = [
  { id: "academic", label: "أكاديمي وموثوق", desc: "منهجٌ منظّمٌ وتقييمٌ دقيق — يليق بمن يعلّم بثقة", gradient: "linear-gradient(135deg, #1e3a5f, #2c5282)" },
  { id: "modern", label: "عصري ومبتكر", desc: "تقنيّةٌ أنيقة ومحتوى بطريقة جديدة كلّياً", gradient: "linear-gradient(135deg, #2f5fd0, #3b82f6)" },
  { id: "energetic", label: "حيوي وملهم", desc: "طاقةٌ تُحفّز الطلاب وتجعل التعلّم تجربة ممتعة", gradient: "linear-gradient(135deg, #7c3aed, #a855f7)" },
  { id: "calm", label: "هادئ ومريح", desc: "بيئةٌ آمنة ودافئة تساعد على التركيز والاستيعاب", gradient: "linear-gradient(135deg, #059669, #10b981)" },
];

export function OnboardingWizard({ devSignin, presets }: { devSignin: boolean; presets: BrandPreset[] }) {
  const [state, setState] = useState<StartState | null>(null);
  const [step, setStep] = useState<Step>("name");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [paying, setPaying] = useState(false);
  const [delivery, setDelivery] = useState<{ adminEmail: string; password: string | null; studentUrl: string; adminUrl: string } | null>(null);

  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [slug, setSlug] = useState("");
  const [slugMsg, setSlugMsg] = useState<{ ok: boolean; text: string } | null>(null);
  const [logo, setLogo] = useState("");
  const [presetId, setPresetId] = useState("midad");
  const [colors, setColors] = useState({ primary: "#233b8b", gold: "#c99a3b", paper: "#fbf9f5" });
  const [domain, setDomain] = useState("");
  const [urlBase, setUrlBase] = useState("");

  const [idSubject, setIdSubject] = useState<SubjectCategory | null>(null);
  const [idStage, setIdStage] = useState<StageCategory | null>(null);
  const [idPersonality, setIdPersonality] = useState<PersonalityCategory | null>(null);
  const [idPreferDark, setIdPreferDark] = useState<boolean>(false);
  const [sortedPresets, setSortedPresets] = useState<BrandPreset[]>(presets);

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
      else if (s === "design") setStep("identity");
    }
    if (data.subStatus === "pending_payment" && data.payment?.needPayment &&
        (data.draft?.onboardingStep === "review" || data.payment?.lastInvoice)) {
      setPaying(true);
    } else if (data.subStatus !== "pending_payment") {
      setPaying(false);
    }
    return data;
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    load();
    setUrlBase(window.location.origin);
  }, [load]);

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
    const serverStep = nextStep === "submit" ? "review" : nextStep === "identity" ? "identity" : nextStep;
    const d = await call({ action: "save", step: serverStep, ...extra });
    if (!d?.ok) return;
    if (nextStep === "submit") {
      setBusy(true);
      try {
        const res = await fetch("/api/start", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ action: "submit" }) });
        const s = await res.json().catch(() => ({}));
        if (s?.needPayment) { setPaying(true); }
        else if (s?.provisioned && s.result) {
          setDelivery({ adminEmail: s.result.adminEmail, password: s.result.password, studentUrl: s.result.studentUrl, adminUrl: s.result.adminUrl });
        } else if (!res.ok) { setError(s.error ?? "تعذّر"); }
      } finally {
        setBusy(false);
      }
      await load();
      return;
    }
    await load();
    setStep(nextStep);
  };

  const finishIdentity = () => {
    if (!idSubject || !idStage || !idPersonality) return;
    const answers: IdentityAnswers = { subject: idSubject, stage: idStage, personality: idPersonality, preferDark: idPreferDark };
    const matched = matchPresets(answers);
    setSortedPresets(matched);
    const best = matched[0];
    setPresetId(best.id);
    setColors(best.colors);
    saveStep("design", { logo });
  };

  const onLogo = (file: File) => {
    if (file.size > 2_000_000) { setError("الصورة كبيرة — أقصى ٢ ميجابايت"); return; }
    const reader = new FileReader();
    reader.onload = () => setLogo(String(reader.result));
    reader.readAsDataURL(file);
  };

  const identityComplete = Boolean(idSubject && idStage && idPersonality);

  /* ============ العرض ============ */

  if (!state) return <Shell><p className="ob-loading">جارٍ التحميل…</p></Shell>;

  if (!state.owner) {
    return (
      <Shell>
        <Panel>
          <div className="ob-auth-header">
            <span className="ob-auth-icon">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><path d="M12 2L2 7l10 5 10-5-10-5z"/><path d="M2 17l10 5 10-5"/><path d="M2 12l10 5 10-5"/></svg>
            </span>
            <h1 className="ob-title">أنشئ منصّتك التعليمية</h1>
            <p className="ob-sub">ابدأ بتسجيل الدخول — بحساب جوجل أو بالبريد وكلمة المرور.</p>
          </div>
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

  if (delivery) {
    return (
      <Shell>
        <Panel>
          <span className="ob-done-badge">تمّ إنشاء منصّتك بنجاح</span>
          <h1 className="ob-title">منصّتك جاهزة</h1>
          <p className="ob-sub">احفظ بيانات الدخول — يمكنك إعادة عرضها لاحقاً.</p>
          <div className="ob-creds">
            <Cred label="رابط الطلاب" value={delivery.studentUrl} link />
            <Cred label="لوحة التحكّم" value={delivery.adminUrl} link />
            <Cred label="بريد الدخول" value={delivery.adminEmail} />
            <Cred label="كلمة المرور" value={delivery.password ?? "جارٍ التوليد…"} mono />
          </div>
          <a href={delivery.adminUrl} className="ob-primary" target="_blank" rel="noreferrer">افتح لوحة منصّتك</a>
          <button type="button" className="ob-link" onClick={() => { setDelivery(null); load(); }}>العودة إلى منصّاتي</button>
        </Panel>
      </Shell>
    );
  }

  if (paying && draft && state.payment) {
    return (
      <Shell>
        <Panel>
          <h1 className="ob-title">إتمام الدفع</h1>
          <p className="ob-sub">اشتراك «{draft.name || draft.slug}» — {state.payment.amountEGP.toLocaleString("ar-EG")} ج.م.</p>
          {error && <p className="ob-error">{error}</p>}
          <PayScreen
            payment={state.payment}
            busy={busy}
            onManual={async (kind, senderNumber, receipt) => {
              const d = await call({ action: "pay", method: "manual", kind, senderNumber, receipt });
              if (d?.ok) { setPaying(false); await load(); }
            }}
            onPaymob={async () => {
              const d = await call({ action: "pay", method: "paymob" });
              if (d?.iframeUrl) window.open(d.iframeUrl, "_blank", "noopener");
            }}
            onRecheck={() => load()}
          />
          <button type="button" className="ob-link" onClick={() => setPaying(false)}>رجوع للتعديل</button>
        </Panel>
      </Shell>
    );
  }

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
              <p className="ob-sub">اختر الخطة المناسبة لحجم طلابك واحتياجاتك.</p>
            </div>
            <OwnerBar owner={state.owner} />
          </div>
          {error && <p className="ob-error">{error}</p>}
          <PlanGrid plans={state.plans} onPick={pickPlan} busy={busy} />
        </Panel>
      </Shell>
    );
  }

  return (
    <Shell>
      <Panel wide>
        <Progress step={step} />
        {error && <p className="ob-error">{error}</p>}

        {step === "name" && (
          <StepBox title="اسم المنصّة" desc="ما يراه طلابك في كل مكان — اختره بعناية.">
            <label className="lbl">اسم المنصّة</label>
            <input className="inp w-full" value={name} onChange={(e) => setName(e.target.value)} maxLength={60} placeholder="مثال: أكاديمية النور" />
            <label className="lbl mt-3">وصف مختصر</label>
            <input className="inp w-full" value={description} onChange={(e) => setDescription(e.target.value)} maxLength={300} placeholder="المادة والمرحلة — مثال: الرياضيات للثانوية العامة" />
            <label className="lbl mt-3">معرّف المنصّة</label>
            <div className="ob-slug">
              <span className="ob-slug-prefix" dir="ltr">/t/</span>
              <input className="inp flex-1" dir="ltr" value={slug} onChange={(e) => checkSlug(e.target.value.toLowerCase())} placeholder="al-noor" />
            </div>
            {urlBase && slug.length >= 3 && (
              <p className="ob-url-preview" dir="ltr">{urlBase}/t/{slug}</p>
            )}
            {slugMsg && <p className={`ob-slug-msg ${slugMsg.ok ? "ok" : "bad"}`}>{slugMsg.text}</p>}
            <Nav
              onNext={() => saveStep("logo", { name, description, slug })}
              nextEnabled={name.trim().length >= 3 && (slugMsg?.ok ?? Boolean(draft.slug))}
              busy={busy}
            />
          </StepBox>
        )}

        {step === "logo" && (
          <StepBox title="شعار المنصّة" desc="صورةٌ أو شعارٌ يمثّل منصّتك (اختياري — يمكنك إضافته لاحقاً).">
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
            <Nav onBack={() => setStep("name")} onNext={() => { saveStep("identity", { logo }); }} nextEnabled busy={busy} skipLabel="تخطٍّ الآن" />
          </StepBox>
        )}

        {step === "identity" && (
          <StepBox title="هويّة منصّتك" desc="أجب عن أسئلة سريعة ونختار لك التصميم الأمثل تلقائياً.">

            <div className="ob-quiz-section">
              <h3 className="ob-quiz-q">ما المادة أو المجال الذي تُدرّسه؟</h3>
              <div className="ob-quiz-subjects">
                {SUBJECT_OPTIONS.map((opt) => (
                  <button
                    key={opt.id}
                    type="button"
                    className={`ob-quiz-chip ${idSubject === opt.id ? "is-on" : ""}`}
                    onClick={() => setIdSubject(opt.id)}
                  >
                    <svg viewBox="0 0 24 24" fill="currentColor" className="ob-quiz-chip-icon"><path d={opt.icon} /></svg>
                    <span>{opt.label}</span>
                  </button>
                ))}
              </div>
            </div>

            <div className="ob-quiz-section">
              <h3 className="ob-quiz-q">ما المرحلة الدراسية لطلابك؟</h3>
              <div className="ob-quiz-stages">
                {STAGE_OPTIONS.map((opt) => (
                  <button
                    key={opt.id}
                    type="button"
                    className={`ob-quiz-pill ${idStage === opt.id ? "is-on" : ""}`}
                    onClick={() => setIdStage(opt.id)}
                  >
                    {opt.label}
                  </button>
                ))}
              </div>
            </div>

            <div className="ob-quiz-section">
              <h3 className="ob-quiz-q">كيف تصف أسلوبك وشخصيّة منصّتك؟</h3>
              <div className="ob-quiz-personalities">
                {PERSONALITY_OPTIONS.map((opt) => (
                  <button
                    key={opt.id}
                    type="button"
                    className={`ob-quiz-persona ${idPersonality === opt.id ? "is-on" : ""}`}
                    onClick={() => setIdPersonality(opt.id)}
                  >
                    <span className="ob-quiz-persona-bar" style={{ background: opt.gradient }} />
                    <b>{opt.label}</b>
                    <span className="ob-quiz-persona-desc">{opt.desc}</span>
                  </button>
                ))}
              </div>
            </div>

            <div className="ob-quiz-section">
              <h3 className="ob-quiz-q">هل تفضّل أجواء فاتحة أم داكنة؟</h3>
              <div className="ob-quiz-theme">
                <button
                  type="button"
                  className={`ob-quiz-theme-card ${!idPreferDark ? "is-on" : ""}`}
                  onClick={() => setIdPreferDark(false)}
                >
                  <span className="ob-quiz-theme-preview light">
                    <span /><span /><span />
                  </span>
                  <b>فاتحة ومشرقة</b>
                </button>
                <button
                  type="button"
                  className={`ob-quiz-theme-card ${idPreferDark ? "is-on" : ""}`}
                  onClick={() => setIdPreferDark(true)}
                >
                  <span className="ob-quiz-theme-preview dark">
                    <span /><span /><span />
                  </span>
                  <b>داكنة وأنيقة</b>
                </button>
              </div>
            </div>

            <Nav
              onBack={() => setStep("logo")}
              onNext={finishIdentity}
              nextEnabled={identityComplete}
              busy={busy}
              nextLabel="اكتشف تصميمك"
            />
          </StepBox>
        )}

        {step === "design" && (
          <StepBox title="هويّة المنصّة" desc="اخترنا لك الأنسب — غيّر إن أحببت، يمكنك تعديله لاحقاً.">
            <PresetPreview preset={presets.find((p) => p.id === presetId) ?? presets[0]} colors={colors} />
            <div className="ob-preset-grid">
              {sortedPresets.map((pr, i) => (
                <button
                  key={pr.id}
                  type="button"
                  onClick={() => { setPresetId(pr.id); setColors(pr.colors); }}
                  className={`ob-preset ${presetId === pr.id ? "is-on" : ""}`}
                >
                  {i < 3 && identityComplete && <span className="ob-preset-badge">مقترح</span>}
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
              onBack={() => setStep("identity")}
              onNext={() => saveStep("review", { presetId, colors })}
              nextEnabled busy={busy}
            />
          </StepBox>
        )}

        {step === "review" && (
          <StepBox title="مراجعة وإنشاء" desc="تأكّد من البيانات، ثم أنشئ منصّتك.">
            <ul className="ob-review">
              <li><span>الاسم</span><b>{name || draft.name}</b></li>
              <li><span>الرابط</span><b dir="ltr">{urlBase}/t/{slug || draft.slug}</b></li>
              {(description || draft.description) && <li><span>الوصف</span><b>{description || draft.description}</b></li>}
              <li><span>التصميم</span><b>{presets.find((p) => p.id === presetId)?.name}</b></li>
            </ul>
            <p className="ob-hint">بعد الإنشاء نراجع طلبك ونفعّل منصّتك، ثم تظهر بيانات الدخول هنا.</p>
            <Nav
              onBack={() => setStep("design")}
              onNext={() => saveStep("submit", {})}
              nextEnabled busy={busy}
              nextLabel="أنشئ منصّتي"
            />
          </StepBox>
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
function StepBox({ title, desc, children }: { title: string; desc: string; children: React.ReactNode }) {
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
function Progress({ step }: { step: Step }) {
  const idx = STEPS.indexOf(step);
  const labels: Record<Step, string> = { name: "الاسم", logo: "الشعار", identity: "الهوية", design: "التصميم", review: "مراجعة" };
  return (
    <div className="ob-progress">
      {STEPS.map((s, i) => (
        <div key={s} className={`ob-progress-step ${i < idx ? "done" : ""} ${i === idx ? "active" : ""}`}>
          <span className="ob-progress-dot">{i < idx ? "✓" : i + 1}</span>
          <span className="ob-progress-label">{labels[s]}</span>
          {i < STEPS.length - 1 && <span className="ob-progress-line" />}
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
              <><b>{p.priceEGP.toLocaleString("ar-EG")}</b> <span>ج.م/{p.interval === "month" ? "شهر" : p.interval === "quarter" ? "٣ش" : "سنة"}</span></>
            </div>
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
      {t.status === "active" && (
        <button type="button" className="ob-tenant-reveal" onClick={onReveal}>بيانات الدخول</button>
      )}
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
function PayScreen({
  payment, busy, onManual, onPaymob, onRecheck,
}: {
  payment: Payment; busy: boolean;
  onManual: (kind: ManualMethod["kind"], senderNumber: string, receipt: string) => void;
  onPaymob: () => void;
  onRecheck: () => void;
}) {
  const [tab, setTab] = useState<"card" | "manual">(payment.paymob ? "card" : "manual");
  const [method, setMethod] = useState(0);
  const [sender, setSender] = useState("");
  const [receipt, setReceipt] = useState("");

  const onFile = (f: File) => {
    if (f.size > 2_000_000) return;
    const r = new FileReader();
    r.onload = () => setReceipt(String(r.result));
    r.readAsDataURL(f);
  };

  const m = payment.manual[method];
  const kindLabel: Record<string, string> = { instapay: "إنستاباي", wallet: "محفظة", bank: "حساب بنكي" };

  if (!payment.paymob && !payment.manual.length) {
    return <p className="ob-hint">لم تُفعَّل بوّابة دفع بعد. تواصل مع الدعم لتفعيل اشتراكك.</p>;
  }

  return (
    <div className="ob-pay">
      <div className="ob-tabs">
        {payment.paymob && <button type="button" className={tab === "card" ? "is-on" : ""} onClick={() => setTab("card")}>بطاقة بنكية</button>}
        {payment.manual.length > 0 && <button type="button" className={tab === "manual" ? "is-on" : ""} onClick={() => setTab("manual")}>تحويل يدوي</button>}
      </div>

      {tab === "card" && payment.paymob && (
        <div className="ob-pay-card">
          <p className="ob-hint">ادفع بأمان عبر بايموب (فيزا/ماستركارد/محفظة). تُفعّل منصّتك فور نجاح الدفع.</p>
          <button type="button" className="ob-primary w-full" disabled={busy} onClick={onPaymob}>الدفع بالبطاقة</button>
          <button type="button" className="ob-link" onClick={onRecheck}>دفعتُ بالفعل — تحقّق</button>
        </div>
      )}

      {tab === "manual" && payment.manual.length > 0 && (
        <div className="ob-pay-manual">
          <p className="ob-hint">حوّل قيمة الاشتراك إلى إحدى الطرق التالية، ثم أرفق صورة الإيصال — نراجعها ونفعّل منصّتك.</p>
          <div className="ob-methods">
            {payment.manual.map((mm, i) => (
              <button type="button" key={i} className={`ob-method ${method === i ? "is-on" : ""}`} onClick={() => setMethod(i)}>
                <b>{mm.label || kindLabel[mm.kind]}</b>
                <span dir="ltr">{mm.number}</span>
              </button>
            ))}
          </div>
          {m && (
            <div className="ob-copy-num">
              <span dir="ltr">{m.number}</span>
              <button type="button" onClick={() => navigator.clipboard?.writeText(m.number)}>نسخ</button>
            </div>
          )}
          <label className="lbl mt-2">رقم المحوِّل (اختياري)</label>
          <input className="inp w-full" dir="ltr" value={sender} onChange={(e) => setSender(e.target.value)} placeholder="01xxxxxxxxx" />
          <label className="lbl mt-2">صورة الإيصال</label>
          <div className="ob-logo-row">
            <div className="ob-logo-preview">{receipt ? <img src={receipt} alt="" /> : <span>لا صورة</span>}</div>
            <label className="ob-upload">اختر صورة<input type="file" accept="image/*" hidden onChange={(e) => e.target.files?.[0] && onFile(e.target.files[0])} /></label>
          </div>
          <button
            type="button" className="ob-primary w-full mt-3" disabled={busy || !receipt}
            onClick={() => m && onManual(m.kind, sender, receipt)}
          >
            {busy ? "…" : "أرسلت التحويل — راجعوه"}
          </button>
        </div>
      )}
    </div>
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
