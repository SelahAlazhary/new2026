"use client";

/**
 * البث المجاني — يظهر على الصفحة الرئيسية لأي زائر (بلا حساب).
 * يُنشئه الأدمن بجمهور «بث مجاني للجميع»، ويختفي القسم تلقائياً إن لم يوجد.
 * كل الرسوم SVG من نظام الهوية.
 */
import Link from "next/link";
import { motion, useReducedMotion } from "framer-motion";
import { SectionHeading, Reveal, Button } from "@/components/ui/primitives";
import { archPath } from "@/components/brand/pattern";
import { IconRadio, IconCalendar, IconPlay, IconArrowLeft } from "@/components/brand/icons";
import { useContent } from "@/components/content/content-provider";
import { publicLives } from "@/lib/auth/access";
import { useUid } from "@/components/brand/use-uid";

/** لوحة SVG للبث: قوس + موجات إرسال متحرّكة. */
function BroadcastArt({ live }: { live: boolean }) {
  const uid = useUid("blive");
  const reduce = useReducedMotion();
  const W = 320;
  const H = 200;
  return (
    <svg viewBox={`0 0 ${W} ${H}`} className="h-auto w-full" role="presentation">
      <defs>
        <linearGradient id={`${uid}-g`} x1="0" y1="0" x2={W} y2={H} gradientUnits="userSpaceOnUse">
          <stop offset="0%" stopColor="hsl(var(--primary))" />
          <stop offset="100%" stopColor="hsl(var(--accent))" />
        </linearGradient>
        <clipPath id={`${uid}-c`}>
          <path d={archPath(W, H, 4)} />
        </clipPath>
      </defs>

      <g clipPath={`url(#${uid}-c)`}>
        <rect width={W} height={H} fill={`url(#${uid}-g)`} />
        {/* موجات الإرسال */}
        <g fill="none" stroke="#fff" strokeWidth={1.6} strokeLinecap="round">
          {[34, 58, 82, 106].map((r, i) => (
            <motion.circle
              key={r}
              cx={W / 2}
              cy={H / 2 + 14}
              r={r}
              strokeOpacity={0.5 - i * 0.09}
              animate={reduce || !live ? undefined : { scale: [1, 1.06, 1], opacity: [0.9, 0.5, 0.9] }}
              transition={{ duration: 3.2, repeat: Infinity, delay: i * 0.25, ease: "easeInOut" }}
              style={{ originX: "50%", originY: "50%" }}
            />
          ))}
        </g>
        {/* الميكروفون/البرج */}
        <g stroke="#fff" strokeWidth={2.2} strokeLinecap="round" fill="none">
          <path d={`M${W / 2} ${H / 2 - 26} v46`} />
          <circle cx={W / 2} cy={H / 2 - 34} r={9} fill="#fff" fillOpacity={0.95} stroke="none" />
          <path d={`M${W / 2 - 26} ${H / 2 + 26} h52`} strokeOpacity={0.8} />
        </g>
      </g>

      <path d={archPath(W, H, 4)} fill="none" stroke="#fff" strokeOpacity={0.4} strokeWidth={1.5} />
    </svg>
  );
}

export function FreeLive() {
  const { db, content, session } = useContent();
  if (content.ui?.["section.freeLive"]?.hidden) return null;

  const items = publicLives(db?.live ?? []);
  if (items.length === 0) return null;

  const now = items.find((l) => l.status === "مباشر") ?? items[0];
  const isLive = now.status === "مباشر";

  return (
    <section id="free-live" className="relative py-20">
      <div className="container">
        <SectionHeading
          eyebrow="بث مجاني"
          title={<>احضر حصة <span className="text-gradient">مجانية</span> بلا اشتراك</>}
          desc="جلسة مفتوحة للجميع — انضم من أي جهاز بلا حساب ولا كود تفعيل."
        />

        <Reveal>
          <div className="glass mx-auto grid max-w-4xl items-center gap-6 overflow-hidden rounded-4xl p-6 shadow-bento sm:p-8 md:grid-cols-[minmax(0,1fr)_1.2fr]">
            <div className="relative">
              <BroadcastArt live={isLive} />
            </div>

            <div className="min-w-0">
              <span className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-extrabold ${
                isLive ? "bg-rose-500/15 text-rose-500" : "bg-primary/12 text-primary"
              }`}>
                <IconRadio anim={isLive ? "pulse" : undefined} className="size-3.5" />
                {isLive ? "مباشر الآن" : "قريباً"}
              </span>

              <h3 className="mt-3 font-display text-2xl font-extrabold leading-snug">{now.title}</h3>
              <p className="mt-1 text-sm text-muted-foreground">{now.subject}{now.grade ? ` · ${now.grade}` : ""}</p>
              <p className="mt-2 inline-flex items-center gap-1.5 text-sm text-muted-foreground">
                <IconCalendar className="size-4 text-primary" /> {now.time}
              </p>

              <div className="mt-6 flex flex-wrap gap-3">
                {now.url ? (
                  <Button as="a" href={now.url} target="_blank" className="px-7 py-3.5">
                    <IconPlay className="size-5" /> {isLive ? "انضم الآن" : "افتح رابط الجلسة"}
                  </Button>
                ) : (
                  <span className="rounded-full border border-border px-6 py-3 text-sm font-bold text-muted-foreground">
                    الرابط يُنشر قبل الموعد
                  </span>
                )}
                <Link
                  href={session ? "/student/live" : content.cta?.registerUrl || "/register"}
                  className="group inline-flex items-center gap-2 rounded-full border border-primary/40 px-6 py-3 text-sm font-bold text-primary transition hover:bg-primary/10"
                >
                  {session ? "كل الجلسات" : "أنشئ حساباً لمتابعة البث"}
                  <IconArrowLeft className="ico-slide size-4" />
                </Link>
              </div>

              {items.length > 1 && (
                <p className="mt-4 text-xs text-muted-foreground">
                  ويوجد {(items.length - 1).toLocaleString("ar-EG")} جلسة مجانية أخرى قادمة.
                </p>
              )}
            </div>
          </div>
        </Reveal>
      </div>
    </section>
  );
}
