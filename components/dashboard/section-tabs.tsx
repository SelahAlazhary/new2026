"use client";

/**
 * شبكةُ الأقسام — تبويباتٌ تفتح تحتها.
 * ------------------------------------------------------------------
 * مرّ التقسيمُ بثلاث صور، وكلُّ واحدةٍ حلّت مشكلةً وأورثت أخرى:
 *
 *   ١ ــ **ألواحٌ تُطوى**: تُخفي ما لا يُعرف مكانُه، فمن يبحث يفتحها
 *        واحداً واحداً، ومن يعرف يضغط ضغطةً زائدةً في كلّ زيارة.
 *   ٢ ــ **أقسامٌ مفتوحةٌ كلُّها**: تُري كلَّ شيءٍ وتُطيل الشاشةَ أكثرَ ممّا
 *        كانت — أحدَ عشرَ قسماً مفتوحاً في شاشة المظهر.
 *   ٣ ــ **شريطُ تبويبات**: يُقصّر الشاشة، ويُخفي الأسماءَ في شريطٍ يُمرَّر
 *        عرضاً حين تكثر — سبعَ عشرةَ شارةً في التخصيص.
 *
 * **والرابعةُ تحلّ الثلاثَ معاً**: الشاشةُ تفتح على **شبكةِ بطاقات** —
 * كلُّ قسمٍ بطاقةٌ بأيقونته واسمه وسطرٍ يقول ما يفعل. فيُرى ما في الشاشة
 * كلُّه بنظرةٍ واحدة (لا يُخفى شيء)، في مساحةٍ لا تطول (البطاقاتُ صفوفٌ لا
 * عمود)، وبأسماءٍ كاملةٍ لا شاراتٍ مقتضبة.
 *
 * **والضغطُ يفتح القسمَ تحت الشبكة لا في نافذةٍ عائمة.** والنافذةُ كانت
 * تحلّ مشكلةً وتُورث ثلاثاً: تحجب الشبكةَ فلا يُرى أين أنت منها، وتقفل
 * تمريرَ الصفحة فيُحبَس المحتوى في صندوقٍ داخل صندوق، وتُبعد المتنَ عن
 * سياقه فلا يُقارَن قسمٌ بجاره.
 *
 * فصارت الشبكةُ **شريطَ تبويباتٍ يبقى في مكانه**، والقسمُ يُفتح تحته
 * مباشرةً: تُرى البطاقةُ المختارةُ مضاءةً فوق متنها، ويُنتقل إلى غيرها
 * بضغطةٍ واحدةٍ بلا إغلاق.
 *
 * ------------------------------------------------------------------
 * **والقسمُ يبقى مركَّباً وإن لم يُعرض** (`hidden`): نزعُه من الشجرة يُفقد
 * ما كُتب في حقوله ويُرجعه فارغاً عند العودة — وهو أسوأُ ما يقع في نموذجٍ
 * طويلٍ كنموذج الخطّة.
 *
 * **والبطاقةُ تُعرّف نفسَها**: كلُّ `Section` تُسجّل عنوانَها ووصفَها
 * وأيقونتَها عند التركيب، فتُبنى الشبكةُ من الموجود فعلاً — وصفحةٌ تُضاف
 * غداً تنالها بلا سطرٍ يُكتب لها.
 *
 * **ولا شبكةَ لقسمٍ أو قسمين**: ما يُرى كلُّه في شاشةٍ لا يحتاج بابَ دخول.
 */

import {
  createContext, useCallback, useContext, useEffect, useMemo, useState,
  type ReactNode,
} from "react";
import { usePathname } from "next/navigation";
import { Check, Eye, EyeOff } from "lucide-react";
import { getPref, setPref } from "@/lib/auth/consent";

type Entry = {
  id: string;
  title: string;
  subtitle?: string;
  icon?: ReactNode;
  group?: string;
  alert?: boolean;
  count?: number;
};

type Ctx = {
  register: (e: Entry) => void;
  unregister: (id: string) => void;
  active: string | null;
  close: () => void;
  /** تُعرض شبكةٌ فعلاً؟ — دون ثلاثة أقسامٍ تبقى في مكانها. */
  gridded: boolean;
  /** المعروضةُ الآن — والمربّعُ في البطاقة يُدخل ويُخرج منها. */
  shown: Set<string>;
  toggleShown: (id: string) => void;
};

