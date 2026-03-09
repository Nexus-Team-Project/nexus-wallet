import { NavLink, useParams } from 'react-router-dom';
import { useLanguage } from '../../i18n/LanguageContext';

const navItems = [
  { key: 'more', path: '/profile', icon: 'account_circle', iconFilled: 'account_circle' },
  { key: 'wallet', path: '/wallet', icon: 'wallet', iconFilled: 'wallet' },
  { key: 'home', path: '', icon: 'cottage', iconFilled: 'cottage' },
  { key: 'store', path: '/store', icon: 'receipt_long', iconFilled: 'receipt_long' },
] as const;

export default function BottomNav() {
  const { lang = 'he' } = useParams();
  const { t } = useLanguage();

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50">
      <div className="max-w-md mx-auto bg-white/95 backdrop-blur-lg border-t border-border px-8 py-3 pb-6 flex justify-around items-center">
        {navItems.map(({ key, path, icon, iconFilled }) => (
          <NavLink
            key={key}
            to={`/${lang}${path}`}
            end={path === ''}
            className={({ isActive }) =>
              `flex flex-col items-center gap-1 ${isActive ? 'text-text-primary' : 'text-text-muted'}`
            }
          >
            {({ isActive }) => (
              <>
                <span
                  className="material-symbols-outlined"
                  style={{
                    fontSize: '26px',
                    fontVariationSettings: isActive ? "'FILL' 1" : "'FILL' 0",
                  }}
                >
                  {isActive ? iconFilled : icon}
                </span>
                <span className={`text-[10px] ${isActive ? 'font-bold' : 'font-medium'}`}>
                  {t.nav[key as keyof typeof t.nav]}
                </span>
              </>
            )}
          </NavLink>
        ))}
      </div>
    </nav>
  );
}
