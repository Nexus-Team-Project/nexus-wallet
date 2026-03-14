import { useLanguage } from '../../i18n/LanguageContext';
import SortDropdown from './SortDropdown';
import type { SortOption } from '../../types/category.types';

interface FilterSortBarProps {
  activeFilterCount: number;
  sortOption: SortOption;
  onSortChange: (option: SortOption) => void;
  onFilterOpen: () => void;
}

export default function FilterSortBar({
  activeFilterCount,
  sortOption,
  onSortChange,
  onFilterOpen,
}: FilterSortBarProps) {
  const { t } = useLanguage();

  return (
    <div className="sticky top-14 z-40 bg-white/95 backdrop-blur-sm border-b border-border">
      <div className="max-w-md mx-auto px-4 py-2.5 flex items-center justify-between">
        {/* Filter button */}
        <button
          onClick={onFilterOpen}
          className="flex items-center gap-1.5 px-3.5 py-2 rounded-full bg-surface border border-border text-sm font-medium text-text-primary transition-colors hover:bg-border/50 relative"
        >
          <span className="material-symbols-outlined" style={{ fontSize: '18px' }}>
            tune
          </span>
          <span>{t.category.filters}</span>
          {activeFilterCount > 0 && (
            <span className="min-w-[18px] h-[18px] bg-primary rounded-full text-[10px] text-white font-bold flex items-center justify-center px-1">
              {activeFilterCount}
            </span>
          )}
        </button>

        {/* Sort dropdown */}
        <SortDropdown value={sortOption} onChange={onSortChange} />
      </div>
    </div>
  );
}
