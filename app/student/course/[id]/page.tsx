"use client";

/**
 * صفحةُ الكورس — موادُّه لا دروسُه.
 * ------------------------------------------------------------------
 * كانت هذه الشاشةُ تفتح على مشغّلٍ وقائمةِ دروسٍ فيها الموادُّ ألواحاً
 * مطويّة. فالمادّةُ والدرسُ في قسمٍ واحد: من أراد مادّةً بعينها فتح لوحَها
 * ومرّ على دروس ما قبلها، ومن أراد أن يرى ما في الكورس من موادَّ لم يرَ
 * إلّا عناوينَ مطويّةً بين الدروس.
 *
 * فصارت ثلاثَ مراحل — **الكورس ← المادّة ← دروسُها** — وهذه أُولاها:
 * الموادُّ ألواحاً مستقلّة، في كلٍّ عددُ دروسها وما أنجزتَ منها.
 *
 * **ويُستثنى الكورسُ غيرُ المقسَّم.** كورسٌ لم يُقسَّم إلى موادَّ بعدُ له
 * مادّةٌ واحدةٌ ملفوفة، ولوحٌ واحدٌ يُضغط ليُفتح على دروسه ضغطةٌ لا تُفيد
 * شيئاً. فتُعرض دروسُه هنا مباشرةً — والمراحلُ ثلاثٌ حيث تُفيد، لا حيث
 * تُتكلَّف.
 */

import { use, useState } from "react";
import Link from "next/link";
import { motion } from "framer-motion";
import { IconArrowLeft, IconCheckCircle, IconListVideo, IconGift, IconPlay } from "@/components/brand/icons";
import { EmptyLock } from "@/components/brand/illustrations";
import { PageHeader, Card } from "@/components/dashboard/ui";
import { useContent } from "@/components/content/content-provider";
import { UnitView, useDone } from "@/components/student/unit-view";
import { subjectActive, subscriptionFor, daysLeft, unitActive, ownsAnyUnit } from "@/lib/auth/access";
import { IconLock, IconCart } from "@/components/brand/icons";
import { planPrice } from "@/lib/business/plans";
import { allLessons, courseUnits } from "@/lib/business/course-units";

