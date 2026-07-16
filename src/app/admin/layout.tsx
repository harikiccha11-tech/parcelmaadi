// /admin layout — alternative Next.js App Router admin interface (v1.1 upgrade).
// The original admin-app.tsx remains available at "/" via the view toggle.
// These /admin/* routes are an additional admin surface that exposes
// the new v1.1 modules: AI, analytics, audit, CRM, corporate, dispatch,
// insights, live tracking, marketing, reviews, security, system.

import Link from "next/link";
import { requireAdmin } from "@/lib/auth";
import { db } from "@/lib/db";

export const dynamic = "force-dynamic";

const NAV: Array<[string, string, string]> = [
  ["/admin", "Dashboard", "📊"],
  ["/admin/analytics", "Analytics", "📈"],
  ["/admin/insights", "Insights", "🧠"],
  ["/admin/ai", "AI engine", "🤖"],
  ["/admin/audit", "Audit", "🛡"],
  ["/admin/crm", "CRM", "👥"],
  ["/admin/corporate", "Corporate", "🏢"],
  ["/admin/dispatch", "Dispatch", "🚚"],
  ["/admin/live", "Live tracking", "📍"],
  ["/admin/marketing", "Marketing", "📣"],
  ["/admin/reviews", "Reviews", "⭐"],
  ["/admin/security", "Security", "🔐"],
  ["/admin/system", "System", "⚙"],
];

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const auth = await requireAdmin();
  if (!auth.ok) {
    return (
      <div className="min-h-screen bg-pm-cream flex items-center justify-center p-6">
        <div className="max-w-md rounded-2xl border border-pm-red/20 bg-white p-8 text-center shadow">
          <h1 className="text-xl font-black text-pm-red">Admin sign-in required</h1>
          <p className="mt-2 text-sm text-pm-ink/60">
            Sign in on the main site, then come back to <code>/admin</code>.
          </p>
          <Link
            href="/"
            className="mt-5 inline-block rounded-full bg-pm-red px-6 py-2.5 text-sm font-bold text-white"
          >
            Go to home
          </Link>
        </div>
      </div>
    );
  }

  // Optional super-admin flag (kept loose — Owner = super)
  const isSuper = auth.admin.role === "Owner";

  // Pending counts (best-effort — never block layout render)
  let pending = { suppliers: 0, products: 0, tickets: 0, settlements: 0 };
  try {
    const [suppliers, products, tickets, settlements] = await Promise.all([
      db.supplier.count({ where: { status: "Pending" } }),
      db.product.count({ where: { status: "Pending" } }),
      db.supportTicket.count({ where: { status: "Open" } }),
      db.settlement.count({ where: { status: "Pending" } }),
    ]);
    pending = { suppliers, products, tickets, settlements };
  } catch {}

  return (
    <div className="min-h-screen bg-pm-cream">
      <header className="bg-pm-red text-white">
        <div className="mx-auto max-w-7xl px-4 py-3 flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-4">
            <Link href="/admin" className="font-black tracking-tight">
              ParcelMaadi <span className="font-semibold text-white/80">· Admin v2</span>
            </Link>
            <span className="hidden sm:inline rounded-full bg-white/15 px-3 py-1 text-xs font-semibold">
              {isSuper ? "Super Admin" : auth.admin.role}
            </span>
          </div>
          <div className="flex items-center gap-4">
            <Link href="/" className="text-sm font-medium text-white/80 hover:text-white">
              ← Back to site
            </Link>
            <span className="text-sm font-medium text-white/80">{auth.admin.name || auth.admin.email}</span>
          </div>
        </div>
        <nav className="bg-pm-red-deep/40 border-t border-white/10">
          <div className="mx-auto max-w-7xl px-4 flex flex-wrap items-center gap-x-4 gap-y-1 py-2 text-sm font-semibold text-white/85">
            {NAV.map(([href, label, icon]) => (
              <Link key={href} href={href} className="hover:text-white transition-colors">
                <span className="mr-1">{icon}</span>
                {label}
              </Link>
            ))}
          </div>
        </nav>
      </header>

      {pending.suppliers + pending.products + pending.tickets + pending.settlements > 0 && (
        <div className="bg-pm-yellow/30 border-b border-pm-yellow/40">
          <div className="mx-auto max-w-7xl px-4 py-1.5 text-xs font-medium text-pm-ink/80">
            Pending approvals: {pending.suppliers} suppliers · {pending.products} products · {pending.tickets} tickets · {pending.settlements} settlements
          </div>
        </div>
      )}

      <main className="mx-auto max-w-7xl px-4 py-8">{children}</main>

      <footer className="mt-auto bg-pm-ink/5 py-4 text-center text-xs text-pm-ink/40">
        ParcelMaadi v1.1 · alternative admin ·{" "}
        <Link href="/" className="underline">main site</Link>
      </footer>
    </div>
  );
}
