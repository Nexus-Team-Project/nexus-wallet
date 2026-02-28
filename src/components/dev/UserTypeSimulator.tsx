/**
 * UserTypeSimulator — dev toggle (below TenantSimulator) to simulate user type.
 *
 * Cycles through 3 modes on each click:
 *   new-user        — plain new user, no org affiliation (default / "off")
 *   pre-provisioned — org member: sets orgMember in registrationStore
 *   existing        — returning user: sets profileCompleted = true in authStore
 *
 * Persists mode to localStorage (nexus_dev_user_type).
 * Applies store mutations immediately when mode changes.
 *
 * Visible under the same conditions as TenantSimulator:
 *   • import.meta.env.DEV              (npm run dev locally)
 *   • hostname is localhost / 127.0.0.1 (npm run preview locally)
 *   • hostname ends with .railway.app   (Railway staging)
 *
 * NOTE: Must be rendered inside a RouterProvider (currently in LanguageRouter).
 * NOTE: Uses only onClick — see TenantSimulator for the full explanation of why
 *       onTouchEnd must not be added alongside onClick.
 */

import { useState } from 'react';
import { useRegistrationStore } from '../../stores/registrationStore';
import { useAuthStore } from '../../stores/authStore';
import { useTenantStore } from '../../stores/tenantStore';
import { mockTenants } from '../../mock/data/tenants.mock';

const KEY = 'nexus_dev_user_type';

type UserType = 'new-user' | 'pre-provisioned' | 'existing';

interface Mode {
  type:       UserType;
  shortLabel: string;
  label:      string;
  color:      string;
}

const MODES: Mode[] = [
  { type: 'new-user',        shortLabel: '🆕', label: 'new',   color: '#555'    },
  { type: 'pre-provisioned', shortLabel: '🏢', label: 'org',   color: '#dc2626' },
  { type: 'existing',        shortLabel: '👤', label: 'exist', color: '#059669' },
];

function isDevEnv(): boolean {
  if (import.meta.env.DEV) return true;
  const h = window.location.hostname;
  if (h === 'localhost' || h === '127.0.0.1') return true;
  if (h.endsWith('.railway.app')) return true;
  return false;
}

function applyMode(mode: UserType): void {
  switch (mode) {
    case 'new-user':
      // Clear org affiliation; leave auth/profile state untouched
      useRegistrationStore.setState({ orgMember: null });
      useAuthStore.setState({ profileCompleted: false });
      useTenantStore.getState().clearTenant();
      break;

    case 'pre-provisioned': {
      // Inject a test org member (Hapoel Tel Aviv) into registration store
      const hapoelTenant = mockTenants['hapoel-ta'];
      if (hapoelTenant) {
        useTenantStore.getState().setTenant(hapoelTenant.id, hapoelTenant);
      }
      useRegistrationStore.setState({
        orgMember: {
          organizationId:   'org-2',
          organizationName: 'הפועל תל אביב',
          firstName:        'יוסי',
          lastName:         'כהן',
        },
      });
      useAuthStore.setState({ profileCompleted: false });
      break;
    }

    case 'existing':
      // Simulate a returning user — profile already complete
      useRegistrationStore.setState({ orgMember: null });
      useAuthStore.setState({ profileCompleted: true });
      break;
  }
}

export function UserTypeSimulator() {
  const [mode, setMode] = useState<UserType>(
    () => (localStorage.getItem(KEY) as UserType | null) ?? 'new-user'
  );

  if (!isDevEnv()) return null;

  const currentIdx = MODES.findIndex((m) => m.type === mode);
  const current    = MODES[currentIdx];
  const isDefault  = mode === 'new-user';

  const handleClick = () => {
    const nextIdx  = (currentIdx + 1) % MODES.length;
    const next     = MODES[nextIdx];
    localStorage.setItem(KEY, next.type);
    setMode(next.type);
    applyMode(next.type);
  };

  return (
    <div
      style={{
        position:      'fixed',
        top:           44,     // one row below TenantSimulator (top: 12, height ~26px + 6px gap)
        left:          12,
        zIndex:        99999,
        pointerEvents: 'auto',
        touchAction:   'manipulation',
      }}
    >
      <button
        onClick={handleClick}
        title={`user-type: ${mode} — click to cycle`}
        style={{
          padding:                    '2px 8px',
          borderRadius:               10,
          border:                     'none',
          cursor:                     'pointer',
          fontSize:                   11,
          fontWeight:                 700,
          background:                 isDefault ? '#444' : current.color,
          color:                      '#fff',
          boxShadow:                  '0 1px 4px rgba(0,0,0,0.35)',
          touchAction:                'manipulation',
          WebkitTapHighlightColor:    'transparent',
          whiteSpace:                 'nowrap',
          opacity:                    isDefault ? 0.7 : 1,
          transition:                 'background 0.2s, opacity 0.2s',
        }}
      >
        {current.shortLabel} {current.label}
      </button>
    </div>
  );
}
