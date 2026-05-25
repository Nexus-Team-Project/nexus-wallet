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
}

interface AuthState {
  me: WalletMeResponse | null;
  loading: boolean;
  loggedIn: boolean;
  reload: () => Promise<void>;
  logout: () => Promise<void>;
  onLoginSucceeded: (accessToken: string) => Promise<void>;
}

const Ctx = createContext<AuthState | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [me, setMe] = useState<WalletMeResponse | null>(null);
  const [loading, setLoading] = useState<boolean>(true);

  async function reload(): Promise<void> {
    try {
      const data = await api<WalletMeResponse>('/api/me');
      setMe(data);
    } catch {
      setMe(null);
    }
  }

  async function bootstrap(): Promise<void> {
    setLoading(true);
    try {
      // Try refresh first. If the cookie is valid, this hydrates the
      // in-memory access token; otherwise the request fails silently
      // and the user stays logged out.
      try {
        const r = await api<{ accessToken: string }>('/api/auth/refresh', {
          method: 'POST',
          skipAuth: true,
        });
        setAccessToken(r.accessToken);
      } catch {
        // No refresh cookie or it expired - stay logged out.
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

  async function onLoginSucceeded(accessToken: string): Promise<void> {
    setAccessToken(accessToken);
    await reload();
  }

  async function logout(): Promise<void> {
    try {
      await api('/api/auth/logout', { method: 'POST' });
    } catch {
      // Network error - still clear local state.
    }
    setAccessToken(null);
    setMe(null);
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
