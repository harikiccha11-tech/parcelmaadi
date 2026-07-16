"use client";

import { useCallback, useEffect, useState } from "react";

export default function CorporatePage() {
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const r = await fetch("/api/admin/corporate");
      const j = await r.json();
      if (!j?.ok) throw new Error(j?.error);
      setData(j);
    } catch (e: any) {
      setError(e?.message || "Failed to load");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { load(); }, [load]);

  return (
    <>
      <h1 className="text-2xl font-black">Corporate accounts</h1>
      <p className="mt-1 text-sm text-pm-ink/60">
        Corporate-account candidates derived from existing customer booking patterns (multiple bookings from the same email domain).
      </p>

      {loading && <p className="mt-6 text-sm text-pm-ink/50">Loading…</p>}
      {error && <p className="mt-6 rounded-xl border border-pm-red/30 bg-pm-red/10 px-4 py-3 text-sm font-medium text-pm-red">{error}</p>}

      {data && !loading && (
        <>
          <div className="mt-5 rounded-2xl border border-pm-yellow/30 bg-pm-yellow/10 p-4 text-sm text-pm-ink/80">
            <strong>Note:</strong> {data.note}
          </div>

          <div className="mt-5 overflow-hidden rounded-2xl border border-black/5 bg-white shadow-sm">
            <div className="max-h-[70vh] overflow-y-auto pm-scroll">
              <table className="w-full text-sm">
                <thead className="sticky top-0 bg-pm-cream text-xs uppercase tracking-wider text-pm-ink/60">
                  <tr>
                    <th className="px-3 py-2 text-left">Domain</th>
                    <th className="px-3 py-2 text-right">Users</th>
                    <th className="px-3 py-2 text-right">Bookings</th>
                    <th className="px-3 py-2 text-right">Revenue</th>
                    <th className="px-3 py-2 text-left">Last booking</th>
                  </tr>
                </thead>
                <tbody>
                  {(data.candidates || []).map((c: any) => (
                    <tr key={c.domain} className="border-t border-black/5 hover:bg-pm-cream/40">
                      <td className="px-3 py-2 font-medium">{c.domain}</td>
                      <td className="px-3 py-2 text-right tabular-nums">{c.users}</td>
                      <td className="px-3 py-2 text-right tabular-nums">{c.bookings}</td>
                      <td className="px-3 py-2 text-right font-semibold tabular-nums">₹{Math.round(c.revenue).toLocaleString("en-IN")}</td>
                      <td className="px-3 py-2 text-xs text-pm-ink/60">{c.last_booking_at ? new Date(c.last_booking_at).toLocaleDateString("en-IN") : "—"}</td>
                    </tr>
                  ))}
                  {(data.candidates || []).length === 0 && (
                    <tr><td colSpan={5} className="px-3 py-6 text-center text-sm text-pm-ink/50">No corporate candidates yet.</td></tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </>
      )}
    </>
  );
}
