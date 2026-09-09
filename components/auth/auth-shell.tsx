"use client";

/** إطار موحّد لصفحات الدخول/التسجيل — لوحة ترويجية + نموذج على خلفية داكنة. */
import Link from "next/link";
import { motion } from "framer-motion";
import { IconArrowLeft, IconShield, IconBook, IconScreen } from "@/components/brand/icons";
import { BrandLockup } from "@/components/brand/logo";
import { useContent } from "@/components/content/content-provider";
import type { ReactNode } from "react";

export function AuthShell({ title, subtitle, children, footer }: { title: string; subtitle: string; children: ReactNode; footer: ReactNode }) {
  const { content } = useContent();
  return (
    <main className="relative min-h-screen overflow-hidden" style={{ background: "#08070e" }}>
      <div className="mx-auto grid min-h-screen max-w-6xl items-center gap-8 px-5 py-10 lg:grid-cols-2">
        {/* اللوحة الترويجية */}
        <motion.div initial={{ opacity: 0, x: -24 }} animate={{ opacity: 1, x: 0 }} transition={{ duration: 0.6 }}
          className="relative order-2 hidden overflow-hidden rounded-[2rem] p-10 text-white lg:flex lg:flex-col lg:justify-between"
          style={{ background: "linear-gradient(145deg, #11101a, #16152a)", border: "1px solid rgba(255,255,255,0.04)" }}>
          {/* Ambient glow */}
          <div className="pointer-events-none absolute top-0 right-0 w-72 h-72 rounded-full opacity-40" style={{ background: "radial-gradient(circle, rgba(139,92,246,0.15), transparent 60%)", filter: "blur(60px)" }} />
          <div className="pointer-events-none absolute bottom-0 left-0 w-60 h-60 rounded-full opacity-30" style={{ background: "radial-gradient(circle, rgba(245,158,11,0.08), transparent 60%)", filter: "blur(50px)" }} />
          {/* Grid overlay */}
          <div className="pointer-events-none absolute inset-0 opacity-[0.03]" style={{ backgroundImage: "linear-gradient(rgba(139,92,246,.6) 1px, transparent 1px), linear-gradient(90deg, rgba(139,92,246,.6) 1px, transparent 1px)", backgroundSize: "24px 24px" }} />

          <div className="relative">
            <Link href="/" className="inline-flex">
              <BrandLockup brand={content.brand} subtitle={content.platformSubtitle} logo={content.teacher.logo} size={44} className="[&_span:last-child_span:last-child]:text-white/50" />
            </Link>
            <h2 className="mt-10 font-display text-3xl font-extrabold leading-snug text-white">
              {content.teacher.name}
              {content.teacher.headline ? ` ${content.teacher.headline} ` : " "}
              {content.teacher.subject}
            </h2>
            <p className="mt-3 max-w-sm" style={{ color: "rgba(255,255,255,0.4)" }}>{content.teacher.tagline}</p>
          </div>
          <ul className="relative mt-10 space-y-3 text-sm" style={{ color: "rgba(255,255,255,0.45)" }}>
            <li className="flex items-center gap-2"><IconBook className="size-4" /> {content.teacher.subject} — إعدادي وثانوي</li>
            <li className="flex items-center gap-2"><IconScreen className="size-4" /> بث مباشر ودروس مسجّلة</li>
            <li className="flex items-center gap-2"><IconShield className="size-4" /> حساب آمن وتدريب بعد كل درس</li>
          </ul>
        </motion.div>

        {/* النموذج */}
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6, delay: 0.1 }}
          className="order-1 lg:order-2">
          <div className="mx-auto w-full max-w-md rounded-[1.75rem] p-8" style={{ background: "rgba(255,255,255,0.02)", border: "1px solid rgba(255,255,255,0.04)" }}>
            <Link href="/" className="mb-6 inline-flex items-center gap-1.5 text-sm transition" style={{ color: "rgba(255,255,255,0.3)" }}>
              <IconArrowLeft className="size-4 rotate-180" /> العودة للموقع
            </Link>
            <h1 className="font-display text-2xl font-extrabold text-white">{title}</h1>
            <p className="mt-1 text-sm" style={{ color: "rgba(255,255,255,0.3)" }}>{subtitle}</p>
            <div className="mt-6">{children}</div>
            <div className="mt-6 text-center text-sm" style={{ color: "rgba(255,255,255,0.25)" }}>{footer}</div>
          </div>
        </motion.div>
      </div>
    </main>
  );
}

export const inputCls = "inp";
