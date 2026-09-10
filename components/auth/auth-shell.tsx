"use client";

/** إطار موحّد لصفحات الدخول/التسجيل — لوحة ترويجية + نموذج على خلفية داكنة سينمائية. */
import Link from "next/link";
import { motion } from "framer-motion";
import { IconArrowLeft, IconShield, IconBook, IconScreen } from "@/components/brand/icons";
import { BrandLockup } from "@/components/brand/logo";
import { useContent } from "@/components/content/content-provider";
import type { ReactNode } from "react";

function ConstellationSVG() {
  return (
    <svg className="auth-constellation" viewBox="0 0 500 600" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
      <defs>
        <radialGradient id="auth-glow-a" cx="0.3" cy="0.2" r="0.7">
          <stop offset="0%" stopColor="rgba(139,92,246,0.12)" />
          <stop offset="100%" stopColor="transparent" />
        </radialGradient>
        <radialGradient id="auth-glow-b" cx="0.7" cy="0.8" r="0.5">
          <stop offset="0%" stopColor="rgba(245,158,11,0.06)" />
          <stop offset="100%" stopColor="transparent" />
        </radialGradient>
      </defs>
      <rect width="500" height="600" fill="url(#auth-glow-a)" />
      <rect width="500" height="600" fill="url(#auth-glow-b)" />
      {/* خطوط الشبكة */}
      <line x1="80" y1="90" x2="220" y2="160" stroke="rgba(139,92,246,0.08)" strokeWidth="0.5" />
      <line x1="220" y1="160" x2="380" y2="110" stroke="rgba(139,92,246,0.06)" strokeWidth="0.5" />
      <line x1="380" y1="110" x2="420" y2="280" stroke="rgba(139,92,246,0.05)" strokeWidth="0.5" />
      <line x1="220" y1="160" x2="180" y2="320" stroke="rgba(139,92,246,0.07)" strokeWidth="0.5" />
      <line x1="180" y1="320" x2="350" y2="380" stroke="rgba(139,92,246,0.06)" strokeWidth="0.5" />
      <line x1="350" y1="380" x2="420" y2="280" stroke="rgba(139,92,246,0.05)" strokeWidth="0.5" />
      <line x1="60" y1="420" x2="180" y2="320" stroke="rgba(139,92,246,0.04)" strokeWidth="0.5" />
      <line x1="350" y1="380" x2="300" y2="520" stroke="rgba(139,92,246,0.05)" strokeWidth="0.5" />
      <line x1="120" y1="500" x2="300" y2="520" stroke="rgba(139,92,246,0.04)" strokeWidth="0.5" />
      {/* عقد الشبكة */}
      <circle cx="80" cy="90" r="2" fill="rgba(139,92,246,0.3)">
        <animate attributeName="opacity" values="0.3;0.7;0.3" dur="4s" repeatCount="indefinite" />
      </circle>
      <circle cx="220" cy="160" r="2.5" fill="rgba(139,92,246,0.4)">
        <animate attributeName="opacity" values="0.4;0.8;0.4" dur="3.5s" repeatCount="indefinite" />
      </circle>
      <circle cx="380" cy="110" r="1.5" fill="rgba(139,92,246,0.25)">
        <animate attributeName="opacity" values="0.25;0.6;0.25" dur="5s" repeatCount="indefinite" />
      </circle>
      <circle cx="420" cy="280" r="2" fill="rgba(245,158,11,0.3)">
        <animate attributeName="opacity" values="0.3;0.6;0.3" dur="4.5s" repeatCount="indefinite" />
      </circle>
      <circle cx="180" cy="320" r="3" fill="rgba(139,92,246,0.35)">
        <animate attributeName="opacity" values="0.35;0.7;0.35" dur="3s" repeatCount="indefinite" />
      </circle>
      <circle cx="350" cy="380" r="2" fill="rgba(245,158,11,0.25)">
        <animate attributeName="opacity" values="0.25;0.55;0.25" dur="4s" repeatCount="indefinite" />
      </circle>
      <circle cx="60" cy="420" r="1.5" fill="rgba(139,92,246,0.2)">
        <animate attributeName="opacity" values="0.2;0.5;0.2" dur="5.5s" repeatCount="indefinite" />
      </circle>
      <circle cx="300" cy="520" r="2" fill="rgba(139,92,246,0.3)">
        <animate attributeName="opacity" values="0.3;0.6;0.3" dur="3.8s" repeatCount="indefinite" />
      </circle>
      <circle cx="120" cy="500" r="1.5" fill="rgba(245,158,11,0.2)">
        <animate attributeName="opacity" values="0.2;0.45;0.2" dur="4.2s" repeatCount="indefinite" />
      </circle>
    </svg>
  );
}

