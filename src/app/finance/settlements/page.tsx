"use client";

// Finance · Settlements — outstanding rider/vendor/branch dues + pay action.

import { useCallback, useEffect, useState } from "react";

type Party = { id: string; name: string; amount: number };
type Data = { outstanding: { riders: Party[]; vendors: Party[]; branches: Party[] }; history: Array<{ id: string; kind: string; partyName: string; amount: number; status: string; reference: string | null; createdAt: string }> };

export default function SettlementsPage() {
  const [data, setData] = useState<Data | null>(null);
  const [msg, setMsg] = useState<string | null>(null);

  const load = useCallback(async () => {
    const res = await fetch("/api/admin/settlements");
    const d = await res.json();
    if (d.ok) setData(d);
  }, []);
  useEffect(() => { load(); }, [load]);

  async function settle(kind: string, party: Party) {
    if (!window.confirm(`Settle ₹${party.amount} to ${party.name}? Do this after paying them out.`)) return;
    setMsg(null);
    const ref = window.prompt("Payment reference (UTR / cheque no), optional:") ?? undefined;
    const res = await fetch("/api/admin/settlements", {
      method: "POST", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ kind, partyId: party.id, amount: party.amount, reference: ref || undefined }),
    });
    const d = await res.json();
    if (!d.ok) { setMsg(d.error); return; }
    await load();
  }

  function Section({ title, kind, parties }: { title: string; kind: string; parties: Party[] }) {
    return (
      <div className="rounded-2xl bg-white p-4 shadow">
        <p className="text-sm font-bold">{title}</p>
        {parties.length === 0 ? (
          <p className="mt-2 text-sm text-pm-ink/50">Nothing outstanding.</p>
        ) : (
          <div className="mt-2 space-y-1.5">
            {parties.map((p) => (
              <div key={p.id} className="flex items-center justify-between">
                <span className="text-sm">{p.name}</span>
                <div className="flex items-center gap-2">
                  <span className="font-black text-green-700">₹{p.amount.toLocaleString("en-IN")}</span>
                  <button type="button" onClick={() => settle(kind, p)} className="rounded-full bg-pm-red px-3 py-1 text-xs font-bold text-white hover:bg-pm-red-deep">Settle</button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    );
  }

  return (
    <main className="mx-auto max-w-5xl px-4 py-8">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h1 className="text-2xl font-black">Settlements</h1>
        <a href="/api/admin/finance/export?dataset=settlements" className="rounded-full border border-pm-ink/20 px-4 py-2 text-sm font-semibold hover:bg-white">⬇ Export CSV</a>
      </div>
      {msg && <p className="mt-3 rounded-lg bg-pm-red/10 px-3 py-2 text-sm font-medium text-pm-red-deep">{msg}</p>}

      {!data ? (
        <p className="mt-6 text-sm text-pm-ink/50">Loading…</p>
      ) : (
        <>
          <div className="mt-4 grid grid-cols-1 gap-3 sm:grid-cols-3">
            <Section title="🛵 Riders" kind="RIDER" parties={data.outstanding.riders} />
            <Section title="🏪 Vendors" kind="VENDOR" parties={data.outstanding.vendors} />
            <Section title="🏢 Branches" kind="BRANCH" parties={data.outstanding.branches} />
          </div>

          <h2 className="mt-8 text-xs font-bold uppercase tracking-widest text-pm-ink/50">History</h2>
          <div className="mt-2 overflow-x-auto rounded-2xl bg-white shadow">
            <table className="w-full text-sm">
              <thead className="bg-pm-cream text-left text-xs uppercase tracking-wider text-pm-ink/50">
                <tr><th className="px-3 py-2">Date</th><th className="px-3 py-2">Kind</th><th className="px-3 py-2">Party</th><th className="px-3 py-2 text-right">Amount</th><th className="px-3 py-2">Reference</th></tr>
              </thead>
              <tbody>
                {data.history.length === 0 && <tr><td colSpan={5} className="px-3 py-6 text-center text-pm-ink/50">No settlements yet.</td></tr>}
                {data.history.map((h) => (
                  <tr key={h.id} className="border-t border-pm-ink/5">
                    <td className="px-3 py-2 text-pm-ink/60">{new Date(h.createdAt).toLocaleDateString("en-IN")}</td>
                    <td className="px-3 py-2">{h.kind}</td>
                    <td className="px-3 py-2">{h.partyName}</td>
                    <td className="px-3 py-2 text-right font-bold">₹{h.amount.toLocaleString("en-IN")}</td>
                    <td className="px-3 py-2 text-pm-ink/50">{h.reference ?? "—"}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </>
      )}
    </main>
  );
}
