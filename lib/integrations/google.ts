import "server-only";
import { getDB, saveDB } from "@/lib/db/db";
import type { GoogleIntegration } from "@/lib/utils/types";

/**
 * تكامل Google Meet عبر Google Calendar API.
 * • الأسرار (client id/secret) من متغيّرات البيئة فقط — لا تُكتب في الكود ولا تصل للمتصفّح.
 * • الرموز (access/refresh) تُحفظ في db.integrations.google ولا تُرسل في أي حمولة عامة.
 * • رابط Meet يُنشأ بإنشاء حدث في التقويم مع conferenceData.createRequest.
 */

const AUTH_URL = "https://accounts.google.com/o/oauth2/v2/auth";
const TOKEN_URL = "https://oauth2.googleapis.com/token";
const REVOKE_URL = "https://oauth2.googleapis.com/revoke";
const USERINFO_URL = "https://openidconnect.googleapis.com/v1/userinfo";
const CALENDAR_EVENTS = "https://www.googleapis.com/calendar/v3/calendars/primary/events";
const DRIVE_UPLOAD = "https://www.googleapis.com/upload/drive/v3/files";
const DRIVE_FILES = "https://www.googleapis.com/drive/v3/files";
/** اسم مجلّد الوسائط داخل Drive حساب المعلّمة. */
const MEDIA_FOLDER = "وسائط المنصّة";

/**
 * النطاقات المطلوبة — وهي أقلُّ ما يكفي، وتتغيّر بحسب ما يُستعمل فعلاً.
 *
 * **ولماذا تُقسَم؟** لأنّ جوجل تصنّف النطاقات: `drive.file` غيرُ حسّاس —
 * لا يرى إلّا ما أنشأه هذا التطبيق نفسُه، ولا يقترب من بقيّة ملفات
 * الحساب. أمّا `calendar.events` فحسّاس.
 *
 * وهذا التصنيفُ يقرّر تجربةَ الربط كلَّها: تطبيقٌ لا يطلب إلّا غيرَ
 * الحسّاس يُنشر للإنتاج فيربطه **أيُّ بريد** بلا شاشةِ «تطبيق غير
 * مُتحقَّق منه» وبلا سقفِ المئة مستخدم. فإن طلب الحسّاسَ لزمته مراجعةُ
 * جوجل، وإلّا ظهر التحذيرُ لكلّ من يربط.
 *
 * فالتقويمُ لا يُطلب إلّا لمن يريد Meet — ومن لا يريده لا يدفع ثمنه.
 */
const SCOPE_BASE = [
  "https://www.googleapis.com/auth/drive.file",
  "openid",
  "email",
];
const SCOPE_MEET = "https://www.googleapis.com/auth/calendar.events";

/** هل طُلب Meet؟ الأصلُ لا — فالربطُ نظيفٌ ما لم يُطلب غيرُه. */
export function meetWanted(): boolean {
  return getDB().content.googleMeet === true;
}

export function googleScopes(): string {
  return (meetWanted() ? [SCOPE_MEET, ...SCOPE_BASE] : SCOPE_BASE).join(" ");
}

/** للتوافق مع ما يستوردها نصّاً. */
export const GOOGLE_SCOPES = [SCOPE_MEET, ...SCOPE_BASE].join(" ");

export function googleConfigured(): boolean {
  return Boolean(process.env.GOOGLE_CLIENT_ID && process.env.GOOGLE_CLIENT_SECRET);
}

/** عنوان العودة: من البيئة إن وُجد، وإلا يُشتق من أصل الطلب. */
export function redirectUri(req: Request): string {
  if (process.env.GOOGLE_REDIRECT_URI) return process.env.GOOGLE_REDIRECT_URI;
  return new URL("/api/google/callback", new URL(req.url).origin).toString();
}

export function authUrl(req: Request, state: string): string {
  const p = new URLSearchParams({
    client_id: process.env.GOOGLE_CLIENT_ID!,
    redirect_uri: redirectUri(req),
    response_type: "code",
    scope: googleScopes(),
    access_type: "offline",     // نحتاج refresh_token
    prompt: "consent",          // لضمان إرجاع refresh_token في كل ربط
    include_granted_scopes: "true",
    state,
  });
  return `${AUTH_URL}?${p.toString()}`;
}

type TokenResponse = {
  access_token: string;
  refresh_token?: string;
  expires_in: number;
  scope?: string;
  error?: string;
  error_description?: string;
};

