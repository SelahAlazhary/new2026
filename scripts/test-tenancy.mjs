/**
 * اختبارُ العزل بين المنصّات — يُشغَّل على خادمٍ محلّيٍّ قائم.
 * ------------------------------------------------------------------
 * يفترض:
 *   • خادماً على BASE (الافتراضي http://127.0.0.1:3300) بلا فايربيز
 *     (node scripts/start-local.mjs)، فالبياناتُ في data/.
 *   • منصّةً ثانية مسجَّلة في data/hub.json بالـslug «demo» (يُنشئها
 *     هذا الاختبار إن لم توجد — قبل تشغيل الخادم).
 *   • بيانات الأدمن من .env.local (ADMIN_EMAIL / ADMIN_PASSWORD).
 *
 * ما يُثبته:
 *   ١) الجذرُ يخدم المنصّةَ الافتراضية، والنطاقُ الفرعيُّ يخدم أختَها.
 *   ٢) ترويسةُ `x-tenant-slug` من العميل تُتجاهَل — لا انتحال.
 *   ٣) مضيفٌ أعمقُ من الفرعي ومنصّةٌ غيرُ مسجَّلة → ٤٠٤.
 *   ٤) مساراتُ الـHub على نطاق منصّة → ٤٠٤.
 *   ٥) كوكي جلسةِ منصّةٍ لا تفتح شيئاً على أختها.
 *   ٦) بياناتُ المنصّتين منفصلتان فعلاً (اسمُ العلامة يختلف بعد تعديله).
 *
 *   node scripts/test-tenancy.mjs
 */
import http from "node:http";
import fs from "node:fs";
import path from "node:path";

const BASE = new URL(process.env.BASE || "http://127.0.0.1:3300");
/*
  في وضع الـHub الجذرُ موقعُ إنشاء المنصّات لا منصّة، فالمنصّةُ الافتراضية
  تُخاطَب على نطاقها الفرعيّ. وبلا وضع الـHub يبقى الجذرُ يخدمها.
*/
const HUB_MODE = (process.env.ROOT_HOST_MODE || "hub") === "hub";
const DEF_SLUG = process.env.DEFAULT_TENANT_SLUG || process.env.DEFAULT_TENANT_ID || "default";
const ROOT_HOST = HUB_MODE ? `${DEF_SLUG}.localhost:${BASE.port}` : `localhost:${BASE.port}`;
const DEMO_HOST = `demo.localhost:${BASE.port}`;

/* ---------- تجهيز منصّة «demo» محلّياً (قبل الخادم) ---------- */
const hubFile = path.join("data", "hub.json");
if (process.argv.includes("--seed")) {
  const hub = fs.existsSync(hubFile) ? JSON.parse(fs.readFileSync(hubFile, "utf8")) : { tenants: {}, slugs: {} };
  hub.tenants.demo = {
    id: "demo", slug: "demo", name: "منصّة تجريبية", ownerId: "", status: "active",
    createdAt: new Date().toISOString(), onboardingStep: "done", brandPresetId: "midad",
    brandColors: { primary: "#233b8b", gold: "#c99a3b", paper: "#fbf9f5" },
    hiddenSections: [], features: {},
    limits: { maxStudents: null, maxSubjects: null, maxAdmins: null, maxStorageMB: null, customDomain: true },
    adminEmail: "",
  };
  hub.slugs.demo = "demo";
  fs.mkdirSync("data", { recursive: true });
  fs.writeFileSync(hubFile, JSON.stringify(hub, null, 2), "utf8");
  console.log("✔ data/hub.json: المنصّة demo مسجَّلة. شغّل الخادم ثم أعد الاختبار بلا --seed.");
  process.exit(0);
}

