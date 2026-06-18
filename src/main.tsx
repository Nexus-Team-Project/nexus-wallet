import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import './styles/accessibility.css'
// MapLibre CSS and RTL init live in src/lib/maplibre-init.ts, imported from
// lazy map components only — keeps maplibre out of the initial bundle.
import App from './App'

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
)
