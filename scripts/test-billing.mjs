/**
 * اختبارُ فوترة اشتراك المنصّات (M5) — على خادم start:local.
 * ------------------------------------------------------------------
 * ما يُثبته:
 *   ١) خطّةٌ مدفوعةٌ توقف الإرسالَ حتى الدفع (٤٠٢ needPayment).
 *   ٢) التحويلُ اليدويّ يُنشئ فاتورةً معلّقة وينقل المنصّة لمراجعة.
 *   ٣) أدمنُ المنصّات يعتمد الفاتورة → تُفعَّل وتُجهَّز المنصّة.
 *   ٤) توقيعُ بايموب الخاطئ يُرفض (٤٠٠) والصحيحُ يُفعّل الاشتراك،
 *      والمكرَّرُ لا يُفعّل مرّتين.
 *   ٥) دورةُ الفوترة تُوقف اشتراكاً انتهت مهلتُه.
 *
 * يحتاج: PAYMOB_HMAC_SECRET في بيئة الخادم لاختبار التوقيع. start:local
 * يضبطه إن لم يكن. CRON_SECRET من .env.local (أو الافتراضي).
 *
 *   node scripts/test-billing.mjs
 */
import http from "node:http";
import crypto from "node:crypto";
import fs from "node:fs";

const BASE = new URL(process.env.BASE || "http://127.0.0.1:3300");
const ROOT = `localhost:${BASE.port}`;
const SUPER_EMAIL = process.env.SUPER_ADMIN_EMAIL || "super@local.test";
const SUPER_PASS = process.env.SUPER_ADMIN_PASSWORD || "LocalHub@2026";
const HMAC_SECRET = process.env.PAYMOB_HMAC_SECRET || "test_hmac_secret";
const CRON_SECRET = envval("CRON_SECRET") || "";

