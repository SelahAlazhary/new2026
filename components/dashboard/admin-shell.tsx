"use client";

/**
 * قشرةُ لوحة الإدارة — بناءٌ جديدٌ لا تحسينُ القديم.
 * ------------------------------------------------------------------
 * كانت اللوحةُ والطالبُ يتقاسمان قشرةً واحدة: عمودٌ عريضٌ (٢٥٦ بكسل) فيه
 * اثنان وعشرون رابطاً في مجموعاتٍ تُطوى، وشريطُ أدواتٍ فوقه. وهي تصلح
 * لبوّابة الطالب — سبعُ شاشاتٍ يُنتقل بينها قليلاً — ولا تصلح للوحةٍ يعمل
 * فيها الأستاذُ ساعاتٍ:
 *
 *   ــ العمودُ يأكل خُمسَ الشاشة دائماً، وأكثرُ ما فيه لا يُنظر إليه.
 *   ــ والمجموعاتُ تُطوى وتُفتح، فبلوغُ قسمٍ ضغطتان لا واحدة.
 *   ــ ولا يُعرف أين أنت من اللوحة: لا مسارَ يقول «المنهج ← الموادّ».
 *
 * **فصارت طبقتين**: شريطُ أيقوناتٍ ضيّقٌ فيه المجموعاتُ الأربع، ولوحٌ
 * بجانبه يعرض أقسامَ المجموعة المفتوحة وحدَها. فالمرئيُّ في كلّ لحظةٍ
 * أربعُ أيقوناتٍ وستّةُ أقسام، لا اثنان وعشرون.
 *
 * **والمجموعةُ تُفتح بالمرور لا بالضغط**: الضغطُ للانتقال، والمرورُ
 * للاستكشاف. ومن ضغط أيقونةً انتقل إلى أوّل أقسامها مباشرةً بدل أن
 * يُفتح له لوحٌ ثمّ يضغط ثانيةً.
 *
 * **ولا شيءَ من تنسيق القديم**: لا زجاجَ ولا ضبابَ ولا حوافَّ ٢٤ بكسلاً.
 * أسطحٌ مصمتة، وحدودٌ شعرة، وحوافُّ أهدأ. والألوانُ كما هي — كحليٌّ
 * وذهبيٌّ وورق — فالمطلوبُ بناءٌ جديدٌ لا هويّةٌ جديدة.
 */

import { useEffect, useMemo, useState, type ReactNode } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import {
  Menu, X, LogOut, ChevronLeft, Bell, Sun, Moon, PanelsTopLeft,
} from "lucide-react";
import { LibIcon, type IconSlot } from "@/components/brand/lib-icon";
import { useContent } from "@/components/content/content-provider";
import { groupNav, type NavItem } from "@/lib/business/dashboard-data";
import { navBadges } from "@/lib/business/admin-insights";
import { CommandPalette } from "@/components/dashboard/command-palette";
import { SaveStatus } from "@/components/dashboard/save-status";
import { ErrorWatch } from "@/components/dashboard/error-watch";
import { SectionTabs } from "@/components/dashboard/section-tabs";

const SLOTS: Record<string, IconSlot> = {
  LayoutDashboard: "grid", Users: "users", Layers: "layers", BookOpen: "book",
  KeyRound: "key", FileCheck2: "exam", Radio: "radio", BarChart3: "chart",
  LifeBuoy: "lifebuoy", Home: "home", Palette: "palette", Bell: "bell",
  Wallet: "wallet", Youtube: "video", ListVideo: "video", Database: "database",
  Shield: "shield", Star: "star", Wrench: "wrench",
};

