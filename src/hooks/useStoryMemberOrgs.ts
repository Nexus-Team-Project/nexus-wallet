/**
 * useStoryMemberOrgs — shared helper for the stories' "join another
 * organization" picker.
 *
 * During onboarding the discovery picker can also list the organizations the
 * user already belongs to (the `member` role), so they can jump straight into
 * one instead of only being offered orgs to join. This hook supplies:
 *   - memberOrgs: the user's member orgs, shaped for TenantDiscoverySheet.
 *   - enterOrg:   open one of them. Choosing an org means leaving onboarding,
 *                 so we mark the profile complete (same as the stories X) to
 *                 avoid treating the user as new on the next login, then route
 *                 to that org's catalog.
 *
 * The switcher does NOT use this — it already lists member orgs in its own
 * dropdown; only the stories flow surfaces them inside the picker.
 */
import { useCallback } from 'react';
import { toast } from 'sonner';
import { useNavigate, useParams } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { useRegistrationStore } from '../stores/registrationStore';
import { getFirstOnboardingSlide } from '../utils/onboardingNavigation';
import { saveWalletProfile } from '../services/walletProfile.service';
import { createJoinRequests } from '../services/walletTenants.service';
import { joinResultToast } from '../lib/joinToast';
import type { MemberOrgOption } from '../components/wallet/TenantDiscoverySheet';

export interface UseStoryMemberOrgs {
  /** The user's member organizations, ready to pass to TenantDiscoverySheet. */
  memberOrgs: MemberOrgOption[];
  /** Open a member org: mark onboarding complete, refresh, route to its catalog. */
  enterOrg: (tenantId: string) => Promise<void>;
  /** Leave onboarding for the general Nexus catalog (marks profile complete). */
  enterEcosystem: () => Promise<void>;
  /** Go fill the onboarding questions (onboarding stamps completedAt at its end). */
  fillOnboarding: () => void;
  /**
   * Submit a join request chosen from a stories picker and route on the outcome:
   *   - auto-accepted -> refresh /api/me + go to the celebration screen.
   *   - pending (created or already-pending) -> go to the pending-approval screen.
   *   - otherwise (insert failure / empty) -> toast.
   * @returns true when it navigated to a result screen, so the caller knows NOT
   *          to run its own "continue onboarding" follow-up.
   */
  submitJoin: (tenantIds: string[]) => Promise<boolean>;
}

/**
 * @returns the user's member orgs and a handler that opens one of them.
 */
export function useStoryMemberOrgs(): UseStoryMemberOrgs {
  const { lang = 'he' } = useParams();
  const navigate = useNavigate();
  const { me, reload } = useAuth();

  // Wallet membership = the 'member' role only. Tenants the user merely
  // administers (privileged roles) are dashboard contexts, not browsable
  // wallet catalogs, so they are excluded here.
  const memberOrgs: MemberOrgOption[] = (me?.memberships ?? [])
    .filter((m) => m.isMember)
    .map((m) => ({ tenantId: m.tenantId, tenantName: m.tenantName, logoUrl: m.logoUrl }));

  const enterOrg = useCallback(
    async (tenantId: string): Promise<void> => {
      // Stamp completedAt so a skipped-onboarding user is not shown the
      // stories again next time. Non-fatal if it fails — we still navigate.
      try {
        await saveWalletProfile({ complete: true });
      } catch (e) {
        console.error('[wallet] mark onboarding complete on enter-org failed (non-fatal):', e);
      }
      useRegistrationStore.getState().completeRegistration();
      await reload();
      navigate(`/${lang}/store?tenant=${encodeURIComponent(tenantId)}`, { replace: true });
    },
    [lang, navigate, reload],
  );

  const enterEcosystem = useCallback(async (): Promise<void> => {
    try {
      await saveWalletProfile({ complete: true });
    } catch (e) {
      console.error('[wallet] mark onboarding complete on enter-ecosystem failed (non-fatal):', e);
    }
    useRegistrationStore.getState().completeRegistration();
    await reload();
    navigate(`/${lang}/store?ecosystem=1`, { replace: true });
  }, [lang, navigate, reload]);

  const fillOnboarding = useCallback((): void => {
    const firstSlide = getFirstOnboardingSlide(useRegistrationStore.getState());
    navigate(`/${lang}/register/onboarding/${firstSlide}`);
  }, [lang, navigate]);

  const submitJoin = useCallback(
    async (tenantIds: string[]): Promise<boolean> => {
      if (tenantIds.length === 0) return false;
      try {
        const result = await createJoinRequests(tenantIds);
        if (result.autoAccepted.length > 0) {
          // Auto-accepted: the user is a member now. Refresh /api/me so the org
          // (and its name) is available to the celebration screen, then route
          // there. We celebrate the first auto-accepted org.
          await reload();
          const tid = result.autoAccepted[0]!;
          navigate(
            `/${lang}/auth-flow/joined?tenant=${encodeURIComponent(tid)}`,
            { replace: true },
          );
          return true;
        }
        // Not auto-accepted but a request now exists (freshly created OR an
        // earlier one still pending) -> show the "waiting for admin approval"
        // screen for that org.
        const pendingId =
          result.created[0] ??
          result.skipped.find((s) => s.reason === 'already_pending')?.tenantId;
        if (pendingId) {
          navigate(
            `/${lang}/auth-flow/join-pending?tenant=${encodeURIComponent(pendingId)}`,
            { replace: true },
          );
          return true;
        }
        // Nothing actionable (e.g. insert failure) -> toast, let caller continue.
        joinResultToast(result, lang === 'he');
        return false;
      } catch (e) {
        console.error('[wallet-join] stories submit failed:', e);
        toast.error(lang === 'he' ? 'שליחת הבקשה נכשלה' : 'Could not send request');
        return false;
      }
    },
    [lang, navigate, reload],
  );

  return { memberOrgs, enterOrg, enterEcosystem, fillOnboarding, submitJoin };
}
