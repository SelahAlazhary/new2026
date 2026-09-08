import { NextResponse } from "next/server";
import { setUserProgress, getDB, userOwnsSubject, loadDB, flushDB } from "@/lib/db/db";
import { getSession } from "@/lib/auth/session";
import { limit } from "@/lib/auth/guard";
import { tenantRoute } from "@/lib/hub/context";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

/** POST: تحديث تقدّم الطالب في كورس مُفعّل له — { subjectId, value } */
async function POST_impl(req: Request) {
  await loadDB();
  const session = await getSession();
  if (!session || session.role !== "student") {
    return NextResponse.json({ error: "غير مصرّح" }, { status: 401 });
  }

  /* كبحُ الإغراق — بالحساب لا بالعنوان، فالمدرسةُ تُخرج عشراتِ الطلاب من
     عنوانٍ واحد ولا يُقفل على البريء. والحدُّ كريمٌ لأنّ التقدّمَ يُرسَل مراراً أثناء المشاهدة. */
  const flood = limit(`progress:${session.uid}`, 120, 5 * 60_000, 2 * 60_000);
  if (!flood.ok) {
    return NextResponse.json({ error: "محاولاتٌ كثيرة — انتظر قليلاً" }, { status: 429 });
  }
  const { subjectId, value } = await req.json();
  const me = getDB().users.find((u) => u.id === session.uid);
  // الاشتراك الساري هو مصدر الصلاحية (لا الحقل القديم enrolled)
  if (!me || !userOwnsSubject(me, String(subjectId))) {
    return NextResponse.json({ error: "الكورس غير مُفعّل" }, { status: 403 });
  }
  const progress = setUserProgress(session.uid, String(subjectId), Number(value));
  await flushDB();
  return NextResponse.json({ ok: true, progress });
}

/* كلُّ معالجٍ يعمل داخل سياق منصّته — انظر lib/hub/context.ts */
export const POST = tenantRoute(POST_impl);
