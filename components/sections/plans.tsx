"use client";

/**
 * قسم الخطط — بطاقات تسعير احترافية مبنية على SVG.
 * • لكل خطة لون خاص (من اللوحة) يلوّن ترويستها وزخرفتها وزرّها.
 * • الخصم أو الشارة يظهر كشريط قُطري في ركن البطاقة + السعر القديم مشطوباً + عدّاد انتهاء العرض.
 * • الخطة المميّزة ترتفع وتُوسَم، والترتيب من اللوحة.
 */
import { useEffect, useState } from "react";
import Link from "next/link";
import { motion } from "framer-motion";
import { SectionHeading, Reveal, Button } from "@/components/ui/primitives";
import { mediaSrc } from "@/lib/utils/media";
import { useContent } from "@/components/content/content-provider";
import {
  IconCheck, IconSparkle, IconCalendar, IconLayers, IconBook, IconWhatsapp, IconArrowLeft,
} from "@/components/brand/icons";
import { EmptyPlans } from "@/components/brand/illustrations";
import { useUid } from "@/components/brand/use-uid";
import { planPrice, planColor, planForStudent, planWaLink } from "@/lib/business/plans";
import { findPlansStyle, plansClass, plansGridClass } from "@/lib/styles/plans-styles";
import type { SitePlan } from "@/lib/utils/types";

/** وصف مدّة الخطة بلغة الطالب. */
export function planDuration(p: SitePlan, termEnd?: string): string {
  if (p.kind === "lifetime") return "اشتراك دائم — لا ينتهي";
  if (p.kind === "term") {
    const end = p.endsAt || termEnd;
    return end
      ? `حتى نهاية الترم (${new Date(end).toLocaleDateString("ar-EG", { timeZone: "Africa/Cairo",  day: "numeric", month: "long", year: "numeric" })})`
      : "طوال الترم الدراسي";
  }
  if (p.kind === "month") return `لمدة ${(p.durationDays ?? 30).toLocaleString("ar-EG")} يوماً`;
  if (p.durationDays && p.durationDays > 0) return `لمدة ${p.durationDays.toLocaleString("ar-EG")} يوماً`;
  return "اشتراك دائم";
}

export function planScopeLabel(p: SitePlan, subjectName?: string): string {
  if (p.scope === "all") return "كل المواد (الفصلان)";
  if (p.scope === "term") return `كل مواد ${p.termNo === 2 ? "الفصل الدراسي الثاني" : "الفصل الدراسي الأول"}`;
  return subjectName || "كورس محدّد";
}

/**
 * شريط الزاوية — لوح قُطري في الركن العلوي الأيسر من البطاقة.
 * ------------------------------------------------------------------
 * يوضع في الركن المقابل للأيقونة عمداً: وضعهما في ركن واحد كان يجعل
 * الشريط يغطّي الأيقونة تماماً.
 *
 * الرسم: شريط أفقي يُدار ‎-45°‎ حول مركز مربّع حاوٍ مقصوص الفائض،
 * وهي أبسط طريقة تعطي حوافّ نظيفة عند تقاطعه مع ضلعي البطاقة.
 */
function CornerRibbon({ text, tone }: { text: string; tone: string }) {
  const uid = useUid("cr");
  const S = 118;          // ضلع المربّع الحاوي
  const band = 27;        // عرض الشريط
  const off = S * 0.34;   // بُعد محور الشريط عن الركن
  return (
    <div
      className="pointer-events-none absolute left-0 top-0 z-20 overflow-hidden"
      style={{ width: S, height: S }}
      aria-hidden="true"
    >
      <svg width={S} height={S} viewBox={`0 0 ${S} ${S}`} fill="none">
        <defs>
          <linearGradient id={`${uid}-g`} x1="0" y1="0" x2={S} y2={S} gradientUnits="userSpaceOnUse">
            <stop offset="0%" stopColor={tone} />
            <stop offset="100%" stopColor={tone} stopOpacity="0.85" />
          </linearGradient>
        </defs>
        <g transform={`rotate(-45 ${S / 2} ${S / 2})`}>
          <rect x={-S} y={off - band / 2} width={S * 3} height={band} fill={`url(#${uid}-g)`} />
          {/* خيطان ذهبيان على حافّتي الشريط */}
          <path
            d={`M${-S} ${off - band / 2 + 3} H${S * 2} M${-S} ${off + band / 2 - 3} H${S * 2}`}
            stroke="hsl(var(--gold-light))"
            strokeWidth="0.9"
            strokeOpacity="0.5"
          />
          <text
            x={S / 2}
            y={off + 1}
            fill="#fff"
            fontSize="12.5"
            fontWeight="700"
            textAnchor="middle"
            dominantBaseline="middle"
            style={{ fontFamily: "var(--font-display)" }}
          >
            {text}
          </text>
        </g>
      </svg>
    </div>
  );
}

