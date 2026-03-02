import { useState } from 'react';
import { useLocation } from 'react-router-dom';
import StoreHeader from '../components/store/StoreHeader';
import CategoryPills from '../components/store/CategoryPills';
import VoucherGrid from '../components/store/VoucherGrid';
import StoreSliders from '../components/store/StoreSliders';
import type { StoreFilter } from '../types/voucher.types';

export default function StorePage() {
  const location = useLocation();
  const [selectedFilter, setSelectedFilter] = useState<StoreFilter | undefined>(
    (location.state as { filter?: StoreFilter } | null)?.filter
  );
  const [searchQuery, setSearchQuery] = useState('');

  const showSliders = !selectedFilter && !searchQuery;

  return (
    <div className="space-y-4 animate-fade-in">
      <StoreHeader searchQuery={searchQuery} onSearchChange={setSearchQuery} />
      <CategoryPills selected={selectedFilter} onSelect={setSelectedFilter} />

      {showSliders && (
        <StoreSliders onSelectFilter={setSelectedFilter} />
      )}

      <VoucherGrid filter={selectedFilter} searchQuery={searchQuery} />
    </div>
  );
}
