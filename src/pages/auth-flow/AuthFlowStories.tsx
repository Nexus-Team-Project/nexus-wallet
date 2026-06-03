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
import { setAffiliation, finishWalletRegistration, resetRegistrationFinish } from '../../lib/registrationAffiliation';
import { useImagePreloader } from '../../hooks/useImagePreloader';
import { SmartInsightsCarousel } from '../InsightsPage';
import GiftCardsPage from '../GiftCardsPage';
import WalletCardsPage from '../WalletCardsPage';
import NearbyMapPage from '../NearbyMapPage';
import SlideJoinPrompt from '../../components/auth-flow/SlideJoinPrompt';
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

  // ── "Continue with another organization" — opens the tenant-join discovery
  //    sheet from inside the stories (the bottom-right white text link). The
  //    picker also lists the user's own member orgs so they can jump straight
  //    into one (enterOrg). submitJoin (shared) celebrates an auto-accepted
  //    join or toasts a pending one.
  const [showJoin, setShowJoin] = useState(false);
  // True once the user has actively chosen an org via the bottom link this
  // session — then "קליק להמשך" skips the match-screen and goes to questions.
  const [linkChosen, setLinkChosen] = useState(false);
  // Shows a loading overlay while a join request resolves (network ~1s) so the
  // user gets feedback between picking an org and the questions appearing.
  const [joining, setJoining] = useState(false);
  const { memberOrgs, enterOrg, submitJoin } = useStoryMemberOrgs();

  // ── Match set (member-role orgs) shown on the match-screen ────────────────
  // ?tenant=X member -> [that org]; no ?tenant -> all member orgs; else the
  // invited/pre-provisioned org (so that path keeps its match-screen).
  const matchOrgs: MemberOrgOption[] = urlTenantId
    ? (membership
        ? [{ tenantId: membership.tenantId, tenantName: membership.tenantName, logoUrl: membership.logoUrl }]
        : [])
    : memberOrgs.length > 0
      ? memberOrgs
      : (orgMember
          ? [{ tenantId: orgMember.organizationId, tenantName: orgMember.organizationName, logoUrl: tenantConfig?.logo }]
          : []);

  // ── Whether this session has an org/tenant context (cosmetic: CTA bar
  //    "powered by", progress bar). True when there is any match or invite. ──
  const isOrgFlow = Boolean(orgMember || tenantConfig || membership || matchOrgs.length > 0);

  // ── Flow label for ?flow= URL param — tracks which onboarding path the user
  //    arrived on. Based on registrationPath at entry time, not mid-flow state.
  const flowLabel: 'new-user' | 'pre-provisioned' =
    registrationPath === 'org-member-incomplete' ? 'pre-provisioned' : 'new-user';

  // ── Resolved org passed to the welcome/match slides ───────────────────────
  // The slides accept an optional `org: OrgInfo | null` and fall back to the
  // tenant store / orgMember when null. When the org comes from the URL
  // (membership or public tenant) the store may be empty, so we synthesize a
  // minimal OrgInfo from resolvedOrgName + urlTenantId to guarantee a name.
  const resolvedOrgInfo: OrgInfo | null = resolvedOrgName
    ? {
        id: urlTenantId ?? membership?.tenantId ?? 'org',
        name: resolvedOrgName,
        initials: resolvedOrgName.slice(0, 2).toUpperCase(),
        color: tenantConfig?.primaryColor ?? '#635bff',
        available: true,
        tenantId: urlTenantId ?? membership?.tenantId,
        logo: tenantConfig?.logo,
      }
    : null;

  // ── Initial step list ─────────────────────────────────────────────────────
  // When we MATCH the user to one or more member orgs, the match-screen is the
  // FIRST (and only) story — they choose their org / no-affiliation up front,
  // then go to the questions; the promo slides are skipped. Non-member ?tenant=X
  // still plays the promos then the join-prompt. No match -> just the promos
  // (CTA goes straight to the questions).
  const baseSteps = flowType === 'new-user' ? newUserSteps : orgUserSteps;
  const hasMatch = !isNonMember && matchOrgs.length >= 1;
  const initialSteps = hasMatch
    ? [{ id: 'match-screen', interactive: true }]
    : isNonMember
      ? [...baseSteps, { id: 'join-prompt', interactive: true }]
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

  const handleNewUserContinue = () => {
    const firstSlide = getFirstOnboardingSlide(useRegistrationStore.getState());
    navigate(`/${lang}/register/onboarding/${firstSlide}`);
  };

  /** Match-screen: continue with an existing membership (no new join). */
  const handleMatchContinue = (tenantId: string): void => {
    const org = matchOrgs.find((o) => o.tenantId === tenantId);
    setAffiliation({ kind: 'member', tenantId, orgName: org?.tenantName });
    void setDefaultTenant(tenantId).catch(() => { /* non-fatal */ });
    handleNewUserContinue();
  };

  /** Match-screen: continue with no organization affiliation (Nexus catalog). */
  const handleMatchNoAffiliation = (): void => {
    setAffiliation({ kind: 'none' });
    clearTenant();
    handleNewUserContinue();
  };

  /**
   * Close (X) the stories — skip the questions. Skipping still counts as
   * "onboarded" (we stamp completedAt) so the user is not shown the stories
   * again. Then route + welcome toast from the affiliation stash (e.g. an org
   * joined via the bottom link), defaulting to the Nexus catalog with no toast.
   */
  const handleClose = async (): Promise<void> => {
    try {
      await saveWalletProfile({ complete: true });
    } catch (e) {
      console.error('[wallet] mark onboarding complete on close failed (non-fatal):', e);
    }
    useRegistrationStore.getState().completeRegistration();
    await reload();
    finishWalletRegistration({ navigate, lang, t });
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

  // ── Org accent colour for CTA bar ─────────────────────────────────────────
  const orgColor = tenantConfig?.primaryColor ?? '#635bff';

  // ── Slides that own their own bottom UI (no CTA bar overlay) ─────────────
  const noCTASlides = ['match-screen', 'join-prompt'];

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
              {steps[current]?.id === 'nexus-hero'  && <SlideNexusHero failedImages={failedImages} orgName={resolvedOrgName} />}
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
                  orgs={matchOrgs}
                  onContinueWith={handleMatchContinue}
                  onContinueNoAffiliation={handleMatchNoAffiliation}
                  onJoinOther={() => setShowJoin(true)}
                />
              )}
              {steps[current]?.id === 'join-prompt'       && (
                <SlideJoinPrompt
                  tenantId={urlTenantId}
                  orgName={resolvedOrgName}
                  orgColor={orgColor}
                  orgLogo={tenantConfig?.logo}
                  mode="new"
                  onResolve={() => handleNewUserContinue()}
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
            onNewUserContinue={handleNewUserContinue}
            onJoinOtherOrg={() => setShowJoin(true)}
            skipToQuestions={linkChosen}
          />
        )}
      </div>

      {/* Tenant-join discovery sheet, opened from the "continue with another
          organization" link. z-[200]+ so it layers above the stories overlay. */}
      {showJoin && (
        <TenantDiscoverySheet
          onClose={() => setShowJoin(false)}
          onSubmit={async (ids) => {
            setShowJoin(false);
            // Silent join: records the affiliation. Choosing an org via the link
            // is the user's decision -> proceed straight to the questions (works
            // from any slide, incl. the match-screen which has no "קליק להמשך").
            setJoining(true);
            const chosen = await submitJoin(ids);
            setJoining(false);
            if (chosen) { setLinkChosen(true); handleNewUserContinue(); }
          }}
          memberOrgs={memberOrgs}
          onPickMember={(id) => {
            setShowJoin(false);
            setJoining(true);
            void enterOrg(id).then(() => { setJoining(false); setLinkChosen(true); handleNewUserContinue(); });
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
