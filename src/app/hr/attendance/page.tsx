"use client";
import { useCallback, useEffect, useState } from "react";

type Row = { employee: { id: string; name: string; employeeCode: string }; record: { status: string; checkInLat: number | null; shift: string | null } | null };

export default function AttendancePage() {
  const [date, setDate] = useState(new Date().toISOString().slice(0, 10));
  const [rows, setRows] = useState<Row[]>([]);
  const [msg, setMsg] = useState<string | null>(null);

  const load = useCallback(async () => {
    const res = await fetch(`/api/admin/attendance?date=${date}`);
    const d = await res.json();
    if (d.ok) setRows(d.rows);
  }, [date]);
  useEffect(() => { load(); }, [load]);

  async function mark(employeeId: string, status: string, withGps = false) {
    setMsg(null);
    const doPost = async (lat?: number, lng?: number) => {
      const res = await fetch("/api/admin/attendance", {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ employeeId, date, status, ...(lat !== undefined ? { checkInLat: lat, checkInLng: lng } : {}) }),
      });
      const d = await res.json();
      if (!d.ok) setMsg(d.error);
      await load();
    };
    if (withGps && navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (pos) => doPost(pos.coords.latitude, pos.coords.longitude),
        () => doPost()
      );
    } else doPost();
  }

  return (
    <main className="mx-auto max-w-4xl px-4 py-8">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h1 className="text-2xl font-black">Attendance</h1>
        <input type="date" value={date} onChange={(e) => setDate(e.target.value)} className="rounded-lg border border-pm-ink/20 px-3 py-2 text-sm" />
      </div>
      {msg && <p className="mt-3 rounded-lg bg-pm-red/10 px-3 py-2 text-sm font-medium text-pm-red-deep">{msg}</p>}
      <div className="mt-4 space-y-2">
        {rows.length === 0 && <p className="rounded-2xl border border-dashed border-pm-ink/20 bg-white/60 p-8 text-center text-sm text-pm-ink/50">No active employees.</p>}
        {rows.map((r) => (
          <div key={r.employee.id} className="flex flex-wrap items-center justify-between gap-2 rounded-2xl bg-white p-3 shadow">
            <div>
              <p className="text-sm font-bold">{r.employee.name} <span className="font-mono text-xs text-pm-ink/40">{r.employee.employeeCode}</span></p>
              {r.record && <p className="text-xs text-pm-ink/50">Marked: {r.record.status}{r.record.checkInLat ? " · GPS ✓" : ""}</p>}
            </div>
            <div className="flex flex-wrap gap-1.5">
              <button type="button" onClick={() => mark(r.employee.id, "PRESENT", true)} className="rounded-full bg-green-600 px-3 py-1 text-xs font-bold text-white hover:bg-green-700">Present + GPS</button>
              <button type="button" onClick={() => mark(r.employee.id, "PRESENT")} className="rounded-full bg-green-100 px-3 py-1 text-xs font-bold text-green-800">Present</button>
              <button type="button" onClick={() => mark(r.employee.id, "HALF_DAY")} className="rounded-full bg-amber-100 px-3 py-1 text-xs font-bold text-amber-800">Half</button>
              <button type="button" onClick={() => mark(r.employee.id, "ABSENT")} className="rounded-full bg-red-100 px-3 py-1 text-xs font-bold text-red-800">Absent</button>
              <button type="button" onClick={() => mark(r.employee.id, "LEAVE")} className="rounded-full bg-blue-100 px-3 py-1 text-xs font-bold text-blue-800">Leave</button>
            </div>
          </div>
        ))}
      </div>
    </main>
  );
}
