/**
 * PurposeSlide — optional slide: why did the user join?
 * Chip-style multi-select grouped by category sections.
 *
 * Design: grouped pill chips (icon + label), highlight on select.
 * Adapted from FlixSelect onboarding pattern.
 */
import { useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useLanguage } from '../../../i18n/LanguageContext';
import { useRegistrationStore } from '../../../stores/registrationStore';
import { useAuthStore } from '../../../stores/authStore';
import { useTenantStore } from '../../../stores/tenantStore';
import OnboardingSlideLayout from '../../../components/register/OnboardingSlideLayout';
import {
  getNextOnboardingSlide,
  getPrevOnboardingSlide,
  getOnboardingProgress,
} from '../../../utils/onboardingNavigation';

interface ChipOption {
  id: string;
  icon: string;
  labelKey: keyof typeof import('../../../i18n/translations/registration').registrationTranslations.en;
}

interface ChipCategory {
  titleKey: keyof typeof import('../../../i18n/translations/registration').registrationTranslations.en;
  chips: ChipOption[];
}

const CATEGORIES: ChipCategory[] = [
  {
    titleKey: 'purposeCatShopping',
    chips: [
      { id: 'save-money',    icon: 'savings',         labelKey: 'purposeSaveMoney' },
      { id: 'discover',      icon: 'location_on',     labelKey: 'purposeDiscover' },
      { id: 'gift-cards',    icon: 'redeem',          labelKey: 'purposeGiftCards' },
      { id: 'compare-deals', icon: 'swap_horiz',      labelKey: 'purposeCompareDeals' },
    ],
  },
  {
    titleKey: 'purposeCatBenefits',
    chips: [
      { id: 'org-benefits',     icon: 'corporate_fare',  labelKey: 'purposeOrgBenefits' },
      { id: 'member-prices',    icon: 'loyalty',         labelKey: 'purposeMemberPrices' },
      { id: 'exclusive-offers', icon: 'stars',           labelKey: 'purposeExclusiveOffers' },
    ],
  },
  {
    titleKey: 'purposeCatGifting',
    chips: [
      { id: 'send-gifts',          icon: 'card_giftcard',   labelKey: 'purposeSendGifts' },
      { id: 'birthday-surprises',  icon: 'cake',            labelKey: 'purposeBirthdaySurprises' },
      { id: 'exploring',           icon: 'explore',         labelKey: 'purposeExploring' },
    ],
  },
];

export default function PurposeSlide() {
  const { lang = 'he' } = useParams();
  const navigate = useNavigate();
  const { t, language } = useLanguage();
  const reg = useRegistrationStore();
  const isHe = language === 'he';

  // Resolve app name: tenant name > org name > "Nexus"
  const tenantConfig = useTenantStore((s) => s.config);
  const organizationName = useAuthStore((s) => s.organizationName);
  const orgMember = useRegistrationStore((s) => s.orgMember);

  const appName =
    (isHe ? tenantConfig?.nameHe : tenantConfig?.name) ??
    organizationName ??
    orgMember?.organizationName ??
    'Nexus';

  const [selected, setSelected] = useState<string[]>([]);

  const storeState = useRegistrationStore.getState();
  const { current, total } = getOnboardingProgress('purpose', storeState);

  const toggle = (id: string) => {
    setSelected((prev) =>
      prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id],
    );
  };

  const advance = () => {
    const next = getNextOnboardingSlide('purpose', storeState);
    if (next) {
      navigate(`/${lang}/register/onboarding/${next}`);
    } else {
      navigate(`/${lang}/register/complete`);
    }
  };

  const handleContinue = () => {
    reg.setOnboardingData({ purpose: selected });
    advance();
  };

  const handleSkip = () => {
    reg.setOnboardingData({ purpose: [] });
    advance();
  };

  const handleBack = () => {
    const prev = getPrevOnboardingSlide('purpose', storeState);
    if (prev) navigate(`/${lang}/register/onboarding/${prev}`, { replace: true });
  };

  return (
    <OnboardingSlideLayout
      totalSlides={total}
      currentSlideIndex={current}
      canSkip
      onSkip={handleSkip}
      canContinue={selected.length > 0}
      onBack={handleBack}
      onContinue={handleContinue}
    >
      <div className="pt-6 pb-2">
        {/* Header */}
        <h1
          className="text-2xl font-bold leading-tight tracking-tight mb-2"
          style={{ color: 'var(--color-primary)' }}
        >
          {t.registration.purposeTitle.replace('{appName}', appName)}
        </h1>
        <p
          className="text-sm mb-8 leading-relaxed"
          style={{ color: 'var(--color-text-muted)' }}
        >
          {t.registration.purposeSubtitle}
        </p>

        {/* Chip categories */}
        <div className="space-y-7">
          {CATEGORIES.map((cat) => (
            <section key={cat.titleKey}>
              {/* Category header */}
              <h3
                className="text-base font-bold tracking-tight mb-3"
                style={{ color: 'var(--color-text-primary)' }}
              >
                {t.registration[cat.titleKey]}
              </h3>

              {/* Chips */}
              <div className="flex flex-wrap gap-2.5">
                {cat.chips.map((chip) => {
                  const isSelected = selected.includes(chip.id);
                  return (
                    <button
                      key={chip.id}
                      type="button"
                      onClick={() => toggle(chip.id)}
                      className={`flex h-11 items-center gap-2 rounded-xl border ps-3 pe-4 transition-all active:scale-95 ${
                        isSelected
                          ? 'bg-primary/10 border-primary/30'
                          : 'bg-surface border-border'
                      }`}
                    >
                      <span
                        className="material-symbols-outlined flex-shrink-0"
                        style={{
                          fontSize: '20px',
                          color: isSelected
                            ? 'var(--color-primary)'
                            : 'var(--color-text-muted)',
                          fontVariationSettings: isSelected
                            ? "'FILL' 1"
                            : "'FILL' 0",
                        }}
                      >
                        {chip.icon}
                      </span>
                      <span
                        className="text-sm font-medium whitespace-nowrap"
                        style={{
                          color: isSelected
                            ? 'var(--color-text-primary)'
                            : 'var(--color-text-primary)',
                        }}
                      >
                        {t.registration[chip.labelKey]}
                      </span>
                    </button>
                  );
                })}
              </div>
            </section>
          ))}
        </div>
      </div>
    </OnboardingSlideLayout>
  );
}
