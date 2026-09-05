import "server-only";
import fs from "fs";
import path from "path";
import { fbGet, fbSet, firebaseConfigured } from "../firebase";

/**
 * طبقةُ تخزين المنصّة الأمّ — كلُّ ما تحت `hub/`.
 * ------------------------------------------------------------------
 * هذه ليست قاعدةَ منصّةٍ ولا تمرّ بسياق مستأجر: بياناتُ الـHub واحدةٌ
 * للجميع (المنصّات، أصحابُها، الخطط، الفواتير، الدومينات، سجلّ التدقيق).
 * فلا مخبأَ ولا طابورَ ولا `platformRoot()` — قراءةٌ وكتابةٌ مباشرتان.
 *
 * **ولماذا لا يُعاد استعمالُ `lib/store.ts`؟** ذاك يقرأ الشجرةَ كاملةً
 * ويكتبها كاملة (`PUT` على الجذر) — وهو صوابٌ لقاعدةِ منصّةٍ تُقرأ كلُّها
 * في كلّ طلب، وخطأٌ هنا: كتابةُ بطاقةِ منصّةٍ واحدة لا يجوز أن تُعيد كتابةَ
 * ألفِ منصّةٍ معها، ولا أن تُسقط ما كتبته نسخةٌ أخرى في اللحظة نفسِها.
 * فالكتابةُ هنا **على العقدة المقصودة وحدَها**.
 *
 * وبلا فايربيز يسكن كلُّ ذلك في `data/hub.json` — ملفٌّ واحدٌ يقرأه
 * ويكتبه هذا الملفُّ وحدَه، فلا كاتبان على ملفٍّ واحد.
 */

const ROOT = "hub";
const FILE = path.join(process.cwd(), "data", "hub.json");
const READ_ONLY_FS = Boolean(process.env.VERCEL || process.env.AWS_LAMBDA_FUNCTION_NAME);

export function hubOnFirebase(): boolean {
  return firebaseConfigured();
}

/* ---------- الملفُّ المحلّي ---------- */

type Tree = Record<string, unknown>;

function readFile(): Tree {
  try {
    if (!READ_ONLY_FS && fs.existsSync(FILE)) return JSON.parse(fs.readFileSync(FILE, "utf-8")) as Tree;
  } catch {
    /* ملفٌ تالف — يُعامل كفارغ، ولا يُكتب فوقه إلّا بكتابةٍ صريحة */
  }
  return {};
}

function writeFile(tree: Tree) {
  if (READ_ONLY_FS) return;
  try {
    fs.mkdirSync(path.dirname(FILE), { recursive: true });
    fs.writeFileSync(FILE, JSON.stringify(tree, null, 2), "utf-8");
  } catch {
    /* قرصٌ غير قابل للكتابة */
  }
}

function segments(p: string): string[] {
  return p.split("/").map((s) => s.trim()).filter(Boolean);
}

function deepGet(tree: Tree, segs: string[]): unknown {
  let cur: unknown = tree;
  for (const s of segs) {
    if (!cur || typeof cur !== "object") return null;
    cur = (cur as Tree)[s];
  }
  return cur ?? null;
}

function deepSet(tree: Tree, segs: string[], value: unknown) {
  let cur: Tree = tree;
  for (let i = 0; i < segs.length - 1; i++) {
    const s = segs[i];
    if (!cur[s] || typeof cur[s] !== "object") cur[s] = {};
    cur = cur[s] as Tree;
  }
  const last = segs[segs.length - 1];
  if (value === null || value === undefined) delete cur[last];
  else cur[last] = value;
}

/* ---------- الواجهة ---------- */

/** يقرأ عقدةً تحت `hub/` — المسارُ نسبيٌّ إليها (`tenants/t1`). */
export async function hubGet<T>(p: string): Promise<T | null> {
  const segs = segments(p);
  if (!segs.length) return null;
  if (hubOnFirebase()) return fbGet<T>(`${ROOT}/${segs.join("/")}`);
  return (deepGet(readFile(), segs) as T) ?? null;
}

/** يكتب عقدةً واحدة — لا يمسّ أخواتِها. `null` يحذف. */
export async function hubSet(p: string, value: unknown): Promise<void> {
  const segs = segments(p);
  if (!segs.length) return;
  if (hubOnFirebase()) {
    await fbSet(`${ROOT}/${segs.join("/")}`, value ?? null);
    return;
  }
  const tree = readFile();
  deepSet(tree, segs, value);
  writeFile(tree);
}

/** كلُّ عناصر مجموعة — كائنٌ بمفاتيحه، أو فارغٌ. */
export async function hubList<T>(collection: string): Promise<Record<string, T>> {
  const v = await hubGet<Record<string, T>>(collection);
  if (!v || typeof v !== "object") return {};
  /* فايربيز قد تُعيد مصفوفةً إن كانت المفاتيحُ أرقاماً متتابعة */
  if (Array.isArray(v)) {
    const out: Record<string, T> = {};
    v.forEach((item, i) => { if (item) out[String(i)] = item as T; });
    return out;
  }
  return v;
}

/** معرّفٌ عشوائيٌّ قصيرٌ لعناصر الـHub. */
export function hubId(prefix: string): string {
  const rnd = Math.random().toString(36).slice(2, 8);
  return `${prefix}_${Date.now().toString(36)}${rnd}`;
}
