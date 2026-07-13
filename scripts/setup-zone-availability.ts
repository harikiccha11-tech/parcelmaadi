// Set up zone-based service availability per user spec:
// - Bengaluru, Davangere, Chitradurga, Hosadurga: ALL 11 services available (live cities)
// - Goods Transport + Outstation Booking: intercity (these 4 cities → anywhere Karnataka)
// - Other zones: services within city limits only
import { db } from "@/lib/db";

// City → pincodes + zone config
const LIVE_CITIES = [
  {
    name: "Bengaluru Central",
    slug: "bengaluru-central",
    cities: "Bengaluru,Bangalore,MG Road,Indiranagar,Koramangala,Whitefield,Electronic City",
    pinCodes: "560001,560002,560008,560034,560037,560038,560047,560066,560068,560075,560087,560095,560100,560066",
  },
  {
    name: "Bengaluru North",
    slug: "bengaluru-north",
    cities: "Bengaluru North,Yelahanka,Hebbal,Thanisandra,Jalahalli,Peenya",
    pinCodes: "560022,560024,560028,560032,560057,560060,560063,560064,560077,560092,560103,560106",
  },
  {
    name: "Bengaluru South",
    slug: "bengaluru-south",
    cities: "Bengaluru South,JP Nagar,Banashankari,Jayanagar,BTM Layout,Uttarahalli",
    pinCodes: "560041,560050,560061,560062,560070,560076,560078,560082,560085,560091",
  },
  {
    name: "Bengaluru West",
    slug: "bengaluru-west",
    cities: "Bengaluru West,Rajajinagar,Vijayanagar,Basaveshwaranagar,Malleswaram",
    pinCodes: "560003,560010,540011,560015,560020,560021,560023,560026,560027,560040,560055,560072,560073,560079,560086",
  },
  {
    name: "Davangere",
    slug: "davangere",
    cities: "Davangere,Davanagere,Harihara,Honnali,Jagalur",
    pinCodes: "577001,577002,577003,577004,577005,577006,577007,577217,577551,577552,577211,577223",
  },
  {
    name: "Chitradurga",
    slug: "chitradurga",
    cities: "Chitradurga,Challekere,Hiriyur,Molakalmuru",
    pinCodes: "577501,577502,577503,577522,577532,577528,577551,577527,577535",
  },
  {
    name: "Hosadurga",
    slug: "hosadurga",
    cities: "Hosadurga,Hosadurga Chitradurga,Nayakanahatti",
    pinCodes: "577515,577527,577533,577515,577524,577542",
  },
  {
    name: "Mysuru",
    slug: "mysuru",
    cities: "Mysuru,Mysore,Mandya,Maddur",
    pinCodes: "570001,570002,570003,570004,570005,570006,570007,570008,570009,570010,570011,570012,570017,570019,570022,570023,570024,570025,570026,570027,570028,570029",
  },
  {
    name: "Other Karnataka (Intercity Only)",
    slug: "other-karnataka-intercity",
    cities: "Mangaluru,Mangalore,Hubli,Hubballi,Belagavi,Belgaum,Shimoga,Shivamogga,Tumakur,Tumkur,Dharwad,Gulbarga,Kalaburagi,Ballari,Bellary,Udupi,Hassan,Mandya,Chikmagalur,Vijayanagara,Hospet,Raichur,Bidar,Karwar,Uttara Kannada,Dakshina Kannada,Kodagu,Coorg,Chamarajanagar,Kolar,Chikkaballapur,Ramanagara",
    pinCodes: "575001,575002,575003,580001,580002,580003,580020,580021,580024,580025,580028,580030,580031,590001,577201,577202,577203,577204,577205,577206,577207,577222,577226,577227,577228,577229,577230,577231,577232,572101,572102,572103,572104,572105,572106,572107,572108,572109,572110,572111,572112,572113,572114,572115,572116,572117,572118,572119,572120,572121,572122,572123,572124,572125,572126,572127,572128,572129,572130,572131,572132,572133,572134,572135,572136,572137,572138,572139,572140,572141,572142,572143,572144,572145,572146,572147,572148,572149,572150,572151,572152,572153,572154,572155,572156,572157,572158,572159,572160,572161,572162,572163,572164,572165,572166,572167,572168,572169,572170,572171,572172,572173,572174,572175,572176,572177,572178,572179,572180,572181,572182,572183,572184,572185,572186,572187,572188,572189,572190,572191,572192,572193,572194,572195,572196,572197,572198,572199,572201,572202,572203,572204,572205,572206,572207,572208,572209,572210,572211,572212,572213,572214,572215,572216,572217,572218,572219,572220,572221,572222,572223,572224,572225,572226,572227,572228,572229,572230,572231,572232,572233,572234,572235,572236,572237,572238,572239,572240,572241,572242,572243,572244,572245,572246,572247,572248,572249,572250,572251,572252,572253,572254,572255,572256,572257,572258,572259,572260,572261,572262,572263,572264,572265,572266,572267,572268,572269,572270,572271,572272,572273,572274,572275,572276,572277,572278,572279,572280,572281,572282,572283,572284,572285,572286,572287,572288,572289,572290,572291,572292,572293,572294,572295,572296,572297,572298,572299",
  },
];

