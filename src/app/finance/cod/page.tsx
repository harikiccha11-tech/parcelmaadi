"use client";

// Finance · COD reconciliation.

import { useCallback, useEffect, useState } from "react";

type Data = {
  totalCodCollected: number; totalRemitted: number; outstanding: number;
  remittances: Array<{ id: string; amount: number; status: string; reference: string | null; riderName: string; createdAt: string }>;
};

export default function CodPage() {
  const [data, setData] = useState<Data | null>(null);
  const [riders, setRiders] = useState<Array<{ id: string; name: string }>>([]);
  const [form, setForm] = useState({ riderId: "", amount: "", reference: "" });
  const [msg, setMsg] = useState<string | null>(null);

  const load = useCallback(async () => {
    const [c, r] = await Promise.all([
      fetch("/api/admin/cod").then((x) => x.json()),
      fetch("/api/admin/riders-list").then((x) => x.json()).catch(() => ({ ok: false })),
    ]);
    if (c.ok) setData(c);
    if (r.ok && r.items) setRiders(r.items);
  }, []);
  useEffect(() => { load(); }, [load]);

  async function remit() {
    setMsg(null);
    const res = await fetch("/api/admin/cod", {
      method: "POST", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ riderId: form.riderId, amount: Number(form.amount), reference: form.reference || undefined }),
    });
    const d = await res.json();
    if (!d.ok) { setMsg(d.error); return; }
    setForm({ riderId: "", amount: "", reference: "" });
    await load();
  }

  const inputCls = "rounded-lg border border-pm-ink/20 px-3 py-2 text-sm outline-none focus:border-pm-red";

  return (
    <main className="mx-auto max-w-4xl px-4 py-8">
      <h1 className="text-2xl font-black">COD reconciliation</h1>

      {data && (
        <div className="mt-4 grid grid-cols-3 gap-3">
          <div className="rounded-2xl bg-white p-4 shadow"><p className="text-xs font-bold uppercase text-pm-ink/50">Collected</p><p className="mt-1 text-xl font-black">₹{data.totalCodCollected.toLocaleString("en-IN")}</p></div>
          <div className="rounded-2xl bg-white p-4 shadow"><p className="text-xs font-bold uppercase text-pm-ink/50">Remitted</p><p className="mt-1 text-xl font-black text-green-700">₹{data.totalRemitted.toLocaleString("en-IN")}</p></div>
          <div className={`rounded-2xl p-4 shadow ${data.outstanding > 0 ? "bg-amber-100" : "bg-white"}`}><p className="text-xs font-bold uppercase text-pm-ink/50">Outstanding</p><p className="mt-1 text-xl font-black text-pm-red">₹{data.outstanding.toLocaleString("en-IN")}</p></div>
        </div>
      )}

      <div className="mt-4 rounded-2xl bg-white p-4 shadow">
        <p className="text-sm font-bold">Record cash remittance</p>
        <div className="mt-2 grid grid-cols-1 gap-2 sm:grid-cols-4">
          <select className={inputCls} value={form.riderId} onChange={(e) => setForm({ ...form, riderId: e.target.value })}>
            <option value="">Select rider</option>
            {riders.map((r) => <option key={r.id} value={r.id}>{r.name}</option>)}
          </select>
          <input className={inputCls} placeholder="Amount ₹" value={form.amount} onChange={(e) => setForm({ ...form, amount: e.target.value.replace(/[^\d.]/g, "") })} />
          <input className={inputCls} placeholder="Reference" value={form.reference} onChange={(e) => setForm({ ...form, reference: e.target.value })} />
          <button type="button" onClick={remit} disabled={!form.riderId || !form.amount} className="rounded-full bg-pm-red px-4 py-2 text-sm font-bold text-white hover:bg-pm-red-deep disabled:opacity-50">Record</button>
        </div>
        {msg && <p className="mt-2 text-xs font-medium text-pm-red-deep">{msg}</p>}
      </div>

      {data && (
        <div className="mt-4 overflow-x-auto rounded-2xl bg-white shadow">
          <table className="w-full text-sm">
            <thead className="bg-pm-cream text-left text-xs uppercase tracking-wider text-pm-ink/50">
              <tr><th className="px-3 py-2">Date</th><th className="px-3 py-2">Rider</th><th className="px-3 py-2 text-right">Amount</th><th className="px-3 py-2">Reference</th></tr>
            </thead>
            <tbody>
              {data.remittances.length === 0 && <tr><td colSpan={4} className="px-3 py-6 text-center text-pm-ink/50">No remittances yet.</td></tr>}
              {data.remittances.map((r) => (
                <tr key={r.id} className="border-t border-pm-ink/5">
                  <td className="px-3 py-2 text-pm-ink/60">{new Date(r.createdAt).toLocaleDateString("en-IN")}</td>
                  <td className="px-3 py-2">{r.riderName}</td>
                  <td className="px-3 py-2 text-right font-bold">₹{r.amount.toLocaleString("en-IN")}</td>
                  <td className="px-3 py-2 text-pm-ink/50">{r.reference ?? "—"}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </main>
  );
}
