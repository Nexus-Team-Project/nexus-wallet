import type { GiftConditions } from '../../types/giftConditions.types';

/**
 * Advanced conditions per gift, keyed by voucher id.
 *
 * Built to demo every state of the purchase-tailored balance sheet on the
 * Castro voucher page (biz_002, default ₪300):
 *   works       — SPAR (brand list incl. Castro, 80% cap, dedicated cashback),
 *                 Isrotel joining gift (no restrictions), H&M (fashion brands)
 *   doesn't     — Shufersal (wrong brand), Aroma (in-store only),
 *                 KSP (₪500 minimum — "almost"), IKEA (single use, balance >
 *                 purchase), McDonald's (expired)
 *
 * SPAR is also the "full case" on the benefit sheet — every condition set.
 */
export const mockGiftConditions: Record<string, GiftConditions> = {
  v_spar_gift: {
    brands: [
      { businessId: 'biz_009', cardRate: 4, giftRate: 6 },
      { businessId: 'biz_006', cardRate: 6, giftRate: 8 },
      { businessId: 'biz_004', cardRate: 8, giftRate: 8 },
      { businessId: 'biz_002', cardRate: 12, giftRate: 10 },
      { businessId: 'biz_010', cardRate: 10, giftRate: 10 },
      { businessId: 'biz_014', cardRate: 9, giftRate: 12 },
      { businessId: 'biz_003', cardRate: 7, giftRate: 7 },
    ],
    dedicatedCashback: true,
    validity: {
      expiresAt: '2026-12-31',
      onExpiryHe: 'יתרה שלא נוצלה עד התאריך פוקעת ולא ניתן להשתמש בה.',
      onExpiry: 'Any balance left on this date expires and can no longer be used.',
      remindersDaysBefore: [30, 7],
    },
    environments: ['in_store', 'online', 'in_app'],
    transfer: 'partial',
    minTransaction: 50,
    maxSharePercent: 80,
    onLeavingOrg: 'keeps',
    onRefund: 'returns_to_gift',
    termsUrl: '#',
  },
  // Nexus joining gift — locked until the threshold; two dates (unlock, use).
  v_nexus_join: {
    validity: {
      unlockBy: '2026-10-31',
      expiresAt: '2027-06-30',
      onExpiryHe: 'מתנה שלא נפתחה עד התאריך פוקעת.',
      onExpiry: 'A gift not unlocked by this date expires.',
      remindersDaysBefore: [14],
    },
    environments: ['in_store', 'online', 'in_app'],
    // General card (no brand list). Sending to other wallets isn't offered
    // before unlocking, so `transfer` stays unset and isn't shown.
    onLeavingOrg: 'keeps',
    onRefund: 'returns_to_gift',
    termsUrl: '#',
  },
  // Joining gift from the organisation — usable anywhere, just an expiry.
  v_isrotel_gift: {
    validity: { expiresAt: '2027-06-30', remindersDaysBefore: [14] },
  },
  // Fashion-only gift with a dedicated cashback rate.
  v_011: {
    brands: [
      { businessId: 'biz_010', cardRate: 10, giftRate: 15 },
      { businessId: 'biz_002', cardRate: 12, giftRate: 15 },
      { businessId: 'biz_014', cardRate: 9, giftRate: 15 },
      { businessId: 'biz_011', cardRate: 8, giftRate: 15 },
    ],
    dedicatedCashback: true,
    validity: { expiresAt: '2027-01-31' },
  },
  // Supermarket-only — not at Castro.
  v_009: {
    brands: [{ businessId: 'biz_009', cardRate: 4, giftRate: 4 }],
    validity: { expiresAt: '2027-03-31' },
  },
  // In-store only — not usable for an in-app voucher purchase.
  v_004: {
    environments: ['in_store'],
    validity: { expiresAt: '2027-02-28' },
  },
  // High minimum — the "almost" case.
  v_007: {
    minTransaction: 500,
    validity: { expiresAt: '2027-05-31' },
  },
  // Must be used in one go — balance is bigger than the purchase.
  v_020: {
    singleUse: true,
    validity: { expiresAt: '2027-08-31' },
  },
  // Expired.
  v_001: {
    validity: {
      expiresAt: '2026-03-22',
      remindersDaysBefore: [7],
    },
  },
};
