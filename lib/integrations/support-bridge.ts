import "server-only";
import { getDB } from "@/lib/db/db";
import { tgSend, tgConfig, esc } from "@/lib/integrations/telegram";
import { sendToUsers } from "@/lib/integrations/push";
import type { ChatMessage, Ticket } from "@/lib/utils/types";

/**
 * جسر الدعم إلى تليجرام.
 * ------------------------------------------------------------------
 * رسالةُ الطالب تصل المشرفَ على تليجرام، ويردّ عليها هناك بـ«الردّ على
 * الرسالة» فيصل ردُّه الطالبَ داخل المنصّة كأيّ ردّ من الدعم — لا فرق
 * عند الطالب بين ردٍّ كُتب في اللوحة وردٍّ كُتب في تليجرام.
 *
 * الربط بين الرسالتين بمعرّف المحادثة المطبوع في نصّ الإشعار: تليجرام
 * يعيد نصّ الرسالة المردود عليها، فيُستخرج منه المعرّف. لا حاجة لجدول
 * وسيط ولا لحفظ معرّفات رسائل تليجرام.
 */

/** محادثة الدعم لها وجهتها الخاصّة إن ضُبطت، وإلا فوجهة التنبيهات العامّة. */
export function supportChatId(): string {
  const t = getDB().integrations?.telegram;
  return (t?.supportChatId || "").trim() || tgConfig().chatId;
}

export function supportBridgeOn(): boolean {
  const t = getDB().integrations?.telegram;
  return Boolean(tgConfig().token) && t?.enabled !== false && t?.supportOff !== true;
}

/** يرسل رسالة الطالب إلى تليجرام. */
export async function forwardStudentMessage(t: Ticket, text: string) {
  if (!supportBridgeOn()) return;
  const chatId = supportChatId();
  if (!chatId) return;

  const unread = (t.messages ?? []).filter((m) => m.from === "student" && !m.readByAdmin).length;
  await tgSend(
    [
      "💬 <b>رسالة دعم جديدة</b>",
      "",
      `👤 <b>الطالب:</b> ${esc(t.student)}`,
      unread > 1 ? `📨 <b>غير مقروءة:</b> ${unread}` : "",
      "",
      esc(text),
      "",
      `🆔 <code>${esc(t.id)}</code>`,
      "<i>ردّ على هذه الرسالة ليصل ردُّك الطالبَ داخل المنصّة.</i>",
    ].filter(Boolean).join("\n"),
    { chatId }
  );
}

/** معرّف المحادثة من نصّ رسالة تليجرام المردود عليها. */
export function ticketIdFrom(text: string): string | null {
  const m = String(text ?? "").match(/\bTK-[A-Z0-9]+\b/i);
  return m ? m[0].toUpperCase() : null;
}

/**
 * يسجّل ردّ المشرف القادم من تليجرام في المحادثة.
 * يعيد المحادثة عند النجاح، أو null إن لم تُوجد.
 */
export function replyFromTelegram(
  ticketId: string,
  text: string,
  authorName: string
): Ticket | null {
  const db = getDB();
  db.tickets = db.tickets ?? [];
  const t = db.tickets.find((x) => x.id.toUpperCase() === ticketId.toUpperCase());
  if (!t) return null;

  const msg: ChatMessage = {
    id: `MSG-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 6)}`,
    from: "support",
    text: text.slice(0, 1500),
    at: new Date().toISOString(),
    /* اسمُ الردّ يبقى اسمَ الدعم كما في اللوحة — الطالب لا يعنيه من أين
       كُتب الردّ، ولا يُكشف له حسابُ تليجرام. */
    authorName,
    readByStudent: false,
    readByAdmin: true,
  };
  t.messages = [...(t.messages ?? []), msg].slice(-300);
  t.lastAt = msg.at;
  if (t.status === "مغلقة") t.status = "مفتوحة";
  return t;
}

/** إشعار جهاز الطالب بردّ الدعم — تنبيه لا شرط. */
export async function notifySupportReply(t: Ticket, text: string) {
  const db = getDB();
  const user = db.users.find((u) => u.id === t.userId);
  if (!user) return;
  await sendToUsers([user], {
    title: "ردّ من الدعم",
    body: text.slice(0, 120),
    url: "/student/help",
  }).catch(() => { /* تجاهل */ });
}
