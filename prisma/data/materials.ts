// ParcelMaadi seed data — construction material supply catalog.
// Karnataka market pricing (delivery charged separately via transport booking).

export type MaterialSeed = {
  name: string;
  category: string;
  unit: string;
  price: number;
  description?: string;
  sortOrder: number;
};

export const materials: MaterialSeed[] = [
  // Cement
  { name: "ACC Cement (PPC)", category: "Cement", unit: "per bag (50 kg)", price: 410, description: "Portland Pozzolana Cement for general construction", sortOrder: 1 },
  { name: "UltraTech Cement (PPC)", category: "Cement", unit: "per bag (50 kg)", price: 420, description: "Premium PPC grade for slabs and columns", sortOrder: 2 },
  { name: "JSW Cement (PSC)", category: "Cement", unit: "per bag (50 kg)", price: 395, description: "Slag cement, good for coastal and foundation work", sortOrder: 3 },
  { name: "Ramco Cement (OPC 53)", category: "Cement", unit: "per bag (50 kg)", price: 430, description: "High early strength for RCC work", sortOrder: 4 },

  // Sand
  { name: "M-Sand (Manufactured Sand)", category: "Sand", unit: "per tonne", price: 950, description: "Concrete-grade manufactured sand, IS 383 compliant", sortOrder: 5 },
  { name: "P-Sand (Plastering Sand)", category: "Sand", unit: "per tonne", price: 1050, description: "Fine manufactured sand for plastering", sortOrder: 6 },
  { name: "River Sand", category: "Sand", unit: "per tonne", price: 1800, description: "Natural river sand, subject to availability", sortOrder: 7 },

  // Aggregate
  { name: "Jelly Stones 20 mm", category: "Aggregate", unit: "per tonne", price: 750, description: "Coarse aggregate for RCC and PCC", sortOrder: 8 },
  { name: "Jelly Stones 12 mm", category: "Aggregate", unit: "per tonne", price: 800, description: "Medium aggregate for slabs and lintels", sortOrder: 9 },
  { name: "Jelly Stones 6 mm (Chips)", category: "Aggregate", unit: "per tonne", price: 850, description: "Fine chips for flooring and precast", sortOrder: 10 },
  { name: "Boulder / Size Stone", category: "Aggregate", unit: "per load (2 units)", price: 5500, description: "Foundation size stones", sortOrder: 11 },

  // Bricks & Blocks
  { name: "Red Clay Bricks (Table Mould)", category: "Bricks & Blocks", unit: "per 1000 pcs", price: 8500, description: "Standard 9 × 4 × 3 inch red bricks", sortOrder: 12 },
  { name: "Cement Solid Blocks 6 inch", category: "Bricks & Blocks", unit: "per piece", price: 38, description: "6-inch solid concrete block", sortOrder: 13 },
  { name: "Cement Solid Blocks 8 inch", category: "Bricks & Blocks", unit: "per piece", price: 48, description: "8-inch solid concrete block for load-bearing walls", sortOrder: 14 },
  { name: "AAC Blocks (600×200×100 mm)", category: "Bricks & Blocks", unit: "per piece", price: 62, description: "Lightweight autoclaved aerated concrete block", sortOrder: 15 },
  { name: "Interlocking Pavers 60 mm", category: "Bricks & Blocks", unit: "per sq ft", price: 42, description: "M30 grade paver blocks, assorted colours", sortOrder: 16 },

  // Steel
  { name: "TMT Steel 8 mm (Fe 550)", category: "Steel", unit: "per kg", price: 62, description: "8 mm TMT rebar for stirrups and slabs", sortOrder: 17 },
  { name: "TMT Steel 10 mm (Fe 550)", category: "Steel", unit: "per kg", price: 60, description: "10 mm TMT rebar", sortOrder: 18 },
  { name: "TMT Steel 12 mm (Fe 550)", category: "Steel", unit: "per kg", price: 59, description: "12 mm TMT rebar for beams and columns", sortOrder: 19 },
  { name: "TMT Steel 16 mm (Fe 550)", category: "Steel", unit: "per kg", price: 59, description: "16 mm TMT rebar for footings and columns", sortOrder: 20 },
  { name: "Binding Wire", category: "Steel", unit: "per kg", price: 78, description: "Annealed binding wire, 18 gauge", sortOrder: 21 },
];
