"use client";

// Finance · Ops Dashboard — refunds, failed payments, payouts/TDS, credit &
// debit notes, charges, batch daily settlement.

import { useCallback, useEffect, useState } from "react";

const inputCls = "rounded-lg border border-pm-ink/20 px-3 py-2 text-sm outline-none focus:border-pm-red";
const money = (n: number) => `₹${Number(n).toLocaleString("en-IN")}`;

export default function FinanceOpsDashboard() {
  const [d, setD] = useState<any>(null);
  const [refunds, setRefunds] = useState<any[]>([]);
  const [notes, setNotes] = useState<any[]>([]);
  const [msg, setMsg] = useState<string | null>(null);
  const [note, setNote] = useState({ kind: "CREDIT", partyName: "", amount: "", gstAmount: "0", reason: "" });
  const [charge, setCharge] = useState({ kind: "CANCELLATION", bookingId: "", amount: "", deductFromWallet: false });
  const [batch, setBatch] = useState({ kind: "RIDER", tdsPercent: "1" });
  const [range, setRange] = useState({ granularity: "day", from: "", to: "" });

  const load = useCallback(async () => {
    const [a, b, c] = await Promise.all([
      fetch("/api/admin/finance/dashboard").then((r) => r.json()),
      fetch("/api/admin/refunds?status=PENDING").then((r) => r.json()),
      fetch("/api/admin/notes").then((r) => r.json()),
    ]);
    if (a.ok) setD(a);
    if (b.ok) setRefunds(b.refunds);
    if (c.ok) setNotes(c.notes.slice(0, 8));
  }, []);
  useEffect(() => { load(); }, [load]);

  async function decideRefund(id: string, action: string) {
    await fetch(`/api/admin/refunds/${id}`, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ action }) });
    await load();
  }
  async function createNote() {
    setMsg(null);
    const res = await fetch("/api/admin/notes", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ ...note, amount: Number(note.amount), gstAmount: Number(note.gstAmount || 0) }) });
    const x = await res.json();
    if (!x.ok) { setMsg(x.error); return; }
    setNote({ kind: "CREDIT", partyName: "", amount: "", gstAmount: "0", reason: "" });
    window.open(`/api/admin/notes/${x.note.id}/pdf`, "_blank");
    await load();
  }
  async function applyCharge() {
    setMsg(null);
    const res = await fetch("/api/admin/finance/charges", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ ...charge, amount: Number(charge.amount) }) });
    const x = await res.json();
    setMsg(x.ok ? "Charge recorded ✓" : x.error);
    if (x.ok) { setCharge({ kind: "CANCELLATION", bookingId: "", amount: "", deductFromWallet: false }); await load(); }
  }
  async function runBatch() {
    if (!window.confirm(`Batch-settle ALL outstanding ${batch.kind} balances with ${batch.tdsPercent}% TDS?`)) return;
    const res = await fetch("/api/admin/finance/daily-settlement", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ kind: batch.kind, tdsPercent: Number(batch.tdsPercent) }) });
    const x = await res.json();
    setMsg(x.ok ? `Settled ${x.settled} parties — ₹${x.totalPaid} paid, ₹${x.totalTds} TDS` : x.error);
    await load();
  }

  const reportUrl = (format: string) => `/api/admin/finance/report?granularity=${range.granularity}${range.from ? `&from=${range.from}` : ""}${range.to ? `&to=${range.to}` : ""}&format=${format}`;

  return (
    <main className="mx-auto max-w-6xl px-4 py-8">
      <h1 className="text-2xl font-black">Financial operations</h1>
      {msg && <p className="mt-2 rounded-lg bg-pm-yellow/40 px-3 py-2 text-sm font-medium">{msg}</p>}

      {d && (
        <div className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-4 lg:grid-cols-7">
          {[["Revenue (mo)", d.revenue], ["Expenses (mo)", d.expenses], ["Profit (mo)", d.profit],
            ["Riders due", d.pendingSettlements.riders], ["Vendors due", d.pendingSettlements.vendors],
            ["Payouts 30d", d.payouts30.amount], ["Wallet float", d.customerWalletFloat]].map(([l, v]) => (
            <div key={l as string} className="rounded-2xl bg-white p-3 shadow">
              <p className="text-[10px] font-bold uppercase tracking-wider text-pm-ink/50">{l}</p>
              <p className="mt-1 text-base font-black">{money(v as number)}</p>
            </div>
          ))}
        </div>
      )}

      <div className="mt-5 grid grid-cols-1 gap-4 lg:grid-cols-2">
        <div className="rounded-2xl bg-white p-4 shadow">
          <p className="text-sm font-bold">Pending refunds {d ? `(${d.refunds.pendingCount} · ${money(d.refunds.pendingAmount)})` : ""}</p>
          <div className="mt-2 space-y-1.5">
            {refunds.length === 0 && <p className="text-sm text-pm-ink/50">None pending.</p>}
            {refunds.map((r) => (
              <div key={r.id} className="flex items-center justify-between rounded-xl bg-pm-cream p-2 text-sm">
                <span>{money(r.amount)} · {r.method} · {r.reason.slice(0, 40)}</span>
                <span className="flex gap-1.5">
                  <button type="button" onClick={() => decideRefund(r.id, "process")} className="rounded-full bg-green-600 px-3 py-1 text-xs font-bold text-white">Process</button>
                  <button type="button" onClick={() => decideRefund(r.id, "reject")} className="rounded-full bg-red-100 px-3 py-1 text-xs font-bold text-red-800">Reject</button>
                </span>
              </div>
            ))}
          </div>
          {d && d.failedPayments.length > 0 && (
            <p className="mt-3 text-xs text-pm-ink/50">Failed payments (recent): {d.failedPayments.length} · {money(d.failedPayments.reduce((s: number, p: any) => s + p.amount, 0))}</p>
          )}
        </div>

        <div className="rounded-2xl bg-white p-4 shadow">
          <p className="text-sm font-bold">Batch daily settlement (TDS-aware)</p>
          <div className="mt-2 flex flex-wrap gap-2">
            <select className={inputCls} value={batch.kind} onChange={(e) => setBatch({ ...batch, kind: e.target.value })}>{["RIDER", "VENDOR", "BRANCH"].map((k) => <option key={k}>{k}</option>)}</select>
            <input className={`${inputCls} w-24`} value={batch.tdsPercent} onChange={(e) => setBatch({ ...batch, tdsPercent: e.target.value.replace(/[^\d.]/g, "") })} placeholder="TDS %" />
            <button type="button" onClick={runBatch} className="rounded-full bg-pm-red px-5 py-2 text-sm font-bold text-white hover:bg-pm-red-deep">Settle all</button>
          </div>
          <p className="mt-2 text-xs text-pm-ink/50">Vehicle owners: machinery/water-tanker owners settle as VENDOR; goods-vehicle (rider-owned) as RIDER. TDS withheld posts to the ledger.</p>

          <p className="mt-4 text-sm font-bold">Cancellation / waiting charge</p>
          <div className="mt-2 grid grid-cols-2 gap-2 sm:grid-cols-4">
            <select className={inputCls} value={charge.kind} onChange={(e) => setCharge({ ...charge, kind: e.target.value })}><option>CANCELLATION</option><option>WAITING</option></select>
            <input className={inputCls} placeholder="Booking ID" value={charge.bookingId} onChange={(e) => setCharge({ ...charge, bookingId: e.target.value })} />
            <input className={inputCls} placeholder="₹" value={charge.amount} onChange={(e) => setCharge({ ...charge, amount: e.target.value.replace(/[^\d.]/g, "") })} />
            <button type="button" onClick={applyCharge} disabled={!charge.bookingId || !charge.amount} className="rounded-full bg-pm-ink px-4 py-2 text-xs font-bold text-pm-yellow disabled:opacity-50">Apply</button>
          </div>
          <label className="mt-1 flex items-center gap-1.5 text-xs"><input type="checkbox" checked={charge.deductFromWallet} onChange={(e) => setCharge({ ...charge, deductFromWallet: e.target.checked })} className="accent-pm-red" /> Deduct from customer wallet</label>
        </div>
      </div>

      <div className="mt-4 rounded-2xl bg-white p-4 shadow">
        <p className="text-sm font-bold">Credit / debit notes</p>
        <div className="mt-2 grid grid-cols-2 gap-2 sm:grid-cols-6">
          <select className={inputCls} value={note.kind} onChange={(e) => setNote({ ...note, kind: e.target.value })}><option>CREDIT</option><option>DEBIT</option></select>
          <input className={inputCls} placeholder="Party" value={note.partyName} onChange={(e) => setNote({ ...note, partyName: e.target.value })} />
          <input className={inputCls} placeholder="Amount ₹" value={note.amount} onChange={(e) => setNote({ ...note, amount: e.target.value.replace(/[^\d.]/g, "") })} />
          <input className={inputCls} placeholder="GST ₹" value={note.gstAmount} onChange={(e) => setNote({ ...note, gstAmount: e.target.value.replace(/[^\d.]/g, "") })} />
          <input className={inputCls} placeholder="Reason" value={note.reason} onChange={(e) => setNote({ ...note, reason: e.target.value })} />
          <button type="button" onClick={createNote} disabled={!note.partyName || !note.amount || !note.reason} className="rounded-full bg-pm-red px-4 py-2 text-xs font-bold text-white hover:bg-pm-red-deep disabled:opacity-50">Issue + Print</button>
        </div>
        <div className="mt-2 space-y-1 text-sm">
          {notes.map((n) => (
            <div key={n.id} className="flex justify-between text-pm-ink/70">
              <span>{n.noteNumber} · {n.partyName} · {n.reason.slice(0, 30)}</span>
              <span className="flex gap-2 font-bold">{money(n.amount + n.gstAmount)}<a className="text-pm-red hover:underline font-bold" href={`/api/admin/notes/${n.id}/pdf`} target="_blank" rel="noreferrer">PDF</a></span>
            </div>
          ))}
        </div>
      </div>

      <div className="mt-4 rounded-2xl bg-white p-4 shadow">
        <p className="text-sm font-bold">Financial reports</p>
        <div className="mt-2 flex flex-wrap items-center gap-2">
          <select className={inputCls} value={range.granularity} onChange={(e) => setRange({ ...range, granularity: e.target.value })}>{["day", "week", "month", "year"].map((x) => <option key={x}>{x}</option>)}</select>
          <input type="date" className={inputCls} value={range.from} onChange={(e) => setRange({ ...range, from: e.target.value })} />
          <span className="text-xs text-pm-ink/40">→</span>
          <input type="date" className={inputCls} value={range.to} onChange={(e) => setRange({ ...range, to: e.target.value })} />
          <a href={reportUrl("csv")} className="rounded-full border border-pm-ink/20 px-4 py-2 text-sm font-semibold hover:bg-pm-cream">⬇ CSV</a>
          <a href={reportUrl("pdf")} target="_blank" rel="noreferrer" className="rounded-full bg-pm-ink px-4 py-2 text-sm font-bold text-pm-yellow">🖨 PDF</a>
        </div>
      </div>
    </main>
  );
}
