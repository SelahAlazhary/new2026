"use client";

/**
 * صفحةُ الدرس — واجبُه وملفّاته.
 * ------------------------------------------------------------------
 * المرحلةُ الرابعة: **الكورس ← المادّة ← دروسُها ← الدرس**.
 *
 * **ولماذا صفحةٌ مستقلّة.** كان الواجبُ والملفّاتُ يُعرضان تحت المشغّل في
 * صفحة المادّة: أسئلةُ الواجب كلُّها مبسوطةً بإجاباتها، ثمّ شبكةُ
 * الملفّات، ثمّ مسارُ الدروس. فطالت الشاشةُ حتّى صار المشغّلُ — وهو
 * المقصود — سطراً في أوّلها يُمرَّر عنه.
 *
 * والشاشةُ الواحدةُ تحتمل غرضاً واحداً: من جاء يشاهد يشاهد، ومن جاء يحلّ
 * يحلّ. فبقي في صفحة المادّة **خبرُهما** — حالةُ الواجب وعددُ الملفّات —
 * وانتقل **متنُهما** إلى هنا.
 *
 * والصلاحيةُ تُفحص هنا كما تُفحص هناك: الرابطُ يُكتب باليد، فصفحةٌ تعرض
 * واجبَ درسٍ مقفلٍ لمن نسخ رابطَها تُبطل القفلَ كلَّه.
 */

import { use } from "react";
import Link from "next/link";
import { IconArrowLeft, IconFile, IconDownload, IconPlay } from "@/components/brand/icons";
import { PageHeader, Card } from "@/components/dashboard/ui";
import { useContent } from "@/components/content/content-provider";
import { LessonQuiz } from "@/components/student/lesson-quiz";
import { unitActive } from "@/lib/auth/access";
import { courseUnits, usableMaterials } from "@/lib/business/course-units";
import type { Material } from "@/lib/utils/types";

