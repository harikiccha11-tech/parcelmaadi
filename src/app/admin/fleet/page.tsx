"use client";
// Admin · Fleet — ParcelMaadi vehicle master, document expiry alerts, reports.

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";

type Vehicle = {
  id: string; registrationNumber: string; status: string; ownership: string; odometerKm: number; isElectric: boolean;
  make: string | null; model: string | null;
  vehicleType: { name: string }; city: { name: string } | null;
  assignedRider: { user: { name: string } } | null;
  documents: Array<{ docType: string; expiryDate: string | null }>;
};
type Reports = any;
const inputCls = "rounded-lg border border-pm-ink/20 px-3 py-2 text-sm outline-none focus:border-pm-red";
const statusTone: Record<string, string> = { ACTIVE: "bg-green-100 text-green-800", IN_SERVICE: "bg-amber-100 text-amber-800", BREAKDOWN: "bg-red-100 text-red-800", RETIRED: "bg-pm-cream text-pm-ink/50" };

function docBadge(docs: Vehicle["documents"]) {
  const soon = Date.now() + 30 * 24 * 3600 * 1000;
  const expired = docs.filter((d) => d.expiryDate && new Date(d.expiryDate).getTime() < Date.now());
  const expiring = docs.filter((d) => d.expiryDate && new Date(d.expiryDate).getTime() >= Date.now() && new Date(d.expiryDate).getTime() < soon);
  if (expired.length) return <span className="rounded-full bg-red-100 px-2 py-0.5 text-[10px] font-bold text-red-800">{expired.map((d) => d.docType).join(", ")} EXPIRED</span>;
  if (expiring.length) return <span className="rounded-full bg-amber-100 px-2 py-0.5 text-[10px] font-bold text-amber-800">{expiring.map((d) => d.docType).join(", ")} expiring</span>;
  return <span className="rounded-full bg-green-100 px-2 py-0.5 text-[10px] font-bold text-green-800">{docs.length}/5 docs</span>;
}

