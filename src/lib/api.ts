/**
 * Wallet API client. Talks only to nexus-website/backend.
 *
 * Session strategy:
 * - The access token lives in memory (this module) and is sent as a
 *   Bearer header on every request that isn't marked skipAuth.
 * - The httpOnly nexus_refresh cookie on .nexus-payment.com is the
 *   durable session. On any 401, we call /api/auth/refresh which reads
 *   the cookie and returns a fresh access token.
 * - Concurrent 401s share a single refresh promise (`refreshPromise`)
 *   so we never fire N parallel refreshes from N parallel requests.
 *
 * Mirrors the pattern used by nexus-dashboard/src/lib/api.ts.
 *
 * Spec: docs/superpowers/specs/2026-05-25-nexus-wallet-auth-design.md section 3
 */

const BASE: string = import.meta.env.VITE_API_URL || 'http://localhost:3001';

let accessToken: string | null = null;
let refreshPromise: Promise<string | null> | null = null;

/** Set the in-memory access token (called by AuthContext after login). */
export function setAccessToken(token: string | null): void {
  accessToken = token;
}

/** Read the in-memory access token. */
export function getAccessToken(): string | null {
  return accessToken;
}

/**
 * POST /api/auth/refresh and remember the new access token. Returns
 * null on failure so callers can fall back to logged-out state.
 * Deduped: concurrent calls share one in-flight refresh.
 */
async function refreshAccessToken(): Promise<string | null> {
  if (refreshPromise) return refreshPromise;
  refreshPromise = (async (): Promise<string | null> => {
    try {
      const res = await fetch(`${BASE}/api/auth/refresh`, {
        method: 'POST',
        credentials: 'include',
      });
      if (!res.ok) return null;
      const data = (await res.json()) as { accessToken?: string };
      if (!data.accessToken) return null;
      accessToken = data.accessToken;
      return data.accessToken;
    } catch {
      return null;
    } finally {
      refreshPromise = null;
    }
  })();
  return refreshPromise;
}

/** Per-call options. `body` is auto-JSON-stringified. */
export interface RequestOptions extends Omit<RequestInit, 'body'> {
  body?: unknown;
  /** Skip Bearer auth + skip 401 retry. Use for public endpoints. */
  skipAuth?: boolean;
}

/**
 * Thin fetch wrapper.
 * - JSON content-type by default
 * - Bearer header injection
 * - Cookies forwarded (credentials: include)
 * - 401 -> try refresh -> retry once
 * - Throws Error('http_<status>') or Error('<backend error code>') on failure
 */
export async function api<T>(path: string, options: RequestOptions = {}): Promise<T> {
  const url = path.startsWith('http') ? path : `${BASE}${path}`;
  const headers = new Headers(options.headers);
  if (options.body !== undefined && !headers.has('Content-Type')) {
    headers.set('Content-Type', 'application/json');
  }
  if (!options.skipAuth && accessToken) {
    headers.set('Authorization', `Bearer ${accessToken}`);
  }

  const init: RequestInit = {
    ...options,
    headers,
    credentials: 'include',
    body: options.body === undefined ? undefined : JSON.stringify(options.body),
  };

  let res = await fetch(url, init);
  if (res.status === 401 && !options.skipAuth) {
    const fresh = await refreshAccessToken();
    if (fresh) {
      headers.set('Authorization', `Bearer ${fresh}`);
      res = await fetch(url, { ...init, headers });
    }
  }

  if (!res.ok) {
    const errBody = await res.json().catch(() => ({}));
    const msg = (errBody as { error?: string }).error ?? `http_${res.status}`;
    const err = new Error(msg) as Error & { status: number };
    err.status = res.status;
    throw err;
  }

  // Some endpoints return 204 No Content; handle gracefully.
  if (res.status === 204) return undefined as T;
  return (await res.json()) as T;
}
