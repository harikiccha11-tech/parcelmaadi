"use client";

// Admin · Notify — broadcast center (audience / zone / vehicle targeting),
// live SSE ticker, notification analytics, campaign scheduler runner.

import { useCallback, useEffect, useState } from "react";

const inputCls = "rounded-lg border border-pm-ink/20 px-3 py-2 text-sm outline-none focus:border-pm-red";

export default function NotifyPage() {
  const [analytics, setAnalytics] = useState<any>(null);
  const [zones, setZones] = useState<any[]>([]);
  const [vehicles, setVehicles] = useState<any[]>([]);
  const [live, setLive] = useState<any>(null);
  const [form, setForm] = useState({ title: "", body: "", audience: "CUSTOMER", zoneId: "", vehicleTypeId: "", linkUrl: "" });
  const [msg, setMsg] = useState<string | null>(null);

  const load = useCallback(async () => {
    const a = await fetch("/api/admin/notify/broadcast").then((r) => r.json());
    if (a.ok) setAnalytics(a.analytics);
    fetch("/api/catalog/cities")
      .then((r) => r.json())
      .then((d) => {
        if (!d.ok) return;
        const flat = (d.cities ?? []).flatMap((c: any) => (c.zones ?? []).map((z: any) => ({ id: z.id, name: `${z.name} · ${c.name}` })));
        setZones(flat);
      })
      .catch(() => {});
    fetch("/api/catalog/vehicles").then((r) => r.json()).then((d) => d.ok && setVehicles(d.vehicles ?? [])).catch(() => {});
  }, []);
  useEffect(() => {
    load();
    const es = new EventSource("/api/live/stream");
    es.onmessage = (e) => { try { setLive(JSON.parse(e.data)); } catch {} };
    return () => es.close();
  }, [load]);

  async function send() {
    setMsg(null);
    const res = await fetch("/api/admin/notify/broadcast", {
      method: "POST", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ ...form, zoneId: form.zoneId || undefined, vehicleTypeId: form.vehicleTypeId || undefined, linkUrl: form.linkUrl || undefined }),
    });
    const d = await res.json();
    setMsg(d.ok ? `Broadcast sent — ${d.recipients} recipients/subscribers reached` : d.error);
    if (d.ok) { setForm({ title: "", body: "", audience: "CUSTOMER", zoneId: "", vehicleTypeId: "", linkUrl: "" }); await load(); }
  }
  async function runScheduler() {
    const d = await fetch("/api/admin/campaigns/run-scheduled", { method: "POST" }).then((r) => r.json());
    setMsg(d.ok ? `Scheduler: dispatched ${d.dispatched} due campaigns` : d.error);
  }

  return (
    <main className="mx-auto max-w-5xl px-4 py-8">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h1 className="text-2xl font-black">Notification center</h1>
        {live && (
          <span className="flex items-center gap-2 rounded-full bg-pm-ink px-4 py-1.5 text-xs font-bold text-pm-yellow">
            <span className="h-2 w-2 animate-pulse rounded-full bg-green-400" />
            LIVE · {live.pending} pending · {live.inTransit} in-transit · {live.onlineRiders} riders · {live.sos} SOS
          </span>
        )}
      </div>
      {msg && <p className="mt-3 rounded-lg bg-pm-yellow/40 px-3 py-2 text-sm font-medium">{msg}</p>}

      <div className="mt-4 rounded-2xl bg-white p-5 shadow">
        <p className="text-sm font-bold">Broadcast</p>
        <div className="mt-2 grid grid-cols-1 gap-2 sm:grid-cols-3">
          <input className={inputCls} placeholder="Title" value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} />
          <select className={inputCls} value={form.audience} onChange={(e) => setForm({ ...form, audience: e.target.value })}>{["ALL","CUSTOMER","RIDER","VENDOR","BRANCH","ADMIN"].map((a) => <option key={a}>{a}</option>)}</select>
          <input className={inputCls} placeholder="Link URL (optional)" value={form.linkUrl} onChange={(e) => setForm({ ...form, linkUrl: e.target.value })} />
          <select className={inputCls} value={form.zoneId} onChange={(e) => setForm({ ...form, zoneId: e.target.value, vehicleTypeId: "" })}>
            <option value="">Zone-wise (optional)</option>
            {zones.map((z: any) => <option key={z.id} value={z.id}>{z.name}</option>)}
          </select>
          <select className={inputCls} value={form.vehicleTypeId} onChange={(e) => setForm({ ...form, vehicleTypeId: e.target.value, zoneId: "" })}>
            <option value="">Vehicle-type-wise (optional)</option>
            {vehicles.map((v: any) => <option key={v.id} value={v.id}>{v.name}</option>)}
          </select>
          <button type="button" onClick={runScheduler} className="rounded-full border border-pm-ink/20 px-4 py-2 text-sm font-semibold hover:bg-pm-cream">▶ Run campaign scheduler</button>
        </div>
        <textarea className={`${inputCls} mt-2 w-full`} rows={2} placeholder="Message" value={form.body} onChange={(e) => setForm({ ...form, body: e.target.value })} maxLength={500} />
        <button type="button" onClick={send} disabled={!form.title || !form.body} className="mt-2 rounded-full bg-pm-red px-6 py-2 text-sm font-bold text-white hover:bg-pm-red-deep disabled:opacity-50">Broadcast</button>
        <p className="mt-2 text-xs text-pm-ink/50">Zone/vehicle targeting notifies every customer who has booked in that zone or with that vehicle type. Templates live under Engage; web-push/FCM keys under Settings → finance/notifications.</p>
      </div>

      {analytics && (
        <div className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-4">
          <div className="rounded-2xl bg-white p-4 shadow"><p className="text-xs font-bold uppercase text-pm-ink/50">Sent (total)</p><p className="mt-1 text-xl font-black">{analytics.total}</p></div>
          <div className="rounded-2xl bg-white p-4 shadow"><p className="text-xs font-bold uppercase text-pm-ink/50">Read rate</p><p className="mt-1 text-xl font-black">{analytics.readRate}%</p></div>
          <div className="rounded-2xl bg-white p-4 shadow"><p className="text-xs font-bold uppercase text-pm-ink/50">Unread</p><p className="mt-1 text-xl font-black">{analytics.unread}</p></div>
          <div className="rounded-2xl bg-white p-4 shadow"><p className="text-xs font-bold uppercase text-pm-ink/50">Push subscribers</p><p className="mt-1 text-xl font-black">{analytics.pushSubscribers.reduce((s: number, x: any) => s + x._count, 0)}</p></div>
        </div>
      )}
    </main>
  );
}
