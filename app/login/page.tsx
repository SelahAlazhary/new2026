"use client";

/**
 * شاشةُ الدخول.
 * ------------------------------------------------------------------
 * الحمايةُ في الخادم لا في الشاشة: حظرُ العناوين، وفحصُ الأصل، وحدّان
 * للمحاولات، وربطُ الجهاز، وسجلُّ الأمان — كلُّها في
 * `app/api/auth/login/route.ts`. وما يُكتب هنا لا يحمي شيئاً، لأنّ
 * الطلبَ يُرسَل من غير هذه الشاشة أيضاً.
 *
 * **فوظيفةُ الشاشة أن تُفهم لا أن تحرس.** وكانت لا تفعل: سطرٌ أحمرُ
 * واحدٌ لكلّ خطأ. والطالبُ الذي كتب `gmial.com` يقرأ «بيانات الدخول غير
 * صحيحة» فيُعيد كتابةَ كلمة المرور مرّاتٍ وهي صحيحة، حتّى يُقفل عليه
 * الحساب — والخطأُ حرفٌ في النطاق.
 *
 * **فستُّ حالاتٍ تُفصَل وتُسمّى:**
 *
 * ١ ــ **خطأٌ مطبعيٌّ في النطاق** — يُقترح البديلُ ويُصحَّح بضغطة، ولا
 *      يُصحَّح تلقائياً: التصحيحُ من تلقاء النفس يُفسد بريداً صحيحاً على
 *      نطاقٍ يشبه المشهور.
 *
 * ٢ ــ **قفلُ الحروف الكبيرة** — أكثرُ ما يُفشل كلمةَ مرورٍ صحيحة، ولا
 *      يُرى لأنّ الحقلَ نقاط. يُنبَّه عليه قبل الإرسال.
 *
 * ٣ ــ **التقييد (429)** — كان سطراً يقول «انتظر خمس دقائق» ثمّ يُترك
 *      الزرُّ مفتوحاً فيضغط الطالبُ فيزيد المدّة. صار عدّاً تنازليّاً حيّاً
 *      من ترويسة `Retry-After` والزرُّ مقفلٌ حتّى ينتهي.
 *
 * ٤ ــ **جهازٌ آخر (`device_mismatch`)** — ليس خطأً في البيانات بل قرارُ
 *      أمانٍ له سببٌ ومَخرج، فيُعرض شرحُه وطريقُ الدعم لا سطرٌ أحمر.
 *
 * ٥ ــ **حسابٌ موقوف (403)** — كذلك.
 *
 * ٦ ــ **انقطاعُ الشبكة** — يُقال إنّه انقطاعٌ لا «بيانات خاطئة».
 *
 * **ولا يُكشف وجودُ الحساب من عدمه**: الخادمُ يردّ رسالةً واحدةً للبريد
 * المجهول ولكلمة المرور الخاطئة، والشاشةُ لا تستنتج ولا تفرّق — وإلّا
 * صارت أداةَ عدٍّ للحسابات.
 */

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { LogIn, Loader2, Eye, EyeOff, ShieldAlert, WifiOff, ArrowLeftRight, Info } from "lucide-react";
import { AuthShell, inputCls } from "@/components/auth/auth-shell";
import { useContent } from "@/components/content/content-provider";
import { useMaintGate } from "@/components/brand/maint-gate";
import { emailHint } from "@/lib/utils/email-hint";
import { setPref, getPref } from "@/lib/auth/consent";

/** مفتاحُ تذكُّر البريد — تفضيلٌ يمرّ من بوّابة الموافقة كغيره. */
const LAST_EMAIL = "mk.lastEmail";

type Problem =
  | { kind: "field"; msg: string }
  | { kind: "credentials"; msg: string; left?: number }
  | { kind: "throttled"; msg: string; until: number }
  | { kind: "device"; msg: string }
  | { kind: "suspended"; msg: string }
  | { kind: "offline"; msg: string }
  | null;

