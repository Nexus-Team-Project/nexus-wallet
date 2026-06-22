import { create } from 'zustand';

/**
 * User-chosen artwork for the Nexus balance card. Stored as a data URL (or any
 * image src); `null` falls back to the default `/cards/nexus-balance-card.png`.
 * Set from the balance-detail page's settings ("Set card image") and applied by
 * BalanceCard everywhere the card renders (wallet deck + detail). Persisted to
 * localStorage so the choice survives reloads.
 */
interface CardImageState {
  cardImage: string | null;
  setCardImage: (img: string | null) => void;
}

const STORAGE_KEY = 'nexus_card_image';

function loadPersisted(): string | null {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw && typeof raw === 'string' ? raw : null;
  } catch {
    return null;
  }
}

function persist(img: string | null) {
  try {
    if (!img) localStorage.removeItem(STORAGE_KEY);
    else localStorage.setItem(STORAGE_KEY, img);
  } catch {
    // A large data URL can exceed the storage quota — fail silently; the image
    // still applies for the current session via the in-memory state.
  }
}

export const useCardImageStore = create<CardImageState>((set) => ({
  cardImage: loadPersisted(),
  setCardImage: (img) => {
    persist(img);
    set({ cardImage: img });
  },
}));
