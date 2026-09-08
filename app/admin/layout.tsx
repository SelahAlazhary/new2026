import type { ReactNode } from "react";
import { redirect } from "next/navigation";
import { headers } from "next/headers";
import { AdminShell } from "@/components/dashboard/admin-shell";
import { adminNav } from "@/lib/business/dashboard-data";
import { getSession } from "@/lib/auth/session";
import { loadDB, getDB } from "@/lib/db/db";
import { can, isOwner, permForPath } from "@/lib/auth/perms";
import { currentTenant } from "@/lib/hub/context";
import { sectionForAdminPath, sectionHidden } from "@/lib/hub/sections";
import { deviceMatches } from "@/lib/auth/device-guard";
import { getImpersonation } from "@/lib/hub/impersonate";
import { ImpersonateBanner } from "@/components/hub/impersonate-banner";
import { findToolbar, toolbarClass, stickClass } from "@/lib/styles/toolbar-styles";
import { findIconFrame, iconFrameClass, iconFrameVars } from "@/lib/icons/icon-frames";
import { findIconMotion, iconMotionClass } from "@/lib/icons/icon-motion";
import { findIconCover, iconCoverClass } from "@/lib/icons/icon-covers";
import { sideNavClassIfPicked, navSideClass } from "@/lib/styles/nav-styles";

export const dynamic = "force-dynamic";
export const metadata = { title: "لوحة الإدارة", robots: { index: false } };

export default async function AdminLayout({ children }: { children: ReactNode }) {
  const session = await getSession();
  if (!session || session.role !== "admin") redirect("/login?next=/admin");

  await loadDB();
  const me = getDB().users.find((u) => u.id === session.uid);
  if (!me || me.role !== "admin" || !me.active) redirect("/login?next=/admin");
  /* والجهازُ يُفحص في كلّ طلب — انظر `deviceMatches`. */
  if (!(await deviceMatches(me))) redirect("/login?device=1");

  /*
    القائمة تعرض ما يملكه هذا المشرف **وما لم يُخفَ عن منصّته**.
    والفرقُ بينهما مقصود: الصلاحيةُ تُمنح من داخل المنصّة (المالكُ يوزّعها
    على مشرفيه)، والإخفاءُ يأتي من فوقها (خطّةُ الاشتراك). فقد يملك
    المالكُ «كلَّ شيء» ولا يرى قسماً أُخفي عن منصّته كلِّها.
  */
  const { tenant } = currentTenant();
  const shown = (href: string) => {
    const perm = permForPath(href);
    if (perm !== null && !can(me, perm)) return false;
    const section = sectionForAdminPath(href);
    return !(section && sectionHidden(tenant, section));
  };
  const nav = adminNav.filter((item) => shown(item.href));

  /**
   * حماية الصفحة نفسها: إخفاء الرابط لا يكفي — من يكتب المسار يدوياً
   * يُعاد إلى «نظرة عامة». المسار يصل من الوسيط في ترويسة x-pathname.
   */
  const path = (await headers()).get("x-pathname") ?? "";
  const needed = path ? permForPath(path) : null;
  if (needed && !can(me, needed)) redirect("/admin?denied=1");
  const hiddenHere = path && path !== "/admin" ? sectionForAdminPath(path) : null;
  if (hiddenHere && sectionHidden(tenant, hiddenHere)) redirect("/admin?hidden=1");

  /* المنصّةُ الموقوفة: لوحتُها تُقرأ ولا تُكتب — ولافتةٌ تقول السبب لا تُخفيه. */
  const paused = tenant.status === "suspended" || tenant.status === "expired";
  const imp = await getImpersonation();

  /*
    شريط الأدوات: لوحة الإدارة كانت الشاشةَ الوحيدة التي لا تحمل أصنافه،
    فمن يختار التصميم من هنا لا يرى شريطَه هو يتغيّر أبداً.
  */
  const bar = findToolbar(getDB().content.toolbarStyle);

  return (
    // admin-skin: هوية بصرية خاصة بلوحة الإدارة (تصميم فقط — لا يمسّ الموقع أو بوابة الطالب)
    <div style={iconFrameVars(getDB().content.iconFrameColors)} className={`admin-skin ${sideNavClassIfPicked(getDB().content.adminSideNav)} ${navSideClass(getDB().content.adminNavSide, "admin")} ad-root ${iconFrameClass(findIconFrame(getDB().content.iconFrame))} ${iconCoverClass(findIconCover(getDB().content.iconCover))} ${iconMotionClass(findIconMotion(getDB().content.iconMotion))} ${toolbarClass(bar)} ${stickClass(getDB().content.toolbarStick)} ${getDB().content.toolbarHidden ? "tools-hidden" : ""}`} data-toolbar={bar.id}>
      {/*
        قشرةُ اللوحة بناءٌ مستقلٌّ عن قشرة الطالب.
        كانتا واحدةً — عمودٌ عريضٌ فيه اثنان وعشرون رابطاً — وهي تصلح
        لسبع شاشاتٍ يُنتقل بينها قليلاً، ولا تصلح للوحةٍ يُعمل فيها ساعات.
        وتبويبُ الأقسام داخلَها، فلا يُلفّ هنا مرّةً أخرى.
      */}
      <AdminShell
        nav={nav}
        user={{
          name: session.name,
          sub: isOwner(me) ? "مالك المنصّة" : "مشرف",
          avatar: session.name.charAt(0),
        }}
      >
        {imp && <ImpersonateBanner superName={imp.superName} tenantSlug={imp.tenantSlug} />}
        {paused && (
          <div
            role="status"
            className="mb-4 flex flex-wrap items-center gap-2 rounded-2xl border border-amber-500/35 bg-amber-500/10 px-4 py-3 text-[13px] text-amber-800"
          >
            <span aria-hidden="true">⏸</span>
            <b className="font-kufi">
              {tenant.status === "expired" ? "انتهى اشتراك المنصّة" : "المنصّة موقوفة مؤقّتاً"}
            </b>
            <span className="opacity-80">
              {tenant.suspendReason || "لوحتك للقراءة فقط الآن، وبياناتك كلّها محفوظة."} — الطلاب يرون صفحة توقّف.
            </span>
          </div>
        )}
        {children}
      </AdminShell>
    </div>
  );
}
