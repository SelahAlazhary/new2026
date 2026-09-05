import { redirect } from "next/navigation";
import { requireSuper } from "@/lib/hub/session";
import { HubLoginForm } from "@/components/hub/login-form";

export const dynamic = "force-dynamic";
export const metadata = { title: "دخول لوحة المنصّات", robots: { index: false, follow: false } };

export default async function HubLoginPage() {
  if (await requireSuper()) redirect("/hub");
  return (
    <main className="grid min-h-dvh place-items-center bg-[#f7f5f0] px-5 py-10">
      <div className="w-full max-w-sm rounded-3xl border border-black/10 bg-white p-8 shadow-[0_20px_60px_-40px_rgba(16,24,40,.6)]">
        <p className="font-kufi text-[11px] tracking-wide text-muted-foreground">المنصّة الأمّ</p>
        <h1 className="font-display mt-1 text-2xl font-extrabold text-[#1b2a4a]">لوحة المنصّات</h1>
        <p className="mt-1.5 text-[13px] text-muted-foreground">
          الدخول لإدارة منصّات المدرّسين واشتراكاتها.
        </p>
        <HubLoginForm />
      </div>
    </main>
  );
}
