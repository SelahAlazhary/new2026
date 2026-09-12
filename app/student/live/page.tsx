"use client";

/**
 * البث المباشر — بوابة الطالب.
 * • ترتيب واضح: المباشر الآن ← القادم (بالموعد) ← المسجّل/المنتهي.
 * • بطاقة الصدارة قابلة للضغط فعلياً (تفتح البث أو تشرح سبب القفل) بلا أزرار صمّاء.
 * • عدّاد تنازلي للجلسة القادمة، و«ذكّرني» يضيفها لتقويم الطالب فعلاً.
 * • الرابط لا يصل المتصفّح أصلاً لمن لا يحقّ له (يُفرض على الخادم) — والواجهة تعكس ذلك.
 */
import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { motion } from "framer-motion";
import {
  IconRadio, IconPlay, IconCalendar, IconBell, IconLock, IconShield,
  IconGift, IconClock, IconArrowLeft,
} from "@/components/brand/icons";
import { PageHeader, Card, StatusBadge } from "@/components/dashboard/ui";
import { useContent } from "@/components/content/content-provider";
import { liveVisible } from "@/lib/auth/access";
import type { Live } from "@/lib/utils/types";
import { useMaintGate } from "@/components/brand/maint-gate";
import { EmptyLive } from "@/components/brand/illustrations";

/** ترتيب: مباشر ← مجدول (الأقرب موعداً) ← منتهي (الأحدث). */
function orderLives(list: Live[]): Live[] {
  const rank = (l: Live) => (l.status === "مباشر" ? 0 : l.status === "مجدول" ? 1 : 2);
  return [...list].sort((a, b) => {
    const r = rank(a) - rank(b);
    if (r) return r;
    const ta = a.startsAt ? new Date(a.startsAt).getTime() : 0;
    const tb = b.startsAt ? new Date(b.startsAt).getTime() : 0;
    return a.status === "منتهي" ? tb - ta : ta - tb;
  });
}

/** صيغة «يبدأ بعد …» بالعربية. */
function untilText(startsAt?: string, nowMs = Date.now()): string | null {
  if (!startsAt) return null;
  const diff = new Date(startsAt).getTime() - nowMs;
  if (!Number.isFinite(diff) || diff <= 0) return null;
  const mins = Math.round(diff / 60000);
  if (mins < 60) return `يبدأ بعد ${mins.toLocaleString("ar-EG")} دقيقة`;
  const hours = Math.round(mins / 60);
  if (hours < 24) return `يبدأ بعد ${hours.toLocaleString("ar-EG")} ساعة`;
  const days = Math.round(hours / 24);
  return `يبدأ بعد ${days.toLocaleString("ar-EG")} يوم`;
}

/** رابط إضافة الجلسة إلى تقويم جوجل (يعمل على كل الأجهزة بلا تطبيق إضافي). */
function calendarUrl(l: Live): string | null {
  if (!l.startsAt) return null;
  const start = new Date(l.startsAt);
  const end = l.endsAt ? new Date(l.endsAt) : new Date(start.getTime() + 60 * 60000);
  const fmt = (d: Date) => d.toISOString().replace(/[-:]|\.\d{3}/g, "");
  const p = new URLSearchParams({
    action: "TEMPLATE",
    text: l.title,
    dates: `${fmt(start)}/${fmt(end)}`,
    details: [l.subject, l.url].filter(Boolean).join("\n"),
  });
  return `https://calendar.google.com/calendar/render?${p.toString()}`;
}

