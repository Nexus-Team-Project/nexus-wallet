/**
 * Top-left context switcher shown when the user is logged in. Lets them
 * pick between any tenant they belong to as a member and "everyone's
 * catalog" (ecosystem-approved offers across the platform).
 *
 * Sits in the same screen position the dev-only TenantSimulator used
 * to occupy. When the user is not logged in, this component renders
 * nothing - LanguageRouter falls back to the dev simulator.
 *
 * Behavior:
 * - Pill button shows the current context label.
 * - Click opens a small dropdown listing all options.
 * - Selecting a tenant -> URL gets ?tenant=<id>, ?ecosystem is cleared.
 * - Selecting "everyone's catalog" -> URL gets ?ecosystem=1, ?tenant is cleared.
 * - URL state is the source of truth so refresh / direct link both work.
 *
 * Spec: docs/superpowers/specs/2026-05-25-nexus-wallet-auth-design.md sections 7, 9
 */
import { useEffect, useRef, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { useLanguage } from '../../i18n/LanguageContext';

export default function WalletTenantSwitcher() {
  const { me } = useAuth();
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { language } = useLanguage();
  const isHe = language === 'he';
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  // Close on outside click.
  useEffect(() => {
    if (!open) return;
    const onDocClick = (e: MouseEvent): void => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener('mousedown', onDocClick);
    return () => document.removeEventListener('mousedown', onDocClick);
  }, [open]);

  if (!me) return null;

  const tenants = me.router?.showMemberTenants ?? [];
  const ecosystem = searchParams.get('ecosystem') === '1';
  const activeTenantId = !ecosystem ? searchParams.get('tenant') : null;
  const activeTenant = tenants.find((t) => t.tenantId === activeTenantId);

  const currentLabel = ecosystem
    ? isHe
      ? 'הקטלוג של כולם'
      : "Everyone's catalog"
    : activeTenant
      ? activeTenant.tenantName
      : isHe
        ? 'בחר הקשר'
        : 'Pick context';

  /** Switch to a specific tenant. Clears ?ecosystem. */
  const pickTenant = (tenantId: string): void => {
    const next = new URLSearchParams(searchParams);
    next.set('tenant', tenantId);
    next.delete('ecosystem');
    navigate({ search: next.toString() }, { replace: true });
    setOpen(false);
  };

  /** Switch to everyone's catalog. Clears ?tenant. */
  const pickEcosystem = (): void => {
    const next = new URLSearchParams(searchParams);
    next.set('ecosystem', '1');
    next.delete('tenant');
    navigate({ search: next.toString() }, { replace: true });
    setOpen(false);
  };

  return (
    <div
      ref={ref}
      style={{
        position: 'fixed',
        top: 12,
        left: 12,
        zIndex: 99999,
        pointerEvents: 'auto',
        touchAction: 'manipulation',
      }}
    >
      <button
        onClick={() => setOpen((v) => !v)}
        style={{
          display: 'inline-flex',
          alignItems: 'center',
          gap: 6,
          maxWidth: 200,
          padding: '6px 10px',
          borderRadius: 999,
          background: ecosystem || activeTenant ? '#6366f1' : '#555',
          color: '#fff',
          border: 'none',
          fontSize: 12,
          fontWeight: 600,
          boxShadow: '0 2px 6px rgba(0,0,0,0.35)',
          cursor: 'pointer',
          WebkitTapHighlightColor: 'transparent',
        }}
        title={currentLabel}
      >
        <span style={{ whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
          {currentLabel}
        </span>
        <span style={{ fontSize: 14, lineHeight: 1 }}>{open ? '▴' : '▾'}</span>
      </button>

      {open && (
        <div
          style={{
            position: 'absolute',
            top: 36,
            left: 0,
            minWidth: 220,
            maxWidth: 280,
            background: '#fff',
            borderRadius: 12,
            boxShadow: '0 8px 24px rgba(0,0,0,0.18)',
            padding: 6,
            zIndex: 99999,
          }}
        >
          {tenants.map((t) => {
            const isActive = t.tenantId === activeTenantId;
            return (
              <button
                key={t.tenantId}
                onClick={() => pickTenant(t.tenantId)}
                style={{
                  display: 'block',
                  width: '100%',
                  textAlign: 'start',
                  padding: '8px 10px',
                  borderRadius: 8,
                  background: isActive ? '#eef2ff' : 'transparent',
                  color: isActive ? '#4338ca' : '#1f2937',
                  fontSize: 13,
                  fontWeight: 600,
                  border: 'none',
                  cursor: 'pointer',
                  whiteSpace: 'nowrap',
                  overflow: 'hidden',
                  textOverflow: 'ellipsis',
                }}
              >
                {t.tenantName}
              </button>
            );
          })}
          {tenants.length > 0 && (
            <div style={{ height: 1, background: '#e5e7eb', margin: '4px 6px' }} />
          )}
          <button
            onClick={pickEcosystem}
            style={{
              display: 'block',
              width: '100%',
              textAlign: 'start',
              padding: '8px 10px',
              borderRadius: 8,
              background: ecosystem ? '#eef2ff' : 'transparent',
              color: ecosystem ? '#4338ca' : '#1f2937',
              fontSize: 13,
              fontWeight: 600,
              border: 'none',
              cursor: 'pointer',
            }}
          >
            {isHe ? 'הקטלוג של כולם' : "Everyone's catalog"}
          </button>
        </div>
      )}
    </div>
  );
}
