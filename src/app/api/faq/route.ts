import { NextResponse } from "next/server";
import { db } from "@/lib/db";

export const dynamic = "force-dynamic";

// GET /api/faq — public FAQ list.
// Reads from Settings (key prefix "faq_") if present, else returns the built-in
// ParcelMaadi FAQ. Public, no auth required.
export async function GET() {
  let custom: { key: string; value: string }[] = [];
  try {
    const rows = await db.settings.findMany({
      where: { key: { startsWith: "faq_" } },
      select: { key: true, value: true },
    });
    custom = rows.map((r) => ({ key: r.key, value: r.value ?? "" }));
  } catch {}

  const DEFAULTS: { q: string; a: string; category: string }[] = [
    {
      q: "Which cities does ParcelMaadi operate in?",
      a: "ParcelMaadi is currently live across Bengaluru and surrounding Karnataka towns. We are expanding to Mysuru, Hubballi, Mangaluru, Belagavi, Davangere, Kalaburagi, Vijayapura, Shimoga and Tumakuru — pincode-level availability is shown on each service page.",
      category: "Coverage",
    },
    {
      q: "How is the fare calculated?",
      a: "Every fare is calculated live by our booking engine from the published rate card. Base fare covers the first few kilometres, then a per-km rate applies. Loading, waiting, helper, night, express, toll, parking, GST and any active discounts are all line items in the breakup — what you see is what you pay.",
      category: "Pricing",
    },
    {
      q: "Can I get a price estimate before booking?",
      a: "Yes. Open the /pricing page, pick your service and distance, and the same engine returns an estimate for every active vehicle. The estimate is the actual fare, not a guess.",
      category: "Pricing",
    },
    {
      q: "How do I pay? Do you support UPI?",
      a: "Yes — UPI, cards, net-banking and Cash on Delivery (where available) are supported. For marketplace orders, payment can be split between platform fee and supplier settlement.",
      category: "Payments",
    },
    {
      q: "What is the cancellation policy?",
      a: "Free cancellation before a rider is assigned. Once assigned, a nominal fee may apply. Cancellations after pickup are charged at the full fare. Refunds, where applicable, are credited to your ParcelMaadi wallet within 24 hours.",
      category: "Bookings",
    },
    {
      q: "Are ParcelMaadi riders verified?",
      a: "Every rider is KYC-verified (driving licence, Aadhaar, vehicle RC) and background-checked. Live location is shared with you once a rider is assigned.",
      category: "Safety",
    },
    {
      q: "Can I book a vehicle for outstation?",
      a: "Yes. Outstation bookings are available on most goods-transport vehicles. Round-trip multiplier, driver allowance, night halt and state tax are line items in the breakup — no hidden charges.",
      category: "Bookings",
    },
    {
      q: "Do you offer corporate accounts?",
      a: "Yes. Corporate accounts get consolidated billing, monthly settlements, dedicated support and custom rate cards. Reach out from the Corporate page to set up an account.",
      category: "Corporate",
    },
  ];

  // Override defaults with custom entries from settings
  const overrides = new Map<string, string>();
  for (const c of custom) {
    // key format: faq_<index>_<field>  OR  faq_q_<index> / faq_a_<index>
    const m = c.key.match(/^faq_(q|a)_(\d+)$/);
    if (m) {
      const idx = Number(m[2]);
      if (!overrides.has(`q_${idx}`)) overrides.set(`q_${idx}`, "");
      if (!overrides.has(`a_${idx}`)) overrides.set(`a_${idx}`, "");
      overrides.set(`${m[1]}_${idx}`, c.value);
    }
  }

  const list = DEFAULTS.map((d, i) => ({
    q: overrides.get(`q_${i}`) || d.q,
    a: overrides.get(`a_${i}`) || d.a,
    category: d.category,
  }));

  return NextResponse.json({ ok: true, faqs: list, count: list.length });
}
