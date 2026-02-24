/**
 * LastNameSlide — mandatory slide to collect last name.
 * Shown only when missingFields includes 'lastName'.
 */
import { useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useLanguage } from '../../../i18n/LanguageContext';
import { useRegistrationStore } from '../../../stores/registrationStore';
import OnboardingSlideLayout from '../../../components/register/OnboardingSlideLayout';
import {
  getNextOnboardingSlide,
  getOnboardingProgress,
} from '../../../utils/onboardingNavigation';

export default function LastNameSlide() {
  const { lang = 'he' } = useParams();
  const navigate = useNavigate();
  const { t } = useLanguage();
  const reg = useRegistrationStore();

  const [value, setValue] = useState(reg.profileData.lastName ?? '');

  const canContinue = value.trim().length > 0;

  const storeState = useRegistrationStore.getState();
  // LastNameSlide shares the 'first-name' slot — it's the second part of name collection
  const { current, total } = getOnboardingProgress('first-name', storeState);

  const handleContinue = () => {
    if (!canContinue) return;
    reg.setProfileData({ lastName: value.trim() });
    const next = getNextOnboardingSlide('first-name', useRegistrationStore.getState());
    if (next) {
      navigate(`/${lang}/register/onboarding/${next}`, { replace: true });
    } else {
      navigate(`/${lang}/register/complete`, { replace: true });
    }
  };

  return (
    <OnboardingSlideLayout
      totalSlides={total}
      currentSlideIndex={current}
      canSkip={false}
      canContinue={canContinue}
      onContinue={handleContinue}
    >
      <div className="pt-6 pb-2">
        <div
          className="w-20 h-20 rounded-3xl flex items-center justify-center mb-6 shadow-lg"
          style={{ background: 'linear-gradient(135deg, #f59e0b 0%, #fbbf24 100%)' }}
        >
          <span style={{ fontSize: '40px' }}>👤</span>
        </div>

        <p className="text-xs font-bold text-text-muted uppercase tracking-widest mb-1">
          {t.registration.onboardingStep} {current} / {total}
        </p>
        <h1 className="text-2xl font-semibold leading-tight mb-2" style={{ color: 'var(--color-primary)' }}>
          {t.registration.lastNameTitle}
        </h1>

        <input
          type="text"
          value={value}
          onChange={(e) => setValue(e.target.value)}
          onKeyDown={(e) => { if (e.key === 'Enter') handleContinue(); }}
          autoComplete="family-name"
          placeholder={t.registration.lastNameLabel}
          autoFocus
          className="w-full px-4 py-3.5 rounded-2xl border-2 text-sm bg-white outline-none transition-colors border-border focus:border-primary mt-6"
        />
      </div>
    </OnboardingSlideLayout>
  );
}
