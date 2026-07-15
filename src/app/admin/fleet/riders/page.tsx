"use client";
// Admin · Fleet · Rider operations — availability, shifts, zones, incentives/penalties.

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";

type Rider = {
  id: string; name: string; isOnline: boolean; lastSeenAt: string | null; vehicleType: string;
  activeJobs: number; delivered30: number; assignedVehicle: string | null;
  shift: { shift: string; zone: string | null; zoneId: string | null } | null;
};
type Zone = { id: string; name: string };
const inputCls = "rounded-lg border border-pm-ink/20 px-2 py-1.5 text-xs outline-none focus:border-pm-red";

export default function RiderOpsPage() {
  const [riders, setRiders] = useState<Rider[]>([]);
  const [zones, setZones] = useState<Zone[]>([]);
  const [msg, setMsg] = useState<string | null>(null);

  const load = useCallback(async () => {
    const res = await fetch("/api/admin/rider-ops");
    const d = await res.json();
    if (d.ok) { setRiders(d.riders); setZones(d.zones); }
  }, []);
  useEffect(() => { load(); const t = setInterval(load, 15000); return () => clearInterval(t); }, [load]);

  async function assignShift(riderId: string, shift: string, zoneId: string) {
    setMsg(null);
    const res = await fetch("/api/admin/rider-ops", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ kind: "shift", riderId, shift, zoneId: zoneId || undefined }) });
    const d = await res.json();
    if (!d.ok) { setMsg(d.error); return; }
    await load();
  }
  async function adjust(riderId: string, type: "INCENTIVE" | "PENALTY") {
    const amount = window.prompt(`${type} amount ₹?`);
    if (!amount) return;
    const reason = window.prompt("Reason?");
    if (!reason) return;
    const res = await fetch("/api/admin/rider-ops", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ kind: "adjustment", riderId, type, amount: Number(amount), reason }) });
    const d = await res.json();
    if (!d.ok) { setMsg(d.error); return; }
    await load();
  }

  return (
    <main className="mx-auto max-w-6xl px-4 py-8">
      <Link href="/admin/fleet" className="text-sm font-semibold text-pm-ink/60 hover:text-pm-red">← Fleet</Link>
      <div className="mt-2 flex items-center justify-between">
        <h1 className="text-2xl font-black">Rider operations</h1>
        <span className="text-xs font-semibold text-green-700">{riders.filter((r) => r.isOnline).length} online / {riders.length} approved · live 15s</span>
      </div>
      {msg && <p className="mt-3 rounded-lg bg-pm-red/10 px-3 py-2 text-sm font-medium text-pm-red-deep">{msg}</p>}

      <div className="mt-4 space-y-2">
        {riders.length === 0 && <p className="rounded-2xl border border-dashed border-pm-ink/20 bg-white/60 p-8 text-center text-sm text-pm-ink/50">No approved riders.</p>}
        {riders.map((r) => (
          <div key={r.id} className="rounded-2xl bg-white p-4 shadow">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <div>
                <p className="text-sm font-bold">
                  <span className={`mr-1.5 inline-block h-2 w-2 rounded-full ${r.isOnline ? "bg-green-500" : "bg-pm-ink/20"}`} />
                  {r.name} <span className="text-xs font-normal text-pm-ink/40">· {r.vehicleType}</span>
                </p>
                <p className="text-xs text-pm-ink/50">
                  {r.activeJobs} active · {r.delivered30} delivered/30d
                  {r.assignedVehicle ? ` · 🚚 ${r.assignedVehicle}` : ""}
                  {r.shift ? ` · Shift: ${r.shift.shift}${r.shift.zone ? ` @ ${r.shift.zone}` : ""}` : " · No shift today"}
                </p>
              </div>
              <div className="flex flex-wrap items-center gap-1.5">
                <ShiftAssign zones={zones} current={r.shift} onAssign={(s, z) => assignShift(r.id, s, z)} />
                <button type="button" onClick={() => adjust(r.id, "INCENTIVE")} className="rounded-full bg-green-100 px-3 py-1 text-xs font-bold text-green-800">+ Incentive</button>
                <button type="button" onClick={() => adjust(r.id, "PENALTY")} className="rounded-full bg-red-100 px-3 py-1 text-xs font-bold text-red-800">− Penalty</button>
              </div>
            </div>
          </div>
        ))}
      </div>
    </main>
  );
}

function ShiftAssign({ zones, current, onAssign }: { zones: Zone[]; current: Rider["shift"]; onAssign: (shift: string, zoneId: string) => void }) {
  const [shift, setShift] = useState(current?.shift ?? "GENERAL");
  const [zoneId, setZoneId] = useState(current?.zoneId ?? "");
  return (
    <span className="flex items-center gap-1">
      <select className={inputCls} value={shift} onChange={(e) => setShift(e.target.value)}>
        {["MORNING", "EVENING", "NIGHT", "GENERAL"].map((s) => <option key={s}>{s}</option>)}
      </select>
      <select className={inputCls} value={zoneId} onChange={(e) => setZoneId(e.target.value)}>
        <option value="">Any zone</option>
        {zones.map((z) => <option key={z.id} value={z.id}>{z.name}</option>)}
      </select>
      <button type="button" onClick={() => onAssign(shift, zoneId)} className="rounded-full bg-pm-yellow px-3 py-1 text-xs font-bold hover:bg-pm-yellow-deep">Set shift</button>
    </span>
  );
}
