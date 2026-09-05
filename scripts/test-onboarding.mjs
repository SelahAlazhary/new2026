/**
 * اختبارُ رحلة إنشاء المنصّة — من الجذر (وضع الـHub).
 * ------------------------------------------------------------------
 * يفترض خادماً من `npm run start:local` (ROOT_HOST_MODE=hub، جوجل غير
 * مهيّأ فيعمل بابُ الدخول التطويريّ).
 *
 * ما يُثبته:
 *   ١) الجذرُ موقعُ إنشاء المنصّات (لا منصّةَ طالب)، والطالبُ لا يبلغه:
 *      /admin و/student و/login على الجذر تُحوَّل إلى /start.
 *   ٢) دخولُ المدرّس (تطويريّاً) ثم اختيارُ خطّة يُنشئ مسودّة.
 *   ٣) حفظُ الاسم والرابط والتصميم، ثم الإرسال للمراجعة.
 *   ٤) أدمنُ المنصّات يوافق → تُجهَّز المنصّة وتُفعَّل.
 *   ٥) المدرّسُ يكشف بيانات الدخول مرّةً واحدة، ويدخل لوحتَه بها فعلاً
 *      على نطاق منصّته الفرعيّ.
 *   ٦) والطالبُ يفتح المنصّةَ الجديدة على نطاقها.
 *
 *   node scripts/test-onboarding.mjs
 */
import http from "node:http";

const BASE = new URL(process.env.BASE || "http://127.0.0.1:3300");
const ROOT = `localhost:${BASE.port}`;
const SUPER_EMAIL = process.env.SUPER_ADMIN_EMAIL || "super@local.test";
const SUPER_PASS = process.env.SUPER_ADMIN_PASSWORD || "LocalHub@2026";
const TEACHER = `teacher${Date.now().toString(36)}@test.com`;

