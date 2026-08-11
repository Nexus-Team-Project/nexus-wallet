/**
 * Canonical phone normalization: Israeli formats → E.164.
 *
 * This used to exist twice — in auth.service.ts and orgMember.service.ts — and
 * the two copies disagreed on the fallback branch (`+972${digits}` versus
 * `+${digits}`). That is not cosmetic. The launch-gift ledger is keyed by the
 * normalized phone, so two spellings of the same number mean one person can be
 * granted the gift twice and consume two slots of a capped campaign.
 *
 * `+972${digits}` is canonical: it is the form firebaseSendOtp() already passed
 * to signInWithPhoneNumber(), so it is the form Firebase accepted.
 */
export function toE164(phone: string): string {
  const digits = phone.replace(/\D/g, '');
  if (digits.startsWith('972')) return `+${digits}`;
  if (digits.startsWith('0')) return `+972${digits.slice(1)}`;
  return `+972${digits}`;
}
