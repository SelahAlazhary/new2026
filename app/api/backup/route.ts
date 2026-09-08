import { NextResponse } from "next/server";
import fs from "fs";
import path from "path";
import { getDB, saveDB, loadDB, flushDB } from "@/lib/db/db";
import { createBackup, backupHistory, restoreSnapshot, restoreFromDrive } from "@/lib/db/backup";
import { googleStatus, uploadBufferToDrive } from "@/lib/integrations/google";
import { getSession } from "@/lib/auth/session";
import { recordEvent } from "@/lib/auth/security";
import { tenantRoute } from "@/lib/hub/context";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

/** GET: سجلّ النسخ الاحتياطية وحالة التخزين — للأدمن فقط. */
async function GET_impl() {
  await loadDB();
  const session = await getSession();
  if (!session || session.role !== "admin") {
    await recordEvent("unauthorized_admin", "/api/backup");
    return NextResponse.json({ error: "غير مصرّح" }, { status: 401 });
  }
  const db = getDB();
  const localFiles = countLocalFiles();
  return NextResponse.json({
    ...backupHistory(),
    counts: {
      users: db.users.length,
      subjects: db.subjects.length,
      plans: db.plans.length,
      codes: db.codes.length,
      exams: db.exams.length,
      live: db.live.length,
      notifications: db.notifications.length,
    },
    localFiles,
    driveReady: googleStatus().connected,
  });
}

/** POST: { action: "backup" | "migrate" } — للأدمن فقط. */
async function POST_impl(req: Request) {
  await loadDB();
  const session = await getSession();
  if (!session || session.role !== "admin") {
    await recordEvent("unauthorized_admin", "/api/backup");
    return NextResponse.json({ error: "غير مصرّح" }, { status: 401 });
  }
  const body = await req.json().catch(() => ({ action: "backup" }));
  const action = body?.action ?? "backup";

  // استعادة من ملف رفعه الأدمن من جهازه
  if (action === "restore") {
    const result = await restoreSnapshot(body?.data);
    await flushDB();
    return NextResponse.json(result, { status: result.ok ? 200 : 400 });
  }

  // استعادة من نسخة محفوظة في Drive
  if (action === "restoreDrive") {
    const result = await restoreFromDrive(String(body?.fileId ?? ""));
    await flushDB();
    return NextResponse.json(result, { status: result.ok ? 200 : 400 });
  }

  if (action === "migrate") {
    const result = await migrateLocalFiles();
    await flushDB();
    return NextResponse.json({ ok: true, ...result });
  }

  const result = await createBackup("manual");
  await flushDB();
  return NextResponse.json({ ok: result.ok, result });
}

/* ---------- ملفات الخادم المحلية ---------- */

const UPLOAD_DIR = path.join(process.cwd(), "public", "uploads");

function countLocalFiles(): number {
  try {
    return fs.existsSync(UPLOAD_DIR) ? fs.readdirSync(UPLOAD_DIR).length : 0;
  } catch {
    return 0;
  }
}

function mimeOf(name: string): string {
  const ext = name.split(".").pop()?.toLowerCase() ?? "";
  const map: Record<string, string> = {
    png: "image/png", jpg: "image/jpeg", jpeg: "image/jpeg", webp: "image/webp",
    gif: "image/gif", svg: "image/svg+xml", avif: "image/avif",
    mp4: "video/mp4", webm: "video/webm", mov: "video/quicktime",
    pdf: "application/pdf", mp3: "audio/mpeg",
  };
  return map[ext] ?? "application/octet-stream";
}

/**
 * نقل كل الملفات المحلية إلى Drive وتحديث روابطها داخل البيانات،
 * ثم حذفها من قرص الخادم — فلا يبقى شيء محلي.
 */
async function migrateLocalFiles(): Promise<{ moved: number; failed: number; skipped: number }> {
  if (!googleStatus().connected) return { moved: 0, failed: 0, skipped: countLocalFiles() };
  if (!fs.existsSync(UPLOAD_DIR)) return { moved: 0, failed: 0, skipped: 0 };

  const files = fs.readdirSync(UPLOAD_DIR);
  let moved = 0;
  let failed = 0;
  const map = new Map<string, string>(); // /api/file/x -> /api/media/id

  for (const name of files) {
    try {
      const buf = fs.readFileSync(path.join(UPLOAD_DIR, name));
      const up = await uploadBufferToDrive(name, mimeOf(name), buf);
      map.set(`/api/file/${name}`, `/api/media/${up.fileId}`);
      moved++;
    } catch {
      failed++;
    }
  }

  if (map.size) {
    // استبدال الروابط في كل مواضعها داخل قاعدة البيانات
    const db = getDB();
    let json = JSON.stringify(db);
    for (const [from, to] of map) json = json.split(from).join(to);
    saveDB(JSON.parse(json));

    // حذف الملفات المنقولة من الخادم
    for (const name of files) {
      if (!map.has(`/api/file/${name}`)) continue;
      try {
        fs.unlinkSync(path.join(UPLOAD_DIR, name));
      } catch {
        /* تجاهل */
      }
    }
  }

  return { moved, failed, skipped: 0 };
}

/* كلُّ معالجٍ يعمل داخل سياق منصّته — انظر lib/hub/context.ts */
export const GET = tenantRoute(GET_impl);
export const POST = tenantRoute(POST_impl);