export function AdminShell({
  nav, user, children,
}: {
  nav: NavItem[];
  user: { name: string; sub: string; avatar: string };
  children: ReactNode;
}) {
  const pathname = usePathname();
  const router = useRouter();
  const { db, content, viewLayout, toggleView, logout } = useContent();

  const badges = navBadges(db);
  const { solo, groups } = useMemo(() => groupNav(nav), [nav]);

  const isActive = (href: string) => (href === "/admin" ? pathname === href : pathname.startsWith(href));
  const activeGroup = groups.find((g) => g.items.some((i) => isActive(i.href)))?.id ?? null;

  /* اللوحُ يتبع المسار، ويُفتح بالمرور مؤقّتاً ثمّ يعود */
  const [peek, setPeek] = useState<string | null>(null);
  const shown = groups.find((g) => g.id === (peek ?? activeGroup)) ?? null;

  /* الجوّال: اللوحُ كلُّه يُفتح فوق الشاشة */
  const [open, setOpen] = useState(false);
  useEffect(() => { setOpen(false); setPeek(null); }, [pathname]);

  const here = nav.find((i) => isActive(i.href));
  const hereGroup = groups.find((g) => g.items.some((i) => i.href === here?.href));

  const notifs = db?.notifications ?? [];

  const doLogout = async () => { await logout(); router.push("/login"); };

  /* مجموعُ ما ينتظر عملاً في مجموعةٍ — يُعرض نقطةً على أيقونتها */
  const groupWaiting = (id: string) =>
    (groups.find((g) => g.id === id)?.items ?? []).reduce((n, i) => n + (badges[i.href] ?? 0), 0);

  /*
    `ad-root` على غلاف الصفحة في `app/admin/layout.tsx` لا هنا:
    هناك يقع الصنفُ فوق كلّ شيءٍ في اللوحة — بما فيه ما يُرسَم في نوافذَ
    منبثقة — فتنالها لغةُ الأسطح الجديدة. ولو كان هنا لتداخل جذران.
  */
  return (
    <>
      {/* ــــ الشريطُ الضيّق: المجموعات ــــ */}
      <aside className="ad-rail" onMouseLeave={() => setPeek(null)}>
        <Link href="/admin" className="ad-mark" title="نظرة عامة">
          <PanelsTopLeft className="size-5" />
        </Link>

        <nav className="ad-rail-nav">
          {solo.map((i) => (
            <Link
              key={i.href}
              href={i.href}
              title={i.label}
              onMouseEnter={() => setPeek(null)}
              className={`ad-rail-btn ${isActive(i.href) ? "is-on" : ""}`}
            >
              <LibIcon slot={SLOTS[i.icon] ?? "grid"} className="size-5" />
            </Link>
          ))}

          {groups.map((g) => {
            const waiting = groupWaiting(g.id);
            return (
              <button
                key={g.id}
                type="button"
                title={g.label}
                onMouseEnter={() => setPeek(g.id)}
                onClick={() => router.push(g.items[0].href)}
                className={`ad-rail-btn ${(peek ?? activeGroup) === g.id ? "is-on" : ""}`}
              >
                <LibIcon slot={SLOTS[g.icon] ?? "grid"} className="size-5" />
                {waiting > 0 && <span className="ad-dot" />}
              </button>
            );
          })}
        </nav>

        <button type="button" onClick={doLogout} title="خروج" className="ad-rail-btn ad-rail-out">
          <LogOut className="size-5" />
        </button>
      </aside>

      {/* ــــ لوحُ أقسام المجموعة ــــ */}
      <aside
        className={`ad-panel ${open ? "is-open" : ""}`}
        onMouseEnter={() => shown && setPeek(shown.id)}
        onMouseLeave={() => setPeek(null)}
      >
        <div className="ad-panel-head">
          <p className="ad-brand">{content.brand}</p>
          <p className="ad-brand-sub">لوحة الإدارة</p>
          <button type="button" onClick={() => setOpen(false)} className="ad-panel-x lg:hidden" aria-label="إغلاق">
            <X className="size-4" />
          </button>
        </div>

        <div className="ad-panel-body">
          {shown ? (
            <>
              <p className="ad-panel-title">{shown.label}</p>
              {shown.items.map((i) => (
                <Link key={i.href} href={i.href} className={`ad-link ${isActive(i.href) ? "is-on" : ""}`}>
                  <LibIcon slot={SLOTS[i.icon] ?? "grid"} className="size-4" />
                  <span className="ad-link-t">{i.label}</span>
                  {badges[i.href] ? <span className="ad-badge">{badges[i.href].toLocaleString("ar-EG")}</span> : null}
                </Link>
              ))}
            </>
          ) : (
            <p className="ad-panel-hint">مرِّر على أيقونةٍ لترى أقسامَها</p>
          )}
        </div>

        <div className="ad-user">
          <span className="ad-avatar">{user.avatar}</span>
          <span className="min-w-0 flex-1">
            <span className="ad-user-n">{user.name}</span>
            <span className="ad-user-s">{user.sub}</span>
          </span>
        </div>
      </aside>

      {open && <button className="ad-scrim lg:hidden" aria-label="إغلاق" onClick={() => setOpen(false)} />}

      {/* ــــ المتن ــــ */}
      <div className="ad-main">
        <header className="ad-top">
          <button type="button" onClick={() => setOpen(true)} className="ad-icon lg:hidden" aria-label="القائمة">
            <Menu className="size-5" />
          </button>

          {/* المسارُ يقول أين أنت — ولم يكن في اللوحة شيءٌ يقوله */}
          <nav className="ad-crumb" aria-label="المسار">
            <Link href="/admin" className="ad-crumb-l">اللوحة</Link>
            {hereGroup && (
              <>
                <ChevronLeft className="size-3 opacity-50" />
                <span className="ad-crumb-l">{hereGroup.label}</span>
              </>
            )}
            {here && (
              <>
                <ChevronLeft className="size-3 opacity-50" />
                <span className="ad-crumb-c">{here.label}</span>
              </>
            )}
          </nav>

          <div className="ad-top-actions">
            <SaveStatus />
            {/* الإخفاقُ الصامتُ يصير مسموعاً — انظر `ErrorWatch`. */}
            <ErrorWatch />
            <button
              type="button"
              onClick={() => window.dispatchEvent(new Event("open-command-palette"))}
              className="ad-search"
            >
              <LibIcon slot="search" className="size-4" />
              <span className="ad-search-t">بحث سريع</span>
              <kbd className="ad-kbd">Ctrl K</kbd>
            </button>
            {content.showThemeToggle && (
              <button type="button" onClick={toggleView} className="ad-icon" aria-label="تبديل المظهر">
                {viewLayout === "dark" ? <Sun className="size-4" /> : <Moon className="size-4" />}
              </button>
            )}
            <Link href="/admin/notifications" className="ad-icon relative" aria-label="الإشعارات">
              <Bell className="size-4" />
              {notifs.length > 0 && <span className="ad-dot" />}
            </Link>
          </div>
        </header>

        <main className="ad-scroll">
          <div className="ad-col">
            <SectionTabs>{children}</SectionTabs>
          </div>
        </main>
      </div>

      <CommandPalette role="admin" />
    </>
  );
}
