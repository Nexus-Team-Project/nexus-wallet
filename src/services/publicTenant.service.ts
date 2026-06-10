/**
 * Wallet client for the public tenant-info endpoint. Lets an anonymous
 * ?tenant=X page resolve the real org name/logo, and lets the non-member
 * stories branch show the target org's name. Returns null on 404 (tenant
 * not found / catalog not activated) so callers can fall back to the
 * ecosystem catalog.
 */
import { api } from '../lib/api';

export interface PublicTenantInfo {
  tenantId: string;
  organizationName: string;
  logoUrl?: string;
  /** Org brand color ("#rrggbb"); the first-login accent for this tenant. */
  brandColor?: string;
}

/**
 * Fetch a tenant's public name/logo.
 * @param tenantId domain tenantId from ?tenant=X
 * @returns public tenant info, or null when unavailable (404/any error).
 */
export async function fetchPublicTenant(tenantId: string): Promise<PublicTenantInfo | null> {
  try {
    return await api<PublicTenantInfo>(
      `/api/v1/public/tenants/${encodeURIComponent(tenantId)}`,
      { skipAuth: true },
    );
  } catch {
    // 404 or network error → treat tenant as unresolved; caller falls back.
    return null;
  }
}
