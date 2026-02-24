/**
 * ConsentsSlide — mandatory slide collecting notification consents.
 * Shows title + subtitle (with colon) + icon-row list describing what we notify about.
 * "Later" button appears top-right (via canSkip/onSkip), Continue is the primary CTA.
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

// Each notification reason with its matching Material Symbol icon
const NOTIFICATION_ITEMS = [
  { icon: 'check_circle', key: 'consentsBullet1' as const },
  { icon: 'local_shipping', key: 'consentsBullet2' as const },
  { icon: 'redeem', key: 'consentsBullet3' as const },
] as const;

export default function ConsentsSlide() {
  const { lang = 'he' } = useParams();
  const navigate = useNavigate();
  const { t } = useLanguage();
  const reg = useRegistrationStore();

  const storeState = useRegistrationStore.getState();
  const { current, total } = getOnboardingProgress('consents', storeState);

  const advance = () => {
    const next = getNextOnboardingSlide('consents', storeState);
    if (next) {
      navigate(`/${lang}/register/onboarding/${next}`, { replace: true });
    } else {
      navigate(`/${lang}/register/complete`, { replace: true });
    }
  };

  const handleBack = () => {
    const prev = getPrevOnboardingSlide('consents', storeState);
    if (prev) {
      navigate(`/${lang}/register/onboarding/${prev}`, { replace: true });
    }
  };

  const handleContinue = () => {
    reg.setConsents({ marketing: true, pushNotifications: false, analytics: false });
    advance();
  };

  const handleLater = () => {
    reg.setConsents({ marketing: false, pushNotifications: false, analytics: false });
    advance();
  };

  const hasPrev = !!getPrevOnboardingSlide('consents', storeState);

  const changeNote = (
    <p className="text-xs text-center py-1" style={{ color: 'var(--color-text-muted)' }}>
      {t.registration.consentsChangeNote}
    </p>
  );

  return (
    <OnboardingSlideLayout
      totalSlides={total}
      currentSlideIndex={current}
      canSkip={true}
      canContinue={true}
      onBack={hasPrev ? handleBack : undefined}
      onSkip={handleLater}
      skipLabel={t.registration.consentsLater}
      onContinue={handleContinue}
      footerExtra={changeNote}
    >
      <div className="pt-6 pb-2">

        {/* Header */}
        <h1 className="text-2xl font-semibold leading-tight mb-3" style={{ color: 'var(--color-primary)' }}>
          {t.registration.consentsTitle}
        </h1>
        <p className="text-sm mb-8 leading-relaxed" style={{ color: 'var(--color-text-primary)' }}>
          {t.registration.consentsSubtitle}:
        </p>

        {/* Icon rows */}
        <ul className="space-y-5">
          {NOTIFICATION_ITEMS.map(({ icon, key }) => (
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
              <span className="text-sm leading-relaxed" style={{ color: 'var(--color-text-primary)' }}>
                {t.registration[key]}
              </span>
            </li>
          ))}
        </ul>

      </div>
    </OnboardingSlideLayout>
  );
}
