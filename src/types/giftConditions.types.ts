/**
 * Advanced gift conditions ("תנאים מתקדמים") — set per gift in the campaign's
 * "additional settings", shown on the benefit screen under the gift's details.
 *
 * Display rule: a condition is shown only if it was defined. Every field here
 * is optional, and an absent field renders nothing — no "unlimited" / "n/a"
 * rows. A gift with no conditions at all hides the whole section.
 *
 * Payment order is deliberately absent: it's a wallet preference the user
 * drags into place, not a gift condition.
 */

/** One brand the gift can be used at, with the cashback per payment source. */
export interface GiftBrandRate {
  /** mockBusinesses id — name, logo and category come from there. */
  businessId: string;
  /** Cashback % when paying with the Nexus card (the brand's regular rate). */
  cardRate: number;
  /** Cashback % when paying from this gift's balance. */
  giftRate: number;
}

export type GiftUsageEnvironment = 'in_store' | 'online' | 'in_app' | 'p2p';

export interface GiftValidity {
  /** Gift-specific expiry (ISO date). */
  expiresAt: string;
  /** Locked gifts (the Nexus joining gift) also have a deadline to unlock. */
  unlockBy?: string;
  /** What happens to an unused balance at expiry. */
  onExpiryHe?: string;
  onExpiry?: string;
  /** Days before expiry a reminder is sent, e.g. [30, 7]. */
  remindersDaysBefore?: number[];
}

export interface GiftConditions {
  /** Participating stores — present only when the gift is limited to brands. */
  brands?: GiftBrandRate[];
  /**
   * True when a dedicated cashback rate was set (higher or lower than the
   * brand's regular rate). Rates live on `brands`; this flag decides whether
   * the "dedicated cashback rate" condition is shown.
   */
  dedicatedCashback?: boolean;
  validity?: GiftValidity;
  /** Present only when usage was restricted to some environments. */
  environments?: GiftUsageEnvironment[];
  /** Sending to other users' wallets. Absent = not allowed (and not shown). */
  transfer?: 'whole' | 'partial';
  /** Minimum transaction amount (₪) for using the gift. */
  minTransaction?: number;
  /** Max % of a transaction that may be paid from the gift. */
  maxSharePercent?: number;
  /** Shown only when it differs from the default (partial use + split tender). */
  singleUse?: boolean;
  /** What happens when the employee leaves the organisation. */
  onLeavingOrg?: 'keeps' | 'expires';
  /** What happens when a purchase paid with the gift is refunded. */
  onRefund?: 'returns_to_gift' | 'absorbed';
  /** Full terms, after legal review. */
  termsUrl?: string;
}
