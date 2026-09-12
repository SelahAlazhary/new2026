"use client";

/** الخطط — إضافة/تعديل خطط الاشتراك التي تظهر على الصفحة الرئيسية وفي بوابة الطالب. */
import { useState } from "react";
import {
  Plus, Trash2, Pencil, X, Check, Eye, EyeOff, Layers, BookOpen, CalendarClock, Sparkles, Star,
  Percent, Palette, Tag, Image as ImageIcon, FileText, Wallet, Users,
} from "lucide-react";
import { PageHeader, Card } from "@/components/dashboard/ui";
import { Section } from "@/components/dashboard/section";
import { Button } from "@/components/ui/primitives";
import { TRACKS, STAGES, EDU_SYSTEMS, SCIENCE_BRANCHES, TRACK_STAGE, BRANCH_TRACK, AZHAR } from "@/lib/utils/data";
import { useContent } from "@/components/content/content-provider";
import { planPrice, audienceLabel, planForStudent, audienceBlindSpots } from "@/lib/business/plans";
import { picksLabel, isUnitKey, parsePick } from "@/lib/business/picks";
import { courseUnits } from "@/lib/business/course-units";
import { PicksEditor } from "@/components/admin/picks-editor";
import { TERMS } from "@/lib/business/signup-rules";
import type { SitePlan, PlanKind, PlanScope, PlanDiscount } from "@/lib/utils/types";
import { mediaSrc } from "@/lib/utils/media";
import { ImageStudio } from "@/components/admin/image-studio";
import { MotionArtPicker } from "@/components/admin/motion-art";

const KIND_LABEL: Record<PlanKind, string> = {
  term: "حتى نهاية الترم (بتاريخ)",
  month: "شهري (٣٠ يوماً)",
  custom: "مدّة مخصّصة بالأيام",
  lifetime: "دائم — لا ينتهي بعد الاشتراك",
};

type Form = {
  name: string; kind: PlanKind; scope: PlanScope; subjectId: string; picks: string[];
  price: number; durationDays: number; endsAt: string; badge: string;
  highlight: boolean; desc: string; perks: string; visible: boolean; order: number;
  color: string; cta: string; termNo: 1 | 2; whatsapp: string; track: string;
  image: string; imageSize: number; imageCut: boolean;
  audStage: string; audGrade: string; audSystem: string; audBranch: string;
  audGender: string;
  discountOn: boolean; discountType: "percent" | "amount"; discountValue: number;
  discountLabel: string; discountUntil: string;
};

const EMPTY: Form = {
  name: "", kind: "term", scope: "all", subjectId: "", picks: [], price: 0, durationDays: 0,
  endsAt: "", badge: "", highlight: false, desc: "", perks: "", visible: true, order: 0,
  color: "", cta: "", termNo: 1, whatsapp: "", track: "",
  image: "", imageSize: 56, imageCut: false,
  audStage: "", audGrade: "", audSystem: "", audBranch: "", audGender: "",
  discountOn: false, discountType: "percent", discountValue: 0,
  discountLabel: "", discountUntil: "",
};

/** ألوان جاهزة للخطط. */
/* ألوان الخطط — مشتقّة من هوية «مِداد وذهب»: أحبار غامقة ومعادن.
   اللوحة السابقة (بنفسجي/زمردي فاقع) كانت من هوية المنصّة الأصل. */
const PLAN_COLORS = [
  "#233b8b", // مِداد نيلي
  "#095e86", // أزرق المحبرة
  "#245c4b", // أندلسي
  "#87263a", // رُمّاني
  "#b8860b", // ذهب عتيق
  "#7c5c2b", // نحاس
  "#1f3d5c", // ليل المخطوط
  "#5c3a6e", // أرجوان خافت
];

