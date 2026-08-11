import { mockWallet } from '../data/wallet.mock';
import { mockGetOpeningGift } from './gift.handler';
import type { Wallet } from '../../types/wallet.types';

export async function mockGetWallet(): Promise<Wallet> {
  const gift = await mockGetOpeningGift();
  const lockedBalance = gift?.status === 'active' ? gift.amount : 0;

  // Derive, never accumulate. Recomputing the total from the ledger on every
  // read makes grant / expire / redeem idempotent — replaying any of them
  // cannot double-count, and a stale write cannot drift the balance.
  return {
    ...mockWallet,
    balance: mockWallet.balance + lockedBalance,
    lockedBalance,
    availableBalance: mockWallet.balance,
  };
}