export default function StudentLivePage() {
  /* بوّابةُ الصيانة — المشرفون يمرّون والطلاب يرون اللوح. */
  const maintGate = useMaintGate("live");

  const { db, content, session } = useContent();
  const me = db?.users.find((u) => u.id === session?.uid);
  const fem = me?.gender === "female";
  const y = (v: string) => `${v}${fem ? "ي" : ""}`;

  const all = useMemo(() => orderLives(db?.live ?? []), [db?.live]);
  const subjectTermOf = (l: Live) => db?.subjects.find((x) => x.id === l.subjectId)?.term;
  const allowed = (l: Live) => liveVisible(me, { ...l, subjectTerm: subjectTermOf(l) });
  const canJoin = (l: Live) => allowed(l) && Boolean(l.url);

  // عدّاد يتحدّث كل دقيقة (بلا إعادة رسم مستمرة)
  const [tick, setTick] = useState(() => Date.now());
  useEffect(() => {
    const t = setInterval(() => setTick(Date.now()), 60000);
    return () => clearInterval(t);
  }, []);

  const featured = all.find((l) => l.status === "مباشر") ?? all.find((l) => l.status === "مجدول");
  const rest = all.filter((l) => l.id !== featured?.id);
  const isLiveNow = featured?.status === "مباشر";

  if (maintGate) return maintGate;

  return (
    <>
      <PageHeader
        title="البث المباشر"
        subtitle={`${fem ? "احضري" : "احضر"} الحصص المباشرة أو ${fem ? "شاهدي" : "شاهد"} المسجّلة`}
      />

      {/* ---------- بطاقة الصدارة ---------- */}
      {featured && (
        <Card className="relative mb-6 overflow-hidden !p-4 sm:!p-5">
          <div className="relative grid gap-5 md:grid-cols-[1.5fr_1fr]">
            {/* المسرح — قابل للضغط كاملاً عند توفّر الرابط */}
            <FeaturedStage
              live={featured}
              isLiveNow={Boolean(isLiveNow)}
              joinable={canJoin(featured)}
              allowed={allowed(featured)}
            />

            <div className="flex flex-col justify-center">
              <div className="flex flex-wrap items-center gap-2">
                <StatusBadge status={featured.status} />
                {featured.audience === "public" && (
                  <span className="inline-flex items-center gap-1 rounded-full bg-emerald-500/15 px-2 py-0.5 text-[10px] font-bold text-emerald-500">
                    <IconGift className="size-3" /> مجاني للجميع
                  </span>
                )}
              </div>

              <h3 className="mt-2 font-display text-xl font-extrabold leading-snug">{featured.title}</h3>
              <p className="mt-1 text-sm text-muted-foreground">{featured.subject} · {content.teacher.name}</p>
              <p className="mt-1 inline-flex items-center gap-1.5 text-sm text-primary">
                <IconCalendar className="size-4" /> {featured.time}
              </p>
              {!isLiveNow && untilText(featured.startsAt, tick) && (
                <p className="mt-1 inline-flex items-center gap-1.5 text-xs font-bold text-muted-foreground">
                  <IconClock anim="pulse" className="size-3.5" /> {untilText(featured.startsAt, tick)}
                </p>
              )}

              <div className="mt-5 flex flex-wrap gap-2">
                {canJoin(featured) ? (
                  <a href={featured.url} target="_blank" rel="noreferrer"
                    className="inline-flex items-center gap-2 rounded-full btn-glow px-6 py-3 text-sm font-bold text-white">
                    <IconPlay className="size-4" />
                    {isLiveNow ? `${fem ? "انضمي" : "انضم"} للبث الآن` : "افتح رابط الجلسة"}
                  </a>
                ) : allowed(featured) ? (
                  <span className="rounded-full border border-border px-5 py-3 text-sm font-bold text-muted-foreground">
                    الرابط يُنشر قبل الموعد
                  </span>
                ) : (
                  <Link href="/student/subjects" className="inline-flex items-center gap-2 rounded-full btn-glow px-6 py-3 text-sm font-bold text-white">
                    <IconLock className="size-4" /> {y("اشترك")} للانضمام
                  </Link>
                )}

                {featured.status === "مجدول" && calendarUrl(featured) && (
                  <a href={calendarUrl(featured)!} target="_blank" rel="noreferrer"
                    className="inline-flex items-center gap-2 rounded-full border border-border px-5 py-3 text-sm font-bold transition hover:border-primary hover:text-primary">
                    <IconBell className="size-4" /> {fem ? "ذكّريني" : "ذكّرني"}
                  </a>
                )}
              </div>

              {!allowed(featured) && (
                <p className="mt-3 inline-flex items-center gap-1.5 text-xs font-bold text-amber-500">
                  <IconLock className="size-3.5" /> هذه الجلسة للمشتركين فقط
                </p>
              )}
            </div>
          </div>
        </Card>
      )}

      {/* ---------- بقيّة الجلسات ---------- */}
      {all.length === 0 ? (
        <Card className="flex flex-col items-center gap-3 py-14 text-center">
          <EmptyLive width={190} />
          <p className="font-display text-lg font-extrabold">لا توجد جلسات بث حالياً</p>
          <p className="max-w-sm text-sm text-muted-foreground">سيظهر هنا موعد البث القادم فور جدولته.</p>
        </Card>
      ) : rest.length > 0 ? (
        <>
          <p className="mb-3 font-display font-bold">بقيّة الجلسات</p>
          <div className="space-y-3">
            {rest.map((l, i) => {
              const isAllowed = allowed(l);
              const joinable = canJoin(l);
              return (
                <motion.div key={l.id} initial={{ opacity: 0, y: 12 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true, margin: "0px 0px -40px 0px" }} transition={{ delay: Math.min(i, 8) * 0.05 }}>
                  <Card className="!p-4">
                    <div className="flex flex-wrap items-center gap-3">
                      <span className={`grid size-11 shrink-0 place-items-center rounded-2xl ${l.status === "مباشر" ? "bg-rose-500/12 text-rose-500" : "bg-primary/12 text-primary"}`}>
                        <IconRadio anim={l.status === "مباشر" ? "pulse" : undefined} className="size-5" />
                      </span>

                      <div className="min-w-0 flex-1">
                        <p className="font-bold">{l.title}</p>
                        <p className="flex flex-wrap items-center gap-x-2 gap-y-1 text-xs text-muted-foreground">
                          <span className="inline-flex items-center gap-1"><IconCalendar className="size-3.5" /> {l.time}</span>
                          <span>· {l.subject}</span>
                          {l.audience === "public" && (
                            <span className="inline-flex items-center gap-1 rounded-full bg-emerald-500/12 px-2 py-0.5 text-[10px] font-bold text-emerald-500">
                              <IconGift className="size-2.5" /> مجاني
                            </span>
                          )}
                          {(l.audience ?? "subscribers") === "subscribers" && (
                            <span className="inline-flex items-center gap-1 rounded-full bg-violet-500/12 px-2 py-0.5 text-[10px] font-bold text-violet-500">
                              <IconShield className="size-2.5" /> للمشتركين
                            </span>
                          )}
                        </p>
                      </div>

                      <StatusBadge status={l.status} />

                      {!isAllowed ? (
                        <Link href="/student/subjects" className="inline-flex items-center gap-1 rounded-full border border-amber-500/40 px-4 py-2.5 text-xs font-bold text-amber-500 transition hover:bg-amber-500/10">
                          <IconLock className="size-3.5" /> للمشتركين فقط
                        </Link>
                      ) : joinable ? (
                        <a href={l.url} target="_blank" rel="noreferrer"
                          className={`inline-flex items-center gap-1.5 rounded-full px-5 py-2.5 text-xs font-bold ${
                            l.status === "مباشر" ? "btn-glow text-white" : "border border-border transition hover:border-primary hover:text-primary"
                          }`}>
                          <IconPlay className="size-3.5" />
                          {l.status === "مباشر" ? "انضمام" : l.status === "مجدول" ? "فتح الرابط" : "مشاهدة"}
                        </a>
                      ) : l.status === "مجدول" && calendarUrl(l) ? (
                        <a href={calendarUrl(l)!} target="_blank" rel="noreferrer"
                          className="inline-flex items-center gap-1 rounded-full border border-border px-4 py-2.5 text-xs font-bold transition hover:border-primary hover:text-primary">
                          <IconBell className="size-3.5" /> {fem ? "ذكّريني" : "ذكّرني"}
                        </a>
                      ) : (
                        <span className="rounded-full border border-border px-4 py-2.5 text-xs font-bold text-muted-foreground">
                          الرابط قريباً
                        </span>
                      )}
                    </div>
                  </Card>
                </motion.div>
              );
            })}
          </div>
        </>
      ) : null}
    </>
  );
}

