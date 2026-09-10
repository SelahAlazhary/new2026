"use client";

/**
 * DashboardShell — هيكل موحّد للوحات التحكّم (أدمن/طالب).
 * • Sidebar ثابت على اليمين (RTL) لسطح المكتب + Drawer للموبايل.
 * • Topbar فيه بحث، إشعارات، تبديل الثيم، وبطاقة المستخدم.
 * • شريط تنقّل سفلي (Bottom nav) للموبايل في وضع الطالب.
 */

import { useEffect, useMemo, useState, type ReactNode } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { AnimatePresence, motion } from "framer-motion";
import { useRouter } from "next/navigation";
import type { ComponentType } from "react";
import type { IconProps } from "@/components/brand/icons";
import {
  IconGrid, IconUsers, IconLayers, IconBook, IconKey, IconClipboardCheck, IconRadio,
  IconChart, IconLifebuoy, IconHome, IconPalette, IconSearch, IconBell, IconMenu, IconClose,
  IconMoon, IconSun, IconLogout, IconWallet, IconYoutube, IconDatabase, IconShield, IconStar, IconWrench,
}  from "@/components/brand/icons";
import type { IconSlot } from "@/lib/icons/icon-libs";
import { LibIcon } from "@/components/brand/lib-icon";
import { BrandLockup } from "@/components/brand/logo";
import { GoldRule } from "@/components/dashboard/ui";
import { useContent } from "@/components/content/content-provider";
import { navBadges } from "@/lib/business/admin-insights";
import { CommandPalette } from "@/components/dashboard/command-palette";
import { SaveStatus } from "@/components/dashboard/save-status";
import { groupNav, type NavItem } from "@/lib/business/dashboard-data";
import { setPref } from "@/lib/auth/consent";

/** مفتاحُ حفظ المجموعات المفتوحة — يبقى بين الزيارات فلا يُعاد الطيُّ كلّ مرّة. */
const NAV_OPEN_KEY = "mk.adminNav.open";

type BrandIcon = ComponentType<IconProps>;

/** مفاتيح التنقّل → أيقونات الهوية المتّجهة. */
/**
 * أيقوناتُ القائمة تُرسم من المكتبة المختارة لا من مجموعةٍ ثابتة.
 * والخريطةُ هنا تربط اسمَ الأيقونة في `dashboard-data` بخانةِ المكتبة —
 * فتبديلُ المكتبة يبدّلها كلَّها معاً.
 */
const SLOTS: Record<string, IconSlot> = {
  LayoutDashboard: "grid",
  Users: "users",
  Layers: "layers",
  BookOpen: "book",
  KeyRound: "key",
  FileCheck2: "exam",
  Radio: "radio",
  BarChart3: "chart",
  LifeBuoy: "lifebuoy",
  Home: "home",
  Palette: "palette",
  Bell: "bell",
  Wallet: "wallet",
  Youtube: "video",
  ListVideo: "video",
  Database: "database",
  Shield: "shield",
  Star: "star",
  Wrench: "wrench",
};

