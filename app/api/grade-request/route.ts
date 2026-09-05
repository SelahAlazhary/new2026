import { NextResponse } from "next/server";
import { loadDB, getDB, saveDB, flushDB } from "@/lib/db";
import { getSession } from "@/lib/session";
import { sameOrigin, limit, clientIp } from "@/lib/guard";
import { can } from "@/lib/perms";
import type { GradeRequest } from "@/lib/types";
import { tenantRoute } from "@/lib/hub/context";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

/**
 * طلباتُ نقل المرحلة.
 * ------------------------------------------------------------------
 * POST  — الطالبُ يطلب النقل إلى مرحلةٍ أخرى (أو الرجوعَ إلى سابقته).
 * PATCH — الأستاذُ يقبل أو يرفض، والقبولُ وحدَه يكتب مرحلةَ الطالب.
 *
 * **ولا يكتب الطالبُ مرحلتَه بحال.** لو كُتبت من جهته لصار حقلُ المرحلة
 * زينةً: من أراد محتوى الثالث الثانوي بدّل حقلَه وأخذه. فالكتابةُ هنا،
 * بعد `can(me, "students")` وحدَها.
 */

const MAX_OPEN = 1;

function list(): GradeRequest[] {
  const db = getDB();
  if (!Array.isArray(db.gradeRequests)) db.gradeRequests = [];
  return db.gradeRequests;
}

/* ---------- الطالب يطلب ---------- */
async function POST_impl(req: Request) {
  if (!(await sameOrigin(req))) return NextResponse.json({ error: "طلب غير مسموح" }, { status: 403 });

  const session = await getSession();
  if (!session) return NextResponse.json({ error: "غير مسجّل الدخول" }, { status: 401 });

  /* طلبُ تغيير الصفّ نادرٌ — خمسةٌ في الساعة تكفي، وحدٌّ على العنوان
     يجمع محاولاتِ الحسابات من جهازٍ واحد. */
  const ip = await clientIp();
  if (!limit(`grade-req:${session.uid}`, 5, 60 * 60_000, 60 * 60_000).ok ||
      !limit(`grade-req:ip:${ip}`, 20, 60 * 60_000, 60 * 60_000).ok) {
    return NextResponse.json({ error: "طلباتٌ كثيرة — انتظر قليلاً" }, { status: 429 });
  }

  await loadDB();
  const db = getDB();
  const me = db.users.find((u) => u.id === session.uid);
  if (!me) return NextResponse.json({ error: "المستخدم غير موجود" }, { status: 404 });

  const body = (await req.json().catch(() => ({}))) as { to?: string; reason?: string };
  const to = String(body.to ?? "").trim().slice(0, 60);
  const reason = String(body.reason ?? "").trim().slice(0, 300);

  if (!to) return NextResponse.json({ error: "اختر المرحلة المطلوبة" }, { status: 400 });
  if (to === (me.grade ?? "")) {
    return NextResponse.json({ error: "هذه مرحلتك الحالية" }, { status: 400 });
  }
  /* المرحلةُ من قائمة الصفوف لا نصّاً حرّاً — وإلّا كُتب في الحقل ما ليس مرحلة. */
  if (!db.grades.some((g) => g.name === to)) {
    return NextResponse.json({ error: "مرحلة غير معروفة" }, { status: 400 });
  }

  const rows = list();
  /* طلبٌ مفتوحٌ واحد: وإلّا أغرق الطالبُ اللوحةَ بعشرين طلباً بضغطاتٍ. */
  if (rows.filter((r) => r.userId === me.id && r.status === "قيد المراجعة").length >= MAX_OPEN) {
    return NextResponse.json({ error: "لديك طلبٌ قيد المراجعة بالفعل" }, { status: 409 });
  }

  const row: GradeRequest = {
    id: `GR-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 6)}`,
    userId: me.id,
    userName: me.name,
    from: me.grade ?? "—",
    to,
    reason: reason || undefined,
    status: "قيد المراجعة",
    at: new Date().toISOString(),
  };
  rows.unshift(row);
  saveDB(db);
  await flushDB();
  return NextResponse.json({ ok: true, request: row });
}

/* ---------- الأستاذ يقرّر ---------- */
async function PATCH_impl(req: Request) {
  if (!(await sameOrigin(req))) return NextResponse.json({ error: "طلب غير مسموح" }, { status: 403 });

  const session = await getSession();
  if (!session || session.role !== "admin") {
    return NextResponse.json({ error: "غير مصرّح" }, { status: 403 });
  }

  await loadDB();
  const db = getDB();
  const me = db.users.find((u) => u.id === session.uid);
  if (!me || !can(me, "students")) {
    return NextResponse.json({ error: "لا تملك صلاحية الطلاب" }, { status: 403 });
  }

  const body = (await req.json().catch(() => ({}))) as {
    id?: string;
    decision?: "مقبول" | "مرفوض";
    note?: string;
  };
  const id = String(body.id ?? "");
  const decision = body.decision === "مقبول" ? "مقبول" : body.decision === "مرفوض" ? "مرفوض" : null;
  if (!id || !decision) return NextResponse.json({ error: "طلب ناقص" }, { status: 400 });

  const row = list().find((r) => r.id === id);
  if (!row) return NextResponse.json({ error: "الطلب غير موجود" }, { status: 404 });
  /* طلبٌ حُسم لا يُحسم مرّتين — والضغطتان المتتاليتان تصلان معاً. */
  if (row.status !== "قيد المراجعة") {
    return NextResponse.json({ error: "الطلب محسومٌ بالفعل" }, { status: 409 });
  }

  row.status = decision;
  row.decidedAt = new Date().toISOString();
  row.decidedBy = me.name;
  row.note = String(body.note ?? "").trim().slice(0, 300) || undefined;

  if (decision === "مقبول") {
    const student = db.users.find((u) => u.id === row.userId);
    /*
      المرحلةُ تُكتب هنا وحدَها.
      واشتراكاتُه لا تُمسّ: هي على كورساتٍ بأعيانها لا على مرحلة، فمسحُها
      عند النقل يُضيّع ما دفع. ومن انتقل ولم تعُد كورساتُه تناسبه فذاك
      شأنُ الاشتراك لا شأنُ المرحلة.
    */
    if (student) student.grade = row.to;
  }

  saveDB(db);
  await flushDB();
  return NextResponse.json({ ok: true, request: row });
}

/* كلُّ معالجٍ يعمل داخل سياق منصّته — انظر lib/hub/context.ts */
export const POST = tenantRoute(POST_impl);
export const PATCH = tenantRoute(PATCH_impl);
