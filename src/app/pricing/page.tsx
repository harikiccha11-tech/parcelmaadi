// ParcelMaadi — /pricing · public price estimate.
//
// Thin shell. All fares come from POST /api/fare/estimate (the production engine).
// No pricing logic exists in this route.
//
// Adapted for the existing schema: services + vehicles + priceMaster
// via /api/public/services and /api/fare/estimate (multi-card mode).

import { Suspense } from "react";
import PriceEstimator from "./PriceEstimator";

export const metadata = {
  title: "Price estimate · ParcelMaadi",
  description:
    "Estimate your delivery fare across every ParcelMaadi vehicle. Live pricing from our booking engine — the estimate is what you pay.",
};

export const dynamic = "force-dynamic";

export default function PricingPage() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-pm-cream" />}>
      <PriceEstimator />
    </Suspense>
  );
}
