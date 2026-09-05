import { NextResponse } from "next/server";
import { loadDB, getDB, saveDB, flushDB } from "@/lib/db";
import { getSession } from "@/lib/session";
import { recordEvent, bannedUntil } from "@/lib/security";
import { clientIp, limit } from "@/lib/guard";
import { can } from "@/lib/perms";
import { sendToUsers } from "@/lib/push";
import { planPrice, planForStudent, resolvePlan } from "@/lib/plans";
import { decideOnce, notifyStudent } from "@/lib/pay-decide";
import {
  activeMethods, planTarget, targetName, requestProblem, normalizeDigits, gatewayOn,
} from "@/lib/payments";
import {
  tgReady, tgSend, tgSendPhoto, payRequestText, payVerdictText, siteUrl, absolute,
} from "@/lib/telegram";
import type { DB, PayRequest, PayRequestStatus, Code, Notification } from "@/lib/types";
import { tenantRoute } from "@/lib/hub/context";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

const MAX_TEXT = 120;
const MAX_NOTE = 400;

function now() {
  return new Date().toISOString();
}

function clip(v: unknown, max: number): string {
  return String(v ?? "").trim().slice(0, max);
}

/* ------------------------------------------------------------------ */
/*  POST — الطالب يقدّم طلب دفع                                        */
/* ------------------------------------------------------------------ */

async function POST_impl(req: Request) {
  await loadDB();
  const session = await getSession();
  if (!session || session.role !== "student") {
    return NextResponse.json({ error: "سجّل الدخول كطالب أولاً" }, { status: 401 });
  }

  const ip = await clientIp();
  if (bannedUntil(ip)) {
    return NextResponse.json({ error: "تم إيقاف المحاولات مؤقّتاً" }, { status: 429 });
  }
  /* طلبات الدفع تُراجَع يدوياً، فالإغراق بها إغراقٌ لصندوق المشرفة. */
  const gate = limit(`pay:${session.uid}`, 6, 10 * 60_000, 20 * 60_000);
  if (!gate.ok) {
    await recordEvent("rate_limited", "تجاوز حدّ طلبات الدفع", { userId: session.uid });
    return NextResponse.json({ error: "طلبات كثيرة — انتظر قليلاً ثم أعد المحاولة" }, { status: 429 });
  }

  const db = getDB();
  const me = db.users.find((u) => u.id === session.uid);
  if (!me || !me.active) {
    return NextResponse.json({ error: "الحساب غير متاح" }, { status: 403 });
  }

  const cfg = db.content.payments ?? {};
  if (!gatewayOn(cfg)) {
    return NextResponse.json({ error: "بوّابة الدفع غير مفعّلة حالياً" }, { status: 400 });
  }

  const body = await req.json().catch(() => ({}));
  /* الخطة قد تكون خيار سعر داخل الكورس — المصدر واحد للاثنين. */
  const plan = resolvePlan(String(body.planId ?? ""), db.plans, db.subjects);
  if (!plan) return NextResponse.json({ error: "الخطة غير موجودة" }, { status: 400 });
  /* فئة الخطة تُفحص هنا أيضاً: إخفاؤها في الواجهة ليس منعاً. */
  if (!planForStudent(plan, me)) {
    return NextResponse.json({ error: "هذه الخطة غير متاحة لبياناتك" }, { status: 403 });
  }

  const method = activeMethods(cfg.methods).find((m) => m.id === String(body.methodId ?? ""));
  if (!method) return NextResponse.json({ error: "طريقة الدفع غير متاحة" }, { status: 400 });

  const senderName = clip(body.senderName, MAX_TEXT);
  const senderAccount = clip(body.senderAccount, MAX_TEXT);
  const senderRef = clip(body.senderRef, MAX_TEXT);
  const receipt = clip(body.receipt, 600);
  const note = clip(body.note, MAX_NOTE);

  /*
    والنوعُ يُؤخذ من الطريقة المخزَّنة لا ممّا أرسله المتصفّح.
    قاعدةُ «أحدَ عشرَ رقماً» تخصّ المحفظةَ وحدَها، فلو صُدِّق النوعُ من
    الطلب لكفى أن يُرسل `bank` مع طريقةِ محفظةٍ لتُتخطّى القاعدةُ كلُّها.
  */
  const problem = requestProblem(
    { methodId: method.id, methodKind: method.kind, senderName, senderAccount, receipt },
    { requireReceipt: cfg.requireReceipt, requireSender: cfg.requireSender }
  );
  if (problem) return NextResponse.json({ error: problem }, { status: 400 });

  /* طلب معلّق لنفس الخطة: لا يُكرَّر — الازدواج يربك المراجعة لا أكثر. */
  db.payments = db.payments ?? [];
  if (db.payments.some((p) => p.userId === me.id && p.planId === plan.id && p.status === "pending")) {
    return NextResponse.json({ error: "لديك طلب قيد المراجعة لهذه الخطة بالفعل" }, { status: 409 });
  }

  /* السعر يُحسب من الخطة على الخادم — لا يُقبل رقم من الواجهة إطلاقاً. */
  const amount = planPrice(plan).price;
  const target = planTarget(plan, clip(body.subjectId, 80));

  const request: PayRequest = {
    id: `PAY-${Date.now().toString(36).toUpperCase()}-${Math.random().toString(36).slice(2, 5).toUpperCase()}`,
    at: now(),
    userId: me.id,
    student: me.name,
    phone: me.phone,
    grade: me.grade,
    track: me.track,
    planId: plan.id,
    planName: plan.name,
    subjectId: target || undefined,
    subjectName: target ? targetName(target, db.subjects) : undefined,
    amount,
    methodId: method.id,
    methodName: method.name,
    methodNumber: method.number,
    methodHolder: method.holder,
    senderName: senderName ? normalizeDigits(senderName) : undefined,
    senderAccount: senderAccount ? normalizeDigits(senderAccount) : undefined,
    senderRef: senderRef ? normalizeDigits(senderRef) : undefined,
    receipt: receipt || undefined,
    note: note || undefined,
    status: "pending",
    readByAdmin: false,
  };

  /*
    يُحفظ الطلب أوّلاً ثم يُنبَّه عليه.
    ------------------------------------------------------------------
    تليجرام يجلب صورة الإيصال بنفسه أثناء نداء sendPhoto، ووسيطُ ملفات
    Drive لا يخدم إلا ملفاً مذكوراً في بيانات المنصّة. فلو نُبِّه قبل
    الحفظ لجاء تليجرام إلى رابطٍ لا تعرفه المنصّة بعد فيُردّ ٤٠٤،
    وسقط التنبيه كلّه.
  */
  db.payments = [request, ...db.payments].slice(0, 4000);
  saveDB(db);

  /* تليجرام تنبيهٌ لا شرطٌ: فشلُه يُسجَّل في الطلب ولا يُسقط التقديم. */
  request.telegram = await notifyTelegram(request, req);
  saveDB(db);
  await flushDB();

  return NextResponse.json({ ok: true, request });
}

