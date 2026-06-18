import { useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useLanguage } from '../i18n/LanguageContext';
import HeroBanner from '../components/home/HeroBanner';
import HomePageSkeleton from '../components/home/HomePageSkeleton';
import NexusPicksRow from '../components/home/NexusPicksRow';
import BrandSlider from '../components/home/BrandSlider';
import ActiveOffers from '../components/home/ActiveOffers';
import TopStores from '../components/home/TopStores';
import RecentlyViewed from '../components/home/RecentlyViewed';
import NearYou from '../components/home/NearYou';
import ReferralBanner from '../components/home/ReferralBanner';
import TenantOffers from '../components/home/TenantOffers';
import BrandFeatureStore from '../components/category/BrandFeatureStore';
import BrandCatalogStore from '../components/home/BrandCatalogStore';
import LazySection from '../components/ui/LazySection';
import {
  SkeletonSliderRow,
  SkeletonCircleRow,
  SkeletonCategoryRowCard,
  SkeletonBrandFeatureCard,
  SkeletonBrandCatalogCard,
  SkeletonBanner,
  SkeletonRecentlyViewed,
} from '../components/home/HomeSectionSkeletons';
import { mockBusinesses } from '../mock/data/businesses.mock';

import {
  PopularSlider,
  RecommendedSlider,
  NewSlider,
  WomenSlider,
  MenSlider,
  PetsSlider,
  ComingSoonSlider,
} from '../components/store/StoreSliders';
import { useAuthStore } from '../stores/authStore';
import { useTenantStore } from '../stores/tenantStore';
import { useAccessibilityStore } from '../stores/accessibilityStore';
import { useVouchers } from '../hooks/useVouchers';
import type { StoreFilter } from '../types/voucher.types';
import DevPlaygroundSheet from '../components/dev/DevPlaygroundSheet';

const A2HS_DISMISSED_KEY = 'nexus_a2hs_dismissed';

