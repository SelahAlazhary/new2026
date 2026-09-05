import { NextResponse } from "next/server";
import { loadDB, getDB, saveDB, flushDB } from "@/lib/db";
import {
  tgConfig, tgAllowed, tgAnswer, tgEdit, tgEditCaption, tgSend, payVerdictText, esc,
} from "@/lib/telegram";
import { decideOnce, notifyStudent } from "@/lib/pay-decide";
import { ticketIdFrom, replyFromTelegram, notifySupportReply } from "@/lib/support-bridge";
import { tenantRoute } from "@/lib/hub/context";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

/**
 * ويبهوك بوت تليجرام.
 * ------------------------------------------------------------------
 * يستقبل ضغطات أزرار «قبول/رفض» على رسائل طلبات الدفع فيبتّ فيها من
 * داخل تليجرام مباشرة — نفس دالة البتّ التي تستدعيها اللوحة، فلا
 * يفترق المساران في السلوك.
 *
 * الحماية: تليجرام يرسل السرّ في ترويسة مع كل تحديث. بدون فحصه يستطيع
 * أيّ أحد يعرف المسار أن يرسل تحديثاً مزوّراً فيوافق على مدفوعات لم
 * تصل — ولهذا يُرفض كل تحديث لا يحمل السرّ الصحيح، ويُرفض العمل كلّه
 * إن لم يكن سرّ مضبوطاً أصلاً.
 */

/** أسباب رفض جاهزة — الضغط أسرع من الكتابة، والسبب يصل الطالب كما هو. */
const REASONS = [
  "لم يصل المبلغ إلى الحساب",
  "المبلغ المحوَّل غير مطابق",
  "صورة الإيصال غير واضحة",
  "بيانات التحويل غير صحيحة",
];

async function POST_impl(req: Request) {
  await loadDB();
  const cfg = tgConfig();

  /* بلا سرّ لا ويبهوك: الفشل هنا «مغلق» لا «مفتوح». */
  if (!cfg.token || !cfg.secret) {
    return NextResponse.json({ ok: true });
  }
  if (req.headers.get("x-telegram-bot-api-secret-token") !== cfg.secret) {
    return NextResponse.json({ ok: true });
  }

  const update = await req.json().catch(() => null);
  if (!update) return NextResponse.json({ ok: true });

  if (update.callback_query) {
    await onCallback(update.callback_query);
    return NextResponse.json({ ok: true });
  }
  if (update.message?.text) {
    await onMessage(update.message);
  }
  return NextResponse.json({ ok: true });
}

/* ------------------------------------------------------------------ */

type Callback = {
  id: string;
  data?: string;
  from?: { id?: number; first_name?: string; username?: string };
  message?: { message_id: number; chat: { id: number }; photo?: unknown };
};

async function onCallback(q: Callback) {
  /*
    الضاغط يُفحص لا المحادثة وحدها: رسالة مُعاد توجيهها تحمل أزرارها
    معها، فمن وصلته يستطيع ضغطها لولا هذا الفحص.
  */
  if (!tgAllowed(q.from?.id, q.message?.chat.id)) {
    await tgAnswer(q.id, "غير مصرّح");
    return;
  }
  const data = q.data ?? "";
  const by = q.from?.username ? `@${q.from.username}` : q.from?.first_name || "تليجرام";
  const chatId = q.message?.chat.id;
  const msgId = q.message?.message_id;
  const isPhoto = Boolean(q.message?.photo);

  /* الرفض خطوتان: الزرّ يفتح قائمة الأسباب فيصل الطالبَ سببٌ مفهوم. */
  const ask = data.match(/^pay:no:(.+)$/);
  if (ask) {
    await editKeyboard(chatId, msgId, [
      ...REASONS.map((_, i) => [{ text: REASONS[i], callback_data: `pay:r${i}:${ask[1]}` }]),
      [{ text: "↩︎ رجوع", callback_data: `pay:back:${ask[1]}` }],
    ]);
    await tgAnswer(q.id, "اختر سبب الرفض");
    return;
  }

  const back = data.match(/^pay:back:(.+)$/);
  if (back) {
    await editKeyboard(chatId, msgId, [[
      { text: "✅ قبول", callback_data: `pay:ok:${back[1]}` },
      { text: "❌ رفض", callback_data: `pay:no:${back[1]}` },
    ]]);
    await tgAnswer(q.id, "");
    return;
  }

  const hit = data.match(/^pay:(ok|r[0-3]):(.+)$/);
  if (!hit) return;

  const [, kind, id] = hit;
  const db = getDB();
  const r = (db.payments ?? []).find((x) => x.id === id);
  if (!r) { await tgAnswer(q.id, "الطلب غير موجود"); return; }
  if (r.status !== "pending") { await tgAnswer(q.id, "بُتَّ في هذا الطلب بالفعل"); return; }

  const result = kind === "ok"
    ? await decideOnce(r, "approve", {}, by)
    : await decideOnce(r, "reject", { reason: REASONS[Number(kind.slice(1))] }, by);

  if ("error" in result) { await tgAnswer(q.id, result.error); return; }

  saveDB(db);
  await flushDB();

  /*
    إشعار جهاز الطالب كان في مسار اللوحة وحده، فمن يبتّ من تليجرام
    يُنشئ الكود ولا يصل الطالبَ تنبيهٌ على جهازه — والمساران يُفترض
    ألّا يفترقا في السلوك.
  */
  await notifyStudent(db, r, result.status);

  const text = payVerdictText(r, by);
  if (chatId && msgId) {
    /* رسالة الصورة تُعدَّل تعليقاً لا نصّاً — واجهتان مختلفتان في تليجرام. */
    if (isPhoto) await tgEditCaption(chatId, msgId, text);
    else await tgEdit(chatId, msgId, text);
  }
  await tgAnswer(q.id, result.status === "approved" ? "تم القبول ✅" : "تم الرفض");
}

