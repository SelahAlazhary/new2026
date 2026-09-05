/**
 * ترحيلُ المنصّة الواحدة إلى مستأجرٍ أوّل — قابلٌ للإعادة بلا فقد.
 * ------------------------------------------------------------------
 * ينقل (ينسخ، ولا يحذف) ما كان في الجذر القديم إلى جذر المستأجر:
 *   platform/            → tenants/{id}/platform
 *   backups/             → tenants/{id}/backups
 *   activity/            → tenants/{id}/activity
 *   claims/ · decisions/ → tenants/{id}/claims · decisions
 * ويسجّل المنصّةَ في الـHub:
 *   hub/tenants/{id} + hub/slugs/{slug}
 * ومحلّياً (بلا فايربيز): data/db.json → data/tenants/{id}/db.json + data/hub.json
 *
 * **قابلُ الإعادة:** ما وُجد في الوجهة لا يُكتب فوقه إلّا بـ--force.
 * **لا يحذف شيئاً:** الجذرُ القديم يبقى حتى تتأكّد أنّ كلّ شيءٍ يعمل،
 * ثمّ تحذفه يدوياً من لوحة فايربيز (أو بـ--drop-legacy بعد التأكّد).
 *
 * التشغيل:
 *   node scripts/migrate-to-tenants.mjs                 # المعرّف من DEFAULT_TENANT_ID أو "default"
 *   node scripts/migrate-to-tenants.mjs --id emz --slug emz --name "منصّة إيمان زيدان"
 *   node scripts/migrate-to-tenants.mjs --dry           # يعرض ما سيفعله فقط
 */
import fs from "node:fs";
import path from "node:path";
import crypto from "node:crypto";

/* ---------- المعاملات ---------- */
const args = process.argv.slice(2);
const flag = (n) => args.includes(`--${n}`);
const opt = (n, d) => { const i = args.indexOf(`--${n}`); return i >= 0 && args[i + 1] && !args[i + 1].startsWith("--") ? args[i + 1] : d; };

const env = readEnvLocal();
const ID = (opt("id", env.DEFAULT_TENANT_ID || "default")).toLowerCase();
const SLUG = (opt("slug", env.DEFAULT_TENANT_SLUG || ID)).toLowerCase();
const NAME = opt("name", "");
const DRY = flag("dry");
const FORCE = flag("force");
const DROP = flag("drop-legacy");

if (!/^[a-z0-9_-]{1,64}$/.test(ID)) die(`معرّف غير صالح: ${ID}`);
if (!/^[a-z0-9](?:[a-z0-9-]{1,38}[a-z0-9])?$/.test(SLUG)) die(`slug غير صالح: ${SLUG}`);

const now = new Date().toISOString();
const log = (m) => console.log((DRY ? "[تجربة] " : "") + m);

/* ---------- .env.local ---------- */
function readEnvLocal() {
  const out = {};
  if (!fs.existsSync(".env.local")) return out;
  for (const raw of fs.readFileSync(".env.local", "utf8").split(/\r?\n/)) {
    const line = raw.trim();
    if (!line || line.startsWith("#")) continue;
    const eq = line.indexOf("=");
    if (eq < 1) continue;
    const key = line.slice(0, eq).trim();
    let val = line.slice(eq + 1).trim();
    if (val.length > 1 && ((val[0] === '"' && val.endsWith('"')) || (val[0] === "'" && val.endsWith("'")))) val = val.slice(1, -1);
    out[key] = val;
  }
  return out;
}
function die(m) { console.error("✖ " + m); process.exit(1); }

/* ---------- فايربيز (REST بحساب الخدمة) ---------- */
const DB_URL = (env.FIREBASE_DATABASE_URL || "").replace(/\/$/, "");
const CLIENT_EMAIL = env.FIREBASE_CLIENT_EMAIL || "";
const PRIVATE_KEY = (env.FIREBASE_PRIVATE_KEY || "").replace(/\\n/g, "\n");
const SECRET = env.FIREBASE_DATABASE_SECRET || "";

