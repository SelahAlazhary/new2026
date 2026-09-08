import { NextResponse } from "next/server";
import { sameOrigin, limit, clientIp } from "@/lib/auth/guard";
import { requireSuper } from "@/lib/hub/session";
import { isHubHost } from "@/lib/hub/guard-host";
import { startImpersonation, endImpersonation } from "@/lib/hub/impersonate";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

export async function POST(req: Request) {
  if (!(await isHubHost())) return NextResponse.json({ error: "غير موجود" }, { status: 404 });
  if (!(await sameOrigin(req))) return NextResponse.json({ error: "طلب غير صالح" }, { status: 403 });
  const me = await requireSuper();
  if (!me) return NextResponse.json({ error: "غير مصرّح" }, { status: 401 });

  const rate = limit(`hub:impersonate:${await clientIp()}`, 10, 60_000);
  if (!rate.ok) return NextResponse.json({ error: "طلبات كثيرة" }, { status: 429 });

  const body = (await req.json().catch(() => ({}))) as Record<string, unknown>;
  const action = String(body.action ?? "").trim();

  if (action === "start") {
    const tenantId = String(body.tenantId ?? "").trim();
    if (!tenantId) return NextResponse.json({ error: "معرّف المنصّة مطلوب" }, { status: 400 });
    const result = await startImpersonation(me, tenantId);
    if (!result.ok) return NextResponse.json({ error: result.error }, { status: 400 });
    return NextResponse.json({ ok: true, url: result.url });
  }

  if (action === "end") {
    await endImpersonation();
    return NextResponse.json({ ok: true });
  }

  return NextResponse.json({ error: "أمر غير معروف" }, { status: 400 });
}
