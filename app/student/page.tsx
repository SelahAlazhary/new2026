"use client";

/**
 * بوابة الطالب — الصفحة الرئيسية.
 * ------------------------------------------------------------
 * التنسيق أُعيد بناؤه على هوية المخطوط:
 *   • لوح ترحيب من الحبر بتبليط كوفي وشمسة وسطر يُخطّ حياً.
 *   • شريط مؤشّرات (كورسات · متوسّط التقدّم · اشتراكات سارية).
 *   • بطاقات الاشتراكات والتنبيهات، ثم قائمة الكورسات.
 * كل الأرقام مشتقّة من بيانات الطالب الفعلية — لا قيم تجميلية.
 */

import { useState } from "react";
import Link from "next/link";
import { motion } from "framer-motion";
import {
  IconPlay, IconClipboardCheck, IconRadio, IconArrowLeft, IconClock,
  IconCalendar, IconLayers, IconBook, IconChart,
} from "@/components/brand/icons";
import { Shamsa, ElegantRule } from "@/components/brand/pattern";
import { CourseArt } from "@/components/brand/course-art";
import { StatTile } from "@/components/brand/stat-tile";
import { StudentHomeSkeleton } from "@/components/ui/skeleton";
import { InstallApp } from "@/components/pwa/install-app";
import { EnableNotifications } from "@/components/pwa/enable-notifications";
import { Card, Progress, StatusBadge, Medallion, GoldRule } from "@/components/dashboard/ui";
import { useContent } from "@/components/content/content-provider";
import { findLayout } from "@/lib/brand/skins";
import { findDesign, shapeStyle } from "@/lib/brand/designs";
import { EdgeArtLayer } from "@/components/brand/edge-art";
import { subjectActive, activeSubs, daysLeft } from "@/lib/auth/access";
import { MotionMark } from "@/components/brand/motion-mark";
import { ShariMotion } from "@/components/brand/shari-motion";
import { ShariVector } from "@/components/brand/shari-vector";
import { AzhariStudentHeader } from "@/components/student/azhari-header";

const ar = (n: number) => n.toLocaleString("ar-EG");