/* ---------- أدوات ---------- */
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
    const data = body ? JSON.stringify(body) : null;
    const r = http.request({
      host: BASE.hostname, port: BASE.port, method, path: p,
      headers: {
        Host: host,
        Origin: `http://${host}`,
        Accept: "application/json",
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

/* ---------- الاختبارات ---------- */
(async () => {
  console.log("\n== ١) الجذرُ والنطاقُ الفرعي يخدمان منصّتين ==");
  const rootHome = await req(ROOT_HOST, "GET", "/");
  t("الجذر يردّ ٢٠٠", rootHome.status === 200, `status ${rootHome.status}`);
  const demoHome = await req(DEMO_HOST, "GET", "/");
  t("demo.localhost يردّ ٢٠٠", demoHome.status === 200, `status ${demoHome.status}`);
  const rootC = await req(ROOT_HOST, "GET", "/api/content");
  const demoC = await req(DEMO_HOST, "GET", "/api/content");
  t("محتوى الجذر JSON", rootC.status === 200 && rootC.json?.content, `status ${rootC.status}`);
  t("محتوى demo JSON", demoC.status === 200 && demoC.json?.content, `status ${demoC.status}`);

  console.log("\n== ٢) ترويسةُ المستأجر من العميل تُتجاهَل ==");
  const spoof = await req(ROOT_HOST, "GET", "/api/content", { headers: { "x-tenant-slug": "demo", "x-host-kind": "tenant", "x-tenant-id": "demo" } });
  t("الجذر + ترويسة منتحلة = بيانات الجذر نفسها", spoof.status === 200 && spoof.json?.content?.brand === rootC.json?.content?.brand, `brand ${spoof.json?.content?.brand}`);

  console.log("\n== ٣) مضيفٌ لا منصّةَ له ==");
  const deep = await req(`a.b.localhost:${BASE.port}`, "GET", "/api/content");
  t("مستوًى أعمق → ٤٠٤", deep.status === 404, `status ${deep.status}`);
  const ghost = await req(`ghost.localhost:${BASE.port}`, "GET", "/api/content");
  t("منصّة غير مسجَّلة → ٤٠٤ JSON", ghost.status === 404 && ghost.json?.error, `status ${ghost.status}`);
  const ghostPage = await req(`ghost.localhost:${BASE.port}`, "GET", "/");
  t("صفحتها لا تحمل بيانات منصّة", ghostPage.status === 200 && !ghostPage.text.includes("initialDB") && ghostPage.text.includes("لا توجد منصّة"), `status ${ghostPage.status}`);

  console.log("\n== ٤) مساراتُ الـHub على نطاق منصّة ==");
  for (const p of ["/hub", "/start", "/api/hub/x"]) {
    const r = await req(DEMO_HOST, "GET", p);
    t(`${p} على demo → ٤٠٤`, r.status === 404, `status ${r.status}`);
  }

  console.log("\n== ٥) الجلسةُ مربوطةٌ بمنصّتها ==");
  const login = await req(ROOT_HOST, "POST", "/api/auth/login", { body: { username: E.ADMIN_EMAIL, password: E.ADMIN_PASSWORD } });
  t("دخول الأدمن على الجذر", login.status === 200 && login.json?.ok, `status ${login.status} ${login.text.slice(0, 120)}`);
  const jar = cookiesOf(login);
  const meRoot = await req(ROOT_HOST, "GET", "/api/auth/me", { cookie: jar });
  t("الجلسة تعمل على الجذر", meRoot.status === 200 && (meRoot.json?.session?.role === "admin" || meRoot.json?.user?.role === "admin" || meRoot.json?.role === "admin"), `status ${meRoot.status} ${meRoot.text.slice(0, 100)}`);
  const meDemo = await req(DEMO_HOST, "GET", "/api/auth/me", { cookie: jar });
  const demoSees = meDemo.status === 200 && (meDemo.json?.session?.role === "admin" || meDemo.json?.user?.role === "admin" || meDemo.json?.role === "admin");
  t("الكوكي نفسها على demo لا تفتح جلسة", !demoSees, `status ${meDemo.status} ${meDemo.text.slice(0, 100)}`);
  const adminDemo = await req(DEMO_HOST, "PUT", "/api/content", { cookie: jar, body: { content: { brand: "اختراق" } } });
  t("تعديل demo بكوكي الجذر مرفوض", adminDemo.status === 401 || adminDemo.status === 403, `status ${adminDemo.status}`);

  console.log("\n== ٦) البياناتُ منفصلة ==");
  const stamp = `منصّة-${Date.now().toString(36)}`;
  const put = await req(ROOT_HOST, "PUT", "/api/content", { cookie: jar, body: { content: { brand: stamp } } });
  t("تعديل علامة الجذر", put.status === 200, `status ${put.status} ${put.text.slice(0, 100)}`);
  const after = await req(DEMO_HOST, "GET", "/api/content");
  t("علامة demo لم تتغيّر", after.json?.content?.brand !== stamp, `brand ${after.json?.content?.brand}`);
  const rootAfter = await req(ROOT_HOST, "GET", "/api/content");
  t("علامة الجذر تغيّرت", rootAfter.json?.content?.brand === stamp, `brand ${rootAfter.json?.content?.brand}`);
  /* إعادة الاسم القديم */
  await req(ROOT_HOST, "PUT", "/api/content", { cookie: jar, body: { content: { brand: rootC.json.content.brand } } });

  console.log(`\n${fail === 0 ? "✔" : "✖"} ${pass} ناجح · ${fail} فاشل\n`);
  process.exit(fail ? 1 : 0);
})().catch((e) => { console.error("✖ " + e.message); process.exit(1); });
