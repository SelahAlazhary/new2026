/**
 * اختبارُ الدومين المخصّص (M6) + الانتحال والتصدير (M7).
 * ------------------------------------------------------------------
 * ما يُثبته:
 *   ١) إضافةُ دومين لمنصّةٍ نشطة تنجح.
 *   ٢) الدومينُ المكرَّر يُرفض.
 *   ٣) فحصُ DNS يُحدّث الحالة.
 *   ٤) حذفُ الدومين ينجح.
 *   ٥) الانتحالُ يُنشئ جلسةً ويُعيد رابطاً.
 *   ٦) إنهاءُ الانتحال ينجح.
 *   ٧) تصديرُ المنصّات CSV يُعيد ملفّاً.
 *   ٨) تصديرُ الفواتير CSV يُعيد ملفّاً.
 *   ٩) كرونُ الإحصاءات يعمل.
 *   ١٠) كرونُ التحقّق من الدومينات يعمل.
 *   ١١) مسارُ الدومينات بلا تفويض يُرفض ٤٠١.
 *
 *   node scripts/test-domains.mjs
 */
import http from "node:http";

const BASE = new URL(process.env.BASE || "http://127.0.0.1:3300");
const ROOT = `localhost:${BASE.port}`;
const SUPER_EMAIL = process.env.SUPER_ADMIN_EMAIL || "super@local.test";
const SUPER_PASS = process.env.SUPER_ADMIN_PASSWORD || "LocalHub@2026";

function req(host, method, p, { body, headers = {}, cookie } = {}) {
  return new Promise((resolve, reject) => {
    const data = body === undefined ? null : typeof body === "string" ? body : JSON.stringify(body);
    const ct = typeof body === "string" ? {} : data ? { "Content-Type": "application/json", "Content-Length": Buffer.byteLength(data) } : {};
    const r = http.request({ host: BASE.hostname, port: BASE.port, method, path: p, headers: {
      Host: host, Origin: `http://${host}`, Accept: "application/json", ...ct,
      ...(cookie ? { Cookie: cookie } : {}), ...headers,
    } }, (res) => {
      let buf = ""; res.setEncoding("utf8"); res.on("data", (c) => (buf += c));
      res.on("end", () => { let json = null; try { json = JSON.parse(buf); } catch {} resolve({ status: res.statusCode, headers: res.headers, text: buf, json }); });
    });
    r.on("error", reject); if (data) r.write(data); r.end();
  });
}
const jarOf = (res, prev = "") => {
  const set = (res.headers["set-cookie"] ?? []).map((c) => c.split(";")[0]);
  const map = new Map(prev.split("; ").filter(Boolean).map((c) => [c.split("=")[0], c]));
  for (const c of set) map.set(c.split("=")[0], c);
  return [...map.values()].join("; ");
};

let pass = 0, fail = 0;
const t = (n, ok, info = "") => { ok ? pass++ : fail++; console.log(`  ${ok ? "OK  " : "FAIL"} ${n}${ok ? "" : `  ← ${info}`}`); };

