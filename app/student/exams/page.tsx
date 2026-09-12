"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import {
  IconClipboardCheck, IconClock, IconCheckCircle, IconCalendar, IconLock, IconArrowLeft,
} from "@/components/brand/icons";
import { ShariAnim } from "@/components/brand/shari-art";
import { PageHeader, Card, StatusBadge } from "@/components/dashboard/ui";
import { useContent } from "@/components/content/content-provider";
import { useMaintGate } from "@/components/brand/maint-gate";

/* الأرقامُ بالهنديّة كبقيّة المنصّة — لا بالّاتينيّة */
const ar = (n: number) => n.toLocaleString("ar-EG");

export default function StudentExamsPage() {
  /* بوّابةُ الصيانة — المشرفون يمرّون والطلاب يرون اللوح. */
  const maintGate = useMaintGate("exams");

  const { db, session } = useContent();
  const me = db?.users.find((u) => u.id === session?.uid);
  const fem = me?.gender === "female";
  const y = (v: string) => `${v}${fem ? "ي" : ""}`;
  const exams = (db?.exams ?? []).filter((e) => e.status === "منشور");

  /** أفضل محاولة للطالب في اختبار. */
  const best = (examId: string) => {
    const tries = (me?.examAttempts ?? []).filter((a) => a.examId === examId);
    if (!tries.length) return null;
    return tries.reduce((a, b) => (b.percent > a.percent ? b : a));
  };
  // الأسئلة تصل فارغة إذا لم يكن الطالب مخوّلاً (يُفرض على الخادم)
  const locked = (examId: string) => {
    const e = exams.find((x) => x.id === examId);
    return !e || e.questions.length === 0;
  };

  const solved = exams.filter((e) => best(e.id)).length;
  const passed = exams.filter((e) => best(e.id)?.passed).length;

  if (maintGate) return maintGate;

  return (
    <>
      <PageHeader title="الاختبارات" subtitle={`${y("حلّ")} اختباراتك داخل المنصّة — النتيجة تظهر فوراً`} />

      {/*
        الأرقامُ الثلاثةُ متداخلةٌ لا متجاورة.
        ------------------------------------------------------------------
        «متاحة» و«حُلّت» و«نجحت» ليست ثلاثةَ مقادير مستقلّة — بل مجموعةٌ
        وجزؤها وجزءُ جزئها: من نجح فقد حلّ، ومن حلّ فقد كان متاحاً له.

        وعرضُها ثلاثَ بطاقاتٍ منفصلةٍ لكلٍّ لونُها يُخفي هذا: يُقرأ ثلاثةَ
        أخبارٍ لا خبراً واحداً، ولا يُعرف من «٧» أهي أكثرُ المتاح أم أقلُّه.
        **والألوانُ الثلاثةُ لا تعني شيئاً**: أزرقُ الحلِّ وأخضرُ النجاح
        اختياران بلا سند، وليسا من ألوان هذه الهوية أصلاً.

        فصارت لوحاً واحداً: الأرقامُ في صفٍّ يفصله شعرة، وتحتها شريطٌ
        **مركَّبٌ** يُري النسبةَ التي بينها — فيُقرأ «كم بقي» من الشكل قبل
        أن يُحسب من الأرقام.
      */}
      <div className="xs-panel mb-6">
        <div className="xs-row">
          <span className="xs-c">
            <span className="xs-n">{ar(exams.length)}</span>
            <span className="xs-l">اختباراً متاحاً</span>
          </span>
          <span className="xs-c">
            <span className="xs-n">{ar(solved)}</span>
            <span className="xs-l">{y("حلَلْت")}</span>
          </span>
          <span className="xs-c">
            <span className="xs-n" data-k="pass">{ar(passed)}</span>
            <span className="xs-l">نجحت فيها</span>
          </span>
        </div>

        {exams.length > 0 && (
          <>
            <span className="xs-bar" aria-hidden="true">
              <span className="xs-bar-p" style={{ inlineSize: `${(passed / exams.length) * 100}%` }} />
              <span className="xs-bar-s" style={{ inlineSize: `${((solved - passed) / exams.length) * 100}%` }} />
            </span>
            <p className="xs-note">
              {solved === 0
                ? <>لم {y("تبدأ")} بعد — {ar(exams.length)} في انتظارك.</>
                : passed === solved
                  ? <>نجحت في كلّ ما حلَلْت. وبقي {ar(exams.length - solved)} لم {y("تفتح")}ه.</>
                  : <>نجحت في {ar(passed)} من {ar(solved)} حلَلْتها، وبقي {ar(exams.length - solved)} لم {y("تفتح")}ه.</>}
            </p>
          </>
        )}
      </div>

      {exams.length === 0 && (
        <Card className="flex flex-col items-center gap-3 py-14 text-center">
          {/*
            رسمٌ لا رمزٌ في صندوق.
            الحالةُ الفارغة تشغل عرضَ الشاشة، ورمزٌ خطّيٌّ بحجم ٢٨ بكسل
            فيها يبدو كأنّ الصفحةَ لم تُحمَّل. والمتّجهُ يملأ موضعَه ويقول
            ما القسمُ الذي فرغ.
          */}
          <ShariAnim id="checklistAnim" size={132} framed={false} />
          <p className="font-display text-lg font-extrabold">لا توجد اختبارات بعد</p>
          <p className="max-w-sm text-sm text-muted-foreground">ستظهر اختباراتك هنا فور نشرها.</p>
        </Card>
      )}

      <div className="space-y-3">
        {exams.map((e, i) => {
          const b = best(e.id);
          const isLocked = locked(e.id);
          const tries = (me?.examAttempts ?? []).filter((a) => a.examId === e.id).length;
          const exhausted = (e.attempts ?? 0) > 0 && tries >= (e.attempts ?? 0);
          return (
            <motion.div key={e.id} initial={{ opacity: 0, y: 12 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true, margin: "0px 0px -40px 0px" }} transition={{ delay: (i % 8) * 0.05 }}>
              <Card className="!p-4">
                <div className="flex flex-wrap items-center gap-3">
                  <span className="grid size-11 shrink-0 place-items-center rounded-2xl bg-primary/12 text-primary">
                    <IconClipboardCheck className="size-5" />
                  </span>
                  <div className="min-w-0 flex-1">
                    <p className="font-bold">{e.title}</p>
                    <p className="flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-muted-foreground">
                      <span>{e.subject}</span>
                      <span className="inline-flex items-center gap-1"><IconClipboardCheck className="size-3.5" /> {e.questions.length || "—"} سؤال</span>
                      {e.duration > 0 && <span className="inline-flex items-center gap-1"><IconClock className="size-3.5" /> {e.duration} دقيقة</span>}
                      <span className="inline-flex items-center gap-1"><IconCalendar className="size-3.5" /> {e.grade}</span>
                    </p>
                  </div>

                  {b && (
                    <span className={`inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-xs font-bold ${b.passed ? "bg-emerald-500/15 text-emerald-500" : "bg-rose-500/15 text-rose-500"}`}>
                      {b.score}/{b.total} · {b.percent}٪
                    </span>
                  )}

                  {isLocked ? (
                    <Link href="/student/subjects" className="inline-flex items-center gap-1 rounded-full border border-amber-500/40 px-4 py-2 text-xs font-bold text-amber-500 transition hover:bg-amber-500/10">
                      <IconLock className="size-3.5" /> للمشتركين فقط
                    </Link>
                  ) : exhausted ? (
                    <span className="rounded-full border border-border px-4 py-2 text-xs font-bold text-muted-foreground">انتهت محاولاتك</span>
                  ) : (
                    <Link href={`/student/exams/${e.id}`} className="inline-flex items-center gap-1 rounded-full btn-glow px-5 py-2.5 text-xs font-bold text-white">
                      {b ? y("أعد") + " المحاولة" : y("ابدأ") + " الاختبار"} <IconArrowLeft className="size-3.5" />
                    </Link>
                  )}
                </div>
              </Card>
            </motion.div>
          );
        })}
      </div>
    </>
  );
}

/**
 * بطاقةُ رقمٍ في لوح الاختبارات.
 * ------------------------------------------------------------------
 * كانت أيقونةً وبجانبها رقمٌ `text-xl` وسطرٌ صغير، في بطاقةٍ عريضةٍ
 * يبقى ثلثاها فارغاً — فتبدو حاشيةً لا مؤشّراً.
 *
 * **والرقمُ كان يُكتب بالخانات العربيّة**، وصفرُها `٠` نقطةٌ في أصل
 * رسمه: بطاقةٌ قيمتُها صفرٌ تبدو بلا رقمٍ أصلاً، فيراها الطالبُ نقطةً
 * ويظنّ الشاشةَ عطبت. فالعددُ الكبيرُ بالخانات الغربيّة — حلقتُه
 * مفرَّغةٌ لا تُشبه غيرَ الصفر — والنصُّ عربيٌّ كما كان.
 *
 * والترتيبُ يبدأ من اليمين: أيقونةٌ فعنوانٌ فرقم، عمودٌ واحدٌ تنزل فيه
 * العينُ بلا ارتداد. وشريطُ النبرة أسفلَها يفرّق الثلاثَ بلمحة.
 */
