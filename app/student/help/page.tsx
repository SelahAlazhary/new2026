"use client";

import { useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { IconWhatsapp, IconPlus, IconPhone, IconMail, IconLifebuoy } from "@/components/brand/icons";
import { InstallApp } from "@/components/pwa/install-app";
import { SupportChat } from "@/components/support/chat";
import { supportHref } from "@/lib/support";
import { PageHeader, Card } from "@/components/dashboard/ui";
import { useContent } from "@/components/content/content-provider";
import { useMaintGate } from "@/components/brand/maint-gate";

export default function HelpPage() {
  /* بوّابةُ الصيانة — المشرفون يمرّون والطلاب يرون اللوح. */
  const maintGate = useMaintGate("support");

  const { content, wa } = useContent();
  const [open, setOpen] = useState<number | null>(0);

  if (maintGate) return maintGate;

  return (
    <>
      <PageHeader title="المساعدة" subtitle="إجابات سريعة أو تواصل مباشر مع الدعم" />

      <InstallApp className="mb-6" />

      {/* محادثة مباشرة مع فريق الدعم داخل المنصّة */}
      <section className="mb-8">
        <div className="mb-3 flex items-center gap-2">
          <IconLifebuoy className="size-5 text-primary" />
          <h2 className="font-display font-extrabold">تحدّث مع فريق الدعم</h2>
        </div>
        <SupportChat emptyHint="اكتب سؤالك وسيصلك الردّ هنا — وإشعار على جهازك." />
      </section>

      <div className="mb-8 grid gap-4 sm:grid-cols-3">
        <a href={`https://wa.me/${content.support?.whatsapp || content.whatsapp}?text=${encodeURIComponent("السلام عليكم، أحتاج مساعدة")}`} target="_blank" rel="noreferrer" className="group">
          <Card className="flex items-center gap-3 transition group-hover:border-primary/40">
            <span className="grid size-11 place-items-center rounded-2xl bg-emerald-500/12 text-emerald-500"><IconWhatsapp className="size-5" /></span>
            <div><p className="font-bold">واتساب</p><p className="text-xs text-muted-foreground">رد سريع طوال الأسبوع</p></div>
          </Card>
        </a>
        <a href={`tel:${content.support?.phone || "+" + content.whatsapp}`} className="group">
          <Card className="flex items-center gap-3 transition group-hover:border-primary/40">
            <span className="grid size-11 place-items-center rounded-2xl bg-primary/12 text-primary"><IconPhone className="size-5" /></span>
            <div><p className="font-bold">اتصال</p><p className="text-xs text-muted-foreground" dir="ltr">{content.support?.phone || "للحالات العاجلة"}</p></div>
          </Card>
        </a>
        {content.support?.email && (
          <a href={`mailto:${content.support.email}`} className="group">
            <Card className="flex items-center gap-3 transition group-hover:border-primary/40">
              <span className="grid size-11 place-items-center rounded-2xl bg-sky-500/12 text-sky-500"><IconMail className="size-5" /></span>
              <div><p className="font-bold">بريد</p><p className="text-xs text-muted-foreground" dir="ltr">{content.support.email}</p></div>
            </Card>
          </a>
        )}
      </div>

      {(content.support?.links ?? []).filter((l) => l.visible).length > 0 && (
        <div className="mb-8 grid gap-4 sm:grid-cols-3">
          {(content.support?.links ?? [])
            .filter((l) => l.visible)
            .sort((a, b) => (a.order ?? 0) - (b.order ?? 0))
            .map((l) => (
              <a key={l.id} href={supportHref(l)} target="_blank" rel="noreferrer" className="group">
                <Card className="flex items-center gap-3 transition group-hover:border-primary/40">
                  <span className="grid size-11 shrink-0 place-items-center rounded-2xl bg-primary/12 text-primary">
                    <IconWhatsapp className="size-5" />
                  </span>
                  <div className="min-w-0">
                    <p className="truncate font-bold">{l.label}</p>
                    <p className="truncate text-xs text-muted-foreground">{l.desc || l.value}</p>
                  </div>
                </Card>
              </a>
            ))}
        </div>
      )}

      {content.support?.note && (
        <p className="mb-8 rounded-2xl bg-primary/8 px-4 py-3 text-center text-xs font-bold text-primary">
          {content.support.note}
        </p>
      )}

      <div className="mb-3 flex items-center gap-2"><IconLifebuoy className="size-5 text-primary" /><p className="font-display text-lg font-extrabold">الأسئلة الشائعة</p></div>
      <div className="space-y-3">
        {(content.faqs ?? []).map((f, i) => {
          const isOpen = open === i;
          return (
            <div key={f.q} className={`glass overflow-hidden rounded-3xl border transition ${isOpen ? "border-primary/40" : "border-border"}`}>
              <button onClick={() => setOpen(isOpen ? null : i)} className="flex w-full items-center justify-between gap-4 p-5 text-right">
                <span className="font-display font-bold">{f.q}</span>
                <motion.span animate={{ rotate: isOpen ? 45 : 0 }} className={`grid size-8 shrink-0 place-items-center rounded-full ${isOpen ? "btn-glow text-white" : "bg-muted"}`}><IconPlus className="size-4" /></motion.span>
              </button>
              <AnimatePresence initial={false}>
                {isOpen && (
                  <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: "auto", opacity: 1 }} exit={{ height: 0, opacity: 0 }} transition={{ duration: 0.3 }} className="overflow-hidden">
                    <p className="px-5 pb-5 text-sm leading-relaxed text-muted-foreground">{f.a}</p>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          );
        })}
      </div>
    </>
  );
}
