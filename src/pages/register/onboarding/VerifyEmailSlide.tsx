/**
 * VerifyEmailSlide � optional slide for users who don't yet have an email.
 * Phase 1: just collects the email string, no actual email verification link.
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

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export default function VerifyEmailSlide() {
  const { lang = 'he' } = useParams();
  const navigate = useNavigate();
  const { t } = useLanguage();
  const reg = useRegistrationStore();

  const [email, setEmail] = useState(reg.profileData.email ?? '');
  const [touched, setTouched] = useState(false);

  const isValid = EMAIL_REGEX.test(email.trim());
  const showError = touched && email.trim() && !isValid;

  const storeState = useRegistrationStore.getState();
  const { current, total } = getOnboardingProgress('verify-email', storeState);

  const advance = () => {
    const next = getNextOnboardingSlide('verify-email', storeState);
    if (next) {
      navigate(`/${lang}/register/onboarding/${next}`, { replace: true });
    } else {
      navigate(`/${lang}/register/complete`, { replace: true });
    }
  };

  const handleContinue = () => {
    setTouched(true);
    if (!isValid) return;
    reg.setProfileData({ email: email.trim() });
    advance();
  };

  const handleSkip = () => {
    // Don't save anything � email stays blank
    advance();
  };

  return (
    <OnboardingSlideLayout
      totalSlides={total}
      currentSlideIndex={current}
      canSkip
      onSkip={handleSkip}
      canContinue={isValid}
      onContinue={handleContinue}
      footerNote={showError ? t.registration.verifyEmailError : undefined}
    >
      <div className="pt-6 pb-2">
        <h1 className="text-2xl font-semibold leading-tight mb-2" style={{ color: 'var(--color-primary)' }}>
          {t.registration.verifyEmailTitle}
        </h1>
        <p className="text-sm mb-8 leading-relaxed" style={{ color: 'var(--color-text-primary)' }}>
          {t.registration.verifyEmailSubtitle}
        </p>

        {/* Email input */}
        <input
          type="email"
          value={email}
          onChange={(e) => { setEmail(e.target.value); setTouched(false); }}
          onBlur={() => setTouched(true)}
          onKeyDown={(e) => { if (e.key === 'Enter') handleContinue(); }}
          autoComplete="email"
          placeholder={t.registration.verifyEmailPlaceholder}
          autoFocus
          className={`w-full px-4 py-3.5 rounded-2xl border-2 text-sm bg-white outline-none transition-colors ${
            showError ? 'border-error' : 'border-border focus:border-primary'
          }`}
          dir="ltr"
        />
      </div>
    </OnboardingSlideLayout>
  );
}
