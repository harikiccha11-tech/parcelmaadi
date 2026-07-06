// ParcelMaadi fare calculation engine
// Formula: Base Fare + Distance Charge + Loading + Waiting + Helper + Night + Express + Extra + Toll/Parking + GST − Discount = Final Estimate

export interface PriceMasterData {
  id: number;
  minimumKm: number;
  minimumFare: number;
  perKmRate: number;
  slabJson: string;
  loadingCharge: number;
  waitingCharge: number;
  helperCharge: number;
  nightChargePercent: number;
  expressChargePercent: number;
  extraCharge?: number;
  discountPercent?: number;
  gstPercent: number;
  advancePercent: number;
  minimumBooking: number;
  commissionPercent?: number;
  itemType?: string | null;
}

export interface PorterDiscountBand {
  from: number; // subtotal from (inclusive)
  to: number | null; // subtotal to (null = infinity)
  percent: number;
}

export interface PorterMatchConfig {
  enabled: boolean;
  bands: PorterDiscountBand[];
  minCommissionFloor: number; // ₹
  commissionPercent: number; // for floor check
}

export interface Slab {
  from: number; // km, inclusive
  to: number | null; // km, inclusive (null = infinity)
  rate: number; // per km
}

export interface FareBreakup {
  baseFare: number;
  distanceCharge: number;
  loadingCharge: number;
  waitingCharge: number;
  helperCharge: number;
  nightCharge: number;
  expressCharge: number;
  extraCharge: number;
  tollParking: number;
  gst: number;
  subtotal: number;
  discountPercent: number;
  discountAmount: number;
  finalEstimate: number;
  advanceAmount: number;
  commissionPercent: number;
  commissionAmount: number;
  manualQuote: boolean;
  calculationNotes: string[];
}

export interface FareInput {
  distanceKm: number;
  isNight?: boolean;
  isExpress?: boolean;
  needsHelper?: boolean;
  waitingMinutes?: number;
  tollParking?: number;
  loadingChargeOverride?: number;
  extraChargeOverride?: number;
  porterMatch?: PorterMatchConfig;
}

// Default Porter-match discount bands (admin-editable, stored in settings as JSON)
export const DEFAULT_PORTER_BANDS: PorterDiscountBand[] = [
  { from: 0, to: 100, percent: 0 },
  { from: 100, to: 500, percent: 2 },
  { from: 500, to: 1000, percent: 3 },
  { from: 1000, to: 2000, percent: 4 },
  { from: 2000, to: 5000, percent: 5 },
  { from: 5000, to: null, percent: 6 },
];

export function parsePorterBands(json: string): PorterDiscountBand[] {
  if (!json) return DEFAULT_PORTER_BANDS;
  try {
    const parsed = JSON.parse(json);
    if (Array.isArray(parsed) && parsed.length > 0) return parsed;
  } catch {}
  return DEFAULT_PORTER_BANDS;
}

function pickPorterDiscount(subtotal: number, bands: PorterDiscountBand[]): number {
  for (const b of bands) {
    const to = b.to == null ? Infinity : b.to;
    if (subtotal >= b.from && subtotal < to) return b.percent;
  }
  return 0;
}

/**
 * Parse slab_json (stored as JSON string in DB) into Slab[]
 * Accepts formats like:
 *   [{ "from": 4, "to": 10, "rate": 12 }]
 *   or "4-10 km: 12 per km, 11-25 km: 9 per km"
 */
export function parseSlabs(slabJson: string): Slab[] {
  if (!slabJson) return [];
  // Try JSON first
  try {
    const parsed = JSON.parse(slabJson);
    if (Array.isArray(parsed)) {
      return parsed.map((s: any) => ({
        from: Number(s.from ?? s.min ?? 0),
        to: s.to != null ? Number(s.to) : s.max != null ? Number(s.max) : null,
        rate: Number(s.rate ?? s.price ?? 0),
      }));
    }
  } catch {
    // not JSON, fall through to text parsing
  }
  // Text parsing: "4-10 km: 12 per km, 11-25 km: 9 per km, 26+ km: 9 per km"
  const slabs: Slab[] = [];
  const parts = slabJson.split(",").map((p) => p.trim()).filter(Boolean);
  for (const part of parts) {
    // match "4-10 km: 12 per km" or "26+ km: 9 per km" or "After 5 km: 25 per km"
    const rangeMatch = part.match(/(\d+)\s*-\s*(\d+)\s*km\s*:\s*(\d+(?:\.\d+)?)/i);
    const plusMatch = part.match(/(\d+)\s*\+\s*km\s*:\s*(\d+(?:\.\d+)?)/i);
    const afterMatch = part.match(/after\s+(\d+)\s*km\s*:\s*(\d+(?:\.\d+)?)/i);
    if (rangeMatch) {
      slabs.push({ from: Number(rangeMatch[1]), to: Number(rangeMatch[2]), rate: Number(rangeMatch[3]) });
    } else if (plusMatch) {
      slabs.push({ from: Number(plusMatch[1]), to: null, rate: Number(plusMatch[2]) });
    } else if (afterMatch) {
      slabs.push({ from: Number(afterMatch[1]) + 1, to: null, rate: Number(afterMatch[2]) });
    }
  }
  return slabs;
}

