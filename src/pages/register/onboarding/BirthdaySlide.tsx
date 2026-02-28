/**
 * BirthdaySlide — optional slide: date of birth.
 * Simple date input, no validation beyond HTML5 date parsing.
 */
import { useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useLanguage } from '../../../i18n/LanguageContext';
import { useRegistrationStore } from '../../../stores/registrationStore';
import OnboardingSlideLayout from '../../../components/register/OnboardingSlideLayout';
import {
  getNextOnboardingSlide,
  getPrevOnboardingSlide,
  getOnboardingProgress,
} from '../../../utils/onboardingNavigation';

export default function BirthdaySlide() {
  const { lang = 'he' } = useParams();
  const navigate = useNavigate();
  const { t } = useLanguage();
  const reg = useRegistrationStore();

  const [birthday, setBirthday] = useState('');

  const storeState = useRegistrationStore.getState();
  const { current, total } = getOnboardingProgress('birthday', storeState);

  const advance = () => {
    const next = getNextOnboardingSlide('birthday', storeState);
    if (next) {
      navigate(`/${lang}/register/onboarding/${next}`);
    } else {
      navigate(`/${lang}/register/complete`);
    }
  };

  const handleContinue = () => {
    reg.setOnboardingData({ birthday });
    advance();
  };

  const handleSkip = () => {
    reg.setOnboardingData({ birthday: '' });
    advance();
  };

  const handleBack = () => {
    const prev = getPrevOnboardingSlide('birthday', storeState);
    if (prev) navigate(`/${lang}/register/onboarding/${prev}`, { replace: true });
  };

  // Compute max date (must be at least 13 years old)
  const maxDate = (() => {
    const d = new Date();
    d.setFullYear(d.getFullYear() - 13);
    return d.toISOString().split('T')[0];
  })();

  return (
    <OnboardingSlideLayout
      totalSlides={total}
      currentSlideIndex={current}
      canSkip
      onSkip={handleSkip}
      canContinue={!!birthday}
      onBack={handleBack}
      onContinue={handleContinue}
    >
      <div className="pt-6 pb-2">
        <h1 className="text-2xl font-semibold leading-tight mb-2 text-center" style={{ color: 'var(--color-primary)' }}>
          {t.registration.birthdayTitle}
        </h1>
        <p className="text-sm text-text-muted leading-relaxed text-center">
          {t.registration.birthdaySubtitle}
        </p>

        {/* Date input */}
        <input
          type="date"
          value={birthday}
          onChange={(e) => setBirthday(e.target.value)}
          max={maxDate}
          autoComplete="bday"
          className="w-full px-4 py-4 rounded-2xl border-2 border-border focus:border-primary text-base text-text-primary bg-white outline-none transition-colors text-center"
          dir="ltr"
        />
      </div>
    </OnboardingSlideLayout>
  );
}
