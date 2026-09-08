"use client";

/**
 * مجموعة أيقونات الهوية — SVG مرسومة يدوياً على شبكة 24×24.
 * القواعد: مساحة أمان 2px من كل جهة · سُمك خط 1.5 · نهايات وزوايا دائرية ·
 * currentColor فقط (تتبع لون النص) · الأيقونة الزخرفية aria-hidden.
 * لا اعتماد على مكتبة أيقونات في واجهة الموقع العامة.
 */
import type { ReactElement, SVGProps } from "react";
import { useContent } from "@/components/content/content-provider";
import { findIconLib, slotPath, slotOverlay, libAttrs, type IconSlot } from "@/lib/icons/icon-libs";

/** حركة الأيقونة: رسم عند الظهور · تأرجح · نبض · اهتزاز لهب · طفو · ظهور نطّي. */
type IconAnim = "draw" | "swing" | "pulse" | "flick" | "bob" | "pop" | "tick";
export type IconProps = SVGProps<SVGSVGElement> & { title?: string; anim?: IconAnim };

function Icon({ title, children, anim, className = "", ...rest }: IconProps) {
  return (
    <svg
      className={`${anim ? `ico-${anim}` : ""} ${className}`.trim()}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={1.5}
      strokeLinecap="round"
      strokeLinejoin="round"
      focusable="false"
      aria-hidden={title ? undefined : true}
      role={title ? "img" : undefined}
      {...rest}
    >
      {title ? <title>{title}</title> : null}
      {children}
    </svg>
  );
}

/* ---------- أيقونات المزايا ---------- */

/** متن/مخطوطة مفتوحة على حامل. */
export function IconManuscript(p: IconProps) {
  return (
    <Icon {...p}>
      <path d="M12 6.4C10.6 5.2 8.8 4.6 6.6 4.6H4.2v12.2h2.4c2.2 0 4 .6 5.4 1.8 1.4-1.2 3.2-1.8 5.4-1.8h2.4V4.6h-2.4c-2.2 0-4 .6-5.4 1.8Z" />
      <path d="M12 6.4v12.2" />
      <path d="M7 8.6h2.6M7 11.4h2.6M14.4 8.6H17M14.4 11.4H17" opacity={0.55} />
      <path d="M9.2 21h5.6" opacity={0.55} />
    </Icon>
  );
}

/** ميزان الأدلّة. */
export function IconEvidence(p: IconProps) {
  return (
    <Icon {...p}>
      <path d="M12 4.2v15.4M8.4 19.6h7.2" />
      <path d="M4.4 7.6h15.2" />
      <path d="m4.4 7.6-2.2 5.2a3.1 3.1 0 0 0 4.4 0L4.4 7.6Z" />
      <path d="m19.6 7.6-2.2 5.2a3.1 3.1 0 0 0 4.4 0l-2.2-5.2Z" />
      <circle cx="12" cy="5.4" r="1.4" opacity={0.55} />
    </Icon>
  );
}

/** درع الحماية بجهاز واحد. */
function IconShieldRaw(p: IconProps) {
  return (
    <Icon {...p}>
      <path d="M12 2.8 4.8 5.6v6.1c0 4.2 2.9 7.6 7.2 9.5 4.3-1.9 7.2-5.3 7.2-9.5V5.6L12 2.8Z" />
      <path d="m9.2 11.8 2 2 3.6-3.8" />
    </Icon>
  );
}

/** دعم/محادثة. */
export function IconSupport(p: IconProps) {
  return (
    <Icon {...p}>
      <path d="M20.4 12.4c0 3.7-3.6 6.6-8 6.6-.9 0-1.8-.1-2.6-.35L4.6 20.4l1.3-3.5C4.4 15.7 3.6 14.1 3.6 12.4c0-3.6 3.6-6.6 8-6.6s8.8 3 8.8 6.6Z" />
      <path d="M8.8 12.4h.01M12.4 12.4h.01M16 12.4h.01" strokeWidth={2} />
    </Icon>
  );
}

