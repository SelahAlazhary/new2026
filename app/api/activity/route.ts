import { NextResponse } from "next/server";
import { loadDB, getDB, saveDB } from "@/lib/db";
import { getSession } from "@/lib/session";
import { can } from "@/lib/perms";
import { limit, clientIp } from "@/lib/guard";
import { newActivity, pushActivity } from "@/lib/activity";
import { appendActivity, readActivity } from "@/lib/activity-store";
import type { ActivityKind } from "@/lib/types";
import { tenantRoute } from "@/lib/hub/context";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

/**
 * تسجيل نشاط الطالب.
 * ------------------------------------------------------------------
 * يُنادى من المتصفّح عند فتح صفحة أو درس. ثلاثة قيود تحكمه:
 *
 *   • للطالب وحده — نشاط المشرف ليس تقريراً يُقرأ، وتسجيلُه ضجيج.
 *   • أنواعٌ معدودة لا نصٌّ حرّ: العميل لا يُملي على السجلّ ما يشاء.
 *   • حدٌّ للمعدّل، والأهمّ: **لا يُحفَظ إلا ما يستحقّ**. تكرارُ الحدث
 *     نفسه خلال دقيقة لا يُضاف — التنقّلُ ذهاباً وإياباً بين صفحتين
 *     كان سيملأ الحلقةَ بسطرٍ واحدٍ مكرّر ويطرد ما قبله.
 *
 * والكتابةُ بلا `flushDB`: التتبّعُ لا يستحقّ انتظارَ الشبكة في كل
 * صفحة، ويُدفَع مع أوّل حفظٍ حقيقيّ بعده.
 */

const KINDS = new Set<ActivityKind>(["view", "lesson", "quiz", "exam", "live"]);

/** أقلّ فاصلٍ بين حدثين متطابقين — أقلُّ منه تكرارٌ لا معلومة. */
const DEDUPE_MS = 60_000;

async function POST_impl(req: Request) {
  await loadDB();
  const session = await getSession();
  if (!session || session.role !== "student") {
    return NextResponse.json({ ok: true }); // صامتٌ: التتبّع ليس خدمةً تُطلب
  }

  const ip = await clientIp();
  if (!limit(`act:${session.uid}:${ip}`, 120, 60_000).ok) {
    return NextResponse.json({ ok: true });
  }

  const body = await req.json().catch(() => ({}));
  const kind = String(body.kind ?? "") as ActivityKind;
  if (!KINDS.has(kind)) return NextResponse.json({ ok: true });

  const ref = String(body.ref ?? "").trim().slice(0, 120) || undefined;
  const meta = String(body.meta ?? "").trim().slice(0, 80) || undefined;
  const minutes = Math.max(0, Math.min(180, Number(body.minutes) || 0));

  const db = getDB();
  const u = db.users.find((x) => x.id === session.uid);
  if (!u || !u.active) return NextResponse.json({ ok: true });

  /* تكرارُ الحدث نفسه خلال دقيقة يُهمَل — لكن الزمن يُضاف والظهور يُحدَّث. */
  const last = (await readActivity(u.id))[0];
  const repeat =
    last && last.kind === kind && last.ref === ref &&
    Date.now() - new Date(last.at).getTime() < DEDUPE_MS;

  const a = newActivity(kind, ref, meta);
  pushActivity(u, a, minutes);          // المجاميع في القاعدة الرئيسية
  saveDB(db);
  if (!repeat) void appendActivity(u.id, a);   // الحلقة في مسارها

  return NextResponse.json({ ok: true });
}

/**
 * GET: سجلُّ طالب — للمشرف صاحب صلاحية «الطلاب».
 * لا يُقرأ إلا عند فتح التقرير، فبقاؤه خارج القاعدة الرئيسية لا يكلّف
 * شيئاً في المسار الساخن.
 */
async function GET_impl(req: Request) {
  await loadDB();
  const session = await getSession();
  const db = getDB();
  const me = db.users.find((x) => x.id === session?.uid);
  if (!session || session.role !== "admin" || !can(me, "students")) {
    return NextResponse.json({ error: "غير مصرّح" }, { status: 401 });
  }
  const userId = new URL(req.url).searchParams.get("user") ?? "";
  return NextResponse.json({ activity: await readActivity(userId) });
}

/* كلُّ معالجٍ يعمل داخل سياق منصّته — انظر lib/hub/context.ts */
export const GET = tenantRoute(GET_impl);
export const POST = tenantRoute(POST_impl);
