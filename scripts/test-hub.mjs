/**
 * اختبارُ لوحة المنصّات وفرضِها — يُشغَّل على خادمٍ محلّيٍّ قائم.
 * ------------------------------------------------------------------
 * يفترض خادماً من `npm run start:local` (بلا فايربيز، وبحساب منصّاتٍ
 * محلّيّ)، ومنصّةً ثانيةً «demo» مسجَّلة (`node scripts/test-tenancy.mjs --seed`).
 *
 * ما يُثبته:
 *   ١) لوحةُ المنصّات لا تُفتح بلا جلسة، ولا تُفتح من نطاق منصّة.
 *   ٢) الدخولُ يعمل، والخاطئُ يُردّ، والمسارات تُحمى.
 *   ٣) **إخفاءُ قسمٍ يُفرض في الخادم**: القائمةُ والمسارُ المباشرُ
 *      و`PUT /api/content` وحمولةُ المشرف — أربعتُها.
 *   ٤) **إطفاءُ ميزةٍ يُغلق مسارَها** للطالب وللمشرف معاً.
 *   ٥) **إيقافُ منصّةٍ**: تُقرأ ولا تُكتب، وطالبُها يرى صفحةَ توقّف،
 *      وصاحبُها يدخل لوحتَه.
 *   ٦) كلُّ ذلك يُدوَّن في سجلّ التدقيق.
 *   ٧) وتعود المنصّةُ كما كانت في آخر الاختبار.
 *
 *   node scripts/test-hub.mjs
 */
import http from "node:http";
import fs from "node:fs";

const BASE = new URL(process.env.BASE || "http://127.0.0.1:3300");
const TENANT_ID = process.env.DEFAULT_TENANT_ID || "default";
/* الجذرُ = لوحة المنصّات؛ والمنصّةُ الافتراضية على نطاقها الفرعيّ (وضع الـHub) */
const ROOT_HOST = `localhost:${BASE.port}`;
const DEF_SLUG = process.env.DEFAULT_TENANT_SLUG || TENANT_ID;
const TEN_HOST = `${DEF_SLUG}.localhost:${BASE.port}`;

const SUPER_EMAIL = process.env.SUPER_ADMIN_EMAIL || "super@local.test";
const SUPER_PASS = process.env.SUPER_ADMIN_PASSWORD || "LocalHub@2026";

function env() {
  const out = {};
  for (const raw of fs.readFileSync(".env.local", "utf8").split(/\r?\n/)) {
    const l = raw.trim(); if (!l || l.startsWith("#")) continue;
    const i = l.indexOf("="); if (i < 1) continue;
    let v = l.slice(i + 1).trim();
    if (v.length > 1 && ((v[0] === '"' && v.endsWith('"')) || (v[0] === "'" && v.endsWith("'")))) v = v.slice(1, -1);
    out[l.slice(0, i).trim()] = v;
  }
  return out;
}
const E = env();

function req(host, method, p, { body, headers = {}, cookie } = {}) {
  return new Promise((resolve, reject) => {
    const data = body === undefined ? null : JSON.stringify(body);
    const r = http.request({
      host: BASE.hostname, port: BASE.port, method, path: p,
      headers: {
        Host: host, Origin: `http://${host}`, Accept: "application/json",
        ...(data ? { "Content-Type": "application/json", "Content-Length": Buffer.byteLength(data) } : {}),
        ...(cookie ? { Cookie: cookie } : {}),
        ...headers,
      },
    }, (res) => {
      let buf = "";
      res.setEncoding("utf8");
      res.on("data", (c) => (buf += c));
      res.on("end", () => {
        let json = null; try { json = JSON.parse(buf); } catch {}
        resolve({ status: res.statusCode, headers: res.headers, text: buf, json });
      });
    });
    r.on("error", reject);
    if (data) r.write(data);
    r.end();
  });
}
const cookiesOf = (res) => (res.headers["set-cookie"] ?? []).map((c) => c.split(";")[0]).join("; ");

let pass = 0, fail = 0;
const t = (name, ok, info = "") => {
  ok ? pass++ : fail++;
  console.log(`  ${ok ? "OK  " : "FAIL"} ${name}${ok ? "" : `  ← ${info}`}`);
};

