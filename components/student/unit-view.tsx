"use client";

/**
 * عرضُ المادّة — مشغّلٌ ومسارُ دروس.
 * ------------------------------------------------------------------
 * كان الكورسُ شاشةً واحدة: المشغّلُ يميناً، وإلى جانبه لوحٌ فيه الوحداتُ
 * ألواحاً مطويّةً وداخلَ كلٍّ منها دروسُها. فالمادّةُ والدرسُ في قسمٍ
 * واحد، ومن أراد مادّةً فتح لوحَها ثمّ مرّ على دروس ما قبلها.
 *
 * فصار الطريقُ ثلاثَ مراحل: **الكورس ← المادّة ← دروسُها**. وهذا الملفُّ
 * هو المرحلةُ الثالثة.
 *
 * **والدروسُ مسارٌ لا قائمة.** القائمةُ تقول «هذه دروسٌ»، والمسارُ يقول
 * «هذا طريقُك وأين أنت منه»: عمودٌ يصل النقاطَ، يمتلئ بلونٍ إلى حيث
 * وصلتَ ويبهت بعده. فالتقدّمُ يُرى في شكل الشيء نفسِه لا في رقمٍ فوقه.
 *
 * **والنقطةُ تحمل حالتَها**: تمّت · جاريةٌ الآن · مفتوحةٌ · مقفلة. أربعُ
 * حالاتٍ تُميَّز باللون والرمز معاً لا باللون وحدَه — فمن لا يميّز
 * الألوانَ يقرؤها.
 */

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import {
  IconPlay, IconCheckCircle, IconLock, IconGift, IconFile,
  IconListChecks, IconXCircle, IconRotate, IconSpinner, IconTrophy, IconArrowLeft,
} from "@/components/brand/icons";
import { Card } from "@/components/dashboard/ui";
import { useContent } from "@/components/content/content-provider";
import { VideoWatermark } from "@/components/student/video-watermark";
import { CleanYouTube } from "@/components/student/clean-youtube";
import { allLessons, usableMaterials } from "@/lib/course-units";
import type { Lesson, Material, Subject, Unit } from "@/lib/types";
import { setPref } from "@/lib/consent";

/** تحويل رابط الفيديو إلى صيغة تضمين (YouTube / Vimeo / Bunny Stream / mp4). */
/**
 * مُعامِلاتُ تضمين يوتيوب — تُقلّل ما يظهر فوق المقطع.
 * ------------------------------------------------------------------
 * `rel=0` يحصر «المزيد من الفيديوهات» في قناة الأستاذ نفسِها — ولا
 * يُلغيها: يوتيوب أبطل الإلغاءَ سنة ٢٠١٨ ولا سبيلَ إليه بمُعامِل.
 * `modestbranding=1` يُصغّر شعارَه، و`iv_load_policy=3` يمنع التعليقاتِ
 * المنبثقة، و`disablekb=1` يمنع اختصاراتِ لوحة المفاتيح.
 *
 * والنطاقُ `youtube-nocookie.com` لا يكتب كوكيَ تتبّعٍ قبل التشغيل.
 */
const YT_PARAMS = "rel=0&modestbranding=1&iv_load_policy=3&disablekb=1&playsinline=1";

export function toEmbed(url: string): { kind: "video" | "iframe"; src: string; drive?: boolean; yt?: boolean; ytId?: string } {
  const u = url.trim();
  // Bunny Stream (iframe.mediadelivery.net) — نحوّل /play/ إلى /embed/
  if (u.includes("mediadelivery.net")) {
    return { kind: "iframe", src: u.replace("/play/", "/embed/") };
  }
  // Google Drive: أي صيغة رابط → صفحة المعاينة القابلة للتضمين
  const drive = u.match(/drive\.google\.com\/(?:file\/d\/|open\?id=|uc\?(?:export=\w+&)?id=)([\w-]{20,})/) ||
    u.match(/lh3\.googleusercontent\.com\/d\/([\w-]{20,})/);
  /* rm=minimal يقلّل عناصر مشغّل درايف، لكنه لا يزيل زرّ «فتح في نافذة
     جديدة» — ذاك يُحجب بطبقة فوق ركنه. */
  if (drive) return { kind: "iframe", src: `https://drive.google.com/file/d/${drive[1]}/preview?rm=minimal`, drive: true };
  // معرّف Bunny بصيغة "libraryId/videoGuid"
  const bunny = u.match(/^(\d{3,7})\/([0-9a-f-]{20,})$/i);
  if (bunny) return { kind: "iframe", src: `https://iframe.mediadelivery.net/embed/${bunny[1]}/${bunny[2]}` };
  if (/\.(mp4|webm|ogg)(\?|$)/i.test(u)) return { kind: "video", src: u };
  const yt = u.match(/(?:youtu\.be\/|youtube\.com\/(?:watch\?v=|embed\/|shorts\/))([\w-]{6,})/);
  /* يوتيوب يُعرض بالمشغّل النظيف (`CleanYouTube`) — والعنوانُ هنا للتوافق مع من يقرأ `src` */
  if (yt) return { kind: "iframe", src: `https://www.youtube-nocookie.com/embed/${yt[1]}?${YT_PARAMS}`, yt: true, ytId: yt[1] };
  const vm = u.match(/vimeo\.com\/(\d+)/);
  if (vm) return { kind: "iframe", src: `https://player.vimeo.com/video/${vm[1]}` };
  return { kind: "iframe", src: u };
}

