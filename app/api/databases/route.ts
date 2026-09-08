import { NextResponse } from "next/server";
import { loadDB, getDB, saveDB, flushDB } from "@/lib/db/db";
import { getSession } from "@/lib/auth/session";
import { recordEvent } from "@/lib/auth/security";
import { can } from "@/lib/auth/perms";
import { fbProbe } from "@/lib/db/firebase";
import { envNode, orderNodes, nodeHealth, fillPercent, isFull, markUp, markDown, markOpen } from "@/lib/db/db-nodes";
import { parseFirebasePaste, candidateUrls, validDbUrl } from "@/lib/db/fb-config";
import type { DbNode } from "@/lib/utils/types";
import { tenantRoute } from "@/lib/hub/context";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

/**
 * إدارة سلسلة قواعد البيانات — للمالكة وحدها.
 * ------------------------------------------------------------------
 * هذا أخطر ما في اللوحة: خطأٌ هنا يفقد بياناتِ المنصّة كلَّها. ولذلك:
 *
 *   • **للمالكة وحدها** لا لكل من يملك صلاحية «النسخ الاحتياطي» —
 *     الاعتمادات هنا تفتح القاعدةَ كلَّها لا نسخةً منها.
 *   • **لا تُضاف قاعدة قبل أن تُختبر.** إضافةُ عنوانٍ لا يردّ تعني
 *     سلسلةً تنتظر قاعدةً ميّتة في كل عطل.
 *   • **الاعتمادات لا تعود للواجهة أبداً** — تُعرض حالتُها لا قيمتُها.
 *   • **القاعدةُ الجديدة تُملأ فور إضافتها** بنسخةٍ من الحالي، فلا تكون
 *     فرعاً فارغاً يُسلَّم إليه الموقعُ عند أوّل عطل.
 */

async function owner(path: string) {
  const session = await getSession();
  const me = getDB().users.find((u) => u.id === session?.uid);
  if (!session || session.role !== "admin" || !me?.owner) {
    await recordEvent("unauthorized_admin", path);
    return null;
  }
  return me;
}