export function DashboardShell({
  nav,
  role,
  user,
  children,
}: {
  nav: NavItem[];
  role: "admin" | "student";
  user: { name: string; sub: string; avatar: string };
  children: ReactNode;
}) {
  const pathname = usePathname();
  const router = useRouter();
  const { viewLayout, toggleView, logout, db, session, content } = useContent();
  /* عدّادات الأقسام — تُحسب مرّة وتُقرأ في القائمتين. */
  const badges = role === "admin" ? navBadges(db) : {};
  const [open, setOpen] = useState(false);
  // نقطة الإشعارات: للطالب = إشعارات غير مقروءة، للأدمن = وجود إشعارات
  const notifs = db?.notifications ?? [];
  const readIds = new Set(db?.users?.find((u) => u.id === session?.uid)?.readNotifications ?? []);
  /*
    جرسُ الأدمن لا يرنّ لرسائل الطلاب الخاصّة.
    ------------------------------------------------------------------
    إشعارُ «تم قبول تحويلك» يحمل `userId` طالبٍ بعينه — رسالةٌ إليه لا
    إلى المشرف. وكان جرسُ الأدمن يرنّ لأيّ إشعارٍ موجود (`length > 0`)،
    فيضيء لرسائلِ الطلاب الآليّة ويبدو أنّها مُوجَّهةٌ إليه. فيرنّ الآن
    لما ليس موجَّهاً لطالبٍ بعينه فقط — والطالبُ يرى رسالتَه في جرسه هو
    (حمولتُه مصفّاةٌ على الخادم أصلاً).
  */
  const adminBellItems = notifs.filter((n) => !n.userId);
  const hasNotif = role === "student"
    ? notifs.some((n) => !readIds.has(n.id))
    : adminBellItems.length > 0;

  const doLogout = async () => {
    await logout();
    const pp = window.location.pathname.split("/");
    const tp = pp[1] === "t" && pp[2] ? `/t/${pp[2]}` : "";
    router.push(tp + "/login");
  };

  const isActive = (href: string) =>
    href === `/${role}` ? pathname === href : pathname.startsWith(href);

  /*
    القائمةُ مجموعاتٌ تُطوى في وضع الأدمن.
    اثنان وعشرون رابطاً مسطّحاً كانت تُمسح كلُّها لبلوغ واحد، وأواخرُها
    تحت حافّة الشاشة لا تُرى إلّا بتمرير. والطالبُ سبعةٌ فيبقى مسطّحاً —
    التجميعُ في السبعة كلفةٌ بلا عائد.
  */
  const { solo, groups } = useMemo(
    () => (role === "admin" ? groupNav(nav) : { solo: nav, groups: [] }),
    [nav, role],
  );

  const activeGroup = groups.find((g) => g.items.some((i) => isActive(i.href)))?.id;

  /*
    موضعُ الصفحة في الشريط.
    ------------------------------------------------------------------
    كان الشريطُ ألفاً وخمسَ مئةِ بكسلٍ فيها ثلاثةُ أزرارٍ صغيرةٍ في
    الطرفين وفراغٌ بينها. وشريطٌ يشغل أعلى كلِّ شاشةٍ ولا يقول شيئاً
    ضريبةٌ تُدفع من ارتفاع الصفحة بلا مقابل.

    فيحمل ما يُغني عنه: أين أنت. والاسمُ يُؤخذ من القائمة نفسِها لا
    يُكتب ثانيةً — فما يُضاف إلى القائمة يظهر هنا بلا عمل.

    و**أطولُ مطابقةٍ** لا أوّلُها: `/student` تسبق `/student/subjects`
    في القائمة وكلتاهما تُطابق المسار، فأخذُ الأولى يقول «الرئيسية» على
    صفحة الكورسات.
  */
  const here = useMemo(() => {
    const hits = nav.filter((i) => isActive(i.href));
    return hits.sort((a2, b2) => b2.href.length - a2.href.length)[0];
    /* eslint-disable-next-line react-hooks/exhaustive-deps */
  }, [nav, pathname]);

  /*
    `null` تعني «لم يُقرأ المحفوظ بعد».
    وقراءةُ التخزين في مُهيّئ الحالة تُخرج على الخادم غيرَ ما تُخرج في
    المتصفّح فتشتكي React من اختلاف الترطيب. فالأولُ يُرسم بالمجموعة
    النشطة وحدَها — وهي تُحسب من المسار فتتّفق الجهتان — ثمّ يحلّ المحفوظُ
    محلّها بعد التركيب.
  */
  const [openIds, setOpenIds] = useState<string[] | null>(null);

  useEffect(() => {
    let saved: string[] | null = null;
    try {
      const raw = localStorage.getItem(NAV_OPEN_KEY);
      if (raw) saved = JSON.parse(raw) as string[];
    } catch {
      /* تخزينٌ محجوبٌ أو قيمةٌ تالفة — يُمضى بالافتراضيّ */
    }
    setOpenIds(saved ?? (activeGroup ? [activeGroup] : []));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  /* من انتقل إلى قسمٍ في مجموعةٍ مطويّة تُفتح له: وإلّا وقف في صفحةٍ لا
     يرى موضعَها في القائمة. */
  useEffect(() => {
    if (!activeGroup) return;
    setOpenIds((prev) =>
      prev === null || prev.includes(activeGroup) ? prev : [...prev, activeGroup],
    );
  }, [activeGroup]);

  const shown = openIds ?? (activeGroup ? [activeGroup] : []);
  const toggleGroup = (id: string) => {
    const next = shown.includes(id) ? shown.filter((x) => x !== id) : [...shown, id];
    try {
      setPref(NAV_OPEN_KEY, JSON.stringify(next));
    } catch {
      /* التخزينُ زينةٌ لا شرط — الطيُّ يعمل بدونه في هذه الجلسة */
    }
    setOpenIds(next);
  };

  const NavLink = ({
    item,
    onClick,
    nested,
  }: {
    item: NavItem;
    onClick?: () => void;
    nested?: boolean;
  }) => {
    const slot = SLOTS[item.icon] ?? "grid";
    const active = isActive(item.href);
    return (
      <Link
        href={item.href}
        onClick={onClick}
        className={`relative flex items-center gap-3 rounded-2xl py-2.5 text-sm font-semibold transition ${
          nested ? "ps-3.5 pe-7" : "px-3.5"
        } ${active ? "text-primary" : "text-muted-foreground hover:bg-muted hover:text-foreground"}`}
      >
        {active && (
          <motion.span
            layoutId={`side-${role}`}
            /* sn-mark: مقبض تُعيد أنماط التصميم تشكيله (شريط · لوح ·
               حزّ · توهّج · خطّ · نقطة · إطار) بلا تفريع في الشيفرة. */
            className="sn-mark absolute inset-0 rounded-2xl bg-[hsl(var(--gold)/0.16)] ring-1 ring-[hsl(var(--gold)/0.3)]"
            transition={{ type: "spring", stiffness: 380, damping: 32 }}
          />
        )}
        <span className="sn-icon relative z-10 shrink-0">
          <LibIcon slot={slot} className="size-5" />
        </span>
        <span className="sn-keep relative z-10">{item.label}</span>
        {/* الشارة تقول «هنا عملٌ ينتظر» — فلا تُوضع إلا حيث ينتظر عمل */}
        {badges[item.href] ? (
          <span className="sn-keep relative z-10 mr-auto grid min-w-5 place-items-center rounded-full bg-rose-500 px-1.5 text-[10px] font-extrabold text-white">
            {badges[item.href].toLocaleString("ar-EG")}
          </span>
        ) : null}
      </Link>
    );
  };

  const NavLinks = ({ onClick }: { onClick?: () => void }) => (
    <nav className="flex flex-col gap-1">
      {solo.map((item) => (
        <NavLink key={item.href} item={item} onClick={onClick} />
      ))}

      {groups.map((g) => {
        const isOpen = shown.includes(g.id);
        /*
          عدّادُ المجموعة مجموعُ عدّادات بناتها.
          والطيُّ يُخفي الروابط، فلو أُخفيت شارتُها معها لصار الطيُّ يكتم
          ما ينتظر عملاً — وهو نقضُ الغرض من الشارة. فتصعد إلى العنوان
          حين يُطوى، وتعود إلى موضعها حين يُفتح فلا تُعدّ مرّتين.
        */
        const count = g.items.reduce((n, i) => n + (badges[i.href] ?? 0), 0);
        return (
          <div key={g.id}>
            <button
              type="button"
              onClick={() => toggleGroup(g.id)}
              aria-expanded={isOpen}
              className={`flex w-full items-center gap-3 rounded-2xl px-3.5 py-2.5 text-sm font-bold transition ${
                isOpen
                  ? "text-foreground"
                  : "text-muted-foreground hover:bg-muted hover:text-foreground"
              }`}
            >
              <span className="sn-icon shrink-0">
                <LibIcon slot={SLOTS[g.icon] ?? "grid"} className="size-5" />
              </span>
              <span className="sn-keep">{g.label}</span>
              {!isOpen && count > 0 && (
                <span className="sn-keep grid min-w-5 place-items-center rounded-full bg-rose-500 px-1.5 text-[10px] font-extrabold text-white">
                  {count.toLocaleString("ar-EG")}
                </span>
              )}
              <span
                className={`sn-keep ms-auto text-[hsl(var(--gold))] transition-transform ${
                  isOpen ? "rotate-180" : ""
                }`}
              >
                <svg
                  viewBox="0 0 24 24"
                  className="size-4"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2.5"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  aria-hidden="true"
                >
                  <path d="M6 9l6 6 6-6" />
                </svg>
              </span>
            </button>

            <AnimatePresence initial={false}>
              {isOpen && (
                <motion.div
                  key="body"
                  initial={{ height: 0, opacity: 0 }}
                  animate={{ height: "auto", opacity: 1 }}
                  exit={{ height: 0, opacity: 0 }}
                  transition={{ duration: 0.24, ease: [0.22, 1, 0.36, 1] }}
                  /* القصُّ لازم: الارتفاعُ يتحرّك والمحتوى ثابتُ الطول،
                     فبدونه تفيض الروابطُ خارج الصندوق أثناء الطيّ. */
                  className="overflow-hidden"
                >
                  {/*
                    خطٌّ ذهبيٌّ على يمين البنات يربطها بعنوانها.
                    والإزاحةُ وحدَها لا تكفي في قائمةٍ طويلة: العينُ تفقد
                    أيَّ عنوانٍ تتبع بعد الرابط الثالث.
                  */}
                  <div className="me-4 flex flex-col gap-1 border-e border-[hsl(var(--gold)/0.35)] ps-1 pt-1">
                    {g.items.map((item) => (
                      <NavLink key={item.href} item={item} onClick={onClick} nested />
                    ))}
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        );
      })}
    </nav>
  );

  return (
    <div className="app-shell bg-background">
      {/* هالة خلفية خفيفة */}
      <div className="ambient-mesh pointer-events-none fixed inset-0 -z-10 opacity-30" />

      {/*
        القائمةُ الجانبية — لوحٌ عائمٌ لا عمودٌ ملتصقٌ بالحافّة.
        ------------------------------------------------------------
        كانت تمتدّ من أعلى الشاشة إلى أسفلها بحدٍّ يفصلها عن المتن —
        فتبدو جزءاً من إطار المتصفّح لا لوحاً في الصفحة. وصارت تطفو:
        هامشٌ يحيط بها من الجهات الأربع، وحوافُّ نصفُ دائريّة، وظلٌّ
        يرفعها عن السطح.

        وبيضاءُ مصمتةٌ لا شفّافة: الشفافيةُ تُظهر ما يمرّ تحتها عند
        التمرير فتضطرب حروفُها، والأبيضُ يفصلها عن ورق الصفحة الدافئ
        فتُقرأ حدودُها بلا خطٍّ يرسمها.

        و`inset-y-3` مع `h-auto`: الارتفاعُ يتبع الهامشَ فلا تلمس الحافّة.
      */}
      <aside className="app-sidebar">
        {/* تبليط كوفي خافت داخل لوح الحبر */}
        <div className="relative">
          <Brand role={role} />
          <div className="mt-4 text-accent/70"><GoldRule /></div>
        </div>
        <div className="relative"><NavLinks /></div>
        <div className="relative mt-auto">
          <UserCard user={user} onLogout={doLogout} />
        </div>
      </aside>

      {/* Drawer موبايل */}
      <AnimatePresence>
        {open && (
          <>
            <motion.div
              initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              onClick={() => setOpen(false)}
              className="fixed inset-0 z-40 bg-black/50 backdrop-blur-sm lg:hidden"
            />
            <motion.aside
              initial={{ x: "100%" }} animate={{ x: 0 }} exit={{ x: "100%" }}
              transition={{ type: "spring", stiffness: 320, damping: 34 }}
              className="fixed inset-y-0 right-0 z-50 flex w-[17.5rem] max-w-[85vw] flex-col gap-6 overflow-y-auto overscroll-contain border-l border-border bg-background p-5 pb-[max(1.25rem,env(safe-area-inset-bottom))] pt-[max(1.25rem,env(safe-area-inset-top))] lg:hidden"
            >
              <div className="flex items-center justify-between">
                <Brand role={role} />
                <button onClick={() => setOpen(false)} aria-label="إغلاق" className="grid size-9 place-items-center rounded-full border border-border">
                  <IconClose className="size-5" />
                </button>
              </div>
              <NavLinks onClick={() => setOpen(false)} />
              <div className="mt-auto"><UserCard user={user} onLogout={doLogout} /></div>
            </motion.aside>
          </>
        )}
      </AnimatePresence>

      {/* المحتوى */}
      {/* المتنُ يترك عرضَ اللوح وهامشَيه — وإلّا مرّ تحته */}
      <div className="app-body lg:pr-[17.5rem]">
        {/* Topbar */}
        <header className="app-topbar">
          <button onClick={() => setOpen(true)} aria-label="القائمة" className={`grid size-11 shrink-0 place-items-center rounded-full border border-border lg:hidden ${role === "student" ? "hidden" : ""}`}>
            <IconMenu className="size-5" />
          </button>

          {/* موبايل: الهوية · سطح المكتب: موضعُ الصفحة ثمّ بحثٌ سريع */}
          <span className="lg:hidden"><Brand role={role} /></span>

          {/*
            أين أنت — يملأ الفراغَ بما يُغني، لا بزخرفة.
            ويُخفى على الجوّال: الهويةُ هناك أولى بالمساحة الضيّقة.
          */}
          {here && (
            <span className="tb-here hidden lg:flex">
              <span className="tb-here-t">{here.label}</span>
            </span>
          )}
          {/*
            الصندوقُ يفتح لوحَ الأوامر ولا يكتب فيه.
            كان حقلاً حقيقيّاً بلا حالةٍ ولا معالج: يُكتب فيه ولا يبحث —
            وهذا أسوأُ من غيابه، فالواجهةُ تَعِد ولا تفي. وصار زرّاً يقول
            ما يفعل: يفتح البحثَ الذي يبلغ الأقسامَ والكورساتِ والطلابَ
            والخططَ في نتيجةٍ واحدة.
          */}
          <button
            type="button"
            onClick={() => window.dispatchEvent(new Event("open-command-palette"))}
            className="tb-search btn-foil hidden h-10 w-full max-w-sm flex-1 items-center gap-2.5 rounded-full border-0 px-4 text-right text-sm text-muted-foreground outline-none transition hover:text-foreground focus-visible:ring-2 focus-visible:ring-accent/40 sm:flex"
          >
            {/*
              الأيقونةُ في مجرى الصفّ لا مُطلَقةً فوقه.
              كانت `absolute` بحشوةٍ تُترك لها في الطرف — وهي هشّة: أيُّ
              تغييرٍ في الحشوة يُزيحها فوق النصّ أو يترك فراغاً. والصفُّ
              يضع كلَّ شيءٍ بقياسه ويتبع الاتجاهَ وحدَه.

              وارتفاعٌ مصرَّحٌ به (`h-10`) لا حشوةٌ رأسيّة: الزرُّ يجاور
              أزراراً دائريّةً بقياسٍ ثابت، والحشوةُ تجعل ارتفاعَه يتبع
              محتواه فيختلف عنها بضعةَ بكسلاتٍ تُرى.
            */}
            <LibIcon slot="search" className="size-4 shrink-0 opacity-70" />
            <span className="min-w-0 flex-1 truncate">بحث سريع…</span>
            {/*
              ولا اختصارَ للطالب: لوحةُ الأوامر تنفعه، وإظهارُ «Ctrl K»
              له زخرفةٌ لا يستعملها — وأكثرُ الطلاب على الجوّال أصلاً.
            */}
            {role === "admin" && (
              <kbd className="hidden shrink-0 whitespace-nowrap rounded-md border border-border px-1.5 py-0.5 font-sans text-[10px] leading-none opacity-70 lg:block">
                Ctrl K
              </kbd>
            )}
          </button>

          <div className="tb-actions mr-auto flex items-center gap-2">
            {/*
              حالةُ الحفظ — هادئةٌ في النجاح، ولوحُ الفشل يظهر أسفلَ الشاشة.
              وموضعُها هنا لأنّها تخصّ الشاشةَ كلَّها لا قسماً بعينه.
            */}
            <SaveStatus />
            {content.showThemeToggle && (
              <button onClick={toggleView} aria-label="تبديل المظهر" className="btn-foil grid size-11 place-items-center rounded-full text-muted-foreground transition hover:text-accent sm:size-10">
                {viewLayout === "dark" ? <LibIcon slot="sun" className="size-5" /> : <LibIcon slot="moon" className="size-5" />}
              </button>
            )}
            <Link href={role === "admin" ? "/admin/notifications" : "/student/notifications"} aria-label="الإشعارات" className="btn-foil relative grid size-11 place-items-center rounded-full text-muted-foreground transition hover:text-accent sm:size-10">
              <IconBell anim={hasNotif ? "swing" : undefined} className="size-5" />
              {hasNotif && <span className="absolute right-2 top-2 size-2 rounded-full bg-rose-500" />}
            </Link>
            {/*
              الحسابُ بطاقةٌ لا قرصٌ مجرَّد.
              ------------------------------------------------------------
              كان قرصاً فيه حرفٌ واحد. وحرفٌ في قرصٍ لا يقول لمن يفتح
              اللوحةَ على جهازٍ يشاركه غيرُه **بحساب مَن هو داخل** — وذلك
              يقع فعلاً: أخٌ يفتح على حساب أخيه فيرى دروساً ليست له.

              فيُكتب الاسمُ والصفةُ بجانبه حيث يتّسع، ويبقى القرصُ وحدَه
              على الضيّق — والحرفُ فيه مرساةٌ يعرفها صاحبُها بلمحة.
            */}
            <Link
              href={role === "admin" ? "/admin" : "/student/account"}
              className="tb-me"
              aria-label={`الحساب: ${user.name}`}
            >
              <span className="tb-me-a">{user.avatar}</span>
              <span className="tb-me-n">
                <span className="tb-me-t">{user.name}</span>
                <span className="tb-me-s">{user.sub}</span>
              </span>
            </Link>
          </div>
        </header>

        <main className="app-scroll p-4 pb-6 sm:p-6 lg:pb-8">{children}</main>
      </div>

      {/* لوحُ الأوامر — واحدٌ للوحة كلِّها، يُفتح بالمفتاح أو بالصندوق */}
      <CommandPalette role={role} />

      {/* شريط تبويبات عائم بأسلوب التطبيقات (الطالب · موبايل) */}
      {role === "student" && (
        <nav aria-label="التنقّل السريع" className="app-dock lg:hidden">
          <ul
            className="app-dock-inner no-select-app"
            style={{ gridTemplateColumns: `repeat(${nav.length}, minmax(0, 1fr))` }}
          >
            {nav.map((item) => {
              const slot = SLOTS[item.icon] ?? "home";
              const active = isActive(item.href);
              return (
                <li key={item.href} className="relative">
                  <Link
                    href={item.href}
                    aria-current={active ? "page" : undefined}
                    className={`app-tab ${active ? "text-primary" : "text-muted-foreground"}`}
                  >
                    {active && <span className="app-tab-pill" />}
                    <span className="relative z-10 grid size-7 place-items-center">
                      <LibIcon slot={slot} className="size-[1.2rem]" />
                    </span>
                    <span className="relative z-10 max-w-full truncate">{item.label}</span>
                  </Link>
                  {badges[item.href] ? (
                    <span className="absolute right-1 top-0 grid min-w-4 place-items-center rounded-full bg-rose-500 px-1 text-[11px] font-extrabold text-white">
                      {badges[item.href].toLocaleString("ar-EG")}
                    </span>
                  ) : null}
                </li>
              );
            })}
          </ul>
        </nav>
      )}

    </div>
  );
}

function Brand({ role }: { role: "admin" | "student" }) {
  const { content } = useContent();
  return (
    <Link href={role === "admin" ? "/admin" : "/student"} className="inline-flex">
      <BrandLockup
        brand={content.brand}
        subtitle={role === "admin" ? "الدِّيوان — لوحة الإدارة" : "بوابة الطالب"}
        logo={content.teacher.logo}
        size={40}
      />
    </Link>
  );
}

function UserCard({ user, onLogout }: { user: { name: string; sub: string; avatar: string }; onLogout: () => void }) {
  return (
    <div className="flex items-center gap-3 rounded-2xl border border-border bg-card/50 p-3">
      <span className="grid size-10 place-items-center rounded-full btn-glow text-sm font-bold text-white">{user.avatar}</span>
      <div className="min-w-0 flex-1 leading-tight">
        <p className="truncate text-sm font-bold">{user.name}</p>
        <p className="truncate text-[11px] text-muted-foreground">{user.sub}</p>
      </div>
      <button onClick={onLogout} aria-label="خروج" className="grid size-8 place-items-center rounded-full text-muted-foreground transition hover:text-rose-500">
        <LibIcon slot="logout" className="size-4" />
      </button>
    </div>
  );
}
