import { create } from 'zustand';

/**
 * Cards the user has moved to the archive from a card-detail page.
 * Ids match the wallet deck's card-id scheme:
 *   - 'card'              → the issued digital card
 *   - 'balance'           → the Nexus balance card
 *   - 'voucher:<id>'      → a specific voucher
 * Archived cards are filtered out of the wallet deck. Persisted to
 * localStorage so the archive survives reloads. There is no in-app
 * "archived cards" screen — `unarchive` exists for completeness only.
 */
interface ArchiveState {
  archivedIds: string[];
  archive: (id: string) => void;
  unarchive: (id: string) => void;
  isArchived: (id: string) => boolean;
}

const STORAGE_KEY = 'nexus_archived_cards';

function loadPersisted(): string[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed)
      ? parsed.filter((id): id is string => typeof id === 'string')
      : [];
  } catch {
    return [];
  }
}

function persist(ids: string[]) {
  try {
    if (ids.length === 0) localStorage.removeItem(STORAGE_KEY);
    else localStorage.setItem(STORAGE_KEY, JSON.stringify(ids));
  } catch {
    // silent
  }
}

export const useArchiveStore = create<ArchiveState>((set, get) => ({
  archivedIds: loadPersisted(),
  archive: (id) => {
    const current = get().archivedIds;
    if (current.includes(id)) return;
    const next = [...current, id];
    persist(next);
    set({ archivedIds: next });
  },
  unarchive: (id) => {
    const next = get().archivedIds.filter((x) => x !== id);
    persist(next);
    set({ archivedIds: next });
  },
  isArchived: (id) => get().archivedIds.includes(id),
}));
