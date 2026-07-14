import { create } from 'zustand';

// Drives a full-screen white "curtain" that survives a route change so a page
// can hand off a leaving animation to the incoming page. Phases:
//   idle   — not shown
//   cover  — solid white over everything (hand-off point between routes)
//   reveal — white recedes from the bottom up, uncovering the new route
export type CurtainPhase = 'idle' | 'cover' | 'reveal';

interface TransitionCurtainState {
  phase: CurtainPhase;
  /** Drop the white curtain over the whole screen (call right before navigating). */
  cover: () => void;
  setPhase: (phase: CurtainPhase) => void;
}

export const useTransitionCurtainStore = create<TransitionCurtainState>((set) => ({
  phase: 'idle',
  cover: () => set({ phase: 'cover' }),
  setPhase: (phase) => set({ phase }),
}));
