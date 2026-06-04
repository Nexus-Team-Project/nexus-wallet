import { useEffect } from 'react';
import { Outlet, useNavigate, useSearchParams } from 'react-router-dom';
import { LanguageProvider } from '../i18n/LanguageContext';
import AppToaster from '../components/AppToaster';
import LoginSheet from '../components/auth/LoginSheet';
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
  info: { organizationName: string; logoUrl?: string; brandColor?: string },
): TenantConfig {
  return {
    id,
    name: info.organizationName,
    nameHe: info.organizationName,
    // Real tenants only: no logo -> leave undefined so the UI shows initials.
    // (The Nexus logo is reserved for the ecosystem catalog, not per-tenant.)
    logo: info.logoUrl,
    // The tenant's chosen brand color when set; otherwise the Nexus default,
    // which resolveTenantColor() treats as "no custom theme" and replaces with
    // a stable per-tenant hashed color.
    primaryColor: info.brandColor ?? DEFAULT_PRIMARY_COLOR,
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
  const { me, loading } = useAuth();
  const { tenantId, config, setTenant, clearTenant } = useTenantStore();

  // Public-by-default: anonymous visitors may load any route. There is no
  // global redirect here anymore - the route tree (ProtectedRoute on the
  // member-only paths) decides what an anonymous user can reach.

  useEffect(() => {
    const tenantSlug = searchParams.get('tenant');
    const ecosystemMode = searchParams.get('ecosystem') === '1';

    /** Drop any tenant branding and remove a dead ?tenant= from the URL so the
     *  app falls back to the Nexus (ecosystem) catalog and the bad link does
     *  not persist on reload or when shared. */
    const goToEcosystem = (): void => {
      clearTenant();
      const next = new URLSearchParams(searchParams);
      next.delete('tenant');
      navigate({ search: next.toString() }, { replace: true });
    };

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
        // Prefer the user's own membership (name + logo) — a member tenant that
        // is not publicly listed still brands correctly, and we skip the public
        // endpoint, which 404s for tenants without an active public catalog.
        const membership = (me?.memberships ?? []).find((m) => m.tenantId === tenantSlug);
        if (membership) {
          setTenant(
            tenantSlug,
            buildPublicTenantConfig(tenantSlug, {
              organizationName: membership.tenantName,
              logoUrl: membership.logoUrl,
              brandColor: membership.brandColor,
            }),
          );
        } else if (loading) {
          // Auth is still resolving: we cannot yet tell a member of a
          // non-public tenant from a stranger. Wait for the re-run (me/loading
          // are in the deps) before deciding, so member branding is not lost.
        } else {
          // Logged-out or confirmed non-member: resolve the tenant's public
          // branding. An unknown tenant (no such tenant / catalog not active)
          // bounces to the Nexus (ecosystem) catalog and the dead ?tenant= is
          // stripped from the URL so a bad link does not stick on reload/share.
          fetchPublicTenant(tenantSlug)
            .then((info) => {
              if (info) {
                setTenant(tenantSlug, buildPublicTenantConfig(tenantSlug, info));
              } else {
                goToEcosystem();
              }
            })
            .catch(goToEcosystem);
        }
      }
    } else if (tenantId) {
      // A persisted tenant is set but missing from the URL. Only auto-restore
      // it when the user is actually a MEMBER of it — a remembered non-member /
      // pending tenant view must NOT silently re-enter on reload/navigation; it
      // falls back to the Nexus catalog instead.
      const isMember = (me?.memberships ?? []).some(
        (m) => m.tenantId === tenantId && m.isMember,
      );
      if (isMember) {
        const next = new URLSearchParams(searchParams);
        next.set('tenant', tenantId);
        navigate({ search: next.toString() }, { replace: true });
      } else {
        clearTenant();
      }
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
    // `me` is included so the tenant re-resolves once /api/me loads (e.g. a
    // refresh on a ?tenant=X member view) and brands from the membership.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [searchParams, setTenant, clearTenant, navigate, me, loading]);

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
        {/* Single app-wide toaster, RTL-aware (Hebrew toasts render right-to-left). */}
        <AppToaster />
        <LoginSheet />
        {/* Organization switching now lives in the TopBar org-name chip (opens
            TenantSwitchSheet); the old top-left switcher pill was removed. */}
      </div>
    </LanguageProvider>
  );
}