/** شاشة بث/درس مسجّل. */
export function IconScreen(p: IconProps) {
  return (
    <Icon {...p}>
      <rect x="2.8" y="4.4" width="18.4" height="12.4" rx="2.2" />
      <path d="M8.6 20.6h6.8M12 16.8v3.8" opacity={0.55} />
      <path d="m10.6 8.4 4 2.2-4 2.2V8.4Z" />
    </Icon>
  );
}

/* ---------- أيقونات الواجهة ---------- */

function IconCheckRaw(p: IconProps) {
  return (
    <Icon {...p}>
      <path d="m4.6 12.4 4.6 4.6L19.4 6.8" />
    </Icon>
  );
}

export function IconPlus(p: IconProps) {
  return (
    <Icon {...p}>
      <path d="M12 5.2v13.6M5.2 12h13.6" />
    </Icon>
  );
}

export function IconArrowLeft(p: IconProps) {
  return (
    <Icon {...p}>
      <path d="M19 12H5.4" />
      <path d="m11 5.6-5.6 6.4L11 18.4" />
    </Icon>
  );
}

/**
 * النسخ — ورقتان إحداهما خلف الأخرى.
 * تُوضع بجانب ما يُنسخ في بوّابة الدفع: `title` لا يظهر باللمس، فبلا
 * أيقونةٍ ظاهرةٍ لا يعلم الطالبُ أنّ رقمَ المحفظة يُنسخ بضغطة فيكتبه بيده.
 */
export function IconCopy(p: IconProps) {
  return (
    <Icon {...p}>
      <rect x="9" y="9" width="11.2" height="11.2" rx="2" />
      <path d="M15 6.4V5.8a2 2 0 0 0-2-2H5.8a2 2 0 0 0-2 2V13a2 2 0 0 0 2 2h.6" />
    </Icon>
  );
}

function IconPlayRaw(p: IconProps) {
  return (
    <Icon {...p}>
      <circle cx="12" cy="12" r="8.8" />
      <path d="m10 8.6 5.4 3.4-5.4 3.4V8.6Z" />
    </Icon>
  );
}

function IconCalendarRaw(p: IconProps) {
  return (
    <Icon {...p}>
      <rect x="3.6" y="5.4" width="16.8" height="15" rx="2.4" />
      <path d="M3.6 10.2h16.8M8.4 3.4v3.6M15.6 3.4v3.6" />
    </Icon>
  );
}

function IconLayersRaw(p: IconProps) {
  return (
    <Icon {...p}>
      <path d="m12 3.4 8.4 4.2-8.4 4.2-8.4-4.2 8.4-4.2Z" />
      <path d="m3.6 12 8.4 4.2 8.4-4.2" opacity={0.6} />
      <path d="m3.6 16.4 8.4 4.2 8.4-4.2" opacity={0.35} />
    </Icon>
  );
}

function IconBookRaw(p: IconProps) {
  return (
    <Icon {...p}>
      <path d="M5 4.4h9.6a3.4 3.4 0 0 1 3.4 3.4v11.8H8.4A3.4 3.4 0 0 1 5 16.2V4.4Z" />
      <path d="M5 16.2a3.4 3.4 0 0 1 3.4-3.4H18" opacity={0.55} />
    </Icon>
  );
}

/** نجمة ثمانية (خاتم) — عنصر الهوية الأساسي. */
export function IconKhatam(p: IconProps) {
  return (
    <Icon {...p}>
      <path d="M12 2.6 21.4 12 12 21.4 2.6 12 12 2.6Z" />
      <path d="M5.4 5.4h13.2v13.2H5.4V5.4Z" opacity={0.55} />
    </Icon>
  );
}

