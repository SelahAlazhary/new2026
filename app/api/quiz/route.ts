import { NextResponse } from "next/server";
import { gradeQuiz, loadDB, flushDB } from "@/lib/db/db";
import { getSession } from "@/lib/auth/session";
import { limit } from "@/lib/auth/guard";
import { tenantRoute } from "@/lib/hub/context";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

/** POST: تسليم إجابات اختبار درس — التصحيح يتم على السيرفر.
 *  { subjectId, lessonId, answers: number[] }
 */
async function POST_impl(req: Request) {
  await loadDB();
  const session = await getSession();
  if (!session || session.role !== "student") {
    return NextResponse.json({ error: "غير مصرّح" }, { status: 401 });
  }

  /* كبحُ الإغراق — بالحساب لا بالعنوان، فالمدرسةُ تُخرج عشراتِ الطلاب من
     عنوانٍ واحد ولا يُقفل على البريء. والطالبُ لا يسلّم ثلاثين واجباً في خمس دقائق. */
  const flood = limit(`quiz:${session.uid}`, 30, 5 * 60_000, 5 * 60_000);
  if (!flood.ok) {
    return NextResponse.json({ error: "محاولاتٌ كثيرة — انتظر قليلاً" }, { status: 429 });
  }
  const body = await req.json().catch(() => null);
  const subjectId = String(body?.subjectId ?? "");
  const lessonId = String(body?.lessonId ?? "");
  const answers = Array.isArray(body?.answers) ? body.answers.map((a: unknown) => Number(a)) : null;
  if (!subjectId || !lessonId || !answers) {
    return NextResponse.json({ error: "بيانات ناقصة" }, { status: 400 });
  }

  const out = gradeQuiz(session.uid, subjectId, lessonId, answers);
  if (!out.ok) return NextResponse.json({ error: out.error }, { status: 400 });
  await flushDB();
  return NextResponse.json({ ok: true, result: out.result, correct: out.correct });
}

/* كلُّ معالجٍ يعمل داخل سياق منصّته — انظر lib/hub/context.ts */
export const POST = tenantRoute(POST_impl);
