import { create } from 'zustand';

export interface CartItem {
  businessId: string;
  productId: string;
  name: string;
  nameHe: string;
  image: string;
  price: number;
  currency: string;
  qty: number;
}

interface CartState {
  items: CartItem[];
  /** Whether the lifted cart overlay is open. */
  open: boolean;
  addItem: (item: Omit<CartItem, 'qty'>, qty?: number) => void;
  setQty: (businessId: string, productId: string, qty: number) => void;
  removeItem: (businessId: string, productId: string) => void;
  removeStore: (businessId: string) => void;
  clear: () => void;
  openCart: () => void;
  closeCart: () => void;
}

const KEY = 'nexus_cart';

function load(): CartItem[] {
  try {
    const raw = localStorage.getItem(KEY);
    const parsed = raw ? (JSON.parse(raw) as CartItem[]) : [];
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

function persist(items: CartItem[]) {
  try {
    localStorage.setItem(KEY, JSON.stringify(items));
  } catch {
    // ignore
  }
}

export const useCartStore = create<CartState>((set) => ({
  items: load(),
  open: false,
  addItem: (item, qty = 1) =>
    set((s) => {
      const idx = s.items.findIndex(
        (i) => i.businessId === item.businessId && i.productId === item.productId,
      );
      const items =
        idx >= 0
          ? s.items.map((i, k) => (k === idx ? { ...i, qty: i.qty + qty } : i))
          : [...s.items, { ...item, qty }];
      persist(items);
      return { items };
    }),
  setQty: (businessId, productId, qty) =>
    set((s) => {
      const items = s.items
        .map((i) =>
          i.businessId === businessId && i.productId === productId
            ? { ...i, qty: Math.max(0, qty) }
            : i,
        )
        .filter((i) => i.qty > 0);
      persist(items);
      return { items };
    }),
  removeItem: (businessId, productId) =>
    set((s) => {
      const items = s.items.filter(
        (i) => !(i.businessId === businessId && i.productId === productId),
      );
      persist(items);
      return { items };
    }),
  removeStore: (businessId) =>
    set((s) => {
      const items = s.items.filter((i) => i.businessId !== businessId);
      persist(items);
      return { items };
    }),
  clear: () =>
    set(() => {
      persist([]);
      return { items: [], open: false };
    }),
  openCart: () => set({ open: true }),
  closeCart: () => set({ open: false }),
}));

/** Total number of units across all items. */
export function cartCount(items: CartItem[]): number {
  return items.reduce((n, i) => n + i.qty, 0);
}

/** Group items by store (businessId), preserving insertion order. */
export function groupByStore(items: CartItem[]): { businessId: string; items: CartItem[] }[] {
  const order: string[] = [];
  const map = new Map<string, CartItem[]>();
  for (const it of items) {
    if (!map.has(it.businessId)) {
      map.set(it.businessId, []);
      order.push(it.businessId);
    }
    map.get(it.businessId)!.push(it);
  }
  return order.map((businessId) => ({ businessId, items: map.get(businessId)! }));
}
