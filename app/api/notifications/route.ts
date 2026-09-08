import { NextResponse } from "next/server";
import { getDB, saveDB, loadDB, flushDB } from "@/lib/db/db";
import { pushNotification, pushConfigured } from "@/lib/integrations/push";
import { getSession } from "@/lib/auth/session";
import { recordEvent } from "@/lib/auth/security";
import type { Notification } from "@/lib/utils/types";
import { tenantRoute } from "@/lib/hub/context";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

/**
 * POST: إنشاء إشعار وإرساله فوراً لأجهزة جمهوره — للأدمن فقط.
 * { title, body, grade?, track?, userId?, link? }
 */
async function POST_impl(req: Request) {
  await loadDB();
  const session = await getSession();
  if (!session || session.role !== "admin") {
    await recordEvent("unauthorized_admin", new URL(req?.url ?? "http://x/").pathname);
    return NextResponse.json({ error: "غير مصرّح" }, { status: 401 });
  }
  const b = await req.json().catch(() => null);
  const title = String(b?.title ?? "").trim();
  const body = String(b?.body ?? "").trim();
  if (!title || !body) return NextResponse.json({ error: "العنوان والنص مطلوبان" }, { status: 400 });

  const userId = b?.userId ? String(b.userId) : undefined;
  const n: Notification = {
    id: `N-${Date.now()}`,
    title,
    body,
    createdAt: new Date().toISOString(),
    userId,
    // استهداف طالب بعينه يلغي فلترة الصف/الشعبة
    grade: userId ? undefined : b?.grade ? String(b.grade) : undefined,
    track: userId ? undefined : b?.track ? String(b.track) : undefined,
    link: b?.link ? String(b.link) : undefined,
  };

  const db = getDB();
  db.notifications = [n, ...db.notifications];
  saveDB(db);

  // الدفع إلى الأجهزة (لا يمنع نجاح الحفظ إن تعطّل)
  let delivery = { sent: 0, failed: 0 };
  if (pushConfigured()) {
    try {
      delivery = await pushNotification(n);
    } catch {
      /* الإشعار محفوظ في المنصّة على أي حال */
    }
  }

  await flushDB();

  return NextResponse.json({ ok: true, notification: n, delivery, pushConfigured: pushConfigured() });
}

/** DELETE: حذف إشعار — للأدمن فقط. */
async function DELETE_impl(req: Request) {
  await loadDB();
  const session = await getSession();
  if (!session || session.role !== "admin") {
    await recordEvent("unauthorized_admin", new URL(req?.url ?? "http://x/").pathname);
    return NextResponse.json({ error: "غير مصرّح" }, { status: 401 });
  }
  const { id } = await req.json().catch(() => ({ id: "" }));
  const db = getDB();
  db.notifications = db.notifications.filter((n) => n.id !== id);
  saveDB(db);
  await flushDB();
  return NextResponse.json({ ok: true });
}

/* كلُّ معالجٍ يعمل داخل سياق منصّته — انظر lib/hub/context.ts */
export const POST = tenantRoute(POST_impl);
export const DELETE = tenantRoute(DELETE_impl);
