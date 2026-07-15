"use client";

// ParcelMaadi — Price Estimate UI (adapted for the existing production schema).
//
// SINGLE SOURCE OF TRUTH: every rupee shown here comes from POST /api/fare/estimate,
// which runs `computeFare()` — the exact same engine that prices a real booking.
// There is NO pricing logic in this file: no slabs, no surge, no multipliers, no
// arithmetic on fares. It renders what the production engine returns, nothing else.
//
// Services + vehicles are loaded from /api/public/services — nothing hardcoded.
// Fare cards come from POST /api/fare/estimate?serviceId=X — the multi-card mode
// that returns one breakup per active price-master row in that service.

import { useCallback, useEffect, useMemo, useState } from "react";
import Link from "next/link";

type Vehicle = {
  id: number;
  name: string;
  slug: string | null;
  maxLoad: string | null;
  imageUrl: string | null;
  recommendedUse: string | null;
};

type Service = {
  id: number;
  name: string;
  slug: string;
  description: string | null;
  imageUrl: string | null;
  icon: string | null;
  startingPriceText: string;
  vehicles: Vehicle[];
};

/** Mirrors FareBreakup from src/lib/fare.ts — display only. */
type Fare = {
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
};

type PriceCard = {
  price: {
    id: number;
    pricingType: string;
    unitType: string | null;
    perUnitRate: number;
    minimumFare: number;
    perKmRate: number;
    minimumKm: number;
    vehicle?: { id: number; name: string } | null;
    supplier?: { supplierName: string } | null;
  };
  breakup: Fare;
  slabs: unknown[];
};

type Quote = {
  vehicle: Vehicle | null;
  card: PriceCard | null;
  error: string | null;
};

const inr = (n: number) =>
  `₹${n.toLocaleString("en-IN", { minimumFractionDigits: 0, maximumFractionDigits: 2 })}`;

const km = (n: number) => `${n} km`;

/* ---------------------------------------------------------------- icons */
const Icon = {
  Route: (p: { className?: string }) => (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round" className={p.className} aria-hidden="true">
      <circle cx="6" cy="19" r="2.5" /><circle cx="18" cy="5" r="2.5" />
      <path d="M8.5 19h6a3.5 3.5 0 0 0 0-7h-5a3.5 3.5 0 0 1 0-7h6" />
    </svg>
  ),
  Truck: (p: { className?: string }) => (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round" className={p.className} aria-hidden="true">
      <path d="M2 6.5h11v9H2z" /><path d="M13 9.5h4l3 3.2v2.8h-7z" />
      <circle cx="6" cy="17.5" r="2" /><circle cx="17" cy="17.5" r="2" />
    </svg>
  ),
  Weight: (p: { className?: string }) => (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round" className={p.className} aria-hidden="true">
      <circle cx="12" cy="5.5" r="2.5" />
      <path d="M8.5 9.5h7l2.5 11H6z" />
    </svg>
  ),
  Users: (p: { className?: string }) => (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round" className={p.className} aria-hidden="true">
      <circle cx="9" cy="8" r="3" /><path d="M3 20a6 6 0 0 1 12 0" />
      <path d="M16 5.5a3 3 0 0 1 0 5.5M17.5 20a6 6 0 0 0-2-4.5" />
    </svg>
  ),
  Pin: (p: { className?: string }) => (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round" className={p.className} aria-hidden="true">
      <path d="M12 21s7-5.5 7-11a7 7 0 1 0-14 0c0 5.5 7 11 7 11z" /><circle cx="12" cy="10" r="2.5" />
    </svg>
  ),
  Bolt: (p: { className?: string }) => (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round" className={p.className} aria-hidden="true">
      <path d="M13 2 4 14h6l-1 8 9-12h-6z" />
    </svg>
  ),
  Sun: (p: { className?: string }) => (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round" className={p.className} aria-hidden="true">
      <circle cx="12" cy="12" r="4" /><path d="M12 2v2M12 20v2M4.9 4.9l1.4 1.4M17.7 17.7l1.4 1.4M2 12h2M20 12h2M4.9 19.1l1.4-1.4M17.7 6.3l1.4-1.4" />
    </svg>
  ),
  Moon: (p: { className?: string }) => (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round" className={p.className} aria-hidden="true">
      <path d="M20 14.5A8.5 8.5 0 0 1 9.5 4a8.5 8.5 0 1 0 10.5 10.5z" />
    </svg>
  ),
  Check: (p: { className?: string }) => (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.25" strokeLinecap="round" strokeLinejoin="round" className={p.className} aria-hidden="true">
      <path d="m4 12.5 5 5L20 6.5" />
    </svg>
  ),
  Back: (p: { className?: string }) => (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round" className={p.className} aria-hidden="true">
      <path d="M19 12H5M12 19l-7-7 7-7" />
    </svg>
  ),
};

