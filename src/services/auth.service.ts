/**
 * Wallet auth service. All Firebase calls have been replaced with
 * calls to nexus-website/backend (Plan #1 endpoints).
 *
 * Function names retain the legacy `firebase` prefix on purpose so the
 * LoginSheet does not need a coordinated rename - the names are an
 * interface, not a provider. A name cleanup ships in a later refactor.
 *
 * Spec: docs/superpowers/specs/2026-05-25-nexus-wallet-auth-design.md sections 6 and 8
 */
import { api } from '../lib/api';
import { normalizeIsraeliPhone } from '../lib/walletAuth';
import type { AuthSession, OtpVerifyResult, OrgMember } from '../types/auth.types';

/** Key under which we persist the post-login destination across the
 * full-page Google OAuth redirect. */
const GOOGLE_REDIRECT_KEY = 'nexus_wallet_google_redirect';

// Module-level state ties an in-flight challenge back to the verify call.
let phoneChallengeId: string | null = null;
let signupTicketId: string | null = null;
let emailChallengeId: string | null = null;

/**
 * Send a phone-OTP. Returns success=true on accepted SMS; the
 * challengeId is stored module-local so verifyOtp can reuse it.
 *
 * Errors (invalid_phone, rate_limited, sms_unavailable) bubble through
 * api() so the caller can show a localized message.
 */
export async function firebaseSendOtp(
  phone: string,
): Promise<{ success: boolean }> {
  const normalized = normalizeIsraeliPhone(phone) ?? phone;
  const r = await api<{ challengeId: string }>('/api/v1/auth/phone/start', {
    method: 'POST',
    body: { phone: normalized },
    skipAuth: true,
  });
  phoneChallengeId = r.challengeId;
  return { success: true };
}

/**
 * Verify a phone-OTP. Two outcomes:
 * - logged_in: backend returned an access token. Build an AuthSession
 *   and let the caller hydrate AuthContext via onLoginSucceeded.
 * - phone_verified (phone unknown): surface needsEmail so the caller
 *   navigates to /:lang/auth/email-required and the user can supply
 *   email or Google to finish signup.
 */
export async function firebaseVerifyOtp(
  _phone: string,
  code: string,
): Promise<OtpVerifyResult> {
  if (!phoneChallengeId) return { success: false };
  try {
    const r = await api<
      | { mode: 'logged_in'; accessToken: string; acceptedTenantIds?: string[] }
      | { mode: 'phone_verified'; signupTicketId: string; phone: string }
    >('/api/v1/auth/phone/verify', {
      method: 'POST',
      body: { challengeId: phoneChallengeId, code },
      skipAuth: true,
    });

    if (r.mode === 'phone_verified') {
      signupTicketId = r.signupTicketId;
      return {
        success: false,
        needsEmail: {
          signupTicketId: r.signupTicketId,
          phone: r.phone,
        },
      };
    }

    const session: AuthSession = {
      token: r.accessToken,
      userId: 'wallet',
      method: 'phone',
      isOrgMember: false,
      marketingConsent: false,
    };
    return {
      success: true,
      session,
      registrationContext: {
        orgMember: null,
        profileComplete: true,
        missingFields: [],
      },
    };
  } catch {
    // Wrong code, expired, locked - all surface as success=false.
    return { success: false };
  }
}

/**
 * Start an email-OTP, paired with the phone-signup ticket from the
 * previous phone-verify if present.
 */
export async function walletStartEmailOtp(email: string): Promise<{ challengeId: string }> {
  const r = await api<{ challengeId: string }>('/api/v1/auth/email-otp/start', {
    method: 'POST',
    body: {
      email,
      ...(signupTicketId ? { signupTicketId } : {}),
      lang: 'he',
    },
    skipAuth: true,
  });
  emailChallengeId = r.challengeId;
  return r;
}

export interface WalletEmailVerifyResult {
  accessToken: string;
  identityCreated: boolean;
  phoneLinked: boolean;
  acceptedTenantIds?: string[];
}

/**
 * Verify the email-OTP. On success the backend issued a wallet
 * session (refresh cookie set, access token returned). The caller
 * hydrates AuthContext via onLoginSucceeded and runs the central
 * post-login routing in lib/postLogin.ts.
 */
export async function walletVerifyEmailOtp(code: string): Promise<WalletEmailVerifyResult> {
  if (!emailChallengeId) throw new Error('no_email_challenge');
  const r = await api<WalletEmailVerifyResult>('/api/v1/auth/email-otp/verify', {
    method: 'POST',
    body: { challengeId: emailChallengeId, code },
    skipAuth: true,
  });
  // Consumed - clear in case the caller restarts the flow.
  emailChallengeId = null;
  signupTicketId = null;
  return r;
}

interface WalletGoogleResult {
  success: boolean;
  session?: AuthSession;
  profile?: {
    email: string;
    firstName: string;
    lastName: string;
    picture: string;
  };
  orgMember?: OrgMember | null;
  redirecting?: boolean;
}

