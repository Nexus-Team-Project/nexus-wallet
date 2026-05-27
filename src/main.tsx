import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import './styles/accessibility.css'
// MapLibre core stylesheet — required for popups, controls, and canvas sizing.
import 'maplibre-gl/dist/maplibre-gl.css'
import maplibregl from 'maplibre-gl'

// RTL text plugin — without this, Hebrew (and Arabic) labels on map tiles
// render letter-by-letter LTR, which looks mirrored. The plugin must be
// loaded before any map instance is created. Mapbox-hosted CDN is the
// proven option (proper CORS headers for the MapLibre worker context).
if (typeof maplibregl.setRTLTextPlugin === 'function') {
  // 2nd arg `false` = load eagerly. Lazy load was leaving labels blank
  // because the plugin's first fetch raced with the first paint.
  const result = maplibregl.setRTLTextPlugin(
    'https://api.mapbox.com/mapbox-gl-js/plugins/mapbox-gl-rtl-text/v0.2.3/mapbox-gl-rtl-text.js',
    false,
  )
  // setRTLTextPlugin returns a Promise in maplibre-gl v5+. Catch errors
  // so a plugin load failure doesn't break the rest of the app.
  if (result && typeof (result as Promise<void>).catch === 'function') {
    (result as Promise<void>).catch((err) => {
      // eslint-disable-next-line no-console
      console.warn('RTL text plugin failed to load:', err)
    })
  }
}
import App from './App'

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
)
