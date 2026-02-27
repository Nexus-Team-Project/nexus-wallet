/**
 * TenantSimulator — dev floating chip to simulate tenant / customerId context.
 *
 * Visible when:
 *   • running locally (import.meta.env.DEV), OR
 *   • localStorage key "nexus_dev_tools" === "1"
 *     → enable in browser console:  localStorage.setItem('nexus_dev_tools','1'); location.reload()
 *     → disable:                    localStorage.removeItem('nexus_dev_tools'); location.reload()
 *
 * Activating a tenant:
 *  • sets tenantStore (same as ?tenant= or ?customerId= URL params)
 *  • sets registrationStore with path:'org-member-incomplete' + orgMember
 *    (simulates a pre-provisioned user arriving via their org's customerId)
 */

import { useState } from 'react';
import { mockTenants } from '../../mock/data/tenants.mock';
import { useTenantStore } from '../../stores/tenantStore';
import { useRegistrationStore } from '../../stores/registrationStore';

// mirrors orgToTenant in tenant.handler.ts
const TENANT_TO_ORG: Record<string, string> = {
  'acme-corp':  'org_001',
  'startup-il': 'org_002',
};

export function TenantSimulator() {
  const [open, setOpen] = useState(false);

  const tenantId          = useTenantStore(s => s.tenantId);
  const config            = useTenantStore(s => s.config);
  const setTenant         = useTenantStore(s => s.setTenant);
  const clearTenant       = useTenantStore(s => s.clearTenant);
  const startRegistration = useRegistrationStore(s => s.startRegistration);
  const resetRegistration = useRegistrationStore(s => s.resetRegistration);

  // Render only in dev or when manually enabled via localStorage
  const enabled = import.meta.env.DEV || localStorage.getItem('nexus_dev_tools') === '1';
  if (!enabled) return null;

  const activate = (id: string) => {
    const cfg = mockTenants[id];
    if (!cfg) return;
    // 1. Set tenant context (mirrors LanguageRouter ?tenant= / ?customerId= logic)
    setTenant(id, cfg);
    // 2. Set registration store as pre-provisioned org member
    startRegistration({
      path: 'org-member-incomplete',
      phone: '',
      orgMember: {
        organizationId: TENANT_TO_ORG[id] ?? id,
        organizationName: cfg.nameHe ?? cfg.name,
      },
    });
    setOpen(false);
  };

  const clear = () => {
    clearTenant();
    resetRegistration();
    setOpen(false);
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
          width: 228,
          boxShadow: '0 8px 36px rgba(0,0,0,0.7)',
        }}>
          <p style={{
            color: 'rgba(255,255,255,0.35)', fontSize: 9, fontWeight: 800,
            letterSpacing: 1.2, paddingInline: 8, marginBottom: 8, textTransform: 'uppercase',
          }}>
            Simulate Tenant
          </p>

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
                  {/* Color dot */}
                  <div style={{
                    width: 9, height: 9, borderRadius: '50%',
                    background: t.primaryColor, flexShrink: 0,
                    boxShadow: isActive ? `0 0 6px ${t.primaryColor}` : 'none',
                  }} />

                  {/* Labels */}
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <p style={{ color: '#fff', fontSize: 12, fontWeight: 600, margin: 0, lineHeight: 1.3 }}>
                      {t.nameHe}
                    </p>
                    <p style={{ color: 'rgba(255,255,255,0.3)', fontSize: 10, margin: 0, fontFamily: 'monospace', letterSpacing: 0.5 }}>
                      {t.customerId ? `customerId: ${t.customerId}` : `id: ${t.id}`}
                    </p>
                  </div>

                  {/* Active check */}
                  {isActive && (
                    <span style={{ color: t.primaryColor, fontSize: 13, flexShrink: 0, lineHeight: 1 }}>✓</span>
                  )}
                </button>
              );
            })}
          </div>

          {/* Clear button — only shown when a tenant is active */}
          {tenantId && (
            <button
              onClick={clear}
              style={{
                marginTop: 8, width: '100%', padding: '7px 10px', borderRadius: 10,
                background: 'rgba(255,70,70,0.12)', border: '1px solid rgba(255,70,70,0.25)',
                color: '#ff6b6b', fontSize: 11, fontWeight: 700, cursor: 'pointer',
              }}
            >
              נקה טננט
            </button>
          )}
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
