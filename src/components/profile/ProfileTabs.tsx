import { useLanguage } from '../../i18n/LanguageContext';
import { cn } from '../../utils/cn';

export type ProfileTab = 'activity' | 'saved' | 'help' | 'settings' | 'account';

interface ProfileTabsProps {
  selected: ProfileTab;
  onChange: (tab: ProfileTab) => void;
}

const TABS: { key: ProfileTab; labelKey: 'tabActivity' | 'tabSettings' | 'tabAccount' }[] = [
  { key: 'activity', labelKey: 'tabActivity' },
  { key: 'settings', labelKey: 'tabSettings' },
  { key: 'account', labelKey: 'tabAccount' },
];

/**
 * Horizontal scrollable tab strip sitting under the user info hero.
 * The active tab carries a 2px primary underline and primary-colored
 * label; inactive tabs are muted. The whole strip sits on top of a
 * single hairline divider so the underline tucks into it cleanly.
 */
export default function ProfileTabs({ selected, onChange }: ProfileTabsProps) {
  const { t } = useLanguage();

  return (
    <nav className="border-b border-border px-4">
      <div className="flex items-center gap-6 overflow-x-auto hide-scrollbar">
        {TABS.map(({ key, labelKey }) => {
          const isActive = key === selected;
          return (
            <button
              key={key}
              type="button"
              onClick={() => onChange(key)}
              className={cn(
                'py-3 -mb-px border-b-2 whitespace-nowrap text-sm transition-colors',
                isActive
                  ? 'border-primary text-primary font-bold'
                  : 'border-transparent text-text-muted font-medium hover:text-text-primary',
              )}
            >
              {t.profile[labelKey]}
            </button>
          );
        })}
      </div>
    </nav>
  );
}
