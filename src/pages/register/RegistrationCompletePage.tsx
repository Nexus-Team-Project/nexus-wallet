/**
 * RegistrationCompletePage — final step of the onboarding flow.
 * Shows the PremiumReveal interactive experience with the onboarding
 * progress bars at the top (all filled — this is the last slide).
 *
 * EXCEPTION — 'preferences-completion' path:
 * When the user enters the questionnaire from the home-screen personalization
 * teaser (ActiveOffers), they should NOT see the "הכל מוכן" reveal page.
 * Instead we mark the profile complete, clear the registration session, and
 * navigate straight back to home.
 */
import { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { motion } from 'framer-motion';
import { useRegistrationStore } from '../../stores/registrationStore';
import { useAuthStore } from '../../stores/authStore';
import { useTenantStore } from '../../stores/tenantStore';
import { getOnboardingTotalWithComplete } from '../../utils/onboardingNavigation';
import { PremiumRevealContent } from '../PremiumRevealPage';

export default function RegistrationCompletePage() {
  const { lang = 'he' } = useParams();
  const navigate = useNavigate();
  const returnTo             = useRegistrationStore((s) => s.returnTo);
  const completeRegistration = useRegistrationStore((s) => s.completeRegistration);
  const setProfileCompleted  = useAuthStore((s) => s.setProfileCompleted);
  const setPreferencesIncomplete = useAuthStore((s) => s.setPreferencesIncomplete);

  // Snapshot the path at mount — completeRegistration() clears it, so we
  // need the value before it's wiped.
  const [pathOnMount] = useState(
    () => useRegistrationStore.getState().registrationPath,
  );

  // Same reason: the gift is cleared by completeRegistration(). Non-null only
  // when it was granted in THIS session, so the reveal fires exactly once.
  const [giftOnMount] = useState(
    () => useRegistrationStore.getState().openingGift,
  );

  // Snapshot total ONCE at mount — avoids the bar shrinking when
  // completeRegistration() fires (which clears isOrgFlow/orgMember) right
  // before the navigate() unmounts this component.
  const [total] = useState(() => {
    const s = useRegistrationStore.getState();
    const t = useTenantStore.getState();
    const extraLeading = s.isOrgFlow || !!t.config ? 1 : 0;
    return getOnboardingTotalWithComplete(s) + extraLeading;
  });

  // ── preferences-completion fast-exit ────────────────────────────────────
  // Coming from the home-screen personalization teaser: skip the reveal,
  // mark profile as complete, and return straight to home.
  useEffect(() => {
    if (pathOnMount === 'preferences-completion') {
      setProfileCompleted(true);
      completeRegistration();
      navigate(`/${returnTo ?? lang}`, { replace: true });
    }
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  // Show nothing while the redirect is in flight
  if (pathOnMount === 'preferences-completion') {
    return null;
  }

  // ── Regular onboarding path ─────────────────────────────────────────────

  // Lock scroll/touch on body for the reveal experience
  // (only applied for the full reveal path)
  useEffect(() => {
    const prevent = (e: TouchEvent) => e.preventDefault();
    document.addEventListener('touchmove', prevent, { passive: false });
    document.body.style.overflow = 'hidden';
    document.body.style.position = 'fixed';
    document.body.style.inset = '0';
    return () => {
      document.removeEventListener('touchmove', prevent);
      document.body.style.overflow = '';
      document.body.style.position = '';
      document.body.style.inset = '';
    };
  }, []);

  const finish = () => {
    // Snapshot before completeRegistration() nulls it. Registration no longer
    // asks the preference questions, so this is null for every new member —
    // which is exactly who the nudge is for.
    const answeredPreferences = !!useRegistrationStore.getState().onboardingData;

    setProfileCompleted(true);
    // Order matters: setProfileCompleted(true) clears preferencesIncomplete
    // (authStore.ts:167), so the nudge has to be raised *after* it.
    if (!answeredPreferences) setPreferencesIncomplete(true);

    completeRegistration();
    navigate(`/${returnTo ?? lang}`, { replace: true });
  };

  return (
    <motion.div
      className="fixed inset-0 max-w-md mx-auto z-[100] bg-black flex flex-col"
      style={{ touchAction: 'none' }}
      initial={{ x: '100%', opacity: 0 }}
      animate={{ x: 0, opacity: 1 }}
      exit={{ x: '-60%', opacity: 0 }}
      transition={{ duration: 0.28, ease: [0.25, 0.46, 0.45, 0.94] }}
    >
      {/* ── Progress bars — matches OnboardingSlideLayout exactly ── */}
      <div className="flex-shrink-0 flex gap-1 px-3 pt-3 pb-2 z-50">
        {Array.from({ length: total }).map((_, i) => (
          <div
            key={i}
            className="flex-1 h-[3px] rounded-full overflow-hidden"
            style={{ backgroundColor: 'rgba(255,255,255,0.3)' }}
          >
            {/* All bars are filled — this is the last slide */}
            <motion.div
              className="h-full rounded-full bg-white"
              initial={false}
              animate={{ width: '100%' }}
              transition={{ duration: i === total - 1 ? 0.3 : 0, ease: 'easeOut' }}
            />
          </div>
        ))}
      </div>

      {/* ── Close button ── */}
      <button
        onClick={finish}
        className="absolute top-10 right-3 z-50 w-8 h-8 rounded-full flex items-center justify-center"
        style={{ background: 'rgba(0,0,0,0.3)', backdropFilter: 'blur(8px)' }}
      >
        <span className="material-symbols-outlined text-white" style={{ fontSize: '20px' }}>
          close
        </span>
      </button>

      {/* ── PremiumReveal content ──
          This screen already sat at the end of registration with the right
          gesture, so the launch gift reuses it rather than adding a screen.
          Without a gift it reads exactly as it did before. */}
      <div className="flex-1 relative overflow-hidden rounded-t-2xl">
        <PremiumRevealContent
          onReveal={finish}
          title={giftOnMount ? `₪${giftOnMount.amount} מחכים לך.` : undefined}
          subtitle={giftOnMount ? 'מתנת הפתיחה שלך נכנסה לארנק' : undefined}
        />
      </div>
    </motion.div>
  );
}