export default function LoginPage() {
  /* بوّابةُ الصيانة — المشرفون يمرّون والطلاب يرون اللوح. */
  const maintGate = useMaintGate("login");

  const router = useRouter();
  const { refresh, content } = useContent();
  const [form, setForm] = useState({ username: "", password: "" });
  const [showPass, setShowPass] = useState(false);
  const [busy, setBusy] = useState(false);
  const [problem, setProblem] = useState<Problem>(null);

  /*
    الردُّ من الحارس، لا من شاشة الدخول.
    ------------------------------------------------------------------
    فحصُ الجهاز صار يقع في كلّ طلبٍ لصفحةٍ محميّة لا عند الدخول وحدَه
    (انظر `deviceMatches`). ومن رُدَّ منه يصل إلى هنا بـ`?device=1` ولم
    يكتب شيئاً بعد — فلو تُرك بلا بيانٍ لظنّ أنّه خرج من تلقاء نفسه،
    وأعاد المحاولةَ مرّاتٍ بلا أن يعرف أنّ المشكلة في الجهاز لا في كلمة
    المرور.
  */
  useEffect(() => {
    if (new URLSearchParams(window.location.search).get("device") !== "1") return;
    setProblem({
      kind: "device",
      msg: "هذا الحساب مرتبطٌ بجهازٍ آخر. للدخول من هذا الجهاز تواصل مع الدعم للسماح به.",
    });
  }, []);
  const [caps, setCaps] = useState(false);
  const [remember, setRemember] = useState(true);
  const [now, setNow] = useState(() => Date.now());
  const [fails, setFails] = useState(0);
  const passRef = useRef<HTMLInputElement>(null);
  const userRef = useRef<HTMLInputElement>(null);
  /* فخُّ الآليّات: حقلٌ لا يراه إنسانٌ ولا يملؤه — والخادمُ يرفض ما مُلئ. */
  const trapRef = useRef<HTMLInputElement>(null);

  /* البريدُ المتذكَّر يُملأ ويُنقل التركيزُ إلى كلمة المرور — فلا يُعاد
     كتابةُ ما لم يتغيّر. */
  useEffect(() => {
    const saved = getPref(LAST_EMAIL);
    if (saved) {
      setForm((f) => ({ ...f, username: saved }));
      requestAnimationFrame(() => passRef.current?.focus());
    } else {
      requestAnimationFrame(() => userRef.current?.focus());
    }
  }, []);

  /* العدّادُ التنازليُّ لا يدقّ إلّا أثناء التقييد */
  useEffect(() => {
    if (problem?.kind !== "throttled") return;
    const t = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(t);
  }, [problem?.kind]);

  const waitLeft =
    problem?.kind === "throttled" ? Math.max(0, Math.ceil((problem.until - now) / 1000)) : 0;
  const locked = waitLeft > 0;

  const hint = emailHint(form.username);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (busy || locked) return;

    if (!form.username.trim() || !form.password) {
      setProblem({ kind: "field", msg: "البريد الإلكتروني وكلمة المرور مطلوبان" });
      return;
    }
    if (typeof navigator !== "undefined" && navigator.onLine === false) {
      setProblem({ kind: "offline", msg: "لا يوجد اتصال بالإنترنت — تحقّق من الشبكة ثم أعد المحاولة." });
      return;
    }

    setProblem(null);
    setBusy(true);
    try {
      const res = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...form, website: trapRef.current?.value ?? "" }),
      });
      const data = await res.json().catch(() => ({}));

      if (!res.ok) {
        /*
          كلمةُ المرور تُمحى بعد كلّ فشل.
          تركُها مكتوبةً يُبقيها معروضةً لمن مرّ خلف الشاشة، ويُغري بإعادة
          الضغط بالخطأ نفسِه.
        */
        setForm((f) => ({ ...f, password: "" }));

        if (res.status === 429) {
          const hdr = Number(res.headers.get("Retry-After") ?? 0);
          const secs = Number.isFinite(hdr) && hdr > 0 ? hdr : 60;
          setNow(Date.now());
          setProblem({ kind: "throttled", msg: data.error || "محاولات كثيرة", until: Date.now() + secs * 1000 });
        } else if (data.code === "device_mismatch") {
          setProblem({ kind: "device", msg: data.error || "هذا الحساب مرتبط بجهاز آخر." });
        } else if (res.status === 403) {
          setProblem({ kind: "suspended", msg: data.error || "الحساب موقوف." });
        } else {
          const n = fails + 1;
          setFails(n);
          setProblem({ kind: "credentials", msg: data.error || "بيانات الدخول غير صحيحة", left: Math.max(0, 6 - n) });
          requestAnimationFrame(() => passRef.current?.focus());
        }
        return;
      }

      /* لا يُتذكَّر البريدُ إلّا بعد دخولٍ ناجح — وبإذن الموافقة */
      if (remember) setPref(LAST_EMAIL, form.username.trim());

      await refresh();
      const params = new URLSearchParams(window.location.search);
      const next = params.get("next");
      router.push(next || (data.role === "admin" ? "/admin" : "/student"));
      return;
    } catch {
      setProblem({
        kind: "offline",
        msg: "تعذّر الوصول إلى الخادم — تحقّق من اتصالك ثم أعد المحاولة.",
      });
      setForm((f) => ({ ...f, password: "" }));
    } finally {
      setBusy(false);
    }
  };

  if (maintGate) return maintGate;

  const wa = (content.whatsapp ?? "").replace(/\D/g, "");

  return (
    <AuthShell
      title="تسجيل الدخول"
      subtitle="ادخل إلى حسابك لمتابعة دروسك"
      footer={<>ليس لديك حساب؟ <Link href="/register" className="font-bold text-primary">أنشئ حساباً</Link></>}
    >
      <form onSubmit={submit} className="grid gap-3" noValidate>
        {/*
          فخُّ الآليّات — يُخفى عن العين وعن قارئ الشاشة معاً.
          و`display:none` وحدَه لا يكفي: بعضُ المالئات الآليّة تتخطّاه.
          والموضعُ خارجَ الشاشة مع `tabIndex={-1}` و`aria-hidden` يُبقيه
          في الصفحة ولا يبلغه إنسان.
        */}
        <input
          ref={trapRef}
          type="text"
          name="website"
          tabIndex={-1}
          aria-hidden="true"
          autoComplete="off"
          className="pointer-events-none absolute -left-[9999px] size-0 opacity-0"
        />

        <label className="block">
          <span className="mb-1 block text-xs font-semibold text-muted-foreground">
            البريد الإلكتروني <span className="text-rose-500">*</span>
          </span>
          <input
            ref={userRef}
            type="email"
            dir="ltr"
            className={`${inputCls} text-right`}
            value={form.username}
            onChange={(e) => setForm({ ...form, username: e.target.value })}
            placeholder="you@example.com"
            autoComplete="username"
            inputMode="email"
            spellCheck={false}
            autoCapitalize="none"
            autoCorrect="off"
          />
          {/* الاقتراحُ يُعرض ولا يُطبَّق — القرارُ لصاحب البريد */}
          {hint && (
            <button
              type="button"
              onClick={() => setForm((f) => ({ ...f, username: hint }))}
              className="mt-1.5 inline-flex items-center gap-1.5 rounded-full bg-[hsl(var(--gold)/0.18)] px-2.5 py-1 text-[11px] font-bold text-primary transition hover:brightness-95"
            >
              <Info className="size-3" />
              هل تقصد <span dir="ltr" className="font-mono">{hint}</span>؟
            </button>
          )}
        </label>

        <label className="block">
          <span className="mb-1 block text-xs font-semibold text-muted-foreground">
            كلمة المرور <span className="text-rose-500">*</span>
          </span>
          <span className="relative block">
            <input
              ref={passRef}
              type={showPass ? "text" : "password"}
              className={`${inputCls} pl-11`}
              value={form.password}
              onChange={(e) => setForm({ ...form, password: e.target.value })}
              /*
                قفلُ الحروف الكبيرة يُقرأ من الحدث لا من حالةٍ عامّة:
                لا سبيلَ لمعرفته إلّا عند ضغطةِ مفتاح.
              */
              onKeyUp={(e) => setCaps(e.getModifierState?.("CapsLock") ?? false)}
              onKeyDown={(e) => setCaps(e.getModifierState?.("CapsLock") ?? false)}
              onBlur={() => setCaps(false)}
              autoComplete="current-password"
            />
            <button
              type="button"
              tabIndex={-1}
              onClick={() => setShowPass((v) => !v)}
              aria-pressed={showPass}
              aria-label={showPass ? "إخفاء كلمة المرور" : "إظهار كلمة المرور"}
              className="absolute inset-y-0 left-0 grid w-11 place-items-center text-muted-foreground transition hover:text-primary"
            >
              {showPass ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
            </button>
          </span>
          {caps && (
            <p className="mt-1.5 inline-flex items-center gap-1.5 rounded-full bg-amber-500/15 px-2.5 py-1 text-[11px] font-bold text-amber-700 dark:text-amber-400">
              <ShieldAlert className="size-3" /> قفلُ الحروف الكبيرة مفعَّل (Caps Lock)
            </p>
          )}
        </label>

        <label className="flex cursor-pointer items-center gap-2 text-xs text-muted-foreground">
          <input
            type="checkbox"
            checked={remember}
            onChange={(e) => setRemember(e.target.checked)}
            className="size-4 accent-[hsl(var(--primary))]"
          />
          تذكَّر بريدي على هذا الجهاز
        </label>

        {problem && <ProblemBox p={problem} waitLeft={waitLeft} wa={wa} />}

        <button
          type="submit"
          disabled={busy || locked}
          className="mt-2 inline-flex items-center justify-center gap-2 rounded-2xl btn-glow py-3 text-sm font-bold text-white disabled:opacity-60"
        >
          {busy ? <Loader2 className="size-4 animate-spin" /> : <LogIn className="size-4" />}
          {locked ? `أعد المحاولة بعد ${fmt(waitLeft)}` : "دخول"}
        </button>
      </form>
    </AuthShell>
  );
}

