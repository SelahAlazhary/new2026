"use client";

/**
 * لوحُ ترحيب الطالب — الهيئة الأزهرية.
 * ------------------------------------------------------------------
 * لوحٌ كحليٌّ غامق تُزيّنه شبكةٌ هندسيّةٌ إسلامية، وترحيبٌ بالطالب وصفِّه،
 * وثلاثُ بطاقاتٍ تطفو على حافّته السفلى نصفَ طفوٍ — نصفُها في اللوح
 * ونصفُها خارجه.
 *
 * **والزخرفةُ مبنيّةٌ لا مرسومة.** الشبكةُ نجومٌ ثمانيّةٌ على شبكةٍ مربّعة،
 * كلُّ نجمةٍ مربّعان بزاوية ٤٥° — وهو أصلُ التوريق الإسلامي. وبناؤها
 * رياضيّاً يجعلها دقيقةً بالضرورة: لا خطَّ في غير موضعه، ولا زاويةَ
 * تقريبيّة. وهذا ما يفرّق الزخرفةَ الحقيقية عن رسمٍ يحاكيها.
 *
 * **والبطاقاتُ الطافية تحتاج حشواً تحت اللوح.** لو طفت بلا حشوٍ لغطّت ما
 * بعدها. فاللوحُ يترك أسفله فراغاً بقدر نصف البطاقة — وهو `--az-lift`،
 * يُحسب مرّةً ويُستعمل في الموضعين فلا يفترقان.
 */

import { useMemo, type ReactNode } from "react";
import type { AzHeadOptions } from "@/lib/utils/types";
import { findAzHead, azPad, azShadow } from "@/lib/styles/az-head-styles";
import { findAzCard } from "@/lib/styles/az-card-styles";

/** رقمٌ بالعربية — للنصّ الجاري. */
const ar = (n: number) => n.toLocaleString("ar-EG");

/**
 * رقمٌ بالخانات الغربيّة — للأعداد الكبيرة وحدَها.
 * ------------------------------------------------------------------
 * **صفرُ العربيّة `٠` نقطةٌ في أصل رسمه**، لا حلقةٌ مفرَّغة. وهو مقروءٌ
 * في سياق نصٍّ جارٍ حيث تُحيط به حروفٌ تدلّ عليه؛ فإذا كبُر ووقف وحدَه
 * في لوح مؤشّراتٍ عند ٤٤px صار **معيّناً أبيضَ لا عدداً** — يراه الطالبُ
 * فيظنّ الشاشةَ عطبت، وهو محقٌّ فيما يرى.
 *
 * فالعددُ الكبيرُ وحدَه بالخانات الغربيّة (`0`, `12`, `100`): حلقتُه
 * مفرَّغةٌ لا تُشبه شيئاً غيرَ الصفر، وعرضُها ثابتٌ فلا يتراقص الصفّ.
 * وما بقي من نصّ المنصّة عربيُّ الخانات كما كان — التبديلُ في الرقم
 * الكبير لا في اللغة.
 */
const west = (n: number) => n.toLocaleString("en-US");

/* ============================================================
   الشبكة الهندسية
   ============================================================ */

/** نجمةٌ ثمانيّة: مربّعان متراكبان بزاوية ٤٥°، مرسومان بمسارٍ واحد. */
function starPath(r: number): string {
  const pts: string[] = [];
  /* ستّةَ عشرَ رأساً بالتناوب بين نصف القطر الخارجيّ والداخليّ */
  const inner = r * 0.414; // نسبةُ المثمّن المنتظم: tan(22.5°)
  for (let i = 0; i < 16; i++) {
    const a = (i * Math.PI) / 8 - Math.PI / 2;
    const rad = i % 2 === 0 ? r : inner;
    pts.push(`${(Math.cos(a) * rad).toFixed(2)} ${(Math.sin(a) * rad).toFixed(2)}`);
  }
  return `M${pts.join("L")}Z`;
}

