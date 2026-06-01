/**
 * Wallet tenant-discovery + join-request API wrappers.
 *
 * Spec: docs/superpowers/specs/2026-05-25-nexus-wallet-auth-design.md section 6
 */
import { api } from '../lib/api';

export interface DiscoverableTenant {
  tenantId: string;
  tenantName: string;
  logoUrl?: string;
}

export interface JoinRequestRecord {
  id: string;
  tenantId: string;
  tenantName?: string;
  status: 'pending' | 'approved' | 'denied' | 'auto_accepted';
  createdAt: string;
  decidedAt?: string;
  denyReason?: string;
}

export interface CreateJoinResult {
  created: string[];
  autoAccepted: string[];
  skipped: Array<{ tenantId: string; reason: string }>;
}

/** Search tenants that have activated Benefits Catalog. */
export async function discoverTenants(query?: string): Promise<DiscoverableTenant[]> {
  const qs = query?.trim() ? `?q=${encodeURIComponent(query.trim())}` : '';
  const r = await api<{ tenants: DiscoverableTenant[] }>(`/api/v1/wallet/tenants/discover${qs}`);
  return r.tenants;
}

/** POST one or more join requests in one call. */
export async function createJoinRequests(tenantIds: string[]): Promise<CreateJoinResult> {
  return api<CreateJoinResult>('/api/v1/wallet/join-requests', {
    method: 'POST',
    body: { tenantIds },
  });
}

/**
 * Set the member's default landing context (the tenant or ecosystem they
 * land on at login when no ?tenant is in the URL). Pass a tenantId the
 * caller belongs to, or null for the Nexus (ecosystem) catalog.
 */
export async function setDefaultTenant(tenantId: string | null): Promise<void> {
  await api('/api/v1/wallet/default-tenant', { method: 'PATCH', body: { tenantId } });
}

/** List the caller's own join requests. */
export async function listMyJoinRequests(): Promise<JoinRequestRecord[]> {
  const r = await api<{ requests: JoinRequestRecord[] }>('/api/v1/wallet/join-requests/mine');
  return r.requests;
}

/** Ecosystem-approved offers excluding offers adopted by user's tenants. */
export async function fetchEcosystemOffers(query?: string, limit = 50): Promise<{
  items: Array<{
    id: string;
    title: string;
    description?: string;
    category?: string;
    imageUrls?: string[];
    imageUrl?: string;
    member_price?: number;
    market_price?: number;
    displayPrice?: number;
    validUntil?: string;
    tags?: string[];
  }>;
  total: number;
}> {
  const params = new URLSearchParams();
  if (query?.trim()) params.set('q', query.trim());
  params.set('limit', String(limit));
  return api(`/api/v1/wallet/ecosystem-offers?${params.toString()}`);
}