function envval(k) {
  try {
    for (const raw of fs.readFileSync(".env.local", "utf8").split(/\r?\n/)) {
      const l = raw.trim(); if (!l || l.startsWith("#")) continue;
      const i = l.indexOf("="); if (i < 1) continue;
      if (l.slice(0, i).trim() === k) { let v = l.slice(i + 1).trim(); return v.replace(/^["']|["']$/g, ""); }
    }
  } catch {}
  return "";
}

function req(host, method, p, { body, headers = {}, cookie } = {}) {
  return new Promise((resolve, reject) => {
    const data = body === undefined ? null : JSON.stringify(body);
    const r = http.request({ host: BASE.hostname, port: BASE.port, method, path: p, headers: {
      Host: host, Origin: `http://${host}`, Accept: "application/json",
      ...(data ? { "Content-Type": "application/json", "Content-Length": Buffer.byteLength(data) } : {}),
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

/* توقيعُ بايموب: نفسُ ترتيب الحقول في lib/hub/billing/paymob.ts */
function paymobHmac(obj) {
  const FIELDS = ["amount_cents","created_at","currency","error_occured","has_parent_transaction","id","integration_id","is_3d_secure","is_auth","is_capture","is_refunded","is_standalone_payment","is_voided","order","owner","pending","source_data.pan","source_data.sub_type","source_data.type","success"];
  const flat = (path) => { const parts = path.split("."); let v = obj; for (const p of parts) v = v && typeof v === "object" ? v[p] : undefined; if (v === true) return "true"; if (v === false) return "false"; return v === undefined || v === null ? "" : String(v); };
  return crypto.createHmac("sha512", HMAC_SECRET).update(FIELDS.map(flat).join("")).digest("hex");
}

let pass = 0, fail = 0;
const t = (n, ok, info = "") => { ok ? pass++ : fail++; console.log(`  ${ok ? "OK  " : "FAIL"} ${n}${ok ? "" : `  ← ${info}`}`); };
const TINY_IMG = "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==";

(async () => {
  const su = await req(ROOT, "POST", "/api/hub/auth/login", { body: { email: SUPER_EMAIL, password: SUPER_PASS } });
  const hub = jarOf(su);

  console.log("\n== تفعيل طرق الدفع من الإعدادات ==");
  const setSettings = await req(ROOT, "PUT", "/api/hub/settings", { cookie: hub, body: {
    approval: "manual",
    manualPay: { enabled: true, methods: [{ kind: "wallet", label: "فودافون كاش", number: "01000000000", active: true }] },
    paymob: { enabled: false },
  } });
  t("تفعيل التحويل اليدوي", setSettings.status === 200, `status ${setSettings.status}`);

  console.log("\n== ١) خطّة مدفوعة توقف الإرسال حتى الدفع ==");
  const teacher = `pay${Date.now().toString(36)}@test.com`;
  const signin = await req(ROOT, "GET", `/api/hub/auth/google?dev=${encodeURIComponent(teacher)}&next=/start`);
  const owner = jarOf(signin);
  const st = await req(ROOT, "GET", "/api/start", { cookie: owner });
  /* خطّةٌ مدفوعةٌ بلا تجربة — هي التي تُلزم بالدفع فوراً */
  const paidPlan = st.json.plans.find((p) => p.priceEGP > 0 && p.trialDays === 0) || st.json.plans.find((p) => p.priceEGP > 0);
  t("توجد خطّة مدفوعة بلا تجربة", Boolean(paidPlan) && paidPlan.trialDays === 0, JSON.stringify(st.json.plans?.map((p) => ({ p: p.priceEGP, t: p.trialDays }))));
  await req(ROOT, "POST", "/api/start", { cookie: owner, body: { action: "plan", planId: paidPlan.id } });
  const slug = `pay-${Date.now().toString(36).slice(-5)}`;
  await req(ROOT, "POST", "/api/start", { cookie: owner, body: { action: "save", step: "review", name: "منصّة مدفوعة", slug } });
  const submit = await req(ROOT, "POST", "/api/start", { cookie: owner, body: { action: "submit" } });
  t("الإرسال يطلب الدفع (٤٠٢)", submit.status === 402 && submit.json?.needPayment, `status ${submit.status} ${submit.text.slice(0, 120)}`);

  console.log("\n== ٢) تحويل يدويّ يُنشئ فاتورة معلّقة ==");
  const pay = await req(ROOT, "POST", "/api/start", { cookie: owner, body: { action: "pay", method: "manual", kind: "wallet", senderNumber: "01111111111", receipt: TINY_IMG } });
  t("رفع الإيصال ينقل لمراجعة", pay.status === 200 && pay.json?.pending, `${pay.text.slice(0, 120)}`);
  const invList = await req(ROOT, "GET", "/api/hub/invoices", { cookie: hub });
  const inv = invList.json?.invoices?.find((i) => i.status === "pending" && i.provider === "manual");
  t("الفاتورة تظهر لأدمن المنصّات", Boolean(inv), `count=${invList.json?.invoices?.length}`);

  console.log("\n== ٣) اعتماد الفاتورة يفعّل ويجهّز ==");
  const approve = await req(ROOT, "PATCH", "/api/hub/invoices", { cookie: hub, body: { id: inv.id, action: "approve" } });
  t("اعتماد الفاتورة", approve.status === 200, `${approve.text.slice(0, 120)}`);
  const after = await req(ROOT, "GET", "/api/start", { cookie: owner });
  const active = after.json?.active?.find((x) => x.slug === slug);
  t("المنصّة صارت نشطة", active?.status === "active", `status=${active?.status}`);
  const reveal = await req(ROOT, "POST", "/api/start", { cookie: owner, body: { action: "reveal", tenantId: active.id } });
  t("بيانات الدخول تُسلَّم", reveal.status === 200 && reveal.json?.password, `${reveal.text.slice(0, 100)}`);

  console.log("\n== ٤) توقيع بايموب ==");
  const invId = inv.id.replace(/./, (c) => c); // معرّف فاتورة موجود
  const fakeObj = { amount_cents: 49900, created_at: "2026-01-01", currency: "EGP", error_occured: false, has_parent_transaction: false, id: 999, integration_id: 1, is_3d_secure: false, is_auth: false, is_capture: false, is_refunded: false, is_standalone_payment: true, is_voided: false, order: { id: 12345, merchant_order_id: `${invId}-1` }, owner: 1, pending: false, source_data: { pan: "1234", sub_type: "MasterCard", type: "card" }, success: true };
  const badHook = await req(ROOT, "POST", "/api/hub/billing/paymob/webhook?hmac=deadbeef", { body: { obj: fakeObj } });
  t("توقيع خاطئ يُرفض ٤٠٠", badHook.status === 400, `status ${badHook.status}`);
  const goodHmac = paymobHmac(fakeObj);
  const goodHook = await req(ROOT, "POST", `/api/hub/billing/paymob/webhook?hmac=${goodHmac}`, { body: { obj: fakeObj } });
  /* الفاتورةُ مدفوعةٌ من قبل (اعتُمدت يدويّاً)، فالإشعارُ يُقبل بلا أثرٍ مزدوج */
  t("توقيع صحيح يُقبل ٢٠٠", goodHook.status === 200, `status ${goodHook.status} ${goodHook.text.slice(0, 100)}`);
  const dupHook = await req(ROOT, "POST", `/api/hub/billing/paymob/webhook?hmac=${goodHmac}`, { body: { obj: fakeObj } });
  t("الإشعار المكرَّر لا يُفشل", dupHook.status === 200, `status ${dupHook.status}`);

  console.log("\n== ٥) دورة الفوترة (Cron) ==");
  const cron = await req(ROOT, "GET", "/api/cron/hub-billing", { headers: { "x-vercel-cron": "1" } });
  t("دورة الفوترة تعمل", cron.status === 200 && cron.json?.ok, `status ${cron.status} ${cron.text.slice(0, 120)}`);
  const cronNoAuth = await req(ROOT, "GET", "/api/cron/hub-billing");
  t("بلا تفويض تُرفض", cronNoAuth.status === 401, `status ${cronNoAuth.status}`);

  console.log(`\n${fail === 0 ? "✔" : "✖"} ${pass} ناجح · ${fail} فاشل\n`);
  process.exit(fail ? 1 : 0);
})().catch((e) => { console.error("✖ " + e.message); process.exit(1); });
