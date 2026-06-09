import { useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useLanguage } from '../i18n/LanguageContext';
import HomePageSkeleton from '../components/home/HomePageSkeleton';
import AddToHomeScreenCard from '../components/home/AddToHomeScreenCard';
import HomeFeed from '../components/home/HomeFeed';
import { useTenantStore } from '../stores/tenantStore';
import { useVouchers } from '../hooks/useVouchers';
import type { StoreFilter } from '../types/voucher.types';

const A2HS_DISMISSED_KEY = 'nexus_a2hs_dismissed';

export default function HomePage() {
  const { lang = 'he' } = useParams();
  const { language } = useLanguage();
  const navigate = useNavigate();
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
      {showA2HS && (
        <AddToHomeScreenCard
          logoSrc={logoSrc}
          appName={appName}
          showNexusBadge={!!tenantConfig}
          onDismiss={dismissA2HS}
        />
      )}

      <HomeFeed onSelectFilter={handleSelectFilter} />
    </div>
  );
}
