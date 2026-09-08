"use client";

/**
 * الصيانة.
 * ------------------------------------------------------------------
 * ليس كلُّ خللٍ يستدعي إغلاقَ المنصّة: قد يتعطّل البثُّ وحدَه، أو تُراجَع
 * الخططُ قبل ترمٍ جديد، أو يُغلق بابُ التسجيل ليومٍ واحد. فالإغلاقُ هنا
 * على مستويين — الكلُّ أو قسمٌ بعينه.
 *
 * والمعاينةُ حيّةٌ بالمكوّن نفسِه الذي سيراه الطالب، فلا تُنشر رسالةٌ
 * لم تُقرأ قبل نشرها.
 */

import { useState } from "react";
import { Wrench, Power, Loader2, Check, Eye } from "lucide-react";
import { PageHeader, Card } from "@/components/dashboard/ui";
import { useContent } from "@/components/content/content-provider";
import { MaintenancePanel } from "@/components/brand/maintenance";
import { Section } from "@/components/dashboard/section";
import {
  SCOPE_GROUPS, SCOPE_LABEL, DEFAULT_TITLE, DEFAULT_MESSAGE,
  type MaintScope, type Maintenance,
} from "@/lib/business/maintenance";

export default function MaintenancePage() {
  const { content, saveContent } = useContent();
  const m: Maintenance = content.maintenance ?? {};
  const [busy, setBusy] = useState(false);
  const [draft, setDraft] = useState({
    title: m.title ?? "",
    message: m.message ?? "",
    until: m.until ?? "",
  });

  const scopes = m.scopes ?? [];

  const save = async (patch: Partial<Maintenance>) => {
    setBusy(true);
    await saveContent({ maintenance: { ...m, ...patch } });
    setBusy(false);
  };

  const toggleScope = (sc: MaintScope) =>
    void save({ scopes: scopes.includes(sc) ? scopes.filter((x) => x !== sc) : [...scopes, sc] });

  const on = Boolean(m.all);
  const anyDown = on || scopes.length > 0;

  return (
    <>
      <PageHeader
        title="الصيانة"
        subtitle="أغلق المنصّة كلّها أو قسماً بعينه — والمشرفون يمرّون دائماً"
      />

      <Section className={`mb-5 ${on ? "border-amber-500/50 bg-amber-500/[0.07]" : ""}`} title="المفتاح الكبير">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div className="min-w-0">
            <p className="mt-1 max-w-xl text-[11px] leading-relaxed text-muted-foreground">
              لوحُ صيانةٍ يحلّ محلَّ كلّ شيء لكلّ زائرٍ وطالب. والمشرفون يمرّون ويرون المنصّة
              كاملةً — صيانةٌ تحجب من يصلحها ليست صيانة — ويُنبَّهون بشريطٍ أعلى الصفحة.
            </p>
          </div>
          <button
            type="button"
            disabled={busy}
            onClick={() => void save({ all: !on })}
            className={`inline-flex shrink-0 items-center gap-2 rounded-2xl px-5 py-3 text-xs font-bold transition disabled:opacity-60 ${
              on ? "bg-amber-500 text-amber-950" : "bg-primary text-white"
            }`}
          >
            {busy ? <Loader2 className="size-4 animate-spin" /> : <Power className="size-4" />}
            {on ? "المنصّة مغلقة — أعِد فتحها" : "أغلق المنصّة للصيانة"}
          </button>
        </div>
      </Section>

      <Section className="mb-5" title="الأقسام">
        <p className="mb-4 text-[11px] leading-relaxed text-muted-foreground">
          القسمُ المختار وحدَه يُغلق ويبقى ما سواه يعمل — فلا تُغلق المنصّة من أجل جزءٍ منها.
          {on && " (إغلاقُ الكلّ يغلقها جميعاً الآن على أيّ حال.)"}
        </p>

        <div className="grid gap-5 sm:grid-cols-2">
          {SCOPE_GROUPS.map((g) => (
            <div key={g.title}>
              <p className="mb-2 text-xs font-bold text-muted-foreground">{g.title}</p>
              <div className="flex flex-wrap gap-2">
                {g.items.map((sc) => {
                  const down = scopes.includes(sc);
                  return (
                    <button
                      key={sc}
                      type="button"
                      disabled={busy}
                      onClick={() => toggleScope(sc)}
                      className={`rounded-2xl border px-3 py-2 text-[11px] font-bold transition disabled:opacity-60 ${
                        down
                          ? "border-amber-500 bg-amber-500/15 text-amber-700 dark:text-amber-400"
                          : "border-border text-muted-foreground hover:border-primary/40"
                      }`}
                    >
                      {down && <Wrench className="ms-1 inline size-3" />} {SCOPE_LABEL[sc]}
                    </button>
                  );
                })}
              </div>
            </div>
          ))}
        </div>
      </Section>

      {/* ---------- النصّ ---------- */}
      <div className="grid gap-5 lg:grid-cols-2">
        <Card>
          <p className="font-display mb-3 font-bold">نصّ الصيانة</p>
          <div className="grid gap-3">
            <label className="block">
              <span className="mb-1 block text-[11px] font-semibold text-muted-foreground">العنوان</span>
              <input
                className="inp"
                value={draft.title}
                placeholder={DEFAULT_TITLE}
                onChange={(e) => setDraft({ ...draft, title: e.target.value })}
              />
            </label>
            <label className="block">
              <span className="mb-1 block text-[11px] font-semibold text-muted-foreground">الرسالة</span>
              <textarea
                rows={3}
                className="inp"
                value={draft.message}
                placeholder={DEFAULT_MESSAGE}
                onChange={(e) => setDraft({ ...draft, message: e.target.value })}
              />
            </label>
            <label className="block">
              <span className="mb-1 block text-[11px] font-semibold text-muted-foreground">
                العودة المتوقّعة (نصّ حرّ — يُترك فارغاً فلا يظهر)
              </span>
              <input
                className="inp"
                value={draft.until}
                placeholder="بعد ساعتين · غداً ٩ صباحاً"
                onChange={(e) => setDraft({ ...draft, until: e.target.value })}
              />
            </label>
            <button
              type="button"
              disabled={busy}
              onClick={() => void save(draft)}
              className="inline-flex w-fit items-center gap-1.5 rounded-2xl bg-primary px-5 py-2.5 text-xs font-bold text-white disabled:opacity-60"
            >
              {busy ? <Loader2 className="size-4 animate-spin" /> : <Check className="size-4" />}
              احفظ النصّ
            </button>
            <p className="text-[10px] leading-relaxed text-muted-foreground">
              الفارغُ يقع على النصّ الأصلي، فلا تظهر شاشةُ صيانةٍ بلا كلمة.
            </p>
          </div>
        </Card>

        <Card>
          <p className="font-display mb-1 flex items-center gap-2 font-bold">
            <Eye className="size-4 text-primary" /> ما يراه الطالب
          </p>
          <p className="mb-3 text-[11px] text-muted-foreground">
            بالمكوّن نفسِه الذي سيُعرض عليه — لا رسمٌ يحاكيه.
          </p>
          <div className="rounded-3xl border border-dashed border-border bg-muted/30 p-2">
            <MaintenancePanel
              title={draft.title.trim() || DEFAULT_TITLE}
              message={draft.message.trim() || DEFAULT_MESSAGE}
              until={draft.until.trim()}
            />
          </div>
        </Card>
      </div>

      {anyDown && (
        <Card className="mt-5 border-amber-500/40 bg-amber-500/[0.06]">
          <p className="text-xs font-bold text-amber-700 dark:text-amber-400">
            مغلقٌ الآن: {on ? "المنصّة كلّها" : scopes.map((x) => SCOPE_LABEL[x]).join(" · ")}
          </p>
          <p className="mt-1 text-[11px] text-muted-foreground">
            لا تنسَ إعادة الفتح — الطلاب لا يرون ما تراه أنت.
          </p>
        </Card>
      )}
    </>
  );
}
