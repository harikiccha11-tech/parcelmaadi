"use client";

// Account · My reviews — rate delivered bookings/orders + view past reviews.

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";

type Pending = { bookings: Array<{ id: string; bookingNumber: string; deliveredAt: string }>; orders: Array<{ id: string; orderNumber: string; type: string; deliveredAt: string }> };
type Review = { id: string; target: string; rating: number; title: string | null; comment: string | null; reply: string | null; createdAt: string };

function Stars({ value, onChange }: { value: number; onChange: (v: number) => void }) {
  return (
    <span className="text-2xl">
      {[1, 2, 3, 4, 5].map((i) => (
        <button type="button" key={i} onClick={() => onChange(i)} className={i <= value ? "text-pm-yellow-deep" : "text-pm-ink/20"} aria-label={`${i} stars`}>★</button>
      ))}
    </span>
  );
}

export default function MyReviewsPage() {
  const [pending, setPending] = useState<Pending | null>(null);
  const [reviews, setReviews] = useState<Review[]>([]);
  const [open, setOpen] = useState<{ target: string; targetId: string; label: string } | null>(null);
  const [rating, setRating] = useState(5);
  const [comment, setComment] = useState("");
  const [photoUrl, setPhotoUrl] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);
  const [msg, setMsg] = useState<string | null>(null);

  async function uploadPhoto(file: File) {
    setUploading(true); setMsg(null);
    try {
      const fd = new FormData();
      fd.append("file", file);
      fd.append("folder", "attachments");
      const res = await fetch("/api/uploads", { method: "POST", body: fd });
      const d = await res.json();
      if (d.ok && d.url) setPhotoUrl(d.url);
      else setMsg(d.error ?? "Upload failed");
    } catch {
      setMsg("Upload failed");
    }
    setUploading(false);
  }

  const load = useCallback(async () => {
    const res = await fetch("/api/reviews");
    if (res.status === 401) { window.location.href = "/login?next=/account/reviews"; return; }
    const d = await res.json();
    if (d.ok) { setPending(d.pending); setReviews(d.reviews); }
  }, []);
  useEffect(() => { load(); }, [load]);

  async function submit() {
    if (!open) return;
    setMsg(null);
    const res = await fetch("/api/reviews", {
      method: "POST", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ target: open.target, targetId: open.targetId, rating, comment: comment || undefined, photoUrl: photoUrl || undefined }),
    });
    const d = await res.json();
    if (!d.ok) { setMsg(d.error); return; }
    setOpen(null); setRating(5); setComment(""); setPhotoUrl(null); await load();
  }

  return (
    <main className="mx-auto max-w-2xl px-4 py-8">
      <Link href="/account" className="text-sm font-semibold text-pm-ink/60 hover:text-pm-red">← My account</Link>
      <h1 className="mt-2 text-2xl font-black">My reviews</h1>

      {pending && (pending.bookings.length > 0 || pending.orders.length > 0) && (
        <div className="mt-4 rounded-2xl bg-pm-yellow/30 p-4">
          <p className="text-sm font-bold">Rate your recent deliveries</p>
          <div className="mt-2 space-y-1.5">
            {pending.bookings.map((b) => (
              <div key={b.id} className="flex items-center justify-between rounded-xl bg-white p-2.5 text-sm">
                <span>🚚 {b.bookingNumber}</span>
                <button type="button" onClick={() => setOpen({ target: "BOOKING", targetId: b.id, label: b.bookingNumber })} className="rounded-full bg-pm-red px-4 py-1 text-xs font-bold text-white hover:bg-pm-red-deep">Rate</button>
              </div>
            ))}
            {pending.orders.map((o) => (
              <div key={o.id} className="flex items-center justify-between rounded-xl bg-white p-2.5 text-sm">
                <span>🛍 {o.orderNumber} <span className="text-xs text-pm-ink/40">· {o.type}</span></span>
                <button type="button" onClick={() => setOpen({ target: "ORDER", targetId: o.id, label: o.orderNumber })} className="rounded-full bg-pm-red px-4 py-1 text-xs font-bold text-white hover:bg-pm-red-deep">Rate</button>
              </div>
            ))}
          </div>
        </div>
      )}

      {open && (
        <div className="mt-4 rounded-2xl bg-white p-5 shadow">
          <p className="text-sm font-bold">Rate {open.label}</p>
          <div className="mt-2"><Stars value={rating} onChange={setRating} /></div>
          <textarea className="mt-2 w-full rounded-lg border border-pm-ink/20 px-3 py-2 text-sm outline-none focus:border-pm-red" rows={3} placeholder="Share your experience (optional)" value={comment} onChange={(e) => setComment(e.target.value)} maxLength={1000} />
          <div className="mt-2 flex items-center gap-2 text-xs">
            <label className="cursor-pointer rounded-full border border-pm-ink/20 px-3 py-1.5 font-semibold hover:bg-pm-cream">
              📷 {uploading ? "Uploading…" : photoUrl ? "Change photo" : "Add photo"}
              <input type="file" accept="image/*" className="hidden" onChange={(e) => e.target.files?.[0] && uploadPhoto(e.target.files[0])} />
            </label>
            {photoUrl && <span className="text-green-700 font-bold">✓ Photo attached</span>}
          </div>
          {msg && <p className="mt-1 text-xs font-medium text-pm-red-deep">{msg}</p>}
          <div className="mt-2 flex gap-2">
            <button type="button" onClick={submit} className="rounded-full bg-pm-red px-6 py-2 text-sm font-bold text-white hover:bg-pm-red-deep">Submit review</button>
            <button type="button" onClick={() => setOpen(null)} className="rounded-full border border-pm-ink/20 px-4 py-2 text-sm font-semibold">Cancel</button>
          </div>
          <p className="mt-2 text-xs text-pm-ink/50">Your rating also credits the {open.target === "BOOKING" ? "rider" : "vendor"} automatically.</p>
        </div>
      )}

      <h2 className="mt-8 text-xs font-bold uppercase tracking-widest text-pm-ink/50">Past reviews</h2>
      <div className="mt-2 space-y-2">
        {reviews.filter((r) => r.target === "BOOKING" || r.target === "ORDER" || r.target === "PRODUCT").length === 0 && (
          <p className="rounded-2xl border border-dashed border-pm-ink/20 bg-white/60 p-6 text-center text-sm text-pm-ink/50">No reviews yet — rate a delivery above.</p>
        )}
        {reviews.filter((r) => r.target === "BOOKING" || r.target === "ORDER" || r.target === "PRODUCT").map((r) => (
          <div key={r.id} className="rounded-2xl bg-white p-4 shadow">
            <div className="flex items-center justify-between">
              <span className="text-pm-yellow-deep">{"★".repeat(r.rating)}</span>
              <span className="text-xs text-pm-ink/40">{r.target} · {new Date(r.createdAt).toLocaleDateString("en-IN")}</span>
            </div>
            {r.comment && <p className="mt-1 text-sm text-pm-ink/70">{r.comment}</p>}
            {r.reply && <p className="mt-1 rounded-lg bg-pm-cream p-2 text-xs"><strong>ParcelMaadi:</strong> {r.reply}</p>}
          </div>
        ))}
      </div>
    </main>
  );
}
