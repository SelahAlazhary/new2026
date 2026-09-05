import { ImageResponse } from "next/og";
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

/**
 * رموز اختصارات التطبيق (تظهر عند الضغط المطوّل على أيقونة التطبيق).
 * كل رمز مرسوم بمسارات SVG من نفس مجموعة أيقونات الهوية، داخل قرص بلون المنصّة.
 */
const GLYPHS: Record<string, string> = {
  courses: `<path d="M12 6.4C10.6 5.2 8.8 4.6 6.6 4.6H4.2v12.2h2.4c2.2 0 4 .6 5.4 1.8 1.4-1.2 3.2-1.8 5.4-1.8h2.4V4.6h-2.4c-2.2 0-4 .6-5.4 1.8Z"/><path d="M12 6.4v12.2"/>`,
  live: `<circle cx="12" cy="12" r="2.6"/><path d="M8.2 15.8a5.4 5.4 0 0 1 0-7.6M15.8 8.2a5.4 5.4 0 0 1 0 7.6"/><path d="M5.4 18.6a9.4 9.4 0 0 1 0-13.2M18.6 5.4a9.4 9.4 0 0 1 0 13.2" opacity="0.6"/>`,
  bell: `<path d="M12 3.4a5.8 5.8 0 0 0-5.8 5.8v3.4l-1.4 2.8h14.4l-1.4-2.8V9.2A5.8 5.8 0 0 0 12 3.4Z"/><path d="M9.8 18.2a2.4 2.4 0 0 0 4.4 0"/>`,
  exams: `<path d="M8.6 4.6H6.8a2 2 0 0 0-2 2v12.2a2 2 0 0 0 2 2h10.4a2 2 0 0 0 2-2V6.6a2 2 0 0 0-2-2h-1.8"/><rect x="8.6" y="2.8" width="6.8" height="3.6" rx="1.2"/><path d="m9.2 13.6 2 2 3.8-4"/>`,
};

async function GET_impl(req: Request) {
  const { searchParams } = new URL(req.url);
  const name = searchParams.get("name") ?? "courses";
  const size = Math.min(512, Math.max(48, Number(searchParams.get("size")) || 96));
  const glyph = GLYPHS[name] ?? GLYPHS.courses;

  const { content } = getDB();
  const theme = content.theme;
  const primary =
    (theme.preset === "custom" && theme.customPrimary) || PRESET_HEX[theme.preset] || PRESET_HEX.midad;

  const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none"
      stroke="#ffffff" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round">${glyph}</svg>`;
  const src = `data:image/svg+xml;base64,${Buffer.from(svg).toString("base64")}`;

  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          background: primary,
          borderRadius: size / 2,
        }}
      >
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={src} alt="" width={size * 0.56} height={size * 0.56} />
      </div>
    ),
    { width: size, height: size, headers: { "Cache-Control": "public, max-age=3600" } }
  );
}

/* كلُّ معالجٍ يعمل داخل سياق منصّته — انظر lib/hub/context.ts */
export const GET = tenantRoute(GET_impl);
