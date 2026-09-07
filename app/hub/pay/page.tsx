"use client";

/**
 * بوّابةُ الدفع — صفحةٌ احترافيّة يدفع منها المدرّس اشتراكَه.
 * ------------------------------------------------------------------
 * تُحمِّل فواتيرَه وطرقَ الدفع المتاحة، ويملأ:
 *   ١) اسمُ المحوِّل   ٢) رقمُه   ٣) رقمُ العملية   ٤) صورةُ الإيصال
 * ثمّ تُرسَل للمراجعة ويُفعَّل اشتراكُه بعد اعتماد الأدمن.
 */

import { useCallback, useEffect, useRef, useState } from "react";
import Link from "next/link";

type Method = { kind: string; label: string; number: string };
type Invoice = { id: string; amountEGP: number; status: string; createdAt: string; planId: string };
type PayData = {
  owner: { name: string; email: string };
  subscription: { id: string; status: string; periodEnd: string; planId: string } | null;
  plan: { name: string; price: number; interval: string } | null;
  invoices: Invoice[];
  methods: Method[];
  paymob: boolean;
};

const STATUS_AR: Record<string, string> = {
  pending: "بانتظار الدفع",
  paid: "مدفوعة",
  failed: "فشلت",
  rejected: "مرفوضة",
  refunded: "مستردّة",
};

const STATUS_CLR: Record<string, string> = {
  pending: "bg-amber-100 text-amber-800",
  paid: "bg-emerald-100 text-emerald-800",
  failed: "bg-red-100 text-red-800",
  rejected: "bg-red-100 text-red-800",
};

const INTERVAL_AR: Record<string, string> = { month: "شهرياً", quarter: "ربع سنوي", year: "سنوياً" };

