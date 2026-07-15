"use client";

// Customer · Live chat with ParcelMaadi support — 5s polling.

import { useCallback, useEffect, useRef, useState } from "react";

export default function CustomerChatPage() {
  const [thread, setThread] = useState<any>(null);
  const [text, setText] = useState("");
  const bottomRef = useRef<HTMLDivElement>(null);

  const load = useCallback(async () => {
    const res = await fetch("/api/chat");
    const d = await res.json();
    if (d.ok) setThread(d.thread);
  }, []);
  useEffect(() => {
    load();
    const t = setInterval(load, 5000);
    return () => clearInterval(t);
  }, [load]);
  useEffect(() => { bottomRef.current?.scrollIntoView({ behavior: "smooth" }); }, [thread?.messages?.length]);

  async function send() {
    if (!text) return;
    await fetch("/api/chat", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ body: text }) });
    setText(""); await load();
  }

  return (
    <main className="mx-auto max-w-lg px-4 py-8">
      <h1 className="text-2xl font-black">Chat with support</h1>
      <p className="text-sm text-pm-ink/60">We usually reply within a few minutes during business hours.</p>

      <div className="mt-4 flex h-[26rem] flex-col rounded-2xl bg-white p-4 shadow">
        <div className="flex-1 space-y-2 overflow-y-auto">
          {!thread || (thread.messages ?? []).length === 0 ? (
            <p className="pt-16 text-center text-sm text-pm-ink/40">Say hello — how can we help? 👋</p>
          ) : (
            (thread.messages ?? []).map((m: any) => (
              <div key={m.id} className={`max-w-[80%] rounded-2xl px-3 py-2 text-sm ${m.fromStaff ? "bg-pm-cream" : "ml-auto bg-pm-red text-white"}`}>
                <p>{m.body}</p>
                <p className={`mt-0.5 text-[10px] ${m.fromStaff ? "text-pm-ink/40" : "text-white/70"}`}>{m.authorName} · {new Date(m.createdAt).toLocaleTimeString("en-IN", { hour: "2-digit", minute: "2-digit" })}</p>
              </div>
            ))
          )}
          <div ref={bottomRef} />
        </div>
        <div className="flex gap-2 border-t border-pm-ink/10 pt-2">
          <input
            className="flex-1 rounded-lg border border-pm-ink/20 px-3 py-2 text-sm outline-none focus:border-pm-red"
            placeholder="Type a message…"
            value={text}
            onChange={(e) => setText(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && send()}
          />
          <button type="button" onClick={send} disabled={!text} className="rounded-full bg-pm-red px-5 py-2 text-sm font-bold text-white hover:bg-pm-red-deep disabled:opacity-50">Send</button>
        </div>
      </div>
    </main>
  );
}