function req(host, method, p, { body, headers = {}, cookie, redirect = "manual" } = {}) {
  return new Promise((resolve, reject) => {
    const data = body === undefined ? null : JSON.stringify(body);
    const r = http.request({
      host: BASE.hostname, port: BASE.port, method, path: p,
      headers: {
        Host: host, Origin: `http://${host}`, Accept: "application/json",
        ...(data ? { "Content-Type": "application/json", "Content-Length": Buffer.byteLength(data) } : {}),
        ...(cookie ? { Cookie: cookie } : {}), ...headers,
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
const jarOf = (res, prev = "") => {
  const set = (res.headers["set-cookie"] ?? []).map((c) => c.split(";")[0]);
  const map = new Map(prev.split("; ").filter(Boolean).map((c) => [c.split("=")[0], c]));
  for (const c of set) map.set(c.split("=")[0], c);
  return [...map.values()].join("; ");
};

let pass = 0, fail = 0;
const t = (name, ok, info = "") => { ok ? pass++ : fail++; console.log(`  ${ok ? "OK  " : "FAIL"} ${name}${ok ? "" : `  ← ${info}`}`); };

(async () => {
  console.log("\n== ١) الجذرُ موقعُ إنشاء المنصّات، والطالبُ لا يبلغه ==");
  const home = await req(ROOT, "GET", "/");
  t("الجذر يعرض «أنشئ منصّتك»", home.status === 200 && home.text.includes("أنشئ منصّتك"), `status ${home.status}`);
  for (const p of ["/admin", "/student", "/login"]) {
    const r = await req(ROOT, "GET", p);
    const toStart = (r.headers.location ?? "").includes("/start");
    t(`${p} على الجذر يُحوَّل إلى /start`, (r.status === 307 || r.status === 308) && toStart, `status ${r.status} → ${r.headers.location}`);
  }

  console.log("\n== ٢) دخول المدرّس واختيار خطّة ==");
  const signin = await req(ROOT, "GET", `/api/hub/auth/google?dev=${encodeURIComponent(TEACHER)}&next=/start`);
  const owner = jarOf(signin);
  t("دخول تطويريّ للمدرّس", (signin.status === 307 || signin.status === 302) && owner.includes("hub_owner"), `status ${signin.status}`);

  const st0 = await req(ROOT, "GET", "/api/start", { cookie: owner });
  t("حالة البداية: مسجَّل بلا مسودّة", st0.json?.owner?.email === TEACHER && !st0.json?.draft, JSON.stringify(st0.json?.owner));
  const planId = st0.json?.plans?.[0]?.id;
  const pick = await req(ROOT, "POST", "/api/start", { cookie: owner, body: { action: "plan", planId } });
  t("اختيار خطّة يُنشئ مسودّة", pick.status === 200 && pick.json?.tenant?.status === "onboarding", `status ${pick.status} ${pick.text.slice(0, 120)}`);
  const tenantId = pick.json?.tenant?.id;

  console.log("\n== ٣) حفظ البيانات والإرسال ==");
  const slug = `acad-${Date.now().toString(36).slice(-5)}`;
  const slugCheck = await req(ROOT, "POST", "/api/start", { cookie: owner, body: { action: "slug-check", slug } });
  t("فحص توفّر الرابط", slugCheck.json?.ok === true, JSON.stringify(slugCheck.json));
  const save1 = await req(ROOT, "POST", "/api/start", { cookie: owner, body: { action: "save", step: "logo", name: "أكاديمية النور", description: "الرياضيات للثانوية", slug } });
  t("حفظ الاسم والرابط", save1.status === 200 && save1.json?.tenant?.slug === slug, `${save1.text.slice(0, 120)}`);
  const save2 = await req(ROOT, "POST", "/api/start", { cookie: owner, body: { action: "save", step: "review", presetId: "royal", colors: { primary: "#7a1fa2", gold: "#e0b64a", paper: "#faf6ff" } } });
  t("حفظ التصميم", save2.status === 200 && save2.json?.tenant?.brandPresetId === "royal", `${save2.text.slice(0, 120)}`);
  const submit = await req(ROOT, "POST", "/api/start", { cookie: owner, body: { action: "submit" } });
  t("الإرسال للمراجعة", submit.status === 200 && (submit.json?.pending || submit.json?.provisioned), `${submit.text.slice(0, 150)}`);

  console.log("\n== ٤) موافقة أدمن المنصّات ==");
  const su = await req(ROOT, "POST", "/api/hub/auth/login", { body: { email: SUPER_EMAIL, password: SUPER_PASS } });
  const hub = jarOf(su);
  t("دخول أدمن المنصّات", su.status === 200, `status ${su.status}`);
  let provisioned = submit.json?.provisioned;
  if (!provisioned) {
    const approve = await req(ROOT, "PATCH", "/api/hub/tenants", { cookie: hub, body: { id: tenantId, action: "approve" } });
    t("القبول والتفعيل", approve.status === 200 && approve.json?.tenant?.status === "active", `status ${approve.status} ${approve.text.slice(0, 150)}`);
  } else {
    t("فُعّلت تلقائياً", true);
  }

  console.log("\n== ٥) كشف بيانات الدخول والدخول بها ==");
  const reveal = await req(ROOT, "POST", "/api/start", { cookie: owner, body: { action: "reveal", tenantId } });
  t("كشف بيانات الدخول مرّة واحدة", reveal.status === 200 && reveal.json?.password && reveal.json?.adminEmail === TEACHER, `${reveal.text.slice(0, 150)}`);
  const password = reveal.json?.password;
  const studentUrl = reveal.json?.studentUrl ?? "";
  const tenantHost = studentUrl.replace(/^https?:\/\//, "").replace(/\/.*$/, "").replace(/:\d+$/, "") + `:${BASE.port}`;

  const reveal2 = await req(ROOT, "POST", "/api/start", { cookie: owner, body: { action: "reveal", tenantId } });
  t("كلمة المرور لا تُكشف مرّتين", reveal2.json?.password === null, `pw=${reveal2.json?.password}`);

  const adminLogin = await req(tenantHost, "POST", "/api/auth/login", { body: { username: TEACHER, password } });
  t("المدرّس يدخل لوحته بالبيانات المُسلَّمة", adminLogin.status === 200 && adminLogin.json?.role === "admin", `status ${adminLogin.status} ${adminLogin.text.slice(0, 120)}`);

  console.log("\n== ٦) المنصّة الجديدة تعمل للطالب ==");
  const newHome = await req(tenantHost, "GET", "/");
  t("صفحة المنصّة الجديدة تُخدم", newHome.status === 200 && newHome.text.includes("أكاديمية النور"), `status ${newHome.status}`);
  const newContent = await req(tenantHost, "GET", "/api/content");
  t("محتوى المنصّة باسمها", newContent.status === 200 && newContent.json?.content?.brand === "أكاديمية النور", `brand=${newContent.json?.content?.brand}`);

  console.log(`\n${fail === 0 ? "✔" : "✖"} ${pass} ناجح · ${fail} فاشل\n`);
  process.exit(fail ? 1 : 0);
})().catch((e) => { console.error("✖ " + e.message); process.exit(1); });
