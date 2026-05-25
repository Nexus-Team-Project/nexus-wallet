import { useEffect } from 'react';
import { Outlet, useLocation, useNavigate, useParams, useSearchParams } from 'react-router-dom';
import { LanguageProvider } from '../i18n/LanguageContext';
import LoginSheet from '../components/auth/LoginSheet';
import WalletTenantSwitcher from '../components/wallet/WalletTenantSwitcher';
import { useAuth } from '../contexts/AuthContext';
import { useTenantStore } from '../stores/tenantStore';
import { lookupTenant } from '../mock/handlers/tenant.handler';

/**
 * Paths under /:lang that anonymous visitors are allowed to load
 * directly. Everything else gets bounced to /:lang where the
 * AnonymousSplash + LoginSheet take over.
 *
 * Why this allowlist exists: the SMS-OTP flow temporarily routes an
 * un-authenticated user through /auth/email-required and
 * /auth/email-otp before the session is minted. Those two pages MUST
 * be reachable anonymous; everything else is post-login.
 */
const ANONYMOUS_ALLOW_PATTERNS: RegExp[] = [
  /^\/[a-z]{2}\/?$/,                     // /:lang itself (the landing)
  /^\/[a-z]{2}\/auth\/email-required\/?/, // mid-signup
  /^\/[a-z]{2}\/auth\/email-otp\/?/,      // mid-signup
];

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
  const { lang = 'he' } = useParams();
  const { tenantId, config, setTenant, clearTenant } = useTenantStore();
  const { me, loading: authLoading, postLoginRedirect, clearPostLoginRedirect } = useAuth();

  /**
   * Global auth middleware. Anonymous visitors land on /:lang only.
   * Every other route under /:lang gets redirected back to /:lang.
   * Runs after the auth bootstrap completes so a valid refresh-cookie
   * session is not redirected away mid-load.
   */
  useEffect(() => {
    if (authLoading) return;
    if (me) return;
    const allowed = ANONYMOUS_ALLOW_PATTERNS.some((re) => re.test(location.pathname));
    if (allowed) return;
    navigate(`/${lang}`, { replace: true });
  }, [authLoading, me, location.pathname, lang, navigate]);

  /**
   * Post-login redirect. AuthContext sets postLoginRedirect after a
   * successful Google redirect-flow exchange (the only login path that
   * bypasses LoginSheet's navigate-to-router branch). Here we consume
   * the signal and route the user to RouterScreen so they always see
   * the chooser first.
   */
  useEffect(() => {
    if (!postLoginRedirect) return;
    if (!me) return;
    navigate(`/${lang}${postLoginRedirect}`, { replace: true });
    clearPostLoginRedirect();
  }, [postLoginRedirect, me, lang, navigate, clearPostLoginRedirect]);

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
        {/* Real tenant switcher when logged in. Dev-only simulators
            (TenantSimulator + UserTypeSimulator) were removed - they
            were vestiges of the mock-auth era and polluted the
            anonymous splash. Re-add behind an env flag if needed. */}
        {me && <WalletTenantSwitcher />}
      </div>
    </LanguageProvider>
  );
}