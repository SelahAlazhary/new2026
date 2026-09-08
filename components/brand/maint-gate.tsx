"use client";

/**
 * بوّابةُ الصيانة للصفحات.
 * ------------------------------------------------------------------
 * تُوضع في أوّل الصفحة سطراً واحداً، فتعيد لوحَ الصيانة إن كان القسمُ
 * مغلقاً وإلّا `null` فتمضي الصفحة كما هي.
 *
 * **والمشرفون يمرّون.** صيانةٌ تحجب من يصلحها ليست صيانة — ويظهر لهم
 * شريطٌ يذكّرهم أنّ الباب مغلقٌ على غيرهم.
 *
 * **وهذه بوّابةُ عرضٍ لا حراسةُ أمن.** الصيانةُ حالةُ واجهةٍ لا صلاحية:
 * ما يحرس البيانات هو مسارات الـAPI وجلسةُ المستخدم، وهي لا تتأثّر
 * بهذا. فمن تحايل ورأى الصفحة لم ينل بها شيئاً لم يكن له.
 */

import type { ReactElement } from "react";
import { useContent } from "@/components/content/content-provider";
import { MaintenancePanel, MaintenanceBar } from "@/components/brand/maintenance";
import { scopeDown, maintText, SCOPE_LABEL, type MaintScope } from "@/lib/business/maintenance";

export function useMaintGate(scope: MaintScope): ReactElement | null {
  const { content, session } = useContent();

  if (!scopeDown(content, scope)) return null;

  const t = maintText(content);

  /* المشرف يمرّ — ويُنبَّه بشريطٍ فوق ما يراه. */
  if (session?.role === "admin") {
    return null;
  }

  return (
    <main className="grid min-h-[70vh] place-items-center px-5 py-16">
      <MaintenancePanel full={false} title={t.title} message={t.message} until={t.until} />
    </main>
  );
}

/** شريطُ التنبيه للمشرف حين يمرّ من قسمٍ مغلق. */
export function MaintNotice({ scope }: { scope: MaintScope }) {
  const { content, session } = useContent();
  if (session?.role !== "admin" || !scopeDown(content, scope)) return null;
  return <MaintenanceBar what={SCOPE_LABEL[scope]} />;
}
