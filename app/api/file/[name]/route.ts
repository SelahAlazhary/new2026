import { NextResponse } from "next/server";
import fs from "fs";
import path from "path";
import { loadDB } from "@/lib/db";
import { tenantRoute } from "@/lib/hub/context";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

const UPLOAD_DIR = path.join(process.cwd(), "public", "uploads");

const MIME: Record<string, string> = {
  png: "image/png", jpg: "image/jpeg", jpeg: "image/jpeg", webp: "image/webp",
  gif: "image/gif", svg: "image/svg+xml", avif: "image/avif", bmp: "image/bmp",
  ico: "image/x-icon", tiff: "image/tiff", tif: "image/tiff", heic: "image/heic",
  mp4: "video/mp4", webm: "video/webm", mov: "video/quicktime", mkv: "video/x-matroska",
  m4v: "video/x-m4v", ogv: "video/ogg", ogg: "video/ogg", avi: "video/x-msvideo",
  pdf: "application/pdf", txt: "text/plain; charset=utf-8", mp3: "audio/mpeg", m4a: "audio/mp4",
  doc: "application/msword", docx: "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
  ppt: "application/vnd.ms-powerpoint", pptx: "application/vnd.openxmlformats-officedocument.presentationml.presentation",
  xls: "application/vnd.ms-excel", xlsx: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
  zip: "application/zip",
};

/** يخدم الملفات المرفوعة من القرص مع دعم Range (لتشغيل/تمرير الفيديو). */
async function GET_impl(req: Request, { params }: { params: Promise<{ name: string }> }) {
  await loadDB();
  const { name } = await params;
  const safe = path.basename(name); // منع الخروج من المجلد
  const file = path.join(UPLOAD_DIR, safe);
  // ملفات قديمة فقط؛ الجديد كلّه على Drive عبر /api/media
  if (process.env.VERCEL || !file.startsWith(UPLOAD_DIR) || !fs.existsSync(file)) {
    return NextResponse.json({ error: "غير موجود" }, { status: 404 });
  }
  const ext = (safe.split(".").pop() || "").toLowerCase();
  const type = MIME[ext] || "application/octet-stream";

  /*
    **SVG ملفُّ برمجةٍ لا صورة.**
    ------------------------------------------------------------------
    يقبل `<script>` و`onload` و`<foreignObject>`، ويعمل ما فيه حين
    يُفتح في تبويبٍ مباشرةً — بأصل هذه المنصّة لا بأصلٍ غريب. فمن رفع
    شعاراً أو ملصقَ غلافٍ يستطيع أن يُودعه كوداً يعمل عند كلّ من يفتح
    رابطَ الملفّ.

    و`X-Content-Type-Options: nosniff` لا يمنعه: النوعُ معلَنٌ صحيحاً
    وهو `image/svg+xml`، والمتصفّحُ يُشغّله لأنّه كذلك لا رغماً عنه.

    فتُكتب له سياسةٌ خاصّةٌ تُبطل ما فيه: لا مصدرَ لأيّ شيء، ولا نصوصَ
    برمجيّة، وصندوقٌ معزولٌ بلا نصوصٍ ولا مُلاحة. وتبقى الصورةُ تُعرض في
    `<img>` كما كانت — الوسمُ لا يُشغّل ما بداخلها أصلاً.
  */
  const guard: Record<string, string> =
    type === "image/svg+xml"
      ? {
          "Content-Security-Policy":
            "default-src 'none'; style-src 'unsafe-inline'; img-src data:; sandbox",
          "X-Content-Type-Options": "nosniff",
        }
      : {};
  const size = fs.statSync(file).size;
  const range = req.headers.get("range");

  // طلب جزئي (Range) — ضروري لتشغيل الفيديو والتمرير
  if (range) {
    const m = /bytes=(\d*)-(\d*)/.exec(range);
    let start = m && m[1] ? parseInt(m[1], 10) : 0;
    let end = m && m[2] ? parseInt(m[2], 10) : size - 1;
    if (isNaN(start)) start = 0;
    if (isNaN(end) || end >= size) end = size - 1;
    if (start > end) start = 0;
    const len = end - start + 1;
    const buf = Buffer.alloc(len);
    const fd = fs.openSync(file, "r");
    fs.readSync(fd, buf, 0, len, start);
    fs.closeSync(fd);
    return new NextResponse(new Uint8Array(buf), {
      status: 206,
      headers: {
      ...guard,
        "Content-Type": type,
        "Content-Range": `bytes ${start}-${end}/${size}`,
        "Accept-Ranges": "bytes",
        "Content-Length": String(len),
        "Cache-Control": "public, max-age=31536000, immutable",
      },
    });
  }

  return new NextResponse(new Uint8Array(fs.readFileSync(file)), {
    headers: {
      ...guard,
      "Content-Type": type,
      "Accept-Ranges": "bytes",
      "Content-Length": String(size),
      "Cache-Control": "public, max-age=31536000, immutable",
    },
  });
}

/* كلُّ معالجٍ يعمل داخل سياق منصّته — انظر lib/hub/context.ts */
export const GET = tenantRoute(GET_impl);
