"use client";

// Admin media upload — file → Supabase Storage → MediaAsset record.
// Categories map to storage folders: product/logo/banner/general.

import { useState } from "react";
import { useRouter } from "next/navigation";

const categories = [
  { value: "general", label: "General", folder: "media" },
  { value: "product", label: "Product image", folder: "products" },
  { value: "logo", label: "Company logo", folder: "logos" },
  { value: "banner", label: "Banner", folder: "banners" },
] as const;

export default function UploadAsset() {
  const router = useRouter();
  const [label, setLabel] = useState("");
  const [category, setCategory] = useState<string>("general");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function onFile(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setError(null);
    setBusy(true);
    try {
      const folder = categories.find((c) => c.value === category)?.folder ?? "media";
      const fd = new FormData();
      fd.append("file", file);
      fd.append("folder", folder);
      const up = await fetch("/api/uploads", { method: "POST", body: fd });
      const upData = await up.json();
      if (!up.ok || !upData.ok) {
        setError(upData.error ?? "Upload failed");
        return;
      }
      const res = await fetch("/api/admin/resources/media", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ url: upData.url, label: label || file.name, category }),
      });
      const data = await res.json();
      if (!res.ok || !data.ok) {
        setError(data.error ?? "Could not save the asset");
        return;
      }
      setLabel("");
      router.refresh();
    } catch {
      setError("Network error");
    } finally {
      setBusy(false);
      e.target.value = "";
    }
  }

  return (
    <div className="rounded-2xl bg-white p-4 shadow">
      <p className="text-sm font-bold">Upload to Supabase Storage</p>
      <div className="mt-2 flex flex-wrap items-center gap-2">
        <input
          value={label}
          onChange={(e) => setLabel(e.target.value)}
          placeholder="Label (optional)"
          className="rounded-lg border border-pm-ink/20 px-3 py-1.5 text-sm outline-none focus:border-pm-red"
        />
        <select
          value={category}
          onChange={(e) => setCategory(e.target.value)}
          className="rounded-lg border border-pm-ink/20 px-2 py-1.5 text-sm outline-none"
        >
          {categories.map((c) => (
            <option key={c.value} value={c.value}>
              {c.label}
            </option>
          ))}
        </select>
        <label className="cursor-pointer rounded-full bg-pm-red px-4 py-2 text-sm font-bold text-white hover:bg-pm-red-deep transition-colors">
          {busy ? "Uploading…" : "📤 Choose file & upload"}
          <input type="file" accept="image/*,.pdf" onChange={onFile} disabled={busy} className="hidden" />
        </label>
      </div>
      {error && <p className="mt-2 text-xs font-medium text-pm-red-deep">{error}</p>}
      <p className="mt-1 text-xs text-pm-ink/50">Needs SUPABASE_URL + SUPABASE_SERVICE_ROLE_KEY in .env — or add by URL instead →</p>
    </div>
  );
}
