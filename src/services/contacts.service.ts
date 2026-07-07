/**
 * contacts.service.ts - Platform-aware contacts access.
 *
 * Three strategies:
 *  1. Google People API   - DISABLED: removed in Plan #2 (was Firebase-bound).
 *     A rewrite via GIS + incremental scope lives in a future plan.
 *  2. Contact Picker API  - for Android Chrome users (device contacts)
 *  3. Share-only          - iPhone / unsupported browsers (no import, just share links)
 *
 * Sharing (WhatsApp / SMS / share sheet / copy) is always available regardless of strategy.
 */
import type { AuthMethod } from '../types/auth.types';

// ── Types ────────────────────────────────────────────────────────────────────

export interface NexusContact {
  id: string;
  name: string;
  phones: string[];
  emails: string[];
  source: 'google' | 'device';
}

export type ContactsStrategy = 'google' | 'device-picker' | 'share-only';

// ── Strategy Detection ───────────────────────────────────────────────────────

/** Determine the best way to access contacts for this user/device */
export function getContactsStrategy(authMethod: AuthMethod | null): ContactsStrategy {
  // Google People API path is disabled until rewired via GIS incremental
  // scope. For now, every user falls through to picker / share-only.
  void authMethod;

  if (isContactPickerSupported()) return 'device-picker';

  return 'share-only';
}

/** Check if the Contact Picker API is available (Chrome Android 80+) */
export function isContactPickerSupported(): boolean {
  return (
    typeof navigator !== 'undefined' &&
    'contacts' in navigator &&
    'ContactsManager' in window
  );
}

// Google People API: removed in Plan #2 (was Firebase-bound). Returning
// null preserves the call-site contract while the rewire to Google
// Identity Services with incremental scope is deferred to a later plan.
export async function fetchGoogleContacts(): Promise<NexusContact[] | null> {
  console.warn('[Contacts] Google People API is disabled until Plan #5 rewires it via GIS');
  return null;
}

// ── Contact Picker API ───────────────────────────────────────────────────────

/**
 * Open the device's native Contact Picker (Android Chrome).
 * Returns selected contacts, or null if user cancelled or API unavailable.
 */
export async function pickDeviceContacts(): Promise<NexusContact[] | null> {
  if (!isContactPickerSupported()) return null;

  try {
    const selected: { name?: string[]; tel?: string[]; email?: string[] }[] =
      // @ts-expect-error — Contact Picker API not in standard lib types
      await navigator.contacts.select(['name', 'tel', 'email'], { multiple: true });

    return selected.map((c, i) => ({
      id: `device-${i}`,
      name: c.name?.[0] ?? '',
      phones: c.tel ?? [],
      emails: c.email ?? [],
      source: 'device' as const,
    })).filter((c) => c.name);
  } catch {
    // User cancelled or API error
    return null;
  }
}

// ── Sharing Utilities (always available) ─────────────────────────────────────

/** Build a referral URL from a userId, optionally scoped to a tenant */
export function buildReferralUrl(userId: string, tenantId?: string | null): string {
  const refCode = userId.replace(/[^a-zA-Z0-9]/g, '').slice(0, 8).toLowerCase();
  const base = `https://nexus.app/join?ref=${refCode}`;
  return tenantId ? `${base}&tenant=${encodeURIComponent(tenantId)}` : base;
}

/** Share via WhatsApp with pre-filled message */
export function shareViaWhatsApp(text: string, url: string): void {
  const encoded = encodeURIComponent(`${text}\n${url}`);
  window.open(`https://wa.me/?text=${encoded}`, '_blank');
}

/** Share via SMS with pre-filled message */
export function shareViaSMS(text: string, url: string): void {
  const body = encodeURIComponent(`${text} ${url}`);
  window.open(`sms:?body=${body}`, '_self');
}

/** Share via native share sheet */
export async function shareNative(title: string, text: string, url: string): Promise<boolean> {
  if (!navigator.share) return false;
  try {
    await navigator.share({ title, text, url });
    return true;
  } catch {
    return false; // User cancelled
  }
}

/** Copy text to clipboard */
export async function copyToClipboard(text: string): Promise<boolean> {
  try {
    await navigator.clipboard.writeText(text);
    return true;
  } catch {
    // Fallback for environments without clipboard API
    const el = document.createElement('input');
    el.value = text;
    document.body.appendChild(el);
    el.select();
    document.execCommand('copy');
    document.body.removeChild(el);
    return true;
  }
}
