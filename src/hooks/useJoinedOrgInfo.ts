/**
 * useJoinedOrgInfo - resolve an organization's display name + logo for the
 * post-join result screens.
 *
 * After an AUTO-ACCEPTED join the org is in the freshly-reloaded membership
 * list (with name + logo). After a PENDING request the user is not a member,
 * so we fall back to the public tenant endpoint. This hook hides that split:
 * it prefers the membership and otherwise fetches the public info.
 */
import { useEffect, useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { fetchPublicTenant } from '../services/publicTenant.service';

export interface JoinedOrgInfo {
  /** Best-known organization name (membership -> public -> fallback). */
  orgName: string;
  /** Organization logo URL, if any (the result screens fall back to Nexus). */
  orgLogo?: string;
}

/**
 * @param tenantId the domain tenantId the user joined / requested to join.
 * @param fallbackName name to show until/if nothing else resolves.
 * @returns the resolved org name + optional logo.
 */
export function useJoinedOrgInfo(tenantId: string | null, fallbackName: string): JoinedOrgInfo {
  const { me } = useAuth();
  const membership = (me?.memberships ?? []).find((m) => m.tenantId === tenantId);

  const [publicName, setPublicName] = useState<string | null>(null);
  const [publicLogo, setPublicLogo] = useState<string | undefined>(undefined);

  useEffect(() => {
    if (tenantId && !membership) {
      let active = true;
      fetchPublicTenant(tenantId).then((i) => {
        if (!active) return;
        setPublicName(i?.organizationName ?? null);
        setPublicLogo(i?.logoUrl);
      });
      return () => { active = false; };
    }
  }, [tenantId, membership]);

  return {
    orgName: membership?.tenantName ?? publicName ?? fallbackName,
    orgLogo: membership?.logoUrl ?? publicLogo,
  };
}
