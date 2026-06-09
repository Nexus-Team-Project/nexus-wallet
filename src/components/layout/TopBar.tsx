import { useEffect, useRef, useState } from 'react';
import { useNavigate, useParams, useSearchParams } from 'react-router-dom';
import { useAuthGate } from '../../hooks/useAuthGate';
import { useAuth } from '../../contexts/AuthContext';
import { useAuthStore } from '../../stores/authStore';
import { useTenantStore } from '../../stores/tenantStore';
import { useLanguage } from '../../i18n/LanguageContext';
import { useUser } from '../../hooks/useUser';
import { tenantColor } from '../../lib/tenantColor';
import TenantSwitchSheet from '../wallet/TenantSwitchSheet';
import UserMenu from './UserMenu';
import { useUnreadNotificationCount } from '../../hooks/useNotifications';
import { useNotificationToastStore } from '../../stores/notificationToastStore';

function getGreeting(t: { home: { goodMorning: string; goodAfternoon: string; goodEvening: string; goodNight: string } }) {
  const hour = new Date().getHours();
  if (hour >= 5 && hour < 12) return t.home.goodMorning;
  if (hour >= 12 && hour < 17) return t.home.goodAfternoon;
  if (hour >= 17 && hour < 21) return t.home.goodEvening;
  return t.home.goodNight;
}

/**
 * Build up-to-two-letter user initials for the avatar. Prefers first+last
 * initials; falls back to the first two letters of a full name. Returns '?'
 * when nothing is known.
 * @param first user's first name (if any)
 * @param last user's last name (if any)
 * @param fullName a full display name fallback (if any)
 * @returns 1-2 uppercase initials.
 */
function deriveInitials(first?: string | null, last?: string | null, fullName?: string | null): string {
  const f = (first ?? '').trim();
  const l = (last ?? '').trim();
  if (f || l) return (f.charAt(0) + l.charAt(0)).toUpperCase() || '?';
  const fn = (fullName ?? '').trim();
  if (!fn) return '?';
  const parts = fn.split(/\s+/).filter(Boolean);
  if (parts.length >= 2) return (parts[0]![0]! + parts[1]![0]!).toUpperCase();
  return fn.slice(0, 2).toUpperCase();
}

interface TopBarProps {
  collapsed?: boolean;
  showBack?: boolean;
  /** Hide the "good morning / name" greeting (e.g. full-screen flows). */
  hideGreeting?: boolean;
}