export default function PriceEstimator() {
  const [dark, setDark] = useState(false);

  const [services, setServices] = useState<Service[]>([]);
  const [loadingRef, setLoadingRef] = useState(true);
  const [refError, setRefError] = useState<string | null>(null);

  const [serviceId, setServiceId] = useState<number | "">("");
  const [distanceKm, setDistanceKm] = useState("8");
  const [helperCount, setHelperCount] = useState("0");
  const [isExpress, setIsExpress] = useState(false);
  const [isNight, setIsNight] = useState(false);
  const [tripType, setTripType] = useState<"One-Way" | "Round-Trip">("One-Way");
  const [durationHours, setDurationHours] = useState("2");
  const [durationDays, setDurationDays] = useState("1");

  const [quotes, setQuotes] = useState<Quote[]>([]);
  const [busy, setBusy] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);

  // Reference data — services + vehicles straight from the database.
  useEffect(() => {
    (async () => {
      try {
        const r = await fetch("/api/public/services");
        const j = await r.json();
        if (!j?.services) throw new Error();
        const list: Service[] = j.services;
        // Only show services that have at least one vehicle (i.e. something to price)
        const withVehicles = list.filter((s) => s.vehicles && s.vehicles.length > 0);
        setServices(withVehicles);
        if (withVehicles[0]) setServiceId(withVehicles[0].id);
      } catch {
        setRefError("Could not load services. Please refresh.");
      } finally {
        setLoadingRef(false);
      }
    })();
  }, []);

  const service = useMemo(
    () => services.find((s) => s.id === serviceId),
    [services, serviceId]
  );
  const vehicles = service?.vehicles ?? [];

  /**
   * Asks the PRODUCTION fare engine for one estimate per active price-master row.
   * No fare arithmetic happens on the client — we only display the response.
   */
  const estimate = useCallback(async () => {
    if (!serviceId) return;
    const d = Number(distanceKm);
    if (!Number.isFinite(d) || d < 0.5) {
      setFormError("Minimum distance is 0.5 km.");
      setQuotes([]);
      return;
    }
    if (d > 800) {
      setFormError("Maximum distance is 800 km.");
      setQuotes([]);
      return;
    }

    setBusy(true);
    setFormError(null);
    try {
      const res = await fetch("/api/fare/estimate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          serviceId,
          distanceKm: d,
          isNight,
          isExpress,
          needsHelper: Number(helperCount) > 0,
          tripType,
          durationHours: Number(durationHours) || 0,
          durationDays: Number(durationDays) || 0,
        }),
      });
      const j = await res.json();
      const cards: PriceCard[] = j?.cards ?? [];
      const vehicleById = new Map<number, Vehicle>(vehicles.map((v) => [v.id, v]));
      const results: Quote[] = cards.map((card): Quote => {
        const vId = card.price?.vehicle?.id;
        const vehicle = vId ? vehicleById.get(vId) ?? null : null;
        return { vehicle, card, error: null };
      });
      // Cheapest first. Sorting the engine's own totals is presentation, not pricing.
      results.sort(
        (a, b) =>
          (a.card?.breakup?.finalEstimate ?? Infinity) -
          (b.card?.breakup?.finalEstimate ?? Infinity)
      );
      setQuotes(results);
      if (results.length === 0) {
        setFormError("No active price cards for this service yet. Try another service.");
      }
    } catch {
      setFormError("Estimate unavailable right now. Please try again.");
      setQuotes([]);
    } finally {
      setBusy(false);
    }
  }, [serviceId, distanceKm, isNight, isExpress, helperCount, tripType, durationHours, durationDays, vehicles]);

  // Re-estimate whenever an input settles.
  useEffect(() => {
    if (loadingRef || !serviceId || vehicles.length === 0) return;
    const t = setTimeout(estimate, 400);
    return () => clearTimeout(t);
  }, [estimate, loadingRef, vehicles.length, serviceId]);

  /* ----------------------------------------------------------- theming */
  const shell = dark ? "bg-[#161310] text-[#f3ece2]" : "bg-pm-cream text-pm-ink";
  const panel = dark ? "bg-[#211c17] border-[#3a3129]" : "bg-white border-black/5";
  const field = dark
    ? "bg-[#161310] border-[#3a3129] text-[#f3ece2] focus:border-pm-yellow"
    : "bg-white border-pm-ink/15 text-pm-ink focus:border-pm-red";
  const muted = dark ? "text-[#f3ece2]/55" : "text-pm-ink/55";
  const hair = dark ? "border-[#3a3129]" : "border-pm-ink/10";
  const label = `mb-1 block text-[11px] font-bold uppercase tracking-wider ${muted}`;

  const cheapest = quotes.find((q) => q.card)?.card?.price?.id;

  return (
    <div className={`min-h-screen transition-colors ${shell}`}>
      {/* Header */}
      <header className="bg-pm-yellow border-b-4 border-pm-red">
        <div className="mx-auto flex max-w-6xl flex-wrap items-center justify-between gap-3 px-4 py-3">
          <div className="flex items-center gap-3">
            <Link
              href="/"
              className="flex items-center gap-1 text-xs font-bold text-pm-ink/70 transition-colors hover:text-pm-ink"
              aria-label="Back to home"
            >
              <Icon.Back className="h-4 w-4" />
              Home
            </Link>
            <span className="text-lg font-black tracking-tight text-pm-ink">
              <span className="text-pm-red">Parcel</span>Maadi
              <span className="ml-2 text-xs font-semibold text-pm-ink/60">· Price estimate</span>
            </span>
          </div>
          <button
            type="button"
            onClick={() => setDark((v) => !v)}
            aria-label={dark ? "Switch to light mode" : "Switch to dark mode"}
            className="flex items-center gap-1.5 rounded-full bg-pm-ink/10 px-3 py-1.5 text-xs font-bold text-pm-ink transition-colors hover:bg-pm-ink/20"
          >
            {dark ? <Icon.Sun className="h-4 w-4" /> : <Icon.Moon className="h-4 w-4" />}
            {dark ? "Light" : "Dark"}
          </button>
        </div>
      </header>

      <main className="mx-auto max-w-6xl px-4 py-6">
        <h1 className="text-2xl font-black sm:text-3xl">Estimate your fare</h1>
        <p className={`mt-1 max-w-2xl text-sm ${muted}`}>
          Live pricing from ParcelMaadi&apos;s booking engine. The estimate below is exactly what you
          pay when you book — same rate card, same rules, no surprises.
        </p>

        {refError && (
          <p className="mt-4 rounded-xl border border-pm-red/30 bg-pm-red/10 px-4 py-3 text-sm font-medium text-pm-red">
            {refError}
          </p>
        )}

        {/* ------------------------------------------------------ inputs */}
        <section className={`mt-5 rounded-2xl border p-5 shadow-sm ${panel}`}>
          <h2 className="flex items-center gap-2 text-sm font-bold">
            <Icon.Pin className="h-4 w-4 text-pm-red" />
            Trip details
          </h2>

          <div className="mt-4 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
            <div className="sm:col-span-2 lg:col-span-3">
              <label className={label} htmlFor="pe-service">Service</label>
              <select
                id="pe-service"
                value={serviceId}
                onChange={(e) => {
                  setServiceId(Number(e.target.value));
                  setQuotes([]);
                }}
                disabled={loadingRef}
                className={`w-full rounded-xl border px-3 py-2.5 text-sm outline-none transition-colors ${field}`}
              >
                {services.map((s) => (
                  <option key={s.id} value={s.id}>{s.name}</option>
                ))}
              </select>
              {service?.description && (
                <p className={`mt-1 text-xs ${muted}`}>{service.description}</p>
              )}
            </div>

            <div>
              <label className={label} htmlFor="pe-distance">Distance (km)</label>
              <input
                id="pe-distance"
                type="number"
                inputMode="decimal"
                min={0.5}
                step={0.5}
                value={distanceKm}
                onChange={(e) => setDistanceKm(e.target.value)}
                className={`w-full rounded-xl border px-3 py-2.5 text-sm outline-none transition-colors ${field}`}
              />
            </div>

            <div>
              <label className={label} htmlFor="pe-helpers">Loading helpers</label>
              <select
                id="pe-helpers"
                value={helperCount}
                onChange={(e) => setHelperCount(e.target.value)}
                className={`w-full rounded-xl border px-3 py-2.5 text-sm outline-none transition-colors ${field}`}
              >
                {[0, 1, 2, 3, 4].map((n) => (
                  <option key={n} value={n}>{n === 0 ? "None" : `${n} helper${n > 1 ? "s" : ""}`}</option>
                ))}
              </select>
            </div>

            <div>
              <label className={label} htmlFor="pe-trip">Trip type</label>
              <select
                id="pe-trip"
                value={tripType}
                onChange={(e) => setTripType(e.target.value as "One-Way" | "Round-Trip")}
                className={`w-full rounded-xl border px-3 py-2.5 text-sm outline-none transition-colors ${field}`}
              >
                <option value="One-Way">One-Way</option>
                <option value="Round-Trip">Round-Trip</option>
              </select>
            </div>

            {service?.slug === "machinery-rental" && (
              <div>
                <label className={label} htmlFor="pe-hours">Duration (hours)</label>
                <input
                  id="pe-hours"
                  type="number"
                  min={1}
                  step={1}
                  value={durationHours}
                  onChange={(e) => setDurationHours(e.target.value)}
                  className={`w-full rounded-xl border px-3 py-2.5 text-sm outline-none transition-colors ${field}`}
                />
              </div>
            )}

            <div>
              <span className={label}>Trip options</span>
              <div className="flex flex-wrap gap-2">
                <button
                  type="button"
                  aria-pressed={isExpress}
                  onClick={() => setIsExpress((v) => !v)}
                  className={`flex items-center gap-1.5 rounded-full px-3.5 py-2 text-xs font-bold transition-colors ${
                    isExpress ? "bg-pm-red text-white" : dark ? "bg-[#161310] text-[#f3ece2]/70 border border-[#3a3129]" : "bg-pm-cream text-pm-ink/70"
                  }`}
                >
                  <Icon.Bolt className="h-3.5 w-3.5" /> Express
                </button>
                <button
                  type="button"
                  aria-pressed={isNight}
                  onClick={() => setIsNight((v) => !v)}
                  className={`flex items-center gap-1.5 rounded-full px-3.5 py-2 text-xs font-bold transition-colors ${
                    isNight ? "bg-pm-red text-white" : dark ? "bg-[#161310] text-[#f3ece2]/70 border border-[#3a3129]" : "bg-pm-cream text-pm-ink/70"
                  }`}
                >
                  <Icon.Moon className="h-3.5 w-3.5" /> Night
                </button>
              </div>
            </div>
          </div>

          {formError && <p className="mt-3 text-sm font-medium text-pm-red">{formError}</p>}

          <div className={`mt-4 flex flex-wrap items-center gap-3 border-t pt-4 ${hair}`}>
            <button
              type="button"
              onClick={estimate}
              disabled={busy || loadingRef}
              className="rounded-full bg-pm-red px-6 py-2.5 text-sm font-bold text-white transition-colors hover:bg-pm-red-deep disabled:opacity-60"
            >
              {busy ? "Calculating…" : "Show fares"}
            </button>
            <span className={`text-xs ${muted}`}>
              {vehicles.length > 0 ? `${vehicles.length} vehicle${vehicles.length > 1 ? "s" : ""} available` : ""}
            </span>
          </div>
        </section>

        {/* ------------------------------------------------------ results */}
        {loadingRef ? (
          <p className={`mt-6 text-sm ${muted}`}>Loading rate card…</p>
        ) : quotes.length > 0 ? (
          <section className="mt-6" aria-live="polite">
            <h2 className="text-xs font-bold uppercase tracking-widest">
              {km(Number(distanceKm))} · {quotes.filter((q) => q.card).length} price card{quotes.filter((q) => q.card).length !== 1 ? "s" : ""}
            </h2>

            <div className="mt-3 grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
              {quotes.map(({ vehicle, card, error }) => {
                const fare = card?.breakup;
                const best = fare && card?.price?.id === cheapest;
                const displayName = vehicle?.name ?? card?.price?.vehicle?.name ?? "Vehicle";
                return (
                  <article
                    key={card?.price?.id ?? Math.random()}
                    className={`relative flex flex-col rounded-2xl border p-5 shadow-sm transition-all ${panel} ${
                      best ? "ring-2 ring-pm-yellow" : ""
                    }`}
                  >
                    {best && (
                      <span className="absolute -top-2.5 right-4 flex items-center gap-1 rounded-full bg-pm-yellow px-2.5 py-0.5 text-[10px] font-black uppercase tracking-wide text-pm-ink">
                        <Icon.Check className="h-3 w-3" /> Lowest fare
                      </span>
                    )}

                    <div className="flex items-start gap-3">
                      <span className={`grid h-11 w-11 shrink-0 place-items-center rounded-xl ${dark ? "bg-[#161310]" : "bg-pm-cream"}`}>
                        {vehicle?.imageUrl ? (
                          // eslint-disable-next-line @next/next/no-img-element
                          <img src={vehicle.imageUrl} alt="" className="h-8 w-8 object-contain" />
                        ) : (
                          <Icon.Truck className="h-5 w-5 text-pm-red" />
                        )}
                      </span>
                      <div className="min-w-0">
                        <h3 className="truncate font-bold leading-tight">{displayName}</h3>
                        <p className={`mt-0.5 flex items-center gap-1 text-xs ${muted}`}>
                          <Icon.Weight className="h-3.5 w-3.5" />
                          {vehicle?.maxLoad || "Standard load"}
                        </p>
                        {card?.price?.pricingType && card.price.pricingType !== "standard" && (
                          <p className={`mt-0.5 text-[10px] uppercase tracking-wider ${muted}`}>
                            {card.price.pricingType}{card.price.unitType ? ` · ${card.price.unitType}` : ""}
                          </p>
                        )}
                      </div>
                    </div>

                    {error || !fare ? (
                      <p className={`mt-4 text-sm ${muted}`}>{error ?? "Estimate unavailable"}</p>
                    ) : (
                      <>
                        <p className="mt-4 text-3xl font-black text-pm-red">{inr(fare.finalEstimate)}</p>
                        <p className={`text-[11px] ${muted}`}>Estimated fare · inclusive of the charges below</p>

                        <dl className={`mt-4 space-y-1.5 border-t pt-3 text-xs ${hair}`}>
                          {fare.baseFare > 0 && (
                            <Row label="Base fare" hint={`min ${km(card?.price?.minimumKm ?? 0)}`} value={inr(fare.baseFare)} muted={muted} />
                          )}

                          {fare.distanceCharge > 0 && (
                            <Row
                              label="Distance charge"
                              hint={`${km(Number(distanceKm))} × ${inr(card?.price?.perKmRate ?? 0)}/km`}
                              value={inr(fare.distanceCharge)}
                              muted={muted}
                            />
                          )}

                          {fare.helperCharge > 0 && (
                            <Row
                              label="Loading helpers"
                              hint={`${Number(helperCount)} × helper`}
                              value={inr(fare.helperCharge)}
                              muted={muted}
                            />
                          )}

                          {fare.loadingCharge > 0 && (
                            <Row label="Loading charge" value={inr(fare.loadingCharge)} muted={muted} />
                          )}

                          {fare.nightCharge > 0 && (
                            <Row label="Night charge" value={inr(fare.nightCharge)} muted={muted} />
                          )}

                          {fare.expressCharge > 0 && (
                            <Row label="Express charge" value={inr(fare.expressCharge)} muted={muted} />
                          )}

                          {fare.extraCharge > 0 && (
                            <Row label="Extra charge" value={inr(fare.extraCharge)} muted={muted} />
                          )}

                          {fare.tollParking > 0 && (
                            <Row label="Toll / parking" value={inr(fare.tollParking)} muted={muted} />
                          )}

                          {fare.gst > 0 && (
                            <Row label="GST" value={inr(fare.gst)} muted={muted} />
                          )}

                          {fare.discountAmount > 0 && (
                            <Row label="Discount" hint={`${fare.discountPercent}%`} value={`− ${inr(fare.discountAmount)}`} muted={muted} emphasis />
                          )}

                          {fare.advanceAmount > 0 && (
                            <Row label="Advance payable" hint="on confirmation" value={inr(fare.advanceAmount)} muted={muted} />
                          )}

                          <div className={`flex items-baseline justify-between border-t pt-2 ${hair}`}>
                            <dt className="text-sm font-bold">Final estimated fare</dt>
                            <dd className="text-sm font-black text-pm-red">{inr(fare.finalEstimate)}</dd>
                          </div>
                        </dl>

                        {fare.calculationNotes && fare.calculationNotes.length > 0 && (
                          <ul className={`mt-3 space-y-0.5 text-[11px] ${muted}`}>
                            {fare.calculationNotes.slice(0, 4).map((n, i) => (
                              <li key={i}>· {n}</li>
                            ))}
                          </ul>
                        )}

                        <Link
                          href={`/?service=${service?.slug ?? ""}&vehicle=${vehicle?.slug ?? ""}`}
                          className="mt-4 block rounded-full bg-pm-ink px-4 py-2.5 text-center text-xs font-bold text-pm-yellow transition-opacity hover:opacity-90"
                        >
                          Book {displayName}
                        </Link>
                      </>
                    )}
                  </article>
                );
              })}
            </div>

            <p className={`mt-5 flex items-start gap-2 text-xs ${muted}`}>
              <Icon.Users className="mt-0.5 h-4 w-4 shrink-0" />
              Fares are calculated by ParcelMaadi&apos;s booking engine from the live rate card and
              zone rules. Waiting charges, cancellation charges and any coupons are applied at booking
              and are not included above. Toll, parking and permits, where applicable, are extra.
            </p>
          </section>
        ) : null}
      </main>
    </div>
  );
}

/** One line of the fare breakdown. Presentation only. */
function Row({
  label, hint, value, muted, emphasis,
}: {
  label: string;
  hint?: string;
  value: string;
  muted: string;
  emphasis?: boolean;
}) {
  return (
    <div className="flex items-baseline justify-between gap-3">
      <dt className={emphasis ? "font-semibold" : muted}>
        {label}
        {hint && <span className={`ml-1 ${muted}`}>({hint})</span>}
      </dt>
      <dd className="shrink-0 font-semibold tabular-nums">{value}</dd>
    </div>
  );
}
