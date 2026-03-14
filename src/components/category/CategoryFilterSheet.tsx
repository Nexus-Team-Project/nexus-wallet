import { useState, useRef, useCallback, useEffect } from 'react';
import { useLanguage } from '../../i18n/LanguageContext';
import { mockBusinesses } from '../../mock/data/businesses.mock';
import type { CategoryFilters, DealType, MemberBenefit } from '../../types/category.types';
import type { VoucherCategory } from '../../types/voucher.types';

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

interface CategoryFilterSheetProps {
  onClose: () => void;
  filters: CategoryFilters;
  onApply: (filters: CategoryFilters) => void;
  categoryId: VoucherCategory;
  resultCount: number;
}

export default function CategoryFilterSheet({
  onClose,
  filters,
  onApply,
  categoryId,
  resultCount: _resultCount,
}: CategoryFilterSheetProps) {
  const { t, language } = useLanguage();
  const isHe = language === 'he';

  // Local copy of filters
  const [searchQuery, setSearchQuery] = useState(filters.searchQuery);
  const [priceMin, setPriceMin] = useState(filters.priceRange[0]);
  const [priceMax, setPriceMax] = useState(filters.priceRange[1]);
  const [selectedBrands, setSelectedBrands] = useState<string[]>(filters.selectedBrands);
  const [discountTiers, setDiscountTiers] = useState<number[]>(filters.discountTiers);
  const [minRating, setMinRating] = useState<number | null>(filters.minRating);
  const [dealTypes, setDealTypes] = useState<DealType[]>(filters.dealTypes);
  const [memberBenefits, setMemberBenefits] = useState<MemberBenefit[]>(filters.memberBenefits);
  const [, setIsClosing] = useState(false);

  // Brands for this category
  const bizCategories = CATEGORY_TO_BIZ[categoryId] || [];
  const categoryBrands = mockBusinesses
    .filter((b) => bizCategories.includes(b.category))
    .map((b) => ({ name: b.name, nameHe: b.nameHe, logo: b.logo }));
  // Also add merchants not in businesses for completeness
  const allBrands = categoryBrands.length
    ? categoryBrands
    : mockBusinesses.map((b) => ({ name: b.name, nameHe: b.nameHe, logo: b.logo }));

  const filteredBrands = allBrands.filter((b) => {
    if (!searchQuery) return true;
    const q = searchQuery.toLowerCase();
    return b.name.toLowerCase().includes(q) || b.nameHe.includes(q);
  });

  // Drag-to-dismiss (same pattern as FilterSheet.tsx)
  const sheetRef = useRef<HTMLDivElement>(null);
  const overlayRef = useRef<HTMLDivElement>(null);
  const dragStartY = useRef(0);
  const currentTranslateY = useRef(0);
  const isDragging = useRef(false);

  const dismiss = useCallback(() => {
    setIsClosing(true);
    if (sheetRef.current) {
      sheetRef.current.style.transition = 'transform 0.3s ease-out';
      sheetRef.current.style.transform = 'translateY(100%)';
    }
    if (overlayRef.current) {
      overlayRef.current.style.transition = 'opacity 0.3s ease-out';
      overlayRef.current.style.opacity = '0';
    }
    setTimeout(onClose, 300);
  }, [onClose]);

  useEffect(() => {
    const headerEl = document.getElementById('category-filter-header');
    if (!headerEl) return;

    const onTouchStart = (e: TouchEvent) => {
      dragStartY.current = e.touches[0].clientY;
      isDragging.current = true;
      currentTranslateY.current = 0;
      if (sheetRef.current) sheetRef.current.style.transition = 'none';
    };
    const onTouchMove = (e: TouchEvent) => {
      if (!isDragging.current) return;
      const deltaY = e.touches[0].clientY - dragStartY.current;
      if (deltaY > 0) {
        e.preventDefault();
        currentTranslateY.current = deltaY;
        if (sheetRef.current) sheetRef.current.style.transform = `translateY(${deltaY}px)`;
        if (overlayRef.current) overlayRef.current.style.opacity = String(Math.max(0, 1 - deltaY / 400));
      }
    };
    const onTouchEnd = () => {
      if (!isDragging.current) return;
      isDragging.current = false;
      if (currentTranslateY.current > 80) {
        dismiss();
      } else {
        if (sheetRef.current) {
          sheetRef.current.style.transition = 'transform 0.3s ease-out';
          sheetRef.current.style.transform = 'translateY(0)';
        }
        if (overlayRef.current) {
          overlayRef.current.style.transition = 'opacity 0.3s ease-out';
          overlayRef.current.style.opacity = '1';
        }
      }
      currentTranslateY.current = 0;
    };

    headerEl.addEventListener('touchstart', onTouchStart, { passive: true });
    headerEl.addEventListener('touchmove', onTouchMove, { passive: false });
    headerEl.addEventListener('touchend', onTouchEnd, { passive: true });
    return () => {
      headerEl.removeEventListener('touchstart', onTouchStart);
      headerEl.removeEventListener('touchmove', onTouchMove);
      headerEl.removeEventListener('touchend', onTouchEnd);
    };
  }, [dismiss]);

  // Helpers
  const toggleBrand = (name: string) =>
    setSelectedBrands((prev) => (prev.includes(name) ? prev.filter((b) => b !== name) : [...prev, name]));
  const toggleDiscount = (tier: number) =>
    setDiscountTiers((prev) => (prev.includes(tier) ? prev.filter((d) => d !== tier) : [...prev, tier]));
  const toggleDealType = (dt: DealType) =>
    setDealTypes((prev) => (prev.includes(dt) ? prev.filter((d) => d !== dt) : [...prev, dt]));
  const toggleBenefit = (mb: MemberBenefit) =>
    setMemberBenefits((prev) => (prev.includes(mb) ? prev.filter((b) => b !== mb) : [...prev, mb]));

  const clearAll = () => {
    setSearchQuery('');
    setPriceMin(20);
    setPriceMax(2000);
    setSelectedBrands([]);
    setDiscountTiers([]);
    setMinRating(null);
    setDealTypes([]);
    setMemberBenefits([]);
  };

  const handleApply = () => {
    onApply({
      searchQuery,
      priceRange: [priceMin, priceMax],
      selectedBrands,
      discountTiers,
      minRating,
      dealTypes,
      memberBenefits,
    });
    dismiss();
  };

  const activeCount =
    selectedBrands.length +
    discountTiers.length +
    dealTypes.length +
    memberBenefits.length +
    (minRating ? 1 : 0) +
    (priceMin > 20 || priceMax < 2000 ? 1 : 0);

  // Price bar percentage
  const pMin = ((priceMin - 20) / (2000 - 20)) * 100;
  const pMax = ((priceMax - 20) / (2000 - 20)) * 100;

  return (
    <>
      {/* Overlay */}
      <div
        ref={overlayRef}
        className="fixed inset-0 z-50 bg-black/40 animate-fade-in"
        onClick={dismiss}
      />

      {/* Sheet */}
      <div
        ref={sheetRef}
        className="fixed bottom-0 left-0 right-0 z-50 bg-white rounded-t-3xl max-h-[90vh] flex flex-col animate-slide-up"
      >
        {/* Drag header */}
        <div id="category-filter-header" className="flex-shrink-0 select-none" style={{ touchAction: 'none' }}>
          <div className="flex justify-center pt-3 pb-2">
            <div className="w-10 h-1.5 bg-border rounded-full" />
          </div>
          <div className="px-5 pb-3 flex items-center justify-between">
            <h2 className="text-lg font-bold text-text-primary">{t.category.filterTitle}</h2>
            <button onClick={clearAll} className="text-sm text-primary font-medium">
              {t.category.clearAll}
            </button>
          </div>
        </div>

        {/* Scrollable content */}
        <div className="flex-1 overflow-y-auto overscroll-contain px-5 pb-6 space-y-6">
          {/* 1. Search within filters */}
          <div>
            <div className="relative">
              <span className="material-symbols-outlined absolute start-3 top-1/2 -translate-y-1/2 text-text-muted" style={{ fontSize: '18px' }}>
                search
              </span>
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder={t.category.searchFilters}
                className="w-full ps-10 pe-4 py-2.5 bg-surface border border-border rounded-xl text-sm text-text-primary placeholder:text-text-muted focus:outline-none focus:ring-2 focus:ring-primary/30"
              />
            </div>
          </div>

          {/* 2. Price range */}
          <div>
            <h3 className="text-sm font-semibold text-text-primary mb-3">{t.category.priceRange}</h3>
            <div className="flex items-center gap-3 mb-3">
              <div className="flex-1">
                <label className="text-[10px] text-text-muted mb-1 block">{t.category.minPrice}</label>
                <input
                  type="number"
                  value={priceMin}
                  onChange={(e) => setPriceMin(Math.max(20, Math.min(Number(e.target.value) || 20, priceMax)))}
                  className="w-full px-3 py-2 bg-surface border border-border rounded-xl text-sm text-text-primary focus:outline-none focus:ring-2 focus:ring-primary/30"
                />
              </div>
              <span className="text-text-muted mt-5">—</span>
              <div className="flex-1">
                <label className="text-[10px] text-text-muted mb-1 block">{t.category.maxPrice}</label>
                <input
                  type="number"
                  value={priceMax}
                  onChange={(e) => setPriceMax(Math.min(2000, Math.max(Number(e.target.value) || 2000, priceMin)))}
                  className="w-full px-3 py-2 bg-surface border border-border rounded-xl text-sm text-text-primary focus:outline-none focus:ring-2 focus:ring-primary/30"
                />
              </div>
            </div>
            {/* Visual range bar */}
            <div className="relative h-1.5 bg-border rounded-full">
              <div
                className="absolute h-full bg-primary rounded-full"
                style={{ left: `${pMin}%`, right: `${100 - pMax}%` }}
              />
            </div>
            <div className="flex justify-between mt-1">
              <span className="text-[10px] text-text-muted">₪20</span>
              <span className="text-[10px] text-text-muted">₪2,000</span>
            </div>
          </div>

          {/* 3. Brand / Store */}
          <div>
            <h3 className="text-sm font-semibold text-text-primary mb-3">{t.category.brandsStores}</h3>
            <div className="space-y-1 max-h-40 overflow-y-auto">
              {filteredBrands.map((brand) => (
                <button
                  key={brand.name}
                  onClick={() => toggleBrand(brand.name)}
                  className="flex items-center gap-3 w-full py-2 px-1 rounded-lg hover:bg-surface transition-colors"
                >
                  <div
                    className={`w-5 h-5 rounded border-2 flex items-center justify-center transition-colors ${
                      selectedBrands.includes(brand.name)
                        ? 'bg-primary border-primary'
                        : 'border-border'
                    }`}
                  >
                    {selectedBrands.includes(brand.name) && (
                      <span className="material-symbols-outlined text-white" style={{ fontSize: '14px' }}>check</span>
                    )}
                  </div>
                  <span className="text-lg">{brand.logo}</span>
                  <span className="text-sm text-text-primary">{isHe ? brand.nameHe : brand.name}</span>
                </button>
              ))}
            </div>
          </div>

          {/* 4. Discount tiers */}
          <div>
            <h3 className="text-sm font-semibold text-text-primary mb-3">{t.category.discountTiers}</h3>
            <div className="flex flex-wrap gap-2">
              {[10, 20, 30, 50].map((tier) => (
                <button
                  key={tier}
                  onClick={() => toggleDiscount(tier)}
                  className={`px-3.5 py-2 rounded-full text-sm font-medium transition-all ${
                    discountTiers.includes(tier)
                      ? 'bg-bg-dark text-white'
                      : 'bg-surface text-text-secondary border border-border'
                  }`}
                >
                  {tier}%+
                </button>
              ))}
            </div>
          </div>

          {/* 5. Star rating */}
          <div>
            <h3 className="text-sm font-semibold text-text-primary mb-3">{t.category.starRating}</h3>
            <div className="flex flex-wrap gap-2">
              {[4, 3, 2].map((stars) => (
                <button
                  key={stars}
                  onClick={() => setMinRating(minRating === stars ? null : stars)}
                  className={`flex items-center gap-1 px-3.5 py-2 rounded-full text-sm font-medium transition-all ${
                    minRating === stars
                      ? 'bg-bg-dark text-white'
                      : 'bg-surface text-text-secondary border border-border'
                  }`}
                >
                  <span>{'★'.repeat(stars)}</span>
                  <span>{t.category.starsAndAbove}</span>
                </button>
              ))}
            </div>
          </div>

          {/* 6. Deal type */}
          <div>
            <h3 className="text-sm font-semibold text-text-primary mb-3">{t.category.dealType}</h3>
            <div className="flex flex-wrap gap-2">
              {([
                { key: 'voucher' as DealType, label: t.category.dealVoucher },
                { key: 'coupon' as DealType, label: t.category.dealCoupon },
                { key: 'cashback' as DealType, label: t.category.dealCashback },
                { key: 'insurance' as DealType, label: t.category.dealInsurance },
                { key: 'service' as DealType, label: t.category.dealService },
              ]).map(({ key, label }) => (
                <button
                  key={key}
                  onClick={() => toggleDealType(key)}
                  className={`px-3.5 py-2 rounded-full text-sm font-medium transition-all ${
                    dealTypes.includes(key)
                      ? 'bg-bg-dark text-white'
                      : 'bg-surface text-text-secondary border border-border'
                  }`}
                >
                  {label}
                </button>
              ))}
            </div>
          </div>

          {/* 7. Member benefits */}
          <div>
            <h3 className="text-sm font-semibold text-text-primary mb-3">{t.category.memberBenefits}</h3>
            <div className="flex flex-wrap gap-2">
              {([
                { key: 'club_exclusive' as MemberBenefit, label: t.category.benefitClubExclusive },
                { key: 'bonus_points' as MemberBenefit, label: t.category.benefitBonusPoints },
                { key: 'special_price' as MemberBenefit, label: t.category.benefitSpecialPrice },
              ]).map(({ key, label }) => (
                <button
                  key={key}
                  onClick={() => toggleBenefit(key)}
                  className={`px-3.5 py-2 rounded-full text-sm font-medium transition-all ${
                    memberBenefits.includes(key)
                      ? 'bg-bg-dark text-white'
                      : 'bg-surface text-text-secondary border border-border'
                  }`}
                >
                  {label}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Action buttons */}
        <div className="flex-shrink-0 px-5 py-4 border-t border-border flex gap-3">
          <button
            onClick={clearAll}
            className="flex-1 py-3.5 rounded-xl border border-border text-sm font-semibold text-text-primary hover:bg-surface transition-colors"
          >
            {t.category.clearFilters}
          </button>
          <button
            onClick={handleApply}
            className="flex-1 py-3.5 rounded-xl bg-bg-dark text-white text-sm font-semibold hover:bg-bg-dark/90 transition-colors relative"
          >
            {t.category.showResults}
            {activeCount > 0 && (
              <span className="absolute -top-2 -right-2 rtl:-right-auto rtl:-left-2 min-w-[20px] h-5 bg-primary rounded-full flex items-center justify-center text-[10px] font-bold text-white px-1">
                {activeCount}
              </span>
            )}
          </button>
        </div>
      </div>
    </>
  );
}
