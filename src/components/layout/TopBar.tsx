import { useRef, useState } from 'react';
import { useNavigate, useParams, useSearchParams } from 'react-router-dom';
import { useAuthGate } from '../../hooks/useAuthGate';
import { useAuth } from '../../contexts/AuthContext';
import { useAuthStore } from '../../stores/authStore';
import { useTenantStore } from '../../stores/tenantStore';
import { useLanguage } from '../../i18n/LanguageContext';
import { useUser } from '../../hooks/useUser';
import TenantSheet from './TenantSheet';
import UserMenu from './UserMenu';

function getGreeting(t: { home: { goodMorning: string; goodAfternoon: string; goodEvening: string; goodNight: string } }) {
  const hour = new Date().getHours();
  if (hour >= 5 && hour < 12) return t.home.goodMorning;
  if (hour >= 12 && hour < 17) return t.home.goodAfternoon;
  if (hour >= 17 && hour < 21) return t.home.goodEvening;
  return t.home.goodNight;
}

interface TopBarProps {
  collapsed?: boolean;
  showBack?: boolean;
}

export default function TopBar({ collapsed = false, showBack = false }: TopBarProps) {
  const internalRef = useRef<HTMLElement>(null);

  const { lang = 'he' } = useParams();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { t, language } = useLanguage();
  const { isAuthenticated, requireAuth } = useAuthGate();
  const isOrgMember = useAuthStore((s) => s.isOrgMember);
  const organizationName = useAuthStore((s) => s.organizationName);
  const avatarUrl = useAuthStore((s) => s.avatarUrl);
  const authFirstName = useAuthStore((s) => s.firstName);
  const tenantConfig = useTenantStore((s) => s.config);
  const { data: user } = useUser();
  const { me } = useAuth();

  // Ecosystem (Nexus-Catalog) is picked via the WalletTenantSwitcher
  // by adding ?ecosystem=1 to the URL. While that flag is set, the
  // top bar must reflect "you are browsing the Nexus catalog", not
  // the user's home tenant - otherwise the user thinks they're still
  // in the tenant context after explicitly switching out of it.
  const isEcosystem = searchParams.get('ecosystem') === '1';
  const isHe = language === 'he';

  // Resolve the active tenant from ?tenant=<id> against the user's
  // memberships. The tenant store (`tenantConfig`) only has themed
  // entries for mock tenants; real Mongo tenantIds never round-trip
  // through it, so without this lookup the TopBar fell back to
  // authStore.organizationName which is just the user's FIRST
  // membership - that's the bug behind "I picked bedika2 but the
  // header still says bedika".
  const urlTenantId = !isEcosystem ? searchParams.get('tenant') : null;
  const activeMembership = urlTenantId
    ? me?.memberships?.find((m) => m.tenantId === urlTenantId)
    : undefined;

  const hasTenant = isAuthenticated && isOrgMember && !isEcosystem &&
    (!!tenantConfig || !!activeMembership);
  const logoSrc = hasTenant ? (tenantConfig?.logo ?? '/nexus-logo.png') : '/nexus-logo.png';
  const logoAlt = hasTenant
    ? (activeMembership?.tenantName ?? organizationName ?? tenantConfig?.name ?? 'Nexus')
    : 'Nexus';

  const displayFirstName = authFirstName ?? user?.firstName;
  const showGreeting = isAuthenticated && !!displayFirstName;
  const greetingText = getGreeting(t);

  const notificationCount = 3;
  const chatCount = 1;

  const [tenantSheetOpen, setTenantSheetOpen] = useState(false);
  const [userMenuOpen, setUserMenuOpen] = useState(false);

  // Display name for the top-bar context chip. Order of preference:
  //  1. Ecosystem mode -> "Nexus-Catalog" (the view label, not a tenant).
  //  2. Active membership name resolved from ?tenant=<id> against
  //     me.memberships. This is the source of truth for the picked
  //     tenant - real backend tenants have no tenantStore entry.
  //  3. Tenant store config (theme-aware names for mock tenants).
  //  4. organizationName fallback from authStore (user's first
  //     membership at login time).
  // When ecosystem mode is on we deliberately ignore membership +
  // organizationName so the chip never shows the user's home tenant
  // while they are browsing the cross-tenant catalog.
  const tenantDisplayName = isEcosystem
    ? isHe
      ? 'קטלוג נקסוס'
      : 'Nexus-Catalog'
    : activeMembership?.tenantName
      ?? (isHe ? tenantConfig?.nameHe : tenantConfig?.name)
      ?? organizationName;

  const handleProfile = async () => {
    if (isAuthenticated) {
      // Authenticated -> open the inline UserMenu dropdown (not /profile).
      setUserMenuOpen((v) => !v);
      return;
    }
    const authed = await requireAuth({ promptMessage: t.auth.genericPrompt });
    if (authed) setUserMenuOpen(true);
  };

  const handleNotifications = async () => {
    if (isAuthenticated) {
      navigate(`/${lang}/activity`);
    } else {
      const authed = await requireAuth({ promptMessage: t.auth.genericPrompt });
      if (authed) navigate(`/${lang}/activity`);
    }
  };

  // Button size classes
  const btnSize = collapsed ? 'w-7 h-7' : 'w-10 h-10';
  const iconScale = collapsed ? 'scale-[0.8]' : 'scale-100';

  return (
    <header
      ref={internalRef}
      className={`px-5 transition-all duration-300 ease-in-out ${collapsed ? 'pt-1.5 pb-1' : 'pt-4 pb-3'}`}
    >
      {/* ── Main row ── */}
      <div className="relative flex items-center justify-between">

        {/* Left: back button (non-home) + avatars + greeting */}
        <div className="flex items-center gap-2 relative">
          {/* Back button — non-home pages only */}
          {showBack && (
            <button
              onClick={() => navigate(-1)}
              className="w-9 h-9 rounded-full bg-white/80 backdrop-blur-sm flex items-center justify-center shadow-sm active:scale-95 transition-transform"
              aria-label={t.common?.back ?? 'Back'}
            >
              <span className="material-symbols-outlined text-text-primary" style={{ fontSize: 20 }}>
                arrow_forward
              </span>
            </button>
          )}
          {/* Avatar cluster — shown for everyone. Anonymous visitors see the
              default Nexus logo + person avatar and the "Nexus-Catalog"
              context label, exactly like a logged-in ecosystem view; tapping
              the avatar opens the LoginSheet via the auth gate (handleProfile
              calls requireAuth when not authenticated) so they can sign in to
              buy / redeem. */}
          <button
            onClick={handleProfile}
            className={`relative flex items-center transition-transform duration-300 ease-in-out origin-left ${collapsed ? 'scale-[0.65]' : 'scale-100'}`}
            aria-label={isAuthenticated ? 'Profile' : (isHe ? 'התחבר' : 'Log in')}
          >
            {/* Logo circle */}
            <div
              className="w-10 h-10 rounded-full bg-white flex items-center justify-center shadow-sm border border-border/60 -me-3 z-0"
              title={logoAlt}
            >
              <img
                src={logoSrc}
                alt={logoAlt}
                className="w-7 h-7 object-contain rounded-full"
                onError={(e) => {
                  const parent = (e.target as HTMLImageElement).parentElement;
                  if (parent) {
                    (e.target as HTMLImageElement).style.display = 'none';
                    const fallback = document.createElement('span');
                    fallback.className = 'text-[11px] font-bold text-primary';
                    fallback.textContent = hasTenant ? (organizationName?.charAt(0) ?? '?') : 'N';
                    parent.appendChild(fallback);
                  }
                }}
              />
            </div>
            {/* Profile circle */}
            {avatarUrl ? (
              <img
                src={avatarUrl}
                alt="Profile"
                className="relative z-10 w-10 h-10 rounded-full object-cover border-2 border-white shadow-sm"
              />
            ) : (
              <div className="relative z-10 w-10 h-10 rounded-full bg-surface flex items-center justify-center hover:bg-border">
                <span className="material-symbols-outlined text-text-primary">person</span>
              </div>
            )}
          </button>

          {/* Greeting — fades out on collapse */}
          {showGreeting && (
            <div className={`flex flex-col transition-all duration-300 ease-in-out ${collapsed ? 'opacity-0 -translate-x-2 pointer-events-none' : 'opacity-100 translate-x-0'}`}>
              <p className="text-[11px] text-text-muted font-medium leading-tight whitespace-nowrap">{greetingText}</p>
              <h2 className="text-sm font-bold text-text-primary leading-tight whitespace-nowrap">{displayFirstName}</h2>
            </div>
          )}

          {/* UserMenu dropdown — anchored under the avatar (start edge). */}
          <UserMenu isOpen={userMenuOpen} onClose={() => setUserMenuOpen(false)} />
        </div>

        {/* Center: tenant name — fades in on collapse. Shown for anonymous
            too so the front door reads "Nexus-Catalog" like a logged-in view. */}
        {tenantDisplayName && (
          <div className={`absolute left-1/2 -translate-x-1/2 transition-all duration-300 ease-in-out ${collapsed ? 'opacity-100' : 'opacity-0 pointer-events-none'}`}>
            <button
              onClick={() => { if (!isEcosystem) setTenantSheetOpen(true); }}
              className="flex items-center gap-1 active:scale-95"
              disabled={isEcosystem}
            >
              <span className="text-[11px] font-semibold text-text-secondary truncate max-w-[160px]">
                {tenantDisplayName}
              </span>
              <span className="material-symbols-outlined text-text-muted" style={{ fontSize: '14px' }}>
                keyboard_arrow_down
              </span>
            </button>
          </div>
        )}

        {/* Right: action buttons - hidden for anonymous visitors. The
            chat and notifications surfaces are member-only and would
            be confusing for an anonymous visitor. */}
        {isAuthenticated && (
          <div className="flex items-center gap-1.5">
            <button
              onClick={() => navigate(`/${lang}/chat`)}
              className={`relative rounded-full bg-surface flex items-center justify-center hover:bg-border transition-all duration-300 ease-in-out ${btnSize}`}
              aria-label="Chat"
            >
              <span className={`material-symbols-outlined text-text-primary transition-transform duration-300 ${iconScale}`}>chat_bubble_outline</span>
              {chatCount > 0 && (
                <span className="absolute -top-0.5 -left-0.5 w-[18px] h-[18px] bg-error rounded-full border-2 border-white flex items-center justify-center">
                  <span className="text-[10px] font-bold text-white leading-none">{chatCount > 9 ? '9+' : chatCount}</span>
                </span>
              )}
            </button>

            <button
              onClick={handleNotifications}
              className={`relative rounded-full bg-surface flex items-center justify-center hover:bg-border transition-all duration-300 ease-in-out ${btnSize}`}
              aria-label="Notifications"
            >
              <span className={`material-symbols-outlined text-text-primary transition-transform duration-300 ${iconScale}`}>notifications</span>
              {notificationCount > 0 && (
                <span className="absolute -top-0.5 -left-0.5 w-[18px] h-[18px] bg-error rounded-full border-2 border-white flex items-center justify-center">
                  <span className="text-[10px] font-bold text-white leading-none">{notificationCount > 9 ? '9+' : notificationCount}</span>
                </span>
              )}
            </button>
          </div>
        )}
      </div>

      {/* Tenant row below — slides out on collapse. Shown for anonymous too. */}
      {tenantDisplayName && (
        <div className={`overflow-hidden transition-all duration-300 ease-in-out ${collapsed ? 'max-h-0 opacity-0' : 'max-h-10 opacity-100 mt-2'}`}>
          <button
            onClick={() => { if (!isEcosystem) setTenantSheetOpen(true); }}
            className="flex items-center gap-1 active:scale-95"
            disabled={isEcosystem}
          >
            <span className="text-[11px] font-semibold text-text-secondary truncate max-w-[200px]">
              {tenantDisplayName}
            </span>
            {!isEcosystem && (
              <span className="material-symbols-outlined text-text-muted" style={{ fontSize: '14px' }}>
                keyboard_arrow_down
              </span>
            )}
          </button>
        </div>
      )}

      <TenantSheet isOpen={tenantSheetOpen} onClose={() => setTenantSheetOpen(false)} />
    </header>
  );
}
