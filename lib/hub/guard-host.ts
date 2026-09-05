import "server-only";
import { headers } from "next/headers";

/**
 * هل هذا الطلبُ على مضيف المنصّة الأمّ؟
 * ------------------------------------------------------------------
 * الوسيطُ يردّ ٤٠٤ على مسارات الـHub إن جاءت من نطاق منصّة، وهذا فحصٌ
 * ثانٍ في الخادم نفسِه: ما يحمي البابَ وحدَه يسقط بسقوطه. ولو أُضيف
 * غداً مسارٌ لا يمرّ بالوسيط (إعادةُ كتابةٍ، أو استدعاءٌ داخليّ) لبقي
 * هذا قائماً.
 */
export async function isHubHost(): Promise<boolean> {
  try {
    return ((await headers()).get("x-host-kind") ?? "root") === "root";
  } catch {
    return false;
  }
}

/**
 * هل هذا الطلبُ للموقع الأمّ نفسِه (لا لمنصّةٍ)؟
 * ------------------------------------------------------------------
 * صحيحٌ حين يكون المضيفُ الجذرَ **والجذرُ يخدم الـHub** (ROOT_HOST_MODE=hub).
 * حينها لا مستأجرَ يُحلّ، وتُعرض صفحاتُ «أنشئ منصّتك» بدل صفحة منصّة.
 */
export async function isHubRootRequest(): Promise<boolean> {
  try {
    const kind = (await headers()).get("x-host-kind") ?? "root";
    if (kind !== "root") return false;
    return (process.env.ROOT_HOST_MODE?.trim() || "tenant") === "hub";
  } catch {
    return false;
  }
}
