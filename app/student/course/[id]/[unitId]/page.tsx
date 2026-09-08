"use client";

/**
 * صفحةُ المادّة — دروسُها مساراً.
 * ------------------------------------------------------------------
 * المرحلةُ الثالثة من الطريق: **الكورس ← المادّة ← دروسُها**. وما فوقها
 * يُعرض في `../page.tsx`، والعرضُ نفسُه في `components/student/unit-view`
 * ليكون واحداً هنا وفي الكورس غير المقسَّم — فلا يختلف الشكلُ باختلاف
 * الطريق إليه.
 *
 * والصفحةُ تُظهر مسارَ هذه المادّة وحدَها: من دخلها لا يرى دروسَ غيرها،
 * وهذا هو المقصودُ من فصل المواد عن الدروس.
 */

import { use } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { IconArrowLeft, IconCheckCircle } from "@/components/brand/icons";
import { EmptyLock } from "@/components/brand/illustrations";
import { PageHeader, Card } from "@/components/dashboard/ui";
import { useContent } from "@/components/content/content-provider";
import { UnitView } from "@/components/student/unit-view";
import { subscriptionFor, daysLeft, unitActive, unitSubscription } from "@/lib/auth/access";
import { courseUnits } from "@/lib/business/course-units";

export default function UnitPage({ params }: { params: Promise<{ id: string; unitId: string }> }) {
  const { id, unitId } = use(params);
  /* `?lesson=` يأتي من صفحة الكورس — فيُفتح ما ضُغط عليه لا أوّلُ المادّة */
  const wantLesson = useSearchParams().get("lesson") ?? undefined;
  const { db, session, content } = useContent();
  const me = db?.users.find((u) => u.id === session?.uid);
  const subject = db?.subjects.find((s) => s.id === id);
  const fem = me?.gender === "female";

  const units = subject ? courseUnits(subject) : [];
  const wanted = decodeURIComponent(unitId);
  const unit = units.find((u) => u.id === wanted);
  const order = units.findIndex((u) => u.id === wanted);

  const back = `/student/course/${id}`;

  if (!subject) return <NotFound msg="الكورس غير موجود." href="/student/subjects" label="كل الكورسات" />;

  /* مادّةٌ حُذفت أو رابطٌ قديم — يُردّ إلى موادّ الكورس لا إلى شاشةِ خطأ */
  if (!unit) return <NotFound msg="هذه المادّة لم تعد موجودة في الكورس." href={back} label="موادّ الكورس" />;

  /*
    الصلاحيةُ على المادّة لا على الكورس وحدَه.
    من اشترى هذه المادّةَ يدخلها وإن لم يملك الكورسَ كلَّه؛ ومن لا يملكها
    يدخل إن كان فيها درسٌ مجّانيٌّ ليُجرّبها، ويُردّ إن لم يكن.

    و`unitActive` تشمل صلاحيةَ الكورس، فلا تُفحص مرّتين.
  */
  const mine = unitActive(me, id, unit.id, Date.now(), subject.term);
  const hasFree = (unit.lessons ?? []).some((l) => l.isFree);
  if (!mine && !hasFree) {
    return (
      <Card className="mx-auto max-w-md text-center">
        <EmptyLock className="mx-auto mb-2 text-primary" width={176} />
        <h2 className="font-display text-xl font-extrabold">«{unit.title}» غير مُفعّلة</h2>
        <p className="mt-2 text-sm text-muted-foreground">
          {fem ? "اشتري" : "اشترِ"} هذه المادّة وحدَها، أو {fem ? "فعّلي" : "فعّل"} الكورس كلَّه.
        </p>
        <div className="mt-5 flex flex-wrap items-center justify-center gap-2">
          <Link href={`/student/pay?subject=${id}&unit=${encodeURIComponent(unit.id)}`}
            className="inline-flex rounded-full btn-glow px-6 py-2.5 text-sm font-bold text-white">خيارات شراء المادّة</Link>
          <Link href={back}
            className="inline-flex rounded-full border border-border px-5 py-2.5 text-sm font-bold transition hover:border-primary hover:text-primary">موادّ الكورس</Link>
        </div>
      </Card>
    );
  }

  /* الشارةُ تصف ما يملكه في هذه المادّة — اشتراكَها هي أو اشتراكَ كورسها */
  const sub = unitSubscription(me, id, unit.id) ?? subscriptionFor(me, id);
  const left = daysLeft(sub?.expiresAt);

  return (
    <>
      <Link href={back} className="mb-4 inline-flex items-center gap-1.5 text-sm text-muted-foreground transition hover:text-primary">
        <IconArrowLeft className="size-4 rotate-180" /> موادّ {subject.name}
      </Link>
      <PageHeader
        title={unit.title}
        subtitle={`المادّة ${(order + 1).toLocaleString("ar-EG")} من ${units.length.toLocaleString("ar-EG")} · ${(unit.lessons ?? []).length.toLocaleString("ar-EG")} درساً`}
        action={
          sub ? (
            <span className="inline-flex items-center gap-2 rounded-full border border-emerald-500/40 bg-emerald-500/10 px-4 py-2 text-xs font-bold text-emerald-500">
              <IconCheckCircle className="size-4" />
              {sub.planName ?? (sub.subjectId === "*" ? "الترم الكامل" : "اشتراك الكورس")}
              {left !== null && <span className="text-muted-foreground">· متبقٍ {left.toLocaleString("ar-EG")} يوم</span>}
            </span>
          ) : undefined
        }
      />

      <UnitView
        course={subject}
        unit={unit}
        owned={mine}
        backHref={back}
        backLabel="موادّ الكورس"
        initialLessonId={wantLesson ? decodeURIComponent(wantLesson) : undefined}
      />
    </>
  );
}

function NotFound({ msg, href, label }: { msg: string; href: string; label: string }) {
  return (
    <Card className="mx-auto max-w-md text-center">
      <p className="py-6 text-sm text-muted-foreground">{msg}</p>
      <Link href={href} className="inline-flex rounded-full border border-border px-5 py-2 text-sm font-bold transition hover:border-primary hover:text-primary">{label}</Link>
    </Card>
  );
}
