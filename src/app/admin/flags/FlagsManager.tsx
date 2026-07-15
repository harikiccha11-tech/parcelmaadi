"use client";

// Feature-flag toggles grouped by category, with coming-soon control.

import { useCallback, useEffect, useState } from "react";

type Flag = { id: string; key: string; label: string; description: string | null; groupName: string; isEnabled: boolean; comingSoon: boolean };

export default function FlagsManager() {
  const [flags, setFlags] = useState<Flag[]>([]);
  const [msg, setMsg] = useState<string | null>(null);

  const load = useCallback(async () => {
    const res = await fetch("/api/admin/flags");
    const d = await res.json();
    if (d.ok) setFlags(d.flags);
    else setMsg(d.error);
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  async function patch(key: string, body: Record<string, unknown>) {
    setFlags((prev) => prev.map((f) => (f.key === key ? { ...f, ...body } : f)));
    await fetch("/api/admin/flags", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ key, ...body }),
    });
  }

  const groups = [...new Set(flags.map((f) => f.groupName))];

  return (
    <div>
      {msg && <p className="mb-3 rounded-lg bg-pm-red/10 px-3 py-2 text-sm text-pm-red-deep">{msg}</p>}
      {groups.map((g) => (
        <div key={g} className="mt-4">
          <h2 className="text-xs font-bold uppercase tracking-widest text-pm-ink/50">{g}</h2>
          <div className="mt-2 space-y-2">
            {flags.filter((f) => f.groupName === g).map((f) => (
              <div key={f.id} className="flex flex-wrap items-center justify-between gap-3 rounded-2xl bg-white p-4 shadow">
                <div>
                  <p className="text-sm font-bold">
                    {f.label}
                    {f.comingSoon && <span className="ml-2 rounded-full bg-pm-yellow px-2 py-0.5 text-[10px] font-bold">COMING SOON</span>}
                  </p>
                  {f.description && <p className="text-xs text-pm-ink/50">{f.description}</p>}
                  <p className="font-mono text-[10px] text-pm-ink/40">{f.key}</p>
                </div>
                <div className="flex items-center gap-3">
                  <label className="flex items-center gap-1.5 text-xs font-semibold">
                    <input type="checkbox" checked={f.comingSoon} onChange={() => patch(f.key, { comingSoon: !f.comingSoon })} className="h-4 w-4 accent-pm-yellow-deep" />
                    Coming soon
                  </label>
                  <button
                    type="button"
                    onClick={() => patch(f.key, { isEnabled: !f.isEnabled })}
                    className={`rounded-full px-4 py-1.5 text-xs font-bold ${f.isEnabled ? "bg-green-600 text-white hover:bg-green-700" : "bg-pm-cream text-pm-ink hover:bg-pm-ink/10"}`}
                  >
                    {f.isEnabled ? "Enabled" : "Disabled"}
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}
