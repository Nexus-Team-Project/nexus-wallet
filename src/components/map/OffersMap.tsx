import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Map as MapLibreMap, Marker, Popup, NavigationControl } from 'react-map-gl/maplibre';
import type { MapRef, ViewStateChangeEvent } from 'react-map-gl/maplibre';
import { initMapLibre } from '../../lib/maplibre-init';

// Runs once when this lazy chunk first loads — before any Map instance renders.
initMapLibre();
import OfferPinMarker from './OfferPinMarker';
import MapControls from './MapControls';
import ClusterLayer from './ClusterLayer';
import { useMapStore } from '../../stores/mapStore';
import type { OfferPin, OfferCategory } from '../../types/map';

const CLUSTER_THRESHOLD = 50;
// Free, no-API-key fallback — light minimal vector style that visually
// matches MapTiler's "streets-v2-light".
const FALLBACK_STYLE = 'https://tiles.openfreemap.org/styles/positron';

function defaultStyleUrl(): string {
  const key = import.meta.env.VITE_MAPTILER_KEY;
  if (key) {
    return `https://api.maptiler.com/maps/streets-v2-light/style.json?key=${key}`;
  }
  return FALLBACK_STYLE;
}

export interface OffersMapProps {
  pins: OfferPin[];
  /** Override the default style URL — defaults to MapTiler light, falls
   *  back to OpenFreeMap "positron" when no VITE_MAPTILER_KEY is set. */
  styleUrl?: string;
  /** Initial center [lng, lat]. Default: Tel Aviv. */
  initialCenter?: [number, number];
  initialZoom?: number;
  onPinClick?: (pin: OfferPin) => void;
  selectedPinId?: string | null;
  /** RTL Hebrew-first layout. Defaults to true. */
  rtl?: boolean;
  /** Optional className for the outer wrapper. */
  className?: string;
  /** Hide the built-in MapControls (chips + zoom). Use when the parent
   *  has its own filtering / control UI. */
  showControls?: boolean;
  /** Show a "you are here" blue dot at this position. */
  userLocation?: { lng: number; lat: number } | null;
  /** When this changes (by reference), the map animates to the new spot. */
  flyTo?: { lng: number; lat: number; zoom?: number } | null;
  /** Whether to render a default popup when a pin is selected. Off when the
   *  parent renders its own detail sheet. */
  showPopup?: boolean;
  /** Fires once the base map style + tiles have finished loading. Lets the
   *  parent fade out its own loading skeleton. */
  onLoad?: () => void;
}

