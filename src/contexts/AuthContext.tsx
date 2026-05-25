/**
 * Wallet AuthContext. On mount it tries POST /api/auth/refresh against
 * the nexus_refresh cookie; if that succeeds it hydrates the in-memory
 * access token and fetches /api/me. Pages read auth state via useAuth.
 *
 * onLoginSucceeded is what every successful login path calls (phone
 * verify mode=logged_in, email-otp verify, google/wallet) to seed the
 * access token + refresh /api/me - the wallet RouterScreen reads
 * straight from me.router.
 *
 * Spec: docs/superpowers/specs/2026-05-25-nexus-wallet-auth-design.md sections 3 and 7
 */
import { createContext, useContext, useEffect, useState } from 'react';
import type { ReactNode } from 'react';
import { api, setAccessToken, getAccessToken } from '../lib/api';
import { useAuthStore } from '../stores/authStore';
import { exchangeGoogleCode } from '../services/auth.service';

/**
 * Subset of /api/me the wallet reads. Mirrors the backend MeResponse
 * fields added by Plan #1; extras like `authorization` are ignored
 * here on purpose - this context is only the auth surface.
 */
export interface WalletMeResponse {
  user: { id: string; email: string; name: string };
  context: {
    isTenant: boolean;
    tenantId: string | null;
    tenantName: string | null;
    role: string | null;
  };
  memberships?: Array<{
    tenantId: string;
    tenantName: string;
    role: string;
    isPrivilegedRole: boolean;
  }>;
  isPlatformAdmin?: boolean;
  canOpenDashboard?: boolean;
  router?: {
    showMemberTenants: Array<{ tenantId: string; tenantName: string }>;
    showAdminEntry: boolean;
    showEveryonesCatalog: boolean;
    showJoinRequest: boolean;
  };
  /**
   * Wallet profile sub-doc (Plan #3). completedAt is the gate the
   * LoginSheet checks - if set, returning user skips the slide chain.
   */
  profile?: {
    firstName?: string;
    lastName?: string;
    birthday?: string;
    gender?: string;
    lifeStage?: string;
    motivation?: string;
    purpose?: string[];
    benefitCategories?: string[];
    inviteFriendsSent?: number;
    completedAt?: string;
    updatedAt?: string;
  } | null;
}

interface AuthState {
  me: WalletMeResponse | null;
  loading: boolean;
  loggedIn: boolean;
  reload: () => Promise<WalletMeResponse | null>;
  logout: () => Promise<void>;
  /**
   * Called by every successful login path (phone verify, email-otp
   * verify, google). Seeds the access token, fetches /api/me, and
   * returns the loaded MeResponse so the caller can decide where to
   * navigate (e.g. RouterScreen for known identities).
   */
  onLoginSucceeded: (accessToken: string) => Promise<WalletMeResponse | null>;
  /**
   * Post-login navigation signal. Set to a lang-relative path (e.g.
   * '/router') when bootstrap completes a fresh Google redirect login
   * and the user should land on a specific screen. Consumers inside
   * the router watch this and call clearPostLoginRedirect once handled.
   */
  postLoginRedirect: string | null;
  clearPostLoginRedirect: () => void;
}

const Ctx = createContext<AuthState | null>(null);

/**
 * Read ?code=XXX from the URL exactly once at module evaluation.
 * Runs BEFORE React Router has a chance to fire any <Navigate /> that
 * would strip the query string. Without this, the index route's
 * `<Navigate to="/he" />` swallows the OAuth callback code and the
 * wallet never sees it.
 */
const initialGoogleCode: string | null = (() => {
  if (typeof window === 'undefined') return null;
  try {
    return new URLSearchParams(window.location.search).get('code');
  } catch {
    return null;
  }
})();