/** واتساب — مسار مرسوم لا أيقونة مكتبة. */
export function IconWhatsapp(p: IconProps) {
  return (
    <Icon {...p}>
      <path d="M20.4 11.7c0 4.6-3.8 8.4-8.5 8.4-1.5 0-2.9-.4-4.1-1l-4.2 1.3 1.4-4a8.2 8.2 0 0 1-1.1-4.1c0-4.6 3.8-8.4 8.5-8.4s8 3.7 8 7.8Z" />
      <path d="M9.3 8.6c.3-.1.6 0 .8.3l.8 1.3c.1.2.1.5 0 .7l-.5.7c.5 1 1.3 1.8 2.3 2.3l.7-.5c.2-.1.5-.2.7 0l1.3.8c.3.2.4.5.3.8-.3.8-1.1 1.3-1.9 1.2-2.6-.3-5-2.6-5.3-5.3-.1-.8.3-1.6 1-1.9l-.2-.4Z" />
    </Icon>
  );
}

export function IconFacebook(p: IconProps) {
  return (
    <Icon {...p}>
      <path d="M14.6 21v-7.6h2.6l.4-3h-3V8.5c0-.9.3-1.5 1.6-1.5h1.5V4.3c-.7-.1-1.5-.2-2.3-.2-2.3 0-3.9 1.4-3.9 4v2.3H8.9v3h2.6V21" />
    </Icon>
  );
}

export function IconYoutube(p: IconProps) {
  return (
    <Icon {...p}>
      <rect x="2.6" y="5.6" width="18.8" height="12.8" rx="4" />
      <path d="m10.4 9.4 5 2.6-5 2.6V9.4Z" />
    </Icon>
  );
}

export function IconTelegram(p: IconProps) {
  return (
    <Icon {...p}>
      <path d="m20.6 4.6-2.9 14.2c-.2 1-.8 1.2-1.6.8l-4.4-3.2-2.1 2c-.2.3-.5.5-.9.5l.3-4.4 8.1-7.3c.4-.3-.1-.5-.6-.2L6.4 12.3 2.1 11c-.9-.3-1-.9.2-1.4l17-6.5c.8-.3 1.5.2 1.3 1.5Z" />
    </Icon>
  );
}

export function IconStar({ filled = false, ...p }: IconProps & { filled?: boolean }) {
  return (
    <Icon {...p} fill={filled ? "currentColor" : "none"}>
      <path d="m12 3.6 2.6 5.3 5.8.85-4.2 4.1 1 5.8-5.2-2.75L6.8 19.65l1-5.8-4.2-4.1 5.8-.85L12 3.6Z" />
    </Icon>
  );
}


/* ---------- أيقونات الشريط العلوي ---------- */

function IconSunRaw(p: IconProps) {
  return (
    <Icon {...p}>
      <circle cx="12" cy="12" r="4.2" />
      <path d="M12 2.8v2.4M12 18.8v2.4M21.2 12h-2.4M5.2 12H2.8M18.5 5.5l-1.7 1.7M7.2 16.8l-1.7 1.7M18.5 18.5l-1.7-1.7M7.2 7.2 5.5 5.5" />
    </Icon>
  );
}

function IconMoonRaw(p: IconProps) {
  return (
    <Icon {...p}>
      <path d="M20.4 14.6A8.8 8.8 0 0 1 9.4 3.6a8.8 8.8 0 1 0 11 11Z" />
    </Icon>
  );
}

function IconMenuRaw(p: IconProps) {
  return (
    <Icon {...p}>
      <path d="M4 7.2h16M4 12h16M4 16.8h10" />
    </Icon>
  );
}

function IconCloseRaw(p: IconProps) {
  return (
    <Icon {...p}>
      <path d="m6.4 6.4 11.2 11.2M17.6 6.4 6.4 17.6" />
    </Icon>
  );
}

export function IconTrophy(p: IconProps) {
  return (
    <Icon {...p}>
      <path d="M7.6 4.4h8.8v5.2a4.4 4.4 0 0 1-8.8 0V4.4Z" />
      <path d="M7.6 6h-2a2.4 2.4 0 0 0 2.4 2.4M16.4 6h2A2.4 2.4 0 0 1 18 8.4" />
      <path d="M12 14v3.2M8.8 19.6h6.4" />
    </Icon>
  );
}

