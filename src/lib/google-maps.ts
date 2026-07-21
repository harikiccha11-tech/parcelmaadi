const GOOGLE_MAPS_API_KEY = process.env.GOOGLE_MAPS_API_KEY;
export interface GeocodeResult { lat: number; lng: number; address: string; city?: string; state?: string; country?: string; pincode?: string; area?: string; }
export async function searchAddress(query: string): Promise<GeocodeResult[]> {
  if (GOOGLE_MAPS_API_KEY) {
    const url = `https://maps.googleapis.com/maps/api/geocode/json?address=${encodeURIComponent(query)}&key=${GOOGLE_MAPS_API_KEY}`;
    const res = await fetch(url); const data = await res.json();
    return (data.results || []).map((r: any) => ({ lat: r.geometry.location.lat, lng: r.geometry.location.lng, address: r.formatted_address }));
  }
  const url = `https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(query)}&format=json&limit=5&addressdetails=1`;
  const res = await fetch(url, { headers: { "User-Agent": "ParcelMaadi/1.0" } }); const data = await res.json();
  return (data || []).map((r: any) => ({ lat: parseFloat(r.lat), lng: parseFloat(r.lon), address: r.display_name }));
}
export async function reverseGeocode(lat: number, lng: number): Promise<GeocodeResult> {
  const url = `https://nominatim.openstreetmap.org/reverse?lat=${lat}&lon=${lng}&format=json&addressdetails=1`;
  const res = await fetch(url, { headers: { "User-Agent": "ParcelMaadi/1.0" } }); const data = await res.json();
  return { lat, lng, address: data.display_name || `${lat}, ${lng}` };
}
export function getMapsLink(lat: number, lng: number): string { return `https://www.google.com/maps?q=${lat},${lng}`; }
export function getMapsEmbedUrl(lat: number, lng: number): string { return `https://maps.google.com/maps?q=${lat},${lng}&z=15&output=embed`; }
