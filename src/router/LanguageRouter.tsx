import { useEffect } from 'react';
import { Outlet, useNavigate, useSearchParams } from 'react-router-dom';
import { LanguageProvider } from '../i18n/LanguageContext';
import LoginSheet from '../components/auth/LoginSheet';
import { TenantSimulator } from '../components/dev/TenantSimulator';
import { UserTypeSimulator } from '../components/dev/UserTypeSimulator';
import { useTenantStore } from '../stores/tenantStore';
import { lookupTenant } from '../mock/handlers/tenant.handler';

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
        {/* Dev overlays MUST come last in DOM order.
            On iOS Safari, position:fixed elements lose pointer-event priority
            to later-in-DOM block elements even when z-index is higher.
            Rendering them last guarantees they win both the CSS stacking AND
            the iOS hit-test DOM-order tiebreaker.
            TenantSimulator: top-left pill toggle (top: 12).
            UserTypeSimulator: below it (top: 44), same left edge. */}
        <TenantSimulator />
        <UserTypeSimulator />
      </div>
    </LanguageProvider>
  );
}