import { motion } from "framer-motion"
import { useEffect, useMemo, useRef, useState } from "react"
import { Map, Marker, Source, Layer } from 'react-map-gl/maplibre'
import type { LayerProps } from 'react-map-gl/maplibre'
import { initMapLibre } from '../lib/maplibre-init'

// Ensure RTL plugin + CSS are loaded before any Map instance mounts.
initMapLibre()

// ── Real Tel Aviv coordinates [lat, lng] ──
const USER_LATLNG: [number, number] = [32.0636, 34.7721]
const DEST_LATLNG: [number, number] = [32.0753, 34.7748]

// Route: Rothschild → Allenby → King George → Dizengoff
const ROUTE_COORDS: [number, number][] = [
  [32.0636, 34.7721], [32.0640, 34.7718], [32.0644, 34.7714],
  [32.0648, 34.7710], [32.0652, 34.7706], [32.0656, 34.7702],
  [32.0659, 34.7700], [32.0663, 34.7697], [32.0667, 34.7695],
  [32.0671, 34.7693], [32.0675, 34.7690], [32.0679, 34.7688],
  [32.0682, 34.7688], [32.0686, 34.7693], [32.0690, 34.7698],
  [32.0693, 34.7705], [32.0698, 34.7710], [32.0703, 34.7714],
  [32.0708, 34.7718], [32.0713, 34.7722], [32.0718, 34.7726],
  [32.0722, 34.7730], [32.0726, 34.7733], [32.0730, 34.7736],
  [32.0735, 34.7740], [32.0739, 34.7742], [32.0743, 34.7744],
  [32.0748, 34.7746], [32.0753, 34.7748],
]

const FILL_STEPS = ROUTE_COORDS.length

const routeOffers = [
  { brand: "Golf & Co",      logo: "/brands/golf.png",           discount: "20%", routeIndex: 5 },
  { brand: "American Eagle", logo: "/brands/american-eagle.png", discount: "15%", routeIndex: 10 },
  { brand: "Carrefour",      logo: "/brands/carrefour.png",      discount: "10%", routeIndex: 16 },
  { brand: "Mango",          logo: "/brands/mango.png",          discount: "25%", routeIndex: 22 },
  { brand: "Samsung",        logo: "/brands/samsung.png",        discount: "30%", routeIndex: 27 },
]

if (typeof window !== "undefined") {
  routeOffers.forEach(({ logo }) => { const i = new Image(); i.src = logo })
}

// GeoJSON coords are [lng, lat]; ROUTE_COORDS are [lat, lng].
function toLngLat([lat, lng]: [number, number]): [number, number] {
  return [lng, lat]
}

const BG_ROUTE_DATA = {
  type: 'FeatureCollection' as const,
  features: [{
    type: 'Feature' as const,
    geometry: { type: 'LineString' as const, coordinates: ROUTE_COORDS.map(toLngLat) },
    properties: {},
  }],
}

const BG_LINE_LAYER: LayerProps = {
  id: 'route-bg',
  type: 'line',
  paint: { 'line-color': '#635bff', 'line-width': 3, 'line-opacity': 0.2, 'line-dasharray': [2, 2] },
  layout: { 'line-cap': 'round', 'line-join': 'round' },
}

const FILL_LINE_LAYER: LayerProps = {
  id: 'route-fill',
  type: 'line',
  paint: { 'line-color': '#635bff', 'line-width': 4, 'line-opacity': 0.9, 'line-dasharray': [2, 2] },
  layout: { 'line-cap': 'round', 'line-join': 'round' },
}

