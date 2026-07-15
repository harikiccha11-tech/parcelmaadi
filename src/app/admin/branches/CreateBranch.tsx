"use client";

// Create a branch with portal login credentials.

import { useState } from "react";
import { useRouter } from "next/navigation";

const inputCls = "mt-1 w-full rounded-lg border border-pm-ink/20 bg-white px-3 py-2 text-sm outline-none focus:border-pm-red";

export default function CreateBranch({ cities }: { cities: Array<{ id: string; name: string }> }) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState({ name: "", cityId: "", address: "", managerName: "", phone: "", email: "", password: "" });
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  const set = (k: string) => (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) =>
    setForm((f) => ({ ...f, [k]: e.target.value }));

  async function submit() {
    setError(null);
    setBusy(true);
    try {
      const res = await fetch("/api/admin/branches", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
      const data = await res.json();
      if (!res.ok || !data.ok) {
        setError(data.error ?? "Could not create branch");
        return;
      }
      setOpen(false);
      setForm({ name: "", cityId: "", address: "", managerName: "", phone: "", email: "", password: "" });
      router.refresh();
    } catch {
      setError("Network error");
    } finally {
      setBusy(false);
    }
  }

  if (!open) {
    return (
      <button type="button" onClick={() => setOpen(true)} className="rounded-full bg-pm-red px-5 py-2 text-sm font-bold text-white hover:bg-pm-red-deep transition-colors">
        + Create branch
      </button>
    );
  }

  return (
    <div className="w-full rounded-2xl bg-white p-5 shadow">
      <p className="text-sm font-bold">New franchise / branch (with portal login)</p>
      <div className="mt-2 grid grid-cols-1 gap-3 sm:grid-cols-2">
        <input value={form.name} onChange={set("name")} placeholder="Branch name (ParcelMaadi Davanagere)" className={inputCls} />
        <select value={form.cityId} onChange={set("cityId")} className={inputCls}>
          <option value="">Territory (city)</option>
          {cities.map((c) => (
            <option key={c.id} value={c.id}>{c.name}</option>
          ))}
        </select>
        <input value={form.managerName} onChange={set("managerName")} placeholder="Manager name" className={inputCls} />
        <input value={form.phone} onChange={(e) => setForm((f) => ({ ...f, phone: e.target.value.replace(/\D/g, "") }))} maxLength={10} placeholder="Manager mobile" className={inputCls} />
        <input type="email" value={form.email} onChange={set("email")} placeholder="Portal login email" className={inputCls} />
        <input type="password" value={form.password} onChange={set("password")} placeholder="Portal password (min 8)" className={inputCls} />
      </div>
      <textarea rows={2} value={form.address} onChange={set("address")} placeholder="Branch address" className={inputCls} />
      {error && <p className="mt-2 text-xs font-medium text-pm-red-deep">{error}</p>}
      <div className="mt-3 flex gap-2">
        <button type="button" onClick={submit} disabled={busy} className="rounded-full bg-pm-red px-5 py-2 text-sm font-bold text-white hover:bg-pm-red-deep disabled:opacity-50">
          {busy ? "Creating…" : "Create branch"}
        </button>
        <button type="button" onClick={() => setOpen(false)} className="rounded-full border border-pm-ink/20 px-5 py-2 text-sm font-semibold hover:bg-pm-cream">
          Cancel
        </button>
      </div>
    </div>
  );
}
