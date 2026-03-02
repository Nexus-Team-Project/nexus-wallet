import { useNavigate, useParams } from 'react-router-dom';
import HeroBanner from '../components/home/HeroBanner';
import BrandSlider from '../components/home/BrandSlider';
import ActiveOffers from '../components/home/ActiveOffers';
import TopStores from '../components/home/TopStores';
import NearYou from '../components/home/NearYou';
import ReferralBanner from '../components/home/ReferralBanner';
import TenantOffers from '../components/home/TenantOffers';
import StoreSliders from '../components/store/StoreSliders';
import type { StoreFilter } from '../types/voucher.types';

export default function HomePage() {
  const { lang = 'he' } = useParams();
  const navigate = useNavigate();

  const handleSelectFilter = (filter: StoreFilter) => {
    navigate(`/${lang}/store`, { state: { filter } });
  };

  return (
    <div className="animate-fade-in">
      <HeroBanner />
      <BrandSlider />
      <TopStores />
      <ReferralBanner />
      <TenantOffers />
      <StoreSliders onSelectFilter={handleSelectFilter} />
      <NearYou />
      <ActiveOffers />

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
