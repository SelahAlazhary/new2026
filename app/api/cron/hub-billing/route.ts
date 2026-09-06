import { NextResponse } from "next/server";
import { runBillingCycle } from "@/lib/hub/billing/cycle";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";
export const maxDuration = 60;

/**
 * دورةُ الفوترة المجدولة — لا تُنفَّذ إلّا بجدولة فيرسل أو سرّ التفويض.
 * تُنشئ فواتيرَ التجديد، وتؤخّر المتأخّرة، وتُوقف المنتهية بعد المهلة.
 */
export async function GET(req: Request) {
  const secret = process.env.CRON_SECRET;
  const auth = req.headers.get("authorization");
  const isVercelCron = req.headers.get("x-vercel-cron") !== null;
  if (!isVercelCron && (!secret || auth !== `Bearer ${secret}`)) {
    return NextResponse.json({ error: "غير مصرّح" }, { status: 401 });
  }
  const result = await runBillingCycle();
  return NextResponse.json({ ok: true, ...result });
}
