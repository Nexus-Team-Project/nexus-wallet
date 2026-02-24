import { useMemo } from 'react';
import { useGeolocation } from './useGeolocation';
import { useVouchers } from './useVouchers';
import { mockBranches } from '../mock/data/branches.mock';
import { mockBusinesses } from '../mock/data/businesses.mock';
import { haversineDistance } from '../utils/haversine';
import type { NearbyDeal, Branch } from '../types/branch.types';
import type { GeolocationPermission } from '../stores/geolocationStore';

interface UseNearbyDealsReturn {
  deals: NearbyDeal[];
  isLoading: boolean;
  isError: boolean;
  refetch: () => void;
  permission: GeolocationPermission;
  requestLocation: () => void;
}

/**
 * Map merchantName → businessId.
 * Handles name mismatches (e.g., voucher says "Aroma" but business is "Aroma Espresso Bar").
 */
function buildMerchantToBusinessMap(): Map<string, string> {
  const map = new Map<string, string>();
  for (const biz of mockBusinesses) {
    map.set(biz.name, biz.id);
    map.set(biz.nameHe, biz.id);
  }
  // Manual aliases for name mismatches
  map.set('Aroma', 'biz_004');
  return map;
}

const merchantToBusinessId = buildMerchantToBusinessMap();

/**
 * Find the nearest branch of a given business to the user's location.
 */
function findNearestBranch(
  businessId: string,
  userLat: number,
  userLng: number,
): { branch: Branch; distanceKm: number } | null {
  const bizBranches = mockBranches.filter((b) => b.businessId === businessId);
  if (bizBranches.length === 0) return null;

  let nearest = bizBranches[0];
  let minDist = haversineDistance(userLat, userLng, nearest.lat, nearest.lng);

  for (let i = 1; i < bizBranches.length; i++) {
    const d = haversineDistance(
      userLat,
      userLng,
      bizBranches[i].lat,
      bizBranches[i].lng,
    );
    if (d < minDist) {
      minDist = d;
      nearest = bizBranches[i];
    }
  }

  return { branch: nearest, distanceKm: minDist };
}

export function useNearbyDeals(maxResults = 8): UseNearbyDealsReturn {
  const {
    coords,
    permission,
    requestLocation,
    isLoading: geoLoading,
  } = useGeolocation();
  const { data: vouchers, isLoading: vouchersLoading, isError: vouchersError, refetch } = useVouchers();

  const isLoading = geoLoading || vouchersLoading;
  const isError = vouchersError;

  const deals = useMemo(() => {
    if (!coords || !vouchers) return [];

    const results: NearbyDeal[] = [];

    for (const voucher of vouchers) {
      // Only in-stock vouchers that haven't expired
      if (!voucher.inStock) continue;
      if (new Date(voucher.validUntil).getTime() < Date.now()) continue;

      const businessId = merchantToBusinessId.get(voucher.merchantName);
      if (!businessId) continue; // No matching business (e.g., Coursera, Escape TLV)

      const result = findNearestBranch(businessId, coords.lat, coords.lng);
      if (!result) continue;

      results.push({
        voucher,
        branch: result.branch,
        distanceKm: result.distanceKm,
      });
    }

    // Sort by proximity (nearest first)
    results.sort((a, b) => a.distanceKm - b.distanceKm);

    return results.slice(0, maxResults);
  }, [coords, vouchers, maxResults]);

  return { deals, isLoading, isError, refetch, permission, requestLocation };
}
