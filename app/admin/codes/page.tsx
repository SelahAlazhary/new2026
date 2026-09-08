"use client";

/** أكواد التفعيل — تُولَّد من الخطط، وكل كود يُستخدم مرّة واحدة فقط. */
import { useState } from "react";
import { Plus, Copy, Check, KeyRound, Trash2 } from "lucide-react";
import { PageHeader, DataTable, StatusBadge, StatCard, Card } from "@/components/dashboard/ui";
import { Button } from "@/components/ui/primitives";
import { useContent } from "@/components/content/content-provider";
import { planSubjectId } from "@/lib/auth/access";
import { cleanPrefix, DEFAULT_CODE_PREFIX } from "@/lib/business/payments";
import type { Code } from "@/lib/utils/types";

/*
  حروفٌ لا تُخلط: لا `O/0` ولا `I/1` ولا `S/5`. الكودُ يُملى في الهاتف
  ويُكتب باليد، وحرفٌ ملتبسٌ واحدٌ يعني اتّصالاً بالدعم.
*/
const CODE_ALPHABET = "ACDEFGHJKLMNPQRTUVWXYZ2346789";

/**
 * كودُ تفعيلٍ لا يُتنبّأ به.
 * ------------------------------------------------------------------
 * كان `Math.random()`. وهي **ليست عشوائيّةً آمنة**: مولّدُها في المتصفّح
 * `xorshift128+` وحالتُه تُستنتج من بضع مخرجاتٍ متتالية — فمن اشترى
 * كوداً واحداً ورأى تسلسلَه أمكنه أن يحسب ما بعده ويفعّل به بلا دفع.
 * و`.toString(36).slice(2)` تزيدها ضعفاً: تُخرج طولاً متغيّراً، فيُحشى
 * بالأصفار — وحشوٌ ثابتٌ عشوائيّةٌ ناقصة.
 *
 * و`crypto.getRandomValues` مولّدُ النظام: لا يُستنتج ولا يُعاد.
 *
 * **والقيمةُ تُؤخذ بالرفض لا بالباقي.** `byte % 29` يجعل أوائلَ الحروف
 * أكثرَ ظهوراً من أواخرها (٢٥٦ لا تقبل القسمة على ٢٩)، وانحيازٌ في
 * التوزيع نقصٌ في العشوائيّة. فما تجاوز الحدَّ يُطرح ويُسحب غيرُه.
 */
function randomChars(n: number): string {
  const max = 256 - (256 % CODE_ALPHABET.length);
  let out = "";
  while (out.length < n) {
    const buf = new Uint8Array(n * 2);
    crypto.getRandomValues(buf);
    for (const b of buf) {
      if (b >= max) continue;
      out += CODE_ALPHABET[b % CODE_ALPHABET.length];
      if (out.length === n) break;
    }
  }
  return out;
}

function genCode(prefix: string) {
  return `${cleanPrefix(prefix)}-${randomChars(4)}-${randomChars(4)}`;
}

