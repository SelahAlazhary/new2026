import { NextResponse } from "next/server";
import { sameOrigin, limit, clientIp } from "@/lib/auth/guard";
import { requireSuper } from "@/lib/hub/session";
import { isHubHost } from "@/lib/hub/guard-host";
import { addDomain, removeDomain, verifyDomain, listDomains, domainById } from "@/lib/hub/domains";
import { tenantById } from "@/lib/hub/registry";
import { featureOn } from "@/lib/hub/sections";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

async function guard() {
  if (!(await isHubHost())) return { error: NextResponse.json({ error: "غير موجود" }, { status: 404 }) };
  const me = await requireSuper();
  if (!me) return { error: NextResponse.json({ error: "غير مصرّح" }, { status: 401 }) };
  return { me };
}

/** قائمةُ الدومينات — كلّها أو لمنصّةٍ بعينها. */
export async function GET(req: Request) {
  const g = await guard();
  if ("error" in g) return g.error;
  const { searchParams } = new URL(req.url);
  const tenantId = searchParams.get("tenantId") || undefined;
  return NextResponse.json({ domains: await listDomains(tenantId) }, { headers: { "Cache-Control": "no-store" } });
}

/**
 * إضافة / حذف / تحقّق من دومين.
 * الأفعالُ: add · remove · verify
 */
export async function POST(req: Request) {
  const g = await guard();
  if ("error" in g) return g.error;
  if (!(await sameOrigin(req))) return NextResponse.json({ error: "طلب غير صالح" }, { status: 403 });
  const rate = limit(`hub:domain:${await clientIp()}`, 30, 60_000);
  if (!rate.ok) return NextResponse.json({ error: "طلبات كثيرة" }, { status: 429 });

  const body = (await req.json().catch(() => ({}))) as Record<string, unknown>;
  const action = String(body.action ?? "").trim();
  const actor = { kind: "super" as const, id: g.me.id, name: g.me.name };

  switch (action) {
    case "add": {
      const tenantId = String(body.tenantId ?? "").trim();
      const domain = String(body.domain ?? "").trim();
      if (!tenantId || !domain) return NextResponse.json({ error: "بيانات ناقصة" }, { status: 400 });

      const tenant = await tenantById(tenantId);
      if (!tenant) return NextResponse.json({ error: "لا توجد منصّة" }, { status: 404 });
      if (!featureOn(tenant, "customDomain")) {
        return NextResponse.json({ error: "ميزة الدومين المخصّص غير مفعّلة في هذه المنصّة" }, { status: 403 });
      }

      const result = await addDomain(tenantId, domain, actor);
      if (!result.ok) return NextResponse.json({ error: result.error }, { status: 400 });
      return NextResponse.json({ ok: true, domain: result.domain });
    }

    case "remove": {
      const domainId = String(body.domainId ?? "").trim();
      if (!domainId) return NextResponse.json({ error: "بيانات ناقصة" }, { status: 400 });
      const result = await removeDomain(domainId, actor);
      if (!result.ok) return NextResponse.json({ error: result.error }, { status: 400 });
      return NextResponse.json({ ok: true });
    }

    case "verify": {
      const domainId = String(body.domainId ?? "").trim();
      if (!domainId) return NextResponse.json({ error: "بيانات ناقصة" }, { status: 400 });
      const updated = await verifyDomain(domainId);
      if (!updated) return NextResponse.json({ error: "لا يوجد سجلّ" }, { status: 404 });
      return NextResponse.json({ ok: true, domain: updated });
    }

    default:
      return NextResponse.json({ error: "أمر غير معروف" }, { status: 400 });
  }
}
