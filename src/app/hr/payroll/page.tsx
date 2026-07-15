"use client";
import { useCallback, useEffect, useState } from "react";

type Emp = { id: string; name: string; employeeCode: string; monthlySalary: number };
const inputCls = "rounded-lg border border-pm-ink/20 px-3 py-2 text-sm outline-none focus:border-pm-red";
const now = new Date();

export default function PayrollPage() {
  const [emps, setEmps] = useState<Emp[]>([]);
  const [sel, setSel] = useState("");
  const [form, setForm] = useState({ periodMonth: String(now.getMonth() + 1), periodYear: String(now.getFullYear()), daysPresent: "26", allowances: "0", incentives: "0", deductions: "0" });
  const [msg, setMsg] = useState<string | null>(null);

  const load = useCallback(async () => {
    const res = await fetch("/api/admin/employees");
    const d = await res.json();
    if (d.ok) setEmps(d.employees);
  }, []);
  useEffect(() => { load(); }, [load]);

  async function generate() {
    setMsg(null);
    if (!sel) return;
    const res = await fetch(`/api/admin/employees/${sel}/payslip`, {
      method: "POST", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        periodMonth: Number(form.periodMonth), periodYear: Number(form.periodYear), daysPresent: Number(form.daysPresent),
        allowances: Number(form.allowances), incentives: Number(form.incentives), deductions: Number(form.deductions),
      }),
    });
    const d = await res.json();
    if (!d.ok) { setMsg(d.error); return; }
    setMsg("Payslip generated ✓");
    if (d.payslipId) window.open(`/api/admin/payslip/${d.payslipId}/pdf`, "_blank");
  }

  const emp = emps.find((e) => e.id === sel);

  return (
    <main className="mx-auto max-w-3xl px-4 py-8">
      <h1 className="text-2xl font-black">Payroll</h1>
      <p className="text-sm text-pm-ink/60">Generate a monthly salary slip. Basic is pro-rated by days present; net pay posts to the finance ledger automatically.</p>

      <div className="mt-4 rounded-2xl bg-white p-5 shadow">
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
          <select className={inputCls} value={sel} onChange={(e) => setSel(e.target.value)}>
            <option value="">Select employee</option>
            {emps.map((e) => <option key={e.id} value={e.id}>{e.name} ({e.employeeCode}) · ₹{e.monthlySalary}</option>)}
          </select>
          <div className="grid grid-cols-2 gap-2">
            <input className={inputCls} placeholder="Month" value={form.periodMonth} onChange={(e) => setForm({ ...form, periodMonth: e.target.value.replace(/\D/g, "") })} />
            <input className={inputCls} placeholder="Year" value={form.periodYear} onChange={(e) => setForm({ ...form, periodYear: e.target.value.replace(/\D/g, "") })} />
          </div>
          <input className={inputCls} placeholder="Days present" value={form.daysPresent} onChange={(e) => setForm({ ...form, daysPresent: e.target.value.replace(/\D/g, "") })} />
          <input className={inputCls} placeholder="Allowances ₹" value={form.allowances} onChange={(e) => setForm({ ...form, allowances: e.target.value.replace(/[^\d.]/g, "") })} />
          <input className={inputCls} placeholder="Incentives ₹" value={form.incentives} onChange={(e) => setForm({ ...form, incentives: e.target.value.replace(/[^\d.]/g, "") })} />
          <input className={inputCls} placeholder="Deductions ₹" value={form.deductions} onChange={(e) => setForm({ ...form, deductions: e.target.value.replace(/[^\d.]/g, "") })} />
        </div>
        {emp && <p className="mt-2 text-xs text-pm-ink/50">Monthly salary: ₹{emp.monthlySalary.toLocaleString("en-IN")}</p>}
        {msg && <p className="mt-2 text-sm font-medium text-pm-ink">{msg}</p>}
        <button type="button" onClick={generate} disabled={!sel} className="mt-3 rounded-full bg-pm-red px-6 py-2 text-sm font-bold text-white hover:bg-pm-red-deep disabled:opacity-50">Generate payslip</button>
      </div>
    </main>
  );
}
