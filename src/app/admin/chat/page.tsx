"use client";

// Admin · Live chat console — 5s polling, thread list + conversation.

import { useCallback, useEffect, useState } from "react";

const inputCls = "rounded-lg border border-pm-ink/20 px-3 py-2 text-sm outline-none focus:border-pm-red";

export default function AdminChatPage() {
  const [threads, setThreads] = useState<any[]>([]);
  const [sel, setSel] = useState<string | null>(null);
  const [thread, setThread] = useState<any>(null);
  const [reply, setReply] = useState("");

  const loadThreads = useCallback(async () => {
    const res = await fetch("/api/admin/chat");
    const d = await res.json();
    if (d.ok) setThreads(d.threads);
  }, []);
  const loadThread = useCallback(async (id: string) => {
    const res = await fetch(`/api/admin/chat?threadId=${id}`);
    const d = await res.json();
    if (d.ok) setThread(d.thread);
  }, []);

  useEffect(() => {
    loadThreads();
    const t = setInterval(() => { loadThreads(); if (sel) loadThread(sel); }, 5000);
    return () => clearInterval(t);
  }, [loadThreads, loadThread, sel]);

  async function send() {
    if (!sel || !reply) return;
    await fetch("/api/admin/chat", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ threadId: sel, body: reply }) });
    setReply(""); await loadThread(sel); await loadThreads();
  }
  async function close() {
    if (!sel) return;
    await fetch("/api/admin/chat", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ threadId: sel, action: "close" }) });
    await loadThreads(); setThread(null); setSel(null);
  }

  return (
    <main className="mx-auto max-w-6xl px-4 py-8">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-black">Live chat</h1>
        <span className="flex items-center gap-1 text-xs font-semibold text-green-700"><span className="h-2 w-2 animate-pulse rounded-full bg-green-500" />Live · 5s</span>
      </div>

      <div className="mt-4 grid grid-cols-1 gap-4 lg:grid-cols-3">
        <div className="space-y-2">
          {threads.length === 0 && <p className="rounded-2xl border border-dashed border-pm-ink/20 bg-white/60 p-6 text-center text-sm text-pm-ink/50">No chats yet.</p>}
          {threads.map((t) => (
            <button type="button" key={t.id} onClick={() => { setSel(t.id); loadThread(t.id); }} className={`w-full rounded-2xl bg-white p-3 text-left shadow hover:shadow-md ${sel === t.id ? "ring-2 ring-pm-red" : ""}`}>
              <div className="flex items-center justify-between">
                <p className="text-sm font-bold">{t.user?.name ?? "Customer"}</p>
                <span className={`rounded-full px-2 py-0.5 text-[10px] font-bold ${t.status === "OPEN" ? "bg-green-100 text-green-800" : "bg-pm-cream text-pm-ink/50"}`}>{t.status}</span>
              </div>
              <p className="truncate text-xs text-pm-ink/50">{t._count?.messages ?? 0} messages · {t.lastMessageAt ? new Date(t.lastMessageAt).toLocaleString("en-IN", { dateStyle: "short", timeStyle: "short" }) : "new"}</p>
            </button>
          ))}
        </div>

        <div className="lg:col-span-2">
          {!thread ? (
            <p className="rounded-2xl border border-dashed border-pm-ink/20 bg-white/60 p-8 text-center text-sm text-pm-ink/50">Select a conversation.</p>
          ) : (
            <div className="flex h-[28rem] flex-col rounded-2xl bg-white p-4 shadow">
              <div className="flex items-center justify-between border-b border-pm-ink/10 pb-2">
                <p className="text-sm font-black">{thread.user?.name ?? "Customer"} <span className="text-xs font-normal text-pm-ink/40">{thread.user?.phone ?? ""}</span></p>
                <button type="button" onClick={close} className="rounded-full bg-pm-cream px-3 py-1 text-xs font-bold hover:bg-pm-yellow/40">Close chat</button>
              </div>
              <div className="flex-1 space-y-2 overflow-y-auto py-3">
                {(thread.messages ?? []).map((m: any) => (
                  <div key={m.id} className={`max-w-[80%] rounded-2xl px-3 py-2 text-sm ${m.fromStaff ? "ml-auto bg-pm-red text-white" : "bg-pm-cream"}`}>
                    <p>{m.body}</p>
                    <p className={`mt-0.5 text-[10px] ${m.fromStaff ? "text-white/70" : "text-pm-ink/40"}`}>{m.authorName} · {new Date(m.createdAt).toLocaleTimeString("en-IN", { hour: "2-digit", minute: "2-digit" })}</p>
                  </div>
                ))}
              </div>
              <div className="flex gap-2 border-t border-pm-ink/10 pt-2">
                <input className={`${inputCls} flex-1`} placeholder="Reply…" value={reply} onChange={(e) => setReply(e.target.value)} onKeyDown={(e) => e.key === "Enter" && send()} />
                <button type="button" onClick={send} disabled={!reply} className="rounded-full bg-pm-red px-5 py-2 text-sm font-bold text-white hover:bg-pm-red-deep disabled:opacity-50">Send</button>
              </div>
            </div>
          )}
        </div>
      </div>
    </main>
  );
}
