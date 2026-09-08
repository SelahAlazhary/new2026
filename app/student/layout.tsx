import type { ReactNode } from "react";
import { redirect } from "next/navigation";
import { DashboardShell } from "@/components/dashboard/shell";
import { studentNav } from "@/lib/business/dashboard-data";
import { getSession } from "@/lib/auth/session";
import { getPublicDB, loadDB, sessionUser } from "@/lib/db/db";
import { deviceMatches } from "@/lib/auth/device-guard";
import { findSkin, findLayout, findMobile, mobileClass, skinCss } from "@/lib/brand/skins";
import { SkinOrnament } from "@/components/brand/skin-ornaments";
import { findDesign } from "@/lib/brand/designs";
import { findTile, tileClass, tileColorVars, tileArtVars, tileArtClass } from "@/lib/styles/tile-styles";
import { findToolbar, toolbarClass, stickClass } from "@/lib/styles/toolbar-styles";
import { findMotion, motionClass, motionVars } from "@/lib/styles/motion-styles";
import { ActivityTracker } from "@/components/student/activity-tracker";
import { CaptureGuard } from "@/components/student/capture-guard";
import { PageWatermark } from "@/components/student/page-watermark";
import { findSideNav, sideNavClass, navSideClass, findDock, dockClass, navColorVars, DEFAULT_ICON_SET } from "@/lib/styles/nav-styles";
import { findIconFrame, iconFrameClass, iconFrameVars } from "@/lib/icons/icon-frames";
import { findIconMotion, iconMotionClass } from "@/lib/icons/icon-motion";
import { findIconCover, iconCoverClass } from "@/lib/icons/icon-covers";
import { designVars } from "@/lib/brand/designs";
import { findPanelStyle, panelStyleClass } from "@/lib/styles/panel-styles";

export const dynamic = "force-dynamic";
export const metadata = { title: "بوابة الطالب", robots: { index: false } };

export default async function StudentLayout({ children }: { children: ReactNode }) {
  const session = await getSession();
  if (!session || session.role !== "student") redirect("/login?next=/student");

  /* الجلسة رمز موقّع لا يُبطله حذف الحساب من اللوحة، فنتحقّق من الحساب
     نفسه عند كل تحميل: المحذوف أو الموقوف يُعاد إلى صفحة الدخول فوراً. */
  await loadDB();
  if (!sessionUser(session)) redirect("/login?gone=1");

  /*
    والجهازُ يُفحص هنا لا في شاشة الدخول وحدَها — انظر `deviceMatches`.
    من نسخ كوكي الجلسة إلى جهازٍ آخر يُردّ إلى الدخول، ورمزُه لا ينفعه.
  */
  if (!(await deviceMatches(sessionUser(session)))) redirect("/login?device=1");

  const pub = getPublicDB();
  const me = pub.users.find((u) => u.id === session.uid);

  /* المظهر يُحقن كمتغيّرات CSS على غلاف واحد: ثيم واحد فقط يصل
     المتصفّح بدل عشرين كتلة أنماط لا يُعرض منها إلا واحدة. */
  const skin = findSkin(pub.content?.studentSkin);
  const layout = findLayout(pub.content?.studentLayout);
  const mobile = findMobile(pub.content?.studentMobile);
  const design = findDesign(pub.content?.studentDesign);
  const side = findSideNav(pub.content?.sideNav);
  const dock = findDock(pub.content?.dockStyle);
  const icons = pub.content?.navIcons ?? DEFAULT_ICON_SET;
  const tile = findTile(pub.content?.tileStyle);
  const tileArt = pub.content?.tileArt;
  const bar = findToolbar(pub.content?.toolbarStyle);

  return (
    <>
      {/* نسختا الثيم — الفاتحة أساساً والداكنة عند اختيار الزائر الداكن.
          كتلة واحدة للثيم المختار فقط، فلا تُحمَّل عشرون كتلة لا تُعرض. */}
      <style dangerouslySetInnerHTML={{ __html: skinCss(skin) }} />

    {/* مراسل النشاط — بوابة الطالب وحدها، فنشاط المشرف ليس تقريراً */}
    <ActivityTracker />
    {/*
      حارسُ الالتقاط — على البوّابة كلِّها لا على صفحتَي الكورس وحدهما.
      ------------------------------------------------------------------
      كان مركَّباً في `/student/course/…` فقط. والمحتوى الذي يُحمى ليس
      الفيديو وحدَه: أسئلةُ الواجبات ونصوصُها وأسماءُ الطلاب في لوح
      الحساب كلُّها تُصوَّر وتُنشر. ومن خرج من صفحة الدرس خرج من الحماية
      وهو ما يزال داخل البوّابة.

      ولا يُغني عن العلامة المائيّة ولا تُغني عنه: هذا يرفع كلفةَ النسخ،
      وتلك تدلّ على الناسخ. والمنعُ التامُّ مستحيلٌ — انظر توثيق
      `CaptureGuard`.
    */}
    <CaptureGuard enabled={Boolean(pub.content?.blockCapture)} />
    {/*
      واسمُ الطالب على البوّابة كلِّها لا على الفيديو وحدَه: أسئلةُ
      الواجبات تُصوَّر وتُنشر أكثرَ ممّا يُصوَّر المقطع — لقطةٌ واحدةٌ
      تكفي لنقل الامتحان كلِّه إلى مجموعةٍ فيها مئة طالب.
    */}
    {pub.content?.blockCapture && <PageWatermark name={me?.name} tag={me?.id} />}
    <div
      className={`student-skin relative min-h-full ${mobileClass(mobile)} ${sideNavClass(side)} ${navSideClass(pub.content?.navSide, "student")} ${dockClass(dock)} ic-${icons} ${iconFrameClass(findIconFrame(pub.content?.iconFrame))} dsg ${panelStyleClass(findPanelStyle(pub.content?.studentPanel))} ${iconCoverClass(findIconCover(pub.content?.iconCover))} ${iconMotionClass(findIconMotion(pub.content?.iconMotion))} ${tileClass(tile)} ${tileArtClass(tileArt)} ${toolbarClass(bar)} ${stickClass(pub.content?.toolbarStick)} ${motionClass(findMotion(pub.content?.motionStyle))} ${pub.content?.toolbarHidden ? "tools-hidden" : ""}`}
      style={{ ...navColorVars(pub.content?.navColors), ...tileColorVars(pub.content?.tileColors), ...tileArtVars(tileArt), ...motionVars(findMotion(pub.content?.motionStyle)), ...iconFrameVars(pub.content?.iconFrameColors), ...designVars(pub.content?.designColors) }}
      data-skin={skin.id}
      data-layout={layout.id}
      data-card={skin.card}
      data-mobile={mobile.id}
      data-design={design.id}
      data-sidenav={side.id}
      data-dock={dock.id}
      data-tile={tile.id}
      data-toolbar={bar.id}
    >
      <SkinOrnament id={skin.ornament} />
      <DashboardShell
        nav={studentNav}
        role="student"
        user={{ name: session.name, sub: me?.grade ?? "طالب", avatar: session.name.charAt(0) }}
      >
        {children}
      </DashboardShell>
    </div>
    </>
  );
}
