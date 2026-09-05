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