async function main() {
  console.log("=== Setting up zone-based service availability ===\n");

  // Step 1: Update existing zones (1-6) + create new ones for Davangere, Chitradurga, Hosadurga
  const allServices = await db.service.findMany();
  console.log(`Found ${allServices.length} services`);

  // Delete all existing zone availability rules (clean slate)
  await db.zoneAvailability.deleteMany({});
  console.log("✅ Cleared all existing zone availability rules\n");

  // Upsert each zone
  const zoneMap: Record<string, number> = {};
  for (const z of LIVE_CITIES) {
    let zone = await db.zone.findUnique({ where: { slug: z.slug } }).catch(() => null);
    if (zone) {
      zone = await db.zone.update({
        where: { id: zone.id },
        data: {
          name: z.name,
          cities: z.cities,
          pinCodes: z.pinCodes,
          status: "Active",
        },
      });
      console.log(`  ✅ Updated zone: ${z.name} (${zone.id})`);
    } else {
      zone = await db.zone.create({
        data: {
          name: z.name,
          slug: z.slug,
          cities: z.cities,
          pinCodes: z.pinCodes,
          status: "Active",
        },
      });
      console.log(`  ✅ Created zone: ${z.name} (${zone.id})`);
    }
    zoneMap[z.slug] = zone.id;
  }

  // Step 2: Set service availability per zone
  console.log("\n=== Setting service availability per zone ===\n");

  // Cities where ALL services are available (full live)
  const FULL_LIVE_ZONES = [
    "bengaluru-central", "bengaluru-north", "bengaluru-south", "bengaluru-west",
    "davangere", "chitradurga", "hosadurga",
  ];

  // Cities where ONLY Goods Transport + Outstation + Emergency are available (intercity only)
  const INTERCITY_ONLY_ZONES = ["mysuru", "other-karnataka-intercity"];

  // Services allowed in intercity-only zones
  const INTERCITY_SERVICES = ["goods-transport", "outstation-booking", "emergency-booking"];

  for (const slug of FULL_LIVE_ZONES) {
    const zoneId = zoneMap[slug];
    if (!zoneId) continue;
    for (const svc of allServices) {
      await db.zoneAvailability.create({
        data: {
          zoneId,
          itemType: "Service",
          itemId: svc.id,
          available: true,
        },
      }).catch(() => {});
    }
    console.log(`  ✅ ${slug}: ALL ${allServices.length} services available (live city)`);
  }

  for (const slug of INTERCITY_ONLY_ZONES) {
    const zoneId = zoneMap[slug];
    if (!zoneId) continue;
    for (const svc of allServices) {
      const isIntercity = INTERCITY_SERVICES.includes(svc.slug);
      await db.zoneAvailability.create({
        data: {
          zoneId,
          itemType: "Service",
          itemId: svc.id,
          available: isIntercity, // Only intercity services available
        },
      }).catch(() => {});
    }
    console.log(`  ✅ ${slug}: Only ${INTERCITY_SERVICES.length} intercity services (Goods Transport, Outstation, Emergency)`);
  }

  // Step 3: Verify
  console.log("\n=== VERIFICATION ===\n");
  const zones = await db.zone.findMany({ orderBy: { id: "asc" } });
  console.log(`Total zones: ${zones.length}`);
  for (const z of zones) {
    const cityCount = z.cities?.split(",").length || 0;
    const pinCount = z.pinCodes?.split(",").length || 0;
    const rules = await db.zoneAvailability.count({ where: { zoneId: z.id, itemType: "Service", available: true } });
    console.log(`  [${z.id}] ${z.name}: ${cityCount} cities, ${pinCount} pincodes, ${rules} services available`);
  }

  console.log("\n=== CUSTOMER FLOW ===");
  console.log("• Customer in Bengaluru (560001) → sees ALL 11 services");
  console.log("• Customer in Davangere (577001) → sees ALL 11 services");
  console.log("• Customer in Chitradurga (577501) → sees ALL 11 services");
  console.log("• Customer in Hosadurga (577515) → sees ALL 11 services");
  console.log("• Customer in Mysuru (570001) → sees only Goods Transport, Outstation, Emergency");
  console.log("• Customer in Mangaluru (575001) → sees only Goods Transport, Outstation, Emergency");
  console.log("• Goods Transport: bookable from any live city → anywhere in Karnataka");
}

main().catch((e) => { console.error(e); process.exit(1); }).finally(async () => { await db.$disconnect(); });