/**
 * الدروسُ المنجَزة — تُقرأ من الجهاز وتُكتب إليه، وتُرسَل نسبتُها للخادم.
 * ------------------------------------------------------------------
 * والنسبةُ المرسَلةُ **من دروس الكورس كلِّها** لا من دروس المادّة: تقدّمُ
 * الطالب في الكورس واحدٌ، ولو حُسب لكلّ مادّةٍ على حدةٍ لبلغ مئةً بمادّةٍ
 * من عشر.
 */
export function useDone(courseId: string, uid?: string) {
  const storeKey = `emz_done_${uid}_${courseId}`;
  const [done, setDone] = useState<Set<string>>(new Set());

  useEffect(() => {
    try {
      const raw = localStorage.getItem(storeKey);
      if (raw) setDone(new Set(JSON.parse(raw)));
    } catch { /* تجاهل */ }
  }, [storeKey]);

  const mark = async (lessonId: string, totalInCourse: number, refresh: () => Promise<void> | void) => {
    const next = new Set(done);
    next.add(lessonId);
    setDone(next);
    /*
      علامةُ المشاهدة تُحفظ في الجهاز بإذن، وتُرسَل نسبتُها للخادم دائماً:
      التقدّمُ سجلُّ الطالب لا تفضيلٌ يُنسى، فمن منع الحفظَ المحلّيَّ يبقى
      تقدّمُه محفوظاً في حسابه.
    */
    setPref(storeKey, JSON.stringify([...next]));
    const pct = totalInCourse ? Math.round((next.size / totalInCourse) * 100) : 0;
    await fetch("/api/progress", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ subjectId: courseId, value: pct }),
    });
    await refresh();
  };

  return { done, mark };
}

/* ---------- المسار ---------- */

type NodeState = "done" | "current" | "open" | "locked";

/**
 * صفٌّ في مسار الدروس.
 * ------------------------------------------------------------------
 * كان قرصاً كبيراً وبطاقةً بينهما فجوة، وكلُّ منجَزٍ قرصٌ أخضرُ مصمت —
 * فأغرقت الخضرةُ اللوحَ وصار **ما تمّ** أصرخَ ممّا لم يتمّ، وهو قلبٌ
 * للأولويّة: المنجَزُ يُطمئن ولا يُنادى عليه.
 *
 * والرقمُ كان يُمحى عند الإنجاز ويحلّ محلَّه ✓، فيضيع ترتيبُ الدرس ولا
 * يجد من يبحث عن «الثالث» ثالثاً.
 *
 * فصار صفّاً واحداً: قضيبٌ شعرةٌ بعلامةٍ صغيرة، ثمّ متنٌ ملاصقٌ فيه
 * الرقمُ باقياً والحالةُ مقولةً في سطر الوصف. والحاليُّ وحدَه يُبرَز —
 * بسطحٍ وحدٍّ وشريطٍ على حافّته، ثلاثةُ دلائلَ لا لونٌ وحدَه.
 *
 * والأنماطُ في `app/lesson-ui.css`.
 */
