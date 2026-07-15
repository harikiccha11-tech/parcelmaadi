"use client";

import { useCallback, useEffect, useState } from "react";

export default function InsightsPage() {
  const [data, setData] = useState<any>(null);
  const [series, setSeries] = useState<any[]>([]);
  const [days, setDays] = useState(30);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const [r1, r2] = await Promise.all([
        fetch("/api/admin/insights").then((r) => r.json()),
        fetch(`/api/admin/insights/series?days=${days}`).then((r) => r.json()),
      ]);
      if (!r1?.ok) throw new Error(r1?.error || "Failed");
      setData(r1);
      setSeries(r2?.series || []);
    } catch (e: any) {
      setError(e?.message || "Failed to load insights");
    } finally {
      setLoading(false);
    }
  }, [days]);

  useEffect(() => { load(); }, [load]);

  const card = "rounded-2xl border border-black/5 bg-white p-5 shadow-sm";

  if (loading) return <p className="mt-6 text-sm text-pm-ink/50">Loading insights…</p>;
  if (error) return <p className="mt-6 rounded-xl border border-pm-red/30 bg-pm-red/10 px-4 py-3 text-sm font-medium text-pm-red">{error}</p>;
  if (!data) return null;

  const k = data.kpis || {};
  const maxRev = Math.max(1, ...series.map((s: any) => Number(s.revenue) || 0));
  const maxBk = Math.max(1, ...series.map((s: any) => Number(s.bookings) || 0));

  return (
    <>
      <h1 className="text-2xl font-black">Insights</h1>
      <p className="mt-1 text-sm text-pm-ink/60">Business KPIs, revenue trends, top services & customers.</p>

      <section className="mt-5 grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-5">
        <Kpi label="Total bookings" value={k.totalBookings} />
        <Kpi label="This month" value={k.thisMonth} />
        <Kpi label="Revenue (all)" value={`₹${Math.round(k.revenue || 0).toLocaleString("en-IN")}`} accent="green" />
        <Kpi label="Avg booking" value={`₹${Math.round(k.avgBookingValue || 0).toLocaleString("en-IN")}`} />
        <Kpi label="Cancellation" value={`${k.cancellationRate ?? 0}%`} accent={Number(k.cancellationRate) > 15 ? "red" : undefined} />
      </section>

      <section className={`mt-5 ${card}`}>
        <div className="flex items-center justify-between">
          <h2 className="text-sm font-bold">📊 Bookings & revenue ({days}d)</h2>
          <div className="flex gap-1">
            {[7, 30, 90].map((d) => (
              <button key={d} type="button" onClick={() => setDays(d)}
                className={`rounded-full px-2.5 py-1 text-[11px] font-bold ${days === d ? "bg-pm-red text-white" : "bg-pm-cream text-pm-ink/70"}`}>
                {d}d
              </button>
            ))}
          </div>
        </div>
        {series.length === 0 ? (
          <p className="mt-3 text-sm text-pm-ink/40">No bookings in this window.</p>
        ) : (
          <div className="mt-4 flex h-32 items-end gap-1">
            {series.map((s: any) => {
              const rev = Number(s.revenue) || 0;
              const bk = Number(s.bookings) || 0;
              return (
                <div key={s.date} className="flex flex-1 flex-col items-center gap-1" title={`${s.date}: ${bk} bookings · ₹${Math.round(rev)}`}>
                  <div className="w-full rounded-t bg-pm-yellow" style={{ height: `${(rev / maxRev) * 50}px` }} />
                  <div className="w-full rounded-t bg-pm-red" style={{ height: `${(bk / maxBk) * 50}px` }} />
                  <span className="text-[8px] text-pm-ink/40">{String(s.date).slice(5)}</span>
                </div>
              );
            })}
          </div>
        )}
        <div className="mt-2 flex gap-3 text-[10px] font-semibold uppercase tracking-wider text-pm-ink/50">
          <span className="flex items-center gap-1"><span className="inline-block h-2 w-2 rounded-full bg-pm-yellow" /> Revenue</span>
          <span className="flex items-center gap-1"><span className="inline-block h-2 w-2 rounded-full bg-pm-red" /> Bookings</span>
        </div>
      </section>

      <section className="mt-5 grid grid-cols-1 gap-4 lg:grid-cols-2">
        <div className={card}>
          <h2 className="text-sm font-bold">🚚 Top services by revenue</h2>
          <ul className="mt-2 space-y-1.5 text-sm">
            {(data.revenueByService || []).slice(0, 8).map((s: any) => (
              <li key={s.service} className="flex items-baseline justify-between">
                <span className="truncate text-pm-ink/80">{s.service}</span>
                <span className="shrink-0 pl-2 font-semibold tabular-nums">₹{Math.round(s.revenue).toLocaleString("en-IN")}</span>
              </li>
            ))}
          </ul>
        </div>

        <div className={card}>
          <h2 className="text-sm font-bold">👤 Top customers</h2>
          <ul className="mt-2 space-y-1.5 text-sm">
            {(data.topCustomers || []).slice(0, 8).map((c: any, i: number) => (
              <li key={i} className="flex items-baseline justify-between">
                <span className="truncate text-pm-ink/80">{c.name || c.mobile}</span>
                <span className="shrink-0 pl-2 font-semibold tabular-nums">₹{Math.round(c.spend).toLocaleString("en-IN")}</span>
              </li>
            ))}
          </ul>
        </div>

        <div className={card}>
          <h2 className="text-sm font-bold">⏰ Peak hours (30d)</h2>
          <div className="mt-3 flex h-20 items-end gap-0.5">
            {(data.hourlyDistribution || []).map((h: any) => {
              const max = Math.max(1, ...data.hourlyDistribution.map((x: any) => Number(x.bookings) || 0));
              return (
                <div key={h.hour} className="flex flex-1 flex-col items-center" title={`${h.hour}:00 — ${h.bookings} bookings`}>
                  <div className="w-full rounded-t bg-pm-yellow-deep" style={{ height: `${(h.bookings / max) * 60}px` }} />
                </div>
              );
            })}
          </div>
          {data.peakHour && (
            <p className="mt-2 text-xs text-pm-ink/60">Peak hour: <strong>{data.peakHour.hour}:00</strong> ({data.peakHour.bookings} bookings)</p>
          )}
        </div>

        <div className={card}>
          <h2 className="text-sm font-bold">💡 Smart observations</h2>
          <ul className="mt-2 space-y-2 text-sm">
            {(data.insights || []).map((ins: any, i: number) => (
              <li key={i} className={`rounded-xl px-3 py-2 ${
                ins.kind === "positive" ? "bg-green-50 text-green-800"
                : ins.kind === "warning" ? "bg-amber-50 text-amber-800"
                : "bg-pm-cream text-pm-ink/80"
              }`}>
                <p className="font-bold">{ins.title}</p>
                <p className="text-xs opacity-80">{ins.detail}</p>
              </li>
            ))}
          </ul>
        </div>
      </section>

      <p className="mt-4 text-xs text-pm-ink/40">Generated at {new Date(data.generatedAt).toLocaleString("en-IN")}{data.cached && " · cached"}</p>
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
