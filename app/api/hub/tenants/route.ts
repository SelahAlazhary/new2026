import { NextResponse } from "next/server";
import { sameOrigin, limit, clientIp } from "@/lib/auth/guard";
import { requireSuper } from "@/lib/hub/session";
import { isHubHost } from "@/lib/hub/guard-host";
import { listTenants, patchTenant, tenantById, forgetTenant } from "@/lib/hub/registry";
import { invalidateTenant } from "@/lib/db/store";
import { audit } from "@/lib/hub/audit";
import { SECTIONS, FEATURES } from "@/lib/hub/sections";
import { provisionTenant } from "@/lib/hub/provision";
import { subscriptionForTenant, setSubscriptionStatus } from "@/lib/hub/plans";
import { listInvoices } from "@/lib/hub/invoices";
import { activateFromInvoice } from "@/lib/hub/billing/activate";
import type { HideableSection, TenantFeature, TenantLimits, TenantStatus } from "@/lib/hub/types";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

const STATUSES: TenantStatus[] = ["onboarding", "pending_approval", "active", "suspended", "expired", "archived"];
const SECTION_KEYS = new Set<string>(SECTIONS.map((s) => s.key));
const FEATURE_KEYS = new Set<string>(FEATURES.map((f) => f.key));

async function guard() {
  if (!(await isHubHost())) return { error: NextResponse.json({ error: "غير موجود" }, { status: 404 }) };
  const me = await requireSuper();
  if (!me) return { error: NextResponse.json({ error: "غير مصرّح" }, { status: 401 }) };
  return { me };
}

export async function GET() {
  const g = await guard();
  if ("error" in g) return g.error;
  return NextResponse.json({ tenants: await listTenants() }, { headers: { "Cache-Control": "no-store" } });
}

/**
 * تعديلُ منصّةٍ من فوقها.
 * ------------------------------------------------------------------
 * كلُّ فعلٍ هنا يُغيّر ما يراه صاحبُ المنصّة أو ما يصل طلابَه، فثلاثةُ
 * قيودٍ لازمة:
 *   ١) **قائمةٌ بيضاء للأفعال والقيم** — لا يُدمج جسمُ الطلب في البطاقة
 *      كما جاء، وإلّا كتب مرسلٌ حقلاً لم يُقصد (`ownerId` مثلاً).
 *   ٢) **تدوينٌ لكلّ تغيير** — قسمٌ يختفي بلا سجلٍّ لا يُراجَع.
 *   ٣) **إسقاطُ المخبأ** — وإلّا بقي القرارُ حبيسَ الـHub دقيقةً كاملة.
 */
