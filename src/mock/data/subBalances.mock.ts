import type { SubBalance } from '../../types/wallet.types';
import type { Voucher } from '../../types/voucher.types';
import { mockVouchers } from './vouchers.mock';

/**
 * Card face for the Nexus joining gift. Kept out of `mockVouchers` on
 * purpose — it isn't a store product, only a wallet gift.
 */
export const nexusJoinGiftCard: Voucher = {
  id: 'v_nexus_join', title: 'Gift from Nexus', titleHe: 'מתנה מנקסוס',
  description: 'Nexus joining gift', descriptionHe: 'מתנת הצטרפות מנקסוס',
  merchantName: 'מתנה מנקסוס', merchantLogo: '🎁', category: 'shopping',
  originalPrice: 50, discountedPrice: 0, discountPercent: 0, currency: 'ILS',
  image: '🎁', validUntil: '2027-06-30',
  termsAndConditions: 'Unlocks once you earn the threshold in cashback in the wallet.',
  termsAndConditionsHe: 'נפתחת כשצוברים את סכום הסף בקאשבק בארנק.',
  brandColor: '#635bff', brandLogo: '/nexus-white-wide-logo.png',
  inStock: true, popular: false,
};

/** The voucher (card face + terms) a sub-balance came from. */
export function voucherForSubBalance(sb: SubBalance): Voucher | undefined {
  if (sb.voucherId === nexusJoinGiftCard.id) return nexusJoinGiftCard;
  return mockVouchers.find((v) => v.id === sb.voucherId);
}

/**
 * Gift sub-balances. The set is chosen so the purchase-tailored balance
 * sheet (NexusBalanceSheet) shows every state on the Castro voucher page
 * (biz_002, default ₪300): a locked Nexus joining gift, three gifts that
 * work there, and five that don't, each for a different reason — see
 * giftConditions.mock.ts.
 */
export const mockSubBalances: SubBalance[] = [
  // ── Locked: the Nexus joining gift — visible, not usable yet ──
  { id: 'sb_009', amount: 50, currency: 'ILS', source: 'nexus_gift', validUntil: '2027-06-30', voucherId: 'v_nexus_join',
    event: 'Joining gift', eventHe: 'מתנת הצטרפות', originalAmount: 50,
    // threshold / progress are CASHBACK earned (accumulation framing), not spend.
    // 30-day window from the claim (demo: claimed 2026-10-01).
    lock: { threshold: 100, progress: 12, unlockBy: '2026-10-31' } },
  // ── Work at Castro ──
  { id: 'sb_001', amount: 120, currency: 'ILS', source: 'gift_card', validUntil: '2026-12-31', voucherId: 'v_spar_gift',
    event: 'Rosh Hashanah gift', eventHe: 'מתנה לראש השנה', originalAmount: 150 },
  { id: 'sb_003', amount: 50, currency: 'ILS', source: 'gift_card', validUntil: '2027-06-30', voucherId: 'v_isrotel_gift',
    event: 'Joining gift', eventHe: 'מתנת הצטרפות', originalAmount: 50 },
  { id: 'sb_004', amount: 80, currency: 'ILS', source: 'voucher', validUntil: '2027-01-31', voucherId: 'v_011',
    event: 'Birthday gift', eventHe: 'מתנת יום הולדת', originalAmount: 100 },
  // ── Don't work at Castro ──
  { id: 'sb_005', amount: 200, currency: 'ILS', source: 'voucher', validUntil: '2027-03-31', voucherId: 'v_009',
    event: 'Passover gift', eventHe: 'מתנה לפסח', originalAmount: 200 },
  { id: 'sb_006', amount: 60, currency: 'ILS', source: 'voucher', validUntil: '2027-02-28', voucherId: 'v_004',
    originalAmount: 60 },
  { id: 'sb_007', amount: 150, currency: 'ILS', source: 'voucher', validUntil: '2027-05-31', voucherId: 'v_007',
    event: 'Excellence award', eventHe: 'מענק הצטיינות', originalAmount: 150 },
  { id: 'sb_008', amount: 400, currency: 'ILS', source: 'voucher', validUntil: '2027-08-31', voucherId: 'v_020',
    originalAmount: 400 },
  { id: 'sb_002', amount: 40, currency: 'ILS', source: 'voucher', validUntil: '2026-03-22', voucherId: 'v_001',
    originalAmount: 100 },
];