async function tokenRequest(body: Record<string, string>): Promise<TokenResponse> {
  const res = await fetch(TOKEN_URL, {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams(body).toString(),
    cache: "no-store",
  });
  const data = (await res.json()) as TokenResponse;
  if (!res.ok) throw new Error(data.error_description || data.error || "فشل الاتصال بجوجل");
  return data;
}

/* ---------- تخزين حالة الربط ---------- */

function readIntegration(): GoogleIntegration | undefined {
  return getDB().integrations?.google;
}

function writeIntegration(patch: Partial<GoogleIntegration>) {
  const db = getDB();
  db.integrations = db.integrations ?? {};
  db.integrations.google = { ...(db.integrations.google ?? { connected: false }), ...patch };
  saveDB(db);
  return db.integrations.google;
}

export function googleStatus(): { connected: boolean; email?: string; connectedAt?: string; configured: boolean } {
  const g = readIntegration();
  return {
    configured: googleConfigured(),
    connected: Boolean(g?.connected && g?.refreshToken),
    email: g?.email,
    connectedAt: g?.connectedAt,
  };
}

/** إتمام الربط بعد موافقة المالك. */
export async function connectWithCode(req: Request, code: string) {
  const tokens = await tokenRequest({
    code,
    client_id: process.env.GOOGLE_CLIENT_ID!,
    client_secret: process.env.GOOGLE_CLIENT_SECRET!,
    redirect_uri: redirectUri(req),
    grant_type: "authorization_code",
  });

  let email: string | undefined;
  try {
    const me = await fetch(USERINFO_URL, {
      headers: { Authorization: `Bearer ${tokens.access_token}` },
      cache: "no-store",
    });
    if (me.ok) email = (await me.json()).email;
  } catch {
    /* البريد اختياري — لا يمنع الربط */
  }

  const existing = readIntegration();
  writeIntegration({
    connected: true,
    email,
    accessToken: tokens.access_token,
    // جوجل لا تُعيد refresh_token في كل مرّة — نُبقي القديم إن لم يصل جديد
    refreshToken: tokens.refresh_token ?? existing?.refreshToken,
    expiryDate: Date.now() + tokens.expires_in * 1000,
    scope: tokens.scope,
    connectedAt: new Date().toISOString(),
  });
  return { email };
}

/** رمز وصول صالح للاستخدام من مسار الوسائط. */
export async function driveAccessToken(): Promise<string> {
  return validAccessToken();
}

/** رمز وصول صالح (يُجدَّد تلقائياً قبل انتهائه بدقيقة). */
async function validAccessToken(): Promise<string> {
  const g = readIntegration();
  if (!g?.connected || !g.refreshToken) throw new Error("حساب جوجل غير مربوط");
  if (g.accessToken && g.expiryDate && g.expiryDate - 60_000 > Date.now()) return g.accessToken;

  const tokens = await tokenRequest({
    client_id: process.env.GOOGLE_CLIENT_ID!,
    client_secret: process.env.GOOGLE_CLIENT_SECRET!,
    refresh_token: g.refreshToken,
    grant_type: "refresh_token",
  });
  writeIntegration({
    accessToken: tokens.access_token,
    expiryDate: Date.now() + tokens.expires_in * 1000,
  });
  return tokens.access_token;
}

export async function disconnectGoogle() {
  const g = readIntegration();
  const token = g?.refreshToken || g?.accessToken;
  if (token) {
    try {
      await fetch(`${REVOKE_URL}?token=${encodeURIComponent(token)}`, { method: "POST", cache: "no-store" });
    } catch {
      /* حتى لو فشل الإلغاء عند جوجل، نمسح الرموز محلياً */
    }
  }
  const db = getDB();
  db.integrations = { ...(db.integrations ?? {}), google: { connected: false } };
  saveDB(db);
}

/* ---------- إنشاء اجتماع ---------- */

export type MeetInput = {
  title: string;
  description?: string;
  startsAt: string;      // ISO
  durationMinutes: number;
  timeZone?: string;
};

