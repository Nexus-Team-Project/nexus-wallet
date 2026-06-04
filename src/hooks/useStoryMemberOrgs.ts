/**
 * useStoryMemberOrgs — shared helper for the stories' "continue with another
 * organization" picker.
 *
 * Joins made from inside the stories are SILENT: no interstitial screen, no
 * toast. Instead the chosen affiliation is recorded in the registration stash
 * (`registrationAffiliation`) and surfaced once, as a welcome toast, when the
 * user finishes (or skips) the onboarding questions. This hook supplies:
 *   - memberOrgs: the user's member orgs, shaped for TenantDiscoverySheet.
 *   - enterOrg:   choose an EXISTING member org as the affiliation (kind
 *                 'member'); stays in the stories.
 *   - submitJoin: send a join request for a NEW org; records 'joined'
 *                 (auto-accept) or 'pending'; stays in the stories.
 *
 * The switcher does NOT use this — it has its own (toasting) join flow.
 */
import { useCallback } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { setAffiliation } from '../lib/registrationAffiliation';
import { createJoinRequests, setDefaultTenant } from '../services/walletTenants.service';
import { fetchPublicTenant } from '../services/publicTenant.service';
import type { MemberOrgOption } from '../components/wallet/TenantDiscoverySheet';

export interface UseStoryMemberOrgs {
  /** The user's member organizations, ready to pass to TenantDiscoverySheet. */
  memberOrgs: MemberOrgOption[];
  /**
   * Choose an existing member org as the affiliation (kind 'member'). Records
   * the stash + makes it the default tenant. Does NOT navigate — the user stays
   * in the stories and continues to the questions.
   */
  enterOrg: (tenantId: string) => Promise<void>;
  /**
   * Send a join request for a NEW org and record the affiliation silently:
   *   - auto-accepted -> stash 'joined' (+ refresh /api/me).
   *   - pending / already-pending -> stash 'pending'.
   * No navigation, no toast.
   * @returns true when an affiliation was recorded (the caller uses this as the
   *          "chosen via the link" flag so "קליק להמשך" skips the match-screen).
   */
  submitJoin: (tenantIds: string[]) => Promise<boolean>;
}

/**
 * @returns the user's member orgs + silent affiliation handlers.
 */
export function useStoryMemberOrgs(): UseStoryMemberOrgs {
  const { me, reload } = useAuth();

  // Wallet membership = the 'member' role only. Tenants the user merely
  // administers (privileged roles) are dashboard contexts, not browsable
  // wallet catalogs, so they are excluded here.
  const memberOrgs: MemberOrgOption[] = (me?.memberships ?? [])
    .filter((m) => m.isMember)
    .map((m) => ({ tenantId: m.tenantId, tenantName: m.tenantName, logoUrl: m.logoUrl, brandColor: m.brandColor }));

  const enterOrg = useCallback(
    async (tenantId: string): Promise<void> => {
      const org = (me?.memberships ?? []).find((m) => m.tenantId === tenantId);
      setAffiliation({ kind: 'member', tenantId, orgName: org?.tenantName });
      // Make it the post-onboarding landing context. Non-fatal if it fails.
      try {
        await setDefaultTenant(tenantId);
      } catch (e) {
        console.error('[wallet] set default tenant on enter-org failed (non-fatal):', e);
      }
    },
    [me],
  );

  const submitJoin = useCallback(
    async (tenantIds: string[]): Promise<boolean> => {
      if (tenantIds.length === 0) return false;
      try {
        const result = await createJoinRequests(tenantIds);

        if (result.autoAccepted.length > 0) {
          const joinedId = result.autoAccepted[0]!;
          // The user is a member now. Refresh /api/me and read the org name from
          // the membership (the public endpoint 404s for non-public orgs).
          const updated = await reload();
          const orgName =
            (updated?.memberships ?? []).find((m) => m.tenantId === joinedId)?.tenantName ??
            (await fetchPublicTenant(joinedId).catch(() => null))?.organizationName;
          // Persist the joined org as the default so the end-of-registration
          // landing reliably lands on its catalog.
          try {
            await setDefaultTenant(joinedId);
          } catch (e) {
            console.error('[wallet] set default on auto-join failed (non-fatal):', e);
          }
          setAffiliation({ kind: 'joined', tenantId: joinedId, orgName });
          return true;
        }

        const pendingId =
          result.created[0] ??
          result.skipped.find((s) => s.reason === 'already_pending')?.tenantId;
        if (pendingId) {
          const orgName = (await fetchPublicTenant(pendingId).catch(() => null))?.organizationName;
          setAffiliation({ kind: 'pending', tenantId: pendingId, orgName });
          return true;
        }
        return false;
      } catch (e) {
        console.error('[wallet-join] stories submit failed:', e);
        return false;
      }
    },
    [reload],
  );

  return { memberOrgs, enterOrg, submitJoin };
}
