import { NextResponse } from "next/server";
import { driveAccessToken } from "@/lib/integrations/google";
import { getDB, loadDB } from "@/lib/db/db";
import { recordEvent } from "@/lib/auth/security";
import { getSession } from "@/lib/auth/session";
import { tenantRoute } from "@/lib/hub/context";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

/**
 * وسيط ملفات Google Drive.
 *
 * لماذا؟ جوجل تحجب صور Drive عندما يرسل المتصفّح ترويسة Referer (حماية من الاقتباس)،
 * فتظهر الصورة في curl ولا تظهر داخل الموقع. الحلّ أن نخدمها من نطاقنا:
 * الخادم يجلبها من Drive برمز التطبيق (بلا مشاركة عامة ولا Referer) ويمرّرها للمتصفّح.
 * كما يدعم Range ليعمل تمرير الفيديو والصوت.
 */
async function GET_impl(req: Request, ctx: { params: Promise<{ id: string }> }) {
  await loadDB();
  const { id } = await ctx.params;
  if (!/^[\w-]{10,}$/.test(id)) {
    return NextResponse.json({ error: "معرّف غير صالح" }, { status: 400 });
  }

  // لا يُخدَم إلا ملف مذكور فعلاً داخل بيانات المنصّة —
  // فلا يتحوّل الخادم إلى وسيط مفتوح لبقية ملفات حساب Drive.
  const session = await getSession();
  if (session?.role !== "admin" && !referencedInPlatform(id)) {
    await recordEvent("media_denied", `طلب ملف غير مسجّل: ${id.slice(0, 12)}…`);
    return NextResponse.json({ error: "غير موجود" }, { status: 404 });
  }

  let token: string;
  try {
    token = await driveAccessToken();
  } catch {
    // لا ربط بجوجل — نعيد التوجيه للرابط العام كحلّ أخير
    return NextResponse.redirect(`https://lh3.googleusercontent.com/d/${id}`);
  }

  const range = req.headers.get("range");
  const upstream = await fetch(`https://www.googleapis.com/drive/v3/files/${id}?alt=media&supportsAllDrives=true`, {
    headers: {
      Authorization: `Bearer ${token}`,
      ...(range ? { Range: range } : {}),
    },
    cache: "no-store",
  });

  if (!upstream.ok && upstream.status !== 206) {
    return NextResponse.json({ error: "تعذّر جلب الملف" }, { status: upstream.status });
  }

  const headers = new Headers();
  const pass = ["content-type", "content-length", "content-range", "accept-ranges", "etag", "last-modified"];
  pass.forEach((h) => {
    const v = upstream.headers.get(h);
    if (v) headers.set(h, v);
  });
  headers.set("Cache-Control", "public, max-age=86400, immutable");

  /*
    **الوسيطُ يخدم ملفّاتِ المستعملين بأصل هذه المنصّة.**
    ------------------------------------------------------------------
    ونوعُ المحتوى يُمرَّر كما جاء من المصدر. فملفٌّ نوعُه `image/svg+xml`
    أو `text/html` يعمل ما فيه من نصوصٍ برمجيّةٍ حين يُفتح رابطُه في
    تبويب — **بأصلنا لا بأصلٍ غريب**، فيبلغ ما تبلغه صفحاتُنا.

    و`nosniff` لا يمنعه: النوعُ معلَنٌ صحيحاً والمتصفّحُ يُشغّله لأنّه
    كذلك لا رغماً عنه.

    فتُكتب سياسةٌ تُبطل التنفيذ: لا مصدرَ لشيء، ولا نصوصَ برمجيّة، وصندوقٌ
    معزول. وهي غيرُ ضارّةٍ بالصور والفيديو والمستندات — تلك لا تُنفّذ
    شيئاً أصلاً — فتُكتب على الكلّ ولا تُستثنى أنواعٌ قد تُنسى.
  */
  headers.set("X-Content-Type-Options", "nosniff");
  headers.set(
    "Content-Security-Policy",
    "default-src 'none'; style-src 'unsafe-inline'; img-src data:; media-src 'self'; sandbox"
  );
  headers.set("Accept-Ranges", headers.get("accept-ranges") ?? "bytes");

  return new NextResponse(upstream.body, { status: upstream.status, headers });
}

/**
 * هل يجوز خدمة هذا الملف؟
 *
 * • الأدمن: نعم دائماً — وإلا لم تظهر معاينة الصورة فور رفعها،
 *   قبل حفظها في البيانات (كان هذا سبب «الصورة لا تظهر بعد الرفع»).
 * • غير ذلك: فقط إن كان الملف مذكوراً فعلاً داخل بيانات المنصّة،
 *   حتى لا يتحوّل الخادم إلى وسيط مفتوح لبقية ملفات حساب Drive.
 */
function referencedInPlatform(id: string): boolean {
  try {
    const db = getDB();
    // كل البيانات عدا الحسابات والأسرار — ليشمل الخطط والصفوف وأغلفتها
    const { users, integrations, security, codes, ...rest } = db;
    return JSON.stringify(rest).includes(id);
  } catch {
    return false;
  }
}

/* كلُّ معالجٍ يعمل داخل سياق منصّته — انظر lib/hub/context.ts */
export const GET = tenantRoute(GET_impl);
