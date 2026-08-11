/**
 * Gift ledger — the mock stand-in for the one piece of this feature that needs
 * real server state.
 *
 * ── Why it lives here and not in a store ─────────────────────────────────────
 * This is mock *data*, not UI state. Making it a zustand store would invite
 * someone to clear it alongside auth, and the whole point of the storage key
 * below is that logging out must NOT re-enable the gift.
 *
 * ── Accepted approximations (mock-only scope) ────────────────────────────────
 * Idempotency is keyed on the E.164 phone, so re-verifying the same number
 * returns the existing grant and consumes no cap slot. But:
 *   • a different browser or device gets a fresh ledger — new grant, cap restarts
 *   • clearing localStorage by hand re-enables the gift
 *   • the 200-recipient cap is therefore per-browser, not global
 * All three are known and accepted. A real backend fixes all three by replacing
 * the five functions below — that is the only seam that has to change.
 *
 * Nothing outside mock/handlers/gift.handler.ts may import this module.
 */
import type { OpeningGift } from '../../types/gift.types';

/**
 * Deliberately NOT `nexus_auth`. authStore.logout() wipes its whole key, so a
 * gift stored there would be re-grantable by signing out and back in.
 */
const STORAGE_KEY = 'nexus_gift_ledger_v1';

interface GiftLedger {
  version: 1;
  /**
   * The phone of the member currently signed in. Written by the resolver at
   * OTP; read by everything downstream.
   *
   * This exists because the transaction page has no phone available: authStore
   * has no phone field, and registrationStore.phone is wiped by
   * completeRegistration(). The ledger is the mock's "who am I" pointer.
   */
  activeKey: string | null;
  grants: Record<string, OpeningGift>;
}

const EMPTY: GiftLedger = { version: 1, activeKey: null, grants: {} };

function read(): GiftLedger {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return { ...EMPTY, grants: {} };
    const parsed = JSON.parse(raw) as Partial<GiftLedger>;
    if (parsed.version !== 1) return { ...EMPTY, grants: {} };
    return {
      version: 1,
      activeKey: parsed.activeKey ?? null,
      grants: parsed.grants ?? {},
    };
  } catch {
    return { ...EMPTY, grants: {} };
  }
}

function write(ledger: GiftLedger): void {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(ledger));
  } catch {
    /* storage unavailable (private mode / quota) — degrade silently */
  }
}

// ── The seam. Swap these five bodies for a real backend. ─────────────────────

export function readGrant(phoneKey: string): OpeningGift | null {
  return read().grants[phoneKey] ?? null;
}

export function writeGrant(gift: OpeningGift): void {
  const ledger = read();
  ledger.grants[gift.phoneKey] = gift;
  write(ledger);
}

/**
 * Recipient count, derived rather than stored. A stored counter drifts out of
 * sync with the grants it counts, and can be resurrected stale.
 */
export function countGrants(campaignId: string): number {
  return Object.values(read().grants).filter((g) => g.campaignId === campaignId).length;
}

export function getActiveKey(): string | null {
  return read().activeKey;
}

export function setActiveKey(phoneKey: string | null): void {
  const ledger = read();
  ledger.activeKey = phoneKey;
  write(ledger);
}

/** Test-only: wipe the ledger so the flow can be walked again. */
export function resetLedger(): void {
  try {
    localStorage.removeItem(STORAGE_KEY);
  } catch {
    /* ignore */
  }
}
