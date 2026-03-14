import { useState, useMemo } from 'react';
import { useParams } from 'react-router-dom';
import { useLanguage } from '../i18n/LanguageContext';
import { useVouchers } from '../hooks/useVouchers';
import { mockBusinesses } from '../mock/data/businesses.mock';
import { DEFAULT_CATEGORY_FILTERS } from '../types/category.types';
import type { CategoryFilters, SortOption } from '../types/category.types';
import type { VoucherCategory, Voucher } from '../types/voucher.types';

import CategoryHeader from '../components/category/CategoryHeader';
import SubcategoryGrid from '../components/category/SubcategoryGrid';
import FilterSortBar from '../components/category/FilterSortBar';
import HighlightBanner from '../components/category/HighlightBanner';
import FeaturedStoresCarousel from '../components/category/FeaturedStoresCarousel';
import BestDealsGrid from '../components/category/BestDealsGrid';
import StoresWithProducts from '../components/category/StoresWithProducts';
import TrendingProductsGrid from '../components/category/TrendingProductsGrid';
import CategoryFilterSheet from '../components/category/CategoryFilterSheet';
import VoucherDetail from '../components/store/VoucherDetail';

// Map VoucherCategory → business category strings
const CATEGORY_TO_BIZ: Record<VoucherCategory, string[]> = {
  food: ['Fast Food', 'Cafe', 'Supermarket'],
  shopping: ['Fashion'],
  entertainment: ['Entertainment'],
  travel: ['Hotels'],
  health: ['Health & Beauty', 'Fitness'],
  education: [],
  tech: ['Electronics'],
};

export default function CategoryPage() {
  const { categoryId: rawCategoryId } = useParams<{ categoryId: string }>();
  const categoryId = (rawCategoryId || 'food') as VoucherCategory;
  const { language } = useLanguage();

  const { data: allVouchers } = useVouchers();

  const [filters, setFilters] = useState<CategoryFilters>(DEFAULT_CATEGORY_FILTERS);
  const [sortOption, setSortOption] = useState<SortOption>('popular');
  const [filterOpen, setFilterOpen] = useState(false);
  const [selectedVoucher, setSelectedVoucher] = useState<Voucher | null>(null);
  const [_selectedSubcategory, setSelectedSubcategory] = useState<string | null>(null);

  // Filter vouchers to this category
  const categoryVouchers = useMemo(() => {
    if (!allVouchers) return [];
    return allVouchers.filter((v) => v.category === categoryId);
  }, [allVouchers, categoryId]);

  // Apply user filters + sort
  const filteredVouchers = useMemo(() => {
    return categoryVouchers
      .filter((v) => {
        // Price range
        if (v.discountedPrice < filters.priceRange[0] || v.discountedPrice > filters.priceRange[1]) return false;
        // Brands
        if (filters.selectedBrands.length && !filters.selectedBrands.includes(v.merchantName)) return false;
        // Discount tiers
        if (filters.discountTiers.length && !filters.discountTiers.some((tier) => v.discountPercent >= tier)) return false;
        // Search query
        if (filters.searchQuery) {
          const q = filters.searchQuery.toLowerCase();
          if (
            !v.title.toLowerCase().includes(q) &&
            !v.titleHe.includes(q) &&
            !v.merchantName.toLowerCase().includes(q)
          )
            return false;
        }
        return true;
      })
      .sort((a, b) => {
        switch (sortOption) {
          case 'popular':
            return (b.popular ? 1 : 0) - (a.popular ? 1 : 0);
          case 'best_deals':
          case 'highest_discount':
            return b.discountPercent - a.discountPercent;
          case 'price_asc':
            return a.discountedPrice - b.discountedPrice;
          case 'price_desc':
            return b.discountedPrice - a.discountedPrice;
          case 'newest':
            return (b.isNew ? 1 : 0) - (a.isNew ? 1 : 0);
          default:
            return 0;
        }
      });
  }, [categoryVouchers, filters, sortOption]);

  // Businesses matching this category
  const categoryStores = useMemo(() => {
    const bizCategories = CATEGORY_TO_BIZ[categoryId] || [];
    return mockBusinesses.filter((b) => bizCategories.includes(b.category));
  }, [categoryId]);

  // Vouchers grouped by merchant
  const vouchersByMerchant = useMemo(() => {
    const map = new Map<string, Voucher[]>();
    for (const v of filteredVouchers) {
      const existing = map.get(v.merchantName) || [];
      existing.push(v);
      map.set(v.merchantName, existing);
    }
    return map;
  }, [filteredVouchers]);

  // Active filter count for badge
  const activeFilterCount =
    filters.selectedBrands.length +
    filters.discountTiers.length +
    filters.dealTypes.length +
    filters.memberBenefits.length +
    (filters.minRating ? 1 : 0) +
    (filters.priceRange[0] > 20 || filters.priceRange[1] < 2000 ? 1 : 0);

  return (
    <div className="min-h-screen bg-white animate-fade-in">
      <CategoryHeader categoryId={categoryId} />
      <SubcategoryGrid categoryId={categoryId} onSubcategorySelect={setSelectedSubcategory} />
      <FilterSortBar
        activeFilterCount={activeFilterCount}
        sortOption={sortOption}
        onSortChange={setSortOption}
        onFilterOpen={() => setFilterOpen(true)}
      />

      <div className="py-6 space-y-8">
        {/* Discovery Block 1: Highlight Banner */}
        <HighlightBanner categoryId={categoryId} />

        {/* Discovery Block 2: Featured Stores */}
        {categoryStores.length > 0 && (
          <FeaturedStoresCarousel stores={categoryStores} />
        )}

        {/* Discovery Block 3: Best Deals */}
        <BestDealsGrid vouchers={filteredVouchers} onSelect={setSelectedVoucher} />

        {/* Discovery Block 4: Stores With Products */}
        {categoryStores.length > 0 && (
          <StoresWithProducts
            stores={categoryStores}
            vouchersByMerchant={vouchersByMerchant}
            onSelectVoucher={setSelectedVoucher}
          />
        )}

        {/* Discovery Block 5: Trending Products */}
        <TrendingProductsGrid vouchers={filteredVouchers} onSelect={setSelectedVoucher} />
      </div>

      {/* Voucher Detail bottom sheet */}
      {selectedVoucher && (
        <VoucherDetail voucher={selectedVoucher} onClose={() => setSelectedVoucher(null)} />
      )}

      {/* Filter bottom sheet */}
      {filterOpen && (
        <CategoryFilterSheet
          onClose={() => setFilterOpen(false)}
          filters={filters}
          onApply={setFilters}
          categoryId={categoryId}
          resultCount={filteredVouchers.length}
        />
      )}
    </div>
  );
}
