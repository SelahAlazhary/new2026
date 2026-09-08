"use client";

import { use, useEffect, useRef, useState } from "react";
import Link from "next/link";
import Image from "next/image";
import {
  ArrowRight, Plus, Trash2, PlayCircle, Gift, FileText, Upload, ImageIcon,
  ListChecks, ChevronDown, Check, Link2, X, Loader2, Video, Palette, Wallet, Layers,
  ListVideo, Eye } from "lucide-react";
import { courseUnits, isSplit, withUnits, LEGACY_UNIT_ID } from "@/lib/business/course-units";
import { PageHeader, Card } from "@/components/dashboard/ui";
import { Collapse } from "@/components/dashboard/collapse";
import { Curriculum } from "@/components/admin/curriculum";
import { Button } from "@/components/ui/primitives";
import { useContent } from "@/components/content/content-provider";
import { CourseArt, COVER_PATTERNS } from "@/components/brand/course-art";
import { CoverTextEditor } from "@/components/admin/cover-text-editor";
import { CoverStickersEditor } from "@/components/admin/cover-stickers-editor";
import type { Lesson, Material, Subject, Quiz, QuizQuestion, ImageFit, CoverPattern, CoverText, CoverSticker, Unit } from "@/lib/utils/types";
import { mediaSrc } from "@/lib/utils/media";
import { Section } from "@/components/dashboard/section";

/** ألوان خلفية جاهزة للوحة الغلاف — من عائلة هوية المخطوط. */
const COVER_COLORS: { hex: string; label: string }[] = [
  { hex: "#233b8b", label: "مِداد" },
  { hex: "#095e86", label: "نِيلي" },
  { hex: "#245c4b", label: "أندلسي" },
  { hex: "#87263a", label: "رُمّاني" },
  { hex: "#8a6212", label: "ذهب عتيق" },
  { hex: "#4a3570", label: "بنفسج" },
  { hex: "#1f5a5e", label: "فيروزي" },
  { hex: "#6b3a1e", label: "بُنّي" },
];

