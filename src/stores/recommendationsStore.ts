import { create } from 'zustand';
import type { Voucher } from '../types/voucher.types';

// Holds the most recent set of recommendations the user saw in the chat sheet,
// so the home page can surface them in its top "Nexus picks for you" slider.
// Not persisted — these are session-level "what Gali just suggested".
interface RecommendationsState {
  picks: Voucher[];
  intro: string | null;
  setPicks: (picks: Voucher[], intro?: string) => void;
  clear: () => void;
}

export const useRecommendationsStore = create<RecommendationsState>((set) => ({
  picks: [],
  intro: null,
  setPicks: (picks, intro) => set({ picks, intro: intro ?? null }),
  clear: () => set({ picks: [], intro: null }),
}));