(async () => {
  console.log("\n== ١) البابُ مغلقٌ بلا جلسة ==");
  const anon = await req(ROOT_HOST, "GET", "/hub");
  t("/hub بلا جلسة يُحوَّل للدخول", anon.status === 307 || anon.status === 302, `status ${anon.status}`);
  const anonApi = await req(ROOT_HOST, "GET", "/api/hub/tenants");
  t("/api/hub/tenants بلا جلسة → ٤٠١", anonApi.status === 401, `status ${anonApi.status}`);
  const onTenant = await req(`demo.localhost:${BASE.port}`, "GET", "/hub");
  t("/hub من نطاق منصّة → ٤٠٤", onTenant.status === 404, `status ${onTenant.status}`);
  const loginOnTenant = await req(`demo.localhost:${BASE.port}`, "POST", "/api/hub/auth/login", { body: { email: SUPER_EMAIL, password: SUPER_PASS } });
  t("دخول الـHub من نطاق منصّة → ٤٠٤", loginOnTenant.status === 404, `status ${loginOnTenant.status}`);

  console.log("\n== ٢) الدخول ==");
  const bad = await req(ROOT_HOST, "POST", "/api/hub/auth/login", { body: { email: SUPER_EMAIL, password: "wrong-pass-000" } });
  t("كلمة مرور خاطئة → ٤٠١", bad.status === 401, `status ${bad.status}`);
  const trap = await req(ROOT_HOST, "POST", "/api/hub/auth/login", { body: { email: SUPER_EMAIL, password: SUPER_PASS, website: "bot" } });
  t("فخّ الآليّات يُردّ", trap.status === 401, `status ${trap.status}`);
  const login = await req(ROOT_HOST, "POST", "/api/hub/auth/login", { body: { email: SUPER_EMAIL, password: SUPER_PASS } });
  t("دخول صحيح", login.status === 200 && login.json?.ok, `status ${login.status} ${login.text.slice(0, 120)}`);
  const hub = cookiesOf(login);
  const list = await req(ROOT_HOST, "GET", "/api/hub/tenants", { cookie: hub });
  t("قائمة المنصّات تصل", list.status === 200 && Array.isArray(list.json?.tenants), `status ${list.status}`);

  /* جلسةُ مشرف المنصّة الافتراضية */
  const adminLogin = await req(TEN_HOST, "POST", "/api/auth/login", { body: { username: E.ADMIN_EMAIL, password: E.ADMIN_PASSWORD } });
  const admin = cookiesOf(adminLogin);
  t("دخول مشرف المنصّة", adminLogin.status === 200, `status ${adminLogin.status}`);

  console.log("\n== ٣) إخفاءُ قسم يُفرض في الخادم ==");
  const hide = await req(ROOT_HOST, "PATCH", "/api/hub/tenants", {
    cookie: hub, body: { id: TENANT_ID, action: "sections", hiddenSections: ["youtube"] },
  });
  t("إخفاء «قناة اليوتيوب»", hide.status === 200 && hide.json?.tenant?.hiddenSections?.includes("youtube"), `status ${hide.status} ${hide.text.slice(0, 120)}`);

  const page = await req(TEN_HOST, "GET", "/admin/youtube", { cookie: admin });
  const toHidden = (page.headers.location ?? "").includes("hidden=1");
  t("مسار القسم المخفيّ يُعاد", (page.status === 307 || page.status === 302) && toHidden, `status ${page.status} → ${page.headers.location}`);

  const putHidden = await req(TEN_HOST, "PUT", "/api/content", { cookie: admin, body: { youtube: { channelId: "hack" } } });
  t("تعديل بيانات القسم المخفيّ → ٤٠٣", putHidden.status === 403 && putHidden.json?.code === "section_hidden", `status ${putHidden.status} ${putHidden.text.slice(0, 120)}`);

  const apiHidden = await req(TEN_HOST, "GET", "/api/youtube", { cookie: admin });
  t("مسار القسم المخفيّ في API → ٤٠٣", apiHidden.status === 403, `status ${apiHidden.status}`);

  const payload = await req(TEN_HOST, "GET", "/api/content", { cookie: admin });
  t("حمولة المشرف بلا بيانات القسم المخفيّ", payload.status === 200 && !payload.json?.youtube, `youtube=${JSON.stringify(payload.json?.youtube)?.slice(0, 60)}`);

  const navGone = await req(TEN_HOST, "GET", "/admin", { cookie: admin });
  t("رابط القسم يختفي من القائمة", navGone.status === 200 && !navGone.text.includes("/admin/youtube"), "الرابط ما زال في الصفحة");

  console.log("\n== ٤) إطفاءُ ميزة يُغلق مسارها ==");
  const offExams = await req(ROOT_HOST, "PATCH", "/api/hub/tenants", {
    cookie: hub, body: { id: TENANT_ID, action: "features", features: { exams: false } },
  });
  t("إطفاء «الاختبارات»", offExams.status === 200, `status ${offExams.status}`);
  const examApi = await req(TEN_HOST, "POST", "/api/exam", { cookie: admin, body: {} });
  t("مسار الميزة المطفأة → ٤٠٣", examApi.status === 403 && examApi.json?.code === "feature_off", `status ${examApi.status} ${examApi.text.slice(0, 120)}`);

  console.log("\n== ٥) إيقافُ منصّة ==");
  const suspend = await req(ROOT_HOST, "PATCH", "/api/hub/tenants", {
    cookie: hub, body: { id: TENANT_ID, action: "status", status: "suspended", reason: "اختبار آليّ" },
  });
  t("الإيقاف", suspend.status === 200 && suspend.json?.tenant?.status === "suspended", `status ${suspend.status}`);

  const guest = await req(TEN_HOST, "GET", "/");
  t("الزائر يرى صفحة توقّف", guest.status === 200 && guest.text.includes("متوقّفة مؤقّتاً"), "لا لافتة توقّف");
  const readWhilePaused = await req(TEN_HOST, "GET", "/api/content", { cookie: admin });
  t("القراءة تعمل أثناء الإيقاف", readWhilePaused.status === 200, `status ${readWhilePaused.status}`);
  const writeWhilePaused = await req(TEN_HOST, "PUT", "/api/content", { cookie: admin, body: { content: { brand: "X" } } });
  t("الكتابة تُردّ ٤٠٢", writeWhilePaused.status === 402 && writeWhilePaused.json?.code === "tenant_paused", `status ${writeWhilePaused.status} ${writeWhilePaused.text.slice(0, 120)}`);
  const adminPanel = await req(TEN_HOST, "GET", "/admin", { cookie: admin });
  t("صاحب المنصّة يدخل لوحته", adminPanel.status === 200 && adminPanel.text.includes("موقوفة مؤقّتاً"), `status ${adminPanel.status}`);
  const loginStillWorks = await req(TEN_HOST, "POST", "/api/auth/login", { body: { username: E.ADMIN_EMAIL, password: E.ADMIN_PASSWORD } });
  t("الدخول يبقى مفتوحاً أثناء الإيقاف", loginStillWorks.status === 200, `status ${loginStillWorks.status}`);

  console.log("\n== ٦) السجلّ ==");
  const audit = await req(ROOT_HOST, "GET", "/hub/audit", { cookie: hub });
  t("سجلّ التدقيق يعرض ما جرى", audit.status === 200 && audit.text.includes("غيّر حالة منصّة"), `status ${audit.status}`);

  console.log("\n== ٧) الإعادة إلى ما كانت ==");
  const restore = [
    await req(ROOT_HOST, "PATCH", "/api/hub/tenants", { cookie: hub, body: { id: TENANT_ID, action: "status", status: "active" } }),
    await req(ROOT_HOST, "PATCH", "/api/hub/tenants", { cookie: hub, body: { id: TENANT_ID, action: "sections", hiddenSections: [] } }),
    await req(ROOT_HOST, "PATCH", "/api/hub/tenants", { cookie: hub, body: { id: TENANT_ID, action: "features", features: { exams: true } } }),
  ];
  t("أُعيدت الحالة والأقسام والميزات", restore.every((r) => r.status === 200), restore.map((r) => r.status).join(","));
  const back = await req(TEN_HOST, "GET", "/api/content", { cookie: admin });
  t("المنصّة تعمل كما كانت", back.status === 200, `status ${back.status}`);

  console.log(`\n${fail === 0 ? "✔" : "✖"} ${pass} ناجح · ${fail} فاشل\n`);
  process.exit(fail ? 1 : 0);
})().catch((e) => { console.error("✖ " + e.message); process.exit(1); });
