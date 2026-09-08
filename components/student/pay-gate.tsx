"use client";

/**
 * بوّابة الدفع كما يراها الطالب.
 * ------------------------------------------------------------------
 * أربع خطوات: الخطة ← طريقة الدفع ← التحويل ← النتيجة. والشكلُ أصنافٌ
 * من `lib/pay-styles` على الغلاف، فالهيئةُ تتغيّر من اللوحة دون أن
 * يُمسّ هذا الملفّ.
 *
 * السعرُ يُعاد حسابُه على الخادم عند الإرسال — ما يُعرض هنا للطالب لا
 * يُصدَّق منه شيء.
 *
 * ------------------------------------------------------------------
 * **والترتيبُ أُعيد.** كانت الشاشةُ تعمل ولا تُقرأ: ثلاثُ نقاطٍ بلا
 * أسماء، واسمُ الخطة ومبلغُها سطراً مقصوصاً بحجم `text-xs`، ورقمُ
 * المحفظة يُبتر على الجوّال، وخمسةُ حقولٍ كلٌّ بحشوةٍ تخالف أختَها.
 *
 * فالمعروضُ الآن مرتَّبٌ على ما يُقرأ أوّلاً:
 *
 *   ١) **الخطواتُ مسمّاة** بقضيبٍ يمتلئ — يعرف الطالبُ أين هو وكم بقي.
 *   ٢) **ملخّصٌ ثابت** يحمل ما يُشترى ومبلغَه بحجمٍ يليق برقمٍ يُدفع،
 *      يبقى معروضاً حتّى الإرسال.
 *   ٣) **الأرقامُ لا تُقصّ** وتحمل أيقونةَ نسخٍ ظاهرة.
 *   ٤) **حقلٌ واحدٌ** يُبنى منه الخمسة، فيستوي إيقاعُ الاستمارة.
 *
 * ولا لونَ جديد ولا محدِّدَ محذوف: `.pay-method` و`.pay-step`
 * و`.pay-details` بأسمائها، فهيئاتُ اللوحة العشرون تعمل كما كانت.
 */

