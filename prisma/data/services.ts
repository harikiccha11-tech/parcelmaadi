// ParcelMaadi seed data — service categories (super-app home screen).
// `comingSoon: true` renders the tile disabled; admin-toggleable at runtime.

export type ServiceSeed = {
  name: string;
  slug: string;
  description: string;
  icon: string;
  comingSoon: boolean;
  sortOrder: number;
};

export const services: ServiceSeed[] = [
  {
    name: "Parcel Delivery",
    slug: "parcel-delivery",
    description: "Send anything across the city — bike to Tata 407",
    icon: "📦",
    comingSoon: false, // LIVE — Module 3 booking flow
    sortOrder: 1,
  },
  {
    name: "Transport & Shifting",
    slug: "transport-shifting",
    description: "House shifting, office moves and full-load transport",
    icon: "🚚",
    comingSoon: false, // LIVE — Module 3 booking flow
    sortOrder: 2,
  },
  {
    name: "Grocery",
    slug: "grocery",
    description: "Daily essentials at Karnataka market prices, home delivered",
    icon: "🛒",
    comingSoon: false, // LIVE — marketplace storefront (/shop?tab=grocery)
    sortOrder: 3,
  },
  {
    name: "Material Supply",
    slug: "material-supply",
    description: "Cement, sand, jelly, bricks and steel to your site",
    icon: "🧱",
    comingSoon: false, // LIVE — marketplace storefront (/shop?tab=materials)
    sortOrder: 4,
  },
  {
    name: "Water Tanker",
    slug: "water-tanker",
    description: "Drinking and construction water, 3000–12000 litres",
    icon: "💧",
    comingSoon: false, // LIVE — marketplace storefront (/shop?tab=water)
    sortOrder: 5,
  },
  {
    name: "Machinery Rental",
    slug: "machinery-rental",
    description: "JCB, excavators, mixers and generators on rent",
    icon: "🚜",
    comingSoon: false, // LIVE — marketplace storefront (/shop?tab=machinery)
    sortOrder: 6,
  },
  {
    name: "Home Services",
    slug: "home-services",
    description: "Electricians, plumbers, painters and cleaners",
    icon: "🛠️",
    comingSoon: true,
    sortOrder: 7,
  },
  {
    slug: "outstation-booking",
    name: "Outstation Booking",
    description: "City-to-city transport across Karnataka — long-distance parcels & goods.",
    icon: "🛣️",
    comingSoon: false, // LIVE — Module 6
    sortOrder: 8,
  },
  {
    slug: "emergency-booking",
    name: "Emergency Booking",
    description: "Priority pickup within minutes — urgent documents, medicines, spares.",
    icon: "🚨",
    comingSoon: false, // LIVE — Module 6
    sortOrder: 9,
  },

];
