/**
 * Small client-side helpers for wallet auth.
 *
 * normalizeIsraeliPhone: mirror of the backend rule used purely for
 * UX (early reject before hitting /api/v1/auth/phone/start). The
 * backend re-normalizes server-side, so this is never authoritative.
 *
 * requestGoogleIdToken: kicks Google Identity Services to issue an
 * id_token using the wallet's authorized JS origin. The script tag
 * for accounts.google.com/gsi/client lives in index.html.
 *
 * Spec: docs/superpowers/specs/2026-05-25-nexus-wallet-auth-design.md sections 6 and 10.1
 */

const ISRAELI_MOBILE = /^05\d{8}$/;

/**
 * Strip non-digits, drop +972/972/00972, prepend 0 if missing, and
 * validate against /^05\d{8}$/. Returns null if invalid.
 */
export function normalizeIsraeliPhone(raw: string): string | null {
  if (!raw) return null;
  let digits = raw.replace(/\D/g, '');
  if (digits.startsWith('00972')) digits = digits.slice(5);
  else if (digits.startsWith('972')) digits = digits.slice(3);
  if (digits.length === 9 && digits.startsWith('5')) digits = '0' + digits;
  return ISRAELI_MOBILE.test(digits) ? digits : null;
}

declare global {
  interface Window {
    google?: {
      accounts: {
        id: {
          initialize: (cfg: {
            client_id: string;
            callback: (resp: { credential: string }) => void;
          }) => void;
          prompt: () => void;
          renderButton: (el: HTMLElement, opts: Record<string, unknown>) => void;
        };
      };
    };
  }
}

/**
 * Prompt Google Identity Services for an id_token. Resolves with the
 * raw id_token string; the wallet then POSTs it to
 * /api/v1/auth/google/wallet for verification.
 *
 * Throws Error('google_gis_not_loaded') if the GIS script has not
 * finished loading. Caller is responsible for adding the script tag
 * to index.html (done in Plan #2 Task 1).
 */
export function requestGoogleIdToken(clientId: string): Promise<string> {
  return new Promise((resolve, reject) => {
    const w = window;
    if (!w.google?.accounts?.id) {
      reject(new Error('google_gis_not_loaded'));
      return;
    }
    w.google.accounts.id.initialize({
      client_id: clientId,
      callback: (resp): void => resolve(resp.credential),
    });
    w.google.accounts.id.prompt();
  });
}