/** عدّاد انتهاء العرض. */
function useCountdown(until?: string | null) {
  const [now, setNow] = useState(() => Date.now());
  useEffect(() => {
    if (!until) return;
    const t = setInterval(() => setNow(Date.now()), 60000);
    return () => clearInterval(t);
  }, [until]);
  if (!until) return null;
  const diff = new Date(until).getTime() - now;
  if (!Number.isFinite(diff) || diff <= 0) return null;
  const days = Math.floor(diff / 86400000);
  const hours = Math.floor((diff % 86400000) / 3600000);
  if (days > 0) return `ينتهي العرض بعد ${days.toLocaleString("ar-EG")} يوم`;
  if (hours > 0) return `ينتهي العرض بعد ${hours.toLocaleString("ar-EG")} ساعة`;
  return "ينتهي العرض اليوم";
}

function PlanCard({ plan, subjectName, termEnd, href, index, loggedIn }: {
  plan: SitePlan; subjectName?: string; termEnd?: string; href: string; index: number; loggedIn: boolean;
}) {
  const priced = planPrice(plan);
  const tone = planColor(plan) ?? "hsl(var(--primary))";
  const countdown = useCountdown(priced.active ? priced.until : null);
  const featured = Boolean(plan.highlight);

  const scopeIcon = plan.scope === "subject" ? <IconBook className="size-6" /> : <IconLayers className="size-6" />;
  const ribbon = priced.active && priced.percent
    ? `خصم ${priced.percent.toLocaleString("ar-EG")}٪`
    : plan.badge || (featured ? "الأفضل قيمة" : "");

  /* الحجمُ محصورٌ فلا تُفسد قيمةٌ شاردة تخطيطَ البطاقة. */
  const imgSize = Math.max(40, Math.min(200, plan.imageSize ?? 56));

  return (
    <Reveal delay={index * 0.07} className="h-full">
      <motion.div
        whileHover={{ y: -6 }}
        transition={{ type: "spring", stiffness: 300, damping: 22 }}
        className="plan-card relative flex h-full flex-col overflow-hidden rounded-[1.75rem] bg-card p-7 shadow-bento"
        data-featured={featured ? "true" : undefined}
        style={{
          ["--plan-tone" as string]: tone,
          border: `2px solid ${featured ? tone : "hsl(var(--border))"}`,
          boxShadow: featured ? `0 22px 50px -30px ${tone}` : undefined,
        }}
      >
        {ribbon && <CornerRibbon text={ribbon} tone={tone} />}

        {/*
          رأس البطاقة: صورةُ الخطة إن رُفعت، وإلا أيقونةُ النطاق.
          والصورةُ لا تُوضع فوق الأيقونة بل مكانها — رمزان في موضعٍ واحد
          يتزاحمان، ولا يقول الثاني ما لم يقله الأوّل.
        */}
        {plan.image ? (
          <span
            className="plan-image grid shrink-0 place-items-center self-start"
            style={{ width: imgSize, height: imgSize }}
          >
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={mediaSrc(plan.image)}
              alt={plan.name}
              className={`max-h-full max-w-full object-contain ${plan.imageCut ? "img-cut" : ""}`}
              referrerPolicy="no-referrer"
            />
          </span>
        ) : (
          <span
            className="ic-frame grid size-14 place-items-center self-start rounded-2xl"
            style={{ background: `${tone}1a`, color: tone }}
          >
            {scopeIcon}
          </span>
        )}

        {/* الاسم والوصف */}
        <div className="plan-body flex flex-1 flex-col">
        <h3 className="font-display mt-6 text-[1.35rem] font-bold leading-snug">{plan.name}</h3>
        <p className="mt-1.5 text-sm text-muted-foreground">
          {plan.desc || planScopeLabel(plan, subjectName)}
        </p>

        {/* السعر */}
        <div className="plan-price-wrap mt-6">
        <div className="plan-price flex flex-wrap items-baseline gap-x-2 gap-y-1">
          <span className="font-display text-[2.6rem] font-bold leading-none" style={{ color: tone }}>
            {priced.price.toLocaleString("ar-EG")}
          </span>
          <span className="font-display text-[1.6rem] font-bold leading-none" style={{ color: tone }}>
            ج.م
          </span>
          {priced.active && (
            <span className="text-base font-bold text-muted-foreground line-through decoration-2">
              {priced.original.toLocaleString("ar-EG")}
            </span>
          )}
          <span className="plan-per text-sm text-muted-foreground">/ {planDuration(plan, termEnd)}</span>
        </div>
        </div>

        {priced.active && (
          <p className="mt-3 inline-flex w-fit items-center gap-1.5 rounded-full bg-emerald-500/12 px-3 py-1 text-xs font-bold text-emerald-600">
            <IconSparkle anim="pulse" className="size-3.5" />
            {priced.label || "عرض خاص"} · وفّرت {priced.off.toLocaleString("ar-EG")} ج.م
          </p>
        )}
        {countdown && <p className="mt-2 text-xs font-bold text-rose-500">{countdown}</p>}

        {/* المزايا */}
        {(plan.perks?.length ?? 0) > 0 && (
          <ul className="mt-6 space-y-3 text-sm">
            {plan.perks!.map((perk, k) => (
              <li key={k} className="flex items-start gap-2.5">
                <span className="mt-0.5 shrink-0" style={{ color: tone }}>
                  <IconCheck className="size-4" />
                </span>
                <span className="text-muted-foreground">{perk}</span>
              </li>
            ))}
          </ul>
        )}

        </div>

        {/* الزرّ */}
        <Link
          href={href}
          className="group mt-auto inline-flex w-full items-center justify-center gap-2 rounded-full px-5 pb-4 pt-4 text-[0.95rem] font-bold transition"
          style={
            featured
              ? { background: tone, color: "#fff", marginTop: "1.75rem" }
              : { border: `2px solid ${tone}`, color: tone, marginTop: "1.75rem" }
          }
        >
          {plan.cta || (loggedIn ? "اشترك الآن" : "سجّل الدخول للاشتراك")}
          <IconArrowLeft className="ico-slide size-4" />
        </Link>
      </motion.div>
    </Reveal>
  );
}

