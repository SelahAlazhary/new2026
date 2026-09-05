import { NextResponse } from "next/server";
import { disconnectGoogle } from "@/lib/google";
import { getSession } from "@/lib/session";
import { recordEvent } from "@/lib/security";
import { loadDB } from "@/lib/db";
import { tenantRoute } from "@/lib/hub/context";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

/** POST: فكّ ربط حساب جوجل وإلغاء الرموز عند جوجل — للأدمن فقط. */
async function POST_impl() {
  await loadDB();
  const session = await getSession();
  if (!session || session.role !== "admin") {
    await recordEvent("unauthorized_admin", "/api/google/disconnect");
    return NextResponse.json({ error: "غير مصرّح" }, { status: 401 });
  }
  await disconnectGoogle();
  return NextResponse.json({ ok: true });
}

/* كلُّ معالجٍ يعمل داخل سياق منصّته — انظر lib/hub/context.ts */
export const POST = tenantRoute(POST_impl);
