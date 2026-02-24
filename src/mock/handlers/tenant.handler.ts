import { mockTenants } from '../data/tenants.mock';
import type { TenantConfig } from '../../types/tenant.types';

/** Look up tenant config by URL slug */
export function lookupTenant(tenantId: string): TenantConfig | null {
  return mockTenants[tenantId] ?? null;
}

/** Map organizationId → tenant slug (simulates backend lookup) */
const orgToTenant: Record<string, string> = {
  org_001: 'acme-corp',
  org_002: 'startup-il',
};

/** Look up tenant config by organizationId */
export function lookupTenantByOrg(organizationId: string): TenantConfig | null {
  const slug = orgToTenant[organizationId];
  return slug ? (mockTenants[slug] ?? null) : null;
}

/** Look up tenant config by customerId (ח"פ) */
export function lookupTenantByCustomerId(customerId: string): TenantConfig | null {
  return Object.values(mockTenants).find((t) => t.customerId === customerId) ?? null;
}
