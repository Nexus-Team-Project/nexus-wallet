import { useCallback, useEffect, useRef } from 'react';
import { createPortal } from 'react-dom';
import { useLanguage } from '../../i18n/LanguageContext';

/**
 * FeesInfoSheet — a dedicated explainer bottom sheet ("So how does it work?")
 * opened from the order-summary help icons. Breaks down how the shipping fee,
 * service (operation) fee and taxes are calculated, mirroring the dedicated
 * fee-explainer sheets food-delivery apps show. Slide-up + tap-overlay-to-
 * close, matching the AddressSheet pattern.
 */

interface FeesInfoSheetProps {
  isOpen: boolean;
  onClose: () => void;
  currency: string;
  shipping: number;
  serviceFee: number;
  taxes: number;
  /** Mock distance to the store, shown in the shipping explanation. */
  distanceKm?: number;
}

export default function FeesInfoSheet({
  isOpen,
  onClose,
  currency,
  shipping,
  serviceFee,
  taxes,
  distanceKm = 3.6,
}: FeesInfoSheetProps) {
  const { language } = useLanguage();
  const isHe = language === 'he';
  const sheetRef = useRef<HTMLDivElement>(null);
  const overlayRef = useRef<HTMLDivElement>(null);

  const handleClose = useCallback(() => {
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

  // Drag-to-dismiss from the header handle.
  useEffect(() => {
    if (!isOpen) return;
    const header = document.getElementById('fees-sheet-header');
    if (!header) return;
    let startY = 0, curY = 0, dragging = false;
    const settle = (toClosed: boolean) => {
      if (toClosed) { handleClose(); return; }
      if (sheetRef.current) { sheetRef.current.style.transition = 'transform 0.3s ease-out'; sheetRef.current.style.transform = 'translateY(0)'; }
      if (overlayRef.current) { overlayRef.current.style.transition = 'opacity 0.3s ease-out'; overlayRef.current.style.opacity = '1'; }
    };
    const onDown = (e: PointerEvent) => {
      if ((e.target as Element).closest('button')) return;
      dragging = true; startY = e.clientY; curY = 0;
      if (sheetRef.current) sheetRef.current.style.transition = 'none';
      try { header.setPointerCapture(e.pointerId); } catch { /* noop */ }
    };
    const onMove = (e: PointerEvent) => { if (!dragging) return; const delta = e.clientY - startY; if (delta > 0) { curY = delta; if (sheetRef.current) sheetRef.current.style.transform = `translateY(${delta}px)`; if (overlayRef.current) overlayRef.current.style.opacity = String(Math.max(0, 1 - delta / 400)); } };
    const onUp = () => { if (!dragging) return; dragging = false; settle(curY > 80); };
    header.addEventListener('pointerdown', onDown);
    header.addEventListener('pointermove', onMove);
    header.addEventListener('pointerup', onUp);
    header.addEventListener('pointercancel', onUp);
    return () => { header.removeEventListener('pointerdown', onDown); header.removeEventListener('pointermove', onMove); header.removeEventListener('pointerup', onUp); header.removeEventListener('pointercancel', onUp); };
  }, [isOpen, handleClose]);

  if (!isOpen) return null;

  const fmt = (n: number) => `${currency}${n.toLocaleString()}`;

  const sections = [
    {
      title: isHe ? 'משלוח' : 'Shipping',
      body: isHe
        ? `דמי המשלוח מחושבים בין היתר על בסיס המרחק בינך לבין בית העסק ממנו הזמנת. בית העסק ${distanceKm} ק"מ ממך, לכן דמי המשלוח הם ${fmt(shipping)}.`
        : `Shipping is calculated based, among other things, on the distance between you and the store. The store is ${distanceKm} km away, so the shipping fee is ${fmt(shipping)}.`,
    },
    {
      title: isHe ? 'דמי תפעול' : 'Service fee',
      body: isHe
        ? `דמי תפעול מאפשרים לנו להמשיך ולשפר את חוויית ההזמנה באפליקציה, לפתח פיצ'רים חדשים ולתת שירות לקוחות מעולה. דמי התפעול הם 5% מסך עלות הפריטים בהזמנה, עד למקסימום של ${fmt(serviceFee)}.`
        : `The service fee lets us keep improving the in-app ordering experience, build new features and provide great customer support. It is 5% of the order's item cost, up to a maximum of ${fmt(serviceFee)}.`,
    },
    {
      title: isHe ? 'מסים' : 'Taxes',
      body: isHe
        ? `המסים המשוערים מחושבים לפי שיעור המע"מ החל על ההזמנה ומסתכמים ב-${fmt(taxes)}. הסכום הסופי עשוי להשתנות בהתאם לחישוב בעת התשלום.`
        : `Estimated taxes are calculated using the VAT rate applicable to your order and total ${fmt(taxes)}. The final amount may vary at payment.`,
    },
  ];

  return createPortal(
    <>
      <div ref={overlayRef} className="fixed inset-0 z-[60] bg-black/40 animate-fade-in" onClick={handleClose} />

      <div className="fixed inset-x-0 bottom-0 z-[60] max-w-md mx-auto px-4 pb-6 pointer-events-none">
        <div
          ref={sheetRef}
          dir={isHe ? 'rtl' : 'ltr'}
          className="pointer-events-auto bg-white rounded-[28px] shadow-2xl max-h-[82vh] flex flex-col overflow-hidden animate-slide-up"
        >
          {/* Drag handle + title + close */}
          <div id="fees-sheet-header" className="flex-shrink-0 select-none px-6 pt-3 pb-4" style={{ touchAction: 'none' }}>
            <div className="flex justify-center pb-4">
              <div className="w-10 h-1.5 bg-border rounded-full" />
            </div>
            <div className="flex items-center justify-between gap-3">
              <h2 className="text-xl font-bold text-text-primary leading-tight">
                {isHe ? 'אז איך זה עובד?' : 'So how does it work?'}
              </h2>
              <button
                onClick={handleClose}
                aria-label={isHe ? 'סגירה' : 'Close'}
                className="h-8 w-8 inline-flex items-center justify-center rounded-full bg-surface active:bg-border transition-colors flex-shrink-0"
              >
                <span className="material-symbols-rounded text-text-primary" style={{ fontSize: 20 }}>close</span>
              </button>
            </div>
          </div>

          {/* Scrollable content */}
          <div className="flex-1 overflow-y-auto overscroll-contain px-6 pb-8 scrollbar-thin space-y-6">
            {sections.map((s) => (
              <div key={s.title}>
                <h3 className="text-base font-bold text-text-primary mb-1.5">{s.title}</h3>
                <p className="text-sm text-text-secondary leading-relaxed">{s.body}</p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </>,
    document.body,
  );
}
