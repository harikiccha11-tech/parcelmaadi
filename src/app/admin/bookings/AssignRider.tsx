"use client";

// Assign / reassign a rider to a booking (admin).

import { useState } from "react";
import { useRouter } from "next/navigation";

export default function AssignRider({
  bookingId,
  riders,
  currentRiderId,
}: {
  bookingId: string;
  riders: Array<{ id: string; name: string; vehicleNumber: string; isOnline: boolean }>;
  currentRiderId: string | null;
}) {
  const router = useRouter();
  const [riderId, setRiderId] = useState(currentRiderId ?? "");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function assign() {
    if (!riderId) return;
    setError(null);
    setBusy(true);
    try {
      const res = await fetch(`/api/admin/bookings/${bookingId}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "assign", riderId }),
      });
      const data = await res.json();
      if (!res.ok || !data.ok) {
        setError(data.error ?? "Assign failed");
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
    <div className="flex flex-col gap-1">
      <div className="flex items-center gap-1.5">
        <select
          value={riderId}
          onChange={(e) => setRiderId(e.target.value)}
          className="rounded-lg border border-pm-ink/20 bg-white px-2 py-1 text-xs outline-none focus:border-pm-red"
        >
          <option value="">Select rider</option>
          {riders.map((r) => (
            <option key={r.id} value={r.id}>
              {r.isOnline ? "🟢" : "⚪"} {r.name} · {r.vehicleNumber}
            </option>
          ))}
        </select>
        <button
          type="button"
          onClick={assign}
          disabled={!riderId || busy}
          className="rounded-full bg-pm-red px-3 py-1 text-xs font-bold text-white hover:bg-pm-red-deep disabled:opacity-50 transition-colors"
        >
          {busy ? "…" : currentRiderId ? "Reassign" : "Assign"}
        </button>
      </div>
      {error && <span className="text-[10px] font-medium text-pm-red-deep">{error}</span>}
    </div>
  );
}
