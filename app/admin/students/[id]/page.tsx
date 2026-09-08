"use client";

/**
 * تقرير طالب.
 * ------------------------------------------------------------------
 * كل ما تعرفه المنصّة عن طالبٍ واحد في صفحة: من أين جاء، ومتى يدخل،
 * وأيّ الدروس يفتح، وكم مكث، وماذا اشترى، وأين توقّف.
 *
 * البياناتُ كلُّها موجودةٌ أصلاً لكنّها مبعثرة: التقدّم في حسابه،
 * والتحويلات في بوّابة الدفع، والرسائل في الدعم، والنشاط في حلقته.
 * جمعُها في مكان واحد هو التقرير — لا جمعُ أرقامٍ جديدة.
 */

import { use, useEffect, useState } from "react";
import Link from "next/link";
import { PageHeader, Card, Progress, StatusBadge } from "@/components/dashboard/ui";
import { useContent } from "@/components/content/content-provider";
import type { QuizQuestion, Subject } from "@/lib/utils/types";
import {
  reportFor, homeworkFor, homeworkTally, levelOf,
  LEVEL_LABEL, STATE_LABEL, AWAY_DAYS,
} from "@/lib/business/student-report";
import {
  KIND_LABEL, KIND_ICON, isOnline, sinceText, kindCounts, byWeekday, WEEKDAYS,
} from "@/lib/business/activity";
import { activeSubs, daysLeft, subjectActive } from "@/lib/auth/access";
import { STATUS_LABEL } from "@/lib/business/payments";
import { IconArrowLeft } from "@/components/brand/icons";
import type { Activity } from "@/lib/utils/types";

const ar = (n: number) => n.toLocaleString("ar-EG");