export default function LessonPage({
  params,
}: {
  params: Promise<{ id: string; unitId: string; lessonId: string }>;
}) {
  const { id, unitId, lessonId } = use(params);
  const { db, session, refresh } = useContent();
  const me = db?.users.find((u) => u.id === session?.uid);
  const fem = me?.gender === "female";

  const subject = db?.subjects.find((s) => s.id === id);
  const units = subject ? courseUnits(subject) : [];
  const unit = units.find((u) => u.id === decodeURIComponent(unitId));
  const lessons = unit?.lessons ?? [];
  const wantedLesson = decodeURIComponent(lessonId);
  const lesson = lessons.find((l) => l.id === wantedLesson);
  const order = lessons.findIndex((l) => l.id === wantedLesson);

  const back = unit ? `/student/course/${id}/${encodeURIComponent(unit.id)}` : `/student/course/${id}`;

  if (!subject) return <Gone msg="الكورس غير موجود." href="/student/subjects" label="كل الكورسات" />;
  if (!unit) return <Gone msg="هذه المادّة لم تعد موجودة في الكورس." href={`/student/course/${id}`} label="موادّ الكورس" />;
  if (!lesson) return <Gone msg="هذا الدرس لم يعد موجوداً في المادّة." href={back} label="دروس المادّة" />;

  /*
    نفسُ فحص صفحة المادّة: المِلكيّةُ أو كونُ الدرس مجّانيّاً. والفحصُ
    يخصّ **هذا الدرس** لا المادّةَ: درسٌ مجّانيٌّ في مادّةٍ غيرِ مملوكة
    يُفتح واجبُه، والمقفلُ يُردّ ولو كان في المادّة نفسِها درسٌ مجّانيّ.
  */
  const owned = unitActive(me, id, unit.id, Date.now(), subject.term);
  if (!owned && !lesson.isFree) {
    return (
      <Card className="mx-auto max-w-md text-center">
        <p className="py-5 text-sm text-muted-foreground">
          «{lesson.title}» درسٌ مقفل — {fem ? "فعّلي" : "فعّل"} المادّة لفتح واجبه وملفّاته.
        </p>
        <div className="flex flex-wrap items-center justify-center gap-2">
          <Link
            href={`/student/pay?subject=${id}&unit=${encodeURIComponent(unit.id)}`}
            className="btn-glow inline-flex rounded-full px-6 py-2.5 text-sm font-bold text-white"
          >
            خيارات شراء المادّة
          </Link>
          <Link href={back} className="inline-flex rounded-full border border-border px-5 py-2.5 text-sm font-bold transition hover:border-primary hover:text-primary">
            دروس المادّة
          </Link>
        </div>
      </Card>
    );
  }

  /* الملفّاتُ من الأخصّ إلى الأعمّ — كما في صفحة المادّة، فلا يختلف
     ترتيبُها باختلاف الصفحة التي تُعرض فيها. */
  const files: Material[] = usableMaterials([
    ...(lesson.materials ?? []),
    ...(unit.materials ?? []),
    ...(subject.materials ?? []),
  ]);

  const hasQuiz = Boolean(lesson.quiz?.enabled) && (lesson.quiz?.questions.length ?? 0) > 0;

  return (
    <>
      <Link href={back} className="mb-4 inline-flex items-center gap-1.5 text-sm text-muted-foreground transition hover:text-primary">
        <IconArrowLeft className="size-4 rotate-180" /> دروس {unit.title}
      </Link>

      <PageHeader
        title={lesson.title}
        subtitle={`${subject.name} · ${unit.title} · الدرس ${(order + 1).toLocaleString("ar-EG")} من ${lessons.length.toLocaleString("ar-EG")}`}
        action={
          <Link
            href={back}
            className="inline-flex items-center gap-2 rounded-full border border-border px-4 py-2 text-xs font-bold transition hover:border-primary hover:text-primary"
          >
            <IconPlay className="size-3.5" /> رجوع للمشاهدة
          </Link>
        }
      />

      <div className="grid gap-5">
        {hasQuiz ? (
          <LessonQuiz
            key={lesson.id}
            subjectId={subject.id}
            lesson={lesson}
            fem={fem}
            previous={me?.quizResults?.find((r) => r.lessonId === lesson.id) ?? null}
            onGraded={refresh}
          />
        ) : (
          <Card>
            <p className="py-4 text-center text-sm text-muted-foreground">لا واجبَ على هذا الدرس.</p>
          </Card>
        )}

        <Card>
          <p className="mb-3 flex items-center gap-2 font-display font-extrabold">
            <IconFile className="size-5 text-primary" /> ملفّات الدرس والمادّة
          </p>
          {files.length === 0 ? (
            <p className="py-3 text-center text-sm text-muted-foreground">لا ملفّات مرفقة.</p>
          ) : (
            <div className="grid gap-2 sm:grid-cols-2">
              {files.map((m) => (
                <a
                  key={m.id}
                  href={m.url}
                  target="_blank"
                  rel="noreferrer"
                  download
                  className="glass flex items-center gap-3 rounded-2xl p-3 transition hover:border-primary/40"
                >
                  <span className="grid size-9 place-items-center rounded-xl bg-primary/12 text-primary">
                    <IconFile className="size-5" />
                  </span>
                  <span className="min-w-0 flex-1 truncate text-sm font-semibold">{m.title}</span>
                  <IconDownload className="size-4 text-muted-foreground" />
                </a>
              ))}
            </div>
          )}
        </Card>
      </div>
    </>
  );
}

function Gone({ msg, href, label }: { msg: string; href: string; label: string }) {
  return (
    <Card className="mx-auto max-w-md text-center">
      <p className="py-6 text-sm text-muted-foreground">{msg}</p>
      <Link href={href} className="inline-flex rounded-full border border-border px-5 py-2 text-sm font-bold transition hover:border-primary hover:text-primary">
        {label}
      </Link>
    </Card>
  );
}