export function AuthProvider({ children }: { children: ReactNode }) {
  const [me, setMe] = useState<WalletMeResponse | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [postLoginRedirect, setPostLoginRedirect] = useState<string | null>(null);

  async function reload(): Promise<WalletMeResponse | null> {
    try {
      const data = await api<WalletMeResponse>('/api/me');
      setMe(data);
      bridgeToAuthStore(data);
      return data;
    } catch {
      setMe(null);
      return null;
    }
  }

  /**
   * Bridges /api/me into the legacy Zustand authStore so existing
   * wallet UI (TopBar greeting, login prompts, member-only routes)
   * knows the user is signed in. Without this, a session bootstrapped
   * via the refresh cookie alone (e.g. user logged in at nexus-website)
   * leaves the wallet feeling logged out even though every API call
   * succeeds.
   */
  function bridgeToAuthStore(data: WalletMeResponse): void {
    const token = getAccessToken() ?? '';
    const memberships = data.memberships ?? [];
    const firstMember = memberships.find((m) => !m.isPrivilegedRole) ?? memberships[0];
    const firstName =
      data.profile?.firstName ??
      data.user.name?.split(' ')[0] ??
      data.user.email.split('@')[0];
    useAuthStore.getState().login({
      token,
      userId: data.user.id,
      method: 'google',
      isOrgMember: memberships.length > 0,
      firstName,
      organizationName: firstMember?.tenantName,
    });
    if (data.profile?.completedAt) {
      useAuthStore.getState().setProfileCompleted(true);
    }
  }

  async function bootstrap(): Promise<void> {
    setLoading(true);
    try {
      // Google OAuth redirect callback: if the browser came back from
      // Google with ?code=XXX (captured BEFORE the router stripped it
      // - see initialGoogleCode at module top), exchange it with the
      // backend BEFORE trying refresh. The exchange is module-level
      // deduped so dev StrictMode double-fire doesn't POST twice.
      if (initialGoogleCode) {
        const r = await exchangeGoogleCode(initialGoogleCode);
        if (r) {
          // Hard-navigate to the chooser. Using window.location.replace
          // instead of the React Router state signal because the
          // signal+effect pattern raced with IndexRoute's Navigate-to-
          // store and ended up on /:lang/store about half the time.
          // A hard nav is deterministic: page reloads, bootstrap re-runs
          // without a ?code, refresh cookie hydrates the session, and
          // /api/me lands the user on /:lang/router cleanly. The brief
          // double-flash is acceptable for a once-per-login event.
          const lang = window.location.pathname.split('/')[1] || 'he';
          window.location.replace(`/${lang}/router`);
          return; // page is unloading; do not continue bootstrap
        }
      }

      // Try refresh - if the cookie is valid, hydrates the in-memory
      // access token. Skipped silently if no cookie or expired.
      if (!getAccessToken()) {
        try {
          const r = await api<{ accessToken: string }>('/api/auth/refresh', {
            method: 'POST',
            skipAuth: true,
          });
          setAccessToken(r.accessToken);
        } catch {
          // Stay logged out.
        }
      }
      if (getAccessToken()) {
        await reload();
      }
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    void bootstrap();
    // Empty deps: this runs once on mount.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function onLoginSucceeded(accessToken: string): Promise<WalletMeResponse | null> {
    setAccessToken(accessToken);
    return reload();
  }

  async function logout(): Promise<void> {
    try {
      await api('/api/auth/logout', { method: 'POST' });
    } catch {
      // Network error - still clear local state.
    }
    setAccessToken(null);
    setMe(null);
    // Also clear the legacy authStore so the wallet UI (TopBar, login
    // prompts) drops back to unauthenticated state immediately.
    useAuthStore.getState().logout();
  }

  return (
    <Ctx.Provider
      value={{
        me,
        loading,
        loggedIn: !!me,
        reload,
        logout,
        onLoginSucceeded,
        postLoginRedirect,
        clearPostLoginRedirect: () => setPostLoginRedirect(null),
      }}
    >
      {children}
    </Ctx.Provider>
  );
}

/** Read wallet auth state. Throws if used outside AuthProvider. */
export function useAuth(): AuthState {
  const v = useContext(Ctx);
  if (!v) throw new Error('useAuth must be used inside AuthProvider');
  return v;
}
