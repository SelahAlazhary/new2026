import { ImageResponse } from "next/og";
import { mediaSrc } from "@/lib/media";
import { getDB } from "@/lib/db";
import { tenantRoute } from "@/lib/hub/context";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const PRESET_HEX: Record<string, string> = {
  midad: "#233b8b",
  nile: "#095e86",
  andalus: "#245c4b",
  rumman: "#87263a",
  // توافق مع بيانات قديمة
  violet: "#233b8b",
  emerald: "#245c4b",
  ocean: "#095e86",
  crimson: "#87263a",
};

/** علامة الخاتم الثماني كـSVG (نفس هوية الموقع) — تُرسم بيضاء فوق لون المنصّة. */
function markSvg(): string {
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 48 48" fill="none">
    <g stroke="#ffffff" stroke-width="1.7" stroke-linejoin="round" opacity="0.95">
      <rect x="14.1" y="14.1" width="19.8" height="19.8" rx="1"/>
      <path d="M24 10.2 37.8 24 24 37.8 10.2 24 24 10.2Z"/>
    </g>
    <path d="M24 17.4 28.7 19.3 30.6 24 28.7 28.7 24 30.6 19.3 28.7 17.4 24 19.3 19.3Z" fill="#ffffff"/>
  </svg>`;
}

/**
 * GET /api/pwa-icon?size=512&maskable=1
 * أيقونة التطبيق بصيغة PNG مولّدة وقت الطلب — تتبع لون الثيم المختار من الأدمن،
 * وتستخدم شعار المنصّة المرفوع إن وُجد.
 */
async function GET_impl(req: Request) {
  const { searchParams, origin } = new URL(req.url);
  const size = Math.min(1024, Math.max(48, Number(searchParams.get("size")) || 512));
  const maskable = searchParams.get("maskable") === "1";
  const mono = searchParams.get("mono") === "1"; // شارة الإشعار: رمز أبيض على خلفية شفافة

  const { content } = getDB();
  const theme = content.theme;
  const primary =
    (theme.preset === "custom" && theme.customPrimary) || PRESET_HEX[theme.preset] || PRESET_HEX.midad;

  // منطقة الأمان لأيقونات maskable: ٪٢٠ من كل جهة
  const pad = maskable ? size * 0.2 : size * 0.14;
  const inner = size - pad * 2;

  /*
    مصدر الأيقونة يُختار من اللوحة: الشعار أو صورة المعلّمة أو العلامة.
    والمسارُ النسبي يُجعل مطلقاً — مولّدُ الصورة يجلبها من الشبكة لا من
    المتصفّح، فلا يعرف أصلَ الصفحة.
  */
  const pick = content.appIcon ?? "logo";
  const raw = pick === "custom" ? (content.appIconImage || content.teacher.logo)
    : pick === "avatar" ? content.teacher.avatar
      : pick === "mark" ? ""
        : content.teacher.logo;
  /*
    المولّد يجلب الصورة من الشبكة لا من المتصفّح، فلا يعرف أصلَ الصفحة:
    المسارُ النسبي يُجعل مطلقاً. وروابطُ درايف تُمرَّر عبر وسيطنا لأنّ
    جوجل تحجبها عند إرسال ترويسة Referer.
  */
  const routed = mediaSrc(raw);
  const logo = routed.startsWith("/") ? `${origin}${routed}` : routed;
  const markSrc = `data:image/svg+xml;base64,${Buffer.from(markSvg()).toString("base64")}`;

  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          background: mono ? "transparent" : primary,
          borderRadius: maskable || mono ? 0 : size * 0.22,
        }}
      >
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={mono ? markSrc : logo || markSrc}
          alt=""
          width={inner}
          height={inner}
          style={{ objectFit: "contain", borderRadius: !mono && logo ? size * 0.12 : 0 }}
        />
      </div>
    ),
    {
      width: size,
      height: size,
      headers: { "Cache-Control": "public, max-age=3600" },
    }
  );
}

/* كلُّ معالجٍ يعمل داخل سياق منصّته — انظر lib/hub/context.ts */
export const GET = tenantRoute(GET_impl);
