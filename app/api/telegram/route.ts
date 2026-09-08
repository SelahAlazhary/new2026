import { NextResponse } from "next/server";
import { loadDB, getDB, saveDB, flushDB } from "@/lib/db/db";
import { getSession } from "@/lib/auth/session";
import { recordEvent } from "@/lib/auth/security";
import { can } from "@/lib/auth/perms";
import {
  tgConfig, tgGetMe, tgSetWebhook, tgDeleteWebhook, tgWebhookInfo, tgSend, newWebhookSecret, siteUrl, esc, cleanTgId,
} from "@/lib/integrations/telegram";
import { tenantRoute } from "@/lib/hub/context";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

/**
 * ربط بوت تليجرام — للمشرف صاحب صلاحية «بوّابة الدفع».
 * ------------------------------------------------------------------
 * المطلوب من المشرفة خطوةٌ واحدة: لصق التوكن من BotFather. الباقي
 * يتمّ هنا تلقائياً — التحقّق من التوكن، توليد سرّ الويبهوك، وتسجيل
 * الويبهوك عند تليجرام. التوكن لا يعود للواجهة أبداً بعد حفظه.
 */

async function guard(path: string) {
  const session = await getSession();
  const me = getDB().users.find((u) => u.id === session?.uid);
  if (!session || session.role !== "admin" || !can(me, "payments")) {
    await recordEvent("unauthorized_admin", path);
    return null;
  }
  return me;
}

/** حالة الربط — بلا توكن إطلاقاً. */
async function GET_impl() {
  await loadDB();
  if (!(await guard("/api/telegram"))) {
    return NextResponse.json({ error: "غير مصرّح" }, { status: 401 });
  }
  const t = getDB().integrations?.telegram;
  const c = tgConfig();
  return NextResponse.json({
    configured: Boolean(c.token),
    enabled: t?.enabled !== false,
    chatId: c.chatId || "",
    username: t?.username || "",
    allowedIds: c.allowedIds,
    supportChatId: t?.supportChatId || "",
    supportOff: Boolean(t?.supportOff),
    webhookSetAt: t?.webhookSetAt || "",
    /* التوكن من متغيّر البيئة لا يُعدَّل من اللوحة — مصدره خارجها. */
    fromEnv: Boolean(process.env.TELEGRAM_BOT_TOKEN),
  });
}

