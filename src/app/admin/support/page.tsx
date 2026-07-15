"use client";
import { useCallback, useEffect, useState } from "react";

type Ticket = { id: string; ticketNumber: string; subject: string; category: string; priority: string; status: string; reporterName: string; escalated: boolean; createdAt: string; _count: { messages: number } };
type Msg = { id: string; authorName: string; authorRole: string; body: string; isInternal: boolean; createdAt: string };
const inputCls = "rounded-lg border border-pm-ink/20 px-3 py-2 text-sm outline-none focus:border-pm-red";
const priColor: Record<string, string> = { URGENT: "bg-red-100 text-red-800", HIGH: "bg-amber-100 text-amber-800", NORMAL: "bg-blue-100 text-blue-800", LOW: "bg-pm-cream text-pm-ink/60" };

export default function SupportPage() {
  const [tickets, setTickets] = useState<Ticket[]>([]);
  const [open, setOpen] = useState<string | null>(null);
  const [thread, setThread] = useState<Msg[]>([]);
  const [reply, setReply] = useState("");
  const [internal, setInternal] = useState(false);
  const [createOpen, setCreateOpen] = useState(false);
  const [form, setForm] = useState({ subject: "", category: "BOOKING", priority: "NORMAL", reporterKind: "CUSTOMER", reporterName: "", reporterPhone: "", message: "" });

  const load = useCallback(async () => {
    const res = await fetch("/api/admin/tickets");
    const d = await res.json();
    if (d.ok) setTickets(d.tickets);
  }, []);
  useEffect(() => { load(); }, [load]);

  async function openTicket(id: string) {
    setOpen(id);
    const res = await fetch(`/api/admin/tickets/${id}`);
    const d = await res.json();
    if (d.ok) setThread(d.ticket.messages);
  }
  async function sendReply() {
    if (!open || !reply) return;
    await fetch(`/api/admin/tickets/${open}`, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ kind: "reply", body: reply, isInternal: internal }) });
    setReply(""); await openTicket(open); await load();
  }
  async function setStatus(status: string) {
    if (!open) return;
    await fetch(`/api/admin/tickets/${open}`, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ kind: "status", status }) });
    await load();
  }
  async function create() {
    const res = await fetch("/api/admin/tickets", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(form) });
    const d = await res.json();
    if (d.ok) { setCreateOpen(false); setForm({ subject: "", category: "BOOKING", priority: "NORMAL", reporterKind: "CUSTOMER", reporterName: "", reporterPhone: "", message: "" }); await load(); }
  }

  return (
    <main className="mx-auto max-w-6xl px-4 py-8">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h1 className="text-2xl font-black">Customer support</h1>
        <button type="button" onClick={() => setCreateOpen((v) => !v)} className="rounded-full bg-pm-red px-5 py-2 text-sm font-bold text-white hover:bg-pm-red-deep">{createOpen ? "Close" : "+ New ticket"}</button>
      </div>

      {createOpen && (
        <div className="mt-4 rounded-2xl bg-white p-5 shadow">
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
            <input className={inputCls} placeholder="Subject" value={form.subject} onChange={(e) => setForm({ ...form, subject: e.target.value })} />
            <select className={inputCls} value={form.category} onChange={(e) => setForm({ ...form, category: e.target.value })}>{["BOOKING","PAYMENT","DELIVERY","VENDOR","RIDER","APP","OTHER"].map((c) => <option key={c}>{c}</option>)}</select>
            <select className={inputCls} value={form.priority} onChange={(e) => setForm({ ...form, priority: e.target.value })}>{["LOW","NORMAL","HIGH","URGENT"].map((c) => <option key={c}>{c}</option>)}</select>
            <select className={inputCls} value={form.reporterKind} onChange={(e) => setForm({ ...form, reporterKind: e.target.value })}>{["CUSTOMER","RIDER","VENDOR","BRANCH","GUEST"].map((c) => <option key={c}>{c}</option>)}</select>
            <input className={inputCls} placeholder="Reporter name" value={form.reporterName} onChange={(e) => setForm({ ...form, reporterName: e.target.value })} />
            <input className={inputCls} placeholder="Reporter phone" value={form.reporterPhone} onChange={(e) => setForm({ ...form, reporterPhone: e.target.value })} />
          </div>
          <textarea className={`${inputCls} mt-2 w-full`} rows={2} placeholder="First message (optional)" value={form.message} onChange={(e) => setForm({ ...form, message: e.target.value })} />
          <button type="button" onClick={create} disabled={!form.subject || !form.reporterName} className="mt-2 rounded-full bg-pm-red px-6 py-2 text-sm font-bold text-white hover:bg-pm-red-deep disabled:opacity-50">Create ticket</button>
        </div>
      )}

      <div className="mt-4 grid grid-cols-1 gap-4 lg:grid-cols-2">
        <div className="space-y-2">
          {tickets.length === 0 && <p className="rounded-2xl border border-dashed border-pm-ink/20 bg-white/60 p-8 text-center text-sm text-pm-ink/50">No tickets.</p>}
          {tickets.map((t) => (
            <button type="button" key={t.id} onClick={() => openTicket(t.id)} className={`w-full rounded-2xl bg-white p-4 text-left shadow hover:shadow-md ${open === t.id ? "ring-2 ring-pm-red" : ""}`}>
              <div className="flex items-center justify-between">
                <span className="font-mono text-xs font-bold">{t.ticketNumber}{t.escalated ? " 🚩" : ""}</span>
                <span className={`rounded-full px-2 py-0.5 text-[10px] font-bold ${priColor[t.priority]}`}>{t.priority}</span>
              </div>
              <p className="mt-1 text-sm font-semibold">{t.subject}</p>
              <p className="text-xs text-pm-ink/50">{t.category} · {t.reporterName} · {t.status} · {t._count.messages} msgs</p>
            </button>
          ))}
        </div>

        <div>
          {open ? (
            <div className="rounded-2xl bg-white p-4 shadow">
              <div className="mb-2 flex flex-wrap gap-1.5">
                {["IN_PROGRESS","ESCALATED","RESOLVED","CLOSED"].map((s) => (
                  <button type="button" key={s} onClick={() => setStatus(s)} className="rounded-full bg-pm-cream px-3 py-1 text-xs font-bold hover:bg-pm-yellow/40">{s.replace("_"," ")}</button>
                ))}
              </div>
              <div className="max-h-80 space-y-2 overflow-y-auto">
                {thread.map((m) => (
                  <div key={m.id} className={`rounded-xl p-2 text-sm ${m.isInternal ? "bg-amber-50" : "bg-pm-cream"}`}>
                    <p className="text-xs font-bold text-pm-ink/60">{m.authorName} · {m.authorRole}{m.isInternal ? " · internal note" : ""}</p>
                    <p>{m.body}</p>
                  </div>
                ))}
              </div>
              <div className="mt-2">
                <textarea className={`${inputCls} w-full`} rows={2} placeholder="Reply…" value={reply} onChange={(e) => setReply(e.target.value)} />
                <div className="mt-1 flex items-center justify-between">
                  <label className="flex items-center gap-1 text-xs"><input type="checkbox" checked={internal} onChange={(e) => setInternal(e.target.checked)} className="accent-pm-red" /> Internal note</label>
                  <button type="button" onClick={sendReply} disabled={!reply} className="rounded-full bg-pm-red px-4 py-1.5 text-xs font-bold text-white hover:bg-pm-red-deep disabled:opacity-50">Send</button>
                </div>
              </div>
            </div>
          ) : (
            <p className="rounded-2xl border border-dashed border-pm-ink/20 bg-white/60 p-8 text-center text-sm text-pm-ink/50">Select a ticket to view the thread.</p>
          )}
        </div>
      </div>
    </main>
  );
}