export default function PayPage() {
  const [data, setData] = useState<PayData | null>(null);
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState("");
  const [step, setStep] = useState<"methods" | "form" | "done">("methods");
  const [method, setMethod] = useState(0);
  const [senderName, setSenderName] = useState("");
  const [senderNumber, setSenderNumber] = useState("");
  const [transactionRef, setTransactionRef] = useState("");
  const [receipt, setReceipt] = useState("");
  const [receiptName, setReceiptName] = useState("");
  const [busy, setBusy] = useState(false);
  const [copied, setCopied] = useState(false);
  const pick = useRef<HTMLInputElement>(null);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const r = await fetch("/api/hub/owner");
      if (r.status === 401) { window.location.href = "/start"; return; }
      const d = await r.json();
      if (!r.ok) { setErr(d.error || "خطأ"); return; }
      setData(d);
    } catch { setErr("تعذّر الاتصال"); }
    finally { setLoading(false); }
  }, []);

  useEffect(() => { load(); }, [load]);

  const onFile = (f: File) => {
    if (f.size > 300_000) { setErr("حجم الصورة أكبر من ٣٠٠ كيلوبايت — قلّل جودتها أو استخدم لقطة شاشة."); return; }
    setErr("");
    setReceiptName(f.name);
    const r = new FileReader();
    r.onload = () => setReceipt(String(r.result));
    r.readAsDataURL(f);
  };

  const copyNum = (num: string) => {
    navigator.clipboard?.writeText(num);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const submit = async () => {
    setErr("");
    if (!senderName.trim()) { setErr("أدخل اسم المحوِّل"); return; }
    if (!senderNumber.trim()) { setErr("أدخل رقم المحوِّل"); return; }
    if (!transactionRef.trim()) { setErr("أدخل رقم العملية"); return; }
    if (!receipt) { setErr("أرفق صورة الإيصال"); return; }
    if (!data) return;

    const m = data.methods[method];
    const pending = data.invoices.find((i) => i.status === "pending");

    setBusy(true);
    try {
      const r = await fetch("/api/hub/owner", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "pay",
          invoiceId: pending?.id ?? "",
          kind: m?.kind ?? "wallet",
          senderName: senderName.trim(),
          senderNumber: senderNumber.trim(),
          transactionRef: transactionRef.trim(),
          receipt,
        }),
      });
      const d = await r.json();
      if (!r.ok) { setErr(d.error || "فشل الإرسال"); return; }
      setStep("done");
    } catch { setErr("تعذّر الاتصال"); }
    finally { setBusy(false); }
  };

  if (loading) {
    return (
      <div className="pay-page">
        <div className="pay-card pay-center">
          <div className="pay-spinner" />
          <p className="pay-muted">جارٍ التحميل…</p>
        </div>
      </div>
    );
  }

  if (!data) {
    return (
      <div className="pay-page">
        <div className="pay-card pay-center">
          <p className="pay-error">{err || "تعذّر تحميل البيانات"}</p>
          <Link href="/start" className="pay-link">العودة</Link>
        </div>
      </div>
    );
  }

  const pending = data.invoices.find((i) => i.status === "pending");
  const amount = pending?.amountEGP ?? data.plan?.price ?? 0;
  const planName = data.plan?.name ?? "—";
  const interval = INTERVAL_AR[data.plan?.interval ?? ""] ?? "";

  if (step === "done") {
    return (
      <div className="pay-page">
        <div className="pay-card pay-center">
          <div className="pay-done-icon">✓</div>
          <h2 className="pay-done-title">تمّ إرسال الإيصال</h2>
          <p className="pay-done-text">
            نراجع دفعتك ونفعّل منصّتك في أقرب وقت.
            <br />ستصلك إشعارٌ عند التفعيل.
          </p>
          <Link href="/start" className="pay-btn-primary">العودة للمنصّة</Link>
        </div>
      </div>
    );
  }

  return (
    <div className="pay-page">
      <div className="pay-card">
        {/* الترويسة */}
        <div className="pay-header">
          <div className="pay-logo">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className="pay-logo-icon">
              <rect x="2" y="5" width="20" height="14" rx="3" />
              <path d="M2 10h20" />
            </svg>
          </div>
          <h1 className="pay-title">بوّابة الدفع</h1>
          <p className="pay-subtitle">أكمل دفع اشتراكك لتفعيل منصّتك التعليمية</p>
        </div>

        {/* تفاصيل الاشتراك */}
        <div className="pay-plan">
          <div className="pay-plan-row">
            <span className="pay-plan-label">الخطة</span>
            <span className="pay-plan-value">{planName} <span className="pay-muted">{interval}</span></span>
          </div>
          <div className="pay-plan-row">
            <span className="pay-plan-label">المبلغ المطلوب</span>
            <span className="pay-plan-amount">{amount.toLocaleString("ar-EG")} ج.م</span>
          </div>
          {data.subscription && (
            <div className="pay-plan-row">
              <span className="pay-plan-label">حالة الاشتراك</span>
              <span className={`pay-badge ${STATUS_CLR[data.subscription.status] ?? "bg-gray-100 text-gray-700"}`}>
                {STATUS_AR[data.subscription.status] ?? data.subscription.status}
              </span>
            </div>
          )}
        </div>

        {step === "methods" && (
          <>
            {data.methods.length === 0 ? (
              <div className="pay-empty">
                <p>لم تُفعَّل طرق دفع يدوية بعد.</p>
                <p className="pay-muted">تواصل مع الدعم لتفعيل اشتراكك.</p>
              </div>
            ) : (
              <>
                <h2 className="pay-section-title">اختر طريقة الدفع</h2>
                <div className="pay-methods">
                  {data.methods.map((m, i) => (
                    <button
                      key={i}
                      type="button"
                      onClick={() => { setMethod(i); setStep("form"); }}
                      className="pay-method"
                    >
                      <span className="pay-method-icon">
                        {m.kind === "instapay" ? "🏦" : m.kind === "wallet" ? "📱" : "🏧"}
                      </span>
                      <span className="pay-method-info">
                        <span className="pay-method-name">{m.label}</span>
                        <span className="pay-method-num" dir="ltr">{m.number}</span>
                      </span>
                      <span className="pay-method-arrow">←</span>
                    </button>
                  ))}
                </div>
              </>
            )}
          </>
        )}

        {step === "form" && data.methods[method] && (
          <>
            <button type="button" onClick={() => setStep("methods")} className="pay-back">
              → تغيير طريقة الدفع
            </button>

            {/* رقم التحويل */}
            <div className="pay-dest">
              <span className="pay-dest-label">{data.methods[method].label}</span>
              <div className="pay-dest-row">
                <span className="pay-dest-num" dir="ltr">{data.methods[method].number}</span>
                <button type="button" onClick={() => copyNum(data.methods[method].number)} className="pay-copy">
                  {copied ? "تمّ النسخ ✓" : "نسخ"}
                </button>
              </div>
              <p className="pay-dest-hint">حوّل المبلغ <b>{amount.toLocaleString("ar-EG")} ج.م</b> إلى هذا الرقم ثمّ املأ البيانات أدناه.</p>
            </div>

            {/* الحقول */}
            <div className="pay-form">
              <label className="pay-field">
                <span className="pay-label">اسم المحوِّل <span className="pay-req">*</span></span>
                <input
                  className="pay-input"
                  value={senderName}
                  onChange={(e) => setSenderName(e.target.value)}
                  placeholder="الاسم كما يظهر في التحويل"
                />
              </label>

              <label className="pay-field">
                <span className="pay-label">رقم المحوِّل <span className="pay-req">*</span></span>
                <input
                  className="pay-input"
                  dir="ltr"
                  value={senderNumber}
                  onChange={(e) => setSenderNumber(e.target.value)}
                  placeholder="01xxxxxxxxx"
                />
              </label>

              <label className="pay-field">
                <span className="pay-label">رقم العملية <span className="pay-req">*</span></span>
                <input
                  className="pay-input"
                  dir="ltr"
                  value={transactionRef}
                  onChange={(e) => setTransactionRef(e.target.value)}
                  placeholder="رقم العملية أو مرجع التحويل"
                />
              </label>

              <div className="pay-field">
                <span className="pay-label">صورة الإيصال <span className="pay-req">*</span></span>
                <div className="pay-upload" onClick={() => pick.current?.click()}>
                  {receipt ? (
                    <div className="pay-receipt-preview">
                      <img src={receipt} alt="الإيصال" />
                      <span className="pay-receipt-name">{receiptName}</span>
                      <span className="pay-receipt-change">تغيير</span>
                    </div>
                  ) : (
                    <div className="pay-upload-placeholder">
                      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" style={{ width: "1.75rem", height: "1.75rem" }}>
                        <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
                        <polyline points="17 8 12 3 7 8" />
                        <line x1="12" y1="3" x2="12" y2="15" />
                      </svg>
                      <span>اضغط لرفع صورة الإيصال</span>
                      <span className="pay-muted">PNG أو JPG — أقصى ٣٠٠ كيلوبايت</span>
                    </div>
                  )}
                </div>
                <input ref={pick} type="file" accept="image/*" hidden onChange={(e) => e.target.files?.[0] && onFile(e.target.files[0])} />
              </div>
            </div>

            {err && <p className="pay-error">{err}</p>}

            <button
              type="button"
              onClick={submit}
              disabled={busy}
              className="pay-btn-primary pay-btn-full"
            >
              {busy ? "جارٍ الإرسال…" : "إرسال الدفعة للمراجعة"}
            </button>

            <p className="pay-footer-hint">بعد المراجعة والتأكّد من التحويل تُفعَّل منصّتك تلقائياً.</p>
          </>
        )}

        {/* سجلّ الفواتير */}
        {data.invoices.length > 0 && (
          <div className="pay-history">
            <h3 className="pay-section-title">سجلّ الفواتير</h3>
            <div className="pay-table-wrap">
              <table className="pay-table">
                <thead>
                  <tr>
                    <th>التاريخ</th>
                    <th>المبلغ</th>
                    <th>الحالة</th>
                  </tr>
                </thead>
                <tbody>
                  {data.invoices.map((inv) => (
                    <tr key={inv.id}>
                      <td>{new Date(inv.createdAt).toLocaleDateString("ar-EG", { timeZone: "Africa/Cairo", year: "numeric", month: "short", day: "numeric" })}</td>
                      <td>{inv.amountEGP.toLocaleString("ar-EG")} ج.م</td>
                      <td>
                        <span className={`pay-badge-sm ${STATUS_CLR[inv.status] ?? "bg-gray-100 text-gray-700"}`}>
                          {STATUS_AR[inv.status] ?? inv.status}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
