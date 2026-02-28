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
import {
  getNextOnboardingSlide,
  getPrevOnboardingSlide,
  getOnboardingProgress,
} from '../../../utils/onboardingNavigation';

const BULLET_ITEMS = [
  { icon: 'person_check', key: 'motivationBullet1' as const },
  { icon: 'savings',      key: 'motivationBullet2' as const },
  { icon: 'tune',         key: 'motivationBullet3' as const },
] as const;

export default function MotivationSlide() {
  const { lang = 'he' } = useParams();
  const navigate = useNavigate();
  const { t } = useLanguage();

  const storeState = useRegistrationStore.getState();
  const { current, total } = getOnboardingProgress('motivation', storeState);

  const advance = () => {
    const next = getNextOnboardingSlide('motivation', storeState);
    if (next) {
      navigate(`/${lang}/register/onboarding/${next}`, { replace: true });
    } else {
      navigate(`/${lang}/register/complete`, { replace: true });
    }
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
    >
      <div className="pt-6 pb-2">

        {/* Header */}
        <h1
          className="text-2xl font-bold leading-tight tracking-tight mb-3"
          style={{ color: 'var(--color-primary)' }}
        >
          {t.registration.motivationTitle}
        </h1>

        {/* Subtitle */}
        <p
          className="text-sm mb-2 leading-relaxed"
          style={{ color: 'var(--color-text-primary)' }}
        >
          {t.registration.motivationSubtitle}
        </p>

        {/* Body — time estimate */}
        <p
          className="text-sm font-semibold mb-10"
          style={{ color: 'var(--color-text-muted)' }}
        >
          {t.registration.motivationBody}
        </p>

        {/* Bullet rows */}
        <ul className="space-y-5">
          {BULLET_ITEMS.map(({ icon, key }) => (
            <li key={key} className="flex items-center gap-4">
              {/* Icon badge */}
              <span
                className="w-10 h-10 rounded-2xl flex items-center justify-center flex-shrink-0"
                style={{ backgroundColor: 'var(--color-primary-light, #ede9fe)' }}
              >
                <span
                  className="material-symbols-outlined"
                  style={{
                    fontSize: '20px',
                    color: 'var(--color-primary)',
                    fontVariationSettings: "'FILL' 1",
                  }}
                >
                  {icon}
                </span>
              </span>

              {/* Text */}
              <span
                className="text-sm leading-relaxed"
                style={{ color: 'var(--color-text-primary)' }}
              >
                {t.registration[key]}
              </span>
            </li>
          ))}
        </ul>

      </div>
    </OnboardingSlideLayout>
  );
}
