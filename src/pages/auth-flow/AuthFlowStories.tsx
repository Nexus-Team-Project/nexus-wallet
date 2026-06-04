/**
 * AuthFlowStories — Instagram-style stories for the auth flow.
 * Fullscreen, white background, rich visuals — same style as StoriesPage.
 *
 * /:lang/auth-flow/new-user  → all flows (new user, pre-provisioned org, tenant)
 *                               flowType prop drives which step sequence is used.
 */

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useNavigate, useParams, useSearchParams } from 'react-router-dom';
import { useRegistrationStore } from '../../stores/registrationStore';
import { getFirstOnboardingSlide, getOnboardingTotalWithComplete } from '../../utils/onboardingNavigation';
import { useTenantStore } from '../../stores/tenantStore';
import { useAuth } from '../../contexts/AuthContext';
import { useLanguage } from '../../i18n/LanguageContext';
import { fetchPublicTenant } from '../../services/publicTenant.service';
import { saveWalletProfile } from '../../services/walletProfile.service';
import { setDefaultTenant } from '../../services/walletTenants.service';
import { setAffiliation, getAffiliation, finishWalletRegistration, resetRegistrationFinish } from '../../lib/registrationAffiliation';
import { resolveTenantColor } from '../../lib/tenantColor';
import { useImagePreloader } from '../../hooks/useImagePreloader';
import { SmartInsightsCarousel } from '../InsightsPage';
import GiftCardsPage from '../GiftCardsPage';
import WalletCardsPage from '../WalletCardsPage';
import NearbyMapPage from '../NearbyMapPage';
import TenantDiscoverySheet, { type MemberOrgOption } from '../../components/wallet/TenantDiscoverySheet';
import { useStoryMemberOrgs } from '../../hooks/useStoryMemberOrgs';

import {
  type FlowType,
  type OrgInfo,
  FLOW_IMAGES,
  FlowSkeleton,
  SlideNexusHero,
  SlideWelcomeOrg,
  SlideMatchScreen,
  useStoryFlow,
  StoryProgressBar,
  StoryCTABar,
} from '../../features/stories';

// ─── Slide transition variants ────────────────────────────────────────────────
const slideVariants = {
  enter: (dir: number) => ({ x: dir > 0 ? '100%' : '-100%', opacity: 0 }),
  center: { x: 0, opacity: 1 },
  exit: (dir: number) => ({ x: dir > 0 ? '-60%' : '60%', opacity: 0 }),
};

// ─── Smart story step definitions ─────────────────────────────────────────────
const smartStorySteps = [
  { id: 'story-insights', duration: 10000 },
  { id: 'story-gift-cards' },
  { id: 'story-wallet' },
  { id: 'story-nearby' },
];

const newUserSteps = [{ id: 'nexus-hero' }, ...smartStorySteps];
const orgUserSteps = [{ id: 'welcome-org' }, ...smartStorySteps];

