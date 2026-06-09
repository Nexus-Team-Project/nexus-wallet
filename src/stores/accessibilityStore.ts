import { create } from 'zustand';

// The accessibility FAB is opt-in: hidden by default, shown only after the
// user adds it from the home-page prompt card. Both the card (HomePage) and
// the widget (AccessibilityWidget, mounted at the app root) read this store
// so enabling from the card immediately reveals the floating button.
const ENABLED_KEY = 'nexus-a11y-enabled';
const CARD_DISMISSED_KEY = 'nexus-a11y-card-dismissed';

function read(key: string): boolean {
  try {
    return localStorage.getItem(key) === 'true';
  } catch {
    return false;
  }
}

function write(key: string, value: boolean) {
  try {
    localStorage.setItem(key, value ? 'true' : 'false');
  } catch {
    // ignore storage errors (private mode, quota, etc.)
  }
}

interface AccessibilityState {
  /** Whether the floating accessibility widget is shown. */
  enabled: boolean;
  /** Whether the home-page prompt card has been dismissed/answered. */
  cardDismissed: boolean;
  /** Turn the widget on (from the prompt card) and stop showing the card. */
  enableWidget: () => void;
  /** Hide the widget again (from the FAB's hide/drag-to-trash gestures). */
  disableWidget: () => void;
  /** Dismiss the prompt card without enabling the widget. */
  dismissCard: () => void;
}

export const useAccessibilityStore = create<AccessibilityState>((set) => ({
  enabled: read(ENABLED_KEY),
  cardDismissed: read(CARD_DISMISSED_KEY),
  enableWidget: () => {
    write(ENABLED_KEY, true);
    write(CARD_DISMISSED_KEY, true);
    set({ enabled: true, cardDismissed: true });
  },
  disableWidget: () => {
    write(ENABLED_KEY, false);
    set({ enabled: false });
  },
  dismissCard: () => {
    write(CARD_DISMISSED_KEY, true);
    set({ cardDismissed: true });
  },
}));
