"use client";

/**
 * شهادات الطلاب — آراء المتفوّقين على الصفحة الرئيسية.
 *
 * الأولى المميّزة (الطالب الأول) تأخذ بطاقة عريضة بإطار مرسوم،
 * والبقية بطاقات أصغر. لا يظهر القسم إطلاقاً إن لم تُضَف شهادات.
 */

import Image from "next/image";
import { motion } from "framer-motion";
import { SectionHeading } from "@/components/ui/primitives";
import { useContent } from "@/components/content/content-provider";
import { IconStar, IconTrophy } from "@/components/brand/icons";
import { CornerKnot } from "@/components/brand/pattern";
import { mediaSrc } from "@/lib/utils/media";
import { findSectionStyle, sectionClass, sxGridClass } from "@/lib/styles/section-styles";
import type { Testimonial } from "@/lib/utils/types";

export function Testimonials() {
  const { content } = useContent();
  if (content.ui?.["section.testimonials"]?.hidden) return null;

  const all = (content.testimonials ?? []).filter((t) => !t.hidden);
  const SX = findSectionStyle(content.testimonialsStyle);
  /*
    أصناف الهوية (glass/foil/الظلّ) تُكتب فقط في التصميم «الأصلي».
    محاولةُ إلغائها بقاعدة CSS أقوى تجعل كل سطح جديد يخوض حرب أولويات
    مع الهوية — والأنظف ألّا تُكتب أصلاً حين لا تُراد.
  */
  const brand = SX.card === "brand";
  if (!all.length) return null;

  const featured = all.find((t) => t.featured);
  const rest = featured ? all.filter((t) => t.id !== featured.id) : all;

  return (
    <section id="testimonials" className={`relative py-24 ${sectionClass(SX)}`} data-section-style={SX.id}>
      <div className="container">
        <SectionHeading
          eyebrow="شهادات الطلاب"
          title={<>قالوا عن <span className="text-gradient">المنصّة</span></>}
          desc="كلمات من طلابنا ومن تصدّروا دفعاتهم."
        />

        {featured && <FeaturedCard t={featured} brand={brand} />}

        {rest.length > 0 && (
          <div className={`sx-grid grid items-stretch gap-4 ${sxGridClass(SX.grid, rest.length)} ${featured ? "mt-4" : ""}`}>
            {rest.map((t, i) => (
              <motion.div
                key={t.id}
                initial={{ opacity: 0, y: 16 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, margin: "-40px" }}
                transition={{ duration: 0.4, delay: i * 0.05 }}
              >
                <Card t={t} brand={brand} />
              </motion.div>
            ))}
          </div>
        )}
      </div>
    </section>
  );
}

/** بطاقة الطالب الأول — عريضة بإطار وزخرفة ركنية. */
function FeaturedCard({ t, brand }: { t: Testimonial; brand?: boolean }) {
  return (
    <motion.figure
      initial={{ opacity: 0, y: 20 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: "-40px" }}
      transition={{ duration: 0.5 }}
      className={`sx-card relative overflow-hidden rounded-3xl p-5 sm:p-7 ${brand ? "glass border border-primary/30" : ""}`}
    >
      <CornerKnot size={84} className="sx-knot pointer-events-none absolute bottom-0 left-0 hidden text-primary/25 sm:block" />

      <div className="relative flex flex-col gap-4 sm:flex-row sm:items-center sm:gap-6">
        <Avatar t={t} size={88} className="size-16 sm:size-[5.5rem]" />

        <div className="min-w-0 flex-1">
          {t.badge && (
            <span className="inline-flex items-center gap-1.5 rounded-full bg-amber-500/15 px-3 py-1 text-[11px] font-extrabold text-amber-600">
              <IconTrophy className="size-3.5" /> {t.badge}
            </span>
          )}
          <blockquote className="mt-2 font-display text-base leading-relaxed sm:text-lg">
            «{t.text}»
          </blockquote>
          <figcaption className="mt-3 flex flex-wrap items-center gap-x-3 gap-y-1">
            <span className="font-extrabold">{t.name}</span>
            {t.grade && <span className="text-xs text-muted-foreground">{t.grade}</span>}
            <Stars value={t.rating} />
          </figcaption>
        </div>
      </div>
    </motion.figure>
  );
}

/** بطاقة شهادة عادية. */
function Card({ t, brand }: { t: Testimonial; brand?: boolean }) {
  return (
    <figure className={`sx-card flex h-full flex-col gap-3 rounded-3xl p-4 sm:p-5 ${brand ? "glass" : ""}`}>
      <blockquote className="flex-1 text-sm leading-relaxed text-muted-foreground">«{t.text}»</blockquote>
      <figcaption className="flex items-center gap-3 border-t border-border pt-3">
        <Avatar t={t} size={40} className="size-10" />
        <span className="min-w-0 flex-1">
          <span className="block truncate text-sm font-extrabold">{t.name}</span>
          {t.grade && <span className="block truncate text-[11px] text-muted-foreground">{t.grade}</span>}
        </span>
        {t.badge ? (
          <span className="shrink-0 rounded-full bg-amber-500/15 px-2.5 py-1 text-[10px] font-bold text-amber-600">
            {t.badge}
          </span>
        ) : (
          <Stars value={t.rating} />
        )}
      </figcaption>
    </figure>
  );
}

/** صورة الطالب، أو أوّل حرف من اسمه إن لم تُرفع صورة. */
function Avatar({ t, size, className }: { t: Testimonial; size: number; className?: string }) {
  const src = mediaSrc(t.photo);
  if (!src) {
    return (
      <span className={`grid shrink-0 place-items-center rounded-2xl btn-glow font-display font-extrabold text-white ${className}`}>
        {t.name.charAt(0)}
      </span>
    );
  }
  return (
    <span className={`relative shrink-0 overflow-hidden rounded-2xl ring-1 ring-border ${className}`}>
      <Image src={src} alt={t.name} width={size} height={size} className="size-full object-cover" unoptimized />
    </span>
  );
}

/** نجوم التقييم — لا تظهر إن لم يُحدَّد تقييم. */
function Stars({ value }: { value?: number }) {
  if (!value) return null;
  return (
    <span className="flex shrink-0 items-center gap-0.5" aria-label={`${value} من ٥`}>
      {Array.from({ length: 5 }, (_, i) => (
        <IconStar key={i} className={`size-3.5 ${i < value ? "text-amber-500" : "text-muted-foreground/30"}`} />
      ))}
    </span>
  );
}
