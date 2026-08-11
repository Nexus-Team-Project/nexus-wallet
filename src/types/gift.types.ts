/**
 * The launch-campaign opening gift: money that exists in a member's balance
 * before they have earned anything.
 *
 * Two locks sit on it, and they are resolved in two different places:
 *   1. Eligibility — "does this person get it?" — resolved once, at OTP,
 *      keyed on the phone number. See services/gift.service.ts.
 *   2. Applicability — "can it be used on THIS transaction?" — resolved per
 *      transaction, from the amount and the merchant. See utils/launchGift.ts.
 *
 * They never mix. Eligibility writes; applicability only reads.
 */

/**
 * The redemption rules, copied onto the gift when it is granted.
 *
 * Frozen at grant time on purpose: these are a snapshot of the campaign, not a
 * reference to it. If marketing edits the brand roster mid-campaign, a member
 * who was already promised these terms keeps them.
 */
export interface GiftConditions {
  /** Minimum transaction value. Measured against the cart total. */
  minPurchase: number;
  /** Business ids the gift may be redeemed at. Empty = any brand. */
  eligibleBrandIds: string[];
}

/**
 * Status vocabulary is deliberately identical to `UserVoucher.status`
 * (voucher.types.ts) so every status-rendering habit in the app transfers.
 * `used` and `expired` are both terminal — there is no way back out, which is
 * how "no tier ladder" is enforced structurally rather than by convention.
 */
export type OpeningGiftStatus = 'active' | 'used' | 'expired';

export interface OpeningGift {
  id: string;
  campaignId: string;
  /** E.164 phone. The identity the gift is keyed on. */
  phoneKey: string;

  amount: number;
  currency: string;

  grantedAt: string;
  expiresAt: string;
  status: OpeningGiftStatus;

  conditions: GiftConditions;

  /** Set only when status === 'used'. */
  usedAt?: string;
  redeemedBusinessId?: string;
  redeemedVoucherId?: string;
  redeemedSubtotal?: number;
}

/**
 * The outcome of resolving eligibility at OTP.
 *
 * There is no stored `not-eligible` record — the absence of a grant *is* that
 * state. `granted` versus `already-granted` is what lets the reveal fire
 * exactly once: a returning member should not re-celebrate an old gift.
 */
export type GiftResolution =
  | { outcome: 'granted'; gift: OpeningGift }
  | { outcome: 'already-granted'; gift: OpeningGift }
  | { outcome: 'not-eligible'; reason: 'cap-full' | 'campaign-closed' | 'no-phone' }
  /** Google / Apple sign-in: no phone to key on, so nothing is decided. */
  | { outcome: 'not-resolved' };

/** Read-only campaign availability, for pre-auth UI. Never grants anything. */
export interface GiftAvailability {
  /** True when the campaign is live AND the cap still has room. */
  open: boolean;
  amount: number;
  currency: string;
  minPurchase: number;
  remainingSlots: number;
}
