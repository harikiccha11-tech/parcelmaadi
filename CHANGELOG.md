# CHANGELOG — ParcelMaadi Production Readiness Audit

## Files Modified

### 1. `src/components/admin-app.tsx`
**Why:** TypeScript error — `string | null` not assignable to `string` on categories filter.
**Fix:** Added `as string[]` type cast on `products.map((p) => p.category).filter(Boolean)`.

### 2. `src/components/customer-app.tsx`
**Why:** TypeScript error — dead code `if (setSubmitting) {}` always true condition.
**Fix:** Removed dead code line.

### 3. `src/lib/fare.ts`
**Why:** TypeScript error — `price.discountPercent` is `number | undefined`, assigned to `number`.
**Fix:** Added `|| 0` fallback: `discountPercent = price.discountPercent || 0;`

### 4. `src/app/api/admin/upload/route.ts`
**Why:** Vercel serverless filesystem is read-only — `writeFile` to `/public/uploads/` fails in production.
**Fix:** Added production check: if `NODE_ENV === "production"`, return base64 data URL (stored in DB). In dev, still writes to `/public/uploads/` for local testing.

### 5. `next.config.ts`
**Why:** `ignoreBuildErrors: true` was hiding TypeScript errors during build — dangerous for production.
**Fix:** Changed to `ignoreBuildErrors: false`.

### 6. `package.json`
**Why:** (a) Build script had `cp` commands that fail on Vercel. (b) Missing `postinstall` script for Prisma client generation on Vercel.
**Fix:** (a) Changed build to `prisma generate && next build`. (b) Added `"postinstall": "prisma generate"`.

### 7. `prisma/schema.prisma`
**Why:** Comments updated to clarify SQLite (dev) vs PostgreSQL (production) usage.
**Fix:** Updated comments. Schema structure unchanged.

### 8. `prisma/schema.supabase.prisma` (NEW)
**Why:** Supabase/PostgreSQL-compatible schema for production deployment.
**Fix:** Created as copy of main schema with `provider = "postgresql"`.

### 9. `prisma/schema.sqlite.prisma` (NEW)
**Why:** Backup of original SQLite schema for reference.
**Fix:** Copy of main schema.

### 10. `vercel.json` (NEW)
**Why:** Vercel deployment configuration.
**Fix:** Created with build command `prisma generate && next build`, install command `bun install`, and API function timeout of 30s.

### 11. `.env.example` (NEW)
**Why:** Document all required environment variables for production deployment.
**Fix:** Created with all env vars: DATABASE_URL, SESSION_SECRET, NEXTAUTH_SECRET, brand info, notification settings, Razorpay, WhatsApp.

### 12. `DEPLOY_VERCEL.md` (NEW)
**Why:** Step-by-step deployment guide for Vercel + Supabase.
**Fix:** Created with 5-step deployment process, admin login, Vercel-specific notes, pre-deployment checklist.

## Issues Fixed

| # | Issue | Severity | Status |
|---|-------|----------|--------|
| 1 | TS error: admin-app.tsx categories type | Medium | ✅ Fixed |
| 2 | TS error: customer-app.tsx dead code | Low | ✅ Fixed |
| 3 | TS error: fare.ts discountPercent | Medium | ✅ Fixed |
| 4 | Upload API fails on Vercel (read-only FS) | Critical | ✅ Fixed |
| 5 | next.config.ts ignoreBuildErrors | High | ✅ Fixed |
| 6 | Build script incompatible with Vercel | High | ✅ Fixed |
| 7 | Missing postinstall (Prisma on Vercel) | High | ✅ Fixed |
| 8 | Missing vercel.json | High | ✅ Created |
| 9 | Missing .env.example | High | ✅ Created |
| 10 | Missing deployment guide | Medium | ✅ Created |
| 11 | No Supabase schema variant | Medium | ✅ Created |

## Remaining Warnings (Non-Blocking)

1. **TypeScript errors in `examples/`, `scripts/`, `skills/`** — These are development utilities, not part of the production app. They don't affect the build.
2. **Socket.io mini-service** — Runs on port 3003 locally. For Vercel, deploy separately on Railway/Render. The 30-second polling fallback is built in.
3. **Image uploads in production** — Use base64 data URLs (stored in DB). For large-scale production, migrate to Vercel Blob Storage or S3.
4. **SQLite for local dev** — Change to PostgreSQL before Vercel deployment by copying `schema.supabase.prisma` to `schema.prisma`.