import { useMemo, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import {
  IconCheck, IconCheckCircle, IconSpinner, IconCalendar, IconSparkle,
  IconArrowLeft, IconCopy,
} from "@/components/brand/icons";
import { useContent } from "@/components/content/content-provider";
import { findPayStyle, payClass, payColorVars } from "@/lib/styles/pay-styles";
import {
  activeMethods, numberLabel, requestProblem,
  senderIsPhone, senderLabel, senderPlaceholder, senderProblem,
} from "@/lib/business/payments";
import { planPrice, planColor } from "@/lib/business/plans";
import { planDuration, planScopeLabel } from "@/components/sections/plans";
import type { PayMethod, PayRequest, SitePlan, Subject } from "@/lib/utils/types";
import { PayMark } from "@/components/brand/pay-marks";

const STEPS = ["اختر الخطة", "طريقة التحويل", "بيانات التحويل"];
const ar = (n: number) => n.toLocaleString("ar-EG");

export function PayGate({
  plans, subject, onDone,
}: {
  plans: SitePlan[];
  subject?: Subject;
  onDone: () => void;
}) {
  const { content, db, session, refresh } = useContent();
  const cfg = content.payments ?? {};
  const style = findPayStyle(cfg.style);
  const methods = useMemo(() => activeMethods(cfg.methods), [cfg.methods]);

  /* طلبات هذا الطالب — الخادم لا يرسل له غيرها أصلاً. */
  const mine = ((db?.payments ?? []) as PayRequest[]).filter((r) => r.userId === session?.uid);
  /*
    ما زال للطالب شأنٌ قائم؟
    ------------------------------------------------------------------
    كان يُبحث عن الطلب المعلّق وحده، فبعد القبول تعود شاشةُ اختيار الخطة
    كأنّ شيئاً لم يكن — والطالبُ دفع فعلاً وكودُه ينتظره. فيُبحث أوّلاً
    عن مقبولٍ لم يُستعمل كودُه، ثم عن معلّق.
  */
  const readyOne = mine.find((r) => r.status === "approved" && r.code && !r.redeemedAt);
  const pendingOne = mine.find((r) => r.status === "pending");
  const openOne = readyOne ?? pendingOne;

  const [plan, setPlan] = useState<SitePlan | null>(plans.length === 1 ? plans[0] : null);
  const [method, setMethod] = useState<PayMethod | null>(null);
  const [senderName, setSenderName] = useState("");
  const [senderAccount, setSenderAccount] = useState("");
  const [senderRef, setSenderRef] = useState("");
  const [note, setNote] = useState("");
  const [receipt, setReceipt] = useState("");
  const [uploading, setUploading] = useState(false);
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState<string | null>(null);
  const [done, setDone] = useState<PayRequest | null>(null);
  const [copied, setCopied] = useState<string | null>(null);
  /* خطأُ حقل المحوِّل يُعرض تحته لا في شريط الأخطاء العامّ — الخطأُ
     يُقرأ عند موضعه أو لا يُقرأ. */
  const [senderErr, setSenderErr] = useState<string | null>(null);
  /* اختيار الطريقة صار إقراراً «حوّلتُ عليها» لا انتقالاً، فالانتقال
     يحتاج ضغطةً صريحة — وإلا قفزت الشاشة قبل أن يقرأ الأرقام. */
  const [stepDone, setStepDone] = useState(false);

  const step = done ? 3 : plan ? (method && stepDone ? 2 : 1) : 0;

  const copy = (v: string) => {
    navigator.clipboard?.writeText(v);
    setCopied(v);
    setTimeout(() => setCopied(null), 1500);
  };

  const upload = async (file: File) => {
    setErr(null);
    setUploading(true);
    const fd = new FormData();
    fd.append("file", file);
    fd.append("purpose", "receipt");
    const res = await fetch("/api/upload", { method: "POST", body: fd });
    const data = await res.json().catch(() => ({}));
    setUploading(false);
    if (!res.ok) { setErr(data.error || "تعذّر رفع الصورة"); return; }
    setReceipt(data.url);
  };

  const submit = async () => {
    setErr(null);
    const problem = requestProblem(
      { methodId: method?.id, methodKind: method?.kind, senderName, senderAccount, receipt },
      { requireReceipt: cfg.requireReceipt, requireSender: cfg.requireSender }
    );
    if (problem) { setErr(problem); return; }

    setBusy(true);
    const res = await fetch("/api/payments", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        planId: plan?.id,
        methodId: method?.id,
        subjectId: subject?.id,
        senderName, senderAccount, senderRef, note, receipt,
      }),
    });
    const data = await res.json().catch(() => ({}));
    setBusy(false);
    if (!res.ok) { setErr(data.error || "تعذّر إرسال الطلب"); return; }
    setDone(data.request as PayRequest);
    await refresh();
  };

  /* ---------------- طلب سابق قيد المراجعة ---------------- */
  if (!done && openOne) {
    return (
      <div className="pay-gate" style={payColorVars(cfg.colors)}>
        <Pending r={openOne} subject={subject} onClose={onDone} onRefresh={refresh} />
      </div>
    );
  }

  return (
    <div className={`pay-gate ${payClass(style)}`} style={payColorVars(cfg.colors)}>
      {/* العنوان والوصف من اللوحة */}
      <div className="mb-4">
        <p className="font-display text-base font-extrabold">{cfg.title || "ادفع واستلم كود التفعيل"}</p>
        {cfg.desc && <p className="mt-0.5 text-[11px] leading-relaxed text-muted-foreground">{cfg.desc}</p>}
      </div>

      {/*
        مؤشّرُ الخطوات — مسمّى.
        `data-on` للعلامة (تُلوّنها هيئاتُ اللوحة)، و`data-done` للقضيب
        الواصل، و`data-at` للاسم فيَسودّ اسمُ الخطوة الحاليّة وحدَه.
      */}
      <div className="pay-steps mb-5">
        {STEPS.map((s, i) => (
          <span key={s} className="pay-stepi" data-done={i < step ? "1" : "0"} data-at={i === step ? "1" : "0"}>
            <span className="pay-step" data-on={i <= step ? "1" : "0"}>
              <span className="pay-step-num">{i < step ? "✓" : ar(i + 1)}</span>
            </span>
            <span className="pay-step-t">{s}</span>
          </span>
        ))}
      </div>

      {/*
        ملخّصُ الطلب — يظهر بمجرّد اختيار الخطة ويبقى حتّى الإرسال.
        فما يُدفع ومقابلُه أمام العين في كلّ خطوة، ولا يُطالَب الطالبُ
        بأن يتذكّر ما اختاره قبل شاشتين.
      */}
      {plan && step < 3 && (
        <Summary plan={plan} subject={subject} termEnd={content.termEnd} />
      )}

      <AnimatePresence mode="wait">
        {/* ---------- ١ · الخطة ---------- */}
        {step === 0 && (
          <Step key="plan">
            {plans.length === 0 ? (
              <Empty>لم تُضَف خطط لهذا الكورس بعد.</Empty>
            ) : (
              /*
                قائمةُ الخطط لها غلافُها `pay-plans` لا `pay-methods`.
                ------------------------------------------------------------
                إعدادُ اللوحة اسمُه «ترتيب **طرق الدفع**»، وهيئتُه «ألسنة»
                تجعل كلَّ بطاقةٍ قرصاً بعرض ٨rem — وهو مقاسٌ يسع «فودافون
                كاش» ولا يسع «وحدةُ التفسير». وكانت الخططُ تلبَس الغلافَ
                نفسَه، فقيس عنوانُ الخطة مقصوصاً في هيئة «الألسنة».

                فالخططُ تستقلّ بغلافها ويبقى `pay-method` على البطاقة —
                فتأخذ سطحَ الهيئة وحافّتَها ولا تأخذ ترتيبَ الطرق.
              */
              <div className="pay-plans">
                {plans.map((p) => {
                  const priced = planPrice(p);
                  const tone = planColor(p);
                  return (
                    <button
                      key={p.id}
                      type="button"
                      onClick={() => setPlan(p)}
                      className="pay-method pay-plan"
                      style={tone ? ({ "--pg-accent": tone } as React.CSSProperties) : undefined}
                    >
                      <span className="pay-plan-n">
                        <span className="pay-plan-t">{p.name}</span>
                        <span className="pay-plan-d">{p.desc || planScopeLabel(p, subject?.name)}</span>
                        <span className="pay-plan-m">
                          <IconCalendar className="size-3" /> {planDuration(p, content.termEnd)}
                        </span>
                      </span>
                      <span className="pay-plan-p">
                        {p.badge && (
                          <span className="pay-plan-badge">
                            <IconSparkle className="size-2.5" /> {p.badge}
                          </span>
                        )}
                        <span className="pay-amt" style={tone ? ({ "--pg-a": tone } as React.CSSProperties) : undefined}>
                          <span className="pay-amt-v">{ar(priced.price)}</span>
                          <span className="pay-amt-c">ج.م</span>
                        </span>
                        {priced.active && (
                          <span className="pay-amt-was mt-0.5 block">{ar(priced.original)} ج.م</span>
                        )}
                      </span>
                    </button>
                  );
                })}
              </div>
            )}
          </Step>
        )}

        {/* ---------- ٢ · طريقة الدفع ---------- */}
        {step === 1 && plan && (
          <Step key="method">
            <Head onBack={() => { setPlan(null); setMethod(null); setStepDone(false); }} />
            {methods.length === 0 ? (
              <Empty>لم تُضَف طرق دفع بعد — تواصل مع الدعم.</Empty>
            ) : (
              <>
                {/*
                  الطرق كلُّها ببياناتها معاً.
                  ------------------------------------------------------------
                  كانت تُعرض أسماءً فقط، فيختار الطالب واحدةً ثم يرى رقمها —
                  وهو يريد أن يرى الأرقام كلَّها ليقارن ويحوّل من محفظته هو.
                  فصارت كلُّ طريقة تعرض بياناتها في مكانها، والضغطُ يقول
                  «حوّلتُ على هذه» لا «أرني هذه».
                */}
                <p className="pay-sec-t mb-2.5">
                  حوّل المبلغ على أيّ طريقة تناسبك، ثم اختر التي حوّلت عليها:
                </p>

                <div className="pay-methods">
                  {methods.map((m) => (
                    <div
                      key={m.id}
                      className="pay-method p-3.5"
                      data-on={method?.id === m.id ? "1" : "0"}
                      style={m.color ? ({ "--pg-accent": m.color } as React.CSSProperties) : undefined}
                    >
                      {/*
                        الترتيبُ: تعريفٌ ← رقمٌ ← فعل.
                        ------------------------------------------------------
                        كان الزرُّ في الصفّ الأوّل يزاحم الاسمَ، والرقمُ تحته
                        صفّاً بوزن «بيانات إضافية». وهو مقلوب: الطالبُ جاء
                        ليأخذ الرقمَ لا ليضغط زرّاً، والزرُّ إقرارٌ بما فعل
                        فلا يُعرض قبل أن يفعله.

                        فالرقمُ صار بطلَ البطاقة — أكبرَ خطٍّ فيها بخطٍّ
                        ثابتٍ مجزّأ — والزرُّ نزل إلى قاعها بعرضها.
                      */}
                      <div className="pay-m-head">
                        <PayMark
                          kind={m.kind}
                          name={m.name}
                          logo={m.logo}
                          color={m.color}
                          className="pay-method-icon size-9 shrink-0"
                        />
                        <span className="pay-m-name">
                          <span className="pay-m-t">{m.name}</span>
                          {m.holder && <span className="pay-m-h">{m.holder}</span>}
                        </span>
                        {method?.id === m.id && (
                          <span className="pay-m-on" aria-hidden>
                            <IconCheck className="size-3.5" />
                          </span>
                        )}
                      </div>

                      {/* الرقمُ — بطلُ البطاقة، ونسخُه زرٌّ يُرى لا تلميح */}
                      <div className="pay-m-num">
                        <span className="pay-m-num-l">{numberLabel(m.kind)}</span>
                        <span className="pay-m-num-r">
                          {/*
                            الطويلُ يصغر خطُّه.
                            «عنوانُ إنستاباي» يبلغ أربعةً وثلاثين حرفاً بلا
                            موضعِ قطعٍ طبيعيّ، فيُكسر في منتصف كلمةٍ
                            («instapa/y») بخطّ ١٫١٥rem. والرقمُ لا يُبتر —
                            فيبقى كاملاً ويصغر بدل أن يُقطع قطعاً قبيحاً.
                          */}
                          <span
                            className="pay-m-num-v"
                            dir="ltr"
                            data-len={m.number.length > 26 ? "xl" : m.number.length > 16 ? "l" : "m"}
                          >
                            {m.number}
                          </span>
                          <button
                            type="button"
                            onClick={() => copy(m.number)}
                            className="pay-m-copy"
                            data-copied={copied === m.number ? "1" : "0"}
                            aria-label={`انسخ ${numberLabel(m.kind)}`}
                          >
                            {copied === m.number
                              ? <><IconCheck className="size-3.5" /> نُسخ</>
                              : <><IconCopy className="size-3.5" /> نسخ</>}
                          </button>
                        </span>
                      </div>

                      {/*
                        «بيانات إضافية» لا تُعاد إن كانت هي صاحبَ الحساب —
                        كان الاسمُ يُكتب مرّتين في البطاقة الواحدة.
                      */}
                      {m.extra && m.extra.trim() !== (m.holder ?? "").trim() && (
                        <div className="pay-m-body">
                          <Row label="بيانات إضافية" value={m.extra} onCopy={copy} copied={copied} />
                        </div>
                      )}
                      {m.note && <p className="pay-m-note">{m.note}</p>}

                      <button
                        type="button"
                        onClick={() => setMethod(m)}
                        className="pay-m-pick"
                      >
                        {method?.id === m.id
                          ? <><IconCheck className="size-3.5" /> حوّلتُ على هذه</>
                          : "حوّلتُ على هذه"}
                      </button>
                    </div>
                  ))}
                </div>

                {method && (
                  <button type="button" onClick={() => setStepDone(true)} className="btn-glow pay-go mt-4">
                    <IconCheckCircle className="size-4" /> تابع — أرفق الإيصال
                  </button>
                )}
              </>
            )}
          </Step>
        )}

        {/* ---------- ٣ · التحويل ---------- */}
        {step === 2 && plan && method && (
          <Step key="pay">
            <Head onBack={() => setStepDone(false)} />

            <p className="pay-sec-t mb-2">حوّلتَ على «{method.name}» — راجع البيانات:</p>
            <div className="pay-details mb-4">
              <Row label={numberLabel(method.kind)} value={method.number} onCopy={copy} copied={copied} big />
              {method.holder && <Row label="اسم صاحب الحساب" value={method.holder} onCopy={copy} copied={copied} />}
              {/* لا تُعاد إن كانت هي صاحبَ الحساب — كان «محمد» يُكتب مرّتين */}
              {method.extra && method.extra.trim() !== (method.holder ?? "").trim() && (
                <Row label="بيانات إضافية" value={method.extra} onCopy={copy} copied={copied} />
              )}
            </div>

            {method.note && (
              <p className="mb-4 rounded-2xl bg-primary/5 px-3.5 py-2.5 text-[11px] leading-relaxed text-muted-foreground">
                {method.note}
              </p>
            )}

            <p className="pay-sec-t mb-2">بيانات من حوّل:</p>
            {/*
              الحقولُ القصيرةُ تصطفّ اثنين اثنين.
              رقمُ الهاتف واسمُ المحوِّل لا يحتاج أحدُهما سطراً كاملاً —
              وعمودٌ من حقولٍ كلُّها بعرض اللوح يُطيل الشاشةَ بلا فائدة
              ويجعل الاستمارةَ تبدو أطولَ ممّا هي، فيُحجم من يملؤها.
            */}
            <div className="pay-stack pay-stack-2">
              {/*
                الرقم المُحوَّل منه هو ما تُطابَق به العملية في كشف
                الحساب، فهو مطلوب دائماً لا بحسب الإعداد.
              */}
              {/*
                الحقلُ يتبع الطريقة.
                ------------------------------------------------------
                كان عنواناً واحداً ولوحةً رقميّةً لكلّ الطرق. ومن حوّل
                بإنستاباي أو بحوالةٍ بنكيّة ليس عنده «رقمٌ» يكتبه: عنده
                رقمُ حسابٍ، أو اسمُ مستخدمٍ فيه نقطةٌ وحروفٌ لاتينيّة، أو
                اسمُه كما ظهر في الحوالة — ولوحةٌ رقميّةٌ لا تكتب ذلك.

                والخطأُ يُقال عند الكتابة لا عند الإرسال: من كتب عشرةَ
                أرقامٍ يعرف الآن، لا بعد أن يضغط «إرسال».
              */}
              <Field label={senderLabel(method.kind)} required>
                <input
                  value={senderAccount}
                  onChange={(e) => {
                    setSenderAccount(e.target.value);
                    if (senderErr) setSenderErr(senderProblem(method.kind, e.target.value));
                  }}
                  onBlur={() => setSenderErr(senderProblem(method.kind, senderAccount))}
                  dir={senderIsPhone(method.kind) ? "ltr" : "auto"}
                  inputMode={senderIsPhone(method.kind) ? "numeric" : "text"}
                  placeholder={senderPlaceholder(method.kind)}
                  aria-invalid={senderErr ? true : undefined}
                  className={`pay-f-i text-right ${senderIsPhone(method.kind) ? "font-mono" : ""} ${senderErr ? "pay-f-bad" : ""}`}
                />
                {senderErr && <span className="pay-f-msg">{senderErr}</span>}
              </Field>

              <Field label="اسم من حوّل المبلغ" required={cfg.requireSender !== false}>
                <input
                  value={senderName}
                  onChange={(e) => setSenderName(e.target.value)}
                  placeholder="الاسم كما ظهر في رسالة التحويل"
                  className="pay-f-i"
                />
              </Field>

              <Field wide label="رقم العملية" hint="اختياري">
                <input
                  value={senderRef}
                  onChange={(e) => setSenderRef(e.target.value)}
                  placeholder="رقم مرجعي من رسالة التحويل"
                  className="pay-f-i font-mono"
                />
              </Field>

              {/* صورة الإيصال — منطقةٌ كاملةٌ لا زرٌّ صغير */}
              <Field wide label="صورة إيصال التحويل" required={cfg.requireReceipt !== false}>
                <label className="pay-drop">
                  {receipt ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={receipt} alt="إيصال التحويل" />
                  ) : uploading ? (
                    <IconSpinner className="size-6 shrink-0 animate-spin text-primary" />
                  ) : (
                    <IconCheck className="size-6 shrink-0 text-primary" />
                  )}
                  <span className="min-w-0">
                    <span className="pay-drop-t">{receipt ? "تم الرفع — اضغط للتغيير" : "اختر صورة الإيصال"}</span>
                    <span className="pay-drop-s">لقطةُ شاشةٍ لرسالة التحويل تكفي</span>
                  </span>
                  <input
                    type="file"
                    accept="image/*"
                    className="hidden"
                    disabled={uploading}
                    onChange={(e) => { const f = e.target.files?.[0]; e.target.value = ""; if (f) void upload(f); }}
                  />
                </label>
              </Field>

              <Field wide label="ملاحظة" hint="اختياري">
                <textarea value={note} onChange={(e) => setNote(e.target.value)} rows={2} className="pay-f-i" />
              </Field>
            </div>

            {err && <p className="pay-err mt-3">{err}</p>}

            <button type="button" onClick={submit} disabled={busy || uploading} className="btn-glow pay-go mt-4">
              {busy ? <IconSpinner className="size-4 animate-spin" /> : <IconCheckCircle className="size-4" />}
              إرسال طلب التفعيل — {ar(planPrice(plan).price)} ج.م
            </button>

            {cfg.note && (
              <p className="mt-3 text-center text-[11px] leading-relaxed text-muted-foreground">{cfg.note}</p>
            )}
          </Step>
        )}

        {/* ---------- ٤ · النتيجة ---------- */}
        {step === 3 && done && (
          <Step key="done">
            <Pending r={done} subject={subject} onClose={onDone} onRefresh={refresh} />
          </Step>
        )}
      </AnimatePresence>

    </div>
  );
}

