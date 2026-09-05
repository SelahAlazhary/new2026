import { NextResponse } from "next/server";
import { clientIp, limit, resetLimit, sameOrigin } from "@/lib/guard";
import {
  bindSuperDevice, checkSuperPassword, ensureFirstSuper, setSuperCookie, superDeviceLocked,
} from "@/lib/hub/session";
import { readDeviceId } from "@/lib/device";
import { audit } from "@/lib/hub/audit";
import { isHubHost } from "@/lib/hub/guard-host";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

/**
 * دخولُ أدمن المنصّات.
 * ------------------------------------------------------------------
 * سياسةُ المحاولات هنا **أضيقُ** من سياسة المنصّات: حسابٌ واحدٌ أو
 * حسابان يملكان كلَّ المنصّات، ولا فصلَ دراسيّاً يدخل منه ثلاثون طالباً
 * من عنوانٍ واحد. فعشرُ محاولاتٍ في الساعة لكلّ عنوان، ولا استثناءَ
 * للبيانات الصحيحة أثناء الحظر — بخلاف لوحة المنصّة حيث يُخشى قفلُ
 * صاحبها خارجَها.
 *
 * والفشلُ لا يُفرّق: «بيانات الدخول غير صحيحة» لبريدٍ مجهولٍ ولكلمةٍ
 * خاطئةٍ سواء — فلا يُعرف من الردّ أيُّ بريدٍ مسجَّل.
 */
export async function POST(req: Request) {
  if (!(await isHubHost())) return NextResponse.json({ error: "غير موجود" }, { status: 404 });
  if (!(await sameOrigin(req))) return NextResponse.json({ error: "طلب غير صالح" }, { status: 403 });

  const ip = await clientIp();
  const gate = limit(`hub:login:${ip}`, 10, 60 * 60_000, 30 * 60_000);
  if (!gate.ok) {
    return NextResponse.json(
      { error: "محاولات كثيرة — حاول بعد قليل" },
      { status: 429, headers: { "Retry-After": String(gate.retryAfter ?? 900) } }
    );
  }

  const { email, password, website } = (await req.json().catch(() => ({}))) as Record<string, unknown>;

  /* فخُّ الآليّات — حقلٌ لا يراه إنسان، والردُّ كردّ الخطأ فلا يُعلَم أنّه فخّ */
  if (typeof website === "string" && website.trim()) {
    return NextResponse.json({ error: "بيانات الدخول غير صحيحة" }, { status: 401 });
  }
  if (typeof email !== "string" || typeof password !== "string" || !email || !password) {
    return NextResponse.json({ error: "أدخل البريد وكلمة المرور" }, { status: 400 });
  }

  await ensureFirstSuper();
  const rec = await checkSuperPassword(email, password);
  if (!rec) {
    await audit("super.login_failed", { kind: "system", id: "-", name: email.slice(0, 80) });
    return NextResponse.json({ error: "بيانات الدخول غير صحيحة" }, { status: 401 });
  }

  /* جهازٌ واحدٌ للحساب — وصمّامُ `SUPER_DEVICE_LOCK=0` يرفعه عند فقد الجهاز */
  if (superDeviceLocked()) {
    const device = await readDeviceId();
    if (rec.deviceId && rec.deviceId !== device) {
      await audit("super.device_mismatch", { kind: "super", id: rec.id, name: rec.name });
      return NextResponse.json(
        { error: "هذا الحساب مرتبط بجهاز آخر. اضبط SUPER_DEVICE_LOCK=0 مؤقّتاً للدخول من جهاز جديد.", code: "device_mismatch" },
        { status: 403 }
      );
    }
    if (!rec.deviceId) await bindSuperDevice(rec);
  }

  resetLimit(`hub:login:${ip}`);
  await setSuperCookie({ sid: rec.id, name: rec.name, email: rec.email });
  await audit("super.login", { kind: "super", id: rec.id, name: rec.name });
  return NextResponse.json({ ok: true, name: rec.name });
}
