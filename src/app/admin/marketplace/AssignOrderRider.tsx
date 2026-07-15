"use client";

// Admin marketplace rider assignment — same-city riders listed first.

import { useState } from "react";
import { useRouter } from "next/navigation";

export default function AssignOrderRider({
  orderId,
  cityId,
  riders,
  isReassign,
}: {
  orderId: string;
  cityId: string;
  riders: Array<{ id: string; cityId: string; label: string }>;
  isReassign: boolean;
}) {
  const router = useRouter();
  const [riderId, setRiderId] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const sorted = [...riders].sort((a, b) => Number(b.cityId === cityId) - Number(a.cityId === cityId));

  async function assign() {
    setError(null);
    setBusy(true);
    try {
      const res = await fetch(`/api/admin/orders/${orderId}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "assign", riderId }),
      });
      const data = await res.json();
      if (!res.ok || !data.ok) {
        setError(data.error ?? "Could not assign");
        return;
      }
      router.refresh();
    } catch {
      setError("Network error");
    } finally {
      setBusy(false);
    }
  }

  return (
    <span className="inline-flex flex-wrap items-center gap-2">
      <select
        value={riderId}
        onChange={(e) => setRiderId(e.target.value)}
        className="rounded-lg border border-pm-ink/20 px-2 py-1.5 text-xs outline-none focus:border-pm-red"
      >
        <option value="">{isReassign ? "Reassign rider…" : "Assign rider…"}</option>
        {sorted.map((r) => (
          <option key={r.id} value={r.id}>
            {r.cityId === cityId ? "📍 " : ""}
            {r.label}
          </option>
        ))}
      </select>
      <button
        type="button"
        onClick={assign}
        disabled={!riderId || busy}
        className="rounded-full bg-pm-red px-4 py-1.5 text-xs font-bold text-white hover:bg-pm-red-deep disabled:opacity-50 transition-colors"
      >
        {busy ? "…" : "Assign"}
      </button>
      {error && <span className="text-xs font-medium text-pm-red-deep">{error}</span>}
    </span>
  );
}
