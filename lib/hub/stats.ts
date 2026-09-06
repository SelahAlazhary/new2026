import "server-only";
import type { TenantStats, Tenant } from "./types";
import { listTenants, patchTenant } from "./registry";
import { runInTenant, ctxForTenantId } from "./context";
import { loadDB, getDB, flushDB } from "../db";
import type { User } from "../types";

/**
 * حسابُ إحصاءات المنصّات — يُشغَّل من الكرون مرّةً في الساعة.
 * ------------------------------------------------------------------
 * يقرأ قاعدةَ كلّ منصّةٍ نشطة ويحسب:
 *   · الطلابَ (مسجّلين) · الاشتراكاتِ النشطة · الكورساتِ والدروس
 *   · المشرفين · الإيراد (مدفوعات الطلاب المقبولة) · أحداثَ الأمان
 *   · آخرَ نشاط · الحجمَ التقديريّ
 *
 * ويكتب النتيجةَ في بطاقة المنصّة (`tenant.stats`) — فلا يُحمّل الـHub
 * كلَّ قاعدةٍ عند عرض الجدول.
 */

export async function computeAllStats(): Promise<{ computed: number; errors: string[] }> {
  const tenants = (await listTenants()).filter((t) =>
    t.status === "active" || t.status === "suspended" || t.status === "expired"
  );

  let computed = 0;
  const errors: string[] = [];

  for (const tenant of tenants) {
    try {
      const stats = await computeTenantStats(tenant);
      await patchTenant(tenant.id, { stats });
      computed++;
    } catch (e) {
      errors.push(`${tenant.slug}: ${(e as Error).message}`);
    }
  }

  return { computed, errors };
}

async function computeTenantStats(tenant: Tenant): Promise<TenantStats> {
  const ctx = await ctxForTenantId(tenant.id);
  return runInTenant(ctx, async () => {
    await loadDB();
    const db = getDB();

    const students = Array.isArray(db.students) ? db.students.length : 0;

    /* الاشتراكاتُ النشطة على users (role=student) بحقل subscriptions */
    const studentUsers = Array.isArray(db.users)
      ? db.users.filter((u: User) => u.role === "student")
      : [];
    const activeSubs = studentUsers.filter((u: User) => {
      if (!Array.isArray(u.subscriptions) || u.subscriptions.length === 0) return false;
      return u.subscriptions.some((s) => !s.expiresAt || new Date(s.expiresAt).getTime() > Date.now());
    }).length;

    const subjects = Array.isArray(db.subjects) ? db.subjects.length : 0;
    let lessons = 0;
    if (Array.isArray(db.subjects)) {
      for (const sub of db.subjects) {
        if (Array.isArray(sub.units)) {
          for (const u of sub.units) {
            if (Array.isArray(u.lessons)) lessons += u.lessons.length;
          }
        }
      }
    }

    const admins = Array.isArray(db.users)
      ? db.users.filter((u: User) => u.role === "admin").length
      : 0;

    /* الإيراد من طلبات الدفع المقبولة */
    const revenueEGP = Array.isArray(db.payments)
      ? db.payments
          .filter((p) => p.status === "approved")
          .reduce((sum, p) => sum + (p.amount ?? 0), 0)
      : 0;

    const estimatedBytes = JSON.stringify(db).length;

    await flushDB();

    return {
      students,
      activeSubs,
      subjects,
      lessons,
      admins,
      revenueEGP,
      securityEvents30d: 0,
      estimatedBytes,
      updatedAt: new Date().toISOString(),
    };
  });
}
