import { useState, useRef, useCallback, useEffect, useLayoutEffect, type Dispatch, type SetStateAction, type ReactNode } from 'react';
import { createPortal } from 'react-dom';
import { motion } from 'framer-motion';
import { useLanguage } from '../../i18n/LanguageContext';
import { mockBusinesses } from '../../mock/data/businesses.mock';
import type { CategoryFilters, DealType, MemberBenefit, SortOption } from '../../types/category.types';
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

type PanelKey = 'sort' | 'category' | 'color' | 'size' | 'gender' | 'brand' | 'price' | 'rating' | 'shipsTo';

const SORT_KEYS: SortOption[] = ['popular', 'best_deals', 'highest_discount', 'price_asc', 'price_desc', 'newest'];
const SORT_LABEL_KEY: Record<SortOption, 'sortPopular' | 'sortBestDeals' | 'sortHighestDiscount' | 'sortPriceAsc' | 'sortPriceDesc' | 'sortNewest'> = {
  popular: 'sortPopular',
  best_deals: 'sortBestDeals',
  highest_discount: 'sortHighestDiscount',
  price_asc: 'sortPriceAsc',
  price_desc: 'sortPriceDesc',
  newest: 'sortNewest',
};

// Cosmetic fashion option sets (demo — these refine the visible filter UI to
// match the shop design; they aren't yet wired to the voucher data model).
const CATEGORY_OPTIONS = [
  { he: 'עליוניות', en: 'Tops' }, { he: 'תחתוניות', en: 'Bottoms' }, { he: 'שמלות', en: 'Dresses' },
  { he: 'מעילים', en: 'Outerwear' }, { he: 'נעליים', en: 'Shoes' }, { he: 'אקססוריז', en: 'Accessories' },
];
const COLOR_OPTIONS = [
  { he: 'שחור', en: 'Black', hex: '#111111' }, { he: 'לבן', en: 'White', hex: '#ffffff' },
  { he: 'כחול', en: 'Blue', hex: '#2563eb' }, { he: 'אדום', en: 'Red', hex: '#dc2626' },
  { he: 'ירוק', en: 'Green', hex: '#16a34a' }, { he: 'בז׳', en: 'Beige', hex: '#d6c7a1' },
  { he: 'ורוד', en: 'Pink', hex: '#ec4899' }, { he: 'אפור', en: 'Grey', hex: '#9ca3af' },
];
const SIZE_OPTIONS = ['XS', 'S', 'M', 'L', 'XL', 'XXL'];
const GENDER_OPTIONS = [
  { he: 'נשים', en: 'Women' }, { he: 'גברים', en: 'Men' }, { he: 'יוניסקס', en: 'Unisex' }, { he: 'ילדים', en: 'Kids' },
];
const SHIPS_TO_OPTIONS = [
  { he: 'תל אביב-יפו', en: 'Tel Aviv-Yafo' }, { he: 'ירושלים', en: 'Jerusalem' },
  { he: 'חיפה', en: 'Haifa' }, { he: 'באר שבע', en: 'Beer Sheva' },
];

interface CategoryFilterSheetProps {
  onClose: () => void;
  filters: CategoryFilters;
  onApply: (filters: CategoryFilters) => void;
  categoryId: VoucherCategory;
  resultCount: number;
  sortOption: SortOption;
  onSortChange: (option: SortOption) => void;
}

