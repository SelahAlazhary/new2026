import "server-only";
import { cookies } from "next/headers";
import crypto from "crypto";

/**
 * ربط الحساب بجهاز واحد.
 * • لكل متصفّح معرّف جهاز عشوائي يُحفظ في كوكي httpOnly موقّعة (لا يُقرأ ولا يُزوَّر من الواجهة).
 * • أول تسجيل دخول/تسجيل حساب يربط المعرّف بالطالب؛ وأي جهاز آخر يُرفض.
 * • الأدمن وحده يستطيع فكّ الربط ليسمح بجهاز جديد.
 */
import { AUTH_SECRET as SECRET } from "@/lib/auth/secrets";
const COOKIE = "emz_device";
const MAX_AGE = 60 * 60 * 24 * 365 * 5; // خمس سنوات
/* آمنة على HTTPS كأختها كوكي الجلسة — لا تُرسَل على اتصالٍ غير مشفّر،
   فلا تُلتقط من الشبكة. نفسُ علم الجلسة حرفاً بحرف. */
const SECURE = process.env.COOKIE_SECURE === "1" || process.env.VERCEL === "1";

function sign(value: string): string {
  return crypto.createHmac("sha256", SECRET).update(value).digest("base64url");
}

function pack(id: string): string {
  return `${id}.${sign(id)}`;
}

function unpack(raw?: string): string | null {
  if (!raw || !raw.includes(".")) return null;
  const [id, sig] = raw.split(".");
  const expected = sign(id);
  if (sig.length !== expected.length) return null;
  return crypto.timingSafeEqual(Buffer.from(sig), Buffer.from(expected)) ? id : null;
}

/** معرّف الجهاز الحالي إن وُجد وكان توقيعه سليماً. */
export async function readDeviceId(): Promise<string | null> {
  const store = await cookies();
  return unpack(store.get(COOKIE)?.value);
}

/** معرّف الجهاز، ويُنشأ ويُثبَّت إن لم يكن موجوداً. */
export async function ensureDeviceId(): Promise<string> {
  const existing = await readDeviceId();
  if (existing) return existing;

  const id = crypto.randomBytes(16).toString("hex");
  const store = await cookies();
  store.set(COOKIE, pack(id), {
    httpOnly: true,
    sameSite: "lax",
    path: "/",
    maxAge: MAX_AGE,
    secure: SECURE,
  });
  return id;
}

/** وصف مختصر للجهاز من ترويسة المتصفّح — للعرض في لوحة الأدمن فقط. */
export function deviceLabel(ua?: string | null): string {
  const s = ua ?? "";
  const os =
    /android/i.test(s) ? "أندرويد" :
    /iphone|ipad|ipod/i.test(s) ? "آيفون/آيباد" :
    /windows/i.test(s) ? "ويندوز" :
    /mac os/i.test(s) ? "ماك" :
    /linux/i.test(s) ? "لينكس" : "جهاز";
  const browser =
    /edg\//i.test(s) ? "Edge" :
    /opr\//i.test(s) ? "Opera" :
    /chrome\//i.test(s) ? "Chrome" :
    /firefox\//i.test(s) ? "Firefox" :
    /safari\//i.test(s) ? "Safari" : "متصفّح";
  return `${os} · ${browser}`;
}
