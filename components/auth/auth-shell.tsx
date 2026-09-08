"use client";

/** إطار موحّد لصفحات الدخول/التسجيل — لوحة ترويجية متدرّجة + نموذج. */
import Link from "next/link";
import { motion } from "framer-motion";
import { IconArrowLeft, IconShield, IconBook, IconScreen } from "@/components/brand/icons";
import { BrandLockup } from "@/components/brand/logo";
import { useContent } from "@/components/content/content-provider";
import type { ReactNode } from "react";

export function AuthShell({ title, subtitle, children, footer }: { title: string; subtitle: string; children: ReactNode; footer: ReactNode }) {
  const { content } = useContent();
  return (
    <main className="relative min-h-screen overflow-hidden">
      <div className="mx-auto grid min-h-screen max-w-6xl items-center gap-8 px-5 py-10 lg:grid-cols-2">
        {/* اللوحة الترويجية */}
        <motion.div initial={{ opacity: 0, x: -24 }} animate={{ opacity: 1, x: 0 }} transition={{ duration: 0.6 }}
          className="btn-glow relative order-2 hidden overflow-hidden rounded-[2rem] p-10 text-white lg:flex lg:flex-col lg:justify-between">
          <div className="relative">
            <Link href="/" className="inline-flex">
              <BrandLockup brand={content.brand} subtitle={content.platformSubtitle} logo={content.teacher.logo} size={44} className="[&_span:last-child_span:last-child]:text-white/80" />
            </Link>
            {/*
              العنوانُ يُركَّب كما يُركَّب في الرئيسية.
              كان يعرض `headline` مجرَّدةً — وهي حرفُ الوصل «في» وحدَه، لأنّ
              الاسمَ والمادّةَ حقلان مستقلّان تجمعهما الرئيسيّةُ حولَه. فكان
              اللوحُ يقول «في» ولا شيءَ غيرها.

              ومصدرُ الثلاثة واحدٌ هنا وهناك، فلا يفترق ما يراه الزائرُ في
              الصفحة عمّا يراه في شاشة الدخول.
            */}
            <h2 className="mt-10 font-display text-3xl font-extrabold leading-snug">
              {content.teacher.name}
              {content.teacher.headline ? ` ${content.teacher.headline} ` : " "}
              {content.teacher.subject}
            </h2>
            <p className="mt-3 max-w-sm text-white/85">{content.teacher.tagline}</p>
          </div>
          <ul className="relative mt-10 space-y-3 text-sm">
            <li className="flex items-center gap-2"><IconBook className="size-4" /> {content.teacher.subject} — إعدادي وثانوي</li>
            <li className="flex items-center gap-2"><IconScreen className="size-4" /> بث مباشر ودروس مسجّلة</li>
            <li className="flex items-center gap-2"><IconShield className="size-4" /> حساب آمن وتدريب بعد كل درس</li>
          </ul>
        </motion.div>

        {/* النموذج */}
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6, delay: 0.1 }}
          className="order-1 lg:order-2">
          <div className="glass mx-auto w-full max-w-md rounded-[1.75rem] p-8 shadow-glow">
            <Link href="/" className="mb-6 inline-flex items-center gap-1.5 text-sm text-muted-foreground transition hover:text-primary">
              <IconArrowLeft className="size-4 rotate-180" /> العودة للموقع
            </Link>
            <h1 className="font-display text-2xl font-extrabold">{title}</h1>
            <p className="mt-1 text-sm text-muted-foreground">{subtitle}</p>
            <div className="mt-6">{children}</div>
            <div className="mt-6 text-center text-sm text-muted-foreground">{footer}</div>
          </div>
        </motion.div>
      </div>
    </main>
  );
}

export const inputCls = "inp";
