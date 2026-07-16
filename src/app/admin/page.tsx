import Link from "next/link";
import { db } from "@/lib/db";

export const dynamic = "force-dynamic";

// /admin — alternative admin dashboard (v1.1).
// Lists the new modules added in v1.1 + quick KPIs from existing data.
export default async function AdminDashboard() {
  let kpis: any = {};
  try {
    const stats = await db.$queryRaw`
      SELECT
        COUNT(*)::int AS total_bookings,
        COUNT(*) FILTER (WHERE created_at >= DATE_TRUNC('day', NOW()))::int AS today_bookings,
        COUNT(*) FILTER (WHERE status = 'New')::int AS pending,
        COUNT(*) FILTER (WHERE status IN ('Assigned', 'Picked Up', 'In Progress'))::int AS active,
        COUNT(*) FILTER (WHERE status = 'Cancelled')::int AS cancelled,
        COUNT(*) FILTER (WHERE is_emergency = true)::int AS emergency,
        COALESCE(SUM(final_estimate) FILTER (WHERE created_at >= DATE_TRUNC('month', NOW()) AND status != 'Cancelled'), 0)::float AS revenue_month
      FROM "Booking"
    `;
    kpis = (stats as any[])[0] || {};
  } catch {}

  const cards: Array<[string, string, string, string]> = [
    ["/admin/analytics", "Analytics", "📈", "Visitor traffic, top cities, device split, popular pages."],
    ["/admin/insights", "Insights", "🧠", "Business KPIs, revenue trends, top services & customers."],
    ["/admin/ai", "AI engine", "🤖", "Fare multiplier, demand forecast, fraud signals, rider allocation."],
    ["/admin/audit", "Audit", "🛡", "Every admin action — login, edit, delete, payment change."],
    ["/admin/crm", "CRM", "👥", "Customer book-of-record, leads from waitlist & recent signups."],
    ["/admin/corporate", "Corporate", "🏢", "Corporate-account candidates derived from booking patterns."],
    ["/admin/dispatch", "Dispatch", "🚚", "Live dispatch board — unassigned queue + online riders."],
    ["/admin/live", "Live tracking", "📍", "Active bookings + online riders on the map."],
    ["/admin/marketing", "Marketing", "📣", "Offers, coupons, banners, waitlist signups."],
    ["/admin/reviews", "Reviews", "⭐", "Post-delivery feedback derived from completed bookings."],
    ["/admin/security", "Security", "🔐", "Admins, API keys, integrations, recent password resets."],
    ["/admin/system", "System", "⚙", "Feature flags, integrations, system info."],
  ];

  return (
    <>
      <h1 className="text-2xl font-black">Admin v2 · Dashboard</h1>
      <p className="mt-1 text-sm text-pm-ink/60">
        Alternative Next.js App Router admin surface — new v1.1 modules. The original
        admin remains available at <Link href="/" className="underline">the home page</Link>{" "}
        via the view toggle.
      </p>

      <section className="mt-5 grid grid-cols-2 gap-3 sm:grid-cols-4 lg:grid-cols-7">
        <Kpi label="Total bookings" value={kpis.total_bookings ?? "—"} />
        <Kpi label="Today" value={kpis.today_bookings ?? "—"} />
        <Kpi label="Pending" value={kpis.pending ?? "—"} accent="yellow" />
        <Kpi label="Active" value={kpis.active ?? "—"} accent="green" />
        <Kpi label="Emergency" value={kpis.emergency ?? "—"} accent="red" />
        <Kpi label="Cancelled" value={kpis.cancelled ?? "—"} />
        <Kpi label="Revenue (mo)" value={kpis.revenue_month ? `₹${Math.round(kpis.revenue_month).toLocaleString("en-IN")}` : "—"} accent="green" />
      </section>

      <section className="mt-6 grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {cards.map(([href, title, icon, desc]) => (
          <Link
            key={href}
            href={href}
            className="rounded-2xl border border-black/5 bg-white p-5 shadow-sm transition-all hover:-translate-y-0.5 hover:shadow-md"
          >
            <div className="flex items-start gap-3">
              <span className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-pm-cream text-xl">
                {icon}
              </span>
              <div className="min-w-0">
                <h2 className="font-bold leading-tight">{title}</h2>
                <p className="mt-1 text-xs text-pm-ink/60">{desc}</p>
              </div>
            </div>
          </Link>
        ))}
      </section>
    </>
  );
}

function Kpi({ label, value, accent }: { label: string; value: any; accent?: "yellow" | "green" | "red" }) {
  const color =
    accent === "yellow" ? "text-pm-yellow-deep"
    : accent === "green" ? "text-green-600"
    : accent === "red" ? "text-pm-red"
    : "text-pm-ink";
  return (
    <div className="rounded-xl border border-black/5 bg-white px-3 py-2.5 shadow-sm">
      <p className="text-[10px] font-bold uppercase tracking-wider text-pm-ink/50">{label}</p>
      <p className={`mt-0.5 text-lg font-black tabular-nums ${color}`}>{value}</p>
    </div>
  );
}
