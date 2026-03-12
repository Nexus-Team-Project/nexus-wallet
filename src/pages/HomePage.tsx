import { useNavigate, useParams } from 'react-router-dom';
import HeroBanner from '../components/home/HeroBanner';
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
import type { StoreFilter } from '../types/voucher.types';

export default function HomePage() {
  const { lang = 'he' } = useParams();
  const navigate = useNavigate();
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated);
  const profileCompleted = useAuthStore((s) => s.profileCompleted);

  // "במיוחד בשבילך" (ActiveOffers) position:
  //   hasProfile  → 2nd: right after TopStores (real personalized recommendations)
  //   !hasProfile → 3rd: after PopularSlider  (shows teaser card only)
  const hasProfile = isAuthenticated && profileCompleted;

  const handleSelectFilter = (filter: StoreFilter) => {
    navigate(`/${lang}/store`, { state: { filter } });
  };

  return (
    <div className="animate-fade-in">
      <HeroBanner />
      <CardIssuanceBanner />
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
