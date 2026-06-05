import { useCallback, useEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { useLanguage } from '../../i18n/LanguageContext';
import PaymentsSchedule from './PaymentsSchedule';

/**
 * PaymentsPlanSheet — choose how many installments to split the order into
 * (1…maxPayments). Mirrors the budget "monthly cycle" sheet: a slide-up sheet
 * with a drag handle, a horizontal picker of round options, a live preview of
 * sub-cards (one pie circle per payment showing cumulative progress + the
 * amount and when it's charged), and a dark rounded Save button.
 *
 * Charges run bi-weekly: the first payment today, then every two weeks.
 */

interface PaymentsPlanSheetProps {
  isOpen: boolean;
  onClose: () => void;
  currency: string;
  total: number;
  /** Currently-selected number of payments. */
  count: number;
  onSave: (count: number) => void;
  /** Maximum number of payments offered. */
  maxPayments?: number;
}

const round2 = (n: number) => Math.round(n * 100) / 100;

export default function PaymentsPlanSheet({
  isOpen,
  onClose,
  currency,
  total,
  count,
  onSave,
  maxPayments = 8,
}: PaymentsPlanSheetProps) {
  const { language } = useLanguage();
  const isHe = language === 'he';
  const sheetRef = useRef<HTMLDivElement>(null);
  const overlayRef = useRef<HTMLDivElement>(null);

  const [selected, setSelected] = useState(count);
  useEffect(() => {
    if (isOpen) setSelected(count);
  }, [isOpen, count]);

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
    const header = document.getElementById('payments-sheet-header');
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

  const fmt = (n: number) =>
    `${currency}${n.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;

  // Per-installment amount (for the plan summary line).
  const per = round2(total / selected);

  const handleSave = () => {
    onSave(selected);
    handleClose();
  };

  const summary = selected === 1
    ? (isHe ? 'תשלום אחד' : 'One payment')
    : (isHe ? `${selected} תשלומים של ${fmt(per)}` : `${selected} payments of ${fmt(per)}`);

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
          <div id="payments-sheet-header" className="flex-shrink-0 select-none px-6 pt-3 pb-4" style={{ touchAction: 'none' }}>
            <div className="flex justify-center pb-4">
              <div className="w-10 h-1.5 bg-border rounded-full" />
            </div>
            <div className="flex items-center justify-between gap-3">
              <h2 className="text-xl font-bold text-text-primary leading-tight">
                {isHe ? 'מספר תשלומים' : 'Number of payments'}
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
          <div className="flex-1 overflow-y-auto overscroll-contain px-6 pb-6 scrollbar-thin">
            <p className="text-sm text-text-secondary mb-4 leading-relaxed">
              {isHe
                ? 'בחרו לכמה תשלומים לחלק את ההזמנה. החיוב הראשון היום, והשאר כל שבועיים.'
                : 'Choose how many installments to split the order into. First charge today, the rest every two weeks.'}
            </p>

            {/* Count picker — round options 1…max in a horizontal slide */}
            <div className="-mx-6 px-6 mb-6">
              <div className="flex gap-3 overflow-x-auto scrollbar-hide snap-x snap-mandatory scroll-px-6 pb-1">
                {Array.from({ length: maxPayments }, (_, idx) => idx + 1).map((n) => {
                  const active = n === selected;
                  return (
                    <button
                      key={n}
                      type="button"
                      onClick={() => setSelected(n)}
                      className={`flex-none snap-start w-12 h-12 rounded-full flex items-center justify-center text-base font-bold border-2 transition-colors ${
                        active
                          ? 'bg-bg-dark text-white border-bg-dark'
                          : 'bg-surface text-text-primary border-transparent active:bg-primary/5'
                      }`}
                    >
                      {n}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Schedule preview — one sub-card per payment, each a pie circle
                showing cumulative progress, plus the amount and the date. */}
            <div className="-mx-6 px-6">
              <PaymentsSchedule currency={currency} total={total} count={selected} />
            </div>

            {/* Plan summary */}
            <p className="text-center text-[13px] font-medium text-text-secondary mt-5">{summary}</p>
          </div>

          {/* Save */}
          <div className="flex-shrink-0 px-6 pt-2 pb-2">
            <button
              type="button"
              onClick={handleSave}
              className="w-full py-4 bg-bg-dark text-white font-bold rounded-full active:scale-[0.98] transition-transform"
            >
              {isHe ? 'שמירה' : 'Save'}
            </button>
          </div>
        </div>
      </div>
    </>,
    document.body,
  );
}