export default function PlansPage() {
  const { db, save, content, uploadImage } = useContent();
  /* حالةُ الصورة: أستوديو القصّ للساكنة، ومنتقي المكتبة، ومؤشّر الرفع. */
  const [studio, setStudio] = useState<File | null>(null);
  const [picker, setPicker] = useState(false);
  const [imgBusy, setImgBusy] = useState(false);
  const plans = db?.plans ?? [];
  const subjects = db?.subjects ?? [];
  const grades = db?.grades ?? [];
  const students = (db?.users ?? []).filter((u) => u.role === "student");
  const [editing, setEditing] = useState<string | null>(null);
  const [open, setOpen] = useState(false);
  const [f, setF] = useState<Form>(EMPTY);

  const set = (patch: Partial<Form>) => setF((prev) => ({ ...prev, ...patch }));

  const startAdd = () => { setEditing(null); setF({ ...EMPTY, order: plans.length }); setOpen(true); };
  const startEdit = (p: SitePlan) => {
    setEditing(p.id);
    setF({
      name: p.name, kind: p.kind, scope: p.scope, subjectId: p.subjectId ?? "", picks: p.picks ?? [],
      price: p.price, durationDays: p.durationDays ?? 0, endsAt: (p.endsAt ?? "").slice(0, 10),
      badge: p.badge ?? "", highlight: Boolean(p.highlight), desc: p.desc ?? "",
      perks: (p.perks ?? []).join("\n"), visible: p.visible, order: p.order ?? 0,
      color: p.color ?? "", cta: p.cta ?? "", termNo: p.termNo ?? 1,
      image: p.image ?? "", imageSize: p.imageSize ?? 56, imageCut: Boolean(p.imageCut),
      whatsapp: p.whatsapp ?? "", track: p.audience?.track ?? p.track ?? "",
      audStage: p.audience?.stage ?? "", audGrade: p.audience?.grade ?? "",
      audSystem: p.audience?.system ?? "", audBranch: p.audience?.branch ?? "",
      audGender: p.audience?.gender ?? "",
      discountOn: Boolean(p.discount?.active),
      discountType: p.discount?.type ?? "percent",
      discountValue: p.discount?.value ?? 0,
      discountLabel: p.discount?.label ?? "",
      discountUntil: (p.discount?.until ?? "").slice(0, 10),
    });
    setOpen(true);
  };

  const commit = () => {
    if (!f.name.trim()) return;
    if (f.scope === "subject" && !f.subjectId) return;
    /* خطّةٌ مختارةٌ بلا اختيارٍ تفتح لا شيء — فلا تُحفظ صامتة. */
    if (f.scope === "picked" && f.picks.length === 0) return;
    const base: SitePlan = {
      id: editing ?? `PLAN-${Date.now()}`,
      name: f.name.trim(),
      kind: f.kind,
      scope: f.scope,
      subjectId: f.scope === "subject" ? f.subjectId : undefined,
      picks: f.scope === "picked" ? f.picks : undefined,
      termNo: f.scope === "term" ? f.termNo : undefined,
      price: Number(f.price) || 0,
      /* الدائم بلا مدّة ولا تاريخ — وجودُهما يوهم بانتهاءٍ لا يقع. */
      durationDays: f.kind === "lifetime" ? null : (f.durationDays > 0 ? Number(f.durationDays) : null),
      endsAt: f.kind === "term" && f.endsAt ? f.endsAt : null,
      badge: f.badge.trim() || undefined,
      highlight: f.highlight,
      desc: f.desc.trim() || undefined,
      perks: f.perks.split("\n").map((x) => x.trim()).filter(Boolean),
      visible: f.visible,
      order: Number(f.order) || 0,
      color: f.color || undefined,
      /* الصورةُ الفارغة لا تُخزَّن — ولا يُخزَّن حجمُ صورةٍ لا وجود لها. */
      image: f.image || undefined,
      imageSize: f.image ? Math.max(40, Math.min(200, Number(f.imageSize) || 56)) : undefined,
      imageCut: f.image && f.imageCut ? true : undefined,
      cta: f.cta.trim() || undefined,
      whatsapp: f.whatsapp.trim() || undefined,
      track: f.track || undefined,
      /* الفئة تُحفظ منزوعةَ الفارغ — الفارغ يعني «الكل» فلا يُخزَّن. */
      audience: (() => {
        const a = {
          stage: f.audStage || undefined,
          grade: f.audGrade || undefined,
          system: f.audSystem || undefined,
          track: f.track || undefined,
          branch: f.audBranch || undefined,
          gender: f.audGender || undefined,
        };
        return Object.values(a).some(Boolean) ? a : undefined;
      })(),
      discount: f.discountOn && Number(f.discountValue) > 0
        ? {
            active: true,
            type: f.discountType,
            value: Number(f.discountValue),
            label: f.discountLabel.trim() || undefined,
            until: f.discountUntil || null,
          } as PlanDiscount
        : undefined,
      createdAt: plans.find((p) => p.id === editing)?.createdAt ?? new Date().toISOString(),
    };
    const next = editing ? plans.map((p) => (p.id === editing ? base : p)) : [...plans, base];
    save({ plans: next });
    setOpen(false); setEditing(null); setF(EMPTY);
  };

  const remove = (id: string) => save({ plans: plans.filter((p) => p.id !== id) });
  const toggleVisible = (id: string) =>
    save({ plans: plans.map((p) => (p.id === id ? { ...p, visible: !p.visible } : p)) });

  const durationText = (p: SitePlan) => {
    if (p.kind === "lifetime") return "دائم — لا ينتهي";
    if (p.kind === "term") {
      const end = p.endsAt || content.termEnd;
      return end ? `حتى ${new Date(end).toLocaleDateString("ar-EG", { timeZone: "Africa/Cairo" })}` : `${p.durationDays ?? 120} يوماً`;
    }
    if (p.kind === "month") return `${p.durationDays ?? 30} يوماً`;
    return p.durationDays ? `${p.durationDays} يوماً` : "بلا انتهاء";
  };

  return (
    <>
      <PageHeader
        title="الخطط"
        subtitle="أنشئ خطط الاشتراك بأسمائها وأنواعها — تظهر في الصفحة الرئيسية وتُولَّد منها أكواد التفعيل"
        action={<Button className="px-5 py-2.5" onClick={startAdd}><Plus className="size-4" /> إضافة خطة</Button>}
      />

      {open && (
        <Card className="mb-6">
          <div className="mb-4 flex items-center justify-between">
            <h3 className="font-display font-extrabold">{editing ? "تعديل الخطة" : "خطة جديدة"}</h3>
            <button onClick={() => { setOpen(false); setEditing(null); }} className="grid size-8 place-items-center rounded-full border border-border"><X className="size-4" /></button>
          </div>
          <Section title="تعريف الخطة" subtitle="اسمها ونوعها وما تفتحه للطالب" icon={<FileText className="size-4" />} className="mb-4">
          <div className="grid gap-3 sm:grid-cols-3">
            <label className="sm:col-span-2"><span className="lbl">اسم الخطة</span>
              <input className="inp" value={f.name} onChange={(e) => set({ name: e.target.value })} placeholder="مثال: الترم الكامل — كل المواد" />
            </label>
            <label><span className="lbl">نوع الخطة</span>
              <select className="inp" value={f.kind} onChange={(e) => set({ kind: e.target.value as PlanKind })}>
                {(Object.keys(KIND_LABEL) as PlanKind[]).map((k) => <option key={k} value={k}>{KIND_LABEL[k]}</option>)}
              </select>
            </label>
            {/*
              نطاقٌ واحدٌ صريح.
              ------------------------------------------------------------
              كان النطاقُ حقلاً ثم يظهر حقلٌ ثانٍ لرقم الفصل، فيُقرأ
              «كل مواد فصل دراسي» ولا يُعرف أيُّ فصل إلا بعد النزول.
              صارت الخيارات مقروءةً كما تُقال: الأول كلّه، أو الثاني كلّه،
              أو الفصلان معاً، أو كورس بعينه.
            */}
            <label><span className="lbl">نطاق الخطة (ماذا تفتح؟)</span>
              <select
                className="inp"
                value={f.scope === "term" ? `term${f.termNo}` : f.scope}
                onChange={(e) => {
                  const v = e.target.value;
                  if (v === "term1") set({ scope: "term", termNo: 1 });
                  else if (v === "term2") set({ scope: "term", termNo: 2 });
                  else set({ scope: v as PlanScope });
                }}
              >
                <option value="term1">الفصل الدراسي الأول كلّه</option>
                <option value="term2">الفصل الدراسي الثاني كلّه</option>
                <option value="all">الفصلان معاً — كل المواد</option>
                <option value="subject">كورس محدّد</option>
                <option value="picked">موادّ مختارة — تؤشّر على ما تفتحه</option>
              </select>
              {/*
                أين تظهر هذه الخطة؟ سؤالٌ لا يجيب عنه اسمُ النطاق وحده،
                وخطةٌ لا يُعرف أين تظهر تبدو معطّلة وهي تعمل.
              */}
              <span className="mt-1 block text-[10px] leading-relaxed text-muted-foreground">
                {f.scope === "all"
                  ? "تفتح كل الكورسات في الفصلين معاً."
                  : f.scope === "term"
                    ? `تفتح كورسات ${f.termNo === 2 ? "الفصل الثاني" : "الفصل الأول"} كلَّها — وتظهر داخلها وحدها.`
                    : f.scope === "picked"
                      ? f.picks.length
                        ? `تفتح ${picksLabel(f.picks, subjects)} — وتظهر داخل كل كورسٍ تمسّه.`
                        : "أشّر على ما تفتحه في الشجرة أدناه — بلا اختيارٍ لن تُحفظ."
                      : f.subjectId
                        ? `تظهر داخل «${subjects.find((x) => x.id === f.subjectId)?.name ?? "الكورس المحدّد"}» وحده — لا في كورس آخر.`
                        : "اختر الكورس أوّلاً — بلا كورس لن تظهر لأحد."}
              </span>
            </label>
            {false && (
              <label><span className="lbl">الفصل الدراسي</span>
                <select className="inp" value={f.termNo} onChange={(e) => set({ termNo: Number(e.target.value) as 1 | 2 })}>
                  <option value={1}>الفصل الدراسي الأول</option>
                  <option value={2}>الفصل الدراسي الثاني</option>
                </select>
              </label>
            )}
            {f.scope === "picked" && (
              <div className="sm:col-span-2">
                <span className="lbl">الصلاحيات — أشّر على ما تفتحه</span>
                <PicksEditor subjects={subjects} value={f.picks} onChange={(picks) => set({ picks })} />
              </div>
            )}
            {f.scope === "subject" && (
              <label><span className="lbl">الكورس</span>
                <select className="inp" value={f.subjectId} onChange={(e) => set({ subjectId: e.target.value })}>
                  <option value="">— اختر الكورس —</option>
                  {subjects.map((s) => <option key={s.id} value={s.id}>{s.name}</option>)}
                </select>
              </label>
            )}
                      </div>
          </Section>

          <Section title="السعر ومدّة التفعيل" subtitle="كم تُكلّف الخطّة ومتى ينتهي ما تفتحه" icon={<Wallet className="size-4" />} className="mb-4">
          <div className="grid gap-3 sm:grid-cols-3">
            {/*
              السعرُ يُكتب هنا وحدَه.
              كان يُكتب في الكورس وفي المادّة وهنا، فيصير للشيء الواحد
              سعران لا يُعرف أيُّهما يُحصَّل ولا أيُّهما يُعدَّل — وهو ما لا
              يُحتمل في المال. فصارت بوّابةُ الدفع مصدرَه الوحيد، ومعه
              مدّةُ التفعيل أسفلَه.
            */}
            <label>
              <span className="lbl">السعر (ج.م)</span>
              <input type="number" className="inp" value={f.price} onChange={(e) => set({ price: Number(e.target.value) })} />
              <span className="mt-1 block text-[10px] leading-relaxed text-muted-foreground">
                هذا هو سعرُ ما تفتحه هذه الخطّة — كورساً كان أو موادَّ مختارة.
              </span>
            </label>
            {f.kind === "term" ? (
              <label><span className="lbl">تاريخ انتهاء الترم (فارغ = تاريخ الترم العام)</span>
                <input type="date" dir="ltr" className="inp text-right" value={f.endsAt} onChange={(e) => set({ endsAt: e.target.value })} />
              </label>
            ) : (
              <label><span className="lbl">المدّة بالأيام {f.kind === "month" ? "(٣٠ افتراضياً)" : "(٠ = بلا انتهاء)"}</span>
                <input type="number" className="inp" value={f.durationDays} onChange={(e) => set({ durationDays: Number(e.target.value) })} />
              </label>
            )}
          </div>
          </Section>

          <Section title="العرض على الصفحة" subtitle="ما يقرؤه الطالبُ على بطاقتها وترتيبُها بين الخطط" icon={<Eye className="size-4" />} className="mb-4">
          <div className="grid gap-3 sm:grid-cols-3">
            <label><span className="lbl">شارة (اختياري)</span>
              <input className="inp" value={f.badge} onChange={(e) => set({ badge: e.target.value })} placeholder="الأوفر" />
            </label>
            <label><span className="lbl">ترتيب العرض</span>
              <input type="number" className="inp" value={f.order} onChange={(e) => set({ order: Number(e.target.value) })} />
            </label>
            <label className="sm:col-span-3"><span className="lbl">وصف مختصر</span>
              <input className="inp" value={f.desc} onChange={(e) => set({ desc: e.target.value })} placeholder="يفتح كل المواد حتى نهاية الترم" />
            </label>
            <label><span className="lbl">نص الزر (اختياري)</span>
              <input className="inp" value={f.cta} onChange={(e) => set({ cta: e.target.value })} placeholder="اشترك الآن" />
            </label>
          </div>
          </Section>

          <Section title="لمن تظهر" subtitle="تُضيَّق بمرحلة الطالب وصفّه وشعبته — والمتروك «الكل» لا يُضيّق شيئاً" icon={<Users className="size-4" />} className="mb-4">
          <div className="grid gap-3 sm:grid-cols-3">
            {/*
              فئة الخطة — لمن تظهر بحسب بيانات تسجيله.
              كل حقل «الكل» لا يُضيّق شيئاً، فالخطة العامّة لا تحتاج ضبطاً،
              والموجَّهة تُضيّق بما شئتِ من الحقول معاً.
            */}
            <div className="sm:col-span-3">
              <div className="mb-2 flex flex-wrap items-center gap-2">
                <span className="lbl !mb-0">فئة الخطة (لمن تظهر)</span>
                <span className="rounded-full bg-primary/10 px-2.5 py-0.5 text-[10px] font-bold text-primary">
                  {audienceLabel({
                    track: f.track,
                    audience: {
                      stage: f.audStage, grade: f.audGrade, system: f.audSystem,
                      track: f.track, branch: f.audBranch, gender: f.audGender,
                    },
                  })}
                </span>
                {(() => {
                  /*
                    كم طالباً تطابقه هذه الفئة الآن؟
                    ------------------------------------------------------------
                    الفئةُ شرطٌ لا يُرى أثرُه إلا بعد الحفظ، فيُحفظ شرطٌ لا يطابق
                    أحداً ولا يُنبَّه أحد. الرقم هنا يقول ذلك قبل الحفظ.
                  */
                  const draft = {
                    track: f.track,
                    audience: {
                      stage: f.audStage, grade: f.audGrade, system: f.audSystem,
                      track: f.track, branch: f.audBranch, gender: f.audGender,
                    },
                  };
                  const n = students.filter((u) => planForStudent(draft, u)).length;
                  /*
                    لا يُنبَّه على حقلٍ إلا إن كان **لا أحد** يملك قيمةً له —
                    وقتها وحده لا يُضيّق شيئاً. أمّا ما يملكه بعضُهم فهو
                    تصفيةٌ صحيحة لا خللاً، والتنبيهُ عليه تشويشٌ.
                  */
                  const blind = Array.from(
                    new Set(students.flatMap((u) => audienceBlindSpots(draft, u)))
                  ).filter((label) =>
                    students.every((u) => audienceBlindSpots(draft, u).includes(label))
                  );
                  if (students.length === 0) return null;
                  return (
                    <>
                      <span className={`rounded-full px-2.5 py-0.5 text-[10px] font-bold ${
                        n === 0 ? "bg-rose-500/15 text-rose-600" : "bg-emerald-500/15 text-emerald-600"
                      }`}>
                        {n === 0 ? "لا يطابقها أيّ طالب" : `يطابقها ${n.toLocaleString("ar-EG")} من ${students.length.toLocaleString("ar-EG")}`}
                      </span>
                      {blind.length > 0 && (
                        <span className="rounded-full bg-amber-500/15 px-2.5 py-0.5 text-[10px] font-bold text-amber-700 dark:text-amber-400">
                          لا يُضيّق شيئاً: {blind.join(" · ")} — لا يملكها أيّ طالب
                        </span>
                      )}
                    </>
                  );
                })()}

                {[f.audStage, f.audGrade, f.audSystem, f.track, f.audBranch, f.audGender].some(Boolean) && (
                  <button
                    type="button"
                    onClick={() => set({ audStage: "", audGrade: "", audSystem: "", track: "", audBranch: "", audGender: "" })}
                    className="rounded-full border border-border px-2.5 py-0.5 text-[10px] font-bold text-muted-foreground"
                  >
                    مسح الفئة
                  </button>
                )}
              </div>

              <div className="grid gap-3 sm:grid-cols-3">
                <label><span className="lbl">المرحلة</span>
                  <select className="inp" value={f.audStage} onChange={(e) => set({ audStage: e.target.value, audGrade: "" })}>
                    <option value="">كل المراحل</option>
                    {STAGES.map((x) => <option key={x} value={x}>{x}</option>)}
                  </select>
                </label>

                <label><span className="lbl">الصف</span>
                  <select className="inp" value={f.audGrade} onChange={(e) => set({ audGrade: e.target.value })}>
                    <option value="">كل الصفوف</option>
                    {grades.map((g) => <option key={g.id} value={g.name}>{g.name}</option>)}
                  </select>
                </label>

                {/*
                  النظامُ التعليميّ لا يُضيّق شيئاً إن كان واحداً: المنصّةُ
                  أزهريّةٌ خالصة، فكلُّ طالبٍ فيها أزهريّ. وحقلٌ لا يُضيّق
                  لا يُعرض — يوهم بتصفيةٍ لا تقع.
                */}
                {EDU_SYSTEMS.length > 1 && (
                  <label><span className="lbl">النظام التعليمي</span>
                    <select className="inp" value={f.audSystem} onChange={(e) => set({ audSystem: e.target.value, audBranch: e.target.value === AZHAR ? "" : f.audBranch })}>
                      <option value="">كل الأنظمة</option>
                      {EDU_SYSTEMS.map((x) => <option key={x} value={x}>{x}</option>)}
                    </select>
                  </label>
                )}

                {/* الشعبة للثانوية وحدها — كما في شاشة التسجيل */}
                {(!f.audStage || f.audStage === TRACK_STAGE) && (
                  <label><span className="lbl">الشعبة</span>
                    <select className="inp" value={f.track} onChange={(e) => set({ track: e.target.value, audBranch: e.target.value === BRANCH_TRACK ? f.audBranch : "" })}>
                      <option value="">كل الشعب</option>
                      {TRACKS.map((t) => <option key={t} value={t}>{t}</option>)}
                    </select>
                  </label>
                )}

                {/* فرع العلمي لتربية وتعليم وحدها — الأزهر بلا تقسيم */}
                {f.track === BRANCH_TRACK && f.audSystem !== AZHAR && (
                  <label><span className="lbl">فرع الشعبة العلمية</span>
                    <select className="inp" value={f.audBranch} onChange={(e) => set({ audBranch: e.target.value })}>
                      <option value="">كل الفروع</option>
                      {SCIENCE_BRANCHES.map((x) => <option key={x} value={x}>{x}</option>)}
                    </select>
                  </label>
                )}

                <label><span className="lbl">النوع</span>
                  <select className="inp" value={f.audGender} onChange={(e) => set({ audGender: e.target.value })}>
                    <option value="">الكل</option>
                    <option value="male">طلاب</option>
                    <option value="female">طالبات</option>
                  </select>
                </label>
              </div>

              <span className="mt-2 block text-[10px] text-muted-foreground">
                الطالب لا يرى إلا الخطط التي تطابق بياناته. الحقل المتروك على «الكل» لا يُضيّق شيئاً.
              </span>
            </div>
            <label><span className="lbl">واتساب التفعيل (اختياري)</span>
              <input
                className="inp text-right" dir="ltr" inputMode="numeric"
                value={f.whatsapp}
                onChange={(e) => set({ whatsapp: e.target.value })}
                placeholder="201000000000"
              />
              <span className="mt-1 block text-[10px] text-muted-foreground">
                الرقم الذي يراسله الطلاب لتفعيل هذه الخطة. اتركه فارغاً ليُستخدم رقم المنصّة العام.
              </span>
            </label>

          </div>
          </Section>

          <Section title="الشكل والخصم" subtitle="لون البطاقة وصورتها وعرض التخفيض" icon={<Palette className="size-4" />} className="mb-4">
          <div className="grid gap-3 sm:grid-cols-3">
            {/* لون الخطة */}
            <div className="sm:col-span-3">
              <span className="lbl"><Palette className="inline size-3.5" /> لون الخطة</span>
              <div className="flex flex-wrap items-center gap-2">
                <button type="button" onClick={() => set({ color: "" })}
                  className={`rounded-full border px-3 py-1.5 text-xs font-bold transition ${!f.color ? "border-primary bg-primary/10 text-primary" : "border-border"}`}>
                  لون الثيم
                </button>
                {PLAN_COLORS.map((c) => (
                  <button key={c} type="button" onClick={() => set({ color: c })} title={c}
                    className={`size-8 rounded-full ring-offset-2 ring-offset-[hsl(var(--card))] transition ${f.color === c ? "ring-2 ring-primary" : ""}`}
                    style={{ background: c }} />
                ))}
                <input type="color" value={f.color || "#233b8b"} onChange={(e) => set({ color: e.target.value })}
                  className="size-9 cursor-pointer rounded-lg border border-border bg-transparent" title="لون مخصّص" />
              </div>
            </div>


            {/* ---------- صورة الخطة ---------- */}
            <div className="sm:col-span-3 rounded-2xl border border-border p-4">
              <span className="lbl mb-3 flex items-center gap-1.5">
                <ImageIcon className="inline size-3.5" /> صورة الخطة (تحلّ محلّ أيقونة النطاق)
              </span>

              <div className="flex flex-wrap items-start gap-4">
                <div
                  className="plan-image grid shrink-0 place-items-center rounded-2xl border border-dashed border-border bg-muted/30"
                  style={{ width: Math.max(56, f.imageSize), height: Math.max(56, f.imageSize) }}
                >
                  {f.image ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      src={mediaSrc(f.image)}
                      alt="معاينة صورة الخطة"
                      className={`max-h-full max-w-full object-contain ${f.imageCut ? "img-cut" : ""}`}
                      referrerPolicy="no-referrer"
                    />
                  ) : (
                    <span className="px-2 text-center text-[10px] text-muted-foreground">لا صورة</span>
                  )}
                </div>

                <div className="grid min-w-[220px] flex-1 gap-3">
                  <div className="flex flex-wrap items-center gap-2">
                    <input
                      id="plan-img"
                      type="file"
                      accept="image/*"
                      hidden
                      onChange={async (e) => {
                        const file = e.target.files?.[0];
                        e.target.value = "";
                        if (!file) return;
                        /*
                          المتحرّكةُ تُرفع كما هي: أستوديو الصورة يقرأ إطاراً
                          واحداً فيقتل الحركة. وخلفيتُها تُقصّ بالمزج لا بالتحرير.
                        */
                        const moving = /gif|webp|apng/i.test(file.type);
                        if (moving) {
                          setImgBusy(true);
                          const url = await uploadImage(file);
                          setImgBusy(false);
                          if (url) set({ image: url, imageCut: true });
                          return;
                        }
                        setStudio(file);
                      }}
                    />
                    <Button variant="outline" onClick={() => document.getElementById("plan-img")?.click()} disabled={imgBusy}>
                      <ImageIcon className="size-4" /> {imgBusy ? "جارٍ الرفع…" : "رفع صورة"}
                    </Button>
                    <button
                      type="button"
                      onClick={() => setPicker(true)}
                      className="rounded-xl border border-border px-3 py-2 text-xs font-bold text-muted-foreground transition hover:border-primary/40 hover:text-primary"
                    >
                      <Sparkles className="inline size-3.5" /> من مكتبة الحركة
                    </button>
                    {f.image ? (
                      <button
                        type="button"
                        onClick={() => set({ image: "", imageCut: false })}
                        className="rounded-xl border border-border px-3 py-2 text-xs font-bold text-muted-foreground transition hover:border-rose-500/50 hover:text-rose-500"
                      >
                        إزالة
                      </button>
                    ) : null}
                  </div>

                  <label className="flex items-center gap-3">
                    <span className="w-24 shrink-0 text-[11px] font-semibold text-muted-foreground">
                      الحجم {f.imageSize.toLocaleString("ar-EG")}px
                    </span>
                    <input
                      type="range"
                      min={40}
                      max={200}
                      step={4}
                      value={f.imageSize}
                      onChange={(e) => set({ imageSize: Number(e.target.value) })}
                      className="h-1.5 flex-1 accent-[hsl(var(--primary))]"
                    />
                  </label>

                  <label className="flex items-center gap-2 text-xs font-bold">
                    <input
                      type="checkbox"
                      checked={f.imageCut}
                      onChange={(e) => set({ imageCut: e.target.checked })}
                      className="size-4 accent-[hsl(var(--primary))]"
                    />
                    إسقاط الخلفية البيضاء
                  </label>
                  <p className="text-[10px] leading-relaxed text-muted-foreground">
                    الساكنةُ تُفتح في أستوديو الصورة فتُقصّ خلفيتُها ويُحفظ الشفّافُ نفسُه.
                    والمتحرّكةُ تُرفع كما هي — تحريرُها يقرأ إطاراً واحداً فيقتل الحركة — وتُسقَط
                    خلفيتُها بالمزج، وهو يصلح لخلفيةٍ بيضاء لا لخلفيةٍ ملوّنة.
                  </p>
                </div>
              </div>
            </div>

            {/* الخصم */}
            <div className="sm:col-span-3 rounded-2xl border border-border p-4">
              <label className="mb-3 flex items-center gap-2">
                <input type="checkbox" checked={f.discountOn} onChange={(e) => set({ discountOn: e.target.checked })} className="size-4 accent-[hsl(var(--primary))]" />
                <span className="inline-flex items-center gap-1.5 text-sm font-bold"><Percent className="size-4 text-primary" /> تفعيل خصم على هذه الخطة</span>
              </label>
              {f.discountOn && (
                <div className="grid gap-3 sm:grid-cols-4">
                  <label><span className="lbl">نوع الخصم</span>
                    <select className="inp" value={f.discountType} onChange={(e) => set({ discountType: e.target.value as "percent" | "amount" })}>
                      <option value="percent">نسبة ٪</option>
                      <option value="amount">مبلغ ثابت (ج.م)</option>
                    </select>
                  </label>
                  <label><span className="lbl">القيمة</span>
                    <input type="number" min={0} className="inp" value={f.discountValue} onChange={(e) => set({ discountValue: Number(e.target.value) })} />
                  </label>
                  <label><span className="lbl">نص العرض (اختياري)</span>
                    <input className="inp" value={f.discountLabel} onChange={(e) => set({ discountLabel: e.target.value })} placeholder="عرض بداية الترم" />
                  </label>
                  <label><span className="lbl">ينتهي في (اختياري)</span>
                    <input type="date" dir="ltr" className="inp text-right" value={f.discountUntil} onChange={(e) => set({ discountUntil: e.target.value })} />
                  </label>
                  <p className="sm:col-span-4 rounded-2xl bg-primary/8 px-3 py-2 text-xs font-bold text-primary">
                    السعر بعد الخصم:{" "}
                    {(f.discountType === "percent"
                      ? Math.max(0, f.price - Math.round((f.price * Math.min(100, f.discountValue)) / 100))
                      : Math.max(0, f.price - f.discountValue)
                    ).toLocaleString("ar-EG")} ج.م
                    <span className="mr-2 font-normal text-muted-foreground line-through">{f.price.toLocaleString("ar-EG")}</span>
                  </p>
                </div>
              )}
            </div>

          </div>
          </Section>

          <Section title="المزايا والنشر" subtitle="ما يُكتب داخل البطاقة، ثمّ إظهارها للطلاب" icon={<Check className="size-4" />} className="mb-4">
          <div className="grid gap-3 sm:grid-cols-3">
            <label className="sm:col-span-3"><span className="lbl">المزايا (سطر لكل ميزة)</span>
              <textarea rows={4} className="inp" value={f.perks} onChange={(e) => set({ perks: e.target.value })} placeholder="كل الدروس والملفات" />
            </label>
            <label className="flex items-center gap-2">
              <input type="checkbox" checked={f.visible} onChange={(e) => set({ visible: e.target.checked })} className="size-4 accent-[hsl(var(--primary))]" />
              <span className="text-sm text-muted-foreground">إظهارها في الصفحة الرئيسية</span>
            </label>
            <label className="flex items-center gap-2">
              <input type="checkbox" checked={f.highlight} onChange={(e) => set({ highlight: e.target.checked })} className="size-4 accent-[hsl(var(--primary))]" />
              <span className="text-sm text-muted-foreground">إبرازها (الأكثر طلباً)</span>
            </label>
          </div>
          </Section>

          {/*
            زرُّ الحفظ خارج الأقسام لا داخل آخرها.
            الأقسامُ ستّة، وزرٌّ في آخرها يعني أنّ من عدّل السعرَ في الثاني
            يمرّ على أربعةٍ لا شأنَ له بها ليحفظ.
          */}
          <div className="flex flex-wrap items-center gap-3 border-t border-border pt-4">
            <Button className="px-6 py-2.5" onClick={commit}><Check className="size-4" /> {editing ? "حفظ التعديل" : "حفظ الخطة"}</Button>
            <p className="text-xs text-muted-foreground">
              اللازمُ الاسمُ والنطاقُ والسعر — وما بعدها له افتراضٌ صالح.
            </p>
          </div>
        </Card>
      )}

      {plans.length === 0 ? (
        <p className="rounded-3xl border border-dashed border-border p-10 text-center text-sm text-muted-foreground">
          لا توجد خطط بعد. أضِف أول خطة لتظهر على الصفحة الرئيسية ويُولَّد منها كود تفعيل.
        </p>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3" data-reveal-group>
          {[...plans].sort((a, b) => (a.order ?? 0) - (b.order ?? 0)).map((p) => (
            <div key={p.id}>
              <Card className={`flex h-full flex-col ${p.highlight ? "ring-1 ring-primary/40" : ""}`}>
                <div className="flex items-start justify-between gap-2">
                  <div className="flex min-w-0 items-start gap-2">
                    <span className="mt-1.5 size-3 shrink-0 rounded-full" style={{ background: p.color || "hsl(var(--primary))" }} />
                    <div className="min-w-0">
                    <p className="font-display text-lg font-extrabold">{p.name}</p>
                    <p className="mt-1 inline-flex items-center gap-1 text-xs text-muted-foreground">
                      {p.scope === "subject" ? <BookOpen className="size-3.5" /> : <Layers className="size-3.5" />}
                      {p.scope === "all" ? "كل المواد"
                        : p.scope === "picked" ? picksLabel(p.picks, subjects)
                        : p.scope === "term" ? `كل مواد ${p.termNo === 2 ? "الفصل الثاني" : "الفصل الأول"}`
                          : subjects.find((s) => s.id === p.subjectId)?.name ?? "كورس محذوف"}
                    </p>
                    </div>
                  </div>
                  {p.badge && <span className="inline-flex items-center gap-1 rounded-full bg-primary/12 px-2 py-0.5 text-[10px] font-bold text-primary"><Sparkles className="size-3" /> {p.badge}</span>}
                </div>
                {(() => {
                  const priced = planPrice(p);
                  return (
                    <div className="mt-3 flex flex-wrap items-end gap-2">
                      <p className="font-display text-2xl font-extrabold" style={{ color: p.color || "hsl(var(--primary))" }}>
                        {priced.price.toLocaleString("ar-EG")} <span className="text-xs font-normal text-muted-foreground">ج.م</span>
                      </p>
                      {priced.active && (
                        <>
                          <span className="pb-1 text-xs font-bold text-muted-foreground line-through">{priced.original.toLocaleString("ar-EG")}</span>
                          <span className="mb-1 inline-flex items-center gap-1 rounded-full bg-emerald-500/15 px-2 py-0.5 text-[10px] font-bold text-emerald-600">
                            <Tag className="size-3" /> خصم {priced.percent}٪{p.discount?.until ? ` · حتى ${new Date(p.discount.until).toLocaleDateString("ar-EG", { timeZone: "Africa/Cairo" })}` : ""}
                          </span>
                        </>
                      )}
                    </div>
                  );
                })()}
                <p className="mt-1 inline-flex items-center gap-1 text-xs text-muted-foreground"><CalendarClock className="size-3.5" /> {durationText(p)}</p>
                {p.desc && <p className="mt-3 text-xs text-muted-foreground">{p.desc}</p>}
                {(p.perks?.length ?? 0) > 0 && (
                  <ul className="mt-3 space-y-1 text-xs text-muted-foreground">
                    {p.perks!.slice(0, 4).map((x, k) => <li key={k} className="flex gap-1.5"><Check className="mt-0.5 size-3 shrink-0 text-primary" />{x}</li>)}
                  </ul>
                )}
                <div className="mt-auto flex items-center gap-1 border-t border-border pt-4">
                  <span className={`ml-auto inline-flex items-center gap-1 text-[11px] font-bold ${p.visible ? "text-emerald-500" : "text-muted-foreground"}`}>
                    {p.visible ? <Eye className="size-3.5" /> : <EyeOff className="size-3.5" />} {p.visible ? "ظاهرة" : "مخفيّة"}
                  </span>
                  {p.highlight && <Star className="size-4 text-amber-500" />}
                  <button onClick={() => toggleVisible(p.id)} title="إظهار/إخفاء" className="grid size-8 place-items-center rounded-full border border-border text-primary transition hover:border-primary">
                    {p.visible ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
                  </button>
                  <button onClick={() => startEdit(p)} title="تعديل" className="grid size-8 place-items-center rounded-full border border-border text-primary transition hover:border-primary"><Pencil className="size-4" /></button>
                  <button onClick={() => remove(p.id)} title="حذف" className="grid size-8 place-items-center rounded-full border border-border text-rose-500 transition hover:border-rose-500"><Trash2 className="size-4" /></button>
                </div>
              </Card>
            </div>
          ))}
        </div>
      )}

      {studio && (
        <ImageStudio
          file={studio}
          onCancel={() => setStudio(null)}
          onDone={async (out) => {
            setImgBusy(true);
            const url = await uploadImage(out);
            setImgBusy(false);
            setStudio(null);
            /* المقصوصةُ شفّافةٌ أصلاً، فلا تحتاج مزجاً فوق القصّ. */
            if (url) set({ image: url, imageCut: false });
          }}
        />
      )}

      {picker && (
        <MotionArtPicker onClose={() => setPicker(false)} onPick={(url) => set({ image: url, imageCut: false })} />
      )}
    </>
  );
}
