/**
 * LifeStageSlide — optional slide: household composition.
 * Single-select. Selection stored in onboardingData.lifeStage.
 * Profile page uses this value to conditionally show the Family section.
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

export default function LifeStageSlide() {
  const { lang = 'he' } = useParams();
  const navigate = useNavigate();
  const { t } = useLanguage();
  const reg = useRegistrationStore();

  const [selected, setSelected] = useState<string | null>(null);

  const options = [
    { id: 'just-me',        emoji: '🧍', label: t.registration.lifeStageJustMe },
    { id: 'relationship',   emoji: '👫', label: t.registration.lifeStageRelationship },
    { id: 'kids',           emoji: '👨‍👩‍👧‍👦', label: t.registration.lifeStageKids },
  ];

  const storeState = useRegistrationStore.getState();
  const { current, total } = getOnboardingProgress('life-stage', storeState);

  const advance = () => {
    const next = getNextOnboardingSlide('life-stage', storeState);
    if (next) {
      navigate(`/${lang}/register/onboarding/${next}`);
    } else {
      navigate(`/${lang}/register/complete`);
    }
  };

  const handleContinue = () => {
    reg.setOnboardingData({ lifeStage: selected });
    advance();
  };

  const handleSkip = () => {
    reg.setOnboardingData({ lifeStage: null });
    advance();
  };

  const handleBack = () => {
    const prev = getPrevOnboardingSlide('life-stage', storeState);
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
          {t.registration.lifeStageTitle}
        </h1>
        <p className="text-sm mb-6 leading-relaxed" style={{ color: 'var(--color-text-primary)' }}>
          {t.registration.lifeStageSubtitle}
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
