import { useMemo, useState } from 'react';
import { useLanguage } from '../../i18n/LanguageContext';
import { useVouchers } from '../../hooks/useVouchers';
import VoucherCard from './VoucherCard';
import VoucherDetail from './VoucherDetail';
import Skeleton from '../ui/Skeleton';
import type { Voucher, StoreFilter, VoucherCategory, SpecialFilter } from '../../types/voucher.types';

const SPECIAL_FILTERS = new Set<SpecialFilter>([
  'coming-soon', 'expiring', 'online', 'new', 'popular', 'recommended',
]);

function isSpecialFilter(filter: StoreFilter): filter is SpecialFilter {
  return SPECIAL_FILTERS.has(filter as SpecialFilter);
}

interface VoucherGridProps {
  filter?: StoreFilter;
  searchQuery: string;
  /** Controlled selected voucher — pass when StorePage manages VoucherDetail */
  selectedVoucher?: Voucher | null;
  onSelect?: (voucher: Voucher | null) => void;
}

export default function VoucherGrid({ filter, searchQuery, selectedVoucher, onSelect }: VoucherGridProps) {
  const { t } = useLanguage();

  // For special filters fetch all; for category filters pass the category
  const category = filter && !isSpecialFilter(filter) ? (filter as VoucherCategory) : undefined;
  const { data: vouchers, isLoading } = useVouchers(category);

  // Internal selected state when caller doesn't control it
  const [internalSelected, setInternalSelected] = useState<Voucher | null>(null);
  const controlled = onSelect !== undefined;
  const currentSelected = controlled ? (selectedVoucher ?? null) : internalSelected;
  const handleSelect = (v: Voucher | null) => (controlled ? onSelect!(v) : setInternalSelected(v));

  const filtered = useMemo(() => {
    if (!vouchers) return [];

    const today = new Date();
    const oneMonthLater = new Date(today);
    oneMonthLater.setMonth(oneMonthLater.getMonth() + 1);

    let result = vouchers.filter((v) => {
      // Search filter
      if (searchQuery) {
        const query = searchQuery.toLowerCase();
        const matchesSearch =
          v.title.toLowerCase().includes(query) ||
          v.titleHe.includes(query) ||
          v.merchantName.toLowerCase().includes(query);
        if (!matchesSearch) return false;
      }

      // Special filter
      if (filter && isSpecialFilter(filter)) {
        switch (filter) {
          case 'coming-soon':
            return !!v.comingSoon;
          case 'expiring': {
            const expiry = new Date(v.validUntil);
            return expiry >= today && expiry <= oneMonthLater;
          }
          case 'online':
            return !!v.isOnline;
          case 'new':
            return !!v.isNew;
          case 'popular':
            return !!v.popular;
          case 'recommended':
            return true; // all shown, sorted below
          default:
            return true;
        }
      }

      return true;
    });

    // Sort recommended by highest discount
    if (filter === 'recommended') {
      result = [...result].sort((a, b) => b.discountPercent - a.discountPercent);
    }

    return result;
  }, [vouchers, filter, searchQuery]);

  if (isLoading) {
    return (
      <div className="grid grid-cols-2 gap-3">
        {[1, 2, 3, 4].map(i => (
          <Skeleton key={i} variant="rectangular" className="h-52 rounded-2xl" />
        ))}
      </div>
    );
  }

  if (!filtered.length) {
    return (
      <div className="text-center py-12">
        <p className="text-4xl mb-3">🔍</p>
        <p className="text-text-secondary">{t.common.noResults}</p>
      </div>
    );
  }

  return (
    <>
      <div className="grid grid-cols-2 gap-3">
        {filtered.map((voucher) => (
          <VoucherCard key={voucher.id} voucher={voucher} onSelect={handleSelect} />
        ))}
      </div>

      {currentSelected && (
        <VoucherDetail voucher={currentSelected} onClose={() => handleSelect(null)} />
      )}
    </>
  );
}
