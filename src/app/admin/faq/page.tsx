"use client";

// Admin · FAQ & knowledge base manager.

import { useCallback, useEffect, useState } from "react";

const inputCls = "rounded-lg border border-pm-ink/20 px-3 py-2 text-sm outline-none focus:border-pm-red";

export default function AdminFaqPage() {
  const [items, setItems] = useState<any[]>([]);
  const [form, setForm] = useState({ category: "General", question: "", answer: "" });
  const [msg, setMsg] = useState<string | null>(null);

  const load = useCallback(async () => {
    const res = await fetch("/api/admin/faq");
    const d = await res.json();
    if (d.ok) setItems(d.articles ?? d.items ?? []);
  }, []);
  useEffect(() => { load(); }, [load]);

  async function add() {
    setMsg(null);
    const res = await fetch("/api/admin/faq", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(form) });
    const d = await res.json();
    if (!d.ok) { setMsg(d.error); return; }
    setForm({ category: "General", question: "", answer: "" }); await load();
  }
  async function toggle(id: string, isPublished: boolean) {
    await fetch("/api/admin/faq", { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ id, isPublished: !isPublished }) });
    await load();
  }

  return (
    <main className="mx-auto max-w-4xl px-4 py-8">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-black">FAQ & knowledge base</h1>
        <a href="/help" target="_blank" rel="noreferrer" className="text-sm font-bold text-pm-red hover:underline">View public /help →</a>
      </div>

      <div className="mt-4 rounded-2xl bg-white p-4 shadow">
        <div className="grid grid-cols-1 gap-2 sm:grid-cols-3">
          <input className={inputCls} placeholder="Category" value={form.category} onChange={(e) => setForm({ ...form, category: e.target.value })} />
          <input className={`${inputCls} sm:col-span-2`} placeholder="Question" value={form.question} onChange={(e) => setForm({ ...form, question: e.target.value })} />
        </div>
        <textarea className={`${inputCls} mt-2 w-full`} rows={3} placeholder="Answer" value={form.answer} onChange={(e) => setForm({ ...form, answer: e.target.value })} />
        {msg && <p className="mt-1 text-xs font-medium text-pm-red-deep">{msg}</p>}
        <button type="button" onClick={add} disabled={!form.question || !form.answer} className="mt-2 rounded-full bg-pm-red px-5 py-1.5 text-sm font-bold text-white hover:bg-pm-red-deep disabled:opacity-50">Add article</button>
      </div>

      <div className="mt-4 space-y-2">
        {items.map((f) => (
          <div key={f.id} className="rounded-2xl bg-white p-4 shadow">
            <div className="flex items-start justify-between gap-2">
              <div>
                <p className="text-xs font-bold uppercase tracking-wider text-pm-ink/40">{f.category}</p>
                <p className="text-sm font-bold">{f.question}</p>
                <p className="mt-1 text-sm text-pm-ink/60">{f.answer}</p>
              </div>
              <button type="button" onClick={() => toggle(f.id, f.isPublished)} className={`rounded-full px-3 py-1 text-xs font-bold ${f.isPublished ? "bg-green-100 text-green-800" : "bg-pm-cream text-pm-ink/50"}`}>
                {f.isPublished ? "Published" : "Draft"}
              </button>
            </div>
          </div>
        ))}
      </div>
    </main>
  );
}
