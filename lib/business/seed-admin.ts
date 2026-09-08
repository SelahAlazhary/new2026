import "server-only";
import { ADMIN_EMAIL, ADMIN_PASSWORD } from "@/lib/auth/secrets";

/**
 * بذرة حساب المالك (الأدمن) — وحدة خادمية بحتة.
 * ------------------------------------------------------------------
 * فُصلت عن `defaults.ts` لأن ذاك الملف تستورده مكوّنات العميل، ولا يجوز
 * أن يُسحب أي شيء يمسّ الأسرار إلى حزمة المتصفّح. القيم نفسها تأتي من
 * `secrets.ts` الذي يرفض العمل بقيم ثابتة معروفة في الإنتاج.
 */
export const seedUsers = [
  {
    name: "الأستاذة الشيماء أحمد",
    role: "admin" as const,
    username: ADMIN_EMAIL,
    password: ADMIN_PASSWORD,
    active: true,
  },
];
