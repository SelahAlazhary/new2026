"use client";

/**
 * الهيرو — «صدر المخطوط».
 * ------------------------------------------------------------
 * الطبقات من الخلف إلى الأمام:
 *   1) تبليط كوفي مربّع بقناع تلاشٍ.
 *   2) حقل حركات (تشكيل) يطفو ببطء.
 *   3) شمسة مذهّبة دوّارة خلف الصورة + حرف الضاد كعلامة مائية.
 *   4) المحتوى: شارة، عنوان، سطر كتابة يُخطّ حياً، نبذة، أزرار، مؤشّرات.
 * كل النصوص والصور من المحتوى الحيّ (لوحة الأدمن).
 */

import { useState } from "react";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { Pill } from "@/components/ui/primitives";
import { PlaqueButton } from "@/components/brand/plaque-button";
import { CountUp, Stars, SpringArrow } from "@/components/ui/animated-icons";
import { IconPlay, IconTrophy, IconWhatsapp } from "@/components/brand/icons";
import { Shamsa, RuleOrnament, ElegantRule } from "@/components/brand/pattern";
import { DaadGlyph } from "@/components/brand/calligraphy";
import { VideoModal } from "@/components/ui/video-modal";
import { HeroFrame } from "@/components/sections/hero-frame";
import { useContent } from "@/components/content/content-provider";
import { el, isHidden, btnStyle, textStyle } from "@/lib/styles/ui-style";
import type { HeroShape } from "@/lib/layout/home-layouts";
import { findHeroStyle, heroClass } from "@/lib/styles/hero-styles";
import { ShariBackdrop } from "@/components/brand/shari-art";

/**
 * يحوّل رابط يوتيوب إلى صيغة تضمين للنافذة المنبثقة.
 * ومقطعُ الواجهة عامٌّ لا يُحمى — لكنّ `rel=0` يُبقي المقترحاتِ في قناة
 * الأستاذ، و`nocookie` لا يكتب كوكيَ تتبّعٍ لزائرٍ لم يُشغّل شيئاً.
 */
function toEmbedSrc(url?: string): string | undefined {
  if (!url) return undefined;
  const yt = url.match(/(?:youtu\.be\/|youtube(?:-nocookie)?\.com\/(?:watch\?v=|embed\/|shorts\/))([\w-]{6,})/);
  if (yt) return `https://www.youtube-nocookie.com/embed/${yt[1]}?rel=0&modestbranding=1&iv_load_policy=3&playsinline=1`;
  return url;
}

