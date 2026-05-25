/**
 * Post-login chooser. Reads /api/me.router and renders cards scaled to
 * what the user actually has:
 *   - one card per tenant where the user is a plain member
 *   - "Open admin dashboard" if user has any privileged role or is a
 *     platform admin (hands off via /api/auth/create-code)
 *   - "Everyone's catalog" - stub navigation; Plan #4 wires real
 *     ecosystem-only filtering
 *   - "Request to join a tenant" - stub; Plan #4 wires the flow
 *
 * Shown after every successful login.
 *
 * Spec: docs/superpowers/specs/2026-05-25-nexus-wallet-auth-design.md sections 7 and 9
 */
import { useNavigate, useParams } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { api } from '../../lib/api';
import { useLanguage } from '../../i18n/LanguageContext';

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

  return (
    <div className="min-h-dvh bg-white pt-12 pb-16">
      <div className="max-w-md mx-auto px-6 space-y-3">
        <h1 className="text-xl font-bold text-text-primary mb-4">
          {isHe ? 'לאן ברצונך להיכנס?' : 'Where would you like to go?'}
        </h1>

        {r.showMemberTenants.map((t) => (
          <button
            key={t.tenantId}
            onClick={() => { void navigate(`/${lang}/store?tenant=${t.tenantId}`); }}
            className="w-full p-4 rounded-2xl border border-border bg-white text-start hover:bg-surface transition-colors"
          >
            <div className="font-semibold text-text-primary">{t.tenantName}</div>
            <div className="text-xs text-text-muted mt-1">
              {isHe ? 'צפה בקטלוג של הארגון שלך' : "View your organization's catalog"}
            </div>
          </button>
        ))}

        {r.showAdminEntry && (
          <button
            onClick={(): void => {
              void openAdminDashboard();
            }}
            className="w-full p-4 rounded-2xl border-2 border-primary bg-primary/5 text-start hover:bg-primary/10 transition-colors"
          >
            <div className="font-semibold text-primary">
              {isHe ? 'פתח לוח בקרה לאדמין' : 'Open admin dashboard'}
            </div>
            <div className="text-xs text-text-muted mt-1">dashboard.nexus-payment.com</div>
          </button>
        )}

        {r.showEveryonesCatalog && (
          <button
            onClick={() => { void navigate(`/${lang}/store?ecosystem=1`); }}
            className="w-full p-4 rounded-2xl border border-border bg-white text-start hover:bg-surface transition-colors"
          >
            <div className="font-semibold text-text-primary">
              {isHe ? 'הקטלוג של כולם' : "Everyone's catalog"}
            </div>
            <div className="text-xs text-text-muted mt-1">
              {isHe ? 'הצעות מאושרות במערכת האקוסיסטם' : 'Approved ecosystem offers'}
            </div>
          </button>
        )}

        {r.showJoinRequest && (
          <button
            onClick={() => {
              alert(
                isHe
                  ? 'בקרוב: חיפוש ארגון להצטרפות (Plan #4)'
                  : 'Coming soon: search for tenants to join (Plan #4)',
              );
            }}
            className="w-full p-4 rounded-2xl border border-border bg-white text-start hover:bg-surface transition-colors"
          >
            <div className="font-semibold text-text-primary">
              {isHe ? 'בקש להצטרף לארגון' : 'Request to join a tenant'}
            </div>
            <div className="text-xs text-text-muted mt-1">
              {isHe ? 'חפש ושלח בקשת הצטרפות (בקרוב)' : 'Search and send a join request (coming soon)'}
            </div>
          </button>
        )}
      </div>
    </div>
  );
}
