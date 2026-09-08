"use client";

import { useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { AnimatePresence, motion } from "framer-motion";
import {
  IconPlay, IconBook, IconArrowLeft, IconLock, IconCart, IconClose,
  IconKey, IconSpinner, IconCheckCircle, IconGraduation, IconCalendar, IconCheck, IconSparkle, IconListVideo,
} from "@/components/brand/icons";
import { RuleOrnament } from "@/components/brand/pattern";
import { CourseArt } from "@/components/brand/course-art";
import { PageHeader, Card, Progress } from "@/components/dashboard/ui";
import { useContent } from "@/components/content/content-provider";
import { subjectActive, subscriptionFor, daysLeft, eligibleFor, termLabel } from "@/lib/auth/access";
import { planDuration, planScopeLabel } from "@/components/sections/plans";
import { planPrice, planColor, planWaLink, plansFor } from "@/lib/business/plans";
import type { Subject, SitePlan } from "@/lib/utils/types";
import { mediaSrc } from "@/lib/utils/media";
import { cleanPrefix, gatewayOn } from "@/lib/business/payments";
import { useMaintGate } from "@/components/brand/maint-gate";
import { ShariVector } from "@/components/brand/shari-vector";

const COLORS = ["#12b981", "#2b8bf6", "#7c3aed", "#e11d48", "#f59e0b", "#0ea5e9"];

/** بطاقة خطة اشتراك (من خطط الأدمن) — الشراء عبر واتساب ثم كود التفعيل. */
function PlanCard({ plan, subjectName, termEnd, href }: { plan: SitePlan; subjectName?: string; termEnd?: string; href: string }) {
  const priced = planPrice(plan);
  const tone = planColor(plan);
  return (
    <a href={href} target="_blank" rel="noreferrer"
      className={`group relative flex items-start justify-between gap-3 overflow-hidden rounded-2xl border p-4 transition ${plan.highlight ? "border-primary/50 bg-primary/5" : "border-border hover:border-primary/40"}`}
      style={plan.highlight && tone ? { borderColor: `${tone}80`, background: `${tone}0f` } : undefined}>
      {plan.badge && (
        <span className="absolute left-3 top-3 inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-bold text-white"
          style={{ background: tone ?? "hsl(var(--primary))" }}>
          <IconSparkle className="size-2.5" /> {plan.badge}
        </span>
      )}
      <div className="min-w-0">
        <p className="font-display font-extrabold">{plan.name}</p>
        <p className="text-xs text-muted-foreground">{plan.desc || planScopeLabel(plan, subjectName)}</p>
        <p className="mt-1 inline-flex items-center gap-1 text-[11px] text-muted-foreground">
          <IconCalendar className="size-3" /> {planDuration(plan, termEnd)}
        </p>
        {(plan.perks?.length ?? 0) > 0 && (
          <ul className="mt-2 space-y-0.5 text-[11px] text-muted-foreground">
            {plan.perks!.slice(0, 3).map((x, k) => (
              <li key={k} className="flex gap-1"><IconCheck className="mt-0.5 size-3 shrink-0 text-primary" />{x}</li>
            ))}
          </ul>
        )}
      </div>
      <div className="shrink-0 text-left">
        <p className="font-display text-2xl font-extrabold" style={{ color: tone ?? "hsl(var(--primary))" }}>
          {priced.price.toLocaleString("ar-EG")}
        </p>
        {priced.active && (
          <p className="text-[11px] font-bold text-muted-foreground line-through">{priced.original.toLocaleString("ar-EG")}</p>
        )}
        <p className="text-[10px] text-muted-foreground">ج.م</p>
        {priced.active && (
          <p className="mt-1 rounded-full bg-emerald-500/15 px-1.5 py-0.5 text-[11px] font-bold text-emerald-600">-{priced.percent}٪</p>
        )}
      </div>
    </a>
  );
}

/** الكورس يظهر للطالب فقط إذا طابق صفّه وشعبته (أو كان عاماً). */
export const eligible = eligibleFor;

export default function MySubjects() {
  /* بوّابةُ الصيانة — المشرفون يمرّون والطلاب يرون اللوح. */
  const maintGate = useMaintGate("courses");

  const { db, session, wa, content } = useContent();
  const me = db?.users.find((u) => u.id === session?.uid);
  const subjects = (db?.subjects ?? []).filter((s) => s.status === "منشورة" && eligibleFor(s, me));
  const owns = (c: Subject) => subjectActive(me, c);
  const fem = me?.gender === "female";
  const y = (v: string) => `${v}${fem ? "ي" : ""}`;
  const [buy, setBuy] = useState<Subject | null>(null);
  const payOn = gatewayOn(content.payments);
  /*
    الفصلان يظهران دائماً — كلاهما جزءٌ من المنهج لا خيارٌ يتوقّف على
    ما رُفع بعد، وإخفاءُ الفارغ منهما يُخفي عن الطالب أنّ هناك فصلاً
    ثانياً أصلاً.

    والافتراضُ وحده يبقى ذكياً: يقع على أوّل فصلٍ فيه كورسات، فمن كانت
    كورساتُه في الثاني لا يرى شاشةً فارغة عند الدخول.
  */
  const termsWithCourses = ([1, 2] as const).filter(
    (t) => subjects.some((c) => (c.term ?? 1) === t)
  );
  const [term, setTerm] = useState<1 | 2 | null>(null);
  const activeTerm = term ?? termsWithCourses[0] ?? 1;
  const termSubjects = subjects.filter((c) => (c.term ?? 1) === activeTerm);

  if (maintGate) return maintGate;

  return (
    <>
      <PageHeader title="الكورسات" subtitle={`${fem ? "اختاري" : "اختر"} الكورس الذي تريد${fem ? "ين" : ""} دراسته — ${y("فعّل")}ه بكود التفعيل بعد الشراء`} />

      {/* الفصلان — يظهران دائماً وعدّادُ كلٍّ منهما بجانبه */}
      {subjects.length > 0 && (
        <div className="mb-5 flex flex-wrap gap-2">
          {([1, 2] as const).map((id) => {
            const t = { id, label: id === 1 ? "الفصل الدراسي الأول" : "الفصل الدراسي الثاني" };
            const count = subjects.filter((x) => (x.term ?? 1) === t.id).length;
            const active = activeTerm === t.id;
            return (
              <button key={t.id} onClick={() => setTerm(t.id)}
                className={`inline-flex items-center gap-2 rounded-full px-5 py-2.5 text-sm font-bold transition ${
                  active ? "btn-glow text-white" : "border border-border text-muted-foreground hover:text-foreground"
                }`}>
                {t.label}
                <span className={`rounded-full px-2 py-0.5 text-[10px] font-extrabold ${active ? "bg-white/20" : "bg-muted"}`}>
                  {count.toLocaleString("ar-EG")}
                </span>
              </button>
            );
          })}
        </div>
      )}

      {subjects.length === 0 && (
        <Card className="flex flex-col items-center gap-3 py-14 text-center">
          <ShariVector id="quranWrite" size={176} />
          <p className="font-display text-lg font-extrabold">لا توجد كورسات متاحة بعد</p>
          <p className="max-w-sm text-sm text-muted-foreground">سيتم إضافة الكورسات قريباً — تابعينا.</p>
        </Card>
      )}

      {subjects.length > 0 && termSubjects.length === 0 && (
        <Card className="flex flex-col items-center gap-3 py-12 text-center">
          <ShariVector id="mosqueNight" size={160} />
          <p className="font-display font-extrabold">لا توجد كورسات في {termLabel(activeTerm)}</p>
          <p className="text-sm text-muted-foreground">جرّب الفصل الآخر من الأعلى.</p>
        </Card>
      )}

      <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
        {termSubjects.map((c, i) => {
          const owned = owns(c);
          const color = COLORS[i % COLORS.length];
          const progress = me?.progress?.[c.id] ?? 0;
          return (
            <motion.div key={c.id} initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.06 }}>
              <Card className="group relative flex h-full flex-col overflow-hidden !p-4">

                {/* لوحة الغلاف — SVG بالكامل (زخرفة مولّدة من معرّف الكورس بلا صورة) */}
                <div className="relative overflow-hidden rounded-2xl">
                  <CourseArt
                    seed={c.id}
                    title={c.name}
                    cover={c.cover}
                    coverFit={c.coverFit}
                    coverRatio={c.coverRatio}
                    coverColor={c.coverColor}
                    coverPattern={c.coverPattern}
                    coverText={c.coverText}
                    coverStickers={c.coverStickers}
                    progress={owned ? progress : undefined}
                    locked={!owned}
                    className="transition-opacity duration-300 group-hover:opacity-95"
                  />
                  <span className={`absolute right-3 top-3 inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-[10px] font-extrabold backdrop-blur ${
                    owned ? "bg-emerald-500/85 text-white" : "bg-black/55 text-white"
                  }`}>
                    {owned ? <IconPlay className="size-3" /> : <IconLock className="size-3" />}
                    {owned ? "مُفعّل" : "غير مُفعّل"}
                  </span>
                </div>

                <h3 className="mt-4 font-display text-lg font-extrabold leading-snug">{c.name}</h3>
                <p className="mt-0.5 text-xs text-muted-foreground">{c.teacher}</p>
                <RuleOrnament width={92} className="mt-2 text-primary" />

                <div className="mt-3 flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
                  <span className="inline-flex items-center gap-1"><IconBook className="size-3.5" /> {c.lessons} درس</span>
                  <span className="inline-flex items-center gap-1"><IconGraduation className="size-3.5" /> {c.grade}</span>
                  {c.track && c.track !== "الكل" && <span className="rounded-full bg-primary/12 px-2 py-0.5 font-bold text-primary">{c.track}</span>}
                  <span className="rounded-full bg-muted px-2 py-0.5 font-bold">{(c.term ?? 1) === 2 ? "الفصل ٢" : "الفصل ١"}</span>
                </div>

                {owned ? (
                  <>
                    {(() => {
                      const sub = subscriptionFor(me, c.id);
                      const left = daysLeft(sub?.expiresAt);
                      return (
                        <p className="mt-3 inline-flex items-center gap-1 rounded-full bg-emerald-500/10 px-2.5 py-1 text-[11px] font-bold text-emerald-500">
                          <IconCalendar className="size-3" />
                          {sub?.planName ?? "مُفعّل"}
                          {left !== null ? ` · متبقٍ ${left.toLocaleString("ar-EG")} يوم` : " · بلا انتهاء"}
                        </p>
                      );
                    })()}
                    <Link href={`/student/course/${c.id}`} className="mt-auto inline-flex w-full items-center justify-center gap-1 rounded-full btn-glow py-3 text-sm font-bold text-white">
                      {y("ادخل")} الكورس <IconArrowLeft className="size-4" />
                    </Link>
                  </>
                ) : (
                  /*
                    الدفع صفحةٌ لا قائمة عائمة: المساحة الضيّقة كانت تُمرَّر
                    فيها بيانات التحويل ورفعُ الإيصال، وتُغلق بضغطة خارجها
                    فيضيع ما كُتب. ومطفأةً تبقى القائمة القديمة لمسار واتساب.
                  */
                  /*
                    وكورسٌ يبيع موادَّه مفرَّقةً لا يُساق صاحبُه إلى بوّابة
                    الدفع. كان الزرُّ يذهب إلى الدفع دائماً مهما ضُبط
                    الكورس، فيُعرض على الطالب شراءُ المنهج كلِّه وهو مضبوطٌ
                    على بيع الأبواب — والإعدادُ في اللوحة لا أثرَ له.
                    فيُفتح على الموادّ ليرى ما فيها ويشتري ما يحتاج.
                  */
                  (c.entryMode ?? "gateway") === "materials" ? (
                    <Link href={`/student/course/${c.id}`} className="mt-auto inline-flex w-full items-center justify-center gap-2 rounded-full border border-primary/40 py-3 text-sm font-bold text-primary transition hover:bg-primary/10">
                      <IconListVideo className="size-4" /> تصفَّح الموادّ واشترِ ما تريد
                    </Link>
                  ) : payOn ? (
                    <Link href={`/student/pay?subject=${c.id}`} className="mt-auto inline-flex w-full items-center justify-center gap-2 rounded-full border border-primary/40 py-3 text-sm font-bold text-primary transition hover:bg-primary/10">
                      <IconCart className="size-4" /> شراء / تفعيل
                    </Link>
                  ) : (
                    <button onClick={() => setBuy(c)} className="mt-auto inline-flex w-full items-center justify-center gap-2 rounded-full border border-primary/40 py-3 text-sm font-bold text-primary transition hover:bg-primary/10">
                      <IconCart className="size-4" /> شراء / تفعيل
                    </button>
                  )
                )}
              </Card>
            </motion.div>
          );
        })}
      </div>

      <AnimatePresence>
        {buy && (
          <PurchasePanel subject={buy} wa={wa} fem={fem} onClose={() => setBuy(null)} />
        )}
      </AnimatePresence>
    </>
  );
}

