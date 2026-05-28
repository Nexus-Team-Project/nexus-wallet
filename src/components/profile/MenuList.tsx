import { useNavigate, useParams } from 'react-router-dom';
import { useLanguage } from '../../i18n/LanguageContext';
import { useAuthStore } from '../../stores/authStore';
import { cn } from '../../utils/cn';

interface MenuItem {
  icon: string; // material-symbols-outlined icon name
  label: string;
  detail?: string;
  onClick: () => void;
  /** Optional intent — `danger` shows the row in error red, for logout. */
  intent?: 'default' | 'danger';
}

/**
 * Flat options list shown below the tab strip. Each row has a leading
 * material-symbols icon, a label, an optional trailing detail string,
 * and a chevron pointing to the row's destination. Rows are separated
 * by a hairline divider that is indented past the icon column so the
 * divider lines up under the labels, matching the M3 spec.
 */
export default function MenuList() {
  const { t, language, setLanguage, isRTL } = useLanguage();
  const navigate = useNavigate();
  const { lang = 'he' } = useParams();
  const logout = useAuthStore((s) => s.logout);

  const handleLogout = () => {
    logout();
    navigate(`/${lang || 'he'}`, { replace: true });
  };

  const items: MenuItem[] = [
    { icon: 'notifications',     label: t.profile.notifications, onClick: () => navigate(`/${lang}/notifications`) },
    { icon: 'emoji_events',      label: t.profile.rewards,       onClick: () => {} },
    { icon: 'group',             label: t.profile.community,     onClick: () => {} },
    {
      icon: 'language',
      label: t.profile.language,
      detail: language === 'he' ? 'עברית' : 'English',
      onClick: () => setLanguage(language === 'he' ? 'en' : 'he'),
    },
    { icon: 'interests',         label: t.profile.interests,     onClick: () => {} },
    { icon: 'history',           label: t.profile.history,       onClick: () => navigate(`/${lang}/activity`) },
    { icon: 'bookmarks',         label: t.profile.bookmarks,     onClick: () => {} },
    { icon: 'help',              label: t.profile.help,          onClick: () => {} },
    { icon: 'info',              label: t.profile.about,         onClick: () => {} },
    { icon: 'logout',            label: t.profile.logout,        onClick: handleLogout, intent: 'danger' },
  ];

  // RTL flips the chevron direction — same affordance, mirrored.
  const chevron = isRTL ? 'chevron_left' : 'chevron_right';

  return (
    <section className="px-4 mt-2">
      {items.map((item) => {
        const isDanger = item.intent === 'danger';
        return (
          <button
            key={item.label}
            type="button"
            onClick={item.onClick}
            className={cn(
              'flex items-center gap-4 w-full py-4 text-start rounded-lg -mx-2 px-2 transition-colors',
              isDanger
                ? 'hover:bg-error/5 active:bg-error/10'
                : 'hover:bg-surface active:bg-border/50',
            )}
          >
            <span
              className={cn(
                'material-symbols-outlined flex-shrink-0',
                isDanger ? 'text-error' : 'text-text-secondary',
              )}
              style={{ fontSize: 24 }}
            >
              {item.icon}
            </span>
            <span
              className={cn(
                'flex-1 text-base',
                isDanger ? 'text-error font-semibold' : 'text-text-primary',
              )}
            >
              {item.label}
            </span>
            {item.detail && (
              <span className="text-xs text-text-muted">{item.detail}</span>
            )}
            {!isDanger && (
              <span
                className="material-symbols-outlined text-text-muted flex-shrink-0"
                style={{ fontSize: 22 }}
              >
                {chevron}
              </span>
            )}
          </button>
        );
      })}
    </section>
  );
}
