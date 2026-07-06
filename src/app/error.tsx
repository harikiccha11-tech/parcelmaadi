"use client";
import { Button } from "@/components/ui/button";
import { useEffect } from "react";

export default function Error({ error, reset }: { error: Error & { digest?: string }; reset: () => void }) {
  useEffect(() => {
    console.error("App error:", error);
  }, [error]);
  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-brand-black text-white p-4 text-center">
      <img src="/logo.png" alt="ParcelMaadi" className="w-20 h-20 rounded-xl bg-white p-2 mb-4" />
      <h1 className="text-3xl font-extrabold text-brand-red mb-2">Something went wrong</h1>
      <p className="text-sm text-white/60 mb-6 max-w-md">An unexpected error occurred. Please try again. If the problem persists, contact support.</p>
      <Button className="bg-brand-yellow text-brand-black hover:bg-brand-gold font-bold" onClick={() => reset()}>Try again</Button>
    </div>
  );
}
