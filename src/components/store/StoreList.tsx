/**
 * StoreList — the vertical "N stores" list from the Klarna-style browse
 * mockup. Header shows the live count + a sort dropdown; each row is a
 * brand logo circle, merchant name and a green discount line. Tapping a
 * row opens VoucherDetail (handled by the parent StorePage).
 */
import { useState } from 'react';
import { useLanguage } from '../../i18n/LanguageContext';
import { cn } from '../../utils/cn';
import Skeleton from '../ui/Skeleton';
import StoreRow from './StoreRow';
import type { Voucher } from '../../types/voucher.types';

export type StoreSort = 'recommended' | 'newest' | 'discount' | 'az';

const SORT_OPTIONS: StoreSort[] = ['recommended', 'discount', 'newest', 'az'];

interface StoreListProps {
  vouchers: Voucher[];
  isLoading: boolean;
  sort: StoreSort;
  onSortChange: (sort: StoreSort) => void;
  onSelect: (voucher: Voucher) => void;
}

export default function StoreList({
  vouchers,
  isLoading,
  sort,
  onSortChange,
  onSelect,
}: StoreListProps) {
  const { t } = useLanguage();
  const [menuOpen, setMenuOpen] = useState(false);

  const sortLabel = (s: StoreSort): string => {
    switch (s) {
      case 'recommended': return t.store.recommended;
      case 'discount': return t.store.sortBiggestDiscount;
      case 'newest': return t.store.sortNewest;
      case 'az': return t.store.sortAZ;
    }
  };

  return (
    <section className="px-4 mt-6">
      {/* Header — count + sort */}
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-xl font-bold text-text-primary">
          {vouchers.length} {t.store.stores}
        </h2>

        <div className="relative">
          <button
            onClick={() => setMenuOpen((o) => !o)}
            className="flex items-center gap-0.5 text-primary font-medium text-sm active:opacity-70"
          >
            {sortLabel(sort)}
            <span className="material-symbols-outlined" style={{ fontSize: 18 }}>
              keyboard_arrow_down
            </span>
          </button>

          {menuOpen && (
            <>
              {/* Outside-tap catcher */}
              <div className="fixed inset-0 z-10" onClick={() => setMenuOpen(false)} />
              <div className="absolute end-0 mt-2 z-20 bg-white rounded-xl shadow-lg border border-border overflow-hidden min-w-[200px]">
                {SORT_OPTIONS.map((opt) => (
                  <button
                    key={opt}
                    onClick={() => {
                      onSortChange(opt);
                      setMenuOpen(false);
                    }}
                    className={cn(
                      'w-full text-start px-4 py-2.5 text-sm transition-colors',
                      sort === opt
                        ? 'bg-surface font-semibold text-primary'
                        : 'text-text-secondary active:bg-surface'
                    )}
                  >
                    {sortLabel(opt)}
                  </button>
                ))}
              </div>
            </>
          )}
        </div>
      </div>

      {/* Body */}
      {isLoading ? (
        <div className="space-y-6">
          {[1, 2, 3, 4, 5, 6].map((i) => (
            <div key={i} className="flex items-center gap-4">
              <Skeleton variant="circular" className="w-14 h-14 flex-shrink-0" />
              <div className="flex-1 space-y-2">
                <Skeleton className="h-4 w-1/3" />
                <Skeleton className="h-3 w-1/2" />
              </div>
            </div>
          ))}
        </div>
      ) : !vouchers.length ? (
        <div className="text-center py-12">
          <p className="text-4xl mb-3">🔍</p>
          <p className="text-text-secondary">{t.common.noResults}</p>
        </div>
      ) : (
        <div className="space-y-6 pb-4">
          {vouchers.map((v) => (
            <StoreRow key={v.id} voucher={v} onSelect={onSelect} />
          ))}
        </div>
      )}
    </section>
  );
}
