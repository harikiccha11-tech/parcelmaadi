"use client";

// Attach a media asset URL to a catalog entity's imageUrl.

import { useState } from "react";
import { useRouter } from "next/navigation";

const targets = [
  { value: "vehicles", label: "Vehicle" },
  { value: "grocery-products", label: "Grocery product" },
  { value: "materials", label: "Material" },
  { value: "machinery", label: "Machinery" },
] as const;

export default function AttachMedia({
  url,
  options,
}: {
  url: string;
  options: Record<string, Array<{ id: string; name: string }>>;
}) {
  const router = useRouter();
  const [resource, setResource] = useState<string>("");
  const [entityId, setEntityId] = useState("");
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState<string | null>(null);

  async function attach() {
    if (!resource || !entityId) return;
    setBusy(true);
    setMsg(null);
    try {
      const res = await fetch(`/api/admin/resources/${resource}/${entityId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ imageUrl: url }),
      });
      const data = await res.json();
      setMsg(res.ok && data.ok ? "✓ Attached" : data.error ?? "Failed");
      if (res.ok) router.refresh();
    } catch {
      setMsg("Network error");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="mt-2 flex flex-wrap items-center gap-1.5 text-xs">
      <select
        value={resource}
        onChange={(e) => {
          setResource(e.target.value);
          setEntityId("");
        }}
        className="rounded-lg border border-pm-ink/20 px-2 py-1 outline-none"
      >
        <option value="">Attach to…</option>
        {targets.map((t) => (
          <option key={t.value} value={t.value}>
            {t.label}
          </option>
        ))}
      </select>
      {resource && (
        <select
          value={entityId}
          onChange={(e) => setEntityId(e.target.value)}
          className="max-w-[160px] rounded-lg border border-pm-ink/20 px-2 py-1 outline-none"
        >
          <option value="">Select</option>
          {(options[resource] ?? []).map((o) => (
            <option key={o.id} value={o.id}>
              {o.name}
            </option>
          ))}
        </select>
      )}
      <button
        type="button"
        onClick={attach}
        disabled={!resource || !entityId || busy}
        className="rounded-full bg-pm-red px-3 py-1 font-bold text-white hover:bg-pm-red-deep disabled:opacity-50 transition-colors"
      >
        {busy ? "…" : "Set image"}
      </button>
      {msg && <span className="font-medium">{msg}</span>}
    </div>
  );
}
