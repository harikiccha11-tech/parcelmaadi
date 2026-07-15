"use client";

// /account/addresses — saved address book (CRUD).

import { useEffect, useState } from "react";

type CityRec = { id: string; name: string; zones: Array<{ id: string; name: string }> };
type Addr = { id: string; label: string; address: string; cityId: string; zoneId: string; isDefault: boolean; city: { name: string }; zone: { name: string } };

const inputCls = "mt-1 w-full rounded-lg border border-pm-ink/20 bg-white px-3 py-2 text-sm outline-none focus:border-pm-red";

export default function AddressesPage() {
  const [addresses, setAddresses] = useState<Addr[]>([]);
  const [cities, setCities] = useState<CityRec[]>([]);
  const [label, setLabel] = useState("");
  const [address, setAddress] = useState("");
  const [cityId, setCityId] = useState("");
  const [zoneId, setZoneId] = useState("");
  const [isDefault, setIsDefault] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  async function reload() {
    const res = await fetch("/api/account/addresses");
    const data = await res.json();
    if (data.ok) setAddresses(data.addresses);
  }

  useEffect(() => {
    reload();
    fetch("/api/catalog/cities")
      .then((r) => r.json())
      .then((d) => d.ok && setCities(d.cities))
      .catch(() => {});
  }, []);

  async function add() {
    setError(null);
    setBusy(true);
    try {
      const res = await fetch("/api/account/addresses", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ label, address, cityId, zoneId, isDefault }),
      });
      const data = await res.json();
      if (!res.ok || !data.ok) {
        setError(data.error ?? "Could not save");
        return;
      }
      setLabel(""); setAddress(""); setCityId(""); setZoneId(""); setIsDefault(false);
      await reload();
    } finally {
      setBusy(false);
    }
  }

  async function remove(id: string) {
    await fetch(`/api/account/addresses/${id}`, { method: "DELETE" });
    await reload();
  }

  async function makeDefault(id: string) {
    await fetch(`/api/account/addresses/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ isDefault: true }),
    });
    await reload();
  }

  const zones = cities.find((c) => c.id === cityId)?.zones ?? [];

  return (
    <main className="mx-auto max-w-3xl px-4 py-8">
      <h1 className="text-2xl font-black">Saved addresses</h1>

      <div className="mt-4 space-y-2">
        {addresses.map((a) => (
          <div key={a.id} className="flex items-start justify-between rounded-2xl bg-white p-4 shadow">
            <div>
              <p className="text-sm font-bold">
                📍 {a.label} {a.isDefault && <span className="rounded-full bg-pm-yellow px-2 py-0.5 text-[10px] font-bold">DEFAULT</span>}
              </p>
              <p className="text-xs text-pm-ink/60">{a.address}</p>
              <p className="text-xs text-pm-ink/40">
                {a.city.name} / {a.zone.name}
              </p>
            </div>
            <div className="flex gap-2">
              {!a.isDefault && (
                <button type="button" onClick={() => makeDefault(a.id)} className="rounded-full border border-pm-ink/20 px-3 py-1 text-xs font-semibold hover:bg-pm-yellow/40">
                  Set default
                </button>
              )}
              <button type="button" onClick={() => remove(a.id)} className="rounded-full border border-pm-red/40 px-3 py-1 text-xs font-semibold text-pm-red hover:bg-pm-red/10">
                Delete
              </button>
            </div>
          </div>
        ))}
      </div>

      <div className="mt-6 rounded-2xl bg-white p-5 shadow">
        <p className="text-sm font-bold">Add a new address</p>
        <div className="mt-2 grid grid-cols-1 gap-3 sm:grid-cols-2">
          <input value={label} onChange={(e) => setLabel(e.target.value)} placeholder="Label (Home / Office / Site)" className={inputCls} />
          <div className="flex items-center gap-2 pt-2">
            <input id="def" type="checkbox" checked={isDefault} onChange={(e) => setIsDefault(e.target.checked)} className="h-4 w-4 accent-pm-red" />
            <label htmlFor="def" className="text-sm">Use as default</label>
          </div>
          <select value={cityId} onChange={(e) => { setCityId(e.target.value); setZoneId(""); }} className={inputCls}>
            <option value="">Select city</option>
            {cities.map((c) => (
              <option key={c.id} value={c.id}>{c.name}</option>
            ))}
          </select>
          <select value={zoneId} onChange={(e) => setZoneId(e.target.value)} disabled={!cityId} className={`${inputCls} disabled:opacity-50`}>
            <option value="">Select zone</option>
            {zones.map((z) => (
              <option key={z.id} value={z.id}>{z.name}</option>
            ))}
          </select>
        </div>
        <textarea rows={2} value={address} onChange={(e) => setAddress(e.target.value)} placeholder="Door no, street, landmark" className={inputCls} />
        {error && <p className="mt-2 text-xs font-medium text-pm-red-deep">{error}</p>}
        <button
          type="button"
          onClick={add}
          disabled={busy || !label || !address || !cityId || !zoneId}
          className="mt-3 rounded-full bg-pm-red px-5 py-2 text-sm font-bold text-white hover:bg-pm-red-deep disabled:opacity-50"
        >
          {busy ? "Saving…" : "Save address"}
        </button>
      </div>
    </main>
  );
}