const SectionTabsCtx = createContext<Ctx | null>(null);

/**
 * نطاقٌ محلّيّ — ما وقع فيه فليس قسمَ صفحة.
 * ------------------------------------------------------------------
 * الشبكةُ فهرسُ أقسامِ الصفحة. وقد يُستعمل `Section` داخل لوحِ تحريرٍ أو
 * بطاقةٍ ليُعنون جزءاً منها، فيسجّل نفسَه في الفهرس بلا وجهِ حقّ: تظهر
 * بطاقتُه فوقُ في غير موضعها، ويختفي متنُه لأنّه ليس القسمَ المفتوح —
 * فيرى الأستاذُ لوحاً بترويسةٍ وذيلٍ بلا حشو.
 *
 * والثابتُ في هذا البناء أنّ `Card` يحمل المحتوى و`Section` يحمل الـ
 * `Card`. فقسمٌ داخل بطاقةٍ — أو داخل قسمٍ — مقلوبُ الترتيب، وهو لوحٌ
 * محلّيٌّ قطعاً. فيُرسم في مكانه كاملاً ولا يُفهرَس.
 *
 * وهذا حارسٌ لا اتّفاق: لا يلزم كاتبَ صفحةٍ أن يتذكّره.
 */
const LocalCtx = createContext(false);

export function SectionLocal({ children }: { children: ReactNode }) {
  return <LocalCtx.Provider value={true}>{children}</LocalCtx.Provider>;
}

