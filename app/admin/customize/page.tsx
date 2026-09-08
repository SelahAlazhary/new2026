"use client";

/** تخصيص الموقع — تحكّم فعلي في الهوية والنصوص والألوان والصور والأسعار. */
import { useRef, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { Moon, Sun, Check, Upload, Save, ExternalLink, Palette, Type, ImageIcon, Frame, SlidersHorizontal, Trash2, Layers, Plus } from "lucide-react";
import { PageHeader, Card } from "@/components/dashboard/ui";
import { Button } from "@/components/ui/primitives";
import { useContent } from "@/components/content/content-provider";
import { ImageStudio } from "@/components/admin/image-studio";
import type { StageCard } from "@/lib/utils/types";
import { HeroFrame } from "@/components/sections/hero-frame";
import { FRAME_SHAPES, findFrame, DEFAULT_FRAME } from "@/lib/art/frame-shapes";
import type { SiteContent, Preset, ColorSpec, ElementStyle } from "@/lib/utils/types";
import { mediaSrc } from "@/lib/utils/media";
import { SIGNATURES } from "@/lib/brand/brand-signature";
import { BrandLockup } from "@/components/brand/logo";
import { Section } from "@/components/dashboard/section";

const ELEMENTS: { key: string; label: string; fill?: boolean; text?: boolean }[] = [
  { key: "section.features", label: "قسم: لماذا نحن" },
  { key: "section.freeLive", label: "قسم: البث المجاني" },
  { key: "section.plans", label: "قسم: الخطط" },
  { key: "section.faq", label: "قسم: الأسئلة الشائعة" },
  { key: "section.cta", label: "قسم: دعوة التسجيل" },
  { key: "nav.register", label: "زر التسجيل (الشريط العلوي)", fill: true, text: true },
  { key: "hero.primary", label: "زر «أنشئ حساب» (الهيرو)", fill: true, text: true },
  { key: "hero.secondary", label: "زر «شاهد درساً» (الهيرو)", text: true },
  { key: "hero.whatsapp", label: "زر واتساب (الهيرو)", text: true },
  { key: "hero.statusPill", label: "شارة الحالة (الهيرو)", text: true },
  { key: "cta.primary", label: "زر قسم الدعوة", fill: true, text: true },
];

const PRESETS: { id: Preset; label: string; swatch: string }[] = [
  { id: "midad", label: "مِداد — حبر وذهب", swatch: "#233b8b" },
  { id: "nile", label: "نِيلي — أزرق المحبرة", swatch: "#095e86" },
  { id: "andalus", label: "أندلسي — زيتوني", swatch: "#245c4b" },
  { id: "rumman", label: "رُمّاني — عنّابي", swatch: "#87263a" },
];

type Tab = "identity" | "theme" | "images" | "frame" | "stages" | "links" | "elements";

/** ألوان جاهزة لإطار الصورة. */
const FRAME_SWATCH = ["#233b8b", "#095e86", "#245c4b", "#87263a", "#8a6212", "#4a3570", "#1f5a5e", "#6b3a1e"];

export default function CustomizePage() {
  /* الصورة تمرّ باستوديو القصّ وإزالة الخلفية قبل الرفع — الهيرو أكثر
     صورة يراها الزائر، فتستحقّ تنظيفاً قبل أن تُنشر. */
  const [studio, setStudio] = useState<{ file: File; target: "avatar" | "logo" | "signature" } | null>(null);

  /** إعدادات الإطار تعيش داخل hero فتُدمج معه لا تستبدله. */
  /** المراحل تُحفظ كاملة — مصفوفة تُستبدل لا تُدمج. */
  const saveStages = (next: StageCard[]) => {
    set({ stages: next });
    return saveContent({ stages: next });
  };

  const saveHero = (patch: Record<string, unknown>) => {
    set({ hero: { ...form.hero, ...patch } });
    return saveContent({ hero: { ...content.hero, ...patch } });
  };
  const { content, db, saveContent, uploadImage, layout, preset, customPrimary, toggleLayout, setPreset, setCustomPrimary } = useContent();
  const googleReady = Boolean(db?.integrations?.google?.connected);
  const [tab, setTab] = useState<Tab>("identity");
  const [form, setForm] = useState<SiteContent>(content);
  const [saved, setSaved] = useState(false);
  const [saving, setSaving] = useState(false);

  const set = (patch: Partial<SiteContent>) => setForm((f) => ({ ...f, ...patch }));
  const setTeacher = (patch: Partial<SiteContent["teacher"]>) => setForm((f) => ({ ...f, teacher: { ...f.teacher, ...patch } }));
  const setSocial = (patch: Partial<SiteContent["social"]>) => setForm((f) => ({ ...f, social: { ...f.social, ...patch } }));
  const setDeveloper = (patch: Partial<NonNullable<SiteContent["developer"]>>) =>
    setForm((f) => ({ ...f, developer: { ...(f.developer ?? {}), ...patch } }));
  const setSupport = (patch: Partial<NonNullable<SiteContent["support"]>>) => setForm((f) => ({ ...f, support: { ...(f.support ?? {}), ...patch } }));
  const setCta = (patch: Partial<NonNullable<SiteContent["cta"]>>) => setForm((f) => ({ ...f, cta: { ...(f.cta ?? {}), ...patch } }));
  const setPlansSection = (patch: Partial<NonNullable<SiteContent["plansSection"]>>) =>
    setForm((f) => ({ ...f, plansSection: { ...(f.plansSection ?? {}), ...patch } }));
  const setHeroImage = (patch: Partial<NonNullable<SiteContent["hero"]["image"]>>) =>
    setForm((f) => ({ ...f, hero: { ...f.hero, image: { ...(f.hero.image ?? {}), ...patch } } }));
  const setUi = (key: string, patch: Partial<ElementStyle>) =>
    setForm((f) => ({ ...f, ui: { ...(f.ui ?? {}), [key]: { ...(f.ui?.[key] ?? {}), ...patch } } }));

  const commit = async () => {
    setSaving(true);
    // الحفاظ على الثيم/الفريم المطبّقين فوراً حتى لا تُكتب نسخة form القديمة فوقهما
    await saveContent({ ...form, theme: content.theme, hero: { ...form.hero, frame: content.hero.frame } });
    setSaving(false);
    setSaved(true);
    setTimeout(() => setSaved(false), 1800);
  };

  return (
    <>
      <PageHeader
        title="تخصيص الموقع"
        subtitle="عدّل الهوية والألوان والنصوص والصور — وكل تغيير يُحفظ ويظهر مباشرة على الموقع"
        action={
          <div className="flex items-center gap-2">
            <Link href="/" target="_blank" className="inline-flex items-center gap-1 rounded-full border border-border px-4 py-2.5 text-sm font-bold transition hover:border-primary hover:text-primary">
              <ExternalLink className="size-4" /> معاينة
            </Link>
            <Button className="px-5 py-2.5" onClick={commit} disabled={saving}>
              {saved ? <><Check className="size-4" /> تم الحفظ</> : <><Save className="size-4" /> {saving ? "جارٍ الحفظ…" : "حفظ النصوص"}</>}
            </Button>
          </div>
        }
      />

      {/* تبويبات */}
      <div className="mb-6 flex flex-wrap gap-2">
        <TabBtn active={tab === "identity"} onClick={() => setTab("identity")} icon={<Type className="size-4" />}>الهوية والنصوص</TabBtn>
        <TabBtn active={tab === "theme"} onClick={() => setTab("theme")} icon={<Palette className="size-4" />}>الألوان والثيم</TabBtn>
        <TabBtn active={tab === "images"} onClick={() => setTab("images")} icon={<ImageIcon className="size-4" />}>الصور والشعار</TabBtn>
        <TabBtn active={tab === "frame"} onClick={() => setTab("frame")} icon={<Frame className="size-4" />}>إطار الصورة</TabBtn>
        <TabBtn active={tab === "stages"} onClick={() => setTab("stages")} icon={<Layers className="size-4" />}>المراحل والفروع</TabBtn>
        <TabBtn active={tab === "links"} onClick={() => setTab("links")} icon={<ExternalLink className="size-4" />}>الروابط والأزرار</TabBtn>
        <TabBtn active={tab === "elements"} onClick={() => setTab("elements")} icon={<SlidersHorizontal className="size-4" />}>إظهار/إخفاء وألوان</TabBtn>
      </div>

      {/* ---------- الهوية والنصوص ---------- */}
      {tab === "identity" && (
        <div className="grid gap-5 lg:grid-cols-2">
          <Section title="هوية المنصّة" group="الهوية">
            <div className="grid gap-3">
              <Field label="اسم المنصّة"><input className="inp" value={form.brand} onChange={(e) => set({ brand: e.target.value })} /></Field>
              <Field label="وصف المنصّة"><input className="inp" value={form.platformSubtitle} onChange={(e) => set({ platformSubtitle: e.target.value })} /></Field>
              <Field label="اسم الأستاذة"><input className="inp" value={form.teacher.name} onChange={(e) => setTeacher({ name: e.target.value })} /></Field>
              <Field label="المادة"><input className="inp" value={form.teacher.subject} onChange={(e) => setTeacher({ subject: e.target.value })} /></Field>
              <Field label="رقم واتساب (دولي بدون +)"><input className="inp" value={form.whatsapp} onChange={(e) => set({ whatsapp: e.target.value })} /></Field>
              <Field label="تاريخ نهاية الترم العام (تنتهي عنده خطط «الترم الكامل» التي بلا تاريخ خاص)"><input type="date" dir="ltr" className="inp text-right" value={form.termEnd ?? ""} onChange={(e) => set({ termEnd: e.target.value })} /></Field>
            </div>
            <div className="mt-5 border-t border-border pt-4">
              <p className="mb-3 text-sm font-bold">نصوص قسم «الخطط» في الصفحة الرئيسية</p>
              <div className="grid gap-3">
                <Field label="العنوان الصغير"><input className="inp" value={form.plansSection?.eyebrow ?? ""} onChange={(e) => setPlansSection({ eyebrow: e.target.value })} placeholder="الخطط" /></Field>
                <Field label="العنوان الرئيسي"><input className="inp" value={form.plansSection?.title ?? ""} onChange={(e) => setPlansSection({ title: e.target.value })} placeholder="اختر خطة" /></Field>
                <Field label="الوصف"><input className="inp" value={form.plansSection?.desc ?? ""} onChange={(e) => setPlansSection({ desc: e.target.value })} /></Field>
                <Field label="ملاحظة أسفل الخطط"><input className="inp" value={form.plansSection?.note ?? ""} onChange={(e) => setPlansSection({ note: e.target.value })} /></Field>
              </div>
              <p className="mt-3 text-xs text-muted-foreground">الخطط نفسها (الأسماء والأنواع والأسعار) تُدار من صفحة «الخطط».</p>
            </div>
          </Section>
          <Section title="نصوص الواجهة الرئيسية" group="الهوية">
            <div className="grid gap-3">
              <Field label="شارة الحالة (أعلى الهيرو)"><input className="inp" value={form.hero.statusPill} onChange={(e) => set({ hero: { statusPill: e.target.value } })} /></Field>
              <Field label="العنوان الرئيسي"><input className="inp" value={form.teacher.headline} onChange={(e) => setTeacher({ headline: e.target.value })} /></Field>
              <Field label="الشعار التسويقي"><input className="inp" value={form.teacher.tagline} onChange={(e) => setTeacher({ tagline: e.target.value })} /></Field>
              <Field label="نبذة الأستاذة"><textarea rows={3} className="inp" value={form.teacher.bio} onChange={(e) => setTeacher({ bio: e.target.value })} /></Field>
              <div className="grid grid-cols-3 gap-3">
                <Field label="التقييم"><input type="number" step="0.1" className="inp" value={form.teacher.rating} onChange={(e) => setTeacher({ rating: Number(e.target.value) })} /></Field>
                <Field label="عدد الطلاب"><input type="number" className="inp" value={form.teacher.ratingCount} onChange={(e) => setTeacher({ ratingCount: Number(e.target.value) })} /></Field>
                <Field label="المتفوّقون"><input type="number" className="inp" value={form.teacher.topStudents} onChange={(e) => setTeacher({ topStudents: Number(e.target.value) })} /></Field>
              </div>
            </div>
          </Section>
        </div>
      )}

      {/* ---------- الألوان ---------- */}
      {tab === "theme" && (
        <div className="grid gap-5 lg:grid-cols-2">
          <Section title="نمط التخطيط" group="الهوية">
            <div className="grid grid-cols-2 gap-3">
              <button onClick={() => layout !== "dark" && toggleLayout()} className={`flex flex-col items-center gap-2 rounded-2xl border p-5 text-sm font-bold transition ${layout === "dark" ? "border-primary bg-primary/10 text-primary" : "border-border text-muted-foreground"}`}><Moon className="size-6" /> داكن (زجاجي)</button>
              <button onClick={() => layout !== "light" && toggleLayout()} className={`flex flex-col items-center gap-2 rounded-2xl border p-5 text-sm font-bold transition ${layout === "light" ? "border-primary bg-primary/10 text-primary" : "border-border text-muted-foreground"}`}><Sun className="size-6" /> فاتح (راقٍ)</button>
            </div>
            <p className="mt-4 text-xs text-muted-foreground">التغيير يُطبَّق ويُحفظ فوراً.</p>
          </Section>
          <Section title="الهوية اللونية" group="الهوية">
            <div className="grid grid-cols-2 gap-3">
              {PRESETS.map((p) => (
                <button key={p.id} onClick={() => setPreset(p.id)} className={`flex items-center gap-2 rounded-2xl border px-3 py-3 text-sm font-bold transition ${preset === p.id ? "border-primary bg-primary/10" : "border-border hover:border-primary/40"}`}>
                  <span className="size-5 rounded-full ring-2 ring-white/40" style={{ background: p.swatch }} />
                  {p.label}
                  {preset === p.id && <Check className="mr-auto size-4 text-primary" />}
                </button>
              ))}
            </div>
            {/*
              الهويةُ ثلاثةُ ألوانٍ لا لونٌ واحد.
              كان المخصّصُ لوناً يُشتقّ منه الباقي بتدوير الدرجة — وهذا
              يكفي لتلوينٍ سريع ولا يكفي لهويةٍ معطاة بأرقامها: من يملك
              ذهبَه لا يقبل أن يُشتقّ من كحليّه.
            */}
            <div className="mt-4 rounded-2xl border border-border bg-muted/40 p-4">
              <p className="mb-1 text-sm font-bold">هوية بصرية مخصّصة</p>
              <p className="mb-3 text-[11px] leading-relaxed text-muted-foreground">
                الذهبيُّ الفاتح لا يصلح نصّاً — تباينُه مع الورق دون الحدّ المقروء. فيُؤخذ
                للزخرفة والحدود، ويُشتقّ منه ذهبٌ غائرٌ للنصّ والشارات وحدها.
              </p>
              <div className="grid gap-2.5">
                {([
                  ["primary", "الأساسي (كحلي)", customPrimary ?? "#2c456a"],
                  ["gold", "الذهبي (زخرفة)", form.theme.customGold ?? "#e5caa5"],
                  ["paper", "الورق (خلفية)", form.theme.customPaper ?? "#fbfaf7"],
                ] as const).map(([k, label, val]) => (
                  <div key={k} className="flex items-center justify-between gap-3">
                    <span className="text-xs font-semibold">{label}</span>
                    <span className="flex items-center gap-2">
                      <code dir="ltr" className="font-mono text-[10px] text-muted-foreground">{val}</code>
                      <input
                        type="color"
                        value={val}
                        onChange={async (e) => {
                          const hex = e.target.value;
                          if (k === "primary") { setCustomPrimary(hex); return; }
                          const next = { ...form.theme, preset: "custom" as const, [k === "gold" ? "customGold" : "customPaper"]: hex };
                          set({ theme: next });
                          await saveContent({ theme: next });
                        }}
                        className="size-9 cursor-pointer rounded-lg border border-border bg-transparent"
                      />
                    </span>
                  </div>
                ))}
              </div>
              {preset === "custom" && (
                <p className="mt-3 inline-flex items-center gap-1.5 text-[11px] font-bold text-primary">
                  <Check className="size-3.5" /> الهوية المخصّصة مفعّلة
                </p>
              )}
            </div>
          </Section>
        </div>
      )}

      {/* ---------- الصور ---------- */}
      {tab === "images" && (
        <div className="grid gap-5 lg:grid-cols-2">
          {/*
            أيقونة التطبيق — ما يراه الطالب على شاشة هاتفه بعد التثبيت.
            كانت تتبع الشعار وحده، ومن أراد صورتَه لم يجد سبيلاً.
          */}
          {/*
            اسمُ الأستاذ توقيعاً.
            التوقيعُ أثرُ يدٍ لا حرفٌ مطبوع — فيه ميلٌ وذيلٌ وحركةُ قلم.
            والمعاينةُ بالمكوّن نفسِه الذي في الرأس، لا رسمٌ يحاكيه.
          */}
          <Section className="lg:col-span-2" title="اسم الأستاذ في الرأس — توقيعاً" group="الهوية">
            <p className="mb-4 text-xs leading-relaxed text-muted-foreground">
              يُكتب بخطّ الرقعة، وهو خطُّ المكاتبة والتوقيع في العربية تاريخياً — فيبدو الاسمُ
              أثرَ يدٍ لا عنواناً مطبوعاً. والذيلُ يُرسم عند فتح الصفحة كما يُرسم التوقيعُ بيد.
            </p>
            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
              {SIGNATURES.map((x) => {
                const on = (form.brandSignature ?? "off") === x.id;
                return (
                  <button
                    key={x.id}
                    type="button"
                    onClick={async () => { set({ brandSignature: x.id }); await saveContent({ brandSignature: x.id }); }}
                    className={`rounded-3xl border-2 p-3 text-right transition ${
                      on ? "border-primary shadow-bento" : "border-border hover:border-primary/50"
                    }`}
                  >
                    <div className="mb-2 grid min-h-[64px] place-items-center rounded-2xl bg-muted/40 px-3 py-2">
                      <BrandLockup brand={form.brand} logo={form.teacher.logo} size={32} signature={x.id} />
                    </div>
                    <p className="text-sm font-bold">{x.name}</p>
                    <p className="text-[10px] text-muted-foreground">{x.hint}</p>
                  </button>
                );
              })}
            </div>

            {/* ---------- صورة التوقيع ---------- */}
            <div className="mt-5 border-t border-border pt-4">
              <p className="mb-1 text-sm font-bold">أو ارفع توقيعك صورةً</p>
              <p className="mb-3 text-[11px] leading-relaxed text-muted-foreground">
                التوقيعُ الحقيقيُّ أصدقُ من أيّ خطٍّ يحاكيه — فإن رُفعت صورتُه حلّت محلَّ الاسم في
                الرأس وسقط الخطُّ ولم يُرسم. تُفتح الصورةُ في أستوديو الصورة أوّلاً لتُقصّ خلفيتُها
                البيضاء، فيظهر الحبرُ وحدَه على أيّ لون.
              </p>

              <div className="flex flex-wrap items-center gap-3">
                <div
                  className="grid min-w-[150px] place-items-center rounded-2xl border border-dashed border-border bg-muted/30 px-4 py-3"
                  style={{ minHeight: 60 }}
                >
                  {form.signatureImage ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      src={mediaSrc(form.signatureImage)}
                      alt="التوقيع"
                      className="w-auto max-w-[190px] object-contain"
                      style={{ height: Math.max(20, Math.min(80, form.signatureHeight ?? 34)) }}
                      referrerPolicy="no-referrer"
                    />
                  ) : (
                    <span className="text-[11px] text-muted-foreground">لا توقيع</span>
                  )}
                </div>

                <input
                  id="sig-file"
                  type="file"
                  accept="image/*"
                  hidden
                  onChange={(e) => {
                    const f = e.target.files?.[0];
                    e.target.value = "";
                    if (f) setStudio({ file: f, target: "signature" });
                  }}
                />
                <Button variant="outline" onClick={() => document.getElementById("sig-file")?.click()}>
                  <Upload className="size-4" /> رفع التوقيع
                </Button>
                {form.signatureImage ? (
                  <button
                    type="button"
                    className="rounded-xl border border-border px-3 py-2 text-[11px] font-bold text-muted-foreground transition hover:border-rose-500/50 hover:text-rose-500"
                    onClick={async () => { set({ signatureImage: "" }); await saveContent({ signatureImage: "" }); }}
                  >
                    إزالة
                  </button>
                ) : null}
              </div>

              {form.signatureImage ? (
                <div className="mt-4 grid gap-3 sm:grid-cols-2">
                  <label className="flex items-center gap-3">
                    <span className="w-28 shrink-0 text-[11px] font-semibold text-muted-foreground">
                      الارتفاع {(form.signatureHeight ?? 34).toLocaleString("ar-EG")}px
                    </span>
                    <input
                      type="range"
                      min={20}
                      max={80}
                      value={form.signatureHeight ?? 34}
                      onChange={(e) => set({ signatureHeight: Number(e.target.value) })}
                      onMouseUp={() => void saveContent({ signatureHeight: form.signatureHeight ?? 34 })}
                      onTouchEnd={() => void saveContent({ signatureHeight: form.signatureHeight ?? 34 })}
                      className="h-1.5 flex-1 accent-[hsl(var(--primary))]"
                    />
                  </label>
                  <label className="flex items-center gap-2 text-xs font-bold">
                    <input
                      type="checkbox"
                      checked={form.signatureInvert !== false}
                      onChange={async (e) => { set({ signatureInvert: e.target.checked }); await saveContent({ signatureInvert: e.target.checked }); }}
                    />
                    اقلبه أبيضَ في الوضع الداكن
                  </label>
                </div>
              ) : null}
            </div>
          </Section>

          <Section className="lg:col-span-2" title="أيقونة التطبيق" group="الهوية">
            <p className="mb-4 text-xs text-muted-foreground">
              ما يظهر على شاشة هاتف الطالب بعد تثبيت المنصّة، وفي تبويب المتصفّح.
            </p>
            <div className="flex flex-wrap items-center gap-3">
              {([
                { id: "logo", label: "الشعار المرفوع" },
                { id: "avatar", label: "صورة المعلّمة" },
                { id: "mark", label: "علامة المنصّة" },
                { id: "custom", label: "صورة أرفعها للأيقونة" },
              ] as const).map((o) => {
                const on = (form.appIcon ?? "logo") === o.id;
                return (
                  <button
                    key={o.id}
                    type="button"
                    onClick={() => set({ appIcon: o.id })}
                    className={`inline-flex items-center gap-2 rounded-2xl border px-4 py-2.5 text-xs font-bold transition ${
                      on ? "border-primary bg-primary/10 text-primary" : "border-border text-muted-foreground hover:border-primary/40"
                    }`}
                  >
                    {o.label}
                  </button>
                );
              })}
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={`/api/pwa-icon?size=96&v=${form.appIcon ?? "logo"}-${(form.appIconImage ?? "").slice(-12)}`}
                alt="معاينة أيقونة التطبيق"
                width={56}
                height={56}
                className="rounded-2xl border border-border"
              />
              <span className="text-[11px] text-muted-foreground">
                المعاينة تتحدّث بعد الحفظ — الأيقونة تُولَّد على الخادم.
              </span>
            </div>
            {/*
              الأيقونةُ المرفوعة مستقلّةٌ عن الشعار: أيقونةُ الهاتف مربّعةٌ
              صغيرة تُقرأ من بعيد، والشعارُ قد يكون عريضاً بنصٍّ دقيق — فما
              يصلح لأحدهما يفسد الآخر.
            */}
            {(form.appIcon ?? "logo") === "custom" && (
              <div className="mt-4 flex flex-wrap items-center gap-3 rounded-2xl border border-border p-3">
                <div className="grid size-16 shrink-0 place-items-center overflow-hidden rounded-2xl border border-dashed border-border bg-muted/30">
                  {form.appIconImage ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={mediaSrc(form.appIconImage)} alt="أيقونة التطبيق" className="max-h-full max-w-full object-contain" referrerPolicy="no-referrer" />
                  ) : (
                    <span className="text-[10px] text-muted-foreground">لا صورة</span>
                  )}
                </div>
                <input
                  id="app-icon-file"
                  type="file"
                  accept="image/*"
                  hidden
                  onChange={async (e) => {
                    const file = e.target.files?.[0];
                    e.target.value = "";
                    if (!file) return;
                    const url = await uploadImage(file);
                    if (!url) return;
                    set({ appIconImage: url });
                    await saveContent({ appIcon: "custom", appIconImage: url });
                  }}
                />
                <Button variant="outline" onClick={() => document.getElementById("app-icon-file")?.click()}>
                  <Upload className="size-4" /> رفع صورة الأيقونة
                </Button>
                {form.appIconImage ? (
                  <button
                    type="button"
                    className="rounded-xl border border-border px-3 py-2 text-[11px] font-bold text-muted-foreground transition hover:border-rose-500/50 hover:text-rose-500"
                    onClick={async () => { set({ appIconImage: "" }); await saveContent({ appIconImage: "" }); }}
                  >
                    إزالة
                  </button>
                ) : null}
                <p className="w-full text-[11px] leading-relaxed text-muted-foreground">
                  مربّعة، ٥١٢×٥١٢ فأكثر، PNG بخلفيةٍ شفّافة أو مصمتة. تُحفظ فور رفعها،
                  والمعاينةُ أعلاه تتحدّث بعد لحظة — الأيقونةُ تُولَّد على الخادم.
                </p>
              </div>
            )}


            {/*
              صلاحيةُ Meet تُطلب أو لا تُطلب — وهذا يقرّر تجربةَ الربط كلَّها.
              `drive.file` غيرُ حسّاسٍ عند جوجل: لا يرى إلّا ما أنشأه التطبيق
              نفسُه. و`calendar.events` حسّاس، وطلبُه يجعل التطبيق يحتاج مراجعةً،
              فتظهر شاشةُ «غير مُتحقَّق منه» لكلّ من يربط ويُفرض سقفُ مئة مستخدم.
            */}
          </Section>
          <Section className="lg:col-span-2" title="صلاحيات ربط جوجل" group="تقنيّ">
            <p className="mb-4 text-xs leading-relaxed text-muted-foreground">
              رفعُ الملفات وحدَه لا يحتاج مراجعةً من جوجل — يربطه أيُّ بريدٍ مباشرةً بلا تحذير.
              أمّا Google Meet فصلاحيتُه «حسّاسة»: طلبُها يجعل كلَّ من يربط يرى شاشة «تطبيق غير
              مُتحقَّق منه»، ويُفرض سقفُ مئة مستخدم حتى تُراجَع.
            </p>
            <label className="flex items-start gap-3 rounded-2xl border border-border bg-muted/40 p-4">
              <input
                type="checkbox"
                className="mt-0.5 size-4 accent-[hsl(var(--primary))]"
                checked={form.googleMeet === true}
                onChange={async (e) => { set({ googleMeet: e.target.checked }); await saveContent({ googleMeet: e.target.checked }); }}
              />
              <span>
                <span className="block text-sm font-bold">اطلب صلاحية Google Meet أيضاً</span>
                <span className="mt-0.5 block text-[11px] leading-relaxed text-muted-foreground">
                  فعّلها فقط إن كنت ستنشئ روابط Meet للبثّ من المنصّة. وبعد تغييرها أعد ربط
                  حساب جوجل — الصلاحياتُ تُمنح عند الربط لا بعده.
                </span>
              </span>
            </label>
          </Section>

          <Section className="lg:col-span-2" title="مكان استضافة الملفات المرفوعة" group="تقنيّ">
            <p className="mb-4 text-xs text-muted-foreground">
              عند اختيار Google Drive تُرفع الصور والفيديوهات في الخلفية إلى مجلّد باسم المنصّة داخل حساب جوجل المربوط،
              ويُحفظ في المنصّة رابط العرض فقط — فلا تستهلك مساحة الخادم.
            </p>
            <div className="grid gap-3 sm:grid-cols-2">
              {([
                { id: "local", title: "خادم المنصّة", desc: "الملفات تُحفظ في مجلّد الخادم (افتراضي)" },
                { id: "drive", title: "Google Drive", desc: "يتطلّب ربط حساب جوجل من صفحة «البث المباشر»" },
              ] as const).map((o) => {
                const active = (form.mediaHost ?? "local") === o.id;
                const blocked = o.id === "drive" && !googleReady;
                return (
                  <button key={o.id} type="button" disabled={blocked}
                    onClick={() => { set({ mediaHost: o.id }); void saveContent({ mediaHost: o.id }); }}
                    className={`rounded-2xl border p-4 text-right transition disabled:opacity-50 ${active ? "border-primary bg-primary/5" : "border-border hover:border-primary/40"}`}>
                    <span className="block text-sm font-bold">{o.title}</span>
                    <span className="mt-0.5 block text-[11px] text-muted-foreground">
                      {blocked ? "اربط حساب جوجل أولاً من «البث المباشر»" : o.desc}
                    </span>
                  </button>
                );
              })}
            </div>
            <ImageUploader
              label="صورة الأستاذة (Hero)"
              hint="تُفتح أداة القصّ وإزالة الخلفية قبل الرفع"
              value={form.teacher.avatar}
              onUpload={(f) => setStudio({ file: f, target: "avatar" })}
              tall
            />
            <ImageUploader label="شعار المنصّة / الأيقونة (favicon)" hint="مربّع، PNG/SVG" value={form.teacher.logo}
              onUpload={async (f) => { const url = await uploadImage(f); if (url) { setTeacher({ logo: url }); await saveContent({ teacher: { ...form.teacher, logo: url } }); } }} />
          </Section>
        
          {/* ---------- خلفية الصفحة الرئيسية ---------- */}
          <Section className="lg:col-span-2" title="خلفية الصفحة الرئيسية" group="صورة الأستاذ">
            <p className="mb-4 text-xs leading-relaxed text-muted-foreground">
              صورة تُرسم خلف كل أقسام الصفحة. اجعلها ثابتة لتبقى في مكانها وتمرّ العناصر فوقها،
              واضبط شدّتها وضبابها حتى تبقى النصوص مقروءة.
            </p>

            <div className="grid gap-5 lg:grid-cols-2">
              <ImageUploader
                label="صورة الخلفية"
                hint="عريضة، JPG/PNG — يُفضّل ١٩٢٠×١٠٨٠"
                value={form.background?.image ?? ""}
                onUpload={async (f) => {
                  const url = await uploadImage(f);
                  if (!url) return;
                  const next = { ...(form.background ?? {}), image: url };
                  set({ background: next });
                  await saveContent({ background: next });
                }}
                tall
              />

              {/* الحذف ملاصق للصورة نفسها — أوضح من دفنه تحت الإعدادات */}
              {form.background?.image ? (
                <button
                  type="button"
                  onClick={() => {
                    const next = { ...(form.background ?? {}), image: "" };
                    set({ background: next });
                    void saveContent({ background: next });
                  }}
                  className="-mt-2 inline-flex w-fit items-center gap-1.5 rounded-full border border-border px-4 py-2 text-xs font-bold text-rose-500 transition hover:border-rose-500 hover:bg-rose-500/5"
                >
                  <Trash2 className="size-3.5" /> حذف خلفية الموقع
                </button>
              ) : (
                <p className="-mt-2 text-[11px] text-muted-foreground">
                  لا توجد خلفية مرفوعة — الصفحة تستخدم ألوان الثيم وزخارفها.
                </p>
              )}

              <div className="grid content-start gap-4">
                {/* ثابتة أم تتحرّك مع الصفحة */}
                <div>
                  <span className="lbl">سلوك الخلفية</span>
                  <div className="grid gap-2 sm:grid-cols-2">
                    {([
                      { fixed: true, title: "ثابتة", desc: "تبقى مكانها والعناصر تتحرّك فوقها" },
                      { fixed: false, title: "تتحرّك مع الصفحة", desc: "تمرّ مع المحتوى كالمعتاد" },
                    ] as const).map((o) => {
                      const active = Boolean(form.background?.fixed) === o.fixed;
                      return (
                        <button
                          key={String(o.fixed)}
                          type="button"
                          onClick={() => {
                            const next = { ...(form.background ?? {}), fixed: o.fixed };
                            set({ background: next });
                            void saveContent({ background: next });
                          }}
                          className={`rounded-2xl border p-3 text-right transition ${
                            active ? "border-primary bg-primary/5" : "border-border hover:border-primary/40"
                          }`}
                        >
                          <span className="block text-sm font-bold">{o.title}</span>
                          <span className="mt-0.5 block text-[11px] text-muted-foreground">{o.desc}</span>
                        </button>
                      );
                    })}
                  </div>
                </div>

                <BgSlider
                  label="شدّة الظهور"
                  value={form.background?.opacity ?? 35}
                  min={5} max={100} step={1}
                  display={`${(form.background?.opacity ?? 35).toLocaleString("ar-EG")}٪`}
                  onChange={(v) => {
                    const next = { ...(form.background ?? {}), opacity: v };
                    set({ background: next });
                    void saveContent({ background: next });
                  }}
                />

                <BgSlider
                  label="الضباب (يحمي قراءة النصّ)"
                  value={form.background?.blur ?? 0}
                  min={0} max={20} step={1}
                  display={`${(form.background?.blur ?? 0).toLocaleString("ar-EG")}px`}
                  onChange={(v) => {
                    const next = { ...(form.background ?? {}), blur: v };
                    set({ background: next });
                    void saveContent({ background: next });
                  }}
                />

              </div>
            </div>
          </Section>
        </div>
      )}

      {/* ---------- إطار الصورة ---------- */}
      {tab === "frame" && (
        <>
        <Section className="mb-5" title="خطّ القاعدة أسفل الإطار" group="صورة الأستاذ">
          <p className="mb-3 text-xs text-muted-foreground">
            كان يُرسم تحت كل إطار مهما كان شكلُه، فيبدو خطّاً معلَّقاً أسفل الأشكال التي
            لا تحتاج تثبيتاً بصرياً. صار مطفأً افتراضياً.
          </p>
          <button
            type="button"
            onClick={() => set({ hero: { ...form.hero, frameBaseRule: !form.hero.frameBaseRule } })}
            className={`inline-flex items-center gap-2 rounded-2xl border px-4 py-2.5 text-xs font-bold transition ${
              form.hero.frameBaseRule ? "border-primary bg-primary/10 text-primary" : "border-border text-muted-foreground hover:border-primary/40"
            }`}
          >
            {form.hero.frameBaseRule ? "الخطّ ظاهر" : "الخطّ مخفيّ"}
          </button>
        </Section>

        <Section className="mb-5" title="ضبط الصورة داخل الإطار" group="صورة الأستاذ">
          <p className="mb-5 text-xs text-muted-foreground">الصورة تظهر كاملة بلا قصّ افتراضياً — حرّكها وكبّرها حتى تستقرّ، والمعاينة تتغيّر فوراً ثم اضغط حفظ.</p>
          <div className="grid gap-6 md:grid-cols-[minmax(0,260px)_1fr]">
            <div className="mx-auto w-full max-w-[240px]">
              <HeroFrame
                frame={form.hero.frameShape ?? form.hero.frame ?? 1}
                avatar={form.teacher.avatar}
                alt="معاينة"
                img={form.hero.image}
                color={form.hero.frameColor}
                scale={form.hero.frameScale}
              />
            </div>
            <div className="grid gap-4 self-center">
              <div>
                <span className="lbl">طريقة الملء</span>
                <div className="grid grid-cols-2 gap-2">
                  {([
                    { id: "contain", label: "الصورة كاملة (بلا قصّ)" },
                    { id: "cover", label: "ملء الإطار (يقصّ الزائد)" },
                  ] as const).map((o) => (
                    <button key={o.id} type="button" onClick={() => setHeroImage({ fit: o.id })}
                      className={`rounded-2xl border px-3 py-2.5 text-xs font-bold transition ${
                        (form.hero.image?.fit ?? "contain") === o.id ? "border-primary bg-primary/10 text-primary" : "border-border hover:border-primary/40"
                      }`}>{o.label}</button>
                  ))}
                </div>
              </div>

              <Slider label="التكبير" value={form.hero.image?.scale ?? 1} min={0.6} max={2.5} step={0.02}
                display={`${Math.round((form.hero.image?.scale ?? 1) * 100)}٪`}
                onChange={(v) => setHeroImage({ scale: v })} />
              <Slider label="الإزاحة الأفقية" value={form.hero.image?.x ?? 0} min={-40} max={40} step={1}
                display={`${form.hero.image?.x ?? 0}٪`}
                onChange={(v) => setHeroImage({ x: v })} />
              <Slider label="الإزاحة الرأسية" value={form.hero.image?.y ?? 0} min={-40} max={40} step={1}
                display={`${form.hero.image?.y ?? 0}٪`}
                onChange={(v) => setHeroImage({ y: v })} />

              <div className="flex flex-wrap gap-2">
                <Button className="px-5 py-2.5" onClick={() => void saveContent({ hero: { ...content.hero, image: form.hero.image } })}>
                  <Save className="size-4" /> حفظ الضبط
                </Button>
                <button
                  onClick={() => { setHeroImage({ fit: "contain", x: 0, y: 0, scale: 1 }); void saveContent({ hero: { ...content.hero, image: { fit: "contain", x: 0, y: 0, scale: 1 } } }); }}
                  className="rounded-full border border-border px-4 py-2.5 text-sm font-bold transition hover:border-primary hover:text-primary">
                  إعادة الضبط
                </button>
              </div>
            </div>
          </div>
        </Section>

        {/* ---------- اختيار الإطار: لونه وحجمه وشكله ---------- */}
        <Section className="mb-5" title="لون الإطار وحجمه" group="صورة الأستاذ">
          <p className="mb-4 text-xs text-muted-foreground">
            اللون يسري على حدّ الإطار وخيطه الداخلي، والحجم يكبّره داخل عموده بلا تغيير نسبة أبعاده.
          </p>
          <div className="grid gap-5 md:grid-cols-2">
            <div>
              <span className="lbl">لون الإطار</span>
              <div className="flex flex-wrap items-center gap-2">
                <button
                  type="button"
                  onClick={() => void saveHero({ frameColor: "" })}
                  className={`rounded-full border px-3.5 py-1.5 text-xs font-bold transition ${
                    !form.hero.frameColor ? "border-primary bg-primary/10 text-primary" : "border-border hover:border-primary/40"
                  }`}
                >
                  لون الثيم
                </button>
                {FRAME_SWATCH.map((c) => (
                  <button
                    key={c}
                    type="button"
                    aria-label={c}
                    onClick={() => void saveHero({ frameColor: c })}
                    className={`size-8 rounded-xl border transition ${
                      form.hero.frameColor?.toLowerCase() === c ? "border-primary ring-2 ring-primary/40" : "border-border hover:border-primary/50"
                    }`}
                    style={{ background: c }}
                  />
                ))}
                <label
                  className="grid size-8 cursor-pointer place-items-center rounded-xl border border-dashed border-border"
                  style={{ background: form.hero.frameColor || "transparent" }}
                  title="لون مخصّص"
                >
                  <input
                    type="color"
                    className="size-0 opacity-0"
                    value={form.hero.frameColor || "#233b8b"}
                    onChange={(e) => void saveHero({ frameColor: e.target.value })}
                  />
                </label>
              </div>
            </div>

            <Slider
              label="حجم الإطار"
              value={form.hero.frameScale ?? 100}
              min={60}
              max={140}
              step={1}
              display={`${(form.hero.frameScale ?? 100).toLocaleString("ar-EG")}٪`}
              onChange={(v) => void saveHero({ frameScale: v })}
            />
          </div>
        </Section>

        <Section title="اختر تصميم إطار الصورة" group="صورة الأستاذ">
          <p className="mb-5 text-xs text-muted-foreground">
            {FRAME_SHAPES.length.toLocaleString("ar-EG")} تصميماً — التغيير يُطبَّق ويُحفظ فوراً.
            هذا هو المكان الوحيد لاختيار الإطار.
          </p>
          <div className="grid grid-cols-2 gap-4 sm:grid-cols-4 lg:grid-cols-6">
            {FRAME_SHAPES.map((x) => {
              const active = (form.hero.frameShape ?? findFrame(form.hero.frame ?? 1).id) === x.id;
              return (
                <button
                  key={x.id}
                  onClick={() => void saveHero({ frameShape: x.id })}
                  className={`group rounded-3xl border p-3 text-center transition ${
                    active ? "border-primary bg-primary/10" : "border-border hover:border-primary/40"
                  }`}
                >
                  <div className="relative mx-auto mb-2 w-full">
                    <HeroFrame
                      frame={x.id}
                      avatar={form.teacher.avatar}
                      alt={x.name}
                      color={form.hero.frameColor}
                    />
                  </div>
                  <p className="truncate text-xs font-bold">{x.name}</p>
                  <p className="truncate text-[10px] text-muted-foreground">{x.hint}</p>
                  {active && (
                    <span className="mt-1 inline-flex items-center gap-1 text-[10px] font-bold text-primary">
                      <Check className="size-3" /> مُختار
                    </span>
                  )}
                </button>
              );
            })}
          </div>
        </Section>
        </>
      )}

      {/* ---------- الروابط والأزرار ---------- */}
      {/* ---------- المراحل والفروع ---------- */}
      {tab === "stages" && (
        <StagesEditor
          stages={form.stages ?? []}
          onChange={saveStages}
          onUpload={uploadImage}
        />
      )}

      {tab === "links" && (
        <div className="grid gap-5 lg:grid-cols-2">
          <Section title="روابط التواصل" group="التواصل والأزرار">
            <div className="grid gap-3">
              <Field label="رقم واتساب (دولي بدون +)"><input dir="ltr" className="inp text-right" value={form.whatsapp} onChange={(e) => set({ whatsapp: e.target.value })} /></Field>
              <Field label="رابط فيسبوك"><input dir="ltr" className="inp text-right" value={form.social.facebook} onChange={(e) => setSocial({ facebook: e.target.value })} /></Field>
              <Field label="رابط يوتيوب"><input dir="ltr" className="inp text-right" value={form.social.youtube} onChange={(e) => setSocial({ youtube: e.target.value })} /></Field>
              <Field label="رابط تليجرام"><input dir="ltr" className="inp text-right" value={form.social.telegram} onChange={(e) => setSocial({ telegram: e.target.value })} /></Field>
            </div>
            <div className="mt-5 border-t border-border pt-4">
              <p className="mb-3 text-sm font-bold">روابط الدعم</p>
              <div className="grid gap-3">
                <Field label="بريد الدعم"><input type="email" dir="ltr" className="inp text-right" value={form.support?.email ?? ""} onChange={(e) => setSupport({ email: e.target.value })} placeholder="support@example.com" /></Field>
                <Field label="هاتف الدعم"><input dir="ltr" className="inp text-right" value={form.support?.phone ?? ""} onChange={(e) => setSupport({ phone: e.target.value })} placeholder="+20100…" /></Field>
                <Field label="واتساب الدعم (اختياري — يختلف عن الرئيسي)"><input dir="ltr" className="inp text-right" value={form.support?.whatsapp ?? ""} onChange={(e) => setSupport({ whatsapp: e.target.value })} placeholder="دولي بدون +" /></Field>
              </div>
            </div>
          </Section>
          <Section title="أزرار الصفحة الرئيسية" group="التواصل والأزرار">
            <div className="grid gap-3">
              <Field label="نص زر التسجيل"><input className="inp" value={form.cta?.registerLabel ?? "سجّل الآن"} onChange={(e) => setCta({ registerLabel: e.target.value })} /></Field>
              <Field label="رابط زر التسجيل"><input dir="ltr" className="inp text-right" value={form.cta?.registerUrl ?? "/register"} onChange={(e) => setCta({ registerUrl: e.target.value })} placeholder="/register أو رابط خارجي" /></Field>
              <Field label="نص زر إنشاء حساب (الهيرو)"><input className="inp" value={form.cta?.heroPrimaryLabel ?? "أنشئ حساب طالب"} onChange={(e) => setCta({ heroPrimaryLabel: e.target.value })} /></Field>
              <Field label="نص الزر الثانوي (الفيديو)"><input className="inp" value={form.cta?.secondaryLabel ?? "شاهد درساً مجانياً"} onChange={(e) => setCta({ secondaryLabel: e.target.value })} /></Field>
              <Field label="رابط الدرس المجاني (اختياري)"><input dir="ltr" className="inp text-right" value={form.cta?.videoUrl ?? ""} onChange={(e) => setCta({ videoUrl: e.target.value })} placeholder="رابط يوتيوب لدرس تجريبي" /></Field>
            </div>
            <div className="mt-5 border-t border-border pt-4">
              <p className="mb-1 text-sm font-bold">زر واتساب (الهيرو)</p>
              <p className="mb-3 text-[11px] leading-relaxed text-muted-foreground">
                يظهر أسفل زر «أنشئ حساب طالب». لإخفائه: تبويب «إظهار/إخفاء وألوان» ← «زر واتساب (الهيرو)».
              </p>
              <div className="grid gap-3">
                <Field label="نص الزر"><input className="inp" value={form.cta?.whatsappLabel ?? "تواصل معنا على واتساب"} onChange={(e) => setCta({ whatsappLabel: e.target.value })} /></Field>
                <Field label="رابط مخصّص (اختياري)"><input dir="ltr" className="inp text-right" value={form.cta?.whatsappUrl ?? ""} onChange={(e) => setCta({ whatsappUrl: e.target.value })} placeholder="اتركه فارغاً ليُبنى من رقم واتساب أعلاه" /></Field>
                <Field label="نص الرسالة الجاهزة"><input className="inp" value={form.cta?.whatsappText ?? ""} onChange={(e) => setCta({ whatsappText: e.target.value })} placeholder="السلام عليكم، أود الاستفسار عن الاشتراك" /></Field>
              </div>
            </div>
            <p className="mt-3 text-xs text-muted-foreground">اضغط «حفظ النصوص» بالأعلى لحفظ التغييرات.</p>
            {/*
              الشركة المطوّرة.
              حقوقُ المنصّة للأستاذة، ونسبةُ التطوير شيءٌ آخر — فسطرٌ مستقلٌّ
              تحت الحقوق لا جملةٌ تخلطهما.
            */}
          </Section>
          <Section className="lg:col-span-2" title="الشركة المطوّرة (أسفل الفوتر)" group="التواصل والأزرار">
            <p className="mb-4 text-xs leading-relaxed text-muted-foreground">
              يظهر سطرٌ تحت حقوق النشر: «تطوير — الاسم». من ترك الاسم فارغاً لم يظهر السطر،
              ومن ترك الرابط فارغاً ظهر الاسمُ نصّاً لا وصلةً معطوبة.
            </p>
            <div className="grid gap-4 lg:grid-cols-2">
              <div className="grid gap-3">
                <Field label="اسم الشركة">
                  <input className="inp" value={form.developer?.name ?? ""} placeholder="EX-EG"
                    onChange={(e) => setDeveloper({ name: e.target.value })} />
                </Field>
                <Field label="رابط الشركة (عند الضغط)">
                  <input dir="ltr" className="inp text-right" value={form.developer?.url ?? ""} placeholder="https://…"
                    onChange={(e) => setDeveloper({ url: e.target.value })} />
                </Field>
                <label className="flex items-center gap-2 text-xs font-bold">
                  <input type="checkbox" checked={!form.developer?.hidden}
                    onChange={(e) => setDeveloper({ hidden: !e.target.checked })} />
                  إظهار السطر في الفوتر
                </label>
                <p className="text-[11px] text-muted-foreground">اضغط «حفظ النصوص» بالأعلى لحفظ الاسم والرابط.</p>
              </div>

              <div>
                <p className="mb-2 text-xs font-semibold text-muted-foreground">شعار الشركة (اختياري)</p>
                <div className="flex items-center gap-3">
                  <div className="grid h-14 w-28 place-items-center overflow-hidden rounded-2xl border border-dashed border-border bg-muted/30">
                    {form.developer?.logo ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img src={mediaSrc(form.developer.logo)} alt="شعار الشركة المطوّرة"
                        className="max-h-full max-w-full object-contain" referrerPolicy="no-referrer" />
                    ) : (
                      <span className="text-[11px] text-muted-foreground">لا شعار</span>
                    )}
                  </div>
                  <input
                    id="dev-logo"
                    type="file"
                    accept="image/*"
                    hidden
                    onChange={async (e) => {
                      const f = e.target.files?.[0];
                      if (!f) return;
                      const url = await uploadImage(f);
                      if (!url) return;
                      const next = { ...(form.developer ?? {}), logo: url };
                      set({ developer: next });
                      await saveContent({ developer: next });
                    }}
                  />
                  <Button variant="outline" onClick={() => document.getElementById("dev-logo")?.click()}>
                    <Upload className="size-4" /> رفع الشعار
                  </Button>
                  {form.developer?.logo ? (
                    <button
                      type="button"
                      className="rounded-xl border border-border px-3 py-2 text-[11px] font-bold text-muted-foreground transition hover:border-rose-500/50 hover:text-rose-500"
                      onClick={async () => {
                        const next = { ...(form.developer ?? {}), logo: "" };
                        set({ developer: next });
                        await saveContent({ developer: next });
                      }}
                    >
                      إزالة
                    </button>
                  ) : null}
                </div>
                <p className="mt-2 text-[11px] text-muted-foreground">
                  الشعارُ يُرفع ويُحفظ فوراً — بارتفاع ١٦ بكسل في الفوتر فلا يزاحم الحقوق.
                </p>
              </div>
            </div>
          </Section>
        </div>
      )}

      {/* ---------- إظهار/إخفاء وألوان العناصر ---------- */}
      {tab === "elements" && (
        <div className="grid gap-4 lg:grid-cols-2">
          {/* حماية محتوى الكورس */}
          <Card className="lg:col-span-2">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div className="min-w-0">
                <p className="font-display font-bold">حماية محتوى الكورس من الالتقاط</p>
                <p className="mt-1 text-xs leading-relaxed text-muted-foreground">
                  تُعطّل الزرّ الأيمن والطباعة واختصارات الحفظ وأدوات المطوّر، وتُخفي المحتوى
                  حين تفقد النافذة تركيزها فتفشل أدوات التسجيل الخارجية.
                  <b className="text-foreground"> لا تمنع لقطة الشاشة نفسها</b> — لا يستطيع ذلك
                  أي موقع، فاللقطة يلتقطها نظام التشغيل أو كاميرا هاتف آخر. تُصعّب النسخ ولا تمنعه.
                </p>
              </div>
              <label className="inline-flex cursor-pointer items-center gap-2 text-xs font-semibold">
                <input
                  type="checkbox"
                  checked={Boolean(form.blockCapture)}
                  onChange={(e) => {
                    set({ blockCapture: e.target.checked });
                    void saveContent({ blockCapture: e.target.checked });
                  }}
                  className="size-4 accent-[hsl(var(--primary))]"
                />
                {form.blockCapture ? "مفعّلة" : "معطّلة"}
              </label>
            </div>
          </Card>

          {/* زرّ تبديل المظهر — مخفيّ افتراضياً عن كل المنصّة */}
          <Card className="lg:col-span-2">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div className="min-w-0">
                <p className="font-display font-bold">زرّ الوضع الفاتح/الداكن</p>
                <p className="mt-1 text-xs leading-relaxed text-muted-foreground">
                  مخفيّ افتراضياً عن الموقع ولوحة الطالب والإدارة. أظهِره ليختار كل زائر
                  الوضع الذي يريحه — وأخفِه لتبقى هوية المنصّة كما ضبطتها لكل من يزورها.
                </p>
              </div>
              <label className="inline-flex cursor-pointer items-center gap-2 text-xs font-semibold">
                <input
                  type="checkbox"
                  checked={Boolean(form.showThemeToggle)}
                  onChange={(e) => {
                    set({ showThemeToggle: e.target.checked });
                    void saveContent({ showThemeToggle: e.target.checked });
                  }}
                  className="size-4 accent-[hsl(var(--primary))]"
                />
                {form.showThemeToggle ? "ظاهر" : "مخفيّ"}
              </label>
            </div>
          </Card>

          {ELEMENTS.map((elm) => {
            const st = form.ui?.[elm.key] ?? {};
            return (
              <Card key={elm.key}>
                <div className="mb-3 flex items-center justify-between gap-2">
                  <p className="font-display font-bold">{elm.label}</p>
                  <label className="inline-flex cursor-pointer items-center gap-2 text-xs font-semibold">
                    <input type="checkbox" checked={!st.hidden} onChange={(e) => setUi(elm.key, { hidden: !e.target.checked })} className="size-4 accent-[hsl(var(--primary))]" />
                    ظاهر
                  </label>
                </div>
                {elm.fill && <ColorPicker label="لون الزر" spec={st.fill} onChange={(v) => setUi(elm.key, { fill: v })} />}
                {elm.text && <div className="mt-2"><ColorPicker label="لون النص" spec={st.text} onChange={(v) => setUi(elm.key, { text: v })} /></div>}
              </Card>
            );
          })}
          <p className="text-xs text-muted-foreground lg:col-span-2">اضغط «حفظ النصوص» بالأعلى لحفظ التغييرات.</p>
        </div>
      )}

      {/* استوديو الصورة — قصّ وإزالة خلفية قبل الرفع */}
      {studio && (
        <ImageStudio
          file={studio.file}
          onCancel={() => setStudio(null)}
          onDone={async (out) => {
            const url = await uploadImage(out);
            setStudio(null);
            if (!url) return;
            if (studio.target === "signature") {
              /* المقصوصةُ شفّافةُ الخلفية، فيظهر الحبرُ وحدَه على أيّ لون. */
              set({ signatureImage: url });
              await saveContent({ signatureImage: url });
            } else if (studio.target === "avatar") {
              setTeacher({ avatar: url });
              await saveContent({ teacher: { ...form.teacher, avatar: url } });
            } else {
              setTeacher({ logo: url });
              await saveContent({ teacher: { ...form.teacher, logo: url } });
            }
          }}
        />
      )}
    </>
  );
}

