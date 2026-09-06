import "server-only";
import type { CustomDomain } from "./types";
import { hubGet, hubSet, hubList, hubId } from "./store";
import { patchTenant, tenantById, forgetTenant } from "./registry";
import { audit } from "./audit";

/**
 * ربطُ دومين مخصّص بمنصّة — من الإضافة إلى التفعيل.
 * ------------------------------------------------------------------
 * التدفّق:
 *   ١) صاحبُ المنصّة (أو أدمن المنصّات) يُضيف الدومين.
 *   ٢) إن وُجد `VERCEL_TOKEN` يُسجَّل الدومينُ في مشروع فيرسل ويُعاد
 *      سجلُّ TXT/CNAME للتحقّق.
 *   ٣) كرونُ التحقّق (`/api/cron/domain-verify`) يفحص DNS كلَّ ١٥ دقيقة
 *      أو بضغطة يدوية.
 *   ④) عند التحقّق الناجح: الحالةُ `active` وتُكتب خريطةُ الدومينات.
 *
 * **خريطةُ الدومينات** (`hub/domainMap/{domain} → tenantId`): فهرسٌ مسطّح
 * يُقرأ في `resolve()` لحلّ المضيف المخصّص إلى منصّته. والبديلُ المحلّي
 * `data/domains.json` يُكتب بالتوازي لمن يعمل بلا فايربيز.
 *
 * والتكاملُ مع Vercel **اختياريّ**: بلا `VERCEL_TOKEN` يُضاف الدومينُ
 * للقاعدة فقط، وعلى صاحب المنصّة أن يوجّه DNS يدوياً. وهذا كافٍ
 * للتطوير المحلّي ولمن يستضيف خارج فيرسل.
 */

const DOMAIN_RE = /^(?!-)[a-z0-9-]{1,63}(?:\.[a-z0-9-]{1,63})+$/;

