/**
 * contactsStore — persisted Zustand store for imported contacts.
 * Separate from registrationStore because contacts persist after onboarding completes.
 */
import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { NexusContact } from '../services/contacts.service';

interface ContactsState {
  /** Imported contacts (from Google or device) */
  contacts: NexusContact[];
  /** User IDs of friends already on Nexus (matched server-side, mock for now) */
  friendsOnNexus: string[];
  /** Whether contacts have been imported at least once */
  contactsImported: boolean;
  /** Source of the last import */
  importSource: 'google' | 'device' | null;

  // Actions
  setContacts: (contacts: NexusContact[], source: 'google' | 'device') => void;
  setFriendsOnNexus: (ids: string[]) => void;
  clearContacts: () => void;
}

export const useContactsStore = create<ContactsState>()(
  persist(
    (set) => ({
      contacts: [],
      friendsOnNexus: [],
      contactsImported: false,
      importSource: null,

      setContacts: (contacts, source) =>
        set({
          contacts,
          contactsImported: true,
          importSource: source,
        }),

      setFriendsOnNexus: (ids) => set({ friendsOnNexus: ids }),

      clearContacts: () =>
        set({
          contacts: [],
          friendsOnNexus: [],
          contactsImported: false,
          importSource: null,
        }),
    }),
    {
      name: 'nexus-contacts',
    },
  ),
);
