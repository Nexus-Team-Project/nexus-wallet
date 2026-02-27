/**
 * AuthFlowStories — Instagram-style stories for the auth flow.
 * Fullscreen, white background, rich visuals — same style as StoriesPage.
 *
 * /:lang/auth-flow/new-user  → all flows (new user, pre-provisioned org, customerId)
 *                               flowType prop drives which step sequence is used.
 */

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useNavigate, useParams } from 'react-router-dom';
import { useRegistrationStore } from '../../stores/registrationStore';
import { getFirstOnboardingSlide, getOnboardingTotalWithComplete } from '../../utils/onboardingNavigation';
import { useTenantStore } from '../../stores/tenantStore';
import { useImagePreloader } from '../../hooks/useImagePreloader';
import { mockTenants } from '../../mock/data/tenants.mock';
import { SmartInsightsCarousel } from '../InsightsPage';
import GiftCardsPage from '../GiftCardsPage';
import WalletCardsPage from '../WalletCardsPage';
import NearbyMapPage from '../NearbyMapPage';

import {
  type FlowType,
  type OrgInfo,
  FLOW_IMAGES,
  FlowSkeleton,
  SlideNexusHero,
  SlideSelectOrg,
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

const newUserSteps = [{ id: 'nexus-hero' }, ...smartStorySteps, { id: 'select-org', interactive: true }];
const orgUserSteps = [{ id: 'welcome-org' }, ...smartStorySteps, { id: 'select-org', interactive: true }];

// ─────────────────────────────────────────────────────────────────────────────
export default function AuthFlowStories({ flowType }: { flowType: FlowType }) {
  const { lang = 'he' } = useParams();
  const navigate = useNavigate();
  const setTenant    = useTenantStore((s) => s.setTenant);
  const tenantConfig = useTenantStore((s) => s.config);
  const orgMember    = useRegistrationStore((s) => s.orgMember);
  const startRegistration = useRegistrationStore((s) => s.startRegistration);
  const registrationPath  = useRegistrationStore((s) => s.registrationPath);
  const phone             = useRegistrationStore((s) => s.phone);

  // ── Image preloader ───────────────────────────────────────────────────────
  const { loaded: imagesLoaded, failed: failedImages } = useImagePreloader(FLOW_IMAGES);

  // ── Whether this session has an org/tenant context ────────────────────────
  const isOrgFlow = Boolean(orgMember || tenantConfig);

  // ── Flow label for ?flow= URL param — tracks which onboarding path the user
  //    arrived on. Based on registrationPath at entry time, not mid-flow state.
  const flowLabel: 'new-user' | 'pre-provisioned' =
    registrationPath === 'org-member-incomplete' ? 'pre-provisioned' : 'new-user';

  // ── Selected org state (for SlideWelcomeOrg after selecting) ─────────────
  const [selectedOrg, setSelectedOrg] = useState<OrgInfo | null>(null);

  // ── Initial step list ─────────────────────────────────────────────────────
  const baseSteps = flowType === 'new-user' ? newUserSteps : orgUserSteps;
  const initialSteps = isOrgFlow
    ? [...baseSteps, { id: 'match-screen', interactive: true }]
    : baseSteps;

  // ── If user pressed Back from onboarding/membership, restore match-screen ─
  // Also supports direct-linking via ?step=<stepId> so every slide has a URL.
  const [initialCurrent] = useState(() => {
    const flag = sessionStorage.getItem('nexus_return_match') === '1';
    if (flag) {
      sessionStorage.removeItem('nexus_return_match');
      return Math.max(0, initialSteps.findIndex(s => s.id === 'match-screen'));
    }
    // Restore from URL slug if present (e.g. ?step=select-org)
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
  const handleOrgChangeOrg = () => {
    const idx = steps.findIndex(s => s.id === 'select-org');
    if (idx !== -1) goTo(idx);
  };

  const handleNewUserContinue = () => {
    const firstSlide = getFirstOnboardingSlide(useRegistrationStore.getState());
    navigate(`/${lang}/register/onboarding/${firstSlide}`);
  };

  const handleSelectOrg = (org: OrgInfo) => {
    setSelectedOrg(org);

    if (org.id === 'nexus') {
      const firstSlide = getFirstOnboardingSlide(useRegistrationStore.getState());
      navigate(`/${lang}/register/onboarding/${firstSlide}`);
      return;
    }

    // Update registration store with selected org
    startRegistration({
      path: registrationPath ?? 'new-user',
      phone: phone ?? '',
      orgMember: {
        organizationId: org.id,
        organizationName: org.name,
      },
    });

    const tenantId = org.tenantId;
    if (tenantId && mockTenants[tenantId]) {
      setTenant(tenantId, mockTenants[tenantId]);
    }

    // Navigate to welcome-org slide if it exists, else inject it
    const welcomeIdx = steps.findIndex(s => s.id === 'welcome-org');
    if (welcomeIdx !== -1) {
      setDirection(1); setCurrent(welcomeIdx);
    } else {
      setSteps(prev => [...prev, { id: 'welcome-org' }]);
      setDirection(1); setCurrent(steps.length);
    }
  };

  const handleSelectOrgSkip = () => {
    const firstSlide = getFirstOnboardingSlide(useRegistrationStore.getState());
    navigate(`/${lang}/register/onboarding/${firstSlide}`);
  };

  // ── Progress bar segment computation ─────────────────────────────────────
  const isMatchScreenActive = steps[current]?.id === 'match-screen';
  let barSegments: Array<{ key: string; isDone: boolean; isActive: boolean }>;

  if (isOrgFlow && isMatchScreenActive) {
    const onboardingTotal = getOnboardingTotalWithComplete(useRegistrationStore.getState()) + 1;
    barSegments = Array.from({ length: onboardingTotal }, (_, i) => ({
      key: `bar-${i}`,
      isDone:   false,
      isActive: i === 0,
    }));
  } else if (isOrgFlow) {
    const barSteps   = steps.filter(s => s.id !== 'match-screen' && s.id !== 'select-org');
    const barCurrent = barSteps.findIndex(s => s.id === steps[current]?.id);
    barSegments = barSteps.map((step, i) => ({
      key:      step.id,
      isDone:   i < barCurrent,
      isActive: i === barCurrent,
    }));
  } else {
    const barSteps   = steps.filter(s => s.id !== 'select-org');
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
  const noCTASlides = ['match-screen', 'select-org'];

  // ─────────────────────────────────────────────────────────────────────────
  return (
    <div className="fixed inset-0 z-[100] bg-black flex flex-col">

      {/* ── Progress bar ── */}
      <div className="px-3 pt-3 pb-2 z-50">
        <StoryProgressBar segments={barSegments} progress={progress} />
      </div>

      {/* ── Close button ── */}
      <button
        onClick={() => navigate(`/${lang}`)}
        className="absolute top-3 left-3 z-50 w-8 h-8 flex items-center justify-center"
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
              {steps[current]?.id === 'nexus-hero'  && <SlideNexusHero failedImages={failedImages} />}
              {steps[current]?.id === 'select-org'  && <SlideSelectOrg onSelect={handleSelectOrg} onSkip={handleSelectOrgSkip} />}
              {steps[current]?.id === 'welcome-org' && <SlideWelcomeOrg org={selectedOrg} />}
              {steps[current]?.id === 'story-insights'    && (
                <div className="w-full h-full flex flex-col items-center justify-center px-6 relative overflow-hidden" style={{ backgroundColor: 'var(--color-surface)' }} dir="rtl">
                  <SmartInsightsCarousel />
                </div>
              )}
              {steps[current]?.id === 'story-gift-cards'  && <GiftCardsPage />}
              {steps[current]?.id === 'story-wallet'      && <WalletCardsPage />}
              {steps[current]?.id === 'story-nearby'      && <NearbyMapPage />}
              {steps[current]?.id === 'match-screen'      && <SlideMatchScreen />}
            </motion.div>
          )}
        </AnimatePresence>

        {/* ── Persistent CTA bar — hidden on slides that own their own bottom UI ── */}
        {!noCTASlides.includes(steps[current]?.id ?? '') && (
          <StoryCTABar
            isOrgFlow={isOrgFlow}
            steps={steps}
            setSteps={setSteps}
            setDirection={setDirection}
            setCurrent={setCurrent}
            goTo={goTo}
            orgColor={orgColor}
            onChangeOrg={handleOrgChangeOrg}
            onNewUserContinue={handleNewUserContinue}
          />
        )}
      </div>
    </div>
  );
}

export function NewUserFlow() {
  return <AuthFlowStories flowType="new-user" />;
}

export function OrgUserFlow() {
  return <AuthFlowStories flowType="org-user" />;
}
