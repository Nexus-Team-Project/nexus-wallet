/**
 * BenefitCategoriesSlide — optional slide: business poster-grid picker.
 * 2-column grid of real business cards. Minimum 3 required to enable "Continue".
 * "Skip" always available.
 *
 * Design: tall poster cards with gradient backgrounds, large emoji watermark,
 * business name at bottom, and check-badge on selection.
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

const MIN_SELECTIONS = 3;

interface BusinessCard {
  id: string;
  name: string;
  nameHe: string;
  emoji: string;
  gradient: string;
}

const BUSINESSES: BusinessCard[] = [
  { id: 'mcdonalds',    name: "McDonald's",       nameHe: 'מקדונלדס',       emoji: '🍔', gradient: 'from-red-500 to-yellow-600' },
  { id: 'castro',       name: 'Castro',           nameHe: 'קסטרו',          emoji: '👕', gradient: 'from-slate-700 to-slate-900' },
  { id: 'cinema-city',  name: 'Cinema City',      nameHe: 'סינמה סיטי',     emoji: '🎬', gradient: 'from-violet-600 to-purple-900' },
  { id: 'aroma',        name: 'Aroma',            nameHe: 'ארומה',           emoji: '☕', gradient: 'from-amber-700 to-yellow-900' },
  { id: 'isrotel',      name: 'Isrotel',          nameHe: 'ישרוטל',         emoji: '🏨', gradient: 'from-sky-500 to-blue-700' },
  { id: 'superpharm',   name: 'Superpharm',       nameHe: 'סופרפארם',       emoji: '💊', gradient: 'from-green-500 to-emerald-700' },
  { id: 'ksp',          name: 'KSP',              nameHe: 'KSP',            emoji: '💻', gradient: 'from-blue-600 to-indigo-800' },
  { id: 'holmes-place', name: 'Holmes Place',     nameHe: 'הולמס פלייס',    emoji: '💪', gradient: 'from-orange-500 to-red-600' },
  { id: 'shufersal',    name: 'Shufersal',        nameHe: 'שופרסל',         emoji: '🛒', gradient: 'from-green-600 to-green-800' },
  { id: 'hm',           name: 'H&M',              nameHe: 'H&M',            emoji: '👗', gradient: 'from-rose-500 to-pink-700' },
  { id: 'zara',         name: 'Zara',             nameHe: 'זארה',           emoji: '🧥', gradient: 'from-neutral-600 to-neutral-900' },
  { id: 'ikea',         name: 'IKEA',             nameHe: 'איקאה',          emoji: '🪑', gradient: 'from-blue-500 to-yellow-500' },
  { id: 'golf',         name: 'Golf',             nameHe: 'גולף',           emoji: '👔', gradient: 'from-emerald-600 to-teal-800' },
  { id: 'bug',          name: 'Bug',              nameHe: 'באג',            emoji: '🍕', gradient: 'from-red-600 to-orange-500' },
  { id: 'fox',          name: 'Fox',              nameHe: 'פוקס',           emoji: '🦊', gradient: 'from-orange-600 to-amber-800' },
  { id: 'ace',          name: 'ACE',              nameHe: 'ACE',            emoji: '🔧', gradient: 'from-red-700 to-red-900' },
];

export default function BenefitCategoriesSlide() {
  const { lang = 'he' } = useParams();
  const navigate = useNavigate();
  const { t, language } = useLanguage();
  const reg = useRegistrationStore();
  const isHe = language === 'he';

  const [selected, setSelected] = useState<string[]>([]);

  const storeState = useRegistrationStore.getState();
  const { current, total } = getOnboardingProgress('benefit-categories', storeState);

  const toggle = (id: string) => {
    setSelected((prev) =>
      prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id],
    );
  };

  const advance = () => {
    const next = getNextOnboardingSlide('benefit-categories', storeState);
    if (next) {
      navigate(`/${lang}/register/onboarding/${next}`, { replace: true });
    } else {
      navigate(`/${lang}/register/complete`, { replace: true });
    }
  };

  const handleContinue = () => {
    if (selected.length < MIN_SELECTIONS) return;
    reg.setOnboardingData({ benefitCategories: selected });
    advance();
  };

  const handleSkip = () => {
    reg.setOnboardingData({ benefitCategories: [] });
    advance();
  };

  const handleBack = () => {
    const prev = getPrevOnboardingSlide('benefit-categories', storeState);
    if (prev) navigate(`/${lang}/register/onboarding/${prev}`, { replace: true });
  };

  const canContinue = selected.length >= MIN_SELECTIONS;

  // Selection counter
  const selectionCounter = selected.length > 0 ? (
    <p className="text-center text-xs pt-1" style={{ color: 'var(--color-text-muted)' }}>
      {selected.length} / {MIN_SELECTIONS}
      {selected.length >= MIN_SELECTIONS && (
        <span className="ms-1">&#10003;</span>
      )}
    </p>
  ) : null;

  return (
    <OnboardingSlideLayout
      totalSlides={total}
      currentSlideIndex={current}
      canSkip
      onSkip={handleSkip}
      canContinue={canContinue}
      onBack={handleBack}
      onContinue={handleContinue}
      footerNote={
        selected.length > 0 && selected.length < MIN_SELECTIONS
          ? t.registration.benefitCategoriesMinError
          : undefined
      }
      footerExtra={selectionCounter}
    >
      <div className="pt-4 pb-2">
        {/* Header */}
        <h1
          className="text-2xl font-bold leading-tight tracking-tight mb-2"
          style={{ color: 'var(--color-primary)' }}
        >
          {t.registration.benefitCategoriesTitle}
        </h1>
        <p
          className="text-sm mb-6 leading-relaxed"
          style={{ color: 'var(--color-text-muted)' }}
        >
          {t.registration.benefitCategoriesSubtitle}
        </p>

        {/* Business poster grid */}
        <div className="grid grid-cols-2 gap-3">
          {BUSINESSES.map((biz) => {
            const isSelected = selected.includes(biz.id);
            return (
              <button
                key={biz.id}
                type="button"
                onClick={() => toggle(biz.id)}
                className={`relative aspect-[3/4] rounded-2xl overflow-hidden transition-all duration-200 active:scale-[0.96] ${
                  isSelected
                    ? 'ring-[3px] ring-primary shadow-lg shadow-primary/20'
                    : 'ring-0'
                }`}
              >
                {/* Gradient background */}
                <div className={`absolute inset-0 bg-gradient-to-br ${biz.gradient}`} />

                {/* Selected overlay */}
                {isSelected && (
                  <div className="absolute inset-0 bg-primary/25 z-10" />
                )}

                {/* Check badge */}
                {isSelected && (
                  <div className="absolute top-2.5 end-2.5 z-20 w-7 h-7 rounded-full bg-primary flex items-center justify-center shadow-lg">
                    <span
                      className="material-symbols-outlined text-white"
                      style={{ fontSize: '18px', fontVariationSettings: "'FILL' 1, 'wght' 600" }}
                    >
                      check
                    </span>
                  </div>
                )}

                {/* Emoji watermark */}
                <div className="absolute inset-0 flex items-center justify-center z-[5]">
                  <span className="text-white/20" style={{ fontSize: '64px' }}>
                    {biz.emoji}
                  </span>
                </div>

                {/* Business name at bottom */}
                <div className="absolute inset-x-0 bottom-0 z-10 bg-gradient-to-t from-black/80 via-black/40 to-transparent px-3 pb-3.5 pt-10">
                  <p className="text-white font-bold text-sm text-start leading-tight">
                    {isHe ? biz.nameHe : biz.name}
                  </p>
                </div>
              </button>
            );
          })}
        </div>
      </div>
    </OnboardingSlideLayout>
  );
}
