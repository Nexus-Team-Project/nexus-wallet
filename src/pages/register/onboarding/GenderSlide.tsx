/**
 * GenderSlide � optional slide: how does the user identify?
 * Single-select.
 */
import { useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useLanguage } from '../../../i18n/LanguageContext';
import { useRegistrationStore } from '../../../stores/registrationStore';
import SelectionCard from '../../../components/ui/SelectionCard';
import OnboardingSlideLayout from '../../../components/register/OnboardingSlideLayout';
import {
  getNextOnboardingSlide,
  getPrevOnboardingSlide,
  getOnboardingProgress,
} from '../../../utils/onboardingNavigation';

export default function GenderSlide() {
  const { lang = 'he' } = useParams();
  const navigate = useNavigate();
  const { t } = useLanguage();
  const reg = useRegistrationStore();

  const [selected, setSelected] = useState<string | null>(null);

  const options = [
    { id: 'male',       emoji: '👨', label: t.registration.genderMale },
    { id: 'female',     emoji: '👩', label: t.registration.genderFemale },
    { id: 'prefer-not', emoji: '😊', label: t.registration.genderPreferNot },
  ];

  const storeState = useRegistrationStore.getState();
  const { current, total } = getOnboardingProgress('gender', storeState);

  const advance = () => {
    const next = getNextOnboardingSlide('gender', storeState);
    if (next) {
      navigate(`/${lang}/register/onboarding/${next}`, { replace: true });
    } else {
      navigate(`/${lang}/register/complete`, { replace: true });
    }
  };

  const handleContinue = () => {
    reg.setOnboardingData({ gender: selected });
    advance();
  };

  const handleSkip = () => {
    reg.setOnboardingData({ gender: null });
    advance();
  };

  const handleBack = () => {
    const prev = getPrevOnboardingSlide('gender', storeState);
    if (prev) navigate(`/${lang}/register/onboarding/${prev}`, { replace: true });
  };

  return (
    <OnboardingSlideLayout
      totalSlides={total}
      currentSlideIndex={current}
      canSkip
      onSkip={handleSkip}
      canContinue={!!selected}
      onBack={handleBack}
      onContinue={handleContinue}
    >
      <div className="pt-6 pb-2">

        <h1 className="text-2xl font-semibold leading-tight mb-2" style={{ color: 'var(--color-primary)' }}>
          {t.registration.genderTitle}
        </h1>
        <p className="text-sm mb-6 leading-relaxed" style={{ color: 'var(--color-text-primary)' }}>
          {t.registration.genderSubtitle}
        </p>

        <div className="space-y-2.5">
          {options.map((opt) => (
            <SelectionCard
              key={opt.id}
              emoji={opt.emoji}
              label={opt.label}
              selected={selected === opt.id}
              onClick={() => setSelected(opt.id)}
              multiSelect={false}
            />
          ))}
        </div>
      </div>
    </OnboardingSlideLayout>
  );
}
