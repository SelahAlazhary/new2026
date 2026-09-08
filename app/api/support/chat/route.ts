import { NextResponse } from "next/server";
import { loadDB, getDB, saveDB, flushDB } from "@/lib/db/db";
import { getSession } from "@/lib/auth/session";
import { recordEvent } from "@/lib/auth/security";
import { sameOrigin, limit } from "@/lib/auth/guard";
import { clientIp } from "@/lib/auth/guard";
import { can } from "@/lib/auth/perms";
import { sendToUsers } from "@/lib/integrations/push";
import type { Ticket, ChatMessage } from "@/lib/utils/types";
import { forwardStudentMessage } from "@/lib/integrations/support-bridge";
import { tenantRoute } from "@/lib/hub/context";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

/**
 * محادثة الدعم — رسائل مباشرة بين الطالب وفريق الدعم داخل المنصّة.
 *
 * الطالب  : يرى محادثته وحدها ويرسل فيها.
 * المشرف  : يرى كل المحادثات ويردّ عليها (يتطلّب صلاحية «الدعم»).
 * الردّ على الطالب يصله إشعاراً على جهازه إن كان مفعّلاً.
 */

const MAX_LEN = 1500;
const MAX_MSGS = 300;

function now() {
  return new Date().toISOString();
}

function newMessage(from: ChatMessage["from"], text: string, authorName?: string): ChatMessage {
  return {
    id: `MSG-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 6)}`,
    from,
    text,
    at: now(),
    authorName,
    readByStudent: from === "student",
    readByAdmin: from === "support",
  };
}

/** محادثة الطالب، تُنشأ عند أول رسالة فقط. */
function threadOf(userId: string, name: string, create: boolean): Ticket | null {
  const db = getDB();
  db.tickets = db.tickets ?? [];
  let t = db.tickets.find((x) => x.userId === userId);
  if (!t && create) {
    t = {
      id: `TK-${Date.now().toString(36).toUpperCase()}`,
      userId,
      student: name,
      subject: "محادثة الدعم",
      priority: "متوسطة",
      status: "مفتوحة",
      time: new Date().toLocaleDateString("ar-EG", { timeZone: "Africa/Cairo" }),
      messages: [],
      lastAt: now(),
    };
    db.tickets.unshift(t);
  }
  return t ?? null;
}

/** ملخّص محادثة لقائمة الأدمن — بلا كامل الرسائل. */
function summary(t: Ticket) {
  const msgs = t.messages ?? [];
  const last = msgs[msgs.length - 1];
  return {
    id: t.id,
    userId: t.userId,
    student: t.student,
    status: t.status,
    priority: t.priority,
    time: t.time,
    lastAt: t.lastAt,
    lastText: last?.text.slice(0, 90),
    lastFrom: last?.from,
    total: msgs.length,
    unread: msgs.filter((m) => m.from === "student" && !m.readByAdmin).length,
  };
}

async function GET_impl(req: Request) {
  await loadDB();
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "غير مصرّح" }, { status: 401 });

  const db = getDB();
  db.tickets = db.tickets ?? [];

  // ---- الطالب: محادثته وحدها ----
  if (session.role === "student") {
    const t = threadOf(session.uid, session.name, false);
    const messages = t?.messages ?? [];
    // فتح المحادثة = قراءة ردود الدعم
    let changed = false;
    for (const m of messages) {
      if (m.from === "support" && !m.readByStudent) { m.readByStudent = true; changed = true; }
    }
    if (changed) { saveDB(db); await flushDB(); }
    return NextResponse.json({ status: t?.status ?? "مفتوحة", messages });
  }

  // ---- المشرف: كل المحادثات ----
  const me = db.users.find((u) => u.id === session.uid);
  if (!can(me, "support")) {
    await recordEvent("perm_denied", "محادثات الدعم", { userId: me?.id, username: me?.username });
    return NextResponse.json({ error: "ليست لديك صلاحية الدعم" }, { status: 403 });
  }

  const id = new URL(req.url).searchParams.get("id");
  if (id) {
    const t = db.tickets.find((x) => x.id === id);
    if (!t) return NextResponse.json({ error: "المحادثة غير موجودة" }, { status: 404 });
    // فتحها من اللوحة = قراءة رسائل الطالب
    let changed = false;
    for (const m of t.messages ?? []) {
      if (m.from === "student" && !m.readByAdmin) { m.readByAdmin = true; changed = true; }
    }
    if (changed) { saveDB(db); await flushDB(); }
    return NextResponse.json({ thread: { ...summary(t), messages: t.messages ?? [] } });
  }

  const threads = [...db.tickets]
    .sort((a, b) => (b.lastAt ?? "").localeCompare(a.lastAt ?? ""))
    .map(summary);
  return NextResponse.json({ threads });
}