export default function TopBar({ collapsed = false, showBack = false, hideGreeting = false }: TopBarProps) {
  const internalRef = useRef<HTMLElement>(null);

  const { lang = 'he' } = useParams();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { t, language } = useLanguage();
  const { isAuthenticated, requireAuth } = useAuthGate();
  const organizationName = useAuthStore((s) => s.organizationName);
  const avatarUrl = useAuthStore((s) => s.avatarUrl);
  const authFirstName = useAuthStore((s) => s.firstName);
  const tenantConfig = useTenantStore((s) => s.config);
  const { data: user } = useUser();
  const { me } = useAuth();

  // Ecosystem (Nexus-Catalog) is picked via the TenantSwitchSheet (org chip)
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

  // Show tenant branding whenever a real tenant context exists, regardless of
  // auth or membership. LanguageRouter resolves ?tenant=<id> into tenantConfig
  // (via fetchPublicTenant) for anonymous visitors and logged-in non-members
  // alike, and bounces unknown tenants to ecosystem + clears the store - so a
  // present tenantConfig/activeMembership always means a legit tenant. Without
  // this, an anonymous or non-member visitor on a tenant link saw the Nexus
  // logo instead of the org's. Ecosystem / no-tenant -> Nexus logo.
  const hasTenant = !isEcosystem && (!!tenantConfig || !!activeMembership);
  // Prefer the active membership's real logo (real backend tenants never
  // round-trip through tenantConfig, so without this the org showed the Nexus
  // logo). Ecosystem / no-tenant -> Nexus logo.
  // Real tenant logo (membership or themed config), or null. The Nexus logo is
  // reserved for the ecosystem catalog; a real tenant with no logo shows its
  // name initials instead.
  const tenantLogoUrl = hasTenant ? (activeMembership?.logoUrl ?? tenantConfig?.logo ?? null) : null;
  const logoSrc = hasTenant ? (tenantLogoUrl ?? '/nexus-logo.png') : '/nexus-logo.png';
  const logoAlt = hasTenant
    ? (activeMembership?.tenantName ?? organizationName ?? tenantConfig?.name ?? 'Nexus')
    : 'Nexus';
  const showTenantInitials = hasTenant && !tenantLogoUrl;
  const tenantInitials = deriveInitials(undefined, undefined, logoAlt);

  const displayFirstName = authFirstName ?? user?.firstName;
  const showGreeting = isAuthenticated && !!displayFirstName && !hideGreeting;
  const greetingText = getGreeting(t);

  // Initials shown in the profile avatar when logged in (no uploaded photo).
  const userInitials = deriveInitials(
    me?.profile?.firstName ?? authFirstName ?? user?.firstName,
    me?.profile?.lastName,
    me?.user?.name ?? displayFirstName,
  );

  // Real unread notification count drives the bell badge.
  const { data: notificationCount = 0 } = useUnreadNotificationCount();
  // Chat is not wired to a real backend yet, so there is no real unread-message
  // count — show 0 (badge hidden) instead of a hardcoded mock number. Replace
  // with a real unread-messages query when the chat backend lands.
  const chatCount = 0;

  // Subscribe to the bell-pulse trigger from the toast store. Every
  // time a toast finishes its fly-to-bell exit the counter ticks; we
  // toggle a one-shot CSS class on the bell to play the shake.
  const bellPulseCount = useNotificationToastStore((s) => s.bellPulseCount);
  const [bellShaking, setBellShaking] = useState(false);
  useEffect(() => {
    // Skip the very first render's value (we don't want to shake on
    // mount) — only react to increments from there on.
    if (bellPulseCount === 0) return;
    setBellShaking(true);
    const handle = setTimeout(() => setBellShaking(false), 700);
    return () => clearTimeout(handle);
  }, [bellPulseCount]);

  const [switchSheetOpen, setSwitchSheetOpen] = useState(false);
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

  const handleNotifications = () => {
    navigate(`/${lang}/notifications`);
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
      <div className="relative flex items-center">

        {/* Left: back button (non-home) + avatars + greeting + actions.
            Everything is grouped on the start side so the action icons sit
            next to the avatar and never collide with the floating tenant
            switcher pill anchored in the opposite top corner. */}
        <div className="flex items-center gap-2 relative">
          {/* Back button — non-home pages only */}
          {showBack && (
            <button
              onClick={() => navigate(-1)}
              className="w-9 h-9 rounded-full bg-white flex items-center justify-center shadow-[0_6px_16px_rgba(0,0,0,0.14)] active:scale-95 transition-transform"
              aria-label={t.common?.back ?? 'Back'}
            >
              <span className="material-symbols-outlined text-text-primary" style={{ fontSize: 24 }}>
                {language === 'he' ? 'chevron_right' : 'chevron_left'}
              </span>
            </button>
          )}
          {/* Avatar cluster — shown for everyone. The logo circle reflects the
              tenant context: on a ?tenant=X link it shows that org's logo (or
              name initials) for anonymous visitors and logged-in non-members
              alike; on the ecosystem catalog / plain home it shows the Nexus
              logo. The person avatar is the login affordance — tapping it opens
              the LoginSheet via the auth gate (handleProfile calls requireAuth
              when not authenticated) so they can sign in to buy / redeem. */}
          <button
            onClick={handleProfile}
            className={`relative flex items-center transition-transform duration-300 ease-in-out origin-left ${collapsed ? 'scale-[0.65]' : 'scale-100'}`}
            aria-label={isAuthenticated ? 'Profile' : (isHe ? 'התחבר' : 'Log in')}
          >
            {/* Logo circle */}
            <div
              className="w-10 h-10 rounded-full bg-white flex items-center justify-center shadow-[0_6px_16px_rgba(0,0,0,0.14)] -me-3 z-0"
              title={logoAlt}
            >
              {showTenantInitials ? (
                <div
                  className="w-7 h-7 rounded-full flex items-center justify-center text-white font-bold text-[11px] leading-none"
                  style={{ background: tenantColor(logoAlt) }}
                >
                  {tenantInitials}
                </div>
              ) : (
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
                    fallback.textContent = hasTenant
                      ? ((activeMembership?.tenantName ?? organizationName)?.charAt(0) ?? '?')
                      : 'N';
                    parent.appendChild(fallback);
                  }
                }}
              />
              )}
            </div>
            {/* Profile circle: uploaded photo > user initials (logged in) >
                generic person icon (anonymous / login affordance). */}
            {avatarUrl ? (
              <img
                src={avatarUrl}
                alt="Profile"
                className="relative z-10 w-10 h-10 rounded-full object-cover border-2 border-white shadow-[0_6px_16px_rgba(0,0,0,0.14)]"
              />
            ) : isAuthenticated ? (
              <div className="relative z-10 w-10 h-10 rounded-full bg-primary flex items-center justify-center border-2 border-white shadow-sm">
                <span className="text-sm font-bold text-white leading-none">{userInitials}</span>
              </div>
            ) : (
              <div className="relative z-10 w-10 h-10 rounded-full bg-white flex items-center justify-center shadow-[0_6px_16px_rgba(0,0,0,0.14)]">
                <span style={{ fontSize: '22px', lineHeight: 1 }}>👤</span>
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
          <UserMenu
            isOpen={userMenuOpen}
            onClose={() => setUserMenuOpen(false)}
          />
        </div>

        {/* Center: tenant name — fades in on collapse. Shown for anonymous
            too so the front door reads "Nexus-Catalog" like a logged-in view. */}
        {tenantDisplayName && (
          <div className={`absolute left-1/2 -translate-x-1/2 transition-all duration-300 ease-in-out ${collapsed ? 'opacity-100' : 'opacity-0 pointer-events-none'}`}>
            <button
              onClick={() => setSwitchSheetOpen(true)}
              className="flex items-center gap-1 active:scale-95"
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

        {/* Action buttons (chat + notifications) — main's white/shadow + emoji
            design, but pinned to the far end of the bar (ms-auto) so they never
            collide with the centered tenant chip on collapse. Member-only. */}
        {isAuthenticated && (
          <div className="relative z-10 flex items-center gap-1.5 ms-auto">
            <button
              onClick={() => navigate(`/${lang}/chat`)}
              className={`relative rounded-full bg-white flex items-center justify-center shadow-[0_6px_16px_rgba(0,0,0,0.14)] transition-all duration-300 ease-in-out ${btnSize}`}
              aria-label="Chat"
            >
              <span className={`transition-transform duration-300 ${iconScale}`} style={{ fontSize: '22px', lineHeight: 1 }}>💬</span>
              {chatCount > 0 && (
                <span className="absolute -top-0.5 -left-0.5 w-[18px] h-[18px] bg-error rounded-full border-2 border-white flex items-center justify-center">
                  <span className="text-[10px] font-bold text-white leading-none">{chatCount > 9 ? '9+' : chatCount}</span>
                </span>
              )}
            </button>

            <button
              onClick={handleNotifications}
              data-notif-bell
              className={`relative rounded-full bg-white flex items-center justify-center shadow-[0_6px_16px_rgba(0,0,0,0.14)] transition-all duration-300 ease-in-out ${btnSize} ${bellShaking ? 'animate-bell-shake' : ''}`}
              style={{ transformOrigin: 'top center' }}
              aria-label="Notifications"
            >
              <span className={`transition-transform duration-300 ${iconScale}`} style={{ fontSize: '22px', lineHeight: 1 }}>🔔</span>
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
            onClick={() => setSwitchSheetOpen(true)}
            className="flex items-center gap-1 active:scale-95"
          >
            <span className="text-[11px] font-semibold text-text-secondary truncate max-w-[200px]">
              {tenantDisplayName}
            </span>
            <span className="material-symbols-outlined text-text-muted" style={{ fontSize: '14px' }}>
              keyboard_arrow_down
            </span>
          </button>
        </div>
      )}

      {switchSheetOpen && <TenantSwitchSheet onClose={() => setSwitchSheetOpen(false)} />}
    </header>
  );
}
