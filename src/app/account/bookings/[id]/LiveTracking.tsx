"use client";

// Customer live tracking — polls /api/bookings/[id]/track every 10 s.
// Shows OTPs (pickup, then delivery), rider details with live map link,
// and the event timeline. Completes the Module 4 workflow:
// book → assign → accept → OTP pickup → track → OTP delivery.

import { useEffect, useState } from "react";

type Track = {
  status: string;
  pickupOtp: string | null;
  deliveryOtp: string | null;
  rider: {
    name: string;
    phone: string | null;
    vehicleNumber: string;
    lat: number | null;
    lng: number | null;
    lastSeenAt: string | null;
  } | null;
  events: Array<{ type: string; note: string | null; actorRole: string; createdAt: string }>;
  pings: Array<{ lat: number; lng: number; createdAt: string }>;
};

function osmEmbed(lat: number, lng: number) {
  const d = 0.008;
  const bbox = `${lng - d},${lat - d},${lng + d},${lat + d}`;
  return `https://www.openstreetmap.org/export/embed.html?bbox=${encodeURIComponent(bbox)}&layer=mapnik&marker=${lat},${lng}`;
}

const eventLabels: Record<string, string> = {
  CREATED: "Booking placed",
  ASSIGNED: "Rider assigned",
  REASSIGNED: "Rider reassigned",
  ACCEPTED: "Rider accepted",
  REJECTED: "Rider declined — reassigning",
  PICKED_UP: "Parcel picked up",
  DELIVERED: "Delivered",
  CANCELLED: "Cancelled",
};

export default function LiveTracking({ bookingId }: { bookingId: string }) {
  const [track, setTrack] = useState<Track | null>(null);

  useEffect(() => {
    let stop = false;
    async function load() {
      try {
        const res = await fetch(`/api/bookings/${bookingId}/track`);
        const data = await res.json();
        if (!stop && data.ok) setTrack(data.track);
      } catch {
        /* keep last state */
      }
    }
    load();
    const t = setInterval(load, 10000);
    return () => {
      stop = true;
      clearInterval(t);
    };
  }, [bookingId]);

  if (!track) return null;

  const live = track.status === "ASSIGNED" || track.status === "CONFIRMED" || track.status === "IN_TRANSIT";

  return (
    <div className="mt-8 border-t border-pm-ink/10 pt-6">
      <h2 className="text-xs font-bold uppercase tracking-widest text-pm-ink/50">Live tracking</h2>

      {/* OTPs */}
      {live && (
        <div className="mt-3 grid grid-cols-1 gap-3 sm:grid-cols-2">
          {track.pickupOtp && (
            <div className="rounded-2xl bg-pm-yellow/50 p-4 text-center">
              <p className="text-xs font-bold uppercase tracking-wide text-pm-ink/60">Pickup OTP — give to rider at pickup</p>
              <p className="mt-1 font-mono text-3xl font-black tracking-[0.3em]">{track.pickupOtp}</p>
            </div>
          )}
          {track.deliveryOtp && (
            <div className="rounded-2xl bg-pm-red/10 p-4 text-center">
              <p className="text-xs font-bold uppercase tracking-wide text-pm-ink/60">
                Delivery OTP — receiver gives at delivery
              </p>
              <p className="mt-1 font-mono text-3xl font-black tracking-[0.3em]">{track.deliveryOtp}</p>
            </div>
          )}
        </div>
      )}

      {/* Rider */}
      {track.rider && track.status !== "PENDING" && (
        <div className="mt-3 rounded-2xl bg-pm-cream/70 p-4">
          <p className="text-sm">
            <span className="font-bold">🛵 {track.rider.name}</span>
            <span className="ml-2 text-pm-ink/60">{track.rider.vehicleNumber}</span>
            {track.rider.phone && (
              <a href={`tel:${track.rider.phone}`} className="ml-3 font-bold text-pm-red hover:underline">
                📞 Call rider
              </a>
            )}
          </p>
          {track.rider.lat !== null && track.rider.lng !== null ? (
            <>
              <p className="mt-1 text-xs">
                <a
                  href={`https://www.google.com/maps?q=${track.rider.lat},${track.rider.lng}`}
                  target="_blank"
                  rel="noreferrer"
                  className="font-bold text-pm-red hover:underline"
                >
                  📍 Open in Google Maps
                </a>
                {track.rider.lastSeenAt && (
                  <span className="ml-2 text-pm-ink/50">
                    updated {new Date(track.rider.lastSeenAt).toLocaleTimeString("en-IN")}
                  </span>
                )}
              </p>
              <iframe
                title="Rider live location"
                src={osmEmbed(track.rider.lat, track.rider.lng)}
                className="mt-2 h-56 w-full rounded-xl border border-pm-ink/10"
                loading="lazy"
              />
              {track.pings.length > 1 && (
                <details className="mt-2 text-xs">
                  <summary className="cursor-pointer font-semibold text-pm-ink/60">
                    Route history ({track.pings.length} GPS points)
                  </summary>
                  <div className="mt-1 max-h-32 space-y-0.5 overflow-y-auto">
                    {track.pings.map((pg, i) => (
                      <a
                        key={i}
                        href={`https://www.google.com/maps?q=${pg.lat},${pg.lng}`}
                        target="_blank"
                        rel="noreferrer"
                        className="block text-pm-ink/60 hover:text-pm-red"
                      >
                        {new Date(pg.createdAt).toLocaleTimeString("en-IN")} — {pg.lat.toFixed(5)}, {pg.lng.toFixed(5)}
                      </a>
                    ))}
                  </div>
                </details>
              )}
            </>
          ) : (
            <p className="mt-1 text-xs text-pm-ink/50">Rider's live location will appear once they start moving.</p>
          )}
        </div>
      )}

      {/* Timeline */}
      <ol className="mt-4 space-y-2">
        {track.events.map((e, i) => (
          <li key={i} className="flex items-start gap-2 text-sm">
            <span className="mt-1 h-2 w-2 shrink-0 rounded-full bg-pm-red" />
            <span>
              <span className="font-semibold">{eventLabels[e.type] ?? e.type}</span>
              <span className="ml-2 text-xs text-pm-ink/50">
                {new Date(e.createdAt).toLocaleString("en-IN", { day: "numeric", month: "short", hour: "2-digit", minute: "2-digit" })}
              </span>
              {e.note && <span className="block text-xs text-pm-ink/50">{e.note}</span>}
            </span>
          </li>
        ))}
      </ol>
      {live && <p className="mt-3 text-xs text-pm-ink/40">Refreshes automatically every 10 seconds.</p>}
    </div>
  );
}