export function Hero({ shape = "split" }: { shape?: HeroShape }) {
  const { content, session } = useContent();
  const router = useRouter();
  const t = content.teacher;
  /* هيئة الهيرو — مستقلّة عن موضعه الذي يحدّده تخطيط الصفحة. */
  const HS = findHeroStyle(content.heroStyle);
  const [videoOpen, setVideoOpen] = useState(false);
  const [freeSrc, setFreeSrc] = useState<string | undefined>(undefined);
  const [freeErr, setFreeErr] = useState<string | null>(null);
  const [freeBusy, setFreeBusy] = useState(false);

  /* رابط واتساب: الرابط المخصّص من اللوحة إن وُجد، وإلا يُبنى من رقم
     المنصّة. لو لا رقم ولا رابط فالزرّ لا يظهر — زرّ بلا وجهة عيب لا ميزة. */
  const waNum = String(content.whatsapp ?? "").replace(/\D/g, "");
  const waHref =
    content.cta?.whatsappUrl?.trim() ||
    (waNum
      ? `https://wa.me/${waNum}?text=${encodeURIComponent(
          content.cta?.whatsappText?.trim() || "السلام عليكم، أود الاستفسار عن الاشتراك"
        )}`
      : "");

  /** الدرس المجاني لا يعمل إلا بعد تسجيل الدخول — الرابط نفسه يأتي من السيرفر
   *  ولا يوجد في حمولة الزائر إطلاقاً (لا يمكن استخراجه من الصفحة). */
  const watchFree = async () => {
    setFreeErr(null);
    if (!session) { router.push("/login?next=/"); return; }
    setFreeBusy(true);
    try {
      const res = await fetch("/api/free-lesson", { cache: "no-store" });
      const data = await res.json();
      if (!res.ok) { setFreeErr(data.error || "تعذّر فتح الدرس"); return; }
      setFreeSrc(toEmbedSrc(data.url));
      setVideoOpen(true);
    } catch {
      setFreeErr("تعذّر الاتصال — حاول مرة أخرى");
    } finally {
      setFreeBusy(false);
    }
  };

  return (
    <section id="hero" className={`relative overflow-hidden pt-32 pb-20 md:pt-40 md:pb-28 ${heroClass(HS)}`}>
      <ShariBackdrop count={16} seed={5} opacity={0.15} />
                  <span className="hero-decor hero-decor-extra"></span>

      <div
        className={`hero-grid container grid items-center gap-14 ${
          shape === "split" || shape === "reversed" ? "lg:grid-cols-2" : "grid-cols-1"
        }`}
      >
        {/* ---------------- العمود النصّي ---------------- */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.7, ease: [0.22, 1, 0.36, 1] }}
          className={`hero-text relative ${
            shape === "reversed" ? "order-2 text-center lg:order-2 lg:text-right"
              : shape === "stacked" ? "order-2 text-center"
                : shape === "centered" || shape === "compact" ? "order-1 mx-auto max-w-3xl text-center"
                  : "order-2 text-center lg:order-1 lg:text-right"
          }`}
        >
          {/* علامة مائية: حرف الضاد خلف النص */}
          <DaadGlyph
            data-decor="extra"
            size={300}
            gold
            className="pointer-events-none absolute -top-16 right-[-4rem] -z-10 hidden opacity-[0.07] lg:block"
          />

          {content.hero.statusPill?.trim() && !isHidden(content, "hero.statusPill") && (
            <Pill className="hero-pill font-kufi mx-auto border-accent/40 bg-accent/10 text-[11px] tracking-wide text-foreground lg:mx-0">
              <span className="grid size-4 place-items-center rounded-full bg-accent/25">
                <span className="size-1.5 rounded-full bg-accent" />
              </span>
              <span style={textStyle(el(content, "hero.statusPill").text)}>{content.hero.statusPill}</span>
            </Pill>
          )}

          {/* «الشيماء أحمد في اللغة العربية» — الاسم مذهّب والباقي بلون النص */}
          <h1 className="hero-title mt-7 font-display text-[2.6rem] font-bold leading-[1.42] [text-wrap:balance] sm:text-[3.2rem] sm:leading-[1.38] md:text-[3.9rem] md:leading-[1.34]">
            <span className="text-gradient">{t.name}</span>
            {t.headline ? ` ${t.headline} ` : " "}
            {t.subject}
          </h1>

          {/* فاصل مذهّب تحت العنوان */}
          <div className={`mt-4 flex justify-center ${shape === "split" ? "lg:justify-start" : shape === "reversed" ? "lg:justify-start" : ""}`}>
            <ElegantRule width={300} className="max-w-full text-accent" />
          </div>

          <p className="mx-auto mt-5 max-w-xl text-base leading-loose text-muted-foreground sm:text-lg lg:mx-0">
            {t.bio}
          </p>

          <motion.div
            initial="rest"
            whileHover="hover"
            /* items-stretch: الزرّان يتساويان في الارتفاع رغم اختلاف
               ارتفاع محتواهما (الأيقونة أطول من سطر النصّ) */
            className={`hero-actions mt-9 flex flex-col items-stretch gap-3 sm:flex-row sm:justify-center ${
              shape === "centered" || shape === "compact" || shape === "stacked" ? "" : "lg:justify-start"
            }`}
          >
            {!isHidden(content, "hero.primary") && (
              <PlaqueButton
                href={content.cta?.registerUrl || "/register"}
                style={btnStyle(el(content, "hero.primary"))}
                variant="ink"
                className="w-full sm:w-auto"
              >
                {content.cta?.heroPrimaryLabel || "أنشئ حساب طالب"} <SpringArrow />
              </PlaqueButton>
            )}
            {!isHidden(content, "hero.secondary") && (
              <PlaqueButton
                onClick={watchFree}
                disabled={freeBusy}
                style={btnStyle(el(content, "hero.secondary"))}
                variant="foil"
                className="w-full sm:w-auto"
              >
                <IconPlay anim="bob" className="size-5" />
                {freeBusy ? "جارٍ التحميل…" : content.cta?.secondaryLabel || "شاهد درساً مجانياً"}
              </PlaqueButton>
            )}
          </motion.div>

          {/* زرّ واتساب — بلوح المنصّة نفسه بنسخته المذهّبة، فيتناسق مع
              بقية الأزرار بدل لون دخيل. الأيقونة داخل ميدالية مثمّنة
              مرسومة SVG بلون الحبر، فتبقى الهويّة البصرية واحدة. */}
          {!isHidden(content, "hero.whatsapp") && waHref && (
            <div className="mt-3 flex sm:justify-center lg:justify-start">
              <PlaqueButton
                href={waHref}
                target="_blank"
                rel="noopener noreferrer"
                variant="gold"
                style={btnStyle(el(content, "hero.whatsapp"))}
                className="w-full sm:w-auto"
              >
                <WhatsappMedal />
                {content.cta?.whatsappLabel || "تواصل معنا على واتساب"}
              </PlaqueButton>
            </div>
          )}

          {freeErr && (
            <p className="mt-3 inline-block rounded-2xl bg-rose-500/10 px-3 py-2 text-xs font-bold text-rose-500">
              {freeErr}
            </p>
          )}

          {t.ratingCount > 0 && (
            <div className="mt-10 flex flex-col items-center gap-3 sm:flex-row sm:justify-center lg:justify-start">
              <RuleOrnament width={72} className="hidden text-accent/60 lg:block" />
              <div className="text-center sm:text-right">
                <Stars value={t.rating} />
                <p className="text-xs text-muted-foreground">
                  <span className="font-bold text-foreground">{t.rating}/5</span> من{" "}
                  <CountUp to={t.ratingCount} suffix="+" /> طالب
                </p>
              </div>
            </div>
          )}
        </motion.div>

        {/* ---------------- عمود الصورة ---------------- */}
        {shape !== "compact" && (
        <div
          className={`hero-media flex justify-center ${
            shape === "reversed" ? "order-1 lg:order-1"
              : shape === "stacked" ? "order-1"
                : shape === "centered" ? "order-2 mt-4"
                  : "order-1 lg:order-2"
          }`}
        >
          <div className="relative w-full max-w-md">
            {/* شمسة مذهّبة تدور ببطء خلف اللوحة */}
            <Shamsa
              size={560}
              rays={28}
              className="pointer-events-none absolute left-1/2 top-1/2 -z-10 -translate-x-1/2 -translate-y-1/2 opacity-[0.22]"
            />

            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.8, delay: 0.15 }}
            >
              <HeroFrame
                frame={content.hero.frameShape ?? content.hero.frame ?? 1}
                avatar={t.avatar}
                alt={t.name}
                img={content.hero.image}
                color={content.hero.frameColor}
                scale={content.hero.frameScale}
                baseRule={content.hero.frameBaseRule === true}
              />
            </motion.div>

            {t.topStudents > 0 && (
              <motion.div
                animate={{ y: [0, -8, 0] }}
                transition={{ duration: 5, repeat: Infinity, ease: "easeInOut" }}
                className="glass foil absolute -right-3 top-10 z-20 flex items-center gap-3 rounded-2xl px-4 py-3 shadow-bento sm:-right-6"
              >
                <span className="grid size-10 place-items-center rounded-xl bg-accent/15 text-accent">
                  <IconTrophy anim="pop" className="size-5" />
                </span>
                <div className="leading-tight">
                  <p className="font-display text-lg font-bold">
                    +<CountUp to={t.topStudents} />
                  </p>
                  <p className="font-kufi text-[10px] text-muted-foreground">من المتفوّقين</p>
                </div>
              </motion.div>
            )}

            {t.rating > 0 && (
              <motion.div
                animate={{ y: [0, -8, 0] }}
                transition={{ duration: 5.6, repeat: Infinity, ease: "easeInOut", delay: 0.6 }}
                className="glass foil absolute -left-3 bottom-14 z-20 flex items-center gap-3 rounded-2xl px-4 py-3 shadow-bento sm:-left-6"
              >
                <span className="grid size-10 place-items-center rounded-xl bg-primary/12 text-primary">
                  <DaadGlyph size={22} animate={false} strokeWidth={11} />
                </span>
                <div className="leading-tight">
                  <p className="font-display text-lg font-bold">{t.rating}/5</p>
                  <p className="font-kufi text-[10px] text-muted-foreground">تقييم الطلاب</p>
                </div>
              </motion.div>
            )}
          </div>
        </div>
        )}
      </div>

      <VideoModal open={videoOpen} onClose={() => setVideoOpen(false)} src={freeSrc} />
    </section>
  );
}

