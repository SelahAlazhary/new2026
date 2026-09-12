import { getHubSettings } from "@/lib/hub/settings";
import { listSupers } from "@/lib/hub/session";
import { HubSettingsForm } from "@/components/hub/settings-form";

export const dynamic = "force-dynamic";
export const metadata = { title: "الإعدادات" };

export default async function HubSettingsPage() {
  const [settings, supers] = await Promise.all([getHubSettings(), listSupers()]);

  return (
    <>
      <header className="mb-5" data-reveal="down" data-reveal-duration="fast">
        <h1 className="font-display text-2xl font-bold">إعدادات المنصّة الأمّ</h1>
        <p className="mt-1 text-[13px] text-muted-foreground">هويّةُ الـHub وسياسةُ قبول المنصّات.</p>
      </header>

      <HubSettingsForm settings={settings} />

      <section className="mt-5 rounded-2xl border border-black/[0.07] bg-white p-4" data-reveal="up">
        <h3 className="font-display text-[15px] font-bold">حسابات لوحة المنصّات</h3>
        <p className="mb-3 mt-1 text-[11.5px] leading-relaxed text-muted-foreground">
          يُنشأ الحسابُ الأوّل من متغيّرَي البيئة <code dir="ltr">SUPER_ADMIN_EMAIL</code> و
          <code dir="ltr">SUPER_ADMIN_PASSWORD</code> عند أوّل دخول. وكلمةُ المرور لا تُعرض هنا ولا تُقرأ من أيّ شاشة.
        </p>
        <ul className="divide-y divide-black/[0.06] text-[12.5px]">
          {supers.map((s) => (
            <li key={s.id} className="flex flex-wrap items-center gap-2 py-2">
              <b>{s.name}</b>
              <span className="text-muted-foreground" dir="ltr">{s.email}</span>
              <span className="ms-auto text-[11px] text-muted-foreground">
                {s.deviceLabel ? `مرتبط بـ ${s.deviceLabel}` : "بانتظار أوّل جهاز"}
              </span>
            </li>
          ))}
          {supers.length === 0 && (
            <li className="py-4 text-center text-[12px] text-muted-foreground">لا حسابات بعد.</li>
          )}
        </ul>
      </section>

      <section className="mt-5 rounded-2xl border border-black/[0.07] bg-white p-4" data-reveal="stretch">
        <h3 className="font-display text-[15px] font-bold">النطاق الجذري</h3>
        <p className="mt-1 text-[11.5px] leading-relaxed text-muted-foreground">
          يُقرأ من متغيّر البيئة <code dir="ltr">ROOT_DOMAIN</code> لا من هنا — لأنّه ما يخدم عليه الخادمُ فعلاً،
          وتغييرُه في القاعدة لا يغيّر ما تحلّه الشبكة.
        </p>
        <p className="mt-2 rounded-xl bg-black/[0.03] px-3 py-2 text-[12px]" dir="ltr">
          {settings.rootDomain || "(غير مضبوط — المنصّات تُخدم على *.localhost محلّياً)"}
        </p>
      </section>
    </>
  );
}
