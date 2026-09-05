import { NextResponse } from "next/server";
import { markNotificationsRead, loadDB } from "@/lib/db";
import { getSession } from "@/lib/session";
import { tenantRoute } from "@/lib/hub/context";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

/** POST: تعليم إشعارات الطالب كمقروءة — { ids: string[] } */
async function POST_impl(req: Request) {
  await loadDB();
  const session = await getSession();
  if (!session || session.role !== "student") {
    return NextResponse.json({ error: "غير مصرّح" }, { status: 401 });
  }
  const body = await req.json().catch(() => null);
  const ids = Array.isArray(body?.ids) ? body.ids.map(String) : [];
  markNotificationsRead(session.uid, ids);
  return NextResponse.json({ ok: true });
}

/* كلُّ معالجٍ يعمل داخل سياق منصّته — انظر lib/hub/context.ts */
export const POST = tenantRoute(POST_impl);
