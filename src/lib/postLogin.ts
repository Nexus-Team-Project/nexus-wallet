/**
 * Central post-login routing. Replaces the deleted RouterScreen's job:
 * given the loaded /api/me and the URL tenant context, decides where a
 * just-authenticated user should land. Also owns the "return to the page
 * the user was on when a gated action popped login" stash.
 *
 * Decisions (spec section 3.6):
 *  - new user (no profile.completedAt)        -> org-aware stories chain
 *  - returning member of ?tenant=X            -> /store?tenant=X
 *  - returning NON-member of ?tenant=X        -> standalone join screen
 *  - returning, ecosystem / no tenant         -> /store?ecosystem=1
 * A stashed return path (gated-action origin) overrides the catalog
 * destinations for returning users who need no onboarding.
 */
import type { WalletMeResponse } from '../contexts/AuthContext';

const RETURN_KEY = 'wallet_post_login_return';

/** Remember where to send the user after they finish logging in. Overwrites any prior stash. */
export function stashPostLoginReturn(path: string): void {
  try { sessionStorage.setItem(RETURN_KEY, path); } catch { /* storage disabled — non-fatal */ }
}

/** Read + clear the stash. Returns null if none. */
export function consumePostLoginReturn(): string | null {
  try {
    const v = sessionStorage.getItem(RETURN_KEY);
    if (v) sessionStorage.removeItem(RETURN_KEY);
    return v;
  } catch {
    return null;
  }
}

/** Clear the stash without reading (used on logout). */
export function clearPostLoginReturn(): void {
  try { sessionStorage.removeItem(RETURN_KEY); } catch { /* non-fatal */ }
}

export interface PostLoginContext {
  lang: string;
  /** ?tenant=X from the URL, or null for ecosystem / no tenant. */
  urlTenantId: string | null;
  me: WalletMeResponse;
}

export type PostLoginKind = 'return' | 'stories-new' | 'stories-nonmember' | 'catalog';

export interface PostLoginDecision {
  kind: PostLoginKind;
  /** lang-relative absolute path to navigate to. */
  path: string;
}

function isMemberOf(me: WalletMeResponse, tenantId: string): boolean {
  return (me.memberships ?? []).some((m) => m.tenantId === tenantId);
}

/**
 * Decide the post-login destination. Does NOT consume the return stash —
 * callers consume it explicitly (so new users keep it across the stories
 * chain and RegistrationCompletePage consumes it at the end).
 */
export function resolvePostLogin(ctx: PostLoginContext): PostLoginDecision {
  const { lang, urlTenantId, me } = ctx;
  const completed = !!me.profile?.completedAt;
  const tenantQuery = urlTenantId ? `?tenant=${encodeURIComponent(urlTenantId)}` : '';

  if (!completed) {
    return { kind: 'stories-new', path: `/${lang}/auth-flow/new-user${tenantQuery}` };
  }
  if (urlTenantId && isMemberOf(me, urlTenantId)) {
    return { kind: 'catalog', path: `/${lang}/store?tenant=${encodeURIComponent(urlTenantId)}` };
  }
  if (urlTenantId && !isMemberOf(me, urlTenantId)) {
    return { kind: 'stories-nonmember', path: `/${lang}/auth-flow/join${tenantQuery}` };
  }
  return { kind: 'catalog', path: `/${lang}/store?ecosystem=1` };
}

/**
 * Convenience used by login call sites: returns the path to navigate to,
 * honoring a stashed return for returning users who skip onboarding.
 */
export function nextPathAfterLogin(ctx: PostLoginContext): string {
  const decision = resolvePostLogin(ctx);
  if (decision.kind === 'catalog') {
    const ret = consumePostLoginReturn();
    if (ret) return ret;
  }
  return decision.path;
}
