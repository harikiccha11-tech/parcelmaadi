"use client";

import { useCallback, useEffect, useState } from "react";

export default function ReviewsPage() {
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const r = await fetch("/api/admin/reviews");
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
      <h1 className="text-2xl font-black">Reviews</h1>
      <p className="mt-1 text-sm text-pm-ink/60">Post-delivery feedback derived from completed bookings.</p>

      {data?.note && (
        <div className="mt-4 rounded-2xl border border-pm-yellow/30 bg-pm-yellow/10 p-3 text-xs text-pm-ink/80">
          <strong>Note:</strong> {data.note}
        </div>
      )}

      {loading && <p className="mt-6 text-sm text-pm-ink/50">Loading…</p>}
      {error && <p className="mt-6 rounded-xl border border-pm-red/30 bg-pm-red/10 px-4 py-3 text-sm font-medium text-pm-red">{error}</p>}

      {!loading && !error && data?.reviews?.length === 0 && (
        <p className="mt-6 text-sm text-pm-ink/50">No reviews yet.</p>
      )}

      {!loading && !error && data?.reviews?.length > 0 && (
        <div className="mt-5 grid grid-cols-1 gap-3 lg:grid-cols-2">
          {data.reviews.map((r: any) => (
            <div key={r.booking_id} className="rounded-2xl border border-black/5 bg-white p-4 shadow-sm">
              <div className="flex flex-wrap items-baseline justify-between gap-2">
                <p className="font-bold">{r.booking_number}</p>
                <span className="text-xs text-pm-ink/50">{new Date(r.created_at).toLocaleDateString("en-IN")}</span>
              </div>
              <p className="mt-1 text-xs text-pm-ink/70">
                👤 {r.customer_name} · 🚚 {r.service_name}{r.rider_name ? ` · 🛵 ${r.rider_name}` : ""}
              </p>
              {r.rider_rating && (
                <p className="mt-1 text-xs font-semibold text-pm-yellow-deep">⭐ {r.rider_rating} rider rating</p>
              )}
              {r.customer_notes && (
                <div className="mt-2 rounded-xl bg-pm-cream p-2 text-sm">
                  <p className="text-[10px] font-bold uppercase tracking-wider text-pm-ink/50">Customer note</p>
                  <p className="mt-0.5">{r.customer_notes}</p>
                </div>
              )}
              {r.admin_notes && (
                <div className="mt-2 rounded-xl bg-pm-ink/5 p-2 text-sm">
                  <p className="text-[10px] font-bold uppercase tracking-wider text-pm-ink/50">Admin note</p>
                  <p className="mt-0.5">{r.admin_notes}</p>
                </div>
              )}
              <p className="mt-2 text-xs text-pm-ink/50">₹{Math.round(r.final_estimate).toLocaleString("en-IN")} · {r.status}</p>
            </div>
          ))}
        </div>
      )}
    </>
  );
}