function GirihField({ className = "" }: { className?: string }) {
  const star = useMemo(() => starPath(46), []);
  /* شبكةٌ مربّعة — النجومُ في العُقد، والمثمّناتُ الصغيرة بينها */
  const step = 92;
  const cols = 7;
  const rows = 4;

  return (
    <svg
      viewBox="0 0 640 360"
      preserveAspectRatio="xMinYMid slice"
      className={className}
      aria-hidden="true"
      fill="none"
    >
      <defs>
        <linearGradient id="az-h-fade" x1="0" y1="0" x2="1" y2="0">
          <stop offset="0" stopColor="#fff" stopOpacity="1" />
          <stop offset="0.62" stopColor="#fff" stopOpacity="0.45" />
          <stop offset="1" stopColor="#fff" stopOpacity="0" />
        </linearGradient>
        <mask id="az-h-mask">
          <rect width="640" height="360" fill="url(#az-h-fade)" />
        </mask>
      </defs>

      <g mask="url(#az-h-mask)">
        {Array.from({ length: rows }, (_, r) =>
          Array.from({ length: cols }, (_, c) => {
            /* الصفُّ الفرديُّ يُزاح نصفَ خطوة — فتتعشّق النجومُ ولا تصطفّ */
            const x = c * step + (r % 2 ? step / 2 : 0);
            const y = r * step + 24;
            return (
              <g key={`${r}-${c}`} transform={`translate(${x} ${y})`}>
                <path d={star} stroke="hsl(var(--gold))" strokeWidth="1.5" opacity="0.5" />
                <path d={star} stroke="hsl(var(--gold))" strokeWidth="0.6" opacity="0.3" transform="scale(0.62)" />
                {/* المثمّنُ الصغير في قلب النجمة */}
                <circle r="9" stroke="hsl(var(--gold))" strokeWidth="0.8" opacity="0.35" />
              </g>
            );
          })
        )}
      </g>
    </svg>
  );
}

/* ============================================================
   رسمُ البطاقة
   ============================================================ */

/**
 * أيقونةٌ في مربّعٍ مذهّب — رسمٌ داخليٌّ بـ`currentColor`.
 * مقاسُها مقاسُ حلقة النسبة (٤٨) فتستوي البطاقاتُ الثلاثُ في صفٍّ واحد.
 */
function TileIcon({ children, size = 48 }: { children: ReactNode; size?: number }) {
  return (
    <span style={{ width: size, height: size }} className="grid shrink-0 place-items-center rounded-2xl border border-[hsl(var(--gold)/0.35)] bg-[hsl(var(--gold)/0.1)] text-[hsl(var(--gold))]">
      <svg
        viewBox="0 0 24 24"
        style={{ width: size * 0.46, height: size * 0.46 }}
        fill="none"
        stroke="currentColor"
        strokeWidth="1.6"
        strokeLinecap="round"
        strokeLinejoin="round"
        aria-hidden="true"
      >
        {children}
      </svg>
    </span>
  );
}

/* ============================================================
   حلقةُ النسبة
   ============================================================ */
function Ring({ value, size = 62 }: { value: number; size?: number }) {
  const r = 26;
  const c = 2 * Math.PI * r;
  const v = Math.max(0, Math.min(100, value));
  return (
    <span className="relative grid shrink-0 place-items-center" style={{ width: size, height: size }}>
      <svg viewBox="0 0 64 64" className="size-full -rotate-90" fill="none" aria-hidden="true">
        <circle cx="32" cy="32" r={r} stroke="hsl(var(--gold))" strokeOpacity={0.2} strokeWidth="6" />
        <circle
          cx="32" cy="32" r={r}
          stroke="hsl(var(--gold))" strokeWidth="6" strokeLinecap="round"
          strokeDasharray={`${(c * v) / 100} ${c}`}
        />
      </svg>
      {/* النصُّ يتبع قطرَ الحلقة — نسبةٌ ثابتةٌ لا مقاسٌ مكتوب، فلا يفيض إن كبُرت */}
      <span
        className="font-display absolute font-bold"
        style={{ color: "var(--az-accent)", fontSize: `${Math.round(size * 0.24)}px` }}
      >
        {west(v)}٪
      </span>
    </span>
  );
}

