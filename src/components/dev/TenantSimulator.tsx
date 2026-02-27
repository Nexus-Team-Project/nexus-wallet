/**
 * TenantSimulator — dev chip to simulate tenant context via URL params.
 *
 * Visible when:
 *   • running locally (import.meta.env.DEV), OR
 *   • ?dev=1 in URL  →  saves to localStorage, persists across navigations
 *   • ?dev=0         →  clears the flag
 *
 * Clicking a tenant navigates to ?tenant=<id>.
 * LanguageRouter already handles those params — no store manipulation needed.
 */

import { useState } from 'react';
import { mockTenants } from '../../mock/data/tenants.mock';
import { useTenantStore } from '../../stores/tenantStore';

const LAST_TENANT_KEY = 'nexus_dev_last_tenant';

export function TenantSimulator() {
  const [open, setOpen] = useState(false);

  const tenantId = useTenantStore(s => s.tenantId);
  const config   = useTenantStore(s => s.config);

  // ?dev=1 / ?dev=0 URL param → save to localStorage
  const devParam = new URLSearchParams(window.location.search).get('dev');
  if (devParam === '1') localStorage.setItem('nexus_dev_tools', '1');
  if (devParam === '0') localStorage.removeItem('nexus_dev_tools');

  const enabled = import.meta.env.DEV || localStorage.getItem('nexus_dev_tools') === '1';
  if (!enabled) return null;

  const isTenantOn = !!tenantId;
  const activeColor = config?.primaryColor ?? '#6366f1';

  const goTo = (params: Record<string, string>) => {
    const url = new URL(window.location.href);
    url.searchParams.delete('tenant');
    for (const [k, v] of Object.entries(params)) url.searchParams.set(k, v);
    window.location.href = url.toString();
  };

  const activate = (id: string) => {
    if (!mockTenants[id]) return;
    localStorage.setItem(LAST_TENANT_KEY, id);
    goTo({ tenant: id });
    setOpen(false);
  };

  const deactivate = () => {
    const url = new URL(window.location.href);
    url.searchParams.delete('tenant');
    window.location.href = url.toString();
    setOpen(false);
  };

  /** Toggle: turn ON → re-activate last tenant (or first available) */
  const toggleOn = () => {
    const last = localStorage.getItem(LAST_TENANT_KEY);
    const target = (last && mockTenants[last]) ? last : Object.keys(mockTenants)[0];
    activate(target);
  };

  return (
    <div style={{ position: 'fixed', bottom: 72, left: 10, zIndex: 9999 }}>

      {/* ── Dropdown panel ── */}
      {open && (
        <div style={{
          position: 'absolute',
          bottom: 'calc(100% + 8px)',
          left: 0,
          background: '#0f1123',
          border: '1px solid rgba(255,255,255,0.12)',
          borderRadius: 14,
          padding: '10px 8px',
          width: 240,
          boxShadow: '0 8px 36px rgba(0,0,0,0.7)',
        }}>

          {/* ── ON / OFF toggle ── */}
          <div style={{
            display: 'flex', alignItems: 'center', justifyContent: 'space-between',
            paddingInline: 8, marginBottom: 10,
          }}>
            <p style={{
              color: 'rgba(255,255,255,0.35)', fontSize: 9, fontWeight: 800,
              letterSpacing: 1.2, textTransform: 'uppercase', margin: 0,
            }}>
              Tenant Mode
            </p>

            {/* Toggle switch */}
            <button
              onClick={isTenantOn ? deactivate : toggleOn}
              style={{
                position: 'relative',
                width: 40, height: 22, borderRadius: 11,
                background: isTenantOn ? activeColor : 'rgba(255,255,255,0.15)',
                border: 'none', cursor: 'pointer', padding: 0,
                transition: 'background 0.2s',
                flexShrink: 0,
              }}
            >
              <span style={{
                position: 'absolute',
                top: 3,
                left: isTenantOn ? 21 : 3,
                width: 16, height: 16, borderRadius: '50%',
                background: '#fff',
                transition: 'left 0.2s',
                boxShadow: '0 1px 3px rgba(0,0,0,0.4)',
              }} />
            </button>
          </div>

          {/* ── Tenant list ── */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
            {Object.values(mockTenants).map(t => {
              const isActive = tenantId === t.id;
              return (
                <button
                  key={t.id}
                  onClick={() => activate(t.id)}
                  style={{
                    display: 'flex', alignItems: 'center', gap: 9,
                    padding: '7px 10px', borderRadius: 10, cursor: 'pointer',
                    background: isActive ? 'rgba(255,255,255,0.08)' : 'transparent',
                    border: isActive ? `1.5px solid ${t.primaryColor}55` : '1.5px solid transparent',
                    textAlign: 'right', direction: 'rtl',
                  }}
                >
                  <div style={{
                    width: 9, height: 9, borderRadius: '50%',
                    background: t.primaryColor, flexShrink: 0,
                    boxShadow: isActive ? `0 0 6px ${t.primaryColor}` : 'none',
                  }} />
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <p style={{ color: '#fff', fontSize: 12, fontWeight: 600, margin: 0, lineHeight: 1.3 }}>
                      {t.nameHe}
                    </p>
                    <p style={{ color: 'rgba(255,255,255,0.3)', fontSize: 10, margin: 0, fontFamily: 'monospace', letterSpacing: 0.5 }}>
                      {`?tenant=${t.id}`}
                    </p>
                  </div>
                  {isActive && (
                    <span style={{ color: t.primaryColor, fontSize: 13, flexShrink: 0, lineHeight: 1 }}>✓</span>
                  )}
                </button>
              );
            })}
          </div>
        </div>
      )}

      {/* ── Trigger chip ── */}
      <button
        onClick={() => setOpen(o => !o)}
        style={{
          display: 'flex', alignItems: 'center', gap: 5,
          padding: '5px 11px', borderRadius: 20, cursor: 'pointer',
          background: config ? `${config.primaryColor}cc` : '#1a1a2e',
          border: `1.5px solid ${config ? config.primaryColor : 'rgba(255,255,255,0.18)'}`,
          color: '#fff', fontSize: 10, fontWeight: 800, letterSpacing: 0.5,
          boxShadow: '0 2px 14px rgba(0,0,0,0.45)',
          whiteSpace: 'nowrap',
        }}
      >
        <span style={{ opacity: 0.65, fontSize: 11 }}>⚙</span>
        {config ? config.nameHe : 'DEV'}
      </button>

    </div>
  );
}
