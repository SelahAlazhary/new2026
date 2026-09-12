"use client";

/**
 * قسم «لماذا نحن» — بطاقات على هيئة لوحات مخطوط.
 * كل بطاقة: لوحة مقوّسة للأيقونة · رقم بالحروف الهندية داخل ميدالية مذهّبة ·
 * منمنمة زاوية · سطر خطّ عربي يظهر عند التمرير.
 */
import { motion } from "framer-motion";
import { SectionHeading, Reveal } from "@/components/ui/primitives";
import { useContent } from "@/components/content/content-provider";
import { findSectionStyle, sectionClass, sxGridClass } from "@/lib/styles/section-styles";
import { featureIcon } from "@/components/brand/icons";

/** رقم عربي-هندي (١٢٣) لهوية أدقّ. */
const ar = (n: number) => n.toLocaleString("ar-EG");

export function Features() {
  const { content } = useContent();
  if (content.ui?.["section.features"]?.hidden) return null;

  const subject = content.teacher?.subject || "اللغة العربية";
  const SX = findSectionStyle(content.featuresStyle);
  /*
    أصناف الهوية (glass/foil/الظلّ) تُكتب فقط في التصميم «الأصلي».
    محاولةُ إلغائها بقاعدة CSS أقوى تجعل كل سطح جديد يخوض حرب أولويات
    مع الهوية — والأنظف ألّا تُكتب أصلاً حين لا تُراد.
  */
  const brand = SX.card === "brand" ? "glass shadow-bento" : "";

  return (
    <section id="features" className={`relative py-24 ${sectionClass(SX)}`} data-section-style={SX.id}>

      <div className="container">
        <SectionHeading
          eyebrow="لماذا نحن"
          title={
            <>
              كل ما تحتاجه لإتقان <span className="text-gradient">{subject}</span>
            </>
          }
          desc="منهج مرتّب يبني القاعدة قبل الحفظ، وتطبيق بعد كل درس، ومتابعة حتى الإتقان."
        />

        <div className={`sx-grid grid items-stretch gap-4 ${sxGridClass(SX.grid, (content.features ?? []).length)}`}>
          {(content.features ?? []).map((f, i) => {
            const Icon = featureIcon(f.icon);
            return (
              <Reveal key={f.title} delay={i * 0.08} className={f.span}>
                <motion.article
                  whileHover={{ y: -6 }}
                  transition={{ type: "spring", stiffness: 300, damping: 20 }}
                  className={`sx-card group relative h-full overflow-hidden rounded-4xl p-6 ${brand}`}
                >
                  {/* منمنمة الزاوية */}

                  {/*
                    لوحُ الرقم.
                    كان وردةً ثمانيّةً بدائرةٍ داخلها — وتلك صورةُ علامةِ نهاية
                    الآية في المصحف، لا يليق أن تُرقَّم بها مزايا منصّة. فصار
                    لوحاً مقصوصَ الركنين بخطٍّ تحته: علامةُ ترقيمٍ خالصة لا
                    تستعير من المصحف شيئاً.
                  */}
                  <span className="pointer-events-none absolute left-5 top-5 grid size-9 place-items-center">
                    <svg viewBox="0 0 36 36" className="absolute inset-0 size-full text-accent/45" fill="none" aria-hidden="true">
                      <path
                        d="M11 3.5H29A3.5 3.5 0 0 1 32.5 7V25L25 32.5H7A3.5 3.5 0 0 1 3.5 29V11Z"
                        stroke="currentColor"
                        strokeWidth="1"
                      />
                      <path d="M12.5 26.5H23.5" stroke="currentColor" strokeWidth="1.1" strokeLinecap="round" opacity="0.7" />
                    </svg>
                    <span className="font-display relative -mt-1 text-sm font-bold text-accent">{ar(i + 1)}</span>
                  </span>

                  {/* لوحة الأيقونة */}
                  <span className="feature-icon-dot relative mb-5 grid size-12 place-items-center text-primary">
                    <Icon anim="draw" className="relative size-6" />
                  </span>

                  <p className="font-kufi mb-1.5 text-[10px] tracking-[0.16em] text-accent">{f.tag}</p>
                  <h3 className="font-display text-xl font-bold leading-snug">{f.title}</h3>
                  <p className="mt-2.5 text-sm leading-relaxed text-muted-foreground">{f.desc}</p>

                  {/* خيط مذهّب يمتدّ عند التمرير */}
                  <span className="mt-5 block h-px w-10 origin-right bg-gradient-to-l from-accent to-transparent transition-all duration-500 group-hover:w-24" />
                </motion.article>
              </Reveal>
            );
          })}
        </div>
      </div>
    </section>
  );
}
