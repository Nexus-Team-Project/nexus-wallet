/**
 * MotivationSlide — mandatory transitional slide between the personal-details
 * slides (verify-phone / first-name / verify-email / consents) and the
 * preference questions (purpose, life-stage, birthday, gender, benefit-categories).
 *
 * Goal: explain WHY we need more info in a benefit-focused way that maximises
 * the completion rate of the optional preference slides.
 *
 * No skip button — only a forward CTA ("I want more benefits").
 * Back button returns to the previous active slide (usually consents or
 * absent for the preferences-completion flow from the banner).
 */
import { useNavigate, useParams } from 'react-router-dom';
import { useLanguage } from '../../../i18n/LanguageContext';
import { useRegistrationStore } from '../../../stores/registrationStore';
import OnboardingSlideLayout from '../../../components/register/OnboardingSlideLayout';
import { MotivationAnimation } from '../../../components/register/MotivationAnimation';
import {
  getNextOnboardingSlide,
  getPrevOnboardingSlide,
  getOnboardingProgress,
} from '../../../utils/onboardingNavigation';

// Note: BULLET_ITEMS removed — the hero animation communicates the same narrative visually.

export default function MotivationSlide() {
  const { lang = 'he' } = useParams();
  const navigate = useNavigate();
  const { t } = useLanguage();

  const storeState = useRegistrationStore.getState();
  const { current, total } = getOnboardingProgress('motivation', storeState);

  const advance = () => {
    const next = getNextOnboardingSlide('motivation', storeState);
    if (next) {
      navigate(`/${lang}/register/onboarding/${next}`);
    } else {
      navigate(`/${lang}/register/complete`);
    }
  };

  /** Skip all optional preference questions — go straight to completion. */
  const handleSkip = () => {
    navigate(`/${lang}/register/complete`);
  };

  const handleBack = () => {
    const prev = getPrevOnboardingSlide('motivation', storeState);
    if (prev) {
      navigate(`/${lang}/register/onboarding/${prev}`, { replace: true });
    }
  };

  const hasPrev = !!getPrevOnboardingSlide('motivation', storeState);

  return (
    <OnboardingSlideLayout
      totalSlides={total}
      currentSlideIndex={current}
      canSkip={false}
      canContinue={true}
      onBack={hasPrev ? handleBack : undefined}
      onContinue={advance}
      continueLabel={t.registration.motivationCta}
      secondaryCta={{ label: t.registration.motivationSkip, onClick: handleSkip }}
      hero={<MotivationAnimation />}
    >
      <div className="pt-5 pb-2">

        {/* Header */}
        <h1
          className="text-2xl font-bold leading-tight tracking-tight mb-2"
          style={{ color: 'var(--color-primary)' }}
        >
          {t.registration.motivationTitle}
        </h1>

        {/* Time estimate */}
        <p
          className="text-sm font-semibold mb-5"
          style={{ color: 'var(--color-text-muted)' }}
        >
          {t.registration.motivationBody}
        </p>

        {/* Social-proof badge */}
        <div
          className="flex items-center gap-3 rounded-2xl px-4 py-3"
          style={{ backgroundColor: 'var(--color-primary-light, #ede9fe)' }}
        >
          <span
            className="material-symbols-outlined flex-shrink-0"
            style={{
              fontSize:             20,
              color:                'var(--color-primary)',
              fontVariationSettings: "'FILL' 1",
            }}
          >
            workspace_premium
          </span>
          <span
            className="text-xs font-semibold leading-relaxed"
            style={{ color: 'var(--color-primary)' }}
          >
            {t.registration.motivationBadge}
          </span>
        </div>

      </div>
    </OnboardingSlideLayout>
  );
}
