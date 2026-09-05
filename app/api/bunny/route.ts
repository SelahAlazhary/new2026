import { NextResponse } from "next/server";
import { getDB, saveDB, loadDB, flushDB } from "@/lib/db";
import { bunnyConfig, bunnyConfigured } from "@/lib/bunny";
import { getSession } from "@/lib/session";
import { recordEvent } from "@/lib/security";
import { tenantRoute } from "@/lib/hub/context";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

/**
 * إعدادُ Bunny Stream — للأدمن وحدَه.
 * ------------------------------------------------------------------
 * **والمفتاحُ لا يُعاد أبداً.** `GET` يقول «مضبوطٌ أم لا» ولا يقول ما هو:
 * سرٌّ يُكتب مرّةً ولا يُقرأ، فلو سُرقت جلسةُ مشرفٍ لم يُسرق معها مفتاحُ
 * المكتبة. ومن نسيه أعاد نسخَه من لوحة Bunny — وهذا أرخصُ من تسريبه.
 */

function guard(session: { role?: string } | null) {
  return Boolean(session && session.role === "admin");
}

/** PUT: حفظ/مسح المفتاح ومعرّف المكتبة ومهلة الرابط. */
async function PUT_impl(req: Request) {
  await loadDB();
  const session = await getSession();
  if (!guard(session)) {
    await recordEvent("unauthorized_admin", "/api/bunny");
    return NextResponse.json({ error: "غير مصرّح" }, { status: 401 });
  }

  const body = await req.json().catch(() => null);
  const db = getDB();
  db.integrations = db.integrations ?? {};
  const cur = db.integrations.bunny ?? {};

  /*
    المفتاحُ لا يُمسّ إلّا إن أُرسل.
    الواجهةُ لا تعرف قيمتَه فلا تستطيع إعادةَ إرساله، فلو كان الغيابُ
    مسحاً لضاع المفتاحُ كلَّما بُدّل معرّفُ المكتبة وحدَه. والمسحُ يُطلب
    صراحةً بـ`clearKey`.
  */
  const next = { ...cur };
  if (body?.clearKey === true) next.tokenKey = undefined;
  else if (typeof body?.tokenKey === "string" && body.tokenKey.trim()) {
    next.tokenKey = body.tokenKey.trim();
  }

  if (typeof body?.libraryId === "string") next.libraryId = body.libraryId.trim() || undefined;
  if (body?.ttl !== undefined) {
    const n = Number(body.ttl);
    next.ttl = Number.isFinite(n) ? Math.min(21_600, Math.max(60, Math.round(n))) : undefined;
  }

  db.integrations.bunny = next;
  saveDB(db);
  await flushDB();

  return NextResponse.json({
    ok: true,
    configured: bunnyConfigured(),
    libraryId: next.libraryId ?? null,
    ttl: bunnyConfig().ttl,
    keyFromEnv: Boolean(process.env.BUNNY_TOKEN_KEY),
  });
}

/** GET: الحالة — وجودُ المفتاح لا قيمتُه. */
async function GET_impl() {
  await loadDB();
  const session = await getSession();
  if (!guard(session)) {
    await recordEvent("unauthorized_admin", "/api/bunny");
    return NextResponse.json({ error: "غير مصرّح" }, { status: 401 });
  }
  const b = getDB().integrations?.bunny;
  return NextResponse.json({
    configured: bunnyConfigured(),
    keyFromEnv: Boolean(process.env.BUNNY_TOKEN_KEY),
    libraryId: b?.libraryId ?? null,
    ttl: bunnyConfig().ttl,
  });
}

/* كلُّ معالجٍ يعمل داخل سياق منصّته — انظر lib/hub/context.ts */
export const GET = tenantRoute(GET_impl);
export const PUT = tenantRoute(PUT_impl);
