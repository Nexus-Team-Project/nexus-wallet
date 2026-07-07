/**
 * activeContextStore — the member's LAST explicitly-picked viewing context
 * (a tenant, or the Nexus ecosystem catalog), persisted to localStorage.
 *
 * Why this exists: tenant context lives in the URL (?tenant=X / ?ecosystem=1),
 * which is great for deep-linking but breaks across browser back/forward — a
 * back-nav restores a stale ?tenant from a previous history entry, losing the
 * tenant the user just switched to. This store records the last pick so the
 * router can reconcile: on POP (back/forward) the last pick wins; on explicit
 * navigation (PUSH/REPLACE) the URL wins and updates this store.
 */
import { create } from 'zustand';

/** A picked viewing context: a specific tenant, or the Nexus ecosystem catalog. */
export type ActiveContext = { kind: 'tenant'; tenantId: string } | { kind: 'ecosystem' };

const STORAGE_KEY = 'nexus_active_context';

/** Read the persisted context, tolerating absent/corrupt values. */
function load(): ActiveContext | null {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw);
    if (parsed?.kind === 'tenant' && typeof parsed.tenantId === 'string') {
      return { kind: 'tenant', tenantId: parsed.tenantId };
    }
    if (parsed?.kind === 'ecosystem') return { kind: 'ecosystem' };
    return null;
  } catch {
    return null;
  }
}

/** Persist (or clear) the context; failures are silent (private mode/quota). */
function persist(context: ActiveContext | null): void {
  try {
    if (context) localStorage.setItem(STORAGE_KEY, JSON.stringify(context));
    else localStorage.removeItem(STORAGE_KEY);
  } catch {
    /* ignore storage errors */
  }
}

/** True when two contexts refer to the same view. */
export function sameContext(a: ActiveContext | null, b: ActiveContext | null): boolean {
  if (!a || !b) return false;
  if (a.kind !== b.kind) return false;
  return a.kind !== 'tenant' || a.tenantId === (b as { kind: 'tenant'; tenantId: string }).tenantId;
}

interface ActiveContextState {
  context: ActiveContext | null;
  setContext: (context: ActiveContext) => void;
  clearContext: () => void;
}

export const useActiveContextStore = create<ActiveContextState>((set) => ({
  context: load(),
  setContext: (context) => {
    persist(context);
    set({ context });
  },
  clearContext: () => {
    persist(null);
    set({ context: null });
  },
}));
