/**
 * Post-login chooser. Reads /api/me.router and renders cards scaled to
 * what the user actually has:
 *   - Tenant memberships render as ONE dropdown card when the user
 *     belongs to multiple tenants, or a flat card when they belong to
 *     just one. Avoids a tall stack of identical-looking rows for
 *     users in many organizations.
 *   - "Open admin dashboard" if user has any privileged role or is a
 *     platform admin (hands off via /api/auth/create-code) - primary
 *     accent.
 *   - "Nexus-Catalog" - indigo gradient accent so it visually stands
 *     out from tenant cards as a cross-tenant view.
 *   - "Request to join a tenant" - amber gradient accent, signaling
 *     a join-flow that needs admin approval.
 *
 * Spec: docs/superpowers/specs/2026-05-25-nexus-wallet-auth-design.md sections 7 and 9
 */
import { useEffect, useRef, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { ChevronDown } from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import { api } from '../../lib/api';
import { useLanguage } from '../../i18n/LanguageContext';
import TenantAvatar from '../../components/wallet/TenantAvatar';

interface MemberTenant {
  tenantId: string;
  tenantName: string;
}

/**
 * Custom dropdown for picking among many member tenants. Renders a
 * trigger card that matches the page's other choice cards, then
 * reveals a vertically-scrolling list of tenants on click. Closes on
 * outside-click and on selection.
 *
 * Input: tenants list and a callback fired when a tenant is picked.
 * Output: dropdown card UI.
 */
function MemberTenantsDropdown({
  tenants,
  isHe,
  onPick,
}: {
  tenants: MemberTenant[];
  isHe: boolean;
  onPick: (tenantId: string) => void;
}) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  // Outside-click closes the panel. We listen for mousedown so the
  // click that opened it does not immediately close it.
  useEffect(() => {
    if (!open) return;
    const onDocClick = (e: MouseEvent): void => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    const id = window.setTimeout(() => {
      document.addEventListener('mousedown', onDocClick);
    }, 0);
    return () => {
      window.clearTimeout(id);
      document.removeEventListener('mousedown', onDocClick);
    };
  }, [open]);

  const countLabel = isHe
    ? `${tenants.length} ארגונים`
    : `${tenants.length} organizations`;

  return (
    <div ref={ref} className="relative">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        aria-expanded={open}
        className="w-full p-4 rounded-2xl border border-border bg-white text-start hover:bg-surface transition-colors flex items-center justify-between gap-3"
      >
        <div className="min-w-0 flex-1">
          <div className="font-semibold text-text-primary">
            {isHe ? 'בחר את הארגון שלך' : 'Pick your organization'}
          </div>
          <div className="text-xs text-text-muted mt-1">{countLabel}</div>
        </div>
        {/* Lucide icon - the wallet does not load the material-icons
            font (only material-symbols-outlined is loaded), so a
            font-ligature here renders the literal text 'expand_more'. */}
        <ChevronDown
          size={22}
          className={`text-text-muted transition-transform flex-shrink-0 ${open ? 'rotate-180' : ''}`}
          aria-hidden="true"
        />
      </button>

      {open && (
        <div className="absolute z-20 mt-2 w-full max-h-72 overflow-y-auto rounded-2xl border border-border bg-white shadow-lg">
          <ul className="py-1">
            {tenants.map((t) => (
              <li key={t.tenantId}>
                <button
                  type="button"
                  onClick={() => {
                    setOpen(false);
                    onPick(t.tenantId);
                  }}
                  className="w-full px-4 py-3 flex items-center gap-3 text-start hover:bg-surface transition-colors"
                >
                  <TenantAvatar name={t.tenantName} size={32} />
                  <span className="font-semibold text-text-primary truncate">
                    {t.tenantName}
                  </span>
                </button>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}

/**
 * Single-tenant fallback: when a user has exactly one membership we
 * skip the dropdown and render a flat card identical in spirit to
 * the previous version so the click target stays one tap.
 */
function SingleTenantCard({
  tenant,
  isHe,
  onPick,
}: {
  tenant: MemberTenant;
  isHe: boolean;
  onPick: (tenantId: string) => void;
}) {
  return (
    <button
      type="button"
      onClick={() => onPick(tenant.tenantId)}
      className="w-full p-4 rounded-2xl border border-border bg-white text-start hover:bg-surface transition-colors flex items-center gap-3"
    >
      <TenantAvatar name={tenant.tenantName} size={40} />
      <div className="min-w-0 flex-1">
        <div className="font-semibold text-text-primary truncate">{tenant.tenantName}</div>
        <div className="text-xs text-text-muted mt-1">
          {isHe ? 'צפה בקטלוג של הארגון שלך' : "View your organization's catalog"}
        </div>
      </div>
    </button>
  );
}

export default function RouterScreen() {
  const { me, loading } = useAuth();
  const navigate = useNavigate();
  const { lang = 'he' } = useParams();
  const { language } = useLanguage();
  const isHe = language === 'he';

  if (loading) {
    return (
      <div className="min-h-dvh bg-white flex items-center justify-center text-text-muted">
        {isHe ? 'טוען...' : 'Loading...'}
      </div>
    );
  }
  if (!me?.router) {
    return (
      <div className="min-h-dvh bg-white flex items-center justify-center text-text-muted">
        {isHe ? 'יש להתחבר תחילה' : 'Please log in first'}
      </div>
    );
  }

  const r = me.router;

  async function openAdminDashboard(): Promise<void> {
    try {
      const code = await api<{ code: string }>('/api/auth/create-code', { method: 'POST' });
      const dashboardUrl =
        (import.meta.env.VITE_DASHBOARD_URL as string | undefined) ?? 'http://localhost:5174';
      window.location.href = `${dashboardUrl}/auth/callback?code=${code.code}&redirect=/&lang=${lang}`;
    } catch {
      // Stay on the router; user can pick another option.
    }
  }

  const goToTenant = (tenantId: string): void => {
    void navigate(`/${lang}/store?tenant=${tenantId}`);
  };

  return (
    <div className="min-h-dvh bg-white pt-12 pb-16">
      <div className="max-w-md mx-auto px-6 space-y-3">
        <h1 className="text-xl font-bold text-text-primary mb-4">
          {isHe ? 'לאן ברצונך להיכנס?' : 'Where would you like to go?'}
        </h1>

        {r.showMemberTenants.length === 1 && (
          <SingleTenantCard tenant={r.showMemberTenants[0]!} isHe={isHe} onPick={goToTenant} />
        )}
        {r.showMemberTenants.length > 1 && (
          <MemberTenantsDropdown tenants={r.showMemberTenants} isHe={isHe} onPick={goToTenant} />
        )}

        {r.showAdminEntry && (
          <button
            onClick={(): void => { void openAdminDashboard(); }}
            className="w-full p-4 rounded-2xl border-2 border-primary bg-primary/5 text-start hover:bg-primary/10 transition-colors"
          >
            <div className="font-semibold text-primary">
              {isHe ? 'פתח לוח בקרה לאדמין' : 'Open admin dashboard'}
            </div>
            <div className="text-xs text-text-muted mt-1">dashboard.nexus-payment.com</div>
          </button>
        )}

        {/* Nexus-Catalog: indigo gradient. A cross-tenant view, visually
            distinct from the tenant cards above to signal a different
            context (not 'your tenant' but 'the whole ecosystem'). The
            avatar uses the actual Nexus brand mark inside a white
            circle so the card reads as 'the Nexus catalog' even at
            avatar-only sizes. */}
        {r.showEveryonesCatalog && (
          <button
            onClick={() => { void navigate(`/${lang}/store?ecosystem=1`); }}
            className="group w-full p-4 rounded-2xl text-start transition-all bg-gradient-to-br from-indigo-50 to-blue-50 border border-indigo-200 hover:from-indigo-100 hover:to-blue-100 hover:border-indigo-300"
          >
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-white border border-indigo-200 flex items-center justify-center flex-shrink-0 shadow-sm overflow-hidden">
                <img
                  src="/nexus-logo.png"
                  alt=""
                  className="w-7 h-7 object-contain"
                />
              </div>
              <div className="min-w-0 flex-1">
                <div className="font-semibold text-indigo-900">
                  {isHe ? 'קטלוג נקסוס' : 'Nexus-Catalog'}
                </div>
                <div className="text-xs text-indigo-700/80 mt-0.5">
                  {isHe ? 'כל ההצעות המאושרות במערכת נקסוס' : 'All approved Nexus ecosystem offers'}
                </div>
              </div>
            </div>
          </button>
        )}

        {/* Join organization: amber gradient. Signals a different kind
            of action (request, not an immediate view) and pairs with
            the amber pending-requests panel on the dashboard side.
            Mock community illustration lives in /public/join-tenant.svg
            until product ships a final asset. */}
        {r.showJoinRequest && (
          <button
            onClick={() => { void navigate(`/${lang}/wallet/join-tenant`); }}
            className="group w-full p-4 rounded-2xl text-start transition-all bg-gradient-to-br from-amber-50 to-orange-50 border border-amber-200 hover:from-amber-100 hover:to-orange-100 hover:border-amber-300"
          >
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-gradient-to-br from-amber-500 to-orange-500 flex items-center justify-center flex-shrink-0 shadow-sm overflow-hidden">
                <img
                  src="/join-tenant.svg"
                  alt=""
                  className="w-7 h-7 object-contain"
                />
              </div>
              <div className="min-w-0 flex-1">
                <div className="font-semibold text-amber-900">
                  {isHe ? 'בקש להצטרף לארגון' : 'Request to join a tenant'}
                </div>
                <div className="text-xs text-amber-800/80 mt-0.5">
                  {isHe ? 'חפש ושלח בקשת הצטרפות' : 'Search and send a join request'}
                </div>
              </div>
            </div>
          </button>
        )}
      </div>
    </div>
  );
}