export function IconSparkle(p: IconProps) {
  return (
    <Icon {...p}>
      <path d="M12 3.2c.9 4 1.9 5 5.9 5.9-4 .9-5 1.9-5.9 5.9-.9-4-1.9-5-5.9-5.9 4-.9 5-1.9 5.9-5.9Z" />
      <path d="M18.4 15.2c.4 1.8.8 2.2 2.6 2.6-1.8.4-2.2.8-2.6 2.6-.4-1.8-.8-2.2-2.6-2.6 1.8-.4 2.2-.8 2.6-2.6Z" opacity={0.6} />
    </Icon>
  );
}


/* ---------- أيقونات لوحات التحكّم وبوابة الطالب ---------- */

function IconHomeRaw(p: IconProps) {
  return (
    <Icon {...p}>
      <path d="M3.8 10.4 12 3.6l8.2 6.8" />
      <path d="M5.6 9v10.4h12.8V9" />
      <path d="M9.8 19.4v-5.2h4.4v5.2" opacity={0.6} />
    </Icon>
  );
}

function IconGridRaw(p: IconProps) {
  return (
    <Icon {...p}>
      <rect x="3.6" y="3.6" width="7" height="7" rx="1.8" />
      <rect x="13.4" y="3.6" width="7" height="7" rx="1.8" opacity={0.6} />
      <rect x="3.6" y="13.4" width="7" height="7" rx="1.8" opacity={0.6} />
      <rect x="13.4" y="13.4" width="7" height="7" rx="1.8" />
    </Icon>
  );
}

function IconUsersRaw(p: IconProps) {
  return (
    <Icon {...p}>
      <circle cx="9.6" cy="8.4" r="3.4" />
      <path d="M3.6 20c0-3.3 2.7-6 6-6s6 2.7 6 6" />
      <path d="M16 5.4a3.4 3.4 0 0 1 0 6M17.6 14.6c1.8.8 3 2.6 3 4.6" opacity={0.55} />
    </Icon>
  );
}

function IconRadioRaw(p: IconProps) {
  return (
    <Icon {...p}>
      <circle cx="12" cy="12" r="2.6" />
      <path d="M8.2 15.8a5.4 5.4 0 0 1 0-7.6M15.8 8.2a5.4 5.4 0 0 1 0 7.6" />
      <path d="M5.4 18.6a9.4 9.4 0 0 1 0-13.2M18.6 5.4a9.4 9.4 0 0 1 0 13.2" opacity={0.5} />
    </Icon>
  );
}

function IconBellRaw(p: IconProps) {
  return (
    <Icon {...p}>
      <path d="M12 3.4a5.8 5.8 0 0 0-5.8 5.8v3.4l-1.4 2.8h14.4l-1.4-2.8V9.2A5.8 5.8 0 0 0 12 3.4Z" />
      <path d="M9.8 18.2a2.4 2.4 0 0 0 4.4 0" />
    </Icon>
  );
}

function IconLifebuoyRaw(p: IconProps) {
  return (
    <Icon {...p}>
      <circle cx="12" cy="12" r="8.6" />
      <circle cx="12" cy="12" r="3.6" />
      <path d="m6 6 3.4 3.4M18 6l-3.4 3.4M6 18l3.4-3.4M18 18l-3.4-3.4" opacity={0.6} />
    </Icon>
  );
}

function IconClipboardCheckRaw(p: IconProps) {
  return (
    <Icon {...p}>
      <path d="M8.6 4.6H6.8a2 2 0 0 0-2 2v12.2a2 2 0 0 0 2 2h10.4a2 2 0 0 0 2-2V6.6a2 2 0 0 0-2-2h-1.8" />
      <rect x="8.6" y="2.8" width="6.8" height="3.6" rx="1.2" />
      <path d="m9.2 13.6 2 2 3.8-4" />
    </Icon>
  );
}

