"use client";

import { useCallback, useEffect, useState } from "react";

export default function AiPage() {
  const [fare, setFare] = useState<any>(null);
  const [demand, setDemand] = useState<any>(null);
  const [fraud, setFraud] = useState<any>(null);
  const [insights, setInsights] = useState<any>(null);
  const [allocate, setAllocate] = useState<any>(null);
  const [flags, setFlags] = useState<any[]>([]);
  const [msg, setMsg] = useState<string | null>(null);

  const load = useCallback(async () => {
    const j = (r: Response) => r.json().catch(() => null);
    const [f, d, fr, i, al, sys] = await Promise.all([
      fetch("/api/admin/ai/fare").then(j),
      fetch("/api/admin/ai/demand").then(j),
      fetch("/api/admin/ai/fraud").then(j),
      fetch("/api/admin/ai/insights").then(j),
      fetch("/api/admin/ai/allocate").then(j),
      fetch("/api/admin/system").then(j),
    ]);
    setFare(f); setDemand(d); setFraud(fr); setInsights(i); setAllocate(al);
    if (sys?.flags) setFlags(sys.flags);
  }, []);

  useEffect(() => { load(); }, [load]);

  async function toggle(key: string, isEnabled: boolean) {
    await fetch("/api/admin/system", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action: "flag", key, isEnabled }),
    });
    setMsg(`${key} → ${isEnabled ? "ON" : "OFF"}`);
    await load();
  }

  const card = "rounded-2xl border border-black/5 bg-white p-5 shadow-sm";
  const off = (x: any) => !x?.ok;

  return (
    <main className="mx-auto max-w-6xl px-4 py-8">
      <h1 className="text-2xl font-black">AI engine</h1>
      <p className="text-sm text-pm-ink/60">Self-hosted, explainable models trained on ParcelMaadi&apos;s own data — no external AI calls, no data leaves your infrastructure.</p>
      {msg && <p className="mt-2 rounded-lg bg-pm-yellow/40 px-3 py-2 text-sm font-medium">{msg}</p>}

      <div className="mt-4 flex flex-wrap gap-2">
        {flags.length === 0 && <p className="text-xs text-pm-ink/40">No feature flags yet — toggles below create them on first flip.</p>}
        {flags.map((f) => (
          <button key={f.key} type="button" onClick={() => toggle(f.key, !f.enabled)}
            className={`rounded-full px-4 py-1.5 text-xs font-bold ${f.enabled ? "bg-green-600 text-white" : "bg-pm-ink/10 text-pm-ink/60"}`}>
            {f.enabled ? "● " : "○ "}{f.key}
          </button>
        ))}
      </div>

      <div className="mt-5 grid grid-cols-1 gap-4 lg:grid-cols-2">
        <div className={card}>
          <p className="text-sm font-bold">💰 Fare recommendation</p>
          {off(fare) ? <p className="mt-1 text-sm text-pm-ink/50">{fare?.error ?? "Unavailable."}</p> : (
            <>
              <p className="mt-1 text-3xl font-black">{fare.multiplier}× <span className="text-sm font-bold text-pm-ink/50">suggested</span></p>
              <p className="text-sm text-pm-ink/70">{fare.reason}</p>
              <p className="mt-1 text-xs text-pm-ink/40">Demand {fare.openDemand} · supply {fare.availableRiders} · pressure {fare.pressure}</p>
            </>
          )}
        </div>

        <div className={card}>
          <p className="text-sm font-bold">📈 Demand forecast (7 days)</p>
          {off(demand) ? <p className="mt-1 text-sm text-pm-ink/50">{demand?.error ?? "Unavailable."}</p> : (
            <div className="mt-2 flex items-end gap-1" style={{ height: 90 }}>
              {demand.forecast.map((d: any) => {
                const max = Math.max(1, ...demand.forecast.map((x: any) => x.predicted));
                return (
                  <div key={d.date} className="flex flex-1 flex-col items-center gap-1" title={`${d.date}: ~${d.predicted} bookings`}>
                    <div className="w-full rounded-t bg-pm-red" style={{ height: `${(d.predicted / max) * 70}px` }} />
                    <span className="text-[9px] text-pm-ink/40">{d.date.slice(5)}</span>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        <div className={card}>
          <p className="text-sm font-bold">🛡 Fraud detection</p>
          {off(fraud) ? <p className="mt-1 text-sm text-pm-ink/50">{fraud?.error ?? "Unavailable."}</p> : (
            <div className="mt-2 space-y-1.5 max-h-72 overflow-y-auto pm-scroll">
              {fraud.signals.length === 0 && <p className="text-sm text-pm-ink/50">No fraud signals detected. ✓</p>}
              {fraud.signals.slice(0, 12).map((s: any, i: number) => (
                <div key={i} className="rounded-xl bg-pm-cream p-2 text-sm">
                  <p className="font-bold">{s.kind} · {s.subjectName} <span className={`ml-1 rounded-full px-2 py-0.5 text-[10px] ${s.severity === "HIGH" ? "bg-red-600 text-white" : "bg-amber-200"}`}>{s.severity}</span></p>
                  <p className="text-xs text-pm-ink/60">{s.detail}</p>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className={card}>
          <p className="text-sm font-bold">🧠 Business insights</p>
          {off(insights) ? <p className="mt-1 text-sm text-pm-ink/50">{insights?.error ?? "Unavailable."}</p> : (
            <ul className="mt-2 space-y-1.5 text-sm max-h-72 overflow-y-auto pm-scroll">
              {(insights.insights || []).map((ins: any, i: number) => (
                <li key={i} className="rounded-xl bg-pm-cream p-2">
                  <p className="font-bold">{ins.title}</p>
                  <p className="text-xs text-pm-ink/60">{ins.detail}</p>
                </li>
              ))}
            </ul>
          )}
        </div>

        <div className={`${card} lg:col-span-2`}>
          <p className="text-sm font-bold">🚚 Rider allocation suggestions</p>
          {off(allocate) ? <p className="mt-1 text-sm text-pm-ink/50">{allocate?.error ?? "Unavailable."}</p> : (
            <>
              <p className="mt-1 text-xs text-pm-ink/50">{allocate.unassignedCount} unassigned · {allocate.onlineRiders} online riders</p>
              <div className="mt-3 max-h-72 overflow-y-auto pm-scroll space-y-2">
                {(allocate.suggestions || []).slice(0, 10).map((s: any, i: number) => (
                  <div key={i} className="rounded-xl border border-black/5 bg-pm-cream p-3">
                    <div className="flex flex-wrap items-baseline justify-between gap-2">
                      <p className="font-bold text-sm">
                        {s.isEmergency && <span className="mr-2 text-pm-red">🚨</span>}
                        {s.bookingId}
                        <span className="ml-2 text-xs font-normal text-pm-ink/60">{s.service?.name}</span>
                      </p>
                      <span className="text-xs text-pm-ink/50">{s.bookingStatus}</span>
                    </div>
                    <p className="mt-1 text-xs text-pm-ink/70">
                      👤 {s.customer?.name} · 📞 {s.customer?.mobile} · 📍 {s.pickupAddress || "—"}
                    </p>
                    {s.suggestedRider ? (
                      <p className="mt-1 text-xs text-green-700">
                        ✓ {s.reason}
                      </p>
                    ) : (
                      <p className="mt-1 text-xs text-amber-700">⚠ {s.reason}</p>
                    )}
                  </div>
                ))}
                {(allocate.suggestions || []).length === 0 && <p className="text-sm text-pm-ink/50">No unassigned bookings — all caught up! ✓</p>}
              </div>
            </>
          )}
        </div>
      </div>

      <div className="mt-5 flex flex-wrap gap-2">
        <button type="button" onClick={() => toggle("AI_FARE", !flags.find((f) => f.key === "AI_FARE")?.enabled)}
          className="rounded-full bg-pm-yellow px-4 py-2 text-xs font-bold text-pm-ink">
          Toggle AI_FARE
        </button>
        <button type="button" onClick={() => toggle("AI_DEMAND", !flags.find((f) => f.key === "AI_DEMAND")?.enabled)}
          className="rounded-full bg-pm-yellow px-4 py-2 text-xs font-bold text-pm-ink">
          Toggle AI_DEMAND
        </button>
        <button type="button" onClick={() => toggle("AI_FRAUD", !flags.find((f) => f.key === "AI_FRAUD")?.enabled)}
          className="rounded-full bg-pm-yellow px-4 py-2 text-xs font-bold text-pm-ink">
          Toggle AI_FRAUD
        </button>
      </div>
    </main>
  );
}
