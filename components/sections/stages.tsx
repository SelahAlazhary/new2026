"use client";

/**
 * قسم «المراحل والفروع» — لوحان مخطوطان جنباً إلى جنب.
 * ------------------------------------------------------------
 * لوح للمرحلة الإعدادية وآخر للثانوية، كلٌّ بفروعه، مرسومان بـSVG:
 * إطار مذهّب مقوّس، ترويسة بعدد الفروع، وقائمة فروع بنقاط إعجام.
 *
 * المحتوى من `content.stages` إن وُجد، وإلا يسقط للقيم الافتراضية —
 * فيمكن للأدمن تعديله لاحقاً بلا لمس الكود.
 */
import { motion } from "framer-motion";
import { SectionHeading, Reveal } from "@/components/ui/primitives";
import { ArchTile, ElegantRule } from "@/components/brand/pattern";
import { useContent } from "@/components/content/content-provider";
import { mediaSrc } from "@/lib/utils/media";
import { findSectionStyle, sectionClass, sxGridClass } from "@/lib/styles/section-styles";
import type { StageCard } from "@/lib/utils/types";

const ar = (n: number) => n.toLocaleString("ar-EG");

const FALLBACK: StageCard[] = [
  {
    id: "prep",
    name: "المرحلة الإعدادية",
    note: "منهج اللغة العربية كاملاً",
    branches: ["القراءة والنصوص", "النحو", "القصة", "التعبير", "الإملاء والخطّ"],
  },
  {
    id: "sec",
    name: "المرحلة الثانوية",
    note: "الفروع الأربعة بالتفصيل",
    branches: ["النحو", "الصرف", "البلاغة", "الأدب والنصوص"],
  },
];

export function Stages() {
  const { content } = useContent();
  const SX = findSectionStyle(content.stagesStyle);
  /*
    أصناف الهوية (glass/foil/الظلّ) تُكتب فقط في التصميم «الأصلي».
    محاولةُ إلغائها بقاعدة CSS أقوى تجعل كل سطح جديد يخوض حرب أولويات
    مع الهوية — والأنظف ألّا تُكتب أصلاً حين لا تُراد.
  */
  const brand = SX.card === "brand" ? "glass foil shadow-bento" : "";
  if (content.ui?.["section.stages"]?.hidden) return null;

  const stages = (content.stages ?? FALLBACK).filter((s) => s?.name && s.branches?.length);
  if (!stages.length) return null;

  return (
    <section id="stages" className={`relative py-24 ${sectionClass(SX)}`} data-section-style={SX.id}>

      <div className="container">
        <SectionHeading
        anim="onlineClassAnim"
          eyebrow="المراحل"
          title={
            <>
              مرحلتان، وكل فرع <span className="text-gradient">بمنهجه</span>
            </>
          }
          desc="اختر مرحلتك وابدأ من أول درس — الترتيب مبنيّ على المنهج، لا على المزاج."
        />

        <div className={`sx-grid grid items-stretch gap-5 ${sxGridClass(SX.grid, stages.length)}`}>
          {stages.map((s, i) => (
            <Reveal key={s.name} delay={i * 0.1}>
              <motion.article
                whileHover={{ y: -5 }}
                transition={{ type: "spring", stiffness: 300, damping: 20 }}
                className={`sx-card group relative h-full overflow-hidden rounded-4xl p-7 ${brand}`}
              >

                {/* ترويسة اللوح */}
                <div className="relative flex items-start gap-4">
                  <span className="relative grid size-12 shrink-0 place-items-center text-primary">
                    <ArchTile size={48} className="absolute inset-0" />
                    <span className="font-display relative text-lg font-bold">{ar(i + 1)}</span>
                  </span>
                  <div className="min-w-0">
                    <h3 className="font-display text-xl font-bold leading-snug">{s.name}</h3>
                    {s.note && (
                      <p className="font-kufi mt-1 text-[10px] tracking-wide text-accent">{s.note}</p>
                    )}
                  </div>
                  <span className="font-kufi mr-auto shrink-0 rounded-full bg-accent/12 px-2.5 py-1 text-[10px] font-bold text-accent">
                    {ar(s.branches.length)} فروع
                  </span>
                </div>

                <ElegantRule width={200} className="mt-4 text-accent" />

                {/* الفروع — ومعها الصورة إن وُجدت، فتملأ الفراغ بجانبها */}
                <div className={`mt-5 ${s.image ? "flex items-center gap-5" : ""}`}>
                  <ul className="flex-1 space-y-2.5">
                    {s.branches.map((b) => (
                      <li key={b} className="flex items-center gap-3 text-sm">
                        {/* نقطة إعجام مذهّبة */}
                        <svg viewBox="0 0 14 14" className="size-3.5 shrink-0 text-accent" fill="none" aria-hidden="true">
                          <path d="M7 1 12 7 7 13 2 7Z" stroke="currentColor" strokeWidth="1.2" />
                          <circle cx="7" cy="7" r="1.6" fill="currentColor" />
                        </svg>
                        <span className="font-medium">{b}</span>
                      </li>
                    ))}
                  </ul>

                  {s.image && (
                    <span className="relative hidden w-[42%] shrink-0 sm:block">
                      {/* وسم img عادي لا next/image: الأخير يعيد ترميز الصورة
                          فيُفقد GIF حركته. والصورة زخرفية فلا نصّ بديل لها. */}
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img
                        src={mediaSrc(s.image)}
                        alt=""
                        aria-hidden="true"
                        loading="lazy"
                        className="h-auto w-full rounded-2xl object-contain"
                      />
                    </span>
                  )}
                </div>

                {/* خيط مذهّب يمتدّ عند التمرير */}
                <span className="mt-6 block h-px w-12 origin-right bg-gradient-to-l from-accent to-transparent transition-all duration-500 group-hover:w-28" />
              </motion.article>
            </Reveal>
          ))}
        </div>
      </div>
    </section>
  );
}