function validDomain(d: string): string | null {
  const clean = d.trim().toLowerCase().replace(/^https?:\/\//, "").replace(/\/.*$/, "").replace(/:\d+$/, "");
  return DOMAIN_RE.test(clean) ? clean : null;
}

/* ---------- Vercel API ---------- */

function vercelConfigured(): boolean {
  return Boolean(process.env.VERCEL_TOKEN && process.env.VERCEL_PROJECT_ID);
}

async function vercelFetch(path: string, opts?: { method?: string; body?: unknown }): Promise<unknown> {
  const base = "https://api.vercel.com";
  const team = process.env.VERCEL_TEAM_ID;
  const sep = path.includes("?") ? "&" : "?";
  const url = `${base}${path}${team ? `${sep}teamId=${team}` : ""}`;
  const res = await fetch(url, {
    method: opts?.method ?? "GET",
    headers: {
      Authorization: `Bearer ${process.env.VERCEL_TOKEN}`,
      "Content-Type": "application/json",
    },
    body: opts?.body ? JSON.stringify(opts.body) : undefined,
  });
  if (!res.ok) {
    const text = await res.text().catch(() => "");
    throw new Error(`Vercel ${res.status}: ${text.slice(0, 200)}`);
  }
  return res.json();
}

async function vercelAddDomain(domain: string): Promise<{ verification?: { type: string; domain: string; value: string }[] }> {
  if (!vercelConfigured()) return {};
  const projectId = process.env.VERCEL_PROJECT_ID!;
  const data = await vercelFetch(`/v10/projects/${projectId}/domains`, {
    method: "POST",
    body: { name: domain },
  }) as Record<string, unknown>;
  return { verification: Array.isArray(data.verification) ? data.verification : undefined };
}

async function vercelRemoveDomain(domain: string): Promise<void> {
  if (!vercelConfigured()) return;
  const projectId = process.env.VERCEL_PROJECT_ID!;
  await vercelFetch(`/v9/projects/${projectId}/domains/${domain}`, { method: "DELETE" }).catch(() => {});
}

async function vercelCheckDomain(domain: string): Promise<{ verified: boolean; verification?: { type: string; domain: string; value: string }[] }> {
  if (!vercelConfigured()) return { verified: true };
  const projectId = process.env.VERCEL_PROJECT_ID!;
  const data = await vercelFetch(`/v9/projects/${projectId}/domains/${domain}`) as Record<string, unknown>;
  return {
    verified: data.verified === true,
    verification: Array.isArray(data.verification) ? data.verification : undefined,
  };
}

/* ---------- خريطة الدومينات ---------- */

/**
 * المخبأُ على `globalThis` لأنّ Next يحزم الصفحات ومسارات API مستقلّاً.
 * (نفسُ المنطق في `registry.ts` — انظر التعليق هناك.)
 */
const g = globalThis as unknown as { __hubDomainMap?: Map<string, { tid: string | null; at: number }> };
const domainMapCache = (g.__hubDomainMap ??= new Map());
const DOMAIN_TTL = 60_000;

export async function tenantIdByDomain(domain: string): Promise<string | null> {
  const d = domain.trim().toLowerCase();
  if (!d) return null;
  const hit = domainMapCache.get(d);
  if (hit && Date.now() - hit.at < DOMAIN_TTL) return hit.tid;

  let tid: string | null = null;
  try {
    const v = await hubGet<string>(`domainMap/${encodeKey(d)}`);
    tid = typeof v === "string" && v ? v : null;
  } catch {
    tid = hit?.tid ?? null;
  }
  domainMapCache.set(d, { tid, at: Date.now() });
  return tid;
}

export function forgetDomain(domain: string) {
  domainMapCache.delete(domain.trim().toLowerCase());
}

/** فايربيز لا تقبل `.` في المفاتيح — نستبدلها. */
function encodeKey(domain: string): string {
  return domain.replace(/\./g, "_");
}

async function writeDomainMap(domain: string, tenantId: string | null) {
  const key = encodeKey(domain);
  await hubSet(`domainMap/${key}`, tenantId);
  forgetDomain(domain);
}

/* ---------- CRUD ---------- */

export async function addDomain(
  tenantId: string,
  rawDomain: string,
  actor: { kind: "super" | "owner"; id: string; name: string }
): Promise<{ ok: boolean; domain?: CustomDomain; error?: string }> {
  const domain = validDomain(rawDomain);
  if (!domain) return { ok: false, error: "دومين غير صالح" };

  const tenant = await tenantById(tenantId);
  if (!tenant) return { ok: false, error: "لا توجد منصّة" };

  /* التحقّقُ من الفرادة — لا دومينان لنفس العنوان */
  const existing = await domainByHost(domain);
  if (existing) return { ok: false, error: "هذا الدومين مربوط بمنصّة أخرى" };

  let verification: { type: string; domain: string; value: string }[] | undefined;
  try {
    const vr = await vercelAddDomain(domain);
    verification = vr.verification;
  } catch (e) {
    const msg = e instanceof Error ? e.message : "خطأ في Vercel API";
    return { ok: false, error: msg };
  }

  const id = hubId("dom");
  const now = new Date().toISOString();
  const rec: CustomDomain = {
    id,
    tenantId,
    domain,
    status: vercelConfigured() ? "pending_dns" : "active",
    vercelVerification: verification,
    createdAt: now,
    lastCheckedAt: now,
    activatedAt: vercelConfigured() ? undefined : now,
  };

  await hubSet(`domains/${id}`, rec);

  /* بلا فيرسل: يُفعَّل فوراً */
  if (!vercelConfigured()) {
    await writeDomainMap(domain, tenantId);
    await patchTenant(tenantId, { customDomain: domain });
    forgetTenant(tenantId, tenant.slug);
  }

  await audit("domain.add", actor, { tenantId, details: { domain } });
  return { ok: true, domain: rec };
}

export async function removeDomain(
  domainId: string,
  actor: { kind: "super" | "owner"; id: string; name: string }
): Promise<{ ok: boolean; error?: string }> {
  const rec = await hubGet<CustomDomain>(`domains/${domainId}`);
  if (!rec) return { ok: false, error: "لا يوجد سجلّ دومين" };

  try {
    await vercelRemoveDomain(rec.domain);
  } catch { /* لا يُفشل الحذفَ */ }

  await hubSet(`domains/${domainId}`, null);
  await writeDomainMap(rec.domain, null);

  /* نمسح الدومين من بطاقة المنصّة إن كان هو نفسُه */
  const tenant = await tenantById(rec.tenantId);
  if (tenant?.customDomain === rec.domain) {
    await patchTenant(rec.tenantId, { customDomain: "" });
    forgetTenant(rec.tenantId, tenant.slug);
  }

  await audit("domain.remove", actor, { tenantId: rec.tenantId, details: { domain: rec.domain } });
  return { ok: true };
}

/** يفحص DNS ويحدّث الحالة — يُستدعى من الكرون أو يدوياً. */
export async function verifyDomain(domainId: string): Promise<CustomDomain | null> {
  const rec = await hubGet<CustomDomain>(`domains/${domainId}`);
  if (!rec || rec.status === "removed" || rec.status === "active") return rec;

  const now = new Date().toISOString();
  let status: CustomDomain["status"] = rec.status;
  let verification = rec.vercelVerification;
  let error: string | undefined;
  let activatedAt = rec.activatedAt;

  try {
    const check = await vercelCheckDomain(rec.domain);
    verification = check.verification ?? verification;
    if (check.verified) {
      status = "active";
      activatedAt = now;
      await writeDomainMap(rec.domain, rec.tenantId);
      await patchTenant(rec.tenantId, { customDomain: rec.domain });
      const tenant = await tenantById(rec.tenantId);
      if (tenant) forgetTenant(rec.tenantId, tenant.slug);
    } else {
      status = "verifying";
    }
  } catch (e) {
    status = "failed";
    error = e instanceof Error ? e.message.slice(0, 200) : "فشل التحقّق";
  }

  const updated: CustomDomain = { ...rec, status, vercelVerification: verification, lastCheckedAt: now, error, activatedAt };
  await hubSet(`domains/${domainId}`, updated);
  return updated;
}

/* ---------- القراءة ---------- */

export async function domainByHost(host: string): Promise<CustomDomain | null> {
  const all = await hubList<CustomDomain>("domains");
  return Object.values(all).find((d) => d && d.domain === host.trim().toLowerCase() && d.status !== "removed") ?? null;
}

export async function listDomains(tenantId?: string): Promise<CustomDomain[]> {
  const all = await hubList<CustomDomain>("domains");
  return Object.values(all)
    .filter((d) => d && d.status !== "removed" && (!tenantId || d.tenantId === tenantId))
    .sort((a, b) => (b.createdAt ?? "").localeCompare(a.createdAt ?? ""));
}

export async function domainById(id: string): Promise<CustomDomain | null> {
  return hubGet<CustomDomain>(`domains/${id}`);
}

/** كلُّ الدومينات التي تحتاج فحصاً (ليست active ولا removed). */
export async function pendingDomains(): Promise<CustomDomain[]> {
  const all = await hubList<CustomDomain>("domains");
  return Object.values(all).filter((d): d is CustomDomain =>
    Boolean(d) && (d.status === "pending_dns" || d.status === "verifying" || d.status === "failed")
  );
}
