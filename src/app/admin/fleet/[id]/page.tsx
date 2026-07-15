"use client";
// Admin · Fleet · Vehicle detail — documents, fuel, maintenance, odometer, assignment.

import { useCallback, useEffect, useState } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";

const inputCls = "rounded-lg border border-pm-ink/20 px-3 py-2 text-sm outline-none focus:border-pm-red";
const DOC_TYPES = ["RC", "INSURANCE", "FITNESS", "POLLUTION", "PERMIT"];

export default function VehicleDetail() {
  const { id } = useParams<{ id: string }>();
  const [v, setV] = useState<any>(null);
  const [riders, setRiders] = useState<Array<{ id: string; name: string }>>([]);
  const [msg, setMsg] = useState<string | null>(null);
  const [doc, setDoc] = useState({ docType: "INSURANCE", docNumber: "", expiryDate: "" });
  const [fuel, setFuel] = useState({ liters: "", amount: "", odometerKm: "", station: "" });
  const [maint, setMaint] = useState({ kind: "SERVICE", description: "", cost: "", odometerKm: "", workshop: "" });

  const load = useCallback(async () => {
    const [d, r] = await Promise.all([
      fetch(`/api/admin/fleet/${id}`).then((x) => x.json()),
      fetch("/api/admin/riders-list").then((x) => x.json()).catch(() => ({ ok: false })),
    ]);
    if (d.ok) setV(d.vehicle);
    if (r.ok) setRiders(r.items);
  }, [id]);
  useEffect(() => { load(); }, [load]);

  async function patch(data: any) {
    setMsg(null);
    const res = await fetch(`/api/admin/fleet/${id}`, { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify(data) });
    const d = await res.json();
    if (!d.ok) { setMsg(d.error); return; }
    await load();
  }
  async function post(path: string, data: any, reset: () => void) {
    setMsg(null);
    const res = await fetch(path, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(data) });
    const d = await res.json();
    if (!d.ok) { setMsg(d.error); return; }
    reset(); await load();
  }

  if (!v) return <main className="mx-auto max-w-4xl px-4 py-8"><p className="text-sm text-pm-ink/50">Loading…</p></main>;

  const expClass = (date: string | null) => {
    if (!date) return "text-pm-ink/40";
    const t = new Date(date).getTime();
    if (t < Date.now()) return "font-bold text-red-700";
    if (t < Date.now() + 30 * 24 * 3600 * 1000) return "font-bold text-amber-700";
    return "text-green-700";
  };

  return (
    <main className="mx-auto max-w-4xl px-4 py-8">
      <Link href="/admin/fleet" className="text-sm font-semibold text-pm-ink/60 hover:text-pm-red">← Fleet</Link>
      <div className="mt-2 flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="font-mono text-2xl font-black">{v.registrationNumber}{v.isElectric ? " ⚡" : ""}</h1>
          <p className="text-sm text-pm-ink/60">{v.vehicleType.name} · {[v.make, v.model].filter(Boolean).join(" ") || "—"} · {v.ownership.replace("_", " ")} · {v.odometerKm.toLocaleString("en-IN")} km · {v.city?.name ?? "—"}</p>
        </div>
        <select value={v.status} onChange={(e) => patch({ status: e.target.value })} className={inputCls}>
          {["ACTIVE", "IN_SERVICE", "BREAKDOWN", "RETIRED"].map((s) => <option key={s} value={s}>{s.replace("_", " ")}</option>)}
        </select>
      </div>
      {msg && <p className="mt-3 rounded-lg bg-pm-red/10 px-3 py-2 text-sm font-medium text-pm-red-deep">{msg}</p>}

      <div className="mt-4 rounded-2xl bg-white p-4 shadow">
        <p className="text-sm font-bold">Rider assignment</p>
        <div className="mt-2 flex flex-wrap items-center gap-2">
          <select className={inputCls} value={v.assignedRider?.id ?? ""} onChange={(e) => patch({ assignedRiderId: e.target.value || null })}>
            <option value="">Unassigned</option>
            {riders.map((r) => <option key={r.id} value={r.id}>{r.name}</option>)}
          </select>
          {v.assignedRider && <span className="text-sm text-pm-ink/60">Currently with <strong>{v.assignedRider.user.name}</strong></span>}
        </div>
      </div>

      {/* Documents */}
      <div className="mt-4 rounded-2xl bg-white p-4 shadow">
        <p className="text-sm font-bold">Compliance documents</p>
        <div className="mt-2 grid grid-cols-1 gap-1 sm:grid-cols-2">
          {DOC_TYPES.map((t) => {
            const d = v.documents.find((x: any) => x.docType === t);
            return (
              <div key={t} className="flex items-center justify-between rounded-xl bg-pm-cream px-3 py-2 text-sm">
                <span className="font-semibold">{t}</span>
                {d ? <span className={expClass(d.expiryDate)}>{d.docNumber ? `${d.docNumber} · ` : ""}{d.expiryDate ? `exp ${new Date(d.expiryDate).toLocaleDateString("en-IN")}` : "no expiry"}</span> : <span className="text-pm-ink/40">missing</span>}
              </div>
            );
          })}
        </div>
        <div className="mt-3 grid grid-cols-2 gap-2 sm:grid-cols-4">
          <select className={inputCls} value={doc.docType} onChange={(e) => setDoc({ ...doc, docType: e.target.value })}>{DOC_TYPES.map((t) => <option key={t}>{t}</option>)}</select>
          <input className={inputCls} placeholder="Number" value={doc.docNumber} onChange={(e) => setDoc({ ...doc, docNumber: e.target.value })} />
          <input type="date" className={inputCls} value={doc.expiryDate} onChange={(e) => setDoc({ ...doc, expiryDate: e.target.value })} />
          <button type="button" onClick={() => post(`/api/admin/fleet/${id}/documents`, { docType: doc.docType, docNumber: doc.docNumber || undefined, expiryDate: doc.expiryDate || undefined }, () => setDoc({ docType: "INSURANCE", docNumber: "", expiryDate: "" }))} className="rounded-full bg-pm-red px-4 py-2 text-sm font-bold text-white hover:bg-pm-red-deep">Save doc</button>
        </div>
      </div>

      {/* Fuel */}
      <div className="mt-4 rounded-2xl bg-white p-4 shadow">
        <p className="text-sm font-bold">Fuel</p>
        <div className="mt-2 grid grid-cols-2 gap-2 sm:grid-cols-5">
          <input className={inputCls} placeholder="Liters" value={fuel.liters} onChange={(e) => setFuel({ ...fuel, liters: e.target.value.replace(/[^\d.]/g, "") })} />
          <input className={inputCls} placeholder="Amount ₹" value={fuel.amount} onChange={(e) => setFuel({ ...fuel, amount: e.target.value.replace(/[^\d.]/g, "") })} />
          <input className={inputCls} placeholder="Odometer" value={fuel.odometerKm} onChange={(e) => setFuel({ ...fuel, odometerKm: e.target.value.replace(/\D/g, "") })} />
          <input className={inputCls} placeholder="Station" value={fuel.station} onChange={(e) => setFuel({ ...fuel, station: e.target.value })} />
          <button type="button" onClick={() => post(`/api/admin/fleet/${id}/fuel`, { liters: Number(fuel.liters), amount: Number(fuel.amount), odometerKm: fuel.odometerKm ? Number(fuel.odometerKm) : undefined, station: fuel.station || undefined }, () => setFuel({ liters: "", amount: "", odometerKm: "", station: "" }))} disabled={!fuel.liters || !fuel.amount} className="rounded-full bg-pm-red px-4 py-2 text-sm font-bold text-white hover:bg-pm-red-deep disabled:opacity-50">Add</button>
        </div>
        <div className="mt-2 space-y-1 text-sm">
          {v.fuelRecords.map((f: any) => (
            <div key={f.id} className="flex justify-between"><span className="text-pm-ink/60">{new Date(f.filledAt).toLocaleDateString("en-IN")} · {Number(f.liters)}L{f.station ? ` · ${f.station}` : ""}</span><span className="font-bold">₹{Number(f.amount).toLocaleString("en-IN")}</span></div>
          ))}
        </div>
      </div>

      {/* Maintenance */}
      <div className="mt-4 rounded-2xl bg-white p-4 shadow">
        <p className="text-sm font-bold">Service, maintenance & breakdowns</p>
        <div className="mt-2 grid grid-cols-2 gap-2 sm:grid-cols-6">
          <select className={inputCls} value={maint.kind} onChange={(e) => setMaint({ ...maint, kind: e.target.value })}>{["SERVICE","REPAIR","BREAKDOWN"].map((k) => <option key={k}>{k}</option>)}</select>
          <input className={`${inputCls} col-span-2`} placeholder="Description" value={maint.description} onChange={(e) => setMaint({ ...maint, description: e.target.value })} />
          <input className={inputCls} placeholder="Cost ₹" value={maint.cost} onChange={(e) => setMaint({ ...maint, cost: e.target.value.replace(/[^\d.]/g, "") })} />
          <input className={inputCls} placeholder="Workshop" value={maint.workshop} onChange={(e) => setMaint({ ...maint, workshop: e.target.value })} />
          <button type="button" onClick={() => post(`/api/admin/fleet/${id}/maintenance`, { kind: maint.kind, description: maint.description, cost: Number(maint.cost || 0), workshop: maint.workshop || undefined }, () => setMaint({ kind: "SERVICE", description: "", cost: "", odometerKm: "", workshop: "" }))} disabled={!maint.description} className="rounded-full bg-pm-red px-4 py-2 text-sm font-bold text-white hover:bg-pm-red-deep disabled:opacity-50">Log</button>
        </div>
        {v.status !== "ACTIVE" && (
          <button type="button" onClick={() => post(`/api/admin/fleet/${id}/maintenance`, { kind: "SERVICE", description: "Marked resolved — back on road", markResolved: true }, () => {})} className="mt-2 rounded-full bg-green-600 px-4 py-1.5 text-xs font-bold text-white hover:bg-green-700">Mark resolved · back to ACTIVE</button>
        )}
        <div className="mt-2 space-y-1 text-sm">
          {v.maintenance.map((m: any) => (
            <div key={m.id} className="flex justify-between">
              <span className="text-pm-ink/60">{new Date(m.servicedAt).toLocaleDateString("en-IN")} · <span className={m.kind === "BREAKDOWN" ? "font-bold text-red-700" : ""}>{m.kind}</span> · {m.description}</span>
              <span className="font-bold">₹{Number(m.cost).toLocaleString("en-IN")}</span>
            </div>
          ))}
        </div>
      </div>
    </main>
  );
}