/**
 * ميدالية أيقونة واتساب — مثمّن بلون الحبر داخل اللوح المذهّب.
 * مرسومة هنا لا في مجموعة الأيقونات لأنها خاصّة بهذا الزرّ وحده.
 */
function WhatsappMedal() {
  return (
    <span className="relative grid size-7 shrink-0 place-items-center">
      <svg viewBox="0 0 28 28" className="absolute inset-0 size-full" fill="none" aria-hidden="true">
        <path
          d="M14 1.2 19.4 3.4 23.6 7.6 25.8 13 23.6 18.4 19.4 22.6 14 24.8 8.6 22.6 4.4 18.4 2.2 13 4.4 7.6 8.6 3.4Z"
          fill="hsl(var(--primary))"
        />
        <path
          d="M14 1.2 19.4 3.4 23.6 7.6 25.8 13 23.6 18.4 19.4 22.6 14 24.8 8.6 22.6 4.4 18.4 2.2 13 4.4 7.6 8.6 3.4Z"
          stroke="hsl(var(--gold-light))"
          strokeOpacity="0.55"
          strokeWidth="0.9"
          strokeLinejoin="round"
        />
      </svg>
      <IconWhatsapp className="relative size-4 text-[hsl(var(--primary))]" />
    </span>
  );
}
