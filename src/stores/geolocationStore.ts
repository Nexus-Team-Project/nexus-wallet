import { create } from 'zustand';

export type GeolocationPermission =
  | 'prompt'
  | 'granted'
  | 'denied'
  | 'loading'
  | 'unavailable';

interface GeoCoordinates {
  lat: number;
  lng: number;
}

interface GeolocationState {
  permission: GeolocationPermission;
  coords: GeoCoordinates | null;
  error: string | null;
  lastUpdated: number | null;

  setCoords: (coords: GeoCoordinates) => void;
  setPermission: (permission: GeolocationPermission) => void;
  setError: (error: string | null) => void;
  reset: () => void;
}

const STORAGE_KEY = 'nexus_geolocation';

/** Dev fallback: Tel Aviv center */
export const TEL_AVIV_FALLBACK: GeoCoordinates = {
  lat: 32.0853,
  lng: 34.7818,
};

function loadPersisted(): { coords: GeoCoordinates | null; lastUpdated: number | null } {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return { coords: null, lastUpdated: null };
    const data = JSON.parse(raw);
    return {
      coords: data.coords ?? null,
      lastUpdated: data.lastUpdated ?? null,
    };
  } catch {
    return { coords: null, lastUpdated: null };
  }
}

// Only persist coords — never persist permission.
// Permission always starts as 'prompt' on every app load so the teaser
// is shown until the user explicitly clicks "Share Location" in the
// current session. The browser remembers the grant natively, so
// requestLocation() will auto-resolve without a popup on repeat visits.
function persist(coords: GeoCoordinates | null) {
  try {
    localStorage.setItem(
      STORAGE_KEY,
      JSON.stringify({ coords, lastUpdated: Date.now() }),
    );
  } catch {
    /* silently fail */
  }
}

const persisted = loadPersisted();

export const useGeolocationStore = create<GeolocationState>((set) => ({
  // Always start as 'prompt' — never restore from localStorage.
  // This ensures NearYou shows the teaser on every app load until
  // the user actively clicks the CTA in the current session.
  permission: 'prompt' as GeolocationPermission,
  coords: persisted.coords,
  error: null,
  lastUpdated: persisted.lastUpdated,

  setCoords: (coords) => {
    set({
      coords,
      permission: 'granted',
      error: null,
      lastUpdated: Date.now(),
    });
    persist(coords);
  },

  setPermission: (permission) => {
    // Only update in-memory state — permission is intentionally NOT persisted.
    set({ permission });
  },

  setError: (error) => set({ error }),

  reset: () => {
    localStorage.removeItem(STORAGE_KEY);
    set({
      permission: 'prompt',
      coords: null,
      error: null,
      lastUpdated: null,
    });
  },
}));
