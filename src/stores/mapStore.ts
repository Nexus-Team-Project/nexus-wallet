import { create } from 'zustand';
import type { MapViewport, OfferCategory } from '../types/map';

/**
 * Cross-page map state.
 *  - selectedPinId — which pin is currently in the popup
 *  - activeCategories — empty Set = show all; otherwise only pins in the set
 *  - viewport — last-known camera position so the user keeps their place
 *    when navigating away and back
 */
interface MapStore {
  selectedPinId: string | null;
  activeCategories: Set<OfferCategory>;
  viewport: MapViewport;
  setSelectedPin: (id: string | null) => void;
  toggleCategory: (cat: OfferCategory) => void;
  clearCategories: () => void;
  setViewport: (v: Partial<MapViewport>) => void;
}

// Tel Aviv default
const DEFAULT_VIEWPORT: MapViewport = { lng: 34.7818, lat: 32.0853, zoom: 11 };

export const useMapStore = create<MapStore>((set) => ({
  selectedPinId: null,
  activeCategories: new Set(),
  viewport: DEFAULT_VIEWPORT,

  setSelectedPin: (id) => set({ selectedPinId: id }),

  toggleCategory: (cat) =>
    set((state) => {
      const next = new Set(state.activeCategories);
      if (next.has(cat)) next.delete(cat);
      else next.add(cat);
      return { activeCategories: next };
    }),

  clearCategories: () => set({ activeCategories: new Set() }),

  setViewport: (v) =>
    set((state) => ({ viewport: { ...state.viewport, ...v } })),
}));
