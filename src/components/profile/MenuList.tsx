import { useNavigate, useParams } from 'react-router-dom';
import {
  Store,
  Globe,
  HelpCircle,
  User,
  Lock,
  Languages,
  Bell,
  Smartphone,
  Image as ImageIcon,
  LayoutGrid,
  ShoppingBag,
  LogOut,
  ChevronRight,
  ChevronLeft,
  type LucideIcon,
} from 'lucide-react';
import { useLanguage } from '../../i18n/LanguageContext';
import { useAuthStore } from '../../stores/authStore';
import { useWalletLayoutStore } from '../../stores/walletLayoutStore';
import { cn } from '../../utils/cn';

interface MenuRow {
  /** Lucide icon component — thin-stroke, Klarna-style line icons. */
  Icon: LucideIcon;
  label: string;
  onClick: () => void;
  /** Optional trailing info — small text right before the chevron. */
  detail?: string;
  /** Optional brand-chip stack rendered before the chevron. */
  chips?: string[];
  /** Optional intent — `accent` shows the detail in the brand colour. */
  detailIntent?: 'default' | 'accent';
  /** Optional intent — `danger` is for destructive actions like logout. */
  intent?: 'default' | 'danger';
  /** When set, renders an iOS-style toggle instead of a chevron. The
   *  row's `onClick` should flip the value. */
  toggle?: { value: boolean };
}

interface MenuSection {
  title: string;
  rows: MenuRow[];
}

/**
 * Settings list — grouped into three sections per the M3 design:
 *   • Make it yours — personalisation (brands, interests)
 *   • Help          — support entry points
 *   • Control center — account / security / language / app prefs
 *
 * Icons are Lucide line icons (stroke-width 1.5) so the list reads as
 * refined fintech — closer to the Klarna look than Material Symbols'
 * chunkier glyphs.
 */
export default function MenuList() {
  const { t, language, setLanguage, isRTL } = useLanguage();
  const navigate = useNavigate();
  const { lang = 'he' } = useParams();
  const logout = useAuthStore((s) => s.logout);
  // Wallet "customize" mode — flipping this toggle shows grip handles
  // on the wallet sections so the user can drag them into a new order.
  const editEnabled = useWalletLayoutStore((s) => s.editEnabled);
  const setEditEnabled = useWalletLayoutStore((s) => s.setEditEnabled);

  const handleLogout = () => {
    logout();
    navigate(`/${lang || 'he'}`, { replace: true });
  };

  const sections: MenuSection[] = [
    {
      title: t.profile.settingsMakeItYours,
      rows: [
        {
          Icon: Store,
          label: t.profile.settingsBrandsAndStores,
          chips: ['FF', 'FF'],
          onClick: () => navigate(`/${lang}/store`),
        },
        {
          Icon: Globe,
          label: t.profile.interests,
          detail: t.profile.settingsAdd,
          detailIntent: 'accent',
          onClick: () => {},
        },
        {
          Icon: ImageIcon,
          label: t.profile.settingsWallpaper,
          onClick: () => navigate(`/${lang}/wallpaper`),
        },
        {
          Icon: LayoutGrid,
          label: t.profile.settingsCustomizeWallet,
          onClick: () => setEditEnabled(!editEnabled),
          toggle: { value: editEnabled },
        },
      ],
    },
    {
      title: t.profile.settingsHelp,
      rows: [
        {
          Icon: HelpCircle,
          label: t.profile.settingsCustomerService,
          onClick: () => {},
        },
      ],
    },
    {
      title: t.profile.settingsControlCenter,
      rows: [
        {
          Icon: ShoppingBag,
          label: language === 'he' ? 'ההזמנות שלי' : 'My orders',
          onClick: () => {},
        },
        {
          Icon: User,
          label: t.profile.settingsAccountInfo,
          onClick: () => {},
        },
        {
          Icon: Lock,
          label: t.profile.settingsSecurityPrivacy,
          onClick: () => {},
        },
        {
          Icon: Languages,
          label: t.profile.language,
          detail: language === 'he' ? 'עברית' : 'English',
          onClick: () => setLanguage(language === 'he' ? 'en' : 'he'),
        },
        {
          Icon: Bell,
          label: t.profile.settingsCommunication,
          onClick: () => navigate(`/${lang}/notifications`),
        },
        {
          Icon: Smartphone,
          label: t.profile.settingsAppPrefs,
          onClick: () => {},
        },
        // Logout — kept at the end of the control center, marked danger.
        {
          Icon: LogOut,
          label: t.profile.logout,
          onClick: handleLogout,
          intent: 'danger',
        },
      ],
    },
  ];

  const Chevron = isRTL ? ChevronLeft : ChevronRight;

  return (
    <div className="px-6 pb-12 pt-4 space-y-8">
      {sections.map((section) => (
        <section key={section.title}>
          <h2 className="text-[22px] font-bold text-text-primary mb-4">
            {section.title}
          </h2>
          <ul className="divide-y divide-border/60">
            {section.rows.map((row) => {
              const isDanger = row.intent === 'danger';
              return (
                <li key={row.label}>
                  <button
                    type="button"
                    onClick={row.onClick}
                    className={cn(
                      'w-full flex items-center justify-between gap-4 py-4 text-start transition-colors',
                      isDanger
                        ? 'hover:bg-error/5 active:bg-error/10'
                        : 'hover:bg-surface/60 active:bg-border/30',
                    )}
                  >
                    <div className="flex items-center gap-4 min-w-0">
                      <row.Icon
                        size={24}
                        strokeWidth={1.5}
                        className={cn(
                          'flex-shrink-0',
                          isDanger ? 'text-error' : 'text-text-primary',
                        )}
                      />
                      <span
                        className={cn(
                          'text-[17px] truncate',
                          isDanger
                            ? 'text-error font-semibold'
                            : 'text-text-primary',
                        )}
                      >
                        {row.label}
                      </span>
                    </div>
                    <div className="flex items-center gap-2 flex-shrink-0">
                      {row.chips && row.chips.length > 0 && (
                        <div className="flex -space-x-1 items-center">
                          {row.chips.map((chip, idx) => (
                            <span
                              key={idx}
                              className="w-7 h-7 rounded-full bg-surface border border-border flex items-center justify-center text-[10px] font-bold text-text-primary"
                            >
                              {chip}
                            </span>
                          ))}
                        </div>
                      )}
                      {row.detail && (
                        <span
                          className={cn(
                            'text-[15px] font-medium',
                            row.detailIntent === 'accent'
                              ? 'text-primary'
                              : 'text-text-muted',
                          )}
                        >
                          {row.detail}
                        </span>
                      )}
                      {row.toggle ? (
                        <span
                          aria-hidden
                          className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors flex-shrink-0 ${
                            row.toggle.value ? 'bg-primary' : 'bg-border'
                          }`}
                        >
                          <span
                            className={`inline-block h-5 w-5 transform rounded-full bg-white shadow transition-transform ${
                              row.toggle.value
                                ? isRTL
                                  ? '-translate-x-5'
                                  : 'translate-x-5'
                                : isRTL
                                  ? '-translate-x-0.5'
                                  : 'translate-x-0.5'
                            }`}
                          />
                        </span>
                      ) : (
                        !isDanger && (
                          <Chevron
                            size={18}
                            strokeWidth={2}
                            className="text-text-muted flex-shrink-0"
                          />
                        )
                      )}
                    </div>
                  </button>
                </li>
              );
            })}
          </ul>
        </section>
      ))}
    </div>
  );
}
