"use client";

import { useCallback, useEffect, useState } from "react";

export default function MarketingPage() {
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const r = await fetch("/api/admin/marketing");
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

  const card = "rounded-2xl border border-black/5 bg-white p-5 shadow-sm";

  return (
    <>
      <h1 className="text-2xl font-black">Marketing</h1>
      <p className="mt-1 text-sm text-pm-ink/60">Offers, coupons, banners, waitlist signups.</p>

      {loading && <p className="mt-6 text-sm text-pm-ink/50">Loading…</p>}
      {error && <p className="mt-6 rounded-xl border border-pm-red/30 bg-pm-red/10 px-4 py-3 text-sm font-medium text-pm-red">{error}</p>}

      {data && !loading && (
        <>
          <section className="mt-5 grid grid-cols-2 gap-3 sm:grid-cols-4">
            <Kpi label="Active offers" value={data.summary?.activeOffers} />
            <Kpi label="Active coupons" value={data.summary?.activeCoupons} />
            <Kpi label="Active banners" value={data.summary?.activeBanners} />
            <Kpi label="Waitlist signups" value={data.summary?.waitlistCount} accent="green" />
          </section>

          {data.waitlistByDay && data.waitlistByDay.length > 0 && (
            <section className={`mt-5 ${card}`}>
              <h2 className="text-sm font-bold">📈 Waitlist signups (30d)</h2>
              <div className="mt-3 flex h-20 items-end gap-0.5">
                {data.waitlistByDay.map((d: any) => {
                  const max = Math.max(1, ...data.waitlistByDay.map((x: any) => Number(x.signups) || 0));
                  return (
                    <div key={d.date} className="flex flex-1 flex-col items-center" title={`${d.date}: ${d.signups} signups`}>
                      <div className="w-full rounded-t bg-pm-yellow-deep" style={{ height: `${(d.signups / max) * 60}px` }} />
                    </div>
                  );
                })}
              </div>
            </section>
          )}

          <section className="mt-5 grid grid-cols-1 gap-4 lg:grid-cols-3">
            <div className={card}>
              <h2 className="text-sm font-bold">🎁 Offers ({data.offers?.length || 0})</h2>
              <ul className="mt-2 max-h-72 space-y-2 overflow-y-auto pm-scroll text-sm">
                {(data.offers || []).slice(0, 10).map((o: any) => (
                  <li key={o.id} className="border-b border-black/5 pb-2">
                    <p className="font-medium">{o.title} <span className={`ml-1 rounded-full px-2 py-0.5 text-[10px] font-bold uppercase ${o.status === "Active" ? "bg-green-100 text-green-700" : "bg-pm-cream text-pm-ink/50"}`}>{o.status}</span></p>
                    <p className="text-xs text-pm-ink/60">{o.offerType} · ₹{o.value} {o.applicableServices ? `· ${o.applicableServices}` : ""}</p>
                  </li>
                ))}
                {(data.offers || []).length === 0 && <li className="text-xs text-pm-ink/40">No offers yet.</li>}
              </ul>
            </div>

            <div className={card}>
              <h2 className="text-sm font-bold">🏷 Coupons ({data.coupons?.length || 0})</h2>
              <ul className="mt-2 max-h-72 space-y-2 overflow-y-auto pm-scroll text-sm">
                {(data.coupons || []).slice(0, 10).map((c: any) => (
                  <li key={c.id} className="border-b border-black/5 pb-2">
                    <p className="font-mono font-medium">{c.code} <span className={`ml-1 rounded-full px-2 py-0.5 text-[10px] font-bold uppercase ${c.status === "Active" ? "bg-green-100 text-green-700" : "bg-pm-cream text-pm-ink/50"}`}>{c.status}</span></p>
                    <p className="text-xs text-pm-ink/60">{c.discountType} · {c.discountValue}{c.discountType === "percent" ? "%" : "₹"} · {c.usedCount}/{c.usageLimit || "∞"} used</p>
                  </li>
                ))}
                {(data.coupons || []).length === 0 && <li className="text-xs text-pm-ink/40">No coupons yet.</li>}
              </ul>
            </div>

            <div className={card}>
              <h2 className="text-sm font-bold">🖼 Banners ({data.banners?.length || 0})</h2>
              <ul className="mt-2 max-h-72 space-y-2 overflow-y-auto pm-scroll text-sm">
                {(data.banners || []).slice(0, 10).map((b: any) => (
                  <li key={b.id} className="border-b border-black/5 pb-2">
                    <p className="font-medium">{b.title} <span className={`ml-1 rounded-full px-2 py-0.5 text-[10px] font-bold uppercase ${b.status === "Active" ? "bg-green-100 text-green-700" : "bg-pm-cream text-pm-ink/50"}`}>{b.status}</span></p>
                    <p className="text-xs text-pm-ink/60">{b.position} · order {b.sortOrder}</p>
                  </li>
                ))}
                {(data.banners || []).length === 0 && <li className="text-xs text-pm-ink/40">No banners yet.</li>}
              </ul>
            </div>
          </section>
        </>
      )}
    </>
  );
}

function Kpi({ label, value, accent }: { label: string; value: any; accent?: "green" }) {
  const color = accent === "green" ? "text-green-600" : "text-pm-ink";
  return (
    <div className="rounded-xl border border-black/5 bg-white px-3 py-2.5 shadow-sm">
      <p className="text-[10px] font-bold uppercase tracking-wider text-pm-ink/50">{label}</p>
      <p className={`mt-0.5 text-lg font-black tabular-nums ${color}`}>{value ?? "—"}</p>
    </div>
  );
}
