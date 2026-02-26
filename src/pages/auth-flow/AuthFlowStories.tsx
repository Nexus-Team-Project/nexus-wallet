/**
 * AuthFlowStories — Instagram-style stories for the auth flow.
 * Fullscreen, white background, rich visuals — same style as StoriesPage.
 *
 * /:lang/auth-flow/new-user  → Flow 2 (new user)
 * /:lang/auth-flow/org-user  → Flow 3 (pre-provisioned org)
 */

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useNavigate, useParams } from 'react-router-dom';
import { useRegistrationStore } from '../../stores/registrationStore';
import { getFirstOnboardingSlide, getOnboardingTotalWithComplete } from '../../utils/onboardingNavigation';
import { useTenantStore } from '../../stores/tenantStore';
import { useImagePreloader } from '../../hooks/useImagePreloader';
import { SmartInsightsCarousel } from '../InsightsPage';
import GiftCardsPage from '../GiftCardsPage';
import WalletCardsPage from '../WalletCardsPage';
import NearbyMapPage from '../NearbyMapPage';

import {
  type FlowType,
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
  const tenantConfig = useTenantStore((s) => s.config);
  const orgMember    = useRegistrationStore((s) => s.orgMember);

  // ── Image preloader ───────────────────────────────────────────────────────
  const { loaded: imagesLoaded, failed: failedImages } = useImagePreloader(FLOW_IMAGES);

  // ── Whether this session has an org/tenant context ────────────────────────
  const isOrgFlow = Boolean(orgMember || tenantConfig);

  // ── Initial step list ─────────────────────────────────────────────────────
  const baseSteps = flowType === 'new-user' ? newUserSteps : orgUserSteps;
  const initialSteps = isOrgFlow
    ? [...baseSteps, { id: 'match-screen', interactive: true }]
    : baseSteps;

  // ── If user pressed Back from onboarding/membership, restore match-screen ─
  // sessionStorage flag is written by SlideMatchScreen BEFORE navigating forward,
  // so it survives back-navigation (unlike location.state which lives on the
  // destination history entry and is null when we return via Back).
  const [initialCurrent] = useState(() => {
    const flag = sessionStorage.getItem('nexus_return_match') === '1';
    if (flag) {
      sessionStorage.removeItem('nexus_return_match');
      return Math.max(0, initialSteps.findIndex(s => s.id === 'match-screen'));
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

  // ── Slide callbacks ───────────────────────────────────────────────────────
  const handleOrgSwitchUser = () => {
    navigate(`/${lang}`, { replace: true });
  };

  const handleOrgChangeOrg = () => {
    navigate(`/${lang}/auth-flow/select-org`);
  };

  const handleNewUserContinue = () => {
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
    const barSteps   = steps.filter(s => s.id !== 'match-screen');
    const barCurrent = barSteps.findIndex(s => s.id === steps[current]?.id);
    barSegments = barSteps.map((step, i) => ({
      key:      step.id,
      isDone:   i < barCurrent,
      isActive: i === barCurrent,
    }));
  } else {
    barSegments = steps.map((step, i) => ({
      key:      step.id,
      isDone:   i < current,
      isActive: i === current,
    }));
  }

  // ── Org accent colour for CTA bar ─────────────────────────────────────────
  const orgColor = tenantConfig?.primaryColor ?? '#635bff';

  // ── Slides that own their own bottom UI (no CTA bar overlay) ─────────────
  const noCTASlides = ['match-screen'];

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
              {steps[current]?.id === 'welcome-org' && <SlideWelcomeOrg />}
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
            onSwitchUser={handleOrgSwitchUser}
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