export default function CoursePage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const { db, session, content } = useContent();
  const me = db?.users.find((u) => u.id === session?.uid);
  const subject = db?.subjects.find((s) => s.id === id);
  const owned = subjectActive(me, subject);
  const fem = me?.gender === "female";

  const units = subject ? courseUnits(subject) : [];
  const lessons = subject ? allLessons(subject) : [];
  const { done } = useDone(id, session?.uid);

  const sub = subscriptionFor(me, id);
  const left = daysLeft(sub?.expiresAt);

  /*
    أيُّ الألواح مفتوح.
    ------------------------------------------------------------------
    كُتب أوّلاً `open={i === 0}` على `<details>` — وهو خطأ: React يُعيد
    كتابة السمة عند كلّ إعادة رسم، فأيُّ تغيّرٍ في الحالة (كوضع علامة
    «تمّت» على درس) يُطبق ما فتحه الطالبُ ويفتح الأوّلَ مكانَه.

    فالفتحُ حالةٌ تُدار: بذرتُها أوّلُ لوح، و`onToggle` يُحدّثها. ولا
    تُبنى من `units` في `useState` مباشرةً لأنّها تُحسب في كلّ رسم —
    فتُقرأ من دالّةٍ تُنفَّذ مرّةً واحدة.
  */
  const [openUnits, setOpenUnits] = useState<Set<string>>(() => new Set());
  const [seeded, setSeeded] = useState(false);

  if (!subject) return <NotFound msg="الكورس غير موجود." />;

  /*
    من لا يملك الكورسَ يُردّ — إلّا أن يبيع الكورسُ موادَّه مفرَّقة.
    عندئذٍ تُفتح له الموادُّ ليرى ما فيها ويشتري ما يحتاج، وكلُّ مادّةٍ
    مقفلةٌ حتّى تُشترى. وردُّه هنا يجعل البيعَ المفرَّقَ لا معنى له: لا
    يرى ما يشتري.
  */
  /*
    و«الموادّ» لا تعني شيئاً في كورسٍ لم يُقسَّم.
    الكورسُ غيرُ المقسَّم له مادّةٌ واحدةٌ ملفوفةٌ اسمُها «دروس الكورس» —
    وفتحُها للطالب ليشتريها هو فتحُ الكورس كلِّه بثوبٍ آخر. فيُساق إلى
    بوّابة الدفع كما لو كان الوضعُ الأوّل، ولا يُترك في شاشةٍ بلا معنى.
  */
  const perUnit = (subject.entryMode ?? "gateway") === "materials" && units.length > 1;

  /*
    البابُ يُفتح والفيديو يُقفل.
    ------------------------------------------------------------------
    كان من لا يملك الكورس يُردّ عند الباب بلوحٍ يقول «غير مُفعّل» — فلا
    يرى ما فيه أصلاً. وهو يُسأل أن يدفع لشيءٍ لم يُرِه أحدٌ له: كم مادّةً
    فيه؟ وكم درساً؟ وما عناوينُها؟ لا جواب.

    فصار يدخل فيرى المنهجَ كلَّه — الموادَّ وعناوينَ الدروس ومُددَها —
    **والمشغّلُ وحدَه مقفول**: `owned` يبقى `false` فيُظهر `UnitView`
    لوحَ الشراء مكانَ الفيديو. فيعرف ما يشتري قبل أن يشتريه، وهذا أدعى
    للشراء من بابٍ موصد.

    ولا يُفتح شيءٌ من المحتوى بهذا: الرابطُ لا يخرج والفيديو لا يعمل —
    العناوينُ وحدَها، وهي في صفحة الكورس العامّة أصلاً.
  */
  const locked = !owned && !perUnit && !ownsAnyUnit(me, id);

  const buyBanner = locked ? (
    <Card className="mb-5 flex flex-wrap items-center justify-between gap-3 border-primary/30">
      <div className="min-w-0">
        <p className="font-display text-base font-extrabold">هذا الكورس غير مُفعّل</p>
        <p className="mt-1 text-sm text-muted-foreground">
          تتصفّح المنهجَ ومحتوياته — و{fem ? "لمشاهدتِك" : "لمشاهدة"} الدروس {fem ? "فعّلي" : "فعّل"} الكورس بكود التفعيل.
        </p>
      </div>
      <Link
        href={`/student/pay?subject=${subject.id}`}
        className="shrink-0 rounded-full btn-glow px-6 py-2.5 text-sm font-bold text-white"
      >
        خيارات الاشتراك
      </Link>
    </Card>
  ) : null;

  const header = (
    <>
      <Link href="/student/subjects" className="mb-4 inline-flex items-center gap-1.5 text-sm text-muted-foreground transition hover:text-primary">
        <IconArrowLeft className="size-4 rotate-180" /> كل الكورسات
      </Link>
      <PageHeader
        title={subject.name}
        subtitle={`${subject.teacher} · ${units.length > 1 ? `${units.length.toLocaleString("ar-EG")} مادّة · ` : ""}${lessons.length.toLocaleString("ar-EG")} درساً`}
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
    </>
  );

  if (lessons.length === 0) {
    return <>{header}{buyBanner}<NotFound msg="لم تُضَف دروس لهذا الكورس بعد." /></>;
  }

  /* كورسٌ لم يُقسَّم — لا لوحَ وسيطاً بلا فائدة */
  if (units.length === 1) {
    return (
      <>
        {header}
        {buyBanner}
        <UnitView course={subject} unit={units[0]} owned={owned} backHref="/student/subjects" backLabel="كل الكورسات" />
      </>
    );
  }

  return (
    <>
      {header}
      {buyBanner}

      {/*
        لوحُ الغلاف — صورتُه وحدَها، وإن لم تكن فلا لوح.
        ------------------------------------------------------------------
        كُتب أوّلاً بـ`CourseArt`، وهي تَرسم لوحاً كاملاً: صورةً إن وُجدت،
        وإلّا **رسماً بديلاً** بزخرفةٍ وشمسةٍ وقلنسوةِ تخرّج. فكورسٌ لم
        يُضبط غلافُه خرج بقلنسوةٍ بنفسجيّةٍ ممدودةٍ إلى سبعِ مئةِ بكسل —
        لأنّ `aspect-ratio` على حاويةٍ عرضُها ألفٌ وستُّ مئةٍ يُخرج ارتفاعاً
        بقدرها، والرسمُ البديلُ يُقصّ ويُكبَّر ليملأه.

        و**اللافتةُ غيرُ غلاف البطاقة**: البطاقةُ مربّعةٌ تقريباً وهذه
        شريطٌ نسبتُه ٢١:٨، فقصُّ المربّع إلى الشريط يفقد أعلاه وأسفلَه.
        فتُرفع اللافتةُ وحدَها من اللوحة، وفراغُها = لا لافتةَ أصلاً —
        والاسمُ والصفُّ في ترويسة الصفحة فوقه، فلا يضيع شيء.

        وارتفاعُه مسقوفٌ بمقدارٍ ثابت مع نسبةٍ عريضة: الغلافُ شريطُ تعريفٍ
        لا شاشةٌ تُملأ.
      */}
      {subject.banner?.trim() && (
        <div className="ch">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={subject.banner}
            alt=""
            className="ch-art"
            style={{ objectPosition: `center ${subject.bannerY ?? 35}%` }}
          />
          <span className="ch-scrim" aria-hidden="true" />
          <span className="ch-body">
            {subject.grade && <span className="ch-g">{subject.grade}</span>}
            <span className="ch-t">{subject.name}</span>
          </span>
        </div>
      )}

      <p className="ch-h">
        <IconListVideo className="size-5 text-primary" /> محتوى الكورس
      </p>

      {/*
        الموادُّ ودروسُها في مكانٍ واحد.
        ------------------------------------------------------------------
        كانت الموادُّ بطاقاتٍ تُضغط فتُفتح صفحةُ المادّة ثمّ تُقرأ دروسُها.
        وذلك يُخفي **المنهجَ** عمّن يريد أن يراه: من يسأل «ماذا في هذا
        الكورس؟» لا يريد أسماءَ عشرِ موادّ، يريد أن يمرّ على ما فيها.

        فصارت كلُّ مادّةٍ لوحاً فيه دروسُها مسرودةً تحتها — يُمسح المنهجُ
        كلُّه بتمريرةٍ واحدة، والضغطُ على درسٍ يفتحه هو لا أوّلَ مادّته.

        **واللوحُ يُطوى.** منهجٌ من اثنتي عشرةَ مادّةً في كلٍّ عشرةُ دروسٍ
        يصير مئةً وعشرين سطراً — والطيُّ يُبقي الاختيارَ للطالب. والمفتوحُ
        أوّلاً ما فيه درسُه الحاليّ، فيجد نفسَه حيث وقف.
      */}
      <div className="cu-list">
        {units.map((u, i) => {
          const inUnit = u.lessons ?? [];
          const doneHere = inUnit.filter((l) => done.has(l.id)).length;
          const pct = inUnit.length ? Math.round((doneHere / inUnit.length) * 100) : 0;
          const freeCount = inUnit.filter((l) => l.isFree).length;
          const mine = unitActive(me, id, u.id, Date.now(), subject.term);
          const priced = (u.prices ?? []).filter((p) => (p.label ?? "").trim());
          const cheapest = priced.length
            ? priced.reduce((a, b) => (planPrice({ price: a.price, discount: a.discount }).price
                <= planPrice({ price: b.price, discount: b.discount }).price ? a : b))
            : null;
          const unitHref = `/student/course/${id}/${encodeURIComponent(u.id)}`;

          return (
            <motion.details
              key={u.id}
              open={seeded ? openUnits.has(u.id) : i === 0}
              onToggle={(ev) => {
                const on = (ev.currentTarget as HTMLDetailsElement).open;
                setSeeded(true);
                setOpenUnits((prev) => {
                  const next = new Set(seeded ? prev : units.filter((_, k) => k === 0).map((x) => x.id));
                  if (on) next.add(u.id); else next.delete(u.id);
                  return next;
                });
              }}
              className="cu"
              data-locked={!mine ? "1" : "0"}
              initial={{ opacity: 0, y: 18 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: false, margin: "0px 0px -40px 0px" }}
              transition={{ delay: (i % 8) * 0.05, duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
            >
              <summary className="cu-head">
                <span className="cu-n">{(i + 1).toLocaleString("ar-EG")}</span>
                <span className="cu-hb">
                  <span className="cu-t">{u.title}</span>
                  <span className="cu-s">
                    {inUnit.length.toLocaleString("ar-EG")} درساً
                    {doneHere > 0 && <> · {doneHere.toLocaleString("ar-EG")} تمّت</>}
                    {!mine && freeCount > 0 && <> · {freeCount.toLocaleString("ar-EG")} مجّاناً</>}
                  </span>
                </span>

                {mine ? (
                  pct > 0 && <span className="cu-pct">{pct.toLocaleString("ar-EG")}٪</span>
                ) : (
                  <span className="cu-lock"><IconLock className="size-3" /> مقفلة</span>
                )}
                <IconArrowLeft className="cu-chev size-4" />
              </summary>

              <ul className="cu-ls">
                {inUnit.map((l) => {
                  const open = mine || l.isFree;
                  const isDone = done.has(l.id);
                  return (
                    <li key={l.id}>
                      {/*
                        الرابطُ يحمل الدرسَ لا المادّةَ وحدَها — فيُفتح ما
                        ضُغط عليه، لا أوّلُ دروسها.
                      */}
                      <Link
                        href={open ? `${unitHref}?lesson=${encodeURIComponent(l.id)}` : `/student/pay?subject=${id}&unit=${encodeURIComponent(u.id)}`}
                        className="cu-l"
                        data-state={isDone ? "done" : open ? "open" : "locked"}
                      >
                        <span className="cu-l-i">
                          {isDone ? <IconCheckCircle className="size-4" />
                            : open ? <IconPlay className="size-4" />
                              : <IconLock className="size-3.5" />}
                        </span>
                        <span className="cu-l-t">{l.title}</span>
                        {l.isFree && <span className="cu-l-free">مجّاني</span>}
                        {l.duration && <span className="cu-l-d">{l.duration}</span>}
                      </Link>
                    </li>
                  );
                })}

                {/* المقفلةُ تُختم بسبيل فتحها — لا يُترك الطالبُ أمام أقفال */}
                {!mine && (
                  <li className="cu-buy">
                    {cheapest ? (
                      <Link href={`/student/pay?subject=${id}&unit=${encodeURIComponent(u.id)}`} className="cu-buy-b">
                        <IconCart className="size-3.5" />
                        افتح «{u.title}» — {planPrice({ price: cheapest.price, discount: cheapest.discount }).price.toLocaleString("ar-EG")} ج.م
                      </Link>
                    ) : (
                      <span className="cu-buy-n">تُفتح باشتراك الكورس</span>
                    )}
                  </li>
                )}
              </ul>
            </motion.details>
          );
        })}
      </div>
    </>
  );
}

function NotFound({ msg }: { msg: string }) {
  return (
    <Card className="mx-auto max-w-md text-center">
      <p className="py-6 text-sm text-muted-foreground">{msg}</p>
      <Link href="/student/subjects" className="inline-flex rounded-full border border-border px-5 py-2 text-sm font-bold transition hover:border-primary hover:text-primary">كل الكورسات</Link>
    </Card>
  );
}