/**
 * Calculate distance charge using slabs (preferred) or flat perKmRate.
 * - Minimum KM is covered by minimum fare (base fare = minimum fare).
 * - Slab rates apply for KM beyond minimum.
 */
function calculateDistanceCharge(price: PriceMasterData, distanceKm: number): { charge: number; notes: string[] } {
  const notes: string[] = [];
  const slabs = parseSlabs(price.slabJson);
  const minKm = price.minimumKm;

  if (distanceKm <= minKm) {
    return { charge: 0, notes: [`Distance ${distanceKm} km within minimum ${minKm} km — covered by base fare`] };
  }

  const chargeableKm = distanceKm - minKm;

  // If slabs exist, use them. Slab ranges are defined as ABSOLUTE km (e.g., 4-10 km).
  // We compute charge for the portion of the journey that falls in each slab, but
  // only for km beyond the minimum.
  if (slabs.length > 0) {
    let total = 0;
    // iterate slabs, compute overlapping km with [minKm, distanceKm]
    for (const slab of slabs) {
      const slabFrom = slab.from;
      const slabTo = slab.to == null ? Infinity : slab.to;
      // overlap between [max(slabFrom, minKm+1) ... ] hmm
      // We treat the minimum km as covered by base fare, so chargeable range is (minKm, distanceKm].
      // Slab definitions in the seed are absolute (e.g., 4-10 km). We need to figure out
      // which part of the journey falls in each slab.
      // Chargeable journey range: from minKm to distanceKm.
      const journeyStart = minKm;
      const journeyEnd = distanceKm;
      const overlapStart = Math.max(slabFrom, journeyStart);
      const overlapEnd = Math.min(slabTo, journeyEnd);
      if (overlapEnd >= overlapStart && overlapEnd > journeyStart) {
        const km = overlapEnd - overlapStart;
        if (km > 0) {
          total += km * slab.rate;
        }
      }
    }
    notes.push(`Distance charge: ${chargeableKm.toFixed(1)} km beyond ${minKm} km minimum, using ${slabs.length} slabs`);
    return { charge: Math.round(total), notes };
  }

  // Flat per-km fallback
  if (price.perKmRate > 0) {
    const charge = chargeableKm * price.perKmRate;
    notes.push(`Distance charge: ${chargeableKm.toFixed(1)} km × ₹${price.perKmRate}/km`);
    return { charge: Math.round(charge), notes };
  }

  return { charge: 0, notes: ["No distance rate configured"] };
}

