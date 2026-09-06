import { NextResponse } from "next/server";
import { sameOrigin } from "@/lib/guard";
import { requireSuper } from "@/lib/hub/session";
import { isHubHost } from "@/lib/hub/guard-host";
import { listInvoices, invoiceById } from "@/lib/hub/invoices";
import { activateFromInvoice, rejectInvoice } from "@/lib/hub/billing/activate";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

async function guard() {
  if (!(await isHubHost())) return NextResponse.json({ error: "غير موجود" }, { status: 404 });
  if (!(await requireSuper())) return NextResponse.json({ error: "غير مصرّح" }, { status: 401 });
  return null;
}

export async function GET() {
  const bad = await guard();
  if (bad) return bad;
  return NextResponse.json({ invoices: await listInvoices() }, { headers: { "Cache-Control": "no-store" } });
}

/** اعتمادُ فاتورةٍ يدويّة أو رفضُها. */
export async function PATCH(req: Request) {
  const bad = await guard();
  if (bad) return bad;
  const me = await requireSuper();
  if (!(await sameOrigin(req))) return NextResponse.json({ error: "طلب غير صالح" }, { status: 403 });

  const body = (await req.json().catch(() => ({}))) as Record<string, unknown>;
  const id = String(body.id ?? "");
  const action = String(body.action ?? "");
  const inv = await invoiceById(id);
  if (!inv) return NextResponse.json({ error: "لا توجد فاتورة" }, { status: 404 });

  if (action === "approve") {
    const r = await activateFromInvoice(id, "super");
    if (!r.ok) return NextResponse.json({ error: r.reason ?? "تعذّر" }, { status: 400 });
    return NextResponse.json({ ok: true });
  }
  if (action === "reject") {
    await rejectInvoice(id, me!.name, String(body.reason ?? ""));
    return NextResponse.json({ ok: true });
  }
  return NextResponse.json({ error: "أمر غير معروف" }, { status: 400 });
}
