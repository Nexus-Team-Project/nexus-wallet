import { useState, useRef, useEffect } from 'react';
import { useLanguage } from '../../i18n/LanguageContext';
import type { SortOption } from '../../types/category.types';

interface SortDropdownProps {
  value: SortOption;
  onChange: (option: SortOption) => void;
}

const SORT_OPTIONS: { key: SortOption; labelKey: keyof ReturnType<typeof getSortLabels> }[] = [
  { key: 'popular', labelKey: 'sortPopular' },
  { key: 'best_deals', labelKey: 'sortBestDeals' },
  { key: 'highest_discount', labelKey: 'sortHighestDiscount' },
  { key: 'price_asc', labelKey: 'sortPriceAsc' },
  { key: 'price_desc', labelKey: 'sortPriceDesc' },
  { key: 'newest', labelKey: 'sortNewest' },
];

function getSortLabels() {
  return {
    sortPopular: '',
    sortBestDeals: '',
    sortHighestDiscount: '',
    sortPriceAsc: '',
    sortPriceDesc: '',
    sortNewest: '',
  };
}

export default function SortDropdown({ value, onChange }: SortDropdownProps) {
  const { t } = useLanguage();
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    const handleClick = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, [open]);

  const currentLabel = t.category[
    SORT_OPTIONS.find((o) => o.key === value)?.labelKey || 'sortPopular'
  ];

  return (
    <div ref={ref} className="relative">
      <button
        onClick={() => setOpen(!open)}
        className="flex items-center gap-1.5 px-3.5 py-2 rounded-full bg-surface border border-border text-sm font-medium text-text-primary transition-colors hover:bg-border/50"
      >
        <span className="material-symbols-outlined" style={{ fontSize: '16px' }}>
          swap_vert
        </span>
        <span className="max-w-[100px] truncate">{currentLabel}</span>
      </button>

      {open && (
        <div className="absolute top-full mt-1.5 end-0 z-50 bg-white rounded-2xl shadow-lg border border-border py-1.5 min-w-[200px] animate-fade-in">
          {SORT_OPTIONS.map((option) => (
            <button
              key={option.key}
              onClick={() => {
                onChange(option.key);
                setOpen(false);
              }}
              className={`w-full text-start px-4 py-2.5 text-sm transition-colors ${
                value === option.key
                  ? 'text-primary font-semibold bg-primary/5'
                  : 'text-text-primary hover:bg-surface'
              }`}
            >
              {t.category[option.labelKey]}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
