import "server-only";
import { getDB, saveDB } from "@/lib/db/db";
import { clientIp, isTrustedIp } from "@/lib/auth/guard";
import { headers } from "next/headers";
import type { SecurityEvent, SecurityBan, SecurityKind } from "@/lib/utils/types";
import { AUTH_SECRET_IS_EPHEMERAL, ADMIN_PASSWORD_UNSET } from "@/lib/auth/secrets";

/**
 * سجلّ الأمان والحظر التلقائي.
 * • كل محاولة مشبوهة تُسجَّل (من؟ متى؟ من أي عنوان؟ ماذا حاول؟).
 * • تكرار المحاولات الخطيرة من نفس العنوان يؤدّي لحظره تلقائياً.
 * • السجلّ محفوظ مع بيانات المنصّة (فايربيز) ويظهر في لوحة الأمان.
 */

const MAX_EVENTS = 400;
/** حدّ التصعيد: عدد الأحداث الخطيرة خلال النافذة قبل الحظر التلقائي. */
const ESCALATE_COUNT = 8;
const ESCALATE_WINDOW = 10 * 60 * 1000; // ١٠ دقائق
const BAN_MINUTES = 60;

const HIGH: SecurityKind[] = [
  "login_failed",
  "unauthorized_admin",
  "device_mismatch",
  "bad_code",
  "path_probe",
  /* ملءُ الفخّ لا يقع من إنسانٍ أبداً — فهو دليلٌ قاطعٌ على آلةٍ تجرّب */
  "bot_trap",
  "csrf_blocked",
  "media_denied",
];

function store() {
  const db = getDB();
  db.security = db.security ?? { events: [], bans: [] };
  db.security.events = db.security.events ?? [];
  db.security.bans = db.security.bans ?? [];
  return db;
}

/** هل هذا العنوان محظور الآن؟ */
export function bannedUntil(ip: string): number | null {
  if (isTrustedIp(ip)) return null; // الخادم/الشبكة المحلية لا تُحظر
  const bans = getDB().security?.bans ?? [];
  const now = Date.now();
  const active = bans.find((b) => b.ip === ip && new Date(b.until).getTime() > now);
  return active ? new Date(active.until).getTime() : null;
}

/** حظر عنوان لمدّة محدّدة. */
export function banIp(ip: string, minutes: number, reason: string) {
  if (isTrustedIp(ip)) return; // منع قفل صاحب المنصّة خارج لوحته
  const db = store();
  const until = new Date(Date.now() + minutes * 60_000).toISOString();
  db.security!.bans = [
    { ip, until, reason, at: new Date().toISOString() },
    ...db.security!.bans.filter((b) => b.ip !== ip),
  ].slice(0, 200);
  saveDB(db);
}

export function unbanIp(ip: string) {
  const db = store();
  db.security!.bans = db.security!.bans.filter((b) => b.ip !== ip);
  saveDB(db);
}

/** تسجيل حدث أمني (ويحظر تلقائياً عند التكرار الخطير). */
export async function recordEvent(
  kind: SecurityKind,
  detail?: string,
  meta?: { userId?: string; username?: string }
): Promise<void> {
  try {
    const ip = await clientIp();
    const h = await headers();
    const ua = h.get("user-agent")?.slice(0, 180) ?? undefined;
    const at = new Date().toISOString();

    const db = store();
    const event: SecurityEvent = {
      id: `SEC-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
      at,
      kind,
      ip,
      ua,
      detail: detail?.slice(0, 200),
      userId: meta?.userId,
      username: meta?.username,
      severity: HIGH.includes(kind) ? "high" : "info",
    };
    db.security!.events = [event, ...db.security!.events].slice(0, MAX_EVENTS);

    // تصعيد: تكرار خطير من نفس العنوان ← حظر تلقائي
    if (event.severity === "high" && !isTrustedIp(ip)) {
      const since = Date.now() - ESCALATE_WINDOW;
      const recent = db.security!.events.filter(
        (e) => e.ip === ip && e.severity === "high" && new Date(e.at).getTime() > since
      ).length;
      if (recent >= ESCALATE_COUNT) {
        const until = new Date(Date.now() + BAN_MINUTES * 60_000).toISOString();
        db.security!.bans = [
          { ip, until, reason: `تكرار ${recent} محاولة مشبوهة (${kind})`, at },
          ...db.security!.bans.filter((b) => b.ip !== ip),
        ].slice(0, 200);
      }
    }
    saveDB(db);
  } catch {
    /* التسجيل لا يجوز أن يُفشل الطلب */
  }
}

/** إحصاءات سريعة للوحة الأمان. */
export function securityOverview() {
  const s = getDB().security ?? { events: [], bans: [] };
  const now = Date.now();
  const day = now - 86_400_000;
  const events = s.events ?? [];
  return {
    events: events.slice(0, 100),
    bans: (s.bans ?? []).filter((b) => new Date(b.until).getTime() > now),
    stats: {
      total: events.length,
      last24h: events.filter((e) => new Date(e.at).getTime() > day).length,
      high: events.filter((e) => e.severity === "high").length,
      activeBans: (s.bans ?? []).filter((b) => new Date(b.until).getTime() > now).length,
    },
    /*
      حالةُ التحصين — تُقرأ من الخادم، لا تُخمَّن.
      ------------------------------------------------------------------
      هذه أعلامٌ كانت تُطبع في سجلّ الخادم وحدَه، فلا يراها المشرفُ في
      اللوحة — فلا يعرف أمحميٌّ هو أم على سرٍّ مؤقّت. فتُرفع إلى هنا:
      كلٌّ `true` = مضبوطٌ وقويّ، و`false` = ناقصٌ يحتاج ضبطاً.
    */
    hardening: {
      authSecret: !AUTH_SECRET_IS_EPHEMERAL,   // سرُّ توقيع الجلسات مضبوطٌ ودائم
      adminPassword: !ADMIN_PASSWORD_UNSET,     // كلمةُ مرور الأدمن مضبوطة
      cookieSecure: process.env.COOKIE_SECURE === "1" || process.env.VERCEL === "1",
    },
  };
}