function PathNode({
  n, title, duration, state, isFree, onPick, last,
}: {
  n: number;
  title: string;
  duration?: string;
  state: NodeState;
  isFree?: boolean;
  onPick: () => void;
  /** يُبقى في الواجهة: القضيبُ يُقصّ بالمحدِّد `:last-child` لا بهذا. */
  last?: boolean;
}) {
  void last;
  const locked = state === "locked";

  return (
    <li className="lp-row" data-state={state} data-passed={state === "done" ? "1" : "0"}>
      <span className="lp-rail" aria-hidden="true">
        <span className="lp-dot">
          {state === "done" && <IconCheckCircle className="size-2.5" />}
        </span>
      </span>

      {/*
        الصفُّ أعمدةٌ تصطفّ، لا كتلةٌ في حافّة.
        ------------------------------------------------------------------
        كان العنوانُ ووصفُه ملتصقَين بحافّةٍ والزرُّ بالحافّة المقابلة،
        وبينهما ثلاثُ مئةِ بكسلٍ خواء. والفراغُ في ذاته ليس عطلاً — لكنّه
        هنا **فراغُ عجزٍ لا فراغُ راحة**: لا شيءَ يشغله، فيُقرأ الصفُّ
        نصفَ صفّ.

        فتُوزَّع الحالةُ والمدّةُ إلى عمودٍ قبل الزرّ. وفائدتُه ليست ملءَ
        الفراغ وحدَه: ما استوى في عمودٍ يُمسح بنظرةٍ واحدةٍ نازلة — يُعرف
        ما تمّ وما بقي من القائمة كلِّها دون قراءة سطرٍ سطراً.

        وعلى الضيّق تعود تحت العنوان: عمودان في ثلاث مئةِ بكسلٍ يسحقان
        العنوانَ. والسؤالُ للحاوية لا للشاشة.
      */}
      <button type="button" onClick={onPick} disabled={locked} className="lp-card">
        <span className="lp-n">{n.toLocaleString("ar-EG")}</span>

        <span className="lp-b">
          <span className="lp-t">{title}</span>
        </span>

        <span className="lp-m">
          {duration && <span className="lp-m-d">{duration}</span>}
          {state === "done" && <span className="lp-m-done">تمّت المشاهدة</span>}
          {state === "current" && <span className="lp-m-now">تُشاهده الآن</span>}
          {locked && <span>يُفتح بالاشتراك</span>}
          {isFree && <span className="lp-chip">مجّاني</span>}
        </span>

        <span className="lp-go" aria-hidden="true">
          {locked ? <IconLock className="size-3.5" /> : <IconPlay className="size-3.5" />}
        </span>
      </button>
    </li>
  );
}

/* ---------- العرض ---------- */

/** هل على الدرس واجبٌ فعلاً؟ — مفعَّلٌ وفيه سؤالٌ واحدٌ على الأقلّ. */
function hasQuiz(l: Lesson): boolean {
  return Boolean(l.quiz?.enabled) && (l.quiz?.questions.length ?? 0) > 0;
}

const ar = (n: number) => n.toLocaleString("ar-EG");

/**
 * صفٌّ يفتح ما وراءه في صفحته.
 * ------------------------------------------------------------------
 * يحمل **خبرَ** الشيء لا متنَه: عنوانَه، وسطراً يقول ما فيه، وشارةَ
 * حالةٍ إن كانت. فمن أراد المتنَ ضغط، ومن أراد أن يعرف فقط قرأ ولم يضغط.
 *
 * والصفُّ كلُّه رابطٌ لا الزرُّ وحدَه — هدفُ لمسٍ بعرض اللوح أسهلُ من
 * زرٍّ في طرفه، والزرُّ يبقى ليُرى أنّه يُفتح.
 */
function OpenRow({
  href, icon, title, note, badge, cta,
}: {
  href: string;
  icon: React.ReactNode;
  title: string;
  note: string;
  badge?: React.ReactNode;
  cta: string;
}) {
  return (
    <Link
      href={href}
      className="glass flex items-center gap-3 rounded-2xl p-3.5 transition hover:border-primary/40"
    >
      <span className="grid size-10 shrink-0 place-items-center rounded-xl bg-primary/12 text-primary">
        {icon}
      </span>
      <span className="min-w-0 flex-1">
        <span className="flex flex-wrap items-center gap-2">
          <span className="font-display truncate font-extrabold">{title}</span>
          {badge}
        </span>
        <span className="mt-0.5 block truncate text-xs text-muted-foreground">{note}</span>
      </span>
      <span className="inline-flex shrink-0 items-center gap-1.5 rounded-full border border-border px-3.5 py-2 text-xs font-bold text-muted-foreground">
        {cta}
        <IconArrowLeft className="size-3.5" />
      </span>
    </Link>
  );
}