/** مسرح البطاقة الرئيسية — رابط حقيقي عند إمكانية الانضمام، وإلا حالة واضحة. */
function FeaturedStage({
  live, isLiveNow, joinable, allowed,
}: {
  live: Live; isLiveNow: boolean; joinable: boolean; allowed: boolean;
}) {
  const body = (
    <>
      {isLiveNow && (
        <span className="absolute right-3 top-3 z-10 inline-flex items-center gap-1.5 rounded-full bg-rose-500 px-2.5 py-1 text-xs font-bold text-white">
          <span className="size-1.5 animate-pulse rounded-full bg-white" /> مباشر
        </span>
      )}
      <span className="relative z-10 grid size-16 place-items-center rounded-full btn-glow text-white">
        {isLiveNow && joinable && <span className="absolute inset-0 animate-pulse-ring rounded-full bg-primary/50" />}
        {allowed ? <IconPlay className="size-7" /> : <IconLock className="size-6" />}
      </span>
      <span className="relative z-10 mt-3 text-xs font-bold text-white/85">
        {joinable ? (isLiveNow ? "اضغط للانضمام" : "اضغط لفتح الرابط") : allowed ? "الرابط يُنشر قبل الموعد" : "متاح للمشتركين"}
      </span>
    </>
  );

  const shell = "relative flex aspect-video flex-col items-center justify-center overflow-hidden rounded-2xl bg-slate-900";

  if (joinable) {
    return (
      <a href={live.url} target="_blank" rel="noreferrer" className={`${shell} group transition hover:brightness-110`}>
        {body}
      </a>
    );
  }
  return (
    <Link href={allowed ? "/student/live" : "/student/subjects"} className={shell} aria-disabled={allowed}>
      {body}
    </Link>
  );
}