export function Plans() {
  const { db, content, wa, session } = useContent();
  if (content.ui?.["section.plans"]?.hidden) return null;

  // خطط الشعبة: الزائر يرى الجميع، والطالب يرى ما يخصّ شعبته وما هو للكل
  const me = db?.users?.find((u) => u.id === session?.uid);
  const plans = (db?.plans ?? [])
    .filter((p) => p.visible && planForStudent(p, me))
    .sort((a, b) => (a.order ?? 0) - (b.order ?? 0) || a.price - b.price);
  /* تصميم القسم — مستقلّ عن الثيم وعن بقية الأقسام. */
  const PS = findPlansStyle(content.plansStyle);
  const sec = content.plansSection ?? {};
  const subjectName = (id?: string) => db?.subjects.find((s) => s.id === id)?.name;
  // الاشتراك لا يُفتح إلا بعد تسجيل الدخول
  const joinHref = session ? "/student/subjects" : "/login?next=/student/subjects";
  const anyDiscount = plans.some((p) => planPrice(p).active);

  return (
    <section id="plans" className={`relative py-24 ${plansClass(PS)}`}>
      <div className="container">
        <SectionHeading
        anim="capStarsAnim"
          eyebrow={sec.eyebrow || "الخطط"}
          title={(() => {
            /* العنوان يأتي كاملاً من اللوحة؛ نُبرز كلمته الأخيرة فقط.
               إلحاق كلمة ثابتة كان يكرّرها مع عنوان يحويها أصلاً. */
            const words = (sec.title || "اختر خطة اشتراكك").trim().split(/\s+/);
            const last = words.pop() ?? "";
            return (
              <>
                {words.join(" ")} <span className="text-gradient">{last}</span>
              </>
            );
          })()}
          desc={sec.desc || "خطط واضحة بأسعار ثابتة — فعّل خطتك بكود التفعيل وابدأ من الدرس الأول."}
        />

        {anyDiscount && (
          <p className="mx-auto -mt-6 mb-10 w-fit rounded-full bg-emerald-500/12 px-4 py-1.5 text-xs font-extrabold text-emerald-600">
            عروض سارية الآن — الأسعار المخفّضة ظاهرة بالأسفل
          </p>
        )}

        {plans.length === 0 ? (
          <div className="flex flex-col items-center gap-4 py-6 text-center text-muted-foreground">
            <EmptyPlans className="text-primary" width={188} />
            <p className="text-sm">لم تُضَف خطط بعد.</p>
          </div>
        ) : (
          <div className={`plans-grid grid items-stretch gap-6 ${plansGridClass(PS.grid, plans.length)}`}>
            {plans.map((p, i) => (
              <PlanCard
                key={p.id}
                plan={p}
                index={i}
                subjectName={subjectName(p.subjectId)}
                termEnd={content.termEnd}
                href={joinHref}
                loggedIn={Boolean(session)}
              />
            ))}
          </div>
        )}

        {sec.note !== "" && (
          <p className="mx-auto mt-10 max-w-xl text-center text-xs leading-relaxed text-muted-foreground">
            {sec.note || "حوّل قيمة الخطة على فودافون كاش أو إنستاباي، وأرسل الإيصال على واتساب ليصلك كود التفعيل."}
          </p>
        )}

        <div className="mt-6 text-center">
          <Button as="a" href={wa("أريد الاشتراك في إحدى الخطط")}>
            <IconWhatsapp className="size-4" /> استفسر عن الخطط
          </Button>
        </div>
      </div>
    </section>
  );
}