export default function StudentReport({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const { db } = useContent();

  /*
    السجلُّ يُجلب وحدَه.
    ------------------------------------------------------------------
    لا يسكن في قاعدة المنصّة — تلك تُقرأ كاملةً في كل طلب، فستّةُ
    كيلوبايت لكل طالب ثمنٌ لا يُدفع في المسار الساخن. يُقرأ هنا وحده،
    وعند فتح هذا التقرير فقط.
  */
  const [acts, setActs] = useState<Activity[]>([]);
  useEffect(() => {
    let alive = true;
    void fetch(`/api/activity?user=${encodeURIComponent(id)}`, { cache: "no-store" })
      .then((r) => (r.ok ? r.json() : { activity: [] }))
      .then((d) => { if (alive) setActs(d.activity ?? []); })
      .catch(() => { /* السجلّ ليس شرطاً للتقرير */ });
    return () => { alive = false; };
  }, [id]);

  const u = db?.users?.find((x) => x.id === id);
  const subjects = db?.subjects ?? [];
  const pays = (db?.payments ?? []).filter((p) => p.userId === id);
  const ticket = (db?.tickets ?? []).find((t) => t.userId === id);

  /*
    المؤشّراتُ من `lib/student-report` نفسِها التي تُبنى منها صفحةُ
    التقارير — فلا يفترق رقمٌ بين الصفحتين. ورقمان مختلفان لطالبٍ واحدٍ
    في شاشتين يُفقدان الثقةَ في الاثنتين.
  */
  const rep = u ? reportFor(u, subjects, db?.payments ?? []) : null;
  const hw = u ? homeworkFor(u, subjects) : [];
  const hwT = homeworkTally(hw);
  const level = levelOf(hwT.avg);

  if (!db) return <Card className="py-16 text-center text-sm text-muted-foreground">جارٍ التحميل…</Card>;
  if (!u) {
    return (
      <Card className="flex flex-col items-center gap-3 py-16 text-center">
        <p className="font-display text-lg font-extrabold">الطالب غير موجود</p>
        <Link href="/admin/students" className="btn-glow rounded-2xl px-5 py-2.5 text-sm font-bold text-white">
          قائمة الطلاب
        </Link>
      </Card>
    );
  }

  const subs = activeSubs(u);
  const owned = subjects.filter((s) => subjectActive(u, s));
  const online = isOnline(u);
  const week = byWeekday(acts);
  const peak = Math.max(1, ...week);
  const counts = kindCounts(acts);

  /* اسمٌ مقروء لمرجع الحدث — المرجعُ معرّفٌ مضغوط، والاسمُ يُقرأ هنا. */
  const refName = (kind: string, ref?: string) => {
    if (!ref) return "";
    if (kind === "lesson") return subjects.find((s) => s.id === ref)?.name ?? ref;
    if (kind === "exam") return db.exams?.find((e) => e.id === ref)?.title ?? ref;
    return ref;
  };

  return (
    <>
      <PageHeader title={`تقرير: ${u.name}`} subtitle={`${u.username}${u.phone ? ` · ${u.phone}` : ""}`} />

      <Link
        href="/admin/students"
        className="mb-5 inline-flex items-center gap-1.5 rounded-full border border-border px-3.5 py-1.5 text-xs font-bold text-muted-foreground transition hover:text-foreground"
      >
        <IconArrowLeft className="size-3.5 rotate-180" /> رجوع للطلاب
      </Link>

      {/* ---------------- بطاقة الهوية ---------------- */}
      <Card className="mb-5">
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <Fact label="الحالة" value={
            <span className="inline-flex items-center gap-2">
              <span className={`size-2 rounded-full ${online ? "bg-emerald-500" : "bg-muted-foreground/40"}`} />
              {online ? "متّصل الآن" : sinceText(u.lastSeen)}
            </span>
          } />
          <Fact label="من أين جاء" value={u.source || "غير معروف"} />
          <Fact label="مرّات الدخول" value={ar(u.visits ?? 0)} />
          <Fact label="زمن المشاهدة" value={`${ar(u.minutes ?? 0)} دقيقة`} />

          <Fact label="المرحلة والصف" value={[u.stage, u.grade].filter(Boolean).join(" · ") || "—"} />
          <Fact label="النظام والشعبة" value={[u.eduSystem, u.track, u.branch].filter(Boolean).join(" · ") || "—"} />
          <Fact label="المحافظة والمدرسة" value={[u.governorate, u.school].filter(Boolean).join(" · ") || "—"} />
          <Fact label="الجهاز" value={u.deviceLabel || "لم يُربط"} />

          <Fact label="أنشئ الحساب" value={new Date(u.createdAt).toLocaleDateString("ar-EG", { timeZone: "Africa/Cairo" })} />
          <Fact label="أوّل صفحة دخل منها" value={u.landing || "—"} />
          <Fact label="الحساب" value={u.active ? "مفعّل" : "موقوف"} />
          <Fact label="إشعارات الجهاز" value={(u.pushDevices ?? 0) > 0 ? `${ar(u.pushDevices ?? 0)} جهاز` : "غير مفعّلة"} />
        </div>
      </Card>

      {/* ---------------- المستوى ومتابعةُ المذاكرة ---------------- */}
      {/*
        أربعةُ أرقامٍ تُقرأ قبل الجداول.
        والمستوى **من الدرجات وحدَها** لا من التقدّم: من شاهد الكورسَ
        كلَّه ولم يحلّ واجباً واحداً ليس «ممتازاً». ومن لم يحلّ لا يُقيَّم
        أصلاً — «لم يُقيَّم» لا «متعثّر»، فوسمُ من لم يُسأل بالتعثّر حكمٌ
        بلا بيّنة.
      */}
      <Card className="mt-5">
        <p className="font-display mb-3 font-bold">المستوى والمتابعة</p>
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
          <div className="rp-stat" data-k={level}>
            <span className="rp-stat-n">{LEVEL_LABEL[level]}</span>
            <span className="rp-stat-l">المستوى</span>
          </div>
          <div className="rp-stat">
            <span className="rp-stat-n">{hwT.avg === null ? "—" : `${ar(hwT.avg)}٪`}</span>
            <span className="rp-stat-l">متوسّط الواجبات</span>
          </div>
          <div className="rp-stat" data-k={hwT.pending > 0 ? "weak" : undefined}>
            <span className="rp-stat-n">{ar(hwT.pending)}</span>
            <span className="rp-stat-l">واجبٌ لم يُحلّ</span>
          </div>
          <div className="rp-stat" data-k={rep && rep.daysSinceSeen !== null && rep.daysSinceSeen >= AWAY_DAYS ? "weak" : undefined}>
            <span className="rp-stat-n">
              {!rep || rep.daysSinceSeen === null ? "—"
                : rep.daysSinceSeen === 0 ? "اليوم" : ar(rep.daysSinceSeen)}
            </span>
            <span className="rp-stat-l">
              {!rep || rep.daysSinceSeen === null ? "آخر ظهور" : rep.daysSinceSeen === 0 ? "آخر ظهور" : "يوماً منذ ظهوره"}
            </span>
          </div>
        </div>
        {rep && (
          <p className="mt-3 text-[11px] leading-relaxed text-muted-foreground">
            حالتُه الآن: <b>{STATE_LABEL[rep.state]}</b> — {ar(rep.activeCourses)} كورساً مفتوحاً،
            وتقدّمُه فيها {ar(rep.progress)}٪. والمستوى محسوبٌ من درجات الواجبات لا من نسبة المشاهدة.
          </p>
        )}
      </Card>

      {/* ---------------- الواجبات ---------------- */}
      {/*
        تُبنى من **دروس الكورسات** لا من نتائج الطالب: عرضُ المحلول وحدَه
        يُخفي ما يُبحث عنه — والمشرفُ يفتح التقريرَ ليعرف ما **لم** يُحلّ.
        فيظهر الفارغُ فارغاً، وغيرُ المحلول أوّلاً ثمّ الأضعفُ درجة.
      */}
      <Card className="mt-5">
        <p className="font-display mb-1 font-bold">واجباتُ الدروس ({ar(hwT.total)})</p>
        <p className="mb-3 text-[11px] text-muted-foreground">
          {hwT.total === 0
            ? "لا واجباتٍ على دروس كورساته."
            : <>حلّ {ar(hwT.solved)} — نجح في {ar(hwT.passed)} ورسب في {ar(hwT.failed)}، وبقي {ar(hwT.pending)} لم يُحلّ.</>}
        </p>

        {hwT.total === 0 ? null : (
          <div className="grid gap-2">
            {hw.slice(0, 30).map((h) => (
              <Answers
                key={`${h.subjectId}-${h.lessonId}`}
                title={h.lessonTitle}
                note={`${h.subjectName} · ${h.unitTitle} · ${ar(h.questions)} ${h.questions === 1 ? "سؤال" : "أسئلة"}`}
                state={h.percent === null ? "none" : h.passed ? "pass" : "fail"}
                score={h.score}
                total={h.total}
                percent={h.percent}
                tag={h.percent === null ? "لم يُحلّ" : h.passed ? "نجح" : "لم ينجح"}
                questions={findLessonQuestions(subjects, h.subjectId, h.lessonId)}
                answers={
                  (u.quizResults ?? []).find((r) => r.lessonId === h.lessonId)?.answers
                }
              />
            ))}
            {hw.length > 30 && (
              <p className="pt-1 text-center text-[11px] text-muted-foreground">
                وعُرض ثلاثون من {ar(hw.length)} — والباقي مثلُها.
              </p>
            )}
          </div>
        )}
      </Card>

      {/* ---------------- الكورسات والتقدّم ---------------- */}
      <Card className="mt-5">
        <p className="font-display mb-3 font-bold">كورساته وتقدّمه ({ar(owned.length)})</p>
        {owned.length === 0 ? (
          <p className="text-xs text-muted-foreground">لا يملك كورسات مفعّلة.</p>
        ) : (
          <div className="grid gap-2">
            {owned.map((s) => {
              const pct = u.progress?.[s.id] ?? 0;
              const sub = subs.find((x) => x.subjectId === s.id || x.subjectId === "*" || x.subjectId === `T${s.term ?? 1}`);
              const left = sub ? daysLeft(sub.expiresAt) : null;
              return (
                <div key={s.id} className="grid gap-1.5 rounded-2xl border border-border p-3">
                  <div className="flex flex-wrap items-center gap-2 text-xs">
                    <b className="font-bold">{s.name}</b>
                    <span className="text-muted-foreground">{sub?.planName ?? ""}</span>
                    <span className="mr-auto text-[10px] text-muted-foreground">
                      {left === null ? "دائم" : `${ar(left)} يوماً متبقّياً`}
                    </span>
                  </div>
                  <Progress value={pct} />
                </div>
              );
            })}
          </div>
        )}
      </Card>

      {/* ---------------- المدفوعات ---------------- */}
      <Card className="mt-5">
        <p className="font-display mb-3 font-bold">تحويلاته ({ar(pays.length)})</p>
        {pays.length === 0 ? (
          <p className="text-xs text-muted-foreground">لا تحويلات.</p>
        ) : (
          <div className="grid gap-2">
            {pays.map((p) => (
              <div key={p.id} className="flex flex-wrap items-center gap-2 rounded-xl border border-border px-3 py-2 text-xs">
                <StatusBadge status={STATUS_LABEL[p.status]} />
                <b>{p.planName}</b>
                <span className="text-muted-foreground">{ar(p.amount)} ج.م · {p.methodName}</span>
                {p.code && <span className="font-mono text-[10px]">{p.code}</span>}
                <span className="mr-auto text-[10px] text-muted-foreground">
                  {new Date(p.at).toLocaleDateString("ar-EG", { timeZone: "Africa/Cairo" })}
                </span>
              </div>
            ))}
          </div>
        )}
      </Card>

      {/* ---------------- الاختبارات والدعم ---------------- */}
      <div className="mt-5 grid gap-5 lg:grid-cols-2">
        <Card>
          <p className="font-display mb-3 font-bold">الاختبارات ({ar((u.examAttempts ?? []).length)})</p>
          {(u.examAttempts ?? []).length === 0 ? (
            <p className="text-xs text-muted-foreground">لم يدخل اختباراً بعد.</p>
          ) : (
            /*
              الدرجةُ وحدَها لا تُقرأ: «١٢» أهي من عشرين أم من خمسة عشر؟
              فتُعرض النسبةُ معها، وتُؤخذ العلامةُ الكاملةُ من الاختبار
              نفسِه — وإن لم تُعرف عُرضت الدرجةُ مجرّدةً ولم تُخترع نسبة.
            */
            <div className="grid gap-2">
              {(u.examAttempts ?? []).slice(-8).reverse().map((a, i) => {
                const ex = db.exams?.find((e) => e.id === a.examId);
                const outOf = (ex?.questions ?? []).length || null;
                const pct = outOf ? Math.round((a.score / outOf) * 100) : null;
                return (
                  <Answers
                    key={i}
                    title={ex?.title ?? a.examId}
                    note={a.at ? new Date(a.at).toLocaleDateString("ar-EG", { timeZone: "Africa/Cairo" }) : ""}
                    state={pct === null ? "none" : pct >= 50 ? "pass" : "fail"}
                    score={a.score}
                    total={outOf}
                    percent={pct}
                    questions={ex?.questions ?? []}
                    answers={a.answers}
                  />
                );
              })}
            </div>
          )}
        </Card>

        <Card>
          <p className="font-display mb-3 font-bold">الدعم</p>
          {!ticket || (ticket.messages ?? []).length === 0 ? (
            <p className="text-xs text-muted-foreground">لم يراسل الدعم.</p>
          ) : (
            <>
              <p className="mb-2 text-xs text-muted-foreground">
                {ar((ticket.messages ?? []).length)} رسالة · آخرها {sinceText(ticket.lastAt)}
              </p>
              <Link href="/admin/support/chat" className="text-xs font-bold text-primary">
                افتح المحادثة ←
              </Link>
            </>
          )}
        </Card>
      </div>
      {/*
        وسجلُّ التصفّح آخرَ الصفحة.
        ------------------------------------------------------------------
        كان في صدرها — وهو **أقلُّ ما يُفتح التقريرُ لأجله**. من يسأل عن
        طالبٍ يسأل عن مستواه أوّلاً: أحلَّ واجباتِه؟ وكم درجتُه؟ وأين
        أخطأ؟ ثمّ يُسأل عن تصفّحه إن بقي سؤال.

        وصدرُ الصفحة موضعُ ما يُقرَّر عليه، وذيلُها موضعُ ما يُرجَع إليه.
      */}
      <div className="grid gap-5 lg:grid-cols-[1.3fr,1fr] lg:items-start">
        {/* ---------------- سجلّ النشاط ---------------- */}
        <Card>
          <p className="font-display mb-1 font-bold">آخر ما فعله</p>
          <p className="mb-4 text-[11px] text-muted-foreground">
            آخر {ar(acts.length)} حدثاً — السجلّ حلقةٌ مقفلة فلا ينمو بلا حدّ.
          </p>

          {acts.length === 0 ? (
            <p className="rounded-2xl border border-dashed border-border p-5 text-center text-xs text-muted-foreground">
              لا نشاط مسجَّل بعد.
            </p>
          ) : (
            <ol className="grid gap-1.5">
              {acts.map((a) => (
                <li key={a.id} className="flex flex-wrap items-center gap-2 rounded-xl border border-border px-3 py-2 text-xs">
                  <span aria-hidden>{KIND_ICON[a.kind]}</span>
                  <b className="font-bold">{KIND_LABEL[a.kind]}</b>
                  {a.ref && <span className="min-w-0 truncate text-muted-foreground">{refName(a.kind, a.ref)}</span>}
                  {a.meta && <span className="truncate text-[10px] text-muted-foreground">· {a.meta}</span>}
                  <span className="mr-auto shrink-0 text-[10px] text-muted-foreground">
                    {new Date(a.at).toLocaleString("ar-EG", { timeZone: "Africa/Cairo" })}
                  </span>
                </li>
              ))}
            </ol>
          )}
        </Card>

        <div className="grid gap-5">
          {/* ---------------- متى يذاكر ---------------- */}
          <Card>
            <p className="font-display mb-1 font-bold">متى يذاكر</p>
            <p className="mb-4 text-[11px] text-muted-foreground">توزيع نشاطه على أيام الأسبوع.</p>
            <div className="grid gap-1.5">
              {week.map((n, i) => (
                <div key={i} className="flex items-center gap-2">
                  <span className="w-14 shrink-0 text-[11px] text-muted-foreground">{WEEKDAYS[i]}</span>
                  <span className="h-2 flex-1 overflow-hidden rounded-full bg-muted">
                    <span
                      className="block h-full rounded-full bg-primary"
                      style={{ width: `${(n / peak) * 100}%` }}
                    />
                  </span>
                  <span className="w-6 shrink-0 text-left text-[10px] font-bold">{ar(n)}</span>
                </div>
              ))}
            </div>
          </Card>

          {/* ---------------- ماذا يستخدم ---------------- */}
          <Card>
            <p className="font-display mb-3 font-bold">ماذا يستخدم</p>
            {counts.length === 0 ? (
              <p className="text-xs text-muted-foreground">لا بيانات بعد.</p>
            ) : (
              <div className="flex flex-wrap gap-2">
                {counts.map((c) => (
                  <span key={c.kind} className="inline-flex items-center gap-1.5 rounded-full border border-border px-3 py-1.5 text-[11px] font-bold">
                    <span aria-hidden>{KIND_ICON[c.kind]}</span>
                    {KIND_LABEL[c.kind]}
                    <span className="rounded-full bg-primary/10 px-1.5 text-[10px] text-primary">{ar(c.n)}</span>
                  </span>
                ))}
              </div>
            )}
          </Card>
        </div>
      </div>

    </>
  );
}

/** أسئلةُ واجبِ درسٍ بعينه — من المنهج لا من نتيجة الطالب. */
function findLessonQuestions(subjects: Subject[], subjectId: string, lessonId: string): QuizQuestion[] {
  const s = subjects.find((x) => x.id === subjectId);
  if (!s) return [];
  const units = (s.units ?? []).length ? s.units ?? [] : [{ id: s.id, title: "", lessons: s.videos ?? [] }];
  for (const u of units) {
    const l = (u.lessons ?? []).find((x) => x.id === lessonId);
    if (l) return l.quiz?.questions ?? [];
  }
  return [];
}

/**
 * صفٌّ يُفتح على إجابات الطالب سؤالاً سؤالاً.
 * ------------------------------------------------------------------
 * «٥٠٪» تقول إنّه أخطأ ولا تقول **أين**. والمعلّمُ يفتح التقريرَ ليعرف
 * أيَّ بابٍ لم يفهمه — لا ليعرف أنّه لم يفهم. فالصفُّ مطويٌّ يُظهر الدرجة،
 * ويُفتح فيُظهر كلَّ سؤالٍ وما اختاره الطالبُ والصوابَ إن أخطأ.
 *
 * **ويُطوى بـ`<details>`**: عشرون سؤالاً مبسوطةً لكلّ واجبٍ تُغرق الصفحة،
 * والمطلوبُ منها واحدٌ يُفتح عند الحاجة.
 *
 * **وما لا يُعرف يُقال إنّه لا يُعرف**: النتائجُ المحفوظةُ قبل أن تُسجَّل
 * الإجاباتُ لا تحملها — فيُكتب ذلك صراحةً ولا تُخترع لها إجاباتٌ بالحدس.
 */
function Answers({
  title, note, state, score, total, percent, tag, questions, answers,
}: {
  title: string;
  note?: string;
  state: "none" | "pass" | "fail";
  score: number | null;
  total: number | null;
  percent: number | null;
  tag?: string;
  questions: QuizQuestion[];
  answers?: number[];
}) {
  const solved = percent !== null;
  const canDetail = solved && questions.length > 0 && Array.isArray(answers) && answers.length > 0;

  const head = (
    <>
      <span className="min-w-0 flex-1">
        <span className="block truncate text-xs font-bold">{title}</span>
        {note && <span className="block truncate text-[10px] text-muted-foreground">{note}</span>}
      </span>
      {solved ? (
        <>
          <span className="hw-n">{ar(score ?? 0)}{total ? `/${ar(total)}` : ""}</span>
          <span className="hw-p">{ar(percent ?? 0)}٪</span>
        </>
      ) : null}
      {tag && <span className="hw-tag" data-k={state === "pass" ? "pass" : undefined}>{tag}</span>}
    </>
  );

  /* ما لا تفصيلَ له لا يُعطى سهمَ فتحٍ يُضغط فلا يفتح شيئاً */
  if (!canDetail) {
    return (
      <div className="hw-row" data-k={state}>
        {head}
        {solved && questions.length > 0 && (
          <span className="hw-none" title="حُفظت هذه النتيجةُ قبل تسجيل الإجابات">بلا تفصيل</span>
        )}
      </div>
    );
  }

  return (
    <details className="hw-d" data-k={state}>
      <summary className="hw-row">
        {head}
        <IconArrowLeft className="hw-chev size-3.5" />
      </summary>
      <ol className="hw-qs">
        {questions.map((q, i) => {
          const picked = answers?.[i] ?? -1;
          const right = picked === q.correct;
          return (
            <li key={q.id ?? i} className="hw-q" data-k={picked < 0 ? "skip" : right ? "right" : "wrong"}>
              <span className="hw-q-n">{ar(i + 1)}</span>
              <span className="min-w-0">
                <span className="hw-q-t">{q.text}</span>
                <span className="hw-q-a">
                  {picked < 0
                    ? <b>تركه بلا إجابة</b>
                    : <>اختار: <b>{q.options?.[picked] ?? "—"}</b></>}
                  {!right && q.correct >= 0 && (
                    <> · الصواب: <b className="hw-q-c">{q.options?.[q.correct] ?? "—"}</b></>
                  )}
                </span>
              </span>
            </li>
          );
        })}
      </ol>
    </details>
  );
}

function Fact({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div className="min-w-0">
      <p className="text-[11px] text-muted-foreground">{label}</p>
      <p className="mt-0.5 truncate text-sm font-bold">{value}</p>
    </div>
  );
}
