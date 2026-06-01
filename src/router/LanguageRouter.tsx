import { useEffect } from 'react';
import { Outlet, useLocation, useNavigate, useSearchParams } from 'react-router-dom';
import { LanguageProvider } from '../i18n/LanguageContext';
import LoginSheet from '../components/auth/LoginSheet';
import WalletTenantSwitcher from '../components/wallet/WalletTenantSwitcher';
import { useAuth } from '../contexts/AuthContext';
import { useTenantStore } from '../stores/tenantStore';
import { lookupTenant } from '../mock/handlers/tenant.handler';
import { fetchPublicTenant } from '../services/publicTenant.service';
import type { TenantConfig } from '../types/tenant.types';

/**
 * Default brand color used when a tenant has no themed config of its
 * own. Mirrors the `--color-primary` CSS variable (Nexus brand) declared
 * in index.css so anonymous ?tenant=X links that only know a real org's
 * name/logo still render with consistent Nexus theming.
 */
const DEFAULT_PRIMARY_COLOR = '#635bff';

/**
 * Build a minimal TenantConfig (name/logo only) from public endpoint info.
 * Real backend tenants have no themed mock entry, so we synthesize a config
 * that carries the org name + logo and falls back to the Nexus brand color.
 * @param id domain tenantId from ?tenant=X
 * @param info public tenant info (organization name + optional logo URL)
 * @returns a TenantConfig safe to feed into the tenant store / theme.
 */
function buildPublicTenantConfig(
  id: string,
  info: { organizationName: string; logoUrl?: string },
): TenantConfig {
  return {
    id,
    name: info.organizationName,
    nameHe: info.organizationName,
    logo: info.logoUrl ?? '/nexus-logo.png',
    primaryColor: DEFAULT_PRIMARY_COLOR,
    requiresMembershipFee: false,
  };
}

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
  const navigate = useNavigate();
  const location = useLocation();
  const { tenantId, config, setTenant, clearTenant } = useTenantStore();
  const { me } = useAuth();

  // Public-by-default: anonymous visitors may load any route. There is no
  // global redirect here anymore - the route tree (ProtectedRoute on the
  // member-only paths) decides what an anonymous user can reach.

  useEffect(() => {
    const tenantSlug = searchParams.get('tenant');
    const ecosystemMode = searchParams.get('ecosystem') === '1';

    if (ecosystemMode) {
      // User explicitly picked Nexus-Catalog: drop any persisted tenant
      // so the TopBar / theme reflect ecosystem context. Without this,
      // the else-if branch below would silently re-add ?tenant=<id>
      // from the Zustand store and the UI would keep showing the
      // tenant name after the user opted into ecosystem view.
      clearTenant();
    } else if (tenantSlug) {
      const tenantConfig = lookupTenant(tenantSlug);
      if (tenantConfig) {
        setTenant(tenantSlug, tenantConfig);
      } else {
        // Not a known mock tenant - resolve the REAL org name/logo from the
        // public endpoint so anonymous ?tenant=X links still brand correctly.
        // 404 (no such tenant / catalog not active) -> clear to Nexus.
        fetchPublicTenant(tenantSlug)
          .then((info) => {
            if (info) {
              setTenant(tenantSlug, buildPublicTenantConfig(tenantSlug, info));
            } else {
              clearTenant();
            }
          })
          .catch(() => clearTenant());
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
    // NOTE: tenantId is intentionally excluded from deps.
    // This effect must only re-run when the URL (searchParams) changes.
    // Including tenantId causes a React 18 concurrent-mode race: Zustand's
    // useSyncExternalStore forces an urgent synchronous re-render after
    // setTenant() fires (step above), but React Router's location update is
    // deferred via startTransition and may not have committed yet.  That
    // stale-searchParams render triggers the else-if(tenantId) branch which
    // issues a competing navigate({replace}) that races the original push and
    // causes the URL to immediately revert.  The else-if branch reads tenantId
    // from the closure of whichever render triggered the effect (always the
    // render caused by a searchParams change), so the value is always correct.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [searchParams, setTenant, clearTenant, navigate]);

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
        {/* Real tenant switcher when logged in. Hidden on the auth-flow
            story onboarding chain (new-user / org-user) where showing the
            top-left "Pick view" chip would be redundant and confusing
            while the user is still choosing their context. */}
        {me &&
          !/^\/[a-z]{2}\/auth-flow(\/|$)/.test(location.pathname) && (
            <WalletTenantSwitcher />
          )}
      </div>
    </LanguageProvider>
  );
}