import { NextResponse } from "next/server";
import { createMeet, deleteMeetEvent, googleStatus } from "@/lib/integrations/google";
import { getDB, saveDB, loadDB, flushDB } from "@/lib/db/db";
import { getSession } from "@/lib/auth/session";
import { recordEvent } from "@/lib/auth/security";
import type { Live, LiveAudience } from "@/lib/utils/types";
import { tenantRoute } from "@/lib/hub/context";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

/** صياغة موعد عربي للعرض في البطاقات. */
function arabicTime(iso: string): string {
  return new Date(iso).toLocaleString("ar-EG", { timeZone: "Africa/Cairo", weekday: "long",
    day: "numeric",
    month: "long",
    hour: "numeric",
    minute: "2-digit", });
}

/**
 * POST: إنشاء جلسة بث بـ Google Meet وإضافتها لقائمة البث — للأدمن فقط.
 * { title, subject, subjectId?, grade, track?, startsAt, durationMinutes, audience, status }
 */
async function POST_impl(req: Request) {
  await loadDB();
  const session = await getSession();
  if (!session || session.role !== "admin") {
    await recordEvent("unauthorized_admin", new URL(req?.url ?? "http://x/").pathname);
    return NextResponse.json({ error: "غير مصرّح" }, { status: 401 });
  }
  const st = googleStatus();
  if (!st.configured) return NextResponse.json({ error: "تطبيق جوجل غير مضبوط على الخادم" }, { status: 500 });
  if (!st.connected) return NextResponse.json({ error: "اربط حساب جوجل أولاً" }, { status: 400 });

  const b = await req.json().catch(() => null);
  const title = String(b?.title ?? "").trim();
  const startsAt = String(b?.startsAt ?? "").trim();
  const duration = Number(b?.durationMinutes) || 60;
  if (!title) return NextResponse.json({ error: "أدخل عنوان الجلسة" }, { status: 400 });
  if (!startsAt) return NextResponse.json({ error: "حدّد موعد الجلسة" }, { status: 400 });

  const audience: LiveAudience = b?.audience === "all" ? "all" : "subscribers";
  const db = getDB();
  const subjectId = b?.subjectId ? String(b.subjectId) : undefined;
  const subject = subjectId ? db.subjects.find((s) => s.id === subjectId) : undefined;

  let meet;
  try {
    meet = await createMeet({
      title,
      description: `جلسة بث مباشر — ${db.content.brand}`,
      startsAt,
      durationMinutes: duration,
    });
  } catch (e) {
    return NextResponse.json({ error: (e as Error).message }, { status: 502 });
  }

  const entry: Live = {
    id: `LV-${Date.now()}`,
    title,
    subject: subject?.name || String(b?.subject ?? "") || "—",
    subjectId,
    grade: String(b?.grade ?? "") || subject?.grade || "كل الصفوف",
    track: b?.track ? String(b.track) : subject?.track,
    time: arabicTime(meet.startsAt),
    startsAt: meet.startsAt,
    endsAt: meet.endsAt,
    viewers: 0,
    url: meet.meetUrl,
    audience,
    meetEventId: meet.eventId,
    createdBy: "google",
    kind: b?.kind === "meeting" ? "meeting" : "broadcast",
    status: b?.status === "مباشر" ? "مباشر" : "مجدول",
  };

  db.live = [entry, ...db.live];
  saveDB(db);
  await flushDB();
  return NextResponse.json({ ok: true, live: entry });
}

/** DELETE: حذف جلسة + حدثها في تقويم جوجل — { id } */
async function DELETE_impl(req: Request) {
  await loadDB();
  const session = await getSession();
  if (!session || session.role !== "admin") {
    await recordEvent("unauthorized_admin", new URL(req?.url ?? "http://x/").pathname);
    return NextResponse.json({ error: "غير مصرّح" }, { status: 401 });
  }
  const { id } = await req.json().catch(() => ({ id: "" }));
  const db = getDB();
  const entry = db.live.find((l) => l.id === id);
  if (!entry) return NextResponse.json({ error: "الجلسة غير موجودة" }, { status: 404 });

  if (entry.meetEventId) {
    try {
      await deleteMeetEvent(entry.meetEventId);
    } catch {
      /* الحدث قد يكون محذوفاً من التقويم — نُكمل الحذف محلياً */
    }
  }
  db.live = db.live.filter((l) => l.id !== id);
  saveDB(db);
  await flushDB();
  return NextResponse.json({ ok: true });
}

/* كلُّ معالجٍ يعمل داخل سياق منصّته — انظر lib/hub/context.ts */
export const POST = tenantRoute(POST_impl);
export const DELETE = tenantRoute(DELETE_impl);
