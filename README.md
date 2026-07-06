# 📦 ParcelMaadi — Production Platform

**HP Enterprise** | GSTIN: 29ANZPH4067Q1ZS
**Brand:** ParcelMaadi — Fast · Local · Reliable

Multi-service logistics booking platform covering parcel delivery, goods transport, grocery, food delivery, material/water/machinery supply, borewell drilling, outstation, and emergency booking.

## 🏗️ Tech Stack
- **Framework:** Next.js 16 (App Router) + TypeScript 5
- **Database:** Prisma ORM (SQLite dev / Supabase PostgreSQL production)
- **UI:** Tailwind CSS 4 + shadcn/ui (New York) + Lucide icons
- **Auth:** Cookie-based (scrypt-hashed passwords, signed sessions)
- **Maps:** Leaflet + OpenStreetMap (free, no API key)
- **Notifications:** ntfy (free push) + Telegram Bot (free) + WhatsApp deep link
- **Payments:** Razorpay integration (optional)
- **Realtime:** Socket.io (port 3003) + 30s polling fallback

## 📁 Project Structure
```
src/
├── app/
│   ├── api/          # 60 API routes (admin + public + customer)
│   ├── page.tsx      # Main page (customer + admin)
│   └── layout.tsx
├── components/
│   ├── customer-app.tsx   # Customer website
│   ├── admin-app.tsx      # Admin panel (15 tabs)
│   ├── image-upload.tsx   # Bulletproof mobile image upload
│   ├── map-picker.tsx     # Full-screen GPS map picker
│   └── ui/                # shadcn/ui components
└── lib/
    ├── api.ts        # API client + types
    ├── auth.ts       # Cookie auth
    ├── db.ts         # Prisma client
    ├── fare.ts       # Fare calculation engine
    └── config.ts     # Settings + validation
```

## 🚀 Quick Start
```bash
bun install
bun run db:push
bun run dev
```

## 🔑 Admin Access
- URL: `http://localhost:3000/?admin=1`
- Email: `admin@parcelmaadi.com`
- Password: Set via `npx tsx -e "..."` (see DEPLOY_VERCEL.md)

## 📋 Features
- 11 departments (10 Active + 1 Coming Soon)
- 65 vehicles with pricing
- 288 products across 6 shops + 6 restaurants
- 3 APKs with Coming Soon mode
- Shop directory (Supplier/Shop → select shop → browse products)
- Food delivery restaurant directory
- Cart system with checkout
- Full-screen map picker with GPS
- Auto-distance calculation
- Professional PDF invoice with logo
- ntfy + Telegram notifications
- 4 admin roles (Owner/Operations/Accounts/View)
- On/off toggles for all items
- Image upload from device (mobile + desktop)
- 30-second auto-refresh (admin changes appear on website)

## 🌐 Production Deployment
See `DEPLOY_VERCEL.md` for complete Vercel + Supabase deployment guide.

## 📄 Documentation
- `CHANGELOG.md` — All changes made
- `VALIDATION_REPORT.md` — Full audit report
- `DEPLOY_VERCEL.md` — Deployment guide
- `.env.example` — Environment variables
- `vercel.json` — Vercel config
- `prisma/schema.supabase.prisma` — PostgreSQL schema for production

## DEPLOY CHECKLIST

Set these environment variables in Vercel → Settings → Environment Variables:

| Variable | Required | Description |
|----------|----------|-------------|
| `DATABASE_URL` | ✅ YES | Supabase PostgreSQL connection string (e.g. `postgresql://postgres:PASSWORD@db.XXXX.supabase.co:5432/postgres`) |
| `SESSION_SECRET` | ✅ YES | Random 32+ char string for signing session cookies (e.g. `openssl rand -base64 32`) |
| `RESEND_API_KEY` | Optional | Resend API key for password reset emails. If not set, reset links are returned in API response (dev mode). |
| `NTFY_TOPIC` | Optional | ntfy topic name for push notifications (e.g. `parcelmaadi-admin-x7k9m2`) |
| `TELEGRAM_BOT_TOKEN` | Optional | Telegram bot token from @BotFather for booking notifications |
| `TELEGRAM_CHAT_ID` | Optional | Your Telegram chat ID for receiving notifications |
| `WHATSAPP_NUMBER` | Optional | WhatsApp business number with country code (e.g. `919741433725`) |

### Steps:
1. Create Supabase project → copy DATABASE_URL
2. Set all env vars in Vercel
3. Deploy to Vercel
4. Run `npx prisma db push` (creates all tables in Supabase)
5. Run `npx tsx scripts/seed.ts` (seeds 11 departments, vehicles, products, APKs)
6. Set admin password (see DEPLOY_VERCEL.md)
7. Connect domain via Hostinger DNS → Vercel
