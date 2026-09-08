import { NextResponse } from "next/server";
import { sameOrigin } from "@/lib/auth/guard";
import { requireSuper } from "@/lib/hub/session";
import { isHubHost } from "@/lib/hub/guard-host";
import { listPlans, upsertPlan, deletePlan } from "@/lib/hub/plans";
import { audit } from "@/lib/hub/audit";
import type { SaasPlan, TenantFeature, TenantLimits } from "@/lib/hub/types";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

export async function GET() {
  if (!(await isHubHost())) return NextResponse.json({ error: "غير موجود" }, { status: 404 });
  if (!(await requireSuper())) return NextResponse.json({ error: "غير مصرّح" }, { status: 401 });
  return NextResponse.json(await listPlans(), { headers: { "Cache-Control": "no-store" } });
}

const VALID_FEATURES: TenantFeature[] = [
  "liveMeet", "youtube", "telegramBot", "bunny", "drive", "webPush",
  "studentPayments", "codes", "exams", "backup", "customDomain", "team", "captureGuard",
];

function parsePlan(body: Record<string, unknown>, existingId?: string): SaasPlan {
  const interval = (["month", "quarter", "year"].includes(String(body.interval)) ? body.interval : "month") as SaasPlan["interval"];
  const price = Math.max(0, Math.floor(Number(body.priceEGP) || 0));
  const trial = Math.max(0, Math.min(365, Math.floor(Number(body.trialDays) || 0)));
  const lim = (body.limits ?? {}) as Record<string, unknown>;
  const limits: TenantLimits = {
    maxStudents: lim.maxStudents === null || lim.maxStudents === "null" ? null : Math.max(1, Math.floor(Number(lim.maxStudents) || 60)),
    maxSubjects: lim.maxSubjects === null || lim.maxSubjects === "null" ? null : Math.max(1, Math.floor(Number(lim.maxSubjects) || 4)),
    maxAdmins: lim.maxAdmins === null || lim.maxAdmins === "null" ? null : Math.max(1, Math.floor(Number(lim.maxAdmins) || 1)),
    maxStorageMB: lim.maxStorageMB === null || lim.maxStorageMB === "null" ? null : Math.max(100, Math.floor(Number(lim.maxStorageMB) || 500)),
    customDomain: lim.customDomain === true,
  };
  const features = Array.isArray(body.features)
    ? (body.features as string[]).filter((f) => VALID_FEATURES.includes(f as TenantFeature)) as TenantFeature[]
    : [];

  return {
    id: existingId ?? "",
    name: String(body.name ?? "").trim().slice(0, 60) || "خطّة جديدة",
    desc: String(body.desc ?? "").trim().slice(0, 300),
    interval,
    priceEGP: price,
    trialDays: trial,
    limits,
    features,
    highlight: body.highlight === true,
    badge: String(body.badge ?? "").trim().slice(0, 40) || undefined,
    color: /^#[0-9a-fA-F]{6}$/.test(String(body.color ?? "")) ? String(body.color) : "#3b6fb0",
    order: Math.floor(Number(body.order) || 0),
    visible: body.visible !== false,
  };
}

export async function POST(req: Request) {
  if (!(await isHubHost())) return NextResponse.json({ error: "غير موجود" }, { status: 404 });
  const me = await requireSuper();
  if (!me) return NextResponse.json({ error: "غير مصرّح" }, { status: 401 });
  if (!(await sameOrigin(req))) return NextResponse.json({ error: "طلب غير صالح" }, { status: 403 });

  const body = (await req.json().catch(() => ({}))) as Record<string, unknown>;
  const action = String(body.action ?? "upsert");

  if (action === "delete") {
    const id = String(body.id ?? "");
    if (!id) return NextResponse.json({ error: "معرّف مطلوب" }, { status: 400 });
    await deletePlan(id);
    await audit("plan.deleted", { kind: "super", id: me.id, name: me.name }, { details: { planId: id } });
    return NextResponse.json({ ok: true });
  }

  const plan = parsePlan(body, String(body.id ?? "").trim() || undefined);
  if (!plan.name) return NextResponse.json({ error: "الاسم مطلوب" }, { status: 400 });

  const saved = await upsertPlan(plan);
  await audit("plan.upserted", { kind: "super", id: me.id, name: me.name }, { details: { planId: saved.id, name: saved.name } });
  return NextResponse.json({ ok: true, plan: saved });
}