export default function StudentHome() {
  const { db, session, content, loading } = useContent();
  /* التخطيط المختار من اللوحة — يحكم شكل الترحيب والمؤشّرات والبطاقات. */
  const L = findLayout(content.studentLayout);
  /* الهيئة تحدّد الشكل (الحوافّ والزخرفة) بمعزل عن الثيم الذي يحدّد اللون. */
  const D = findDesign(content.studentDesign);
  const me = db?.users.find((u) => u.id === session?.uid);
  const subjects = (db?.subjects ?? []).filter((s) => s.status === "منشورة");
  const live = db?.live ?? [];
  const exams = db?.exams ?? [];

  const fem = me?.gender === "female";
  const y = (v: string) => `${v}${fem ? "ي" : ""}`; // صيغة الأمر: أكمل/أكملي
  const owns = (s: { id: string; term?: 1 | 2 }) => subjectActive(me, s);
  const subs = activeSubs(me);
  const courses = subjects
    .filter((s) => owns(s))
    .map((s) => ({ ...s, progress: me?.progress?.[s.id] ?? 0 }));
  const liveNow = live.find((l) => l.status === "مباشر");
  // اختبار متاح فعلاً للطالب (الأسئلة تصل فارغة لمن لا يحقّ له)
  const nextExam = exams.find((e) => e.status === "منشور" && e.questions.length > 0);
  const avg = courses.length ? Math.round(courses.reduce((a, c) => a + c.progress, 0) / courses.length) : 0;
  // أقرب اشتراك ينتهي — منه تُشتقّ الأيام المتبقّية المعروضة
  const expiring = subs
    .map((sb) => ({ sb, left: daysLeft(sb.expiresAt) }))
    .filter((x) => x.left !== null)
    .sort((a, b) => (a.left as number) - (b.left as number))[0];
  const permanent = subs.some((sb) => daysLeft(sb.expiresAt) === null);

  /* النمط المضغوط يصغّر البطاقات ليتّسع الصفّ على الجوّال. */
  const tileCls = L.stats === "inline" ? "!p-2.5 sm:!p-3" : "";
  /* المؤشّرات داخل لوح الحبر تُكتب بالأبيض، وخارجه بألوان الثيم — وإلا
     ظهر النصّ أبيض على ورق فاتح فاختفى. */
  const statsTone: "ink" | "surface" =
    L.header !== "minimal" && L.statsInHeader ? "ink" : "surface";

  /* المؤشّرات كتلة واحدة — تُوضع داخل لوح الترحيب أو تحته حسب التخطيط،
     فلا تُكتب مرّتين ولا تختفي حين يُخفى اللوح. */
  const statsBlock = (
        <div
          className={`student-stats relative grid gap-3 sm:gap-4 ${
            L.stats === "inline" ? "grid-cols-3 gap-2 sm:gap-3"   // شريط أفقي مضغوط
              : L.stats === "grid" ? "grid-cols-2 sm:grid-cols-3"  // شبكة تلتفّ على الجوّال
                : L.stats === "rail" ? "grid-cols-1"                // عمود رأسي
                  : "sm:grid-cols-3"                                // صفّ متساوٍ
          }`}
        >
          {/*
            الرسومُ من مجموعة `ShariVector` لا من الصور المتتبَّعة.
            ------------------------------------------------------------
            المتتبَّعةُ رسومٌ نقطيّةٌ حُوِّلت إلى متّجهات: خطوطُها من التتبّع
            لا من يد مصمّم، فتُقرأ خشنةً في الأحجام الصغيرة. وهذه مسارات
            Lottie من الرسم الذي أرسله الأستاذُ نفسُه — منحنياتٌ محكمةٌ،
            وثلاثُ نبراتٍ من الهوية، وحركةُ SMIL داخل الملفّ تعمل قبل
            ترطيب React ولا تُحسب في حزمة الجافاسكربت.

            والاختيارُ بالمعنى: الإجازةُ والختمُ للتقدّم، والمصحفُ والكتابةُ
            للكورسات، والشمسةُ للاشتراك.
          */}
          <StatTile index={0} ring={avg} label="متوسّط تقدّمك" icon={<ShariVector id="ijazah" size={74} />} className={tileCls} shape={shapeStyle(D.tile)} tone={statsTone} />
          <StatTile
            index={1}
            value={ar(courses.length)}
            unit={courses.length === 1 ? "كورس" : "كورسات"}
            label="كورساتك"
            icon={<ShariVector id="quranWrite" size={74} />}
            className={tileCls}
            shape={shapeStyle(D.tile)}
            tone={statsTone}
          />
          {/* الاشتراك الساري — يعرض ما تبقّى حتى الانتهاء */}
          <StatTile
            index={2}
            icon={<ShariVector id="rosette" size={74} />}
            badge={subs.length > 1 ? `${ar(subs.length)} اشتراكات` : undefined}
            value={
              subs.length === 0 ? "—" : permanent && !expiring ? "دائم" : ar(expiring?.left ?? 0)
            }
            unit={
              subs.length === 0 || (permanent && !expiring)
                ? undefined
                : (expiring?.left ?? 0) === 1
                  ? "يوم متبقٍّ"
                  : "يوماً متبقّياً"
            }
            label={subs.length === 0 ? "لا يوجد اشتراك ساري" : "اشتراك ساري"}
            /* الشريط يقيس ما تبقّى من ٣٠ يوماً — يقصر كلما اقترب الانتهاء */
            bar={
              subs.length === 0 ? 0 : permanent && !expiring ? 100 : Math.min(100, ((expiring?.left ?? 0) / 30) * 100)
            }
            className={tileCls}
            shape={shapeStyle(D.tile)}
            tone={statsTone}
          />
        </div>
  );

  const railMode = !L.statsInHeader && L.stats === "rail";
  /* خيارُ الترويسة يعلو التخطيطَ الجاهز — ومن لم يختر بقي على تخطيطه. */
  const headerStyle = (content.studentHeader as typeof L.header) || L.header;
  const showHeader = headerStyle !== "minimal";
  /*
    موضعُ المؤشّرات — خيارٌ صريحٌ يعلو التخطيط.
    كان يتبع التخطيطَ الجاهز وحدَه، فمن أراد المؤشّراتِ داخل اللوح لزمه
    أن يُبدّل التخطيطَ كلَّه من أجلها — ويتغيّر معه ما لم يُرد تغييرَه.
  */
  const statsInside =
    showHeader &&
    (content.statsInPanel === "in" ? true
      : content.statsInPanel === "out" ? false
        : L.statsInHeader);

  /* هيكل عظمي حتى تكتمل البيانات — بنفس التخطيط المختار فلا تقفز الصفحة
     عند وصولها. (db قد يكون فارغاً لحظة الانتقال أو بعد تحديث المحتوى.) */
  if (loading || !db) {
    return (
      <StudentHomeSkeleton
        header={showHeader}
        statsInHeader={statsInside}
        cards={L.cards === "list" ? 1 : L.cards === "grid3" || L.cards === "compact" ? 3 : 2}
      />
    );
  }

  return (
    <>
      {/* ---------------- حالة تحويلاتك ---------------- */}
      <PayNotice />

      {/* ---------------- لوح الترحيب ---------------- */}
      {!showHeader && (
        <div className="mb-5" data-reveal="right" data-reveal-duration="fast">
          <p className="font-kufi text-sm font-bold text-muted-foreground">
            أهلاً {fem ? "بكِ" : "بك"}
          </p>
          <h1 className="font-display mt-1 truncate text-2xl font-bold sm:text-3xl">{session?.name}</h1>
          <div className="mt-3 max-w-[12rem] text-accent"><GoldRule /></div>
        </div>
      )}

      {/*
        الهيئةُ الأزهرية لوحٌ قائمٌ بذاته لا تنويعةَ حشوٍ على اللوح العامّ:
        زخرفتُه مبنيّةٌ وبطاقاتُه تطفو على حافّته — فتُرسم بمكوّنها ولا
        تُقحَم في تفريعات الهيئات الخمس.
      */}
      {/*
        موضعُ اللوح: أعلى الصفحة أو أسفلها.
        و«أسفل» يُرسم في آخر الصفحة لا هنا — انظر نهايةَ المكوّن.
      */}
      {headerStyle === "azhari" && (content.azHead?.place ?? "top") === "top" && (
        <AzhariStudentHeader
          name={session?.name ?? ""}
          grade={me?.grade}
          female={fem}
          progress={avg}
          courses={courses.length}
          daysLeft={permanent ? null : (expiring?.left ?? null)}
          active={subs.length > 0}
          opts={content.azHead}
        />
      )}

      {showHeader && headerStyle !== "azhari" && (
      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        style={{
          ...shapeStyle(D.panel),
          ["--h-pad" as string]:
            L.header === "compact" ? "1.1rem" : L.header === "banner" ? "1.75rem" : "1.4rem",
        }}
        /* الحشو الأساسي من التخطيط، ويُضاف إليه هامش أمان الشكل. */
        className={`student-header btn-glow relative mb-6 overflow-hidden text-[hsl(var(--primary-foreground))] [padding-block:calc(var(--h-pad)+var(--shape-pad-y,0px))] [padding-inline:calc(var(--h-pad)+var(--shape-pad-x,0px))]`}
      >
        <EdgeArtLayer kind={D.edge} className="z-0 text-white/60" />
        <Shamsa
          size={L.header === "compact" ? 220 : 340}
          rays={24}
          className="pointer-events-none absolute -left-16 -top-20 z-0 opacity-25"
        />

        {/* كل نمط ترويسة تركيب مختلف فعلاً — لا فرق حشو فقط */}
        <div
          className={`relative gap-5 ${
            L.header === "split" ? "flex flex-wrap items-center justify-between"
              : L.header === "stacked" ? "flex flex-col items-center text-center"
                : L.header === "compact" ? "flex items-center justify-between"
                  : "flex flex-wrap items-center justify-between"
          }`}
        >
          {/*
            قرصُ الحرف الأوّل.
            ------------------------------------------------------------
            اللوحُ كان نصّاً وحدَه — «أهلاً بك» واسماً ومرحلة — فيبدأ من
            حافّةٍ فارغةٍ ولا شيءَ يُثبّت العين. والقرصُ يُعطي الترحيبَ
            مرساةً، وهو أوّلُ ما يُرى في كلّ لوحةٍ تُخاطب صاحبَها باسمه.

            والحرفُ من الاسم نفسِه لا صورةٌ تُرفع: الطالبُ لا يرفع صورةً
            في هذه المنصّة، وقرصٌ فارغٌ ينتظر صورةً لا تأتي أسوأُ من حرف.

            و`?.[0]` لا `.charAt(0)`: الاسمُ قد يكون فارغاً لحظةَ التحميل.
          */}
          {/*
            القرصُ والاسمُ وحدةٌ واحدة.
            ------------------------------------------------------------
            الصفُّ عليه `justify-between` ليُبعد الحلقةَ إلى الطرف المقابل.
            فلمّا وُضع القرصُ أخاً للاسم صار عنصراً ثالثاً في الصفّ —
            فباعد بينهما التوزيعُ نفسُه، ونُفي القرصُ إلى الحافّة وحدَه
            بينما بقي الاسمُ في الجهة الأخرى.

            والعلاجُ أن يُلَفّا معاً: التوزيعُ يُباعد بين **الوحدتين** —
            الهويّةِ والحلقةِ — لا بين القرص واسمِه.
          */}
          <div className="student-id flex min-w-0 items-center gap-3">
            <span className="student-avatar" aria-hidden="true">
              {(session?.name ?? "").trim()[0] ?? ""}
            </span>

            <div className={`student-greet ${L.header === "stacked" ? "w-full" : "min-w-0"}`}>
            <p
              className={`font-kufi font-bold tracking-[0.04em] text-white/90 drop-shadow-sm ${
                L.header === "compact" ? "text-xs" : "text-base sm:text-lg"
              }`}
            >
              أهلاً {fem ? "بكِ" : "بك"}
            </p>
            <h1
              className={`font-display truncate font-bold tracking-tight drop-shadow-sm ${
                L.header === "compact" ? "mt-0.5 text-xl sm:text-2xl"
                  : L.header === "banner" ? "mt-2 text-3xl sm:text-4xl"
                    : "mt-1.5 text-2xl sm:text-3xl"
              }`}
            >
              {session?.name}
            </h1>
            {L.header !== "compact" && (
              <ElegantRule
                width={L.header === "banner" ? 220 : 170}
                className={`mt-2.5 text-white/70 ${L.header === "stacked" ? "mx-auto" : ""}`}
              />
            )}
            {me?.grade && L.header !== "compact" && (
              <p className="student-header-extra font-kufi mt-2 text-base font-semibold text-white/85">{me.grade}</p>
            )}
            </div>
          </div>

          {/* المنقسم والمضغوط: حلقة التقدّم في الطرف المقابل */}
          {(L.header === "split" || L.header === "compact") && (
            <span className="relative grid size-[4.5rem] shrink-0 place-items-center sm:size-20">
              <svg viewBox="0 0 64 64" className="size-full -rotate-90" fill="none" aria-hidden="true">
                <circle cx="32" cy="32" r="26" stroke="#fff" strokeOpacity={0.22} strokeWidth="7" />
                <circle
                  cx="32" cy="32" r="26"
                  stroke="hsl(var(--gold-light))" strokeWidth="7" strokeLinecap="round"
                  strokeDasharray={`${2 * Math.PI * 26 * (avg / 100)} ${2 * Math.PI * 26}`}
                />
              </svg>
              <span className="font-display absolute text-base font-bold">{ar(avg)}٪</span>
            </span>
          )}
        </div>

        {statsInside && statsBlock}
      </motion.div>
      )}

      {/* المؤشّرات خارج اللوح — الشريط الرأسي عمود مستقلّ، وغيره صفّ فوق المحتوى */}
      {!statsInside && L.stats !== "rail" && <div className="mb-6">{statsBlock}</div>}

      {/* نمط الشريط: المؤشّرات عمود رأسي يمين المحتوى على الشاشات الواسعة */}
      <div className={railMode ? "lg:flex lg:items-start lg:gap-6" : undefined}>
      {railMode && (
        <aside className="mb-6 shrink-0 lg:mb-0 lg:w-56">{statsBlock}</aside>
      )}
      <div className={railMode ? "min-w-0 flex-1" : undefined}>

      {/* ---------------- الاشتراكات السارية ---------------- */}
      {subs.length > 0 && (
        <div className="mb-6 grid gap-3 sm:grid-cols-2">
          {subs.map((sb) => {
            const left = daysLeft(sb.expiresAt);
            const all = sb.subjectId === "*";
            const soon = left !== null && left <= 7;
            return (
              <Card key={sb.id} className="flex items-center gap-3 !p-4">
                <Medallion size={44} className="text-accent">
                  {all ? <IconLayers className="size-5" /> : <IconPlay className="size-5" />}
                </Medallion>
                <div className="min-w-0 flex-1">
                  <p className="truncate font-bold">
                    {sb.planName ?? (all ? "الترم الكامل" : "اشتراك كورس")}
                  </p>
                  <p className="font-kufi mt-0.5 text-[10px] text-muted-foreground">
                    {all ? "كل المواد المتاحة لصفّك" : subjects.find((s) => s.id === sb.subjectId)?.name ?? "كورس"}
                  </p>
                </div>
                <span
                  className={`font-kufi inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-[10px] font-bold ${
                    soon ? "bg-amber-500/15 text-amber-600" : "bg-emerald-500/14 text-emerald-600"
                  }`}
                >
                  <IconCalendar className="size-3" />
                  {left !== null ? `متبقٍ ${ar(left)} يوم` : "بلا انتهاء"}
                </span>
              </Card>
            );
          })}
        </div>
      )}

      <InstallApp className="mb-4" />
      <EnableNotifications className="mb-6" />

      {/* ---------------- تنبيهات: بث واختبار ---------------- */}
      {(liveNow || nextExam) && (
        <div className="mb-7 grid gap-4 sm:grid-cols-2">
          {liveNow && (
            <Card className="flex items-center gap-4 !p-4">
              <span className="relative grid size-12 shrink-0 place-items-center rounded-2xl bg-rose-500/12 text-rose-500">
                <IconRadio anim="pulse" className="size-6" />
                <span className="absolute inset-0 animate-pulse-ring rounded-2xl bg-rose-500/40" />
              </span>
              <div className="min-w-0 flex-1">
                <StatusBadge status="مباشر" />
                <p className="mt-1 truncate font-bold">{liveNow.title}</p>
              </div>
              <Link href="/student/live" className="btn-glow rounded-full px-4 py-2.5 text-xs font-bold text-white">
                دخول
              </Link>
            </Card>
          )}
          {nextExam && (
            <Card className="flex items-center gap-4 !p-4">
              <Medallion size={48} className="text-primary">
                <IconClipboardCheck className="size-6" />
              </Medallion>
              <div className="min-w-0 flex-1">
                <p className="font-kufi text-[10px] tracking-wide text-accent">اختبار متاح</p>
                <p className="mt-0.5 truncate font-bold">{nextExam.title}</p>
              </div>
              <Link
                href={`/student/exams/${nextExam.id}`}
                className="btn-foil rounded-full px-4 py-2.5 text-xs font-bold transition hover:text-primary"
              >
                {y("ابدأ")}
              </Link>
            </Card>
          )}
        </div>
      )}

      {/* ---------------- الكورسات ---------------- */}
      <div className="mb-4" data-reveal="right" data-reveal-duration="fast">
        <div className="flex items-center justify-between gap-3">
          <p className="font-display text-lg font-bold">{y("أكمل")} المذاكرة</p>
          <Link
            href="/student/subjects"
            className="font-kufi group -my-2 inline-flex items-center gap-1 py-2 text-[11px] font-bold text-primary"
          >
            كل الكورسات <IconArrowLeft className="ico-slide size-4" />
          </Link>
        </div>
        <div className="mt-3 max-w-[14rem] text-accent">
          <GoldRule />
        </div>
      </div>

      {courses.length === 0 && (
        <Card className="flex flex-col items-center gap-3 py-12 text-center">
          <ShariVector id="quranWrite" size={168} />
          <p className="font-display text-lg font-bold">لم {y("تفعّل")} أي كورس بعد</p>
          <p className="max-w-sm text-sm leading-relaxed text-muted-foreground">
            {y("تصفّح")} الكورسات المتاحة {y("واشتر")} ما يناسبك، ثم {y("فعّل")}ه بكود التفعيل.
          </p>
          <Link href="/student/subjects" className="btn-glow mt-2 rounded-full px-7 py-3 text-sm font-bold text-white">
            {y("تصفّح")} الكورسات
          </Link>
        </Card>
      )}

      <div
        className={`course-grid grid gap-4 ${
          L.cards === "rows" ? "grid-cols-1 gap-2"
            : L.cards === "list" ? "grid-cols-1"
            : L.cards === "grid3" ? "sm:grid-cols-2 xl:grid-cols-3"
              : L.cards === "compact" ? "grid-cols-1 sm:grid-cols-2 xl:grid-cols-3"
                : "sm:grid-cols-2"
        }`}
      >
        {courses.map((c, i) => (
          <motion.div
            key={c.id}
            initial={{ opacity: 0, y: 24, scale: 0.96 }}
            whileInView={{ opacity: 1, y: 0, scale: 1 }}
            viewport={{ once: true, margin: "0px 0px -40px 0px" }}
            transition={{ delay: (i % 6) * 0.07, duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
          >
            <Link href={`/student/course/${c.id}`} className="group block">
              {/*
                نمطُ «الصفوف»: سطرٌ يُقرأ لا لوحةٌ تُنظر.
                الأنماطُ الأربعةُ الأخرى تعرض غلافَ الكورس بعرضٍ أوسعَ أو
                أضيق؛ ومن عنده كورساتٌ كثيرةٌ لا يريد لكلٍّ لوحةً بحجم كفّ.
                فهنا شارةُ التقدّم وعنوانٌ وخطٌّ رفيع — وتُرى الضعفُ في
                الشاشة نفسِها.
              */}
              {L.cards === "rows" ? (
                <Card className="course-card relative flex items-center gap-3 overflow-hidden !px-3.5 !py-2.5 transition hover:border-accent/50">
                  {/* الشارةُ ذهبيّةٌ ونصُّها كحليّ — الذهبُ على الورق لا يُقرأ نصّاً */}
                  <span className="font-kufi shrink-0 rounded-lg bg-[hsl(var(--gold)/0.3)] px-2 py-1 text-[10px] font-extrabold text-primary [font-variant-numeric:tabular-nums]">
                    {ar(c.progress)}٪
                  </span>
                  <span className="min-w-0 flex-1">
                    <span className="font-display block truncate text-sm font-bold">{c.name}</span>
                    <span className="mt-1 block h-1 overflow-hidden rounded-full bg-[hsl(var(--gold)/0.22)]">
                      <span
                        className="block h-full rounded-full bg-[hsl(var(--primary))]"
                        style={{ width: `${Math.max(0, Math.min(100, c.progress))}%` }}
                      />
                    </span>
                  </span>
                  <span className="font-kufi shrink-0 text-[10px] text-muted-foreground">{ar(c.lessons)} درس</span>
                  <IconArrowLeft className="size-4 shrink-0 text-muted-foreground transition group-hover:text-primary" />
                </Card>
              ) : (
              <Card className="course-card relative flex gap-4 overflow-hidden !p-4 transition hover:border-accent/50">
                {/* لوحة مصغّرة من نفس نظام أغلفة الكورسات */}
                <span className="relative w-28 shrink-0 overflow-hidden rounded-2xl sm:w-32">
                  <CourseArt
                    seed={c.id}
                    title={c.name}
                    cover={c.cover}
                    coverFit={c.coverFit}
                    coverRatio={c.coverRatio}
                    coverColor={c.coverColor}
                    coverPattern={c.coverPattern}
                    coverText={c.coverText}
                    coverStickers={c.coverStickers}
                    progress={c.progress}
                    className="h-full transition-opacity duration-300 group-hover:opacity-95"
                  />
                </span>
                <span className="relative flex min-w-0 flex-1 flex-col justify-center">
                  <p className="font-display truncate font-bold">{c.name}</p>
                  <p className="font-kufi mt-0.5 text-[10px] text-muted-foreground">{c.teacher}</p>

                  <span className="mt-3 block">
                    <Progress value={c.progress} />
                  </span>

                  <span className="font-kufi mt-2 flex items-center justify-between text-[10px] text-muted-foreground">
                    <span className="inline-flex items-center gap-1">
                      <IconClock className="size-3.5" /> {ar(c.lessons)} درس
                    </span>
                    <span>{ar(c.progress)}٪</span>
                  </span>

                  <span className="mt-2 inline-flex items-center gap-1.5 text-xs font-bold text-primary">
                    {y("أكمل")} من حيث توقّفت <IconArrowLeft className="ico-slide size-3.5" />
                  </span>
                </span>
              </Card>
              )}
            </Link>
          </motion.div>
        ))}
      </div>
      </div>
      </div>

      {/*
        اللوحُ في الذيل لمن اختاره.
        ولا يُنسخ المكوّنُ ولا تُنسخ خصائصُه: تعريفٌ واحدٌ يُرسم في موضعين
        بشرطٍ واحدٍ معكوس — فما يُصلَح في أحدهما يصلح في الآخر.
      */}
      {headerStyle === "azhari" && content.azHead?.place === "bottom" && (
        <div className="mt-8">
          <AzhariStudentHeader
            name={session?.name ?? ""}
            grade={me?.grade}
            female={fem}
            progress={avg}
            courses={courses.length}
            daysLeft={permanent ? null : (expiring?.left ?? null)}
            active={subs.length > 0}
            opts={content.azHead}
          />
        </div>
      )}
    </>
  );
}

/**
 * حالة تحويلات الطالب على صفحته الأولى.
 * ------------------------------------------------------------------
 * التحويل المقبول الذي لم يُفعَّل كودُه مالٌ دُفع ولم يُستعمل — أسوأ ما
 * يُترك في شاشة أخرى. والمعلَّق يطمئن الطالب أن طلبه لم يضِع.
 */
function PayNotice() {
  const { db, session, refresh } = useContent();
  const mine = (db?.payments ?? []).filter((p) => p.userId === session?.uid);
  const ready = mine.find((p) => p.status === "approved" && p.code && !p.redeemedAt);
  const waiting = mine.find((p) => p.status === "pending");

  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  if (!ready && !waiting) return null;

  const activate = async () => {
    if (!ready?.code) return;
    setErr(null);
    setBusy(true);
    const res = await fetch("/api/redeem", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        code: ready.code,
        /* الكود العامّ (كل المواد أو فصل) لا يُقيَّد بكورس بعينه. */
        subjectId: ready.subjectId && !/^(\*|T[12])$/.test(ready.subjectId) ? ready.subjectId : undefined,
      }),
    });
    const data = await res.json().catch(() => ({}));
    setBusy(false);
    if (!res.ok) { setErr(data.error || "تعذّر التفعيل"); return; }
    await refresh();
  };

  if (ready) {
    return (
      <div className="mb-5 flex flex-wrap items-center gap-3 rounded-3xl border border-emerald-500/40 bg-emerald-500/10 px-5 py-4" data-reveal="down" data-reveal-duration="fast">
        <span className="font-display text-sm font-extrabold text-emerald-700 dark:text-emerald-300">
          تم قبول تحويلك لخطة «{ready.planName}»
        </span>
        <span className="rounded-xl bg-white/70 px-3 py-1 font-mono text-sm font-extrabold tracking-wider dark:bg-black/30">
          {ready.code}
        </span>
        <button
          type="button"
          onClick={activate}
          disabled={busy}
          className="btn-glow mr-auto rounded-2xl px-5 py-2 text-xs font-bold text-white disabled:opacity-60"
        >
          {busy ? "جارٍ التفعيل…" : "فعّل الآن"}
        </button>
        {err && <span className="w-full text-[11px] font-bold text-rose-500">{err}</span>}
      </div>
    );
  }

  return (
    <div className="mb-5 flex flex-wrap items-center gap-3 rounded-3xl border border-amber-500/40 bg-amber-500/10 px-5 py-4" data-reveal="down" data-reveal-duration="fast">
      <span className="font-display text-sm font-extrabold text-amber-700 dark:text-amber-300">
        تحويلك لخطة «{waiting!.planName}» قيد المراجعة
      </span>
      <span className="text-xs text-muted-foreground">
        سيصلك كود التفعيل في الإشعارات فور مراجعته.
      </span>
    </div>
  );
}