function TabBtn({ active, onClick, icon, children }: { active: boolean; onClick: () => void; icon: React.ReactNode; children: React.ReactNode }) {
  return (
    <button onClick={onClick} className={`inline-flex items-center gap-2 rounded-full px-4 py-2.5 text-sm font-bold transition ${active ? "btn-glow text-white" : "border border-border text-muted-foreground hover:text-foreground"}`}>
      {icon}{children}
    </button>
  );
}

function Slider({
  label, value, min, max, step, display, onChange,
}: {
  label: string; value: number; min: number; max: number; step: number; display: string;
  onChange: (v: number) => void;
}) {
  return (
    <label className="block">
      <span className="mb-1 flex items-center justify-between text-xs font-semibold text-muted-foreground">
        {label} <span className="font-bold text-primary">{display}</span>
      </span>
      <input type="range" min={min} max={max} step={step} value={value}
        onChange={(e) => onChange(Number(e.target.value))}
        className="w-full accent-[hsl(var(--primary))]" />
    </label>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (<label className="block"><span className="mb-1 block text-xs font-semibold text-muted-foreground">{label}</span>{children}</label>);
}

function ColorPicker({ label, spec, onChange }: { label: string; spec?: ColorSpec; onChange: (v: ColorSpec) => void }) {
  const s: ColorSpec = spec ?? { mode: "theme" };
  return (
    <div className="rounded-2xl border border-border p-3">
      <p className="mb-2 text-xs font-semibold text-muted-foreground">{label}</p>
      <div className="flex flex-wrap items-center gap-2">
        <select value={s.mode} onChange={(e) => onChange({ ...s, mode: e.target.value as ColorSpec["mode"] })}
          className="rounded-xl border border-border bg-card/60 px-3 py-2 text-xs outline-none">
          <option value="theme">افتراضي (الثيم)</option>
          <option value="solid">لون واحد</option>
          <option value="gradient">متدرّج</option>
        </select>
        {s.mode === "solid" && (
          <input type="color" value={s.color ?? "#7c3aed"} onChange={(e) => onChange({ ...s, color: e.target.value })} className="size-9 cursor-pointer rounded-lg border border-border bg-transparent" />
        )}
        {s.mode === "gradient" && (
          <>
            <input type="color" value={s.from ?? "#7c3aed"} onChange={(e) => onChange({ ...s, from: e.target.value })} className="size-9 cursor-pointer rounded-lg border border-border bg-transparent" />
            <span className="text-xs text-muted-foreground">←</span>
            <input type="color" value={s.to ?? "#c026d3"} onChange={(e) => onChange({ ...s, to: e.target.value })} className="size-9 cursor-pointer rounded-lg border border-border bg-transparent" />
          </>
        )}
      </div>
    </div>
  );
}

function ImageUploader({ label, hint, value, onUpload, tall }: { label: string; hint: string; value: string; onUpload: (f: File) => void; tall?: boolean }) {
  const ref = useRef<HTMLInputElement>(null);
  const [busy, setBusy] = useState(false);
  return (
    <Section title={<>{label}</>}>
      <p className="mb-4 text-xs text-muted-foreground">{hint}</p>
      <div className={`relative grid ${tall ? "aspect-[4/5] max-w-xs" : "aspect-square max-w-[180px]"} mx-auto place-items-center overflow-hidden rounded-2xl border border-dashed border-border bg-muted/30`}>
        {value ? (
          <Image src={mediaSrc(value)} alt={label} fill unoptimized referrerPolicy="no-referrer" className="object-contain" />
        ) : (
          <span className="text-xs text-muted-foreground">لا توجد صورة</span>
        )}
      </div>
      <input ref={ref} type="file" accept="image/*" hidden onChange={async (e) => { const f = e.target.files?.[0]; if (f) { setBusy(true); await onUpload(f); setBusy(false); } }} />
      <Button variant="outline" className="mx-auto mt-4 flex" onClick={() => ref.current?.click()} disabled={busy}>
        <Upload className="size-4" /> {busy ? "جارٍ الرفع…" : "رفع صورة"}
      </Button>
    </Section>
  );
}

/** منزلق إعدادات الخلفية. */
function BgSlider({ label, value, min, max, step, display, onChange }: {
  label: string; value: number; min: number; max: number; step: number; display: string;
  onChange: (v: number) => void;
}) {
  return (
    <label className="block">
      <span className="mb-1 flex items-center justify-between text-xs font-semibold text-muted-foreground">
        <span>{label}</span>
        <span className="font-bold text-foreground">{display}</span>
      </span>
      <input
        type="range"
        min={min}
        max={max}
        step={step}
        value={value}
        onChange={(e) => onChange(Number(e.target.value))}
        className="w-full accent-[hsl(var(--primary))]"
      />
    </label>
  );
}

/**
 * محرّر بطاقات المراحل.
 * الصورة اختيارية وتملأ الفراغ بجانب قائمة الفروع في الصفحة الرئيسية،
 * وتقبل GIF متحرّكة كما تقبل صورة ساكنة.
 */
function StagesEditor({
  stages,
  onChange,
  onUpload,
}: {
  stages: StageCard[];
  onChange: (next: StageCard[]) => Promise<unknown> | void;
  onUpload: (f: File) => Promise<string | null>;
}) {
  const [busy, setBusy] = useState<string | null>(null);

  const patch = (id: string, p: Partial<StageCard>) =>
    onChange(stages.map((s) => (s.id === id ? { ...s, ...p } : s)));

  const add = () =>
    onChange([
      ...stages,
      { id: `st-${Date.now().toString(36)}`, name: "مرحلة جديدة", note: "", branches: ["فرع"], image: "" },
    ]);

  const remove = (id: string) => onChange(stages.filter((s) => s.id !== id));

  const upload = async (id: string, file: File) => {
    setBusy(id);
    const url = await onUpload(file);
    setBusy(null);
    if (url) await patch(id, { image: url });
  };

  return (
    <div className="grid gap-5">
      <Card>
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <h3 className="font-display font-extrabold">المراحل والفروع</h3>
            <p className="mt-1 text-xs text-muted-foreground">
              تظهر في قسم «المراحل» بالصفحة الرئيسية. الصورة تملأ الفراغ بجانب قائمة الفروع.
            </p>
          </div>
          <Button className="px-4 py-2" onClick={add}>
            <Plus className="size-4" /> إضافة مرحلة
          </Button>
        </div>
      </Card>

      {stages.length === 0 && (
        <p className="rounded-3xl border border-dashed border-border p-10 text-center text-sm text-muted-foreground">
          لا توجد مراحل — تُعرض القيم الافتراضية. أضِف مرحلة لتتحكّم بها بنفسك.
        </p>
      )}

      {stages.map((s) => (
        <Card key={s.id}>
          <div className="grid gap-5 lg:grid-cols-[1fr_minmax(0,18rem)]">
            <div className="grid gap-3">
              <Field label="اسم المرحلة">
                <input className="inp" value={s.name} onChange={(e) => patch(s.id, { name: e.target.value })} />
              </Field>
              <Field label="سطر توضيحي (اختياري)">
                <input className="inp" value={s.note ?? ""} onChange={(e) => patch(s.id, { note: e.target.value })} />
              </Field>
              <Field label="الفروع — فرع في كل سطر">
                <textarea
                  rows={5}
                  className="inp resize-y"
                  value={s.branches.join("\n")}
                  onChange={(e) =>
                    patch(s.id, { branches: e.target.value.split("\n").map((x) => x.trim()).filter(Boolean) })
                  }
                />
              </Field>
              <button
                type="button"
                onClick={() => remove(s.id)}
                className="w-fit rounded-full border border-border px-4 py-2 text-xs font-bold text-rose-500 transition hover:border-rose-500"
              >
                <Trash2 className="ms-1 inline size-3.5" /> حذف المرحلة
              </button>
            </div>

            <div>
              <span className="lbl">صورة المرحلة (صورة أو GIF متحرّكة)</span>
              <label className="block cursor-pointer overflow-hidden rounded-2xl border border-dashed border-border p-3 text-center transition hover:border-primary/50">
                <input
                  type="file"
                  accept="image/*,image/gif"
                  hidden
                  onChange={(e) => {
                    const f = e.target.files?.[0];
                    if (f) void upload(s.id, f);
                    e.target.value = "";
                  }}
                />
                {s.image ? (
                  /* eslint-disable-next-line @next/next/no-img-element */
                  <img src={mediaSrc(s.image)} alt="" className="mx-auto h-32 w-auto object-contain" />
                ) : (
                  <span className="grid h-32 place-items-center text-xs text-muted-foreground">
                    {busy === s.id ? "جارٍ الرفع…" : "اضغط لرفع صورة أو GIF"}
                  </span>
                )}
              </label>
              {s.image && (
                <button
                  type="button"
                  onClick={() => patch(s.id, { image: "" })}
                  className="mt-2 rounded-full border border-border px-3 py-1.5 text-[11px] font-bold text-rose-500 transition hover:border-rose-500"
                >
                  إزالة الصورة
                </button>
              )}
              <p className="mt-2 text-[10px] leading-relaxed text-muted-foreground">
                الـGIF يُعرض متحرّكاً كما هو — الصورة تُرفع بلا إعادة ترميز فلا تفقد حركتها.
              </p>
            </div>
          </div>
        </Card>
      ))}
    </div>
  );
}
