import { useEffect } from 'react';
import { Outlet, useNavigate, useSearchParams } from 'react-router-dom';
import { LanguageProvider } from '../i18n/LanguageContext';
import LoginSheet from '../components/auth/LoginSheet';
import { TenantSimulator } from '../components/dev/TenantSimulator';
import { useTenantStore } from '../stores/tenantStore';
import { lookupTenant } from '../mock/handlers/tenant.handler';

/** Darken a hex color by a given percentage */
function darkenColor(hex: string, percent: number): string {
  const num = parseInt(hex.replace('#', ''), 16);
  const r = Math.max(0, (num >> 16) - Math.round(255 * (percent / 100)));
  const g = Math.max(0, ((num >> 8) & 0x00ff) - Math.round(255 * (percent / 100)));
  const b = Math.max(0, (num & 0x0000ff) - Math.round(255 * (percent / 100)));
  return ;
}

export default function LanguageRouter() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { tenantId, config, setTenant, clearTenant } = useTenantStore();

  useEffect(() => {
    const tenantSlug = searchParams.get('tenant');

    if (tenantSlug) {
      // ?tenant= in URL → set (or refresh) tenant
      const tenantConfig = lookupTenant(tenantSlug);
      if (tenantConfig) {
        setTenant(tenantSlug, tenantConfig);
      } else {
        clearTenant();
      }
    } else if (tenantId) {
      // Tenant is active but missing from URL → restore it silently
      const next = new URLSearchParams(searchParams);
      next.set('tenant', tenantId);
      navigate({ search: next.toString() }, { replace: true });
    } else {
      // No tenant anywhere → clear (ensures Nexus colors on plain home)
      clearTenant();
    }
  }, [searchParams, setTenant, clearTenant, tenantId, navigate]);

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
        <TenantSimulator />
        <Outlet />
        <LoginSheet />
      </div>
    </LanguageProvider>
  );
}