async function POST_impl(req: Request) {
  await loadDB();
  const me = await guard("/api/telegram");
  if (!me) return NextResponse.json({ error: "غير مصرّح" }, { status: 401 });

  const body = await req.json().catch(() => ({}));
  const action = String(body.action ?? "save");
  const db = getDB();
  db.integrations = db.integrations ?? {};
  const current = db.integrations.telegram ?? {};

  /* ---- اختبار: رسالة تجريبية إلى المحادثة المضبوطة ---- */
  if (action === "test") {
    const c = tgConfig();
    if (!c.token) return NextResponse.json({ error: "لم يُضبط توكن البوت" }, { status: 400 });
    if (!c.chatId) return NextResponse.json({ error: "لم يُضبط معرّف المحادثة" }, { status: 400 });
    const res = await tgSend(
      [
        "🔔 <b>رسالة اختبار</b>",
        "",
        "الربط يعمل — ستصلك طلبات الدفع هنا بزرَّي قبول ورفض.",
        `بواسطة: ${esc(me.name)}`,
      ].join("\n")
    );
    if (!res.ok) return NextResponse.json({ error: res.error || "تعذّر الإرسال" }, { status: 502 });
    return NextResponse.json({ ok: true });
  }

  /* ---- فصل ---- */
  if (action === "disconnect") {
    await tgDeleteWebhook();
    db.integrations.telegram = { enabled: false };
    saveDB(db);
    await flushDB();
    return NextResponse.json({ ok: true, configured: false });
  }

  /* ---- فحص الربط: يقول ما الناقص بالضبط لا «لا يعمل» ---- */
  if (action === "diagnose") {
    const c = tgConfig();
    const base = siteUrl(req);
    const want = base ? `${base}/api/telegram/webhook` : "";
    const checks: { key: string; ok: boolean; label: string; detail?: string }[] = [];

    checks.push({ key: "token", ok: Boolean(c.token), label: "توكن البوت مضبوط" });

    let who: { ok: boolean; result?: { username: string }; error?: string } = { ok: false };
    if (c.token) {
      who = await tgGetMe();
      checks.push({
        key: "valid", ok: who.ok,
        label: "التوكن صالح",
        detail: who.ok ? `@${who.result?.username ?? ""}` : who.error,
      });
    }

    checks.push({
      key: "chat", ok: Boolean(c.chatId),
      label: "معرّف محادثة التنبيهات مضبوط",
      detail: c.chatId || "أرسل /start للبوت ليردّ بالمعرّف",
    });

    checks.push({
      key: "allow", ok: c.allowedIds.length > 0 || Boolean(c.chatId),
      label: "معرّف مسموح له واحد على الأقلّ",
      detail: c.allowedIds.length
        ? c.allowedIds.join("، ")
        : c.chatId ? "محادثة التنبيهات وحدها" : "لا معرّفات — البوت لن يردّ على أحد",
    });

    checks.push({
      key: "https", ok: /^https:\/\//i.test(base),
      label: "الموقع يعمل بـHTTPS",
      detail: base || "تعذّر تحديد عنوان الموقع",
    });

    if (c.token) {
      const info = await tgWebhookInfo();
      const url = info.result?.url ?? "";
      checks.push({
        key: "hook", ok: Boolean(url) && (!want || url === want),
        label: "الويبهوك مسجَّل على هذا الموقع",
        detail: !url
          ? "غير مسجَّل — اضغط «حفظ وربط الويبهوك»"
          : want && url !== want
            ? `مسجَّل على عنوان آخر: ${url}`
            : url,
      });
      if (info.result?.last_error_message) {
        checks.push({
          key: "error", ok: false,
          label: "آخر خطأ أبلغ عنه تليجرام",
          detail: info.result.last_error_message,
        });
      }
      if ((info.result?.pending_update_count ?? 0) > 0) {
        checks.push({
          key: "queue", ok: false,
          label: "تحديثات عالقة لم تصل المنصّة",
          detail: String(info.result?.pending_update_count),
        });
      }
    }

    return NextResponse.json({ ok: checks.every((x) => x.ok), checks });
  }

  /* ---- وجهة محادثات الدعم ---- */
  if (action === "support") {
    db.integrations.telegram = {
      ...current,
      supportChatId: cleanTgId(String(body.supportChatId ?? "")),
      supportOff: body.supportOff === true,
    };
    saveDB(db);
    await flushDB();
    return NextResponse.json({
      ok: true,
      supportChatId: db.integrations.telegram.supportChatId ?? "",
      supportOff: Boolean(db.integrations.telegram.supportOff),
    });
  }

  /* ---- المعرّفات المسموح لها ---- */
  if (action === "ids") {
    const ids = Array.isArray(body.ids) ? body.ids : [];
    const clean: string[] = Array.from(new Set(ids.map((x: unknown) => cleanTgId(String(x))))).filter(Boolean) as string[];
    db.integrations.telegram = { ...current, allowedIds: clean };
    saveDB(db);
    await flushDB();
    return NextResponse.json({ ok: true, allowedIds: clean });
  }

  /* ---- تشغيل/إيقاف بلا مساس بالتوكن ---- */
  if (action === "toggle") {
    db.integrations.telegram = { ...current, enabled: Boolean(body.enabled) };
    saveDB(db);
    await flushDB();
    return NextResponse.json({ ok: true, enabled: Boolean(body.enabled) });
  }

  /* ---- حفظ التوكن ومعرّف المحادثة ثم تسجيل الويبهوك ---- */
  /* التوكن من متغيّر البيئة صالحٌ لتسجيل الويبهوك — بدونه لا يُسجَّل أبداً. */
  const token = String(body.token ?? "").trim() || current.token || (process.env.TELEGRAM_BOT_TOKEN ?? "").trim();
  const chatId = cleanTgId(String(body.chatId ?? "")) || current.chatId || "";
  if (!token) return NextResponse.json({ error: "الصق توكن البوت من BotFather" }, { status: 400 });

  const who = await tgGetMe(token);
  if (!who.ok) {
    return NextResponse.json({ error: who.error || "التوكن غير صالح" }, { status: 400 });
  }

  const secret = current.webhookSecret || newWebhookSecret();
  const base = siteUrl(req);
  let webhookSetAt = current.webhookSetAt;
  let warn: string | undefined;

  if (/^https:\/\//i.test(base)) {
    const hook = await tgSetWebhook(`${base}/api/telegram/webhook`, secret, token);
    if (hook.ok) webhookSetAt = new Date().toISOString();
    else warn = hook.error || "تعذّر تسجيل الويبهوك";
  } else {
    /* تليجرام لا يقبل ويبهوك إلا على HTTPS — محلياً يبقى الإرسال فقط. */
    warn = "الويبهوك يحتاج رابطاً بـHTTPS — أزرار القبول والرفض ستعمل بعد الرفع على الاستضافة";
  }

  db.integrations.telegram = {
    ...current,
    token,
    chatId,
    webhookSecret: secret,
    webhookSetAt,
    username: who.result?.username,
    enabled: true,
  };
  saveDB(db);
  await flushDB();

  return NextResponse.json({
    ok: true,
    configured: true,
    enabled: true,
    chatId,
    username: who.result?.username ?? "",
    webhookSetAt: webhookSetAt ?? "",
    warn,
  });
}

/* كلُّ معالجٍ يعمل داخل سياق منصّته — انظر lib/hub/context.ts */
export const GET = tenantRoute(GET_impl);
export const POST = tenantRoute(POST_impl);
