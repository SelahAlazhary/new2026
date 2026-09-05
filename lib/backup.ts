import "server-only";
import { getDB, saveDB } from "./db";
import { fbSet, fbGet, firebaseConfigured } from "./firebase";
import { googleStatus, uploadBufferToDrive, deleteDriveFile, backupFolderId, downloadDriveFile } from "./google";
import type { BackupEntry, DB } from "./types";
import { currentTenant, tenantPath } from "./hub/context";

/**
 * النسخ الاحتياطي الكامل للمنصّة.
 * • وجهتان مستقلّتان: ملف JSON في Google Drive + لقطة داخل Firebase.
 * • تلقائي كل يوم (يُفحَص عند أول طلب بعد مرور ٢٤ ساعة) ويدوي بضغطة.
 * • يُحتفظ بآخر ٣٠ نسخة في Drive وآخر ٧ لقطات في فايربيز، والأقدم يُحذف تلقائياً.
 */

const DRIVE_KEEP = 30;
const FB_KEEP = 7;
const DAY = 24 * 60 * 60 * 1000;

function stamp(d = new Date()): string {
  const p = (n: number) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${p(d.getMonth() + 1)}-${p(d.getDate())}_${p(d.getHours())}${p(d.getMinutes())}`;
}

/** لقطة نظيفة من قاعدة البيانات (بلا رموز التكاملات السرّية). */
function snapshot(db: DB): DB {
  const { integrations, ...rest } = db;
  return {
    ...rest,
    integrations: integrations
      ? {
          // نحتفظ بمراجع غير سرّية فقط داخل النسخة
          driveBackupFolderId: integrations.driveBackupFolderId,
          lastBackupAt: integrations.lastBackupAt,
          google: integrations.google ? { connected: integrations.google.connected, email: integrations.google.email } : undefined,
        }
      : undefined,
  } as DB;
}

export type BackupResult = {
  ok: boolean;
  at: string;
  size: number;
  drive: { ok: boolean; name?: string; fileId?: string; error?: string };
  firebase: { ok: boolean; error?: string };
};

/** تنفيذ نسخة احتياطية كاملة. */
export async function createBackup(reason: "manual" | "auto" = "manual"): Promise<BackupResult> {
  const db = getDB();
  const data = snapshot(db);
  const json = JSON.stringify(data);
  const size = Buffer.byteLength(json, "utf-8");
  const at = new Date().toISOString();
  /* اسمُ الملف يحمل معرّفَ المنصّة — مجلّدُ Drive واحدٌ قد يجمع أكثر من منصّة */
  const name = `emz-backup-${currentTenant().slug}-${stamp()}.json`;

  const result: BackupResult = {
    ok: false, at, size,
    drive: { ok: false },
    firebase: { ok: false },
  };

  /* --- Google Drive --- */
  if (googleStatus().connected) {
    try {
      const folder = await backupFolderId();
      const up = await uploadBufferToDrive(name, "application/json", Buffer.from(json, "utf-8"), folder);
      result.drive = { ok: true, name, fileId: up.fileId };
      void pruneDrive(folder);
    } catch (e) {
      result.drive = { ok: false, error: (e as Error).message };
    }
  } else {
    result.drive = { ok: false, error: "حساب جوجل غير مربوط" };
  }

  /* --- Firebase --- */
  if (firebaseConfigured()) {
    try {
      await fbSet(tenantPath(`backups/${at.replace(/[.:]/g, "-")}`), { at, reason, size, data });
      result.firebase = { ok: true };
      void pruneFirebase();
    } catch (e) {
      result.firebase = { ok: false, error: (e as Error).message };
    }
  } else {
    result.firebase = { ok: false, error: "التخزين السحابي غير مضبوط" };
  }

  result.ok = result.drive.ok || result.firebase.ok;

  // تسجيل النسخة في بيانات المنصّة
  const fresh = getDB();
  fresh.integrations = fresh.integrations ?? {};
  const entry: BackupEntry = {
    at, reason, size,
    driveFileId: result.drive.fileId,
    driveName: result.drive.name,
    firebase: result.firebase.ok,
    error: result.ok ? undefined : result.drive.error || result.firebase.error,
  };
  fresh.integrations.backups = [entry, ...(fresh.integrations.backups ?? [])].slice(0, 60);
  if (result.ok) fresh.integrations.lastBackupAt = at;
  saveDB(fresh);

  return result;
}

/** نسخة تلقائية إن مرّ يوم على آخر واحدة (تُفحَص عند الطلبات، بلا مؤقّتات خارجية). */
let checking = false;
export async function maybeAutoBackup(): Promise<void> {
  if (checking) return;
  const last = getDB().integrations?.lastBackupAt;
  if (last && Date.now() - new Date(last).getTime() < DAY) return;
  checking = true;
  try {
    await createBackup("auto");
  } catch {
    /* لا يُعطّل الطلب */
  } finally {
    checking = false;
  }
}

/** حذف النسخ الزائدة من Drive. */
async function pruneDrive(folderId: string): Promise<void> {
  try {
    const db = getDB();
    const olds = (db.integrations?.backups ?? [])
      .filter((b) => b.driveFileId)
      .slice(DRIVE_KEEP);
    for (const b of olds) {
      if (b.driveFileId) await deleteDriveFile(b.driveFileId);
    }
  } catch {
    /* التنظيف ليس حرجاً */
  }
}

/** إبقاء آخر لقطات فايربيز فقط. */
async function pruneFirebase(): Promise<void> {
  try {
    const all = await fbGet<Record<string, unknown>>(tenantPath("backups"));
    if (!all) return;
    const keys = Object.keys(all).sort();
    for (const k of keys.slice(0, Math.max(0, keys.length - FB_KEEP))) {
      await fbSet(tenantPath(`backups/${k}`), null);
    }
  } catch {
    /* التنظيف ليس حرجاً */
  }
}

/** آخر النسخ المسجّلة (للعرض في اللوحة). */
export function backupHistory(): { last?: string; items: BackupEntry[] } {
  const it = getDB().integrations;
  return { last: it?.lastBackupAt, items: (it?.backups ?? []).slice(0, 20) };
}

/* ---------- الاستعادة ---------- */

export type RestoreResult = { ok: boolean; error?: string; users?: number; safetyBackup?: boolean };

/** التحقّق من سلامة النسخة قبل اعتمادها. */
function validSnapshot(data: unknown): data is DB {
  const d = data as DB | null;
  if (!d || typeof d !== "object") return false;
  if (!Array.isArray(d.users) || d.users.length === 0) return false;
  if (!d.users.some((u) => u.role === "admin" && u.passwordHash)) return false;
  if (!d.content || typeof d.content !== "object") return false;
  return true;
}

/**
 * استعادة نسخة احتياطية.
 * • تُؤخذ نسخة أمان تلقائية أولاً حتى يمكن التراجع.
 * • تُحفظ أسرار التكاملات الحالية (رموز جوجل/يوتيوب) فلا ينقطع الربط بعد الاستعادة.
 */
export async function restoreSnapshot(raw: unknown): Promise<RestoreResult> {
  if (!validSnapshot(raw)) {
    return { ok: false, error: "الملف ليس نسخة احتياطية صالحة (لا يحتوي حسابات أو محتوى المنصّة)" };
  }

  let safety = false;
  try {
    const r = await createBackup("auto");
    safety = r.ok;
  } catch {
    /* لا يمنع الاستعادة */
  }

  const current = getDB();
  const restored: DB = {
    ...raw,
    // الأسرار تبقى من التشغيل الحالي لا من الملف
    integrations: {
      ...(raw.integrations ?? {}),
      google: current.integrations?.google,
      youtubeApiKey: current.integrations?.youtubeApiKey,
      driveBackupFolderId: current.integrations?.driveBackupFolderId,
      lastBackupAt: current.integrations?.lastBackupAt,
      backups: current.integrations?.backups,
    },
  };

  saveDB(restored);
  return { ok: true, users: restored.users.length, safetyBackup: safety };
}

/** استعادة من ملف محفوظ في Drive. */
export async function restoreFromDrive(fileId: string): Promise<RestoreResult> {
  if (!googleStatus().connected) return { ok: false, error: "حساب جوجل غير مربوط" };
  try {
    const text = await downloadDriveFile(fileId);
    return await restoreSnapshot(JSON.parse(text));
  } catch (e) {
    return { ok: false, error: (e as Error).message };
  }
}
