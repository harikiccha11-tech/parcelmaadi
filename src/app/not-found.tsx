import Link from "next/link";
import { Button } from "@/components/ui/button";

export default function NotFound() {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-brand-black text-white p-4 text-center">
      <img src="/logo.png" alt="ParcelMaadi" className="w-20 h-20 rounded-xl bg-white p-2 mb-4" />
      <h1 className="text-6xl font-extrabold text-brand-yellow mb-2">404</h1>
      <p className="text-lg mb-1">Page not found</p>
      <p className="text-sm text-white/60 mb-6">The page you're looking for doesn't exist or has moved.</p>
      <Link href="/"><Button className="bg-brand-yellow text-brand-black hover:bg-brand-gold font-bold">← Back to ParcelMaadi</Button></Link>
    </div>
  );
}
