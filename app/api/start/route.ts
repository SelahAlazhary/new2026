import { NextResponse } from "next/server";
import { sameOrigin, limit, clientIp } from "@/lib/guard";
import { isHubHost } from "@/lib/hub/guard-host";
import { requireOwner } from "@/lib/hub/owner";
import { listTenants, tenantById, upsertTenant, patchTenant } from "@/lib/hub/registry";
import { hubId } from "@/lib/hub/store";
import { availableSlug, checkSlug } from "@/lib/hub/onboarding";
import { visiblePlans, planById, createSubscription, subscriptionForTenant, setSubscriptionStatus } from "@/lib/hub/plans";
import { getHubSettings } from "@/lib/hub/settings";
import { presetById } from "@/lib/hub/presets";
import { provisionTenant } from "@/lib/hub/provision";
import { revealDelivery } from "@/lib/hub/delivery";
import { audit } from "@/lib/hub/audit";
import type { Tenant } from "@/lib/hub/types";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

/**
 * مُنظِّمُ رحلة إنشاء المنصّة.
 * ------------------------------------------------------------------
 * فعلٌ واحدٌ في كلّ طلب (`action`)، وكلُّها تعمل على **مسودّةِ** المدرّس:
 * منصّةٌ بحالة `onboarding` يملكها، واحدةٌ لا أكثر. الخطواتُ تُحفظ فيها
 * تباعاً (`onboardingStep`)، فمن قطع الرحلة عاد إلى حيث وقف.
 *
 * ولا يُنشئ المدرّسُ منصّةً نهائيّةً بنفسه: أقصى ما يبلغه `pending_approval`
 * (أو `active` إن كان القبولُ تلقائيّاً). التفعيلُ والتجهيزُ قرارٌ من
 * الموقع الأمّ — انظر `provisionTenant`.
 */
async function currentDraft(ownerId: string): Promise<Tenant | null> {
  const mine = (await listTenants()).filter((t) => t.ownerId === ownerId);
  return mine.find((t) => t.status === "onboarding" || t.status === "pending_approval") ?? null;
}

