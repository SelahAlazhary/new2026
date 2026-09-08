"use client";

/**
 * بطاقةُ الكورس في اللوحة.
 * ------------------------------------------------------------------
 * كان الجدولُ يعرض الكورساتِ صفوفاً: اسمٌ ورقمٌ وحالة. وهذا يصلح لبياناتٍ
 * متجانسةٍ تُقارَن عموداً بعمود — ولا يصلح لكورس: الكورسُ **غلافٌ
 * ودروس**، وكلاهما لا يدخل خانةً في جدول. فصار بطاقةً: الغلافُ كما يراه
 * الطالبُ فعلاً، وتحته ما يُقرأ بلمحة.
 *
 * **والغلافُ يُرسم بـ`CourseArt` نفسِه** الذي يرسمه في بوابة الطالب — لا
 * بصورةٍ مصغّرةٍ تُحاكيه. فما يراه الأستاذُ هنا هو ما يراه الطالبُ هناك،
 * ولا يفاجئه فرقٌ بعد النشر.
 *
 * **والدروسُ ليست هنا.** موضعُها صفحتُها — فيها تُدار وتُرتَّب وتُختبر،
 * وهنا يكفي عددُها وبابُ الدخول إليها.
 */

import Link from "next/link";
import { ListVideo, Trash2, ToggleLeft, ToggleRight, Users, Wallet } from "lucide-react";
import { CourseArt } from "@/components/brand/course-art";
import { StatusBadge } from "@/components/dashboard/ui";
import type { Subject, SitePlan } from "@/lib/utils/types";

export function AdminCourseCard({
  s,
  cheapest,
  hasTrack,
  onToggle,
  onRemove,
  onTerm,
  onTrack,
}: {
  s: Subject;
  cheapest: { plan: SitePlan; price: number } | null;
  hasTrack: boolean;
  onToggle: () => void;
  onRemove: () => void;
  onTerm: (t: 1 | 2) => void;
  onTrack: (t: string) => void;
}) {
  const lessons = s.videos ?? [];

  return (
    <div className="group flex flex-col overflow-hidden rounded-3xl border border-border bg-card shadow-bento transition hover:border-primary/40">
      {/* ---------- الغلاف ---------- */}
      <Link href={`/admin/courses/${s.id}`} className="relative block" title="إدارة الدروس">
        <CourseArt
          seed={s.id}
          title={s.name}
          cover={s.cover}
          coverFit={s.coverFit}
          coverRatio={s.coverRatio}
          coverColor={s.coverColor}
          coverPattern={s.coverPattern}
          coverText={s.coverText}
          coverStickers={s.coverStickers}
          className="aspect-[16/9] w-full"
        />
        {/* الحالةُ على الغلاف — أوّلُ ما يُسأل عنه: أمنشورٌ أم لا */}
        <span className="absolute right-3 top-3">
          <StatusBadge status={s.status} />
        </span>
      </Link>

      {/* ---------- الترويسة ---------- */}
      <div className="flex flex-1 flex-col gap-3 p-4">
        <div className="min-w-0">
          <h3 className="font-display truncate text-base font-bold">{s.name}</h3>
          <p className="mt-0.5 truncate text-[11px] text-muted-foreground">{s.grade}</p>
        </div>

        {/* الأرقام — سطرٌ واحدٌ يُقرأ بلمحة */}
        <div className="flex flex-wrap items-center gap-x-4 gap-y-1.5 text-[11px] text-muted-foreground">
          <span className="inline-flex items-center gap-1">
            <ListVideo className="size-3.5" /> {lessons.length.toLocaleString("ar-EG")} درساً
          </span>
          <span className="inline-flex items-center gap-1">
            <Users className="size-3.5" /> {s.students.toLocaleString("ar-EG")}
          </span>
          {cheapest ? (
            <Link href="/admin/plans" className="inline-flex items-center gap-1 font-bold text-foreground transition hover:text-primary" title={`من خطّة: ${cheapest.plan.name}`}>
              <Wallet className="size-3.5" /> {cheapest.price.toLocaleString("ar-EG")} ج.م
            </Link>
          ) : (
            <Link href="/admin/plans" className="inline-flex items-center gap-1 rounded-full bg-rose-500/12 px-2 py-0.5 font-bold text-rose-600 transition hover:bg-rose-500/20 dark:text-rose-400">
              <Wallet className="size-3" /> لا خطّة تفتحه
            </Link>
          )}
        </div>

        {/* الفصلُ والشعبة — يُبدَّلان من البطاقة، فنقلُهما أكثرُ ما يُفعل */}
        <div className="flex flex-wrap gap-2">
          <select
            value={s.term ?? 1}
            onChange={(e) => onTerm(Number(e.target.value) as 1 | 2)}
            className="rounded-xl border border-border bg-background px-2.5 py-1.5 text-[11px] outline-none focus:border-primary/50"
          >
            <option value={1}>الفصل الأول</option>
            <option value={2}>الفصل الثاني</option>
          </select>
          {hasTrack && (
            <select
              value={s.track || "الكل"}
              onChange={(e) => onTrack(e.target.value)}
              className="rounded-xl border border-border bg-background px-2.5 py-1.5 text-[11px] outline-none focus:border-primary/50"
            >
              <option value="الكل">كل الشعب</option>
              <option value="علمي">علمي</option>
              <option value="أدبي">أدبي</option>
            </select>
          )}
        </div>

        {/*
          الدروسُ لا تُعرض هنا.
          كانت تُعرض بأغلفتها في البطاقة، فصارت البطاقةُ صفحتين: كورسٌ
          ثمّ دروسُه. وموضعُ الدروس صفحتُها — فيها تُدار وتُرتَّب وتُختبر،
          وهنا يكفي عددُها وبابُ الدخول إليها.
        */}

        {/* ---------- الإجراءات ---------- */}
        <div className="mt-auto flex items-center gap-1.5 border-t border-border pt-3">
          <Link
            href={`/admin/courses/${s.id}`}
            className="inline-flex flex-1 items-center justify-center gap-1.5 rounded-2xl bg-primary px-3 py-2 text-[11px] font-bold text-white"
          >
            <ListVideo className="size-4" /> إدارة الدروس
          </Link>
          <button
            onClick={onToggle}
            title={s.status === "منشورة" ? "إخفاء" : "نشر"}
            className="grid size-9 place-items-center rounded-2xl border border-border text-primary transition hover:border-primary"
          >
            {s.status === "منشورة" ? <ToggleRight className="size-4" /> : <ToggleLeft className="size-4" />}
          </button>
          <button
            onClick={onRemove}
            title="حذف"
            className="grid size-9 place-items-center rounded-2xl border border-border text-rose-500 transition hover:border-rose-500"
          >
            <Trash2 className="size-4" />
          </button>
        </div>
      </div>
    </div>
  );
}