/** إزالة/تبديل أزرار رسالة — نداء مباشر لأنه لا يخصّ إلا هذا المسار. */
async function editKeyboard(
  chatId: number | undefined,
  messageId: number | undefined,
  keyboard: { text: string; callback_data: string }[][]
) {
  if (!chatId || !messageId) return;
  const { token } = tgConfig();
  await fetch(`https://api.telegram.org/bot${token}/editMessageReplyMarkup`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ chat_id: chatId, message_id: messageId, reply_markup: { inline_keyboard: keyboard } }),
    cache: "no-store",
  }).catch(() => null);
}


/**
 * ادّعاء المحادثة عند أوّل «/start».
 * يعيد true إن تمّ الربط الآن — أي إن لم تكن محادثةٌ مضبوطة من قبل.
 */
function claimChat(chatId: string, fromId?: number): boolean {
  const db = getDB();
  db.integrations = db.integrations ?? {};
  const t = db.integrations.telegram ?? {};

  /* توكن من متغيّر بيئة أو محادثة مضبوطة: لا ادّعاء — الضبط قرار اللوحة. */
  if (!t.token && !process.env.TELEGRAM_BOT_TOKEN) return false;
  if ((process.env.TELEGRAM_CHAT_ID || t.chatId || "").trim()) return false;

  const ids = new Set(t.allowedIds ?? []);
  ids.add(chatId);
  if (fromId !== undefined) ids.add(String(fromId));

  db.integrations.telegram = { ...t, chatId, allowedIds: Array.from(ids), enabled: true };
  saveDB(db);
  void flushDB();
  return true;
}

/* ------------------------------------------------------------------ */

type Message = {
  text: string;
  chat: { id: number; title?: string; first_name?: string };
  from?: { id?: number; first_name?: string; username?: string };
  /* الردّ على رسالة: تليجرام يعيد نصَّ المردود عليه، ومنه يُستخرج
     معرّفُ المحادثة — فلا حاجة لحفظ معرّفات رسائل تليجرام. */
  reply_to_message?: { text?: string; caption?: string };
};

/**
 * أوامر البوت.
 * `/start` و`/id` يردّان بمعرّف المحادثة — وهو ما يلزم لصقه في اللوحة،
 * فلا يُطلب من المشرفة أن تستخرجه بأدوات خارجية.
 */
