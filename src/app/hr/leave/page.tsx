"use client";
import { useCallback, useEffect, useState } from "react";

type Leave = { id: string; type: string; status: string; fromDate: string; toDate: string; reason: string | null; employee: { name: string; employeeCode: string } };

export default function LeavePage() {
  const [leaves, setLeaves] = useState<Leave[]>([]);
  const load = useCallback(async () => {
    const res = await fetch("/api/admin/leave");
    const d = await res.json();
    if (d.ok) setLeaves(d.leaves);
  }, []);
  useEffect(() => { load(); }, [load]);

  async function decide(id: string, action: string) {
    await fetch(`/api/admin/leave/${id}`, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ action }) });
    await load();
  }

  return (
    <main className="mx-auto max-w-4xl px-4 py-8">
      <h1 className="text-2xl font-black">Leave requests</h1>
      <div className="mt-4 space-y-2">
        {leaves.length === 0 && <p className="rounded-2xl border border-dashed border-pm-ink/20 bg-white/60 p-8 text-center text-sm text-pm-ink/50">No leave requests.</p>}
        {leaves.map((l) => (
          <div key={l.id} className="flex flex-wrap items-center justify-between gap-2 rounded-2xl bg-white p-4 shadow">
            <div>
              <p className="text-sm font-bold">{l.employee.name} <span className="font-mono text-xs text-pm-ink/40">{l.employee.employeeCode}</span></p>
              <p className="text-xs text-pm-ink/50">{l.type} · {new Date(l.fromDate).toLocaleDateString("en-IN")} → {new Date(l.toDate).toLocaleDateString("en-IN")}{l.reason ? ` · ${l.reason}` : ""}</p>
            </div>
            <div className="flex items-center gap-2">
              <span className={`rounded-full px-2.5 py-1 text-xs font-bold ${l.status === "APPROVED" ? "bg-green-100 text-green-800" : l.status === "REJECTED" ? "bg-red-100 text-red-800" : "bg-amber-100 text-amber-800"}`}>{l.status}</span>
              {l.status === "PENDING" && (
                <>
                  <button type="button" onClick={() => decide(l.id, "approve")} className="rounded-full bg-green-600 px-3 py-1 text-xs font-bold text-white hover:bg-green-700">Approve</button>
                  <button type="button" onClick={() => decide(l.id, "reject")} className="rounded-full bg-red-100 px-3 py-1 text-xs font-bold text-red-800">Reject</button>
                </>
              )}
            </div>
          </div>
        ))}
      </div>
    </main>
  );
}
