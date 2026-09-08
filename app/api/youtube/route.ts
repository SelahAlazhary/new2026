import { NextResponse } from "next/server";
import { getDB, saveDB, loadDB, flushDB } from "@/lib/db/db";
import { syncChannel, youtubeApiConfigured } from "@/lib/integrations/youtube";
import { getSession } from "@/lib/auth/session";
import { recordEvent } from "@/lib/auth/security";
import type { YoutubeVideo } from "@/lib/utils/types";
import { tenantRoute } from "@/lib/hub/context";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

/** PUT: حفظ/مسح مفتاح YouTube Data API — للأدمن فقط (يُحفظ على الخادم ولا يُعاد إطلاقاً). */
async function PUT_impl(req: Request) {
  await loadDB();
  const session = await getSession();
  if (!session || session.role !== "admin") {
    await recordEvent("unauthorized_admin", "/api/youtube");
    return NextResponse.json({ error: "غير مصرّح" }, { status: 401 });
  }
  const body = await req.json().catch(() => null);
  const key = String(body?.apiKey ?? "").trim();
  const db = getDB();
  db.integrations = db.integrations ?? {};
  db.integrations.youtubeApiKey = key || undefined;
  saveDB(db);
  await flushDB();
  return NextResponse.json({ ok: true, apiConfigured: youtubeApiConfigured() });
}

/** GET: حالة الربط (للأدمن) — هل مفتاح الواجهة مضبوط؟ */
async function GET_impl() {
  await loadDB();
  const session = await getSession();
  if (!session || session.role !== "admin") {
    await recordEvent("unauthorized_admin", "/api/youtube");
    return NextResponse.json({ error: "غير مصرّح" }, { status: 401 });
  }
  const yt = getDB().youtube;
  return NextResponse.json({
    apiConfigured: youtubeApiConfigured(),
    keyFromEnv: Boolean(process.env.YOUTUBE_API_KEY),
    channelId: yt?.channelId ?? null,
    syncedAt: yt?.syncedAt ?? null,
    source: yt?.source ?? null,
    count: yt?.videos?.length ?? 0,
  });
}

/**
 * POST: مزامنة القناة — { channel }
 * تُبقي إعدادات كل فيديو (إخفاء/تثبيت/ترتيب) كما هي عند إعادة المزامنة.
 */
async function POST_impl(req: Request) {
  await loadDB();
  const session = await getSession();
  if (!session || session.role !== "admin") {
    await recordEvent("unauthorized_admin", "/api/youtube");
    return NextResponse.json({ error: "غير مصرّح" }, { status: 401 });
  }
  const body = await req.json().catch(() => null);
  const input = String(body?.channel ?? "").trim();
  if (!input) return NextResponse.json({ error: "أدخل رابط القناة أو معرّفها" }, { status: 400 });

  let result;
  try {
    result = await syncChannel(input);
  } catch (e) {
    return NextResponse.json({ error: (e as Error).message }, { status: 400 });
  }

  const db = getDB();
  const previous = new Map((db.youtube?.videos ?? []).map((v) => [v.id, v]));
  const videos: YoutubeVideo[] = result.videos.map((v, i) => {
    const old = previous.get(v.id);
    return { ...v, hidden: old?.hidden, featured: old?.featured, order: old?.order ?? i };
  });

  db.youtube = {
    ...(db.youtube ?? {}),
    channelId: result.channelId,
    title: result.title ?? db.youtube?.title,
    thumbnail: result.thumbnail ?? db.youtube?.thumbnail,
    subscribers: result.subscribers,
    videoCount: result.videoCount ?? videos.length,
    url: `https://www.youtube.com/channel/${result.channelId}`,
    source: result.source,
    syncedAt: new Date().toISOString(),
    videos,
  };
  saveDB(db);

  return NextResponse.json({
    ok: true,
    youtube: db.youtube,
    source: result.source,
    apiConfigured: youtubeApiConfigured(),
  });
}

/** DELETE: فصل القناة ومسح فيديوهاتها من المنصّة. */
async function DELETE_impl() {
  await loadDB();
  const session = await getSession();
  if (!session || session.role !== "admin") {
    await recordEvent("unauthorized_admin", "/api/youtube");
    return NextResponse.json({ error: "غير مصرّح" }, { status: 401 });
  }
  const db = getDB();
  db.youtube = undefined;
  saveDB(db);
  await flushDB();
  return NextResponse.json({ ok: true });
}

/* كلُّ معالجٍ يعمل داخل سياق منصّته — انظر lib/hub/context.ts */
export const GET = tenantRoute(GET_impl);
export const POST = tenantRoute(POST_impl);
export const PUT = tenantRoute(PUT_impl);
export const DELETE = tenantRoute(DELETE_impl);
