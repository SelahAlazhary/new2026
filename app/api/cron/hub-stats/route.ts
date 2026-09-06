import { NextResponse } from "next/server";
import { computeAllStats } from "@/lib/hub/stats";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";
export const maxDuration = 120;

/**
 * تحديثُ إحصاءات المنصّات — مرّةً كلَّ ساعة (أو يدويّاً بسرّ).
 * يُحدّث `tenant.stats` لكلّ منصّة نشطة ليعرض الـHub بيانات حيّة بلا
 * تحميل كلّ قاعدة.
 */
export async function GET(req: Request) {
  const secret = process.env.CRON_SECRET;
  const auth = req.headers.get("authorization");
  const isVercelCron = req.headers.get("x-vercel-cron") !== null;
  if (!isVercelCron && (!secret || auth !== `Bearer ${secret}`)) {
    return NextResponse.json({ error: "غير مصرّح" }, { status: 401 });
  }

  const result = await computeAllStats();
  return NextResponse.json({ ok: result.errors.length === 0, ...result });
}
