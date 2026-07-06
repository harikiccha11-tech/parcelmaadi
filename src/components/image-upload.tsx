"use client";
import { useState, useRef } from "react";
import { Upload, Loader2, X, Link as LinkIcon, ImageIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";

interface ImageUploadProps {
  value: string;
  onChange: (url: string) => void;
  label?: string;
  placeholder?: string;
}

/**
 * Reusable image upload component:
 * - Click "Upload" button → opens file picker (works on mobile + laptop)
 * - Select PNG/JPG/WEBP/GIF from device → uploads to /api/admin/upload → returns URL
 * - Preview shows immediately after upload
 * - Also has "URL" tab for pasting an external image URL
 * - Remove button clears the image
 */
export function ImageUpload({ value, onChange, label = "Image", placeholder = "Upload or paste image URL" }: ImageUploadProps) {
  const [uploading, setUploading] = useState(false);
  const [mode, setMode] = useState<"upload" | "url">("upload");
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileSelect = async (file: File) => {
    if (!file) return;
    // Client-side validation
    const allowedTypes = ["image/jpeg", "image/jpg", "image/png", "image/webp", "image/gif"];
    if (!allowedTypes.includes(file.type)) {
      toast.error(`Invalid file type. Allowed: JPG, PNG, WEBP, GIF`);
      return;
    }
    if (file.size > 5 * 1024 * 1024) {
      toast.error("File too large. Max 5MB.");
      return;
    }

    setUploading(true);
    try {
      const formData = new FormData();
      formData.append("file", file);
      const r = await fetch("/api/admin/upload", { method: "POST", body: formData, credentials: "include" });
      if (!r.ok) {
        const err = await r.json().catch(() => ({}));
        throw new Error(err.error || "Upload failed");
      }
      const data = await r.json();
      onChange(data.url);
      toast.success("Image uploaded successfully!");
    } catch (e: any) {
      toast.error(e.message || "Upload failed");
    } finally {
      setUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  };

  return (
    <div>
      <Label className="text-xs font-semibold mb-1.5 block">{label}</Label>
      {/* Mode toggle */}
      <div className="flex gap-1 mb-2">
        <button
          type="button"
          onClick={() => setMode("upload")}
          className={`px-3 py-1 rounded-md text-xs font-medium transition-colors ${mode === "upload" ? "bg-brand-yellow text-brand-black" : "bg-muted text-muted-foreground hover:bg-muted/70"}`}
        >
          <Upload className="w-3 h-3 inline mr-1" /> Upload from Device
        </button>
        <button
          type="button"
          onClick={() => setMode("url")}
          className={`px-3 py-1 rounded-md text-xs font-medium transition-colors ${mode === "url" ? "bg-brand-yellow text-brand-black" : "bg-muted text-muted-foreground hover:bg-muted/70"}`}
        >
          <LinkIcon className="w-3 h-3 inline mr-1" /> Paste URL
        </button>
      </div>

      {mode === "upload" ? (
        <div>
          <input
            ref={fileInputRef}
            type="file"
            accept="image/jpeg,image/jpg,image/png,image/webp,image/gif"
            className="hidden"
            onChange={(e) => {
              const f = e.target.files?.[0];
              if (f) handleFileSelect(f);
            }}
          />
          <Button
            type="button"
            variant="outline"
            onClick={() => fileInputRef.current?.click()}
            disabled={uploading}
            className="w-full h-10 border-dashed border-2 hover:border-brand-yellow hover:bg-brand-yellow/5"
          >
            {uploading ? (
              <><Loader2 className="w-4 h-4 mr-2 animate-spin" /> Uploading...</>
            ) : (
              <><Upload className="w-4 h-4 mr-2" /> Click to select image from device</>
            )}
          </Button>
          <p className="text-[10px] text-muted-foreground mt-1">JPG, PNG, WEBP, GIF · Max 5MB · Works on mobile & laptop</p>
        </div>
      ) : (
        <Input
          value={value && value.startsWith("/uploads/") ? "" : value}
          onChange={(e) => onChange(e.target.value)}
          placeholder={placeholder}
        />
      )}

      {/* Preview */}
      {value ? (
        <div className="mt-2 flex items-center gap-3">
          <div className="relative">
            <img
              src={value}
              alt="Preview"
              className="w-20 h-20 rounded-lg object-cover border-2 border-border"
              onError={(e) => {
                (e.target as HTMLImageElement).style.opacity = "0.3";
              }}
            />
            <button
              type="button"
              onClick={() => onChange("")}
              className="absolute -top-1 -right-1 w-5 h-5 bg-red-600 text-white rounded-full flex items-center justify-center hover:bg-red-700"
              title="Remove image"
            >
              <X className="w-3 h-3" />
            </button>
          </div>
          <div className="text-[10px] text-muted-foreground flex-1">
            <p className="font-semibold text-green-700">✓ Image set</p>
            {value.startsWith("/uploads/") ? (
              <p>Uploaded from device · {value.split("/").pop()}</p>
            ) : (
              <p>External URL · {value.slice(0, 40)}...</p>
            )}
            <p className="mt-0.5">Click ✕ to remove, then upload/paste a new one.</p>
          </div>
        </div>
      ) : (
        <div className="mt-2 flex items-center gap-3">
          <div className="w-20 h-20 rounded-lg border-2 border-dashed border-border flex items-center justify-center bg-muted">
            <ImageIcon className="w-8 h-8 text-muted-foreground" />
          </div>
          <div className="text-[10px] text-muted-foreground">
            <p className="font-semibold">No image set</p>
            <p>Upload from your device or paste an image URL.</p>
          </div>
        </div>
      )}
    </div>
  );
}
