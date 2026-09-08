import { NextResponse } from "next/server";
import { loadDB, getDB, saveDB, flushDB, hashPassword } from "@/lib/db/db";
import { getSession } from "@/lib/auth/session";
import { recordEvent } from "@/lib/auth/security";
import { sameOrigin, passwordProblem, invalidUsername } from "@/lib/auth/guard";
import { ALL_PERMS, isOwner, type AdminPerm } from "@/lib/auth/perms";
import type { User } from "@/lib/utils/types";
import { tenantRoute } from "@/lib/hub/context";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

/**
 * إدارة المشرفين — للمالكة وحدها.
 * GET     : قائمة المشرفين (بلا كلمات مرور).
 * POST    : إضافة مشرف ببريد وكلمة مرور وصلاحيات محدّدة.
 * PATCH   : تعديل الصلاحيات/الإيقاف/السماح بجهاز جديد/تغيير كلمة المرور.
 * DELETE  : حذف مشرف (المالكة لا تُحذف، ولا تحذف نفسها).
 */

/** المالكة الحالية أو null — كل المسارات هنا تمرّ من هنا. */
async function requireOwner() {
  await loadDB();
  const session = await getSession();
  if (!session || session.role !== "admin") return { error: "غير مصرّح", status: 401 as const };
  const me = getDB().users.find((u) => u.id === session.uid);
  if (!isOwner(me)) return { error: "هذا القسم لمالكة المنصّة فقط", status: 403 as const };
  return { me: me! };
}

/** الشكل المعروض في اللوحة — بلا كلمة مرور ولا ملح. */
function view(u: User) {
  return {
    id: u.id,
    name: u.name,
    username: u.username,
    active: u.active,
    owner: Boolean(u.owner),
    adminPerms: u.owner ? ALL_PERMS : (u.adminPerms ?? []),
    deviceLabel: u.deviceLabel,
    deviceBoundAt: u.deviceBoundAt,
    hasDevice: Boolean(u.deviceId),
    createdAt: u.createdAt,
  };
}

/** تنقية الصلاحيات القادمة من الواجهة. */
function cleanPerms(input: unknown): AdminPerm[] {
  if (!Array.isArray(input)) return [];
  return input.filter((p): p is AdminPerm => ALL_PERMS.includes(p as AdminPerm));
}

async function GET_impl() {
  const gate = await requireOwner();
  if ("error" in gate) {
    await recordEvent("unauthorized_admin", "/api/admins");
    return NextResponse.json({ error: gate.error }, { status: gate.status });
  }
  const admins = getDB().users.filter((u) => u.role === "admin");
  return NextResponse.json({ admins: admins.map(view), me: gate.me.id });
}

async function POST_impl(req: Request) {
  if (!(await sameOrigin(req))) {
    await recordEvent("csrf_blocked", "/api/admins");
    return NextResponse.json({ error: "طلب غير مصرّح" }, { status: 403 });
  }
  const gate = await requireOwner();
  if ("error" in gate) {
    await recordEvent("unauthorized_admin", "/api/admins");
    return NextResponse.json({ error: gate.error }, { status: gate.status });
  }

  const body = (await req.json()) as { name?: string; username?: string; password?: string; perms?: unknown };
  const name = String(body.name ?? "").trim();
  const username = String(body.username ?? "").trim().toLowerCase();
  const password = String(body.password ?? "");

  if (name.length < 2) return NextResponse.json({ error: "اكتب اسم المشرف" }, { status: 400 });
  const badUser = invalidUsername(username);
  if (badUser) return NextResponse.json({ error: badUser }, { status: 400 });
  const badPass = passwordProblem(password);
  if (badPass) return NextResponse.json({ error: badPass }, { status: 400 });

  const db = getDB();
  if (db.users.some((u) => u.username.toLowerCase() === username)) {
    return NextResponse.json({ error: "هذا البريد مسجَّل بالفعل" }, { status: 409 });
  }

  const { passwordHash, salt } = hashPassword(password);
  const admin: User = {
    id: `ADM-${Date.now().toString(36).toUpperCase()}`,
    name,
    role: "admin",
    username,
    passwordHash,
    salt,
    active: true,
    owner: false,
    adminPerms: cleanPerms(body.perms),
    createdAt: new Date().toISOString(),
  };
  db.users.push(admin);
  saveDB(db);
  await flushDB();
  await recordEvent("admin_added", `إضافة مشرف: ${username}`, { userId: admin.id, username });
  return NextResponse.json({ ok: true, admin: view(admin) });
}