/* ------------------------------------------------------------------ */

function Step({ children }: { children: React.ReactNode }) {
  return (
    <motion.div
      initial={{ opacity: 0, x: 18 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: -18 }}
      transition={{ duration: 0.22, ease: [0.22, 1, 0.36, 1] }}
    >
      {children}
    </motion.div>
  );
}

/**
 * ملخّصُ الطلب.
 * ما يُشترى ومبلغُه — والمبلغُ بأكبر خطٍّ في الشاشة، فهو الرقمُ الذي
 * يُقرَّر عليه. ويُعرض المشطوبُ بجانبه إن كان في الخطة خصم.
 */
function Summary({ plan, subject, termEnd }: { plan: SitePlan; subject?: Subject; termEnd?: string }) {
  const priced = planPrice(plan);
  const tone = planColor(plan);
  return (
    <div className="pay-sum mb-5" style={tone ? ({ "--pg-a": tone } as React.CSSProperties) : undefined}>
      <span className="pay-sum-n">
        <span className="pay-sum-t">{plan.name}</span>
        <span className="pay-sum-s">
          <IconCalendar className="size-3 shrink-0" />
          {planDuration(plan, termEnd)}
          {subject && <>· {subject.name}</>}
        </span>
      </span>
      <span className="pay-amt">
        {priced.active && <span className="pay-amt-was">{ar(priced.original)}</span>}
        <span className="pay-amt-v">{ar(priced.price)}</span>
        <span className="pay-amt-c">ج.م</span>
      </span>
    </div>
  );
}

