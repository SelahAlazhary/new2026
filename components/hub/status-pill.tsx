import type { TenantStatus } from "@/lib/hub/types";

/** أسماءُ الحالات وألوانُها — مصدرٌ واحدٌ لكلّ شاشات الـHub. */
export const STATUS_LABEL: Record<TenantStatus, string> = {
  onboarding: "قيد الإنشاء",
  pending_approval: "بانتظار الموافقة",
  active: "نشطة",
  suspended: "موقوفة",
  expired: "منتهية",
  archived: "مؤرشفة",
};

const STATUS_TONE: Record<TenantStatus, string> = {
  onboarding: "bg-sky-500/12 text-sky-700",
  pending_approval: "bg-amber-500/14 text-amber-700",
  active: "bg-emerald-500/12 text-emerald-700",
  suspended: "bg-rose-500/12 text-rose-600",
  expired: "bg-rose-500/12 text-rose-600",
  archived: "bg-black/[0.06] text-muted-foreground",
};

export function StatusPill({ status }: { status: TenantStatus }) {
  return (
    <span className={`font-kufi shrink-0 rounded-full px-2.5 py-1 text-[10px] font-bold ${STATUS_TONE[status] ?? STATUS_TONE.archived}`}>
      {STATUS_LABEL[status] ?? status}
    </span>
  );
}
