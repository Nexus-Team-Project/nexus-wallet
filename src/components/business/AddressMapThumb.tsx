import { useEffect, useRef, type ReactNode } from 'react';
import { Map as MapLibreMap, Marker } from 'react-map-gl/maplibre';
import type { MapRef } from 'react-map-gl/maplibre';
import { initMapLibre } from '../../lib/maplibre-init';

initMapLibre();
import AnimatedLocationIcon from '../ui/AnimatedLocationIcon';

/**
 * AddressMapThumb — a real map zoomed in on a single delivery address, used
 * inside the checkout Delivery-address card. Mirrors the business-page
 * "locations" map: same tile source, smoothly flies to a new coordinate when
 * the user picks a different address card, and fires onLoad so the parent can
 * fade out a loading shimmer.
 *
 * Uses MapTiler's light style when a VITE_MAPTILER_KEY is set, otherwise the
 * free, no-key OpenFreeMap "positron" style.
 */

const FALLBACK_STYLE = 'https://tiles.openfreemap.org/styles/positron';

function styleUrl(): string {
  const key = import.meta.env.VITE_MAPTILER_KEY;
  return key
    ? `https://api.maptiler.com/maps/streets-v2-light/style.json?key=${key}`
    : FALLBACK_STYLE;
}

interface AddressMapThumbProps {
  lng: number;
  lat: number;
  zoom?: number;
  className?: string;
  /** Customer photo shown as the destination marker. Falls back to a plain
   *  pin when not provided. */
  avatarUrl?: string;
  /** Allow the user to pan/zoom (like the business-page locations map). */
  interactive?: boolean;
  /** Fires once the base map style + tiles have finished loading. */
  onLoad?: () => void;
  /** Extra map content (e.g. additional <Marker>s) rendered inside the map on
   *  top of the default destination pin. */
  children?: ReactNode;
}

export default function AddressMapThumb({
  lng,
  lat,
  zoom = 16,
  className = 'w-full h-full',
  avatarUrl,
  interactive = true,
  onLoad,
  children,
}: AddressMapThumbProps) {
  const mapRef = useRef<MapRef | null>(null);

  // Smoothly recenter on the active address (no remount → no tile reload flash).
  useEffect(() => {
    mapRef.current?.flyTo({ center: [lng, lat], zoom, duration: 700 });
  }, [lng, lat, zoom]);

  return (
    <div className={className}>
      <MapLibreMap
        ref={mapRef}
        initialViewState={{ longitude: lng, latitude: lat, zoom }}
        mapStyle={styleUrl()}
        interactive={interactive}
        attributionControl={false}
        onLoad={onLoad ? () => onLoad() : undefined}
        style={{ width: '100%', height: '100%' }}
      >
        <Marker longitude={lng} latitude={lat} anchor="bottom">
          {avatarUrl ? (
            // Customer avatar pin — a classic teardrop whose sharp tip rests on
            // the coordinate, with the photo seated in the round head and a
            // soft ground shadow for depth.
            <span className="relative flex flex-col items-center" style={{ paddingBottom: 4 }}>
              <span
                className="relative block w-11 h-11"
                style={{ filter: 'drop-shadow(0 3px 4px rgba(0,0,0,0.32))' }}
              >
                {/* Teardrop body — round head, pointed bottom. */}
                <span
                  className="absolute inset-0 bg-primary"
                  style={{ borderRadius: '50% 50% 50% 0', transform: 'rotate(-45deg)' }}
                />
                {/* Photo seated in the head (upright, not rotated). */}
                <span className="absolute inset-[3px] rounded-full overflow-hidden bg-white">
                  <img src={avatarUrl} alt="" className="w-full h-full object-cover" />
                </span>
              </span>
              {/* Ground shadow at the tip. */}
              <span className="absolute bottom-0 w-2.5 h-1 rounded-full bg-black/30 blur-[1px]" />
            </span>
          ) : (
            <AnimatedLocationIcon size={36} className="text-primary drop-shadow" />
          )}
        </Marker>
        {children}
      </MapLibreMap>
    </div>
  );
}
