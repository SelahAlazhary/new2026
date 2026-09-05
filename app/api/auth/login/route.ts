import { NextResponse } from "next/server";
import { findUserByUsername, verifyPassword, bindDevice, loadDB, getDB, saveDB } from "@/lib/db";
import { setSessionCookie } from "@/lib/session";
import { newActivity, pushActivity } from "@/lib/activity";
import { ensureDeviceId, deviceLabel } from "@/lib/device";
import { clientIp, limit, resetLimit, sameOrigin } from "@/lib/guard";
import { recordEvent, bannedUntil } from "@/lib/security";
import { tenantRoute } from "@/lib/hub/context";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

async function POST_impl(req: Request) {
  await loadDB();

  const ip = await clientIp();
  // عنوان محظور — يُرفض قبل أي معالجة
  const ban = bannedUntil(ip);
  if (ban) {
    await recordEvent("banned_hit", "محاولة دخول من عنوان محظور");
    return NextResponse.json(
      { error: "تم إيقاف المحاولات من هذا الجهاز مؤقّتاً. حاول لاحقاً." },
      { status: 429, headers: { "Retry-After": String(Math.ceil((ban - Date.now()) / 1000)) } }
    );
  }
  if (!(await sameOrigin(req))) {
    await recordEvent("csrf_blocked", "طلب دخول من أصل خارجي");
    return NextResponse.json({ error: "طلب غير صالح" }, { status: 403 });
  }

  const { username, password, website } = await req.json();

  /*
    فخُّ الآليّات.
    حقلٌ في النموذج خارجَ الشاشة، لا يراه إنسانٌ ولا يبلغه بالمفتاح.
    والآلةُ التي تملأ كلَّ حقلٍ تملؤه — فيُرفض الطلبُ هنا.

    **وهو يُفحص في الخادم لا في الشاشة**، وإلّا كان زينةً: الطلبُ يُرسَل
    من غير الشاشة أيضاً، وما لا يُفحص في الخادم لا يُفحص أصلاً.

    والردُّ كردِّ البيانات الخاطئة لا رسالةٌ تقول «كُشفتَ» — فلا يتعلّم
    الكاتبُ أنّ الحقلَ فخّ فيتخطّاه في المرّة القادمة.
  */
  if (typeof website === "string" && website.trim()) {
    await recordEvent("bot_trap", "ملء حقل الفخّ في نموذج الدخول");
    return NextResponse.json({ error: "بيانات الدخول غير صحيحة" }, { status: 401 });
  }

  /**
   * سياسة المحاولات:
   * • حدّ صلب لكل عنوان (١٢٠ محاولة/ساعة) يُرفض قبل أي عمل — يحمي الخادم من الإغراق.
   * • حدّ ليّن (٨/دقيقة و٦/٥ دقائق لكل حساب من نفس العنوان) — عند تجاوزه تُفحص البيانات
   *   ويُرفض الخطأ بـ429، لكن **البيانات الصحيحة تمرّ دائماً** فلا يستطيع مهاجم أن يقفل
   *   صاحبة المنصّة خارج لوحتها بمحاولات فاشلة متعمّدة.
   */
  const hard = limit(`login:hard:${ip}`, 120, 60 * 60_000, 30 * 60_000);
  if (!hard.ok) {
    await recordEvent("rate_limited", "إغراق محاولات الدخول", { username: String(username ?? "") });
    return NextResponse.json(
      { error: "محاولات كثيرة جداً — حاول بعد قليل" },
      { status: 429, headers: { "Retry-After": String(hard.retryAfter ?? 600) } }
    );
  }
  const byIp = limit(`login:ip:${ip}`, 8, 60_000, 2 * 60_000);
  const byUser = limit(`login:user:${String(username ?? "").toLowerCase()}:${ip}`, 6, 5 * 60_000, 5 * 60_000);
  const throttled = !byIp.ok || !byUser.ok;
  if (!username || !password) {
    return NextResponse.json({ error: "أدخل اسم المستخدم وكلمة المرور" }, { status: 400 });
  }
  const user = findUserByUsername(String(username).trim());
  const correct = Boolean(user) && verifyPassword(String(password), user!);

  if (!correct) {
    await recordEvent("login_failed", throttled ? "محاولة فاشلة أثناء التقييد" : "بيانات دخول خاطئة", {
      username: String(username ?? "").slice(0, 120),
    });
    if (throttled) {
      const retry = Math.max(byIp.retryAfter ?? 0, byUser.retryAfter ?? 0, 60);
      return NextResponse.json(
        { error: `محاولات كثيرة — انتظر ${Math.ceil(retry / 60)} دقيقة ثم أعد المحاولة` },
        { status: 429, headers: { "Retry-After": String(retry) } }
      );
    }
    return NextResponse.json({ error: "بيانات الدخول غير صحيحة" }, { status: 401 });
  }
  if (!user!.active) {
    return NextResponse.json({ error: "الحساب موقوف — تواصل مع الدعم" }, { status: 403 });
  }

  /**
   * جهاز واحد لكل حساب — للطالب وللمشرف على السواء.
   * صمّام أمان: ADMIN_DEVICE_LOCK=0 يوقف القفل عن المشرفين وحدهم،
   * لاستعادة الدخول إن فُقد جهاز المالكة (موثّق في DEPLOY.md).
   */
  const lockAdmins = process.env.ADMIN_DEVICE_LOCK !== "0";
  if (user!.role === "student" || (user!.role === "admin" && lockAdmins)) {
    const device = await ensureDeviceId();
    if (user!.deviceId && user!.deviceId !== device) {
      await recordEvent("device_mismatch", "دخول من جهاز غير المرتبط", { userId: user!.id, username: user!.username });
      return NextResponse.json(
        { error: user!.role === "admin"
            ? "هذا الحساب مرتبط بجهاز آخر. اسمحي بجهاز جديد من قسم المشرفين."
            : "هذا الحساب مسجَّل على جهاز آخر. للدخول من هذا الجهاز تواصل مع الدعم للسماح به.", code: "device_mismatch" },
        { status: 403 }
      );
    }
    if (!user!.deviceId) bindDevice(user!.id, device, deviceLabel(req.headers.get("user-agent")));
  }

  resetLimit(`login:ip:${ip}`);
  resetLimit(`login:user:${String(username).toLowerCase()}:${ip}`);
  /* الدخولُ حدثٌ في سجلّ الطالب لا في سجلّ الأمان وحده — منه تُعرف
     عادتُه: متى يدخل وكم مرّة. */
  if (user!.role === "student") {
    const db = getDB();
    const u = db.users.find((x: { id: string }) => x.id === user!.id);
    if (u) {
      pushActivity(u, newActivity("login", undefined, deviceLabel(req.headers.get("user-agent"))));
      saveDB(db);
    }
  }
  await setSessionCookie({ uid: user!.id, role: user!.role, name: user!.name });
  await recordEvent("login_ok", `دخول ${user!.role === "admin" ? "أدمن" : "طالب"}`, { userId: user!.id, username: user!.username });
  return NextResponse.json({ ok: true, role: user!.role, name: user!.name });
}

/* كلُّ معالجٍ يعمل داخل سياق منصّته — انظر lib/hub/context.ts */
export const POST = tenantRoute(POST_impl);
