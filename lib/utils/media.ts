/**
 * توحيد مصادر الصور: أي رابط Google Drive (بأي صيغة) يُحوَّل إلى وسيط نطاقنا
 * `/api/media/{id}` لأن جوجل تحجب الصور عندما يرسل المتصفّح ترويسة Referer.
 * الروابط الأخرى (محلية أو خارجية) تُعاد كما هي.
 */
const DRIVE_PATTERNS = [
  /lh3\.googleusercontent\.com\/d\/([\w-]{10,})/,
  /drive\.google\.com\/file\/d\/([\w-]{10,})/,
  /drive\.google\.com\/(?:uc|thumbnail)\?(?:[^#]*&)?id=([\w-]{10,})/,
  /drive\.google\.com\/open\?id=([\w-]{10,})/,
];

/** معرّف ملف Drive من أي صيغة رابط، أو null. */
export function driveFileId(url?: string | null): string | null {
  if (!url) return null;
  for (const re of DRIVE_PATTERNS) {
    const m = url.match(re);
    if (m) return m[1];
  }
  return null;
}

/** مصدر صورة صالح للعرض داخل الموقع. */
export function mediaSrc(url?: string | null): string {
  if (!url) return "";
  const id = driveFileId(url);
  return id ? `/api/media/${id}` : url;
}
