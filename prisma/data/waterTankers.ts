// ParcelMaadi seed data — water tanker catalog.
// Price = per delivery within city limits; outskirts surcharge handled in booking (Module 3).

export type WaterTankerSeed = {
  name: string;
  capacityLitres: number;
  waterType: "DRINKING" | "CONSTRUCTION";
  price: number;
  description?: string;
  sortOrder: number;
};

export const waterTankers: WaterTankerSeed[] = [
  { name: "Drinking Water Tanker 3000 L", capacityLitres: 3000, waterType: "DRINKING", price: 550, description: "RO/borewell potable water for homes and PGs", sortOrder: 1 },
  { name: "Drinking Water Tanker 5000 L", capacityLitres: 5000, waterType: "DRINKING", price: 750, description: "Potable water for apartments and functions", sortOrder: 2 },
  { name: "Drinking Water Tanker 8000 L", capacityLitres: 8000, waterType: "DRINKING", price: 1050, description: "Bulk potable supply for apartments and hostels", sortOrder: 3 },
  { name: "Construction Water Tanker 5000 L", capacityLitres: 5000, waterType: "CONSTRUCTION", price: 600, description: "Curing and construction use", sortOrder: 4 },
  { name: "Construction Water Tanker 8000 L", capacityLitres: 8000, waterType: "CONSTRUCTION", price: 850, description: "Site supply for medium projects", sortOrder: 5 },
  { name: "Construction Water Tanker 12000 L", capacityLitres: 12000, waterType: "CONSTRUCTION", price: 1200, description: "Bulk site supply for large projects", sortOrder: 6 },
];