export function calculateFare(price: PriceMasterData, input: FareInput): FareBreakup {
  const notes: string[] = [];
  const isManual = price.itemType === "Emergency Service" || price.minimumFare === 0 && price.perKmRate === 0 && parseSlabs(price.slabJson).length === 0 && price.minimumBooking === 0;

  // Manual quote only (e.g., Emergency, or admin-marked manual quote)
  if (isManual) {
    return {
      baseFare: 0, distanceCharge: 0, loadingCharge: 0, waitingCharge: 0, helperCharge: 0,
      nightCharge: 0, expressCharge: 0, extraCharge: 0, tollParking: 0, gst: 0,
      subtotal: 0, discountPercent: 0, discountAmount: 0, finalEstimate: 0, advanceAmount: 0,
      commissionPercent: price.commissionPercent || 0, commissionAmount: 0,
      manualQuote: true, calculationNotes: ["Manual quote only — admin will confirm price"],
    };
  }

  const baseFare = price.minimumFare;
  notes.push(`Base fare (minimum ₹${baseFare} for ${price.minimumKm} km)`);

  const { charge: distanceCharge, notes: distNotes } = calculateDistanceCharge(price, input.distanceKm);
  notes.push(...distNotes);

  const loadingCharge = input.loadingChargeOverride != null ? input.loadingChargeOverride : price.loadingCharge;
  if (loadingCharge > 0) notes.push(`Loading charge: ₹${loadingCharge}`);

  const waitingCharge = price.waitingCharge > 0 && input.waitingMinutes && input.waitingMinutes > 0
    ? Math.round(price.waitingCharge * input.waitingMinutes)
    : 0;
  if (waitingCharge > 0) notes.push(`Waiting charge: ${input.waitingMinutes} min × ₹${price.waitingCharge}`);

  const helperCharge = input.needsHelper ? price.helperCharge : 0;
  if (helperCharge > 0) notes.push(`Helper charge: ₹${helperCharge}`);

  const extraCharge = input.extraChargeOverride != null ? input.extraChargeOverride : (price.extraCharge || 0);
  if (extraCharge > 0) notes.push(`Extra charge: ₹${extraCharge}`);

  const subtotalBeforeGst =
    baseFare + distanceCharge + loadingCharge + waitingCharge + helperCharge + extraCharge;

  const nightCharge = price.nightChargePercent > 0 && input.isNight
    ? Math.round((subtotalBeforeGst * price.nightChargePercent) / 100)
    : 0;
  if (nightCharge > 0) notes.push(`Night charge: ${price.nightChargePercent}%`);

  const expressCharge = price.expressChargePercent > 0 && input.isExpress
    ? Math.round((subtotalBeforeGst * price.expressChargePercent) / 100)
    : 0;
  if (expressCharge > 0) notes.push(`Express charge: ${price.expressChargePercent}%`);

  const tollParking = input.tollParking || 0;
  if (tollParking > 0) notes.push(`Toll & parking: ₹${tollParking}`);

  const gst = price.gstPercent > 0
    ? Math.round((subtotalBeforeGst * price.gstPercent) / 100)
    : 0;
  if (gst > 0) notes.push(`GST: ${price.gstPercent}%`);

  const subtotal = subtotalBeforeGst + nightCharge + expressCharge + tollParking;
  let finalEstimate = subtotal + gst;

  // Apply Porter-match auto-discount (after GST, before rounding & minimum-booking floor)
  let discountPercent = 0;
  let discountAmount = 0;
  const porter = input.porterMatch;
  if (porter && porter.enabled && porter.bands.length > 0) {
    const bandPct = pickPorterDiscount(finalEstimate, porter.bands);
    if (bandPct > 0) {
      const candidateDiscount = Math.round((finalEstimate * bandPct) / 100);
      const commissionPct = porter.commissionPercent || price.commissionPercent || 0;
      // Floor protection: skip discount if it would drop commission below floor
      if (commissionPct > 0) {
        const commissionAfterDiscount = Math.round((finalEstimate - candidateDiscount) * commissionPct / 100);
        if (commissionAfterDiscount < porter.minCommissionFloor) {
          notes.push(`Porter-match discount skipped: would drop commission below ₹${porter.minCommissionFloor} floor`);
        } else {
          discountPercent = bandPct;
          discountAmount = candidateDiscount;
          finalEstimate -= discountAmount;
          notes.push(`Porter-match discount: ${discountPercent}% (−₹${discountAmount})`);
        }
      } else {
        discountPercent = bandPct;
        discountAmount = candidateDiscount;
        finalEstimate -= discountAmount;
        notes.push(`Porter-match discount: ${discountPercent}% (−₹${discountAmount})`);
      }
    }
  }
  // Per-vehicle static discount (from price master) — only if no porter discount applied
  if (discountAmount === 0 && (price.discountPercent || 0) > 0) {
    discountPercent = price.discountPercent || 0;
    discountAmount = Math.round((finalEstimate * discountPercent) / 100);
    finalEstimate -= discountAmount;
    notes.push(`Discount: ${discountPercent}% (−₹${discountAmount})`);
  }

  // Round to nearest ₹5
  const rounded = Math.round(finalEstimate / 5) * 5;
  if (rounded !== finalEstimate) {
    notes.push(`Rounded to nearest ₹5 (₹${rounded})`);
    finalEstimate = rounded;
  }

  const advanceAmount = price.advancePercent > 0
    ? Math.round((finalEstimate * price.advancePercent) / 100)
    : 0;
  if (advanceAmount > 0) notes.push(`Advance (${price.advancePercent}%): ₹${advanceAmount}`);

  const commissionPercent = price.commissionPercent || 0;
  const commissionAmount = Math.round((finalEstimate * commissionPercent) / 100);

  if (price.minimumBooking > 0 && finalEstimate < price.minimumBooking) {
    notes.push(`Adjusted to minimum booking ₹${price.minimumBooking}`);
    return {
      baseFare, distanceCharge, loadingCharge, waitingCharge, helperCharge,
      nightCharge, expressCharge, extraCharge, tollParking, gst, subtotal,
      discountPercent, discountAmount, finalEstimate: price.minimumBooking, advanceAmount,
      commissionPercent, commissionAmount: Math.round((price.minimumBooking * commissionPercent) / 100),
      manualQuote: false, calculationNotes: notes,
    };
  }

  return {
    baseFare, distanceCharge, loadingCharge, waitingCharge, helperCharge,
    nightCharge, expressCharge, extraCharge, tollParking, gst, subtotal,
    discountPercent, discountAmount, finalEstimate, advanceAmount,
    commissionPercent, commissionAmount,
    manualQuote: false, calculationNotes: notes,
  };
}