function IconChartRaw(p: IconProps) {
  return (
    <Icon {...p}>
      <path d="M4 20.2V4" />
      <path d="M4 20.2h16" />
      <path d="M8.4 16.6v-4.4M12.4 16.6V8.6M16.4 16.6v-6.6" />
    </Icon>
  );
}

function IconWalletRaw(p: IconProps) {
  return (
    <Icon {...p}>
      <rect x="3.4" y="6" width="17.2" height="13" rx="2.6" />
      <path d="M3.4 10.2h17.2" opacity={0.5} />
      <circle cx="16.8" cy="14.6" r="1.2" />
    </Icon>
  );
}

function IconPaletteRaw(p: IconProps) {
  return (
    <Icon {...p}>
      <path d="M12 3.6a8.4 8.4 0 0 0 0 16.8c1.3 0 1.9-.9 1.9-1.8 0-1.5-1.1-1.8-1.1-2.9 0-.9.7-1.5 1.7-1.5h1.6a4.3 4.3 0 0 0 4.3-4.3c0-3.6-3.7-6.3-8.4-6.3Z" />
      <circle cx="8.2" cy="10" r="1" fill="currentColor" stroke="none" />
      <circle cx="12" cy="7.8" r="1" fill="currentColor" stroke="none" />
      <circle cx="15.6" cy="9.6" r="1" fill="currentColor" stroke="none" />
    </Icon>
  );
}

function IconKeyRaw(p: IconProps) {
  return (
    <Icon {...p}>
      <circle cx="7.6" cy="16.4" r="3.4" />
      <path d="m10 14 8.4-8.4M15.6 8.4l2 2M13.6 10.4l2 2" />
    </Icon>
  );
}

function IconSearchRaw(p: IconProps) {
  return (
    <Icon {...p}>
      <circle cx="10.8" cy="10.8" r="6.4" />
      <path d="m15.6 15.6 4.4 4.4" />
    </Icon>
  );
}

function IconLogoutRaw(p: IconProps) {
  return (
    <Icon {...p}>
      <path d="M14.6 3.8h3.6a2 2 0 0 1 2 2v12.4a2 2 0 0 1-2 2h-3.6" />
      <path d="M9.6 8.4 5.4 12l4.2 3.6M5.4 12h9.2" />
    </Icon>
  );
}


function IconLockRaw(p: IconProps) {
  return (
    <Icon {...p}>
      <rect x="4.6" y="10.2" width="14.8" height="10.2" rx="2.4" />
      <path d="M8 10.2V7.6a4 4 0 0 1 8 0v2.6" />
      <path d="M12 14.2v2.4" />
    </Icon>
  );
}

export function IconCart(p: IconProps) {
  return (
    <Icon {...p}>
      <path d="M3 4.4h2.4l2.2 10.4h9.6l1.8-7.2H6.2" />
      <circle cx="9.4" cy="19" r="1.4" />
      <circle cx="16.6" cy="19" r="1.4" />
    </Icon>
  );
}

function IconClockRaw(p: IconProps) {
  return (
    <Icon {...p}>
      <circle cx="12" cy="12" r="8.6" />
      <path d="M12 7.4V12l3 1.8" />
    </Icon>
  );
}

export function IconFlame(p: IconProps) {
  return (
    <Icon {...p}>
      <path d="M12 3.2c3.4 3 5.2 5.6 5.2 8.4A5.2 5.2 0 0 1 12 20.8a5.2 5.2 0 0 1-5.2-5.2c0-1.6.7-3 2-4.4.3 1 .9 1.7 1.8 2 .1-3 .6-5.3 1.4-7Z" />
    </Icon>
  );
}

