import { NextResponse } from "next/server";
import { savePushSub, removePushSub, loadDB, flushDB } from "@/lib/db";
import { publicVapidKey, pushConfigured } from "@/lib/push";
import { getSession } from "@/lib/session";
import { tenantRoute } from "@/lib/hub/context";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

/** GET: المفتاح العام (VAPID) — مُصمَّم ليكون عاماً، ويلزم المتصفّح للاشتراك. */
async function GET_impl() {
  await loadDB();
  return NextResponse.json({ configured: pushConfigured(), key: publicVapidKey() });
}

/** POST: تسجيل جهاز الطالب لاستقبال الإشعارات. */
async function POST_impl(req: Request) {
  await loadDB();
  const session = await getSession();
  if (!session || session.role !== "student") {
    return NextResponse.json({ error: "غير مصرّح" }, { status: 401 });
  }
  const b = await req.json().catch(() => null);
  const endpoint = String(b?.endpoint ?? "");
  const p256dh = String(b?.keys?.p256dh ?? "");
  const auth = String(b?.keys?.auth ?? "");
  if (!endpoint || !p256dh || !auth) {
    return NextResponse.json({ error: "بيانات الاشتراك ناقصة" }, { status: 400 });
  }
  const ua = req.headers.get("user-agent") ?? undefined;
  savePushSub(session.uid, { endpoint, p256dh, auth, ua });
  await flushDB();
  return NextResponse.json({ ok: true });
}

/** DELETE: إلغاء تسجيل الجهاز. */
async function DELETE_impl(req: Request) {
  await loadDB();
  const session = await getSession();
  if (!session || session.role !== "student") {
    return NextResponse.json({ error: "غير مصرّح" }, { status: 401 });
  }
  const { endpoint } = await req.json().catch(() => ({ endpoint: "" }));
  if (endpoint) removePushSub(session.uid, String(endpoint));
  await flushDB();
  return NextResponse.json({ ok: true });
}

/* كلُّ معالجٍ يعمل داخل سياق منصّته — انظر lib/hub/context.ts */
export const GET = tenantRoute(GET_impl);
export const POST = tenantRoute(POST_impl);
export const DELETE = tenantRoute(DELETE_impl);
