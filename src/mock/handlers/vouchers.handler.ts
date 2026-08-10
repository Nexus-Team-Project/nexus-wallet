import { mockVouchers, mockUserVouchers } from '../data/vouchers.mock';
import { mockTransactions } from '../data/transactions.mock';
import type { Voucher, UserVoucher, VoucherCategory } from '../../types/voucher.types';

/** Redemption ("זיכוי") is only allowed within this many days of purchase. */
export const VOUCHER_REFUND_WINDOW_DAYS = 14;

export function isVoucherRefundEligible(uv: UserVoucher, now = Date.now()): boolean {
  if (uv.status !== 'active') return false;
  const ageMs = now - Date.parse(uv.purchasedAt);
  return ageMs <= VOUCHER_REFUND_WINDOW_DAYS * 86_400_000;
}

export async function mockGetVouchers(category?: VoucherCategory): Promise<Voucher[]> {
  if (category) return mockVouchers.filter(v => v.category === category);
  return [...mockVouchers];
}

export async function mockGetVoucherById(id: string): Promise<Voucher | undefined> {
  return mockVouchers.find(v => v.id === id);
}

export async function mockGetUserVouchers(status?: UserVoucher['status']): Promise<UserVoucher[]> {
  if (status) return mockUserVouchers.filter(v => v.status === status);
  return [...mockUserVouchers];
}

export async function mockPurchaseVoucher(voucherId: string): Promise<UserVoucher> {
  const voucher = mockVouchers.find(v => v.id === voucherId);
  if (!voucher) throw new Error('Voucher not found');
  return {
    id: `uv_${Date.now()}`, voucherId, voucher,
    purchasedAt: new Date().toISOString(), expiresAt: voucher.validUntil + 'T23:59:59Z',
    status: 'active', redemptionCode: `NXS-${Math.random().toString(36).substring(2, 6).toUpperCase()}`,
    qrCode: `https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=NXS-${Date.now()}`,
  };
}

/**
 * Self-reported "I already used this" — the holder tells us up front so we
 * don't waste a refund review on a voucher that was already spent. Idempotent.
 */
export async function mockMarkVoucherUsed(userVoucherId: string): Promise<UserVoucher> {
  const idx = mockUserVouchers.findIndex(v => v.id === userVoucherId);
  if (idx === -1) throw new Error('Voucher not found');
  const current = mockUserVouchers[idx];
  if (current.status === 'used') return current;

  const updated: UserVoucher = { ...current, status: 'used', usedAt: new Date().toISOString() };
  mockUserVouchers[idx] = updated;
  return updated;
}

/**
 * Request to credit a voucher's value back to the Nexus balance. Only valid
 * within the 14-day window and only while the voucher is still 'active'.
 *
 * The voucher leaves the wallet the moment this is called — a pending
 * transaction row stands in for it in the activity feed while a (simulated,
 * off-app) usage check runs. Resolving that check to a credit or a rejection
 * is not modeled live here; see the seeded 'refund' notifications for what
 * each outcome looks like once decided.
 */
export async function mockRequestVoucherRefund(userVoucherId: string): Promise<UserVoucher> {
  const idx = mockUserVouchers.findIndex(v => v.id === userVoucherId);
  if (idx === -1) throw new Error('Voucher not found');
  const current = mockUserVouchers[idx];
  if (current.status === 'refund_requested') return current;
  if (!isVoucherRefundEligible(current)) {
    throw new Error('Voucher is not eligible for a refund');
  }

  const requestedAt = new Date().toISOString();
  const updated: UserVoucher = { ...current, status: 'refund_requested', refundRequestedAt: requestedAt };
  mockUserVouchers[idx] = updated;

  const { voucher } = current;
  mockTransactions.unshift({
    id: `tx_refundreq_${Date.now()}`,
    type: 'refund',
    title: `Refund requested — ${voucher.merchantName}`,
    titleHe: `בקשת זיכוי — ${voucher.merchantName}`,
    description: 'Under review — credited to your Nexus balance once approved',
    descriptionHe: 'בבדיקה — יזוכה ליתרת הנקסוס שלך לאחר אישור',
    amount: voucher.discountedPrice,
    currency: voucher.currency,
    status: 'pending',
    merchantName: voucher.merchantName,
    merchantLogo: voucher.merchantLogo,
    voucherId: current.voucherId,
    createdAt: requestedAt,
  });

  return updated;
}
