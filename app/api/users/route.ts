import { NextResponse } from "next/server";
import { createUser, setUserActive, setUserCredentials, deleteUser, bindDevice, resetDevice, loadDB, flushDB, getDB } from "@/lib/db";
import { getSession } from "@/lib/session";
import { ensureDeviceId, deviceLabel } from "@/lib/device";
import { clientIp, limit, sameOrigin, passwordProblem, invalidUsername } from "@/lib/guard";
import { signupProblem, showsTrack, showsBranch, normalizePhone } from "@/lib/signup-rules";
import { sourceOf } from "@/lib/activity";
import { recordEvent, bannedUntil } from "@/lib/security";
import { tenantRoute } from "@/lib/hub/context";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

/** POST: إنشاء حساب.
 *  - الأدمن: ينشئ أي حساب (طالب/أدمن) ويحدّد التفعيل.
 *  - غير مسجّل: تسجيل ذاتي كطالب (بانتظار التفعيل).
 */
async function POST_impl(req: Request) {
  await loadDB();
  const session = await getSession();
  const body = await req.json();
  const isAdmin = session?.role === "admin";

  if (!body.name || !body.username || !body.password) {
    return NextResponse.json({ error: "البيانات ناقصة" }, { status: 400 });
  }

  /**
   * التسجيل الذاتي: كل الحقول إجبارية ومتحقَّق من صيغتها — والفرض هنا لا
   * في المتصفّح وحده، لأن تحقّق الواجهة يمكن تخطّيه بطلب مباشر.
   * القواعد في lib/signup-rules.ts يتشاركها الطرفان فلا يختلفان.
   * الأدمن مستثنى: هو ينشئ حسابات مشرفين أيضاً ولا تلزمها بيانات الطالب.
   */
  if (!isAdmin) {
    const db = getDB();
    const problem = signupProblem(body, db.grades.map((g) => g.name), db.content.terms ?? []);
    if (problem) return NextResponse.json({ error: problem }, { status: 400 });
  }

  // حماية التسجيل الذاتي: حظر، أصل الطلب، حدّ المحاولات، وقوّة البيانات
  if (!isAdmin) {
    const ip = await clientIp();
    if (bannedUntil(ip)) {
      await recordEvent("banned_hit", "محاولة تسجيل من عنوان محظور");
      return NextResponse.json({ error: "تم إيقاف المحاولات من هذا الجهاز مؤقّتاً" }, { status: 429 });
    }
    if (!(await sameOrigin(req))) {
      await recordEvent("csrf_blocked", "تسجيل من أصل خارجي");
      return NextResponse.json({ error: "طلب غير صالح" }, { status: 403 });
    }
    const gate = limit(`signup:${ip}`, 3, 60 * 60_000, 60 * 60_000);
    if (!gate.ok) {
      await recordEvent("rate_limited", "تجاوز حدّ إنشاء الحسابات");
      return NextResponse.json({ error: "تم إنشاء حسابات كثيرة من هذا الجهاز — حاول لاحقاً" }, { status: 429 });
    }
    const badUser = invalidUsername(String(body.username));
    if (badUser) return NextResponse.json({ error: badUser }, { status: 400 });
    const badPass = passwordProblem(String(body.password));
    if (badPass) return NextResponse.json({ error: badPass }, { status: 400 });
  }

  try {
    const user = createUser({
      name: body.name,
      username: body.username,
      password: body.password,
      role: isAdmin && body.role === "admin" ? "admin" : "student",
      phone: normalizePhone(body.phone) || undefined,
      grade: body.grade,
      stage: body.stage,
      eduSystem: body.eduSystem,
      // الشعبة والفرع لا معنى لهما خارج شرطيهما — لا يُحفظان إلا معهما
      track: showsTrack(body) ? body.track : undefined,
      branch: showsBranch(body) ? body.branch : undefined,
      gender: body.gender === "female" ? "female" : body.gender === "male" ? "male" : undefined,
      school: body.school,
      governorate: body.governorate,
      active: true, // الحساب مُفعّل فوراً — لا يحتاج موافقة الإدارة
      /* من أين جاء؟ يُشتقّ مرّةً واحدة عند التسجيل ويبقى — فهو صفةُ
         الحساب لا صفةُ الزيارة، ولا يُقرأ بعدها من ترويسة. */
      source: sourceOf(req.headers.get("referer"), String(body.utm ?? "")),
      landing: String(body.landing ?? "").slice(0, 120) || undefined,
    });
    // التسجيل الذاتي يربط الحساب بجهاز صاحبه فوراً (حساب واحد = جهاز واحد)
    if (user.role === "student" && !isAdmin) {
      const device = await ensureDeviceId();
      bindDevice(user.id, device, deviceLabel(req.headers.get("user-agent")));
    }
    await flushDB();
    await recordEvent("signup", isAdmin ? "أنشأه الأدمن" : "تسجيل ذاتي", { userId: user.id, username: user.username });
    await flushDB();
    return NextResponse.json({ ok: true, user });
  } catch (e) {
    return NextResponse.json({ error: (e as Error).message }, { status: 409 });
  }
}

