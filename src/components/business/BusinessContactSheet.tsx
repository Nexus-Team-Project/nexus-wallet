import { useRef, useCallback, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { useLanguage } from '../../i18n/LanguageContext';
import type { Business } from '../../types/search.types';

interface BusinessContactSheetProps {
  business: Business;
  isOpen: boolean;
  onClose: () => void;
}

interface ContactOption {
  icon: string;
  label: string;
  sub?: string;
  onClick: () => void;
}

export default function BusinessContactSheet({ business, isOpen, onClose }: BusinessContactSheetProps) {
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

  // Drag to dismiss (top header region) — pointer events so it works
  // with both touch and mouse.
  useEffect(() => {
    if (!isOpen) return;
    const header = document.getElementById('biz-contact-sheet-header');
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

  const name = isHe ? business.nameHe : business.name;

  const options: ContactOption[] = [
    business.whatsapp && {
      icon: 'chat',
      label: 'WhatsApp',
      sub: business.whatsapp,
      onClick: () => {
        window.open(`https://wa.me/${business.whatsapp}`, '_blank');
        dismiss();
      },
    },
    business.phone && {
      icon: 'call',
      label: isHe ? 'התקשרו' : 'Call',
      sub: business.phone,
      onClick: () => {
        window.open(`tel:${business.phone}`);
        dismiss();
      },
    },
  ].filter(Boolean) as ContactOption[];

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
          {/* ── Header (draggable — drag down to dismiss) ── */}
          <div
            id="biz-contact-sheet-header"
            className="flex-shrink-0 select-none px-6 pt-3 pb-4"
            style={{ touchAction: 'none' }}
          >
            {/* Grabber */}
            <div className="flex justify-center pb-4">
              <div className="w-10 h-1.5 bg-border rounded-full" />
            </div>

            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-xl bg-surface border border-border/60 flex items-center justify-center overflow-hidden">
                {business.logoUrl ? (
                  <img src={business.logoUrl} alt={name} className="w-8 h-8 object-contain" />
                ) : (
                  <span className="text-lg font-bold text-primary">{name.charAt(0)}</span>
                )}
              </div>
              <div>
                <h2 className="text-lg font-bold text-text-primary leading-tight">
                  {isHe ? `צרו קשר עם ${name}` : `Contact ${name}`}
                </h2>
                <p className="text-xs text-text-muted font-medium mt-0.5">
                  {isHe ? 'בחרו ערוץ ליצירת קשר' : 'Choose how to reach out'}
                </p>
              </div>
            </div>
          </div>

          {/* ── Options list ── */}
          <div className="flex-1 overflow-y-auto overscroll-contain px-6 pb-2">
            <div className="space-y-1">
              {options.map((opt) => (
                <button
                  key={opt.icon}
                  onClick={opt.onClick}
                  className="w-full flex items-center gap-4 py-3.5 text-start active:bg-surface/70 rounded-xl transition-colors"
                >
                  <span
                    className="material-symbols-outlined text-text-primary"
                    style={{ fontSize: 24 }}
                  >
                    {opt.icon}
                  </span>
                  <span className="flex flex-col">
                    <span className="text-[16px] font-semibold text-text-primary">{opt.label}</span>
                    {opt.sub && (
                      <span className="text-[13px] font-medium text-text-muted" dir="ltr">{opt.sub}</span>
                    )}
                  </span>
                </button>
              ))}
            </div>
          </div>

          {/* Home-indicator affordance */}
          <div className="flex-shrink-0 flex justify-center py-3">
            <div className="w-32 h-1.5 bg-border rounded-full" />
          </div>
        </div>
      </div>
    </>,
    document.body,
  );
}
