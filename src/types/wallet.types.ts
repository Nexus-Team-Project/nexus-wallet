export interface Wallet {
  id: string;
  userId: string;
  /**
   * The headline figure, INCLUDING any locked value. This is what TopBar and
   * the home BalanceCard render, and it stays inclusive on purpose: the whole
   * point of the opening gift is that the member sees the money immediately.
   * Redefining this as available-only would hide the gift in the two most
   * prominent places in the app.
   */
  balance: number;
  /** Value present but not yet spendable (e.g. an unredeemed opening gift). */
  lockedBalance?: number;
  /** balance − lockedBalance. What the member can actually spend today. */
  availableBalance?: number;
  currency: string;
  totalEarned: number;
  totalSpent: number;
  totalSaved: number;
  lastUpdated: string;
}

/**
 * A chunk of the Nexus balance that came from a gift card or voucher rather
 * than a top-up or cashback. Tracked separately because Israeli gift-card
 * regulation gives each chunk its own expiry (`validUntil`) — unlike the
 * rest of the balance, this money can lapse.
 */
export interface SubBalance {
  id: string;
  amount: number;
  currency: string;
  source: 'gift_card' | 'voucher';
  validUntil: string;
  /** The Voucher (see voucher.types.ts) this chunk's art + terms come from. */
  voucherId?: string;
}
