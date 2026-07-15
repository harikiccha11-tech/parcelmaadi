// ParcelMaadi seed data — vehicle rate card.
// Finalized against Porter/Borzo/Rapido competitive research:
// base fare covers the first `baseKm`, then perKmRate applies.

export type VehicleSeed = {
  name: string;
  slug: string;
  description: string;
  capacityKg: number;
  baseFare: number;
  baseKm: number;
  perKmRate: number;
  minFare: number;
  sortOrder: number;
  // INTER_ZONE flat surcharge used when seeding ZonePricingRule for every city
  interZoneSurcharge: number;
};

export const vehicles: VehicleSeed[] = [
  {
    name: "Two Wheeler",
    slug: "two-wheeler",
    description: "Documents, food, small parcels up to 20 kg",
    capacityKg: 20,
    baseFare: 40,
    baseKm: 2,
    perKmRate: 10,
    minFare: 40,
    sortOrder: 1,
    interZoneSurcharge: 20,
  },
  {
    name: "Three Wheeler (E-Loader)",
    slug: "three-wheeler",
    description: "Electric loader for light goods up to 300 kg",
    capacityKg: 300,
    baseFare: 150,
    baseKm: 2,
    perKmRate: 12,
    minFare: 150,
    sortOrder: 2,
    interZoneSurcharge: 30,
  },
  {
    name: "Tata Ape",
    slug: "tata-ape",
    description: "Compact goods auto for narrow streets, up to 500 kg",
    capacityKg: 500,
    baseFare: 200,
    baseKm: 2,
    perKmRate: 15,
    minFare: 200,
    sortOrder: 3,
    interZoneSurcharge: 40,
  },
  {
    name: "Tata Ace (Chota Hathi)",
    slug: "tata-ace",
    description: "Mini truck for household shifting and bulk goods, up to 750 kg",
    capacityKg: 750,
    baseFare: 300,
    baseKm: 3,
    perKmRate: 18,
    minFare: 300,
    sortOrder: 4,
    interZoneSurcharge: 50,
  },
  {
    name: "Pickup 8ft",
    slug: "pickup-8ft",
    description: "Open pickup for construction material and heavy loads, up to 1250 kg",
    capacityKg: 1250,
    baseFare: 400,
    baseKm: 3,
    perKmRate: 20,
    minFare: 400,
    sortOrder: 5,
    interZoneSurcharge: 60,
  },
  {
    name: "Tata 407",
    slug: "tata-407",
    description: "Large truck for full-house shifting and commercial loads, up to 2500 kg",
    capacityKg: 2500,
    baseFare: 480,
    baseKm: 4,
    perKmRate: 22,
    minFare: 480,
    sortOrder: 6,
    interZoneSurcharge: 80,
  },
];
