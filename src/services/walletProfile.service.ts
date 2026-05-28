/**
 * Wallet profile API wrappers. Called by:
 * - RegistrationCompletePage to flush slide answers in one PATCH
 * - LoginSheet to save the marketing-consent toggle after first login
 * - Future: a settings page (Plan #5+) to let users update consent
 *
 * Spec: docs/superpowers/specs/2026-05-25-nexus-wallet-auth-design.md sections 6, 4.1
 */
import { api } from '../lib/api';

export interface WalletProfileView {
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
}

export interface WalletProfilePatch {
  firstName?: string;
  lastName?: string;
  /** ISO date string. */
  birthday?: string;
  gender?: 'male' | 'female' | 'other' | 'prefer_not_to_say';
  lifeStage?: string;
  motivation?: string;
  purpose?: string[];
  inviteFriendsSent?: number;
  /** Set true on the last slide to stamp completedAt. */
  complete?: boolean;
}

/** GET the current wallet profile. Returns null when slides haven't been completed. */
export async function fetchWalletProfile(): Promise<WalletProfileView | null> {
  const r = await api<{ profile: WalletProfileView | null }>('/api/v1/wallet/profile');
  return r.profile;
}

/** PATCH any subset of profile fields. */
export async function saveWalletProfile(patch: WalletProfilePatch): Promise<WalletProfileView> {
  const r = await api<{ profile: WalletProfileView }>('/api/v1/wallet/profile', {
    method: 'PATCH',
    body: patch,
  });
  return r.profile;
}

/**
 * Save the marketing-consent audit trail. Called on every login that
 * toggles the consent checkbox so we never have a stale grant state.
 */
export async function saveMarketingConsent(
  granted: boolean,
  source: 'wallet_signup' | 'wallet_settings' = 'wallet_signup',
): Promise<void> {
  await api('/api/v1/wallet/marketing-consent', {
    method: 'PATCH',
    body: { granted, source },
  });
}
