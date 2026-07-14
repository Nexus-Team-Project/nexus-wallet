import { create } from 'zustand';

interface TopBarBackState {
  /**
   * Optional interceptor for the TopBar back button. A page can register a
   * handler that runs before the default `navigate(-1)`. Return `true` to
   * consume the press (stay on the page — e.g. close an in-page overlay);
   * return `false` to let the normal back navigation proceed.
   */
  handler: (() => boolean) | null;
  setHandler: (handler: (() => boolean) | null) => void;
}

export const useTopBarBackStore = create<TopBarBackState>((set) => ({
  handler: null,
  setHandler: (handler) => set({ handler }),
}));
