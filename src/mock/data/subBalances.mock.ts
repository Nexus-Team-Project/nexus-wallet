import type { SubBalance } from '../../types/wallet.types';

export const mockSubBalances: SubBalance[] = [
  { id: 'sb_001', amount: 1, currency: 'ILS', source: 'gift_card', validUntil: '2031-08-11', voucherId: 'v_spar_gift' },
  { id: 'sb_002', amount: 1, currency: 'ILS', source: 'voucher', validUntil: '2031-08-11', voucherId: 'v_001' },
];
