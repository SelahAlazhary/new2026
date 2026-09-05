import { NextResponse } from "next/server";
import { loadDB, getDB, saveDB, flushDB } from "@/lib/db";
import { getSession } from "@/lib/session";
import { recordEvent } from "@/lib/security";
import { sameOrigin } from "@/lib/guard";
import { can } from "@/lib/perms";
import type { Testimonial } from "@/lib/types";
import { tenantRoute } from "@/lib/hub/context";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

/**
 * شهادات الطلاب — تُعرض في الصفحة الرئيسية.
 * PUT يحفظ القائمة كاملة، ويتطلّب صلاحية «شهادات الطلاب».
 * القسم يعيش داخل content فلا يحتاج مفتاحاً جديداً في القاعدة.
 */

const MAX = 40;

/** تنقية ما يصل من الواجهة: حقول معروفة فقط وبأطوال معقولة. */
function clean(input: unknown): Testimonial[] {
  if (!Array.isArray(input)) return [];
  return input
    .slice(0, MAX)
    .map((raw): Testimonial | null => {
      const t = raw as Partial<Testimonial>;
      const name = String(t.name ?? "").trim().slice(0, 80);
      const text = String(t.text ?? "").trim().slice(0, 600);
      if (!name || !text) return null;
      const rating = Number(t.rating);
      return {
        id: String(t.id ?? `TST-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 6)}`).slice(0, 40),
        name,
        text,
        badge: t.badge ? String(t.badge).trim().slice(0, 40) : undefined,
        grade: t.grade ? String(t.grade).trim().slice(0, 60) : undefined,
        photo: t.photo ? String(t.photo).trim().slice(0, 500) : undefined,
        rating: Number.isFinite(rating) && rating >= 1 && rating <= 5 ? Math.round(rating) : undefined,
        featured: Boolean(t.featured),
        hidden: Boolean(t.hidden),
      };
    })
    .filter((t): t is Testimonial => t !== null);
}

async function GET_impl() {
  await loadDB();
  const all = getDB().content.testimonials ?? [];
  const session = await getSession();
  // الزائر والطالب يريان المعروض فقط؛ الأدمن يرى المخفيّ ليحرّره
  const visible = session?.role === "admin" ? all : all.filter((t) => !t.hidden);
  return NextResponse.json({ testimonials: visible });
}

async function PUT_impl(req: Request) {
  if (!(await sameOrigin(req))) {
    await recordEvent("csrf_blocked", "/api/testimonials");
    return NextResponse.json({ error: "طلب غير مصرّح" }, { status: 403 });
  }
  await loadDB();
  const session = await getSession();
  if (!session || session.role !== "admin") {
    await recordEvent("unauthorized_admin", "/api/testimonials");
    return NextResponse.json({ error: "غير مصرّح" }, { status: 401 });
  }

  const db = getDB();
  const me = db.users.find((u) => u.id === session.uid);
  if (!can(me, "testimonials")) {
    await recordEvent("perm_denied", "شهادات الطلاب", { userId: me?.id, username: me?.username });
    return NextResponse.json({ error: "ليست لديك صلاحية تعديل هذا القسم" }, { status: 403 });
  }

  const body = (await req.json()) as { testimonials?: unknown };
  db.content.testimonials = clean(body.testimonials);
  saveDB(db);
  await flushDB();
  return NextResponse.json({ ok: true, testimonials: db.content.testimonials });
}

/* كلُّ معالجٍ يعمل داخل سياق منصّته — انظر lib/hub/context.ts */
export const GET = tenantRoute(GET_impl);
export const PUT = tenantRoute(PUT_impl);
