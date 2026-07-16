"use client";

import { useCallback, useEffect, useState } from "react";

export default function AuditPage() {
  const [items, setItems] = useState<any[]>([]);
  const [total, setTotal] = useState(0);
  const [take, setTake] = useState(50);
  const [module, setModule] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const params = new URLSearchParams({ take: String(take) });
      if (module) params.set("module", module);
      const r = await fetch(`/api/admin/audit?${params}`);
      const j = await r.json();
      if (!j?.ok) throw new Error(j?.error || "Failed");
      setItems(j.items || []);
      setTotal(j.total || 0);
    } catch (e: any) {
      setError(e?.message || "Failed to load audit log");
    } finally {
      setLoading(false);
    }
  }, [take, module]);

  useEffect(() => { load(); }, [load]);

  return (
    <>
      <h1 className="text-2xl font-black">Audit & activity logs</h1>
      <p className="mt-1 text-sm text-pm-ink/60">Every login, create, edit, delete, payment change, toggle and export by staff.</p>

      <div className="mt-4 flex flex-wrap items-center gap-2">
        <input
          type="text"
          placeholder="Filter by module (e.g. bookings, system)"
          value={module}
          onChange={(e) => setModule(e.target.value)}
          className="rounded-full border border-pm-ink/15 bg-white px-4 py-1.5 text-sm"
        />
        <select value={take} onChange={(e) => setTake(Number(e.target.value))}
          className="rounded-full border border-pm-ink/15 bg-white px-3 py-1.5 text-sm">
          {[25, 50, 100, 200].map((n) => <option key={n} value={n}>Last {n}</option>)}
        </select>
        <button type="button" onClick={load}
          className="rounded-full bg-pm-red px-4 py-1.5 text-sm font-bold text-white">
          Refresh
        </button>
        <span className="text-xs text-pm-ink/50">{total} total logs</span>
      </div>

      {loading && <p className="mt-6 text-sm text-pm-ink/50">Loading audit log…</p>}
      {error && <p className="mt-6 rounded-xl border border-pm-red/30 bg-pm-red/10 px-4 py-3 text-sm font-medium text-pm-red">{error}</p>}

      {!loading && !error && items.length === 0 && (
        <p className="mt-6 text-sm text-pm-ink/50">No audit logs found.</p>
      )}

      {!loading && !error && items.length > 0 && (
        <div className="mt-5 overflow-hidden rounded-2xl border border-black/5 bg-white shadow-sm">
          <div className="max-h-[70vh] overflow-y-auto pm-scroll">
            <table className="w-full text-sm">
              <thead className="sticky top-0 bg-pm-cream text-xs uppercase tracking-wider text-pm-ink/60">
                <tr>
                  <th className="px-3 py-2 text-left">When</th>
                  <th className="px-3 py-2 text-left">Admin</th>
                  <th className="px-3 py-2 text-left">Action</th>
                  <th className="px-3 py-2 text-left">Module</th>
                  <th className="px-3 py-2 text-left">Entity</th>
                </tr>
              </thead>
              <tbody>
                {items.map((it) => (
                  <tr key={it.id} className="border-t border-black/5 hover:bg-pm-cream/40">
                    <td className="px-3 py-2 whitespace-nowrap text-xs text-pm-ink/60">
                      {new Date(it.createdAt).toLocaleString("en-IN")}
                    </td>
                    <td className="px-3 py-2 text-xs">{it.adminEmail || `#${it.adminId}`}</td>
                    <td className="px-3 py-2 font-medium">{it.action}</td>
                    <td className="px-3 py-2 text-xs">{it.module || "—"}</td>
                    <td className="px-3 py-2 text-xs text-pm-ink/60">
                      {it.entityType ? `${it.entityType} #${it.entityId ?? "?"}` : "—"}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </>
  );
}