export function useSectionTab(e: Entry) {
  const ctx = useContext(SectionTabsCtx);
  const local = useContext(LocalCtx);
  const reg = local ? undefined : ctx?.register;
  const unreg = local ? undefined : ctx?.unregister;
  const { id, title, subtitle, group, alert, count, icon } = e;

  /*
    الترتيبُ ترتيبُ التسجيل، والتسجيلُ في أثرٍ — وآثارُ الإخوة تعمل بترتيب
    الشجرة. فيأتي التسجيلُ بترتيب الصفحة نفسِه بلا عدّادٍ يُدار.

    والأيقونةُ خارج قائمة التبعيّات: هي عنصرٌ جديدٌ في كلّ رسم، فوضعُها
    فيها يُعيد التسجيلَ بلا انقطاع.
  */
  useEffect(() => {
    if (!reg || !unreg) return;
    reg({ id, title, subtitle, icon, group, alert, count });
    return () => unreg(id);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [reg, unreg, id, title, subtitle, group, alert, count]);

  /*
    **لا قسمَ يُخفى.**
    ------------------------------------------------------------------
    كانت الشبكةُ بوّابةً: `hidden` لكلّ قسمٍ إلّا المضغوط. فمن فتح شاشةً
    رأى بطاقاتٍ وفراغاً تحتها، وعليه أن يُخمّن أيَّ بطاقةٍ فيها ما يريد
    — ثمّ يضغط ويقرأ ويرجع ويضغط غيرَها. وهو يعرف شاشتَه ولا يريد أن
    يُسأل عنها في كلّ زيارة.

    والثمنُ الذي دُفع أكبرُ من الفائدة: من نظر إلى الشاشة ظنّ أقسامَها
    ضاعت — وهو ظنٌّ صحيحٌ ممّا يرى، فالمحتوى ليس هناك حقّاً.

    فصارت الشبكةُ **دليلاً**: كلُّ قسمٍ مرسومٌ في مكانه دائماً، والبطاقةُ
    تُقفز إليه وتُبرزه. يُقرأ الكلُّ بالتمرير — وهو أسرعُ من الضغط —
    ويُوصَل إلى البعيد بضغطةٍ واحدة.
  */
  if (!ctx || local) return { hidden: false, open: false, close: () => {} };
  return {
    /*
      **والإخفاءُ باختيار الأستاذ لا بقرار البناء.**
      كان كلُّ قسمٍ يُخفى إلّا المضغوط، فيرى الشاشةَ فارغةً تحت البطاقات
      ويُسأل عن شاشته في كلّ زيارة. وصار الكلُّ معروضاً، ومربّعُ البطاقة
      يُخرج ما لا يحتاجه هو — فالشاشةُ تقصر بقراره لا بقرارنا، وتبقى على
      ما اختار في زيارته القادمة.
    */
    hidden: ctx.gridded && !ctx.shown.has(id),
    /** المقفوزُ إليه يُبرَز لحظةً ليُعرف أين وقعت العين. */
    open: ctx.gridded && ctx.active === id,
    close: ctx.close,
  };
}

export function SectionTabs({ children }: { children: ReactNode }) {
  const path = usePathname();
  const [items, setItems] = useState<Entry[]>([]);
  const [active, setActive] = useState<string | null>(null);
  /*
    `null` = لم يُقرأ المحفوظُ بعد، فالكلُّ معروض. وقراءةُ التخزين في
    مُهيّئ الحالة تُخرج على الخادم غيرَ ما تُخرج في المتصفّح فتشتكي React
    من اختلاف الترطيب.
  */
  const [hiddenIds, setHiddenIds] = useState<string[] | null>(null);

  const key = `mk.sections.${path}`;
  useEffect(() => {
    const raw = getPref(key);
    try { setHiddenIds(raw ? (JSON.parse(raw) as string[]) : []); } catch { setHiddenIds([]); }
  }, [key]);

  const toggleShown = useCallback((id: string) => {
    setHiddenIds((prev) => {
      const cur = prev ?? [];
      const next = cur.includes(id) ? cur.filter((x) => x !== id) : [...cur, id];
      setPref(key, JSON.stringify(next));
      return next;
    });
  }, [key]);

  const shown = useMemo(() => {
    const off = new Set(hiddenIds ?? []);
    return new Set(items.filter((i) => !off.has(i.id)).map((i) => i.id));
  }, [items, hiddenIds]);

  const register = useCallback((e: Entry) => {
    setItems((prev) => {
      const at = prev.findIndex((x) => x.id === e.id);
      if (at < 0) return [...prev, e];
      const same =
        prev[at].title === e.title && prev[at].subtitle === e.subtitle &&
        prev[at].group === e.group && prev[at].alert === e.alert && prev[at].count === e.count;
      if (same) return prev;
      /* المسجَّلُ يبقى في موضعه ولو تغيّر عنوانُه — وإلّا قفز إلى الآخر */
      const copy = [...prev];
      copy[at] = e;
      return copy;
    });
  }, []);

  const unregister = useCallback((id: string) => {
    setItems((prev) => prev.filter((x) => x.id !== id));
    setActive((cur) => (cur === id ? null : cur));
  }, []);

  const gridded = items.length >= 3;
  const close = useCallback(() => setActive(null), []);

  /* الهروبُ يُغلق — ونافذةٌ لا تُغلق إلّا بالفأرة تُتعب من يكتب */
  useEffect(() => {
    if (!active) return;
    const k = (ev: KeyboardEvent) => { if (ev.key === "Escape") setActive(null); };
    window.addEventListener("keydown", k);
    return () => window.removeEventListener("keydown", k);
  }, [active]);

  const groups = useMemo(() => {
    const out: string[] = [];
    items.forEach((i) => { if (i.group && !out.includes(i.group)) out.push(i.group); });
    return out;
  }, [items]);

  const ctx = useMemo<Ctx>(
    () => ({ register, unregister, active, close, gridded, shown, toggleShown }),
    [register, unregister, active, close, gridded, shown, toggleShown]
  );

  /*
    الضغطُ على المفتوح يُغلقه.
    التبويبُ الذي لا يُطفأ يُجبر على فتح غيره للخروج منه — والأستاذُ قد
    يريد الشبكةَ وحدَها ليرى ما في الشاشة كلِّه.
  */
  /*
    البطاقةُ لوحٌ لا زرّ.
    ------------------------------------------------------------------
    كانت `<button>` واحدة. ووضعُ مربّع اختيارٍ داخلها غيرُ صحيح: عنصرٌ
    تفاعليٌّ داخل عنصرٍ تفاعليّ — يُبطله المتصفّحُ أحياناً، ولا يبلغه
    مستعملُ لوحة المفاتيح، ويضغط أحدُهما فيقع الآخر.

    فصارت لوحاً فيه شيئان: مربّعٌ يُظهر القسمَ ويُخفيه، ومساحةٌ تُضغط
    فتقفز إليه. ولكلٍّ حدُّه في الشجرة.
  */
  const card = (i: Entry) => {
    const on = shown.has(i.id);
    return (
      <div key={i.id} className={`sg-card ${i.alert ? "is-alert" : ""} ${active === i.id ? "is-on" : ""} ${on ? "" : "is-off"}`}>
        <label className="sg-card-c" title={on ? "إخفاء هذا القسم من الشاشة" : "إظهاره"}>
          <input
            type="checkbox"
            checked={on}
            onChange={() => toggleShown(i.id)}
            aria-label={`إظهار ${i.title}`}
          />
          <span className="sg-card-cb" aria-hidden="true"><Check className="size-3" /></span>
        </label>

        <button
          type="button"
          onClick={() => {
            /* المخفيُّ يُظهَر أوّلاً — القفزُ إلى ما لا يُرى لا يفعل شيئاً */
            if (!on) toggleShown(i.id);
            setActive(i.id);
            /*
              القفزُ بعد الرسم: القسمُ موجودٌ أصلاً فلا انتظارَ لظهوره، لكنّ
              `setActive` يُعيد الرسمَ فيُؤجَّل القفزُ إلى ما بعده كي يقع على
              موضعٍ مستقرّ.
            */
            requestAnimationFrame(() => {
              document.getElementById(`sec-${i.id}`)?.scrollIntoView({ behavior: "smooth", block: "start" });
            });
          }}
          aria-pressed={active === i.id}
          className="sg-card-hit"
        >
          {i.icon && <span className="sg-card-i">{i.icon}</span>}
          <span className="min-w-0 flex-1">
            <span className="sg-card-t">{i.title}</span>
            {i.subtitle && <span className="sg-card-h">{i.subtitle}</span>}
          </span>
          {i.count !== undefined && i.count > 0 && (
            <span className="sg-card-n">{i.count.toLocaleString("ar-EG")}</span>
          )}
        </button>
      </div>
    );
  };

  const grouped = groups.length >= 2 && items.every((i) => i.group);

  return (
    <SectionTabsCtx.Provider value={ctx}>
      {/*
        الشبكةُ تُرسم قبل المحتوى، والأقسامُ تحتها مخفيّةٌ إلّا المفتوحَ —
        وهو يرسم نفسَه نافذةً. فيبقى ترتيبُ الشجرة ترتيبَ الصفحة.
      */}
      {gridded && (
        <div className="mb-4">
          {/*
            سطرٌ يقول كم يُعرض من كم، ويُعيد الكلَّ بضغطة.
            ومن أخفى أقساماً ثمّ نسي، رأى العددَ فعرف أنّ الشاشةَ ناقصةٌ
            بقراره لا بعطل.
          */}
          <div className="sg-bar">
            <span className="sg-bar-t">
              {shown.size === items.length
                ? `${items.length.toLocaleString("ar-EG")} أقسام في هذه الشاشة`
                : `يُعرض ${shown.size.toLocaleString("ar-EG")} من ${items.length.toLocaleString("ar-EG")} — والباقي مخفيٌّ باختيارك`}
            </span>
            {shown.size < items.length ? (
              <button type="button" onClick={() => { setHiddenIds([]); setPref(key, "[]"); }} className="sg-bar-b">
                <Eye className="size-3.5" /> أظهر الكلّ
              </button>
            ) : (
              <span className="sg-bar-h"><EyeOff className="size-3.5" /> أزِل علامةَ أيّ قسمٍ لإخفائه</span>
            )}
          </div>
          {grouped
            ? groups.map((g) => (
                <div key={g} className="sg-group">
                  <p className="sg-group-t">{g}</p>
                  <div className="sg">{items.filter((i) => i.group === g).map(card)}</div>
                </div>
              ))
            : <div className="sg">{items.map(card)}</div>}
        </div>
      )}

      {children}
    </SectionTabsCtx.Provider>
  );
}
