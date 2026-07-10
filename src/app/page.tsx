"use client";
import { useState } from "react";
import { CustomerApp } from "@/components/customer-app";
import { AdminApp } from "@/components/admin-app";
import { CartProvider } from "@/lib/cart";

// Force dynamic rendering — prevents stale CDN cache serving old HTML
export const dynamic = "force-dynamic";

export default function Home() {
  const [view, setView] = useState<"customer" | "admin">("customer");

  if (view === "admin") {
    return <AdminApp onExit={() => setView("customer")} />;
  }

  return (
    <CartProvider>
      <CustomerApp onOpenAdmin={() => setView("admin")} />
    </CartProvider>
  );
}
