"use client";

import { useCallback, useEffect, useState } from "react";

export default function DispatchPage() {
  const [data, setData] = useState<any>(null);
  const [filter, setFilter] = useState<string>("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const r = await fetch("/api/admin/dispatch");
      const j = await r.json();
      if (!j?.ok) throw new Error(j?.error);
      setData(j);
    } catch (e: any) {
      setError(e?.message || "Failed to load");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
    // Auto-refresh every 15s
    const t = setInterval(load, 15000);
    return () => clearInterval(t);
  }, [load]);

  const queue = (data?.queue || []).filter((b: any) => !filter || b.status === filter);

  return (
    <>
      <h1 className="text-2xl font-black">Dispatch board</h1>
      <p className="mt-1 text-sm text-pm-ink/60">Live dispatch queue + online riders. Auto-refreshes every 15s.</p>

      {data && (
        <section className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-5">
          <Kpi label="Queue" value={data.stats?.total} />
          <Kpi label="Unassigned" value={data.stats?.unassigned} accent="yellow" />
          <Kpi label="Assigned" value={data.stats?.assigned} />
          <Kpi label="Emergencies" value={data.stats?.emergencies} accent="red" />
          <Kpi label="Online riders" value={data.stats?.onlineRiders} accent="green" />
        </section>
      )}

      <div className="mt-4 flex flex-wrap gap-2">
        <button onClick={() => setFilter("")} className={`rounded-full px-3 py-1 text-xs font-bold ${filter === "" ? "bg-pm-red text-white" : "bg-pm-cream"}`}>All</button>
        {["New", "Confirmed", "Assigned", "Picked Up", "In Progress"].map((s) => (
          <button key={s} onClick={() => setFilter(s)} className={`rounded-full px-3 py-1 text-xs font-bold ${filter === s ? "bg-pm-red text-white" : "bg-pm-cream"}`}>{s}</button>
        ))}
        <button onClick={load} className="rounded-full bg-pm-yellow px-3 py-1 text-xs font-bold">⟳ Refresh</button>
      </div>

      {loading && <p className="mt-6 text-sm text-pm-ink/50">Loading dispatch queue…</p>}
      {error && <p className="mt-6 rounded-xl border border-pm-red/30 bg-pm-red/10 px-4 py-3 text-sm font-medium text-pm-red">{error}</p>}

      {!loading && !error && queue.length === 0 && (
        <p className="mt-6 text-sm text-pm-ink/50">Queue is empty — all caught up! ✓</p>
      )}

      {!loading && !error && queue.length > 0 && (
        <div className="mt-5 grid grid-cols-1 gap-3 lg:grid-cols-2">
          {queue.map((b: any) => (
            <div key={b.id} className={`rounded-2xl border bg-white p-4 shadow-sm ${b.isEmergency ? "border-pm-red/40 ring-1 ring-pm-red/20" : "border-black/5"}`}>
              <div className="flex flex-wrap items-baseline justify-between gap-2">
                <p className="font-bold">
                  {b.isEmergency && <span className="mr-2 text-pm-red">🚨</span>}
                  {b.bookingId}
                </p>
                <span className={`rounded-full px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider ${
                  b.status === "New" ? "bg-pm-yellow text-pm-ink"
                  : b.status === "Assigned" ? "bg-blue-100 text-blue-700"
                  : b.status === "Picked Up" || b.status === "In Progress" ? "bg-green-100 text-green-700"
                  : "bg-pm-cream text-pm-ink/60"
                }`}>{b.status}</span>
              </div>
              <div className="mt-2 text-xs text-pm-ink/70">
                <p>👤 {b.customer?.name} · 📞 {b.customer?.mobile}</p>
                <p>🚚 {b.service?.name} → {b.vehicle?.name || "—"}</p>
                <p>📍 {b.pickupAddress || "—"}</p>
                {b.rider && <p className="text-green-700">✓ Rider: {b.rider.name} ({b.rider.mobile})</p>}
                {!b.rider && <p className="text-amber-700">⚠ Unassigned</p>}
              </div>
            </div>
          ))}
        </div>
      )}
    </>
  );
}

function Kpi({ label, value, accent }: { label: string; value: any; accent?: "yellow" | "green" | "red" }) {
  const color = accent === "yellow" ? "text-pm-yellow-deep" : accent === "green" ? "text-green-600" : accent === "red" ? "text-pm-red" : "text-pm-ink";
  return (
    <div className="rounded-xl border border-black/5 bg-white px-3 py-2.5 shadow-sm">
      <p className="text-[10px] font-bold uppercase tracking-wider text-pm-ink/50">{label}</p>
      <p className={`mt-0.5 text-lg font-black tabular-nums ${color}`}>{value ?? "—"}</p>
    </div>
  );
}
