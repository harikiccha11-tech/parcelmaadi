// ParcelMaadi seed data — machinery rental catalog.
// Rates include operator where industry-standard (JCB, excavator, tractor);
// fuel terms shown in description. Admin editable from panel (Module 4).

export type MachinerySeed = {
  name: string;
  category: string;
  unitLabel: string;
  pricePerUnit: number;
  minUnits: number;
  description?: string;
  sortOrder: number;
};

export const machinery: MachinerySeed[] = [
  // Earthmoving
  { name: "JCB 3DX Backhoe Loader", category: "Earthmoving", unitLabel: "per hour", pricePerUnit: 900, minUnits: 2, description: "With operator and diesel; 2-hour minimum", sortOrder: 1 },
  { name: "Mini Excavator (3 Tonne)", category: "Earthmoving", unitLabel: "per hour", pricePerUnit: 1100, minUnits: 3, description: "Compact excavator for tight sites; with operator and diesel", sortOrder: 2 },
  { name: "Hitachi Excavator (20 Tonne)", category: "Earthmoving", unitLabel: "per hour", pricePerUnit: 1800, minUnits: 4, description: "Heavy excavation; with operator and diesel", sortOrder: 3 },
  { name: "Tractor with Trailer", category: "Earthmoving", unitLabel: "per trip", pricePerUnit: 800, minUnits: 1, description: "Debris and soil removal within city limits", sortOrder: 4 },

  // Concrete
  { name: "Concrete Mixer (10/7 CFT)", category: "Concrete", unitLabel: "per day", pricePerUnit: 1200, minUnits: 1, description: "Diesel mixer without operator; fuel by customer", sortOrder: 5 },
  { name: "Concrete Mixer with Lift (10/7 CFT)", category: "Concrete", unitLabel: "per day", pricePerUnit: 2200, minUnits: 1, description: "Mixer with hoist for slab work; operator included", sortOrder: 6 },
  { name: "Needle Vibrator (40 mm)", category: "Concrete", unitLabel: "per day", pricePerUnit: 450, minUnits: 1, description: "Petrol engine concrete vibrator", sortOrder: 7 },

  // Lifting
  { name: "Hydra Crane (14 Tonne)", category: "Lifting", unitLabel: "per hour", pricePerUnit: 1400, minUnits: 4, description: "Pick-and-carry crane with operator; 4-hour minimum", sortOrder: 8 },
  { name: "Builder Hoist / Material Lift", category: "Lifting", unitLabel: "per day", pricePerUnit: 1800, minUnits: 1, description: "Up to 500 kg per lift; operator included", sortOrder: 9 },
  { name: "Scaffolding Set (Cuplock)", category: "Lifting", unitLabel: "per day", pricePerUnit: 12, minUnits: 30, description: "Per standard frame per day; 30-frame minimum", sortOrder: 10 },

  // Power & Light
  { name: "Diesel Generator 25 kVA", category: "Power & Light", unitLabel: "per day", pricePerUnit: 2500, minUnits: 1, description: "Silent DG set; diesel by customer", sortOrder: 11 },
  { name: "Diesel Generator 62.5 kVA", category: "Power & Light", unitLabel: "per day", pricePerUnit: 4500, minUnits: 1, description: "For events and site power; diesel by customer", sortOrder: 12 },
  { name: "Tower Light (4 × 400 W)", category: "Power & Light", unitLabel: "per night", pricePerUnit: 1500, minUnits: 1, description: "Mobile lighting mast with DG for night work and events", sortOrder: 13 },

  // Compaction
  { name: "Plate Compactor", category: "Compaction", unitLabel: "per day", pricePerUnit: 900, minUnits: 1, description: "For paver and trench compaction; petrol by customer", sortOrder: 14 },
  { name: "Roller Compactor (Mini, 1 Tonne)", category: "Compaction", unitLabel: "per day", pricePerUnit: 3500, minUnits: 1, description: "Walk-behind roller with operator", sortOrder: 15 },
];