async function PATCH_impl(req: Request) {
  if (!(await sameOrigin(req))) {
    await recordEvent("csrf_blocked", "/api/admins");
    return NextResponse.json({ error: "طلب غير مصرّح" }, { status: 403 });
  }
  const gate = await requireOwner();
  if ("error" in gate) {
    await recordEvent("unauthorized_admin", "/api/admins");
    return NextResponse.json({ error: gate.error }, { status: gate.status });
  }

  const body = (await req.json()) as {
    id?: string;
    perms?: unknown;
    active?: boolean;
    resetDevice?: boolean;
    password?: string;
    transferOwner?: boolean;
  };
  const db = getDB();
  const target = db.users.find((u) => u.id === body.id && u.role === "admin");
  if (!target) return NextResponse.json({ error: "المشرف غير موجود" }, { status: 404 });

  /**
   * نقل ملكية المنصّة إلى مشرف آخر.
   *
   * خطوة لا رجعة فيها من طرف واحد: بعدها يملك الطرف الآخر كل شيء
   * — بما فيه سحب صلاحياتك — ولن تستطيعي استردادها إلا بموافقته.
   * لذا: المالكة وحدها تنفّذها، والهدف يجب أن يكون مشرفاً مفعّلاً.
   */
  if (body.transferOwner) {
    if (target.owner) {
      return NextResponse.json({ error: "هذا الحساب هو المالك بالفعل" }, { status: 400 });
    }
    if (!target.active) {
      return NextResponse.json({ error: "فعّلي حساب المشرف أولاً قبل نقل الملكية" }, { status: 400 });
    }

    target.owner = true;
    target.adminPerms = [...ALL_PERMS];

    // المالكة السابقة تبقى مشرفة بكل الصلاحيات عدا إدارة المشرفين
    gate.me.owner = false;
    gate.me.adminPerms = ALL_PERMS.filter((p) => p !== "team");

    saveDB(db);
    await flushDB();
    await recordEvent("admin_changed", `نقل الملكية إلى ${target.username}`, {
      userId: target.id,
      username: target.username,
    });
    return NextResponse.json({ ok: true, transferred: true, admin: view(target) });
  }

  // المالكة: يجوز تحرير جهازها وكلمة مرورها فقط — لا صلاحياتها ولا إيقافها
  if (target.owner && (body.perms !== undefined || body.active !== undefined)) {
    return NextResponse.json({ error: "لا يمكن تعديل صلاحيات المالكة" }, { status: 400 });
  }

  if (body.perms !== undefined) target.adminPerms = cleanPerms(body.perms);
  if (typeof body.active === "boolean") target.active = body.active;

  // السماح بجهاز جديد: نفكّ الارتباط فيرتبط تلقائياً عند أوّل دخول
  if (body.resetDevice) {
    target.deviceId = undefined;
    target.deviceLabel = undefined;
    target.deviceBoundAt = undefined;
    target.deviceResetAt = new Date().toISOString();
  }

  if (body.password) {
    const bad = passwordProblem(body.password);
    if (bad) return NextResponse.json({ error: bad }, { status: 400 });
    const next = hashPassword(body.password);
    target.passwordHash = next.passwordHash;
    target.salt = next.salt;
  }

  saveDB(db);
  await flushDB();
  await recordEvent("admin_changed", `تعديل مشرف: ${target.username}`, { userId: target.id, username: target.username });
  return NextResponse.json({ ok: true, admin: view(target) });
}

async function DELETE_impl(req: Request) {
  if (!(await sameOrigin(req))) {
    await recordEvent("csrf_blocked", "/api/admins");
    return NextResponse.json({ error: "طلب غير مصرّح" }, { status: 403 });
  }
  const gate = await requireOwner();
  if ("error" in gate) {
    await recordEvent("unauthorized_admin", "/api/admins");
    return NextResponse.json({ error: gate.error }, { status: gate.status });
  }

  const id = new URL(req.url).searchParams.get("id");
  const db = getDB();
  const target = db.users.find((u) => u.id === id && u.role === "admin");
  if (!target) return NextResponse.json({ error: "المشرف غير موجود" }, { status: 404 });
  if (target.owner) return NextResponse.json({ error: "لا يمكن حذف مالكة المنصّة" }, { status: 400 });
  if (target.id === gate.me.id) return NextResponse.json({ error: "لا يمكنك حذف حسابك" }, { status: 400 });

  db.users = db.users.filter((u) => u.id !== target.id);
  saveDB(db);
  await flushDB();
  await recordEvent("admin_removed", `حذف مشرف: ${target.username}`, { userId: target.id, username: target.username });
  return NextResponse.json({ ok: true });
}

/* كلُّ معالجٍ يعمل داخل سياق منصّته — انظر lib/hub/context.ts */
export const GET = tenantRoute(GET_impl);
export const POST = tenantRoute(POST_impl);
export const PATCH = tenantRoute(PATCH_impl);
export const DELETE = tenantRoute(DELETE_impl);
