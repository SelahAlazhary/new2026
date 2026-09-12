"use client";

/**
 * `Section` — قسمٌ ظاهرٌ داخل شاشة الإدارة.
 * ------------------------------------------------------------------
 * كانت الشاشاتُ تُقسَّم بألواحٍ **تُطوى** (`Fold`). والطيُّ يحلّ مشكلةَ
 * الطول ويصنع مشكلةً أسوأَ منها: من لا يعرف أين الحقلُ يفتح الألواحَ
 * واحداً واحداً ليبحث فيها، ومن يعرفه يضغط ضغطةً زائدةً في كلّ زيارة.
 * والمشرفُ لا يقرأ الشاشةَ مرّةً ويمضي — يعمل فيها كلَّ يوم.
 *
 * فصارت أقساماً **مفتوحةً دائماً**: عنوانٌ واضحٌ فوق كلّ مجموعة، وسطرٌ
 * يقول ما تفعله، وحدٌّ يفصلها عمّا قبلها. فتُقرأ الشاشةُ بالتمرير — وهو
 * أسرعُ من الضغط — ويُعرف ما فيها بنظرةٍ واحدةٍ لا بفتحٍ متتابع.
 *
 * **وقاعدةُ القسم: مهمّةٌ واحدة.** قسمٌ يجمع مهمّتين يعود إلى التداخل
 * الذي فُرّ منه؛ وقسمٌ لمهمّةٍ نصفِ مهمّةٍ يُكثر العناوينَ بلا فائدة.
 *
 * **والطيُّ يبقى في القائمة الجانبية وحدَها**: هناك المطلوبُ الانتقالُ لا
 * العمل، والقائمةُ الطويلةُ تُخفي أقسامَها في شاشةٍ واحدة.
 *
 * ولا حالةَ تُحفظ ولا `storageKey`: القسمُ لا يُطوى، فلا شيءَ يُذكَر.
 */

import { useId, type ReactNode } from "react";
import { useSectionTab, SectionLocal } from "./section-tabs";
import { ErrorBoundary } from "./error-boundary";

export function Section({
  title,
  subtitle,
  icon,
  count,
  actions,
  tone,
  group,
  children,
  className = "",
}: {
  title: ReactNode;
  /** سطرٌ يقول ما يفعله القسم — لا تكرارٌ للعنوان. */
  subtitle?: ReactNode;
  icon?: ReactNode;
  /** عددٌ يُعرض شارةً — لا يُعرض إن كان صفراً بلا معنى. */
  count?: number;
  /** أزرارٌ تخصّ القسم كلَّه — تُوضع في ترويسته لا في متنه. */
  actions?: ReactNode;
  /** `alert` يصبغ الترويسةَ حين ينتظر القسمُ عملاً. */
  tone?: "alert" | "calm";
  /** مجموعةُ القسم — تُبنى منها طبقةٌ فوق الشريط حين تكثر الأقسام. */
  group?: string;
  children: ReactNode;
  className?: string;
}) {
  const alert = tone === "alert";
  /*
    البطاقةُ تُسجّل نفسَها في شريط التبويب، فيُبنى من الموجود فعلاً.
    والعنوانُ نصٌّ حين يكون نصّاً؛ وما ليس نصّاً لا اسمَ له في الشريط
    فيُسمّى «قسم».
  */
  const uid = useId();
  const label = typeof title === "string" ? title : "قسم";
  const { hidden, open, close } = useSectionTab({
    id: uid,
    title: label,
    subtitle: typeof subtitle === "string" ? subtitle : undefined,
    icon,
    group,
    alert,
    count,
  });
  /*
    ويُخفى بـ`hidden` لا بالإزالة من الشجرة: الإزالةُ تُفقد ما كُتب في
    حقوله وترجعه فارغاً عند العودة إليه — وهو أسوأُ ما يقع في نموذجٍ طويل.
  */

  return (
    <section
      id={`sec-${uid}`}
      hidden={hidden}
      data-reveal="stretch"
      /*
        المفتوحُ من الشبكة يُبرَز بحلقةٍ وظلّ — فيُعرف أنّه متنُ التبويب
        المضاء لا قسمٌ عاديٌّ وقع تحته.
      */
      className={`glass scroll-mt-28 overflow-hidden rounded-[1.5rem] border transition-shadow duration-200 ${
        open ? "sg-open border-primary/45" : "border-border/70"
      } ${hidden ? "hidden" : ""} ${className}`}
    >
      <header
        className={`relative flex flex-wrap items-center gap-3.5 border-b px-5 py-4 ${
          alert
            ? "border-rose-500/25 bg-gradient-to-l from-rose-500/[0.09] to-transparent"
            : "border-border bg-gradient-to-l from-[hsl(var(--gold)/0.10)] to-transparent"
        }`}
      >
        <span aria-hidden="true" className={`absolute inset-x-0 top-0 h-[3px] ${alert ? "bg-rose-500/70" : "bg-[hsl(var(--gold))]"}`} />
        {icon && (
          <span className={`grid size-10 shrink-0 place-items-center rounded-2xl ${
            alert ? "bg-rose-500/15 text-rose-600 dark:text-rose-400" : "bg-[hsl(var(--gold)/0.22)] text-primary"
          }`}>
            {icon}
          </span>
        )}
        <div className="min-w-0 flex-1">
          <h3 className="font-display flex items-center gap-2 text-[0.95rem] font-extrabold leading-tight">
            {title}
            {count !== undefined && count > 0 && (
              <span className="rounded-full bg-primary/12 px-2 py-0.5 text-[10px] font-extrabold text-primary [font-variant-numeric:tabular-nums]">
                {count.toLocaleString("ar-EG")}
              </span>
            )}
          </h3>
          {subtitle && <p className="mt-1 text-[11.5px] leading-relaxed text-muted-foreground">{subtitle}</p>}
        </div>
        {actions && <div className="flex shrink-0 items-center gap-2">{actions}</div>}
      </header>

      {/*
        ما في القسم محتواه لا أقساماً أخرى للفهرس — انظر `SectionLocal`.
        وهو محاطٌ بحدِّ خطأ: عطبُ قسمٍ يُحاصَر فيه وتبقى الشاشةُ تعمل،
        ولا يُترك المشرفُ أمام صفحةٍ بيضاء لا يعرف أيَّ جزءٍ منها عطِب.
      */}
      <div className="p-5 sm:p-6">
        <ErrorBoundary label={typeof title === "string" ? title : undefined}>
          <SectionLocal>{children}</SectionLocal>
        </ErrorBoundary>
      </div>
    </section>
  );
}
