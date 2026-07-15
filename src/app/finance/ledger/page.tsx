"use client";

// Finance · Ledger — income/expense entries with quick-add.

import { useCallback, useEffect, useState } from "react";

type Entry = { id: string; type: string; category: string; amount: number; note: string | null; entryDate: string };
const inputCls = "rounded-lg border border-pm-ink/20 px-3 py-2 text-sm outline-none focus:border-pm-red";

export default function LedgerPage() {
  const [entries, setEntries] = useState<Entry[]>([]);
  const [income, setIncome] = useState(0);
  const [expense, setExpense] = useState(0);
  const [form, setForm] = useState({ type: "EXPENSE", category: "", amount: "", note: "" });
  const [msg, setMsg] = useState<string | null>(null);

  const load = useCallback(async () => {
    const res = await fetch("/api/admin/ledger");
    const d = await res.json();
    if (d.ok) { setEntries(d.entries); setIncome(d.totalIncome); setExpense(d.totalExpense); }
  }, []);
  useEffect(() => { load(); }, [load]);

  async function add() {
    setMsg(null);
    const res = await fetch("/api/admin/ledger", {
      method: "POST", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ ...form, amount: Number(form.amount) }),
    });
    const d = await res.json();
    if (!d.ok) { setMsg(d.error); return; }
    setForm({ type: "EXPENSE", category: "", amount: "", note: "" });
    await load();
  }

  return (
    <main className="mx-auto max-w-5xl px-4 py-8">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h1 className="text-2xl font-black">Ledger</h1>
        <a href="/api/admin/finance/export?dataset=ledger" className="rounded-full border border-pm-ink/20 px-4 py-2 text-sm font-semibold hover:bg-white">⬇ Export CSV</a>
      </div>

      <div className="mt-4 grid grid-cols-3 gap-3">
        <div className="rounded-2xl bg-white p-4 shadow"><p className="text-xs font-bold uppercase text-pm-ink/50">Income</p><p className="mt-1 text-xl font-black text-green-700">₹{income.toLocaleString("en-IN")}</p></div>
        <div className="rounded-2xl bg-white p-4 shadow"><p className="text-xs font-bold uppercase text-pm-ink/50">Expense</p><p className="mt-1 text-xl font-black text-pm-red">₹{expense.toLocaleString("en-IN")}</p></div>
        <div className="rounded-2xl bg-white p-4 shadow"><p className="text-xs font-bold uppercase text-pm-ink/50">Net</p><p className="mt-1 text-xl font-black">₹{(income - expense).toLocaleString("en-IN")}</p></div>
      </div>

      <div className="mt-4 rounded-2xl bg-white p-4 shadow">
        <p className="text-sm font-bold">Quick add entry</p>
        <div className="mt-2 grid grid-cols-2 gap-2 sm:grid-cols-5">
          <select className={inputCls} value={form.type} onChange={(e) => setForm({ ...form, type: e.target.value })}>
            <option value="EXPENSE">Expense</option>
            <option value="INCOME">Income</option>
          </select>
          <input className={inputCls} placeholder="Category" value={form.category} onChange={(e) => setForm({ ...form, category: e.target.value })} />
          <input className={inputCls} placeholder="Amount ₹" value={form.amount} onChange={(e) => setForm({ ...form, amount: e.target.value.replace(/[^\d.]/g, "") })} />
          <input className={`${inputCls} sm:col-span-1`} placeholder="Note" value={form.note} onChange={(e) => setForm({ ...form, note: e.target.value })} />
          <button type="button" onClick={add} disabled={!form.category || !form.amount} className="rounded-full bg-pm-red px-4 py-2 text-sm font-bold text-white hover:bg-pm-red-deep disabled:opacity-50">Add</button>
        </div>
        {msg && <p className="mt-2 text-xs font-medium text-pm-red-deep">{msg}</p>}
      </div>

      <div className="mt-4 overflow-x-auto rounded-2xl bg-white shadow">
        <table className="w-full text-sm">
          <thead className="bg-pm-cream text-left text-xs uppercase tracking-wider text-pm-ink/50">
            <tr><th className="px-3 py-2">Date</th><th className="px-3 py-2">Type</th><th className="px-3 py-2">Category</th><th className="px-3 py-2">Note</th><th className="px-3 py-2 text-right">Amount</th></tr>
          </thead>
          <tbody>
            {entries.length === 0 && <tr><td colSpan={5} className="px-3 py-6 text-center text-pm-ink/50">No entries yet.</td></tr>}
            {entries.map((e) => (
              <tr key={e.id} className="border-t border-pm-ink/5">
                <td className="px-3 py-2 text-pm-ink/60">{new Date(e.entryDate).toLocaleDateString("en-IN")}</td>
                <td className="px-3 py-2"><span className={`rounded-full px-2 py-0.5 text-xs font-bold ${e.type === "INCOME" ? "bg-green-100 text-green-800" : "bg-red-100 text-red-800"}`}>{e.type}</span></td>
                <td className="px-3 py-2">{e.category}</td>
                <td className="px-3 py-2 text-pm-ink/50">{e.note}</td>
                <td className={`px-3 py-2 text-right font-bold ${e.type === "INCOME" ? "text-green-700" : "text-pm-red"}`}>₹{e.amount.toLocaleString("en-IN")}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </main>
  );
}
