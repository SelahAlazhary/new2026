import { NextResponse } from "next/server";
import { getSession, clearSessionCookie } from "@/lib/session";
import { loadDB, sessionUser } from "@/lib/db";
import { tenantRoute } from "@/lib/hub/context";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

async function GET_impl() {
  await loadDB();
  const session = await getSession();

  /* حساب حُذف أو أُوقف بينما الكوكي ما زالت صالحة: تُمسح الكوكي هنا
     (المسارات تستطيع الكتابة في الكوكيز بخلاف الصفحات) فتتحوّل الواجهة
     إلى وضع الزائر عند أول تحديث للمحتوى. */
  if (session?.role === "student" && !sessionUser(session)) {
    await clearSessionCookie();
    return NextResponse.json({ session: null, gone: true });
  }

  return NextResponse.json({ session });
}

/* كلُّ معالجٍ يعمل داخل سياق منصّته — انظر lib/hub/context.ts */
export const GET = tenantRoute(GET_impl);
