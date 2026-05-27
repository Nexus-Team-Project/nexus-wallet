import { useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useLanguage } from '../i18n/LanguageContext';
import HeroBanner from '../components/home/HeroBanner';
import HomePageSkeleton from '../components/home/HomePageSkeleton';
import NexusPicksRow from '../components/home/NexusPicksRow';
import CardIssuanceBanner from '../components/home/CardIssuanceBanner';
import BrandSlider from '../components/home/BrandSlider';
import ActiveOffers from '../components/home/ActiveOffers';
import TopStores from '../components/home/TopStores';
import NearYou from '../components/home/NearYou';
import ReferralBanner from '../components/home/ReferralBanner';
import TenantOffers from '../components/home/TenantOffers';

import {
  PopularSlider,
  RecommendedSlider,
  NewSlider,
  OnlineSlider,
  ComingSoonSlider,
} from '../components/store/StoreSliders';
import { useAuthStore } from '../stores/authStore';
import { useTenantStore } from '../stores/tenantStore';
import { useVouchers } from '../hooks/useVouchers';
import type { StoreFilter } from '../types/voucher.types';

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

  const dismissA2HS = () => {
    setShowA2HS(false);
    localStorage.setItem(A2HS_DISMISSED_KEY, '1');
  };

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
      {/* ══════ Add to Home Screen Card ══════ */}
      {showA2HS && (
        <div className="mx-5 mt-3 mb-1 rounded-[2rem] bg-white p-5 relative shadow-lg shadow-slate-200/60">
          {/* Close button */}
          <button
            onClick={dismissA2HS}
            className="absolute top-5 end-5 text-slate-800 hover:text-black active:scale-90 transition-all"
            aria-label="Close"
          >
            <span className="material-symbols-outlined" style={{ fontSize: '22px' }}>close</span>
          </button>

          <div className="flex items-start gap-4 mb-6">
            {/* App icon with decorative glow */}
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
              {/* Nexus badge overlay — shown when tenant is active */}
              {tenantConfig && (
                <div className="absolute -bottom-1 -start-1.5 w-6 h-6 rounded-full bg-white border-2 border-white shadow-sm flex items-center justify-center z-10">
                  <img src="/nexus-logo.png" alt="Nexus" className="w-4 h-4 object-contain rounded-full" />
                </div>
              )}
            </div>
            {/* Text */}
            <div className="flex-1 pe-6">
              <h2 className="text-xl font-bold text-slate-900 leading-tight mb-1">
                {t.home.addToHomeScreen}
              </h2>
              <p className="text-[15px] text-gray-500 leading-snug">
                {t.home.addToHomeScreenSubtitle.replace('{app}', appName)}
              </p>
            </div>
          </div>

          {/* Action buttons */}
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

      {/* ההמלצות של Nexus עבורך — synced with last chat-sheet picks */}
      <NexusPicksRow />

      <HeroBanner />
      <BrandSlider />

      {/* הזמנות חוזרות */}
      <TopStores />

      {/* במיוחד בשבילך — 2nd when questionnaire is filled */}
      {hasProfile && <ActiveOffers />}

      {/* הכי פופולרים */}
      <PopularSlider onSelectFilter={handleSelectFilter} />

      {/* במיוחד בשבילך — 3rd (teaser) when questionnaire is not yet filled */}
      {!hasProfile && <ActiveOffers />}

      <ReferralBanner />

      {/* הטבות הטננט */}
      <TenantOffers />

      {/* קרוב אליך */}
      <NearYou />

      {/* באנר כרטיס אשראי — מעל הסליידרים */}
      <CardIssuanceBanner />

      {/* מומלץ */}
      <RecommendedSlider onSelectFilter={handleSelectFilter} />

      {/* חדש */}
      <NewSlider onSelectFilter={handleSelectFilter} />

      {/* הטבות אונליין */}
      <OnlineSlider onSelectFilter={handleSelectFilter} />

      {/* בקרוב */}
      <ComingSoonSlider onSelectFilter={handleSelectFilter} />

      {/* DEV ONLY */}
      <div className="px-6 py-4">
        <button
          onClick={() => navigate(`/${lang}/auth-flow/test`)}
          className="w-full py-3 rounded-2xl bg-warning/10 text-warning text-xs font-semibold border border-warning/20 active:scale-[0.98] transition-all"
        >
          🧪 Auth Flow Test (Dev)
        </button>
      </div>
    </div>
  );
}
