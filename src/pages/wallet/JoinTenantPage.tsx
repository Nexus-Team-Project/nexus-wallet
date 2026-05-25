/**
 * Wallet join-tenant page. Search discoverable tenants, multi-select,
 * submit. Auto-accepted matches and freshly-pending requests are both
 * surfaced on the JoinSubmittedPage.
 *
 * Spec: docs/superpowers/specs/2026-05-25-nexus-wallet-auth-design.md section 9
 */
import { useEffect, useMemo, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useLanguage } from '../../i18n/LanguageContext';
import {
  discoverTenants,
  createJoinRequests,
  type DiscoverableTenant,
} from '../../services/walletTenants.service';

export default function JoinTenantPage() {
  const { lang = 'he' } = useParams();
  const navigate = useNavigate();
  const { language } = useLanguage();
  const isHe = language === 'he';
  const [query, setQuery] = useState('');
  const [tenants, setTenants] = useState<DiscoverableTenant[]>([]);
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [err, setErr] = useState('');

  // Debounced search.
  useEffect(() => {
    let active = true;
    setLoading(true);
    setErr('');
    const t = setTimeout(() => {
      discoverTenants(query)
        .then((list) => {
          if (active) setTenants(list);
        })
        .catch((e) => {
          if (active) setErr(e instanceof Error ? e.message : 'unknown');
        })
        .finally(() => {
          if (active) setLoading(false);
        });
    }, 250);
    return () => {
      active = false;
      clearTimeout(t);
    };
  }, [query]);

  const toggle = (tenantId: string) => {
    const next = new Set(selected);
    if (next.has(tenantId)) next.delete(tenantId);
    else next.add(tenantId);
    setSelected(next);
  };

  const submit = async () => {
    if (selected.size === 0) return;
    setSubmitting(true);
    setErr('');
    try {
      const out = await createJoinRequests(Array.from(selected));
      navigate(`/${lang}/wallet/join-submitted?created=${out.created.length}&auto=${out.autoAccepted.length}`);
    } catch (e) {
      setErr(e instanceof Error ? e.message : 'unknown');
    } finally {
      setSubmitting(false);
    }
  };

  const canSubmit = useMemo(() => selected.size > 0 && !submitting, [selected, submitting]);

  return (
    <div className="min-h-dvh bg-white pt-10 pb-20">
      <div className="max-w-md mx-auto px-6">
        <button
          onClick={() => navigate(`/${lang}/router`)}
          className="text-sm text-text-muted mb-3"
        >
          {isHe ? '← חזרה' : '← Back'}
        </button>
        <h1 className="text-xl font-bold text-text-primary mb-1">
          {isHe ? 'בקשת הצטרפות לארגון' : 'Request to join a tenant'}
        </h1>
        <p className="text-xs text-text-muted mb-4">
          {isHe
            ? 'בחר את הארגונים אליהם תרצה להצטרף. אדמין של הארגון יאשר או ידחה.'
            : 'Pick one or more tenants. The tenant admin approves or denies.'}
        </p>

        <input
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder={isHe ? 'חפש לפי שם...' : 'Search by name...'}
          className="w-full border border-border focus:border-primary outline-none rounded-2xl px-4 py-3 text-sm mb-4"
        />

        {loading && (
          <p className="text-sm text-text-muted">{isHe ? 'טוען...' : 'Loading...'}</p>
        )}

        {!loading && tenants.length === 0 && (
          <p className="text-sm text-text-muted">
            {isHe
              ? 'לא נמצאו ארגונים פנויים. נסה חיפוש אחר.'
              : 'No tenants found. Try a different search.'}
          </p>
        )}

        <div className="space-y-2 mb-6">
          {tenants.map((t) => {
            const isSelected = selected.has(t.tenantId);
            return (
              <button
                key={t.tenantId}
                onClick={() => toggle(t.tenantId)}
                className={`w-full p-4 rounded-2xl border text-start transition-colors ${
                  isSelected
                    ? 'border-primary bg-primary/5'
                    : 'border-border bg-white hover:bg-surface'
                }`}
              >
                <div className="flex items-center gap-3">
                  {t.logoUrl ? (
                    <img src={t.logoUrl} alt="" className="w-10 h-10 rounded-full object-cover flex-shrink-0" />
                  ) : (
                    <div className="w-10 h-10 rounded-full bg-surface flex-shrink-0" />
                  )}
                  <div className="flex-1 min-w-0">
                    <div className="font-semibold text-text-primary truncate">{t.tenantName}</div>
                  </div>
                  <div
                    className={`w-5 h-5 rounded-full border-2 flex-shrink-0 ${
                      isSelected ? 'border-primary bg-primary' : 'border-border'
                    }`}
                  />
                </div>
              </button>
            );
          })}
        </div>

        {err && <p className="text-sm text-error mb-3">{err}</p>}

        <button
          onClick={submit}
          disabled={!canSubmit}
          className="w-full py-3 rounded-2xl bg-primary text-white font-semibold disabled:opacity-40"
        >
          {submitting
            ? isHe
              ? 'שולח...'
              : 'Sending...'
            : isHe
              ? `שלח בקשה (${selected.size})`
              : `Send request (${selected.size})`}
        </button>
      </div>
    </div>
  );
}
