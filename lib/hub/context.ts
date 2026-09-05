import "server-only";
import { AsyncLocalStorage } from "async_hooks";
import { cache } from "react";
import { headers } from "next/headers";
import { NextResponse } from "next/server";
import type { Tenant } from "./types";
import {
  tenantIdBySlug, tenantById, defaultTenantId, rootServesDefaultTenant,
} from "./registry";

/**
 * سياقُ المستأجر — قلبُ العزل.
 * ------------------------------------------------------------------
 * كلُّ ما في `lib/db.ts` و`lib/store.ts` يسأل: **أيُّ منصّةٍ الآن؟** وهذا
 * الملفُّ وحدَه يجيب. وطريقتان للإجابة، لأنّ Next يشغّل الكودَ في
 * سياقين مختلفين:
 *
 *   ١) **مساراتُ API (Route Handlers):** تُلفّ بـ`tenantRoute()` فتعمل
 *      داخل `AsyncLocalStorage.run()` — وكلُّ استدعاءٍ متزامنٍ أو غيرِ
 *      متزامنٍ تحته يرى المستأجر.
 *
 *   ٢) **مكوّناتُ الخادم (Layouts/Pages/Metadata):** لا مدخلَ واحدٌ نلفّه.
 *      فيُستعمل `cache()` من React — صندوقٌ يُذكَّر لكلّ طلبِ رسمٍ على حدة
 *      (يشمل `generateMetadata` والتخطيطاتِ والصفحةَ معاً). يملؤه
 *      `bindTenant()` الذي يستدعيه `loadDB()` في بداية كلّ تخطيط.
 *
 * ولماذا لا يكفي `enterWith` داخل `loadDB()`؟ لأنّ قراءةَ الترويسات غيرُ
 * متزامنة، و`enterWith` بعد `await` لا يبلغ استمرارَ المستدعي. فالصندوقُ
 * المذكَّر هو الطريقُ الوحيدُ الذي يصل من `await loadDB()` إلى
 * `getDB()` المتزامنة التي تليه.
 *
 * **والقاعدةُ الحاكمة:** لا سياقَ = خطأٌ صريح، لا بياناتٌ افتراضية.
 * فمسارٌ نُسي لفُّه يسقط في الاختبار الأوّل لا في الإنتاج بتسريب.
 */

export type TenantCtx = { id: string; slug: string; tenant: Tenant };

export class TenantContextMissing extends Error {
  constructor(msg = "لا سياقَ مستأجر — لُفّ المسار بـ tenantRoute() أو استدعِ loadDB() أوّلاً") {
    super(msg);
    this.name = "TenantContextMissing";
  }
}

export class TenantNotFound extends Error {
  constructor(public slug: string) {
    super("لا توجد منصّة على هذا العنوان");
    this.name = "TenantNotFound";
  }
}

const als = new AsyncLocalStorage<TenantCtx>();

/** صندوقُ طلبِ الرسم — كائنٌ واحدٌ لكلّ طلب RSC. خارج الرسم يعيد كائناً جديداً كلَّ مرّة (بلا تسريب). */
const rscBox = cache((): { ctx: TenantCtx | null } => ({ ctx: null }));

function boxed(): TenantCtx | null {
  try {
    return rscBox().ctx;
  } catch {
    return null;
  }
}

/** السياقُ الحاليّ إن وُجد. */
export function tryCurrentTenant(): TenantCtx | null {
  return als.getStore() ?? boxed();
}

/** السياقُ الحاليّ — أو خطأٌ صريح. */
export function currentTenant(): TenantCtx {
  const t = tryCurrentTenant();
  if (!t) throw new TenantContextMissing();
  return t;
}

export function currentTenantId(): string {
  return currentTenant().id;
}

/** جذرُ قاعدة المنصّة في فايربيز. */
export function platformRoot(id = currentTenantId()): string {
  return `tenants/${id}/platform`;
}

/** مسارٌ فرعيّ لمنصّةٍ خارج قاعدتها (backups · activity · claims…). */
export function tenantPath(sub: string, id = currentTenantId()): string {
  return `tenants/${id}/${sub.replace(/^\//, "")}`;
}

/* ---------- الحلّ ---------- */

/**
 * من ترويسات الوسيط إلى سياق.
 * الوسيطُ يضع `x-host-kind` و`x-tenant-slug` بعد أن يمحو ما جاء من العميل.
 */
export async function resolveFromHeaders(h: { get(k: string): string | null }): Promise<TenantCtx> {
  const kind = h.get("x-host-kind") ?? "root";
  const slug = (h.get("x-tenant-slug") ?? "").toLowerCase();
  return resolve(kind, slug);
}

export async function resolve(kind: string, slug: string): Promise<TenantCtx> {
  let id: string | null = null;
  if (kind === "tenant" && slug) {
    id = await tenantIdBySlug(slug);
  } else if (kind === "root" || kind === "custom") {
    /* الجذرُ والدومينُ المجهول يخدمان المنصّةَ الافتراضية حتى يُطلَق الـHub (M3/M6) */
    if (rootServesDefaultTenant()) id = defaultTenantId();
  }
  if (!id) throw new TenantNotFound(slug || kind);
  const tenant = await tenantById(id);
  if (!tenant) throw new TenantNotFound(slug || id);
  return { id: tenant.id, slug: tenant.slug, tenant };
}

/**
 * يربط الطلبَ الحاليَّ بمستأجره (لمكوّنات الخادم).
 * يُستدعى من `loadDB()`، فلا يحتاجه أحدٌ يدوياً. وإن كان السياقُ قائماً
 * (داخل `tenantRoute`) لا يفعل شيئاً.
 */
export async function bindTenant(): Promise<TenantCtx> {
  const have = tryCurrentTenant();
  if (have) return have;
  const ctx = await resolveFromHeaders(await headers());
  try {
    rscBox().ctx = ctx;
  } catch {
    /* خارج الرسم — لا صندوق */
  }
  als.enterWith(ctx);
  return ctx;
}

/** يشغّل دالّةً داخل سياق منصّةٍ بعينها (المهامّ المجدولة، الترحيل، الـHub). */
export function runInTenant<T>(ctx: TenantCtx, fn: () => Promise<T>): Promise<T> {
  return als.run(ctx, fn);
}

export async function ctxForTenantId(id: string): Promise<TenantCtx> {
  const tenant = await tenantById(id);
  if (!tenant) throw new TenantNotFound(id);
  return { id: tenant.id, slug: tenant.slug, tenant };
}

/* ---------- غلافُ مسارات API ---------- */

type Handler<A extends unknown[]> = (req: Request, ...args: A) => Promise<Response> | Response;

/**
 * يلفّ معالجَ مسارٍ فيحلّ المستأجرَ من الطلب ويشغّله داخل سياقه.
 * مضيفٌ لا منصّةَ له → ٤٠٤ JSON بلا تفصيل.
 */
export function tenantRoute<A extends unknown[]>(fn: Handler<A>): (req: Request, ...args: A) => Promise<Response> {
  return async (req: Request, ...args: A) => {
    let ctx: TenantCtx;
    try {
      ctx = await resolveFromHeaders(req.headers);
    } catch (e) {
      if (e instanceof TenantNotFound) {
        return NextResponse.json({ error: "لا توجد منصّة على هذا العنوان" }, { status: 404 });
      }
      throw e;
    }
    return als.run(ctx, () => Promise.resolve(fn(req, ...args)));
  };
}
