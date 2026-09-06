import { NextResponse } from "next/server";
import { loadDB, flushDB } from "@/lib/db";
import { createBackup } from "@/lib/backup";
import { listTenants } from "@/lib/hub/registry";
import { runInTenant } from "@/lib/hub/context";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";
export const maxDuration = 60;

/**
 * نسخة احتياطية مجدولة (Vercel Cron).
 * تُستدعى يومياً من الجدول المعرّف في vercel.json، ولا تُنفَّذ إلا بترويسة
 * التفويض الصحيحة — فلا يستطيع أحد استدعاؤها من الخارج.
 *
 * وتمرّ على **كلّ المنصّات** واحدةً واحدة: لكلٍّ سياقُها وقاعدتُها
 * ونسختُها. والمعطّلةُ والمؤرشفةُ تُتخطّى — لا نسخَ لما لا يعمل.
 * عطلُ منصّةٍ لا يوقف الباقيات: يُسجَّل ويُكمَل.
 */
export async function GET(req: Request) {
  const secret = process.env.CRON_SECRET;
  const auth = req.headers.get("authorization");
  const isVercelCron = req.headers.get("x-vercel-cron") !== null;

  if (!isVercelCron && (!secret || auth !== `Bearer ${secret}`)) {
    return NextResponse.json({ error: "غير مصرّح" }, { status: 401 });
  }

  /*
    دورةُ الفوترة تُشغَّل مع النسخ الاحتياطي — لا جدولةٌ ثانية.
    خططُ فيرسل المجانية تسمح بجدولةٍ يوميّةٍ واحدة، فتُجمَع المهمّتان في
    نداءٍ واحد. وعطلُ إحداهما لا يُوقف الأخرى.
  */
  let billing: unknown = null;
  try {
    const { runBillingCycle } = await import("@/lib/hub/billing/cycle");
    billing = await runBillingCycle();
  } catch (e) {
    billing = { error: (e as Error).message };
  }

  const tenants = (await listTenants()).filter((t) => t.status === "active" || t.status === "suspended");
  const results: { tenant: string; ok: boolean; size?: number; error?: string }[] = [];

  for (const tenant of tenants) {
    try {
      const r = await runInTenant({ id: tenant.id, slug: tenant.slug, tenant }, async () => {
        await loadDB();
        const result = await createBackup("auto");
        await flushDB();
        return result;
      });
      results.push({ tenant: tenant.slug, ok: r.ok, size: r.size, error: r.ok ? undefined : r.drive.error || r.firebase.error });
    } catch (e) {
      results.push({ tenant: tenant.slug, ok: false, error: (e as Error).message });
    }
  }

  return NextResponse.json({ ok: results.every((r) => r.ok), count: results.length, results, billing });
}
