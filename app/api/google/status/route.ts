import { NextResponse } from "next/server";
import { googleStatus, redirectUri } from "@/lib/integrations/google";
import { getSession } from "@/lib/auth/session";
import { recordEvent } from "@/lib/auth/security";
import { loadDB } from "@/lib/db/db";
import { tenantRoute } from "@/lib/hub/context";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

/**
 * GET: حالة تكامل جوجل + **عنوان العودة الفعلي** الذي يرسله الخادم.
 * وجوده في الواجهة يحلّ خطأ redirect_uri_mismatch: يكفي نسخه كما هو
 * ولصقه في Google Cloud Console ← Authorized redirect URIs.
 */
async function GET_impl(req: Request) {
  await loadDB();
  const session = await getSession();
  if (!session || session.role !== "admin") {
    await recordEvent("unauthorized_admin", new URL(req?.url ?? "http://x/").pathname);
    return NextResponse.json({ error: "غير مصرّح" }, { status: 401 });
  }
  const id = process.env.GOOGLE_CLIENT_ID ?? "";
  const origin = new URL(req.url).origin;
  return NextResponse.json({
    ...googleStatus(),
    redirectUri: redirectUri(req),
    origin,
    // مقدّمة معرّف العميل للتأكد من تعديل العميل الصحيح في Google Cloud
    clientIdHead: id.split("-")[0] ?? "",
    pinned: Boolean(process.env.GOOGLE_REDIRECT_URI),
  });
}

/* كلُّ معالجٍ يعمل داخل سياق منصّته — انظر lib/hub/context.ts */
export const GET = tenantRoute(GET_impl);