/** PATCH: تفعيل/إيقاف حساب · السماح بجهاز جديد · تغيير بيانات الدخول — للأدمن فقط.
 *  { id, active } · { id, action: "resetDevice" } · { id, action: "credentials", username?, password? }
 */
async function PATCH_impl(req: Request) {
  await loadDB();
  const session = await getSession();
  if (session?.role !== "admin") {
    await recordEvent("unauthorized_admin", "PATCH /api/users");
    return NextResponse.json({ error: "غير مصرّح" }, { status: 401 });
  }
  const body = await req.json();
  const { id, active, action } = body;

  if (action === "credentials") {
    const { username, password } = await Promise.resolve(body);
    // نفس قواعد التسجيل: بريد صحيح وكلمة مرور قوية
    if (username) {
      const bad = invalidUsername(String(username));
      if (bad) return NextResponse.json({ error: bad }, { status: 400 });
    }
    if (password) {
      const bad = passwordProblem(String(password));
      if (bad) return NextResponse.json({ error: bad }, { status: 400 });
    }
    if (!username && !password) {
      return NextResponse.json({ error: "لا يوجد ما يُغيَّر" }, { status: 400 });
    }
    const res = setUserCredentials(String(id), { username, password });
    if (!res.ok) return NextResponse.json({ error: res.error }, { status: 400 });
    await flushDB();
    await recordEvent("signup", "الأدمن غيّر بيانات دخول طالب", { userId: String(id) });
    await flushDB();
    return NextResponse.json({ ok: true, user: res.user });
  }

  if (action === "resetDevice") {
    const user = resetDevice(String(id));
    if (!user) return NextResponse.json({ error: "غير موجود" }, { status: 404 });
    await flushDB();
    return NextResponse.json({ ok: true, user });
  }

  const user = setUserActive(id, Boolean(active));
  if (!user) return NextResponse.json({ error: "غير موجود" }, { status: 404 });
  await flushDB();
  return NextResponse.json({ ok: true, user });
}

/** DELETE: حذف حساب — للأدمن فقط. */
async function DELETE_impl(req: Request) {
  await loadDB();
  const session = await getSession();
  if (session?.role !== "admin") {
    await recordEvent("unauthorized_admin", "DELETE /api/users");
    return NextResponse.json({ error: "غير مصرّح" }, { status: 401 });
  }
  const { id } = await req.json();
  const ok = deleteUser(id);
  if (!ok) return NextResponse.json({ error: "تعذّر الحذف" }, { status: 400 });
  await flushDB();
  return NextResponse.json({ ok: true });
}

/* كلُّ معالجٍ يعمل داخل سياق منصّته — انظر lib/hub/context.ts */
export const POST = tenantRoute(POST_impl);
export const PATCH = tenantRoute(PATCH_impl);
export const DELETE = tenantRoute(DELETE_impl);
