"use client";
import { useCallback, useEffect, useState } from "react";

type Applicant = { id: string; name: string; phone: string; role: string; status: string; email: string | null; createdAt: string };
const inputCls = "rounded-lg border border-pm-ink/20 px-3 py-2 text-sm outline-none focus:border-pm-red";
const STAGES = ["APPLIED", "SHORTLISTED", "INTERVIEW", "OFFERED", "HIRED", "REJECTED"];

export default function RecruitmentPage() {
  const [applicants, setApplicants] = useState<Applicant[]>([]);
  const [form, setForm] = useState({ name: "", phone: "", email: "", role: "" });
  const [msg, setMsg] = useState<string | null>(null);

  const load = useCallback(async () => {
    const res = await fetch("/api/admin/recruitment");
    const d = await res.json();
    if (d.ok) setApplicants(d.applicants);
  }, []);
  useEffect(() => { load(); }, [load]);

  async function add() {
    setMsg(null);
    const res = await fetch("/api/admin/recruitment", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(form) });
    const d = await res.json();
    if (!d.ok) { setMsg(d.error); return; }
    setForm({ name: "", phone: "", email: "", role: "" }); await load();
  }
  async function setStage(id: string, status: string) {
    await fetch(`/api/admin/recruitment/${id}`, { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ status }) });
    await load();
  }
  async function hire(a: Applicant) {
    const designation = window.prompt("Designation for hire?", a.role);
    if (!designation) return;
    const salary = window.prompt("Monthly salary ₹?", "20000");
    if (!salary) return;
    const res = await fetch(`/api/admin/recruitment/${a.id}`, { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ hire: { designation, monthlySalary: Number(salary) } }) });
    const d = await res.json();
    if (!d.ok) { setMsg(d.error); return; }
    setMsg(`Hired ${a.name} ✓`); await load();
  }

  return (
    <main className="mx-auto max-w-4xl px-4 py-8">
      <h1 className="text-2xl font-black">Recruitment</h1>
      <div className="mt-4 rounded-2xl bg-white p-4 shadow">
        <p className="text-sm font-bold">Add applicant</p>
        <div className="mt-2 grid grid-cols-1 gap-2 sm:grid-cols-5">
          <input className={inputCls} placeholder="Name" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
          <input className={inputCls} placeholder="Phone" value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value.replace(/\D/g, "") })} maxLength={10} />
          <input className={inputCls} placeholder="Email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} />
          <input className={inputCls} placeholder="Role" value={form.role} onChange={(e) => setForm({ ...form, role: e.target.value })} />
          <button type="button" onClick={add} disabled={!form.name || !form.phone || !form.role} className="rounded-full bg-pm-red px-4 py-2 text-sm font-bold text-white hover:bg-pm-red-deep disabled:opacity-50">Add</button>
        </div>
        {msg && <p className="mt-2 text-sm font-medium text-pm-ink">{msg}</p>}
      </div>

      <div className="mt-4 space-y-2">
        {applicants.map((a) => (
          <div key={a.id} className="flex flex-wrap items-center justify-between gap-2 rounded-2xl bg-white p-4 shadow">
            <div>
              <p className="text-sm font-bold">{a.name} <span className="text-xs font-normal text-pm-ink/40">· {a.role}</span></p>
              <p className="text-xs text-pm-ink/50">{a.phone}{a.email ? ` · ${a.email}` : ""}</p>
            </div>
            <div className="flex flex-wrap items-center gap-1.5">
              <select value={a.status} onChange={(e) => setStage(a.id, e.target.value)} className="rounded-lg border border-pm-ink/20 px-2 py-1 text-xs">
                {STAGES.map((s) => <option key={s} value={s}>{s}</option>)}
              </select>
              {a.status !== "HIRED" && <button type="button" onClick={() => hire(a)} className="rounded-full bg-green-600 px-3 py-1 text-xs font-bold text-white hover:bg-green-700">Hire</button>}
            </div>
          </div>
        ))}
      </div>
    </main>
  );
}
