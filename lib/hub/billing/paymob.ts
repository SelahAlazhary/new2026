import "server-only";
import crypto from "crypto";

/**
 * تكاملُ بايموب (مصر) — بطاقات ومحافظ.
 * ------------------------------------------------------------------
 * التدفّق الرسميّ: رمزُ مصادقة ← طلبٌ (order) ← مفتاحُ دفع (payment key)
 * ← إطارُ الدفع (iframe). والإشعارُ (webhook) يعيد النتيجةَ موقَّعةً
 * بـHMAC. كلُّ الأسرار في متغيّرات البيئة، ولا يصل المتصفّحَ إلّا رابطُ
 * الإطار.
 *
 * **والتحقّقُ من التوقيع هو الحصن**: بايموب توقّع سلسلةً من حقولٍ بعينها
 * بترتيبٍ ثابت. من زوّر الإشعارَ بلا السرّ لا يوافق توقيعُه، فيُرفض. وما
 * يمرّ يُعالَج مرّةً واحدة (idempotencyKey في الفاتورة).
 */

const BASE = "https://accept.paymob.com/api";

export function paymobConfigured(): boolean {
  return Boolean(process.env.PAYMOB_API_KEY && process.env.PAYMOB_HMAC_SECRET);
}

async function authToken(): Promise<string> {
  const res = await fetch(`${BASE}/auth/tokens`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ api_key: process.env.PAYMOB_API_KEY }),
    cache: "no-store",
  });
  const data = (await res.json().catch(() => ({}))) as { token?: string; detail?: string };
  if (!res.ok || !data.token) throw new Error(data.detail || "تعذّر الاتصال ببايموب");
  return data.token;
}

export type CheckoutInput = {
  invoiceId: string;
  amountEGP: number;
  email: string;
  name: string;
  /** رابطٌ يعود إليه المتصفّح بعد الدفع. */
  returnUrl: string;
};

/** يُنشئ جلسةَ دفعٍ ويعيد رابطَ الإطار. */
export async function createCheckout(input: CheckoutInput): Promise<{ iframeUrl: string; orderId: string }> {
  if (!paymobConfigured()) throw new Error("بوّابة بايموب غير مُهيّأة");
  const iframeId = process.env.PAYMOB_IFRAME_ID;
  const integrationId = Number(process.env.PAYMOB_CARD_INTEGRATION_ID);
  if (!iframeId || !integrationId) throw new Error("إعداد بايموب ناقص (iframe/integration)");

  const token = await authToken();
  const cents = Math.round(input.amountEGP * 100);

  /* الطلب */
  const orderRes = await fetch(`${BASE}/ecommerce/orders`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      auth_token: token, delivery_needed: false, amount_cents: cents, currency: "EGP",
      merchant_order_id: `${input.invoiceId}-${Date.now()}`,
      items: [],
    }),
    cache: "no-store",
  });
  const order = (await orderRes.json().catch(() => ({}))) as { id?: number; message?: string };
  if (!orderRes.ok || !order.id) throw new Error(order.message || "تعذّر إنشاء الطلب في بايموب");

  /* مفتاح الدفع */
  const [first, ...rest] = input.name.trim().split(" ");
  const keyRes = await fetch(`${BASE}/acceptance/payment_keys`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      auth_token: token, amount_cents: cents, expiration: 3600, order_id: order.id,
      currency: "EGP", integration_id: integrationId,
      billing_data: {
        email: input.email, first_name: first || "Teacher", last_name: rest.join(" ") || "-",
        phone_number: "+20000000000", apartment: "-", floor: "-", street: "-", building: "-",
        shipping_method: "-", postal_code: "-", city: "-", country: "EG", state: "-",
      },
    }),
    cache: "no-store",
  });
  const key = (await keyRes.json().catch(() => ({}))) as { token?: string; message?: string };
  if (!keyRes.ok || !key.token) throw new Error(key.message || "تعذّر إنشاء مفتاح الدفع");

  return {
    iframeUrl: `${BASE}/acceptance/iframes/${iframeId}?payment_token=${key.token}`,
    orderId: String(order.id),
  };
}

/**
 * يتحقّق من توقيع إشعار بايموب (HMAC-SHA512).
 * الحقولُ بالترتيب الرسميّ الثابت، تُوصَل بلا فواصل، وتُوقَّع بالسرّ.
 */
export function verifyHmac(obj: Record<string, unknown>, hmac: string): boolean {
  const secret = process.env.PAYMOB_HMAC_SECRET;
  if (!secret || !hmac) return false;
  const FIELDS = [
    "amount_cents", "created_at", "currency", "error_occured", "has_parent_transaction",
    "id", "integration_id", "is_3d_secure", "is_auth", "is_capture", "is_refunded",
    "is_standalone_payment", "is_voided", "order", "owner", "pending",
    "source_data.pan", "source_data.sub_type", "source_data.type", "success",
  ];
  const flat = (path: string): string => {
    const parts = path.split(".");
    let v: unknown = obj;
    for (const p of parts) v = v && typeof v === "object" ? (v as Record<string, unknown>)[p] : undefined;
    if (v === true) return "true";
    if (v === false) return "false";
    return v === undefined || v === null ? "" : String(v);
  };
  const concat = FIELDS.map(flat).join("");
  const expected = crypto.createHmac("sha512", secret).update(concat).digest("hex");
  try {
    return crypto.timingSafeEqual(Buffer.from(expected), Buffer.from(hmac.toLowerCase()));
  } catch {
    return false;
  }
}

/** يستخرج معرّفَ الفاتورة من `merchant_order_id`. */
export function invoiceIdFromOrder(merchantOrderId: unknown): string | null {
  const s = String(merchantOrderId ?? "");
  const m = s.match(/^(inv_[a-z0-9]+)-\d+$/);
  return m ? m[1] : null;
}