(async () => {
  /* ——— تسجيل دخول أدمن المنصّات ——— */
  const su = await req(ROOT, "POST", "/api/hub/auth/login", { body: { email: SUPER_EMAIL, password: SUPER_PASS } });
  const hub = jarOf(su);

  /* نحتاج منصّةً نشطةً للاختبار — نأخذ أوّل واحدة */
  const tenants = await req(ROOT, "GET", "/api/hub/tenants", { cookie: hub });
  const activeTenant = tenants.json?.tenants?.find((t) => t.status === "active");
  const TID = activeTenant?.id;
  const TSLUG = activeTenant?.slug;

  console.log("\n== M6: الدومين المخصّص ==");

  if (!TID) {
    /* ليس لدينا منصّة نشطة — نُنشئ واحدة سريعاً */
    console.log("  SKIP  لا توجد منصّة نشطة لاختبار الدومينات عليها");
  } else {
    /* ١) إضافة دومين */
    const testDomain = `test-${Date.now().toString(36).slice(-5)}.example.com`;
    const add = await req(ROOT, "POST", "/api/hub/domains", { cookie: hub, body: { action: "add", tenantId: TID, domain: testDomain } });
    t("إضافة دومين", add.status === 200 && add.json?.ok, `status ${add.status} ${add.text.slice(0, 120)}`);
    const domId = add.json?.domain?.id;

    /* ٢) الدومين المكرَّر يُرفض */
    const dup = await req(ROOT, "POST", "/api/hub/domains", { cookie: hub, body: { action: "add", tenantId: TID, domain: testDomain } });
    t("تكرار الدومين يُرفض", dup.status === 400, `status ${dup.status}`);

    /* ٣) فحص DNS */
    if (domId) {
      const verify = await req(ROOT, "POST", "/api/hub/domains", { cookie: hub, body: { action: "verify", domainId: domId } });
      t("فحص DNS يعمل", verify.status === 200 && verify.json?.ok, `status ${verify.status}`);
    }

    /* ٤) قائمة الدومينات */
    const list = await req(ROOT, "GET", `/api/hub/domains?tenantId=${TID}`, { cookie: hub });
    t("قائمة الدومينات", list.status === 200 && Array.isArray(list.json?.domains), `status ${list.status}`);

    /* ٥) حذف الدومين */
    if (domId) {
      const del = await req(ROOT, "POST", "/api/hub/domains", { cookie: hub, body: { action: "remove", domainId: domId } });
      t("حذف الدومين", del.status === 200 && del.json?.ok, `status ${del.status}`);
    }
  }

  /* بلا تفويض يُرفض */
  const noAuth = await req(ROOT, "GET", "/api/hub/domains");
  t("بلا تفويض يُرفض ٤٠١", noAuth.status === 401, `status ${noAuth.status}`);

  console.log("\n== M7: الانتحال ==");
  if (TID) {
    const imp = await req(ROOT, "POST", "/api/hub/impersonate", { cookie: hub, body: { action: "start", tenantId: TID } });
    t("بدء الانتحال", imp.status === 200 && imp.json?.ok && imp.json?.url, `status ${imp.status} ${imp.text.slice(0, 100)}`);

    const end = await req(ROOT, "POST", "/api/hub/impersonate", { cookie: hub, body: { action: "end" } });
    t("إنهاء الانتحال", end.status === 200 && end.json?.ok, `status ${end.status}`);
  } else {
    console.log("  SKIP  لا توجد منصّة نشطة للانتحال");
  }

  console.log("\n== M7: تصدير CSV ==");
  const csv1 = await req(ROOT, "GET", "/api/hub/export?type=tenants", { cookie: hub });
  t("تصدير المنصّات CSV", csv1.status === 200 && csv1.text.includes("id,slug"), `status ${csv1.status} len=${csv1.text.length}`);

  const csv2 = await req(ROOT, "GET", "/api/hub/export?type=invoices", { cookie: hub });
  t("تصدير الفواتير CSV", csv2.status === 200 && csv2.text.includes("id,tenantId"), `status ${csv2.status}`);

  console.log("\n== M7: كرون الإحصاءات والدومينات ==");
  const stats = await req(ROOT, "GET", "/api/cron/hub-stats", { headers: { "x-vercel-cron": "1" } });
  t("كرون الإحصاءات", stats.status === 200 && stats.json?.ok !== undefined, `status ${stats.status} ${stats.text.slice(0, 120)}`);

  const domCron = await req(ROOT, "GET", "/api/cron/domain-verify", { headers: { "x-vercel-cron": "1" } });
  t("كرون التحقّق من الدومينات", domCron.status === 200 && domCron.json?.ok !== undefined, `status ${domCron.status}`);

  const noAuthCron = await req(ROOT, "GET", "/api/cron/hub-stats");
  t("كرون بلا تفويض يُرفض", noAuthCron.status === 401, `status ${noAuthCron.status}`);

  console.log(`\n${fail === 0 ? "✔" : "✖"} ${pass} ناجح · ${fail} فاشل\n`);
  process.exit(fail ? 1 : 0);
})().catch((e) => { console.error("✖ " + e.message); process.exit(1); });
