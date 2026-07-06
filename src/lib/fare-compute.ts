// Shared fare computation used by both /api/fare/estimate and /api/bookings
// so customer-facing estimate and saved booking always match.
import { calculateFare, type PorterMatchConfig } from "@/lib/fare";
import type { PriceMaster } from "@prisma/client";

export interface ComputeOpts {
  distance: number;
  nightActive?: boolean;
  isExpress?: boolean;
  needsHelper?: boolean;
  waitingMinutes?: number;
  tollParking?: number;
  loadingChargeOverride?: number;
  extraChargeOverride?: number;
  tripType?: string; // "One-Way" | "Round-Trip"
  durationHours?: number;
  durationDays?: number;
  porterConfig?: PorterMatchConfig;
  // material landed-price (precomputed by /api/material/shops)
  materialCost?: number;
  deliveryCharge?: number;
}

export function computeForPrice(p: PriceMaster & { vehicle?: any; supplier?: any }, opts: ComputeOpts): any {
  const { distance, nightActive, isExpress, needsHelper, waitingMinutes, tollParking, loadingChargeOverride, extraChargeOverride, tripType, durationHours, durationDays, porterConfig, materialCost, deliveryCharge } = opts;
  const pricingType = (p as any).pricingType || "standard";

  // ---- Material supply (per-unit, with precomputed material + delivery) ----
  if (pricingType === "per-unit" && materialCost != null) {
    const mat = materialCost;
    const deliv = deliveryCharge || 0;
    const subtotalBeforeGst = mat + deliv;
    const gst = Math.round((subtotalBeforeGst * (p.gstPercent || 0)) / 100);
    let finalEstimate = subtotalBeforeGst + gst;
    let discountAmount = 0, discountPercent = 0;
    if (porterConfig?.enabled) {
      for (const b of porterConfig.bands) { const to = b.to == null ? Infinity : b.to; if (finalEstimate >= b.from && finalEstimate < to) { discountPercent = b.percent; break; } }
      if (discountPercent > 0) { discountAmount = Math.round((finalEstimate * discountPercent) / 100); finalEstimate -= discountAmount; }
    }
    const rounded = Math.round(finalEstimate / 5) * 5;
    const advanceAmount = p.advancePercent > 0 ? Math.round((rounded * p.advancePercent) / 100) : 0;
    return {
      baseFare: mat, distanceCharge: deliv, loadingCharge: 0, waitingCharge: 0, helperCharge: 0,
      nightCharge: 0, expressCharge: 0, extraCharge: 0, tollParking: 0, gst, subtotal: subtotalBeforeGst,
      discountPercent, discountAmount, finalEstimate: rounded, advanceAmount,
      commissionPercent: p.commissionPercent || 0, commissionAmount: 0, manualQuote: false,
      calculationNotes: [
        `Material cost: ₹${mat}`,
        `Delivery charge: ₹${deliv}`,
        gst > 0 ? `GST: ${p.gstPercent}%` : "",
        discountAmount > 0 ? `Auto-discount: ${discountPercent}% (−₹${discountAmount})` : "",
        advanceAmount > 0 ? `Advance (${p.advancePercent}%): ₹${advanceAmount}` : "",
      ].filter(Boolean),
    };
  }

  // ---- Machinery: hourly / daily / per-trip ----
  if (pricingType === "hourly" || pricingType === "daily" || pricingType === "per-trip") {
    const hours = Number(durationHours) || 0;
    const days = Number(durationDays) || 0;
    let units = 0, unitLabel = "";
    if (pricingType === "hourly") { units = Math.max(hours, p.minimumKm || 0); unitLabel = "hours"; }
    else if (pricingType === "daily") { units = Math.max(days, 1); unitLabel = "days"; }
    else { units = 1; unitLabel = "trip"; }
    const rate = (p as any).perUnitRate || p.minimumFare;
    const rental = Math.round(rate * units);
    const minFare = p.minimumFare;
    const baseFare = Math.max(rental, minFare);
    const transportCharge = distance > 0 ? Math.round(distance * (p.perKmRate || 40)) : 0;
    const subtotalBeforeGst = baseFare + transportCharge + (p.loadingCharge || 0);
    const gst = Math.round((subtotalBeforeGst * (p.gstPercent || 0)) / 100);
    let finalEstimate = subtotalBeforeGst + gst;
    let discountAmount = 0, discountPercent = 0;
    if (porterConfig?.enabled) {
      for (const b of porterConfig.bands) { const to = b.to == null ? Infinity : b.to; if (finalEstimate >= b.from && finalEstimate < to) { discountPercent = b.percent; break; } }
      if (discountPercent > 0) { discountAmount = Math.round((finalEstimate * discountPercent) / 100); finalEstimate -= discountAmount; }
    }
    const rounded = Math.round(finalEstimate / 5) * 5;
    const advanceAmount = p.advancePercent > 0 ? Math.round((rounded * p.advancePercent) / 100) : 0;
    return {
      baseFare, distanceCharge: transportCharge, loadingCharge: p.loadingCharge || 0, waitingCharge: 0, helperCharge: 0,
      nightCharge: 0, expressCharge: 0, extraCharge: 0, tollParking: 0, gst, subtotal: subtotalBeforeGst,
      discountPercent, discountAmount, finalEstimate: rounded, advanceAmount,
      commissionPercent: p.commissionPercent || 0, commissionAmount: 0, manualQuote: false,
      calculationNotes: [
        pricingType === "hourly" ? `${units} ${unitLabel} × ₹${rate}` : pricingType === "daily" ? `${units} ${unitLabel} × ₹${rate}` : `Per trip ₹${rate}`,
        `Min booking ₹${minFare}`,
        transportCharge > 0 ? `Transport (site delivery): ${distance} km × ₹${p.perKmRate || 40}` : "",
        gst > 0 ? `GST: ${p.gstPercent}%` : "",
        discountAmount > 0 ? `Auto-discount: ${discountPercent}% (−₹${discountAmount})` : "",
        advanceAmount > 0 ? `Advance (${p.advancePercent}%): ₹${advanceAmount}` : "",
      ].filter(Boolean),
    };
  }

  // ---- Standard (parcel/goods/outstation/water/emergency) ----
  const breakup = calculateFare(
    {
      id: p.id, minimumKm: p.minimumKm, minimumFare: p.minimumFare, perKmRate: p.perKmRate,
      slabJson: p.slabJson, loadingCharge: p.loadingCharge, waitingCharge: p.waitingCharge,
      helperCharge: p.helperCharge, nightChargePercent: p.nightChargePercent,
      expressChargePercent: p.expressChargePercent, extraCharge: p.extraCharge,
      discountPercent: p.discountPercent, gstPercent: p.gstPercent, advancePercent: p.advancePercent,
      minimumBooking: p.minimumBooking, commissionPercent: p.commissionPercent, itemType: p.itemType,
    },
    { distanceKm: distance, isNight: nightActive, isExpress, needsHelper, waitingMinutes, tollParking, loadingChargeOverride, extraChargeOverride, porterMatch: porterConfig }
  );

  // ---- Outstation round-trip multiplier ----
  if (tripType === "Round-Trip" && ((p as any).roundTripMultiplier || 1) > 1) {
    const mult = (p as any).roundTripMultiplier;
    const oneWay = breakup.finalEstimate;
    const roundTrip = Math.round((oneWay * mult) / 5) * 5;
    breakup.calculationNotes.push(`Round-trip multiplier ${mult}× applied (₹${oneWay} → ₹${roundTrip})`);
    breakup.finalEstimate = roundTrip;
    breakup.advanceAmount = p.advancePercent > 0 ? Math.round((roundTrip * p.advancePercent) / 100) : 0;
  }

  // ---- Emergency rush surcharge ----
  if (((p as any).rushSurchargePercent || 0) > 0) {
    const rush = Math.round((breakup.finalEstimate * (p as any).rushSurchargePercent) / 100);
    breakup.extraCharge = (breakup.extraCharge || 0) + rush;
    breakup.finalEstimate += rush;
    breakup.calculationNotes.push(`Emergency rush surcharge: ${(p as any).rushSurchargePercent}% (+₹${rush})`);
    breakup.advanceAmount = p.advancePercent > 0 ? Math.round((breakup.finalEstimate * p.advancePercent) / 100) : 0;
  }

  return breakup;
}
