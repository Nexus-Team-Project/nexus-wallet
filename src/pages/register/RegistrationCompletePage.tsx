/**
 * RegistrationCompletePage — final step of the onboarding flow.
 * Shows the PremiumReveal interactive experience with the onboarding
 * progress bars at the top (all filled — this is the last slide).
 */
import { useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { motion } from 'framer-motion';
import { useRegistrationStore } from '../../stores/registrationStore';
import { getOnboardingTotalWithComplete } from '../../utils/onboardingNavigation';
import { PremiumRevealContent } from '../PremiumRevealPage';

export default function RegistrationCompletePage() {
  const { lang = 'he' } = useParams();
  const navigate = useNavigate();
  const returnTo = useRegistrationStore((s) => s.returnTo);
  const completeRegistration = useRegistrationStore((s) => s.completeRegistration);

  const storeState = useRegistrationStore.getState();
  const total = getOnboardingTotalWithComplete(storeState);

  // Lock scroll/touch on body for the reveal experience
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

  const handleReveal = () => {
    completeRegistration();
    navigate(`/${returnTo ?? lang}`, { replace: true });
  };

  return (
    <motion.div
      className="fixed inset-0 z-[100] bg-black flex flex-col"
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
        onClick={() => {
          completeRegistration();
          navigate(`/${returnTo ?? lang}`, { replace: true });
        }}
        className="absolute top-10 right-3 z-50 w-8 h-8 rounded-full flex items-center justify-center"
        style={{ background: 'rgba(0,0,0,0.3)', backdropFilter: 'blur(8px)' }}
      >
        <span className="material-symbols-outlined text-white" style={{ fontSize: '20px' }}>
          close
        </span>
      </button>

      {/* ── PremiumReveal content ── */}
      <div className="flex-1 relative overflow-hidden rounded-t-2xl">
        <PremiumRevealContent onReveal={handleReveal} />
      </div>
    </motion.div>
  );
}
