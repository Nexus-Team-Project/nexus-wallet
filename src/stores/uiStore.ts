import { create } from 'zustand';

interface UIState {
  isSidebarOpen: boolean;
  activeModal: string | null;
  // True while the product page is lifted for Quick Buy — the global TopBar
  // overlay (user icon / support / bell) hides so the lifted card can own the
  // top of the screen.
  isProductLifted: boolean;
  toggleSidebar: () => void;
  openModal: (modalId: string) => void;
  closeModal: () => void;
  setProductLifted: (lifted: boolean) => void;
}

export const useUIStore = create<UIState>((set) => ({
  isSidebarOpen: false,
  activeModal: null,
  isProductLifted: false,
  toggleSidebar: () => set((state) => ({ isSidebarOpen: !state.isSidebarOpen })),
  openModal: (modalId) => set({ activeModal: modalId }),
  closeModal: () => set({ activeModal: null }),
  setProductLifted: (lifted) => set({ isProductLifted: lifted }),
}));
