import "server-only";
import type { HubSettings } from "./types";
import { hubGet, hubSet } from "./store";

/**
 * إعداداتُ المنصّة الأمّ — قيمةٌ واحدةٌ لكلّ شيء.
 * والافتراضاتُ محافظة: بوّاباتُ الدفع **مطفأةٌ** حتى تُضبط مفاتيحُها،
 * والموافقةُ **يدويّة** — فلا تُنشأ منصّةٌ بلا قرارِ إنسان.
 */

export function defaultHubSettings(): HubSettings {
  return {
    rootDomain: process.env.ROOT_DOMAIN?.trim() ?? "",
    brand: { name: "منصّات", primary: "#233b8b" },
    paymob: { enabled: false, integrationIds: {} },
    manualPay: { enabled: false, methods: [] },
    approval: "manual",
    gracePeriodDays: 7,
    emailFrom: process.env.MAIL_FROM?.trim() ?? "",
  };
}

export async function getHubSettings(): Promise<HubSettings> {
  const saved = await hubGet<Partial<HubSettings>>("settings");
  const base = defaultHubSettings();
  if (!saved) return base;
  return {
    ...base,
    ...saved,
    brand: { ...base.brand, ...(saved.brand ?? {}) },
    paymob: { ...base.paymob, ...(saved.paymob ?? {}), integrationIds: { ...(saved.paymob?.integrationIds ?? {}) } },
    manualPay: {
      enabled: saved.manualPay?.enabled ?? base.manualPay.enabled,
      methods: Array.isArray(saved.manualPay?.methods) ? saved.manualPay!.methods : [],
    },
    /* النطاقُ الجذريُّ من البيئة يغلب المحفوظ: هو ما يخدم عليه الخادمُ فعلاً */
    rootDomain: base.rootDomain || saved.rootDomain || "",
  };
}

export async function saveHubSettings(patch: Partial<HubSettings>): Promise<HubSettings> {
  const cur = await getHubSettings();
  const next: HubSettings = {
    ...cur,
    ...patch,
    brand: { ...cur.brand, ...(patch.brand ?? {}) },
    paymob: { ...cur.paymob, ...(patch.paymob ?? {}) },
    manualPay: { ...cur.manualPay, ...(patch.manualPay ?? {}) },
  };
  await hubSet("settings", next);
  return next;
}
