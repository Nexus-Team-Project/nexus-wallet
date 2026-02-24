import { mockGetVouchers, mockGetVoucherById, mockGetUserVouchers, mockPurchaseVoucher } from '../mock/handlers/vouchers.handler';
import type { VoucherCategory, UserVoucher } from '../types/voucher.types';

/** DEV ONLY — set to true to make getAll() throw, simulating a network error */
export let __devForceVouchersError = false;
export function __devSetVouchersError(value: boolean) {
  __devForceVouchersError = value;
}

export const vouchersApi = {
  getAll: (category?: VoucherCategory) => {
    if (__devForceVouchersError) {
      return Promise.reject(new Error('Dev: simulated network error'));
    }
    return mockGetVouchers(category);
  },
  getById: (id: string) => mockGetVoucherById(id),
  getUserVouchers: (status?: UserVoucher['status']) => mockGetUserVouchers(status),
  purchase: (voucherId: string) => mockPurchaseVoucher(voucherId),
};
