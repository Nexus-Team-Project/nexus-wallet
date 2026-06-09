import { create } from 'zustand';

/**
 * Selected wallpaper backdrop. Stores the gradient string from the
 * picker; AppLayout reads it and uses it in place of the default
 * rainbow gradient on pages that opt into `showHomeGradient`.
 */
interface WallpaperState {
  /** CSS background string (radial-gradient / conic-gradient). */
  selectedBackground: string | null;
  setBackground: (background: string | null) => void;
}

const STORAGE_KEY = 'nexus_wallpaper';

function loadPersisted(): string | null {
  try {
    return localStorage.getItem(STORAGE_KEY);
  } catch {
    return null;
  }
}

function persist(value: string | null) {
  try {
    if (value === null) localStorage.removeItem(STORAGE_KEY);
    else localStorage.setItem(STORAGE_KEY, value);
  } catch {
    // silent
  }
}

export const useWallpaperStore = create<WallpaperState>((set) => ({
  selectedBackground: loadPersisted(),
  setBackground: (background) => {
    persist(background);
    set({ selectedBackground: background });
  },
}));