async function POST_impl(req: Request) {
  if (!(await sameOrigin(req))) {
    await recordEvent("csrf_blocked", "/api/support/chat");
    return NextResponse.json({ error: "طلب غير مصرّح" }, { status: 403 });
  }
  await loadDB();
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "غير مصرّح" }, { status: 401 });

  const body = (await req.json()) as { text?: string; id?: string };
  const text = String(body.text ?? "").trim().slice(0, MAX_LEN);
  if (!text) return NextResponse.json({ error: "اكتب رسالة أولاً" }, { status: 400 });

  const db = getDB();
  db.tickets = db.tickets ?? [];

  // ---- الطالب يرسل ----
  if (session.role === "student") {
    const ip = await clientIp();
    // حدّ معقول يمنع الإغراق بلا إزعاج الاستخدام الطبيعي
    if (!limit(`chat:${session.uid}:${ip}`, 20, 60_000).ok) {
      await recordEvent("rate_limited", "إرسال رسائل دعم متتابعة", { userId: session.uid });
      return NextResponse.json({ error: "أرسلت رسائل كثيرة — انتظر قليلاً" }, { status: 429 });
    }

    const t = threadOf(session.uid, session.name, true)!;
    t.messages = [...(t.messages ?? []), newMessage("student", text)].slice(-MAX_MSGS);
    t.lastAt = now();
    if (t.status === "مغلقة") t.status = "مفتوحة"; // رسالة جديدة تُعيد فتحها
    saveDB(db);
    await flushDB();
    /* الجسر تنبيهٌ لا شرط: فشلُه لا يمنع وصولَ الرسالة إلى اللوحة. */
    void forwardStudentMessage(t, text).catch(() => { /* تجاهل */ });
    return NextResponse.json({ ok: true, messages: t.messages });
  }

  // ---- المشرف يردّ ----
  const me = db.users.find((u) => u.id === session.uid);
  if (!can(me, "support")) {
    await recordEvent("perm_denied", "ردّ الدعم", { userId: me?.id, username: me?.username });
    return NextResponse.json({ error: "ليست لديك صلاحية الدعم" }, { status: 403 });
  }

  const t = db.tickets.find((x) => x.id === body.id);
  if (!t) return NextResponse.json({ error: "المحادثة غير موجودة" }, { status: 404 });

  t.messages = [...(t.messages ?? []), newMessage("support", text, session.name)].slice(-MAX_MSGS);
  t.lastAt = now();
  if (t.status === "مفتوحة") t.status = "قيد المعالجة";
  saveDB(db);
  await flushDB();

  // إشعار على جهاز الطالب — لا يُفشل الردّ إن تعذّر
  const student = db.users.find((u) => u.id === t.userId);
  if (student) {
    try {
      await sendToUsers([student], {
        title: "ردّ من فريق الدعم",
        body: text.slice(0, 120),
        url: "/student/help",
      });
    } catch { /* تجاهل */ }
  }

  return NextResponse.json({ ok: true, messages: t.messages });
}

async function PATCH_impl(req: Request) {
  if (!(await sameOrigin(req))) {
    await recordEvent("csrf_blocked", "/api/support/chat");
    return NextResponse.json({ error: "طلب غير مصرّح" }, { status: 403 });
  }
  await loadDB();
  const session = await getSession();
  if (!session || session.role !== "admin") {
    return NextResponse.json({ error: "غير مصرّح" }, { status: 401 });
  }
  const db = getDB();
  const me = db.users.find((u) => u.id === session.uid);
  if (!can(me, "support")) {
    return NextResponse.json({ error: "ليست لديك صلاحية الدعم" }, { status: 403 });
  }

  const body = (await req.json()) as { id?: string; status?: Ticket["status"]; priority?: Ticket["priority"] };
  const t = (db.tickets ?? []).find((x) => x.id === body.id);
  if (!t) return NextResponse.json({ error: "المحادثة غير موجودة" }, { status: 404 });

  if (body.status) t.status = body.status;
  if (body.priority) t.priority = body.priority;
  saveDB(db);
  await flushDB();
  return NextResponse.json({ ok: true, thread: summary(t) });
}

/* كلُّ معالجٍ يعمل داخل سياق منصّته — انظر lib/hub/context.ts */
export const GET = tenantRoute(GET_impl);
export const POST = tenantRoute(POST_impl);
export const PATCH = tenantRoute(PATCH_impl);
