import { useRef, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useAuthGate } from '../../hooks/useAuthGate';
import { useAuthStore } from '../../stores/authStore';
import { useTenantStore } from '../../stores/tenantStore';
import { useLanguage } from '../../i18n/LanguageContext';
import { useUser } from '../../hooks/useUser';
import TenantSheet from './TenantSheet';

function getGreeting(t: { home: { goodMorning: string; goodAfternoon: string; goodEvening: string; goodNight: string } }) {
  const hour = new Date().getHours();
  if (hour >= 5 && hour < 12) return t.home.goodMorning;
  if (hour >= 12 && hour < 17) return t.home.goodAfternoon;
  if (hour >= 17 && hour < 21) return t.home.goodEvening;
  return t.home.goodNight;
}

interface TopBarProps {
  collapsed?: boolean;
}

export default function TopBar({ collapsed = false }: TopBarProps) {
  const internalRef = useRef<HTMLElement>(null);

  const { lang = 'he' } = useParams();
  const navigate = useNavigate();
  const { t, language } = useLanguage();
  const { isAuthenticated, requireAuth } = useAuthGate();
  const isOrgMember = useAuthStore((s) => s.isOrgMember);
  const organizationName = useAuthStore((s) => s.organizationName);
  const avatarUrl = useAuthStore((s) => s.avatarUrl);
  const authFirstName = useAuthStore((s) => s.firstName);
  const tenantConfig = useTenantStore((s) => s.config);
  const { data: user } = useUser();

  const hasTenant = isAuthenticated && isOrgMember && !!tenantConfig;
  const logoSrc = hasTenant ? (tenantConfig?.logo ?? '/nexus-logo.png') : '/nexus-logo.png';
  const logoAlt = hasTenant ? (organizationName ?? tenantConfig?.name ?? 'Nexus') : 'Nexus';

  const displayFirstName = authFirstName ?? user?.firstName;
  const showGreeting = isAuthenticated && !!displayFirstName;
  const greetingText = getGreeting(t);

  const notificationCount = 3;
  const chatCount = 1;

  const [tenantSheetOpen, setTenantSheetOpen] = useState(false);

  const tenantDisplayName = hasTenant
    ? (language === 'he' ? tenantConfig?.nameHe : tenantConfig?.name)
    : organizationName;

  const handleProfile = async () => {
    if (isAuthenticated) {
      navigate(`/${lang}/profile`);
    } else {
      const authed = await requireAuth({ promptMessage: t.auth.genericPrompt });
      if (authed) navigate(`/${lang}/profile`);
    }
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

        {/* Left: avatars + greeting */}
        <div className="flex items-center gap-2.5">
          {/* Avatar cluster */}
          <button
            onClick={handleProfile}
            className={`relative flex items-center transition-transform duration-300 ease-in-out origin-left ${collapsed ? 'scale-[0.65]' : 'scale-100'}`}
            aria-label="Profile"
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
        </div>

        {/* Center: tenant name — fades in on collapse */}
        {isAuthenticated && tenantDisplayName && (
          <div className={`absolute left-1/2 -translate-x-1/2 transition-all duration-300 ease-in-out ${collapsed ? 'opacity-100' : 'opacity-0 pointer-events-none'}`}>
            <button onClick={() => setTenantSheetOpen(true)} className="flex items-center gap-1 active:scale-95">
              <span className="text-[11px] font-semibold text-text-secondary truncate max-w-[160px]">
                {tenantDisplayName}
              </span>
              <span className="material-symbols-outlined text-text-muted" style={{ fontSize: '14px' }}>
                keyboard_arrow_down
              </span>
            </button>
          </div>
        )}

        {/* Right: action buttons */}
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
      </div>

      {/* Tenant row below — slides out on collapse */}
      {isAuthenticated && tenantDisplayName && (
        <div className={`overflow-hidden transition-all duration-300 ease-in-out ${collapsed ? 'max-h-0 opacity-0' : 'max-h-10 opacity-100 mt-2'}`}>
          <button onClick={() => setTenantSheetOpen(true)} className="flex items-center gap-1 active:scale-95">
            <span className="text-[11px] font-semibold text-text-secondary truncate max-w-[200px]">
              {tenantDisplayName}
            </span>
            <span className="material-symbols-outlined text-text-muted" style={{ fontSize: '14px' }}>
              keyboard_arrow_down
            </span>
          </button>
        </div>
      )}

      <TenantSheet isOpen={tenantSheetOpen} onClose={() => setTenantSheetOpen(false)} />
    </header>
  );
}
