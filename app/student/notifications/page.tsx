"use client";

import { useEffect, useState } from "react";
import { IconBell } from "@/components/brand/icons";
import { EmptyBell } from "@/components/brand/illustrations";
import { EnableNotifications } from "@/components/pwa/enable-notifications";
import { PageHeader, Card } from "@/components/dashboard/ui";
import { useContent } from "@/components/content/content-provider";

export default function StudentNotifications() {
  const { db, session, refresh } = useContent();
  /* الأكواد المستعمَلة فعلاً — تُشتقّ من طلبات الطالب نفسه لا من حالة
     مؤقّتة في المكوّن، فتبقى «مُفعَّل» بعد تحديث الصفحة. */
  const usedCodes = new Set(
    (db?.payments ?? [])
      .filter((p) => p.userId === session?.uid && p.code && p.redeemedAt)
      .map((p) => p.code as string)
  );
  const me = db?.users.find((u) => u.id === session?.uid);
  // الإشعارات تصل مفلترة من السيرفر (للجميع / لصفّه / لشعبته / له وحده)
  const items = db?.notifications ?? [];
  const read = new Set(me?.readNotifications ?? []);
  const unread = items.filter((n) => !read.has(n.id)).map((n) => n.id);

  // تعليمها كمقروءة عند فتح الصفحة
  useEffect(() => {
    if (!unread.length) return;
    (async () => {
      await fetch("/api/notifications/read", {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ids: unread }),
      });
      await refresh();
    })();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [unread.join(",")]);

  return (
    <>
      <PageHeader title="الإشعارات" subtitle="آخر الإشعارات الخاصة بك" />

      <EnableNotifications className="mb-5" />
      {items.length === 0 ? (
        <Card className="flex flex-col items-center gap-3 py-14 text-center">
          <EmptyBell className="text-primary" width={176} />
          <p className="font-display text-lg font-extrabold">لا توجد إشعارات</p>
          <p className="max-w-sm text-sm text-muted-foreground">ستظهر هنا إشعارات المعلّمة والإدارة.</p>
        </Card>
      ) : (
        <div className="space-y-3" data-reveal-group>
          {items.map((n) => {
            const isNew = !read.has(n.id);
            return (
              <div key={n.id}>
                <Card className={`!p-4 ${isNew ? "ring-1 ring-primary/30" : ""}`}>
                  <div className="flex items-start gap-3">
                    <span className="grid size-10 shrink-0 place-items-center rounded-2xl bg-primary/12 text-primary"><IconBell anim={isNew ? "swing" : undefined} className="size-5" /></span>
                    <div className="min-w-0 flex-1">
                      <p className="flex items-center gap-2 font-bold">
                        {n.title}
                        {isNew && <span className="rounded-full bg-primary/15 px-2 py-0.5 text-[10px] font-bold text-primary">جديد</span>}
                      </p>
                      <p className="mt-0.5 text-sm text-muted-foreground">{n.body}</p>
                      {n.code && (
                        <CodeBlock
                          code={n.code}
                          subjectId={n.codeSubjectId}
                          used={usedCodes.has(n.code)}
                          onDone={refresh}
                        />
                      )}
                      <p className="mt-1 text-[11px] text-muted-foreground">{new Date(n.createdAt).toLocaleString("ar-EG", { timeZone: "Africa/Cairo" })}</p>
                    </div>
                  </div>
                </Card>
              </div>
            );
          })}
        </div>
      )}
    </>
  );
}


/**
 * كود التفعيل داخل الإشعار.
 * ------------------------------------------------------------------
 * الكود يصل الطالب في إشعار، فأقصر طريق أن يُفعَّل من مكانه: زرّ واحد
 * ينادي نفس مسار التفعيل الذي تناديه صفحة الكورسات — لا منطق ثانٍ.
 */
function CodeBlock({
  code, subjectId, used, onDone,
}: {
  code: string; subjectId?: string; used?: boolean; onDone: () => Promise<void>;
}) {
  const [busy, setBusy] = useState(false);
  const [state, setState] = useState<"idle" | "done" | "used">(used ? "used" : "idle");
  const [err, setErr] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  const activate = async () => {
    setErr(null);
    setBusy(true);
    const res = await fetch("/api/redeem", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ code, subjectId }),
    });
    const data = await res.json().catch(() => ({}));
    setBusy(false);
    if (!res.ok) {
      /* الكود المستعمَل ليس خطأً يُنبَّه عليه — الطالب فعّله من مكان آخر. */
      if (/مستخدم|منته/.test(data.error ?? "")) { setState("used"); return; }
      setErr(data.error || "تعذّر التفعيل");
      return;
    }
    setState("done");
    await onDone();
  };

  return (
    <div className="mt-2.5 flex flex-wrap items-center gap-2 rounded-2xl border border-primary/30 bg-primary/5 px-3 py-2.5">
      <button
        type="button"
        onClick={() => { navigator.clipboard?.writeText(code); setCopied(true); setTimeout(() => setCopied(false), 1500); }}
        className="font-mono text-sm font-extrabold tracking-wider"
        title="اضغط للنسخ"
      >
        {copied ? "تم النسخ ✓" : code}
      </button>

      {state === "done" ? (
        <span className="rounded-full bg-emerald-500/15 px-3 py-1 text-[11px] font-bold text-emerald-600">تم التفعيل ✓</span>
      ) : state === "used" ? (
        <span className="rounded-full bg-muted px-3 py-1 text-[11px] font-bold text-muted-foreground">مُفعَّل من قبل</span>
      ) : (
        <button
          type="button"
          onClick={activate}
          disabled={busy}
          className="btn-glow mr-auto rounded-xl px-4 py-1.5 text-[11px] font-bold text-white disabled:opacity-60"
        >
          {busy ? "جارٍ التفعيل…" : "فعّل الآن"}
        </button>
      )}

      {err && <span className="w-full text-[11px] font-bold text-rose-500">{err}</span>}
    </div>
  );
}
