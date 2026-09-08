"use client";

/**
 * لوحُ الأوامر — بحثٌ واحدٌ يبلغ كلَّ شيء.
 * ------------------------------------------------------------------
 * كان في شريط الأدوات صندوقُ «بحث سريع…» لا يبحث: مربّعٌ يُكتب فيه ولا
 * يستجيب. وهذا أسوأُ من غيابه — الواجهةُ تَعِد ولا تفي.
 *
 * وتحته مشكلةٌ أكبر: اللوحةُ اثنان وعشرون قسماً، وكلُّ ما فيها من كورساتٍ
 * وطلابٍ وخططٍ واختباراتٍ لا يُبلغ إلّا بفتح قسمه ثمّ البحث فيه. فمن
 * أراد كورساً بعينه: قائمةٌ جانبيةٌ ← «الكورسات» ← تمريرٌ ← ضغط.
 *
 * وهذا يجعله ضغطتين: `Ctrl+K` ثمّ الاسم. والمصادرُ سبعةٌ في نتيجةٍ
 * واحدة — أقسامٌ وكورساتٌ وطلابٌ وخططٌ واختباراتٌ وبثوثٌ وأكواد — فلا
 * يُطالَب الباحثُ بأن يعرف في أيّ قسمٍ يقع ما يطلب. وهو الربطُ نفسُه:
 * ما تفرّق في اثنين وعشرين شاشةً يجتمع في حقلٍ واحد.
 *
 * **ولا يُعرض ما لا يُملَك.** الصلاحياتُ تُصفّي المصادرَ قبل البحث، فلا
 * يُدلّ مشرفٌ على بابٍ يُغلق في وجهه.
 *
 * **والترتيبُ بالمطابقة لا بالمصدر.** ما بدأ بالمكتوب يسبق ما احتواه،
 * وإلّا تصدّرت الأقسامُ دائماً لأنّها أوّلُ ما يُجمَع.
 */

