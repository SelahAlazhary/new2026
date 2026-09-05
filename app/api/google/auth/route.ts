import { NextResponse } from "next/server";
import crypto from "crypto";
import { cookies } from "next/headers";
import { authUrl, googleConfigured } from "@/lib/google";
import { getSession } from "@/lib/session";
import { recordEvent } from "@/lib/security";
import { loadDB } from "@/lib/db";
import { tenantRoute } from "@/lib/hub/context";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

/** GET: بدء ربط حساب جوجل — للأدمن فقط. */
async function GET_impl(req: Request) {
  await loadDB();
  const session = await getSession();
  if (!session || session.role !== "admin") {
    await recordEvent("unauthorized_admin", new URL(req?.url ?? "http://x/").pathname);
    return NextResponse.json({ error: "غير مصرّح" }, { status: 401 });
  }
  if (!googleConfigured()) {
    return NextResponse.json(
      { error: "بيانات تطبيق جوجل غير مضبوطة على الخادم (GOOGLE_CLIENT_ID / GOOGLE_CLIENT_SECRET)" },
      { status: 500 }
    );
  }

  // حماية من CSRF: قيمة عشوائية تُحفظ في كوكي وتُقارن عند العودة
  const state = crypto.randomBytes(16).toString("hex");
  const store = await cookies();
  store.set("emz_gstate", state, {
    httpOnly: true,
    sameSite: "lax",
    path: "/",
    maxAge: 600,
  });
  return NextResponse.redirect(authUrl(req, state));
}

/* كلُّ معالجٍ يعمل داخل سياق منصّته — انظر lib/hub/context.ts */
export const GET = tenantRoute(GET_impl);
