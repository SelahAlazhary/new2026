import { redirect } from "next/navigation";
import { requireSuper } from "@/lib/hub/session";
import { HubLoginForm } from "@/components/hub/login-form";

export const dynamic = "force-dynamic";
export const metadata = { title: "دخول لوحة المنصّات", robots: { index: false, follow: false } };

export default async function HubLoginPage() {
  if (await requireSuper()) redirect("/hub");
  return (
    <main className="grid min-h-dvh place-items-center bg-gradient-to-b from-slate-50 to-white px-5 py-10">
      <div className="w-full max-w-sm space-y-1">
        <div className="rounded-3xl border border-slate-200/80 bg-white p-8 shadow-xl shadow-slate-900/[0.08]">
          <div className="mb-6 flex items-center gap-3">
            <span className="grid size-10 place-items-center rounded-xl bg-gradient-to-br from-purple-600 to-purple-900 text-sm font-bold text-white shadow-md shadow-purple-900/20">S</span>
            <div>
              <h1 className="font-display text-xl font-extrabold text-slate-900">لوحة المنصّات</h1>
              <p className="text-[12px] text-slate-500">إدارة المنصّات والاشتراكات</p>
            </div>
          </div>
          <HubLoginForm />
        </div>
        <p className="text-center text-[11px] text-slate-400 pt-3">
          الوصول مقيّد بمديري المنصّة فقط
        </p>
      </div>
    </main>
  );
}