export default function CodesPage() {
  const { db, save, content, saveContent } = useContent();
  const prefix = cleanPrefix(content.codePrefix);
  const codes = db?.codes ?? [];
  const plans = db?.plans ?? [];
  const subjects = db?.subjects ?? [];
  const [copied, setCopied] = useState<string | null>(null);
  const [planId, setPlanId] = useState<string>("");
  const [count, setCount] = useState(1);

  const copy = (c: string) => { navigator.clipboard?.writeText(c); setCopied(c); setTimeout(() => setCopied(null), 1500); };

  const generate = () => {
    const plan = plans.find((p) => p.id === planId);
    if (!plan) return;
    const target = planSubjectId(plan);
    if (!target) return;
    const existing = new Set(codes.map((c) => c.code));
    const n = Math.max(1, Math.min(count, 50));
    const fresh: Code[] = [];
    while (fresh.length < n) {
      const code = genCode(prefix);
      if (existing.has(code)) continue;
      existing.add(code);
      fresh.push({
        code,
        planId: plan.id,
        planName: plan.name,
        plan: plan.kind === "term" ? "ترم" : "شهر",
        subjectId: target,
        subjectName: target === "*" ? "كل المواد"
          : /^T[12]$/.test(target) ? `كل مواد الفصل ${target === "T2" ? "الثاني" : "الأول"}`
            : subjects.find((s) => s.id === target)?.name ?? "كورس",
        status: "متاح",
        createdAt: new Date().toISOString().slice(0, 10),
      });
    }
    save({ codes: [...fresh, ...codes] });
  };
  const remove = (code: string) => save({ codes: codes.filter((c) => c.code !== code) });

  const available = codes.filter((c) => c.status === "متاح").length;
  const used = codes.filter((c) => c.status === "مستخدم").length;
  const planOf = (c: Code) => plans.find((p) => p.id === c.planId);

  return (
    <>
      <PageHeader title="أكواد التفعيل" subtitle="اختر خطة ووَلِّد أكوادها — الكود يفعّل الخطة لحساب طالب واحد فقط" />

      {/* بادئة الأكواد — أوّل حروف كل كود */}
      <Card className="mb-6">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <h3 className="font-display font-extrabold">بادئة كود التفعيل</h3>
            <p className="text-xs text-muted-foreground">
              أوّل حروف كل كود. حروف وأرقام لاتينية وشرطة (حتى عشرة رموز) — مثل EX-EG.
              الأكواد المولَّدة من قبل تبقى بصيغتها القديمة.
            </p>
          </div>
          <label className="flex items-center gap-2">
            <input
              defaultValue={prefix}
              maxLength={10}
              dir="ltr"
              onBlur={(e) => void saveContent({ codePrefix: cleanPrefix(e.target.value) })}
              className="w-28 rounded-2xl border border-border bg-card/60 px-3 py-2 text-center font-mono text-sm uppercase outline-none focus:border-primary/50"
            />
            <span className="font-mono text-xs text-muted-foreground">-XXXX-XXXX</span>
          </label>
        </div>
      </Card>


      <div className="glass mb-6 flex flex-wrap items-end gap-3 rounded-3xl p-4">
        <label className="min-w-64 flex-1">
          <span className="mb-1 block text-xs font-semibold text-muted-foreground">الخطة</span>
          <select value={planId} onChange={(e) => setPlanId(e.target.value)} className="w-full rounded-2xl border border-border bg-card/60 px-3 py-2.5 text-sm outline-none">
            <option value="">— اختر الخطة —</option>
            {plans.map((p) => (
              <option key={p.id} value={p.id}>
                {p.name} — {p.price.toLocaleString("ar-EG")} ج.م ({p.scope === "all" ? "كل المواد" : p.scope === "term" ? `الفصل ${p.termNo === 2 ? "الثاني" : "الأول"}` : subjects.find((s) => s.id === p.subjectId)?.name ?? "كورس"})
              </option>
            ))}
          </select>
        </label>
        <label className="w-20">
          <span className="mb-1 block text-xs font-semibold text-muted-foreground">العدد</span>
          <input type="number" min={1} max={50} value={count} onChange={(e) => setCount(Number(e.target.value))} className="w-full rounded-2xl border border-border bg-card/60 px-3 py-2.5 text-sm outline-none" />
        </label>
        <Button className="px-6 py-2.5" onClick={generate} disabled={!planId}><Plus className="size-4" /> توليد</Button>
      </div>

      {plans.length === 0 && (
        <p className="mb-6 rounded-2xl border border-dashed border-border p-4 text-center text-sm text-muted-foreground">
          أضِف خطة أولاً من صفحة «الخطط» لتوليد أكواد التفعيل.
        </p>
      )}

      <div className="mb-6 grid gap-4 sm:grid-cols-3">
        <StatCard label="أكواد متاحة" value={available} tone="emerald" icon={<KeyRound className="size-5" />} index={0} />
        <StatCard label="أكواد مُستخدمة" value={used} tone="primary" icon={<Check className="size-5" />} index={1} />
        <StatCard label="إجمالي الأكواد" value={codes.length} tone="amber" icon={<KeyRound className="size-5" />} index={2} />
      </div>

      <DataTable head={["الكود", "الخطة", "النطاق", "الطالب", "تاريخ الإنشاء", "تاريخ التفعيل", "الحالة", "إجراءات"]}>
        {codes.map((c) => (
          <tr key={c.code} className="transition hover:bg-muted/50">
            <td className="px-4 py-3 font-mono text-sm font-bold tracking-wide">{c.code}</td>
            <td className="px-4 py-3">
              <span className={`rounded-full px-2 py-0.5 text-xs font-bold ${c.subjectId === "*" ? "bg-violet-500/15 text-violet-500" : "bg-sky-500/15 text-sky-500"}`}>
                {c.planName ?? planOf(c)?.name ?? (c.plan === "ترم" ? "ترم كامل" : "شهري")}
              </span>
            </td>
            <td className="px-4 py-3 text-muted-foreground">{c.subjectId === "*" ? "كل المواد" : c.subjectName}</td>
            <td className="px-4 py-3 text-muted-foreground">{c.student ?? "—"}</td>
            <td className="px-4 py-3 text-muted-foreground">{c.createdAt}</td>
            <td className="px-4 py-3 text-muted-foreground">{c.usedAt ? new Date(c.usedAt).toLocaleDateString("ar-EG", { timeZone: "Africa/Cairo" }) : "—"}</td>
            <td className="px-4 py-3"><StatusBadge status={c.status} /></td>
            <td className="px-4 py-3">
              <div className="flex items-center gap-1">
                <button onClick={() => copy(c.code)} title="نسخ" className="grid size-8 place-items-center rounded-full border border-border text-muted-foreground transition hover:border-primary hover:text-primary">
                  {copied === c.code ? <Check className="size-4 text-emerald-500" /> : <Copy className="size-4" />}
                </button>
                <button onClick={() => remove(c.code)} title="حذف" className="grid size-8 place-items-center rounded-full border border-border text-rose-500 transition hover:border-rose-500"><Trash2 className="size-4" /></button>
              </div>
            </td>
          </tr>
        ))}
        {codes.length === 0 && (<tr><td colSpan={8} className="px-4 py-10 text-center text-sm text-muted-foreground">لا توجد أكواد بعد.</td></tr>)}
      </DataTable>
    </>
  );
}
