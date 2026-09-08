import { NextResponse } from "next/server";
import { sameOrigin } from "@/lib/auth/guard";
import { clearOwnerCookie } from "@/lib/hub/owner";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

export async function POST(req: Request) {
  if (!(await sameOrigin(req))) return NextResponse.json({ error: "طلب غير صالح" }, { status: 403 });
  await clearOwnerCookie();
  return NextResponse.json({ ok: true });
}