function IconDownloadRaw(p: IconProps) {
  return (
    <Icon {...p}>
      <path d="M12 3.8v10.6" />
      <path d="m7.8 10.6 4.2 4 4.2-4" />
      <path d="M4.6 18.4v.8a2 2 0 0 0 2 2h10.8a2 2 0 0 0 2-2v-.8" />
    </Icon>
  );
}

export function IconFile(p: IconProps) {
  return (
    <Icon {...p}>
      <path d="M13.4 3.4H7.6a2 2 0 0 0-2 2v13.2a2 2 0 0 0 2 2h8.8a2 2 0 0 0 2-2V8.4l-5-5Z" />
      <path d="M13.4 3.4v5h5" opacity={0.6} />
      <path d="M9 13h6M9 16.2h4" opacity={0.5} />
    </Icon>
  );
}

export function IconListVideo(p: IconProps) {
  return (
    <Icon {...p}>
      <path d="M3.8 6.4h8M3.8 11h8M3.8 15.6h5" />
      <path d="M14.6 9.6v6.8l5.6-3.4-5.6-3.4Z" />
    </Icon>
  );
}

export function IconListChecks(p: IconProps) {
  return (
    <Icon {...p}>
      <path d="m3.4 7 1.8 1.8L8.4 5.6M3.4 16.4l1.8 1.8 3.2-3.2" />
      <path d="M11.4 7.4h9.2M11.4 16.8h9.2" />
    </Icon>
  );
}

export function IconGift(p: IconProps) {
  return (
    <Icon {...p}>
      <rect x="3.8" y="8.6" width="16.4" height="4" rx="1.2" />
      <path d="M5.4 12.6v6a2 2 0 0 0 2 2h9.2a2 2 0 0 0 2-2v-6" />
      <path d="M12 8.6v12.2" />
      <path d="M12 8.6S10.4 4 8.2 4a2.1 2.1 0 0 0 0 4.6M12 8.6S13.6 4 15.8 4a2.1 2.1 0 0 1 0 4.6" opacity={0.7} />
    </Icon>
  );
}

export function IconCheckCircle(p: IconProps) {
  return (
    <Icon {...p}>
      <circle cx="12" cy="12" r="8.6" />
      <path d="m8.4 12.2 2.4 2.4 4.8-5" />
    </Icon>
  );
}

export function IconXCircle(p: IconProps) {
  return (
    <Icon {...p}>
      <circle cx="12" cy="12" r="8.6" />
      <path d="m9.4 9.4 5.2 5.2M14.6 9.4l-5.2 5.2" />
    </Icon>
  );
}

export function IconRotate(p: IconProps) {
  return (
    <Icon {...p}>
      <path d="M4.4 12a7.6 7.6 0 1 0 2.4-5.6" />
      <path d="M4.2 4.6v4h4" />
    </Icon>
  );
}

export function IconSpinner(p: IconProps) {
  return (
    <Icon {...p}>
      <path d="M12 3.6v3.2" />
      <path d="M12 17.2v3.2" opacity={0.3} />
      <path d="M20.4 12h-3.2" opacity={0.75} />
      <path d="M6.8 12H3.6" opacity={0.45} />
      <path d="m17.9 6.1-2.3 2.3" opacity={0.85} />
      <path d="m8.4 15.6-2.3 2.3" opacity={0.35} />
      <path d="m17.9 17.9-2.3-2.3" opacity={0.6} />
      <path d="M8.4 8.4 6.1 6.1" opacity={0.2} />
    </Icon>
  );
}

export function IconGraduation(p: IconProps) {
  return (
    <Icon {...p}>
      <path d="m12 4.2 9 4.2-9 4.2-9-4.2 9-4.2Z" />
      <path d="M6.6 10.6v4.6c0 1.6 2.4 2.9 5.4 2.9s5.4-1.3 5.4-2.9v-4.6" />
      <path d="M20.4 8.8v5" opacity={0.5} />
    </Icon>
  );
}

