import { NextResponse } from "next/server";
import { pendingDomains, verifyDomain } from "@/lib/hub/domains";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";
export const maxDuration = 60;

/**
 * فحصُ DNS للدومينات المعلّقة — كلَّ ١٥ دقيقة (أو يدويّاً بسرّ).
 * عند نجاح التحقّق تتحوّل الحالةُ إلى `active` وتُربط بالمنصّة.
 */
export async function GET(req: Request) {
  const secret = process.env.CRON_SECRET;
  const auth = req.headers.get("authorization");
  const isVercelCron = req.headers.get("x-vercel-cron") !== null;
  if (!isVercelCron && (!secret || auth !== `Bearer ${secret}`)) {
    return NextResponse.json({ error: "غير مصرّح" }, { status: 401 });
  }

  const pending = await pendingDomains();
  const results: { domain: string; status: string }[] = [];

  for (const d of pending) {
    const updated = await verifyDomain(d.id);
    if (updated) results.push({ domain: updated.domain, status: updated.status });
  }

  return NextResponse.json({ ok: true, checked: results.length, results });
}