/** ثوانٍ إلى «د:ث» — العدُّ بالثواني وحدَها لا يُقرأ فوق الدقيقة. */
function fmt(s: number): string {
  const m = Math.floor(s / 60);
  const r = s % 60;
  return m > 0 ? `${m}:${String(r).padStart(2, "0")}` : `${r} ثانية`;
}

/**
 * لوحُ المشكلة — لكلّ حالةٍ لونُها ورمزُها ومَخرجُها.
 * والمَخرجُ هو المقصود: خطأٌ بلا طريقٍ للخروج منه إحباطٌ لا إفادة.
 */
function ProblemBox({ p, waitLeft, wa }: { p: NonNullable<Problem>; waitLeft: number; wa: string }) {
  if (p.kind === "throttled") {
    return (
      <div className="rounded-2xl border border-amber-500/40 bg-amber-500/10 p-3">
        <p className="flex items-center gap-2 text-xs font-bold text-amber-700 dark:text-amber-400">
          <ShieldAlert className="size-4 shrink-0" /> أُوقفت المحاولات مؤقّتاً
        </p>
        <p className="mt-1 text-[11px] leading-relaxed text-muted-foreground">
          حمايةً للحساب من التخمين. تبقّى <b className="text-foreground">{fmt(waitLeft)}</b> ثمّ يُفتح الزرّ.
          والضغطُ أثناء الانتظار يُطيل المدّة، فلا تضغط.
        </p>
      </div>
    );
  }

  if (p.kind === "device") {
    return (
      <div className="rounded-2xl border border-sky-500/40 bg-sky-500/10 p-3">
        <p className="flex items-center gap-2 text-xs font-bold text-sky-700 dark:text-sky-400">
          <ArrowLeftRight className="size-4 shrink-0" /> الحساب مرتبطٌ بجهاز آخر
        </p>
        <p className="mt-1 text-[11px] leading-relaxed text-muted-foreground">
          {p.msg} وهذا ليس خطأً في بياناتك — بل حمايةٌ تمنع مشاركةَ الحساب.
        </p>
        {wa && (
          <a
            href={`https://wa.me/${wa}?text=${encodeURIComponent("السلام عليكم، أريد السماح بجهاز جديد لحسابي")}`}
            target="_blank"
            rel="noreferrer"
            className="mt-2 inline-flex rounded-full border border-sky-500/50 px-3 py-1 text-[11px] font-bold text-sky-700 transition hover:bg-sky-500/15 dark:text-sky-400"
          >
            راسل الدعم للسماح بهذا الجهاز
          </a>
        )}
      </div>
    );
  }

  if (p.kind === "suspended") {
    return (
      <div className="rounded-2xl border border-rose-500/40 bg-rose-500/10 p-3">
        <p className="flex items-center gap-2 text-xs font-bold text-rose-600 dark:text-rose-400">
          <ShieldAlert className="size-4 shrink-0" /> الحساب موقوف
        </p>
        <p className="mt-1 text-[11px] leading-relaxed text-muted-foreground">{p.msg}</p>
        {wa && (
          <a
            href={`https://wa.me/${wa}`}
            target="_blank"
            rel="noreferrer"
            className="mt-2 inline-flex rounded-full border border-rose-500/50 px-3 py-1 text-[11px] font-bold text-rose-600 transition hover:bg-rose-500/15 dark:text-rose-400"
          >
            تواصل مع الدعم
          </a>
        )}
      </div>
    );
  }

  if (p.kind === "offline") {
    return (
      <p className="inline-flex items-center gap-2 rounded-2xl bg-muted px-3 py-2 text-xs font-bold text-muted-foreground">
        <WifiOff className="size-4 shrink-0" /> {p.msg}
      </p>
    );
  }

  return (
    <div className="rounded-2xl bg-rose-500/10 px-3 py-2">
      <p className="text-xs font-bold text-rose-500">{p.msg}</p>
      {/*
        التنبيهُ قبل القفل لا بعده.
        الطالبُ الذي يُقفل عليه فجأةً يظنّ الحسابَ معطّلاً؛ ومن يعلم أنّه
        على وشك القفل يتمهّل ويراجع ما كتب.
      */}
      {p.kind === "credentials" && p.left !== undefined && p.left <= 3 && p.left > 0 && (
        <p className="mt-1 text-[11px] text-muted-foreground">
          بقيت لك <b className="text-foreground">{p.left.toLocaleString("ar-EG")}</b> محاولات قبل الإيقاف المؤقّت.
          راجع البريد وكلمة المرور، وتأكّد من قفل الحروف الكبيرة.
        </p>
      )}
    </div>
  );
}