export async function PATCH(req: Request) {
  const g = await guard();
  if ("error" in g) return g.error;
  if (!(await sameOrigin(req))) return NextResponse.json({ error: "طلب غير صالح" }, { status: 403 });
  const rate = limit(`hub:write:${await clientIp()}`, 120, 60_000);
  if (!rate.ok) return NextResponse.json({ error: "طلبات كثيرة" }, { status: 429 });

  const body = (await req.json().catch(() => ({}))) as Record<string, unknown>;
  const id = String(body.id ?? "").trim();
  const action = String(body.action ?? "").trim();
  if (!id || !action) return NextResponse.json({ error: "بيانات ناقصة" }, { status: 400 });

  const current = await tenantById(id);
  if (!current) return NextResponse.json({ error: "لا توجد منصّة بهذا المعرّف" }, { status: 404 });

  const actor = { kind: "super" as const, id: g.me.id, name: g.me.name };
  let details: Record<string, unknown> = {};
  let patch: Parameters<typeof patchTenant>[1] = {};

  switch (action) {
    case "status": {
      const status = String(body.status ?? "") as TenantStatus;
      if (!STATUSES.includes(status)) return NextResponse.json({ error: "حالة غير معروفة" }, { status: 400 });
      /* الأرشفةُ لا رجعةَ لها عمليّاً — فتُطلب بكتابة الـslug كاملاً */
      if (status === "archived" && String(body.confirm ?? "") !== current.slug) {
        return NextResponse.json({ error: "اكتب معرّف المنصّة للتأكيد" }, { status: 400 });
      }
      const reason = String(body.reason ?? "").slice(0, 300);
      patch = {
        status,
        suspendReason: status === "suspended" ? reason : "",
        activatedAt: status === "active" && !current.activatedAt ? new Date().toISOString() : current.activatedAt,
      };
      details = { from: current.status, to: status, reason };
      break;
    }
    case "sections": {
      const list = Array.isArray(body.hiddenSections) ? body.hiddenSections : [];
      const hiddenSections = [...new Set(list.map(String).filter((s) => SECTION_KEYS.has(s)))] as HideableSection[];
      patch = { hiddenSections };
      details = { hiddenSections };
      break;
    }
    case "features": {
      const raw = (body.features ?? {}) as Record<string, unknown>;
      const features: Partial<Record<TenantFeature, boolean>> = {};
      for (const [k, v] of Object.entries(raw)) {
        if (FEATURE_KEYS.has(k) && typeof v === "boolean") features[k as TenantFeature] = v;
      }
      patch = { features };
      details = { off: Object.entries(features).filter(([, v]) => v === false).map(([k]) => k) };
      break;
    }
    case "limits": {
      const raw = (body.limits ?? {}) as Record<string, unknown>;
      const num = (v: unknown): number | null => {
        if (v === null || v === "" || v === undefined) return null;
        const n = Number(v);
        return Number.isFinite(n) && n >= 0 ? Math.floor(n) : null;
      };
      const limits: TenantLimits = {
        maxStudents: num(raw.maxStudents),
        maxSubjects: num(raw.maxSubjects),
        maxAdmins: num(raw.maxAdmins),
        maxStorageMB: num(raw.maxStorageMB),
        customDomain: raw.customDomain !== false,
      };
      patch = { limits };
      details = { limits };
      break;
    }
    case "notes": {
      const notes = String(body.notes ?? "").slice(0, 2000);
      patch = { notes };
      details = {};
      break;
    }

    /* الموافقةُ على منصّةٍ تنتظر: تُجهَّز وتُفعَّل، ويُنشأ حسابُ أدمنها */
    case "approve": {
      if (current.status !== "pending_approval" && current.status !== "onboarding") {
        return NextResponse.json({ error: "هذه المنصّة ليست بانتظار الموافقة" }, { status: 400 });
      }
      /*
        بلا try/catch كان عطبٌ في `provisionTenant` (خطأٌ في بيانات
        منصّةٍ بعينها، أو اتصالٌ عابر بالقاعدة) يسقط الطلبَ بلا جسم JSON،
        فيقرأ العميلُ خطأً فارغاً ويعرض «تعذّر» — لا يُعرف منها شيء.
        والرسالةُ الحقيقيّةُ هنا تُدوَّن في السجلّ وتُعاد للوحة، فيُرى
        السببُ لا عرَضُه.
      */
      let result;
      try {
        result = await provisionTenant(id);
      } catch (e) {
        const msg = e instanceof Error ? e.message : "خطأٌ غيرُ معروف";
        await audit("tenant.approve_failed", actor, { tenantId: id, details: { error: msg } });
        return NextResponse.json({ error: `تعذّر التفعيل: ${msg}` }, { status: 500 });
      }
      /* الفاتورةُ اليدويّةُ المعلّقة تُعتمَد مع الموافقة — فالتفعيلُ قرارٌ واحد */
      const pendingInv = (await listInvoices({ tenantId: id, status: "pending" }))[0];
      if (pendingInv) {
        await activateFromInvoice(pendingInv.id, "super");
      } else {
        const sub = await subscriptionForTenant(id);
        if (sub && (sub.status === "pending_approval" || sub.status === "pending_payment")) {
          await setSubscriptionStatus(sub.id, "active", "super");
        }
      }
      await audit("tenant.approve", actor, { tenantId: id });
      return NextResponse.json({ ok: true, tenant: result.tenant });
    }

    /* الرفضُ مع سبب — تبقى المسودّة ليصحّحها صاحبُها */
    case "reject": {
      const reason = String(body.reason ?? "").slice(0, 300);
      patch = { status: "onboarding", onboardingStep: "name", suspendReason: reason };
      details = { reason };
      break;
    }

    default:
      return NextResponse.json({ error: "أمر غير معروف" }, { status: 400 });
  }

  const next = await patchTenant(id, patch);
  if (!next) return NextResponse.json({ error: "تعذّر الحفظ" }, { status: 500 });

  forgetTenant(next.id, next.slug);
  invalidateTenant(next.id);
  await audit(`tenant.${action}`, actor, { tenantId: id, details });

  return NextResponse.json({ ok: true, tenant: next });
}
