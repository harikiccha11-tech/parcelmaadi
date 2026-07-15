"use client";

import { useCallback, useEffect, useState } from "react";

export default function SystemPage() {
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [msg, setMsg] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const r = await fetch("/api/admin/system");
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

  async function toggle(key: string, isEnabled: boolean) {
    setMsg(null);
    try {
      const r = await fetch("/api/admin/system", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "flag", key, isEnabled }),
      });
      const j = await r.json();
      if (!j?.ok) throw new Error(j?.error);
      setMsg(`${key} → ${isEnabled ? "ON" : "OFF"}`);
      await load();
    } catch (e: any) {
      setMsg(`Error: ${e?.message}`);
    }
  }

  const card = "rounded-2xl border border-black/5 bg-white p-5 shadow-sm";

  return (
    <>
      <h1 className="text-2xl font-black">System</h1>
      <p className="mt-1 text-sm text-pm-ink/60">Feature flags, integrations, system info.</p>

      {msg && <p className="mt-2 rounded-lg bg-pm-yellow/40 px-3 py-2 text-sm font-medium">{msg}</p>}

      {loading && <p className="mt-6 text-sm text-pm-ink/50">Loading…</p>}
      {error && <p className="mt-6 rounded-xl border border-pm-red/30 bg-pm-red/10 px-4 py-3 text-sm font-medium text-pm-red">{error}</p>}

      {data && !loading && (
        <>
          <section className={`mt-5 ${card}`}>
            <h2 className="text-sm font-bold">⚙ System info</h2>
            <dl className="mt-2 grid grid-cols-2 gap-2 text-sm sm:grid-cols-3">
              <Info label="Version" value={data.info?.version} />
              <Info label="Node env" value={data.info?.nodeEnv} />
              <Info label="Vercel" value={data.info?.vercel ? "yes" : "no"} />
              <Info label="Region" value={data.info?.region} />
              <Info label="Time" value={data.info?.time ? new Date(data.info.time).toLocaleString("en-IN") : "—"} />
            </dl>
          </section>

          <section className={`mt-5 ${card}`}>
            <h2 className="text-sm font-bold">🚩 Feature flags ({data.flags?.length || 0})</h2>
            <div className="mt-3 flex flex-wrap gap-2">
              {(data.flags || []).map((f: any) => (
                <button
                  key={f.key}
                  type="button"
                  onClick={() => toggle(f.key, !f.enabled)}
                  className={`rounded-full px-4 py-1.5 text-xs font-bold transition-colors ${
                    f.enabled ? "bg-green-600 text-white" : "bg-pm-ink/10 text-pm-ink/60"
                  }`}
                  title={f.description || f.label || ""}
                >
                  {f.enabled ? "● " : "○ "}{f.key}
                </button>
              ))}
              {(data.flags || []).length === 0 && <p className="text-sm text-pm-ink/50">No feature flags yet.</p>}
            </div>
            <p className="mt-3 text-xs text-pm-ink/40">
              Toggle AI_FARE, AI_DEMAND, AI_FRAUD, etc. from the <button onClick={() => toggle("AI_FARE", true)} className="underline">AI page</button> or here.
            </p>
          </section>

          <section className={`mt-5 ${card}`}>
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
          </section>

          {data.settings && data.settings.length > 0 && (
            <section className={`mt-5 ${card}`}>
              <h2 className="text-sm font-bold">🔧 System settings ({data.settings.length})</h2>
              <ul className="mt-2 space-y-1.5 text-sm">
                {data.settings.map((s: any) => (
                  <li key={s.id} className="flex items-baseline justify-between gap-3">
                    <span className="font-mono text-xs text-pm-ink/70">{s.key}</span>
                    <span className="truncate text-xs text-pm-ink/60">{s.value || "—"}</span>
                  </li>
                ))}
              </ul>
            </section>
          )}
        </>
      )}
    </>
  );
}

function Info({ label, value }: { label: string; value: any }) {
  return (
    <div>
      <dt className="text-[10px] font-bold uppercase tracking-wider text-pm-ink/50">{label}</dt>
      <dd className="mt-0.5 text-sm font-medium">{value ?? "—"}</dd>
    </div>
  );
}
