"use client";

/**
 * رمزُ المكتبة.
 * ------------------------------------------------------------------
 * مكوّنٌ واحد يرسم أيَّ خانةٍ بأيّ مكتبة. وهو مدخلُ كلّ رمزٍ في المنصّة:
 * تُبدَّل المكتبةُ من اللوحة فتتبدّل الرموزُ كلُّها معاً — لا في القائمة
 * الجانبية وحدها.
 *
 * **ومكتبةُ «المخطوط» تُردّ إلى مكوّناتها الأصلية** لا إلى مسارٍ عامّ:
 * أيقوناتُ الهوية مرسومةٌ بيدها ولها تفاصيلُ لا يحملها مسارٌ واحد، فلا
 * تُختصر في السجلّ. ومن اختارها لم يُغيَّر عنده شيء.
 */

import type { ReactElement } from "react";
import { useContent } from "@/components/content/content-provider";
import {
  findIconLib, slotPath, slotOverlay, libAttrs,
  type IconSlot, type IconLib,
} from "@/lib/icons/icon-libs";
import {
  IconHome, IconGrid, IconUsers, IconLayers, IconBook, IconKey, IconClipboardCheck,
  IconRadio, IconChart, IconLifebuoy, IconPalette, IconBell, IconWallet, IconYoutube,
  IconDatabase, IconShield, IconStar, IconSearch, IconMenu, IconClose, IconMoon, IconSun,
  IconLogout, IconWrench, IconPlay, IconCalendar, IconClock, IconCheck, IconDownload, IconLock,
  type IconProps,
} from "@/components/brand/icons";

/** رموزُ الهوية لكلّ خانة — مكتبةُ «المخطوط». */
const BRAND: Record<IconSlot, (p: IconProps) => ReactElement> = {
  home: IconHome, grid: IconGrid, users: IconUsers, layers: IconLayers,
  book: IconBook, key: IconKey, exam: IconClipboardCheck, radio: IconRadio,
  chart: IconChart, lifebuoy: IconLifebuoy, palette: IconPalette, bell: IconBell,
  wallet: IconWallet, video: IconYoutube, database: IconDatabase, shield: IconShield,
  star: IconStar, search: IconSearch, menu: IconMenu, close: IconClose,
  moon: IconMoon, sun: IconSun, logout: IconLogout, wrench: IconWrench,
  play: IconPlay, calendar: IconCalendar, clock: IconClock, check: IconCheck,
  download: IconDownload, lock: IconLock,
};

/** يرسم خانةً بمكتبةٍ معلومة — بلا سياق، للمعاينات. */
export function LibGlyph({
  lib,
  slot,
  className = "size-5",
}: {
  lib: IconLib;
  slot: IconSlot;
  className?: string;
}) {
  if (lib.geo === "brand") {
    const C = BRAND[slot];
    return <C className={className} />;
  }

  const a = libAttrs(lib);
  const over = slotOverlay(lib, slot);

  return (
    <svg viewBox="0 0 24 24" className={className} focusable="false" aria-hidden="true" {...a}>
      {/* المزدوجةُ: مساحةٌ خافتةٌ أوّلاً ثمّ خطٌّ صريحٌ فوقها */}
      <path d={slotPath(lib, slot)} opacity={over ? 0.22 : undefined} />
      {over && <path d={over} fill="none" stroke="currentColor" strokeWidth={lib.width} />}
    </svg>
  );
}

/** يرسم خانةً بالمكتبة المختارة في اللوحة. */
export function LibIcon({ slot, className = "size-5" }: { slot: IconSlot; className?: string }) {
  const { content } = useContent();
  return <LibGlyph lib={findIconLib(content.iconLib)} slot={slot} className={className} />;
}

/* يُصدَّر ليُستعمل في خرائط الأيقونات خارج هذا الملفّ. */
export type { IconSlot };
