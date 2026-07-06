"use client";
import { useEffect, useRef, useState, useMemo } from "react";
import type * as LeafletType from "leaflet";
import "leaflet/dist/leaflet.css";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Loader2, MapPin, Search, Crosshair, Check } from "lucide-react";

// Lazy-load Leaflet only on client to avoid `window is not defined` SSR error
let _L: typeof LeafletType | null = null;
async function getL(): Promise<typeof LeafletType> {
  if (_L) return _L;
  const mod = await import("leaflet");
  _L = mod.default || (mod as any);
  const L = _L!;
  // Fix default marker icons
  const defaultIcon = L.icon({
    iconUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png",
    iconRetinaUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png",
    shadowUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png",
    iconSize: [25, 41], iconAnchor: [12, 41], popupAnchor: [1, -34], shadowSize: [41, 41],
  });
  L.Marker.prototype.options.icon = defaultIcon;
  return L;
}

export interface MapPickerValue {
  address: string;
  lat: number | null;
  lng: number | null;
  mapLink: string;
}

interface MapPickerProps {
  open: boolean;
  title: string;
  initial?: MapPickerValue;
  onConfirm: (v: MapPickerValue) => void;
  onClose: () => void;
}

// Free geocoding via OpenStreetMap Nominatim — no API key needed (Google API optional)
export function MapPicker({ open, title, initial, onConfirm, onClose }: MapPickerProps) {
  const mapRef = useRef<HTMLDivElement>(null);
  const mapInstance = useRef<LeafletType.Map | null>(null);
  const markerRef = useRef<LeafletType.Marker | null>(null);
  const [center] = useState<[number, number]>(initial?.lat != null && initial?.lng != null ? [initial.lat, initial.lng] : [12.9716, 77.5946]); // Bengaluru default
  const [selected, setSelected] = useState<MapPickerValue>(initial || { address: "", lat: null, lng: null, mapLink: "" });
  const [searchQuery, setSearchQuery] = useState("");
  const [searching, setSearching] = useState(false);
  const [locating, setLocating] = useState(false);

  // init map
  useEffect(() => {
    if (!open || !mapRef.current) return;
    let cancelled = false;
    if (mapInstance.current) {
      mapInstance.current.remove();
      mapInstance.current = null;
    }
    (async () => {
      const L = await getL();
      if (cancelled || !mapRef.current) return;
      const map = L.map(mapRef.current).setView(center, 13);
      L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
        attribution: '&copy; OpenStreetMap',
        maxZoom: 19,
      }).addTo(map);
      const m = L.marker(center, { draggable: true }).addTo(map);
      m.on("dragend", () => {
        const ll = m.getLatLng();
        handleSelect(ll.lat, ll.lng);
      });
      map.on("click", (e: LeafletType.LeafletMouseEvent) => {
        m.setLatLng(e.latlng);
        handleSelect(e.latlng.lat, e.latlng.lng);
      });
      mapInstance.current = map;
      markerRef.current = m;
      if (initial?.lat == null) handleSelect(center[0], center[1]);
      else if (!initial.address) handleSelect(initial.lat!, initial.lng!);
    })();
    return () => {
      cancelled = true;
      if (mapInstance.current) {
        mapInstance.current.remove();
        mapInstance.current = null;
      }
    };
  }, [open]);

  const handleSelect = async (lat: number, lng: number) => {
    const mapLink = `https://www.google.com/maps?q=${lat},${lng}`;
    setSelected((s) => ({ ...s, lat, lng, mapLink }));
    // reverse geocode
    try {
      const r = await fetch(`https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lng}&zoom=18&addressdetails=1`, {
        headers: { "User-Agent": "ParcelMaadi/1.0" },
      });
      if (r.ok) {
        const data = await r.json();
        if (data?.display_name) {
          setSelected((s) => ({ ...s, address: data.display_name, lat, lng, mapLink }));
        }
      }
    } catch {}
  };

  const doSearch = async () => {
    if (!searchQuery.trim()) return;
    setSearching(true);
    try {
      const r = await fetch(`https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(searchQuery)}&limit=1&countrycodes=in`, {
        headers: { "User-Agent": "ParcelMaadi/1.0" },
      });
      const data = await r.json();
      if (Array.isArray(data) && data.length > 0) {
        const lat = parseFloat(data[0].lat);
        const lng = parseFloat(data[0].lon);
        if (markerRef.current && mapInstance.current) {
          markerRef.current.setLatLng([lat, lng]);
          mapInstance.current.setView([lat, lng], 15);
        }
        await handleSelect(lat, lng);
      }
    } catch {}
    finally { setSearching(false); }
  };

  const useMyLocation = () => {
    if (!navigator.geolocation) return;
    setLocating(true);
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        const { latitude, longitude } = pos.coords;
        if (markerRef.current && mapInstance.current) {
          markerRef.current.setLatLng([latitude, longitude]);
          mapInstance.current.setView([latitude, longitude], 15);
        }
        handleSelect(latitude, longitude);
        setLocating(false);
      },
      (err) => {
        setLocating(false);
        if (err.code === err.PERMISSION_DENIED) {
          setSelected((s) => ({ ...s, address: s.address || "GPS permission denied. Search an address above or drag the pin manually." }));
        } else if (err.code === err.TIMEOUT) {
          setSelected((s) => ({ ...s, address: s.address || "GPS timed out. Try searching an address above." }));
        }
      },
      { enableHighAccuracy: true, timeout: 10000 }
    );
  };

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-[1000] bg-black/60 flex items-center justify-center p-2 md:p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-3xl max-h-[95vh] flex flex-col overflow-hidden">
        <div className="flex items-center justify-between p-3 border-b">
          <h3 className="font-bold flex items-center gap-2"><MapPin className="w-5 h-5 text-brand-red" /> {title}</h3>
          <Button variant="ghost" size="sm" onClick={onClose}>✕</Button>
        </div>
        <div className="p-3 border-b space-y-2 bg-muted/30">
          <div className="flex gap-2 items-center">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
              <Input
                placeholder="Search address (e.g. MG Road Bangalore)"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10 h-12 text-base"
                onKeyDown={(e) => e.key === "Enter" && doSearch()}
              />
            </div>
            <Button onClick={doSearch} disabled={searching} className="h-12 px-4 font-bold">
              {searching ? <Loader2 className="w-5 h-5 animate-spin" /> : <Search className="w-5 h-5" />}
              Search
            </Button>
            {/* BIG ROUND GPS button — easy to tap */}
            <button
              onClick={useMyLocation}
              disabled={locating}
              title="Use my current location"
              className="w-14 h-14 rounded-full bg-brand-yellow text-brand-black flex items-center justify-center hover:bg-brand-gold shadow-lg flex-shrink-0 border-2 border-brand-red disabled:opacity-50"
            >
              {locating ? <Loader2 className="w-6 h-6 animate-spin" /> : <Crosshair className="w-7 h-7" />}
            </button>
          </div>
          <p className="text-[11px] text-muted-foreground">Drag the pin, tap the map, or tap the 🟡 GPS button to use your current location.</p>
        </div>
        <div ref={mapRef} className="w-full h-[60vh] md:h-[55vh]" />
        <div className="p-3 border-t bg-muted/30 space-y-2">
          <div>
            <div className="text-[10px] uppercase text-muted-foreground">Address</div>
            <Input value={selected.address} onChange={(e) => setSelected({ ...selected, address: e.target.value })} placeholder="Address (editable)" className="h-11" />
          </div>
          <div className="flex gap-2 text-xs">
            <div className="flex-1">
              <div className="text-[10px] uppercase text-muted-foreground">Latitude</div>
              <Input value={selected.lat?.toFixed(6) ?? ""} readOnly className="h-8 font-mono" />
            </div>
            <div className="flex-1">
              <div className="text-[10px] uppercase text-muted-foreground">Longitude</div>
              <Input value={selected.lng?.toFixed(6) ?? ""} readOnly className="h-8 font-mono" />
            </div>
          </div>
          {selected.mapLink && (
            <a href={selected.mapLink} target="_blank" className="text-xs text-brand-red underline">Google Maps link ↗</a>
          )}
          <div className="flex gap-2 pt-1">
            <Button variant="outline" className="flex-1 h-12 text-base" onClick={onClose}>Cancel</Button>
            <Button
              className="flex-1 bg-brand-yellow text-brand-black hover:bg-brand-gold font-bold h-12 text-base"
              disabled={selected.lat == null}
              onClick={() => onConfirm(selected)}
            >
              <Check className="w-5 h-5 mr-1" /> Confirm Location
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