export function UnitView({
  course, unit, owned, backHref, backLabel, initialLessonId,
}: {
  course: Subject;
  unit: Unit;
  owned: boolean;
  backHref: string;
  backLabel: string;
  /**
   * الدرسُ الذي يُفتح عليه.
   * من ضغط درساً في صفحة الكورس يريده هو — لا أوّلَ دروس مادّته. وبدون
   * هذا يفتح المشغّلُ على الدرس الأوّل دائماً، فيبحث الطالبُ في المسار
   * عمّا ضغط عليه قبل قليل.
   */
  initialLessonId?: string;
}) {
  const { db, session, refresh } = useContent();
  const me = db?.users.find((u) => u.id === session?.uid);
  const fem = me?.gender === "female";

  const lessons = unit.lessons ?? [];
  const courseTotal = allLessons(course).length;
  const { done, mark } = useDone(course.id, session?.uid);

  const [idx, setIdx] = useState(() => {
    const at = initialLessonId ? lessons.findIndex((l) => l.id === initialLessonId) : -1;
    return at >= 0 ? at : 0;
  });
  const current: Lesson | undefined = lessons[idx];
  const embed = useMemo(() => (current ? toEmbed(current.url) : null), [current]);

  const canPlay = (isFree?: boolean) => Boolean(isFree) || owned;
  const doneHere = lessons.filter((l) => done.has(l.id)).length;
  const percent = lessons.length ? Math.round((doneHere / lessons.length) * 100) : 0;

  /* هل تُباع هذه المادّةُ وحدَها؟ — بها يُقصد الشراءُ إلى موضعه */
  const sellsUnit = (unit.prices ?? []).some((p) => (p.label ?? "").trim());

  /*
    ملفّاتُ الدرس ثمّ المادّة ثمّ الكورس — من الأخصّ إلى الأعمّ.
    والترتيبُ مقصود: مذكّرةُ هذا الدرس أوّلُ ما يُطلب وهو يشاهده، وملزمةُ
    الكورس آخرُ ما يُطلب. وعرضُها بالعكس يجعله يمرّ على ما لا يخصّه.

    وتُضاف ولا تُلغي: كلُّ مستوى يزيد ولا يحجب ما فوقه.
  */
  /* رابطُ صفحة الدرس — المادّةُ في الطريق فيُعرف من أين جاء */
  const lessonHref = (lessonId: string) =>
    `/student/course/${course.id}/${encodeURIComponent(unit.id)}/${encodeURIComponent(lessonId)}`;
  const result = (lessonId: string) => me?.quizResults?.find((r) => r.lessonId === lessonId) ?? null;

  /* والفارغُ منها يُصفّى: مرفقٌ بلا رابطٍ يُرسم `href=""` فيُنزّل صفحةَ
     الموقع نفسَها. انظر `usableMaterials`. */
  const files: Material[] = usableMaterials([
    ...(current?.materials ?? []),
    ...(unit.materials ?? []),
    ...(course.materials ?? []),
  ]);

  if (lessons.length === 0) {
    return (
      <Card className="mx-auto max-w-md text-center">
        <p className="py-6 text-sm text-muted-foreground">لم تُضَف دروس لهذه المادّة بعد.</p>
        <Link href={backHref} className="inline-flex rounded-full border border-border px-5 py-2 text-sm font-bold transition hover:border-primary hover:text-primary">{backLabel}</Link>
      </Card>
    );
  }

  return (
    <div className="grid gap-5 lg:grid-cols-[1.7fr_1fr] lg:items-start">
      {/*
        المشغّلُ يثبت ولا يمشي مع قائمة الدروس.
        ------------------------------------------------------------------
        كان عمودُ المشغّل يمرّ مع الصفحة، فمن نزل يقرأ مسارَ الدروس ذهب
        عنه الفيديو — وهو الذي جاء لأجله. فيثبت في مكانه ويمرّ ما حولَه.

        **والتثبيتُ مشروطٌ بارتفاع النافذة لا بعرضها وحدَه**: عنصرٌ ثابتٌ
        أطولُ من النافذة يُثبَّت بأعلاها فلا يُبلَغ أسفلُه أبداً. فالشرطُ
        `min-height` كذلك — انظر `.lesson-stick` في `globals.css`.
      */}
      <div className="lesson-pane">
        <div className="lesson-video relative -mx-4 aspect-video overflow-hidden border-y border-border bg-black shadow-bento sm:mx-0 sm:rounded-3xl sm:border">
          {!current ? null : !canPlay(current.isFree) ? (
            <div className="grid size-full place-items-center bg-slate-900 p-6 text-center">
              <div className="flex flex-col items-center gap-3">
                <span className="grid size-14 place-items-center rounded-2xl bg-white/10 text-white"><IconLock className="size-7" /></span>
                <p className="font-display text-lg font-extrabold text-white">هذا الكورس غير مُفعّل</p>
                {/*
                  والشراءُ يقصد ما يُشاهَد.
                  كان يُساق إلى شراء الكورس كلِّه وهو واقفٌ على درسٍ في
                  مادّةٍ بعينها — فيُعرض عليه المنهجُ كلُّه وهو يطلب باباً
                  منه. فإن كانت المادّةُ تُباع وحدَها، قُصد شراؤها هي.
                */}
                <p className="max-w-xs text-sm text-white/70">
                  {sellsUnit
                    ? `افتح «${unit.title}» وحدَها، أو خُذ الكورس كلَّه.`
                    : "اشترك شهرياً في هذا الكورس أو خُذ الترم الكامل لمشاهدة كل الدروس."}
                </p>
                <Link
                  href={sellsUnit
                    ? `/student/pay?subject=${course.id}&unit=${encodeURIComponent(unit.id)}`
                    : `/student/pay?subject=${course.id}`}
                  className="rounded-full btn-glow px-5 py-2 text-xs font-bold text-white"
                >
                  {sellsUnit ? "خيارات شراء المادّة" : "خيارات الاشتراك"}
                </Link>
              </div>
            </div>
          ) : embed?.kind === "video" ? (
            <>
              <video key={current.id} src={embed.src} controls className="size-full" />
              <VideoWatermark name={me?.name} tag={me?.id} />
            </>
          ) : embed?.ytId ? (
            /*
              يوتيوب: المقطعُ وحدَه بلا عنوانٍ ولا شعارٍ ولا مقترحات —
              الإطارُ أصمّ والأزرارُ لنا. انظر `components/student/clean-youtube.tsx`.
            */
            <CleanYouTube key={current.id} videoId={embed.ytId} title={current.title}>
              <VideoWatermark name={me?.name} tag={me?.id} />
            </CleanYouTube>
          ) : (
            <>
              <iframe key={current.id} src={embed?.src} title={current.title} allowFullScreen
                allow="accelerometer; autoplay; encrypted-media; picture-in-picture" className="size-full" />
              {/* مشغّل درايف يعرض زرّ «فتح في نافذة جديدة» يكشف الرابط
                  ويتجاوز الاشتراك — وطبقةٌ فوق ركنه تبتلع الضغط. */}
              {embed?.drive && (
                <span aria-hidden="true" className="absolute right-0 top-0 z-10 h-14 w-24 cursor-default"
                  onContextMenu={(e) => e.preventDefault()} />
              )}

              {/*
                (يوتيوب لا يصل إلى هنا — له مشغّلُه النظيف أعلاه.)
                **والتأمينُ الحقيقيُّ أن يُرفع المقطعُ على Bunny Stream**
                بروابطَ موقَّعةٍ تنتهي صلاحيتُها: هذه المنصّةُ تدعمه أصلاً
                (انظر `toEmbed`)، ولا يُغني عنه حجبٌ ولا علامةٌ مائيّة.
              */}
              {/*
                اسمُ المشاهد فوق المقطع — لا يمنع التصوير، لكنّه يجعل
                المصوِّرَ معروفاً. وهي الحمايةُ الوحيدةُ التي تعمل حقّاً.
              */}
              <VideoWatermark name={me?.name} tag={me?.id} />
            </>
          )}
        </div>

        {current && (
          <div className="mt-4 flex flex-wrap items-center justify-between gap-3">
            <div>
              <p className="font-kufi mb-0.5 text-[11px] font-bold text-[hsl(var(--gold))]">{unit.title}</p>
              <h3 className="font-display text-lg font-extrabold">{current.title}</h3>
              {current.duration && <p className="text-xs text-muted-foreground">{current.duration}</p>}
            </div>
            <button
              onClick={() => mark(current.id, courseTotal, refresh)}
              disabled={done.has(current.id)}
              className={`inline-flex items-center gap-2 rounded-full px-5 py-2.5 text-sm font-bold transition ${
                done.has(current.id) ? "border border-emerald-500/40 text-emerald-500" : "btn-glow text-white"
              }`}
            >
              <IconCheckCircle className="size-4" /> {done.has(current.id) ? "تمّت المشاهدة" : "وضع علامة مكتمل"}
            </button>
          </div>
        )}

        {/*
          الواجبُ والملفّاتُ: خبرُهما هنا ومتنُهما في صفحتهما.
          ------------------------------------------------------------------
          كانا يُبسطان تحت المشغّل: أسئلةُ الواجب كلُّها بإجاباتها، ثمّ شبكةُ
          الملفّات، ثمّ مسارُ الدروس. فطالت الشاشةُ حتّى صار المشغّلُ — وهو
          المقصود — سطراً في أوّلها يُمرَّر عنه.

          فبقي هنا ما يُعرف بنظرة: هل حُلَّ الواجبُ وبكم، وكم ملفّاً هناك.
          والمتنُ يُفتح بضغطة في `[lessonId]/page.tsx`.

          **والخبرُ يبقى وإن غاب المتن**: من يريد أن يعرف نتيجتَه لا يُطالَب
          بفتح صفحةٍ ليقرأ رقماً.
        */}
        {current && canPlay(current.isFree) && (hasQuiz(current) || files.length > 0) && (
          <div className="mt-5 grid gap-2">
            {hasQuiz(current) && (
              <OpenRow
                href={lessonHref(current.id)}
                icon={<IconListChecks className="size-5" />}
                title={current.quiz?.title || "واجب الدرس"}
                note={
                  result(current.id)
                    ? `أفضلُ نتيجةٍ لك: ${ar(result(current.id)!.score)}/${ar(result(current.id)!.total)} · ${ar(result(current.id)!.percent)}٪`
                    : `${ar(current.quiz!.questions.length)} ${current.quiz!.questions.length === 1 ? "سؤال" : "أسئلة"} — لم تُجب بعد`
                }
                badge={
                  result(current.id) ? (
                    <span className={`rounded-full px-2.5 py-1 text-[11px] font-bold ${
                      result(current.id)!.passed ? "bg-emerald-500/15 text-emerald-600" : "bg-rose-500/15 text-rose-500"
                    }`}>
                      {result(current.id)!.passed ? "ناجح" : "لم تنجح"}
                    </span>
                  ) : undefined
                }
                cta="افتح الواجب"
              />
            )}
            {files.length > 0 && (
              <OpenRow
                href={lessonHref(current.id)}
                icon={<IconFile className="size-5" />}
                title="ملفّات الدرس والمادّة"
                note={`${ar(files.length)} ${files.length === 1 ? "ملفّ" : "ملفّات"} للتحميل`}
                cta="افتح الملفّات"
              />
            )}
          </div>
        )}
      </div>

      {/*
        المسار — لوحٌ مستقلُّ الحركة.
        كلُّ لوحٍ يتمرّر وحدَه: من يقلّب الدروسَ لا يُزيح المشغّل، ومن ينزل
        إلى الواجب لا يُزيح القائمة. انظر `.lesson-pane` في `globals.css`.
      */}
      <Card className="lesson-pane !p-4">
        {/*
          النسبةُ تُفهم بالطول قبل أن تُقرأ بالرقم — فرقمٌ عائمٌ في الطرف
          المقابل يُقرأ ولا يُحسّ. والشريطُ يُري كم بقي بنظرة.
        */}
        <div className="lp-head">
          <div className="lp-head-r">
            <p className="inline-flex items-center gap-2 font-display font-extrabold">
              <IconListChecks className="size-5 text-primary" /> مسار الدروس
            </p>
            <span className="lp-head-n">{percent.toLocaleString("ar-EG")}٪</span>
          </div>
          <p className="lp-head-s">
            {doneHere.toLocaleString("ar-EG")} من {lessons.length.toLocaleString("ar-EG")} درساً في هذه المادّة
          </p>
          <div className="lp-bar">
            <div className="lp-bar-i" style={{ inlineSize: `${percent}%` }} />
          </div>
        </div>

        <ol className="lp">
          {lessons.map((l, i) => (
            <PathNode
              key={l.id}
              n={i + 1}
              title={l.title}
              duration={l.duration}
              isFree={l.isFree}
              last={i === lessons.length - 1}
              state={
                done.has(l.id) ? "done"
                  : i === idx ? "current"
                    : canPlay(l.isFree) ? "open"
                      : "locked"
              }
              onPick={() => setIdx(i)}
            />
          ))}
        </ol>
      </Card>
    </div>
  );
}

/* ---------- الاختبار التفاعلي على الفيديو ---------- */
