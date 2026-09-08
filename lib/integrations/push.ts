import "server-only";
import webpush from "web-push";
import { dropDeadSub, pushTargets } from "@/lib/db/db";
import type { Notification, User } from "@/lib/utils/types";

/**
 * إشعارات النظام (Web Push) — تظهر على شاشة الجهاز حتى والتطبيق مغلق.
 * • المفاتيح (VAPID) من متغيّرات البيئة؛ العام فقط يصل المتصفّح.
 * • الإرسال يستهدف نفس جمهور الإشعار داخل المنصّة (طالب/صف/شعبة).
 * • أي اشتراك يردّ 404/410 يُحذف تلقائياً (جهاز أُزيل التطبيق منه).
 */

const PUBLIC = process.env.VAPID_PUBLIC_KEY ?? "";
const PRIVATE = process.env.VAPID_PRIVATE_KEY ?? "";
const SUBJECT = process.env.VAPID_SUBJECT || "mailto:admin@example.com";

export function pushConfigured(): boolean {
  return Boolean(PUBLIC && PRIVATE);
}

export function publicVapidKey(): string {
  return PUBLIC;
}

let ready = false;
function ensure() {
  if (ready || !pushConfigured()) return;
  webpush.setVapidDetails(SUBJECT, PUBLIC, PRIVATE);
  ready = true;
}

export type PushPayload = {
  title: string;
  body: string;
  url?: string;
  tag?: string;
};

/** إرسال إشعار لجهاز واحد. */
async function sendOne(sub: { endpoint: string; p256dh: string; auth: string }, payload: PushPayload) {
  try {
    await webpush.sendNotification(
      { endpoint: sub.endpoint, keys: { p256dh: sub.p256dh, auth: sub.auth } },
      JSON.stringify(payload),
      { TTL: 60 * 60 * 24, urgency: "normal" }
    );
    return true;
  } catch (e) {
    const status = (e as { statusCode?: number }).statusCode;
    if (status === 404 || status === 410) dropDeadSub(sub.endpoint);
    return false;
  }
}

/** إرسال لكل أجهزة مجموعة طلاب. */
export async function sendToUsers(users: User[], payload: PushPayload): Promise<{ sent: number; failed: number }> {
  ensure();
  if (!pushConfigured()) return { sent: 0, failed: 0 };

  const jobs = users.flatMap((u) => (u.pushSubs ?? []).map((s) => sendOne(s, payload)));
  const results = await Promise.all(jobs);
  return {
    sent: results.filter(Boolean).length,
    failed: results.filter((r) => !r).length,
  };
}

/** إرسال إشعار المنصّة إلى أجهزة جمهوره. */
export async function pushNotification(n: Notification): Promise<{ sent: number; failed: number }> {
  const targets = pushTargets(n);
  return sendToUsers(targets, {
    title: n.title,
    body: n.body,
    url: n.link || "/student/notifications",
    tag: n.id,
  });
}
