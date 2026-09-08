import { NextResponse } from "next/server";
import { sameOrigin, limit, clientIp, passwordProblem, invalidUsername } from "@/lib/auth/guard";
import { isHubHost } from "@/lib/hub/guard-host";
import { registerOwnerWithPassword, checkOwnerPassword, setOwnerCookie } from "@/lib/hub/owner";
import { audit } from "@/lib/hub/audit";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

/**
 * تسجيلُ المدرّس ودخولُه بالبريد وكلمة المرور — بديلٌ عن جوجل.
 * ------------------------------------------------------------------
 * `mode: "register"` يُنشئ حساباً (اسم + بريد + كلمة مرور)، و`mode: "login"`
 * يدخل به. سياسةُ كلمة المرور نفسُها المستعملة في المنصّة (`passwordProblem`)،
 * والحدُّ على العنوان يمنع التخمين. والفشلُ في الدخول لا يفرّق بين بريدٍ
 * مجهولٍ وكلمةٍ خاطئة.
 */
export async function POST(req: Request) {
  if (!(await isHubHost())) return NextResponse.json({ error: "غير موجود" }, { status: 404 });
  if (!(await sameOrigin(req))) return NextResponse.json({ error: "طلب غير صالح" }, { status: 403 });

  const ip = await clientIp();
  const body = (await req.json().catch(() => ({}))) as Record<string, unknown>;
  const mode = body.mode === "register" ? "register" : "login";
  const email = String(body.email ?? "").trim().toLowerCase();
  const password = String(body.password ?? "");
  const website = body.website;

  /* فخّ الآليّات — يُردّ كالخطأ فلا يُعلَم أنّه فخّ */
  if (typeof website === "string" && website.trim()) {
    return NextResponse.json({ error: "بيانات الدخول غير صحيحة" }, { status: 401 });
  }

  const gate = limit(`owner:auth:${ip}`, 20, 60 * 60_000, 15 * 60_000);
  if (!gate.ok) {
    return NextResponse.json({ error: "محاولات كثيرة — حاول بعد قليل" }, { status: 429, headers: { "Retry-After": String(gate.retryAfter ?? 900) } });
  }

  const badEmail = invalidUsername(email);
  if (badEmail) return NextResponse.json({ error: badEmail }, { status: 400 });

  if (mode === "register") {
    const name = String(body.name ?? "").trim();
    if (name.length < 2) return NextResponse.json({ error: "أدخل اسمك" }, { status: 400 });
    const weak = passwordProblem(password);
    if (weak) return NextResponse.json({ error: weak }, { status: 400 });

    const { owner, error } = await registerOwnerWithPassword({ name, email, password });
    if (error || !owner) return NextResponse.json({ error: error ?? "تعذّر إنشاء الحساب" }, { status: 400 });
    await setOwnerCookie({ oid: owner.id, email: owner.email, name: owner.name });
    await audit("owner.register", { kind: "owner", id: owner.id, name: owner.name });
    return NextResponse.json({ ok: true, name: owner.name });
  }

  const owner = await checkOwnerPassword(email, password);
  if (!owner) return NextResponse.json({ error: "بيانات الدخول غير صحيحة" }, { status: 401 });
  await setOwnerCookie({ oid: owner.id, email: owner.email, name: owner.name });
  await audit("owner.login", { kind: "owner", id: owner.id, name: owner.name });
  return NextResponse.json({ ok: true, name: owner.name });
}