/* ============================================================
   اللوح
   ============================================================ */
export function AzhariStudentHeader({
  name,
  grade,
  female,
  progress,
  courses,
  daysLeft,
  active,
  opts,
}: {
  name: string;
  grade?: string;
  female?: boolean;
  /** متوسّط التقدّم ٪. */
  progress: number;
  /** عددُ الكورسات المتاحة. */
  courses: number;
  /** الأيامُ المتبقية في الاشتراك — `null` إن كان دائماً أو بلا اشتراك. */
  daysLeft: number | null;
  /** هل الاشتراكُ ساري. */
  active: boolean;
  /** ضبطُ اللوح من اللوحة — والغيابُ هو الأصل. */
  opts?: AzHeadOptions;
}) {
  /*
    المقاساتُ متغيّراتُ CSS لا أصنافُ Tailwind.
    الأستاذُ يختار رقماً بين حدّين، وأصنافُ Tailwind مجموعةٌ مغلقة —
    فلا تُبنى منها قيمةٌ حرّة. والمتغيّرُ يقبل أيَّ رقمٍ ويُورَث للأبناء.
  */
  const o = opts ?? {};
  const st = findAzHead(o.style);
  const cd = findAzCard(o.cardStyle);
  const pad = azPad(st.pad);

  /*
    الألوانُ ترتّبها الأولويّة: ضبطُ الأستاذ، ثمّ ما يميّز التصميمَ، ثمّ
    متغيّراتُ العلامة. فمن لم يضبط شيئاً تبع هويّةَ منصّته، ومن اختار
    تصميماً ملوّناً أخذ لونَه، ومن ضبط بيده غلب الاثنين.
  */
  const accent = o.accentColor || st.accent || "hsl(var(--gold))";
  const panelBg = o.panelColor || st.panelColor || "hsl(217 48% 13%)";
  const cardBg =
    st.panel === "glass" ? "hsl(0 0% 100% / 0.08)"
    : st.panel === "outline" ? "transparent"
    : st.panel === "paper" ? "hsl(0 0% 100%)"
    : "hsl(217 48% 15%)";
  const ink = o.inkColor || (st.ink === "dark" ? "hsl(220 30% 14%)" : "#fff");
  /*
    الحافّةُ لونٌ مستقلٌّ لا اشتقاقٌ من التمييز.
    كانت تُشتقّ منه بمزجٍ (٣٢٪)، فلا تُنال حافّةٌ سوداءُ حادّةٌ على أرضٍ
    زجاجيّةٍ إلّا بتسويد التمييز معها — وهو غيرُ مقصود. فصارت تُختار.
  */
  const edge = o.edgeColor || st.edge || "color-mix(in srgb, var(--az-accent) 32%, transparent)";

  const vars = {
    "--az-accent": accent,
    "--az-ink": ink,
    "--az-edge": edge,
    "--az-name": `${o.nameSize ?? 36}px`,
    "--az-value": `${o.valueSize ?? 44}px`,
    "--az-title": `${o.titleSize ?? 14}px`,
    "--az-note": `${o.noteSize ?? 13}px`,
    "--az-avatar": `${o.avatarSize ?? 72}px`,
    "--az-radius": `${o.radius ?? st.radius}px`,
    "--az-lift": `${pad.lift}px`,
  } as React.CSSProperties;
  /*
    بطاقةُ الرقم: عنوانٌ فوق، ثمّ الرقمُ كبيراً ومعه وحدتُه، ثمّ سطرُ حال.
    ------------------------------------------------------------------
    كان الرقمُ محشوراً في دائرةٍ صغيرةٍ بحجم `text-lg`، والعنوانُ هو
    الكبير. وصفرُ العربيّة `٠` **نقطةٌ في رسمه**، فبطاقةٌ قيمتُها صفرٌ
    تبدو بلا رقمٍ أصلاً — يراها الطالبُ ثلاثَ نقاطٍ فيظنّها عطباً، وهو
    محقٌّ فيما يرى.

    فصار الرقمُ بطلَ البطاقة، **ومعه وحدتُه دائماً**: «٠٪»، «٠ كورسات»،
    «∞ دائم». والوحدةُ هي التي تجعل النقطةَ تُقرأ عدداً — عينٌ ترى
    «٠ كورسات» تعرف أنّها صفر، وعينٌ ترى «٠» وحدَها ترى نقطة.

    والأرقامُ جدوليّةٌ (`tabular-nums`) فلا يتراقص عرضُ البطاقة كلّما
    تغيّر الرقم.
  */
  const allCards = [
    {
      key: "progress",
      art: <Ring value={progress} size={o.ringSize ?? 64} />,
      title: "متوسّط تقدّمك الدراسي",
      value: west(progress),
      unit: "٪",
      bar: progress,
      note: progress > 0 ? `أنجزتَ ${ar(progress)}٪ من دروسك` : "ابدأ أوّل درسٍ لك",
    },
    {
      key: "courses",
      art: (
        <TileIcon size={o.ringSize ?? 64}>
          <path d="M4 5.5A1.5 1.5 0 0 1 5.5 4H10a2 2 0 0 1 2 2v13a2 2 0 0 0-2-2H5.5A1.5 1.5 0 0 1 4 15.5z" />
          <path d="M20 5.5A1.5 1.5 0 0 0 18.5 4H14a2 2 0 0 0-2 2v13a2 2 0 0 1 2-2h4.5a1.5 1.5 0 0 0 1.5-1.5z" />
        </TileIcon>
      ),
      title: "كورساتك",
      value: west(courses),
      unit: courses === 1 ? "كورس" : "كورسات",
      /* لا نسبةَ للعدد — خطٌّ ساكنٌ يُسوّي الصفّ ولا يدّعي قياساً. */
      bar: null,
      note: courses > 0 ? "متاحةٌ لك الآن" : "لا كورساتٍ بعد",
    },
    {
      key: "sub",
      art: (
        <TileIcon size={o.ringSize ?? 64}>
          <circle cx="12" cy="12" r="8.5" />
          <path d="M12 7.5V12l3 1.8" />
        </TileIcon>
      ),
      title: "اشتراكك",
      value: daysLeft === null ? "∞" : west(daysLeft),
      unit: daysLeft === null ? "دائم" : "يوماً متبقياً",
      /* الأيامُ تُقاس على شهرٍ — فالشريطُ يقصر كلّما اقترب الانتهاء. */
      bar: daysLeft === null ? null : Math.round((Math.min(daysLeft, 30) / 30) * 100),
      note: active ? "اشتراكٌ ساري المفعول" : "لا اشتراكَ ساري",
    },
  ];

  /* ما أُخفي لا يُرسم — ولا يُترك مكانُه فارغاً، فالشبكةُ تتوزّع على الباقي */
  const shown = allCards.filter((c) =>
    c.key === "progress" ? !o.hideProgress : c.key === "courses" ? !o.hideCourses : !o.hideSub
  );

  /*
    الترتيبُ يُقرأ من الضبط ويُكمَّل بالباقي.
    ولا يُعتمد على طول القائمة المحفوظة: بطاقةٌ تُضاف غداً لا يعرفها
    ضبطٌ حُفظ اليوم، فتسقط لو كان الترتيبُ هو المصدرَ الوحيد. فما ذُكر
    يُقدَّم بترتيبه، وما لم يُذكر يلحق على أصله.
  */
  const cards = o.order?.length
    ? [
        ...o.order.map((k) => shown.find((c) => c.key === k)).filter(Boolean),
        ...shown.filter((c) => !o.order!.includes(c.key)),
      ] as typeof shown
    : shown;

  const pos = o.cardsPos ?? "below";
  const align = o.align ?? "start";
  const cols = o.cols ?? 3;

  if (o.off) return null;

  return (
    /* الحشوُ السفليّ يترك مكانَ نصف البطاقة الطافية — لا تغطّي ما بعدها */
    <div className="az-head relative mb-6 flex flex-col" style={vars}>
      <div
        style={{
          borderRadius: "calc(var(--az-radius) + 4px)",
          background: st.panel === "outline" ? "transparent" : panelBg,
          border: st.panel === "outline" || st.edge || o.edgeColor ? "1px solid var(--az-edge)" : undefined,
          backdropFilter: st.panel === "glass" ? "blur(14px)" : undefined,
          paddingTop: pad.top,
          color: ink,
        }}
        className="relative overflow-hidden pb-[calc(var(--az-lift)+1.25rem)] shadow-bento">
        {/* الزخرفةُ الهندسية — من الطرف المقابل للنصّ */}
        {!o.hideOrnament && st.orn !== "off" && (
          <div
            className="pointer-events-none absolute inset-y-0 left-0 w-[62%]"
            style={{ opacity: st.orn === "faint" ? 0.28 : 0.7 }}
          >
            <GirihField className="size-full" />
          </div>
        )}
        {/* تدرّجٌ يُعمّق اللوح ويُبقي النصَّ مقروءاً */}
        <div
          className="pointer-events-none absolute inset-0"
          style={{ background: "linear-gradient(270deg, hsl(217 48% 13% / 0.96) 22%, transparent 72%)" }}
        />

        {/*
          الترحيبُ يبدأ من اليمين.
          ------------------------------------------------------------------
          كان `justify-end` يدفعه إلى الطرف — و`end` في وثيقةٍ عربيّةٍ هو
          **اليسار**. وقرائنُ اللوح نفسِه تشهد أنّ المقصود كان اليمين:
          الزخرفةُ الهندسيّة موضوعةٌ في اليسار (`left-0`) لتخلوَ الجهةُ
          الأخرى للنصّ، والتدرّجُ يُعتم اليمينَ ليبقى المكتوبُ فوقه
          مقروءاً. فالنصُّ كان يقف على الزخرفة، والعتمةُ تُهدر على فراغ.

          والصورةُ أوّلاً ثمّ الاسم: العينُ العربيّةُ تبدأ من اليمين،
          فتلقى الوجهَ ثمّ تقرأ صاحبَه — كما في كلّ بطاقةِ تعريف.
        */}
        <div
          data-reveal="right"
          data-reveal-duration="fast"
          className={`relative flex items-center gap-4 px-6 sm:px-9 ${
            align === "center" ? "justify-center text-center" : align === "end" ? "justify-end" : ""
          }`}
        >
          {!o.hideAvatar && (
          <span
            style={{ width: "var(--az-avatar)", height: "var(--az-avatar)", borderColor: "color-mix(in srgb, var(--az-accent) 55%, transparent)" }}
            className="grid shrink-0 place-items-center overflow-hidden rounded-full border-2 bg-white/10"
          >
            {/* لا صورةَ للطالب في نموذج الحساب — فأوّلُ حرفٍ من اسمه */}
            <span className="font-display text-2xl font-bold sm:text-3xl" style={{ color: "var(--az-accent)" }}>{name.slice(0, 1)}</span>
          </span>
          )}
          <div className="min-w-0 text-start">
            <p className="font-kufi text-[13px] font-bold" style={{ color: "color-mix(in srgb, var(--az-ink) 70%, transparent)" }}>أهلاً {female ? "بكِ" : "بك"}،</p>
            <h1 className="font-display mt-1.5 truncate font-extrabold leading-tight text-white" style={{ fontSize: "var(--az-name)", color: "var(--az-ink)" }}>{name}</h1>
            {grade && !o.hideGrade && (
              <p className="font-kufi mt-2 text-[15px] font-bold" style={{ color: "var(--az-accent)" }}>{grade}</p>
            )}
          </div>
        </div>
      </div>

      {/*
        البطاقاتُ الطافية — نصفُها في اللوح ونصفُها خارجه.
        ------------------------------------------------------------------
        كانت صغيرةً: عنوانٌ ١١px ورقمٌ ٣٠px في حشوٍ ضيّق، فتبدو حاشيةً على
        اللوح لا مؤشّراتٍ تُقرأ من بعيد. وهي أوّلُ ما تقع عليه العينُ في
        الشاشة — فيها خلاصةُ حال الطالب كلِّها.

        فكبُرت: الرقمُ يبلغ ٤٨px في الشاشات الواسعة، والحشوُ أوسع،
        والفاصلُ بينها أكبر. والعنوانُ صار ١٣px بتباعدٍ خفيفٍ في الحروف —
        وهو ما يميّز لوحَ المؤشّرات المهنيَّ من صفٍّ من الصناديق.
      */}
      {/*
        موضعُ البطاقات — ضبطُ الأستاذ يسبق ما في التصميم.
        التصميمُ يقترح (`st.cards`) والأستاذُ يقرّر (`o.cardsPos`): من لم
        يضبط شيئاً تبع تصميمَه، ومن ضبط غلبه. ولا يُلغى أحدُهما بالآخر.
      */}
      <div
        className={`relative grid gap-4 px-3 sm:px-6 ${
          cols === 1 ? "sm:grid-cols-1" : cols === 2 ? "sm:grid-cols-2" : "sm:grid-cols-3"
        } ${
          pos === "above"
            ? "mb-4 order-first"
            : pos === "inside"
            ? "-mt-[calc(var(--az-lift)+1rem)]"
            : pos === "side"
            ? "-mt-[var(--az-lift)] sm:grid-cols-1"
            : st.cards === "float"
            ? "-mt-[var(--az-lift)]"
            : st.cards === "inside"
            ? "-mt-[calc(var(--az-lift)+1rem)]"
            : "-mt-3 gap-0 sm:gap-0"
        }`}
        data-reveal-group
      >
        {cards.map((c) => (
          <div
            key={c.key}
            data-reveal="scale-up"
            style={{
              borderRadius: st.cards === "strip" ? 0 : "var(--az-radius)",
              background:
                cd.deco === "gradient"
                  ? `linear-gradient(160deg, color-mix(in srgb, var(--az-accent) 12%, ${cardBg}), ${cardBg})`
                  : cardBg,
              borderColor: "var(--az-edge)",
              boxShadow: azShadow(st.shadow, "color-mix(in srgb, var(--az-accent) 55%, transparent)"),
              color: ink,
            }}
            className={`group relative overflow-hidden border px-5 py-5 transition duration-300 ${
              cd.deco === "thick" ? "border-[3px]" : ""
            } ${cd.deco === "underline" ? "border-x-0 border-t-0 border-b-[3px]" : ""}`}
          >
            {/* الزينةُ خلف المتن — لا تزاحمه ولا تبتلع ضغطةً */}
            {cd.deco === "sideBar" && (
              <span className="pointer-events-none absolute inset-y-0 end-0 w-1.5" style={{ background: "var(--az-accent)" }} />
            )}
            {cd.deco === "topBar" && (
              <span className="pointer-events-none absolute inset-x-0 top-0 h-1.5" style={{ background: "var(--az-accent)" }} />
            )}
            {cd.deco === "ghost" && (
              <span
                aria-hidden="true"
                className="pointer-events-none absolute -bottom-4 -start-3 opacity-[0.07]"
                style={{ transform: "scale(2.6)", transformOrigin: "bottom left" }}
              >
                {c.art}
              </span>
            )}
            {/*
              الرسمُ والعنوانُ يبدآن من جهةٍ واحدة — اليمين.
              ------------------------------------------------------------------
              كان الرسمُ مدفوعاً إلى الطرف المقابل بـ`justify-between`، فتقرأ
              العينُ العنوانَ يميناً ثمّ تقطع البطاقةَ عرضاً إلى الأيقونة ثمّ
              ترجع إلى الرقم. ثلاثُ وقفاتٍ لبطاقةٍ فيها رقمٌ واحد.

              فصارا معاً في المبتدأ: أيقونةٌ فعنوانٌ فرقمٌ فسطرُ حال — عمودٌ
              واحدٌ تنزل فيه العينُ بلا ارتداد.
            */}
            <div
              className={`relative mb-4 flex gap-3 ${
                cd.layout === "center" ? "flex-col items-center text-center" : "items-center"
              } ${cd.layout === "line" ? "mb-2" : ""}`}
            >
              {cd.icon && (
                <span className="shrink-0 transition duration-300 group-hover:scale-105">{c.art}</span>
              )}
              <span
                className="font-kufi min-w-0 flex-1 font-bold leading-snug"
                style={{ letterSpacing: "0.01em", fontSize: "var(--az-title)", color: "color-mix(in srgb, var(--az-ink) 75%, transparent)" }}
              >
                {c.title}
              </span>
            </div>

            <p
              className={`relative flex items-baseline gap-2 ${
                cd.layout === "center" ? "justify-center" : ""
              } ${cd.layout === "split" ? "justify-between" : ""}`}
            >
              <span
                className="font-display font-extrabold leading-[0.95]"
                style={{
                  fontVariantNumeric: "tabular-nums",
                  fontSize: `calc(var(--az-value) * ${cd.scale})`,
                  color: "var(--az-ink)",
                }}
              >
                {c.value}
              </span>
              <span className="font-kufi truncate text-[15px] font-bold" style={{ color: "var(--az-accent)" }}>
                {c.unit}
              </span>
            </p>

            {/*
              شريطٌ رفيعٌ تحت الرقم.
              العينُ تقرأ الطولَ أسرعَ ممّا تقرأ العدد، فالنسبةُ تُرى قبل
              أن تُقرأ. وما لا نسبةَ له يأخذ خطّاً ذهبيّاً ساكناً — فتستوي
              البطاقاتُ الثلاثُ ارتفاعاً ولا يتعرّج الصفّ.
            */}
            {!o.hideBars && cd.bar && (
            <span className="relative mt-4 block h-1.5 overflow-hidden rounded-full bg-white/10">
              <span
                className="block h-full rounded-full transition-[width] duration-700"
                style={{ width: c.bar === null ? "100%" : `${Math.max(3, Math.min(100, c.bar))}%`, opacity: c.bar === null ? 0.35 : 1, background: "var(--az-accent)" }}
              />
            </span>
            )}

            <p className={`font-kufi mt-3 truncate leading-relaxed ${cd.layout === "center" ? "text-center" : ""}`} style={{ fontSize: "var(--az-note)", color: "color-mix(in srgb, var(--az-ink) 62%, transparent)" }}>{c.note}</p>
          </div>
        ))}
      </div>

      {/* فاصلٌ مذهّبٌ أسفل اللوح — يُغلقه فلا يبدو مقطوعاً */}
      <div className="mt-5 flex items-center justify-center gap-3 text-[hsl(var(--gold))]">
        <span className="h-px flex-1 bg-gradient-to-l from-transparent via-current to-transparent opacity-40" />
        <svg viewBox="0 0 24 24" className="size-4" fill="none" stroke="currentColor" strokeWidth="1.4" aria-hidden="true">
          <path d="M12 3l9 9-9 9-9-9z" />
          <path d="M12 8l4 4-4 4-4-4z" opacity="0.6" />
        </svg>
        <span className="h-px flex-1 bg-gradient-to-r from-transparent via-current to-transparent opacity-40" />
      </div>
    </div>
  );
}
