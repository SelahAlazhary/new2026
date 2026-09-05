"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

/**
 * نموذجُ دخول لوحة المنصّات.
 * حقلُ `website` فخٌّ للآليّات: مخفيٌّ عن العين وعن المفتاح، ومن ملأه
 * رُدّ كما يُردّ الخطأ. والفحصُ في الخادم أيضاً — انظر مسار الدخول.
 */
export function HubLoginForm() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [website, setWebsite] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setBusy(true);
    setError("");
    try {
      const res = await fetch("/api/hub/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password, website }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        setError(data.error ?? "تعذّر الدخول");
        return;
      }
      router.push("/hub");
      router.refresh();
    } catch {
      setError("تعذّر الاتصال بالخادم");
    } finally {
      setBusy(false);
    }
  };

  return (
    <form onSubmit={submit} className="mt-6 space-y-3">
      <div>
        <label className="lbl" htmlFor="hub-email">البريد الإلكتروني</label>
        <input
          id="hub-email" type="email" required autoComplete="username" dir="ltr"
          value={email} onChange={(e) => setEmail(e.target.value)}
          className="inp w-full" placeholder="you@example.com"
        />
      </div>
      <div>
        <label className="lbl" htmlFor="hub-pass">كلمة المرور</label>
        <input
          id="hub-pass" type="password" required autoComplete="current-password"
          value={password} onChange={(e) => setPassword(e.target.value)}
          className="inp w-full"
        />
      </div>

      <input
        type="text" name="website" tabIndex={-1} autoComplete="off" aria-hidden="true"
        value={website} onChange={(e) => setWebsite(e.target.value)}
        style={{ position: "absolute", left: "-9999px", width: 1, height: 1, opacity: 0 }}
      />

      {error && (
        <p role="alert" className="rounded-xl bg-rose-500/10 px-3 py-2 text-[12px] font-bold text-rose-600">{error}</p>
      )}

      <button
        type="submit" disabled={busy}
        className="btn-glow w-full rounded-full px-5 py-2.5 text-sm font-bold text-white disabled:opacity-60"
      >
        {busy ? "جارٍ الدخول…" : "دخول"}
      </button>
    </form>
  );
}
