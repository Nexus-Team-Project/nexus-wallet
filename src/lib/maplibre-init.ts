// MapLibre CSS — imported here (not in main.tsx) so the stylesheet is
// bundled with the lazy map chunks, not with the initial app bundle.
import 'maplibre-gl/dist/maplibre-gl.css'
import maplibregl from 'maplibre-gl'

let initialized = false

/**
 * Call this once at module load time in any file that renders a Map.
 * Idempotent — safe to call from multiple components.
 *
 * Must run before the first Map instance is created; module-level calls
 * satisfy this because React component construction happens after module
 * evaluation.
 */
export function initMapLibre() {
  if (initialized) return
  initialized = true

  if (typeof maplibregl.setRTLTextPlugin === 'function') {
    // `false` = load eagerly; lazy loading races with first paint and leaves
    // Hebrew labels blank (confirmed in earlier builds).
    const result = maplibregl.setRTLTextPlugin(
      'https://api.mapbox.com/mapbox-gl-js/plugins/mapbox-gl-rtl-text/v0.2.3/mapbox-gl-rtl-text.js',
      false,
    )
    if (result && typeof (result as Promise<void>).catch === 'function') {
      ;(result as Promise<void>).catch((err) => {
        console.warn('RTL text plugin failed to load:', err)
      })
    }
  }
}