export default function FleetPage() {
  const [vehicles, setVehicles] = useState<Vehicle[]>([]);
  const [types, setTypes] = useState<Array<{ id: string; name: string }>>([]);
  const [cities, setCities] = useState<Array<{ id: string; name: string }>>([]);
  const [reports, setReports] = useState<Reports>(null);
  const [open, setOpen] = useState(false);
  const [msg, setMsg] = useState<string | null>(null);
  const [form, setForm] = useState({ registrationNumber: "", vehicleTypeId: "", make: "", model: "", ownership: "RIDER_OWNED", cityId: "", isElectric: false, odometerKm: "" });

  const load = useCallback(async () => {
    const [v, r] = await Promise.all([
      fetch("/api/admin/fleet").then((x) => x.json()),
      fetch("/api/admin/fleet/reports").then((x) => x.json()),
    ]);
    if (v.ok) setVehicles(v.vehicles);
    if (r.ok) setReports(r);
  }, []);
  useEffect(() => {
    load();
    fetch("/api/catalog/vehicles").then((r) => r.json()).then((d) => d.ok && setTypes(d.vehicles)).catch(() => {});
    fetch("/api/catalog/cities").then((r) => r.json()).then((d) => d.ok && setCities(d.cities)).catch(() => {});
  }, [load]);

  async function create() {
    setMsg(null);
    const res = await fetch("/api/admin/fleet", {
      method: "POST", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ ...form, odometerKm: Number(form.odometerKm || 0) }),
    });
    const d = await res.json();
    if (!d.ok) { setMsg(d.error); return; }
    setOpen(false);
    setForm({ registrationNumber: "", vehicleTypeId: "", make: "", model: "", ownership: "RIDER_OWNED", cityId: "", isElectric: false, odometerKm: "" });
    await load();
  }

  return (
    <main className="mx-auto max-w-6xl px-4 py-8">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h1 className="text-2xl font-black">Fleet</h1>
        <div className="flex gap-2">
          <Link href="/admin/fleet/riders" className="rounded-full border border-pm-ink/20 px-4 py-2 text-sm font-semibold hover:bg-white">Rider operations →</Link>
          <button type="button" onClick={() => setOpen((v) => !v)} className="rounded-full bg-pm-red px-5 py-2 text-sm font-bold text-white hover:bg-pm-red-deep">{open ? "Close" : "+ Add vehicle"}</button>
        </div>
      </div>

      {reports && (
        <div className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-6">
          {reports.fleet.byStatus.map((s: any) => (
            <div key={s.status} className="rounded-2xl bg-white p-3 shadow"><p className="text-[10px] font-bold uppercase text-pm-ink/50">{s.status.replace("_", " ")}</p><p className="text-xl font-black">{s.count}</p></div>
          ))}
          <div className={`rounded-2xl p-3 shadow ${reports.fleet.docsExpiring30 > 0 ? "bg-amber-100" : "bg-white"}`}><p className="text-[10px] font-bold uppercase text-pm-ink/50">Docs expiring 30d</p><p className="text-xl font-black">{reports.fleet.docsExpiring30}</p></div>
          <div className="rounded-2xl bg-white p-3 shadow"><p className="text-[10px] font-bold uppercase text-pm-ink/50">Fuel spend 30d</p><p className="text-xl font-black">₹{reports.fuel.spend30.toLocaleString("en-IN")}</p></div>
          <div className="rounded-2xl bg-white p-3 shadow"><p className="text-[10px] font-bold uppercase text-pm-ink/50">Maintenance 30d</p><p className="text-xl font-black">₹{reports.maintenance.spend30.toLocaleString("en-IN")}</p></div>
          <div className={`rounded-2xl p-3 shadow ${reports.maintenance.breakdowns30 > 0 ? "bg-red-100" : "bg-white"}`}><p className="text-[10px] font-bold uppercase text-pm-ink/50">Breakdowns 30d</p><p className="text-xl font-black">{reports.maintenance.breakdowns30}</p></div>
          <div className="rounded-2xl bg-white p-3 shadow"><p className="text-[10px] font-bold uppercase text-pm-ink/50">Delivery success</p><p className="text-xl font-black">{reports.delivery.successRate}%</p></div>
          <div className="rounded-2xl bg-white p-3 shadow"><p className="text-[10px] font-bold uppercase text-pm-ink/50">Avg trip km</p><p className="text-xl font-black">{reports.delivery.avgDistanceKm}</p></div>
        </div>
      )}

      {open && (
        <div className="mt-4 rounded-2xl bg-white p-5 shadow">
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
            <input className={inputCls} placeholder="Registration (KA-17-AB-1234)" value={form.registrationNumber} onChange={(e) => setForm({ ...form, registrationNumber: e.target.value.toUpperCase() })} />
            <select className={inputCls} value={form.vehicleTypeId} onChange={(e) => setForm({ ...form, vehicleTypeId: e.target.value })}>
              <option value="">Vehicle category</option>
              {types.map((t) => <option key={t.id} value={t.id}>{t.name}</option>)}
            </select>
            <select className={inputCls} value={form.ownership} onChange={(e) => setForm({ ...form, ownership: e.target.value })}>
              <option value="RIDER_OWNED">Rider owned</option>
              <option value="COMPANY_OWNED">Company owned</option>
              <option value="LEASED">Leased</option>
            </select>
            <input className={inputCls} placeholder="Make (Tata / Bajaj / Ather…)" value={form.make} onChange={(e) => setForm({ ...form, make: e.target.value })} />
            <input className={inputCls} placeholder="Model" value={form.model} onChange={(e) => setForm({ ...form, model: e.target.value })} />
            <select className={inputCls} value={form.cityId} onChange={(e) => setForm({ ...form, cityId: e.target.value })}>
              <option value="">City</option>
              {cities.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
            </select>
            <input className={inputCls} placeholder="Odometer km" value={form.odometerKm} onChange={(e) => setForm({ ...form, odometerKm: e.target.value.replace(/\D/g, "") })} />
            <label className="flex items-center gap-2 text-sm"><input type="checkbox" checked={form.isElectric} onChange={(e) => setForm({ ...form, isElectric: e.target.checked })} className="accent-pm-red" /> Electric (EV)</label>
          </div>
          {msg && <p className="mt-2 text-xs font-medium text-pm-red-deep">{msg}</p>}
          <button type="button" onClick={create} disabled={!form.registrationNumber || !form.vehicleTypeId} className="mt-3 rounded-full bg-pm-red px-6 py-2 text-sm font-bold text-white hover:bg-pm-red-deep disabled:opacity-50">Add vehicle</button>
        </div>
      )}

      <div className="mt-4 overflow-x-auto rounded-2xl bg-white shadow">
        <table className="w-full text-sm">
          <thead className="bg-pm-cream text-left text-xs uppercase tracking-wider text-pm-ink/50">
            <tr><th className="px-3 py-2">Vehicle</th><th className="px-3 py-2">Category</th><th className="px-3 py-2">Rider</th><th className="px-3 py-2 text-right">Odometer</th><th className="px-3 py-2">Documents</th><th className="px-3 py-2">Status</th><th className="px-3 py-2"></th></tr>
          </thead>
          <tbody>
            {vehicles.length === 0 && <tr><td colSpan={7} className="px-3 py-6 text-center text-pm-ink/50">No vehicles yet.</td></tr>}
            {vehicles.map((v) => (
              <tr key={v.id} className="border-t border-pm-ink/5">
                <td className="px-3 py-2 font-mono font-bold">{v.registrationNumber}{v.isElectric ? " ⚡" : ""}<span className="block text-xs font-sans font-normal text-pm-ink/40">{[v.make, v.model].filter(Boolean).join(" ")}</span></td>
                <td className="px-3 py-2">{v.vehicleType.name}</td>
                <td className="px-3 py-2">{v.assignedRider?.user.name ?? "—"}</td>
                <td className="px-3 py-2 text-right">{v.odometerKm.toLocaleString("en-IN")} km</td>
                <td className="px-3 py-2">{docBadge(v.documents)}</td>
                <td className="px-3 py-2"><span className={`rounded-full px-2 py-0.5 text-xs font-bold ${statusTone[v.status]}`}>{v.status.replace("_", " ")}</span></td>
                <td className="px-3 py-2"><Link href={`/admin/fleet/${v.id}`} className="text-xs font-bold text-pm-red hover:underline">Open</Link></td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {reports && reports.riderProductivity.length > 0 && (
        <div className="mt-4 rounded-2xl bg-white p-4 shadow">
          <p className="text-sm font-bold">Top riders (deliveries, 30d)</p>
          <div className="mt-2 space-y-1">
            {reports.riderProductivity.map((r: any) => (
              <div key={r.name} className="flex justify-between text-sm"><span className="text-pm-ink/60">{r.name}</span><span className="font-bold">{r.delivered30}</span></div>
            ))}
          </div>
        </div>
      )}
    </main>
  );
}
