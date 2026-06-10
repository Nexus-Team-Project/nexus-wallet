/**
 * SettingsHeader - a minimal sticky top bar for settings/form pages (e.g. Edit
 * Profile). Shows just a back button and the page title, so these pages don't
 * inherit the heavy home/store TopBar chrome (avatar, greeting, notifications,
 * tenant switcher) which overlaps and overflows on a plain scrollable form.
 *
 * AppLayout suppresses its own TopBar for the routes that render this instead.
 */
import { useNavigate } from 'react-router-dom';
import { useLanguage } from '../../i18n/LanguageContext';

interface SettingsHeaderProps {
  /** Page title shown next to the back button. */
  title: string;
}

/**
 * Render the sticky settings header.
 * @param title the page title.
 * @returns the header element.
 */
export default function SettingsHeader({ title }: SettingsHeaderProps) {
  const navigate = useNavigate();
  const { t, isRTL } = useLanguage();

  return (
    <header className="sticky top-0 z-40 bg-bg-light/95 backdrop-blur border-b border-border/60">
      <div className="flex items-center gap-3 px-4 h-14">
        <button
          type="button"
          onClick={() => navigate(-1)}
          aria-label={t.common?.back ?? 'Back'}
          className="w-9 h-9 -ms-1 flex-shrink-0 rounded-full hover:bg-surface flex items-center justify-center active:scale-95 transition"
        >
          {/* RTL "back" points right (arrow_forward); LTR points left. */}
          <span className="material-symbols-outlined text-text-primary" style={{ fontSize: 22 }}>
            {isRTL ? 'arrow_forward' : 'arrow_back'}
          </span>
        </button>
        <h1 className="text-lg font-bold text-text-primary truncate">{title}</h1>
      </div>
    </header>
  );
}