export default function NearbyMapPage() {
  const [phase, setPhase] = useState(0)
  const [fillIndex, setFillIndex] = useState(0)
  const [visibleBubbles, setVisibleBubbles] = useState(0)
  const [loopKey, setLoopKey] = useState(0)
  const timersRef = useRef<ReturnType<typeof setTimeout>[]>([])

  useEffect(() => {
    const t = timersRef.current
    t.forEach(clearTimeout)
    t.length = 0

    setPhase(0); setFillIndex(0); setVisibleBubbles(0)

    t.push(setTimeout(() => setPhase(1), 400))
    t.push(setTimeout(() => setPhase(2), 1400))
    t.push(setTimeout(() => setPhase(3), 2200))

    const fillStartTime = 2400
    const stepDelay = 2800 / FILL_STEPS
    for (let i = 1; i <= FILL_STEPS; i++) {
      t.push(setTimeout(() => setFillIndex(i), fillStartTime + i * stepDelay))
    }
    routeOffers.forEach((offer, i) => {
      t.push(setTimeout(() => setVisibleBubbles(i + 1), fillStartTime + offer.routeIndex * stepDelay + 100))
    })
    t.push(setTimeout(() => setPhase(5), 7000))
    t.push(setTimeout(() => {
      setPhase(0); setFillIndex(0); setVisibleBubbles(0)
      setTimeout(() => setLoopKey((k) => k + 1), 600)
    }, 9000))

    return () => { t.forEach(clearTimeout); t.length = 0 }
  }, [loopKey])

  const centerLng = (USER_LATLNG[1] + DEST_LATLNG[1]) / 2
  const centerLat = (USER_LATLNG[0] + DEST_LATLNG[0]) / 2

  const filledRouteData = useMemo(() => {
    const coords = ROUTE_COORDS.slice(0, fillIndex)
    if (coords.length < 2) return { type: 'FeatureCollection' as const, features: [] }
    return {
      type: 'FeatureCollection' as const,
      features: [{
        type: 'Feature' as const,
        geometry: { type: 'LineString' as const, coordinates: coords.map(toLngLat) },
        properties: {},
      }],
    }
  }, [fillIndex])

  return (
    <div
      className="w-full h-full flex flex-col items-center justify-center px-6 relative overflow-hidden"
      style={{ backgroundColor: "var(--color-surface)" }}
      dir="rtl"
    >
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6 }}
        className="text-right mb-5 w-full max-w-sm z-10 relative"
      >
        <h2 className="text-2xl font-semibold leading-relaxed" style={{ color: "var(--color-primary)" }}>
          נציג לך איפה ההטבות הכי שוות מסביבך
        </h2>
        <p className="text-base font-normal mt-1" style={{ color: "var(--color-text-muted)" }}>
          בכל רגע נתון, בכל מקום
        </p>
      </motion.div>

      <motion.div
        initial={{ opacity: 0, y: 40, scale: 0.92 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        transition={{ duration: 0.8, delay: 0.2, ease: "easeOut" }}
        className="relative z-10"
      >
        {/* Pill glow */}
        <div
          className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 rounded-[90px] z-0"
          style={{ width: 280, height: 400, background: "rgba(99,91,255,0.15)", filter: "blur(40px)" }}
        />

        {/* Phone frame */}
        <motion.div
          animate={{ y: [0, -8, 0] }}
          transition={{ repeat: Infinity, duration: 5, ease: "easeInOut" }}
          className="relative z-10"
          style={{
            width: 260,
            aspectRatio: "9 / 18.8",
            borderRadius: 36,
            background: "linear-gradient(180deg,rgba(255,255,255,0.10),rgba(255,255,255,0.04)),#0b0f1a",
            padding: 8,
            border: "1px solid rgba(255,255,255,0.12)",
            boxShadow: "0 30px 80px rgba(7,10,20,0.35)",
          }}
        >
          <div className="absolute pointer-events-none" style={{ inset: 7, borderRadius: 29, border: "1px solid rgba(255,255,255,0.08)" }} />

          {/* Screen */}
          <div
            className="w-full h-full relative overflow-hidden"
            style={{ borderRadius: 28, WebkitMaskImage: "radial-gradient(white,white)", maskImage: "radial-gradient(white,white)" }}
          >
            {/* Notch */}
            <div
              className="absolute top-2 left-1/2 -translate-x-1/2 z-30"
              style={{ width: 100, height: 22, background: "rgba(0,0,0,0.55)", border: "1px solid rgba(255,255,255,0.06)", borderRadius: "0 0 14px 14px", backdropFilter: "blur(6px)" }}
            />

            {/* Map */}
            <div className="absolute inset-0 z-0">
              <Map
                key={loopKey}
                initialViewState={{ longitude: centerLng, latitude: centerLat, zoom: 15 }}
                style={{ width: '100%', height: '100%' }}
                mapStyle="https://basemaps.cartocdn.com/gl/voyager-gl-style/style.json"
                dragPan={false}
                dragRotate={false}
                scrollZoom={false}
                doubleClickZoom={false}
                touchZoomRotate={false}
                keyboard={false}
                attributionControl={false}
              >
                {/* Background dashed route */}
                {phase >= 3 && (
                  <Source id="route-bg" type="geojson" data={BG_ROUTE_DATA}>
                    <Layer {...BG_LINE_LAYER} />
                  </Source>
                )}

                {/* Animated fill route */}
                {fillIndex >= 2 && (
                  <Source id="route-fill" type="geojson" data={filledRouteData}>
                    <Layer {...FILL_LINE_LAYER} />
                  </Source>
                )}

                {/* User dot */}
                {phase >= 1 && (
                  <Marker longitude={USER_LATLNG[1]} latitude={USER_LATLNG[0]} anchor="center">
                    <div style={{ position: 'relative', width: 20, height: 20 }}>
                      <div style={{ position: 'absolute', inset: -8, borderRadius: '50%', border: '2px solid rgba(99,91,255,0.4)', animation: 'nearbyPulse 2s ease-out infinite' }} />
                      <div style={{ position: 'absolute', inset: -8, borderRadius: '50%', border: '2px solid rgba(99,91,255,0.3)', animation: 'nearbyPulse 2s ease-out infinite 1s' }} />
                      <div style={{ width: 20, height: 20, background: '#635bff', border: '3px solid white', borderRadius: '50%', boxShadow: '0 2px 10px rgba(99,91,255,0.5)', position: 'relative', zIndex: 2 }} />
                    </div>
                  </Marker>
                )}

                {/* Destination pin */}
                {phase >= 2 && (
                  <Marker longitude={DEST_LATLNG[1]} latitude={DEST_LATLNG[0]} anchor="bottom">
                    <svg width="28" height="40" viewBox="0 0 24 34" style={{ filter: 'drop-shadow(0 2px 4px rgba(0,0,0,0.3))' }}>
                      <path d="M12 0C5.4 0 0 5.4 0 12c0 9 12 22 12 22s12-13 12-22C24 5.4 18.6 0 12 0z" fill="#ef4444"/>
                      <circle cx="12" cy="12" r="5" fill="white"/>
                    </svg>
                  </Marker>
                )}

                {/* Brand offer bubbles */}
                {routeOffers.slice(0, visibleBubbles).map((offer) => {
                  const [lat, lng] = ROUTE_COORDS[offer.routeIndex]
                  return (
                    <Marker key={`${offer.brand}-${loopKey}`} longitude={lng} latitude={lat} anchor="center">
                      <div style={{ position: 'relative', width: 44, height: 44 }}>
                        <div style={{ width: 44, height: 44, borderRadius: '50%', background: 'white', boxShadow: '0 4px 16px rgba(0,0,0,0.25)', border: '2.5px solid white', display: 'flex', alignItems: 'center', justifyContent: 'center', overflow: 'hidden' }}>
                          <img src={offer.logo} alt={offer.brand} style={{ width: 26, height: 26, objectFit: 'contain' }} />
                        </div>
                        <div style={{ position: 'absolute', top: -8, right: -14, background: '#635bff', color: 'white', fontSize: 10, fontWeight: 800, padding: '2px 7px', borderRadius: 10, whiteSpace: 'nowrap', boxShadow: '0 2px 8px rgba(99,91,255,0.5)', lineHeight: 1.4 }}>
                          {offer.discount}
                        </div>
                      </div>
                    </Marker>
                  )
                })}
              </Map>
            </div>

            {/* Bottom caption */}
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.5 }}
              className="absolute bottom-0 left-0 right-0 z-20 text-center py-2.5 px-3"
              style={{ background: "rgba(255,255,255,0.92)", backdropFilter: "blur(8px)", fontSize: 12, fontWeight: 600, color: "#1a1a2e" }}
            >
              נציג לך איפה ההטבות הכי שוות מסביבך בכל רגע נתון
            </motion.div>
          </div>
        </motion.div>
      </motion.div>

      <style>{`
        @keyframes nearbyPulse {
          0%   { transform: scale(1);  opacity: 0.7; }
          100% { transform: scale(3);  opacity: 0; }
        }
      `}</style>
    </div>
  )
}
