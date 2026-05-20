import { mockWallet } from '../data/wallet.mock';
import type { Wallet } from '../../types/wallet.types';

export async function mockGetWallet(): Promise<Wallet> {
  return { ...mockWallet };
}