export async function createMeet(input: MeetInput): Promise<{ meetUrl: string; eventId: string; htmlLink?: string; startsAt: string; endsAt: string }> {
  const token = await validAccessToken();
  const start = new Date(input.startsAt);
  if (!Number.isFinite(start.getTime())) throw new Error("موعد غير صالح");
  const end = new Date(start.getTime() + Math.max(15, input.durationMinutes) * 60_000);
  const timeZone = input.timeZone || "Africa/Cairo";

  const res = await fetch(`${CALENDAR_EVENTS}?conferenceDataVersion=1`, {
    method: "POST",
    headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
    cache: "no-store",
    body: JSON.stringify({
      summary: input.title,
      description: input.description,
      start: { dateTime: start.toISOString(), timeZone },
      end: { dateTime: end.toISOString(), timeZone },
      conferenceData: {
        createRequest: {
          requestId: `emz-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
          conferenceSolutionKey: { type: "hangoutsMeet" },
        },
      },
      guestsCanInviteOthers: false,
      guestsCanSeeOtherGuests: false,
    }),
  });

  const data = await res.json();
  if (!res.ok) {
    throw new Error(data?.error?.message || "تعذّر إنشاء اجتماع Google Meet");
  }
  const meetUrl: string | undefined =
    data.hangoutLink ||
    data.conferenceData?.entryPoints?.find((e: { entryPointType?: string; uri?: string }) => e.entryPointType === "video")?.uri;
  if (!meetUrl) throw new Error("لم يُرجِع جوجل رابط اجتماع — تأكّد من تفعيل Google Meet للحساب");

  return { meetUrl, eventId: data.id, htmlLink: data.htmlLink, startsAt: start.toISOString(), endsAt: end.toISOString() };
}

/* ---------- استضافة الوسائط على Google Drive ---------- */

/** مجلّد الوسائط (يُنشأ مرة واحدة ويُحفظ معرّفه). */
async function mediaFolderId(token: string): Promise<string> {
  const saved = getDB().integrations?.google?.driveFolderId;
  if (saved) return saved;

  const q = encodeURIComponent(
    `name='${MEDIA_FOLDER}' and mimeType='application/vnd.google-apps.folder' and trashed=false`
  );
  const found = await fetch(`${DRIVE_FILES}?q=${q}&fields=files(id)&pageSize=1`, {
    headers: { Authorization: `Bearer ${token}` },
    cache: "no-store",
  }).then((r) => r.json());

  let id: string | undefined = found?.files?.[0]?.id;
  if (!id) {
    const created = await fetch(`${DRIVE_FILES}?fields=id`, {
      method: "POST",
      headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
      cache: "no-store",
      body: JSON.stringify({ name: MEDIA_FOLDER, mimeType: "application/vnd.google-apps.folder" }),
    }).then((r) => r.json());
    id = created?.id;
  }
  if (!id) throw new Error("تعذّر إنشاء مجلّد الوسائط في Drive");
  writeIntegration({ driveFolderId: id });
  return id;
}

export type DriveUpload = {
  fileId: string;
  url: string;        // الرابط الذي يُخزَّن ويُعرض في المنصّة
  kind: "image" | "video" | "file";
  name: string;
};

/**
 * رفع ملف إلى Drive الحساب المربوط ومشاركته «لمن لديه الرابط»، ثم إعادة رابط عرض مباشر.
 * • الصور: CDN جوجل (lh3) — سريع ويُستخدم مباشرة في <img>.
 * • الفيديو والمستندات: صفحة المعاينة (iframe) — يدعمها مشغّل الدروس.
 */
export async function uploadToDrive(file: File): Promise<DriveUpload> {
  const token = await validAccessToken();
  const folder = await mediaFolderId(token);
  const type = file.type || "application/octet-stream";

  const meta = { name: `${Date.now()}-${file.name}`, parents: [folder] };
  const boundary = `emz${Math.random().toString(36).slice(2)}`;
  const head = `--${boundary}\r\nContent-Type: application/json; charset=UTF-8\r\n\r\n${JSON.stringify(meta)}\r\n--${boundary}\r\nContent-Type: ${type}\r\n\r\n`;
  const tail = `\r\n--${boundary}--`;
  const body = new Blob([head, file, tail], { type: `multipart/related; boundary=${boundary}` });

  const res = await fetch(`${DRIVE_UPLOAD}?uploadType=multipart&fields=id,name,mimeType`, {
    method: "POST",
    headers: { Authorization: `Bearer ${token}` },
    body,
    cache: "no-store",
  });
  const data = await res.json();
  if (!res.ok || !data?.id) {
    throw new Error(data?.error?.message || "تعذّر رفع الملف إلى Drive");
  }

  // مشاركة: أي شخص لديه الرابط يستطيع العرض (بلا فهرسة عامة)
  await fetch(`${DRIVE_FILES}/${data.id}/permissions`, {
    method: "POST",
    headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
    cache: "no-store",
    body: JSON.stringify({ role: "reader", type: "anyone" }),
  });

  const isImage = type.startsWith("image/");
  const isVideo = type.startsWith("video/");
  return {
    fileId: data.id,
    kind: isImage ? "image" : isVideo ? "video" : "file",
    name: data.name,
    // الفيديو يُعرض عبر مشغّل Drive (يعمل داخل iframe)، وبقية الملفات عبر وسيط نطاقنا
    // لأن جوجل تحجب الصور عند وجود ترويسة Referer.
    url: isVideo ? `https://drive.google.com/file/d/${data.id}/preview` : `/api/media/${data.id}`,
  };
}

/* ---------- ملفات عامة على Drive (النسخ الاحتياطي) ---------- */

const BACKUP_FOLDER = "منصّة الشيماء أحمد — النسخ الاحتياطية";

/** مجلّد النسخ الاحتياطية (يُنشأ مرة واحدة ويُحفظ معرّفه). */
export async function backupFolderId(): Promise<string> {
  const saved = getDB().integrations?.driveBackupFolderId;
  if (saved) return saved;
  const token = await validAccessToken();
  const q = encodeURIComponent(
    `name='${BACKUP_FOLDER}' and mimeType='application/vnd.google-apps.folder' and trashed=false`
  );
  const found = await fetch(`${DRIVE_FILES}?q=${q}&fields=files(id)&pageSize=1`, {
    headers: { Authorization: `Bearer ${token}` },
    cache: "no-store",
  }).then((r) => r.json());
  let id: string | undefined = found?.files?.[0]?.id;
  if (!id) {
    const created = await fetch(`${DRIVE_FILES}?fields=id`, {
      method: "POST",
      headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
      cache: "no-store",
      body: JSON.stringify({ name: BACKUP_FOLDER, mimeType: "application/vnd.google-apps.folder" }),
    }).then((r) => r.json());
    id = created?.id;
  }
  if (!id) throw new Error("تعذّر إنشاء مجلّد النسخ الاحتياطية");
  const db = getDB();
  db.integrations = db.integrations ?? {};
  db.integrations.driveBackupFolderId = id;
  saveDB(db);
  return id;
}

/** رفع محتوى (نصّي/ثنائي) إلى Drive — يُستخدم لملفات النسخ الاحتياطي. */
export async function uploadBufferToDrive(
  name: string,
  mimeType: string,
  buffer: Buffer,
  folderId?: string
): Promise<{ fileId: string; name: string }> {
  const token = await validAccessToken();
  const meta: Record<string, unknown> = { name };
  if (folderId) meta.parents = [folderId];

  const boundary = `emz${Math.random().toString(36).slice(2)}`;
  const CRLF = "\r\n";
  const head =
    `--${boundary}${CRLF}Content-Type: application/json; charset=UTF-8${CRLF}${CRLF}` +
    `${JSON.stringify(meta)}${CRLF}` +
    `--${boundary}${CRLF}Content-Type: ${mimeType}${CRLF}${CRLF}`;
  const tail = `${CRLF}--${boundary}--`;
  const body = Buffer.concat([Buffer.from(head, "utf-8"), buffer, Buffer.from(tail, "utf-8")]);

  const res = await fetch(`${DRIVE_UPLOAD}?uploadType=multipart&fields=id,name`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": `multipart/related; boundary=${boundary}`,
      "Content-Length": String(body.byteLength),
    },
    body: new Uint8Array(body),
    cache: "no-store",
  });
  const data = await res.json();
  if (!res.ok || !data?.id) throw new Error(data?.error?.message || "تعذّر رفع الملف إلى Drive");
  return { fileId: data.id, name: data.name };
}

/** تنزيل محتوى ملف من Drive (لاستعادة نسخة احتياطية). */
export async function downloadDriveFile(fileId: string): Promise<string> {
  const token = await validAccessToken();
  const res = await fetch(`${DRIVE_FILES}/${fileId}?alt=media`, {
    headers: { Authorization: `Bearer ${token}` },
    cache: "no-store",
  });
  if (!res.ok) throw new Error("تعذّر تنزيل النسخة من Drive");
  return res.text();
}

/** حذف ملف من Drive (تنظيف النسخ القديمة). */
export async function deleteDriveFile(fileId: string): Promise<void> {
  const token = await validAccessToken();
  await fetch(`${DRIVE_FILES}/${fileId}`, {
    method: "DELETE",
    headers: { Authorization: `Bearer ${token}` },
    cache: "no-store",
  });
}

/** حذف من التقويم (عند حذف الجلسة من اللوحة). */
export async function deleteMeetEvent(eventId: string): Promise<void> {
  const token = await validAccessToken();
  await fetch(`${CALENDAR_EVENTS}/${encodeURIComponent(eventId)}`, {
    method: "DELETE",
    headers: { Authorization: `Bearer ${token}` },
    cache: "no-store",
  });
}
