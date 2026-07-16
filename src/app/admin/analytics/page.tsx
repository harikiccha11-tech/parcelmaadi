"use client";

import { useCallback, useEffect, useState } from "react";

export default function AnalyticsPage() {
  const [data, setData] = useState<any>(null);
  const [days, setDays] = useState(7);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const r = await fetch(`/api/admin/analytics?days=${days}`);
      const j = await r.json();
      if (!j?.ok) throw new Error(j?.error || "Failed");
      setData(j);
    } catch (e: any) {
      setError(e?.message || "Failed to load analytics");
    } finally {
      setLoading(false);
    }
  }, [days]);

  useEffect(() => { load(); }, [load]);

  const card = "rounded-2xl border border-black/5 bg-white p-5 shadow-sm";

  return (
    <>
      <h1 className="text-2xl font-black">Analytics</h1>
      <p className="mt-1 text-sm text-pm-ink/60">Visitor traffic, top cities, device split, popular pages.</p>

      <div className="mt-4 flex items-center gap-2">
        <span className="text-xs font-bold uppercase tracking-wider text-pm-ink/50">Window:</span>
        {[1, 7, 30, 90].map((d) => (
          <button
            key={d}
            type="button"
            onClick={() => setDays(d)}
            className={`rounded-full px-3 py-1 text-xs font-bold transition-colors ${
              days === d ? "bg-pm-red text-white" : "bg-pm-cream text-pm-ink/70"
            }`}
          >
            {d}d
          </button>
        ))}
      </div>

      {loading && <p className="mt-6 text-sm text-pm-ink/50">Loading analytics…</p>}
      {error && <p className="mt-6 rounded-xl border border-pm-red/30 bg-pm-red/10 px-4 py-3 text-sm font-medium text-pm-red">{error}</p>}

      {data && !loading && (
        <>
          <section className="mt-5 grid grid-cols-2 gap-3 sm:grid-cols-3">
            <div className={card}>
              <p className="text-[10px] font-bold uppercase tracking-wider text-pm-ink/50">Total visits</p>
              <p className="mt-0.5 text-2xl font-black">{data.visitors?.total ?? 0}</p>
            </div>
            <div className={card}>
              <p className="text-[10px] font-bold uppercase tracking-wider text-pm-ink/50">Unique sessions</p>
              <p className="mt-0.5 text-2xl font-black">{data.visitors?.unique_sessions ?? 0}</p>
            </div>
            <div className={card}>
              <p className="text-[10px] font-bold uppercase tracking-wider text-pm-ink/50">Unique IPs</p>
              <p className="mt-0.5 text-2xl font-black">{data.visitors?.unique_ips ?? 0}</p>
            </div>
          </section>

          <section className="mt-5 grid grid-cols-1 gap-4 lg:grid-cols-2">
            <div className={card}>
              <h2 className="text-sm font-bold">🏙 Top cities</h2>
              <ul className="mt-2 space-y-1.5 text-sm">
                {(data.topCities || []).slice(0, 8).map((c: any) => (
                  <li key={c.city} className="flex items-baseline justify-between">
                    <span className="truncate text-pm-ink/80">{c.city}</span>
                    <span className="shrink-0 pl-2 font-semibold tabular-nums">{c.visits}</span>
                  </li>
                ))}
                {(!data.topCities || data.topCities.length === 0) && (
                  <li className="text-xs text-pm-ink/40">No visitors recorded in this window yet.</li>
                )}
              </ul>
            </div>

            <div className={card}>
              <h2 className="text-sm font-bold">📄 Popular pages</h2>
              <ul className="mt-2 space-y-1.5 text-sm">
                {(data.topPages || []).slice(0, 8).map((p: any) => (
                  <li key={p.page} className="flex items-baseline justify-between">
                    <span className="truncate font-mono text-xs text-pm-ink/80">{p.page}</span>
                    <span className="shrink-0 pl-2 font-semibold tabular-nums">{p.visits}</span>
                  </li>
                ))}
                {(!data.topPages || data.topPages.length === 0) && (
                  <li className="text-xs text-pm-ink/40">No page views recorded yet.</li>
                )}
              </ul>
            </div>

            <div className={card}>
              <h2 className="text-sm font-bold">📱 Devices</h2>
              <ul className="mt-2 space-y-1.5 text-sm">
                {(data.deviceSplit || []).map((d: any) => (
                  <li key={d.device} className="flex items-baseline justify-between">
                    <span className="truncate text-pm-ink/80">{d.device || "Unknown"}</span>
                    <span className="shrink-0 pl-2 font-semibold tabular-nums">{d.visits}</span>
                  </li>
                ))}
              </ul>
            </div>

            <div className={card}>
              <h2 className="text-sm font-bold">🔗 Referrers</h2>
              <ul className="mt-2 space-y-1.5 text-sm">
                {(data.referrerSplit || []).slice(0, 8).map((r: any) => (
                  <li key={r.referrer} className="flex items-baseline justify-between">
                    <span className="truncate font-mono text-xs text-pm-ink/80">{r.referrer || "Direct"}</span>
                    <span className="shrink-0 pl-2 font-semibold tabular-nums">{r.visits}</span>
                  </li>
                ))}
              </ul>
            </div>
          </section>

          {data.hourlyTraffic && data.hourlyTraffic.length > 0 && (
            <section className={`mt-5 ${card}`}>
              <h2 className="text-sm font-bold">⏰ Hourly traffic (last {data.window})</h2>
              <div className="mt-3 flex h-24 items-end gap-0.5">
                {Array.from({ length: 24 }).map((_, h) => {
                  const row = data.hourlyTraffic.find((x: any) => Number(x.hour) === h);
                  const visits = row?.visits || 0;
                  const max = Math.max(1, ...data.hourlyTraffic.map((x: any) => Number(x.visits) || 0));
                  return (
                    <div key={h} className="flex flex-1 flex-col items-center gap-1" title={`${h}:00 — ${visits} visits`}>
                      <div className="w-full rounded-t bg-pm-red" style={{ height: `${(visits / max) * 60}px` }} />
                      <span className="text-[8px] text-pm-ink/40">{h}</span>
                    </div>
                  );
                })}
              </div>
            </section>
          )}

          <p className="mt-4 text-xs text-pm-ink/40">
            Generated at {new Date(data.generatedAt).toLocaleString("en-IN")}
            {data.cached && " · cached"}
          </p>
        </>
      )}
    </>
  );
}
