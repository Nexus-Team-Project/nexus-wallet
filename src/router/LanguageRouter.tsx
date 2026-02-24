import { useEffect } from 'react';
import { Outlet, useSearchParams } from 'react-router-dom';
import { LanguageProvider } from '../i18n/LanguageContext';
import LoginSheet from '../components/auth/LoginSheet';
import { useTenantStore } from '../stores/tenantStore';
import { lookupTenant, lookupTenantByCustomerId } from '../mock/handlers/tenant.handler';

/** Darken a hex color by a given percentage */
function darkenColor(hex: string, percent: number): string {
  const num = parseInt(hex.replace('#', ''), 16);
  const r = Math.max(0, (num >> 16) - Math.round(255 * (percent / 100)));
  const g = Math.max(0, ((num >> 8) & 0x00ff) - Math.round(255 * (percent / 100)));
  const b = Math.max(0, (num & 0x0000ff) - Math.round(255 * (percent / 100)));
  return `#${((r << 16) | (g << 8) | b).toString(16).padStart(6, '0')}`;
}

export default function LanguageRouter() {
  const [searchParams] = useSearchParams();
  const { config, setTenant, clearTenant } = useTenantStore();

  // Detect tenant from URL query params on mount
  useEffect(() => {
    const tenantSlug = searchParams.get('tenant');
    const customerId = searchParams.get('customerId');

    if (tenantSlug) {
      const tenantConfig = lookupTenant(tenantSlug);
      if (tenantConfig) {
        setTenant(tenantSlug, tenantConfig);
      } else {
        clearTenant();
      }
    } else if (customerId) {
      const tenantConfig = lookupTenantByCustomerId(customerId);
      if (tenantConfig) {
        setTenant(tenantConfig.id, tenantConfig);
      } else {
        clearTenant();
      }
    }
  }, [searchParams, setTenant, clearTenant]);

  // Inject tenant CSS variable overrides
  const tenantStyle = config
    ? ({
        '--color-primary': config.primaryColor,
        '--color-primary-dark': darkenColor(config.primaryColor, 12),
      } as React.CSSProperties)
    : undefined;

  return (
    <LanguageProvider>
      <div style={tenantStyle}>
        <Outlet />
        <LoginSheet />
      </div>
    </LanguageProvider>
  );
}
