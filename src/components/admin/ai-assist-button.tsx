"use client";
import { useState } from "react";
import { Sparkles, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";

interface AIAssistButtonProps {
  action: "grammar-fix" | "rewrite-professional" | "improve-title" | "seo-title" | "meta-description" | "keywords" | "suggest-category" | "marketing-description" | "alt-text";
  text: string;
  onResult: (result: string) => void;
  label?: string;
  size?: "sm" | "default";
  context?: string;
}

export function AIAssistButton({ action, text, onResult, label, size = "sm", context }: AIAssistButtonProps) {
  const [loading, setLoading] = useState(false);
  const handleAI = async () => {
    if (!text || text.trim().length < 2) { toast.error("Enter some text first"); return; }
    setLoading(true);
    try {
      const r = await fetch("/api/admin/ai-content", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action, text, context }),
      });
      const d = await r.json();
      if (!r.ok) throw new Error(d.error || "AI failed");
      if (d.result) { onResult(d.result); toast.success("AI content applied"); }
      else { toast.error("AI returned empty"); }
    } catch (e: any) { toast.error(e.message); }
    finally { setLoading(false); }
  };
  const labels: Record<string, string> = {
    "grammar-fix": "Fix Grammar", "rewrite-professional": "Rewrite", "improve-title": "Improve Title",
    "seo-title": "SEO Title", "meta-description": "Meta Desc", "keywords": "Keywords",
    "suggest-category": "AI Category", "marketing-description": "Marketing", "alt-text": "Alt Text",
  };
  return (
    <Button type="button" variant="outline" size={size} onClick={handleAI} disabled={loading}
      className="border-purple-400 text-purple-600 hover:bg-purple-50 gap-1.5 text-xs">
      {loading ? <Loader2 className="w-3 h-3 animate-spin" /> : <Sparkles className="w-3 h-3" />}
      {label || labels[action] || "AI"}
    </Button>
  );
}
