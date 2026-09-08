import { NextResponse } from "next/server";
import { clearSessionCookie } from "@/lib/auth/session";
import { loadDB } from "@/lib/db/db";
import { tenantRoute } from "@/lib/hub/context";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

async function POST_impl() {
  await loadDB();
  await clearSessionCookie();
  return NextResponse.json({ ok: true });
}

/* كلُّ معالجٍ يعمل داخل سياق منصّته — انظر lib/hub/context.ts */
export const POST = tenantRoute(POST_impl);
