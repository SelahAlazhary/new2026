"use client";

/**
 * محادثة الدعم — مكوّن واحد يخدم الطرفين.
 *
 * الطالب  : يفتح محادثته ويكتب فيها.
 * المشرف  : يفتح محادثة طالب بعينه ويردّ (يمرّر threadId).
 *
 * التحديث بالسحب كل بضع ثوانٍ ما دامت الشاشة مفتوحة — يكفي لمحادثة
 * دعم ولا يحتاج اتصالاً دائماً يستهلك بطارية الهاتف.
 */

import { useCallback, useEffect, useRef, useState } from "react";
import { IconSpinner, IconLifebuoy, IconArrowLeft } from "@/components/brand/icons";
import type { ChatMessage } from "@/lib/utils/types";

const POLL_MS = 6000;

export function SupportChat({
  threadId,
  emptyHint = "اكتب رسالتك وسيصلك ردّ فريق الدعم هنا.",
  className = "",
  heightClass = "h-[26rem]",
}: {
  threadId?: string;
  emptyHint?: string;
  className?: string;
  heightClass?: string;
}) {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [text, setText] = useState("");
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [err, setErr] = useState<string | null>(null);
  const listRef = useRef<HTMLDivElement>(null);
  const count = useRef(0);

  const url = threadId ? `/api/support/chat?id=${encodeURIComponent(threadId)}` : "/api/support/chat";

  const load = useCallback(async () => {
    try {
      const res = await fetch(url);
      if (!res.ok) return;
      const data = await res.json();
      const next: ChatMessage[] = data.thread?.messages ?? data.messages ?? [];
      setMessages(next);
    } finally {
      setLoading(false);
    }
  }, [url]);

  useEffect(() => {
    void load();
    const id = setInterval(() => void load(), POLL_MS);
    return () => clearInterval(id);
  }, [load]);

  // التمرير لآخر رسالة عند وصول جديد فقط — لا نقاطع القراءة بلا سبب
  useEffect(() => {
    if (messages.length === count.current) return;
    count.current = messages.length;
    listRef.current?.scrollTo({ top: listRef.current.scrollHeight, behavior: "smooth" });
  }, [messages]);

  const send = async () => {
    const body = text.trim();
    if (!body || sending) return;
    setSending(true);
    setErr(null);
    const res = await fetch("/api/support/chat", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ text: body, id: threadId }),
    });
    const data = await res.json().catch(() => ({}));
    setSending(false);
    if (!res.ok) { setErr(data.error ?? "تعذّر الإرسال"); return; }
    setText("");
    setMessages(data.messages ?? []);
  };

  return (
    <div className={`glass flex flex-col overflow-hidden rounded-3xl ${className}`}>
      <div ref={listRef} className={`flex-1 space-y-2.5 overflow-y-auto p-4 ${heightClass}`}>
        {loading ? (
          <p className="text-center text-sm text-muted-foreground">جارٍ التحميل…</p>
        ) : messages.length === 0 ? (
          <div className="grid h-full place-items-center px-6 text-center">
            <div>
              <IconLifebuoy className="mx-auto size-9 text-muted-foreground" />
              <p className="mt-2 text-sm text-muted-foreground">{emptyHint}</p>
            </div>
          </div>
        ) : (
          messages.map((m) => <Bubble key={m.id} m={m} mine={threadId ? m.from === "support" : m.from === "student"} />)
        )}
      </div>

      {err && <p className="px-4 pb-1 text-[11px] font-bold text-rose-500">{err}</p>}

      <div className="flex items-end gap-2 border-t border-border p-3">
        <textarea
          value={text}
          rows={1}
          onChange={(e) => setText(e.target.value)}
          onKeyDown={(e) => {
            // Enter يرسل، Shift+Enter سطر جديد
            if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); void send(); }
          }}
          placeholder="اكتب رسالتك…"
          className="max-h-32 min-h-[2.75rem] flex-1 resize-none rounded-2xl border border-border bg-card/60 px-4 py-2.5 text-sm outline-none transition focus:border-primary/50"
        />
        <button
          onClick={() => void send()}
          disabled={sending || !text.trim()}
          aria-label="إرسال"
          className="grid size-11 shrink-0 place-items-center rounded-full btn-glow text-white disabled:opacity-50"
        >
          {sending ? <IconSpinner className="size-4 animate-spin" /> : <IconArrowLeft className="size-4" />}
        </button>
      </div>
    </div>
  );
}

/** فقاعة رسالة — رسائلي على اليمين، والطرف الآخر على اليسار. */
function Bubble({ m, mine }: { m: ChatMessage; mine: boolean }) {
  const time = new Date(m.at).toLocaleTimeString("ar-EG", { timeZone: "Africa/Cairo",  hour: "2-digit", minute: "2-digit" });
  return (
    <div className={`flex ${mine ? "justify-start" : "justify-end"}`}>
      <div
        className={`max-w-[85%] rounded-2xl px-3.5 py-2.5 text-sm leading-relaxed ${
          mine ? "bg-primary/12 text-foreground" : "border border-border bg-card/60"
        }`}
      >
        {m.from === "support" && m.authorName && (
          <p className="mb-0.5 text-[10px] font-bold text-primary">{m.authorName} · الدعم</p>
        )}
        <p className="whitespace-pre-wrap break-words">{m.text}</p>
        <p className="mt-1 text-[10px] text-muted-foreground">{time}</p>
      </div>
    </div>
  );
}
