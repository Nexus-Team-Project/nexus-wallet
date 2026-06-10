import { useState, type CSSProperties } from 'react';
import { useSearchParams } from 'react-router-dom';
import { useLanguage } from '../i18n/LanguageContext';
import { useAuth } from '../contexts/AuthContext';
import { useTenantStore } from '../stores/tenantStore';
import ProfileHeader from '../components/profile/ProfileHeader';
import ProfileTabs, { type ProfileTab } from '../components/profile/ProfileTabs';
import ProfileRecords from '../components/profile/ProfileRecords';
import ProfileBadges from '../components/profile/ProfileBadges';
import MenuList from '../components/profile/MenuList';
import ComingSoonBadge from '../components/ui/ComingSoonBadge';

/**
 * Profile page. The hero (avatar, name, edit/logout) and the Settings logout +
 * working rows are functional; everything else is mock and marked "coming soon".
 *
 * Tenant-themed: the accent (`--color-primary`) and the top identity banner are
 * resolved from the URL tenant (?tenant=<id> via the user's memberships, or the
 * themed tenant store), so the UI reflects the tenant without using real data.
 * Ecosystem / no tenant -> Nexus + the default accent.
 */
export default function ProfilePage() {
  const { t, language } = useLanguage();
  const isHe = language === 'he';
  const { me } = useAuth();
  const [sp] = useSearchParams();
  const tenantConfig = useTenantStore((s) => s.config);
  const [tab, setTab] = useState<ProfileTab>('activity');

  // Resolve the active tenant the same way the TopBar does: intersect
  // ?tenant=<id> with the user's memberships; fall back to the themed store.
  const isEcosystem = sp.get('ecosystem') === '1';
  const urlTenantId = !isEcosystem ? sp.get('tenant') : null;
  const activeMembership = urlTenantId
    ? me?.memberships?.find((m) => m.tenantId === urlTenantId)
    : undefined;
  const hasTenant = !isEcosystem && (!!tenantConfig || !!activeMembership);
  const accent = hasTenant ? (activeMembership?.brandColor ?? tenantConfig?.primaryColor ?? null) : null;
  const tenantLogo = hasTenant ? (activeMembership?.logoUrl ?? tenantConfig?.logo ?? null) : null;
  const tenantName = hasTenant
    ? (activeMembership?.tenantName ?? (isHe ? tenantConfig?.nameHe : tenantConfig?.name) ?? 'Nexus')
    : (isHe ? 'קטלוג נקסוס' : 'Nexus Catalog');
  const bannerLogo = tenantLogo ?? '/nexus-logo.png';

  // Override the primary token for the whole page so every *-primary accent
  // (avatar ring, edit pencil, active tab, hero buttons, badges) adopts the
  // tenant brand color. Left unset for ecosystem -> the default Nexus accent.
  const themeStyle: CSSProperties | undefined = accent
    ? ({ ['--color-primary' as string]: accent } as CSSProperties)
    : undefined;

  return (
    <div className="animate-fade-in pb-10" style={themeStyle}>
      {/* Page header — pt-20 clears the global TopBar overlay. The gear jumps
          the tab strip to Settings. */}
      <header className="relative px-4 pt-20 pb-3 flex items-center justify-between">
        <h1 className="text-xl font-bold text-text-primary">{t.profile.title}</h1>
        <button
          type="button"
          aria-label="Profile settings"
          onClick={() => setTab('settings')}
          className="p-2 rounded-full text-text-secondary hover:bg-surface transition-colors"
        >
          <span className="material-symbols-outlined" style={{ fontSize: 22 }}>settings</span>
        </button>
      </header>

      {/* Tenant identity banner — themed by the active tenant's brand color. */}
      <div className="px-4">
        <div
          className="flex items-center gap-3 rounded-2xl px-4 py-3 border"
          style={{
            background: accent ? `${accent}14` : 'var(--color-surface)',
            borderColor: accent ? `${accent}3d` : 'var(--color-border)',
          }}
        >
          <div className="w-10 h-10 rounded-xl bg-white flex items-center justify-center overflow-hidden border border-border/50 flex-shrink-0">
            <img
              src={bannerLogo}
              alt={tenantName}
              className="w-7 h-7 object-contain"
              onError={(e) => { (e.currentTarget as HTMLImageElement).style.display = 'none'; }}
            />
          </div>
          <div className="min-w-0">
            <p className="text-[11px] text-text-muted leading-tight">{isHe ? 'הפרופיל שלך ב' : 'Your profile at'}</p>
            <p className="text-sm font-bold text-text-primary truncate">{tenantName}</p>
          </div>
        </div>
      </div>

      <ProfileHeader />
      <ProfileTabs selected={tab} onChange={setTab} />

      {tab === 'activity' && (
        <>
          <ProfileRecords />
          <ProfileBadges />
        </>
      )}

      {tab === 'settings' && <MenuList />}

      {(tab === 'saved' || tab === 'help') && (
        <div className="px-4 pt-16 flex flex-col items-center text-center gap-3">
          <span className="material-symbols-outlined text-text-muted/50" style={{ fontSize: 40 }}>
            {tab === 'saved' ? 'bookmark' : 'help'}
          </span>
          <ComingSoonBadge />
          <p className="text-sm text-text-muted">
            {isHe ? 'התכונה הזו תהיה זמינה בקרוב' : 'This feature will be available soon'}
          </p>
        </div>
      )}
    </div>
  );
}
