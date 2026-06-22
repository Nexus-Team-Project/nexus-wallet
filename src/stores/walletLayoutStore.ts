import { create } from 'zustand';

/**
 * Section IDs the user can reorder on the wallet page.
 *  - widgets       → the horizontally-scrolling widgets collage
 *  - offers        → the "deals just for you" home-style offers slider
 *  - digitalCards  → the issued digital card preview + issue CTA
 *  - vouchers      → the "my vouchers" tab strip + grid
 */
export type WalletSectionId = 'widgets' | 'offers' | 'digitalCards' | 'vouchers';

export const DEFAULT_SECTION_ORDER: WalletSectionId[] = [
  'widgets',
  'offers',
  'digitalCards',
  'vouchers',
];

/** Individual widgets within the horizontally-scrollable widgets
 *  gallery. The user can free-drag these around in edit mode and tap
 *  the × on each to hide it. */
export type WalletWidgetId =
  | 'nearby-cashback'
  | 'my-organization'
  | 'best-offers'
  | 'more-actions';

export const DEFAULT_WIDGET_ORDER: WalletWidgetId[] = [
  'my-organization',
  'nearby-cashback',
  'best-offers',
  'more-actions',
];

interface WalletLayoutState {
  sectionOrder: WalletSectionId[];
  setOrder: (order: WalletSectionId[]) => void;
  resetOrder: () => void;
  /** True when the user has turned on "Customize wallet" mode; grip
   *  handles appear and Reorder.Group accepts drag. Default off. */
  editEnabled: boolean;
  setEditEnabled: (enabled: boolean) => void;
  /** Sections the user has hidden from the wallet. They still render
   *  (dimmed) when edit mode is on so the user can bring them back. */
  hiddenSections: WalletSectionId[];
  toggleHidden: (id: WalletSectionId) => void;
  /** Reorderable widgets inside the widgets gallery. */
  widgetOrder: WalletWidgetId[];
  setWidgetOrder: (order: WalletWidgetId[]) => void;
  /** Widgets the user has dismissed via the × button. Same dim-when-
   *  editing pattern as hiddenSections. */
  hiddenWidgets: WalletWidgetId[];
  toggleHiddenWidget: (id: WalletWidgetId) => void;
}

const STORAGE_KEY = 'nexus_wallet_layout';
const EDIT_KEY = 'nexus_wallet_edit_enabled';
const HIDDEN_KEY = 'nexus_wallet_hidden_sections';
const WIDGET_KEY = 'nexus_wallet_widget_order_v3';
const WIDGET_HIDDEN_KEY = 'nexus_wallet_hidden_widgets';

function loadPersisted(): WalletSectionId[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return DEFAULT_SECTION_ORDER;
    const parsed = JSON.parse(raw) as WalletSectionId[];
    // Validate: every default section must be present exactly once.
    const allValid =
      parsed.length === DEFAULT_SECTION_ORDER.length &&
      DEFAULT_SECTION_ORDER.every((id) => parsed.includes(id));
    return allValid ? parsed : DEFAULT_SECTION_ORDER;
  } catch {
    return DEFAULT_SECTION_ORDER;
  }
}

function persist(order: WalletSectionId[]) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(order));
  } catch {
    // silent
  }
}

function loadEditEnabled(): boolean {
  try {
    return localStorage.getItem(EDIT_KEY) === '1';
  } catch {
    return false;
  }
}

function persistEditEnabled(enabled: boolean) {
  try {
    if (enabled) localStorage.setItem(EDIT_KEY, '1');
    else localStorage.removeItem(EDIT_KEY);
  } catch {
    // silent
  }
}

function loadHiddenSections(): WalletSectionId[] {
  try {
    const raw = localStorage.getItem(HIDDEN_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw) as WalletSectionId[];
    return Array.isArray(parsed)
      ? parsed.filter((id) => DEFAULT_SECTION_ORDER.includes(id))
      : [];
  } catch {
    return [];
  }
}

function persistHiddenSections(hidden: WalletSectionId[]) {
  try {
    if (hidden.length === 0) localStorage.removeItem(HIDDEN_KEY);
    else localStorage.setItem(HIDDEN_KEY, JSON.stringify(hidden));
  } catch {
    // silent
  }
}

function loadWidgetOrder(): WalletWidgetId[] {
  try {
    const raw = localStorage.getItem(WIDGET_KEY);
    if (!raw) return DEFAULT_WIDGET_ORDER;
    const parsed = JSON.parse(raw) as WalletWidgetId[];
    const allValid =
      parsed.length === DEFAULT_WIDGET_ORDER.length &&
      DEFAULT_WIDGET_ORDER.every((id) => parsed.includes(id));
    return allValid ? parsed : DEFAULT_WIDGET_ORDER;
  } catch {
    return DEFAULT_WIDGET_ORDER;
  }
}

function persistWidgetOrder(order: WalletWidgetId[]) {
  try {
    localStorage.setItem(WIDGET_KEY, JSON.stringify(order));
  } catch {
    // silent
  }
}

function loadHiddenWidgets(): WalletWidgetId[] {
  try {
    const raw = localStorage.getItem(WIDGET_HIDDEN_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw) as WalletWidgetId[];
    return Array.isArray(parsed)
      ? parsed.filter((id) => DEFAULT_WIDGET_ORDER.includes(id))
      : [];
  } catch {
    return [];
  }
}

function persistHiddenWidgets(hidden: WalletWidgetId[]) {
  try {
    if (hidden.length === 0) localStorage.removeItem(WIDGET_HIDDEN_KEY);
    else localStorage.setItem(WIDGET_HIDDEN_KEY, JSON.stringify(hidden));
  } catch {
    // silent
  }
}

export const useWalletLayoutStore = create<WalletLayoutState>((set, get) => ({
  sectionOrder: loadPersisted(),
  setOrder: (order) => {
    persist(order);
    set({ sectionOrder: order });
  },
  resetOrder: () => {
    persist(DEFAULT_SECTION_ORDER);
    set({ sectionOrder: DEFAULT_SECTION_ORDER });
  },
  editEnabled: loadEditEnabled(),
  setEditEnabled: (enabled) => {
    persistEditEnabled(enabled);
    set({ editEnabled: enabled });
  },
  hiddenSections: loadHiddenSections(),
  toggleHidden: (id) => {
    const current = get().hiddenSections;
    const next = current.includes(id)
      ? current.filter((s) => s !== id)
      : [...current, id];
    persistHiddenSections(next);
    set({ hiddenSections: next });
  },
  widgetOrder: loadWidgetOrder(),
  setWidgetOrder: (order) => {
    persistWidgetOrder(order);
    set({ widgetOrder: order });
  },
  hiddenWidgets: loadHiddenWidgets(),
  toggleHiddenWidget: (id) => {
    const current = get().hiddenWidgets;
    const next = current.includes(id)
      ? current.filter((w) => w !== id)
      : [...current, id];
    persistHiddenWidgets(next);
    set({ hiddenWidgets: next });
  },
}));
