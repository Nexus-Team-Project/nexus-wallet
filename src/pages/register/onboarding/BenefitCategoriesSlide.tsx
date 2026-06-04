/**
 * BenefitCategoriesSlide — the LAST onboarding step: a "choose businesses"
 * poster grid.
 *
 * Currently a MOCK teaser: a small "בקרוב / Coming soon" pill sits by the title,
 * the cards are DISPLAY-ONLY (not selectable, nothing is saved or sent), and
 * Continue is always enabled and simply finishes onboarding.
 *
 * Design: tall poster cards with gradient backgrounds, a large emoji watermark,
 * and the business name at the bottom — the original picker look.
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

interface BusinessCard {
  id: string;
  name: string;
  nameHe: string;
  emoji: string;
  gradient: string;
}

const BUSINESSES: BusinessCard[] = [
  { id: 'mcdonalds',    name: "McDonald's",   nameHe: 'מקדונלדס',    emoji: '🍔', gradient: 'from-red-500 to-yellow-600' },
  { id: 'castro',       name: 'Castro',       nameHe: 'קסטרו',       emoji: '👕', gradient: 'from-slate-700 to-slate-900' },
  { id: 'cinema-city',  name: 'Cinema City',  nameHe: 'סינמה סיטי',  emoji: '🎬', gradient: 'from-violet-600 to-purple-900' },
  { id: 'aroma',        name: 'Aroma',        nameHe: 'ארומה',        emoji: '☕', gradient: 'from-amber-700 to-yellow-900' },
  { id: 'isrotel',      name: 'Isrotel',      nameHe: 'ישרוטל',      emoji: '🏨', gradient: 'from-sky-500 to-blue-700' },
  { id: 'superpharm',   name: 'Superpharm',   nameHe: 'סופרפארם',    emoji: '💊', gradient: 'from-green-500 to-emerald-700' },
  { id: 'ksp',          name: 'KSP',          nameHe: 'KSP',         emoji: '💻', gradient: 'from-blue-600 to-indigo-800' },
  { id: 'holmes-place', name: 'Holmes Place', nameHe: 'הולמס פלייס', emoji: '💪', gradient: 'from-orange-500 to-red-600' },
  { id: 'shufersal',    name: 'Shufersal',    nameHe: 'שופרסל',      emoji: '🛒', gradient: 'from-green-600 to-green-800' },
  { id: 'hm',           name: 'H&M',          nameHe: 'H&M',         emoji: '👗', gradient: 'from-rose-500 to-pink-700' },
  { id: 'zara',         name: 'Zara',         nameHe: 'זארה',        emoji: '🧥', gradient: 'from-neutral-600 to-neutral-900' },
  { id: 'ikea',         name: 'IKEA',         nameHe: 'איקאה',       emoji: '🪑', gradient: 'from-blue-500 to-yellow-500' },
  { id: 'golf',         name: 'Golf',         nameHe: 'גולף',        emoji: '👔', gradient: 'from-emerald-600 to-teal-800' },
  { id: 'bug',          name: 'Bug',          nameHe: 'באג',         emoji: '🍕', gradient: 'from-red-600 to-orange-500' },
  { id: 'fox',          name: 'Fox',          nameHe: 'פוקס',        emoji: '🦊', gradient: 'from-orange-600 to-amber-800' },
  { id: 'ace',          name: 'ACE',          nameHe: 'ACE',         emoji: '🔧', gradient: 'from-red-700 to-red-900' },
];

export default function BenefitCategoriesSlide() {
  const { lang = 'he' } = useParams();
  const navigate = useNavigate();
  const { t, language } = useLanguage();
  const isHe = language === 'he';

  const storeState = useRegistrationStore.getState();
  const { current, total } = getOnboardingProgress('benefit-categories', storeState);

  // Last slide: Continue finishes onboarding. Nothing is saved (mock teaser).
  const advance = () => {
    const next = getNextOnboardingSlide('benefit-categories', storeState);
    navigate(next ? `/${lang}/register/onboarding/${next}` : `/${lang}/register/complete`);
  };

  const handleBack = () => {
    const prev = getPrevOnboardingSlide('benefit-categories', storeState);
    if (prev) navigate(`/${lang}/register/onboarding/${prev}`, { replace: true });
  };

  return (
    <OnboardingSlideLayout
      totalSlides={total}
      currentSlideIndex={current}
      canSkip={false}
      canContinue
      onBack={handleBack}
      onContinue={advance}
    >
      <div className="pt-4 pb-2">
        {/* Header: a small "coming soon" pill above the title. */}
        <span className="mb-2 inline-block rounded-full bg-primary/10 px-2.5 py-0.5 text-[11px] font-bold text-primary">
          {t.registration.benefitCategoriesComingSoon}
        </span>
        <h1
          className="text-2xl font-bold leading-tight tracking-tight mb-2"
          style={{ color: 'var(--color-primary)' }}
        >
          {t.registration.benefitCategoriesTitle}
        </h1>
        <p className="text-sm mb-6 leading-relaxed" style={{ color: 'var(--color-text-muted)' }}>
          {t.registration.benefitCategoriesSubtitle}
        </p>

        {/* Business poster grid — display only (mock; not selectable). */}
        <div className="grid grid-cols-2 gap-3 opacity-90">
          {BUSINESSES.map((biz) => (
            <div
              key={biz.id}
              aria-disabled
              className="relative aspect-[3/4] cursor-default select-none overflow-hidden rounded-2xl"
            >
              <div className={`absolute inset-0 bg-gradient-to-br ${biz.gradient}`} />
              <div className="absolute inset-0 z-[5] flex items-center justify-center">
                <span className="text-white/20" style={{ fontSize: '64px' }}>{biz.emoji}</span>
              </div>
              <div className="absolute inset-x-0 bottom-0 z-10 bg-gradient-to-t from-black/80 via-black/40 to-transparent px-3 pb-3.5 pt-10">
                <p className="text-start text-sm font-bold leading-tight text-white">
                  {isHe ? biz.nameHe : biz.name}
                </p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </OnboardingSlideLayout>
  );
}
