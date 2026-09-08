import "server-only";
import crypto from "crypto";
import { getDB } from "@/lib/db/db";
import { sameNumber } from "@/lib/business/payments";
import type { PayRequest } from "@/lib/utils/types";

/**
 * بوت تليجرام — تنبيهات طلبات الدفع والردّ عليها من داخل تليجرام.
 * ------------------------------------------------------------------
 * التوكن سرّ: يُقرأ من متغيّر البيئة أو من التكاملات على الخادم، ولا
 * يُرسل للواجهة إطلاقاً — الواجهة تعرف فقط أنه «مضبوط».
 *
 * الويبهوك محميّ بسرّ ترويسة (X-Telegram-Bot-Api-Secret-Token). بدونه
 * يستطيع أيّ أحد يعرف المسار أن يُطعِم المنصّة تحديثات مزوّرة فيوافق
 * على مدفوعات لم تصل — ولذلك يُرفض أي تحديث بلا السرّ الصحيح.
 */

const API = "https://api.telegram.org/bot";

export type TgConfig = {
  token: string;
  chatId: string;
  secret: string;
  enabled: boolean;
  allowedIds: string[];
};

export function tgConfig(): TgConfig {
  const t = getDB().integrations?.telegram;
  return {
    token: (process.env.TELEGRAM_BOT_TOKEN || t?.token || "").trim(),
    chatId: (process.env.TELEGRAM_CHAT_ID || t?.chatId || "").trim(),
    secret: (t?.webhookSecret || "").trim(),
    enabled: t?.enabled !== false,
    allowedIds: (t?.allowedIds ?? []).map((x) => String(x).trim()).filter(Boolean),
  };
}

/**
 * هل يُسمح لهذا المعرّف بمخاطبة البوت والبتّ في الطلبات؟
 * ------------------------------------------------------------------
 * البوت عامّ على تليجرام: أيّ أحد يعرف اسمه يستطيع مراسلته. بدون هذا
 * الفحص يرى غريبٌ أسماءَ الطلاب ومبالغهم بأمر واحد، بل ويضغط أزرار
 * القبول لو وصلته رسالة مُعاد توجيهها.
 *
 * القائمة الفارغة لا تعني «الكلّ» بل «محادثة التنبيهات وحدها» — الفشل
 * هنا «مغلق» لا «مفتوح».
 */
export function tgAllowed(...ids: (string | number | undefined)[]): boolean {
  const c = tgConfig();
  const allow = new Set<string>(c.allowedIds);
  if (c.chatId) allow.add(c.chatId);
  if (allow.size === 0) return false;
  return ids.some((v) => v !== undefined && allow.has(String(v).trim()));
}

/** تنقية معرّف تليجرام — رقم قد يسبقه سالب للمجموعات. */
export function cleanTgId(v: string): string {
  const out = String(v ?? "").trim().replace(/[^\d-]/g, "");
  return /^-?\d{3,}$/.test(out) ? out : "";
}

export function tgReady(): boolean {
  const c = tgConfig();
  return Boolean(c.token && c.chatId && c.enabled);
}

/** سرّ ويبهوك جديد — يُولَّد مرّة عند الربط ويُخزَّن مع التوكن. */
export function newWebhookSecret(): string {
  return crypto.randomBytes(24).toString("hex");
}

