import { create } from 'zustand';
import type { AuthMethod } from '../types/auth.types';
import { firebaseSignOut } from '../services/auth.service';

interface AuthState {
  isAuthenticated: boolean;
  token: string | null;
  userId: string | null;
  authMethod: AuthMethod | null;
  isOrgMember: boolean;
  organizationName: string | null;
  marketingConsent: boolean;
  profileCompleted: boolean;
  /** True when the user is authenticated but optional preference slides are still missing.
   *  Triggers the ProfileNudgeBanner. Cleared automatically when profileCompleted → true. */
  preferencesIncomplete: boolean;
  avatarUrl: string | null;
  firstName: string | null;

  login: (params: {
    token: string;
    userId: string;
    method: AuthMethod;
    isOrgMember: boolean;
    organizationName?: string;
    avatarUrl?: string;
    firstName?: string;
  }) => void;
  setToken: (token: string) => void;
  setAvatarUrl: (url: string | null) => void;
  setMarketingConsent: (consent: boolean) => void;
  setProfileCompleted: (completed: boolean) => void;
  setPreferencesIncomplete: (incomplete: boolean) => void;
  logout: () => void;
}

// Persistence helpers
const STORAGE_KEY = 'nexus_auth';

function loadPersistedAuth(): Partial<AuthState> {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return {};
    const data = JSON.parse(raw);
    return {
      isAuthenticated: data.isAuthenticated ?? false,
      token: data.token ?? null,
      userId: data.userId ?? null,
      authMethod: data.authMethod ?? null,
      isOrgMember: data.isOrgMember ?? false,
      organizationName: data.organizationName ?? null,
      marketingConsent: data.marketingConsent ?? false,
      profileCompleted: data.profileCompleted ?? false,
      preferencesIncomplete: data.preferencesIncomplete ?? false,
      avatarUrl: data.avatarUrl ?? null,
      firstName: data.firstName ?? null,
    };
  } catch {
    return {};
  }
}

function persistAuth(state: Partial<AuthState>) {
  try {
    localStorage.setItem(
      STORAGE_KEY,
      JSON.stringify({
        isAuthenticated: state.isAuthenticated,
        token: state.token,
        userId: state.userId,
        authMethod: state.authMethod,
        isOrgMember: state.isOrgMember,
        organizationName: state.organizationName,
        marketingConsent: state.marketingConsent,
        profileCompleted: state.profileCompleted,
        preferencesIncomplete: state.preferencesIncomplete,
        avatarUrl: state.avatarUrl,
        firstName: state.firstName,
      })
    );
  } catch {
    // silently fail
  }
}

function clearPersistedAuth() {
  try {
    localStorage.removeItem(STORAGE_KEY);
  } catch {
    // silently fail
  }
}

const persisted = loadPersistedAuth();

export const useAuthStore = create<AuthState>((set) => ({
  isAuthenticated: persisted.isAuthenticated ?? false,
  token: persisted.token ?? null,
  userId: persisted.userId ?? null,
  authMethod: persisted.authMethod ?? null,
  isOrgMember: persisted.isOrgMember ?? false,
  organizationName: persisted.organizationName ?? null,
  marketingConsent: persisted.marketingConsent ?? false,
  profileCompleted: persisted.profileCompleted ?? false,
  preferencesIncomplete: persisted.preferencesIncomplete ?? false,
  avatarUrl: persisted.avatarUrl ?? null,
  firstName: persisted.firstName ?? null,

  login: ({ token, userId, method, isOrgMember, organizationName, avatarUrl, firstName }) => {
    set((state) => {
      const next = {
        isAuthenticated: true,
        token,
        userId,
        authMethod: method,
        isOrgMember,
        organizationName: organizationName ?? null,
        marketingConsent: false,
        profileCompleted: state.profileCompleted,
        avatarUrl: avatarUrl ?? state.avatarUrl ?? null,
        firstName: firstName ?? state.firstName ?? null,
      };
      persistAuth(next);
      return next;
    });
  },

  setToken: (token) => {
    set((state) => {
      const next = { ...state, token };
      persistAuth(next);
      return { token };
    });
  },

  setMarketingConsent: (consent) => {
    set((state) => {
      const next = { ...state, marketingConsent: consent };
      persistAuth(next);
      return { marketingConsent: consent };
    });
  },

  setAvatarUrl: (url) => {
    set((state) => {
      const next = { ...state, avatarUrl: url };
      persistAuth(next);
      return { avatarUrl: url };
    });
  },

  setProfileCompleted: (completed) => {
    set((state) => {
      const next = {
        ...state,
        profileCompleted: completed,
        // Completing the profile clears the preferences-nudge automatically
        preferencesIncomplete: completed ? false : state.preferencesIncomplete,
      };
      persistAuth(next);
      return { profileCompleted: next.profileCompleted, preferencesIncomplete: next.preferencesIncomplete };
    });
  },

  setPreferencesIncomplete: (incomplete) => {
    set((state) => {
      const next = { ...state, preferencesIncomplete: incomplete };
      persistAuth(next);
      return { preferencesIncomplete: incomplete };
    });
  },

  logout: () => {
    firebaseSignOut().catch(() => {});
    clearPersistedAuth();
    set({
      isAuthenticated: false,
      token: null,
      userId: null,
      authMethod: null,
      isOrgMember: false,
      organizationName: null,
      marketingConsent: false,
      profileCompleted: false,
      preferencesIncomplete: false,
      avatarUrl: null,
      firstName: null,
    });
  },
}));
