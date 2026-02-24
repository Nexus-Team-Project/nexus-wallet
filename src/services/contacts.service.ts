/**
 * contacts.service.ts — Platform-aware contacts access.
 *
 * Three strategies:
 *  1. Google People API   — for users who signed in with Google (incremental scope)
 *  2. Contact Picker API  — for Android Chrome users (device contacts)
 *  3. Share-only           — iPhone / unsupported browsers (no import, just share links)
 *
 * Sharing (WhatsApp / SMS / share sheet / copy) is ALWAYS available regardless of strategy.
 */
import { GoogleAuthProvider, signInWithPopup } from 'firebase/auth';
import { auth } from '../lib/firebase';
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
  // Google users can use People API on any device
  if (authMethod === 'google') return 'google';

  // Non-Google users on Android Chrome can use Contact Picker
  if (isContactPickerSupported()) return 'device-picker';

  // Everything else (iPhone, desktop, etc.) — share only
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

// ── Google People API ────────────────────────────────────────────────────────

const CONTACTS_SCOPE = 'https://www.googleapis.com/auth/contacts.readonly';
const PEOPLE_API_URL = 'https://people.googleapis.com/v1/people/me/connections';

/**
 * Request incremental Google contacts scope and fetch contacts.
 * Opens a Google consent popup asking for contacts.readonly access.
 * Returns the fetched contacts, or null if user denied/cancelled.
 */
export async function fetchGoogleContacts(): Promise<NexusContact[] | null> {
  try {
    // Build provider with incremental scope
    const provider = new GoogleAuthProvider();
    provider.addScope('profile');
    provider.addScope('email');
    provider.addScope(CONTACTS_SCOPE);
    // Preserve existing scopes — key for incremental auth
    provider.setCustomParameters({ include_granted_scopes: 'true' });

    // Open consent popup
    const result = await signInWithPopup(auth, provider);

    // Extract the OAuth access token (not the Firebase ID token)
    const credential = GoogleAuthProvider.credentialFromResult(result);
    const accessToken = credential?.accessToken;
    if (!accessToken) {
      console.warn('[Contacts] No access token from Google sign-in');
      return null;
    }

    // Fetch contacts from People API
    return await fetchPeopleApiContacts(accessToken);
  } catch (err: unknown) {
    const firebaseErr = err as { code?: string };
    if (
      firebaseErr.code === 'auth/popup-closed-by-user' ||
      firebaseErr.code === 'auth/cancelled-popup-request'
    ) {
      // User cancelled — not an error
      return null;
    }
    console.error('[Contacts] Google contacts fetch failed:', err);
    return null;
  }
}

/** Fetch contacts from Google People API using an access token */
async function fetchPeopleApiContacts(accessToken: string): Promise<NexusContact[]> {
  const contacts: NexusContact[] = [];
  let nextPageToken: string | undefined;

  // Paginate through all contacts (max ~2000 per request)
  do {
    const params = new URLSearchParams({
      personFields: 'names,phoneNumbers,emailAddresses',
      pageSize: '1000',
      sortOrder: 'FIRST_NAME_ASCENDING',
    });
    if (nextPageToken) params.set('pageToken', nextPageToken);

    const res = await fetch(`${PEOPLE_API_URL}?${params}`, {
      headers: { Authorization: `Bearer ${accessToken}` },
    });

    if (!res.ok) {
      console.error('[Contacts] People API error:', res.status, await res.text());
      break;
    }

    const data = await res.json();
    const connections: unknown[] = data.connections ?? [];

    for (const person of connections) {
      const p = person as {
        resourceName?: string;
        names?: { displayName?: string }[];
        phoneNumbers?: { value?: string }[];
        emailAddresses?: { value?: string }[];
      };

      const name = p.names?.[0]?.displayName ?? '';
      if (!name) continue; // Skip contacts without names

      contacts.push({
        id: p.resourceName ?? `google-${contacts.length}`,
        name,
        phones: (p.phoneNumbers ?? []).map((n) => n.value ?? '').filter(Boolean),
        emails: (p.emailAddresses ?? []).map((e) => e.value ?? '').filter(Boolean),
        source: 'google',
      });
    }

    nextPageToken = data.nextPageToken;
  } while (nextPageToken);

  return contacts;
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

/** Build a referral URL from a userId */
export function buildReferralUrl(userId: string): string {
  const refCode = userId.replace(/[^a-zA-Z0-9]/g, '').slice(0, 8).toLowerCase();
  return `https://nexus.app/join?ref=${refCode}`;
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
