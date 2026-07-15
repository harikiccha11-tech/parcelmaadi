"use client";
import { useCallback, useEffect, useState } from "react";

type Metrics = { liveBookings: number; pendingAssign: number; inTransit: number; delayed: number; cancelledToday: number; marketPending: number; onlineRiders: number; livePayments: number; activeVendors: number; activeBranches: number; fleetActive: number; fleetDown: number; openExceptions: number };
type Sos = { id: string; name: string; phone: string; lat: number | null; lng: number | null; message: string | null; createdAt: string };
type Emergency = { id: string; bookingNumber: string; status: string; createdAt: string };

export default function OperationsPage() {
  const [metrics, setMetrics] = useState<Metrics | null>(null);
  const [emergencies, setEmergencies] = useState<Emergency[]>([]);
  const [sos, setSos] = useState<Sos[]>([]);

  const load = useCallback(async () => {
    const res = await fetch("/api/admin/operations");
    const d = await res.json();
    if (d.ok) { setMetrics(d.metrics); setEmergencies(d.emergencies); setSos(d.sos ?? []); }
  }, []);
  useEffect(() => { load(); const t = setInterval(load, 10000); return () => clearInterval(t); }, [load]);

  async function resolveSos(id: string) {
    await fetch("/api/admin/sos", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ id, action: "resolve" }) });
    await load();
  }

  const cards: Array<[string, number, string]> = metrics ? [
    ["Live bookings", metrics.liveBookings, "bg-white"],
    ["Pending assignment", metrics.pendingAssign, metrics.pendingAssign > 0 ? "bg-amber-100" : "bg-white"],
    ["In transit", metrics.inTransit, "bg-white"],
    ["Delayed (>2h)", metrics.delayed, metrics.delayed > 0 ? "bg-red-100" : "bg-white"],
    ["Cancelled today", metrics.cancelledToday, "bg-white"],
    ["Market orders open", metrics.marketPending, "bg-white"],
    ["Riders online", metrics.onlineRiders, "bg-white"],
    ["Payments to verify", metrics.livePayments, metrics.livePayments > 0 ? "bg-amber-100" : "bg-white"],
    ["Active vendors", metrics.activeVendors, "bg-white"],
    ["Active branches", metrics.activeBranches, "bg-white"],
    ["Fleet active", metrics.fleetActive, "bg-white"],
    ["Fleet in service/down", metrics.fleetDown, metrics.fleetDown > 0 ? "bg-amber-100" : "bg-white"],
    ["Open exceptions", metrics.openExceptions, metrics.openExceptions > 0 ? "bg-amber-100" : "bg-white"],
  ] : [];

  return (
    <main className="mx-auto max-w-6xl px-4 py-8">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-black">Operations Control Center</h1>
        <span className="flex items-center gap-1 text-xs font-semibold text-green-700"><span className="h-2 w-2 animate-pulse rounded-full bg-green-500" />Live · 10s</span>
      </div>

      {sos.length > 0 && (
        <div className="mt-4 rounded-2xl border-2 border-red-500 bg-red-100 p-4">
          <p className="text-sm font-black text-red-800">🆘 RIDER SOS — respond immediately ({sos.length})</p>
          <div className="mt-2 space-y-2">
            {sos.map((a) => (
              <div key={a.id} className="flex flex-wrap items-center justify-between gap-2 rounded-xl bg-white p-2 text-sm">
                <span><strong>{a.name}</strong> · <a href={`tel:${a.phone}`} className="font-bold text-pm-red underline">{a.phone}</a>{a.message ? ` · ${a.message}` : ""}</span>
                <span className="flex items-center gap-2">
                  {a.lat !== null && a.lng !== null && (
                    <a href={`https://maps.google.com/?q=${a.lat},${a.lng}`} target="_blank" rel="noreferrer" className="rounded-full bg-pm-ink px-3 py-1 text-xs font-bold text-pm-yellow">📍 Locate</a>
                  )}
                  <button type="button" onClick={() => resolveSos(a.id)} className="rounded-full bg-green-600 px-3 py-1 text-xs font-bold text-white hover:bg-green-700">Resolve</button>
                </span>
              </div>
            ))}
          </div>
        </div>
      )}

      {emergencies.length > 0 && (
        <div className="mt-4 rounded-2xl border-2 border-red-400 bg-red-50 p-4">
          <p className="text-sm font-black text-red-700">🚨 Active emergency bookings ({emergencies.length})</p>
          <div className="mt-2 flex flex-wrap gap-2">
            {emergencies.map((e) => (
              <a key={e.id} href={`/admin/bookings`} className="rounded-full bg-white px-3 py-1 text-xs font-bold text-red-700 shadow">{e.bookingNumber} · {e.status}</a>
            ))}
          </div>
        </div>
      )}

      <div className="mt-6 grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-5">
        {cards.map(([label, value, tone]) => (
          <div key={label} className={`rounded-2xl p-4 shadow ${tone}`}>
            <p className="text-xs font-bold uppercase tracking-wider text-pm-ink/50">{label}</p>
            <p className="mt-1 text-2xl font-black">{value}</p>
          </div>
        ))}
      </div>

      <div className="mt-6 flex flex-wrap gap-2">
        <a href="/admin/live" className="rounded-full bg-pm-ink px-4 py-2 text-sm font-bold text-pm-yellow hover:bg-pm-ink/80">Live GPS map →</a>
        <a href="/admin/dispatch" className="rounded-full bg-pm-red px-4 py-2 text-sm font-bold text-white hover:bg-pm-red-deep">Dispatch queue</a>
        <a href="/admin/fleet" className="rounded-full border border-pm-ink/20 px-4 py-2 text-sm font-semibold hover:bg-white">Fleet</a>
        <a href="/admin/bookings" className="rounded-full border border-pm-ink/20 px-4 py-2 text-sm font-semibold hover:bg-white">Bookings</a>
        <a href="/admin/marketplace" className="rounded-full border border-pm-ink/20 px-4 py-2 text-sm font-semibold hover:bg-white">Marketplace</a>
        <a href="/admin/payments" className="rounded-full border border-pm-ink/20 px-4 py-2 text-sm font-semibold hover:bg-white">Payments</a>
      </div>
    </main>
  );
}
