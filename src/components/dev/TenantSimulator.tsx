/**
 * TenantSimulator — dev toggle (top-left) to simulate tenant context.
 *
 * Visible when ANY of these are true:
 *   • import.meta.env.DEV              (npm run dev locally)
 *   • hostname is localhost / 127.0.0.1 (npm run preview locally)
 *   • hostname ends with .railway.app   (Railway staging)
 *
 * The toggle controls ?tenant in the URL directly.
 * LanguageRouter reads ?tenant and calls setTenant / clearTenant.
 *
 * NOTE: Must be rendered inside a RouterProvider (currently in LanguageRouter).
 */

import { createPortal } from 'react-dom';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { mockTenants } from '../../mock/data/tenants.mock';
import { useTenantStore } from '../../stores/tenantStore';

const LAST_TENANT_KEY = 'nexus_dev_last_tenant';

function isDevEnv(): boolean {
  if (import.meta.env.DEV) return true;
  const h = window.location.hostname;
  if (h === 'localhost' || h === '127.0.0.1') return true;
  if (h.endsWith('.railway.app')) return true;
  return false;
}

export function TenantSimulator() {
  const [searchParams] = useSearchParams();
  const navigate       = useNavigate();
  const tenantId       = useTenantStore(s => s.tenantId);
  const config         = useTenantStore(s => s.config);
  const clearTenant    = useTenantStore(s => s.clearTenant);

  if (!isDevEnv()) return null;

  const isTenantOn  = !!tenantId;
  const activeColor = config?.primaryColor ?? '#6366f1';

  /** Turn tenant OFF — clearTenant + navigate are batched by React 18 */
  const deactivate = () => {
    clearTenant();
    const next = new URLSearchParams(searchParams);
    next.delete('tenant');
    navigate({ search: next.toString() }, { replace: true });
  };

  /** Turn tenant ON — navigate with ?tenant; LanguageRouter calls setTenant */
  const toggleOn = () => {
    const last   = localStorage.getItem(LAST_TENANT_KEY);
    const target = (last && mockTenants[last]) ? last : Object.keys(mockTenants)[0];
    localStorage.setItem(LAST_TENANT_KEY, target);
    const next = new URLSearchParams(searchParams);
    next.set('tenant', target);
    navigate({ search: next.toString() });
  };

  return createPortal(
    <div style={{
      position: 'fixed',
      top: 12,
      left: 12,
      zIndex: 99999,
      display: 'flex',
      alignItems: 'center',
      gap: 7,
      pointerEvents: 'all',
    }}>

      {/* Toggle pill */}
      <button
        onClick={isTenantOn ? deactivate : toggleOn}
        title={isTenantOn ? 'כבה טננט' : 'הדלק טננט'}
        style={{
          position: 'relative',
          width: 42, height: 24, borderRadius: 12, flexShrink: 0,
          background: isTenantOn ? activeColor : '#555',
          border: 'none', cursor: 'pointer', padding: 0,
          boxShadow: '0 2px 6px rgba(0,0,0,0.4)',
          transition: 'background 0.2s',
        }}
      >
        <span style={{
          position: 'absolute',
          top: 3,
          left: isTenantOn ? 21 : 3,
          width: 18, height: 18, borderRadius: '50%',
          background: '#fff',
          transition: 'left 0.2s',
          display: 'block',
          boxShadow: '0 1px 3px rgba(0,0,0,0.35)',
        }} />
      </button>

      {/* Active tenant label */}
      {isTenantOn && (
        <span style={{
          fontSize: 11, fontWeight: 700,
          color: '#fff',
          background: activeColor,
          padding: '2px 9px',
          borderRadius: 10,
          boxShadow: '0 1px 4px rgba(0,0,0,0.3)',
          whiteSpace: 'nowrap',
        }}>
          {config?.nameHe}
        </span>
      )}

    </div>,
    document.body
  );
}