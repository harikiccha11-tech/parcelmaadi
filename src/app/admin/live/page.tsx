"use client";

import { useCallback, useEffect, useState } from "react";

export default function LivePage() {
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    try {
      const r = await fetch("/api/admin/live");
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
    const t = setInterval(load, 10000);
    return () => clearInterval(t);
  }, [load]);

  return (
    <>
      <h1 className="text-2xl font-black">Live tracking</h1>
      <p className="mt-1 text-sm text-pm-ink/60">Active bookings + online riders. Auto-refreshes every 10s.</p>

      {data && (
        <section className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-4 lg:grid-cols-7">
          <Kpi label="Active" value={data.stats?.active} />
          <Kpi label="New" value={data.stats?.new} />
          <Kpi label="Confirmed" value={data.stats?.confirmed} />
          <Kpi label="Assigned" value={data.stats?.assigned} />
          <Kpi label="In transit" value={data.stats?.inTransit} accent="green" />
          <Kpi label="Emergency" value={data.stats?.emergencies} accent="red" />
          <Kpi label="Online riders" value={data.stats?.onlineRiders} accent="green" />
        </section>
      )}

      {loading && <p className="mt-6 text-sm text-pm-ink/50">Loading live data…</p>}
      {error && <p className="mt-6 rounded-xl border border-pm-red/30 bg-pm-red/10 px-4 py-3 text-sm font-medium text-pm-red">{error}</p>}

      {data && !loading && (
        <section className="mt-5 grid grid-cols-1 gap-4 lg:grid-cols-2">
          <div className="rounded-2xl border border-black/5 bg-white p-5 shadow-sm">
            <h2 className="text-sm font-bold">🚚 Active bookings ({data.active?.length || 0})</h2>
            <div className="mt-3 max-h-[60vh] space-y-2 overflow-y-auto pm-scroll">
              {(data.active || []).map((b: any) => (
                <div key={b.id} className={`rounded-xl border p-3 ${b.isEmergency ? "border-pm-red/40" : "border-black/5"}`}>
                  <div className="flex flex-wrap items-baseline justify-between">
                    <p className="font-bold text-sm">{b.isEmergency && "🚨 "}{b.bookingId}</p>
                    <span className="text-xs text-pm-ink/50">{b.status}</span>
                  </div>
                  <p className="mt-1 text-xs text-pm-ink/70">👤 {b.customer?.name} · 📞 {b.customer?.mobile}</p>
                  <p className="text-xs text-pm-ink/70">🚚 {b.service?.name} → {b.vehicle?.name || "—"}</p>
                  {b.pickupLat && b.pickupLng && (
                    <p className="mt-1 text-[10px] text-pm-ink/40">
                      📍 {b.pickupLat.toFixed(4)}, {b.pickupLng.toFixed(4)}
                      {b.dropLat && b.dropLng && ` → ${b.dropLat.toFixed(4)}, ${b.dropLng.toFixed(4)}`}
                    </p>
                  )}
                  {b.rider && (
                    <p className="mt-1 text-xs text-green-700">✓ {b.rider.name} ({b.rider.mobile}){b.rider.isOnline ? " · online" : " · offline"}</p>
                  )}
                </div>
              ))}
              {(data.active || []).length === 0 && <p className="text-sm text-pm-ink/50">No active bookings right now.</p>}
            </div>
          </div>

          <div className="rounded-2xl border border-black/5 bg-white p-5 shadow-sm">
            <h2 className="text-sm font-bold">🛵 Online riders ({data.onlineRiders?.length || 0})</h2>
            <div className="mt-3 max-h-[60vh] space-y-2 overflow-y-auto pm-scroll">
              {(data.onlineRiders || []).map((r: any) => (
                <div key={r.id} className="rounded-xl border border-black/5 p-3">
                  <div className="flex flex-wrap items-baseline justify-between">
                    <p className="font-bold text-sm">{r.name}</p>
                    <span className="text-xs text-green-600">● online</span>
                  </div>
                  <p className="mt-1 text-xs text-pm-ink/70">📞 {r.mobile} · 🛵 {r.vehicleType || "—"}</p>
                  {r.vehicleNumber && <p className="text-xs text-pm-ink/70">🚦 {r.vehicleNumber}</p>}
                  <p className="mt-1 text-xs text-pm-ink/60">⭐ {r.rating} · {r.totalDeliveries} deliveries</p>
                  {r.currentLat && r.currentLng && (
                    <p className="mt-1 text-[10px] text-pm-ink/40">📍 {r.currentLat.toFixed(4)}, {r.currentLng.toFixed(4)}</p>
                  )}
                </div>
              ))}
              {(data.onlineRiders || []).length === 0 && <p className="text-sm text-pm-ink/50">No riders online.</p>}
            </div>
          </div>
        </section>
      )}
    </>
  );
}

function Kpi({ label, value, accent }: { label: string; value: any; accent?: "green" | "red" }) {
  const color = accent === "green" ? "text-green-600" : accent === "red" ? "text-pm-red" : "text-pm-ink";
  return (
    <div className="rounded-xl border border-black/5 bg-white px-3 py-2.5 shadow-sm">
      <p className="text-[10px] font-bold uppercase tracking-wider text-pm-ink/50">{label}</p>
      <p className={`mt-0.5 text-lg font-black tabular-nums ${color}`}>{value ?? "—"}</p>
    </div>
  );
}
