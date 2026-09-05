import "server-only";
import { headers } from "next/headers";
import type { AuditEvent } from "./types";
import { hubGet, hubList, hubSet, hubId } from "./store";

/**
 * سجلُّ التدقيق — من فعل ماذا بأيّ منصّة.
 * ------------------------------------------------------------------
 * الـSuper Admin يملك إيقافَ منصّةٍ وإخفاءَ أقسامها والدخولَ كمديرها.
 * وسلطةٌ بهذا الحجم بلا سجلٍّ لا تُراجَع: صاحبُ المنصّة يجد قسماً اختفى
 * ولا يعرف متى ولا بيد من. فكلُّ فعلٍ يُدوَّن باسم فاعله ووقته وعنوانه.
 *
 * **ولا يُحذف من الواجهة** — سجلٌّ يُمحى بضغطةٍ ليس سجلّاً. والتقليمُ
 * آليٌّ عند التضخّم فقط (الأقدمُ أوّلاً).
 */

const KEEP = 5000;

export async function audit(
  action: string,
  actor: AuditEvent["actor"],
  extra?: { tenantId?: string; details?: Record<string, unknown> }
): Promise<void> {
  try {
    const at = new Date().toISOString();
    const id = `${at.replace(/[.:]/g, "-")}_${hubId("a").slice(2)}`;
    let ip: string | undefined;
    try {
      const h = await headers();
      ip = (h.get("x-forwarded-for")?.split(",")[0] ?? h.get("x-real-ip") ?? "").trim() || undefined;
    } catch {
      /* خارج سياق طلب */
    }
    const event: AuditEvent = { id, at, actor, action, tenantId: extra?.tenantId, details: extra?.details, ip };
    await hubSet(`audit/${id}`, event);
    /* تقليمٌ نادرٌ فلا يُدفع ثمنُ قراءة السجلّ في كلّ كتابة */
    if (Math.random() < 0.02) void prune();
  } catch {
    /* التدوينُ لا يُفشل عمليّةً وقعت فعلاً */
  }
}

async function prune() {
  try {
    const all = await hubList<AuditEvent>("audit");
    const keys = Object.keys(all).sort();
    for (const k of keys.slice(0, Math.max(0, keys.length - KEEP))) await hubSet(`audit/${k}`, null);
  } catch {
    /* التنظيف ليس حرجاً */
  }
}

/** أحدثُ الأحداث — كلُّها أو لمنصّةٍ بعينها. */
export async function readAudit(opts?: { tenantId?: string; limit?: number }): Promise<AuditEvent[]> {
  const all = await hubList<AuditEvent>("audit");
  return Object.values(all)
    .filter((e) => e && e.at && (!opts?.tenantId || e.tenantId === opts.tenantId))
    .sort((a, b) => b.at.localeCompare(a.at))
    .slice(0, opts?.limit ?? 200);
}

/** حدثٌ واحدٌ بمعرّفه — للعرض المفصّل. */
export async function auditEvent(id: string): Promise<AuditEvent | null> {
  return hubGet<AuditEvent>(`audit/${id}`);
}