/** يرسل الطلب لبوت تليجرام بزرّي قبول ورفض. */
async function notifyTelegram(r: PayRequest, req: Request): Promise<PayRequest["telegram"]> {
  if (!tgReady()) return "off";
  const url = siteUrl(req);
  const text = payRequestText(r, url);
  const buttons = [[
    { text: "✅ قبول", callback_data: `pay:ok:${r.id}` },
    { text: "❌ رفض", callback_data: `pay:no:${r.id}` },
  ]];
  /*
    الإيصال صورة: تُرسل صورةً ليراها المشرف بلا فتح رابط. لكن تليجرام
    يجلب الصورة بنفسه من الرابط، وقد يعجز عنه (استضافة تتطلّب تحويلاً،
    أو ملفّاً أكبر ممّا يقبله). كان فشلُ الصورة يعني ألّا يصل تنبيهٌ
    إطلاقاً — والطلبُ ينتظر بلا أن يعلم به أحد. فإن فشلت الصورة تُرسل
    الرسالة نصّاً ومعها رابط الإيصال.
  */
  if (r.receipt && url) {
    const photo = await tgSendPhoto(absolute(r.receipt, url), text, { buttons });
    if (photo.ok) return "sent";
  }
  const res = await tgSend(text, { buttons });
  return res.ok ? "sent" : "failed";
}

/* ------------------------------------------------------------------ */
/*  PATCH — المشرف يبتّ في الطلب                                       */
/* ------------------------------------------------------------------ */

async function PATCH_impl(req: Request) {
  await loadDB();
  const session = await getSession();
  const db = getDB();
  const me = db.users.find((u) => u.id === session?.uid);
  if (!session || session.role !== "admin" || !can(me, "payments")) {
    await recordEvent("unauthorized_admin", "/api/payments");
    return NextResponse.json({ error: "غير مصرّح" }, { status: 401 });
  }

  const body = await req.json().catch(() => ({}));
  const id = String(body.id ?? "");
  const action = String(body.action ?? "");
  const r = (db.payments ?? []).find((x) => x.id === id);
  if (!r) return NextResponse.json({ error: "الطلب غير موجود" }, { status: 404 });

  if (action === "read") {
    r.readByAdmin = true;
    saveDB(db);
    await flushDB();
    return NextResponse.json({ ok: true, request: r });
  }

  if (r.status !== "pending") {
    return NextResponse.json({ error: "بُتَّ في هذا الطلب بالفعل" }, { status: 409 });
  }

  const verdict = await decideOnce(r, action, body, me?.name ?? "مشرف");
  if ("error" in verdict) return NextResponse.json({ error: verdict.error }, { status: 400 });

  saveDB(db);
  await flushDB();

  if (tgReady()) void tgSend(payVerdictText(r, me?.name ?? "مشرف"));
  await notifyStudent(db, r, verdict.status);

  return NextResponse.json({ ok: true, request: r });
}

/* ------------------------------------------------------------------ */
/*  DELETE — حذف طلب                                                   */
/* ------------------------------------------------------------------ */

async function DELETE_impl(req: Request) {
  await loadDB();
  const session = await getSession();
  const db = getDB();
  const me = db.users.find((u) => u.id === session?.uid);
  if (!session || session.role !== "admin" || !can(me, "payments")) {
    return NextResponse.json({ error: "غير مصرّح" }, { status: 401 });
  }
  const id = new URL(req.url).searchParams.get("id") ?? "";
  db.payments = (db.payments ?? []).filter((p) => p.id !== id);
  saveDB(db);
  await flushDB();
  return NextResponse.json({ ok: true });
}

/* كلُّ معالجٍ يعمل داخل سياق منصّته — انظر lib/hub/context.ts */
export const POST = tenantRoute(POST_impl);
export const PATCH = tenantRoute(PATCH_impl);
export const DELETE = tenantRoute(DELETE_impl);
