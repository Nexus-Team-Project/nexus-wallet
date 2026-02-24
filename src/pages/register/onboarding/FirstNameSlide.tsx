/**
 * FirstNameSlide — collects both first name and last name in one slide.
 * Shown when missingFields includes 'firstName' or 'lastName'.
 */
import { useState, useRef } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useLanguage } from '../../../i18n/LanguageContext';
import { useRegistrationStore } from '../../../stores/registrationStore';
import OnboardingSlideLayout from '../../../components/register/OnboardingSlideLayout';
import {
  getNextOnboardingSlide,
  getOnboardingProgress,
} from '../../../utils/onboardingNavigation';

export default function FirstNameSlide() {
  const { lang = 'he' } = useParams();
  const navigate = useNavigate();
  const { t } = useLanguage();
  const reg = useRegistrationStore();

  const [firstName, setFirstName] = useState(reg.profileData.firstName ?? '');
  const [lastName, setLastName]   = useState(reg.profileData.lastName  ?? '');
  const lastNameRef = useRef<HTMLInputElement>(null);

  const storeState = useRegistrationStore.getState();
  const { current, total } = getOnboardingProgress('first-name', storeState);

  const canContinue = firstName.trim().length > 0 && lastName.trim().length > 0;

  const handleContinue = () => {
    if (!canContinue) return;
    reg.setProfileData({ firstName: firstName.trim(), lastName: lastName.trim() });
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

        <h1 className="text-2xl font-semibold leading-tight mb-2" style={{ color: 'var(--color-primary)' }}>
          {t.registration.firstNameTitle}
        </h1>
        <p className="text-sm mb-6 leading-relaxed" style={{ color: 'var(--color-text-primary)' }}>
          {t.registration.firstNameSubtitle}
        </p>

        {/* שם פרטי */}
        <input
          type="text"
          value={firstName}
          onChange={(e) => setFirstName(e.target.value)}
          onKeyDown={(e) => { if (e.key === 'Enter') lastNameRef.current?.focus(); }}
          autoComplete="given-name"
          placeholder={t.registration.firstNameLabel}
          autoFocus
          className="w-full px-4 py-3.5 rounded-2xl border-2 text-sm bg-white outline-none transition-colors border-border focus:border-primary"
        />

        {/* שם משפחה */}
        <input
          ref={lastNameRef}
          type="text"
          value={lastName}
          onChange={(e) => setLastName(e.target.value)}
          onKeyDown={(e) => { if (e.key === 'Enter') handleContinue(); }}
          autoComplete="family-name"
          placeholder={t.registration.lastNameLabel}
          className="w-full px-4 py-3.5 rounded-2xl border-2 text-sm bg-white outline-none transition-colors border-border focus:border-primary mt-3"
        />
      </div>
    </OnboardingSlideLayout>
  );
}