async function onMessage(m: Message) {
  const text = (m.text ?? "").trim();
  const chatId = String(m.chat.id);
  const db = getDB();
  const pending = (db.payments ?? []).filter((p) => p.status === "pending");
  const allowed = tgAllowed(m.from?.id, m.chat.id);

  /*
    `/start` يردّ بالمعرّف حتى لغير المسموح لهم — وهو ما يلزم لإضافة
    المعرّف في اللوحة أوّل مرّة، ولا يكشف شيئاً عن المنصّة. وما عداه
    من الأوامر لا يُجاب إلا لمن في القائمة.
  */
  if (/^\/(start|id)\b/.test(text)) {
    /*
      أوّل «/start» بعد ربط التوكن يملك البوت.
      ------------------------------------------------------------
      كان على المشرفة أن تنسخ المعرّف من ردّ البوت وتعود إلى اللوحة
      وتلصقه في حقلين. لا داعي: الويبهوك موثَّق بالسرّ أصلاً، ولا يعرف
      اسمَ البوت أحدٌ لحظةَ ربطه، فأوّلُ من يخاطبه هو من ربطه.

      الادّعاء مقصور على حالة واحدة: ألّا تكون محادثةٌ مضبوطة بعد.
      وبعدها لا يُغيّرها أحد إلا من اللوحة.
    */
    const claimed = claimChat(chatId, m.from?.id);

    await tgSend(
      claimed
        ? [
          "✅ <b>تم الربط</b>",
          "",
          "هذه المحادثة صارت وجهةَ طلبات الدفع، ومعرّفك في قائمة المسموح لهم.",
          `<code>${esc(chatId)}</code>`,
          "",
          "ستصلك كل طلبات التحويل هنا بصورة الإيصال وبيانات الطالب وزرَّي قبول ورفض.",
          "",
          "الأوامر: /pending للطلبات المعلّقة · /support للمحادثات المفتوحة.",
        ].join("\n")
        : [
          "👋 <b>بوت بوّابة الدفع</b>",
          "",
          "معرّف هذه المحادثة:",
          `<code>${esc(chatId)}</code>`,
          "",
          "الصقيه في «بوّابة الدفع ← بوت تليجرام» داخل لوحة الإدارة ليعمل البوت معك.",
          "",
          "الأوامر: /pending لعرض الطلبات المعلّقة.",
        ].join("\n"),
      { chatId }
    );
    return;
  }

  /* ---- ردّ الدعم: ردٌّ على رسالة تحمل معرّف المحادثة ---- */
  if (allowed && m.reply_to_message && !text.startsWith("/")) {
    const src = m.reply_to_message.text || m.reply_to_message.caption || "";
    const ticketId = ticketIdFrom(src);
    if (ticketId) {
      const db2 = getDB();
      const t = replyFromTelegram(ticketId, text, "الدعم");
      if (!t) {
        await tgSend("المحادثة غير موجودة — ربما حُذف حساب الطالب.", { chatId });
        return;
      }
      saveDB(db2);
      await flushDB();
      void notifySupportReply(t, text);
      await tgSend(`✅ وصل ردُّك إلى ${esc(t.student)}.`, { chatId });
      return;
    }
  }

  if (!allowed) {
    await tgSend(
      "هذا البوت خاصّ بإدارة المنصّة. إن كنتَ المشرف فأضف معرّف هذه المحادثة في «بوّابة الدفع ← بوت تليجرام».",
      { chatId }
    );
    return;
  }

  if (/^\/support\b/.test(text)) {
    const open = (db.tickets ?? []).filter((t) =>
      (t.messages ?? []).some((x) => x.from === "student" && !x.readByAdmin)
    );
    if (open.length === 0) {
      await tgSend("لا محادثات دعم تنتظر ردّاً ✅", { chatId });
      return;
    }
    const lines = open.slice(0, 15).map((t) => {
      const msgs = t.messages ?? [];
      const last = msgs[msgs.length - 1];
      return `• <b>${esc(t.student)}</b> — ${esc((last?.text ?? "").slice(0, 60))}\n  🆔 <code>${esc(t.id)}</code>`;
    });
    await tgSend(
      [
        `💬 <b>محادثات تنتظر ردّاً: ${open.length}</b>`,
        "",
        ...lines,
        "",
        "<i>ردّ على أيّ رسالة تحمل المعرّف ليصل ردُّك الطالبَ.</i>",
      ].join("\n"),
      { chatId }
    );
    return;
  }


  if (/^\/pending\b/.test(text)) {
    if (pending.length === 0) {
      await tgSend("لا توجد طلبات معلّقة ✅", { chatId });
      return;
    }
    const lines = pending.slice(0, 20).map((p) =>
      `• ${esc(p.student)} — ${esc(p.planName)} — ${esc(p.amount)} ج.م — <code>${esc(p.id)}</code>`
    );
    await tgSend(
      [`🧾 <b>طلبات معلّقة: ${pending.length}</b>`, "", ...lines].join("\n"),
      { chatId }
    );
  }
}

/* كلُّ معالجٍ يعمل داخل سياق منصّته — انظر lib/hub/context.ts */
export const POST = tenantRoute(POST_impl);
