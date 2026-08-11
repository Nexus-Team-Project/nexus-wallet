import {
  mockResolveOpeningGift,
  mockGetOpeningGift,
  mockGetGiftAvailability,
  mockMarkGiftRedeemed,
  mockResetGiftLedger,
  mockExpireOpeningGift,
  type RedeemGiftInput,
} from '../mock/handlers/gift.handler';

export const giftApi = {
  /** Writes. Decides eligibility and reserves a cap slot. */
  resolve: (phoneKey: string | null, tenantId?: string | null) =>
    mockResolveOpeningGift(phoneKey, tenantId),
  get: () => mockGetOpeningGift(),
  /** Read-only. Safe to call from anonymous pre-auth UI. */
  getAvailability: (tenantId?: string | null) => mockGetGiftAvailability(tenantId),
  markRedeemed: (input: RedeemGiftInput) => mockMarkGiftRedeemed(input),
  // Dev/demo affordances, surfaced in FlowTestPage.
  reset: () => mockResetGiftLedger(),
  expire: () => mockExpireOpeningGift(),
};

export type { RedeemGiftInput };
