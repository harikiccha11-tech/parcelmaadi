"use client";

import { useCallback, useEffect, useState } from "react";

export default function SecurityPage() {
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const r = await fetch("/api/admin/security");
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
      <h1 className="text-2xl font-black">Security</h1>
      <p className="mt-1 text-sm text-pm-ink/60">Admins, API keys, integrations, recent password resets & auth-related audit log.</p>

      {loading && <p className="mt-6 text-sm text-pm-ink/50">Loading…</p>}
      {error && <p className="mt-6 rounded-xl border border-pm-red/30 bg-pm-red/10 px-4 py-3 text-sm font-medium text-pm-red">{error}</p>}

      {data && !loading && (
        <>
          <section className="mt-5 grid grid-cols-2 gap-3 sm:grid-cols-4 lg:grid-cols-6">
            <Kpi label="Admins" value={data.summary?.admins} />
            <Kpi label="Active" value={data.summary?.activeAdmins} accent="green" />
            <Kpi label="API keys" value={data.summary?.apiKeys} />
            <Kpi label="Active keys" value={data.summary?.activeApiKeys} accent="green" />
            <Kpi label="Integrations" value={data.summary?.integrations} />
            <Kpi label="Pending resets" value={data.summary?.pendingResets} accent="red" />
          </section>

          <section className="mt-5 grid grid-cols-1 gap-4 lg:grid-cols-2">
            <div className={card}>
              <h2 className="text-sm font-bold">👤 Admin users ({data.admins?.length || 0})</h2>
              <div className="mt-2 max-h-72 space-y-2 overflow-y-auto pm-scroll text-sm">
                {(data.admins || []).map((a: any) => (
                  <div key={a.id} className="border-b border-black/5 pb-2">
                    <p className="font-medium">{a.name || a.email} <span className={`ml-1 rounded-full px-2 py-0.5 text-[10px] font-bold uppercase ${a.status === "Active" ? "bg-green-100 text-green-700" : "bg-pm-cream text-pm-ink/50"}`}>{a.status}</span></p>
                    <p className="text-xs text-pm-ink/60">{a.email} · {a.role}{a.forcePasswordChange ? " · ⚠ password change required" : ""}</p>
                  </div>
                ))}
              </div>
            </div>

            <div className={card}>
              <h2 className="text-sm font-bold">🔑 API keys ({data.apiKeys?.length || 0})</h2>
              <div className="mt-2 max-h-72 space-y-2 overflow-y-auto pm-scroll text-sm">
                {(data.apiKeys || []).map((k: any) => (
                  <div key={k.id} className="border-b border-black/5 pb-2">
                    <p className="font-medium">{k.name} <span className={`ml-1 rounded-full px-2 py-0.5 text-[10px] font-bold uppercase ${k.status === "Active" ? "bg-green-100 text-green-700" : "bg-pm-cream text-pm-ink/50"}`}>{k.status}</span></p>
                    <p className="text-xs font-mono text-pm-ink/60">{k.keyPrefix}…</p>
                    <p className="text-xs text-pm-ink/50">Scopes: {k.scopes || "—"}{k.expiresAt ? ` · expires ${new Date(k.expiresAt).toLocaleDateString("en-IN")}` : ""}</p>
                  </div>
                ))}
                {(data.apiKeys || []).length === 0 && <p className="text-xs text-pm-ink/40">No API keys.</p>}
              </div>
            </div>

            <div className={card}>
              <h2 className="text-sm font-bold">🔌 Integrations ({data.integrations?.length || 0})</h2>
              <div className="mt-2 max-h-72 space-y-2 overflow-y-auto pm-scroll text-sm">
                {(data.integrations || []).map((i: any) => (
                  <div key={i.id} className="border-b border-black/5 pb-2">
                    <p className="font-medium">{i.name} <span className={`ml-1 rounded-full px-2 py-0.5 text-[10px] font-bold uppercase ${i.status === "Active" ? "bg-green-100 text-green-700" : "bg-pm-cream text-pm-ink/50"}`}>{i.status}</span></p>
                    <p className="text-xs text-pm-ink/60">{i.category || "—"}</p>
                  </div>
                ))}
                {(data.integrations || []).length === 0 && <p className="text-xs text-pm-ink/40">No integrations configured.</p>}
              </div>
            </div>

            <div className={card}>
              <h2 className="text-sm font-bold">🛡 Recent auth audit ({data.recentAudit?.length || 0})</h2>
              <div className="mt-2 max-h-72 space-y-2 overflow-y-auto pm-scroll text-sm">
                {(data.recentAudit || []).slice(0, 15).map((a: any) => (
                  <div key={a.id} className="border-b border-black/5 pb-2">
                    <p className="font-medium text-xs">{a.action}</p>
                    <p className="text-[11px] text-pm-ink/50">{a.adminEmail || "—"} · {new Date(a.createdAt).toLocaleString("en-IN")}</p>
                  </div>
                ))}
                {(data.recentAudit || []).length === 0 && <p className="text-xs text-pm-ink/40">No auth-related audit entries.</p>}
              </div>
            </div>
          </section>
        </>
      )}
    </>
  );
}

function Kpi({ label, value, accent }: { label: string; value: any; accent?: "green" | "red" }) {
  const color = accent === "green" ? "text-green-600" : accent === "red" ? "text-pm-red" : "text-pm-ink";
  return (
    <div className="rounded-xl border border-black/5 bg-white px-3 py-2.5 shadow-sm">
      <p className="text-[10px] font-bold uppercase tracking-wider text-pm-ink/50">{label}</p>
      <p className={`mt-0.5 text-lg font-black tabular-nums ${color}`}>{value ?? "—"}</p>
    </div>
  );
}
