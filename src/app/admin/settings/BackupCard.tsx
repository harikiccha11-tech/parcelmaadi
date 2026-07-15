"use client";

// Config backup/export (SUPER_ADMIN). Downloads a JSON snapshot of all
// admin-editable configuration for restore/migration.

export default function BackupCard() {
  return (
    <div className="mt-2 rounded-2xl bg-white p-5 shadow">
      <p className="text-sm font-bold">Configuration backup</p>
      <p className="mt-1 text-xs text-pm-ink/60">
        Download a JSON snapshot of settings, feature flags, CMS, catalog, pricing, coupons and offers. Full
        transactional data (bookings, orders, users) is protected by Supabase point-in-time recovery.
      </p>
      <a
        href="/api/admin/backup"
        className="mt-3 inline-block rounded-full bg-pm-ink px-5 py-2 text-sm font-bold text-pm-yellow hover:bg-pm-ink/80 transition-colors"
      >
        ⬇ Download config backup
      </a>
    </div>
  );
}