export default function CourseManage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const { db, save, uploadImage, content } = useContent();
  const subjects = db?.subjects ?? [];
  const subject = subjects.find((s) => s.id === id);
  const [form, setForm] = useState({ title: "", url: "", duration: "", isFree: false });
  const [mat, setMat] = useState({ title: "", url: "" });
  const coverRef = useRef<HTMLInputElement>(null);
  const [coverUploading, setCoverUploading] = useState(false);
  const bannerRef = useRef<HTMLInputElement>(null);
  const [bannerUploading, setBannerUploading] = useState(false);
  /*
    مقاسُ اللافتة المرفوعة — يُقرأ من الصورة نفسِها.
    ------------------------------------------------------------------
    وقولُ المقاس المطلوب لا يكفي: المشرفُ يرفع ما عنده ولا يعرف أوافق أم
    خالف حتّى يرى النتيجة. فتُقاس الصورةُ ويُقال له صراحةً: كم مقاسُها،
    وكم يُقصّ منها، وأين.
  */
  const [bannerSize, setBannerSize] = useState<{ w: number; h: number } | null>(null);
  /* «نُسخ ✓» يظهر لحظةً ثمّ يعود — الزرُّ يقول إنّه عمل */
  const [copied, setCopied] = useState<string | null>(null);
  const [quizFor, setQuizFor] = useState<string | null>(null);
  /*
    المادّةُ المفتوحة.
    عرضُ الموادّ كلِّها بدروسها معاً يجعل الصفحةَ طوماراً: عشرُ موادّ في
    كلٍّ عشرةُ دروسٍ تعني مئةَ بطاقةٍ في شاشةٍ واحدة. فالموادُّ شبكةٌ
    تُتصفَّح بالنظر، والدروسُ لا تُفتح إلّا لمن طُلبت مادّتُه.
  */
  const [openUnit, setOpenUnit] = useState<string | null>(null);
  /*
    الدرسُ المفتوحُ للتعديل.
    كان يُحذف ويُضاف من جديد لتصحيح حرفٍ في عنوانه — والحذفُ يأخذ معه
    اختبارَه ومرفقاتِه. فصار يُعدَّل في موضعه: حقولُه تُفتح على بطاقته،
    وما لم يُمسّ يبقى كما هو.
  */
  const [editLesson, setEditLesson] = useState<string | null>(null);
  /** المادّةُ التي يُضاف إليها الدرسُ الجديد. */
  const [intoUnit, setIntoUnit] = useState<string>("");
  const videoRef = useRef<HTMLInputElement>(null);
  const matRef = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState<"video" | "material" | null>(null);
  const driveOn = content.mediaHost === "drive";

  /*
    قياسُ نسبة الغلاف — **قبل الحارس لا بعده**.
    ------------------------------------------------------------------
    كان هذا الخطّافُ يقع بعد `if (!subject) return`. وأوّلَ رسمٍ تكون
    القاعدةُ لم تصل بعد فيكون `subject` غيرَ معرَّف، فيخرج المكوّنُ باكراً
    ولا يُسجَّل الخطّاف. فإذا وصلت القاعدةُ ووُجد الكورس، رُسم المكوّنُ
    بخطّافٍ زائدٍ عن الرسمة السابقة — و«عددُ الخطّافات لا يتغيّر بين
    رسمتين» قاعدةٌ لا تُخالَف، فتنهار الصفحةُ كلُّها.

    وهذا هو سببُ «تعذّر تحميل الصفحة» عند فتح كورسٍ من قائمته: التنقّلُ
    يُركّب المكوّنَ قبل أن تصل بياناتُه.

    فمكانُه هنا — فوق كلّ خروجٍ مشروط — ويحرس نفسَه بـ`subject?.cover`.
  */
  useEffect(() => {
    if (!subject?.cover) return;
    const img = new window.Image();
    img.onload = () => {
      const r = Number((img.naturalWidth / img.naturalHeight).toFixed(4));
      if (r > 0 && Math.abs((subject.coverRatio ?? 0) - r) > 0.01) {
        save({ subjects: subjects.map((x) => (x.id === id ? { ...subject, coverRatio: r } : x)) });
      }
    };
    img.src = subject.cover;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [subject?.cover]);

  if (!subject) {
    return (
      <Card className="mx-auto max-w-md text-center">
        <p className="py-6 text-sm text-muted-foreground">الكورس غير موجود.</p>
        <Link href="/admin/subjects" className="inline-flex rounded-full border border-border px-5 py-2 text-sm font-bold">العودة للكورسات</Link>
      </Card>
    );
  }
  /*
    الموادُّ هي مصدرُ الحقيقة، و`videos` مرآةٌ لها.
    ------------------------------------------------------------
    والمرآةُ مقصودة: أربعةٌ وخمسون كورساً وعشرةُ قرّاءٍ في الشيفرة يقرؤون
    `videos`. فلو صارت الموادُّ وحدَها هي المكتوبة لوجب تغييرُ العشرة
    دفعةً واحدة، ويكفي أن يُنسى واحدٌ ليقرأ كورساً فارغاً. فالكتابةُ
    تُحدّثهما معاً: القديمُ يقرأ ما يعرف، والجديدُ يقرأ الموادّ.

    ولا تُكتب `units` حتّى يُقسّم الأستاذُ فعلاً — فكورسٌ لم يُقسَّم يبقى
    في القاعدة كما كان، ولا يتبدّل شكلُ أربعةٍ وخمسين كورساً لأنّ أحدَها
    فُتح.
  */
  const units = courseUnits(subject);
  const videos = units.flatMap((u) => u.lessons ?? []);

  /* التركيبُ في `lib/course-units` — يُكتب من هنا ومن قسم «كلّ الدروس»
     بالطريقة نفسِها، فلا يفترق الحقلان. */
  const persistUnits = (next: Unit[]) => {
    const updated = withUnits(subject, next);
    save({ subjects: subjects.map((s) => (s.id === id ? updated : s)) });
  };

  /** يمرّ على دروس الموادّ كلِّها — للاختبار والتعديل الموضعيّ. */
  const mapLessons = (fn: (l: Lesson) => Lesson) =>
    persistUnits(units.map((u) => ({ ...u, lessons: (u.lessons ?? []).map(fn) })));

  /**
   * إضافةُ درس — والوحدةُ تُمرَّر لا تُقرأ من الحالة.
   * ------------------------------------------------------------------
   * كان المستدعي يكتب `setIntoUnit(uid); add();` في معالِجٍ واحد. وحالةُ
   * React لا تتغيّر في السطر التالي بل في الرسم التالي — فيقرأ `add`
   * القيمةَ القديمة، ويسقط إلى «آخر وحدة». فمن ضغط «إضافة درس» في
   * الوحدة الأولى وجد درسَه في الأخيرة، ولا رسالةَ تقول له لماذا.
   *
   * والحلُّ ألّا يمرّ المقصدُ بالحالة أصلاً: مَن ضغط الزرَّ يعرف وحدتَه
   * فيقولها في النداء.
   */
  const add = (into?: string) => {
    if (!form.title.trim() || !form.url.trim()) return;
    const lesson: Lesson = { id: `L-${Date.now()}`, title: form.title.trim(), url: form.url.trim(), duration: form.duration.trim() || undefined, isFree: form.isFree };
    const wanted = into ?? intoUnit;
    const target = units.some((u) => u.id === wanted) ? wanted : units[units.length - 1].id;
    persistUnits(units.map((u) => (u.id === target ? { ...u, lessons: [...(u.lessons ?? []), lesson] } : u)));
    setForm({ title: "", url: "", duration: "", isFree: false });
  };
  /** يُعدِّل حقلاً في درسٍ بعينه — وما سواه يبقى. */
  const patchLesson = (lid: string, p: Partial<Lesson>) =>
    mapLessons((l) => (l.id === lid ? { ...l, ...p } : l));

  const remove = (lid: string) =>
    persistUnits(units.map((u) => ({ ...u, lessons: (u.lessons ?? []).filter((v) => v.id !== lid) })));
  /** تحديث اختبار درس (تشغيل/إيقاف + الأسئلة). */
  const setQuiz = (lid: string, quiz: Quiz | undefined) =>
    mapLessons((v) => (v.id === lid ? { ...v, quiz } : v));

  /* ---------- إدارةُ الموادّ ---------- */
  const addUnit = () => {
    /*
      أوّلُ إضافةٍ تُثبّت المادّةَ الملفوفة مادّةً حقيقيّةً بمعرّفٍ خاصّ بها.
      ولولا ذلك لبقي معرّفُها `u-legacy` فيظنّها المُخزِّن غيرَ مقسَّمةٍ
      ويكتبها مسطّحةً — فتضيع المادّةُ الثانيةُ فورَ إنشائها.
    */
    const base = units[0]?.id === LEGACY_UNIT_ID
      ? [{ ...units[0], id: `u${Date.now().toString(36)}`, title: "المادّة الأولى" }]
      : units;
    persistUnits([...base, { id: `u${Date.now().toString(36)}x`, title: `المادّة ${(base.length + 1).toLocaleString("ar-EG")}`, lessons: [] }]);
  };
  const renameUnit = (uid: string, title: string) =>
    persistUnits(units.map((u) => (u.id === uid ? { ...u, title } : u)));
  /** حذفُ مادّةٍ يُعيد دروسَها إلى ما قبلها — ولا يحذفها معها. */
  const removeUnit = (uid: string) => {
    if (units.length <= 1) return;
    const i = units.findIndex((u) => u.id === uid);
    const keep = units[i].lessons ?? [];
    const rest = units.filter((u) => u.id !== uid);
    const at = Math.max(0, i - 1);
    persistUnits(rest.map((u, k) => (k === at ? { ...u, lessons: [...(u.lessons ?? []), ...keep] } : u)));
  };
  /** نقلُ درسٍ إلى مادّةٍ أخرى — يُنزع من موضعه ويُلحق بآخر المقصد. */
  const moveLessonTo = (lid: string, uid: string) => {
    const lesson = videos.find((v) => v.id === lid);
    if (!lesson) return;
    persistUnits(
      units.map((u) => ({
        ...u,
        lessons:
          u.id === uid
            ? [...(u.lessons ?? []).filter((v) => v.id !== lid), lesson]
            : (u.lessons ?? []).filter((v) => v.id !== lid),
      })),
    );
  };

  /** إحصاء محاولات الطلاب على اختبار درس. */
  const quizStats = (lid: string) => {
    const rs = (db?.users ?? []).flatMap((u) => (u.quizResults ?? []).filter((r) => r.lessonId === lid));
    if (!rs.length) return { attempts: 0, avg: 0, passed: 0 };
    return {
      attempts: rs.length,
      avg: Math.round(rs.reduce((a, r) => a + r.percent, 0) / rs.length),
      passed: rs.filter((r) => r.passed).length,
    };
  };

  const materials = subject.materials ?? [];
  const persistMats = (m: Material[]) =>
    save({ subjects: subjects.map((s) => (s.id === id ? { ...subject, materials: m } : s)) });
  /** الملفات تُضاف برابط خارجي (Google Drive / PDF / أي رابط مباشر). */
  const addMaterial = () => {
    if (!mat.url.trim()) return;
    persistMats([...materials, { id: `M-${Date.now()}`, title: mat.title.trim() || mat.url.trim(), url: mat.url.trim() }]);
    setMat({ title: "", url: "" });
  };
  const removeMaterial = (mid: string) => persistMats(materials.filter((m) => m.id !== mid));

  /** ضبط الغلاف (محاذاة/تكبير) — يُحفظ فوراً وتتحدّث المعاينة. */
  const setCoverFit = (patch: Partial<ImageFit>) =>
    save({
      subjects: subjects.map((s) =>
        s.id === id ? { ...subject, coverFit: { ...(subject.coverFit ?? {}), ...patch } } : s
      ),
    });

  /** الصور الملصقة على الغلاف. */
  const setCoverStickers = (next: CoverSticker[]) =>
    save({ subjects: subjects.map((s) => (s.id === id ? { ...subject, coverStickers: next } : s)) });

  /** نصّ الغلاف وموضعه — يُحفظ عند كل تغيير (السحب يحفظ عند رفع الإصبع). */
  const setCoverText = (next: CoverText) =>
    save({ subjects: subjects.map((s) => (s.id === id ? { ...subject, coverText: next } : s)) });

  /** زخرفة اللوحة (المربّعات) — "auto" اشتقاق تلقائي و"none" بلا زخرفة. */
  const setCoverPattern = (pattern: CoverPattern) =>
    save({ subjects: subjects.map((s) => (s.id === id ? { ...subject, coverPattern: pattern } : s)) });

  /** لون خلفية اللوحة — فارغ يعيدها لألوان الثيم. */
  const setCoverColor = (hex: string) =>
    save({ subjects: subjects.map((s) => (s.id === id ? { ...subject, coverColor: hex } : s)) });

  const uploadCover = async (file: File) => {
    setCoverUploading(true);
    const url = await uploadImage(file);
    setCoverUploading(false);
    if (url) save({ subjects: subjects.map((s) => (s.id === id ? { ...subject, cover: url } : s)) });
    if (coverRef.current) coverRef.current.value = "";
  };

  useEffect(() => {
    const src = subject?.banner?.trim();
    if (!src) { setBannerSize(null); return; }
    let alive = true;
    /* `document.createElement` لا `new Image()`: الاسمُ `Image` مأخوذٌ في
       هذا الملفّ لأيقونةٍ مستوردة، فيُحلّ إليها لا إلى صورة المتصفّح. */
    const img = document.createElement("img");
    img.onload = () => { if (alive) setBannerSize({ w: img.naturalWidth, h: img.naturalHeight }); };
    img.onerror = () => { if (alive) setBannerSize(null); };
    img.src = src;
    return () => { alive = false; };
  }, [subject?.banner]);

  /** رفعُ لافتة صفحة الكورس — مستقلّةٌ عن غلاف البطاقة. */
  const uploadBanner = async (file: File) => {
    setBannerUploading(true);
    const url = await uploadImage(file);
    setBannerUploading(false);
    if (url) save({ subjects: subjects.map((x) => (x.id === id ? { ...subject, banner: url } : x)) });
    if (bannerRef.current) bannerRef.current.value = "";
  };
  /*
    الترتيبُ داخل المادّة لا عبرها.
    كان السهمُ يبدّل الدرسَ بجاره في القائمة المسطّحة — وجارُه قد يكون في
    مادّةٍ أخرى، فيقفز الدرسُ بين البابين بضغطةٍ لم تُرِد ذلك. والنقلُ بين
    الموادّ له قائمتُه المنسدلة، وهو فعلٌ يُقصد لا يقع بالسهو.
  */
  /*
    نقلٌ من موضعٍ إلى موضع. وكانت الحركةُ بخطوةٍ واحدةٍ (`dir: -1 | 1`)
    فنقلُ درسٍ من العاشر إلى الأوّل تسعُ ضغطاتٍ وتسعُ كتاباتٍ إلى قاعدة
    البيانات. والشجرةُ تسحب، والسحبُ يعرف مقصدَه فيُكتب مرّةً واحدة.

    ومن لا يسحب — بلوحة المفاتيح — ينقل الدرسَ بقائمة «الوحدة» في لوح
    إدارته، وهي طريقٌ لا تحتاج فأرةً أصلاً.
  */
  const reorderUnit = (from: number, to: number) => {
    if (from === to || from < 0 || to < 0 || from >= units.length || to >= units.length) return;
    const arr = [...units];
    const [it] = arr.splice(from, 1);
    arr.splice(to, 0, it);
    persistUnits(arr);
  };

  const reorderLesson = (uid: string, from: number, to: number) => {
    const u = units.find((x) => x.id === uid);
    if (!u) return;
    const arr = [...(u.lessons ?? [])];
    if (from === to || from < 0 || to < 0 || from >= arr.length || to >= arr.length) return;
    const [it] = arr.splice(from, 1);
    arr.splice(to, 0, it);
    persistUnits(units.map((x) => (x.id === uid ? { ...x, lessons: arr } : x)));
  };

  /** نسخةٌ تقع تحت أصلها — لا في آخر الوحدة، فالمنسوخُ يُعدَّل في موضعه. */
  const duplicateLesson = (lid: string) =>
    persistUnits(
      units.map((u) => {
        const arr = [...(u.lessons ?? [])];
        const i = arr.findIndex((l) => l.id === lid);
        if (i < 0) return u;
        const src = arr[i];
        arr.splice(i + 1, 0, { ...src, id: `L-${Date.now()}`, title: `${src.title} — نسخة` });
        return { ...u, lessons: arr };
      })
    );


  return (
    <>
      <Link href="/admin/subjects" className="mb-4 inline-flex items-center gap-1.5 text-sm text-muted-foreground transition hover:text-primary">
        <ArrowRight className="size-4" /> كل الكورسات
      </Link>
      <PageHeader
        title={`دروس: ${subject.name}`}
        subtitle={`${videos.length} درس · السعر ${subject.price.toLocaleString("ar-EG")} ج.م`}
        /*
          المعاينةُ من هنا — لا بحسابِ طالبٍ اشترى.
          كان الأستاذُ لا يرى ما بناه إلّا بالخروج من لوحته والدخول بحسابٍ
          آخرَ والمرورِ ببوّابة الدفع. فكثيرٌ لا يتأكّد، ويكتشف العطبَ من
          شكوى طالب.
        */
        action={
          <Link
            href={`/admin/courses/${id}/preview`}
            className="inline-flex items-center gap-1.5 rounded-2xl border border-border px-4 py-2.5 text-xs font-bold transition hover:border-primary/50 hover:text-primary"
          >
            <Eye className="size-4" /> معاينة كطالب
          </Link>
        }
      />

      {/*
        الإتاحةُ المجانيّة — مفتاحٌ ظاهرٌ لا مدفونٌ في إعداد.
        كورسٌ يُفتح مجّاناً حالةٌ مؤقّتةٌ في الغالب: موسمٌ أو تجربة. ومن
        فتحه ينساه، فيبقى منهجُه مبذولاً شهوراً. فالمفتاحُ في أعلى
        الصفحة، وحالتُه مكتوبةٌ بلونٍ يُرى من بعيد.
      */}
      <Card className={`mb-6 flex flex-wrap items-center justify-between gap-3 ${subject.free ? "border-emerald-500/45" : ""}`}>
        <div className="min-w-0">
          <p className="font-display text-sm font-bold">
            {subject.free ? "هذا الكورس متاحٌ مجّاناً للجميع" : "الكورس مدفوع"}
          </p>
          <p className="mt-1 text-[12px] leading-relaxed text-muted-foreground">
            {subject.free
              ? "كلُّ طالبٍ يشاهد دروسَه بلا شراءٍ ولا كود. أطفئه لتعود بوّابةُ الدفع."
              : "من لا يملكه يدخل فيرى المنهجَ وعناوينَ الدروس، والفيديو مقفولٌ حتى يشتري."}
          </p>
        </div>
        <button
          type="button"
          onClick={() => save({ subjects: subjects.map((x) => (x.id === id ? { ...x, free: !subject.free } : x)) })}
          className={`shrink-0 rounded-2xl px-5 py-2.5 text-xs font-bold transition ${
            subject.free
              ? "border border-rose-500/40 text-rose-600 hover:bg-rose-500/10"
              : "btn-glow text-white"
          }`}
        >
          {subject.free ? "إيقاف الإتاحة المجانيّة" : "إتاحته مجّاناً"}
        </button>
      </Card>

      {/*
        المحتوى والمنهج — على متن الصفحة لا في بطاقةِ شبكةٍ تُضغط.
        كانت ثلاثَ بطاقاتٍ في الشبكة: «إضافة درس» و«موادّ الكورس ودروسها»
        و«ملفّات الكورس». فمن فتح الصفحةَ رأى تحت العنوان فراغاً، وعليه
        أن يخمّن أيَّ بطاقةٍ يضغط ليرى منهجَ كورسه. والمنهجُ هو الصفحةُ
        نفسُها لا بابٌ منها.

        فصار يُرسم مباشرةً: يُفتح الكورسُ فيُرى بناؤه. وما بقي في الشبكة
        إعداداتٌ تُزار حين تُراد — الغلافُ والسعرُ ونصُّ الغلاف.
      */}
      <div className="mb-6">
        <div className="mb-4 flex items-center gap-2.5">
          <span
            style={{ color: "var(--brand-primary)", background: "color-mix(in srgb, var(--brand-primary) 9%, transparent)" }}
            className="grid size-9 shrink-0 place-items-center rounded-2xl"
          >
            <Layers className="size-4" />
          </span>
          <div className="min-w-0">
            <h2 className="font-display text-lg font-extrabold leading-tight">المحتوى والمنهج</h2>
            <p className="text-[12px] leading-relaxed text-muted-foreground">
              الكورسُ ← وحدة ← دروس. قسّم المنهجَ أبواباً فيقرأ الطالبُ منهجاً لا قائمةَ فيديوهات.
            </p>
          </div>
        </div>


      {/*
        محتوى الكورس — ثلاثةُ مستوياتٍ في مكانٍ واحد.
        الموادُّ ← دروسُ مادّة ← تعديلُ درس، والانتقالُ يستبدل المتنَ في
        موضعه. والمكوّنُ حرٌّ من تفاصيل هذه الصفحة: يأخذ ما يُغيّر
        (`on…`) وما يُرسَم (`render…`)، فيصلح لأيّ شاشةٍ أخرى بلا تعديل.
      */}
      <Curriculum
        courseName={subject.name}
        units={units}
        onAddUnit={addUnit}
        onRenameUnit={renameUnit}
        onRemoveUnit={removeUnit}
        onReorderUnit={reorderUnit}
        onReorderLesson={reorderLesson}
        onMoveLessonTo={moveLessonTo}
        onPatchLesson={patchLesson}
        onDuplicateLesson={duplicateLesson}
        onRemoveLesson={remove}
        onSetQuiz={setQuiz}
        quizResults={quizStats}
        renderSettings={
          <>
            {/* عنوانُ اللسان — كان ترويسةَ قسمٍ مستقلٍّ قبل الدمج */}
            <div className="mb-4">
              <p className="font-display text-[15px] font-extrabold">ملفّات الكورس</p>
              <p className="text-[12px] text-muted-foreground">
                مذكّراتٌ وملازمُ PDF يفتحها الطالبُ مع الدروس
              </p>
            </div>
          <div>
            <Card className="mb-4">
              <div className="flex flex-wrap items-end gap-3">
                <label className="min-w-40 flex-1"><span className="mb-1 block text-xs font-semibold text-muted-foreground">عنوان الملف</span>
                  <input value={mat.title} onChange={(e) => setMat({ ...mat, title: e.target.value })} className="inp" placeholder="مثال: مذكّرة النحو" />
                </label>
                <label className="min-w-56 flex-[2]"><span className="mb-1 block text-xs font-semibold text-muted-foreground">رابط الملف</span>
                  <input value={mat.url} onChange={(e) => setMat({ ...mat, url: e.target.value })} onKeyDown={(e) => e.key === "Enter" && addMaterial()} dir="ltr" className="inp text-right" placeholder="https://drive.google.com/… أو رابط PDF مباشر" />
                </label>
                <Button className="px-5 py-2.5" onClick={addMaterial}><Link2 className="size-4" /> إضافة بالرابط</Button>
                <input ref={matRef} type="file" hidden onChange={async (e) => {
                  const file = e.target.files?.[0]; if (!file) return;
                  setUploading("material");
                  const url = await uploadImage(file);
                  setUploading(null);
                  if (url) persistMats([...materials, { id: `M-${Date.now()}`, title: mat.title.trim() || file.name, url }]);
                  setMat({ title: "", url: "" });
                  if (matRef.current) matRef.current.value = "";
                }} />
                <Button variant="outline" className="px-5 py-2.5" onClick={() => matRef.current?.click()} disabled={uploading === "material"}>
                  {uploading === "material" ? <Loader2 className="size-4 animate-spin" /> : <Upload className="size-4" />}
                  {driveOn ? "رفع إلى Drive" : "رفع ملف"}
                </Button>
              </div>
              <p className="mt-2 text-[11px] text-muted-foreground">
                أضِف الملف برابط خارجي، أو ارفعه {driveOn ? "إلى Google Drive الحساب المربوط" : "إلى خادم المنصّة"}.
              </p>
            </Card>
            {materials.length > 0 && (
              <div className="space-y-2">
                {materials.map((m) => (
                  <Card key={m.id} className="!p-3">
                    <div className="flex items-center gap-3">
                      <span className="grid size-9 place-items-center rounded-2xl bg-primary/12 text-primary"><FileText className="size-5" /></span>
                      <a href={m.url} target="_blank" rel="noreferrer" className="min-w-0 flex-1 truncate font-semibold hover:text-primary">{m.title}</a>
                      <button onClick={() => removeMaterial(m.id)} title="حذف" className="grid size-8 place-items-center rounded-full border border-border text-rose-500 transition hover:border-rose-500"><Trash2 className="size-4" /></button>
                    </div>
                  </Card>
                ))}
              </div>
            )}
          </div>

            {/*
              إعداداتُ الكورس كلُّها في لسانها.
              كانت أقساماً تتبع الشجرةَ في الصفحة، فيمرّ عليها من جاء
              ليضيف درساً. وهي تُضبط مرّةً عند إنشاء الكورس: مظهرُه،
              وماذا يرى من لا يملكه، ومن أين سعرُه. فصارت خلف لسانٍ
              يُقصد قصداً، وبقيت الصفحةُ للمنهج وحدَه.
            */}
          {/*
            التصميمُ مفصولٌ عن العمل.
            غلافُ الكورس ونصُّه وصورُه تُضبط مرّةً عند إنشائه ثمّ لا تُمسّ؛
            وإضافةُ الدروس وترتيبُها عملٌ يوميّ. وجمعُهما في عمودٍ واحدٍ
            مفتوحٍ يجعل الأستاذ يمرّ على أربع لوحاتِ تصميمٍ كلَّ مرّةٍ يضيف
            فيها درساً. فالتصميمُ مطويٌّ والعملُ مفتوح.
          */}
          <p className="font-kufi mb-2 mt-2 text-[11px] font-bold text-muted-foreground">تصميم البطاقة</p>
          {/*
            المظهرُ لوحٌ واحدٌ مطويّ.
            كان ثلاثةَ أقسامٍ مفتوحةٍ يبلغ طولُها ألفاً وتسعمئةِ بكسل، تسبق
            المنهجَ كلَّها. والغلافُ ونصُّه وملصقاتُه تُضبط مرّةً عند إنشاء
            الكورس ثمّ لا تُمسّ شهراً — والدروسُ تُضاف كلَّ أسبوع.
          */}
          <Collapse className="mb-3" title="مظهر بطاقة الكورس" subtitle="الغلافُ ونصُّه وملصقاتُه — تُضبط مرّةً ثمّ تُترك" icon={<Palette className="size-4" />} storageKey="crs-look">
          {/*
            لافتةُ صفحة الكورس — مستقلّةٌ عن غلاف البطاقة.
            ------------------------------------------------------------
            المقاسان مختلفان اختلافاً لا يُصلحه قصّ: البطاقةُ مربّعةٌ
            تقريباً، وصدرُ الصفحة شريطٌ نسبتُه ٢١:٨. فغلافٌ مربّعٌ يُقصّ
            إلى الشريط يفقد أعلاه وأسفلَه — والوجوهُ والعناوينُ فيهما.

            وقد وقع ذلك فعلاً قبل هذا القسم: كورسٌ غلافُه رسمٌ مربّعٌ خرج
            في صدر صفحته قلنسوةً ممدودةً بلا معنى.

            والمعاينةُ هنا بنسبة الصفحة نفسِها لا بنسبةٍ أخرى: معاينةٌ
            تكذب أسوأُ من ألّا تكون.
          */}
          <Collapse className="mb-3" title="لافتة صفحة الكورس" subtitle="شريطٌ عريضٌ يُرى في صدر صفحة الكورس — غيرُ غلاف البطاقة" icon={<ImageIcon className="size-4" />} storageKey="crs-banner">
            {/*
              المقاسُ مكتوبٌ ليُنسَخ لا ليُقرأ.
              ------------------------------------------------------------
              من يصنع الصورةَ يفتح برنامجَه ويكتب الرقمين، فيُعطى الرقمان
              بصيغةٍ تُنسخ بضغطة. والبديلان مذكوران لأنّ من يصمّم على
              الجوّال لا يُنتج ١٦٨٠ عرضاً غالباً.
            */}
            <div className="bn-spec mb-4">
              <div className="bn-spec-r">
                <span className="bn-spec-l">المقاس المطلوب</span>
                <span className="bn-spec-v">١٦٨٠ × ٦٤٠</span>
                <button
                  type="button"
                  onClick={() => { void navigator.clipboard?.writeText("1680x640"); setCopied("1680x640"); setTimeout(() => setCopied(null), 1500); }}
                  className="bn-copy"
                >
                  {copied === "1680x640" ? "نُسخ ✓" : "انسخ"}
                </button>
              </div>
              <p className="bn-spec-n">
                النسبة <b>٢١ : ٨</b> — عريضةٌ قصيرة. ويصحّ كلُّ ما كان على نسبتها:
                <span className="bn-alt">١٢٦٠×٤٨٠</span>
                <span className="bn-alt">٢١٠٠×٨٠٠</span>
                — والأعرضُ أوضحُ على الشاشات الكبيرة.
              </p>
              <p className="bn-spec-n">
                وما خالف النسبةَ <b>يُقصّ لا يُمسخ</b>: يبقى ما يسع الشريطَ ويُحذف الباقي،
                وموضعُ القصّ يُضبط بالمقياس أسفلَه. وإن تُركت فارغةً فلا يُعرض شريطٌ أصلاً.
              </p>

              {/* ما رُفع فعلاً — يُقاس ويُقارن */}
              {subject.banner?.trim() && bannerSize && (() => {
                const r = bannerSize.w / bannerSize.h;
                const want = 21 / 8;
                const ok = Math.abs(r - want) < 0.06;
                /* كم يُقصّ رأسيّاً حين تكون الصورةُ أطولَ من النسبة */
                const cutPct = ok ? 0 : r < want
                  ? Math.round((1 - (bannerSize.w / want) / bannerSize.h) * 100)
                  : 0;
                return (
                  <p className="bn-real" data-k={ok ? "ok" : "off"}>
                    صورتُك <b>{bannerSize.w.toLocaleString("ar-EG")} × {bannerSize.h.toLocaleString("ar-EG")}</b>
                    {" "}(نسبة {r.toFixed(2)})
                    {ok
                      ? " — مطابقةٌ للنسبة، تُعرض كاملةً."
                      : r < want
                        ? ` — أطولُ من النسبة، فيُقصّ منها نحو ${cutPct.toLocaleString("ar-EG")}٪ رأسيّاً. اضبط موضعَ القصّ بالأسفل.`
                        : " — أعرضُ من النسبة، فيُقصّ من جانبيها قليلاً."}
                  </p>
                );
              })()}
            </div>

            {subject.banner?.trim() ? (
              <div className="mb-4 overflow-hidden rounded-2xl border border-border">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={subject.banner}
                  alt="معاينة اللافتة"
                  className="block w-full"
                  style={{ aspectRatio: "21 / 8", objectFit: "cover", objectPosition: `center ${subject.bannerY ?? 35}%` }}
                />
              </div>
            ) : (
              <div className="mb-4 grid place-items-center rounded-2xl border border-dashed border-border text-xs text-muted-foreground"
                style={{ aspectRatio: "21 / 8" }}>
                لا لافتةَ — لن يُعرض شريطٌ في صدر الصفحة
              </div>
            )}

            <div className="flex flex-wrap items-end gap-3">
              <label className="min-w-56 flex-1">
                <span className="mb-1 block text-xs font-semibold text-muted-foreground">رابط اللافتة</span>
                <input defaultValue={subject.banner ?? ""} dir="ltr" className="inp text-right"
                  onBlur={(e) => save({ subjects: subjects.map((x) => (x.id === id ? { ...subject, banner: e.target.value.trim() } : x)) })}
                  placeholder="https://…" />
              </label>
              <input ref={bannerRef} type="file" accept="image/*" hidden
                onChange={(e) => { const f = e.target.files?.[0]; if (f) uploadBanner(f); }} />
              <Button variant="outline" className="px-5 py-2.5" onClick={() => bannerRef.current?.click()} disabled={bannerUploading}>
                {bannerUploading ? <Loader2 className="size-4 animate-spin" /> : <Upload className="size-4" />}
                {bannerUploading ? "جارٍ الرفع…" : "رفع لافتة"}
              </Button>
              {subject.banner && (
                <button onClick={() => save({ subjects: subjects.map((x) => (x.id === id ? { ...subject, banner: "" } : x)) })}
                  className="rounded-full border border-border px-4 py-2.5 text-xs font-bold text-rose-500 transition hover:border-rose-500">
                  إزالة اللافتة
                </button>
              )}
            </div>

            {/*
              موضعُ القصّ الرأسيّ.
              الشريطُ يقتطع من الصورة قدرَ ارتفاعه، والمقتطَعُ من وسطها
              افتراضاً — والوجوهُ والعناوينُ في أعلى أغلفة الكورسات غالباً.
              فيُترك للمشرف أن يقول: من أين يُقتطع.
            */}
            {subject.banner?.trim() && (
              <label className="mt-4 block max-w-md">
                <span className="mb-1.5 flex items-center justify-between text-xs font-semibold text-muted-foreground">
                  <span>موضع القصّ الرأسيّ</span>
                  <span className="font-mono">{(subject.bannerY ?? 35).toLocaleString("ar-EG")}٪</span>
                </span>
                <input
                  type="range" min={0} max={100} step={1}
                  value={subject.bannerY ?? 35}
                  onChange={(e) => save({ subjects: subjects.map((x) => (x.id === id ? { ...subject, bannerY: Number(e.target.value) } : x)) })}
                  className="w-full accent-[color:var(--brand-primary)]"
                />
                <span className="mt-1 flex justify-between text-[10px] text-muted-foreground">
                  <span>أعلى الصورة</span><span>أسفلُها</span>
                </span>
              </label>
            )}
          </Collapse>

          {/* غلاف الكورس */}
          <Collapse className="mb-3" title="غلاف بطاقة الكورس" subtitle="الصورةُ التي تُرى على بطاقة الكورس في القوائم" icon={<ImageIcon className="size-4" />} storageKey="crs-cover">
            <p className="mb-4 text-xs leading-relaxed text-muted-foreground">
              مقاس البطاقة ثابت ولا يتمدّد. عند التكبير ١٠٠٪ تظهر صورتك <b>كاملة</b>؛ ولو أردت ملء الإطار
              كبّرها وحرّكها بنفسك — ما يخرج عن الإطار يُقصّ بإرادتك أنت لا تلقائياً.
            </p>
            <div className="flex flex-wrap items-start gap-5">
              <div className="w-full max-w-xs">
                <CourseArt seed={subject.id} title={subject.name} cover={subject.cover} coverFit={subject.coverFit} coverRatio={subject.coverRatio} coverColor={subject.coverColor} coverPattern={subject.coverPattern} coverText={subject.coverText} coverStickers={subject.coverStickers} progress={42} />
              </div>
              <div className="flex flex-col gap-2">
                <label className="w-64"><span className="mb-1 block text-xs font-semibold text-muted-foreground">رابط صورة الغلاف</span>
                  <input defaultValue={subject.cover ?? ""} dir="ltr" className="inp text-right"
                    onBlur={(e) => save({ subjects: subjects.map((s) => (s.id === id ? { ...subject, cover: e.target.value.trim() } : s)) })}
                    placeholder="https://…" />
                </label>
                <input ref={coverRef} type="file" accept="image/*" hidden onChange={(e) => { const f = e.target.files?.[0]; if (f) uploadCover(f); }} />
                <Button variant="outline" onClick={() => coverRef.current?.click()} disabled={coverUploading}>
                  <Upload className="size-4" /> {coverUploading ? "جارٍ الرفع…" : "رفع غلاف"}
                </Button>
                {subject.cover && (
                  <button onClick={() => save({ subjects: subjects.map((s) => (s.id === id ? { ...subject, cover: "" } : s)) })}
                    className="rounded-full border border-border px-4 py-2 text-xs font-bold text-rose-500 transition hover:border-rose-500">إزالة الغلاف</button>
                )}

                {/* لون خلفية اللوحة — يظهر خلف الزخرفة، وكاملاً إن لم يكن هناك غلاف */}
                <div className="mt-2 w-64">
                  <span className="mb-1.5 block text-xs font-semibold text-muted-foreground">لون خلفية الغلاف</span>
                  <div className="flex flex-wrap gap-1.5">
                    <button
                      type="button"
                      onClick={() => setCoverColor("")}
                      title="ألوان الثيم"
                      className={`grid size-8 place-items-center rounded-xl border text-[11px] font-bold transition ${
                        !subject.coverColor ? "border-primary ring-2 ring-primary/30" : "border-border hover:border-primary/50"
                      }`}
                      style={{ background: "linear-gradient(135deg, hsl(var(--primary)), hsl(var(--accent)))", color: "#fff" }}
                    >
                      ثيم
                    </button>
                    {COVER_COLORS.map((c) => (
                      <button
                        key={c.hex}
                        type="button"
                        onClick={() => setCoverColor(c.hex)}
                        title={c.label}
                        aria-label={c.label}
                        className={`size-8 rounded-xl border transition ${
                          subject.coverColor?.toLowerCase() === c.hex ? "border-primary ring-2 ring-primary/40" : "border-border hover:border-primary/50"
                        }`}
                        style={{ background: c.hex }}
                      />
                    ))}
                    <label
                      title="لون مخصّص"
                      className="grid size-8 cursor-pointer place-items-center rounded-xl border border-dashed border-border transition hover:border-primary/50"
                      style={{ background: subject.coverColor || "transparent" }}
                    >
                      <input
                        type="color"
                        className="size-0 opacity-0"
                        value={subject.coverColor || "#233b8b"}
                        onChange={(e) => setCoverColor(e.target.value)}
                      />
                      {!subject.coverColor && <Palette className="size-4 text-muted-foreground" />}
                    </label>
                  </div>
                  <p className="mt-1.5 text-[10px] leading-relaxed text-muted-foreground">
                    يظهر خلف الزخرفة الهندسية، وفي الهوامش حول الصورة — والمعاينة على اليمين تتغيّر فوراً.
                  </p>
                </div>
              </div>

              {/* زخرفة اللوحة — المربّعات خلف الصورة */}
              <div className="w-full">
                <span className="lbl">زخرفة الغلاف</span>
                <div className="flex flex-wrap items-center gap-2">
                  {([{ id: "auto", label: "تلقائي" }, { id: "none", label: "بلا زخرفة" }] as const).map((o) => (
                    <button
                      key={o.id}
                      type="button"
                      onClick={() => setCoverPattern(o.id)}
                      className={`rounded-full border px-3.5 py-1.5 text-xs font-bold transition ${
                        (subject.coverPattern ?? "auto") === o.id
                          ? "border-primary bg-primary/10 text-primary"
                          : "border-border hover:border-primary/40"
                      }`}
                    >
                      {o.label}
                    </button>
                  ))}
                  {COVER_PATTERNS.map((o) => (
                    <button
                      key={o.id}
                      type="button"
                      onClick={() => setCoverPattern(o.id)}
                      className={`rounded-full border px-3.5 py-1.5 text-xs font-bold transition ${
                        subject.coverPattern === o.id
                          ? "border-primary bg-primary/10 text-primary"
                          : "border-border hover:border-primary/40"
                      }`}
                    >
                      {o.label}
                    </button>
                  ))}
                </div>
                <p className="mt-1.5 text-[11px] text-muted-foreground">
                  «تلقائي» يختار نمطاً ثابتاً من معرّف الكورس فيبقى لكل كورس هويّة مميّزة، و«بلا زخرفة» تترك الخلفية سادة.
                </p>
              </div>

              {/* محاذاة الغلاف وضبطه */}
              {subject.cover && (
                <div className="grid min-w-56 flex-1 gap-3 self-center">
                  <div>
                    <span className="lbl">شكل الحواف</span>
                    <div className="grid grid-cols-3 gap-2">
                      {([
                        { id: "arch", label: "قوس" },
                        { id: "rounded", label: "دائرية" },
                        { id: "square", label: "مستقيمة" },
                      ] as const).map((o) => (
                        <button key={o.id} type="button" onClick={() => setCoverFit({ shape: o.id })}
                          className={`rounded-2xl border px-3 py-2 text-xs font-bold transition ${
                            (subject.coverFit?.shape ?? ((subject.coverFit?.frame ?? "fixed") === "image" ? "rounded" : "arch")) === o.id
                              ? "border-primary bg-primary/10 text-primary" : "border-border hover:border-primary/40"
                          }`}>{o.label}</button>
                      ))}
                    </div>
                  </div>

                  <CoverSlider label="انحناء الحواف" value={subject.coverFit?.radius ?? 22} min={0} max={48} step={1}
                    display={`${subject.coverFit?.radius ?? 22}`} onChange={(v) => setCoverFit({ radius: v })} />
                  <CoverSlider label="التكبير" value={subject.coverFit?.scale ?? 1} min={0.6} max={2.5} step={0.02}
                    display={`${Math.round((subject.coverFit?.scale ?? 1) * 100)}٪`} onChange={(v) => setCoverFit({ scale: v })} />
                  <CoverSlider label="الإزاحة الأفقية" value={subject.coverFit?.x ?? 0} min={-40} max={40} step={1}
                    display={`${subject.coverFit?.x ?? 0}٪`} onChange={(v) => setCoverFit({ x: v })} />
                  <CoverSlider label="الإزاحة الرأسية" value={subject.coverFit?.y ?? 0} min={-40} max={40} step={1}
                    display={`${subject.coverFit?.y ?? 0}٪`} onChange={(v) => setCoverFit({ y: v })} />
                  <button onClick={() => setCoverFit({ shape: "arch", radius: 22, x: 0, y: 0, scale: 1 })}
                    className="w-fit rounded-full border border-border px-4 py-2 text-xs font-bold transition hover:border-primary hover:text-primary">
                    إعادة الضبط
                  </button>
                </div>
              )}
            </div>
          </Collapse>

          {/* نصّ على الغلاف */}
          <Collapse className="mb-3" title="نصّ الغلاف" subtitle="كلمةٌ تُكتب فوق الصورة وتُحرَّك بالسحب" icon={<Palette className="size-4" />} storageKey="crs-text">
            <p className="mb-4 text-xs leading-relaxed text-muted-foreground">
              اكتب نصّاً يظهر فوق لوحة الغلاف، ثم اسحبه بالماوس إلى مكانه. الموضع يُحفظ بالنسبة
              المئوية فيبقى في مكانه على بطاقة الطالب الصغيرة وعلى المعاينة الكبيرة سواء.
            </p>
            <CoverTextEditor subject={subject} onChange={setCoverText} />
          </Collapse>

          {/* صور على الغلاف */}
          <Collapse className="mb-3" title="ملصقات الغلاف" subtitle="صورٌ صغيرةٌ تُلصق فوق الغلاف" icon={<ImageIcon className="size-4" />} storageKey="crs-stickers">
            <p className="mb-4 text-xs leading-relaxed text-muted-foreground">
              ارفع صورة — تُفتح أداة القصّ وإزالة الخلفية أولاً — ثم اسحبها بالماوس إلى مكانها
              واضبط حجمها ودورانها وشفافيتها. الصور تُرسم تحت نصّ الغلاف ليبقى النصّ فوقها.
            </p>
            <CoverStickersEditor subject={subject} onChange={setCoverStickers} />
          </Collapse>
          </Collapse>

          {/* أسعار الكورس */}
          {/*
            ما يحدث حين يضغط طالبٌ لا يملك الكورس.
            كان واحداً لا خيارَ فيه: يُساق إلى بوّابة الدفع فوراً. وهو يصلح
            لكورسٍ يُباع كتلةً واحدة، ولا يصلح لمنهجٍ طويلٍ يريد الطالبُ منه
            باباً أو بابين — فيُساق إلى دفع المنهج كلِّه أو ينصرف.
          */}
          <Collapse className="mb-3" title="عند الضغط على الكورس" subtitle="ماذا يرى طالبٌ لا يملكه" icon={<Wallet className="size-4" />} storageKey="crs-click">
            <div className="grid gap-3 sm:grid-cols-2">
              {([
                { id: "gateway", title: "بوّابة الدفع مباشرة", hint: "الكورسُ يُباع كتلةً واحدة — يُساق إلى خطط شرائه فوراً." },
                { id: "materials", title: "موادّ الكورس", hint: "تُفتح له الموادُّ وفي كلٍّ سعرُها وزرُّ شرائها — يشتري ما يحتاج ويترك ما لا يحتاج." },
              ] as const).map((m) => {
                const on = (subject.entryMode ?? "gateway") === m.id;
                return (
                  <button
                    key={m.id}
                    type="button"
                    onClick={() => save({ subjects: subjects.map((s) => (s.id === id ? { ...subject, entryMode: m.id } : s)) })}
                    className={`rounded-2xl border p-3 text-right transition ${
                      on ? "border-primary bg-primary/5 ring-2 ring-primary/25" : "border-border hover:border-primary/40"
                    }`}
                  >
                    <span className="block text-sm font-bold">{m.title}</span>
                    <span className="mt-0.5 block text-[11px] leading-relaxed text-muted-foreground">{m.hint}</span>
                  </button>
                );
              })}
            </div>
            {/*
              وضعُ «الموادّ» في كورسٍ بلا موادّ لا يفعل شيئاً.
              الكورسُ غيرُ المقسَّم له مادّةٌ واحدةٌ ملفوفةٌ لا تُباع وحدَها، فمن
              ضبطه على البيع المفرَّق ولم يقسّمه رأى بوّابةَ الدفع كما كان —
              وظنّ الإعدادَ معطّلاً. فيُقال له ما ينقص.
            */}
            {(subject.entryMode ?? "gateway") === "materials" && !isSplit(subject) && (
              <p className="mt-3 rounded-2xl bg-rose-500/10 px-3 py-2 text-[11px] font-bold leading-relaxed text-rose-600 dark:text-rose-400">
                هذا الكورس لم يُقسَّم إلى موادّ بعد — فلا شيءَ يُباع مفرَّقاً، ويبقى الطالبُ
                يُساق إلى بوّابة الدفع كما كان. أضِف موادَّ من الأسفل أوّلاً.
              </p>
            )}
            {(subject.entryMode ?? "gateway") === "materials" && isSplit(subject) && (
              <p className="mt-3 rounded-2xl bg-amber-500/10 px-3 py-2 text-[11px] font-bold leading-relaxed text-amber-700 dark:text-amber-400">
                في هذا الوضع تُفتح للطالب موادُّ الكورس ليشتري ما يحتاج. وتُسعَّر كلُّ مادّةٍ
                من <b>بوّابة الدفع</b>: أنشئ خطّةً نطاقُها «موادّ مختارة» وأشّر على المادّة.
                والمادّةُ التي لا تفتحها خطّةٌ تبقى مقفلةً بلا زرِّ شراء.
              </p>
            )}
          </Collapse>

          {/*
            الأسعارُ ليست هنا — ولا يُترك مكانُها فارغاً بلا بيان.
            كانت تُضاف في الكورس وفي المادّة وفي الخطّة معاً، فيصير للشيء
            الواحد سعران أو ثلاثة لا يُعرف أيُّها يُحصَّل. فصار مصدرُها واحداً:
            بوّابة الدفع. وهذا السطرُ يدلّ عليه، وإلّا بحث الأستاذُ عن الحقل
            الذي كان هنا وظنّ أنّه عُطّل.
          */}
          <Collapse className="mb-3" title="السعر ومدّة التفعيل" subtitle="مصدرُهما بوّابةُ الدفع" icon={<Wallet className="size-4" />} storageKey="crs-price">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div className="min-w-0">
                <h3 className="font-display font-extrabold">السعر ومدّة التفعيل</h3>
                <p className="mt-1 text-xs leading-relaxed text-muted-foreground">
                  تُضبَطان من <b>بوّابة الدفع</b> لا من هنا — سعرٌ واحدٌ في موضعٍ واحد.
                  أنشئ خطّةً هناك وحدّد ما تفتحه: الكورسَ كلَّه، أو موادَّ منه تؤشّر عليها،
                  وسعرَها ومدّتها.
                </p>
              </div>
              <Link
                href="/admin/plans"
                className="btn-glow inline-flex shrink-0 items-center gap-2 rounded-full px-5 py-2.5 text-xs font-bold text-white"
              >
                <Wallet className="size-4" /> افتح بوّابة الدفع
              </Link>
            </div>
          </Collapse>

          </>
        }
        renderAddLesson={(uid) => (
          <Card className="!p-3">
            <div className="flex flex-wrap items-end gap-2.5">
              <label className="min-w-40 flex-1">
                <span className="mb-1 block text-[11px] font-semibold text-muted-foreground">عنوان الدرس</span>
                <input value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} className="inp" placeholder="مثال: الباب الأول — التعريف والدليل" />
              </label>
              <label className="min-w-56 flex-[2]">
                <span className="mb-1 block text-[11px] font-semibold text-muted-foreground">رابط الفيديو</span>
                <input value={form.url} onChange={(e) => setForm({ ...form, url: e.target.value })} dir="ltr" className="inp text-right" placeholder="https://…" />
              </label>
              <label className="min-w-24">
                <span className="mb-1 block text-[11px] font-semibold text-muted-foreground">المدّة</span>
                <input value={form.duration} onChange={(e) => setForm({ ...form, duration: e.target.value })} className="inp" placeholder="١٢:٤٥" />
              </label>
              <label className="flex items-center gap-2 rounded-2xl border border-border px-3 py-2.5 text-[11px] font-bold">
                <input type="checkbox" checked={form.isFree} onChange={(e) => setForm({ ...form, isFree: e.target.checked })} className="size-4 accent-[hsl(var(--primary))]" />
                مجانيّ
              </label>
              {/*
                المادّةُ تُؤخذ من المستوى المفتوح لا من قائمةٍ تُختار: من
                فتح مادّةً ثمّ أضاف درساً يريده فيها، وسؤالُه ثانيةً عبثٌ.
              */}
              <Button className="px-5 py-2.5" onClick={() => add(uid)}>
                <Plus className="size-4" /> إضافة درس
              </Button>
            </div>
          </Card>
        )}
      />

      </div>








    </>
  );
}


/** منزلق ضبط الغلاف. */
function CoverSlider({
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