function PurchasePanel({
  subject, wa, fem, onClose,
}: {
  subject: Subject; wa: (t?: string) => string; fem: boolean; onClose: () => void;
}) {
  const { refresh, content, db, session } = useContent();
  const codePrefix = cleanPrefix(content.codePrefix);
  const y = (v: string) => `${v}${fem ? "ي" : ""}`;
  // خطط هذا الكورس + خطط «كل المواد» — كلها من إدارة الخطط في لوحة الأدمن
  const me = db?.users?.find((u) => u.id === session?.uid);
  /*
    خيارات سعر الكورس تُعرض أوّلاً ثم خطط المنصّة — الأقرب للكورس قبل
    الأعمّ، وكلاهما بشكل الخطة نفسه فلا يفترق مسار الشراء.
  */
  const plans = plansFor(subject, db?.plans ?? [], me);
  const [code, setCode] = useState("");
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState<string | null>(null);
  const [done, setDone] = useState(false);

  const activate = async () => {
    setErr(null);
    if (!code.trim()) { setErr(`${y("أدخل")} كود التفعيل`); return; }
    setBusy(true);
    const res = await fetch("/api/redeem", {
      method: "POST", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ code, subjectId: subject.id }),
    });
    const data = await res.json();
    setBusy(false);
    if (!res.ok) { setErr(data.error || "تعذّر التفعيل"); return; }
    setDone(true);
    await refresh();
    setTimeout(onClose, 1400);
  };

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={onClose}
      className="fixed inset-0 z-[120] flex items-end justify-center bg-black/60 backdrop-blur-sm sm:items-center sm:p-4">
      <motion.div initial={{ y: 40, opacity: 0.6 }} animate={{ y: 0, opacity: 1 }} exit={{ y: 40, opacity: 0 }}
        transition={{ type: "spring", stiffness: 320, damping: 32 }} onClick={(e) => e.stopPropagation()}
        className="glass max-h-[92dvh] w-full max-w-md overflow-y-auto rounded-t-3xl p-6 pb-[max(1.5rem,env(safe-area-inset-bottom))] shadow-bento sm:rounded-3xl sm:pb-6">
        <span aria-hidden className="mx-auto mb-4 block h-1 w-10 rounded-full bg-border sm:hidden" />
        <div className="mb-4 flex items-start justify-between gap-3">
          <div>
            <p className="text-xs font-bold text-primary">تفعيل كورس</p>
            <h3 className="font-display text-xl font-extrabold">{subject.name}</h3>
            <p className="mt-1 text-xs text-muted-foreground">{subject.teacher} · {subject.lessons} درس · {subject.grade}</p>
          </div>
          <button onClick={onClose} className="grid size-8 shrink-0 place-items-center rounded-full border border-border"><IconClose className="size-4" /></button>
        </div>

        {done ? (
          <div className="flex flex-col items-center gap-3 rounded-2xl border border-emerald-500/30 bg-emerald-500/10 p-6 text-center">
            <IconCheckCircle className="size-12 text-emerald-500" />
            <p className="font-display text-lg font-extrabold">تم تفعيل الكورس 🎉</p>
            <p className="text-sm text-muted-foreground">يمكنك الآن مشاهدة كل دروس «{subject.name}» من صفحة الكورس.</p>
          </div>
        ) : (
          <>
            {/* خطط الاشتراك (من لوحة الأدمن) */}
            {plans.length > 0 ? (
              <>
                <p className="mb-3 text-xs font-bold text-muted-foreground">{y("اختر")} خطة الاشتراك:</p>
                <div className="grid gap-3">
                  {plans.map((p) => (
                    <PlanCard key={p.id} plan={p} subjectName={subject.name} termEnd={content.termEnd}
                      /* رقم واتساب الخطة إن ضُبط، وإلا رقم المنصّة العام */
                      href={planWaLink(
                        p,
                        content.whatsapp,
                        `أريد الاشتراك في خطة «${p.name}»${p.scope === "subject" ? ` لكورس «${subject.name}»` : ""}`
                      )} />
                  ))}
                </div>
              </>
            ) : (
              <p className="rounded-2xl border border-dashed border-border p-4 text-center text-xs text-muted-foreground">
                لم تُضَف خطط بعد — {y("تواصل")} مع الدعم على واتساب.
              </p>
            )}

            <p className="mt-4 text-[11px] leading-relaxed text-muted-foreground">
              {y("حوّل")} قيمة الخطة على فودافون كاش/إنستاباي، {y("أرسل")} الإيصال على واتساب لتصلك أكواد التفعيل، ثم {y("أدخل")} الكود بالأسفل.
            </p>

            <div className="my-4 flex items-center gap-3 text-xs text-muted-foreground">
              <span className="h-px flex-1 bg-border" /> {y("أدخل")} كود التفعيل <span className="h-px flex-1 bg-border" />
            </div>

            {/* كود التفعيل */}
            <div className="flex items-center gap-2">
              <div className="relative flex-1">
                <IconKey className="absolute right-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
                <input value={code} onChange={(e) => setCode(e.target.value)} onKeyDown={(e) => e.key === "Enter" && activate()}
                  placeholder={`${codePrefix}-XXXX-XXXX`} className="w-full rounded-2xl border border-border bg-card/60 py-3 pr-10 pl-3 text-center font-mono text-sm tracking-wider outline-none focus:border-primary/60" />
              </div>
              <button onClick={activate} disabled={busy}
                className="inline-flex items-center gap-1.5 rounded-2xl btn-glow px-5 py-3 text-sm font-bold text-white disabled:opacity-60">
                {busy ? <IconSpinner className="size-4 animate-spin" /> : <IconCheckCircle className="size-4" />} تفعيل
              </button>
            </div>
            {err && <p className="mt-3 rounded-2xl bg-rose-500/10 px-3 py-2 text-center text-xs font-bold text-rose-500">{err}</p>}
          </>
        )}
      </motion.div>
    </motion.div>
  );
}