export function IconShare(p: IconProps) {
  return (
    <Icon {...p}>
      <path d="M12 15.4V4.2" />
      <path d="m8.2 7.8 3.8-3.6 3.8 3.6" />
      <path d="M6 12.4H5a1.6 1.6 0 0 0-1.6 1.6v5.4A1.6 1.6 0 0 0 5 21h14a1.6 1.6 0 0 0 1.6-1.6V14a1.6 1.6 0 0 0-1.6-1.6h-1" />
    </Icon>
  );
}

export function IconInstall(p: IconProps) {
  return (
    <Icon {...p}>
      <rect x="6.4" y="2.6" width="11.2" height="18.8" rx="2.6" />
      <path d="M12 7.6v6" />
      <path d="m9.6 11.2 2.4 2.4 2.4-2.4" />
    </Icon>
  );
}


export function IconPhone(p: IconProps) {
  return (
    <Icon {...p}>
      <path d="M8.2 4.2 5.4 5.4c-1 .4-1.5 1.5-1.2 2.5a17.4 17.4 0 0 0 11.9 11.9c1 .3 2.1-.2 2.5-1.2l1.2-2.8-4.2-2.2-1.8 1.8a12.6 12.6 0 0 1-5.2-5.2l1.8-1.8L8.2 4.2Z" />
    </Icon>
  );
}

export function IconMail(p: IconProps) {
  return (
    <Icon {...p}>
      <rect x="3" y="5.4" width="18" height="13.2" rx="2.4" />
      <path d="m3.8 7 7.1 5.2a2 2 0 0 0 2.2 0L20.2 7" />
    </Icon>
  );
}


function IconDatabaseRaw(p: IconProps) {
  return (
    <Icon {...p}>
      <ellipse cx="12" cy="6" rx="7.6" ry="3.2" />
      <path d="M4.4 6v6c0 1.8 3.4 3.2 7.6 3.2s7.6-1.4 7.6-3.2V6" />
      <path d="M4.4 12v6c0 1.8 3.4 3.2 7.6 3.2s7.6-1.4 7.6-3.2v-6" opacity={0.6} />
    </Icon>
  );
}

/**
 * خريطة مفاتيح المزايا القادمة من لوحة الأدمن → أيقونات الهوية.
 *
 * وتُبنى **دالّةً لا ثابتاً**: بعضُ الأيقونات صارت تتبع المكتبة المختارة،
 * وهي مصرَّحةٌ بـ`const` في آخر الملفّ. وثابتٌ يُقرأ عند التحميل يقرؤها
 * قبل أن تُعرَّف — وهو خطأُ «استُعمل قبل التصريح» بعينه. والدالّةُ لا
 * تُقرأ إلّا حين تُستدعى، وحينها يكون كلُّ شيءٍ معرَّفاً.
 */
export function featureIcon(key: string): (p: IconProps) => ReactElement {
  const map: Record<string, (p: IconProps) => ReactElement> = {
    BookOpenCheck: IconManuscript,
    ScrollText: IconEvidence,
    ShieldCheck: IconShield,
    MessagesSquare: IconSupport,
    MonitorPlay: IconScreen,
  };
  return map[key] ?? IconManuscript;
}

/** مفتاحُ ربط — الصيانة. */
function IconWrenchRaw(p: IconProps) {
  return (
    <Icon {...p}>
      <path d="M15.5 3.5a5.5 5.5 0 0 0-6.9 6.9L3.6 15.4a2 2 0 0 0 2.8 2.8l5-5a5.5 5.5 0 0 0 6.9-6.9l-3 3-2.8-2.8z" />
    </Icon>
  );
}