// ─────────────────────────────────────────────────────────────────────────────
export default function AuthFlowStories({ flowType }: { flowType: FlowType }) {
  const { lang = 'he' } = useParams();
  const navigate = useNavigate();
  const [sp] = useSearchParams();
  const { t } = useLanguage();
  const { me, reload } = useAuth();
  const tenantConfig = useTenantStore((s) => s.config);
  const clearTenant  = useTenantStore((s) => s.clearTenant);
  const orgMember    = useRegistrationStore((s) => s.orgMember);
  const registrationPath  = useRegistrationStore((s) => s.registrationPath);

  // ── Image preloader ───────────────────────────────────────────────────────
  const { loaded: imagesLoaded, failed: failedImages } = useImagePreloader(FLOW_IMAGES);

  // Fresh stories run -> allow the end-of-registration navigation to fire once.
  useEffect(() => { resetRegistrationFinish(); }, []);

  // ── URL-driven org context ────────────────────────────────────────────────
  // The org now comes from the URL (?tenant=X) / membership, not a picker.
  // ?ecosystem=1 explicitly opts out of any tenant context.
  const urlTenantId = sp.get('ecosystem') === '1' ? null : sp.get('tenant');
  // Wallet membership = the 'member' role only. A tenant the user merely
  // administers (privileged role) is NOT a wallet member context.
  const membership = urlTenantId
    ? (me?.memberships ?? []).find((m) => m.tenantId === urlTenantId && m.isMember)
    : undefined;
  // Does the user hold ANY role (member or privileged) in the URL tenant?
  const hasAnyRoleInUrlTenant =
    !!urlTenantId && (me?.memberships ?? []).some((m) => m.tenantId === urlTenantId);
  // Non-member: a ?tenant=X is present, /api/me has loaded, and the user is
  // truly unaffiliated (no role at all) - so we offer to join. We never show
  // the join prompt to someone who already administers the tenant.
  const isNonMember = !!urlTenantId && me != null && !hasAnyRoleInUrlTenant;

  // ── Resolved public org name for the non-member join prompt ───────────────
  // Only fetched when we have a tenant in the URL the user does not belong to.
  const [publicOrgName, setPublicOrgName] = useState<string | null>(null);
  useEffect(() => {
    if (urlTenantId && !membership) {
      let active = true;
      fetchPublicTenant(urlTenantId).then((i) => {
        if (active) setPublicOrgName(i?.organizationName ?? null);
      });
      return () => { active = false; };
    }
  }, [urlTenantId, membership]);

  // ── Org name resolution order: membership → public tenant → store → orgMember.
  const resolvedOrgName =
    membership?.tenantName ?? publicOrgName ?? tenantConfig?.name ?? orgMember?.organizationName ?? null;

  // ── Survive a tab/browser close mid-signup ────────────────────────────────
  // Restore the tenant the user was signing into. Runs once on mount: when the
  // URL lost its ?tenant= (e.g. the browser reopened on an onboarding route, or
  // the user returned to the bare wallet URL) but a previous affiliation was
  // stashed, re-apply ?tenant= so the promos, branding, and final landing all
  // point back at that org instead of the Nexus catalog. An explicit
  // ?ecosystem=1 is respected and never overridden.
  useEffect(() => {
    if (urlTenantId || sp.get('ecosystem') === '1') return;
    const aff = getAffiliation();
    if (aff?.tenantId && aff.kind !== 'none') {
      const next = new URLSearchParams(sp);
      next.set('tenant', aff.tenantId);
      navigate({ search: next.toString() }, { replace: true });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Capture the URL tenant into the durable stash as soon as it is known, so a
  // close BEFORE the user reaches the questions (where commitTarget normally
  // records it) still remembers the org. Never clobbers a richer choice the
  // user already made (the !getAffiliation guard), and explicit match-screen
  // picks below overwrite it.
  useEffect(() => {
    if (!urlTenantId || getAffiliation()) return;
    setAffiliation(
      membership
        ? { kind: 'member', tenantId: urlTenantId, orgName: membership.tenantName }
        : { kind: 'join', tenantId: urlTenantId, orgName: resolvedOrgName ?? undefined },
    );
  }, [urlTenantId, membership, resolvedOrgName]);

  // ── "Continue with another organization" — opens the tenant-join discovery
  //    sheet from inside the stories (the bottom-right white text link). Picking
  //    an org here skips the rest of the promos and goes straight to the
  //    questions with that org as the target (a member org lands directly; a new
  //    org sends a join request when the questions start).
  const [showJoin, setShowJoin] = useState(false);
  // Shows a loading overlay while a join request resolves (network ~1s) so the
  // user gets feedback between proceeding and the questions appearing.
  const [joining, setJoining] = useState(false);
  const { memberOrgs } = useStoryMemberOrgs();

  // ── The org the user will affiliate with ─────────────────────────────────
  // A single "target" drives both the promo branding and the join that fires
  // when the questions start (or the stories are closed):
  //   - null            → no affiliation (Nexus / ecosystem catalog).
  //   - { isMember:true}→ an EXISTING membership: just land on it, no request.
  //   - { isMember:false}→ a NEW join: send the request when the questions begin.
  // `chosenTarget === undefined` means the user has not overridden the default
  // (the URL tenant for a non-member; otherwise none).
  type Target = { tenantId: string; orgName: string | null; isMember: boolean; brandColor?: string } | null;
  const [chosenTarget, setChosenTarget] = useState<Target | undefined>(undefined);
  // Default target: a non-member who arrived via ?tenant=X is, by default, trying
  // to join that tenant. Everyone else defaults to no affiliation. The URL
  // tenant's color rides on tenantConfig (built from the public endpoint).
  const defaultTarget: Target =
    isNonMember && urlTenantId
      ? { tenantId: urlTenantId, orgName: resolvedOrgName, isMember: false, brandColor: tenantConfig?.primaryColor }
      : null;
  const effectiveTarget: Target = chosenTarget !== undefined ? chosenTarget : defaultTarget;

  // ── Per-tenant promo color ────────────────────────────────────────────────
  // Brand the promo slides with the target tenant's color. A genuinely themed
  // tenant keeps its own color; tenants on the platform default (every public
  // tenant) get a stable, unique color hashed from their id, so the promos no
  // longer look identical for everyone. The chosen target's own brandColor wins
  // (so picking org Y on the match-screen shows Y's color, not the URL tenant's);
  // no target -> the Nexus default.
  const orgColor = resolveTenantColor(
    effectiveTarget?.brandColor ?? tenantConfig?.primaryColor,
    effectiveTarget?.tenantId,
  );

  // ── Match set (member-role orgs) shown on the match-screen as "continue" ──
  // ?tenant=X member -> [that org] (only X, by design); ?tenant=X non-member ->
  // his OTHER member orgs (so a user who came via X but belongs to Y can pick
  // Y); no ?tenant -> all member orgs; else the invited/pre-provisioned org.
  const memberMatchOrgs: MemberOrgOption[] = urlTenantId
    ? (membership
        ? [{ tenantId: membership.tenantId, tenantName: membership.tenantName, logoUrl: membership.logoUrl, brandColor: membership.brandColor }]
        : memberOrgs)
    : memberOrgs.length > 0
      ? memberOrgs
      : (orgMember
          ? [{ tenantId: orgMember.organizationId, tenantName: orgMember.organizationName, logoUrl: tenantConfig?.logo, brandColor: tenantConfig?.primaryColor }]
          : []);

  // ── The URL tenant offered as a JOIN option on the match-screen ───────────
  // Only when the user arrived via ?tenant=X, is NOT a member of X, AND has at
  // least one other membership to choose between. A brand-new user with only X
  // keeps the plain promos+join flow (no single-row screen).
  const joinTarget: MemberOrgOption | null =
    urlTenantId && !membership && memberMatchOrgs.length > 0
      ? { tenantId: urlTenantId, tenantName: resolvedOrgName ?? '', logoUrl: tenantConfig?.logo, brandColor: tenantConfig?.primaryColor }
      : null;

  // ── Whether this session has an org/tenant context (cosmetic: CTA bar
  //    "powered by", progress bar). True when there is any match or invite. ──
  const isOrgFlow = Boolean(orgMember || tenantConfig || membership || memberMatchOrgs.length > 0);

  // ── Flow label for ?flow= URL param — tracks which onboarding path the user
  //    arrived on. Based on registrationPath at entry time, not mid-flow state.
  const flowLabel: 'new-user' | 'pre-provisioned' =
    registrationPath === 'org-member-incomplete' ? 'pre-provisioned' : 'new-user';

  // ── Org name shown in the PROMO slides ────────────────────────────────────
  // The promos are branded with the effective target's name: the URL tenant for
  // a non-member, the org picked on the match-screen, or generic Nexus copy when
  // there is no affiliation.
  const promoOrgName = effectiveTarget?.orgName ?? null;

  // ── Resolved org passed to the welcome/match slides ───────────────────────
  // The slides accept an optional `org: OrgInfo | null` and fall back to the
  // tenant store / orgMember when null. When the org comes from the URL
  // (membership or public tenant) the store may be empty, so we synthesize a
  // minimal OrgInfo from promoOrgName + urlTenantId to guarantee a name.
  const resolvedOrgInfo: OrgInfo | null = promoOrgName
    ? {
        id: urlTenantId ?? membership?.tenantId ?? 'org',
        name: promoOrgName,
        initials: promoOrgName.slice(0, 2).toUpperCase(),
        color: orgColor,
        available: true,
        tenantId: urlTenantId ?? membership?.tenantId,
        logo: tenantConfig?.logo,
      }
    : null;

  // ── Initial step list ─────────────────────────────────────────────────────
  // When we MATCH the user to one or more member orgs, the match-screen is the
  // FIRST story: they choose their org / another org / no-affiliation up front,
  // THEN the promo slides play (re-branded with the chosen org), then the
  // questions. Every other case (non-member ?tenant=X, or no match) plays just
  // the promos — branded with the target org — and the CTA goes to the
  // questions, where the join (if any) is sent. There is no join-prompt screen.
  const baseSteps = flowType === 'new-user' ? newUserSteps : orgUserSteps;
  // Show the match-screen whenever there is at least one member org to offer as
  // a "continue" choice. The join target (X) only ever exists alongside member
  // orgs, so it never produces a screen on its own.
  const hasMatch = memberMatchOrgs.length >= 1;
  const initialSteps = hasMatch
    ? [{ id: 'match-screen', interactive: true }, ...baseSteps]
    : [...baseSteps];

  // ── If user pressed Back from onboarding/membership, restore match-screen ─
  // Also supports direct-linking via ?step=<stepId> so every slide has a URL.
  const [initialCurrent] = useState(() => {
    const flag = sessionStorage.getItem('nexus_return_match') === '1';
    if (flag) {
      sessionStorage.removeItem('nexus_return_match');
      return Math.max(0, initialSteps.findIndex(s => s.id === 'match-screen'));
    }
    // Restore from URL slug if present (e.g. ?step=welcome-org)
    const stepParam = new URLSearchParams(window.location.search).get('step');
    if (stepParam) {
      const idx = initialSteps.findIndex(s => s.id === stepParam);
      if (idx !== -1) return idx;
    }
    return 0;
  });

  // ── Step machine (navigation, auto-advance, tap) ─────────────────────────
  const {
    steps, setSteps,
    current, setCurrent,
    direction, setDirection,
    progress,
    goTo, handleTap,
  } = useStoryFlow({ initialSteps, imagesLoaded, initialCurrent });

  // ── Sync current step → URL ?step=<id>&flow=<label> ─────────────────────
  useEffect(() => {
    const stepId = steps[current]?.id;
    if (!stepId) return;
    const url = new URL(window.location.href);
    url.searchParams.set('step', stepId);
    url.searchParams.set('flow', flowLabel);
    window.history.replaceState(null, '', url.toString());
  }, [current, steps, flowLabel]);

  // ── Slide callbacks ───────────────────────────────────────────────────────

  /**
   * Record the chosen affiliation as an INTENT (no network here). A matched
   * member org records 'member' + makes it the default; a new join records the
   * 'join' intent that finishWalletRegistration sends at the very end (so the
   * phone + profile collected in the questions travel to the tenant). No target
   * = no affiliation. Called when the questions start and on close.
   * @param target the org to affiliate with, or null for no affiliation.
   */
  const commitTarget = async (target: Target): Promise<void> => {
    if (!target) {
      setAffiliation({ kind: 'none' });
      return;
    }
    if (target.isMember) {
      setAffiliation({ kind: 'member', tenantId: target.tenantId, orgName: target.orgName ?? undefined });
      try { await setDefaultTenant(target.tenantId); } catch { /* non-fatal */ }
      return;
    }
    // New join — recorded now, sent at completion.
    setAffiliation({ kind: 'join', tenantId: target.tenantId, orgName: target.orgName ?? undefined });
  };

  /**
   * Leave the promos for the onboarding questions. The affiliation is only
   * RECORDED here; the join request (if any) is sent at registration complete.
   * @param target the org to affiliate with (defaults to the effective target).
   */
  const proceedToQuestions = async (target: Target): Promise<void> => {
    await commitTarget(target);
    const firstSlide = getFirstOnboardingSlide(useRegistrationStore.getState());
    // Carry the org in the URL through the questions so a tab/browser restore
    // lands back on the same org instead of the Nexus catalog.
    const tq = target?.tenantId ? `?tenant=${encodeURIComponent(target.tenantId)}` : '';
    navigate(`/${lang}/register/onboarding/${firstSlide}${tq}`);
  };

  /** Advance from the match-screen (step 0) to the first promo slide. */
  const advanceToPromos = (): void => {
    const firstPromo = steps.findIndex((s) => s.id !== 'match-screen');
    goTo(firstPromo === -1 ? 0 : firstPromo);
  };

  /** Match-screen: continue with an existing membership (no new join). */
  const handleMatchContinue = (tenantId: string): void => {
    const org = memberMatchOrgs.find((o) => o.tenantId === tenantId);
    setChosenTarget({ tenantId, orgName: org?.tenantName ?? null, isMember: true, brandColor: org?.brandColor });
    // Persist the pick now so a close before the questions restores THIS org.
    setAffiliation({ kind: 'member', tenantId, orgName: org?.tenantName ?? undefined });
    // Make it the default now so the promos brand correctly; commitTarget repeats
    // this on the way to the questions (idempotent).
    void setDefaultTenant(tenantId).catch(() => { /* non-fatal */ });
    advanceToPromos();
  };

  /**
   * Match-screen: join the URL tenant the user is NOT yet a member of. Records a
   * NEW-JOIN target (no setDefaultTenant — not a member yet); the actual request
   * fires at registration complete, carrying the collected phone + profile.
   */
  const handleMatchJoin = (tenantId: string): void => {
    const orgName = joinTarget?.tenantName ?? resolvedOrgName ?? null;
    setChosenTarget({
      tenantId,
      orgName,
      isMember: false,
      brandColor: joinTarget?.brandColor,
    });
    // Persist the pick now so a close before the questions restores THIS org.
    setAffiliation({ kind: 'join', tenantId, orgName: orgName ?? undefined });
    advanceToPromos();
  };

  /** Match-screen: continue with no organization affiliation (Nexus catalog). */
  const handleMatchNoAffiliation = (): void => {
    setChosenTarget(null);
    // Explicit opt-out: drop any stashed org so a return does not re-attach one.
    setAffiliation({ kind: 'none' });
    clearTenant();
    advanceToPromos();
  };

  /**
   * Close (X) the stories. Phone is mandatory for Google sign-ups, so if it is
   * still required, closing routes the user INTO the phone screen rather than
   * completing — the phone cannot be bypassed. Otherwise skipping counts as
   * "onboarded" (we stamp completedAt): commit the affiliation, send the join at
   * completion, route + fire the single welcome/pending toast.
   */
  const handleClose = async (): Promise<void> => {
    const regState = useRegistrationStore.getState();
    const phoneStillNeeded =
      regState.missingFields.includes('phone') && !regState.phone && !me?.phone;
    if (phoneStillNeeded) {
      await commitTarget(effectiveTarget);
      // Keep the org in the URL so a tab/browser restore on the phone screen
      // resumes on the same org rather than the Nexus catalog.
      const tq = effectiveTarget?.tenantId ? `?tenant=${encodeURIComponent(effectiveTarget.tenantId)}` : '';
      navigate(`/${lang}/register/onboarding/${getFirstOnboardingSlide(regState)}${tq}`);
      return;
    }

    setJoining(true);
    try {
      await commitTarget(effectiveTarget);
      await saveWalletProfile({ complete: true });
    } catch (e) {
      console.error('[wallet] finalize on close failed (non-fatal):', e);
    }
    useRegistrationStore.getState().completeRegistration();
    await reload();
    await finishWalletRegistration({ navigate, lang, t, reload });
  };

  // ── Progress bar segment computation ─────────────────────────────────────
  const isMatchScreenActive = steps[current]?.id === 'match-screen';
  let barSegments: Array<{ key: string; isDone: boolean; isActive: boolean }>;

  if (isMatchScreenActive) {
    const onboardingTotal = getOnboardingTotalWithComplete(useRegistrationStore.getState()) + 1;
    barSegments = Array.from({ length: onboardingTotal }, (_, i) => ({
      key: `bar-${i}`,
      isDone:   false,
      isActive: i === 0,
    }));
  } else {
    const barSteps   = steps.filter(s => s.id !== 'match-screen' && s.id !== 'join-prompt');
    const barCurrent = barSteps.findIndex(s => s.id === steps[current]?.id);
    barSegments = barSteps.map((step, i) => ({
      key:      step.id,
      isDone:   i < barCurrent,
      isActive: i === barCurrent,
    }));
  }

  // ── Slides that own their own bottom UI (no CTA bar overlay) ─────────────
  const noCTASlides = ['match-screen'];

  // ─────────────────────────────────────────────────────────────────────────
  return (
    <div className="fixed inset-0 z-[100] bg-black flex flex-col">

      {/* ── Progress bar ── */}
      <div className="px-3 pt-3 pb-2 z-50">
        <StoryProgressBar segments={barSegments} progress={progress} />
      </div>

      {/* ── Close button. A dark translucent backdrop keeps the white X
            visible on light story slides (it vanished against them before). */}
      <button
        onClick={() => { void handleClose(); }}
        aria-label="Close"
        className="absolute top-3 left-3 z-50 w-9 h-9 flex items-center justify-center rounded-full bg-black/40 backdrop-blur-sm shadow-sm active:scale-95 transition-transform"
      >
        <span className="material-symbols-outlined text-white" style={{ fontSize: '20px' }}>close</span>
      </button>

      {/* ── Story content ── */}
      <div className="flex-1 relative overflow-hidden rounded-t-2xl" onClick={handleTap}>

        {/* Loading skeleton */}
        <AnimatePresence>
          {!imagesLoaded && (
            <motion.div key="skeleton" className="absolute inset-0"
              initial={{ opacity: 1 }} exit={{ opacity: 0 }} transition={{ duration: 0.3 }}>
              <FlowSkeleton />
            </motion.div>
          )}
        </AnimatePresence>

        {/* Slide switcher */}
        <AnimatePresence initial={false} custom={direction} mode="popLayout">
          {imagesLoaded && (
            <motion.div
              key={steps[current]?.id ?? current}
              custom={direction}
              variants={slideVariants}
              initial="enter"
              animate="center"
              exit="exit"
              transition={{ duration: 0.3, ease: [0.25, 0.46, 0.45, 0.94] }}
              className="absolute inset-0"
            >
              {steps[current]?.id === 'nexus-hero'  && <SlideNexusHero failedImages={failedImages} orgName={promoOrgName} accentColor={orgColor} />}
              {steps[current]?.id === 'welcome-org' && <SlideWelcomeOrg org={resolvedOrgInfo} />}
              {steps[current]?.id === 'story-insights'    && (
                <div className="w-full h-full flex flex-col items-center justify-center px-6 relative overflow-hidden" style={{ backgroundColor: 'var(--color-surface)' }} dir="rtl">
                  <SmartInsightsCarousel />
                </div>
              )}
              {steps[current]?.id === 'story-gift-cards'  && <GiftCardsPage />}
              {steps[current]?.id === 'story-wallet'      && <WalletCardsPage />}
              {steps[current]?.id === 'story-nearby'      && <NearbyMapPage />}
              {steps[current]?.id === 'match-screen'      && (
                <SlideMatchScreen
                  orgs={memberMatchOrgs}
                  joinTarget={joinTarget}
                  onContinueWith={handleMatchContinue}
                  onContinueJoin={handleMatchJoin}
                  onContinueNoAffiliation={handleMatchNoAffiliation}
                  onJoinOther={() => setShowJoin(true)}
                />
              )}
            </motion.div>
          )}
        </AnimatePresence>

        {/* ── Persistent CTA bar — hidden on slides that own their own bottom UI ── */}
        {!noCTASlides.includes(steps[current]?.id ?? '') && (
          <StoryCTABar
            isOrgFlow={isOrgFlow || isNonMember}
            steps={steps}
            setSteps={setSteps}
            setDirection={setDirection}
            setCurrent={setCurrent}
            goTo={goTo}
            orgColor={orgColor}
            onNewUserContinue={() => { void proceedToQuestions(effectiveTarget); }}
            onJoinOtherOrg={() => setShowJoin(true)}
            /* The match-screen is always behind us when the CTA shows, so the
               primary CTA always goes to the questions (never back to it). */
            skipToQuestions
          />
        )}
      </div>

      {/* Tenant-join discovery sheet, opened from the "continue with another
          organization" link. z-[200]+ so it layers above the stories overlay. */}
      {showJoin && (
        <TenantDiscoverySheet
          onClose={() => setShowJoin(false)}
          // Hide the org whose promos are showing - the user is already here, so
          // it must not appear under "find another organization".
          excludeTenantId={effectiveTarget?.tenantId ?? urlTenantId ?? undefined}
          onSubmit={(ids) => {
            setShowJoin(false);
            // Picking another org via the link skips the rest of the promos and
            // goes straight to the questions with that org as the target.
            if (ids.length > 0) {
              void proceedToQuestions({ tenantId: ids[0]!, orgName: null, isMember: false });
            }
          }}
          memberOrgs={memberOrgs}
          onPickMember={(id) => {
            setShowJoin(false);
            const org = (me?.memberships ?? []).find((m) => m.tenantId === id);
            void proceedToQuestions({ tenantId: id, orgName: org?.tenantName ?? null, isMember: true });
          }}
        />
      )}

      {/* Loading overlay while a join request resolves (network ~1s). */}
      {joining && (
        <div className="absolute inset-0 z-[300] flex items-center justify-center bg-black/55 backdrop-blur-sm">
          <div className="h-10 w-10 rounded-full border-[3px] border-white/30 border-t-white animate-spin" />
        </div>
      )}
    </div>
  );
}

export function NewUserFlow() {
  return <AuthFlowStories flowType="new-user" />;
}

export function OrgUserFlow() {
  return <AuthFlowStories flowType="org-user" />;
}
