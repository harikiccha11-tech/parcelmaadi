import { NextResponse } from "next/server";

// POST /api/location/reverse-geocode — convert lat/lng to address
// Uses OpenStreetMap Nominatim (free, no API key) as a fallback when no Google Maps API.
export async function POST(req: Request) {
  try {
    const { lat, lng } = await req.json();
    if (lat == null || lng == null) {
      return NextResponse.json({ error: "lat and lng required" }, { status: 400 });
    }
    // If a Google Maps API key is configured via env, use it (optional)
    const googleKey = process.env.GOOGLE_MAPS_API_KEY;
    if (googleKey) {
      const r = await fetch(
        `https://maps.googleapis.com/maps/api/geocode/json?latlng=${lat},${lng}&key=${googleKey}`,
        { cache: "no-store" }
      );
      const data = await r.json();
      const address = data?.results?.[0]?.formatted_address;
      if (address) return NextResponse.json({ address, source: "google" });
    }
    // Fallback: Nominatim (free)
    const r = await fetch(
      `https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lng}&zoom=18&addressdetails=1`,
      { headers: { "User-Agent": "ParcelMaadi/1.0" }, cache: "no-store" }
    );
    if (!r.ok) {
      return NextResponse.json({ address: `${lat}, ${lng}`, source: "coords" });
    }
    const data = await r.json();
    const address = data?.display_name || `${lat}, ${lng}`;
    return NextResponse.json({ address, source: "osm" });
  } catch {
    return NextResponse.json({ error: "Reverse geocode failed" }, { status: 500 });
  }
}