function Head({ onBack }: { onBack: () => void }) {
  return (
    <button
      type="button"
      onClick={onBack}
      className="mb-3 inline-flex items-center gap-1 rounded-full border border-border px-3 py-1.5 text-[11px] font-bold text-muted-foreground transition hover:text-foreground"
    >
      <IconArrowLeft className="size-3 rotate-180" /> رجوع
    </button>
  );
}

function Empty({ children }: { children: React.ReactNode }) {
  return (
    <p className="rounded-2xl border border-dashed border-border p-5 text-center text-xs text-muted-foreground">
      {children}
    </p>
  );
}

/** حقلٌ واحدٌ تُبنى منه الاستمارة — فيستوي إيقاعُها. */
function Field({
  label, required, hint, wide, children,
}: {
  label: string; required?: boolean; hint?: string; wide?: boolean; children: React.ReactNode;
}) {
  return (
    <label className={`pay-f ${wide ? "pay-f-wide" : ""}`}>
      <span className="pay-f-l">
        {label}
        {required && <b className="pay-f-r"> *</b>}
        {hint && !required && <span className="opacity-70"> ({hint})</span>}
      </span>
      {children}
    </label>
  );
}

/**
 * صفُّ بياناتٍ يُنسخ بضغطة.
 * القيمةُ لا تُقصّ — رقمُ محفظةٍ مبتورٌ يُحوَّل به إلى غير أهله — وأيقونةُ
 * النسخ ظاهرةٌ لا في `title`، فاللمسُ لا يُظهر `title` أصلاً.
 */