export default function OffersMap({
  pins,
  styleUrl,
  initialCenter = [34.7818, 32.0853],
  initialZoom = 11,
  onPinClick,
  selectedPinId: selectedPinIdProp,
  rtl = true,
  className = 'w-full h-full',
  showControls = true,
  userLocation = null,
  flyTo = null,
  showPopup = true,
  onLoad,
}: OffersMapProps) {
  // The popup's selected pin is store-driven so child controls can manage
  // it, but the parent can also drive it via the `selectedPinId` prop.
  const storeSelectedId = useMapStore((s) => s.selectedPinId);
  const setSelectedPin = useMapStore((s) => s.setSelectedPin);
  const activeCategories = useMapStore((s) => s.activeCategories);
  const setViewport = useMapStore((s) => s.setViewport);

  const selectedPinId = selectedPinIdProp ?? storeSelectedId;

  // Filter pins by active category filter
  const filteredPins = useMemo<OfferPin[]>(() => {
    if (activeCategories.size === 0) return pins;
    return pins.filter((p) => activeCategories.has(p.category));
  }, [pins, activeCategories]);

  const availableCategories = useMemo<OfferCategory[]>(() => {
    const set = new Set<OfferCategory>();
    pins.forEach((p) => set.add(p.category));
    return Array.from(set);
  }, [pins]);

  const selectedPin = useMemo(
    () => filteredPins.find((p) => p.id === selectedPinId) ?? null,
    [filteredPins, selectedPinId],
  );

  // "Search this area" trigger — appears when the user pans far from the
  // current viewport center. For demo purposes the button just clears its
  // own visibility on click; downstream apps can call a real refetch.
  const [showSearchHere, setShowSearchHere] = useState(false);
  const mapRef = useRef<MapRef | null>(null);

  // Fly to a target whenever the `flyTo` prop changes by reference.
  useEffect(() => {
    if (!flyTo || !mapRef.current) return;
    mapRef.current.flyTo({
      center: [flyTo.lng, flyTo.lat],
      zoom: flyTo.zoom ?? mapRef.current.getZoom(),
      duration: 700,
    });
  }, [flyTo]);

  const handleMove = useCallback(
    (e: ViewStateChangeEvent) => {
      setViewport({
        lng: e.viewState.longitude,
        lat: e.viewState.latitude,
        zoom: e.viewState.zoom,
      });
    },
    [setViewport],
  );

  const handleMoveEnd = useCallback(
    (e: ViewStateChangeEvent) => {
      // Surface the "search this area" affordance if the user panned more
      // than ~5km from the initial center.
      const distLng = Math.abs(e.viewState.longitude - initialCenter[0]);
      const distLat = Math.abs(e.viewState.latitude - initialCenter[1]);
      if (distLng > 0.05 || distLat > 0.05) {
        setShowSearchHere(true);
      }
    },
    [initialCenter],
  );

  const handlePinClick = useCallback(
    (pin: OfferPin) => {
      setSelectedPin(pin.id);
      onPinClick?.(pin);
    },
    [onPinClick, setSelectedPin],
  );

  // Close popup when clicking the map background
  const handleMapClick = useCallback(() => {
    setSelectedPin(null);
  }, [setSelectedPin]);

  // RTL popup text alignment — apply once via inline style on the popup
  // children, since MapLibre's popup doesn't expose a dir prop.
  useEffect(() => {
    if (!rtl) return;
    document.documentElement.style.setProperty('--maplibre-popup-text-align', 'right');
    return () => {
      document.documentElement.style.removeProperty('--maplibre-popup-text-align');
    };
  }, [rtl]);

  const useClusters = filteredPins.length > CLUSTER_THRESHOLD;

  return (
    <div className={`relative overflow-hidden ${className}`} dir={rtl ? 'rtl' : 'ltr'}>
      {/* Soft brand-tinted overlay on top of the base map — gives the map a
          distinct look without rebuilding the tile style. Sits beneath the
          interactive controls. */}
      <div
        aria-hidden="true"
        className="absolute inset-0 pointer-events-none z-[1]"
        style={{
          background:
            'linear-gradient(180deg, rgba(245, 230, 240, 0.35) 0%, rgba(239, 224, 245, 0.22) 30%, rgba(255, 255, 255, 0.0) 60%)',
          mixBlendMode: 'multiply',
        }}
      />

      <MapLibreMap
        ref={mapRef}
        initialViewState={{
          longitude: initialCenter[0],
          latitude: initialCenter[1],
          zoom: initialZoom,
        }}
        mapStyle={styleUrl ?? defaultStyleUrl()}
        onMove={handleMove}
        onMoveEnd={handleMoveEnd}
        onClick={handleMapClick}
        onLoad={onLoad ? () => onLoad() : undefined}
        style={{ width: '100%', height: '100%' }}
        // We render our own NavigationControl-like buttons in MapControls,
        // but we still mount a hidden NavigationControl for accessibility
        // keyboard support (it provides the +/- shortcuts).
        attributionControl={false}
      >
        {/* Native navigation control mounted off-screen for keyboard a11y;
            visible controls come from MapControls below. */}
        <NavigationControl position="top-left" style={{ visibility: 'hidden' }} />

        {/* User location — pulsing blue dot */}
        {userLocation && (
          <Marker longitude={userLocation.lng} latitude={userLocation.lat} anchor="center">
            <div className="relative w-5 h-5" aria-label="Your location">
              <div className="absolute inset-0 rounded-full bg-blue-500/30 animate-ping" />
              <div className="absolute inset-0 rounded-full bg-blue-500 border-[3px] border-white shadow-md" />
            </div>
          </Marker>
        )}

        {useClusters ? (
          <ClusterLayer pins={filteredPins} />
        ) : (
          filteredPins.map((pin) => (
            <Marker
              key={pin.id}
              longitude={pin.lng}
              latitude={pin.lat}
              anchor="center"
            >
              <OfferPinMarker
                category={pin.category}
                selected={pin.id === selectedPinId}
                ariaLabel={pin.name}
                onClick={() => handlePinClick(pin)}
                brandLogo={pin.brandLogo}
                brandColor={pin.brandColor}
              />
            </Marker>
          ))
        )}

        {showPopup && selectedPin && (
          <Popup
            longitude={selectedPin.lng}
            latitude={selectedPin.lat}
            anchor="bottom"
            offset={36}
            closeButton={false}
            closeOnClick={false}
            onClose={() => setSelectedPin(null)}
            className="offers-map-popup"
          >
            <div
              dir={rtl ? 'rtl' : 'ltr'}
              className="px-2 py-1.5 min-w-[140px]"
              style={{ textAlign: rtl ? 'right' : 'left' }}
            >
              <p className="text-sm font-semibold text-text-primary leading-tight">
                {selectedPin.name}
              </p>
              <p className="text-[11px] text-text-muted mt-0.5">
                {selectedPin.category}
              </p>
            </div>
          </Popup>
        )}
      </MapLibreMap>

      {/* RTL-aware overlay controls — category chips + zoom buttons.
          Hidden when the parent has its own UI. */}
      {showControls && (
        <MapControls
          rtl={rtl}
          isHe={rtl}
          showSearchHere={showSearchHere}
          availableCategories={availableCategories}
          onSearchHere={() => setShowSearchHere(false)}
        />
      )}
    </div>
  );
}
