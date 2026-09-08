import { NextResponse } from "next/server";
import { redeemCode, loadDB, flushDB } from "@/lib/db/db";
import { getSession } from "@/lib/auth/session";
import { clientIp, limit } from "@/lib/auth/guard";
import { recordEvent, bannedUntil } from "@/lib/auth/security";
import { tenantRoute } from "@/lib/hub/context";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

/** POST: تفعيل كورس بكود — للطالب المسجّل فقط. */
async function POST_impl(req: Request) {
  await loadDB();
  const session = await getSession();
  if (!session || session.role !== "student") {
    return NextResponse.json({ error: "سجّل الدخول كطالب أولاً" }, { status: 401 });
  }
  const ip = await clientIp();
  if (bannedUntil(ip)) {
    await recordEvent("banned_hit", "محاولة تفعيل من عنوان محظور");
    return NextResponse.json({ error: "تم إيقاف المحاولات مؤقّتاً" }, { status: 429 });
  }
  /*
    حدّان لا واحد: على الحساب وعلى العنوان.
    ------------------------------------------------------------------
    الحدُّ على الحساب وحدَه يُلتَفّ عليه بإنشاء حسابات: عشرُ محاولاتٍ
    لكلّ حسابٍ تصير مئةً بعشرة حسابات، والتسجيلُ مجّانيّ. فيُضاف حدٌّ
    على العنوان يجمع محاولاتِ الحسابات كلِّها من جهازٍ واحد.

    والعنوانُ أوسعُ (٢٥ في نصف ساعة) لأنّ الجامعةَ والمدرسةَ تُخرج
    عشراتِ الطلاب من عنوانٍ واحد — فلا يُقفل على البريء ليُمنع المسيء.

    وحسابُ ما يُحمى: الكودُ ثمانُ خاناتٍ من تسعةٍ وعشرين حرفاً، أي
    ‏٢٩⁸ ≈ خمسُمئة مليار احتمال. وبخمسٍ وعشرين محاولةً في نصف ساعةٍ
    يحتاج التخمينُ ملايينَ السنين — والحدُّ يجعل العشوائيّةَ تنفع.
  */
  const gate = limit(`redeem:${session.uid}`, 10, 10 * 60_000, 30 * 60_000);
  const ipGate = limit(`redeem:ip:${ip}`, 25, 30 * 60_000, 30 * 60_000);
  if (!gate.ok || !ipGate.ok) {
    await recordEvent("rate_limited", "تجاوز حدّ محاولات أكواد التفعيل", { userId: session.uid });
    return NextResponse.json({ error: "محاولات كثيرة — انتظر قليلاً ثم أعد المحاولة" }, { status: 429 });
  }

  const { code, subjectId } = await req.json();
  if (!code) return NextResponse.json({ error: "أدخل كود التفعيل" }, { status: 400 });

  const result = await redeemCode(session.uid, String(code), subjectId ? String(subjectId) : undefined);
  if (!result.ok) {
    await recordEvent("bad_code", `كود مرفوض: ${result.error}`, { userId: session.uid });
    return NextResponse.json({ error: result.error }, { status: 400 });
  }
  return NextResponse.json(result);
}

/* كلُّ معالجٍ يعمل داخل سياق منصّته — انظر lib/hub/context.ts */
export const POST = tenantRoute(POST_impl);
