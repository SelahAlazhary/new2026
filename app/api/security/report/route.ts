import { NextResponse } from "next/server";
import { loadDB } from "@/lib/db";
import { recordEvent } from "@/lib/security";
import { tenantRoute } from "@/lib/hub/context";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

/**
 * نقطة تسجيل داخلية: تُحوَّل إليها الطلبات التي صدّتها الطبقة الأمامية
 * (أصل خارجي أو فحص مسارات) لتُسجَّل في سجلّ الأمان ثم تُرفض.
 * لا تُستدعى من الواجهة إطلاقاً.
 */
async function handle(req: Request) {
  await loadDB();
  const raw = req.headers.get("x-blocked-kind");
  const kind = raw === "probe" ? "path_probe" : raw === "bot" ? "bot_blocked" : "csrf_blocked";
  const target = (req.headers.get("x-blocked-path") ?? "").slice(0, 120);
  const origin = (req.headers.get("origin") ?? "").slice(0, 120);
  const ua = (req.headers.get("user-agent") ?? "").slice(0, 120);
  await recordEvent(kind, `${target}${kind === "bot_blocked" && ua ? ` · ${ua}` : origin ? ` ← ${origin}` : ""}`);
  /* البوتُ والفحّاصُ يُردّان ٤٠٤ بلا تفصيل — لا يُعلَمان أنّهما عُرفا. */
  const status = kind === "csrf_blocked" ? 403 : 404;
  return NextResponse.json({ error: status === 404 ? "غير موجود" : "طلب غير صالح" }, { status });
}

/* يُسجَّل الحدثُ في سجلّ المنصّة التي وقع عليها — لا في سجلٍّ مشترك */
const scoped = tenantRoute(handle);
export const GET = scoped;
export const POST = scoped;
export const PUT = scoped;
export const PATCH = scoped;
export const DELETE = scoped;
