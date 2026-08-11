/**
 * Thin service wrapper so auth.service.ts has a single symbol to import and
 * the services/ → mock/ coupling lives in exactly one file. When the ledger
 * moves to a real backend, this signature does not change.
 */
import { giftApi } from '../api/gift.api';
import type { GiftResolution } from '../types/gift.types';

export function resolveOpeningGift(
  phoneE164: string | null,
  tenantId?: string | null,
): Promise<GiftResolution> {
  return giftApi.resolve(phoneE164, tenantId);
}
