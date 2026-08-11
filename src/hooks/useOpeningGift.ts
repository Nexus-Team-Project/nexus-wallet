import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { giftApi, type RedeemGiftInput } from '../api/gift.api';
import { useAuthStore } from '../stores/authStore';
import { useTenantStore } from '../stores/tenantStore';

/**
 * The signed-in member's opening gift, or null.
 *
 * `enabled: isAuthenticated` is not just an optimization — the ledger's
 * activeKey deliberately survives logout (that is what stops a logged-out user
 * from being re-granted), so without this gate an anonymous browser would still
 * see someone's gift.
 */
export function useOpeningGift() {
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated);
  return useQuery({
    queryKey: ['openingGift'],
    queryFn: () => giftApi.get(),
    enabled: isAuthenticated,
  });
}

/**
 * Read-only campaign availability, for pre-auth copy. Never grants anything,
 * never consumes a cap slot. Safe to call while anonymous.
 */
export function useGiftAvailability() {
  const tenantId = useTenantStore((s) => s.tenantId);
  return useQuery({
    queryKey: ['giftAvailability', tenantId],
    queryFn: () => giftApi.getAvailability(tenantId),
  });
}

/**
 * Consume the gift on a purchase. This is the campaign's single conversion
 * event: the moment value created from nothing turns into value backed by cash
 * the member actually paid.
 */
export function useRedeemOpeningGift() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (input: RedeemGiftInput) => giftApi.markRedeemed(input),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['openingGift'] });
      queryClient.invalidateQueries({ queryKey: ['wallet'] });
      queryClient.invalidateQueries({ queryKey: ['transactions'] });
      queryClient.invalidateQueries({ queryKey: ['userVouchers'] });
    },
  });
}