/* ============================================================
   أيقوناتُ الهوية تتبع المكتبة
   ------------------------------------------------------------
   كانت المكتبةُ تصل القائمةَ الجانبية وشريطَ الواجهة وحدَهما، وما عداهما
   يكتب أيقونةَ الهوية مباشرةً — نحوَ مئتَي موضعٍ في خمسةٍ وعشرين ملفّاً.
   فكان تبديلُ المكتبة يبدّل عشرَ أيقوناتٍ ويترك الباقي.

   وإبدالُ المواضع كلِّها واحداً واحداً عملٌ طويلٌ يُنسى بعضُه ويعود
   الخللُ مع أوّل أيقونةٍ جديدة. فالإصلاحُ من الجذر: الأيقونةُ نفسُها
   تسأل عن المكتبة المختارة. فمن كتب `<IconBook/>` في أيّ موضعٍ نال
   المكتبةَ المختارة بلا أن يعلم.

   **ولا دورةَ استيراد:** هذا الملفّ يستورد بيانات المكتبة (`icon-libs`)
   وهي بياناتٌ صرفة، ولا يستورد `lib-icon` الذي يستورده هو. والاتّجاهُ
   واحدٌ فلا تنعقد حلقة.

   **والشعاراتُ مستثناة:** يوتيوب وواتساب وفيسبوك وتليجرام علاماتٌ
   مسجّلة لا رموزُ واجهة، وإبدالُها برمزٍ عامّ يُفقدها معناها.
   ============================================================ */

function withLib(slot: IconSlot, Raw: (p: IconProps) => ReactElement) {
  const Wrapped = ({ className = "", anim, ...rest }: IconProps) => {
    const { content } = useContent();
    const lib = findIconLib(content.iconLib);

    /* «المخطوط» هو الأصل: رسمُ الهوية بيدها، فلا يُستبدل به مسارٌ عامّ. */
    if (lib.geo === "brand") return <Raw className={className} anim={anim} {...rest} />;

    const a = libAttrs(lib);
    const over = slotOverlay(lib, slot);
    return (
      <svg
        viewBox="0 0 24 24"
        className={`${anim ? `ico-${anim}` : ""} ${className}`.trim()}
        focusable="false"
        aria-hidden="true"
        {...a}
        {...rest}
      >
        <path d={slotPath(lib, slot)} opacity={over ? 0.22 : undefined} />
        {over && <path d={over} fill="none" stroke="currentColor" strokeWidth={lib.width} />}
      </svg>
    );
  };
  Wrapped.displayName = `Lib(${slot})`;
  return Wrapped;
}

export const IconHome = withLib("home", IconHomeRaw);
export const IconGrid = withLib("grid", IconGridRaw);
export const IconUsers = withLib("users", IconUsersRaw);
export const IconLayers = withLib("layers", IconLayersRaw);
export const IconBook = withLib("book", IconBookRaw);
export const IconKey = withLib("key", IconKeyRaw);
export const IconClipboardCheck = withLib("exam", IconClipboardCheckRaw);
export const IconRadio = withLib("radio", IconRadioRaw);
export const IconChart = withLib("chart", IconChartRaw);
export const IconLifebuoy = withLib("lifebuoy", IconLifebuoyRaw);
export const IconPalette = withLib("palette", IconPaletteRaw);
export const IconBell = withLib("bell", IconBellRaw);
export const IconWallet = withLib("wallet", IconWalletRaw);
export const IconDatabase = withLib("database", IconDatabaseRaw);
export const IconShield = withLib("shield", IconShieldRaw);
export const IconSearch = withLib("search", IconSearchRaw);
export const IconMenu = withLib("menu", IconMenuRaw);
export const IconClose = withLib("close", IconCloseRaw);
export const IconMoon = withLib("moon", IconMoonRaw);
export const IconSun = withLib("sun", IconSunRaw);
export const IconLogout = withLib("logout", IconLogoutRaw);
export const IconWrench = withLib("wrench", IconWrenchRaw);
export const IconPlay = withLib("play", IconPlayRaw);
export const IconCalendar = withLib("calendar", IconCalendarRaw);
export const IconClock = withLib("clock", IconClockRaw);
export const IconCheck = withLib("check", IconCheckRaw);
export const IconDownload = withLib("download", IconDownloadRaw);
export const IconLock = withLib("lock", IconLockRaw);