export default function CategoryFilterSheet({
  onClose,
  filters,
  onApply,
  categoryId,
  resultCount: _resultCount,
  sortOption,
  onSortChange,
}: CategoryFilterSheetProps) {
  const { t, language } = useLanguage();
  const isHe = language === 'he';

  // Real filters (wired to the data model)
  const [searchQuery, setSearchQuery] = useState(filters.searchQuery);
  const [priceMin, setPriceMin] = useState(filters.priceRange[0]);
  const [priceMax, setPriceMax] = useState(filters.priceRange[1]);
  const [selectedBrands, setSelectedBrands] = useState<string[]>(filters.selectedBrands);
  const [minRating, setMinRating] = useState<number | null>(filters.minRating);
  const [sort, setSort] = useState<SortOption>(sortOption);
  // Pass-through (kept so onApply stays consistent; no UI here).
  const discountTiers = filters.discountTiers;
  const dealTypes: DealType[] = filters.dealTypes;
  const memberBenefits: MemberBenefit[] = filters.memberBenefits;

  // Cosmetic fashion filters
  const [categories, setCategories] = useState<string[]>([]);
  const [colors, setColors] = useState<string[]>([]);
  const [sizes, setSizes] = useState<string[]>([]);
  const [genders, setGenders] = useState<string[]>([]);
  const [shipsTo, setShipsTo] = useState<string>(SHIPS_TO_OPTIONS[0].en);
  const [sellsFromLocal, setSellsFromLocal] = useState(false);
  const [onSale, setOnSale] = useState(false);
  const [inStock, setInStock] = useState(false);

  const [activePanel, setActivePanel] = useState<PanelKey | null>(null);
  const [, setIsClosing] = useState(false);

  // Animate the body to the active panel's measured height (no layout-scale
  // distortion — we animate the real pixel height of the content).
  const contentRef = useRef<HTMLDivElement>(null);
  const [bodyHeight, setBodyHeight] = useState<number | 'auto'>('auto');
  useLayoutEffect(() => {
    const el = contentRef.current;
    if (!el) return;
    const cap = typeof window !== 'undefined' ? window.innerHeight * 0.56 : 600;
    setBodyHeight(Math.min(el.scrollHeight, cap));
  }, [activePanel, searchQuery]);

  // Brands for this category
  const bizCategories = CATEGORY_TO_BIZ[categoryId] || [];
  const categoryBrands = mockBusinesses
    .filter((b) => bizCategories.includes(b.category))
    .map((b) => ({ name: b.name, nameHe: b.nameHe, logo: b.logo }));
  const allBrands = categoryBrands.length
    ? categoryBrands
    : mockBusinesses.map((b) => ({ name: b.name, nameHe: b.nameHe, logo: b.logo }));
  const filteredBrands = allBrands.filter((b) => {
    if (!searchQuery) return true;
    const q = searchQuery.toLowerCase();
    return b.name.toLowerCase().includes(q) || b.nameHe.includes(q);
  });

  // Drag-to-dismiss (applied to the outer wrapper so it doesn't fight the
  // sheet's framer-motion layout animation).
  const dragRef = useRef<HTMLDivElement>(null);
  const overlayRef = useRef<HTMLDivElement>(null);
  const dragStartY = useRef(0);
  const currentTranslateY = useRef(0);
  const isDragging = useRef(false);

  // Price range slider (thin dual-thumb).
  const trackRef = useRef<HTMLDivElement>(null);
  const dragThumb = useRef<'min' | 'max' | null>(null);

  const dismiss = useCallback(() => {
    setIsClosing(true);
    if (dragRef.current) {
      dragRef.current.style.transition = 'transform 0.3s ease-out';
      dragRef.current.style.transform = 'translateY(120%)';
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
      if (dragRef.current) dragRef.current.style.transition = 'none';
    };
    const onTouchMove = (e: TouchEvent) => {
      if (!isDragging.current) return;
      const deltaY = e.touches[0].clientY - dragStartY.current;
      if (deltaY > 0) {
        e.preventDefault();
        currentTranslateY.current = deltaY;
        if (dragRef.current) dragRef.current.style.transform = `translateY(${deltaY}px)`;
        if (overlayRef.current) overlayRef.current.style.opacity = String(Math.max(0, 1 - deltaY / 400));
      }
    };
    const onTouchEnd = () => {
      if (!isDragging.current) return;
      isDragging.current = false;
      if (currentTranslateY.current > 80) {
        dismiss();
      } else {
        if (dragRef.current) {
          dragRef.current.style.transition = 'transform 0.3s ease-out';
          dragRef.current.style.transform = 'translateY(0)';
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

  // Price slider — drag a thumb anywhere on the page (window listeners) so the
  // gesture keeps tracking even past the track edges.
  useEffect(() => {
    const onMove = (e: PointerEvent) => {
      const thumb = dragThumb.current;
      const el = trackRef.current;
      if (!thumb || !el) return;
      const rect = el.getBoundingClientRect();
      let ratio = Math.min(1, Math.max(0, (e.clientX - rect.left) / rect.width));
      // In RTL the track's start (low value) is on the right, so invert.
      if (isHe) ratio = 1 - ratio;
      const v = Math.round((20 + ratio * (2000 - 20)) / 10) * 10;
      if (thumb === 'min') setPriceMin(Math.min(v, priceMax));
      else setPriceMax(Math.max(v, priceMin));
    };
    const onUp = () => { dragThumb.current = null; };
    window.addEventListener('pointermove', onMove);
    window.addEventListener('pointerup', onUp);
    return () => {
      window.removeEventListener('pointermove', onMove);
      window.removeEventListener('pointerup', onUp);
    };
  }, [priceMin, priceMax, isHe]);

  // Toggle helpers
  const toggleIn = (setter: Dispatch<SetStateAction<string[]>>, value: string) =>
    setter((prev) => (prev.includes(value) ? prev.filter((v) => v !== value) : [...prev, value]));
  const toggleBrand = (name: string) => toggleIn(setSelectedBrands, name);

  const clearAll = () => {
    setSearchQuery('');
    setPriceMin(20);
    setPriceMax(2000);
    setSelectedBrands([]);
    setMinRating(null);
    setSort('popular');
    setCategories([]);
    setColors([]);
    setSizes([]);
    setGenders([]);
    setShipsTo(SHIPS_TO_OPTIONS[0].en);
    setSellsFromLocal(false);
    setOnSale(false);
    setInStock(false);
  };

  const handleApply = () => {
    onSortChange(sort);
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

  // Price bar percentage
  const pMin = ((priceMin - 20) / (2000 - 20)) * 100;
  const pMax = ((priceMax - 20) / (2000 - 20)) * 100;

  const PANEL_LABELS: Record<PanelKey, string> = {
    sort: isHe ? 'מיון' : 'Sort by',
    category: isHe ? 'קטגוריה' : 'Category',
    color: isHe ? 'צבע' : 'Color',
    size: isHe ? 'מידה' : 'Size',
    gender: isHe ? 'מגדר' : 'Gender',
    brand: t.category.brandsStores,
    price: t.category.priceRange,
    rating: t.category.starRating,
    shipsTo: isHe ? 'נשלח אל' : 'Ships to',
  };

  const shipsToLabel = SHIPS_TO_OPTIONS.find((o) => o.en === shipsTo);
  const sortLabel = t.category[SORT_LABEL_KEY[sort]];
  const priceSummary = priceMin > 20 || priceMax < 2000 ? `₪${priceMin}–₪${priceMax}` : '';

  const chip = (active: boolean) =>
    `px-3.5 py-2 rounded-full text-sm font-medium transition-all ${
      active ? 'bg-bg-dark text-white' : 'bg-surface text-text-secondary border border-border'
    }`;

  const rowClass = 'w-full flex items-center justify-between gap-3 py-4 border-b border-border/60 last:border-0';

  const DrillRow = ({ panel, summary }: { panel: PanelKey; summary?: string }) => (
    <button onClick={() => setActivePanel(panel)} className={`${rowClass} text-start active:opacity-60`}>
      <span className="text-[15px] font-medium text-text-primary">{PANEL_LABELS[panel]}</span>
      <span className="flex items-center gap-2 min-w-0">
        {summary && <span className="text-sm text-text-muted truncate max-w-[160px]">{summary}</span>}
        <span className="material-symbols-rounded text-text-muted shrink-0" style={{ fontSize: 20 }}>
          {isHe ? 'chevron_left' : 'chevron_right'}
        </span>
      </span>
    </button>
  );

  const ToggleRow = ({ label, on, onToggle }: { label: ReactNode; on: boolean; onToggle: () => void }) => (
    <button onClick={onToggle} className={`${rowClass} text-start`} aria-pressed={on}>
      <span className="text-[15px] font-medium text-text-primary">{label}</span>
      <span
        className={`w-5 h-5 rounded-md border-2 flex items-center justify-center transition-colors ${
          on ? 'bg-primary border-primary' : 'border-border'
        }`}
      >
        {on && <span className="material-symbols-outlined text-white" style={{ fontSize: '14px' }}>check</span>}
      </span>
    </button>
  );

  return createPortal(
    <>
      {/* Overlay — portaled to <body> so the dim sits above EVERYTHING (the
          sticky TopBar, the floating nav pill, etc.). */}
      <div
        ref={overlayRef}
        className="fixed inset-0 z-[70] bg-black/40 animate-fade-in"
        onClick={dismiss}
      />

      {/* Floating sheet */}
      <div className="fixed inset-x-0 bottom-0 z-[70] max-w-md mx-auto px-4 pb-6 pointer-events-none">
        <div ref={dragRef} className="pointer-events-auto animate-slide-up">
          <div className="bg-white rounded-[28px] shadow-2xl overflow-hidden flex flex-col">
            {/* Drag header — title + an X (closes on the main list, returns to it
                inside a sub-filter). */}
            <div id="category-filter-header" className="flex-shrink-0 select-none" style={{ touchAction: 'none' }}>
              <div className="flex justify-center pt-3 pb-2">
                <div className="w-10 h-1.5 bg-border rounded-full" />
              </div>
              <div className="px-5 pb-3 flex items-center justify-between gap-3">
                <h2 className="text-lg font-bold text-text-primary">
                  {activePanel ? PANEL_LABELS[activePanel] : t.category.filterTitle}
                </h2>
                <button
                  onClick={() => (activePanel ? setActivePanel(null) : dismiss())}
                  aria-label={activePanel ? (isHe ? 'חזרה' : 'Back') : (isHe ? 'סגירה' : 'Close')}
                  className="w-8 h-8 rounded-full bg-surface flex items-center justify-center text-text-secondary active:opacity-60"
                >
                  <span className="material-symbols-rounded" style={{ fontSize: 20 }}>close</span>
                </button>
              </div>
            </div>

            {/* Body — animates to the active panel's measured height so the
                sheet resizes smoothly without distorting its content. */}
            <motion.div
              animate={{ height: bodyHeight }}
              transition={{ duration: 0.3, ease: [0.4, 0, 0.2, 1] }}
              className="overflow-y-auto overscroll-contain subtle-scrollbar"
            >
              <div ref={contentRef} className="px-5 pb-5">
              {/* ── Main list ── */}
              {activePanel === null && (
                <div>
                  <DrillRow panel="sort" summary={sortLabel} />
                  <DrillRow panel="category" summary={categories.length ? String(categories.length) : ''} />
                  <DrillRow panel="color" summary={colors.length ? String(colors.length) : ''} />
                  <DrillRow panel="size" summary={sizes.length ? sizes.join(', ') : ''} />
                  <DrillRow panel="gender" summary={genders.length ? String(genders.length) : ''} />
                  <DrillRow panel="brand" summary={selectedBrands.length ? String(selectedBrands.length) : ''} />
                  <DrillRow panel="price" summary={priceSummary} />
                  <DrillRow panel="rating" summary={minRating ? `${'★'.repeat(minRating)} ${t.category.starsAndAbove}` : ''} />
                  <DrillRow panel="shipsTo" summary={isHe ? shipsToLabel?.he : shipsToLabel?.en} />
                  <ToggleRow
                    label={<span>{isHe ? 'נמכר מ' : 'Sells from'} 🇮🇱</span>}
                    on={sellsFromLocal}
                    onToggle={() => setSellsFromLocal((v) => !v)}
                  />
                  <ToggleRow label={isHe ? 'במבצע' : 'On sale'} on={onSale} onToggle={() => setOnSale((v) => !v)} />
                  <ToggleRow label={isHe ? 'במלאי' : 'In-stock'} on={inStock} onToggle={() => setInStock((v) => !v)} />
                </div>
              )}

              {/* ── Sort ── */}
              {activePanel === 'sort' && (
                <div className="py-1">
                  {SORT_KEYS.map((key) => (
                    <button key={key} onClick={() => setSort(key)} className="w-full flex items-center justify-between py-3 text-start">
                      <span className={`text-[15px] ${sort === key ? 'font-semibold text-primary' : 'text-text-primary'}`}>
                        {t.category[SORT_LABEL_KEY[key]]}
                      </span>
                      {sort === key && <span className="material-symbols-rounded text-primary" style={{ fontSize: 20 }}>check</span>}
                    </button>
                  ))}
                </div>
              )}

              {/* ── Category ── */}
              {activePanel === 'category' && (
                <div className="flex flex-wrap gap-2 pt-2">
                  {CATEGORY_OPTIONS.map((opt) => (
                    <button key={opt.en} onClick={() => toggleIn(setCategories, opt.en)} className={chip(categories.includes(opt.en))}>
                      {isHe ? opt.he : opt.en}
                    </button>
                  ))}
                </div>
              )}

              {/* ── Color ── */}
              {activePanel === 'color' && (
                <div className="flex flex-wrap gap-3 pt-2">
                  {COLOR_OPTIONS.map((opt) => {
                    const active = colors.includes(opt.en);
                    return (
                      <button key={opt.en} onClick={() => toggleIn(setColors, opt.en)} className="flex flex-col items-center gap-1.5 w-14">
                        <span
                          className={`w-10 h-10 rounded-full border ${active ? 'ring-2 ring-primary ring-offset-2' : 'border-border'}`}
                          style={{ background: opt.hex }}
                        />
                        <span className="text-[11px] text-text-secondary truncate w-full text-center">{isHe ? opt.he : opt.en}</span>
                      </button>
                    );
                  })}
                </div>
              )}

              {/* ── Size ── */}
              {activePanel === 'size' && (
                <div className="flex flex-wrap gap-2 pt-2">
                  {SIZE_OPTIONS.map((s) => (
                    <button key={s} onClick={() => toggleIn(setSizes, s)} className={`min-w-[52px] text-center ${chip(sizes.includes(s))}`}>
                      {s}
                    </button>
                  ))}
                </div>
              )}

              {/* ── Gender ── */}
              {activePanel === 'gender' && (
                <div className="flex flex-wrap gap-2 pt-2">
                  {GENDER_OPTIONS.map((opt) => (
                    <button key={opt.en} onClick={() => toggleIn(setGenders, opt.en)} className={chip(genders.includes(opt.en))}>
                      {isHe ? opt.he : opt.en}
                    </button>
                  ))}
                </div>
              )}

              {/* ── Brand ── */}
              {activePanel === 'brand' && (
                <div className="pt-1">
                  <div className="relative mb-3">
                    <span className="material-symbols-outlined absolute start-3 top-1/2 -translate-y-1/2 text-text-muted" style={{ fontSize: '18px' }}>search</span>
                    <input
                      type="text"
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      placeholder={t.category.searchFilters}
                      className="w-full ps-10 pe-4 py-2.5 bg-surface border border-border rounded-xl text-sm text-text-primary placeholder:text-text-muted focus:outline-none focus:ring-2 focus:ring-primary/30"
                    />
                  </div>
                  <div className="space-y-1">
                    {filteredBrands.map((brand) => (
                      <button key={brand.name} onClick={() => toggleBrand(brand.name)} className="flex items-center gap-3 w-full py-2 px-1 rounded-lg hover:bg-surface transition-colors">
                        <div className={`w-5 h-5 rounded border-2 flex items-center justify-center transition-colors ${selectedBrands.includes(brand.name) ? 'bg-primary border-primary' : 'border-border'}`}>
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
              )}

              {/* ── Price — thin dual-thumb slider (RTL-aware via logical insets) ── */}
              {activePanel === 'price' && (
                <div className="pt-4 pb-2">
                  <div className="flex justify-between mb-6 text-sm font-bold text-text-primary">
                    <span dir="ltr">₪{priceMin}</span>
                    <span dir="ltr">₪{priceMax}</span>
                  </div>
                  <div ref={trackRef} className="relative h-5 flex items-center select-none touch-none">
                    {/* Track */}
                    <div className="absolute inset-x-0 h-1 rounded-full bg-border/70" />
                    {/* Selected range */}
                    <div className="absolute h-1 rounded-full bg-primary" style={{ insetInlineStart: `${pMin}%`, insetInlineEnd: `${100 - pMax}%` }} />
                    {/* Thumbs */}
                    <button
                      type="button"
                      aria-label={isHe ? 'מחיר מינימום' : 'Minimum price'}
                      onPointerDown={() => { dragThumb.current = 'min'; }}
                      className="absolute w-[18px] h-[18px] rounded-full bg-primary border-2 border-white shadow-[0_1px_5px_rgba(0,0,0,0.3)] active:scale-110 transition-transform"
                      style={{ insetInlineStart: `${pMin}%`, marginInlineStart: -9 }}
                    />
                    <button
                      type="button"
                      aria-label={isHe ? 'מחיר מקסימום' : 'Maximum price'}
                      onPointerDown={() => { dragThumb.current = 'max'; }}
                      className="absolute w-[18px] h-[18px] rounded-full bg-primary border-2 border-white shadow-[0_1px_5px_rgba(0,0,0,0.3)] active:scale-110 transition-transform"
                      style={{ insetInlineStart: `${pMax}%`, marginInlineStart: -9 }}
                    />
                  </div>
                  <div className="flex justify-between mt-3 text-[10px] text-text-muted">
                    <span dir="ltr">₪20</span>
                    <span dir="ltr">₪2,000</span>
                  </div>
                </div>
              )}

              {/* ── Rating ── */}
              {activePanel === 'rating' && (
                <div className="flex flex-wrap gap-2 pt-2">
                  {[4, 3, 2].map((stars) => (
                    <button key={stars} onClick={() => setMinRating(minRating === stars ? null : stars)} className={`flex items-center gap-1 ${chip(minRating === stars)}`}>
                      <span>{'★'.repeat(stars)}</span>
                      <span>{t.category.starsAndAbove}</span>
                    </button>
                  ))}
                </div>
              )}

              {/* ── Ships to ── */}
              {activePanel === 'shipsTo' && (
                <div className="py-1">
                  {SHIPS_TO_OPTIONS.map((opt) => (
                    <button key={opt.en} onClick={() => setShipsTo(opt.en)} className="w-full flex items-center justify-between py-3 text-start">
                      <span className={`text-[15px] ${shipsTo === opt.en ? 'font-semibold text-primary' : 'text-text-primary'}`}>
                        {isHe ? opt.he : opt.en}
                      </span>
                      {shipsTo === opt.en && <span className="material-symbols-rounded text-primary" style={{ fontSize: 20 }}>check</span>}
                    </button>
                  ))}
                </div>
              )}
              </div>
            </motion.div>

            {/* Action buttons */}
            <div className="flex-shrink-0 px-5 py-4 border-t border-border flex gap-3">
              <button
                onClick={clearAll}
                className="flex-1 py-3.5 rounded-2xl border border-border text-sm font-semibold text-text-primary hover:bg-surface transition-colors"
              >
                {t.category.clearAll}
              </button>
              <button
                onClick={handleApply}
                className="flex-1 py-3.5 rounded-2xl bg-bg-dark text-white text-sm font-semibold hover:bg-bg-dark/90 transition-colors"
              >
                {isHe ? 'סיום' : 'Done'}
              </button>
            </div>
          </div>
        </div>
      </div>
    </>,
    document.body,
  );
}
