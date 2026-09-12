"use client";

/**
 * بطاقة مؤشّر — تصميم عصري خفيف.
 * ------------------------------------------------------------------
 * بديل «لوح المؤشّر» المزخرف: بطاقة زجاجية بحواف طرية، شارة أيقونة
 * متدرّجة، رقم كبير بارز، وشريط رفيع يوضّح النسبة. الزخرفة الوحيدة
 * وهج متدرّج خفيف في الركن — يعطي إحساساً شاباً بلا ثقل.
 *
 * الحلقة (حين تُطلب) مرسومة SVG بحدّ سميك وطرف مدوّر وتدرّج، وتُملأ
 * عند الظهور.
 *
 * الأرقام والعناوين HTML — لقارئات الشاشة والاتجاه RTL.
 */
import type { ReactNode } from "react";
import { motion } from "framer-motion";
import { useUid } from "./use-uid";

export function StatTile({
  value,
  unit,
  label,
  icon,
  /** ٠..١٠٠ — يرسم حلقة بدل الرقم الكبير. */
  ring,
  /** ٠..١٠٠ — شريط رفيع أسفل البطاقة. */
  bar,
  /** نصّ صغير يظهر كشارة أعلى اليسار. */
  badge,
  index = 0,
  className = "",
  shape,
  tone = "ink",
  bareIcon = false,
}: {
  value?: ReactNode;
  unit?: string;
  label: string;
  icon?: ReactNode;
  ring?: number;
  bar?: number;
  badge?: string;
  index?: number;
  className?: string;
  /** شكل البطاقة من الهيئة المختارة — قصّ أو انحناء. */
  shape?: React.CSSProperties;
  /**
   * أين تجلس البطاقة:
   * ink     = فوق لوح الحبر الداكن (نصّ أبيض).
   * surface = على خلفية الصفحة (نصّ من الثيم) — وإلا صار النصّ أبيض على
   *           ورق فاتح فاختفى، وهو ما يقع في التخطيطات التي تُخرج
   *           المؤشّرات من اللوح.
   */
  tone?: "ink" | "surface";
  /**
   * يُعرض الرمزُ بلا صندوقٍ حوله.
   * الصورةُ المتحرّكة الملوّنة تحمل شكلَها ولونَها، فصندوقٌ داكنٌ حولها
   * يقصّها ويزاحم ألوانَها. والصندوقُ إنّما وُضع لرمزٍ خطّيٍّ بلا جسم.
   */
  bareIcon?: boolean;
}) {
  const ink = tone === "ink";
  const uid = useUid("tile");
  const pct = Math.max(0, Math.min(100, ring ?? 0));
  /*
    الحلقةُ تقرأ الحدَّ من أيّهما وُجد.
    كانت تُرسم للنسبة وحدَها، والاشتراكُ يعطي `bar` لا `ring` — فبطاقةٌ
    من الثلاث تبقى بلا حلقةٍ وتشذّ عن أختيها. والمقصودُ حدٌّ يُقرأ حيثما
    كان، لا خاصيّةٌ بعينها.
  */
  const shown = Math.max(0, Math.min(100, ring ?? bar ?? 0));
  const has = ring !== undefined || bar !== undefined;
  /* نصفُ القطر يتّسع ليحيط بلوح الصورة لا ليجاوره. */
  const r = 29;
  const circ = 2 * Math.PI * r;

  return (
    <motion.div
      initial={{ opacity: 0, y: 20, scale: 0.95 }}
      whileInView={{ opacity: 1, y: 0, scale: 1 }}
      viewport={{ once: true, margin: "0px 0px -40px 0px" }}
      transition={{ delay: (index % 8) * 0.08, duration: 0.55, ease: [0.22, 1, 0.36, 1] }}
      whileHover={{ y: -4 }}
      style={shape}
      /* الحشو = حشو البطاقة + هامش أمان الشكل، فلا يقصّ القصّ النصّ. */
      className={`stat-tile group relative overflow-hidden backdrop-blur-sm transition-shadow [padding-block:calc(1rem+var(--shape-pad-y,0px))] [padding-inline:calc(1rem+var(--shape-pad-x,0px))] sm:[padding-block:calc(1.25rem+var(--shape-pad-y,0px))] sm:[padding-inline:calc(1.25rem+var(--shape-pad-x,0px))] ${
        ink
          ? "bg-white/[0.07] ring-1 ring-white/15 hover:ring-white/30"
          : "bg-card ring-1 ring-[hsl(var(--gold)/0.35)] hover:ring-[hsl(var(--gold)/0.6)]"
      } ${shape ? "" : "rounded-[1.4rem]"} ${className}`}
    >
      {/*
        صورة البطاقة المرفوعة — طبقة زينة خلف النصّ.
        تُرسم دائماً ولا تظهر إلا حين يُضبط ‎--tile-art‎، فيبقى الترتيب
        واحداً في كل البطاقات ولا يعتمد المكوّن على قراءة الإعداد.
      */}
      <span aria-hidden="true" className="tile-art" />

      {/* وهج متدرّج في الركن — يضيء قليلاً عند المرور */}
      <span
        aria-hidden="true"
        className="pointer-events-none absolute -left-10 -top-12 size-32 rounded-full opacity-35 blur-2xl transition-opacity duration-500 group-hover:opacity-60"
        style={{ background: "radial-gradient(circle, hsl(var(--gold)) 0%, transparent 70%)" }}
      />

      {/* الشارةُ النصّية في الركن الأيمن — فوق كلّ شيء ولا تُزاحم */}
      {badge && (
        <span
          className={`tile-badge-text font-kufi absolute end-4 top-4 rounded-full px-2.5 py-1 text-[10px] font-bold ${
            ink
              ? "bg-[hsl(var(--primary-foreground)/0.15)] text-[hsl(var(--primary-foreground)/0.9)]"
              : "bg-[hsl(var(--gold)/0.28)] text-[hsl(var(--primary))]"
          }`}
        >
          {badge}
        </span>
      )}

      {/*
        صفٌّ واحدٌ لا كتلتان.
        كانت الشارةُ في صفٍّ والنصُّ في كتلةٍ تحتها، فيتباعدان على البطاقة
        العريضة ويبقى بينهما فراغٌ لا يملؤه شيء. والصفُّ الواحد يجعل
        الصورةَ والرقمَ يتحاذيان مهما اتّسعت البطاقة.

        و`flex-row-reverse` يضع أوّلَ عنصرٍ يساراً في العربية — فالصورةُ
        يساراً والنصُّ يمينَها، بلا هوامشَ تلقائيّةٍ تنكسر إذا غاب أحدُهما.
      */}
      <div className="tile-head relative flex flex-row-reverse items-center gap-4">
        {icon && (
          <span className="relative grid shrink-0 place-items-center" style={{ width: "6.6rem", height: "6.6rem" }}>
            {/*
              حلقةُ التقدّم تحيط بالصورة لا تجاورها.
              كانتا شيئين متجاورين يقتسمان العرض؛ وإحاطتُها بها تجعل
              الرقمَ والصورةَ شيئاً واحداً يُقرأ دفعةً، وتُفرغ العرضَ
              للنصّ.
            */}
            {icon && (
              <svg viewBox="0 0 64 64" className="absolute inset-0 size-full -rotate-90" fill="none" aria-hidden="true">
                <circle
                  cx="32"
                  cy="32"
                  r={r}
                  stroke={ink ? "hsl(0 0% 100% / 0.16)" : "hsl(var(--gold) / 0.28)"}
                  strokeWidth="4"
                />
                {has && (
                <motion.circle
                  cx="32"
                  cy="32"
                  r={r}
                  /*
                    القوسُ لونٌ واحد.
                    كان تدرّجاً من الذهب إلى الأساسيّ، واللوحُ نفسُه
                    أساسيّ — فينتهي القوسُ بلون ما تحته ويختفي نصفُه،
                    فيُقرأ خطّاً رماديّاً مقطوعاً لا حدّاً. ولونٌ واحدٌ
                    يقابل لونَ اللوح يُرى في طوله كلِّه.
                  */
                  stroke={ink ? "hsl(var(--gold))" : "hsl(var(--primary))"}
                  strokeWidth="4"
                  strokeLinecap="round"
                  strokeDasharray={circ}
                  initial={{ strokeDashoffset: circ }}
                  animate={{ strokeDashoffset: circ - (shown / 100) * circ }}
                  transition={{ duration: 1.1, ease: "easeOut", delay: 0.25 + index * 0.08 }}
                />
                )}
              </svg>
            )}

            {/*
              الحدُّ مكتوباً على الحلقة نفسِها.
              القوسُ يُري المقدارَ ولا يُري رقمَه — فيُقرأ «قريبٌ من
              النصف» ولا يُقرأ «٤٧». وشارةٌ صغيرةٌ تجلس على أسفل الحلقة
              تُنهي القوسَ برقمِه، فيجتمع البصريُّ والعدديُّ في موضعٍ واحد.

              وموضعُها أسفلَ الوسط لأنّ القوسَ يبدأ من الأعلى (الدورانُ
              ‎-90°‎) فيبقى الأسفلُ أهدأَ ما في الحلقة.
            */}
            {has && (
              <span
                className="absolute bottom-0 left-1/2 -translate-x-1/2 translate-y-1/4 rounded-full px-2 py-[0.15rem] text-[0.68rem] font-bold leading-none [font-variant-numeric:tabular-nums] shadow-sm"
                style={{
                  background: "hsl(var(--gold))",
                  color: "hsl(var(--primary))",
                  boxShadow: ink ? "0 0 0 2px hsl(var(--primary))" : "0 0 0 2px hsl(var(--card))",
                }}
              >
                {shown.toLocaleString("ar-EG", { maximumFractionDigits: 0 })}٪
              </span>
            )}

            {/*
              الصورةُ بلا لوحٍ ولا حدّ.
              كان تحتها مربّعٌ أبيضُ بظلّ — وهو يصلح لرمزٍ خطّيٍّ يحتاج
              سطحاً يُقرأ عليه. أمّا الصورةُ الملوّنةُ فتحمل شكلَها
              ولونَها، فالمربّعُ يقصّها ويقطعها عمّا حولها ويُظهرها
              ملصقاً على البطاقة لا جزءاً منها.

              **ثمّ عادت — لأنّ الرسومَ مصمَّمةٌ لخلفيةٍ فاتحة.**
              خطوطُها سوداءُ وحشوُها أبيض. ووضعُها على لوحٍ كحليٍّ يُذيب
              الخطَّ في الخلفية فيبقى الحشوُ الأبيضُ كتلةً بلا شكل: قبّعةٌ
              وشريطٌ أبيضُ لا يُعرف ما هو. وهذا عيبُ **السياق** لا عيبُ
              الرسم — ولا يُصلحه تتبّعٌ أدقُّ ولا رسمٌ جديد.

              فالمقعدُ الفاتحُ يُعيد للرسم السياقَ الذي صُمّم له: قرصٌ
              كريميٌّ بظلٍّ غائرٍ يفصله عن اللوح، فتُقرأ خطوطُه السوداءُ
              كما تُقرأ على الورق. والهالةُ وحدَها لا تكفي — لا تُعطي
              سطحاً، وإنّما تُضيء ما حولَه.

              وعلى الورق يبقى بلا قرص: السياقُ صحيحٌ أصلاً، والقرصُ فيه
              حدٌّ لا داعيَ له.
            */}
            <span
              className="tile-badge relative grid shrink-0 place-items-center rounded-full"
              style={{
                width: "4.9rem",
                height: "4.9rem",
                background: ink ? "hsl(var(--background))" : "transparent",
                boxShadow: ink
                  ? "0 2px 6px -2px rgb(0 0 0 / 0.35), 0 12px 24px -12px rgb(0 0 0 / 0.55)"
                  : "none",
              }}
            >
              {!ink && (
                <span
                  aria-hidden="true"
                  className="absolute inset-0 rounded-full blur-md"
                  style={{ background: "radial-gradient(circle, hsl(var(--gold) / 0.3) 0%, transparent 70%)" }}
                />
              )}
              <span className="relative">{icon}</span>
            </span>
          </span>
        )}

        {/* النصّ — يملأ ما بقي فلا يبقى فراغٌ في البطاقة العريضة */}
        <div className="tile-body relative min-w-0 flex-1">
          {/*
            الرقمُ فوق والنصُّ تحته — لا بجانبه.
            ------------------------------------------------------------
            كان الرقمُ والوحدةُ في صفٍّ واحد ثمّ العنوانُ تحتهما. وهو يصلح
            لبطاقةٍ عريضة؛ فإذا ضاقت — عمودٌ واحدٌ أو ثلاثةُ أعمدةٍ على شاشةٍ
            متوسّطة — التفّ الصفُّ وركب العنوانُ الرقمَ، وصار الاثنان كتلةً
            لا تُقرأ. وهو ما في اللقطة.

            والترتيبُ الرأسيُّ لا يلتفّ أصلاً: رقمٌ في سطرٍ، ووصفُه تحته.
            فيُقرأ في كلّ عرضٍ بلا استثناء.

            **والمقاسُ من عرض البطاقة لا من الشاشة** (`cqw`): البطاقةُ
            نفسُها تُعرض في عمودٍ وفي عمودين وفي ثلاثة، والقياسُ بالشاشة
            يُعطيها الحجمَ نفسَه في الثلاثة — فيفيض في الضيّق.
          */}
          <p className={`tile-num font-display ${ink ? "text-[hsl(var(--primary-foreground))]" : "text-foreground"}`}>
            <span className="tile-num-v">
              {ring !== undefined ? pct.toLocaleString("ar-EG") : value}
            </span>
            {ring !== undefined && <span className="tile-num-u">٪</span>}
          </p>

          <p
            className={`tile-text font-kufi tile-label ${
              ink ? "text-[hsl(var(--primary-foreground)/0.8)]" : "text-muted-foreground"
            }`}
          >
            {/* الوحدةُ تصف الرقمَ فتسبق العنوان، وتُخفَّف لتُقرأ ثانيةً لا أوّلاً */}
            {unit && <span className="tile-unit">{unit}</span>}
            {label}
          </p>

          {/*
            شريطُ النسبة أُسقِط.
            صار يقول ما تقوله الحلقةُ وشارتُها: النسبةُ نفسُها مرسومةً
            مرّتين ومكتوبةً مرّة — وتكرارُ الرقم في بطاقةٍ واحدة يُشتّت
            العين ولا يزيدها علماً. والحلقةُ أوقعُ لأنّها عند الصورة.
          */}
        </div>
      </div>

    </motion.div>
  );
}
