import { useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { useLanguage } from '../i18n/LanguageContext';
import { useAuth } from '../contexts/AuthContext';
import { useTenantStore } from '../stores/tenantStore';
import AddToHomeScreenCard from '../components/home/AddToHomeScreenCard';
import HomeFeed from '../components/home/HomeFeed';
import type { StoreFilter } from '../types/voucher.types';

// Shared with the home page so dismissing the card on either surface hides it
// on both — it's the same promo.
const A2HS_DISMISSED_KEY = 'nexus_a2hs_dismissed';

export default function StorePage() {
  const [searchParams] = useSearchParams();
  const { language } = useLanguage();
  const { me } = useAuth();
  const tenantConfig = useTenantStore((s) => s.config);

  // Resolve the brand shown on the add-to-home-screen card, mirroring the
  // TopBar: ecosystem / anonymous-with-no-tenant → Nexus; a real tenant
  // context (?tenant=X, resolved via membership or the public-tenant config)
  // → that tenant's logo + name, with the small Nexus badge overlaid.
  const isEcosystem = searchParams.get('ecosystem') === '1';
  const urlTenantId = !isEcosystem ? searchParams.get('tenant') : null;
  const activeMembership = urlTenantId
    ? me?.memberships?.find((m) => m.tenantId === urlTenantId)
    : undefined;
  const hasTenant = !isEcosystem && (!!tenantConfig || !!activeMembership);
  const tenantLogo = hasTenant ? (activeMembership?.logoUrl ?? tenantConfig?.logo ?? null) : null;
  const a2hsLogo = tenantLogo ?? '/nexus-logo.png';
  const a2hsName = hasTenant
    ? (activeMembership?.tenantName
        ?? (language === 'he' ? tenantConfig?.nameHe : tenantConfig?.name)
        ?? 'Nexus')
    : 'Nexus';

  const [showA2HS, setShowA2HS] = useState(
    () => !localStorage.getItem(A2HS_DISMISSED_KEY)
  );
  const dismissA2HS = () => {
    setShowA2HS(false);
    localStorage.setItem(A2HS_DISMISSED_KEY, '1');
  };

  // The store front door mirrors the home page. The dedicated "voucher store"
  // catalog (search + category pills + grid) is intentionally NOT rendered yet
  // — once offers are real they'll surface in the feed above the Dev Playground
  // button. Slider filter chips are a no-op for now (no in-page grid to filter).
  const handleSelectFilter = (_filter: StoreFilter) => {};

  return (
    <div className="space-y-4 animate-fade-in">
      {showA2HS && (
        <AddToHomeScreenCard
          logoSrc={a2hsLogo}
          appName={a2hsName}
          showNexusBadge={hasTenant && !!tenantLogo}
          onDismiss={dismissA2HS}
        />
      )}
      <HomeFeed onSelectFilter={handleSelectFilter} />
    </div>
  );
}
