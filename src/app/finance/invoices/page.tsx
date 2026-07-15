"use client";

// Finance · Invoices — GST invoice register + create form.

import { useCallback, useEffect, useState } from "react";

type Invoice = {
  id: string; invoiceNumber: string; status: string; partyName: string; partyGstin: string | null;
  subtotal: number; cgst: number; sgst: number; igst: number; totalAmount: number; issuedAt: string;
};
type Line = { description: string; hsnSac: string; quantity: string; unitPrice: string };

const inputCls = "rounded-lg border border-pm-ink/20 px-3 py-2 text-sm outline-none focus:border-pm-red";

export default function InvoicesPage() {
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [open, setOpen] = useState(false);
  const [msg, setMsg] = useState<string | null>(null);
  const [party, setParty] = useState({ partyName: "", partyGstin: "", partyPhone: "", partyAddress: "", placeOfSupply: "", gstRate: "18" });
  const [lines, setLines] = useState<Line[]>([{ description: "", hsnSac: "", quantity: "1", unitPrice: "" }]);

  const load = useCallback(async () => {
    const res = await fetch("/api/admin/invoices");
    const d = await res.json();
    if (d.ok) setInvoices(d.invoices);
  }, []);
  useEffect(() => { load(); }, [load]);

  const subtotal = lines.reduce((s, l) => s + (Number(l.quantity) || 0) * (Number(l.unitPrice) || 0), 0);
  const gstAmount = Math.round((subtotal * (Number(party.gstRate) || 0)) / 100 * 100) / 100;

  async function create() {
    setMsg(null);
    const res = await fetch("/api/admin/invoices", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        ...party,
        gstRate: Number(party.gstRate),
        lineItems: lines.map((l) => ({ description: l.description, hsnSac: l.hsnSac || undefined, quantity: Number(l.quantity), unitPrice: Number(l.unitPrice) })),
      }),
    });
    const d = await res.json();
    if (!d.ok) { setMsg(d.error); return; }
    setOpen(false);
    setParty({ partyName: "", partyGstin: "", partyPhone: "", partyAddress: "", placeOfSupply: "", gstRate: "18" });
    setLines([{ description: "", hsnSac: "", quantity: "1", unitPrice: "" }]);
    await load();
  }

  return (
    <main className="mx-auto max-w-6xl px-4 py-8">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h1 className="text-2xl font-black">GST Invoices</h1>
        <div className="flex gap-2">
          <a href="/api/admin/finance/export?dataset=invoices" className="rounded-full border border-pm-ink/20 px-4 py-2 text-sm font-semibold hover:bg-white">⬇ Export CSV</a>
          <button type="button" onClick={() => setOpen((v) => !v)} className="rounded-full bg-pm-red px-5 py-2 text-sm font-bold text-white hover:bg-pm-red-deep">
            {open ? "Close" : "+ New invoice"}
          </button>
        </div>
      </div>

      {open && (
        <div className="mt-4 rounded-2xl bg-white p-5 shadow">
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
            <input className={inputCls} placeholder="Party / client name" value={party.partyName} onChange={(e) => setParty({ ...party, partyName: e.target.value })} />
            <input className={inputCls} placeholder="GSTIN (optional)" value={party.partyGstin} onChange={(e) => setParty({ ...party, partyGstin: e.target.value })} />
            <input className={inputCls} placeholder="Phone" value={party.partyPhone} onChange={(e) => setParty({ ...party, partyPhone: e.target.value })} />
            <input className={inputCls} placeholder="Place of supply (state)" value={party.placeOfSupply} onChange={(e) => setParty({ ...party, placeOfSupply: e.target.value })} />
            <input className={inputCls} placeholder="GST rate %" value={party.gstRate} onChange={(e) => setParty({ ...party, gstRate: e.target.value.replace(/[^\d.]/g, "") })} />
            <input className={inputCls} placeholder="Address" value={party.partyAddress} onChange={(e) => setParty({ ...party, partyAddress: e.target.value })} />
          </div>

          <p className="mt-4 text-xs font-bold uppercase tracking-wider text-pm-ink/50">Line items</p>
          {lines.map((l, i) => (
            <div key={i} className="mt-2 grid grid-cols-12 gap-2">
              <input className={`${inputCls} col-span-5`} placeholder="Description" value={l.description} onChange={(e) => setLines(lines.map((x, j) => (j === i ? { ...x, description: e.target.value } : x)))} />
              <input className={`${inputCls} col-span-2`} placeholder="HSN/SAC" value={l.hsnSac} onChange={(e) => setLines(lines.map((x, j) => (j === i ? { ...x, hsnSac: e.target.value } : x)))} />
              <input className={`${inputCls} col-span-2`} placeholder="Qty" value={l.quantity} onChange={(e) => setLines(lines.map((x, j) => (j === i ? { ...x, quantity: e.target.value.replace(/[^\d.]/g, "") } : x)))} />
              <input className={`${inputCls} col-span-2`} placeholder="Rate ₹" value={l.unitPrice} onChange={(e) => setLines(lines.map((x, j) => (j === i ? { ...x, unitPrice: e.target.value.replace(/[^\d.]/g, "") } : x)))} />
              <button type="button" onClick={() => setLines(lines.filter((_, j) => j !== i))} className="col-span-1 rounded-lg bg-pm-red/10 text-pm-red-deep">✕</button>
            </div>
          ))}
          <button type="button" onClick={() => setLines([...lines, { description: "", hsnSac: "", quantity: "1", unitPrice: "" }])} className="mt-2 text-xs font-bold text-pm-red hover:underline">
            + Add line
          </button>

          <div className="mt-4 flex items-center justify-between border-t border-pm-ink/10 pt-3 text-sm">
            <span className="text-pm-ink/60">Taxable ₹{subtotal.toLocaleString("en-IN")} + GST ₹{gstAmount.toLocaleString("en-IN")}</span>
            <span className="text-lg font-black text-pm-red">₹{(subtotal + gstAmount).toLocaleString("en-IN")}</span>
          </div>
          {msg && <p className="mt-2 text-xs font-medium text-pm-red-deep">{msg}</p>}
          <button type="button" onClick={create} disabled={!party.partyName || lines.some((l) => !l.description || !l.unitPrice)} className="mt-3 rounded-full bg-pm-red px-6 py-2 text-sm font-bold text-white hover:bg-pm-red-deep disabled:opacity-50">
            Create invoice
          </button>
        </div>
      )}

      <div className="mt-5 overflow-x-auto rounded-2xl bg-white shadow">
        <table className="w-full text-sm">
          <thead className="bg-pm-cream text-left text-xs uppercase tracking-wider text-pm-ink/50">
            <tr><th className="px-3 py-2">Invoice</th><th className="px-3 py-2">Party</th><th className="px-3 py-2 text-right">Taxable</th><th className="px-3 py-2 text-right">GST</th><th className="px-3 py-2 text-right">Total</th><th className="px-3 py-2">Status</th><th className="px-3 py-2"></th></tr>
          </thead>
          <tbody>
            {invoices.length === 0 && <tr><td colSpan={7} className="px-3 py-6 text-center text-pm-ink/50">No invoices yet.</td></tr>}
            {invoices.map((i) => (
              <tr key={i.id} className="border-t border-pm-ink/5">
                <td className="px-3 py-2 font-mono font-bold">{i.invoiceNumber}</td>
                <td className="px-3 py-2">{i.partyName}{i.partyGstin ? <span className="block text-xs text-pm-ink/40">{i.partyGstin}</span> : null}</td>
                <td className="px-3 py-2 text-right">₹{i.subtotal.toLocaleString("en-IN")}</td>
                <td className="px-3 py-2 text-right">₹{(i.cgst + i.sgst + i.igst).toLocaleString("en-IN")}</td>
                <td className="px-3 py-2 text-right font-black">₹{i.totalAmount.toLocaleString("en-IN")}</td>
                <td className="px-3 py-2"><span className="rounded-full bg-pm-cream px-2 py-0.5 text-xs font-bold">{i.status}</span></td>
                <td className="px-3 py-2"><a href={`/api/admin/invoices/${i.id}/pdf`} target="_blank" rel="noreferrer" className="text-xs font-bold text-pm-red hover:underline">Print</a></td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </main>
  );
}