async function call<T = unknown>(
  method: string,
  body: Record<string, unknown>,
  token?: string
): Promise<{ ok: boolean; result?: T; error?: string }> {
  const t = (token || tgConfig().token).trim();
  if (!t) return { ok: false, error: "لم يُضبط توكن البوت" };
  try {
    const res = await fetch(`${API}${t}/${method}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
      cache: "no-store",
    });
    const data = (await res.json()) as { ok: boolean; result?: T; description?: string };
    if (!data.ok) return { ok: false, error: data.description || `فشل ${method}` };
    return { ok: true, result: data.result };
  } catch (e) {
    return { ok: false, error: (e as Error).message };
  }
}

/** الهروب من رموز HTML — أسماء الطلاب نصّ مستخدم لا يُوثَق به. */
export function esc(v: unknown): string {
  return String(v ?? "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;");
}

export type TgButton = { text: string; callback_data: string };

export async function tgSend(
  text: string,
  opts: { buttons?: TgButton[][]; chatId?: string; token?: string } = {}
) {
  const c = tgConfig();
  return call<{ message_id: number }>("sendMessage", {
    chat_id: opts.chatId || c.chatId,
    text,
    parse_mode: "HTML",
    disable_web_page_preview: true,
    ...(opts.buttons ? { reply_markup: { inline_keyboard: opts.buttons } } : {}),
  }, opts.token);
}

export async function tgSendPhoto(
  photo: string,
  caption: string,
  opts: { buttons?: TgButton[][]; chatId?: string } = {}
) {
  const c = tgConfig();
  return call<{ message_id: number }>("sendPhoto", {
    chat_id: opts.chatId || c.chatId,
    photo,
    caption,
    parse_mode: "HTML",
    ...(opts.buttons ? { reply_markup: { inline_keyboard: opts.buttons } } : {}),
  });
}

export async function tgAnswer(id: string, text: string) {
  return call("answerCallbackQuery", { callback_query_id: id, text, show_alert: false });
}

/** يُبدَّل نصّ الرسالة بعد البتّ فيها فلا يبقى زرّان يُضغطان مرّتين. */
export async function tgEdit(chatId: string | number, messageId: number, text: string) {
  return call("editMessageText", {
    chat_id: chatId,
    message_id: messageId,
    text,
    parse_mode: "HTML",
    disable_web_page_preview: true,
  });
}

export async function tgEditCaption(chatId: string | number, messageId: number, caption: string) {
  return call("editMessageCaption", {
    chat_id: chatId,
    message_id: messageId,
    caption,
    parse_mode: "HTML",
  });
}

export async function tgGetMe(token?: string) {
  return call<{ username: string; first_name: string }>("getMe", {}, token);
}

export async function tgSetWebhook(url: string, secret: string, token?: string) {
  return call("setWebhook", {
    url,
    secret_token: secret,
    allowed_updates: ["message", "callback_query"],
    drop_pending_updates: true,
  }, token);
}

/**
 * حالة الويبهوك عند تليجرام نفسه.
 * ------------------------------------------------------------------
 * `last_error_message` هو الحقل الذي يحوّل «البوت لا يعمل» إلى سبب
 * محدّد: شهادة مرفوضة، أو مسار يردّ ٤٠٤، أو مهلة انتهت. بدونه يبقى
 * العطل تخميناً.
 */
export async function tgWebhookInfo(token?: string) {
  return call<{
    url: string;
    has_custom_certificate: boolean;
    pending_update_count: number;
    last_error_date?: number;
    last_error_message?: string;
    ip_address?: string;
  }>("getWebhookInfo", {}, token);
}

export async function tgDeleteWebhook(token?: string) {
  return call("deleteWebhook", { drop_pending_updates: true }, token);
}

/* ------------------------------------------------------------------ */
/*  صياغة رسالة طلب الدفع                                              */
/* ------------------------------------------------------------------ */

/** حكمُ المطابقة بين رقم التحويل ورقم الحساب — أو فراغٌ إن تعذّر. */
function matchNote(r: PayRequest): string {
  const same = sameNumber(r.senderAccount, r.phone);
  if (same === null) return "";
  return same ? "  ✅ مطابق" : "  ⚠️ مختلف عن رقم التحويل";
}

/** رسالة الطلب — بيانات الطالب والخطة والتحويل في نظرة واحدة. */
export function payRequestText(r: PayRequest, siteUrl?: string): string {
  const lines = [
    "🧾 <b>طلب دفع جديد</b>",
    "",
    `👤 <b>الطالب:</b> ${esc(r.student)}`,
    r.phone ? `📱 <b>الهاتف:</b> ${esc(r.phone)}` : "",
    r.grade ? `🎓 <b>الصف:</b> ${esc(r.grade)}${r.track ? ` — ${esc(r.track)}` : ""}` : "",
    "",
    `📚 <b>الخطة:</b> ${esc(r.planName)}`,
    r.subjectName ? `📖 <b>النطاق:</b> ${esc(r.subjectName)}` : "",
    `💰 <b>المبلغ:</b> ${esc(r.amount)} ج.م`,
    `🏦 <b>طريقة الدفع:</b> ${esc(r.methodName)}`,
    r.methodNumber ? `🎯 <b>حُوِّل إلى:</b> <code>${esc(r.methodNumber)}</code>${r.methodHolder ? ` — ${esc(r.methodHolder)}` : ""}` : "",
    r.senderName ? `↩️ <b>المُحوِّل:</b> ${esc(r.senderName)}` : "",
    r.senderAccount ? `💳 <b>حوّل من:</b> <code>${esc(r.senderAccount)}</code>` : "",
    /* رقمُ حسابه بجوار رقم التحويل، وبينهما الحكم — فالمقارنة هي القرار. */
    r.phone ? `📇 <b>رقم حسابه:</b> <code>${esc(r.phone)}</code>${matchNote(r)}` : "",
    r.senderRef ? `#️⃣ <b>رقم العملية:</b> ${esc(r.senderRef)}` : "",
    r.note ? `📝 <b>ملاحظة:</b> ${esc(r.note)}` : "",
    "",
    `🆔 <code>${esc(r.id)}</code>`,
  ];
  if (r.receipt && siteUrl) {
    lines.push(`🖼 <a href="${esc(absolute(r.receipt, siteUrl))}">صورة التحويل</a>`);
  }
  return lines.filter(Boolean).join("\n");
}

/** حصيلة البتّ — تحلّ محلّ الرسالة الأصلية فلا يُبتّ في الطلب مرّتين. */
export function payVerdictText(r: PayRequest, by: string): string {
  const head = r.status === "approved" ? "✅ <b>تم القبول</b>" : "❌ <b>تم الرفض</b>";
  return [
    head,
    "",
    `👤 ${esc(r.student)} — ${esc(r.planName)} — ${esc(r.amount)} ج.م`,
    r.status === "approved" && r.code ? `🔑 <b>كود التفعيل:</b> <code>${esc(r.code)}</code>` : "",
    r.status === "rejected" && r.reason ? `📝 <b>السبب:</b> ${esc(r.reason)}` : "",
    "",
    `بواسطة: ${esc(by)}`,
  ].filter(Boolean).join("\n");
}

/** رابط مطلق — تليجرام لا يفتح مساراً نسبياً. */
export function absolute(path: string, siteUrl: string): string {
  if (/^https?:\/\//i.test(path)) return path;
  return `${siteUrl.replace(/\/$/, "")}${path.startsWith("/") ? "" : "/"}${path}`;
}

/** عنوان المنصّة كما تراه الشبكة — يلزم لروابط الصور في تليجرام. */
export function siteUrl(req?: Request): string {
  const env = (process.env.SITE_URL || process.env.NEXT_PUBLIC_SITE_URL || "").trim();
  if (env) return env.replace(/\/$/, "");
  if (process.env.VERCEL_PROJECT_PRODUCTION_URL) {
    return `https://${process.env.VERCEL_PROJECT_PRODUCTION_URL}`;
  }
  if (req) {
    try {
      const u = new URL(req.url);
      return `${u.protocol}//${u.host}`;
    } catch { /* تجاهل */ }
  }
  return "";
}
