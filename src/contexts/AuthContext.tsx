/**
 * Wallet AuthContext. On mount it tries POST /api/auth/refresh against
 * the nexus_refresh cookie; if that succeeds it hydrates the in-memory
 * access token and fetches /api/me. Pages read auth state via useAuth.
 *
 * onLoginSucceeded is what every successful login path calls (phone
 * verify mode=logged_in, email-otp verify, google/wallet) to seed the
 * access token + refresh /api/me - the central post-login routing in
 * lib/postLogin.ts reads straight from me.router.
 *
 * Spec: docs/superpowers/specs/2026-05-25-nexus-wallet-auth-design.md sections 3 and 7
 */
import { createContext, useContext, useEffect, useState } from 'react';
import type { ReactNode } from 'react';
import { api, setAccessToken, getAccessToken } from '../lib/api';
import { useAuthStore } from '../stores/authStore';
import { useRegistrationStore } from '../stores/registrationStore';
import { exchangeGoogleCode, consumeGoogleReturnContext } from '../services/auth.service';
import { nextPathAfterLogin } from '../lib/postLogin';
import { clearAffiliation } from '../lib/registrationAffiliation';

/**
 * Subset of /api/me the wallet reads. Mirrors the backend MeResponse
 * fields added by Plan #1; extras like `authorization` are ignored
 * here on purpose - this context is only the auth surface.
 */
