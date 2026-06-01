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
  // Returning user, no tenant in the URL → their default landing context.
  // A member with a default (explicit choice or last-joined) lands on that
  // tenant; everyone else lands on the Nexus ecosystem catalog. A stashed
  // gated-action return still overrides this in nextPathAfterLogin().
  const def = me.defaultTenantId;
  return {
    kind: 'catalog',
    path: def
      ? `/${lang}/store?tenant=${encodeURIComponent(def)}`
      : `/${lang}/store?ecosystem=1`,
  };
}

/**
 * Is this stashed return path a bare catalog / front-door URL?
 *
 * Matches `/:lang`, `/:lang/`, and `/:lang/store...`. Returning to one of
 * these is pointless for a member with a default tenant — clicking "Log in"
 * on the ecosystem front door would otherwise stash that URL and override
 * the default-tenant landing. Specific pages (an offer, the wallet) are NOT
 * matched, so a genuine action return is still honored.
 */
function isCatalogReturn(path: string): boolean {
  return (
    /^\/[a-z]{2}\/?(\?.*)?$/.test(path) ||
    /^\/[a-z]{2}\/store\/?(\?.*)?$/.test(path)
  );
}

/**
 * Convenience used by login call sites: returns the path to navigate to.
 * Honors a stashed gated-action return ONLY when it points at a specific
 * actionable page; a bare catalog/front-door stash yields to the member's
 * default-tenant landing instead.
 */
export function nextPathAfterLogin(ctx: PostLoginContext): string {
  const decision = resolvePostLogin(ctx);
  if (decision.kind === 'catalog') {
    const ret = consumePostLoginReturn();
    if (ret && !isCatalogReturn(ret)) return ret;
  }
  return decision.path;
}