export async function POST(req: Request) {
  if (!(await isHubHost())) return NextResponse.json({ error: "غير موجود" }, { status: 404 });
  if (!(await sameOrigin(req))) return NextResponse.json({ error: "طلب غير صالح" }, { status: 403 });

  const owner = await requireOwner();
  if (!owner) return NextResponse.json({ error: "سجّل الدخول أوّلاً", code: "no_owner" }, { status: 401 });

  const rate = limit(`start:${await clientIp()}`, 60, 60_000);
  if (!rate.ok) return NextResponse.json({ error: "طلبات كثيرة" }, { status: 429 });

  const body = (await req.json().catch(() => ({}))) as Record<string, unknown>;
  const action = String(body.action ?? "");

  switch (action) {
    /* فحصُ توفّر الرابط — لحظيّاً أثناء الكتابة */
    case "slug-check": {
      const res = await checkSlug(String(body.slug ?? ""));
      return NextResponse.json(res);
    }

    /* اختيارُ الخطّة — يُنشئ المسودّة إن لم تكن، ويربط اشتراكاً */
    case "plan": {
      const plan = await planById(String(body.planId ?? ""));
      if (!plan || !plan.visible) return NextResponse.json({ error: "خطّة غير معروفة" }, { status: 400 });

      let draft = await currentDraft(owner.id);
      if (!draft) {
        const id = hubId("t");
        const slug = await availableSlug(owner.name || owner.email.split("@")[0]);
        draft = {
          id, slug, name: "", ownerId: owner.id,
          status: "onboarding", createdAt: new Date().toISOString(),
          onboardingStep: "name",
          brandPresetId: "midad",
          brandColors: presetById("midad").colors,
          hiddenSections: [], features: {},
          limits: plan.limits,
          adminEmail: owner.email,
        };
        await upsertTenant(draft);
        await createSubscription(id, plan);
        await audit("owner.start_platform", { kind: "owner", id: owner.id, name: owner.name }, { tenantId: id, details: { plan: plan.id } });
      } else {
        /* غيّر الخطّة قبل الإكمال: يُحدَّث الاشتراكُ والحدود */
        const sub = await subscriptionForTenant(draft.id);
        if (sub) await setSubscriptionStatus(sub.id, "canceled", "owner", "غيّر الخطّة");
        await createSubscription(draft.id, plan);
        draft = (await patchTenant(draft.id, { limits: plan.limits }))!;
      }
      return NextResponse.json({ ok: true, tenant: draft, planId: plan.id });
    }

    /* حفظُ بيانات المنصّة — اسمٌ ووصفٌ ورابطٌ وشعارٌ وهويّةٌ ودومين */
    case "save": {
      const draft = await currentDraft(owner.id);
      if (!draft) return NextResponse.json({ error: "ابدأ باختيار خطّة", code: "no_draft" }, { status: 400 });
      if (draft.status !== "onboarding") return NextResponse.json({ error: "لا يمكن التعديل بعد الإرسال" }, { status: 400 });

      const patch: Partial<Tenant> = {};
      const step = String(body.step ?? "");

      if (typeof body.name === "string") patch.name = body.name.trim().slice(0, 60);
      if (typeof body.description === "string") patch.description = body.description.trim().slice(0, 300);
      if (typeof body.logo === "string") patch.logo = body.logo.slice(0, 100000); // data: أو رابط

      if (typeof body.slug === "string") {
        const check = await checkSlug(body.slug);
        if (!check.ok) return NextResponse.json({ error: check.reason }, { status: 400 });
        patch.slug = body.slug.trim().toLowerCase();
      }

      if (typeof body.presetId === "string") {
        const preset = presetById(body.presetId);
        patch.brandPresetId = preset.id;
        if (!body.colors) patch.brandColors = preset.colors;
      }
      if (body.colors && typeof body.colors === "object") {
        const c = body.colors as Record<string, string>;
        const hex = (v: string, fb: string) => (/^#[0-9a-fA-F]{6}$/.test(v ?? "") ? v : fb);
        const cur = draft.brandColors;
        patch.brandColors = {
          primary: hex(c.primary, cur.primary),
          gold: hex(c.gold, cur.gold),
          paper: hex(c.paper, cur.paper),
        };
      }

      if (typeof body.customDomain === "string") {
        const d = body.customDomain.trim().toLowerCase().replace(/^https?:\/\//, "").replace(/\/.*$/, "");
        patch.customDomain = d || undefined;
      }

      if (step) patch.onboardingStep = step as Tenant["onboardingStep"];

      const next = await patchTenant(draft.id, patch);
      return NextResponse.json({ ok: true, tenant: next });
    }

    /* الإرسالُ للمراجعة — أو تفعيلٌ تلقائيّ إن كان القبولُ آليّاً */
    case "submit": {
      const draft = await currentDraft(owner.id);
      if (!draft) return NextResponse.json({ error: "لا توجد مسودّة" }, { status: 400 });
      if (!draft.name || draft.name.length < 3) return NextResponse.json({ error: "أدخل اسم المنصّة أوّلاً" }, { status: 400 });
      if (draft.status === "pending_approval") return NextResponse.json({ ok: true, tenant: draft, pending: true });

      const settings = await getHubSettings();
      const sub = await subscriptionForTenant(draft.id);
      const paid = sub?.status === "trialing" || sub?.status === "active";

      /* القبولُ التلقائيّ يُفعّل الآن (بعد الدفع في M5)؛ واليدويُّ ينتظر أدمن المنصّات */
      if (settings.approval === "auto_after_payment" && paid) {
        await patchTenant(draft.id, { status: "pending_approval", onboardingStep: "done" });
        const result = await provisionTenant(draft.id);
        if (sub) await setSubscriptionStatus(sub.id, sub.status === "trialing" ? "trialing" : "active", "system");
        return NextResponse.json({ ok: true, provisioned: true, result });
      }

      await patchTenant(draft.id, { status: "pending_approval", onboardingStep: "done" });
      await audit("owner.submit_platform", { kind: "owner", id: owner.id, name: owner.name }, { tenantId: draft.id });
      return NextResponse.json({ ok: true, tenant: { ...draft, status: "pending_approval" }, pending: true });
    }

    /* كشفُ بيانات الدخول — مرّةً واحدةً لصاحب المنصّة بعد تجهيزها */
    case "reveal": {
      const mine = (await listTenants()).filter((t) => t.ownerId === owner.id);
      const t = mine.find((x) => x.id === String(body.tenantId ?? ""));
      if (!t) return NextResponse.json({ error: "لا توجد منصّة" }, { status: 404 });
      if (t.status !== "active") return NextResponse.json({ error: "لم تُجهَّز المنصّة بعد", code: "not_ready" }, { status: 409 });
      const d = await revealDelivery(t.id);
      const root = process.env.ROOT_DOMAIN?.trim();
      const base = t.customDomain
        ? `https://${t.customDomain}`
        : root ? `https://${t.slug}.${root}` : `http://${t.slug}.localhost:3000`;
      return NextResponse.json({
        ok: true,
        adminEmail: t.adminEmail,
        password: d?.password ?? null,
        studentUrl: base,
        adminUrl: `${base}/admin`,
      });
    }

    default:
      return NextResponse.json({ error: "أمر غير معروف" }, { status: 400 });
  }
}

/** حالةُ المسودّة الحالية — للاستعلام والاستئناف. */
export async function GET() {
  if (!(await isHubHost())) return NextResponse.json({ error: "غير موجود" }, { status: 404 });
  const owner = await requireOwner();
  if (!owner) return NextResponse.json({ owner: null }, { status: 200 });

  const mine = (await listTenants()).filter((t) => t.ownerId === owner.id);
  const draft = mine.find((t) => t.status === "onboarding" || t.status === "pending_approval") ?? null;
  const active = mine.filter((t) => t.status === "active" || t.status === "suspended" || t.status === "expired");
  const plans = await visiblePlans();
  const sub = draft ? await subscriptionForTenant(draft.id) : null;

  return NextResponse.json(
    { owner: { name: owner.name, email: owner.email, picture: owner.picture }, draft, active, plans, planId: sub?.planId ?? null },
    { headers: { "Cache-Control": "no-store" } }
  );
}
