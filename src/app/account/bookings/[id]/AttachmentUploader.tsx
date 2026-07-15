"use client";

// Customer parcel-photo uploader — /api/uploads (attachments) then attach.

import { useState } from "react";
import { useRouter } from "next/navigation";

export default function AttachmentUploader({ bookingId }: { bookingId: string }) {
  const router = useRouter();
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function onFile(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setError(null);
    setBusy(true);
    try {
      const fd = new FormData();
      fd.append("file", file);
      fd.append("folder", "attachments");
      const up = await fetch("/api/uploads", { method: "POST", body: fd });
      const upData = await up.json();
      if (!up.ok || !upData.ok) {
        setError(upData.error ?? "Upload failed");
        return;
      }
      const res = await fetch(`/api/bookings/${bookingId}/attachment`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ url: upData.url }),
      });
      const data = await res.json();
      if (!res.ok || !data.ok) {
        setError(data.error ?? "Could not attach the photo");
        return;
      }
      router.refresh();
    } catch {
      setError("Network error");
    } finally {
      setBusy(false);
      e.target.value = "";
    }
  }

  return (
    <div className="mt-3">
      <label className="inline-flex cursor-pointer items-center gap-2 rounded-full border border-pm-ink/20 px-4 py-2 text-sm font-semibold hover:border-pm-red hover:text-pm-red transition-colors">
        📷 {busy ? "Uploading…" : "Add a parcel photo (helps the rider)"}
        <input type="file" accept="image/*,.pdf" onChange={onFile} disabled={busy} className="hidden" />
      </label>
      {error && <p className="mt-1 text-xs font-medium text-pm-red-deep">{error}</p>}
    </div>
  );
}
