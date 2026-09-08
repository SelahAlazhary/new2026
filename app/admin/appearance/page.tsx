"use client";

/**
 * مظهر بوابة الطالب — اختيار الثيم والتخطيط.
 * ------------------------------------------------------------------
 * كل بطاقة معاينة مرسومة SVG بألوان الثيم نفسه وزخرفته، فما يراه
 * الأدمن هنا هو ما سيراه الطالب فعلاً — لا مربّعات ألوان مجرّدة.
 * الاختيار يُحفظ فوراً ويسري على كل الطلاب.
 */
import { AzHeadPanel } from "@/components/admin/az-head-panel";
import { useState } from "react";
import { Check, Loader2, Palette, LayoutGrid, Home, Smartphone, Shapes, RotateCcw, PanelRight, Menu, LayoutPanelTop, PanelTop, Wallet, Sparkles, ImagePlus, LayoutList, MessageCircleQuestion, Megaphone, PanelBottom } from "lucide-react";
import { PageHeader, Card } from "@/components/dashboard/ui";
import { useContent } from "@/components/content/content-provider";
import {
  STUDENT_SKINS, STUDENT_LAYOUTS, MOBILE_LAYOUTS, findSkin, findLayout, findMobile,
  DEFAULT_SKIN, DEFAULT_LAYOUT, DEFAULT_MOBILE,
  type StudentSkin, type StudentLayout, type MobileLayout,
} from "@/lib/brand/skins";
import {
  SkinPreview, LayoutPreview, HomeLayoutPreview, MobilePreview, DesignPreview,
  SideNavPreview, DockPreview, FramePreview, TilePreview, ToolbarPreview, PlansPreview,
  HeroStylePreview, HeroShellPreview, IconFramePreview, SectionPreview, FaqPreview, CtaPreview, FooterPreview, MobileHomePreview, MotionPreview, ButtonPreview,
} from "@/components/admin/skin-preview";
import { HERO_STYLES, findHeroStyle, DEFAULT_HERO_STYLE, type HeroStyle } from "@/lib/styles/hero-styles";
import { HERO_SHELLS, findHeroShell, DEFAULT_HERO_SHELL, type HeroShell, type HeroShellOpts } from "@/lib/layout/hero-shell";
import { ICON_FRAMES, findIconFrame, DEFAULT_ICON_FRAME, type IconFrame } from "@/lib/icons/icon-frames";
import { ICON_MOTIONS, findIconMotion, DEFAULT_ICON_MOTION, type IconMotion } from "@/lib/icons/icon-motion";
import { ICON_COVERS, findIconCover, DEFAULT_ICON_COVER, type IconCover } from "@/lib/icons/icon-covers";
import { ICON_LIBS, findIconLib, DEFAULT_ICON_LIB, ICON_SLOTS, type IconLib } from "@/lib/icons/icon-libs";
import { VECTOR_LIBS, findVectorLib, vectorLibClass, type VectorLib } from "@/lib/art/vector-libs";
import { ShariVector, SHARI_VECTOR } from "@/components/brand/shari-vector";
import { AMBIENTS, AMBIENT_SPEEDS, findAmbient, DEFAULT_AMBIENT } from "@/lib/art/ambient-motion";
import { SHADOW_STYLES, findShadow, DEFAULT_SHADOW } from "@/lib/styles/shadow-styles";
import { TINT_MODES, artFilter } from "@/lib/art/art-tint";
import { ART_DEPTHS, depthFilter, depthLit } from "@/lib/art/art-depth";
import { PANEL_STYLES, DEFAULT_PANEL_STYLE } from "@/lib/styles/panel-styles";
import { StatsPlacement } from "@/components/admin/stats-placement";
import { SHARI_ANIM } from "@/components/brand/shari-art";
import { LibGlyph } from "@/components/brand/lib-icon";
import {
  SECTION_STYLES, findSectionStyle, DEFAULT_SECTION_STYLE, SX_SECTIONS,
  type SectionStyle, type SxSectionKey,
} from "@/lib/styles/section-styles";
import {
  FAQ_STYLES, findFaqStyle, DEFAULT_FAQ_STYLE,
  CTA_STYLES, findCtaStyle, DEFAULT_CTA_STYLE,
  FOOTER_STYLES, findFooterStyle, DEFAULT_FOOTER_STYLE,
  type FaqStyle, type CtaStyle, type FooterStyle,
} from "@/lib/styles/block-styles";
import { MOBILE_HOMES, findMobileHome, DEFAULT_MOBILE_HOME, type MobileHome } from "@/lib/layout/mobile-home";
import { MOTION_STYLES, findMotion, DEFAULT_MOTION, type MotionStyle } from "@/lib/styles/motion-styles";
import { BUTTON_STYLES, findButtonStyle, DEFAULT_BUTTON_STYLE, type ButtonStyle } from "@/lib/styles/button-styles";
import { GlowEditor } from "@/components/admin/glow-editor";
import type { GlowRule } from "@/lib/brand/glow";
import { PLANS_STYLES, findPlansStyle, DEFAULT_PLANS_STYLE, type PlansStyle } from "@/lib/styles/plans-styles";
import { TOOLBAR_STYLES, findToolbar, DEFAULT_TOOLBAR, BAR_STICKS, type ToolbarStyle } from "@/lib/styles/toolbar-styles";
import {
  TILE_STYLES, findTile, DEFAULT_TILE, TILE_ART_MODES, DEFAULT_TILE_ART,
  type TileStyle, type TileArt, type TileArtMode,
} from "@/lib/styles/tile-styles";
import { DEFAULT_FRAME } from "@/lib/art/frame-shapes";
import {
  SIDE_NAV_STYLES, DOCK_STYLES, findSideNav, findDock,
  DEFAULT_SIDE_NAV, DEFAULT_DOCK, ICON_SETS, DEFAULT_ICON_SET,
  type SideNavStyle, type DockStyle,
} from "@/lib/styles/nav-styles";
import { STUDENT_DESIGNS, findDesign, DEFAULT_DESIGN, type StudentDesign } from "@/lib/brand/designs";
import { HOME_LAYOUTS, findHomeLayout, DEFAULT_HOME_LAYOUT, type HomeLayout } from "@/lib/layout/home-layouts";
import { Section } from "@/components/dashboard/section";
import { BRAND_PRESETS } from "@/lib/hub/presets";
import { IdentityPresets } from "@/components/admin/identity-presets";

/** ألوان جاهزة تُستخدم في أكثر من منتقٍ. */
const SWATCH = ["#233b8b", "#095e86", "#245c4b", "#87263a", "#8a6212", "#4a3570", "#1f5a5e", "#2b3140"];

const SHELL_SWATCH = ["#173972", "#0f172a", "#1e293b", "#c9a227", "#7c3aed", "#0ea5e9", "#f8fafc", "#ffffff"];

type Tab = "identity" | "skin" | "design" | "tiles" | "layout" | "side" | "bar" | "dock" | "mobile" | "home" | "plans" | "hero" | "sections" | "faq" | "cta" | "footer" | "navbar" | "mhome" | "motion" | "buttons" | "glow" | "shell" | "icons";


/** اختيار تثبيت الشريط — إعدادٌ لا هيئة، فله صفُّه الخاصّ. */
function StickPicker({
  value, onPick, label,
}: {
  value?: string; onPick: (v: string) => void; label: string;
}) {
  return (
    <Card className="mb-5">
      <p className="font-display mb-1 font-bold">{label}</p>
      <p className="mb-3 text-[11px] leading-relaxed text-muted-foreground">
        سلوك الشريط عند التمرير — مستقلّ عن شكله، فأيّ تصميم يقبل أيّ سلوك.
      </p>
      <div className="flex flex-wrap gap-2">
        {BAR_STICKS.map((x) => {
          const on = (value || "float") === x.id;
          return (
            <button
              key={x.id}
              type="button"
              onClick={() => onPick(x.id)}
              title={x.hint}
              className={`rounded-2xl border px-4 py-2.5 text-xs font-bold transition ${
                on ? "border-primary bg-primary/10 text-primary" : "border-border text-muted-foreground hover:border-primary/40"
              }`}
            >
              {x.label}
              <span className="ms-2 text-[10px] font-semibold opacity-70">{x.hint}</span>
            </button>
          );
        })}
      </div>
    </Card>
  );
}


/** مفتاحٌ بسيط — يُعاد استعماله في مواضع الإظهار والإخفاء. */
function Switch({
  label, hint, on, onChange,
}: {
  label: string; hint?: string; on: boolean; onChange: (v: boolean) => void;
}) {
  return (
    <button
      type="button"
      onClick={() => onChange(!on)}
      className="flex w-full items-center gap-3 rounded-2xl border border-border px-4 py-3 text-right transition hover:border-primary/40"
    >
      <span className={`relative h-5 w-9 shrink-0 rounded-full transition ${on ? "bg-primary" : "bg-muted"}`}>
        <span className={`absolute top-0.5 size-4 rounded-full bg-white transition-all ${on ? "left-0.5" : "right-0.5"}`} />
      </span>
      <span className="min-w-0">
        <span className="block text-xs font-bold">{label}</span>
        {hint && <span className="block text-[10px] text-muted-foreground">{hint}</span>}
      </span>
    </button>
  );
}