let token = null;
async function accessToken() {
  if (token) return token;
  if (!CLIENT_EMAIL || !PRIVATE_KEY) return null;
  const b64 = (s) => Buffer.from(s).toString("base64url");
  const iat = Math.floor(Date.now() / 1000) - 30;
  const header = b64(JSON.stringify({ alg: "RS256", typ: "JWT" }));
  const claim = b64(JSON.stringify({
    iss: CLIENT_EMAIL,
    scope: "https://www.googleapis.com/auth/userinfo.email https://www.googleapis.com/auth/firebase.database",
    aud: "https://oauth2.googleapis.com/token", iat, exp: iat + 3600,
  }));
  const sig = crypto.createSign("RSA-SHA256").update(`${header}.${claim}`).sign(PRIVATE_KEY).toString("base64url");
  const res = await fetch("https://oauth2.googleapis.com/token", {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({ grant_type: "urn:ietf:params:oauth:grant-type:jwt-bearer", assertion: `${header}.${claim}.${sig}` }),
  });
  const data = await res.json();
  if (!data.access_token) die("تعذّر الحصول على رمز فايربيز: " + (data.error_description || data.error));
  token = data.access_token;
  return token;
}
async function url(p, q = "") {
  const t = await accessToken();
  const auth = t ? `access_token=${t}` : SECRET ? `auth=${encodeURIComponent(SECRET)}` : "";
  const qs = [auth, q].filter(Boolean).join("&");
  return `${DB_URL}/${p}.json${qs ? `?${qs}` : ""}`;
}
/* القراءةُ والكتابةُ خامٌ: المفاتيحُ المرمَّزة تُنقل كما هي بلا فكّ ولا إعادة ترميز */
async function get(p, shallow = false) {
  const res = await fetch(await url(p, shallow ? "shallow=true" : ""));
  if (!res.ok) die(`فشل القراءة ${p} (${res.status})`);
  return res.json();
}
async function put(p, v) {
  if (DRY) return;
  const res = await fetch(await url(p), { method: "PUT", headers: { "Content-Type": "application/json" }, body: JSON.stringify(v) });
  if (!res.ok) die(`فشل الكتابة ${p} (${res.status}) ${await res.text().catch(() => "")}`);
}
async function copyNode(from, to) {
  const exists = await get(to, true);
  if (exists !== null && !FORCE) { log(`  = ${to} موجود — تُخطّي (استعمل --force للكتابة فوقه)`); return false; }
  const data = await get(from);
  if (data === null) { log(`  · ${from} فارغ — لا شيء يُنقل`); return false; }
  const size = JSON.stringify(data).length;
  log(`  → ${from} ⇒ ${to} (${(size / 1024).toFixed(1)} KB)`);
  await put(to, data);
  return true;
}

function tenantRecord(name) {
  return {
    id: ID, slug: SLUG, name: name || SLUG, description: "",
    ownerId: "", status: "active", createdAt: now, activatedAt: now,
    onboardingStep: "done", brandPresetId: "midad",
    brandColors: { primary: "#233b8b", gold: "#c99a3b", paper: "#fbf9f5" },
    hiddenSections: [], features: {},
    limits: { maxStudents: null, maxSubjects: null, maxAdmins: null, maxStorageMB: null, customDomain: true },
    adminEmail: env.ADMIN_EMAIL || "",
  };
}

/* ---------- التنفيذ ---------- */
(async () => {
  console.log(`\nترحيلُ المنصّة إلى المستأجر «${ID}» (slug: ${SLUG})\n`);

  if (DB_URL) {
    console.log("● فايربيز: " + DB_URL);
    const platform = await get("platform", true);
    if (platform === null) log("  · لا يوجد جذر platform قديم — قد تكون القاعدة جديدة أو مرحَّلة");
    else await copyNode("platform", `tenants/${ID}/platform`);
    for (const n of ["backups", "activity", "claims", "decisions"]) {
      if ((await get(n, true)) !== null) await copyNode(n, `tenants/${ID}/${n}`);
    }

    const existing = await get(`hub/tenants/${ID}`);
    if (existing && !FORCE) {
      log(`  = hub/tenants/${ID} مسجَّل — تُخطّي`);
    } else {
      const brand = platform === null ? "" : (await get(`tenants/${ID}/platform/content/brand`).catch(() => "")) || "";
      const rec = tenantRecord(NAME || (typeof brand === "string" ? brand : ""));
      log(`  → hub/tenants/${ID} ← «${rec.name}»`);
      await put(`hub/tenants/${ID}`, rec);
    }
    log(`  → hub/slugs/${SLUG} = ${ID}`);
    await put(`hub/slugs/${SLUG}`, ID);

    if (DROP) {
      const ok = await get(`tenants/${ID}/platform/users`, true);
      if (ok === null) die("لن أحذف الجذر القديم: جذر المستأجر لا يحمل مستخدمين بعد.");
      log("  ✖ حذف الجذر القديم platform/ و backups/ و activity/ و claims/ و decisions/");
      for (const n of ["platform", "backups", "activity", "claims", "decisions"]) await put(n, null);
    }
  } else {
    console.log("● بلا فايربيز — الترحيل المحلّي فقط");
  }

  /* المحلّي */
  const legacy = path.join("data", "db.json");
  const target = path.join("data", "tenants", ID, "db.json");
  if (fs.existsSync(legacy)) {
    if (fs.existsSync(target) && !FORCE) log(`  = ${target} موجود — تُخطّي`);
    else {
      log(`  → ${legacy} ⇒ ${target}`);
      if (!DRY) { fs.mkdirSync(path.dirname(target), { recursive: true }); fs.copyFileSync(legacy, target); }
    }
    const hubFile = path.join("data", "hub.json");
    const hub = fs.existsSync(hubFile) ? JSON.parse(fs.readFileSync(hubFile, "utf8")) : { tenants: {}, slugs: {} };
    if (!hub.tenants[ID] || FORCE) {
      let brand = "";
      try { brand = JSON.parse(fs.readFileSync(legacy, "utf8")).content?.brand || ""; } catch {}
      hub.tenants[ID] = tenantRecord(NAME || brand);
    }
    hub.slugs[SLUG] = ID;
    log(`  → ${hubFile}`);
    if (!DRY) fs.writeFileSync(hubFile, JSON.stringify(hub, null, 2), "utf8");
  } else {
    log("  · لا يوجد data/db.json محلّي");
  }

  console.log(`\n✔ تمّ. أضِف إلى البيئة: DEFAULT_TENANT_ID=${ID}${SLUG !== ID ? ` و DEFAULT_TENANT_SLUG=${SLUG}` : ""}\n`);
})().catch((e) => die(e.message));
