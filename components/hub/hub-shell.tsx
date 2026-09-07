"use client";

/**
 * قشرةُ لوحة المنصّات.
 * ------------------------------------------------------------------
 * تُعيد استعمال لغةَ أسطح لوحة الإدارة نفسِها (`admin-skin` و`ad-*` في
 * `globals.css`) — فلا ورقةُ أنماطٍ ثانيةٌ تُكتب ولا هويّةٌ ثالثةٌ تُخترع.
 * والفرقُ الوحيدُ المقصود: **شريطٌ علويٌّ يقول أين أنت** — «لوحة
 * المنصّات» لا «لوحة الإدارة» — كي لا يلتبس على من يفتح الاثنتين معاً
 * في تبويبين أيُّهما يعدّل الآن.
 *
 * ولا مجموعاتٍ تُطوى هنا: خمسةُ أقسامٍ لا اثنان وعشرون، فالشريطُ الضيّق
 * وحدَه يكفي ولا يحتاج لوحاً بجانبه.
 */

import { useState, type ReactNode } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { LayoutDashboard, Layers, Inbox, Receipt, ScrollText, Settings, LogOut, Menu, X, CreditCard } from "lucide-react";

const NAV = [
  { href: "/hub", label: "نظرة عامة", Icon: LayoutDashboard },
  { href: "/hub/tenants", label: "المنصّات", Icon: Layers },
  { href: "/hub/requests", label: "الطلبات", Icon: Inbox },
  { href: "/hub/plans", label: "الخطط", Icon: CreditCard },
  { href: "/hub/billing", label: "الفواتير", Icon: Receipt },
  { href: "/hub/audit", label: "سجلّ التدقيق", Icon: ScrollText },
  { href: "/hub/settings", label: "الإعدادات", Icon: Settings },
];

export function HubShell({
  user,
  waiting = 0,
  children,
}: {
  user: { name: string; email: string };
  /** عددُ ما ينتظر قراراً — نقطةٌ على «الطلبات». */
  waiting?: number;
  children: ReactNode;
}) {
  const pathname = usePathname();
  const router = useRouter();
  const [open, setOpen] = useState(false);

  const isActive = (href: string) => (href === "/hub" ? pathname === href : pathname.startsWith(href));
  const here = NAV.filter((n) => isActive(n.href)).sort((a, b) => b.href.length - a.href.length)[0];

  const logout = async () => {
    await fetch("/api/hub/auth/logout", { method: "POST" });
    router.push("/hub/login");
    router.refresh();
  };

  return (
    <>
      <aside className="ad-rail">
        <Link href="/hub" className="ad-mark" title="لوحة المنصّات">
          <Layers className="size-5" />
        </Link>
        <nav className="ad-rail-nav">
          {NAV.map(({ href, label, Icon }) => (
            <Link key={href} href={href} title={label} className={`ad-rail-btn ${isActive(href) ? "is-on" : ""}`}>
              <Icon className="size-5" />
              {href === "/hub/requests" && waiting > 0 && <span className="ad-dot" />}
            </Link>
          ))}
        </nav>
        <button type="button" onClick={logout} title="خروج" className="ad-rail-btn ad-rail-out">
          <LogOut className="size-5" />
        </button>
      </aside>

      {/* الجوّال: القائمةُ نفسُها تُفتح فوق الشاشة */}
      {open && <div className="ad-scrim" onClick={() => setOpen(false)} />}
      <aside className={`ad-panel ${open ? "is-open" : ""}`}>
        <div className="ad-panel-head">
          <p className="ad-brand">لوحة المنصّات</p>
          <p className="ad-brand-sub">إدارة كل المنصّات</p>
          <button type="button" className="ad-panel-x" onClick={() => setOpen(false)} aria-label="إغلاق">
            <X className="size-4" />
          </button>
        </div>
        <div className="ad-panel-body">
          {NAV.map(({ href, label, Icon }) => (
            <Link key={href} href={href} onClick={() => setOpen(false)} className={`ad-link ${isActive(href) ? "is-on" : ""}`}>
              <Icon className="size-4" />
              <span className="ad-link-t">{label}</span>
              {href === "/hub/requests" && waiting > 0 && <span className="ad-badge">{waiting}</span>}
            </Link>
          ))}
        </div>
        <div className="ad-user">
          <span className="ad-avatar">{user.name.charAt(0)}</span>
          <span className="min-w-0">
            <b className="ad-user-n">{user.name}</b>
            <span className="ad-user-s">{user.email}</span>
          </span>
        </div>
      </aside>

      <div className="ad-main">
        <header className="ad-top">
          <button type="button" className="ad-icon lg:hidden" onClick={() => setOpen(true)} aria-label="القائمة">
            <Menu className="size-4" />
          </button>
          <div className="ad-crumb">
            <span className="ad-crumb-l">لوحة المنصّات ←</span>
            <b className="ad-crumb-c">{here?.label ?? "نظرة عامة"}</b>
          </div>
          <div className="ad-top-actions">
            <span className="font-kufi hidden text-[11px] text-muted-foreground sm:block">{user.email}</span>
          </div>
        </header>
        <main className="ad-scroll">
          <div className="ad-col">{children}</div>
        </main>
      </div>
    </>
  );
}
