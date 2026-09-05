import { NextResponse } from "next/server";
import { clearSuperCookie, getSuperSession } from "@/lib/hub/session";
import { audit } from "@/lib/hub/audit";
import { sameOrigin } from "@/lib/guard";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

export async function POST(req: Request) {
  if (!(await sameOrigin(req))) return NextResponse.json({ error: "طلب غير صالح" }, { status: 403 });
  const s = await getSuperSession();
  await clearSuperCookie();
  if (s) await audit("super.logout", { kind: "super", id: s.sid, name: s.name });
  return NextResponse.json({ ok: true });
}
