import { NextResponse } from "next/server";
import { verifyHmac, invoiceIdFromOrder } from "@/lib/hub/billing/paymob";
import { invoiceByRef, invoiceById } from "@/lib/hub/invoices";
import { activateFromInvoice } from "@/lib/hub/billing/activate";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

/**
 * إشعارُ بايموب (webhook) — خادمٌ إلى خادم.
 * ------------------------------------------------------------------
 * **لا يُفحص أصلُه (CSRF)**: لا يأتي من متصفّح فلا Origin له. حصنُه
 * التوقيعُ (HMAC): من زوّره بلا السرّ رُفض. **ويُعالَج مرّةً واحدة**:
 * `activateFromInvoice` لا يفعّل فاتورةً مدفوعةً ثانيةً، فوصولُ الإشعار
 * مرّتين لا ينشئ فترتين.
 *
 * والردُّ ٢٠٠ دائماً على ما فُهم — حتى المكرَّر — كي لا تُعيد بايموب
 * الإرسالَ بلا داعٍ؛ والرفضُ ٤٠٠ لتوقيعٍ فاسدٍ وحدَه.
 */
export async function POST(req: Request) {
  const url = new URL(req.url);
  const hmac = url.searchParams.get("hmac") ?? "";
  const body = (await req.json().catch(() => null)) as { obj?: Record<string, unknown> } | null;
  const obj = body?.obj;
  if (!obj) return NextResponse.json({ error: "حمولة غير صالحة" }, { status: 400 });

  if (!verifyHmac(obj, hmac)) {
    return NextResponse.json({ error: "توقيع غير صالح" }, { status: 400 });
  }

  const success = obj.success === true || obj.success === "true";
  if (!success) return NextResponse.json({ ok: true, ignored: "غير ناجحة" });

  /* الفاتورةُ من مرجع الطلب أو من merchant_order_id */
  const orderId = String((obj.order as Record<string, unknown>)?.id ?? obj.order ?? "");
  const merchantOrderId = (obj.order as Record<string, unknown>)?.merchant_order_id;
  let invId = invoiceIdFromOrder(merchantOrderId);
  if (!invId && orderId) {
    const byRef = await invoiceByRef(orderId);
    invId = byRef?.id ?? null;
  }
  if (!invId || !(await invoiceById(invId))) {
    return NextResponse.json({ ok: true, ignored: "لا توجد فاتورة مطابقة" });
  }

  await activateFromInvoice(invId, "system", orderId);
  return NextResponse.json({ ok: true });
}