function Row({
  label, value, onCopy, copied, big,
}: {
  label: string; value: string; onCopy: (v: string) => void; copied: string | null; big?: boolean;
}) {
  const on = copied === value;
  return (
    <button
      type="button"
      onClick={() => onCopy(value)}
      className={`pay-row ${big ? "pay-row-big" : ""}`}
      data-copied={on ? "1" : "0"}
      aria-label={`انسخ ${label}`}
    >
      <span className="pay-row-l">{label}</span>
      <span className="pay-row-v">
        <span className="pay-value">{value}</span>
        {on
          ? <IconCheck className="pay-row-i size-3.5" />
          : <IconCopy className="pay-row-i size-3.5" />}
      </span>
    </button>
  );
}

/** حالة الطلب — ما بعد الإرسال. */
function Pending({
  r, subject, onClose, onRefresh,
}: {
  r: PayRequest;
  subject?: Subject;
  onClose: () => void;
  onRefresh?: () => Promise<void>;
}) {
  const ok = r.status === "approved";
  const no = r.status === "rejected";
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState<string | null>(null);
  const [used, setUsed] = useState(Boolean(r.redeemedAt));

  /* التفعيل من مكانه — الكودُ أمامه، فلا يُطلب منه نسخُه ونقلُه. */
  const activate = async () => {
    if (!r.code) return;
    setErr(null);
    setBusy(true);
    const res = await fetch("/api/redeem", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        code: r.code,
        subjectId: subject?.id ?? (r.subjectId && !/^(\*|T[12])$/.test(r.subjectId) ? r.subjectId : undefined),
      }),
    });
    const data = await res.json().catch(() => ({}));
    setBusy(false);
    if (!res.ok) {
      if (/مستخدم|منته/.test(data.error ?? "")) { setUsed(true); return; }
      setErr(data.error || "تعذّر التفعيل");
      return;
    }
    setUsed(true);
    await onRefresh?.();
  };
  return (
    <div
      className={`flex flex-col items-center gap-3 rounded-2xl border p-6 text-center ${
        ok ? "border-emerald-500/30 bg-emerald-500/10"
          : no ? "border-rose-500/30 bg-rose-500/10"
            : "border-amber-500/30 bg-amber-500/10"
      }`}
    >
      <IconCheckCircle className={`size-11 ${ok ? "text-emerald-500" : no ? "text-rose-500" : "text-amber-500"}`} />
      <p className="font-display text-lg font-extrabold">
        {ok ? "تم قبول تحويلك 🎉" : no ? "لم يُقبل التحويل" : "طلبك قيد المراجعة"}
      </p>
      <p className="max-w-xs text-sm text-muted-foreground">
        {ok
          ? "هذا كود التفعيل — أدخله بالأسفل لتفعيل اشتراكك."
          : no
            ? r.reason || "راجع بيانات التحويل ثم أرسل الطلب مرّة أخرى."
            : "وصل طلبك للمشرفة. سيصلك كود التفعيل في الإشعارات فور مراجعة التحويل."}
      </p>
      {ok && r.code && (
        <>
          <p className="rounded-xl bg-white/70 px-4 py-2 font-mono text-base font-extrabold tracking-wider text-emerald-700 dark:bg-black/30 dark:text-emerald-300">
            {r.code}
          </p>
          {used ? (
            <span className="rounded-full bg-emerald-500/20 px-3 py-1 text-xs font-bold text-emerald-700 dark:text-emerald-300">
              تم التفعيل ✓
            </span>
          ) : (
            <button
              type="button"
              onClick={activate}
              disabled={busy}
              className="btn-glow inline-flex items-center gap-2 rounded-2xl px-6 py-2.5 text-sm font-bold text-white disabled:opacity-60"
            >
              {busy ? <IconSpinner className="size-4 animate-spin" /> : <IconCheckCircle className="size-4" />}
              فعّل الآن
            </button>
          )}
          {err && <span className="text-[11px] font-bold text-rose-500">{err}</span>}
        </>
      )}
      <p className="text-[11px] text-muted-foreground">
        {r.planName} · {ar(r.amount)} ج.م · <span className="font-mono">{r.id}</span>
      </p>
      <button
        type="button"
        onClick={onClose}
        className="rounded-2xl border border-border px-4 py-2 text-xs font-bold"
      >
        إغلاق
      </button>
    </div>
  );
}

/*
  «طلباتي السابقة» رُفعت من البوّابة.
  ------------------------------------------------------------------
  كانت تسرد آخرَ أربعة طلباتٍ بمبالغها وأكوادِ تفعيلها المقبولة. وهي
  حشوٌ في شاشةٍ غرضُها إتمامُ عمليةٍ واحدة: من فتح البوّابةَ ليدفع لا
  يُعرض عليه سجلُّ ما دفع، والطلبُ القائمُ يُعرض وحدَه في `Pending`
  فيبقى الاطمئنانُ الذي كانت تؤدّيه.

  ورفعُها يُخفي معها أكوادَ التفعيل المقبولة من الشاشة — وهي أسرارٌ
  لا يُحسن بثُّها في قائمةٍ تُقرأ من فوق الكتف.
*/
