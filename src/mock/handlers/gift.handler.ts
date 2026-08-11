/**
 * Opening-gift handler.
 *
 * ── The one invariant that matters ───────────────────────────────────────────
 * The PROBE never writes. The RESOLVER always writes.
 *
 * Eligibility is a cap-consuming decision, so deciding and reserving have to be
 * the same moment. If we let the UI ask "would this person be eligible?" and
 * granted later, two verifications could both observe slot 200 as free, and
 * there would be a window where the product promises money that never arrives.
 * mockGetGiftAvailability() is the only read-only entry point; it exists for
 * anonymous pre-auth copy and reserves nothing.
 */
import {
  readGrant,
  writeGrant,
  countGrants,
  getActiveKey,
  setActiveKey,
  resetLedger,
} from '../data/giftLedger.mock';
import { resolveCampaign } from '../data/campaigns.mock';
import { mockTransactions } from '../data/transactions.mock';
import type {
  GiftAvailability,
  GiftResolution,
  OpeningGift,
} from '../../types/gift.types';

/**
 * Expiry is materialized lazily on read rather than driven by a timer.
 * Breakage is a normal outcome of the campaign, not an error path — a gift that
 * quietly lapses cost nothing, which is the entire point of granting paper.
 */
function materialize(gift: OpeningGift, now = Date.now()): OpeningGift {
  if (gift.status !== 'active') return gift;
  if (Date.parse(gift.expiresAt) > now) return gift;
  const expired: OpeningGift = { ...gift, status: 'expired' };
  writeGrant(expired);
  return expired;
}

function pushGrantRow(gift: OpeningGift): void {
  mockTransactions.unshift({
    id: `tx_gift_${Date.now()}`,
    type: 'bonus',
    title: 'Welcome Bonus',
    titleHe: 'בונוס הצטרפות',
    description: 'New member bonus',
    descriptionHe: 'בונוס חבר חדש',
    amount: gift.amount,
    currency: gift.currency,
    status: 'completed',
    // Created from nothing — no cash stands behind it until it is redeemed.
    funding: 'promotional',
    createdAt: gift.grantedAt,
  });
}

/**
 * Resolve eligibility for a phone. Idempotent: calling twice with the same key
 * returns the existing grant and consumes no additional cap slot.
 *
 * Also stamps the ledger's activeKey, which is how every downstream read
 * (wallet, transaction page) knows whose gift to look at.
 */
export async function mockResolveOpeningGift(
  phoneKey: string | null,
  tenantId?: string | null,
): Promise<GiftResolution> {
  if (!phoneKey) return { outcome: 'not-eligible', reason: 'no-phone' };

  setActiveKey(phoneKey);

  const existing = readGrant(phoneKey);
  if (existing) {
    return { outcome: 'already-granted', gift: materialize(existing) };
  }

  const campaign = resolveCampaign(tenantId);
  if (!campaign) return { outcome: 'not-eligible', reason: 'campaign-closed' };

  const now = Date.now();
  if (now < Date.parse(campaign.startsAt) || now > Date.parse(campaign.endsAt)) {
    return { outcome: 'not-eligible', reason: 'campaign-closed' };
  }

  if (countGrants(campaign.id) >= campaign.maxRecipients) {
    return { outcome: 'not-eligible', reason: 'cap-full' };
  }

  const grantedAt = new Date(now);
  const expiresAt = new Date(now + campaign.expiryDays * 86_400_000);

  const gift: OpeningGift = {
    id: `gift_${now}`,
    campaignId: campaign.id,
    phoneKey,
    amount: campaign.giftAmount,
    currency: campaign.currency,
    grantedAt: grantedAt.toISOString(),
    expiresAt: expiresAt.toISOString(),
    status: 'active',
    // Snapshot, not a reference: a later roster edit must not retroactively
    // change the terms this member was promised.
    conditions: {
      minPurchase: campaign.minPurchase,
      eligibleBrandIds: [...campaign.launchBrandIds],
    },
  };

  writeGrant(gift);
  pushGrantRow(gift);

  return { outcome: 'granted', gift };
}

/** The signed-in member's gift, or null. Lazily materializes expiry. */
export async function mockGetOpeningGift(): Promise<OpeningGift | null> {
  const key = getActiveKey();
  if (!key) return null;
  const gift = readGrant(key);
  return gift ? materialize(gift) : null;
}

/**
 * Read-only campaign availability, for pre-auth copy. Reserves nothing.
 * When `open` is false the UI must not mention the gift at all.
 */
export async function mockGetGiftAvailability(
  tenantId?: string | null,
): Promise<GiftAvailability> {
  const campaign = resolveCampaign(tenantId);
  if (!campaign) {
    return { open: false, amount: 0, currency: 'ILS', minPurchase: 0, remainingSlots: 0 };
  }

  const now = Date.now();
  const inWindow =
    now >= Date.parse(campaign.startsAt) && now <= Date.parse(campaign.endsAt);
  const remainingSlots = Math.max(0, campaign.maxRecipients - countGrants(campaign.id));

  return {
    open: inWindow && remainingSlots > 0,
    amount: campaign.giftAmount,
    currency: campaign.currency,
    minPurchase: campaign.minPurchase,
    remainingSlots,
  };
}

/** Dev/demo only — wipe the ledger so the flow can be walked from scratch. */
export async function mockResetGiftLedger(): Promise<void> {
  resetLedger();
}

/** Dev/demo only — force the current member's gift to expire. */
export async function mockExpireOpeningGift(): Promise<OpeningGift | null> {
  const key = getActiveKey();
  if (!key) return null;
  const gift = readGrant(key);
  if (!gift) return null;
  const expired: OpeningGift = { ...gift, status: 'expired' };
  writeGrant(expired);
  return expired;
}

export interface RedeemGiftInput {
  businessId?: string;
  voucherId?: string;
  subtotal: number;
}

/**
 * Mark the gift consumed. Idempotent — a double-tapped CTA redeems once.
 * Returns the gift as it now stands, or null when there was nothing to redeem.
 */
export async function mockMarkGiftRedeemed(
  input: RedeemGiftInput,
): Promise<OpeningGift | null> {
  const key = getActiveKey();
  if (!key) return null;

  const current = readGrant(key);
  if (!current) return null;

  const gift = materialize(current);
  // Already terminal: return what exists rather than throwing. A thrown error
  // inside a payment-success path is worse than a silent no-op.
  if (gift.status !== 'active') return gift;

  const usedAt = new Date().toISOString();
  const redeemed: OpeningGift = {
    ...gift,
    status: 'used',
    usedAt,
    redeemedBusinessId: input.businessId,
    redeemedVoucherId: input.voucherId,
    redeemedSubtotal: input.subtotal,
  };
  writeGrant(redeemed);

  // Offsetting row so the ledger balances: +25 granted, −25 consumed.
  // Diverges from the amount-0 convention of the older redemption rows
  // (tx_006 / tx_008) deliberately — those record a voucher being shown at a
  // till, this records value actually leaving the balance.
  mockTransactions.unshift({
    id: `tx_giftuse_${Date.now()}`,
    type: 'redemption',
    title: 'Opening gift redeemed',
    titleHe: 'מימוש מתנת הפתיחה',
    description: 'Opening gift applied to a purchase',
    descriptionHe: 'מתנת הפתיחה נוצלה ברכישה',
    amount: -gift.amount,
    currency: gift.currency,
    status: 'completed',
    funding: 'promotional',
    voucherId: input.voucherId,
    createdAt: usedAt,
  });

  return redeemed;
}
