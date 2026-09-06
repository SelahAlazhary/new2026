import { NextResponse } from "next/server";
import { requireSuper } from "@/lib/hub/session";
import { isHubHost } from "@/lib/hub/guard-host";
import { listTenants } from "@/lib/hub/registry";
import { listInvoices } from "@/lib/hub/invoices";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

/**
 * تصديرُ بيانات الـHub كملفّ CSV — المنصّات أو الفواتير.
 * ?type=tenants | invoices
 */
export async function GET(req: Request) {
  if (!(await isHubHost())) return NextResponse.json({ error: "غير موجود" }, { status: 404 });
  const me = await requireSuper();
  if (!me) return NextResponse.json({ error: "غير مصرّح" }, { status: 401 });

  const { searchParams } = new URL(req.url);
  const type = searchParams.get("type") ?? "tenants";

  let csv: string;
  let filename: string;

  if (type === "invoices") {
    const invoices = await listInvoices({});
    const header = "id,tenantId,planId,amountEGP,provider,status,createdAt,paidAt";
    const rows = invoices.map((i) =>
      [i.id, i.tenantId, i.planId, i.amountEGP, i.provider, i.status, i.createdAt, i.paidAt ?? ""].map(csvField).join(",")
    );
    csv = [header, ...rows].join("\n");
    filename = `invoices-${date()}.csv`;
  } else {
    const tenants = await listTenants();
    const header = "id,slug,name,status,adminEmail,customDomain,students,activeSubs,revenueEGP,createdAt,activatedAt";
    const rows = tenants.map((t) =>
      [
        t.id, t.slug, t.name, t.status, t.adminEmail, t.customDomain ?? "",
        t.stats?.students ?? "", t.stats?.activeSubs ?? "", t.stats?.revenueEGP ?? "",
        t.createdAt, t.activatedAt ?? "",
      ].map(csvField).join(",")
    );
    csv = [header, ...rows].join("\n");
    filename = `tenants-${date()}.csv`;
  }

  const bom = "﻿";
  return new Response(bom + csv, {
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": `attachment; filename="${filename}"`,
      "Cache-Control": "no-store",
    },
  });
}

function csvField(v: unknown): string {
  const s = String(v ?? "");
  return s.includes(",") || s.includes('"') || s.includes("\n") ? `"${s.replace(/"/g, '""')}"` : s;
}

function date(): string {
  return new Date().toISOString().slice(0, 10);
}
