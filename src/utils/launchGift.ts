/**
 * Launch-gift applicability and order maths. Pure — no React, no react-query,
 * no router, no stores. Only types cross this boundary.
 *
 * This answers the second of the feature's two questions: not "does this person
 * have a gift?" (decided once, at OTP) but "can that gift be used on THIS
 * transaction?" — which depends only on the amount and the merchant.
 */
import type { OpeningGift } from '../types/gift.types';

export type GiftBlockReason =
  | 'no-gift'
  | 'already-redeemed'
  | 'expired'
  | 'not-launch-brand'
  | 'below-minimum';

export interface GiftApplicabilityInput {
  gift: OpeningGift | null;
  /** Route param. `undefined` is a legitimate input, not an error. */
  businessId: string | undefined;
  /** The figure the minimum is measured against. See the caller for which. */
  qualifyingAmount: number;
  /** Injectable so the result is deterministic under test. */
  now?: number;
}

export type GiftApplicability =
  | { applicable: true; amount: number; reason: null }
  | {
      applicable: false;
      amount: 0;
      reason: GiftBlockReason;
      /** Only for 'below-minimum'. How much more is needed. */
      shortfall?: number;
      minPurchase?: number;
    };

/**
 * Evaluate whether the gift can be applied.
 *
 * The CHECK ORDER is a product decision, not an implementation detail. When a
 * transaction fails both the brand test and the minimum test, telling the
 * member "add ₪40 more" is a lie — they would spend the ₪40 and still hit the
 * brand wall. Always surface the unfixable blocker first. Terminal states come
 * before both, so a spent gift never nags.
 */
export function evaluateLaunchGift({
  gift,
  businessId,
  qualifyingAmount,
  now = Date.now(),
}: GiftApplicabilityInput): GiftApplicability {
  if (!gift) return { applicable: false, amount: 0, reason: 'no-gift' };
  if (gift.status === 'used') {
    return { applicable: false, amount: 0, reason: 'already-redeemed' };
  }
  // Defend on both the flag and the date regardless of what the write side
  // guarantees — it makes this function correct in isolation.
  if (gift.status === 'expired' || Date.parse(gift.expiresAt) <= now) {
    return { applicable: false, amount: 0, reason: 'expired' };
  }

  const { eligibleBrandIds, minPurchase } = gift.conditions;
  const brandOk =
    eligibleBrandIds.length === 0 ||
    (!!businessId && eligibleBrandIds.includes(businessId));
  if (!brandOk) {
    return { applicable: false, amount: 0, reason: 'not-launch-brand' };
  }

  if (!Number.isFinite(qualifyingAmount) || qualifyingAmount < minPurchase) {
    return {
      applicable: false,
      amount: 0,
      reason: 'below-minimum',
      shortfall: Math.max(0, minPurchase - (Number.isFinite(qualifyingAmount) ? qualifyingAmount : 0)),
      minPurchase,
    };
  }

  return { applicable: true, amount: gift.amount, reason: null };
}

export interface OrderTotalsInput {
  /** Per-card face value. */
  unitAmount: number;
  qty: number;
  /** Percent, e.g. 20. */
  cashbackRate: number;
  /** 0 when no gift is applied. */
  giftAmount: number;
}

export interface OrderTotals {
  /** Pre-gift gross. */
  subtotal: number;
  /** Clamped to the subtotal. */
  giftApplied: number;
  /** What the member is actually charged. */
  cashDue: number;
  /** ALWAYS derived from the subtotal — see below. */
  cashbackAmount: number;
}

/**
 * Order maths for a voucher purchase.
 *
 * ⚠️ CASHBACK IS COMPUTED ON THE PRE-GIFT SUBTOTAL, NEVER ON THE CASH PAID.
 *
 * From the launch-bonus spec's economics table, verbatim: a ₪100 transaction
 * with the ₪25 gift applied → the member pays ₪75 in cash and receives ₪20
 * cashback, which is 20% of ₪100, not 20% of ₪75. The whole campaign is priced
 * on that. Changing `subtotal` to `cashDue` below is a one-token edit that
 * silently inverts the unit economics, so it is spelled out here rather than
 * left to be re-derived.
 */
export function computeOrderTotals({
  unitAmount,
  qty,
  cashbackRate,
  giftAmount,
}: OrderTotalsInput): OrderTotals {
  const subtotal = unitAmount * qty;
  // Clamped even though minPurchase currently makes this unreachable: a future
  // campaign with minPurchase < giftAmount would otherwise go negative.
  const giftApplied = Math.min(Math.max(0, giftAmount), subtotal);
  return {
    subtotal,
    giftApplied,
    cashDue: subtotal - giftApplied,
    cashbackAmount: Math.round((subtotal * cashbackRate) / 100),
  };
}