export interface WalletMeResponse {
  user: { id: string; email: string; name: string; avatarUrl?: string | null };
  context: {
    isTenant: boolean;
    tenantId: string | null;
    tenantName: string | null;
    role: string | null;
  };
  memberships?: Array<{
    tenantId: string;
    tenantName: string;
    logoUrl?: string;
    /** Org brand color ("#rrggbb"), when set; the first-login accent. */
    brandColor?: string;
    role: string;
    isPrivilegedRole: boolean;
    /**
     * Whether the user holds the 'member' role in this tenant (even if they
     * also hold a privileged role). The wallet uses this to decide whether the
     * tenant's catalog is browsable - admin-only tenants are excluded.
     */
    isMember?: boolean;
  }>;
  isPlatformAdmin?: boolean;
  canOpenDashboard?: boolean;
  /** Canonical phone on the identity (05XXXXXXXX), or null when unset. */
  phone?: string | null;
  /** ISO timestamp the phone was OTP-verified; null for a test-attached number. */
  phoneVerifiedAt?: string | null;
  /** Whether the member opted in to marketing (drives the profile toggle state). */
  marketingConsent?: boolean;
  /**
   * Effective default landing context for a returning member: a tenantId to
   * land on that tenant's catalog, or null for the Nexus (ecosystem) catalog.
   * Drives resolvePostLogin when logging in without a ?tenant in the URL.
   */
  defaultTenantId?: string | null;
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
   * navigate (via lib/postLogin.ts for known identities).
   */
  onLoginSucceeded: (accessToken: string) => Promise<WalletMeResponse | null>;
  /**
   * Post-login navigation signal. Set to a resolved path (e.g.
   * '/he/store') by nextPathAfterLogin when bootstrap completes a fresh
   * Google redirect login and the user should land on a specific screen.
   * Consumers inside
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
      // Hydrate the Google profile photo so the authenticated TopBar avatar
      // shows it on refresh-cookie-restored sessions (not just the fresh
      // Google-login action). login() keeps the prior value when undefined.
      avatarUrl: data.user.avatarUrl ?? undefined,
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
          setAccessToken(r.accessToken);

          // Google redirects back to the bare origin, so the ?tenant=X and
          // /he lang prefix are not on the callback URL — they were stashed
          // before the redirect (consumeGoogleReturnContext). This makes a
          // Google login resolve the same destination phone/email logins do.
          const ret = consumeGoogleReturnContext();
          const lang = ret.lang;
          const urlTenantId = ret.tenant; // null = ecosystem
          const tenantSuffix = urlTenantId ? `?tenant=${encodeURIComponent(urlTenantId)}` : '';

          // Decide where the Google login lands BEFORE the hard-nav.
          // - Returning user (profile.completedAt set) -> resolver picks
          //   the catalog / join / member destination.
          // - New user (no completedAt) -> the same onboarding story
          //   chain phone-OTP signups see. We seed the registration
          //   session in sessionStorage before reloading so
          //   useRegistrationStore.isRegistering is true on the next
          //   bootstrap and RegistrationGuard lets the slide chain run.
          // /api/me failure falls back to the ecosystem catalog so a
          // hiccup never strands the user mid-bootstrap.
          let destination = `/${lang}/store?ecosystem=1`;
          try {
            const me = await api<WalletMeResponse>('/api/me');
            if (!me.profile?.completedAt) {
              const nameParts = (me.user.name ?? '').trim().split(/\s+/).filter(Boolean);
              const firstName = nameParts[0] ?? '';
              const lastName = nameParts.slice(1).join(' ');
              const regStore = useRegistrationStore.getState();
              // Google sign-ups usually have no phone — collect + verify one as the
              // FIRST onboarding question (verify-phone is first in the slide order).
              // Skip ONLY when the identity already has a phone the user VERIFIED
              // (e.g. an earlier SMS login). A tenant-entered contact phone lives on
              // the contact row (not the identity), and a test-attached number is
              // unverified — neither suppresses the slide.
              const needsPhone = !me.phoneVerifiedAt;
              regStore.startRegistration({
                path: 'new-user',
                phone: '',
                missingFields: needsPhone ? ['phone', 'firstName', 'lastName', 'birthday'] : ['firstName', 'lastName', 'birthday'],
              });
              regStore.setProfileData({
                firstName,
                lastName,
                email: me.user.email,
              });
              // Persist the Google photo NOW (authStore is localStorage-backed) so
              // the auth-flow hero shows it the instant it mounts after the hard-nav
              // reload below — before the next bootstrap's /api/me re-resolves `me`.
              useAuthStore.getState().setAvatarUrl(me.user.avatarUrl ?? null);
              destination = `/${lang}/auth-flow/new-user${tenantSuffix}`;
            } else {
              destination = nextPathAfterLogin({ lang, urlTenantId, me });
            }
          } catch (err) {
            console.error('[wallet-auth] /api/me failed after Google exchange:', err);
          }

          // Hard-navigate. Page reloads at the destination, bootstrap
          // re-runs without a ?code, refresh cookie hydrates the
          // session, and /api/me lands the user on the right screen.
          window.location.replace(destination);
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
        const meData = await reload();
        // A NEW user (no profile.completedAt) authenticated via the refresh
        // cookie — e.g. an invited member opening the wallet, or someone who
        // closed the browser mid-onboarding (which wipes the sessionStorage
        // flags) and reopened a deep onboarding URL — must be sent back through
        // the stories. We re-seed for ANY logged-in incomplete user whose
        // registration session is gone. No `inFlow` skip is needed: after the
        // re-seed below `isRegistering` is persisted true, so the next bootstrap
        // (post hard-nav) short-circuits here and there is no redirect loop.
        const path = window.location.pathname;
        if (
          meData &&
          !meData.profile?.completedAt &&
          !useRegistrationStore.getState().isRegistering
        ) {
          const lang = path.split('/')[1] || 'he';
          const sp = new URLSearchParams(window.location.search);
          const urlTenantId = sp.get('ecosystem') === '1' ? null : sp.get('tenant');
          const tenantSuffix = urlTenantId ? `?tenant=${encodeURIComponent(urlTenantId)}` : '';
          const nameParts = (meData.user.name ?? '').trim().split(/\s+/).filter(Boolean);
          const regStore = useRegistrationStore.getState();
          // Same phone gate as the fresh-login branch: an incomplete user with no
          // VERIFIED phone (e.g. someone who closed the browser mid-onboarding and
          // returns via the refresh cookie) must still get the phone slide first.
          const needsPhone = !meData.phoneVerifiedAt;
          regStore.startRegistration({
            path: 'new-user',
            phone: '',
            missingFields: needsPhone ? ['phone', 'firstName', 'lastName', 'birthday'] : ['firstName', 'lastName', 'birthday'],
          });
          regStore.setProfileData({
            firstName: nameParts[0] ?? '',
            lastName: nameParts.slice(1).join(' '),
            email: meData.user.email,
          });
          // Persist the Google photo so the hero shows it immediately after reload.
          useAuthStore.getState().setAvatarUrl(meData.user.avatarUrl ?? null);
          window.location.replace(`/${lang}/auth-flow/new-user${tenantSuffix}`);
          return; // page is unloading
        }
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
    // Drop any in-progress signup affiliation so a logged-out / next user does
    // not inherit a stale org pointer on this browser.
    clearAffiliation();
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
