/**
 * Launch campaign — the configuration a launch bonus is issued against.
 *
 * Deliberately NOT a field on TenantConfig: tenantStore JSON-serializes the
 * whole config into localStorage (`nexus_tenant`), so a stale persisted copy
 * would resurrect an exhausted recipient cap.
 */
export interface LaunchCampaign {
  id: string;
  name: string;
  nameHe: string;

  /** null = Nexus-wide. Otherwise a TenantConfig id from mockTenants. */
  organizationId: string | null;

  /** Face value of the opening gift. */
  giftAmount: number;
  currency: string;

  /** Qualifying-purchase threshold. A transaction below this cannot redeem. */
  minPurchase: number;

  /**
   * Business ids (`biz_001`…) the gift may be redeemed at. Ids, not names —
   * the transaction page only ever has the route's `businessId` in hand.
   */
  launchBrandIds: string[];

  /** Days the gift stays alive after it is granted. */
  expiryDays: number;

  /** Hard budget ceiling: the campaign stops granting past this many people. */
  maxRecipients: number;

  startsAt: string;
  endsAt: string;
  active: boolean;
}
