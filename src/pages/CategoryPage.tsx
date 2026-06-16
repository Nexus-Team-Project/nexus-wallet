import { useState, useMemo } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
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
import BrandFeatureStore from '../components/category/BrandFeatureStore';
import CategoryRowStore, { type CategoryRowItem } from '../components/category/CategoryRowStore';
import PopularProductsRail from '../components/category/PopularProductsRail';
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
  const { categoryId: rawCategoryId, lang = 'he' } = useParams<{ categoryId: string; lang: string }>();
  const categoryId = (rawCategoryId || 'food') as VoucherCategory;
  const navigate = useNavigate();
  const { language } = useLanguage();
  const isHe = language === 'he';

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

  // Fashion "category row" store — placeholder items aggregated across the
  // fashion stores' products. STRUCTURE ONLY: swap the source/title/promo for
  // real category data later.
  const fashionRowItems = useMemo<CategoryRowItem[]>(() => {
    return categoryStores
      .flatMap((b) => (b.products ?? []).filter((p) => p.image).map((p) => ({ b, p })))
      .slice(0, 8)
      .map(({ b, p }) => ({
        id: `${b.id}-${p.id}`,
        name: p.name,
        nameHe: p.nameHe,
        image: p.image,
        price: p.price,
        currency: p.currency,
        onClick: () => navigate(`/${lang}/business/${b.id}/product/${p.id}`),
      }));
  }, [categoryStores, lang, navigate]);

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
    // pt-20 pushes the page content down clear of the global TopBar
    // overlay (avatar + chat/bell buttons sitting at viewport y=0).
    // CategoryHeader stays `sticky top-0` so once the user scrolls past
    // the TopBar area, the header pins to the very top normally.
    <div className="relative isolate min-h-screen bg-white animate-fade-in pt-20">
      {/* Decorative home-page gradient glow at the top, fading into the page.
          `isolate` makes this root its own stacking context so the -z-10
          gradient paints above the white background (not behind it). */}
      <div className="absolute top-0 inset-x-0 h-[280px] -z-10 pointer-events-none" aria-hidden>
        <div
          className="w-full h-full opacity-[0.18]"
          style={{ background: 'linear-gradient(135deg, #ffb74d 0%, #ff91b8 35%, #9c88ff 65%, #80deea 100%)' }}
        />
        <div
          className="absolute inset-0"
          style={{ background: 'linear-gradient(to bottom, rgba(255,255,255,0) 0%, rgba(255,255,255,0) 55%, #ffffff 100%)' }}
        />
      </div>

      <CategoryHeader categoryId={categoryId} />
      <SubcategoryGrid categoryId={categoryId} onSubcategorySelect={setSelectedSubcategory} />
      <FilterSortBar
        activeFilterCount={activeFilterCount}
        sortOption={sortOption}
        onSortChange={setSortOption}
        onFilterOpen={() => setFilterOpen(true)}
        showSort={categoryId !== 'shopping'}
      />

      <div className="py-6 space-y-8">
        {/* Discovery Block 1: Highlight Banner — hidden on fashion, where the
            brand feature cards lead instead. */}
        {categoryId !== 'shopping' && <HighlightBanner categoryId={categoryId} />}

        {/* Discovery Block 2: Featured Stores — hidden on fashion (the brands
            already appear as full feature cards below). */}
        {categoryId !== 'shopping' && categoryStores.length > 0 && (
          <FeaturedStoresCarousel stores={categoryStores} />
        )}

        {/* Fashion only: in-page brand "mini stores" (light + dark cards). */}
        {categoryId === 'shopping' && categoryStores.length > 0 && (
          <div className="space-y-4">
            {categoryStores[0] && (
              <BrandFeatureStore
                business={categoryStores[0]}
                variant="light"
                bgVideo="/couple-exit-store.mp4"
                promo={{
                  saveLabel: isHe ? 'חסכו ₪15' : 'Save ₪15',
                  condition: isHe ? 'בהזמנות מעל ₪150' : 'on orders over ₪150',
                }}
              />
            )}
            {categoryStores[1] && (
              <BrandFeatureStore
                business={categoryStores[1]}
                variant="dark"
                bgVideo="/couple-exit-store.mp4"
                promo={{
                  saveLabel: isHe ? 'חסכו ₪40' : 'Save ₪40',
                  condition: isHe ? 'בהזמנות מעל ₪300' : 'on orders over ₪300',
                }}
              />
            )}

            {/* Additional "store" — built as a CATEGORY ROW. The title lives in
                the background video; sized to the Castro card's proportions.
                Placeholder data — fill in the real category later. */}
            {fashionRowItems.length > 0 && (
              <CategoryRowStore
                title="Style"
                titleHe="סטייל"
                items={fashionRowItems}
                accentColor="#1c1c1c"
                bgVideo="/style-category.mp4"
                titleInMedia
                mediaPosition="bottom"
                aspectRatio="2 / 3"
                onSeeAll={() => navigate(`/${lang}/store`)}
              />
            )}
          </div>
        )}

        {/* Discovery Block 3: Best Deals — hidden on fashion. */}
        {categoryId !== 'shopping' && (
          <BestDealsGrid vouchers={filteredVouchers} categoryId={categoryId} onSelect={setSelectedVoucher} />
        )}

        {/* Discovery Block 4: Stores With Products — hidden on fashion (the
            brands already appear as full feature cards above). */}
        {categoryId !== 'shopping' && categoryStores.length > 0 && (
          <StoresWithProducts
            stores={categoryStores}
            vouchersByMerchant={vouchersByMerchant}
            onSelectVoucher={setSelectedVoucher}
          />
        )}

        {/* Discovery Block 5: Trending — fashion shows real products from
            several stores; other categories keep the voucher-based slider. */}
        {categoryId === 'shopping' ? (
          <PopularProductsRail />
        ) : (
          <TrendingProductsGrid vouchers={filteredVouchers} categoryId={categoryId} onSelect={setSelectedVoucher} />
        )}
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
          sortOption={sortOption}
          onSortChange={setSortOption}
        />
      )}
    </div>
  );
}