export default function AppearancePage() {
  const { content, saveContent, uploadImage } = useContent();
  const [tab, setTab] = useState<Tab>("skin");
  const [busy, setBusy] = useState<string | null>(null);

  const skin = findSkin(content.studentSkin);
  const layout = findLayout(content.studentLayout);
  const home = findHomeLayout(content.homeLayout);
  const mobile = findMobile(content.studentMobile);
  const design = findDesign(content.studentDesign);
  const tile = findTile(content.tileStyle);
  const bar = findToolbar(content.toolbarStyle);
  /* شريط الواجهة مستقلّ؛ وفارغاً يتبع شريط اللوحة كما كان. */
  const navBar = findToolbar(content.navbarStyle || content.toolbarStyle);
  const mHome = findMobileHome(content.mobileHome);
  const motion = findMotion(content.motionStyle);
  const btnStyle = findButtonStyle(content.buttonStyle);
  const shell = findHeroShell(content.heroShell);
  const shOpts: HeroShellOpts = content.heroShellOpts ?? {};
  const iconFrame = findIconFrame(content.iconFrame);
  const iconMotion = findIconMotion(content.iconMotion);
  const iconCover = findIconCover(content.iconCover);
  const iconLib = findIconLib(content.iconLib);
  const vecLib = findVectorLib(content.vectorLib);
  const icColors = content.iconFrameColors ?? {};
  const glow = (content.glow ?? []) as GlowRule[];
  const plansStyle = findPlansStyle(content.plansStyle);
  const heroStyle = findHeroStyle(content.heroStyle);
  /* كل قسم بطاقات يحمل اختياره بمفتاحه — فلا يُجبَر قسمٌ على شكل جاره. */
  const [sxKey, setSxKey] = useState<SxSectionKey>("stagesStyle");
  const sxStyle = findSectionStyle(content[sxKey]);
  const faqStyle = findFaqStyle(content.faqStyle);
  const ctaStyle = findCtaStyle(content.ctaStyle);
  const footerStyle = findFooterStyle(content.footerStyle);
  const tileColors = content.tileColors ?? {};
  const tileArt: TileArt = content.tileArt ?? {};
  const side = findSideNav(content.sideNav);
  const adminSide = findSideNav(content.adminSideNav);
  const dock = findDock(content.dockStyle);
  const iconSet = content.navIcons ?? DEFAULT_ICON_SET;
  const navColors = content.navColors ?? {};

  const pickSkin = async (s: StudentSkin) => {
    setBusy(s.id);
    await saveContent({ studentSkin: s.id });
    setBusy(null);
  };

  const pickLayout = async (l: StudentLayout) => {
    setBusy(l.id);
    await saveContent({ studentLayout: l.id });
    setBusy(null);
  };

  /** يعيد المظهر كلّه إلى ما تبدأ به المنصّة — الخمسة معاً لا واحداً. */
  /**
   * إعادة الضبط لكل قسم على حدة.
   * الزرّ يعيد القسم المفتوح وحده لا كل المظهر: من يضبط عشرة أقسام ثم
   * يريد التراجع عن واحد منها لا يصحّ أن يفقد التسعة الباقية.
   */
  const SECTIONS: Record<
    Tab,
    { label: string; isDefault: boolean; patch: () => Record<string, unknown> }
  > = {
    identity: {
      label: "الهوية",
      /* «الهوية» علامةٌ على حزمةٍ مطبَّقة؛ إعادتُها تُزيل العلامة، وكلُّ
         بُعدٍ (ثيم/هيئة/حركة) يُعاد من تبويبه إن أُريد. */
      isDefault: !content.brandPresetId,
      patch: () => ({ brandPresetId: undefined }),
    },
    skin: {
      label: "الثيم",
      isDefault: skin.id === DEFAULT_SKIN,
      patch: () => ({ studentSkin: DEFAULT_SKIN }),
    },
    tiles: {
      label: "بطاقات المؤشّرات",
      isDefault:
        tile.id === DEFAULT_TILE &&
        Object.values(tileColors).every((v) => !v) &&
        !tileArt.image,
      patch: () => ({ tileStyle: DEFAULT_TILE, tileColors: {}, tileArt: {} }),
    },
    design: {
      label: "الهيئة",
      isDefault: design.id === DEFAULT_DESIGN,
      patch: () => ({ studentDesign: DEFAULT_DESIGN }),
    },
    layout: {
      label: "التخطيط",
      isDefault: layout.id === DEFAULT_LAYOUT,
      patch: () => ({ studentLayout: DEFAULT_LAYOUT }),
    },
    side: {
      label: "القائمة الجانبية",
      /* القسم يشمل التصميم والأيقونات والألوان معاً — فإعادته تعيدها كلّها. */
      isDefault:
        side.id === DEFAULT_SIDE_NAV &&
        iconSet === DEFAULT_ICON_SET &&
        Object.values(navColors).every((v) => !v),
      patch: () => ({ sideNav: DEFAULT_SIDE_NAV, navIcons: DEFAULT_ICON_SET, navColors: {} }),
    },
    bar: {
      label: "شريط الأدوات",
      isDefault: bar.id === DEFAULT_TOOLBAR,
      patch: () => ({ toolbarStyle: DEFAULT_TOOLBAR }),
    },
    dock: {
      label: "القائمة السفلية",
      isDefault: dock.id === DEFAULT_DOCK,
      patch: () => ({ dockStyle: DEFAULT_DOCK }),
    },
    mobile: {
      label: "تنسيق الهاتف",
      isDefault: mobile.id === DEFAULT_MOBILE,
      patch: () => ({ studentMobile: DEFAULT_MOBILE }),
    },
    icons: {
      label: "إطار الأيقونات",
      isDefault:
        iconFrame.id === DEFAULT_ICON_FRAME &&
        iconMotion.id === DEFAULT_ICON_MOTION &&
        iconCover.id === DEFAULT_ICON_COVER &&
        iconLib.id === DEFAULT_ICON_LIB &&
        Object.keys(icColors).length === 0,
      patch: () => ({
        iconFrame: DEFAULT_ICON_FRAME,
        iconMotion: DEFAULT_ICON_MOTION,
        iconCover: DEFAULT_ICON_COVER,
        iconLib: DEFAULT_ICON_LIB,
        iconFrameColors: {},
      }),
    },
    shell: {
      label: "لوح الرئيسية",
      isDefault: shell.id === DEFAULT_HERO_SHELL && Object.keys(shOpts).length === 0,
      patch: () => ({ heroShell: DEFAULT_HERO_SHELL, heroShellOpts: {} }),
    },
    glow: {
      label: "الوهج",
      isDefault: glow.length === 0,
      patch: () => ({ glow: [] }),
    },
    buttons: {
      label: "زرّا الهيرو",
      isDefault: btnStyle.id === DEFAULT_BUTTON_STYLE,
      patch: () => ({ buttonStyle: DEFAULT_BUTTON_STYLE }),
    },
    motion: {
      label: "الحركة",
      isDefault: motion.id === DEFAULT_MOTION,
      patch: () => ({ motionStyle: DEFAULT_MOTION }),
    },
    mhome: {
      label: "واجهة الهاتف",
      isDefault: mHome.id === DEFAULT_MOBILE_HOME,
      patch: () => ({ mobileHome: DEFAULT_MOBILE_HOME }),
    },
    navbar: {
      label: "شريط الواجهة",
      isDefault: !content.navbarStyle,
      patch: () => ({ navbarStyle: "" }),
    },
    faq: {
      label: "قسم الأسئلة",
      isDefault: faqStyle.id === DEFAULT_FAQ_STYLE,
      patch: () => ({ faqStyle: DEFAULT_FAQ_STYLE }),
    },
    cta: {
      label: "قسم الدعوة",
      isDefault: ctaStyle.id === DEFAULT_CTA_STYLE,
      patch: () => ({ ctaStyle: DEFAULT_CTA_STYLE }),
    },
    footer: {
      label: "الفوتر",
      isDefault: footerStyle.id === DEFAULT_FOOTER_STYLE,
      patch: () => ({ footerStyle: DEFAULT_FOOTER_STYLE }),
    },
    sections: {
      label: "أقسام البطاقات",
      isDefault: SX_SECTIONS.every((x) => (content[x.key] ?? DEFAULT_SECTION_STYLE) === DEFAULT_SECTION_STYLE),
      patch: () => Object.fromEntries(SX_SECTIONS.map((x) => [x.key, DEFAULT_SECTION_STYLE])),
    },
    hero: {
      label: "قسم الهيرو",
      isDefault: heroStyle.id === DEFAULT_HERO_STYLE,
      patch: () => ({ heroStyle: DEFAULT_HERO_STYLE }),
    },
    plans: {
      label: "قسم الخطط",
      isDefault: plansStyle.id === DEFAULT_PLANS_STYLE,
      patch: () => ({ plansStyle: DEFAULT_PLANS_STYLE }),
    },
    home: {
      label: "الواجهة الرئيسية",
      isDefault: home.id === DEFAULT_HOME_LAYOUT,
      patch: () => ({ homeLayout: DEFAULT_HOME_LAYOUT }),
    },
  };

  const section = SECTIONS[tab];

  const resetSection = async () => {
    if (section.isDefault) return;
    if (!confirm(`إعادة «${section.label}» إلى التصميم الأصلي؟`)) return;
    setBusy("reset");
    await saveContent(section.patch());
    setBusy(null);
  };

  /** إعادة كل الأقسام — فعل منفصل بتأكيده الخاص. */
  const resetAll = async () => {
    if (!confirm("إعادة كل أقسام المظهر إلى التصميم الأصلي؟")) return;
    setBusy("resetAll");
    await saveContent(
      (Object.values(SECTIONS) as { patch: () => Record<string, unknown> }[]).reduce(
        (acc, x) => ({ ...acc, ...x.patch() }),
        {} as Record<string, unknown>
      )
    );
    setBusy(null);
  };

  const allDefault = Object.values(SECTIONS).every((x) => x.isDefault);

  /** ألوان القائمة تُدمج فلا يمحو ضبطُ لونٍ لونًا آخر. */
  const setNavColor = (patch: Record<string, string>) =>
    saveContent({ navColors: { ...navColors, ...patch } });

  const pickAdminSide = async (x: SideNavStyle) => {
    setBusy(`as-${x.id}`);
    await saveContent({ adminSideNav: x.id });
    setBusy(null);
  };

  const pickSide = async (x: SideNavStyle) => {
    setBusy(x.id);
    await saveContent({ sideNav: x.id });
    setBusy(null);
  };

  const pickDock = async (x: DockStyle) => {
    setBusy(x.id);
    await saveContent({ dockStyle: x.id });
    setBusy(null);
  };

  /* مُنتقٍ واحد لكل السجلّات — الاختلاف في المفتاح لا في المنطق. */
  const pickKey = (key: string) => async (x: { id: string }) => {
    setBusy(x.id);
    await saveContent({ [key]: x.id });
    setBusy(null);
  };

  const pickFaq = pickKey("faqStyle");
  const pickCta = pickKey("ctaStyle");
  const pickFooter = pickKey("footerStyle");

  const pickSection = async (x: SectionStyle) => {
    setBusy(x.id);
    await saveContent({ [sxKey]: x.id });
    setBusy(null);
  };

  const pickHero = async (x: HeroStyle) => {
    setBusy(x.id);
    await saveContent({ heroStyle: x.id });
    setBusy(null);
  };

  const pickPlans = async (x: PlansStyle) => {
    setBusy(x.id);
    await saveContent({ plansStyle: x.id });
    setBusy(null);
  };

  const pickButton = async (x: ButtonStyle) => {
    setBusy(x.id);
    await saveContent({ buttonStyle: x.id });
    setBusy(null);
  };

  const pickFrame = async (x: IconFrame) => {
    setBusy(x.id);
    await saveContent({ iconFrame: x.id });
    setBusy(null);
  };

  const pickLib = async (x: IconLib) => {
    setBusy(`il-${x.id}`);
    await saveContent({ iconLib: x.id });
    setBusy(null);
  };

  const pickVecLib = async (x: VectorLib) => {
    setBusy(`vl-${x.id}`);
    await saveContent({ vectorLib: x.id });
    setBusy(null);
  };

  const pickCover = async (x: IconCover) => {
    setBusy(`iv-${x.id}`);
    await saveContent({ iconCover: x.id });
    setBusy(null);
  };

  const pickIconMotion = async (x: IconMotion) => {
    setBusy(`im-${x.id}`);
    await saveContent({ iconMotion: x.id });
    setBusy(null);
  };

  const patchIcColors = (p: Record<string, string>) =>
    void saveContent({ iconFrameColors: { ...icColors, ...p } });

  const pickShell = async (x: HeroShell) => {
    setBusy(x.id);
    await saveContent({ heroShell: x.id });
    setBusy(null);
  };

  /* الألوانُ والارتفاع خارج التصاميم: يُبدَّل الشكلُ فتبقى الهوية. */
  const patchShell = (p: Partial<HeroShellOpts>) =>
    void saveContent({ heroShellOpts: { ...shOpts, ...p } });

  const pickMotion = async (x: MotionStyle) => {
    setBusy(x.id);
    await saveContent({ motionStyle: x.id });
    setBusy(null);
  };

  const pickMobileHome = async (x: MobileHome) => {
    setBusy(x.id);
    await saveContent({ mobileHome: x.id });
    setBusy(null);
  };

  const pickNavbar = async (x: ToolbarStyle) => {
    setBusy(x.id);
    await saveContent({ navbarStyle: x.id });
    setBusy(null);
  };

  const pickBar = async (x: ToolbarStyle) => {
    setBusy(x.id);
    await saveContent({ toolbarStyle: x.id });
    setBusy(null);
  };

  const pickTile = async (x: TileStyle) => {
    setBusy(x.id);
    await saveContent({ tileStyle: x.id });
    setBusy(null);
  };

  /** ألوان البطاقة تُدمج فلا يمحو ضبطُ لونٍ لونًا آخر. */
  const setTileColor = (patch: Record<string, string>) =>
    saveContent({ tileColors: { ...tileColors, ...patch } });

  /* الصورة داخل البطاقة — الرفع يملأ الوضع الافتراضي معه فتظهر فوراً. */
  const setTileArt = (patch: Partial<TileArt>) =>
    saveContent({ tileArt: { ...tileArt, ...patch } });

  const [artBusy, setArtBusy] = useState(false);

  const pickTileImage = async (file: File) => {
    setArtBusy(true);
    const url = await uploadImage(file);
    if (url) await saveContent({ tileArt: { ...DEFAULT_TILE_ART, ...tileArt, image: url } });
    setArtBusy(false);
  };

  const pickDesign = async (x: StudentDesign) => {
    setBusy(x.id);
    await saveContent({ studentDesign: x.id });
    setBusy(null);
  };

  const pickMobile = async (x: MobileLayout) => {
    setBusy(x.id);
    await saveContent({ studentMobile: x.id });
    setBusy(null);
  };

  const pickHome = async (l: HomeLayout) => {
    setBusy(l.id);
    await saveContent({ homeLayout: l.id });
    setBusy(null);
  };

  return (
    <>
      <PageHeader
        title="مظهر المنصّة"
        subtitle={`الثيم: ${skin.name} · الهيئة: ${design.name} · القائمة: ${side.name} · السفلية: ${dock.name} · الرئيسية: ${home.name}`}
        action={
          <div className="flex flex-wrap items-center gap-2">
            <button
              type="button"
              onClick={resetSection}
              disabled={busy !== null || section.isDefault}
              title={section.isDefault ? `«${section.label}» على الأصل بالفعل` : `إعادة «${section.label}» وحده`}
              className="inline-flex items-center gap-2 rounded-full border border-primary/50 bg-primary/5 px-4 py-2.5 text-xs font-bold text-primary transition hover:bg-primary/10 disabled:opacity-45"
            >
              {busy === "reset" ? <Loader2 className="size-4 animate-spin" /> : <RotateCcw className="size-4" />}
              إعادة ضبط «{section.label}»
            </button>
            <button
              type="button"
              onClick={resetAll}
              disabled={busy !== null || allDefault}
              title={allDefault ? "كل الأقسام على الأصل بالفعل" : "إعادة كل الأقسام"}
              className="inline-flex items-center gap-2 rounded-full border border-border px-4 py-2.5 text-xs font-bold transition hover:border-rose-500 hover:text-rose-500 disabled:opacity-45"
            >
              {busy === "resetAll" ? <Loader2 className="size-4 animate-spin" /> : <RotateCcw className="size-4" />}
              الكل
            </button>
          </div>
        }
      />

      <div className="mb-6 flex flex-wrap gap-2">
        <TabBtn active={tab === "identity"} onClick={() => setTab("identity")} icon={<Sparkles className="size-4" />}>
          الهوية ({BRAND_PRESETS.length.toLocaleString("ar-EG")})
        </TabBtn>
        <TabBtn active={tab === "skin"} onClick={() => setTab("skin")} icon={<Palette className="size-4" />}>
          الثيم واللون ({STUDENT_SKINS.length.toLocaleString("ar-EG")})
        </TabBtn>
        <TabBtn active={tab === "design"} onClick={() => setTab("design")} icon={<Shapes className="size-4" />}>
          الهيئة والشكل ({STUDENT_DESIGNS.length.toLocaleString("ar-EG")})
        </TabBtn>
        <TabBtn active={tab === "tiles"} onClick={() => setTab("tiles")} icon={<LayoutPanelTop className="size-4" />}>
          بطاقات المؤشّرات ({TILE_STYLES.length.toLocaleString("ar-EG")})
        </TabBtn>
        <TabBtn active={tab === "layout"} onClick={() => setTab("layout")} icon={<LayoutGrid className="size-4" />}>
          تخطيط بوابة الطالب ({STUDENT_LAYOUTS.length.toLocaleString("ar-EG")})
        </TabBtn>
        <TabBtn active={tab === "side"} onClick={() => setTab("side")} icon={<PanelRight className="size-4" />}>
          القائمة الجانبية ({SIDE_NAV_STYLES.length.toLocaleString("ar-EG")})
        </TabBtn>
        <TabBtn active={tab === "bar"} onClick={() => setTab("bar")} icon={<PanelTop className="size-4" />}>
          شريط أدوات اللوحة ({TOOLBAR_STYLES.length.toLocaleString("ar-EG")})
        </TabBtn>
        <TabBtn active={tab === "dock"} onClick={() => setTab("dock")} icon={<Menu className="size-4" />}>
          القائمة السفلية ({DOCK_STYLES.length.toLocaleString("ar-EG")})
        </TabBtn>
        <TabBtn active={tab === "mobile"} onClick={() => setTab("mobile")} icon={<Smartphone className="size-4" />}>
          تنسيق الهاتف ({MOBILE_LAYOUTS.length.toLocaleString("ar-EG")})
        </TabBtn>
        <TabBtn active={tab === "sections"} onClick={() => setTab("sections")} icon={<LayoutList className="size-4" />}>
          أقسام البطاقات ({SECTION_STYLES.length.toLocaleString("ar-EG")})
        </TabBtn>
        <TabBtn active={tab === "glow"} onClick={() => setTab("glow")} icon={<Sparkles className="size-4" />}>
          الوهج ({glow.length.toLocaleString("ar-EG")})
        </TabBtn>
        <TabBtn active={tab === "buttons"} onClick={() => setTab("buttons")} icon={<Sparkles className="size-4" />}>
          زرّا الهيرو ({BUTTON_STYLES.length.toLocaleString("ar-EG")})
        </TabBtn>
        <TabBtn active={tab === "motion"} onClick={() => setTab("motion")} icon={<Sparkles className="size-4" />}>
          الحركة ({MOTION_STYLES.length.toLocaleString("ar-EG")})
        </TabBtn>
        <TabBtn active={tab === "mhome"} onClick={() => setTab("mhome")} icon={<Smartphone className="size-4" />}>
          واجهة الهاتف ({MOBILE_HOMES.length.toLocaleString("ar-EG")})
        </TabBtn>
        <TabBtn active={tab === "navbar"} onClick={() => setTab("navbar")} icon={<PanelTop className="size-4" />}>
          شريط الواجهة ({TOOLBAR_STYLES.length.toLocaleString("ar-EG")})
        </TabBtn>
        <TabBtn active={tab === "faq"} onClick={() => setTab("faq")} icon={<MessageCircleQuestion className="size-4" />}>
          قسم الأسئلة ({FAQ_STYLES.length.toLocaleString("ar-EG")})
        </TabBtn>
        <TabBtn active={tab === "cta"} onClick={() => setTab("cta")} icon={<Megaphone className="size-4" />}>
          قسم الدعوة ({CTA_STYLES.length.toLocaleString("ar-EG")})
        </TabBtn>
        <TabBtn active={tab === "footer"} onClick={() => setTab("footer")} icon={<PanelBottom className="size-4" />}>
          الفوتر ({FOOTER_STYLES.length.toLocaleString("ar-EG")})
        </TabBtn>
        <TabBtn active={tab === "icons"} onClick={() => setTab("icons")} icon={<Sparkles className="size-4" />}>
          إطار الأيقونات
        </TabBtn>
        <TabBtn active={tab === "shell"} onClick={() => setTab("shell")} icon={<Shapes className="size-4" />}>
          لوح الرئيسية
        </TabBtn>
        <TabBtn active={tab === "hero"} onClick={() => setTab("hero")} icon={<Sparkles className="size-4" />}>
          قسم الهيرو ({HERO_STYLES.length.toLocaleString("ar-EG")})
        </TabBtn>
        <TabBtn active={tab === "plans"} onClick={() => setTab("plans")} icon={<Wallet className="size-4" />}>
          قسم الخطط ({PLANS_STYLES.length.toLocaleString("ar-EG")})
        </TabBtn>
        <TabBtn active={tab === "home"} onClick={() => setTab("home")} icon={<Home className="size-4" />}>
          تخطيط الواجهة الرئيسية ({HOME_LAYOUTS.length.toLocaleString("ar-EG")})
        </TabBtn>
      </div>

      {tab === "identity" && (
        <Section title="هوية المنصّة" group="الهوية" subtitle="حزمةٌ كاملة بضغطة — تصميمٌ وألوانٌ وحركة معاً.">
          <IdentityPresets />
        </Section>
      )}

      {tab === "skin" && (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {STUDENT_SKINS.map((s) => {
            const on = s.id === skin.id;
            return (
              <button
                key={s.id}
                type="button"
                onClick={() => pickSkin(s)}
                disabled={busy !== null}
                className={`group relative overflow-hidden rounded-3xl border-2 p-2 text-right transition disabled:opacity-60 ${
                  on ? "border-primary shadow-bento" : "border-border hover:border-primary/50"
                }`}
              >
                <SkinPreview skin={s} />
                <div className="flex items-center justify-between gap-2 px-1.5 pb-1 pt-2.5">
                  <div className="min-w-0">
                    <p className="truncate text-sm font-bold">{s.name}</p>
                    <p className="truncate text-[10px] text-muted-foreground">{s.hint}</p>
                  </div>
                  {busy === s.id ? (
                    <Loader2 className="size-4 shrink-0 animate-spin text-primary" />
                  ) : on ? (
                    <span className="grid size-6 shrink-0 place-items-center rounded-full bg-primary text-white">
                      <Check className="size-3.5" />
                    </span>
                  ) : null}
                </div>
              </button>
            );
          })}
        </div>
      )}

      {tab === "design" && (
        <>
          <Section
            className="mb-5"
            title="موضع المؤشّرات"
            subtitle="بطاقاتُ التقدّم والكورسات والاشتراك — داخل لوح الترحيب أم تحته"
            group="الألوان"
          >
            <div className="grid gap-2.5 sm:grid-cols-3">
              {([
                { id: "auto", name: "يتبع التخطيط", hint: "كما يقرّره التخطيطُ المختار" },
                { id: "in", name: "داخل اللوح", hint: "تُوضع داخل لوح الترحيب نفسِه" },
                { id: "out", name: "تحت اللوح", hint: "صفٌّ مستقلٌّ أسفلَه" },
              ] as const).map((o) => {
                const on = (content.statsInPanel ?? "auto") === o.id;
                return (
                  <button
                    key={o.id}
                    type="button"
                    disabled={busy !== null}
                    onClick={async () => { setBusy(`sip-${o.id}`); await saveContent({ statsInPanel: o.id }); setBusy(null); }}
                    className={`rounded-2xl border p-3 text-right transition ${
                      on ? "border-primary bg-primary/[0.06] ring-2 ring-primary/25" : "border-border hover:border-primary/40"
                    }`}
                  >
                    <span className="block text-xs font-bold">{o.name}</span>
                    <span className="mt-0.5 block text-[10px] leading-relaxed text-muted-foreground">{o.hint}</span>
                  </button>
                );
              })}
            </div>
            {/*
              معاينةٌ تُسحب فيها البطاقةُ إلى موضعها — الأزرارُ فوقها تصف
              الموضعَ ولا تُريه، وهذه تُريه قبل الحفظ.
            */}
            <div className="mt-4 rounded-2xl border border-border p-3">
              <StatsPlacement
                value={content.statsInPanel ?? "auto"}
                busy={busy !== null}
                onChange={async (v) => { setBusy(`sip-${v}`); await saveContent({ statsInPanel: v }); setBusy(null); }}
              />
            </div>

            <p className="mt-3 text-[11px] leading-relaxed text-muted-foreground">
              وداخلَ اللوح تلتفّ البطاقاتُ في شبكةٍ ولا تُقصّ — اللوحُ يقصّ ما تجاوزه، وصفٌّ
              ثابتُ العرض داخله يقطع آخرَ بطاقةٍ بلا سبيلٍ إليها.
            </p>
          </Section>

          {/*
            معالجةُ اللوح — محورٌ ثانٍ فوق «الهيئة».
            الهيئاتُ الاثنتان والعشرون تُبدّل الحافّةَ وحدَها واللوحُ في
            جميعها كتلةٌ كحليّة، فمن بدّل بينها لم يرَ فرقاً يُذكر. وهذه
            تُبدّل ما يُرى فعلاً: السطحَ والتخطيطَ وثقلَ الخطّ وموضعَ الحدّ.
          */}
          <Section
            className="mb-5"
            title="معالجة لوح الترحيب"
            subtitle="السطحُ والتخطيط — غيرُ «الهيئة» التي تُبدّل الحافّةَ وحدَها"
            group="الألوان"
          >
            <div className="grid gap-2.5 sm:grid-cols-2 lg:grid-cols-4">
              {PANEL_STYLES.map((p) => {
                const on = (content.studentPanel ?? DEFAULT_PANEL_STYLE) === p.id;
                return (
                  <button
                    key={p.id}
                    type="button"
                    disabled={busy !== null}
                    onClick={async () => { setBusy(`pnl-${p.id}`); await saveContent({ studentPanel: p.id }); setBusy(null); }}
                    className={`rounded-2xl border p-3 text-right transition ${
                      on ? "border-primary bg-primary/[0.06] ring-2 ring-primary/25" : "border-border hover:border-primary/40"
                    }`}
                  >
                    {/* معاينةٌ صغيرةٌ تُري المعالجةَ لا اسمَها */}
                    <span className={`pnl-${p.id} mb-2 block`}>
                      <span className="student-header block h-11 rounded-xl bg-gradient-to-bl from-[hsl(var(--primary))] to-[hsl(var(--glow))]" />
                    </span>
                    <span className="block text-xs font-bold">{p.name}</span>
                    <span className="mt-0.5 block text-[10px] leading-relaxed text-muted-foreground">{p.hint}</span>
                  </button>
                );
              })}
            </div>
          </Section>

          <Section className="mb-5" title="ألوان الهيئة" group="الألوان">
            <p className="mb-3 text-[11px] leading-relaxed text-muted-foreground">
              لوحُ الترحيب والبطاقات في بوابة الطالب يأخذان لونَهما من الهوية. ومن أرادهما
              أغمقَ أو أفتحَ لا يريد أن يُغيّر الهويةَ كلَّها من أجلهما — فلهما لونُهما هنا.
              واللونُ المتروك يرث لون الثيم.
            </p>
            <div className="grid gap-2.5">
              {([
                ["panel", "لوح الترحيب"],
                ["panel2", "لون التدرّج الثاني"],
                ["panelText", "نصّ اللوح"],
                ["tile", "البطاقات"],
                ["edge", "الحدود"],
              ] as const).map(([k, label]) => {
                const cur = (content.designColors ?? {})[k] ?? "";
                return (
                  <div key={k} className="flex flex-wrap items-center gap-2">
                    <span className="w-28 shrink-0 text-xs font-semibold text-muted-foreground">{label}</span>
                    {SHELL_SWATCH.map((c) => (
                      <button
                        key={c}
                        type="button"
                        aria-label={c}
                        onClick={() => void saveContent({ designColors: { ...(content.designColors ?? {}), [k]: c } })}
                        className={`size-7 rounded-lg border transition ${
                          cur.toLowerCase() === c ? "border-primary ring-2 ring-primary/40" : "border-border"
                        }`}
                        style={{ background: c }}
                      />
                    ))}
                    <label
                      className="grid size-7 cursor-pointer place-items-center rounded-lg border border-dashed border-border"
                      style={{ background: cur || "transparent" }}
                    >
                      <input
                        type="color"
                        className="size-0 opacity-0"
                        value={cur || "#2c456a"}
                        onChange={(e) => void saveContent({ designColors: { ...(content.designColors ?? {}), [k]: e.target.value } })}
                      />
                    </label>
                    {cur ? (
                      <button
                        type="button"
                        onClick={() => void saveContent({ designColors: { ...(content.designColors ?? {}), [k]: "" } })}
                        className="rounded-lg border border-border px-2 py-1 text-[10px] font-bold text-muted-foreground transition hover:border-primary/40"
                      >
                        لون الثيم
                      </button>
                    ) : null}
                  </div>
                );
              })}
            </div>
          </Section>

        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {STUDENT_DESIGNS.map((x) => {
            const on = x.id === design.id;
            return (
              <button
                key={x.id}
                type="button"
                onClick={() => pickDesign(x)}
                disabled={busy !== null}
                className={`group relative overflow-hidden rounded-3xl border-2 p-2 text-right transition disabled:opacity-60 ${
                  on ? "border-primary shadow-bento" : "border-border hover:border-primary/50"
                }`}
              >
                <DesignPreview design={x} skin={skin} />
                <div className="flex items-center justify-between gap-2 px-1.5 pb-1 pt-2.5">
                  <div className="min-w-0">
                    <p className="truncate text-sm font-bold">{x.name}</p>
                    <p className="truncate text-[10px] text-muted-foreground">{x.hint}</p>
                  </div>
                  {busy === x.id ? (
                    <Loader2 className="size-4 shrink-0 animate-spin text-primary" />
                  ) : on ? (
                    <span className="grid size-6 shrink-0 place-items-center rounded-full bg-primary text-white">
                      <Check className="size-3.5" />
                    </span>
                  ) : null}
                </div>
              </button>
            );
          })}
        </div>
        </>
      )}

      {tab === "tiles" && (
        <>
          <Card className="mb-5">
            <p className="font-display mb-1 font-bold">صورة داخل البطاقة</p>
            <p className="mb-4 text-[11px] leading-relaxed text-muted-foreground">
              صورة أو GIF يظهر داخل بطاقات المؤشّرات. طبقة زينة خلف الرقم لا فوقه —
              فالشفافية مضبوطة حتى يبقى الرقم مقروءاً، وهو أهمّ ما في البطاقة.
            </p>

            <div className="flex flex-wrap items-center gap-3">
              <label className="inline-flex cursor-pointer items-center gap-2 rounded-xl border border-dashed border-border px-4 py-2 text-xs font-bold transition hover:border-primary/60">
                {artBusy ? <Loader2 className="size-4 animate-spin text-primary" /> : <ImagePlus className="size-4 text-primary" />}
                {tileArt.image ? "تغيير الصورة" : "رفع صورة أو GIF"}
                <input
                  type="file"
                  accept="image/*"
                  className="hidden"
                  disabled={artBusy}
                  onChange={(e) => {
                    const f = e.target.files?.[0];
                    e.target.value = "";
                    if (f) void pickTileImage(f);
                  }}
                />
              </label>

              {tileArt.image && (
                <>
                  <span
                    className="size-12 shrink-0 rounded-xl border border-border bg-muted bg-cover bg-center"
                    style={{ backgroundImage: `url(${tileArt.image})` }}
                  />
                  <button
                    type="button"
                    onClick={() => void saveContent({ tileArt: {} })}
                    className="rounded-xl border border-border px-3 py-2 text-[11px] font-bold text-muted-foreground transition hover:border-destructive/60 hover:text-destructive"
                  >
                    إزالة الصورة
                  </button>
                </>
              )}
            </div>

            {tileArt.image && (
              <div className="mt-4 grid gap-4">
                <div>
                  <p className="mb-2 text-xs font-semibold text-muted-foreground">موضع الصورة</p>
                  <div className="flex flex-wrap gap-2">
                    {TILE_ART_MODES.map((m) => (
                      <button
                        key={m.id}
                        type="button"
                        onClick={() => void setTileArt({ mode: m.id as TileArtMode })}
                        title={m.hint}
                        className={`rounded-full border px-3 py-1.5 text-[11px] font-bold transition ${
                          (tileArt.mode ?? "cover") === m.id
                            ? "border-primary bg-primary/10 text-primary"
                            : "border-border hover:border-primary/40"
                        }`}
                      >
                        {m.name}
                      </button>
                    ))}
                  </div>
                </div>

                <label className="flex flex-wrap items-center gap-3">
                  <span className="w-40 shrink-0 text-xs font-semibold text-muted-foreground">
                    شدّة الظهور ({(tileArt.opacity ?? 22).toLocaleString("ar-EG")}٪)
                  </span>
                  <input
                    type="range"
                    min={5}
                    max={100}
                    value={tileArt.opacity ?? 22}
                    onChange={(e) => void setTileArt({ opacity: Number(e.target.value) })}
                    className="h-1.5 min-w-[12rem] flex-1 accent-primary"
                  />
                </label>

                <label className="flex flex-wrap items-center gap-3">
                  <span className="w-40 shrink-0 text-xs font-semibold text-muted-foreground">
                    الضباب ({(tileArt.blur ?? 0).toLocaleString("ar-EG")} بكسل)
                  </span>
                  <input
                    type="range"
                    min={0}
                    max={12}
                    value={tileArt.blur ?? 0}
                    onChange={(e) => void setTileArt({ blur: Number(e.target.value) })}
                    className="h-1.5 min-w-[12rem] flex-1 accent-primary"
                  />
                </label>
              </div>
            )}
          </Card>

          <Card className="mb-5">
            <p className="font-display mb-1 font-bold">ألوان البطاقات</p>
            <p className="mb-4 text-[11px] leading-relaxed text-muted-foreground">
              مستقلّة عن الثيم تماماً — تغيّر لون البطاقات وحدها دون أن تمسّ هوية المنصّة.
              اللون الفارغ يرث لون الثيم.
            </p>
            <div className="grid gap-3">
              {([
                { key: "bg", label: "خلفية البطاقة" },
                { key: "bg2", label: "اللون الثاني (للتدرّج)" },
                { key: "text", label: "الرقم والعنوان" },
                { key: "icon", label: "شارة الأيقونة" },
                { key: "accent", label: "الحدّ والحلقة" },
              ] as const).map((row) => (
                <div key={row.key} className="flex flex-wrap items-center gap-2">
                  <span className="w-40 shrink-0 text-xs font-semibold text-muted-foreground">{row.label}</span>
                  <button
                    type="button"
                    onClick={() => void setTileColor({ [row.key]: "" })}
                    className={`rounded-full border px-3 py-1 text-[10px] font-bold transition ${
                      !tileColors[row.key] ? "border-primary bg-primary/10 text-primary" : "border-border hover:border-primary/40"
                    }`}
                  >
                    الثيم
                  </button>
                  {SWATCH.map((c) => (
                    <button
                      key={c}
                      type="button"
                      aria-label={c}
                      onClick={() => void setTileColor({ [row.key]: c })}
                      className={`size-7 rounded-lg border transition ${
                        tileColors[row.key]?.toLowerCase() === c ? "border-primary ring-2 ring-primary/40" : "border-border hover:border-primary/50"
                      }`}
                      style={{ background: c }}
                    />
                  ))}
                  <label
                    className="grid size-7 cursor-pointer place-items-center rounded-lg border border-dashed border-border"
                    style={{ background: tileColors[row.key] || "transparent" }}
                    title="لون مخصّص"
                  >
                    <input
                      type="color"
                      className="size-0 opacity-0"
                      value={tileColors[row.key] || "#233b8b"}
                      onChange={(e) => void setTileColor({ [row.key]: e.target.value })}
                    />
                  </label>
                </div>
              ))}
            </div>
          </Card>

          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {TILE_STYLES.map((x) => {
              const on = x.id === tile.id;
              return (
                <button
                  key={x.id}
                  type="button"
                  onClick={() => pickTile(x)}
                  disabled={busy !== null}
                  className={`group relative overflow-hidden rounded-3xl border-2 p-2 text-right transition disabled:opacity-60 ${
                    on ? "border-primary shadow-bento" : "border-border hover:border-primary/50"
                  }`}
                >
                  <TilePreview tile={x} colors={tileColors} art={tileArt} skin={skin} />
                  <div className="flex items-center justify-between gap-2 px-1.5 pb-1 pt-2.5">
                    <div className="min-w-0">
                      <p className="truncate text-sm font-bold">{x.name}</p>
                      <p className="truncate text-[10px] text-muted-foreground">{x.hint}</p>
                    </div>
                    {busy === x.id ? (
                      <Loader2 className="size-4 shrink-0 animate-spin text-primary" />
                    ) : on ? (
                      <span className="grid size-6 shrink-0 place-items-center rounded-full bg-primary text-white">
                        <Check className="size-3.5" />
                      </span>
                    ) : null}
                  </div>
                </button>
              );
            })}
          </div>
        </>
      )}

      {tab === "layout" && (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {STUDENT_LAYOUTS.map((l) => {
            const on = l.id === layout.id;
            return (
              <button
                key={l.id}
                type="button"
                onClick={() => pickLayout(l)}
                disabled={busy !== null}
                className={`group relative overflow-hidden rounded-3xl border-2 p-2 text-right transition disabled:opacity-60 ${
                  on ? "border-primary shadow-bento" : "border-border hover:border-primary/50"
                }`}
              >
                {/* المعاينة بألوان الثيم المختار حالياً — فيرى الأدمن التركيبة الحقيقية */}
                <LayoutPreview layout={l} skin={skin} />
                <div className="flex items-center justify-between gap-2 px-1.5 pb-1 pt-2.5">
                  <div className="min-w-0">
                    <p className="truncate text-sm font-bold">{l.name}</p>
                    <p className="truncate text-[10px] text-muted-foreground">{l.hint}</p>
                  </div>
                  {busy === l.id ? (
                    <Loader2 className="size-4 shrink-0 animate-spin text-primary" />
                  ) : on ? (
                    <span className="grid size-6 shrink-0 place-items-center rounded-full bg-primary text-white">
                      <Check className="size-3.5" />
                    </span>
                  ) : null}
                </div>
              </button>
            );
          })}
        </div>
      )}

      {/*
        لوحُ ترحيب الطالب — تحكّمٌ كاملٌ في لسانه.
        وُضع في «المظهر» لا في صفحةٍ مستقلّة: هو مظهرٌ خالصٌ لا بيانات،
        ومن جاء يضبط شكلَ البوّابة يجده حيث يبحث.
      */}
      {tab === "side" && (
        <AzHeadPanel value={content.azHead} onChange={(next) => { void saveContent({ azHead: next }); }} />
      )}

      {tab === "side" && (
        <Card className="mb-5">
          <p className="font-display mb-1 font-bold">جهةُ القائمة الجانبية</p>
          <p className="mb-4 text-[11px] leading-relaxed text-muted-foreground">
            جهةٌ على الشاشة لا في السطر: المنصّةُ عربيّةٌ فـ«البداية» تعني اليمينَ دائماً، ومن
            أراد اللوحَ يساراً أرادَه يساراً حيث تراه العين. ولكلِّ بوّابةٍ جهتُها — قد يعمل
            الأستاذُ بلوحةٍ يساريّةٍ ويترك بوّابةَ طلابه يمينيّة.
          </p>

          <div className="grid gap-4 sm:grid-cols-2">
            {([
              { key: "navSide" as const, label: "بوّابة الطالب", cur: content.navSide },
              { key: "adminNavSide" as const, label: "لوحة التحكّم", cur: content.adminNavSide },
            ]).map((row) => (
              <div key={row.key}>
                <p className="mb-2 text-xs font-bold">{row.label}</p>
                <div className="inline-flex rounded-2xl border border-border bg-card p-1">
                  {([
                    { id: "right", label: "يمين" },
                    { id: "left", label: "يسار" },
                  ] as const).map((o) => {
                    const on = (row.cur ?? "right") === o.id;
                    return (
                      <button
                        key={o.id}
                        type="button"
                        disabled={busy !== null}
                        onClick={async () => { setBusy(`${row.key}-${o.id}`); await saveContent({ [row.key]: o.id }); setBusy(null); }}
                        className={`inline-flex items-center gap-1.5 rounded-xl px-4 py-2 text-xs font-bold transition disabled:opacity-60 ${
                          on ? "btn-glow text-white" : "text-muted-foreground hover:text-foreground"
                        }`}
                      >
                        {/* سهمٌ يشير إلى الجهة — أوضحُ من كلمة */}
                        <svg viewBox="0 0 24 24" className="size-3.5" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                          {o.id === "right" ? <path d="M5 12h14M13 6l6 6-6 6" /> : <path d="M19 12H5M11 6l-6 6 6 6" />}
                        </svg>
                        {o.label}
                      </button>
                    );
                  })}
                </div>
              </div>
            ))}
          </div>
        </Card>
      )}

      {/* ---------- تصميم قائمة اللوحة ---------- */}
      {tab === "side" && (
        <>
          <Card className="mb-4">
            <p className="font-display mb-1 font-bold">تصميم قائمة لوحة التحكّم</p>
            <p className="text-[11px] leading-relaxed text-muted-foreground">
              مستقلٌّ عن قائمة الطالب. واللوحةُ يقضي فيها الأستاذُ ساعاتٍ والطالبُ دقائق —
              فما يريح في إحداهما لا يلزم أن يريح في الأخرى.
            </p>
          </Card>

          <div className="mb-5 grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {SIDE_NAV_STYLES.map((x) => {
              const on = x.id === adminSide.id;
              return (
                <button
                  key={x.id}
                  type="button"
                  onClick={() => pickAdminSide(x)}
                  disabled={busy !== null}
                  className={`group relative overflow-hidden rounded-3xl border-2 p-2 text-right transition disabled:opacity-60 ${
                    on ? "border-primary shadow-bento" : "border-border hover:border-primary/50"
                  }`}
                >
                  <SideNavPreview nav={x} skin={skin} />
                  <div className="flex items-center justify-between gap-2 px-1.5 pb-1 pt-2.5">
                    <div className="min-w-0">
                      <p className="truncate text-sm font-bold">{x.name}</p>
                      <p className="truncate text-[10px] text-muted-foreground">{x.hint}</p>
                    </div>
                    {busy === `as-${x.id}` ? (
                      <Loader2 className="size-4 shrink-0 animate-spin text-primary" />
                    ) : on ? (
                      <span className="grid size-6 shrink-0 place-items-center rounded-full bg-primary text-white">
                        <Check className="size-3.5" />
                      </span>
                    ) : null}
                  </div>
                </button>
              );
            })}
          </div>
        </>
      )}

      {tab === "side" && (
        <div className="mb-5 grid gap-4 lg:grid-cols-2">
          <Card>
            <p className="font-display mb-1 font-bold">أسلوب الأيقونات</p>
            <p className="mb-3 text-[11px] leading-relaxed text-muted-foreground">
              أسلوب واحد لكل القائمة — خلط الأساليب في شريط واحد أكثر ما يُفسد اتّساق الواجهة.
            </p>
            <div className="flex flex-wrap gap-2">
              {ICON_SETS.map((o) => (
                <button
                  key={o.id}
                  type="button"
                  onClick={() => void saveContent({ navIcons: o.id })}
                  title={o.hint}
                  className={`rounded-full border px-3.5 py-1.5 text-xs font-bold transition ${
                    iconSet === o.id ? "border-primary bg-primary/10 text-primary" : "border-border hover:border-primary/40"
                  }`}
                >
                  {o.name}
                </button>
              ))}
            </div>
          </Card>

          <Card>
            <p className="font-display mb-3 font-bold">ألوان القائمة</p>
            <div className="grid gap-3">
              {([
                { key: "panel", label: "خلفية اللوح" },
                { key: "icon", label: "الأيقونات" },
                { key: "text", label: "نصّ العناوين" },
                { key: "active", label: "العنصر النشط" },
              ] as const).map((row) => (
                <div key={row.key} className="flex flex-wrap items-center gap-2">
                  <span className="w-32 shrink-0 text-xs font-semibold text-muted-foreground">{row.label}</span>
                  <button
                    type="button"
                    onClick={() => void setNavColor({ [row.key]: "" })}
                    className={`rounded-full border px-3 py-1 text-[10px] font-bold transition ${
                      !navColors[row.key] ? "border-primary bg-primary/10 text-primary" : "border-border hover:border-primary/40"
                    }`}
                  >
                    الثيم
                  </button>
                  {SWATCH.map((c) => (
                    <button
                      key={c}
                      type="button"
                      aria-label={c}
                      onClick={() => void setNavColor({ [row.key]: c })}
                      className={`size-7 rounded-lg border transition ${
                        navColors[row.key]?.toLowerCase() === c ? "border-primary ring-2 ring-primary/40" : "border-border hover:border-primary/50"
                      }`}
                      style={{ background: c }}
                    />
                  ))}
                  <label
                    className="grid size-7 cursor-pointer place-items-center rounded-lg border border-dashed border-border"
                    style={{ background: navColors[row.key] || "transparent" }}
                    title="لون مخصّص"
                  >
                    <input
                      type="color"
                      className="size-0 opacity-0"
                      value={navColors[row.key] || "#233b8b"}
                      onChange={(e) => void setNavColor({ [row.key]: e.target.value })}
                    />
                  </label>
                </div>
              ))}
            </div>
          </Card>
        </div>
      )}

      {tab === "side" && (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {SIDE_NAV_STYLES.map((x) => {
            const on = x.id === side.id;
            return (
              <button
                key={x.id}
                type="button"
                onClick={() => pickSide(x)}
                disabled={busy !== null}
                className={`group relative overflow-hidden rounded-3xl border-2 p-2 text-right transition disabled:opacity-60 ${
                  on ? "border-primary shadow-bento" : "border-border hover:border-primary/50"
                }`}
              >
                <SideNavPreview nav={x} skin={skin} />
                <div className="flex items-center justify-between gap-2 px-1.5 pb-1 pt-2.5">
                  <div className="min-w-0">
                    <p className="truncate text-sm font-bold">{x.name}</p>
                    <p className="truncate text-[10px] text-muted-foreground">{x.hint}</p>
                  </div>
                  {busy === x.id ? (
                    <Loader2 className="size-4 shrink-0 animate-spin text-primary" />
                  ) : on ? (
                    <span className="grid size-6 shrink-0 place-items-center rounded-full bg-primary text-white">
                      <Check className="size-3.5" />
                    </span>
                  ) : null}
                </div>
              </button>
            );
          })}
        </div>
      )}

      {tab === "bar" && (
        <>
        <Card className="mb-5">
          <p className="font-display mb-1 font-bold">إظهار الشريط</p>
          <p className="mb-3 text-[11px] text-muted-foreground">
            شريط أدوات لوحتَي الطالب والإدارة — إخفاؤه يوسّع مساحة المحتوى.
          </p>
          <Switch
            label="إظهار شريط أدوات اللوحة"
            hint="فيه البحث السريع والإشعارات وزرّ القائمة على الجوّال"
            on={content.toolbarHidden !== true}
            onChange={(v) => void saveContent({ toolbarHidden: !v })}
          />
        </Card>

        <StickPicker
          label="تثبيت شريط اللوحة"
          value={content.toolbarStick}
          onPick={(v) => void saveContent({ toolbarStick: v })}
        />
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {TOOLBAR_STYLES.map((x) => {
            const on = x.id === bar.id;
            return (
              <button
                key={x.id}
                type="button"
                onClick={() => pickBar(x)}
                disabled={busy !== null}
                className={`group relative overflow-hidden rounded-3xl border-2 p-2 text-right transition disabled:opacity-60 ${
                  on ? "border-primary shadow-bento" : "border-border hover:border-primary/50"
                }`}
              >
                <ToolbarPreview bar={x} skin={skin} />
                <div className="flex items-center justify-between gap-2 px-1.5 pb-1 pt-2.5">
                  <div className="min-w-0">
                    <p className="truncate text-sm font-bold">{x.name}</p>
                    <p className="truncate text-[10px] text-muted-foreground">{x.hint}</p>
                  </div>
                  {busy === x.id ? (
                    <Loader2 className="size-4 shrink-0 animate-spin text-primary" />
                  ) : on ? (
                    <span className="grid size-6 shrink-0 place-items-center rounded-full bg-primary text-white">
                      <Check className="size-3.5" />
                    </span>
                  ) : null}
                </div>
              </button>
            );
          })}
        </div>
        </>
      )}

      {tab === "dock" && (
        <div className="grid gap-4 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5">
          {DOCK_STYLES.map((x) => {
            const on = x.id === dock.id;
            return (
              <button
                key={x.id}
                type="button"
                onClick={() => pickDock(x)}
                disabled={busy !== null}
                className={`group relative overflow-hidden rounded-3xl border-2 p-2 text-right transition disabled:opacity-60 ${
                  on ? "border-primary shadow-bento" : "border-border hover:border-primary/50"
                }`}
              >
                <DockPreview dock={x} skin={skin} />
                <div className="flex items-center justify-between gap-2 px-1.5 pb-1 pt-2.5">
                  <div className="min-w-0">
                    <p className="truncate text-sm font-bold">{x.name}</p>
                    <p className="truncate text-[10px] text-muted-foreground">{x.hint}</p>
                  </div>
                  {busy === x.id ? (
                    <Loader2 className="size-4 shrink-0 animate-spin text-primary" />
                  ) : on ? (
                    <span className="grid size-6 shrink-0 place-items-center rounded-full bg-primary text-white">
                      <Check className="size-3.5" />
                    </span>
                  ) : null}
                </div>
              </button>
            );
          })}
        </div>
      )}

      {tab === "mobile" && (
        <div className="grid gap-4 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5">
          {MOBILE_LAYOUTS.map((x) => {
            const on = x.id === mobile.id;
            return (
              <button
                key={x.id}
                type="button"
                onClick={() => pickMobile(x)}
                disabled={busy !== null}
                className={`group relative overflow-hidden rounded-3xl border-2 p-2 text-right transition disabled:opacity-60 ${
                  on ? "border-primary shadow-bento" : "border-border hover:border-primary/50"
                }`}
              >
                <MobilePreview mobile={x} skin={skin} />
                <div className="flex items-center justify-between gap-2 px-1.5 pb-1 pt-2.5">
                  <div className="min-w-0">
                    <p className="truncate text-sm font-bold">{x.name}</p>
                    <p className="truncate text-[10px] text-muted-foreground">{x.hint}</p>
                  </div>
                  {busy === x.id ? (
                    <Loader2 className="size-4 shrink-0 animate-spin text-primary" />
                  ) : on ? (
                    <span className="grid size-6 shrink-0 place-items-center rounded-full bg-primary text-white">
                      <Check className="size-3.5" />
                    </span>
                  ) : null}
                </div>
              </button>
            );
          })}
        </div>
      )}

      {tab === "sections" && (
        <>
          <Card className="mb-5">
            <p className="font-display mb-1 font-bold">أيّ قسم تصمّم الآن؟</p>
            <p className="mb-4 text-[11px] leading-relaxed text-muted-foreground">
              ثلاثة أقسام تشترك في بنية واحدة — عنوانٌ ثم شبكةُ بطاقات. لكلٍّ اختيارُه
              المستقلّ، فاختر القسم أوّلاً ثم التصميم.
            </p>
            <div className="flex flex-wrap gap-2">
              {SX_SECTIONS.map((x) => (
                <button
                  key={x.key}
                  type="button"
                  onClick={() => setSxKey(x.key)}
                  className={`rounded-2xl border px-4 py-2 text-xs font-bold transition ${
                    sxKey === x.key
                      ? "border-primary bg-primary/10 text-primary"
                      : "border-border text-muted-foreground hover:border-primary/40"
                  }`}
                >
                  {x.label}
                  <span className="ms-2 text-[10px] font-semibold opacity-70">
                    {findSectionStyle(content[x.key]).name}
                  </span>
                </button>
              ))}
            </div>
          </Card>

          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {SECTION_STYLES.map((x) => {
              const on = x.id === sxStyle.id;
              return (
                <button
                  key={x.id}
                  type="button"
                  onClick={() => pickSection(x)}
                  disabled={busy !== null}
                  className={`group relative overflow-hidden rounded-3xl border-2 p-2 text-right transition disabled:opacity-60 ${
                    on ? "border-primary shadow-bento" : "border-border hover:border-primary/50"
                  }`}
                >
                  <SectionPreview style={x} skin={skin} />
                  <div className="flex items-center justify-between gap-2 px-1.5 pb-1 pt-2.5">
                    <div className="min-w-0">
                      <p className="truncate text-sm font-bold">{x.name}</p>
                      <p className="truncate text-[10px] text-muted-foreground">{x.hint}</p>
                    </div>
                    {busy === x.id ? (
                      <Loader2 className="size-4 shrink-0 animate-spin text-primary" />
                    ) : on ? (
                      <span className="grid size-6 shrink-0 place-items-center rounded-full bg-primary text-white">
                        <Check className="size-3.5" />
                      </span>
                    ) : null}
                  </div>
                </button>
              );
            })}
          </div>
        </>
      )}

      {tab === "glow" && (
        <>
          <Card className="mb-5">
            <p className="font-display mb-1 font-bold">الخلفيات والحواف المضيئة</p>
            <p className="text-[11px] leading-relaxed text-muted-foreground">
              كل قاعدة تختار عناصرها — واحداً أو أكثر أو الكلّ — وتُضيئها بخلفيةٍ خلفها أو
              حافّةٍ على حدودها أو كليهما، بلونٍ واحد أو تدرّجٍ أو قوس قزح يدور. والمعاينة
              هنا <b>حيّة بالقيم نفسِها</b> لا رسمٌ يصفها.
            </p>
          </Card>

          <GlowEditor rules={glow} onChange={(next) => void saveContent({ glow: next })} />
        </>
      )}

      {tab === "buttons" && (
        <>
          <Card className="mb-5">
            <p className="font-display mb-1 font-bold">زرّا «أنشئ حساب» و«شاهد درساً مجانياً»</p>
            <p className="text-[11px] leading-relaxed text-muted-foreground">
              هما البابان اللذان يدخل منهما الزائر، وأكثرُ عنصرين يُنظر إليهما في الصفحة.
              والتصميمُ هو العلاقةُ بينهما لا مظهرُ كلٍّ منفرداً: الأوّل يقود والثاني يُساند.
            </p>
          </Card>

          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {BUTTON_STYLES.map((x) => {
              const on = x.id === btnStyle.id;
              return (
                <button
                  key={x.id}
                  type="button"
                  onClick={() => pickButton(x)}
                  disabled={busy !== null}
                  className={`group relative overflow-hidden rounded-3xl border-2 p-2 text-right transition disabled:opacity-60 ${
                    on ? "border-primary shadow-bento" : "border-border hover:border-primary/50"
                  }`}
                >
                  <ButtonPreview style={x} skin={skin} />
                  <div className="flex items-center justify-between gap-2 px-1.5 pb-1 pt-2.5">
                    <div className="min-w-0">
                      <p className="truncate text-sm font-bold">{x.name}</p>
                      <p className="truncate text-[10px] text-muted-foreground">{x.hint}</p>
                    </div>
                    {busy === x.id ? (
                      <Loader2 className="size-4 shrink-0 animate-spin text-primary" />
                    ) : on ? (
                      <span className="grid size-6 shrink-0 place-items-center rounded-full bg-primary text-white">
                        <Check className="size-3.5" />
                      </span>
                    ) : null}
                  </div>
                </button>
              );
            })}
          </div>
        </>
      )}

      {tab === "motion" && (
        <>
          <Card className="mb-5">
            <p className="font-display mb-1 font-bold">الحركة</p>
            <p className="text-[11px] leading-relaxed text-muted-foreground">
              الحركةُ لغةٌ لا زينة: سرعتُها تقول إن كان الموقع رشيقاً أم متمهّلاً، ومنحنى
              تسارعها يقول إن كان صارماً أم ليّناً. المعاينات هنا <b>تتحرّك فعلاً</b> بالقيم
              نفسها التي سيتحرّك بها الموقع.
            </p>
            <p className="mt-3 rounded-2xl border border-border px-4 py-2.5 text-[11px] text-muted-foreground">
              مَن ضبط جهازه على «تقليل الحركة» تُوقَف عنده الحركةُ كلّها مهما اخترتِ —
              فعل ذلك لسببٍ يخصّه، ولا يصحّ أن يتجاوزه إعدادُ موقع.
            </p>
          </Card>

          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {MOTION_STYLES.map((x) => {
              const on = x.id === motion.id;
              return (
                <button
                  key={x.id}
                  type="button"
                  onClick={() => pickMotion(x)}
                  disabled={busy !== null}
                  className={`group relative overflow-hidden rounded-3xl border-2 p-2 text-right transition disabled:opacity-60 ${
                    on ? "border-primary shadow-bento" : "border-border hover:border-primary/50"
                  }`}
                >
                  <MotionPreview mo={x} skin={skin} />
                  <div className="flex items-center justify-between gap-2 px-1.5 pb-1 pt-2.5">
                    <div className="min-w-0">
                      <p className="truncate text-sm font-bold">{x.name}</p>
                      <p className="truncate text-[10px] text-muted-foreground">{x.hint}</p>
                    </div>
                    {busy === x.id ? (
                      <Loader2 className="size-4 shrink-0 animate-spin text-primary" />
                    ) : on ? (
                      <span className="grid size-6 shrink-0 place-items-center rounded-full bg-primary text-white">
                        <Check className="size-3.5" />
                      </span>
                    ) : null}
                  </div>
                </button>
              );
            })}
          </div>
        </>
      )}

      {tab === "mhome" && (
        <>
          <Card className="mb-5">
            <p className="font-display mb-1 font-bold">الواجهة الرئيسية على الهاتف</p>
            <p className="text-[11px] leading-relaxed text-muted-foreground">
              الهاتف ليس شاشةً مصغّرة بل ترتيبٌ آخر: الإبهام يصل إلى أسفل الشاشة لا أعلاها،
              والتمرير أرخص من الضغط، والصورة الكبيرة تُبعد الزرَّ عن اليد. هذه التنسيقات
              لا تمسّ الشاشات الأوسع إطلاقاً.
            </p>
          </Card>

          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {MOBILE_HOMES.map((x) => {
              const on = x.id === mHome.id;
              return (
                <button
                  key={x.id}
                  type="button"
                  onClick={() => pickMobileHome(x)}
                  disabled={busy !== null}
                  className={`group relative overflow-hidden rounded-3xl border-2 p-2 text-right transition disabled:opacity-60 ${
                    on ? "border-primary shadow-bento" : "border-border hover:border-primary/50"
                  }`}
                >
                  <MobileHomePreview mh={x} skin={skin} />
                  <div className="flex items-center justify-between gap-2 px-1.5 pb-1 pt-2.5">
                    <div className="min-w-0">
                      <p className="truncate text-sm font-bold">{x.name}</p>
                      <p className="truncate text-[10px] text-muted-foreground">{x.hint}</p>
                    </div>
                    {busy === x.id ? (
                      <Loader2 className="size-4 shrink-0 animate-spin text-primary" />
                    ) : on ? (
                      <span className="grid size-6 shrink-0 place-items-center rounded-full bg-primary text-white">
                        <Check className="size-3.5" />
                      </span>
                    ) : null}
                  </div>
                </button>
              );
            })}
          </div>
        </>
      )}

      {tab === "navbar" && (
        <>
          <Card className="mb-5">
            <p className="font-display mb-1 font-bold">شريط الواجهة الرئيسية</p>
            <p className="text-[11px] leading-relaxed text-muted-foreground">
              هذا شريط الصفحة التي يراها الزائر — مستقلّ عن «شريط الأدوات» الذي يظهر
              داخل لوحة الطالب والإدارة. كانا مفتاحاً واحداً فكان تغييرُ أحدهما يغيّر
              الآخر، وهما شاشتان مختلفتان تماماً.
            </p>
            {!content.navbarStyle && (
              <p className="mt-3 rounded-2xl border border-border px-4 py-2.5 text-[11px] text-muted-foreground">
                لم يُضبط بعد — يتبع حالياً شريط الأدوات ({bar.name}). اختر تصميماً ليصير مستقلّاً.
              </p>
            )}
          </Card>

          <Card className="mb-5">
            <p className="font-display mb-1 font-bold">إظهار الشريط</p>
            <p className="mb-3 text-[11px] text-muted-foreground">
              إخفاؤه يجعل الصفحة تبدأ بالهيرو مباشرة — والروابط تبقى في الفوتر.
            </p>
            <Switch
              label="إظهار شريط الواجهة"
              hint="مخفيّاً لا يظهر للزائر إطلاقاً"
              on={content.navbarHidden !== true}
              onChange={(v) => void saveContent({ navbarHidden: !v })}
            />
          </Card>

          <StickPicker
            label="تثبيت شريط الواجهة"
            value={content.navbarStick}
            onPick={(v) => void saveContent({ navbarStick: v })}
          />

          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {TOOLBAR_STYLES.map((x) => {
              const on = Boolean(content.navbarStyle) && x.id === navBar.id;
              return (
                <button
                  key={x.id}
                  type="button"
                  onClick={() => pickNavbar(x)}
                  disabled={busy !== null}
                  className={`group relative overflow-hidden rounded-3xl border-2 p-2 text-right transition disabled:opacity-60 ${
                    on ? "border-primary shadow-bento" : "border-border hover:border-primary/50"
                  }`}
                >
                  <ToolbarPreview bar={x} skin={skin} />
                  <div className="flex items-center justify-between gap-2 px-1.5 pb-1 pt-2.5">
                    <div className="min-w-0">
                      <p className="truncate text-sm font-bold">{x.name}</p>
                      <p className="truncate text-[10px] text-muted-foreground">{x.hint}</p>
                    </div>
                    {busy === x.id ? (
                      <Loader2 className="size-4 shrink-0 animate-spin text-primary" />
                    ) : on ? (
                      <span className="grid size-6 shrink-0 place-items-center rounded-full bg-primary text-white">
                        <Check className="size-3.5" />
                      </span>
                    ) : null}
                  </div>
                </button>
              );
            })}
          </div>
        </>
      )}

      {tab === "faq" && (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {FAQ_STYLES.map((x) => {
            const on = x.id === faqStyle.id;
            return (
              <button
                key={x.id}
                type="button"
                onClick={() => pickFaq(x)}
                disabled={busy !== null}
                className={`group relative overflow-hidden rounded-3xl border-2 p-2 text-right transition disabled:opacity-60 ${
                  on ? "border-primary shadow-bento" : "border-border hover:border-primary/50"
                }`}
              >
                <FaqPreview style={x} skin={skin} />
                <div className="flex items-center justify-between gap-2 px-1.5 pb-1 pt-2.5">
                  <div className="min-w-0">
                    <p className="truncate text-sm font-bold">{x.name}</p>
                    <p className="truncate text-[10px] text-muted-foreground">{x.hint}</p>
                  </div>
                  {busy === x.id ? (
                    <Loader2 className="size-4 shrink-0 animate-spin text-primary" />
                  ) : on ? (
                    <span className="grid size-6 shrink-0 place-items-center rounded-full bg-primary text-white">
                      <Check className="size-3.5" />
                    </span>
                  ) : null}
                </div>
              </button>
            );
          })}
        </div>
      )}

      {tab === "cta" && (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {CTA_STYLES.map((x) => {
            const on = x.id === ctaStyle.id;
            return (
              <button
                key={x.id}
                type="button"
                onClick={() => pickCta(x)}
                disabled={busy !== null}
                className={`group relative overflow-hidden rounded-3xl border-2 p-2 text-right transition disabled:opacity-60 ${
                  on ? "border-primary shadow-bento" : "border-border hover:border-primary/50"
                }`}
              >
                <CtaPreview style={x} skin={skin} />
                <div className="flex items-center justify-between gap-2 px-1.5 pb-1 pt-2.5">
                  <div className="min-w-0">
                    <p className="truncate text-sm font-bold">{x.name}</p>
                    <p className="truncate text-[10px] text-muted-foreground">{x.hint}</p>
                  </div>
                  {busy === x.id ? (
                    <Loader2 className="size-4 shrink-0 animate-spin text-primary" />
                  ) : on ? (
                    <span className="grid size-6 shrink-0 place-items-center rounded-full bg-primary text-white">
                      <Check className="size-3.5" />
                    </span>
                  ) : null}
                </div>
              </button>
            );
          })}
        </div>
      )}

      {tab === "footer" && (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {FOOTER_STYLES.map((x) => {
            const on = x.id === footerStyle.id;
            return (
              <button
                key={x.id}
                type="button"
                onClick={() => pickFooter(x)}
                disabled={busy !== null}
                className={`group relative overflow-hidden rounded-3xl border-2 p-2 text-right transition disabled:opacity-60 ${
                  on ? "border-primary shadow-bento" : "border-border hover:border-primary/50"
                }`}
              >
                <FooterPreview style={x} skin={skin} />
                <div className="flex items-center justify-between gap-2 px-1.5 pb-1 pt-2.5">
                  <div className="min-w-0">
                    <p className="truncate text-sm font-bold">{x.name}</p>
                    <p className="truncate text-[10px] text-muted-foreground">{x.hint}</p>
                  </div>
                  {busy === x.id ? (
                    <Loader2 className="size-4 shrink-0 animate-spin text-primary" />
                  ) : on ? (
                    <span className="grid size-6 shrink-0 place-items-center rounded-full bg-primary text-white">
                      <Check className="size-3.5" />
                    </span>
                  ) : null}
                </div>
              </button>
            );
          })}
        </div>
      )}

      {tab === "hero" && (
        <>
          {/*
            تنبيهٌ صادق: أربعة من هذه التصاميم تختلف في شكل الشارة وحدها،
            فإن كان نصُّها فارغاً لم يظهر بينها فرق — وأولى بالّلوحة أن
            تقول ذلك من أن تدع المستخدم يجرّب ولا يرى شيئاً.
          */}
          {!content.hero?.statusPill?.trim() && (
            <Card className="mb-5 border-amber-500/40 bg-amber-500/[0.07]">
              <p className="text-xs font-bold text-amber-700 dark:text-amber-400">
                نصّ الشارة فوق العنوان فارغ
              </p>
              <p className="mt-1 text-[11px] leading-relaxed text-muted-foreground">
                التصاميم التي تختلف في شكل الشارة (كبسولة · لوح · نقطة) لن يظهر بينها فرق
                حتى تكتبي نصّها من «تخصيص الموقع ← الهيرو».
              </p>
            </Card>
          )}

        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {HERO_STYLES.map((x) => {
            const on = x.id === heroStyle.id;
            return (
              <button
                key={x.id}
                type="button"
                onClick={() => pickHero(x)}
                disabled={busy !== null}
                className={`group relative overflow-hidden rounded-3xl border-2 p-2 text-right transition disabled:opacity-60 ${
                  on ? "border-primary shadow-bento" : "border-border hover:border-primary/50"
                }`}
              >
                <HeroStylePreview style={x} skin={skin} />
                <div className="flex items-center justify-between gap-2 px-1.5 pb-1 pt-2.5">
                  <div className="min-w-0">
                    <p className="truncate text-sm font-bold">{x.name}</p>
                    <p className="truncate text-[10px] text-muted-foreground">{x.hint}</p>
                  </div>
                  {busy === x.id ? (
                    <Loader2 className="size-4 shrink-0 animate-spin text-primary" />
                  ) : on ? (
                    <span className="grid size-6 shrink-0 place-items-center rounded-full bg-primary text-white">
                      <Check className="size-3.5" />
                    </span>
                  ) : null}
                </div>
              </button>
            );
          })}
        </div>
        </>
      )}

      {tab === "icons" && (
        <>
          <Card className="mb-5">
            <p className="font-display mb-1 font-bold">إطار الأيقونات وحركتها</p>
            <p className="text-[11px] leading-relaxed text-muted-foreground">
              الأيقونةُ في المنصّة لا تقف عاريةً: تحتها لوحٌ صغير يفصلها عمّا حولها ويعطيها وزناً.
              وكان هذا اللوح مكتوباً في كلّ موضعٍ على حدة، فصار سجلّاً واحداً يسري على بطاقات
              المؤشّرات والمزايا والخطط وبوابة الطالب واللوحة معاً.
            </p>
          </Card>

          <Section className="mb-5" title="ألوان الإطار" group="الألوان">
            <p className="mb-3 text-[11px] leading-relaxed text-muted-foreground">
              الشكلُ هيئةٌ واللونُ هوية — واللونُ المتروك يرث لون الثيم.
            </p>
            <div className="grid gap-2.5">
              {([
                ["bg", "لون السطح"],
                ["bg2", "اللون الثاني (للتدرّج)"],
                ["fg", "لون الرمز"],
                ["edge", "لون الحدّ"],
              ] as const).map(([k, label]) => (
                <div key={k} className="flex flex-wrap items-center gap-2">
                  <span className="w-32 shrink-0 text-xs font-semibold text-muted-foreground">{label}</span>
                  {SHELL_SWATCH.map((c) => (
                    <button
                      key={c}
                      type="button"
                      aria-label={c}
                      onClick={() => patchIcColors({ [k]: c })}
                      className={`size-7 rounded-lg border transition ${
                        (icColors[k] || "").toLowerCase() === c ? "border-primary ring-2 ring-primary/40" : "border-border"
                      }`}
                      style={{ background: c }}
                    />
                  ))}
                  <label
                    className="grid size-7 cursor-pointer place-items-center rounded-lg border border-dashed border-border"
                    style={{ background: icColors[k] || "transparent" }}
                  >
                    <input type="color" className="size-0 opacity-0" value={icColors[k] || "#173972"}
                      onChange={(e) => patchIcColors({ [k]: e.target.value })} />
                  </label>
                  {icColors[k] ? (
                    <button
                      type="button"
                      onClick={() => patchIcColors({ [k]: "" })}
                      className="rounded-lg border border-border px-2 py-1 text-[10px] font-bold text-muted-foreground transition hover:border-primary/40"
                    >
                      لون الثيم
                    </button>
                  ) : null}
                </div>
              ))}
            </div>
          </Section>

          <Section className="mb-5" title="عمق الرسوم (ثلاثية الأبعاد)" group="الرسوم">
            <p className="mb-3 text-[11px] leading-relaxed text-muted-foreground">
              الرسومُ مسطّحةٌ بطبعها. والبُعدُ الثالثُ لا يلزم منه إعادةُ رسمها: ظلالٌ صلبةٌ
              متراكبةٌ تتبع حدودَ الرسم نفسِه فتصنع له جانباً مبثوقاً، وطبقةُ إضاءةٍ
              مقنَّعةٌ بالشكل تُضيء أعلاه وتُظلم أسفلَه — فيصير جسماً لا صورة.
            </p>

            {/* المعاينةُ بالمرشّح نفسِه الذي سيُطبَّق — لا رسمٌ يحاكيه */}
            <div className="mb-4 grid grid-cols-4 gap-3 rounded-2xl bg-muted/40 p-3">
              {ART_DEPTHS.map((d) => {
                const on = (content.artDepth ?? "flat") === d.id;
                return (
                  <button
                    key={d.id}
                    type="button"
                    disabled={busy !== null}
                    onClick={async () => { setBusy(`dep-${d.id}`); await saveContent({ artDepth: d.id }); setBusy(null); }}
                    className={`flex flex-col items-center gap-2 rounded-2xl border p-3 transition ${
                      on ? "border-primary bg-primary/5 ring-2 ring-primary/30" : "border-border hover:border-primary/40"
                    }`}
                  >
                    <span className="relative grid size-14 place-items-center">
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img
                        src="/art/capStarsAnim.svg"
                        alt={d.name}
                        className="size-14 object-contain"
                        style={{
                          filter: [
                            artFilter(content.artTint, {
                              primary: content.theme.customPrimary ?? undefined,
                              gold: content.theme.customGold ?? undefined,
                            }),
                            depthFilter(d.id),
                          ].filter(Boolean).join(" ") || undefined,
                        }}
                      />
                      {depthLit(d.id) && (
                        <span
                          aria-hidden="true"
                          className="art-lit pointer-events-none absolute inset-0"
                          style={{
                            opacity: d.id === "deep" ? 0.55 : 0.34,
                            WebkitMaskImage: "url(/art/capStarsAnim.svg)",
                            maskImage: "url(/art/capStarsAnim.svg)",
                            WebkitMaskSize: "contain", maskSize: "contain",
                            WebkitMaskRepeat: "no-repeat", maskRepeat: "no-repeat",
                            WebkitMaskPosition: "center", maskPosition: "center",
                          }}
                        />
                      )}
                    </span>
                    <span className="text-center">
                      <span className="block text-[11px] font-bold">{d.name}</span>
                      <span className="block text-[10px] leading-tight text-muted-foreground">{d.hint}</span>
                    </span>
                  </button>
                );
              })}
            </div>
          </Section>

          <Section className="mb-5" title="ألوان الرسوم" group="الرسوم">
            <p className="mb-3 text-[11px] leading-relaxed text-muted-foreground">
              تُلوَّن الرسومُ بمرشّحٍ محسوب: تُسوَّى رماديّةً أوّلاً ثمّ تُصبغ باللون
              المطلوب، فتخرج أحاديّةَ اللون محتفظةً بتفاصيلها. والمرشّحُ يُحسب في
              المتصفّح فيتبدّل اللونُ بضغطةٍ بلا إعادة تصدير.
            </p>

            {/* المعاينةُ بالصور نفسِها وبالمرشّح نفسِه — لا رسمٌ يحاكيه */}
            <div className="mb-4 flex flex-wrap items-center gap-3 rounded-2xl bg-muted/40 p-3">
              {SHARI_ANIM.slice(0, 5).map((a) => (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  key={a.id}
                  src={`/art/${a.id}.svg`}
                  alt={a.name}
                  className="size-12 object-contain"
                  style={{
                    filter:
                      artFilter(content.artTint, {
                        primary: content.theme.customPrimary ?? undefined,
                        gold: content.theme.customGold ?? undefined,
                      }) || undefined,
                  }}
                />
              ))}
            </div>

            <div className="mb-3 flex flex-wrap gap-2">
              {TINT_MODES.map((m) => {
                const on = (content.artTint?.mode ?? "original") === m.id;
                return (
                  <button
                    key={m.id}
                    type="button"
                    disabled={busy !== null}
                    title={m.hint}
                    onClick={async () => {
                      setBusy(`tint-${m.id}`);
                      await saveContent({ artTint: { ...(content.artTint ?? {}), mode: m.id } });
                      setBusy(null);
                    }}
                    className={`rounded-2xl border px-3.5 py-2 text-xs font-bold transition disabled:opacity-60 ${
                      on ? "border-primary bg-primary/10 text-primary" : "border-border text-muted-foreground hover:border-primary/40"
                    }`}
                  >
                    {busy === `tint-${m.id}` ? <Loader2 className="inline size-3.5 animate-spin" /> : null} {m.name}
                  </button>
                );
              })}
            </div>

            {content.artTint?.mode === "custom" && (
              <div className="mb-3 flex flex-wrap items-center gap-2">
                <span className="w-24 shrink-0 text-xs font-semibold text-muted-foreground">اللون</span>
                {SHELL_SWATCH.map((c) => (
                  <button
                    key={c}
                    type="button"
                    aria-label={c}
                    onClick={() => void saveContent({ artTint: { ...(content.artTint ?? {}), mode: "custom", color: c } })}
                    className={`size-7 rounded-lg border transition ${
                      (content.artTint?.color ?? "").toLowerCase() === c ? "border-primary ring-2 ring-primary/40" : "border-border"
                    }`}
                    style={{ background: c }}
                  />
                ))}
                <label
                  className="grid size-7 cursor-pointer place-items-center rounded-lg border border-dashed border-border"
                  style={{ background: content.artTint?.color || "transparent" }}
                >
                  <input
                    type="color"
                    className="size-0 opacity-0"
                    value={content.artTint?.color || "#2c456a"}
                    onChange={(e) => void saveContent({ artTint: { ...(content.artTint ?? {}), mode: "custom", color: e.target.value } })}
                  />
                </label>
              </div>
            )}

            {!["original", "soft"].includes(content.artTint?.mode ?? "original") && (
              <label className="flex items-center gap-3">
                <span className="w-24 shrink-0 text-[11px] font-semibold text-muted-foreground">
                  الشدّة {(content.artTint?.strength ?? 100).toLocaleString("ar-EG")}٪
                </span>
                <input
                  type="range"
                  min={0}
                  max={100}
                  step={5}
                  value={content.artTint?.strength ?? 100}
                  onChange={(e) => void saveContent({ artTint: { ...(content.artTint ?? {}), strength: Number(e.target.value) } })}
                  className="h-1.5 flex-1 accent-primary"
                />
              </label>
            )}
          </Section>

          <Section className="mb-5" title="ظلال العناصر" group="الحركة والظلال">
            <p className="mb-3 text-[11px] leading-relaxed text-muted-foreground">
              الظلُّ معلومةُ ارتفاعٍ لا زخرفة: يقول للعين أيُّ لوحٍ أقربُ إليها. وكلُّ ظلٍّ هنا
              طبقتان — قريبةٌ ترسم الحافّة وبعيدةٌ تعطي الارتفاع — ولونُه من لون النصّ لا أسودُ
              خالص، فالأسودُ يُوسّخ الورقَ الدافئ.
            </p>
            <div className="flex flex-wrap gap-2">
              {SHADOW_STYLES.map((x) => {
                const on = (content.shadowStyle ?? DEFAULT_SHADOW) === x.id;
                return (
                  <button
                    key={x.id}
                    type="button"
                    disabled={busy !== null}
                    title={x.hint}
                    onClick={async () => { setBusy(`sh-${x.id}`); await saveContent({ shadowStyle: x.id }); setBusy(null); }}
                    className={`rounded-2xl border px-3.5 py-2 text-xs font-bold transition disabled:opacity-60 ${
                      on ? "border-primary bg-primary/10 text-primary" : "border-border text-muted-foreground hover:border-primary/40"
                    }`}
                  >
                    {busy === `sh-${x.id}` ? <Loader2 className="inline size-3.5 animate-spin" /> : null} {x.name}
                  </button>
                );
              })}
            </div>
            <p className="mt-3 text-[10px] text-muted-foreground">
              الحاليّ: {findShadow(content.shadowStyle).name} — {findShadow(content.shadowStyle).hint}
            </p>
          </Section>

          <Section className="mb-5" title="الحركة الدائمة" group="الحركة والظلال">
            <p className="mb-3 text-[11px] leading-relaxed text-muted-foreground">
              حركاتُ الدخول تقع مرّةً حين يظهر العنصر ثمّ تسكن الصفحةُ أبداً. وهذه لا تتوقّف ما
              دامت الصفحةُ مفتوحة. والتأخيرُ يُشتقّ من ترتيب اللوح فيتموّج المشهدُ ولا يخفق
              كآلة، والمتنُ لا يتحرّك لأنّ العين تتبع الحرف.
            </p>

            <div className="mb-4 flex flex-wrap gap-2">
              {AMBIENTS.map((x) => {
                const on = (content.ambient ?? DEFAULT_AMBIENT) === x.id;
                return (
                  <button
                    key={x.id}
                    type="button"
                    disabled={busy !== null}
                    title={x.hint}
                    onClick={async () => { setBusy(`amb-${x.id}`); await saveContent({ ambient: x.id }); setBusy(null); }}
                    className={`rounded-2xl border px-3.5 py-2 text-xs font-bold transition disabled:opacity-60 ${
                      on ? "border-primary bg-primary/10 text-primary" : "border-border text-muted-foreground hover:border-primary/40"
                    }`}
                  >
                    {busy === `amb-${x.id}` ? <Loader2 className="inline size-3.5 animate-spin" /> : null} {x.name}
                  </button>
                );
              })}
            </div>

            <div className="flex flex-wrap items-center gap-2">
              <span className="text-[11px] font-semibold text-muted-foreground">السرعة:</span>
              {AMBIENT_SPEEDS.map((v) => {
                const on = (content.ambientSpeed ?? "normal") === v.id;
                return (
                  <button
                    key={v.id}
                    type="button"
                    disabled={busy !== null}
                    onClick={async () => { setBusy(`sp-${v.id}`); await saveContent({ ambientSpeed: v.id }); setBusy(null); }}
                    className={`rounded-full border px-3 py-1.5 text-[11px] font-bold transition disabled:opacity-60 ${
                      on ? "border-primary bg-primary/10 text-primary" : "border-border text-muted-foreground hover:border-primary/40"
                    }`}
                  >
                    {v.name}
                  </button>
                );
              })}
              <span className="mr-auto text-[10px] text-muted-foreground">
                الحاليّة: {findAmbient(content.ambient).name}
              </span>
            </div>
          </Section>

          <Section className="mb-5" title="العمق الثلاثي" group="الحركة والظلال">
            <p className="mb-3 text-[11px] leading-relaxed text-muted-foreground">
              كلُّ لوحٍ يميل نحو المؤشّر بحسب موضعه هو — والتفاوتُ بين الألواح هو ما تقرؤه
              العينُ مجسّماً، لا شدّةُ الميل. وعلى الهاتف يُقاد بميل الجهاز نفسِه. ومن ضبط
              جهازه على «تقليل الحركة» لا يُمال عنده شيء.
            </p>
            <div className="flex flex-wrap gap-2">
              {([
                ["off", "بلا عمق", "الصفحة مسطّحة كما كانت"],
                ["soft", "خفيف", "ميلةٌ لطيفة تُحسّ ولا تُلفت"],
                ["deep", "عميق", "ميلٌ ظاهرٌ وارتفاعٌ واضح"],
                ["tilt", "ميلٌ فقط", "دورانٌ قويٌّ بلا ارتفاع"],
                ["extreme", "الأقصى", "مجسّمٌ صريح — منظورٌ قريبٌ وميلٌ كبير"],
              ] as const).map(([id, name, hint]) => {
                const on = (content.hero3d ?? "off") === id;
                return (
                  <button
                    key={id}
                    type="button"
                    disabled={busy !== null}
                    onClick={async () => { setBusy(id); await saveContent({ hero3d: id }); setBusy(null); }}
                    title={hint}
                    className={`rounded-2xl border px-4 py-2.5 text-xs font-bold transition disabled:opacity-60 ${
                      on ? "border-primary bg-primary/10 text-primary" : "border-border text-muted-foreground hover:border-primary/40"
                    }`}
                  >
                    {busy === id ? <Loader2 className="inline size-3.5 animate-spin" /> : null} {name}
                  </button>
                );
              })}
            </div>
          </Section>

          <Section className="mb-4" title="مكتبة رسوم الموقع" group="الرسوم">
            <p className="text-[11px] leading-relaxed text-muted-foreground">
              المكتبةُ المختارة تسري على رسوم المنصّة كلِّها — الساكنةُ والمتحرّكةُ
              والحالاتُ الفارغةُ معاً. و<b>ليست مئةَ طقمٍ مرسوم</b>: مئةُ طقمٍ بيدٍ واحدةٍ
              يعني ألفاً وثمانمئة لوحة، ولا تُرسم بجودةٍ واحدة — تخرج منها خمسٌ حسنةٌ
              وبقيّةٌ حشو. بل هندسةٌ واحدةٌ محكمةٌ ومئةُ معالجةٍ لها:
              <b> عشرُ لوحاتِ لونٍ</b> (أيُّ الألوان الثلاثة يكون جسماً وأيُّها سطحاً
              وأيُّها زخرفة — وتبديلُ الأدوار وحدَه يقلب الرسمَ رأساً على عقب) مضروبةً في
              <b> عشرِ تشطيبات</b>: خمسٍ للسطح (مسطّح · على قرص · بهالة · بظلّ · بحدّ)
              وخمسٍ تُحرّك الرسمَ كلَّه (يطفو · يتنفّس · يتمايل · يدور · ينبض) فوق حركته
              الداخليّة. ومن طلب تقليلَ الحركة في نظامه أُعفي منها.
            </p>

            <div className="mb-8 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
              {VECTOR_LIBS.map((x) => {
                const on = x.id === vecLib.id;
                return (
                  <button
                    key={x.id}
                    type="button"
                    onClick={() => pickVecLib(x)}
                    disabled={busy !== null}
                    className={`rounded-3xl border-2 p-3 text-right transition disabled:opacity-60 ${
                      on ? "border-primary shadow-bento" : "border-border hover:border-primary/50"
                    }`}
                  >
                    {/*
                      عيّنةٌ حيّةٌ بالمكتبة نفسِها لا وصفٌ لها.
                      وأصنافُ المكتبة تُكتب على غلاف العيّنة وحدَها — فتُرى
                      كلُّ بطاقةٍ بمكتبتها في الصفحة نفسِها قبل أن تُعتمد،
                      ولا يُضطرّ الأستاذُ أن يجرّب أربعين ويعود.
                    */}
                    <div className={`mb-2.5 grid place-items-center rounded-2xl bg-muted/50 px-2 py-4 ${vectorLibClass(x)}`}>
                      <ShariVector id={SHARI_VECTOR[1].id} size={64} />
                    </div>
                    <div className="flex items-center justify-between gap-2 px-1">
                      <p className="min-w-0 truncate text-xs font-bold">{x.name}</p>
                      {busy === `vl-${x.id}` ? (
                        <Loader2 className="size-4 shrink-0 animate-spin text-primary" />
                      ) : on ? (
                        <span className="grid size-5 shrink-0 place-items-center rounded-full bg-primary text-white">
                          <Check className="size-3" />
                        </span>
                      ) : null}
                    </div>
                  </button>
                );
              })}
            </div>

            {/* اللوحاتُ الستّ بالمكتبة المختارة — لتُرى مجتمعةً قبل الاعتماد */}
            <Card className={`mb-8 ${vectorLibClass(vecLib)}`}>
              <p className="font-display mb-3 text-sm font-bold">
                رسوم «{vecLib.name}» ({SHARI_VECTOR.length.toLocaleString("ar-EG")} لوحات)
              </p>
              <div className="flex flex-wrap items-center justify-center gap-6">
                {SHARI_VECTOR.map((v) => (
                  <div key={v.id} className="grid place-items-center gap-1.5">
                    <ShariVector id={v.id} size={78} />
                    <span className="text-[10px] text-muted-foreground">{v.name}</span>
                  </div>
                ))}
              </div>
            </Card>
          </Section>

          <Section className="mb-4" title="مكتبة الأيقونات" group="الأيقونات">
            <p className="text-[11px] leading-relaxed text-muted-foreground">
              المكتبةُ المختارة تسري على كلّ رمزٍ في المنصّة — القائمة الجانبية وشريط الهاتف
              ورأس اللوحة معاً. وثلاثُ هندساتٍ لا عشر: خطّيّةٌ ومصمتةٌ وكوفيّة، والمكتباتُ
              معالجاتٌ لها في السُمك والنهايات والتعبئة — وهكذا تُبنى مكتباتُ الأيقونات
              المعروفة أصلاً، هندسةٌ واحدة بأوزانٍ عدّة، لا عشرُ رسماتٍ للرمز الواحد فيختلّ
              اتّساقُ المجموعة.
            </p>

            <div className="mb-8 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
              {ICON_LIBS.map((x) => {
                const on = x.id === iconLib.id;
                return (
                  <button
                    key={x.id}
                    type="button"
                    onClick={() => pickLib(x)}
                    disabled={busy !== null}
                    className={`rounded-3xl border-2 p-3 text-right transition disabled:opacity-60 ${
                      on ? "border-primary shadow-bento" : "border-border hover:border-primary/50"
                    }`}
                  >
                    {/* عيّنةٌ من ثمانية رموزٍ بالمكتبة نفسِها — لا وصفٌ لها */}
                    <div className="mb-2.5 flex flex-wrap items-center justify-center gap-3 rounded-2xl bg-muted/50 px-2 py-3 text-primary">
                      {ICON_SLOTS.slice(0, 8).map((sl) => (
                        <LibGlyph key={sl} lib={x} slot={sl} className="size-5" />
                      ))}
                    </div>
                    <div className="flex items-center justify-between gap-2 px-1">
                      <div className="min-w-0">
                        <p className="truncate text-sm font-bold">{x.name}</p>
                        <p className="truncate text-[10px] text-muted-foreground">{x.hint}</p>
                      </div>
                      {busy === `il-${x.id}` ? (
                        <Loader2 className="size-4 shrink-0 animate-spin text-primary" />
                      ) : on ? (
                        <span className="grid size-6 shrink-0 place-items-center rounded-full bg-primary text-white">
                          <Check className="size-3.5" />
                        </span>
                      ) : null}
                    </div>
                  </button>
                );
              })}
            </div>

            {/* كلُّ خانات المكتبة المختارة — لتُرى قبل أن تُعتمد */}
            <Card className="mb-8">
              <p className="font-display mb-3 text-sm font-bold">
                خانات «{iconLib.name}» ({ICON_SLOTS.length.toLocaleString("ar-EG")} رمزاً)
              </p>
              <div className="flex flex-wrap gap-2">
                {ICON_SLOTS.map((sl) => (
                  <span
                    key={sl}
                    className="grid size-11 place-items-center rounded-2xl border border-border text-primary"
                  >
                    <LibGlyph lib={iconLib} slot={sl} className="size-5" />
                  </span>
                ))}
              </div>
            </Card>
          </Section>

          {/* ---------- ٢٠ إطاراً ---------- */}
          <p className="font-display mb-3 font-bold">الإطار ({ICON_FRAMES.length.toLocaleString("ar-EG")})</p>
          <div className="mb-8 grid gap-3 grid-cols-2 sm:grid-cols-4 lg:grid-cols-5">
            {ICON_FRAMES.map((x) => {
              const on = x.id === iconFrame.id;
              return (
                <button
                  key={x.id}
                  type="button"
                  onClick={() => pickFrame(x)}
                  disabled={busy !== null}
                  className={`rounded-3xl border-2 p-2 text-right transition disabled:opacity-60 ${
                    on ? "border-primary shadow-bento" : "border-border hover:border-primary/50"
                  }`}
                >
                  <IconFramePreview frame={x} cover={iconCover} colors={icColors} />
                  <div className="flex items-center justify-between gap-2 px-1 pb-0.5 pt-2">
                    <div className="min-w-0">
                      <p className="truncate text-xs font-bold">{x.name}</p>
                      <p className="truncate text-[10px] text-muted-foreground">{x.hint}</p>
                    </div>
                    {busy === x.id ? (
                      <Loader2 className="size-4 shrink-0 animate-spin text-primary" />
                    ) : on ? (
                      <span className="grid size-5 shrink-0 place-items-center rounded-full bg-primary text-white">
                        <Check className="size-3" />
                      </span>
                    ) : null}
                  </div>
                </button>
              );
            })}
          </div>

          <Section className="mb-4 mt-8" title="٢٠ غلافاً" group="الأيقونات">
            <p className="text-[11px] leading-relaxed text-muted-foreground">
              الإطارُ يحكم اللوحَ تحت الأيقونة، والغلافُ يحكم ما حوله: حلقةٌ تحيطه، أو هالةٌ
              تتسرّب من خلفه، أو نقشٌ يملؤه، أو شارةٌ على حافّته. ومحوران لا يتداخلان فيُركَّب
              أيُّ غلافٍ على أيّ إطار.
            </p>

            <div className="mb-8 grid gap-3 grid-cols-2 sm:grid-cols-4 lg:grid-cols-5">
              {ICON_COVERS.map((x) => {
                const on = x.id === iconCover.id;
                return (
                  <button
                    key={x.id}
                    type="button"
                    onClick={() => pickCover(x)}
                    disabled={busy !== null}
                    className={`rounded-3xl border-2 p-2 text-right transition disabled:opacity-60 ${
                      on ? "border-primary shadow-bento" : "border-border hover:border-primary/50"
                    }`}
                  >
                    <IconFramePreview frame={iconFrame} cover={x} colors={icColors} />
                    <div className="flex items-center justify-between gap-2 px-1 pb-0.5 pt-2">
                      <div className="min-w-0">
                        <p className="truncate text-xs font-bold">{x.name}</p>
                        <p className="truncate text-[10px] text-muted-foreground">{x.hint}</p>
                      </div>
                      {busy === `iv-${x.id}` ? (
                        <Loader2 className="size-4 shrink-0 animate-spin text-primary" />
                      ) : on ? (
                        <span className="grid size-5 shrink-0 place-items-center rounded-full bg-primary text-white">
                          <Check className="size-3" />
                        </span>
                      ) : null}
                    </div>
                  </button>
                );
              })}
            </div>
          </Section>

          <Section className="mb-4" title="٤٠ حركة" group="الأيقونات">
            <p className="text-[11px] leading-relaxed text-muted-foreground">
              تُختار واحدةٌ فتسري على أيقونات المنصّة كلِّها — لأنّ الحركة لغةٌ لا زينة، وصفحةٌ كلُّ
              أيقونةٍ فيها تتحرّك حركةً مختلفة تقول ضجيجاً لا معنى. و«عند المرور» تنتظر اليد فتردّ
              عليها، وهي الأنسب للوحة. والمعاينةُ هنا حيّةٌ بالأصناف نفسِها.
            </p>

            <div className="grid gap-3 grid-cols-2 sm:grid-cols-4 lg:grid-cols-5">
              {ICON_MOTIONS.map((x) => {
                const on = x.id === iconMotion.id;
                return (
                  <button
                    key={x.id}
                    type="button"
                    onClick={() => pickIconMotion(x)}
                    disabled={busy !== null}
                    className={`rounded-3xl border-2 p-2 text-right transition disabled:opacity-60 ${
                      on ? "border-primary shadow-bento" : "border-border hover:border-primary/50"
                    }`}
                  >
                    <IconFramePreview frame={iconFrame} cover={iconCover} motion={x} colors={icColors} />
                    <div className="flex items-center justify-between gap-2 px-1 pb-0.5 pt-2">
                      <div className="min-w-0">
                        <p className="truncate text-xs font-bold">{x.name}</p>
                        <p className="truncate text-[10px] text-muted-foreground">
                          {x.trigger === "hover" ? "عند المرور" : "دائمة"}
                        </p>
                      </div>
                      {busy === `im-${x.id}` ? (
                        <Loader2 className="size-4 shrink-0 animate-spin text-primary" />
                      ) : on ? (
                        <span className="grid size-5 shrink-0 place-items-center rounded-full bg-primary text-white">
                          <Check className="size-3" />
                        </span>
                      ) : null}
                    </div>
                  </button>
                );
              })}
            </div>
          </Section>
        </>
      )}

      {tab === "shell" && (
        <>
          <Card className="mb-5">
            <p className="font-display mb-1 font-bold">لوح القسم الرئيسي</p>
            <p className="text-[11px] leading-relaxed text-muted-foreground">
              هذا يحكم اللوحَ نفسَه: سطحَه وحوافَّه وحدَّه وارتفاعَه — لا ما بداخله.
              وما بداخله (العنوان والشارة والزخرفة) يحكمه لسانُ «تصميم الرئيسية».
              والمحوران لا يتداخلان، فيُركَّب أيُّهما مع أيّ.
            </p>
          </Card>

          <Card className="mb-5 grid gap-5">
            <div>
              <p className="font-display mb-1 text-sm font-bold">ألوانه</p>
              <p className="mb-3 text-[11px] leading-relaxed text-muted-foreground">
                التصميمُ شكلٌ واللونُ هوية — فمن أراد لوحاً مستديراً بلون منصّته لا يُجبَر
                على لونِ مصمّمه. واللونُ المتروك يرث لون الثيم.
              </p>
              <div className="grid gap-2.5">
                {([
                  ["bg", "لون السطح"],
                  ["bg2", "اللون الثاني (للتدرّج)"],
                  ["edge", "لون الحافّة"],
                  ["text", "لون النصّ"],
                ] as const).map(([k, label]) => (
                  <div key={k} className="flex flex-wrap items-center gap-2">
                    <span className="w-32 shrink-0 text-xs font-semibold text-muted-foreground">{label}</span>
                    {SHELL_SWATCH.map((c) => (
                      <button
                        key={c}
                        type="button"
                        aria-label={c}
                        onClick={() => patchShell({ [k]: c })}
                        className={`size-7 rounded-lg border transition ${
                          (shOpts[k] || "").toLowerCase() === c ? "border-primary ring-2 ring-primary/40" : "border-border"
                        }`}
                        style={{ background: c }}
                      />
                    ))}
                    <label
                      className="grid size-7 cursor-pointer place-items-center rounded-lg border border-dashed border-border"
                      style={{ background: shOpts[k] || "transparent" }}
                    >
                      <input
                        type="color"
                        className="size-0 opacity-0"
                        value={shOpts[k] || "#173972"}
                        onChange={(e) => patchShell({ [k]: e.target.value })}
                      />
                    </label>
                    {shOpts[k] ? (
                      <button
                        type="button"
                        onClick={() => patchShell({ [k]: "" })}
                        className="rounded-lg border border-border px-2 py-1 text-[10px] font-bold text-muted-foreground transition hover:border-primary/40"
                      >
                        لون الثيم
                      </button>
                    ) : null}
                  </div>
                ))}
              </div>
            </div>

            <div>
              <p className="font-display mb-1 text-sm font-bold">زيادة طوله لأسفل</p>
              <p className="mb-3 text-[11px] leading-relaxed text-muted-foreground">
                تُضاف مساحةً تحت المحتوى لا ارتفاعاً ثابتاً — فيبقى القسم يتمدّد بمحتواه
                ولا يُقصّ منه شيء على الشاشات الضيّقة.
              </p>
              <label className="flex items-center gap-3">
                <span className="w-32 shrink-0 text-xs font-semibold text-muted-foreground">
                  {(shOpts.extra ?? 0).toLocaleString("ar-EG")} بكسل
                </span>
                <input
                  type="range"
                  min={0}
                  max={400}
                  step={10}
                  value={shOpts.extra ?? 0}
                  onChange={(e) => patchShell({ extra: Number(e.target.value) })}
                  className="h-1.5 flex-1 accent-primary"
                />
              </label>
            </div>
          </Card>

          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {HERO_SHELLS.map((x) => {
              const on = x.id === shell.id;
              return (
                <button
                  key={x.id}
                  type="button"
                  onClick={() => pickShell(x)}
                  disabled={busy !== null}
                  className={`group relative overflow-hidden rounded-3xl border-2 p-2 text-right transition disabled:opacity-60 ${
                    on ? "border-primary shadow-bento" : "border-border hover:border-primary/50"
                  }`}
                >
                  <HeroShellPreview shell={x} skin={skin} opts={shOpts} />
                  <div className="flex items-center justify-between gap-2 px-1.5 pb-1 pt-2.5">
                    <div className="min-w-0">
                      <p className="truncate text-sm font-bold">{x.name}</p>
                      <p className="truncate text-[10px] text-muted-foreground">{x.hint}</p>
                    </div>
                    {busy === x.id ? (
                      <Loader2 className="size-4 shrink-0 animate-spin text-primary" />
                    ) : on ? (
                      <span className="grid size-6 shrink-0 place-items-center rounded-full bg-primary text-white">
                        <Check className="size-3.5" />
                      </span>
                    ) : null}
                  </div>
                </button>
              );
            })}
          </div>
        </>
      )}

      {tab === "plans" && (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {PLANS_STYLES.map((x) => {
            const on = x.id === plansStyle.id;
            return (
              <button
                key={x.id}
                type="button"
                onClick={() => pickPlans(x)}
                disabled={busy !== null}
                className={`group relative overflow-hidden rounded-3xl border-2 p-2 text-right transition disabled:opacity-60 ${
                  on ? "border-primary shadow-bento" : "border-border hover:border-primary/50"
                }`}
              >
                <PlansPreview style={x} skin={skin} />
                <div className="flex items-center justify-between gap-2 px-1.5 pb-1 pt-2.5">
                  <div className="min-w-0">
                    <p className="truncate text-sm font-bold">{x.name}</p>
                    <p className="truncate text-[10px] text-muted-foreground">{x.hint}</p>
                  </div>
                  {busy === x.id ? (
                    <Loader2 className="size-4 shrink-0 animate-spin text-primary" />
                  ) : on ? (
                    <span className="grid size-6 shrink-0 place-items-center rounded-full bg-primary text-white">
                      <Check className="size-3.5" />
                    </span>
                  ) : null}
                </div>
              </button>
            );
          })}
        </div>
      )}

      {tab === "home" && (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {HOME_LAYOUTS.map((l) => {
            const on = l.id === home.id;
            return (
              <button
                key={l.id}
                type="button"
                onClick={() => pickHome(l)}
                disabled={busy !== null}
                className={`group relative overflow-hidden rounded-3xl border-2 p-2 text-right transition disabled:opacity-60 ${
                  on ? "border-primary shadow-bento" : "border-border hover:border-primary/50"
                }`}
              >
                <HomeLayoutPreview layout={l} />
                <div className="flex items-center justify-between gap-2 px-1.5 pb-1 pt-2.5">
                  <div className="min-w-0">
                    <p className="truncate text-sm font-bold">{l.name}</p>
                    <p className="truncate text-[10px] text-muted-foreground">{l.hint}</p>
                  </div>
                  {busy === l.id ? (
                    <Loader2 className="size-4 shrink-0 animate-spin text-primary" />
                  ) : on ? (
                    <span className="grid size-6 shrink-0 place-items-center rounded-full bg-primary text-white">
                      <Check className="size-3.5" />
                    </span>
                  ) : null}
                </div>
              </button>
            );
          })}
        </div>
      )}

      <Card className="mt-6">
        <p className="text-xs leading-relaxed text-muted-foreground">
          الثيم يحدّد الألوان، والهيئة تحدّد الشكل (حوافّ اللوح والبطاقات وزخرفة الحافّة)، والتخطيط يحدّد ترتيب لوح الترحيب
          والمؤشّرات وبطاقات الكورسات، وتخطيط الواجهة الرئيسية يحدّد شكل الهيرو وترتيب الأقسام
          وعرض الحاوية وكثافة التباعد والفاصل بينها. الثلاثة مستقلّة — أي تركيبة تعمل.
        </p>
      </Card>
    </>
  );
}

function TabBtn({
  active, onClick, icon, children,
}: { active: boolean; onClick: () => void; icon: React.ReactNode; children: React.ReactNode }) {
  return (
    <button
      onClick={onClick}
      className={`inline-flex items-center gap-2 rounded-full px-4 py-2.5 text-sm font-bold transition ${
        active ? "btn-glow text-white" : "border border-border text-muted-foreground hover:text-foreground"
      }`}
    >
      {icon}
      {children}
    </button>
  );
}
