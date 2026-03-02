import { useLanguage } from '../../i18n/LanguageContext';
import { cn } from '../../utils/cn';
import type { VoucherCategory, SpecialFilter, StoreFilter } from '../../types/voucher.types';

const categories: { key: VoucherCategory | 'all'; emoji: string }[] = [
  { key: 'all', emoji: '✨' },
  { key: 'food', emoji: '🍔' },
  { key: 'shopping', emoji: '🛍️' },
  { key: 'entertainment', emoji: '🎬' },
  { key: 'travel', emoji: '✈️' },
  { key: 'health', emoji: '💊' },
  { key: 'education', emoji: '📚' },
  { key: 'tech', emoji: '💻' },
];

const specialFilters: { key: SpecialFilter; emoji: string }[] = [
  { key: 'coming-soon', emoji: '🔜' },
  { key: 'expiring', emoji: '⏰' },
  { key: 'online', emoji: '🌐' },
];

interface CategoryPillsProps {
  selected: StoreFilter | undefined;
  onSelect: (filter: StoreFilter | undefined) => void;
}

export default function CategoryPills({ selected, onSelect }: CategoryPillsProps) {
  const { t } = useLanguage();

  const getLabel = (key: string): string => {
    if (key === 'all') return t.store.allCategories;
    if (key === 'coming-soon') return t.store.comingSoon;
    if (key === 'expiring') return t.store.expiring;
    if (key === 'online') return t.store.online;
    return (t.store as Record<string, string>)[key] ?? key;
  };

  return (
    <div className="flex gap-2 overflow-x-auto hide-scrollbar -mx-4 px-4 py-1">
      {/* Regular category pills */}
      {categories.map(({ key, emoji }) => {
        const isActive = key === 'all' ? !selected : selected === key;
        return (
          <button
            key={key}
            onClick={() => onSelect(key === 'all' ? undefined : (key as VoucherCategory))}
            className={cn(
              'flex items-center gap-1.5 px-4 py-2 rounded-full text-sm font-medium whitespace-nowrap transition-all duration-200 flex-shrink-0',
              isActive
                ? 'bg-text-primary text-white shadow-sm'
                : 'bg-white text-text-secondary border border-border hover:bg-border/50'
            )}
          >
            <span>{emoji}</span>
            <span>{getLabel(key)}</span>
          </button>
        );
      })}

      {/* Divider */}
      <div className="flex-shrink-0 w-px bg-border self-stretch my-1" />

      {/* Special filter pills */}
      {specialFilters.map(({ key, emoji }) => {
        const isActive = selected === key;
        return (
          <button
            key={key}
            onClick={() => onSelect(isActive ? undefined : key)}
            className={cn(
              'flex items-center gap-1.5 px-4 py-2 rounded-full text-sm font-medium whitespace-nowrap transition-all duration-200 flex-shrink-0',
              isActive
                ? 'bg-primary text-white shadow-sm'
                : 'bg-primary/8 text-primary border border-primary/20 hover:bg-primary/15'
            )}
          >
            <span>{emoji}</span>
            <span>{getLabel(key)}</span>
          </button>
        );
      })}
    </div>
  );
}