/**
 * Google sign-in via full-page OAuth redirect with prompt=select_account.
 * Matches the pattern used by nexus-website: browser navigates to
 * accounts.google.com, user picks an account, Google redirects back
 * to the wallet origin with ?code=XXX. AuthContext.bootstrap detects
 * the code on next mount and POSTs it to /api/v1/auth/google/wallet
 * with the same redirectUri.
 *
 * IMPORTANT: redirect_uri MUST be registered in Google Cloud Console
 * under the GOOGLE_CLIENT_ID. For local dev: http://localhost:8080.
 * For prod: https://wallet.nexus-payment.com.
 *
 * Returns success: false with redirecting: true so callers know the
 * page is about to unload. They should NOT continue their post-success
 * logic - the next mount handles it.
 */
export async function firebaseGoogleSignIn(): Promise<WalletGoogleResult> {
  const clientId = import.meta.env.VITE_GOOGLE_CLIENT_ID as string | undefined;
  if (!clientId) {
    console.error('VITE_GOOGLE_CLIENT_ID not configured');
    return { success: false };
  }
  // Persist a small marker so AuthContext.bootstrap knows the ?code in
  // the URL is ours (vs a code that happened to be there from a
  // different OAuth flow).
  sessionStorage.setItem(GOOGLE_REDIRECT_KEY, '1');
  const redirectUri = window.location.origin;
  const scope = encodeURIComponent('email profile openid');
  const url =
    'https://accounts.google.com/o/oauth2/v2/auth' +
    `?client_id=${encodeURIComponent(clientId)}` +
    `&redirect_uri=${encodeURIComponent(redirectUri)}` +
    '&response_type=code' +
    `&scope=${scope}` +
    '&prompt=select_account' +
    '&access_type=online';
  window.location.href = url;
  return { success: false, redirecting: true };
}

interface GoogleExchangeResult {
  accessToken: string;
  identityCreated: boolean;
  acceptedTenantIds?: string[];
}

/**
 * Module-level dedupe: React 19 StrictMode in dev fires effects twice,
 * which would otherwise POST the (single-use) authorization code to
 * the backend twice. Both calls await the same in-flight promise.
 */
let inFlightExchange: Promise<GoogleExchangeResult | null> | null = null;

/**
 * Called by AuthContext bootstrap when a ?code=XXX from a wallet-
 * initiated Google OAuth redirect is present in the URL. Exchanges the
 * code with the backend using the same redirect_uri the browser sent
 * to Google. The session marker (GOOGLE_REDIRECT_KEY) gates this so we
 * never POST a ?code that was put there by a different OAuth flow.
 *
 * @returns the session payload on success, null on failure
 */
export function exchangeGoogleCode(code: string): Promise<GoogleExchangeResult | null> {
  // Marker is consumed on the first call. Second call (StrictMode)
  // returns the SAME in-flight promise so the backend only sees one
  // POST.
  if (inFlightExchange) return inFlightExchange;
  const claimed = sessionStorage.getItem(GOOGLE_REDIRECT_KEY);
  if (!claimed) return Promise.resolve(null);
  sessionStorage.removeItem(GOOGLE_REDIRECT_KEY);

  inFlightExchange = api<GoogleExchangeResult>('/api/v1/auth/google/wallet', {
    method: 'POST',
    body: { code, redirectUri: window.location.origin },
    skipAuth: true,
  }).catch((e: unknown) => {
    console.error('[wallet-auth] google code exchange failed:', e);
    return null;
  });
  return inFlightExchange;
}

/** Apple - placeholder until a real provider is wired. */
export async function firebaseAppleSignIn(): Promise<{
  success: boolean;
  notAvailable?: boolean;
}> {
  return { success: false, notAvailable: true };
}

/**
 * Marketing consent. The Plan #1 backend already accepts the consent
 * audit-trail field on NexusIdentity; a dedicated PATCH endpoint
 * lives in Plan #3 (settings page). For now we keep the in-memory
 * flag on the Zustand store and let Plan #3 sync it.
 */
export async function firebaseSaveConsent(
  _userId: string,
  _consent: boolean,
): Promise<{ success: boolean }> {
  return { success: true };
}

/** Sign out clears server cookie + access token. AuthContext.logout
 * is the preferred entry point; this stub stays for callers still
 * importing the legacy name. */
export async function firebaseSignOut(): Promise<void> {
  try {
    await api('/api/auth/logout', { method: 'POST' });
  } catch {
    // best-effort
  }
}

/**
 * Legacy redirect-result handler. Google Identity Services on the
 * wallet domain uses a prompt-and-callback flow, not a redirect, so
 * this is a no-op left in place to keep the import surface stable.
 */
export async function handleGoogleRedirectResult(): Promise<WalletGoogleResult> {
  return { success: false };
}
