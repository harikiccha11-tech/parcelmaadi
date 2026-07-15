"use client";
import { useCallback, useEffect, useState } from "react";
import Link from "next/link";

type Emp = { id: string; employeeCode: string; name: string; designation: string; phone: string; monthlySalary: number; status: string; department: { name: string } | null; city: { name: string } | null };
type Dept = { id: string; name: string; _count: { employees: number } };
const inputCls = "rounded-lg border border-pm-ink/20 px-3 py-2 text-sm outline-none focus:border-pm-red";

export default function EmployeesPage() {
  const [employees, setEmployees] = useState<Emp[]>([]);
  const [depts, setDepts] = useState<Dept[]>([]);
  const [cities, setCities] = useState<Array<{ id: string; name: string }>>([]);
  const [q, setQ] = useState("");
  const [open, setOpen] = useState(false);
  const [deptName, setDeptName] = useState("");
  const [msg, setMsg] = useState<string | null>(null);
  const [form, setForm] = useState({ name: "", phone: "", email: "", designation: "", departmentId: "", cityId: "", monthlySalary: "" });

  const load = useCallback(async () => {
    const [e, d] = await Promise.all([
      fetch(`/api/admin/employees?q=${encodeURIComponent(q)}`).then((r) => r.json()),
      fetch("/api/admin/departments").then((r) => r.json()),
    ]);
    if (e.ok) setEmployees(e.employees);
    if (d.ok) setDepts(d.departments);
  }, [q]);
  useEffect(() => { load(); fetch("/api/catalog/cities").then((r) => r.json()).then((d) => d.ok && setCities(d.cities)).catch(() => {}); }, [load]);

  async function addDept() {
    if (!deptName) return;
    const res = await fetch("/api/admin/departments", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ name: deptName }) });
    const d = await res.json();
    if (!d.ok) { setMsg(d.error); return; }
    setDeptName(""); await load();
  }
  async function create() {
    setMsg(null);
    const res = await fetch("/api/admin/employees", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ ...form, monthlySalary: Number(form.monthlySalary || 0) }) });
    const d = await res.json();
    if (!d.ok) { setMsg(d.error); return; }
    setOpen(false); setForm({ name: "", phone: "", email: "", designation: "", departmentId: "", cityId: "", monthlySalary: "" }); await load();
  }

  return (
    <main className="mx-auto max-w-6xl px-4 py-8">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h1 className="text-2xl font-black">Employees</h1>
        <button type="button" onClick={() => setOpen((v) => !v)} className="rounded-full bg-pm-red px-5 py-2 text-sm font-bold text-white hover:bg-pm-red-deep">{open ? "Close" : "+ Add employee"}</button>
      </div>

      <div className="mt-4 rounded-2xl bg-white p-4 shadow">
        <p className="text-sm font-bold">Departments</p>
        <div className="mt-2 flex flex-wrap items-center gap-2">
          {depts.map((d) => <span key={d.id} className="rounded-full bg-pm-cream px-3 py-1 text-xs font-semibold">{d.name} · {d._count.employees}</span>)}
          <input className={`${inputCls} w-40`} placeholder="New department" value={deptName} onChange={(e) => setDeptName(e.target.value)} />
          <button type="button" onClick={addDept} className="rounded-full bg-pm-yellow px-3 py-1 text-xs font-bold hover:bg-pm-yellow-deep">Add</button>
        </div>
      </div>

      {open && (
        <div className="mt-4 rounded-2xl bg-white p-5 shadow">
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
            <input className={inputCls} placeholder="Full name" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
            <input className={inputCls} placeholder="Mobile" value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value.replace(/\D/g, "") })} maxLength={10} />
            <input className={inputCls} placeholder="Email (optional)" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} />
            <input className={inputCls} placeholder="Designation" value={form.designation} onChange={(e) => setForm({ ...form, designation: e.target.value })} />
            <select className={inputCls} value={form.departmentId} onChange={(e) => setForm({ ...form, departmentId: e.target.value })}>
              <option value="">Department</option>
              {depts.map((d) => <option key={d.id} value={d.id}>{d.name}</option>)}
            </select>
            <select className={inputCls} value={form.cityId} onChange={(e) => setForm({ ...form, cityId: e.target.value })}>
              <option value="">City</option>
              {cities.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
            </select>
            <input className={inputCls} placeholder="Monthly salary ₹" value={form.monthlySalary} onChange={(e) => setForm({ ...form, monthlySalary: e.target.value.replace(/[^\d.]/g, "") })} />
          </div>
          {msg && <p className="mt-2 text-xs font-medium text-pm-red-deep">{msg}</p>}
          <button type="button" onClick={create} disabled={!form.name || !form.phone || !form.designation} className="mt-3 rounded-full bg-pm-red px-6 py-2 text-sm font-bold text-white hover:bg-pm-red-deep disabled:opacity-50">Create</button>
        </div>
      )}

      <div className="mt-4 flex items-center gap-2">
        <input className={`${inputCls} w-64`} placeholder="Search name / code" value={q} onChange={(e) => setQ(e.target.value)} />
      </div>

      <div className="mt-3 overflow-x-auto rounded-2xl bg-white shadow">
        <table className="w-full text-sm">
          <thead className="bg-pm-cream text-left text-xs uppercase tracking-wider text-pm-ink/50">
            <tr><th className="px-3 py-2">Code</th><th className="px-3 py-2">Name</th><th className="px-3 py-2">Designation</th><th className="px-3 py-2">Dept</th><th className="px-3 py-2 text-right">Salary</th><th className="px-3 py-2">Status</th><th className="px-3 py-2"></th></tr>
          </thead>
          <tbody>
            {employees.length === 0 && <tr><td colSpan={7} className="px-3 py-6 text-center text-pm-ink/50">No employees yet.</td></tr>}
            {employees.map((e) => (
              <tr key={e.id} className="border-t border-pm-ink/5">
                <td className="px-3 py-2 font-mono font-bold">{e.employeeCode}</td>
                <td className="px-3 py-2">{e.name}<span className="block text-xs text-pm-ink/40">{e.phone}</span></td>
                <td className="px-3 py-2">{e.designation}</td>
                <td className="px-3 py-2">{e.department?.name ?? "—"}</td>
                <td className="px-3 py-2 text-right">₹{e.monthlySalary.toLocaleString("en-IN")}</td>
                <td className="px-3 py-2"><span className="rounded-full bg-pm-cream px-2 py-0.5 text-xs font-bold">{e.status}</span></td>
                <td className="px-3 py-2"><Link href={`/hr/employees/${e.id}`} className="text-xs font-bold text-pm-red hover:underline">Open</Link></td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </main>
  );
}
