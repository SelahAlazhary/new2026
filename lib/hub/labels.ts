/** أسماءٌ عربيّةٌ لأفعال سجلّ التدقيق — مصدرٌ واحدٌ لكلّ شاشةٍ تعرضه. */
export const ACTION_LABEL: Record<string, string> = {
  "super.login": "دخل لوحة المنصّات",
  "super.logout": "خرج من لوحة المنصّات",
  "super.login_failed": "محاولة دخول فاشلة",
  "super.device_mismatch": "دخول من جهاز غير مرتبط",
  "tenant.status": "غيّر حالة منصّة",
  "tenant.sections": "غيّر الأقسام الظاهرة",
  "tenant.features": "غيّر الميزات",
  "tenant.limits": "غيّر الحدود",
  "tenant.notes": "حدّث ملاحظات",
  "hub.settings": "حدّث إعدادات المنصّة الأمّ",
};

export function actionLabel(action: string): string {
  return ACTION_LABEL[action] ?? action;
}