export default function HomePage() {
  const { lang = 'he' } = useParams();
  const { t, language } = useLanguage();
  const navigate = useNavigate();
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated);
  const profileCompleted = useAuthStore((s) => s.profileCompleted);
  const tenantConfig = useTenantStore((s) => s.config);
  const logoSrc = tenantConfig?.logo ?? '/nexus-logo.png';
  const appName = tenantConfig
    ? (language === 'he' ? tenantConfig.nameHe : tenantConfig.name) ?? 'Nexus'
    : 'Nexus';

  const [showA2HS, setShowA2HS] = useState(
    () => !localStorage.getItem(A2HS_DISMISSED_KEY)
  );
  const [showDevSheet, setShowDevSheet] = useState(false);

  const dismissA2HS = () => {
    setShowA2HS(false);
    localStorage.setItem(A2HS_DISMISSED_KEY, '1');
  };

  // Accessibility widget is opt-in — prompt to add it until the user
  // either adds it or dismisses the card.
  const a11yEnabled = useAccessibilityStore((s) => s.enabled);
  const a11yCardDismissed = useAccessibilityStore((s) => s.cardDismissed);
  const enableA11y = useAccessibilityStore((s) => s.enableWidget);
  const dismissA11yCard = useAccessibilityStore((s) => s.dismissCard);
  const showA11yCard = !a11yEnabled && !a11yCardDismissed;

  // H&M brand store card — shown on the home page right under "Especially for
  // you". Reuses the category page's BrandFeatureStore card.
  const hmBusiness = mockBusinesses.find((b) => b.id === 'biz_010');
  // mb-6 wrapper so the gap to the next section is measured below the promo
  // banner (the card's foot), not the card itself.
  const hmStoreCard = hmBusiness ? (
    <div className="mb-6">
      <BrandFeatureStore
        business={hmBusiness}
        variant="light"
        promo={{
          saveLabel: language === 'he' ? 'חסכו ₪30' : 'Save ₪30',
          condition: language === 'he' ? 'בהזמנות מעל ₪200' : 'on orders over ₪200',
        }}
      />
    </div>
  ) : null;

  // Golf & Co brand store section.
  const golfBusiness = mockBusinesses.find((b) => b.id === 'biz_011');
  const golfStoreCard = golfBusiness ? (
    <div className="mb-6">
      <BrandFeatureStore
        business={golfBusiness}
        variant="dark"
        bgVideo="/golf-store.mp4"
        squareProducts
        promo={{
          saveLabel: language === 'he' ? 'חסכו ₪40' : 'Save ₪40',
          condition: language === 'he' ? 'בהזמנות מעל ₪250' : 'on orders over ₪250',
        }}
      />
    </div>
  ) : null;

  // rhode-style product-catalog cards (clean white card, 2×2 product grid).
  const rhodeBusiness = mockBusinesses.find((b) => b.id === 'biz_012');
  const yvesBusiness = mockBusinesses.find((b) => b.id === 'biz_013');

  // "במיוחד בשבילך" (ActiveOffers) position:
  //   hasProfile  → 2nd: right after TopStores (real personalized recommendations)
  //   !hasProfile → 3rd: after PopularSlider  (shows teaser card only)
  const hasProfile = isAuthenticated && profileCompleted;

  const handleSelectFilter = (filter: StoreFilter) => {
    navigate(`/${lang}/store`, { state: { filter } });
  };

  // All home-page sliders read from the same `useVouchers` query (shared React
  // Query cache), so this loading flag mirrors what every slider sees.
  const { isLoading: vouchersLoading } = useVouchers();
  if (vouchersLoading) {
    return <HomePageSkeleton />;
  }

  return (
    <div className="animate-fade-in">
      {/* ══════ Add Accessibility Widget Card ══════ */}
      {showA11yCard && (
        <div className="mx-5 mt-3 mb-1 rounded-[2rem] bg-white p-5 relative shadow-lg shadow-slate-200/60">
          {/* Close button */}
          <button
            onClick={dismissA11yCard}
            className="absolute top-5 end-5 text-slate-800 hover:text-black active:scale-90 transition-all"
            aria-label="Close"
          >
            <span className="material-symbols-outlined" style={{ fontSize: '22px' }}>close</span>
          </button>

          <div className="flex items-start gap-4 mb-6">
            {/* Accessibility icon with decorative glow — echoes the FAB's teal/cyan */}
            <div className="relative flex-shrink-0">
              <div className="absolute -top-3 -left-3 w-16 h-16 bg-teal-500/20 rounded-full blur-xl" />
              <div className="absolute top-1 left-0 w-12 h-12 bg-cyan-500/15 rounded-full blur-lg" />
              <div className="relative w-16 h-16 rounded-full bg-gradient-to-br from-[#0d9488] to-[#00d4ff] shadow-sm flex items-center justify-center rotate-[10deg]">
                <span className="material-symbols-outlined text-white" style={{ fontSize: '34px' }}>
                  accessibility_new
                </span>
              </div>
            </div>
            {/* Text */}
            <div className="flex-1 pe-6">
              <h2 className="text-xl font-bold text-slate-900 leading-tight mb-1">
                {t.home.addAccessibility}
              </h2>
              <p className="text-[15px] text-gray-500 leading-snug">
                {t.home.addAccessibilitySubtitle}
              </p>
            </div>
          </div>

          {/* Action buttons */}
          <div className="flex gap-3">
            <button
              onClick={dismissA11yCard}
              className="flex-1 py-3.5 bg-[#e5e7eb] text-slate-900 font-semibold rounded-full text-base active:scale-95 transition-transform"
            >
              {t.home.addAccessibilityCancel}
            </button>
            <button
              onClick={enableA11y}
              className="flex-1 py-3.5 bg-[#0a0a0b] text-white font-semibold rounded-full text-base active:scale-95 transition-transform"
            >
              {t.home.addAccessibilityCta}
            </button>
          </div>
        </div>
      )}

      {/* ══════ HeroBanner — above the fold, always rendered immediately ══════ */}
      <HeroBanner />

      {/* ══════ All sections below are lazy-loaded with skeleton placeholders ══════ */}

      {/* הטבות הטננט */}
      {tenantConfig && (
        <LazySection skeleton={<SkeletonCategoryRowCard />}>
          <TenantOffers />
        </LazySection>
      )}

      {/* ההמלצות של Nexus */}
      <LazySection skeleton={<SkeletonSliderRow startIndex={0} />}>
        <NexusPicksRow />
      </LazySection>

      {/* מותגים */}
      <LazySection skeleton={<SkeletonCircleRow />}>
        <BrandSlider />
      </LazySection>

      {/* ══════ Add to Home Screen Card ══════ */}
      {showA2HS && (
        <div className="mx-5 mt-3 mb-1 rounded-[2rem] bg-white p-5 relative shadow-lg shadow-slate-200/60">
          <button
            onClick={dismissA2HS}
            className="absolute top-5 end-5 text-slate-800 hover:text-black active:scale-90 transition-all"
            aria-label="Close"
          >
            <span className="material-symbols-outlined" style={{ fontSize: '22px' }}>close</span>
          </button>

          <div className="flex items-start gap-4 mb-6">
            <div className="relative flex-shrink-0">
              <div className="absolute -top-3 -left-3 w-16 h-16 bg-purple-500/20 rounded-full blur-xl" />
              <div className="absolute top-1 left-0 w-12 h-12 bg-indigo-500/15 rounded-full blur-lg" />
              <div className="relative w-16 h-16 rounded-2xl bg-white shadow-sm border border-border/60 overflow-hidden flex items-center justify-center -rotate-[10deg]">
                <img
                  src={logoSrc}
                  alt={appName}
                  className="w-12 h-12 object-contain"
                  onError={(e) => {
                    (e.target as HTMLImageElement).style.display = 'none';
                    const parent = (e.target as HTMLImageElement).parentElement;
                    if (parent) {
                      const fallback = document.createElement('span');
                      fallback.className = 'text-2xl font-bold text-primary';
                      fallback.textContent = 'N';
                      parent.appendChild(fallback);
                    }
                  }}
                />
              </div>
              {tenantConfig && (
                <div className="absolute -bottom-1 -start-1.5 w-6 h-6 rounded-full bg-white border-2 border-white shadow-sm flex items-center justify-center z-10">
                  <img src="/nexus-logo.png" alt="Nexus" className="w-4 h-4 object-contain rounded-full" />
                </div>
              )}
            </div>
            <div className="flex-1 pe-6">
              <h2 className="text-xl font-bold text-slate-900 leading-tight mb-1">
                {t.home.addToHomeScreen}
              </h2>
              <p className="text-[15px] text-gray-500 leading-snug">
                {t.home.addToHomeScreenSubtitle.replace('{app}', appName)}
              </p>
            </div>
          </div>

          <div className="flex gap-3">
            <button
              onClick={dismissA2HS}
              className="flex-1 py-3.5 bg-[#e5e7eb] text-slate-900 font-semibold rounded-full text-base active:scale-95 transition-transform"
            >
              {t.home.addToHomeScreenCancel}
            </button>
            <button className="flex-1 py-3.5 bg-[#0a0a0b] text-white font-semibold rounded-full text-base active:scale-95 transition-transform">
              {t.home.addToHomeScreenCta}
            </button>
          </div>
        </div>
      )}

      {/* הזמנות חוזרות */}
      <LazySection skeleton={<SkeletonSliderRow startIndex={2} />}>
        <TopStores />
      </LazySection>

      {/* הכי פופולרים */}
      <LazySection skeleton={<SkeletonSliderRow startIndex={4} />}>
        <PopularSlider onSelectFilter={handleSelectFilter} />
      </LazySection>

      {/* סקשן גולף */}
      {golfStoreCard && (
        <LazySection skeleton={<SkeletonBrandFeatureCard />}>
          {golfStoreCard}
        </LazySection>
      )}

      {/* במיוחד בשבילך */}
      <LazySection skeleton={<SkeletonSliderRow startIndex={1} />}>
        <ActiveOffers />
      </LazySection>

      {/* חנות H&M */}
      {hmStoreCard && (
        <LazySection skeleton={<SkeletonBrandFeatureCard />}>
          {hmStoreCard}
        </LazySection>
      )}

      {/* rhode — product catalog card */}
      {rhodeBusiness && (
        <LazySection skeleton={<SkeletonBrandCatalogCard />}>
          <BrandCatalogStore business={rhodeBusiness} />
        </LazySection>
      )}

      {/* בנר הפניות */}
      <LazySection skeleton={<SkeletonBanner />}>
        <ReferralBanner />
      </LazySection>

      {/* נצפו לאחרונה */}
      <LazySection skeleton={<SkeletonRecentlyViewed />}>
        <RecentlyViewed />
      </LazySection>

      {/* Yves Rocher — product catalog card */}
      {yvesBusiness && (
        <LazySection skeleton={<SkeletonBrandCatalogCard />}>
          <BrandCatalogStore business={yvesBusiness} />
        </LazySection>
      )}

      {/* קרוב אליך */}
      <LazySection skeleton={<SkeletonCategoryRowCard />}>
        <NearYou />
      </LazySection>

      {/* מומלץ */}
      <LazySection skeleton={<SkeletonSliderRow startIndex={3} />}>
        <RecommendedSlider onSelectFilter={handleSelectFilter} />
      </LazySection>

      {/* חדש */}
      <LazySection skeleton={<SkeletonSliderRow startIndex={5} />}>
        <NewSlider onSelectFilter={handleSelectFilter} />
      </LazySection>

      {/* נשים */}
      <LazySection skeleton={<SkeletonSliderRow startIndex={2} />}>
        <WomenSlider />
      </LazySection>

      {/* גברים */}
      <LazySection skeleton={<SkeletonSliderRow startIndex={4} />}>
        <MenSlider />
      </LazySection>

      {/* חיות מחמד */}
      <LazySection skeleton={<SkeletonSliderRow startIndex={1} />}>
        <PetsSlider />
      </LazySection>

      {/* בקרוב */}
      <LazySection skeleton={<SkeletonSliderRow startIndex={3} />}>
        <ComingSoonSlider onSelectFilter={handleSelectFilter} />
      </LazySection>

      {/* DEV PLAYGROUND — single entry point that opens a bottom sheet
          containing both the auth-flow test and the live-notifications
          test panel. Keeps the home page clean while giving devs one
          discoverable button for all the playground tooling. */}
      <div className="px-6 py-4">
        <button
          onClick={() => setShowDevSheet(true)}
          className="w-full py-3 rounded-2xl bg-warning/10 text-warning text-xs font-semibold border border-warning/20 active:scale-[0.98] transition-all"
        >
          🧪 Dev Playground
        </button>
      </div>

      {showDevSheet && <DevPlaygroundSheet onClose={() => setShowDevSheet(false)} />}
    </div>
  );
}
