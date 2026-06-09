import { useRef, useCallback, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { useLanguage } from '../../i18n/LanguageContext';

export type StoreFilter = 'all' | 'sale' | 'stock';
export type StoreSort = 'recommended' | 'price-asc' | 'price-desc';

interface BusinessStoreFilterSheetProps {
  isOpen: boolean;
  onClose: () => void;
  filter: StoreFilter;
  onFilterChange: (f: StoreFilter) => void;
  sort: StoreSort;
  onSortChange: (s: StoreSort) => void;
  filterOptions: { key: StoreFilter; label: string }[];
  resultCount: number;
}

export default function BusinessStoreFilterSheet({
  isOpen,
  onClose,
  filter,
  onFilterChange,
  sort,
  onSortChange,
  filterOptions,
  resultCount,
}: BusinessStoreFilterSheetProps) {
  const { language } = useLanguage();
  const isHe = language === 'he';
  const sheetRef = useRef<HTMLDivElement>(null);
  const overlayRef = useRef<HTMLDivElement>(null);

  const dismiss = useCallback(() => {
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

  // Drag-to-dismiss on the header (pointer events — touch + mouse).
  useEffect(() => {
    if (!isOpen) return;
    const header = document.getElementById('store-filter-sheet-header');
    if (!header) return;

    let startY = 0;
    let curY = 0;
    let dragging = false;

    const settle = (toClosed: boolean) => {
      if (toClosed) {
        dismiss();
        return;
      }
      if (sheetRef.current) {
        sheetRef.current.style.transition = 'transform 0.3s ease-out';
        sheetRef.current.style.transform = 'translateY(0)';
      }
      if (overlayRef.current) {
        overlayRef.current.style.transition = 'opacity 0.3s ease-out';
        overlayRef.current.style.opacity = '1';
      }
    };

    const onDown = (e: PointerEvent) => {
      dragging = true;
      startY = e.clientY;
      curY = 0;
      if (sheetRef.current) sheetRef.current.style.transition = 'none';
      try { header.setPointerCapture(e.pointerId); } catch { /* noop */ }
    };
    const onMove = (e: PointerEvent) => {
      if (!dragging) return;
      const delta = e.clientY - startY;
      if (delta > 0) {
        curY = delta;
        if (sheetRef.current) sheetRef.current.style.transform = `translateY(${delta}px)`;
        if (overlayRef.current) overlayRef.current.style.opacity = String(Math.max(0, 1 - delta / 400));
      }
    };
    const onUp = () => {
      if (!dragging) return;
      dragging = false;
      settle(curY > 80);
    };

    header.addEventListener('pointerdown', onDown);
    header.addEventListener('pointermove', onMove);
    header.addEventListener('pointerup', onUp);
    header.addEventListener('pointercancel', onUp);
    return () => {
      header.removeEventListener('pointerdown', onDown);
      header.removeEventListener('pointermove', onMove);
      header.removeEventListener('pointerup', onUp);
      header.removeEventListener('pointercancel', onUp);
    };
  }, [isOpen, dismiss]);

  if (!isOpen) return null;

  const sortOptions: { key: StoreSort; label: string }[] = [
    { key: 'recommended', label: isHe ? 'מומלץ' : 'Recommended' },
    { key: 'price-asc', label: isHe ? 'מחיר: מהנמוך לגבוה' : 'Price: low to high' },
    { key: 'price-desc', label: isHe ? 'מחיר: מהגבוה לנמוך' : 'Price: high to low' },
  ];

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
          dir={isHe ? 'rtl' : 'ltr'}
          className="pointer-events-auto bg-white rounded-[28px] shadow-2xl max-h-[82vh] flex flex-col overflow-hidden animate-slide-up"
        >
          {/* ── Header (draggable) ── */}
          <div
            id="store-filter-sheet-header"
            className="flex-shrink-0 select-none px-6 pt-3 pb-4"
            style={{ touchAction: 'none' }}
          >
            <div className="flex justify-center pb-4">
              <div className="w-10 h-1.5 bg-border rounded-full" />
            </div>
            <h2 className="text-lg font-bold text-text-primary leading-tight">
              {isHe ? 'סינון ומיון' : 'Filter & sort'}
            </h2>
          </div>

          {/* ── Content ── */}
          <div className="flex-1 overflow-y-auto overscroll-contain px-6 pb-2">
            {/* Filter chips */}
            <p className="text-xs font-bold text-text-muted uppercase tracking-wide mb-3">
              {isHe ? 'הצג' : 'Show'}
            </p>
            <div className="flex flex-wrap gap-2 mb-7">
              {filterOptions.map((opt) => (
                <button
                  key={opt.key}
                  onClick={() => onFilterChange(opt.key)}
                  className={`h-10 px-5 rounded-full text-sm font-semibold transition-all active:scale-95 ${
                    filter === opt.key
                      ? 'bg-bg-dark text-white'
                      : 'bg-surface text-text-secondary'
                  }`}
                >
                  {opt.label}
                </button>
              ))}
            </div>

            {/* Sort rows */}
            <p className="text-xs font-bold text-text-muted uppercase tracking-wide mb-2">
              {isHe ? 'מיון' : 'Sort by'}
            </p>
            <div className="space-y-1">
              {sortOptions.map((opt) => {
                const active = sort === opt.key;
                return (
                  <button
                    key={opt.key}
                    onClick={() => onSortChange(opt.key)}
                    className="w-full flex items-center justify-between py-3.5 text-start active:bg-surface/70 rounded-xl transition-colors"
                  >
                    <span className={`text-[15px] font-semibold ${active ? 'text-text-primary' : 'text-text-secondary'}`}>
                      {opt.label}
                    </span>
                    <span
                      className={`material-symbols-outlined ${active ? 'text-primary' : 'text-transparent'}`}
                      style={{ fontSize: 22, fontVariationSettings: "'FILL' 1" }}
                    >
                      check_circle
                    </span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* ── Footer CTA ── */}
          <div className="flex-shrink-0 px-6 pt-3 pb-4">
            <button
              onClick={dismiss}
              className="w-full py-3.5 bg-bg-dark text-white rounded-full font-bold text-base active:scale-[0.98] transition-transform"
            >
              {isHe ? `הצג ${resultCount} מוצרים` : `Show ${resultCount} products`}
            </button>
          </div>
        </div>
      </div>
    </>,
    document.body,
  );
}
