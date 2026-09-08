"use client";

/** الأسئلة الشائعة — أكورديون من المحتوى الحيّ. */
import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { IconPlus } from "@/components/brand/icons";
import { SectionHeading, Button } from "@/components/ui/primitives";
import { useContent } from "@/components/content/content-provider";
import { findFaqStyle, faqClass } from "@/lib/styles/block-styles";

export function Faq() {
  const { content, wa } = useContent();
  const [open, setOpen] = useState<number | null>(0);
  const FQ = findFaqStyle(content.faqStyle);
  /*
    أصناف الهوية (glass/foil/الظلّ) تُكتب فقط في التصميم «الأصلي».
    محاولةُ إلغائها بقاعدة CSS أقوى تجعل كل سطح جديد يخوض حرب أولويات
    مع الهوية — والأنظف ألّا تُكتب أصلاً حين لا تُراد.
  */
  const brand = FQ.surface === "brand";
  if (content.ui?.["section.faq"]?.hidden) return null;

  return (
    <section id="faq" className={`relative py-24 ${faqClass(FQ)}`} data-faq-style={FQ.id}>
      <div className="container max-w-3xl">
        <SectionHeading
          eyebrow="أسئلة شائعة"
          title={<>كل ما تحتاج <span className="text-gradient">معرفته</span> قبل البدء</>}
          desc="ولو عندك سؤال آخر، الدعم موجود على واتساب طوال الأسبوع."
        />
        <div className="fq-list">
          {(content.faqs ?? []).map((f, i) => {
            const isOpen = open === i;
            return (
              <motion.div key={f.q} initial={{ opacity: 0, y: 16 }} whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, margin: "-40px" }} transition={{ duration: 0.4, delay: i * 0.05 }}
                data-open={isOpen ? "1" : "0"}
                className={`fq-item overflow-hidden rounded-3xl transition ${
                  brand ? `glass border ${isOpen ? "border-accent/55 shadow-bento" : "border-border"}` : ""
                }`}>
                <button onClick={() => setOpen(isOpen ? null : i)} className="flex w-full items-center justify-between gap-4 p-5 text-right">
                  <span className="font-display text-base font-bold leading-relaxed sm:text-lg">{f.q}</span>
                  {/* العلامة: دورانها من CSS بحسب التصميم، فلا يفرضه المكوّن */}
                  <span className={`fq-mark grid size-8 shrink-0 place-items-center rounded-full transition ${isOpen ? "btn-glow text-white" : "btn-foil text-accent"}`}>
                    <IconPlus className="size-4" />
                  </span>
                </button>
                <AnimatePresence initial={false}>
                  {isOpen && (
                    <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: "auto", opacity: 1 }} exit={{ height: 0, opacity: 0 }}
                      transition={{ duration: 0.35, ease: [0.22, 1, 0.36, 1] }} className="overflow-hidden">
                      <div className="px-5 pb-5">
                        <span className="mb-3 block h-px w-full bg-gradient-to-l from-accent/40 via-accent/15 to-transparent" />
                        <p className="text-sm leading-loose text-muted-foreground">{f.a}</p>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </motion.div>
            );
          })}
        </div>
        <div className="mt-10 text-center">
          <Button as="a" href={wa("عندي سؤال قبل الاشتراك")} variant="outline">تواصل مع الدعم على واتساب</Button>
        </div>
      </div>
    </section>
  );
}
