import { NextResponse } from "next/server";
import { gradeExam, loadDB, flushDB } from "@/lib/db/db";
import { getSession } from "@/lib/auth/session";
import { limit } from "@/lib/auth/guard";
import { tenantRoute } from "@/lib/hub/context";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

/**
 * POST: تسليم إجابات اختبار — التصحيح على السيرفر فقط.
 * { examId, answers: number[] }  (‑1 = بلا إجابة)
 */
async function POST_impl(req: Request) {
  await loadDB();
  const session = await getSession();
  if (!session || session.role !== "student") {
    return NextResponse.json({ error: "غير مصرّح" }, { status: 401 });
  }

  /* كبحُ الإغراق — بالحساب لا بالعنوان، فالمدرسةُ تُخرج عشراتِ الطلاب من
     عنوانٍ واحد ولا يُقفل على البريء.  */
  const flood = limit(`exam:${session.uid}`, 20, 5 * 60_000, 5 * 60_000);
  if (!flood.ok) {
    return NextResponse.json({ error: "محاولاتٌ كثيرة — انتظر قليلاً" }, { status: 429 });
  }
  const b = await req.json().catch(() => null);
  const examId = String(b?.examId ?? "");
  const answers = Array.isArray(b?.answers) ? b.answers.map((a: unknown) => Number(a)) : null;
  if (!examId || !answers) return NextResponse.json({ error: "بيانات ناقصة" }, { status: 400 });

  const out = gradeExam(session.uid, examId, answers);
  if (!out.ok) return NextResponse.json({ error: out.error }, { status: 400 });
  await flushDB();
  return NextResponse.json({ ok: true, attempt: out.attempt, correct: out.correct });
}

/* كلُّ معالجٍ يعمل داخل سياق منصّته — انظر lib/hub/context.ts */
export const POST = tenantRoute(POST_impl);
