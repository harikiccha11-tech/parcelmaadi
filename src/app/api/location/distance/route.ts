import { NextResponse } from "next/server";

// POST /api/location/distance — calculate distance in KM
// Uses Google Maps Distance Matrix API if key configured, else falls back to
// Haversine straight-line distance (×1.3 road factor). Always returns a distance
// so the customer flow can continue. If the client passed a manual KM, we honour it.
export async function POST(req: Request) {
  try {
    const body = await req.json();
    const {
      manualKm,
      pickupLat, pickupLng, dropLat, dropLng,
    } = body || {};

    if (manualKm != null && !Number.isNaN(Number(manualKm))) {
      return NextResponse.json({
        distanceKm: Number(manualKm),
        method: "manual",
        note: "Distance entered manually by customer",
      });
    }

    const pLat = Number(pickupLat);
    const pLng = Number(pickupLng);
    const dLat = Number(dropLat);
    const dLng = Number(dropLng);

    if ([pLat, pLng, dLat, dLng].some((n) => Number.isNaN(n))) {
      return NextResponse.json({
        error: "Provide pickupLat, pickupLng, dropLat, dropLng or manualKm",
        requiresManual: true,
      }, { status: 400 });
    }

    const googleKey = process.env.GOOGLE_MAPS_API_KEY;
    if (googleKey) {
      try {
        const url = `https://maps.googleapis.com/maps/api/distancematrix/json?origins=${pLat},${pLng}&destinations=${dLat},${dLng}&key=${googleKey}&units=metric`;
        const r = await fetch(url, { cache: "no-store" });
        const data = await r.json();
        const el = data?.rows?.[0]?.elements?.[0];
        if (el?.status === "OK" && el.distance) {
          return NextResponse.json({
            distanceKm: Number((el.distance.value / 1000).toFixed(2)),
            durationText: el.duration?.text,
            method: "google",
          });
        }
      } catch {
        // fall through to haversine
      }
    }

    // Haversine fallback
    const R = 6371; // km
    const dLatRad = ((dLat - pLat) * Math.PI) / 180;
    const dLngRad = ((dLng - pLng) * Math.PI) / 180;
    const a =
      Math.sin(dLatRad / 2) ** 2 +
      Math.cos((pLat * Math.PI) / 180) *
        Math.cos((dLat * Math.PI) / 180) *
        Math.sin(dLngRad / 2) ** 2;
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    const straight = R * c;
    const road = Number((straight * 1.3).toFixed(2)); // road factor estimate
    return NextResponse.json({
      distanceKm: road,
      method: "haversine",
      note: "Estimated road distance (straight-line × 1.3). You may override with manual KM.",
    });
  } catch {
    return NextResponse.json({ error: "Distance calculation failed", requiresManual: true }, { status: 500 });
  }
}
