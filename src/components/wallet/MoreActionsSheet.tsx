import { useRef, useCallback, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { useParams } from 'react-router-dom';
import { useLanguage } from '../../i18n/LanguageContext';

interface MoreActionsSheetProps {
  onClose: () => void;
}

const actions = [
  { key: 'addPaymentMethod', icon: 'add_card' },
  { key: 'walletHistory', icon: 'history' },
  { key: 'moreActions', icon: 'more_horiz' },
] as const;

export default function MoreActionsSheet({ onClose }: MoreActionsSheetProps) {
  const { t } = useLanguage();
  const { lang = 'he' } = useParams();

  const sheetRef = useRef<HTMLDivElement>(null);
  const overlayRef = useRef<HTMLDivElement>(null);
  const dragStartY = useRef(0);
  const currentTranslateY = useRef(0);
  const isDragging = useRef(false);

  const dismiss = useCallback(() => {
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
    const headerEl = document.getElementById('more-sheet-header');
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

  return createPortal(
    <>
      <div ref={overlayRef} className="fixed inset-0 z-[99] bg-black/40 animate-fade-in" onClick={dismiss} />
      <div ref={sheetRef} className="fixed bottom-0 left-0 right-0 max-w-md mx-auto z-[100] bg-white rounded-t-3xl animate-slide-up">
        {/* Drag header */}
        <div id="more-sheet-header" className="flex-shrink-0 select-none" style={{ touchAction: 'none' }}>
          <div className="flex justify-center pt-3 pb-1">
            <div className="w-10 h-1.5 bg-border rounded-full" />
          </div>
        </div>

        <div dir={lang === 'he' ? 'rtl' : 'ltr'}>
        <h3 className="text-lg font-bold text-text-primary px-5 mb-4 mt-1">{t.wallet.moreActionsTitle}</h3>

        {/* Actions list */}
        <div className="px-5 pb-10 space-y-1">
          {actions.map(({ key, icon }) => (
            <button
              key={key}
              className="w-full flex items-center gap-4 p-4 rounded-2xl hover:bg-surface active:scale-[0.98] transition-all"
            >
              <div className="w-11 h-11 rounded-xl bg-surface flex items-center justify-center">
                <span className="material-symbols-outlined text-text-primary" style={{ fontSize: '22px' }}>{icon}</span>
              </div>
              <span className="text-sm font-semibold text-text-primary">
                {t.wallet[key as keyof typeof t.wallet]}
              </span>
            </button>
          ))}
        </div>
        </div>
      </div>
    </>,
    document.body
  );
}
