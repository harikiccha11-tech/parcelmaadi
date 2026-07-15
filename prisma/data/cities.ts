// ParcelMaadi seed data — 10 Karnataka cities, 4 zones each.
// `areas` are anchor localities shown to customers when picking a zone.
// Admin can edit/extend all of this from the panel (Module 4).

export type ZoneSeed = { name: string; areas: string };
export type CitySeed = {
  name: string;
  slug: string;
  district: string;
  sortOrder: number;
  zones: ZoneSeed[];
};

export const cities: CitySeed[] = [
  {
    name: "Davanagere",
    slug: "davanagere",
    district: "Davanagere",
    sortOrder: 1,
    zones: [
      { name: "Central", areas: "PJ Extension, MCC A Block, MCC B Block, Court Area" },
      { name: "North", areas: "Vidyanagar, Saraswathi Nagar, SS Layout" },
      { name: "South", areas: "Azad Nagar, Nittuvalli, KTJ Nagar" },
      { name: "East", areas: "Bathi, Doddabudihal Road, Industrial Area" },
    ],
  },
  {
    name: "Bengaluru",
    slug: "bengaluru",
    district: "Bengaluru Urban",
    sortOrder: 2,
    zones: [
      { name: "Central", areas: "Majestic, Shivajinagar, MG Road, Richmond Town" },
      { name: "North", areas: "Hebbal, Yelahanka, RT Nagar, Jakkur" },
      { name: "South", areas: "Jayanagar, JP Nagar, Banashankari, BTM Layout" },
      { name: "East", areas: "Indiranagar, Marathahalli, Whitefield, KR Puram" },
    ],
  },
  {
    name: "Mysuru",
    slug: "mysuru",
    district: "Mysuru",
    sortOrder: 3,
    zones: [
      { name: "Central", areas: "Devaraja Mohalla, KR Circle, Agrahara" },
      { name: "North", areas: "Hebbal Industrial Area, Metagalli, Vijayanagar" },
      { name: "South", areas: "Kuvempunagar, JP Nagar, Vishweshwara Nagar" },
      { name: "East", areas: "Siddhartha Layout, Nazarbad, Alanahalli" },
    ],
  },
  {
    name: "Hubballi-Dharwad",
    slug: "hubballi-dharwad",
    district: "Dharwad",
    sortOrder: 4,
    zones: [
      { name: "Central", areas: "Old Hubballi, Durgad Bail, Koppikar Road" },
      { name: "North", areas: "Dharwad City, Saptapur, Malmaddi" },
      { name: "South", areas: "Gokul Road, Industrial Estate, Tarihal" },
      { name: "East", areas: "Vidyanagar, Keshwapur, Unkal" },
    ],
  },
  {
    name: "Mangaluru",
    slug: "mangaluru",
    district: "Dakshina Kannada",
    sortOrder: 5,
    zones: [
      { name: "Central", areas: "Hampankatta, Bunder, Falnir" },
      { name: "North", areas: "Surathkal, Kulai, Baikampady" },
      { name: "South", areas: "Ullal, Thokkottu, Deralakatte" },
      { name: "East", areas: "Kadri, Bejai, Kankanady, Padil" },
    ],
  },
  {
    name: "Belagavi",
    slug: "belagavi",
    district: "Belagavi",
    sortOrder: 6,
    zones: [
      { name: "Central", areas: "Khade Bazar, Shahapur, Camp Area" },
      { name: "North", areas: "Hindalga, Vadgaon, Angol" },
      { name: "South", areas: "Tilakwadi, Nehru Nagar, Hanuman Nagar" },
      { name: "East", areas: "Udyambag, Autonagar, Majagaon" },
    ],
  },
  {
    name: "Shivamogga",
    slug: "shivamogga",
    district: "Shivamogga",
    sortOrder: 7,
    zones: [
      { name: "Central", areas: "Gandhi Bazaar, Durgigudi, BH Road" },
      { name: "North", areas: "Vinobanagar, Gopala, Navule" },
      { name: "South", areas: "Vidyanagar, Shankar Mutt Road, Alkola" },
      { name: "East", areas: "Sagar Road, Tilak Nagar, Machenahalli" },
    ],
  },
  {
    name: "Tumakuru",
    slug: "tumakuru",
    district: "Tumakuru",
    sortOrder: 8,
    zones: [
      { name: "Central", areas: "MG Road, Ashok Nagar, Town Hall Circle" },
      { name: "North", areas: "Kyathsandra, Antharasanahalli, Sira Gate" },
      { name: "South", areas: "SIT Extension, Saraswathipuram, Batawadi" },
      { name: "East", areas: "Vasanthanarasapura, Industrial Area, Hirehalli" },
    ],
  },
  {
    name: "Ballari",
    slug: "ballari",
    district: "Ballari",
    sortOrder: 9,
    zones: [
      { name: "Central", areas: "Gandhi Nagar, Brucepet, Cowl Bazaar" },
      { name: "North", areas: "Cantonment, Fort Area, Talur Road" },
      { name: "South", areas: "SN Pet, Kappagal Road, Mothi Circle" },
      { name: "East", areas: "Ballari Industrial Area, Hospet Road, Sanjay Gandhi Nagar" },
    ],
  },
  {
    name: "Kalaburagi",
    slug: "kalaburagi",
    district: "Kalaburagi",
    sortOrder: 10,
    zones: [
      { name: "Central", areas: "Super Market, Station Bazaar, SVP Chowk" },
      { name: "North", areas: "Aland Road, Jewargi Colony, GDA Layout" },
      { name: "South", areas: "Ring Road, Sedam Road, Kusnoor" },
      { name: "East", areas: "Shahabad Road, Industrial Area, Kapnoor" },
    ],
  },
];
