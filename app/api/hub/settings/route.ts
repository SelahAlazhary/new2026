import { NextResponse } from "next/server";
import { sameOrigin } from "@/lib/guard";
import { requireSuper } from "@/lib/hub/session";
import { isHubHost } from "@/lib/hub/guard-host";
import { getHubSettings, saveHubSettings } from "@/lib/hub/settings";
import { audit } from "@/lib/hub/audit";
import type { HubSettings } from "@/lib/hub/types";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

export async function GET() {
  if (!(await isHubHost())) return NextResponse.json({ error: "غير موجود" }, { status: 404 });
  if (!(await requireSuper())) return NextResponse.json({ error: "غير مصرّح" }, { status: 401 });
  return NextResponse.json(await getHubSettings(), { headers: { "Cache-Control": "no-store" } });
}

/**
 * حفظُ الإعدادات — بقائمةٍ بيضاءَ لا بدمجِ ما وصل.
 * ومفاتيحُ الدفع لا تُحفظ هنا إطلاقاً: مكانُها متغيّراتُ البيئة، ولو
 * قُبلت في القاعدة لصارت تُقرأ من نسخةٍ احتياطيّةٍ أو من سجلّ.
 */
export async function PUT(req: Request) {
  if (!(await isHubHost())) return NextResponse.json({ error: "غير موجود" }, { status: 404 });
  const me = await requireSuper();
  if (!me) return NextResponse.json({ error: "غير مصرّح" }, { status: 401 });
  if (!(await sameOrigin(req))) return NextResponse.json({ error: "طلب غير صالح" }, { status: 403 });

  const body = (await req.json().catch(() => ({}))) as Record<string, unknown>;
  const patch: Partial<HubSettings> = {};

  if (body.brand && typeof body.brand === "object") {
    const b = body.brand as Record<string, unknown>;
    patch.brand = {
      name: String(b.name ?? "").slice(0, 60) || "منصّات",
      logo: b.logo ? String(b.logo).slice(0, 500) : undefined,
      primary: /^#[0-9a-fA-F]{6}$/.test(String(b.primary ?? "")) ? String(b.primary) : "#233b8b",
    };
  }
  if (body.approval === "manual" || body.approval === "auto_after_payment") patch.approval = body.approval;
  if (body.gracePeriodDays !== undefined) {
    const n = Number(body.gracePeriodDays);
    patch.gracePeriodDays = Number.isFinite(n) ? Math.min(60, Math.max(0, Math.floor(n))) : 7;
  }
  if (typeof body.emailFrom === "string") patch.emailFrom = body.emailFrom.trim().slice(0, 120);

  /* بوّابة بايموب: علمُ التفعيل فقط — المفاتيحُ في متغيّرات البيئة لا في القاعدة */
  if (body.paymob && typeof body.paymob === "object") {
    patch.paymob = { enabled: (body.paymob as Record<string, unknown>).enabled === true, integrationIds: {} };
  }

  /* طرقُ التحويل اليدويّ */
  if (body.manualPay && typeof body.manualPay === "object") {
    const mp = body.manualPay as Record<string, unknown>;
    const list = Array.isArray(mp.methods) ? mp.methods : [];
    patch.manualPay = {
      enabled: mp.enabled === true,
      methods: list.slice(0, 10).map((m) => {
        const o = (m ?? {}) as Record<string, unknown>;
        const kind = (["instapay", "wallet", "bank"].includes(String(o.kind)) ? o.kind : "wallet") as "instapay" | "wallet" | "bank";
        return {
          kind,
          label: String(o.label ?? "").slice(0, 60),
          number: String(o.number ?? "").slice(0, 80),
          active: o.active !== false,
        };
      }).filter((m) => m.number.trim()),
    };
  }

  const next = await saveHubSettings(patch);
  await audit("hub.settings", { kind: "super", id: me.id, name: me.name }, { details: { keys: Object.keys(patch) } });
  return NextResponse.json({ ok: true, settings: next });
}
