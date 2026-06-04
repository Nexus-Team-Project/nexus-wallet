/**
 * Wallet phone API wrappers — add / verify / change the phone on the
 * authenticated identity. Backed by /api/v1/wallet/phone/* (see backend plan
 * 2026-06-04-wallet-google-phone-collection). The phone is attached to the
 * NexusIdentity and mirrored onto the user's tenant rows server-side.
 *
 * Real OTP is only available once InforU is configured. Until then the UI uses
 * `attachPhoneTest` (the backend test path) so the save can be exercised.
 */
import { api } from '../lib/api';

/** Whether the real (InforU) OTP flow is enabled in this build. When false the
 *  slide/profile disable "המשך" and offer the test path instead. */
export const PHONE_OTP_ENABLED = import.meta.env.VITE_PHONE_OTP_ENABLED === 'true';

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

/**
 * TEST path: attach the phone WITHOUT an OTP (saved unverified). Only works
 * while InforU is not configured (backend rejects otherwise). Lets the full
 * save be exercised before SMS is live.
 * @returns the normalized phone.
 */
export async function attachPhoneTest(
  phone: string,
): Promise<{ ok: boolean; test: boolean; phone: string }> {
  return api<{ ok: boolean; test: boolean; phone: string }>('/api/v1/wallet/phone/attach-test', {
    method: 'POST',
    body: { phone },
  });
}
