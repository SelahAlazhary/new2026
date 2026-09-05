import { NextResponse } from "next/server";
import fs from "fs";
import path from "path";
import crypto from "crypto";
import { getSession } from "@/lib/session";
import { recordEvent } from "@/lib/security";
import { getDB, loadDB } from "@/lib/db";
import { googleStatus, uploadToDrive } from "@/lib/google";
import { limit } from "@/lib/guard";
import { tenantRoute } from "@/lib/hub/context";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

const UPLOAD_DIR = path.join(process.cwd(), "public", "uploads");
// صيغ الملفات المسموحة: صور + فيديو + مستندات
const ALLOWED_EXT = new Set([
  "png","jpg","jpeg","webp","svg","gif","avif","bmp","ico","tiff","tif","heic","heif",
  "mp4","webm","mov","mkv","m4v","ogv","ogg","avi", // فيديو
  "pdf","doc","docx","ppt","pptx","xls","xlsx","txt","zip","rar","mp3","m4a", // مستندات/صوت
]);
const MAX_SIZE = 500 * 1024 * 1024; // 500MB (يتّسع للفيديوهات)
/** إيصال الطالب صورة واحدة لا مكتبة وسائط — حدّ أضيق وصيغ أقلّ. */
const RECEIPT_MAX = 8 * 1024 * 1024;
const RECEIPT_EXT = new Set(["png", "jpg", "jpeg", "webp", "gif", "avif", "heic", "heif"]);

/**
 * POST: رفع صورة/فيديو/ملف — للأدمن فقط.
 * الوجهة: Google Drive الحساب المربوط إذا فُعّل ذلك من التخصيص (mediaHost = "drive")،
 * وإلا تخزين الخادم المحلي. يمكن فرض الوجهة بحقل النموذج `target`.
 */
async function POST_impl(req: Request) {
  await loadDB();
  const session = await getSession();
  const form = await req.formData();
  const file = form.get("file");
  /*
    الطالب يرفع إيصال تحويله وحده: صورة واحدة صغيرة بصيغ صور فقط
    ومعدّل محدود. أي شيء غير ذلك يبقى للأدمن كما كان — فتح المسار
    للطلاب على مصراعيه يجعل المنصّة مستضيفَ ملفات لأي مسجَّل.
  */
  const receipt = String(form.get("purpose") ?? "") === "receipt";

  if (receipt) {
    if (!session || session.role !== "student") {
      return NextResponse.json({ error: "سجّل الدخول كطالب أولاً" }, { status: 401 });
    }
    const gate = limit(`receipt:${session.uid}`, 12, 10 * 60_000, 20 * 60_000);
    if (!gate.ok) {
      return NextResponse.json({ error: "محاولات رفع كثيرة — انتظر قليلاً" }, { status: 429 });
    }
  } else if (!session || session.role !== "admin") {
    await recordEvent("unauthorized_admin", new URL(req?.url ?? "http://x/").pathname);
    return NextResponse.json({ error: "غير مصرّح" }, { status: 401 });
  }

  if (!(file instanceof File)) {
    return NextResponse.json({ error: "لا يوجد ملف" }, { status: 400 });
  }
  const ext = (file.name.split(".").pop() || "").toLowerCase().replace(/[^a-z0-9]/g, "");
  const isImage = (file.type || "").startsWith("image/");
  const isMedia = isImage || (file.type || "").startsWith("video/") || (file.type || "").startsWith("audio/");

  if (receipt) {
    if (!isImage && !RECEIPT_EXT.has(ext)) {
      return NextResponse.json({ error: "أرفق صورة للإيصال" }, { status: 415 });
    }
    if (file.size > RECEIPT_MAX) {
      return NextResponse.json({ error: "حجم الصورة أكبر من ٨ ميجابايت" }, { status: 413 });
    }
  } else {
    if (!isMedia && !ALLOWED_EXT.has(ext)) {
      return NextResponse.json({ error: "نوع ملف غير مدعوم" }, { status: 415 });
    }
    if (file.size > MAX_SIZE) {
      return NextResponse.json({ error: "الحجم أكبر من 500 ميجابايت" }, { status: 413 });
    }
  }

  // ---- الوجهة: Google Drive (في الخلفية) ----
  const forced = String(form.get("target") ?? "");
  // الوجهة الافتراضية: Drive متى كان الحساب مربوطاً — لا تُخزَّن ملفات على الخادم
  const configured = getDB().content.mediaHost;
  const wantDrive = forced === "drive" || (forced !== "local" && configured !== "local" && googleStatus().connected);
  if (wantDrive) {
    if (!googleStatus().connected) {
      return NextResponse.json({ error: "استضافة Drive مفعّلة لكن حساب جوجل غير مربوط" }, { status: 400 });
    }
    try {
      const up = await uploadToDrive(file);
      return NextResponse.json({ ok: true, url: up.url, host: "drive", fileId: up.fileId, kind: up.kind });
    } catch (e) {
      return NextResponse.json({ error: (e as Error).message }, { status: 502 });
    }
  }

  // ---- الوجهة: خادم المنصّة ----
  // على الاستضافات السحابية (فيرسل) لا يوجد قرص دائم — الملفات يجب أن تذهب إلى Drive
  if (process.env.VERCEL || process.env.AWS_LAMBDA_FUNCTION_NAME) {
    return NextResponse.json(
      { error: "التخزين المحلي غير متاح على هذه الاستضافة — اربط حساب جوجل ليُرفع الملف إلى Drive" },
      { status: 400 }
    );
  }
  if (!fs.existsSync(UPLOAD_DIR)) fs.mkdirSync(UPLOAD_DIR, { recursive: true });
  const name = `${Date.now()}-${crypto.randomBytes(4).toString("hex")}.${ext || "bin"}`;
  const buffer = Buffer.from(await file.arrayBuffer());
  fs.writeFileSync(path.join(UPLOAD_DIR, name), buffer);

  // يُخدَم عبر مسار API (لأن ملفات public المُضافة وقت التشغيل لا يخدمها خادم الإنتاج)
  return NextResponse.json({ ok: true, url: `/api/file/${name}`, host: "local" });
}

/* كلُّ معالجٍ يعمل داخل سياق منصّته — انظر lib/hub/context.ts */
export const POST = tenantRoute(POST_impl);
