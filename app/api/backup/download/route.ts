import { NextResponse } from "next/server";
import { getDB, loadDB } from "@/lib/db";
import { getSession } from "@/lib/session";
import { tenantRoute } from "@/lib/hub/context";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

/**
 * GET: تنزيل نسخة احتياطية كاملة على جهاز الأدمن (ملف JSON).
 * تُستثنى أسرار التكاملات (رموز جوجل) من الملف المنزَّل.
 */
async function GET_impl() {
  await loadDB();
  const session = await getSession();
  if (!session || session.role !== "admin") {
    return NextResponse.json({ error: "غير مصرّح" }, { status: 401 });
  }

  const { integrations, ...rest } = getDB();
  const snapshot = {
    ...rest,
    integrations: integrations
      ? { google: integrations.google ? { connected: integrations.google.connected, email: integrations.google.email } : undefined }
      : undefined,
    _exportedAt: new Date().toISOString(),
  };

  const pad = (n: number) => String(n).padStart(2, "0");
  const d = new Date();
  const name = `emz-backup-${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}_${pad(d.getHours())}${pad(d.getMinutes())}.json`;

  return new NextResponse(JSON.stringify(snapshot, null, 2), {
    headers: {
      "Content-Type": "application/json; charset=utf-8",
      "Content-Disposition": `attachment; filename="${name}"`,
      "Cache-Control": "no-store",
    },
  });
}

/* كلُّ معالجٍ يعمل داخل سياق منصّته — انظر lib/hub/context.ts */
export const GET = tenantRoute(GET_impl);
