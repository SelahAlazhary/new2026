import { NextResponse } from "next/server";
import { getDB, saveDB, loadDB, flushDB } from "@/lib/db/db";
import { deleteMeetEvent } from "@/lib/integrations/google";
import { pushNotification, pushConfigured } from "@/lib/integrations/push";
import { getSession } from "@/lib/auth/session";
import { recordEvent } from "@/lib/auth/security";
import type { Live, Notification } from "@/lib/utils/types";
import { tenantRoute } from "@/lib/hub/context";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

/** إشعار «بدأ البث» لجمهور الجلسة (على شاشة الهاتف). */
async function announce(live: Live) {
  const db = getDB();
  const n: Notification = {
    id: `N-${Date.now()}`,
    title: `🔴 بدأ البث: ${live.title}`,
    body: `${live.subject}${live.time ? ` · ${live.time}` : ""} — اضغط للانضمام الآن`,
    createdAt: new Date().toISOString(),
    grade: live.grade && live.grade !== "كل الصفوف" ? live.grade : undefined,
    track: live.track,
    link: "/student/live",
  };
  db.notifications = [n, ...db.notifications];
  saveDB(db);
  if (pushConfigured()) {
    try {
      return await pushNotification(n);
    } catch {
      /* الإشعار محفوظ داخل المنصّة على أي حال */
    }
  }
  return { sent: 0, failed: 0 };
}

/**
 * PATCH: تغيير حالة جلسة — للأدمن فقط.
 * { id, status }  ·  status = "مباشر" يُطلق إشعاراً فورياً، و"منتهي" يُنهي البث حالاً.
 */
async function PATCH_impl(req: Request) {
  await loadDB();
  const session = await getSession();
  if (!session || session.role !== "admin") {
    await recordEvent("unauthorized_admin", new URL(req?.url ?? "http://x/").pathname);
    return NextResponse.json({ error: "غير مصرّح" }, { status: 401 });
  }
  const { id, status } = await req.json().catch(() => ({}));
  const db = getDB();
  const live = db.live.find((l) => l.id === String(id));
  if (!live) return NextResponse.json({ error: "الجلسة غير موجودة" }, { status: 404 });

  const wasLive = live.status === "مباشر";
  live.status = status === "مباشر" ? "مباشر" : status === "منتهي" ? "منتهي" : "مجدول";

  if (live.status === "منتهي") {
    live.endedAt = new Date().toISOString();
    live.url = undefined;              // إنهاء فوري: الرابط لا يعود يعمل داخل المنصّة
    if (live.meetEventId) {
      try {
        await deleteMeetEvent(live.meetEventId);  // يُنهي الاجتماع/البث عند جوجل
      } catch {
        /* قد يكون الحدث محذوفاً مسبقاً */
      }
      live.meetEventId = undefined;
    }
  }
  saveDB(db);

  // إشعار فوري عند بدء البث فقط (لا يتكرّر إن كان مباشراً أصلاً)
  let delivery = { sent: 0, failed: 0 };
  if (live.status === "مباشر" && !wasLive) delivery = await announce(live);

  await flushDB();

  return NextResponse.json({ ok: true, live, delivery });
}

/** DELETE: حذف جلسة — يُنهي البث/الاجتماع فوراً ثم يحذفها. */
async function DELETE_impl(req: Request) {
  await loadDB();
  const session = await getSession();
  if (!session || session.role !== "admin") {
    await recordEvent("unauthorized_admin", new URL(req?.url ?? "http://x/").pathname);
    return NextResponse.json({ error: "غير مصرّح" }, { status: 401 });
  }
  const { id } = await req.json().catch(() => ({ id: "" }));
  const db = getDB();
  const live = db.live.find((l) => l.id === String(id));
  if (!live) return NextResponse.json({ error: "الجلسة غير موجودة" }, { status: 404 });

  if (live.meetEventId) {
    try {
      await deleteMeetEvent(live.meetEventId);
    } catch {
      /* لا يمنع الحذف محلياً */
    }
  }
  db.live = db.live.filter((l) => l.id !== live.id);
  saveDB(db);
  await flushDB();
  return NextResponse.json({ ok: true });
}

/* كلُّ معالجٍ يعمل داخل سياق منصّته — انظر lib/hub/context.ts */
export const PATCH = tenantRoute(PATCH_impl);
export const DELETE = tenantRoute(DELETE_impl);
