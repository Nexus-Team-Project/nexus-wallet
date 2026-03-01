import { useParams } from 'react-router-dom';
import HeroBanner from '../components/home/HeroBanner';
import BrandSlider from '../components/home/BrandSlider';
import ActiveOffers from '../components/home/ActiveOffers';
import TopStores from '../components/home/TopStores';
import NearYou from '../components/home/NearYou';
import ReferralBanner from '../components/home/ReferralBanner';
import TenantOffers from '../components/home/TenantOffers';

export default function HomePage() {
  const { lang: _lang } = useParams();

  return (
    <div className="animate-fade-in">
      <HeroBanner />
      <BrandSlider />
      <TopStores />
      <ReferralBanner />
      <TenantOffers />
      <NearYou />
      <ActiveOffers />
    </div>
  );
}
