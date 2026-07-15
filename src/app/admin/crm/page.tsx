"use client";

import { useCallback, useEffect, useState } from "react";

export default function CrmPage() {
  const [tab, setTab] = useState<"customers" | "leads">("customers");
  const [customers, setCustomers] = useState<any[]>([]);
  const [leads, setLeads] = useState<any[]>([]);
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      if (tab === "customers") {
        const params = new URLSearchParams({ take: "100" });
        if (search) params.set("search", search);
        const r = await fetch(`/api/admin/crm/customers?${params}`);
        const j = await r.json();
        if (!j?.ok) throw new Error(j?.error);
        setCustomers(j.customers || []);
      } else {
        const r = await fetch(`/api/admin/crm/leads`);
        const j = await r.json();
        if (!j?.ok) throw new Error(j?.error);
        setLeads(j.leads || []);
      }
    } catch (e: any) {
      setError(e?.message || "Failed to load CRM");
    } finally {
      setLoading(false);
    }
  }, [tab, search]);

  useEffect(() => { load(); }, [load]);

  return (
    <>
      <h1 className="text-2xl font-black">CRM</h1>
      <p className="mt-1 text-sm text-pm-ink/60">Customer book-of-record, leads from waitlist & recent signups.</p>

      <div className="mt-4 flex gap-2">
        <button type="button" onClick={() => setTab("customers")}
          className={`rounded-full px-4 py-1.5 text-xs font-bold ${tab === "customers" ? "bg-pm-red text-white" : "bg-pm-cream text-pm-ink/70"}`}>
          Customers
        </button>
        <button type="button" onClick={() => setTab("leads")}
          className={`rounded-full px-4 py-1.5 text-xs font-bold ${tab === "leads" ? "bg-pm-red text-white" : "bg-pm-cream text-pm-ink/70"}`}>
          Leads
        </button>
      </div>

      {tab === "customers" && (
        <input
          type="text"
          placeholder="Search by name or mobile…"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="mt-4 w-full max-w-md rounded-full border border-pm-ink/15 bg-white px-4 py-2 text-sm"
        />
      )}

      {loading && <p className="mt-6 text-sm text-pm-ink/50">Loading…</p>}
      {error && <p className="mt-6 rounded-xl border border-pm-red/30 bg-pm-red/10 px-4 py-3 text-sm font-medium text-pm-red">{error}</p>}

      {!loading && !error && tab === "customers" && (
        <div className="mt-5 overflow-hidden rounded-2xl border border-black/5 bg-white shadow-sm">
          <div className="max-h-[70vh] overflow-y-auto pm-scroll">
            <table className="w-full text-sm">
              <thead className="sticky top-0 bg-pm-cream text-xs uppercase tracking-wider text-pm-ink/60">
                <tr>
                  <th className="px-3 py-2 text-left">Name</th>
                  <th className="px-3 py-2 text-left">Mobile</th>
                  <th className="px-3 py-2 text-right">Bookings</th>
                  <th className="px-3 py-2 text-right">Delivered</th>
                  <th className="px-3 py-2 text-right">Cancelled</th>
                  <th className="px-3 py-2 text-right">Total spend</th>
                  <th className="px-3 py-2 text-left">Last booking</th>
                </tr>
              </thead>
              <tbody>
                {customers.map((c) => (
                  <tr key={c.id} className="border-t border-black/5 hover:bg-pm-cream/40">
                    <td className="px-3 py-2 font-medium">{c.name || "—"}</td>
                    <td className="px-3 py-2">{c.mobile || "—"}</td>
                    <td className="px-3 py-2 text-right tabular-nums">{c.bookings ?? 0}</td>
                    <td className="px-3 py-2 text-right tabular-nums">{c.delivered ?? 0}</td>
                    <td className="px-3 py-2 text-right tabular-nums">{c.cancelled ?? 0}</td>
                    <td className="px-3 py-2 text-right font-semibold tabular-nums">₹{Math.round(c.total_spend || 0).toLocaleString("en-IN")}</td>
                    <td className="px-3 py-2 text-xs text-pm-ink/60">{c.last_booking_at ? new Date(c.last_booking_at).toLocaleDateString("en-IN") : "—"}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {!loading && !error && tab === "leads" && (
        <div className="mt-5 grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {leads.map((l) => (
            <div key={l.id} className="rounded-2xl border border-black/5 bg-white p-4 shadow-sm">
              <div className="flex items-center justify-between">
                <span className={`rounded-full px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider ${l.status === "converted" ? "bg-green-100 text-green-700" : "bg-amber-100 text-amber-700"}`}>
                  {l.status}
                </span>
                <span className="text-[10px] uppercase tracking-wider text-pm-ink/40">{l.source}</span>
              </div>
              <p className="mt-2 font-bold">{l.name || l.contact}</p>
              <p className="text-xs text-pm-ink/60">{l.contactType}: {l.contact}</p>
              {l.bookings != null && <p className="mt-1 text-xs text-pm-ink/70">{l.bookings} bookings</p>}
              {l.sourcePage && <p className="mt-1 text-xs text-pm-ink/50">From: {l.sourcePage}</p>}
              <p className="mt-2 text-[10px] text-pm-ink/40">{new Date(l.createdAt).toLocaleString("en-IN")}</p>
            </div>
          ))}
          {leads.length === 0 && <p className="text-sm text-pm-ink/50">No leads yet.</p>}
        </div>
      )}
    </>
  );
}