/** ما يُعرض عن قاعدة — بلا اعتماد. */
function publicNode(n: DbNode) {
  const h = nodeHealth(n.url);
  return {
    id: n.id,
    name: n.name,
    /* العنوان يُقصّ: يكفي للتمييز ولا يكفي لاستعماله. */
    host: n.url.replace(/^https?:\/\//, "").split(".")[0],
    role: n.role,
    enabled: n.enabled,
    capacityMB: n.capacityMB ?? 0,
    hasCredential: Boolean(n.secret || (n.clientEmail && n.privateKey)),
    ok: h.ok,
    error: h.error,
    /* مفتوحةُ القواعد تعمل — وهذا وجهُ الخطر، فتُعرض تحذيراً لا عطلاً. */
    open: h.open,
    checkedAt: h.at || 0,
    bytes: h.bytes ?? 0,
    fill: fillPercent(n),
    full: isFull(n),
    fromEnv: n.id === "env",
  };
}

async function GET_impl() {
  await loadDB();
  if (!(await owner("/api/databases"))) {
    return NextResponse.json({ error: "غير مصرّح" }, { status: 401 });
  }
  const stored = getDB().integrations?.databases ?? [];
  return NextResponse.json({
    nodes: orderNodes(stored).map(publicNode),
    envConfigured: Boolean(envNode()),
  });
}

async function POST_impl(req: Request) {
  await loadDB();
  const me = await owner("/api/databases");
  if (!me) return NextResponse.json({ error: "غير مصرّح" }, { status: 401 });

  const body = await req.json().catch(() => ({}));
  const action = String(body.action ?? "add");
  const db = getDB();
  db.integrations = db.integrations ?? {};
  const list = [...(db.integrations.databases ?? [])];

  /* ---- قراءةُ ما لُصق واكتشافُ العنوان ---- */
  if (action === "detect") {
    const cfg = parseFirebasePaste(String(body.paste ?? ""));
    if (!cfg.projectId && !cfg.databaseURL) {
      return NextResponse.json(
        { error: "لم أجد إعداد فايربيز في ما لُصق — الصق مقطع <script> كما هو من كونسول فايربيز" },
        { status: 400 }
      );
    }

    const tried: { url: string; status: number; note: string }[] = [];
    const found = await findUrl(cfg, tried);

    return NextResponse.json({
      ok: Boolean(found),
      projectId: cfg.projectId ?? null,
      url: found?.url ?? null,
      writable: found?.probe.writable ?? null,
      openRules: found?.probe.openRules ?? false,
      hasCredential: Boolean(cfg.secret || (cfg.clientEmail && cfg.privateKey)),
      tried,
      error: found
        ? undefined
        : cfg.databaseURL
          ? "العنوان الموجود في الإعداد لا يردّ"
          : "لم أجد قاعدة وقتٍ حقيقي لهذا المشروع — أنشئها من كونسول فايربيز (Realtime Database) ثم أعد اللصق",
    });
  }

  /* ---- إضافة قاعدة ---- */
  if (action === "add") {
    /*
      مدخلان لا واحد: لصقُ الإعداد كما هو (الأيسر)، أو كتابةُ الحقول
      يدوياً. واللصقُ يغلب: من لصق إعداداً لا يُطالَب بعنوانٍ يجهله.
    */
    const pasted = body.paste ? parseFirebasePaste(String(body.paste)) : {};
    const secret = String(body.secret ?? "").trim() || pasted.secret;
    const clientEmail = String(body.clientEmail ?? "").trim() || pasted.clientEmail;
    const privateKey =
      String(body.privateKey ?? "").replace(/\\n/g, "\n").trim() || pasted.privateKey;

    let url = String(body.url ?? "").trim().replace(/\/$/, "");
    if (!url && (pasted.projectId || pasted.databaseURL)) {
      const found = await findUrl({ ...pasted, secret, clientEmail, privateKey }, []);
      if (!found) {
        return NextResponse.json(
          { error: "لم أجد قاعدةً تردّ لهذا المشروع — تأكّد من إنشاء Realtime Database" },
          { status: 400 }
        );
      }
      url = found.url;
    }

    if (!validDbUrl(url)) {
      return NextResponse.json({ error: "عنوان قاعدة غير صالح" }, { status: 400 });
    }
    if (list.some((n) => n.url.toLowerCase() === url.toLowerCase())) {
      return NextResponse.json({ error: "هذه القاعدة مضافة بالفعل" }, { status: 409 });
    }

    const node: DbNode = {
      id: `DB-${Date.now().toString(36)}`,
      name:
        String(body.name ?? "").trim().slice(0, 60) ||
        pasted.projectId ||
        "قاعدة فرعية",
      url,
      secret: secret || undefined,
      clientEmail: clientEmail || undefined,
      privateKey: privateKey || undefined,
      role: body.role === "primary" ? "primary" : "branch",
      enabled: true,
      order: list.length,
      capacityMB: Math.max(0, Number(body.capacityMB) || 0),
      addedAt: new Date().toISOString(),
    };

    /* تُختبر قبل أن تُضاف — سلسلةٌ فيها قاعدةٌ ميّتة تنتظر في كل عطل. */
    const cfg = { databaseURL: node.url, secret: node.secret, clientEmail: node.clientEmail, privateKey: node.privateKey };
    const probe = await fbProbe(cfg);
    if (!probe.ok || probe.writable === false) {
      markDown(node.url, probe.error ?? "لم تجتز الفحص");
      return NextResponse.json({ error: probe.error ?? "لم تجتز الفحص" }, { status: 400 });
    }
    markUp(node.url, probe.bytes);
    markOpen(node.url, probe.openRules);

    /* من كان رئيسياً يصير فرعاً — رئيسيةٌ واحدة لا أكثر. */
    if (node.role === "primary") for (const n of list) n.role = "branch";

    db.integrations.databases = [...list, node];
    saveDB(db);
    await flushDB();   // الحفظ نفسُه يملأ القاعدة الجديدة بنسخةٍ كاملة

    return NextResponse.json({
      ok: true,
      openRules: probe.openRules,
      nodes: orderNodes(db.integrations.databases).map(publicNode),
    });
  }

  /* ---- حذف ---- */
  if (action === "remove") {
    const id = String(body.id ?? "");
    if (id === "env") {
      return NextResponse.json({ error: "قاعدة الاستضافة تُغيَّر من متغيّرات البيئة لا من هنا" }, { status: 400 });
    }
    db.integrations.databases = list.filter((n) => n.id !== id);
    saveDB(db);
    await flushDB();
    return NextResponse.json({ ok: true, nodes: orderNodes(db.integrations.databases).map(publicNode) });
  }

  /* ---- ترقية إلى رئيسية ---- */
  if (action === "promote") {
    const id = String(body.id ?? "");
    const hit = list.find((n) => n.id === id);
    if (!hit) return NextResponse.json({ error: "القاعدة غير موجودة" }, { status: 404 });
    for (const n of list) n.role = "branch";
    hit.role = "primary";
    db.integrations.databases = list;
    saveDB(db);
    await flushDB();
    return NextResponse.json({ ok: true, nodes: orderNodes(list).map(publicNode) });
  }

  /* ---- تشغيل/إيقاف وسعة ---- */
  if (action === "patch") {
    const id = String(body.id ?? "");
    const hit = list.find((n) => n.id === id);
    if (!hit) return NextResponse.json({ error: "القاعدة غير موجودة" }, { status: 404 });
    if (typeof body.enabled === "boolean") hit.enabled = body.enabled;
    if (body.capacityMB !== undefined) hit.capacityMB = Math.max(0, Number(body.capacityMB) || 0);
    if (body.name) hit.name = String(body.name).trim().slice(0, 60);
    db.integrations.databases = list;
    saveDB(db);
    await flushDB();
    return NextResponse.json({ ok: true, nodes: orderNodes(list).map(publicNode) });
  }

  /* ---- فحص الكلّ ---- */
  if (action === "check") {
    /*
      فحصٌ يفحص.
      كان يقرأ ويبتلع النتيجة، فيقول «تعمل» عن قاعدةٍ لا وجود لها —
      لأنّ `fetch` لا يرمي على ٤٠٤. الآن تُقرأ الحالةُ نفسُها، وتُسجَّل،
      ويُذكر سببُ العطل بعينه.
    */
    const nodes = orderNodes(list);
    const report: { id: string; name: string; ok: boolean; open: boolean; error?: string }[] = [];

    for (const n of nodes) {
      const cfg = { databaseURL: n.url, secret: n.secret, clientEmail: n.clientEmail, privateKey: n.privateKey };
      const probe = await fbProbe(cfg);
      if (probe.ok && probe.writable !== false) {
        markUp(n.url, probe.bytes);
      } else {
        markDown(n.url, probe.error ?? "لم تجتز الفحص");
      }
      markOpen(n.url, probe.openRules);
      report.push({
        id: n.id,
        name: n.name,
        ok: probe.ok && probe.writable !== false,
        open: probe.openRules,
        error: probe.error,
      });
    }

    /*
      الحماية: إن كانت الرئيسيةُ ساقطةً أو ممتلئة تولّى فرعٌ سليمٌ مكانَها
      هنا وفوراً، لا عند أوّل عطلٍ يقع على طالب. والترقيةُ تُسجَّل حدثاً
      أمنياً — تبديلُ قاعدةِ المنصّة ليس تفصيلاً يمرّ صامتاً.
      وقاعدةُ البيئة لا تُرقّى من هنا: مكانُها متغيّراتُ الاستضافة.
    */
    let promoted: string | null = null;
    const primary = nodes.find((n) => n.role === "primary") ?? nodes[0];
    const primaryBad = primary && (!report.find((r) => r.id === primary.id)?.ok || isFull(primary));
    if (primaryBad) {
      const rescue = nodes.find(
        (n) => n.id !== primary.id && n.id !== "env" && n.enabled && !isFull(n) && report.find((r) => r.id === n.id)?.ok
      );
      if (rescue) {
        for (const n of list) n.role = "branch";
        const hit = list.find((n) => n.id === rescue.id);
        if (hit) {
          hit.role = "primary";
          db.integrations.databases = list;
          saveDB(db);
          await flushDB();
          promoted = hit.name;
          await recordEvent("db_promote", `${primary.name} ← ${hit.name}`);
        }
      }
    }

    const openOnes = report.filter((r) => r.open).map((r) => r.name);
    if (openOnes.length) await recordEvent("db_open_rules", openOnes.join("، "));

    return NextResponse.json({
      ok: true,
      report,
      promoted,
      nodes: orderNodes(db.integrations.databases ?? list).map(publicNode),
    });
  }

  return NextResponse.json({ error: "إجراء غير معروف" }, { status: 400 });
}

/**
 * يبحث عن عنوان القاعدة.
 * الإعدادُ الملصوق لا يحمل العنوان في الغالب، ولا يُعرف الإقليمُ منه.
 * فتُجرَّب الصيغُ المحتملةُ واحدةً واحدة ويُؤخذ أوّلُ ما يردّ فعلاً —
 * ولا يُكتفى بأن الطلب وصل، فالعنوانُ الميّت يردّ صفحةَ خطأ لا خطأ شبكة.
 */
async function findUrl(
  cfg: { projectId?: string; databaseURL?: string; secret?: string; clientEmail?: string; privateKey?: string },
  tried: { url: string; status: number; note: string }[]
): Promise<{ url: string; probe: Awaited<ReturnType<typeof fbProbe>> } | null> {
  const urls = [
    ...(cfg.databaseURL ? [cfg.databaseURL.replace(/\/$/, "")] : []),
    ...(cfg.projectId ? candidateUrls(cfg.projectId) : []),
  ].filter((u, i, a) => validDbUrl(u) && a.indexOf(u) === i);

  for (const url of urls) {
    const probe = await fbProbe(
      { databaseURL: url, secret: cfg.secret, clientEmail: cfg.clientEmail, privateKey: cfg.privateKey },
      true
    );
    tried.push({ url, status: probe.status, note: probe.error ?? (probe.openRules ? "تعمل — وقواعدُها مفتوحة" : "تعمل") });
    if (probe.ok && probe.writable !== false) return { url, probe };
  }
  return null;
}

/* كلُّ معالجٍ يعمل داخل سياق منصّته — انظر lib/hub/context.ts */
export const GET = tenantRoute(GET_impl);
export const POST = tenantRoute(POST_impl);
