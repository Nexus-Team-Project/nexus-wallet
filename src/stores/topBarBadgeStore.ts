import { create } from 'zustand';

interface TopBarBadge {
  src?: string;
  alt: string;
  filter?: string;
}

interface TopBarBadgeState {
  badge: TopBarBadge | null;
  setBadge: (badge: TopBarBadge | null) => void;
}

export const useTopBarBadgeStore = create<TopBarBadgeState>((set) => ({
  badge: null,
  setBadge: (badge) => set({ badge }),
}));
