"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export default function RepeatButton({ orderId }: { orderId: string }) {
  const router = useRouter();
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function repeat() {
    setBusy(true);
    setError(null);
    try {
      const res = await fetch(`/api/shop/orders/${orderId}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "repeat" }),
      });
      const data = await res.json();
      if (!res.ok || !data.ok) {
        setError(data.error ?? "Could not repeat the order");
        return;
      }
      router.push(`/account/orders/${data.order.id}`);
      router.refresh();
    } catch {
      setError("Network error");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="inline-block">
      <button
        type="button"
        onClick={repeat}
        disabled={busy}
        className="rounded-full bg-pm-yellow px-4 py-2 text-sm font-bold hover:bg-pm-yellow-deep disabled:opacity-50 transition-colors"
      >
        {busy ? "Repeating…" : "🔁 Repeat order"}
      </button>
      {error && <p className="mt-1 text-xs font-medium text-pm-red-deep">{error}</p>}
    </div>
  );
}