import { useEffect, useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import {
  Search, X, LayoutDashboard, BookOpen, Users, Wallet, FileCheck2, Radio, KeyRound, CornerDownLeft,
} from "lucide-react";
import { useContent } from "@/components/content/content-provider";
import { adminNav, studentNav } from "@/lib/business/dashboard-data";
import { can, permForPath, type AdminPerm } from "@/lib/auth/perms";

type Hit = {
  id: string;
  group: string;
  label: string;
  hint?: string;
  href: string;
  icon: React.ReactNode;
};

const GROUP_ORDER = ["الأقسام", "الكورسات", "الطلاب", "الخطط", "الاختبارات", "البثّ", "الأكواد"];

export function CommandPalette({ role }: { role: "admin" | "student" }) {
  const router = useRouter();
  const { db, session } = useContent();
  const me = db?.users?.find((u) => u.id === session?.uid);

  const [open, setOpen] = useState(false);
  const [q, setQ] = useState("");
  const [cursor, setCursor] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);
  const listRef = useRef<HTMLDivElement>(null);

  /* Ctrl+K في كل مكان — وهو المتعارَف عليه، فلا يُتعلَّم */
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === "k") {
        e.preventDefault();
        setOpen((v) => !v);
      }
      if (e.key === "Escape") setOpen(false);
    };
    window.addEventListener("keydown", onKey);
    /*
      والفتحُ من شريط الأدوات أيضاً: الصندوقُ هناك يفتح هذا اللوح بدل أن
      يبقى حقلاً ميّتاً. ويُبلَّغ بحدثٍ لا بخاصيّةٍ تُمرَّر عبر الغلاف —
      الغلافُ لا يعرف هذا المكوّن ولا ينبغي أن يعرفه.
    */
    const onOpen = () => setOpen(true);
    window.addEventListener("open-command-palette", onOpen);
    return () => {
      window.removeEventListener("keydown", onKey);
      window.removeEventListener("open-command-palette", onOpen);
    };
  }, []);

  useEffect(() => {
    if (open) {
      setQ("");
      setCursor(0);
      /* التركيزُ بعد الرسم — قبله لا يوجد الحقل */
      requestAnimationFrame(() => inputRef.current?.focus());
    }
  }, [open]);

  const allow = (p?: AdminPerm | null) => role !== "admin" || !p || can(me, p);

  const hits = useMemo<Hit[]>(() => {
    const out: Hit[] = [];
    const nav = role === "admin" ? adminNav : studentNav;

    for (const n of nav) {
      const perm = role === "admin" ? permForPath(n.href) : null;
      if (!allow(perm)) continue;
      out.push({ id: `nav-${n.href}`, group: "الأقسام", label: n.label, hint: n.href, href: n.href, icon: <LayoutDashboard className="size-4" /> });
    }

    if (role === "admin" && db) {
      if (allow("subjects")) {
        for (const s of db.subjects ?? []) {
          out.push({
            id: `sub-${s.id}`,
            group: "الكورسات",
            label: s.name,
            hint: `${s.grade} · ${(s.term ?? 1) === 2 ? "الفصل الثاني" : "الفصل الأول"} · ${s.status}`,
            href: `/admin/courses/${s.id}`,
            icon: <BookOpen className="size-4" />,
          });
        }
      }
      if (allow("students")) {
        for (const u of (db.users ?? []).filter((x) => x.role === "student")) {
          out.push({
            id: `usr-${u.id}`,
            group: "الطلاب",
            label: u.name,
            hint: [u.grade, u.phone].filter(Boolean).join(" · "),
            href: `/admin/students/${u.id}`,
            icon: <Users className="size-4" />,
          });
        }
      }
      if (allow("plans")) {
        for (const p of db.plans ?? []) {
          out.push({
            id: `pln-${p.id}`,
            group: "الخطط",
            label: p.name,
            hint: `${(p.price ?? 0).toLocaleString("ar-EG")} ج.م`,
            href: "/admin/plans",
            icon: <Wallet className="size-4" />,
          });
        }
      }
      if (allow("exams")) {
        for (const e of db.exams ?? []) {
          out.push({ id: `exm-${e.id}`, group: "الاختبارات", label: e.title, hint: `${e.subject} · ${e.status}`, href: "/admin/exams", icon: <FileCheck2 className="size-4" /> });
        }
      }
      if (allow("live")) {
        for (const l of db.live ?? []) {
          out.push({ id: `liv-${l.id}`, group: "البثّ", label: l.title, hint: `${l.subject} · ${l.status}`, href: "/admin/live", icon: <Radio className="size-4" /> });
        }
      }
      if (allow("codes")) {
        /* الأكوادُ تُطلب بنصّها لا بوصفها — فلا تُدرَج إلّا عند البحث */
        for (const c of (db.codes ?? []).slice(0, 400)) {
          out.push({ id: `cod-${c.code}`, group: "الأكواد", label: c.code, hint: `${c.subjectName} · ${c.status}`, href: "/admin/codes", icon: <KeyRound className="size-4" /> });
        }
      }
    }

    return out;
  }, [db, me, role]); // eslint-disable-line react-hooks/exhaustive-deps

  const shown = useMemo(() => {
    const k = q.trim();
    if (!k) return hits.filter((h) => h.group === "الأقسام").slice(0, 12);
    const starts: Hit[] = [];
    const has: Hit[] = [];
    for (const h of hits) {
      if (h.label.startsWith(k)) starts.push(h);
      else if (h.label.includes(k) || (h.hint ?? "").includes(k)) has.push(h);
    }
    return [...starts, ...has].slice(0, 40);
  }, [hits, q]);

  useEffect(() => setCursor(0), [q]);

  /* السطرُ المختار يبقى في المرأى مع الأسهم */
  useEffect(() => {
    listRef.current?.querySelector<HTMLElement>(`[data-i="${cursor}"]`)?.scrollIntoView({ block: "nearest" });
  }, [cursor]);

  if (!open) return null;

  const go = (h?: Hit) => {
    if (!h) return;
    setOpen(false);
    router.push(h.href);
  };

  const grouped = GROUP_ORDER.map((g) => ({ g, items: shown.filter((h) => h.group === g) })).filter((x) => x.items.length);
  let idx = -1;

  return (
    <div
      className="fixed inset-0 z-[100] flex items-start justify-center bg-black/45 p-4 pt-[12vh] backdrop-blur-sm"
      onMouseDown={(e) => { if (e.target === e.currentTarget) setOpen(false); }}
    >
      <div className="glass w-full max-w-xl overflow-hidden rounded-3xl border border-border shadow-2xl">
        <div className="relative border-b border-border">
          <Search className="pointer-events-none absolute end-4 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
          <input
            ref={inputRef}
            value={q}
            onChange={(e) => setQ(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "ArrowDown") { e.preventDefault(); setCursor((c) => Math.min(c + 1, shown.length - 1)); }
              if (e.key === "ArrowUp") { e.preventDefault(); setCursor((c) => Math.max(c - 1, 0)); }
              if (e.key === "Enter") { e.preventDefault(); go(shown[cursor]); }
            }}
            placeholder="ابحث عن قسم أو كورس أو طالب أو خطة…"
            className="w-full bg-transparent py-4 pe-12 ps-4 text-sm outline-none"
          />
          <button onClick={() => setOpen(false)} aria-label="إغلاق" className="absolute start-3 top-1/2 grid size-8 -translate-y-1/2 place-items-center rounded-full text-muted-foreground transition hover:text-foreground">
            <X className="size-4" />
          </button>
        </div>

        <div ref={listRef} className="max-h-[52vh] overflow-y-auto p-2">
          {shown.length === 0 ? (
            <p className="p-8 text-center text-sm text-muted-foreground">لا نتيجة لِما كتبت.</p>
          ) : (
            grouped.map(({ g, items }) => (
              <div key={g} className="mb-1">
                <p className="font-kufi px-3 py-1.5 text-[10px] font-bold tracking-wide text-muted-foreground">{g}</p>
                {items.map((h) => {
                  idx++;
                  const i = idx;
                  return (
                    <button
                      key={h.id}
                      data-i={i}
                      onMouseEnter={() => setCursor(i)}
                      onClick={() => go(h)}
                      className={`flex w-full items-center gap-3 rounded-2xl px-3 py-2.5 text-right transition ${
                        cursor === i ? "bg-primary/12 text-foreground" : "text-muted-foreground hover:bg-muted/60"
                      }`}
                    >
                      <span className={cursor === i ? "text-primary" : ""}>{h.icon}</span>
                      <span className="min-w-0 flex-1">
                        <span className="block truncate text-sm font-semibold text-foreground">{h.label}</span>
                        {h.hint && <span className="block truncate text-xs">{h.hint}</span>}
                      </span>
                      {cursor === i && <CornerDownLeft className="size-3.5 shrink-0 opacity-60" />}
                    </button>
                  );
                })}
              </div>
            ))
          )}
        </div>

        <div className="flex items-center gap-3 border-t border-border px-4 py-2 text-[11px] text-muted-foreground">
          <span><kbd className="rounded border border-border px-1">↑</kbd> <kbd className="rounded border border-border px-1">↓</kbd> تنقّل</span>
          <span><kbd className="rounded border border-border px-1">Enter</kbd> فتح</span>
          <span><kbd className="rounded border border-border px-1">Esc</kbd> إغلاق</span>
          <span className="ms-auto">Ctrl + K</span>
        </div>
      </div>
    </div>
  );
}
