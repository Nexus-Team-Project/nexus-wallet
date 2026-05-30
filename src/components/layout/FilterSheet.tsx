import { useState, useRef, useCallback, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { useLanguage } from '../../i18n/LanguageContext';
import type { VoucherCategory } from '../../types/voucher.types';

const categories: { key: VoucherCategory; emoji: string }[] = [
  { key: 'food', emoji: '🍔' },
  { key: 'shopping', emoji: '🛍️' },
  { key: 'entertainment', emoji: '🎬' },
  { key: 'travel', emoji: '✈️' },
  { key: 'health', emoji: '💊' },
  { key: 'education', emoji: '📚' },
  { key: 'tech', emoji: '💻' },
];

const priceRanges = [
  { key: '0-50', en: 'Up to ₪50', he: 'עד ₪50' },
  { key: '50-100', en: '₪50 - ₪100', he: '₪50 - ₪100' },
  { key: '100-200', en: '₪100 - ₪200', he: '₪100 - ₪200' },
  { key: '200+', en: '₪200+', he: '₪200+' },
];

const discountRanges = [
  { key: '10+', en: '10%+', he: '10%+' },
  { key: '20+', en: '20%+', he: '20%+' },
  { key: '25+', en: '25%+', he: '25%+' },
  { key: '30+', en: '30%+', he: '30%+' },
];

interface FilterSheetProps {
  onClose: () => void;
}

export default function FilterSheet({ onClose }: FilterSheetProps) {
  const { t, language } = useLanguage();

  const [selectedCategories, setSelectedCategories] = useState<VoucherCategory[]>([]);
  const [selectedPrice, setSelectedPrice] = useState<string | null>(null);
  const [selectedDiscount, setSelectedDiscount] = useState<string | null>(null);
  const [onlyPopular, setOnlyPopular] = useState(false);
  const [onlyInStock, setOnlyInStock] = useState(false);
  const [, setIsClosing] = useState(false);

  // Drag to dismiss
  const sheetRef = useRef<HTMLDivElement>(null);
  const overlayRef = useRef<HTMLDivElement>(null);
  const dragStartY = useRef(0);
  const currentTranslateY = useRef(0);
  const isDragging = useRef(false);
  const contentRef = useRef<HTMLDivElement>(null);

  const dismiss = useCallback(() => {
    setIsClosing(true);
    if (sheetRef.current) {
      sheetRef.current.style.transition = 'transform 0.3s ease-out';
      sheetRef.current.style.transform = 'translateY(120%)';
    }
    if (overlayRef.current) {
      overlayRef.current.style.transition = 'opacity 0.3s ease-out';
      overlayRef.current.style.opacity = '0';
    }
    setTimeout(onClose, 300);
  }, [onClose]);

  // Use native touch event listeners to get { passive: false } for preventDefault
  useEffect(() => {
    const headerEl = document.getElementById('filter-sheet-header');
    if (!headerEl) return;

    const onTouchStart = (e: TouchEvent) => {
      dragStartY.current = e.touches[0].clientY;
      isDragging.current = true;
      currentTranslateY.current = 0;
      if (sheetRef.current) {
        sheetRef.current.style.transition = 'none';
      }
    };

    const onTouchMove = (e: TouchEvent) => {
      if (!isDragging.current) return;
      const deltaY = e.touches[0].clientY - dragStartY.current;
      if (deltaY > 0) {
        // Prevent browser scroll/pull-to-refresh while dragging down
        e.preventDefault();
        currentTranslateY.current = deltaY;
        if (sheetRef.current) {
          sheetRef.current.style.transform = `translateY(${deltaY}px)`;
        }
        // Fade overlay as user drags
        if (overlayRef.current) {
          const opacity = Math.max(0, 1 - deltaY / 400);
          overlayRef.current.style.opacity = String(opacity);
        }
      }
    };

    const onTouchEnd = () => {
      if (!isDragging.current) return;
      isDragging.current = false;

      if (currentTranslateY.current > 80) {
        // Dismiss — threshold reduced to 80px for easier swipe
        dismiss();
      } else {
        // Snap back
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

    // passive: false is CRITICAL — allows e.preventDefault() to stop browser scroll
    headerEl.addEventListener('touchstart', onTouchStart, { passive: true });
    headerEl.addEventListener('touchmove', onTouchMove, { passive: false });
    headerEl.addEventListener('touchend', onTouchEnd, { passive: true });

    return () => {
      headerEl.removeEventListener('touchstart', onTouchStart);
      headerEl.removeEventListener('touchmove', onTouchMove);
      headerEl.removeEventListener('touchend', onTouchEnd);
    };
  }, [dismiss]);

  const toggleCategory = (cat: VoucherCategory) => {
    setSelectedCategories(prev =>
      prev.includes(cat) ? prev.filter(c => c !== cat) : [...prev, cat]
    );
  };

  const activeFilterCount =
    selectedCategories.length +
    (selectedPrice ? 1 : 0) +
    (selectedDiscount ? 1 : 0) +
    (onlyPopular ? 1 : 0) +
    (onlyInStock ? 1 : 0);

  const clearAll = () => {
    setSelectedCategories([]);
    setSelectedPrice(null);
    setSelectedDiscount(null);
    setOnlyPopular(false);
    setOnlyInStock(false);
  };

  return createPortal(
    <>
      {/* Overlay */}
      <div
        ref={overlayRef}
        className="fixed inset-0 z-[60] bg-black/40 animate-fade-in"
        onClick={dismiss}
      />

      {/* Floating bottom sheet */}
      <div className="fixed inset-x-0 bottom-0 z-[60] max-w-md mx-auto px-4 pb-6 pointer-events-none">
        <div
          ref={sheetRef}
          className="pointer-events-auto bg-white rounded-[28px] shadow-2xl max-h-[82vh] flex flex-col overflow-hidden animate-slide-up"
        >
          {/* ===== DRAG HEADER — large touch target, touch-action: none ===== */}
          <div
            id="filter-sheet-header"
            className="flex-shrink-0 select-none"
            style={{ touchAction: 'none' }}
          >
            {/* Handle bar */}
            <div className="flex justify-center pt-3 pb-2">
              <div className="w-10 h-1.5 bg-border rounded-full" />
            </div>

            {/* Title row */}
            <div className="px-5 pb-3">
              <h2 className="text-lg font-bold text-text-primary">
                {language === 'he' ? 'סינון' : 'Filters'}
              </h2>
            </div>
          </div>

          {/* ===== SCROLLABLE CONTENT ===== */}
          <div ref={contentRef} className="flex-1 overflow-y-auto overscroll-contain px-5 pb-4">
            {/* Categories */}
          <div className="mb-6">
            <h3 className="text-sm font-semibold text-text-primary mb-3">
              {language === 'he' ? 'קטגוריות' : 'Categories'}
            </h3>
            <div className="flex flex-wrap gap-2">
              {categories.map(({ key, emoji }) => (
                <button
                  key={key}
                  onClick={() => toggleCategory(key)}
                  className={`flex items-center gap-1.5 px-3.5 py-2 rounded-full text-sm font-medium transition-all ${
                    selectedCategories.includes(key)
                      ? 'bg-bg-dark text-white'
                      : 'bg-surface text-text-secondary border border-border'
                  }`}
                >
                  <span>{emoji}</span>
                  <span>{t.store[key as keyof typeof t.store]}</span>
                </button>
              ))}
            </div>
          </div>

          {/* Price range */}
          <div className="mb-6">
            <h3 className="text-sm font-semibold text-text-primary mb-3">
              {language === 'he' ? 'טווח מחירים' : 'Price range'}
            </h3>
            <div className="flex flex-wrap gap-2">
              {priceRanges.map(({ key, en, he }) => (
                <button
                  key={key}
                  onClick={() => setSelectedPrice(selectedPrice === key ? null : key)}
                  className={`px-3.5 py-2 rounded-full text-sm font-medium transition-all ${
                    selectedPrice === key
                      ? 'bg-bg-dark text-white'
                      : 'bg-surface text-text-secondary border border-border'
                  }`}
                >
                  {language === 'he' ? he : en}
                </button>
              ))}
            </div>
          </div>

          {/* Discount */}
          <div className="mb-6">
            <h3 className="text-sm font-semibold text-text-primary mb-3">
              {language === 'he' ? 'אחוז הנחה' : 'Discount'}
            </h3>
            <div className="flex flex-wrap gap-2">
              {discountRanges.map(({ key, en, he }) => (
                <button
                  key={key}
                  onClick={() => setSelectedDiscount(selectedDiscount === key ? null : key)}
                  className={`px-3.5 py-2 rounded-full text-sm font-medium transition-all ${
                    selectedDiscount === key
                      ? 'bg-bg-dark text-white'
                      : 'bg-surface text-text-secondary border border-border'
                  }`}
                >
                  {language === 'he' ? he : en}
                </button>
              ))}
            </div>
          </div>

          {/* Toggles */}
          <div className="mb-8 space-y-3">
            <button
              onClick={() => setOnlyPopular(!onlyPopular)}
              className="flex items-center justify-between w-full py-2"
            >
              <span className="text-sm font-medium text-text-primary">
                {language === 'he' ? 'רק פופולריים' : 'Popular only'}
              </span>
              <div className={`w-11 h-6 rounded-full transition-colors relative ${onlyPopular ? 'bg-primary' : 'bg-border'}`}>
                <div className={`absolute top-0.5 w-5 h-5 bg-white rounded-full shadow-sm transition-all ${onlyPopular ? 'left-[22px]' : 'left-0.5'}`} />
              </div>
            </button>
            <button
              onClick={() => setOnlyInStock(!onlyInStock)}
              className="flex items-center justify-between w-full py-2"
            >
              <span className="text-sm font-medium text-text-primary">
                {language === 'he' ? 'רק במלאי' : 'In stock only'}
              </span>
              <div className={`w-11 h-6 rounded-full transition-colors relative ${onlyInStock ? 'bg-primary' : 'bg-border'}`}>
                <div className={`absolute top-0.5 w-5 h-5 bg-white rounded-full shadow-sm transition-all ${onlyInStock ? 'left-[22px]' : 'left-0.5'}`} />
              </div>
            </button>
          </div>
          </div>

          {/* ===== PINNED FOOTER ===== */}
          <div className="flex-shrink-0 px-5 pt-3 pb-4 flex gap-3">
            <button
              onClick={clearAll}
              className="flex-1 py-3.5 rounded-full border border-border text-sm font-semibold text-text-primary hover:bg-surface transition-colors"
            >
              {language === 'he' ? 'נקה פילטרים' : 'Clear filters'}
            </button>
            <button
              onClick={dismiss}
              className="flex-1 py-3.5 rounded-full bg-bg-dark text-white text-sm font-semibold active:scale-[0.98] transition-transform relative"
            >
              {language === 'he' ? 'הצג תוצאות' : 'Show results'}
              {activeFilterCount > 0 && (
                <span className="absolute -top-2 -right-2 rtl:-right-auto rtl:-left-2 min-w-[20px] h-5 bg-primary rounded-full flex items-center justify-center text-[10px] font-bold text-white px-1">
                  {activeFilterCount}
                </span>
              )}
            </button>
          </div>
        </div>
      </div>
    </>,
    document.body,
  );
}
