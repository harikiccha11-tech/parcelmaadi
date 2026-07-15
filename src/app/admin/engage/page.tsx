"use client";

// Admin · Engagement — rewards (scratch/spin/cashback/first/repeat offers),
// notification templates, and automation rules. Campaign scheduler lives in
// /admin/marketing; this page covers the engagement engines around it.

import { useCallback, useEffect, useState } from "react";

const inputCls = "rounded-lg border border-pm-ink/20 px-3 py-2 text-sm outline-none focus:border-pm-red";
type Tab = "rewards" | "templates" | "automations";

export default function EngagePage() {
  const [tab, setTab] = useState<Tab>("rewards");
  const [rewards, setRewards] = useState<any[]>([]);
  const [templates, setTemplates] = useState<any[]>([]);
  const [automations, setAutomations] = useState<any[]>([]);
  const [msg, setMsg] = useState<string | null>(null);
  const [rw, setRw] = useState({ kind: "SCRATCH_CARD", label: "", points: "50", couponCode: "", segment: "ALL", expiresInDays: "30" });
  const [tp, setTp] = useState({ name: "", channel: "IN_APP", title: "", body: "" });
  const [au, setAu] = useState({ name: "", trigger: "USER_SIGNUP", templateId: "" });

  const load = useCallback(async () => {
    const [r, t, a] = await Promise.all([
      fetch("/api/admin/rewards").then((x) => x.json()),
      fetch("/api/admin/templates").then((x) => x.json()),
      fetch("/api/admin/automations").then((x) => x.json()),
    ]);
    if (r.ok) setRewards(r.rewards ?? r.issued ?? []);
    if (t.ok) setTemplates(t.templates ?? []);
    if (a.ok) setAutomations(a.rules ?? a.automations ?? []);
  }, []);
  useEffect(() => { load(); }, [load]);

  async function post(url: string, body: Record<string, unknown>) {
    setMsg(null);
    const res = await fetch(url, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(body) });
    const d = await res.json();
    if (!d.ok) { setMsg(d.error); return; }
    setMsg(d.issued !== undefined ? `Issued to ${d.issued} customers ✓` : "Saved ✓");
    await load();
  }

  return (
    <main className="mx-auto max-w-5xl px-4 py-8">
      <h1 className="text-2xl font-black">Customer engagement</h1>
      <div className="mt-4 flex gap-2">
        {(["rewards", "templates", "automations"] as Tab[]).map((t) => (
          <button type="button" key={t} onClick={() => setTab(t)} className={`rounded-full px-4 py-1.5 text-sm font-bold capitalize ${tab === t ? "bg-pm-red text-white" : "bg-white shadow"}`}>{t}</button>
        ))}
      </div>
      {msg && <p className="mt-3 rounded-lg bg-pm-yellow/30 px-3 py-2 text-sm font-semibold">{msg}</p>}

      {tab === "rewards" && (
        <>
          <div className="mt-4 rounded-2xl bg-white p-4 shadow">
            <p className="text-sm font-bold">Issue rewards / offers</p>
            <p className="text-xs text-pm-ink/50">Scratch cards & spin wheels reveal loyalty points or a coupon; first/repeat-booking offers and cashback credit loyalty points on reveal.</p>
            <div className="mt-2 grid grid-cols-2 gap-2 sm:grid-cols-6">
              <select className={inputCls} value={rw.kind} onChange={(e) => setRw({ ...rw, kind: e.target.value })}>
                {["SCRATCH_CARD", "SPIN_WHEEL", "CASHBACK", "FIRST_BOOKING", "REPEAT_BOOKING"].map((k) => <option key={k}>{k}</option>)}
              </select>
              <input className={inputCls} placeholder="Label (e.g. Ugadi scratch card)" value={rw.label} onChange={(e) => setRw({ ...rw, label: e.target.value })} />
              <input className={inputCls} placeholder="Points" value={rw.points} onChange={(e) => setRw({ ...rw, points: e.target.value.replace(/\D/g, "") })} />
              <input className={inputCls} placeholder="Coupon (optional)" value={rw.couponCode} onChange={(e) => setRw({ ...rw, couponCode: e.target.value.toUpperCase() })} />
              <select className={inputCls} value={rw.segment} onChange={(e) => setRw({ ...rw, segment: e.target.value })}>
                {["ALL", "NEW_7D", "REPEAT", "INACTIVE_30D"].map((s) => <option key={s}>{s}</option>)}
              </select>
              <button type="button" onClick={() => rw.label && post("/api/admin/rewards", { ...rw, points: Number(rw.points || 0), expiresInDays: Number(rw.expiresInDays), couponCode: rw.couponCode || undefined })} className="rounded-full bg-pm-red px-4 py-2 text-sm font-bold text-white hover:bg-pm-red-deep">Issue</button>
            </div>
          </div>
          <div className="mt-4 overflow-x-auto rounded-2xl bg-white shadow">
            <table className="w-full text-sm">
              <thead className="bg-pm-cream text-left text-xs uppercase tracking-wider text-pm-ink/50">
                <tr><th className="px-3 py-2">Reward</th><th className="px-3 py-2">Kind</th><th className="px-3 py-2">Points/Coupon</th><th className="px-3 py-2">Status</th><th className="px-3 py-2">Customer</th></tr>
              </thead>
              <tbody>
                {rewards.slice(0, 30).map((r) => (
                  <tr key={r.id} className="border-t border-pm-ink/5">
                    <td className="px-3 py-2">{r.label}</td>
                    <td className="px-3 py-2 text-xs">{r.kind}</td>
                    <td className="px-3 py-2 text-xs">{r.points ? `${r.points} pts` : ""}{r.couponCode ? ` ${r.couponCode}` : ""}</td>
                    <td className="px-3 py-2"><span className="rounded-full bg-pm-cream px-2 py-0.5 text-xs font-bold">{r.status}</span></td>
                    <td className="px-3 py-2 text-xs text-pm-ink/50">{r.user?.name ?? r.userId}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </>
      )}

      {tab === "templates" && (
        <>
          <div className="mt-4 rounded-2xl bg-white p-4 shadow">
            <p className="text-sm font-bold">New template</p>
            <p className="text-xs text-pm-ink/50">Placeholders: {"{name}"}, {"{bookingNumber}"}, {"{amount}"} — rendered at send time.</p>
            <div className="mt-2 grid grid-cols-1 gap-2 sm:grid-cols-4">
              <input className={inputCls} placeholder="Template name" value={tp.name} onChange={(e) => setTp({ ...tp, name: e.target.value })} />
              <select className={inputCls} value={tp.channel} onChange={(e) => setTp({ ...tp, channel: e.target.value })}>
                {["IN_APP", "WHATSAPP", "EMAIL", "SMS", "PUSH"].map((c) => <option key={c}>{c}</option>)}
              </select>
              <input className={`${inputCls} sm:col-span-2`} placeholder="Title" value={tp.title} onChange={(e) => setTp({ ...tp, title: e.target.value })} />
            </div>
            <textarea className={`${inputCls} mt-2 w-full`} rows={2} placeholder="Body with {placeholders}" value={tp.body} onChange={(e) => setTp({ ...tp, body: e.target.value })} />
            <button type="button" onClick={() => tp.name && tp.title && tp.body && post("/api/admin/templates", tp)} className="mt-2 rounded-full bg-pm-red px-5 py-1.5 text-sm font-bold text-white hover:bg-pm-red-deep">Save template</button>
          </div>
          <div className="mt-4 space-y-2">
            {templates.map((t) => (
              <div key={t.id} className="rounded-2xl bg-white p-3 shadow">
                <p className="text-sm font-bold">{t.name} <span className="rounded-full bg-pm-cream px-2 py-0.5 text-xs">{t.channel}</span></p>
                <p className="text-xs text-pm-ink/60">{t.title} — {t.body}</p>
              </div>
            ))}
          </div>
        </>
      )}

      {tab === "automations" && (
        <>
          <div className="mt-4 rounded-2xl bg-white p-4 shadow">
            <p className="text-sm font-bold">New automation rule</p>
            <p className="text-xs text-pm-ink/50">Trigger → template. Executed by the polling runner (/api/admin/automations/run) — call it from a cron (e.g. Vercel Cron) every 15 min.</p>
            <div className="mt-2 grid grid-cols-1 gap-2 sm:grid-cols-4">
              <input className={inputCls} placeholder="Rule name" value={au.name} onChange={(e) => setAu({ ...au, name: e.target.value })} />
              <select className={inputCls} value={au.trigger} onChange={(e) => setAu({ ...au, trigger: e.target.value })}>
                {["USER_SIGNUP", "BOOKING_DELIVERED", "ORDER_DELIVERED", "TICKET_RESOLVED", "CUSTOMER_INACTIVE_30D"].map((t) => <option key={t}>{t}</option>)}
              </select>
              <select className={inputCls} value={au.templateId} onChange={(e) => setAu({ ...au, templateId: e.target.value })}>
                <option value="">Select template</option>
                {templates.map((t) => <option key={t.id} value={t.id}>{t.name}</option>)}
              </select>
              <button type="button" onClick={() => au.name && au.templateId && post("/api/admin/automations", au)} className="rounded-full bg-pm-red px-4 py-2 text-sm font-bold text-white hover:bg-pm-red-deep">Create rule</button>
            </div>
          </div>
          <div className="mt-4 space-y-2">
            {automations.map((a) => (
              <div key={a.id} className="flex items-center justify-between rounded-2xl bg-white p-3 shadow">
                <p className="text-sm font-bold">{a.name} <span className="text-xs font-normal text-pm-ink/50">· {a.trigger} · {a.isActive ? "active" : "off"}{a.lastRunAt ? ` · last run ${new Date(a.lastRunAt).toLocaleString("en-IN")}` : ""}</span></p>
              </div>
            ))}
            <button type="button" onClick={() => post("/api/admin/automations/run", {})} className="rounded-full border border-pm-ink/20 px-4 py-2 text-sm font-semibold hover:bg-white">▶ Run automations now</button>
          </div>
        </>
      )}
    </main>
  );
}
