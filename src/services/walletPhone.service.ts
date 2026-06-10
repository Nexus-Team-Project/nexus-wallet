/**
 * Wallet phone API wrappers — add / verify / change the phone on the
 * authenticated identity. Backed by /api/v1/wallet/phone/* (see backend plan
 * 2026-06-04-wallet-google-phone-collection). The phone is attached to the
 * NexusIdentity and mirrored onto the user's tenant rows server-side.
 *
 * Verification is always via a real InforU SMS OTP (start -> verify).
 */
import { api } from '../lib/api';

/**
 * Start an OTP for a phone the caller wants to attach.
 * @param phone national or +972 form (server normalizes + validates IL-only).
 * @returns the challengeId to pass to verifyPhoneOtp.
 */
export async function startPhoneOtp(phone: string): Promise<{ challengeId: string }> {
  return api<{ challengeId: string }>('/api/v1/wallet/phone/start', {
    method: 'POST',
    body: { phone },
  });
}

/**
 * Verify the OTP code and attach the now-verified phone to the caller.
 * @returns the normalized phone.
 */
export async function verifyPhoneOtp(
  challengeId: string,
  code: string,
): Promise<{ ok: boolean; phone: string }> {
  return api<{ ok: boolean; phone: string }>('/api/v1/wallet/phone/verify', {
    method: 'POST',
    body: { challengeId, code },
  });
}
