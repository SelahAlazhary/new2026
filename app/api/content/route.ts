import { NextResponse } from "next/server";
import { getScopedDB, getPublicDB, getDB, patchDB, publicIntegrations, loadDB, flushDB } from "@/lib/db/db";
import { getSession } from "@/lib/auth/session";
import { recordEvent } from "@/lib/auth/security";
import { can, permForDbKey, permForContentKeys } from "@/lib/auth/perms";
import { currentTenant } from "@/lib/hub/context";
import { sectionForDbKey, sectionHidden } from "@/lib/hub/sections";
import type { DB } from "@/lib/utils/types";
import { tenantRoute } from "@/lib/hub/context";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

/** GET: البيانات المسموح بها لصاحب الجلسة فقط (زائر/طالب/أدمن). */
async function GET_impl() {
  await loadDB();
  const session = await getSession();
  return NextResponse.json(getScopedDB(session), {
    headers: { "Cache-Control": "no-store, private" },
  });
}

/** PUT: دمج تعديل جزئي (محتوى/كيانات) — للأدمن فقط. */
async function PUT_impl(req: Request) {
  await loadDB();
  const session = await getSession();
  if (!session || session.role !== "admin") {
    await recordEvent("unauthorized_admin", new URL(req?.url ?? "http://x/").pathname);
    return NextResponse.json({ error: "غير مصرّح" }, { status: 401 });
  }
  const patch = (await req.json()) as Partial<DB>;

  /**
   * الصلاحيات تُفحص على الخادم: مشرف بلا صلاحية قسم لا يستطيع تعديل
   * بياناته حتى لو استدعى المسار مباشرة. المالكة تمرّ دائماً.
   */
  const me = getDB().users.find((u) => u.id === session.uid);
  const touched = Object.keys(patch).filter((k) => k !== "users" && k !== "integrations");
  /**
   * `content` ليس قسماً واحداً: مفاتيح المظهر يملكها «المظهر والتخطيط»
   * وما عداها «تخصيص الموقع» — وإلا رأى مشرفُ المظهر شاشتَه ثم رُفض
   * كل حفظ فيها.
   */
  const missing = touched.filter((k) =>
    !can(me, k === "content" ? permForContentKeys(Object.keys(patch.content ?? {})) : permForDbKey(k))
  );
  if (missing.length) {
    await recordEvent("perm_denied", `تعديل بلا صلاحية: ${missing.join("، ")}`, { userId: me?.id, username: me?.username });
    return NextResponse.json({ error: "ليست لديك صلاحية تعديل هذا القسم" }, { status: 403 });
  }

  /*
    القسمُ المخفيُّ لا يُعدَّل ولو أُرسل المسارُ يدوياً.
    إخفاءُ الرابط في اللوحة ليس حماية: من فتح «عناصر المطوّر» أرسل
    `PUT /api/content` مباشرةً. فالفحصُ هنا هو الفحصُ الحقيقيّ.
  */
  const { tenant } = currentTenant();
  const hidden = touched.filter((k) => {
    const section = sectionForDbKey(k);
    return section ? sectionHidden(tenant, section) : false;
  });
  if (hidden.length) {
    await recordEvent("perm_denied", `تعديل قسم مخفيّ: ${hidden.join("، ")}`, { userId: me?.id, username: me?.username });
    return NextResponse.json(
      { error: "هذا القسم غير متاح في هذه المنصّة", code: "section_hidden" },
      { status: 403 }
    );
  }
  // منع تعديل المستخدمين والتكاملات عبر هذا المسار (لهما مساراتهما الخاصة)
  delete (patch as Record<string, unknown>).users;
  delete (patch as Record<string, unknown>).integrations;
  // دمج عميق لكائن المحتوى حتى لا يؤدي تعديل جزئي إلى فقدان حقول (theme/teacher…)
  if (patch.content) {
    const current = getPublicDB().content;
    patch.content = {
      ...current,
      ...patch.content,
      teacher: { ...current.teacher, ...(patch.content.teacher ?? {}) },
      theme: { ...current.theme, ...(patch.content.theme ?? {}) },
      hero: { ...current.hero, ...(patch.content.hero ?? {}) },
      cta: { ...(current.cta ?? {}), ...(patch.content.cta ?? {}) },
      support: { ...(current.support ?? {}), ...(patch.content.support ?? {}) },
      plansSection: { ...(current.plansSection ?? {}), ...(patch.content.plansSection ?? {}) },
      background: { ...(current.background ?? {}), ...(patch.content.background ?? {}) },
      payments: { ...(current.payments ?? {}), ...(patch.content.payments ?? {}) },
    };
  }
  const next = patchDB(patch);
  const { users, integrations, ...rest } = next;
  await flushDB();
  return NextResponse.json({ ok: true, ...rest, integrations: publicIntegrations(next) });
}

/* كلُّ معالجٍ يعمل داخل سياق منصّته — انظر lib/hub/context.ts */
export const GET = tenantRoute(GET_impl);
export const PUT = tenantRoute(PUT_impl);
