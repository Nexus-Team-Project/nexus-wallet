import type { LaunchCampaign } from '../../types/campaign.types';

/**
 * Launch campaigns, keyed by id — mirroring the `mockTenants` record idiom.
 *
 * `launchBrandIds` holds Business ids from businesses.mock.ts. The roster is
 * intentionally partial: McDonald's (biz_001), Cinema City (biz_003), Aroma
 * (biz_004) and Shufersal (biz_009) are excluded so the "not a launch brand"
 * state is reachable while demoing.
 */
export const mockLaunchCampaigns: Record<string, LaunchCampaign> = {
  'launch-2026': {
    id: 'launch-2026',
    name: 'Nexus Launch 2026',
    nameHe: 'השקת נקסוס 2026',
    organizationId: null, // Nexus-wide
    giftAmount: 25,
    currency: 'ILS',
    minPurchase: 100,
    launchBrandIds: ['biz_002', 'biz_006', 'biz_007', 'biz_010', 'biz_011'],
    expiryDays: 30,
    maxRecipients: 200,
    startsAt: '2026-07-01T00:00:00Z',
    endsAt: '2026-12-31T23:59:59Z',
    active: true,
  },

  /** Tenant-scoped variant — proves the per-organization roster is real. */
  'launch-hapoel-ta': {
    id: 'launch-hapoel-ta',
    name: 'Hapoel TA Launch',
    nameHe: 'השקת הפועל תל אביב',
    organizationId: 'hapoel-ta',
    giftAmount: 25,
    currency: 'ILS',
    minPurchase: 100,
    launchBrandIds: ['biz_002', 'biz_010', 'biz_011'],
    expiryDays: 30,
    maxRecipients: 200,
    startsAt: '2026-07-01T00:00:00Z',
    endsAt: '2026-12-31T23:59:59Z',
    active: true,
  },
};

/** The campaign a member registering right now would be enrolled in. */
export const DEFAULT_CAMPAIGN_ID = 'launch-2026';

/**
 * Resolve the campaign for a tenant, falling back to the Nexus-wide one.
 * Returns null when nothing is currently running.
 */
export function resolveCampaign(tenantId?: string | null): LaunchCampaign | null {
  if (tenantId) {
    const scoped = Object.values(mockLaunchCampaigns).find(
      (c) => c.organizationId === tenantId && c.active,
    );
    if (scoped) return scoped;
  }
  const fallback = mockLaunchCampaigns[DEFAULT_CAMPAIGN_ID];
  return fallback?.active ? fallback : null;
}
