"use client";

// Account · Wallet — balance, UPI top-up, transaction history. Pay bookings
// and orders instantly from the wallet at checkout.

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";

export default function WalletPage() {
  const [balance, setBalance] = useState<number | null>(null);
  const [txns, setTxns] = useState<any[]>([]);
  const [form, setForm] = useState({ amount: "", reference: "" });
  const [msg, setMsg] = useState<string | null>(null);

  const load = useCallback(async () => {
    const res = await fetch("/api/wallet");
    if (res.status === 401) { window.location.href = "/login?next=/account/wallet"; return; }
    const d = await res.json();
    if (d.ok) { setBalance(d.balance); setTxns(d.transactions); }
  }, []);
  useEffect(() => { load(); }, [load]);

  async function topup() {
    setMsg(null);
    const res = await fetch("/api/wallet", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ amount: Number(form.amount), reference: form.reference }) });
    const d = await res.json();
    if (!d.ok) { setMsg(d.error); return; }
    setForm({ amount: "", reference: "" }); setMsg("Top-up added ✓"); await load();
  }

  return (
    <main className="mx-auto max-w-2xl px-4 py-8">
      <Link href="/account" className="text-sm font-semibold text-pm-ink/60 hover:text-pm-red">← My account</Link>
      <h1 className="mt-2 text-2xl font-black">My wallet</h1>

      <div className="mt-4 rounded-2xl bg-pm-ink p-6 text-center text-pm-cream shadow">
        <p className="text-xs font-bold uppercase tracking-widest text-pm-cream/60">Balance</p>
        <p className="mt-1 text-4xl font-black text-pm-yellow">₹{balance === null ? "—" : balance.toLocaleString("en-IN")}</p>
        <p className="mt-1 text-xs text-pm-cream/60">Use it to pay for bookings and orders instantly at checkout.</p>
      </div>

      <div className="mt-4 rounded-2xl bg-white p-4 shadow">
        <p className="text-sm font-bold">Top up via UPI</p>
        <p className="text-xs text-pm-ink/50">Pay to the ParcelMaadi UPI ID shown at checkout, then enter the amount and UTR reference here.</p>
        <div className="mt-2 flex flex-wrap gap-2">
          <input className="rounded-lg border border-pm-ink/20 px-3 py-2 text-sm outline-none focus:border-pm-red" placeholder="Amount ₹" value={form.amount} onChange={(e) => setForm({ ...form, amount: e.target.value.replace(/[^\d.]/g, "") })} />
          <input className="flex-1 rounded-lg border border-pm-ink/20 px-3 py-2 text-sm outline-none focus:border-pm-red" placeholder="UPI UTR reference" value={form.reference} onChange={(e) => setForm({ ...form, reference: e.target.value })} />
          <button type="button" onClick={topup} disabled={!form.amount || form.reference.length < 4} className="rounded-full bg-pm-red px-5 py-2 text-sm font-bold text-white hover:bg-pm-red-deep disabled:opacity-50">Add</button>
        </div>
        {msg && <p className="mt-2 text-sm font-medium text-pm-ink">{msg}</p>}
      </div>

      <h2 className="mt-6 text-xs font-bold uppercase tracking-widest text-pm-ink/50">History</h2>
      <div className="mt-2 space-y-1.5">
        {txns.length === 0 && <p className="rounded-2xl border border-dashed border-pm-ink/20 bg-white/60 p-6 text-center text-sm text-pm-ink/50">No transactions yet.</p>}
        {txns.map((t) => (
          <div key={t.id} className="flex items-center justify-between rounded-2xl bg-white p-3 text-sm shadow">
            <span><strong>{t.type}</strong>{t.note ? <span className="text-pm-ink/50"> · {t.note}</span> : null}<span className="block text-xs text-pm-ink/40">{new Date(t.createdAt).toLocaleString("en-IN")}</span></span>
            <span className={`font-black ${t.amount >= 0 ? "text-green-700" : "text-pm-red"}`}>{t.amount >= 0 ? "+" : ""}₹{Math.abs(t.amount).toLocaleString("en-IN")}</span>
          </div>
        ))}
      </div>
    </main>
  );
}
