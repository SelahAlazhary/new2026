import type { SupportLink } from "@/lib/utils/types";

/** الرابط النهائي لكل نوع دعم. */
export function supportHref(l: SupportLink): string {
  const v = (l.value ?? "").trim();
  switch (l.kind) {
    case "whatsapp":
      return `https://wa.me/${v.replace(/[^\d]/g, "")}`;
    case "phone":
      return `tel:${v}`;
    case "email":
      return `mailto:${v}`;
    case "telegram":
      return v.startsWith("http") ? v : `https://t.me/${v.replace(/^@/, "")}`;
    default:
      return v.startsWith("http") ? v : `https://${v}`;
  }
}

export const SUPPORT_KINDS: { id: SupportLink["kind"]; label: string }[] = [
  { id: "whatsapp", label: "واتساب" },
  { id: "phone", label: "هاتف" },
  { id: "email", label: "بريد" },
  { id: "telegram", label: "تليجرام" },
  { id: "facebook", label: "فيسبوك" },
  { id: "youtube", label: "يوتيوب" },
  { id: "link", label: "رابط خارجي" },
];