function HexagonBadge({ children, delay = 0 }: { children: ReactNode; delay?: number }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, delay }}
      className="auth-feature"
    >
      <span className="auth-feature-icon">{children}</span>
    </motion.div>
  );
}

export function AuthShell({ title, subtitle, children, footer }: { title: string; subtitle: string; children: ReactNode; footer: ReactNode }) {
  const { content } = useContent();
  return (
    <main className="auth-root">
      <div className="auth-bg" />
      <div className="auth-layout">
        {/* اللوحة الترويجية */}
        <motion.div
          initial={{ opacity: 0, x: -30 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.7, ease: [0.22, 1, 0.36, 1] }}
          className="auth-promo"
        >
          <ConstellationSVG />
          <div className="auth-promo-inner">
            <div className="auth-promo-top">
              <Link href="/" className="inline-flex">
                <BrandLockup brand={content.brand} subtitle={content.platformSubtitle} logo={content.teacher.logo} size={44} className="[&_span:last-child_span:last-child]:text-white/50" />
              </Link>
              <div className="auth-promo-headline">
                <h2 className="auth-promo-h2">
                  <span className="auth-promo-name">{content.teacher.name}</span>
                  {content.teacher.headline ? <span className="auth-promo-hl"> {content.teacher.headline} </span> : " "}
                  <span className="auth-promo-subj">{content.teacher.subject}</span>
                </h2>
                <p className="auth-promo-tag">{content.teacher.tagline}</p>
              </div>
            </div>

            <div className="auth-features">
              <motion.div
                initial={{ opacity: 0, y: 16 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: 0.3 }}
                className="auth-feature-row"
              >
                <div className="auth-feature">
                  <span className="auth-feature-icon"><IconBook className="size-4" /></span>
                  <span className="auth-feature-text">{content.teacher.subject} — إعدادي وثانوي</span>
                </div>
                <div className="auth-feature">
                  <span className="auth-feature-icon"><IconScreen className="size-4" /></span>
                  <span className="auth-feature-text">بث مباشر ودروس مسجّلة</span>
                </div>
                <div className="auth-feature">
                  <span className="auth-feature-icon"><IconShield className="size-4" /></span>
                  <span className="auth-feature-text">حساب آمن وتدريب بعد كل درس</span>
                </div>
              </motion.div>
            </div>

            <div className="auth-promo-foot">
              <div className="auth-promo-stat">
                <span className="auth-promo-stat-v">+١٠٠٠</span>
                <span className="auth-promo-stat-l">طالب مسجّل</span>
              </div>
              <span className="auth-promo-stat-sep" />
              <div className="auth-promo-stat">
                <span className="auth-promo-stat-v">+٥٠</span>
                <span className="auth-promo-stat-l">درس متوفّر</span>
              </div>
              <span className="auth-promo-stat-sep" />
              <div className="auth-promo-stat">
                <span className="auth-promo-stat-v">٤.٩</span>
                <span className="auth-promo-stat-l">تقييم الطلاب</span>
              </div>
            </div>
          </div>
        </motion.div>

        {/* النموذج */}
        <motion.div
          initial={{ opacity: 0, y: 24 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.15, ease: [0.22, 1, 0.36, 1] }}
          className="auth-form-wrap"
        >
          <div className="auth-card">
            <div className="auth-card-glow" />
            <Link href="/" className="auth-back">
              <IconArrowLeft className="size-4 rotate-180" /> العودة للموقع
            </Link>
            <h1 className="auth-title">{title}</h1>
            <p className="auth-subtitle">{subtitle}</p>
            <div className="auth-form-body">{children}</div>
            <div className="auth-footer">{footer}</div>
          </div>
        </motion.div>
      </div>
    </main>
  );
}

export const inputCls = "inp";
