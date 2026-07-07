import { useRef, useCallback, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { useNavigate, useParams } from 'react-router-dom';
import { useLanguage } from '../../i18n/LanguageContext';
import type { Business } from '../../types/search.types';

interface StoreActionsSheetProps {
  business: Business | null;
  isOpen: boolean;
  onClose: () => void;
}

interface MenuOption {
  icon: string;
  label: string;
  onClick?: () => void;
  danger?: boolean;
}

/**
 * StoreActionsSheet — the "⋮" actions sheet for a store card (e.g. on the home
 * page store slider). Leads with the three primary actions (pay in store, make
 * a deal, go to the business page), then the secondary actions carried over
 * from the business page's own menu (online store, share, policies, report).
 */
export default function StoreActionsSheet({ business, isOpen, onClose }: StoreActionsSheetProps) {
  const { language } = useLanguage();
  const { lang = 'he' } = useParams();
  const navigate = useNavigate();
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
    const header = document.getElementById('store-actions-sheet-header');
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

  if (!isOpen || !business) return null;

  const name = isHe ? business.nameHe : business.name;

  const handleShare = async () => {
    if (navigator.share) {
      try {
        await navigator.share({ title: name, url: window.location.href });
      } catch { /* cancelled */ }
    }
    dismiss();
  };

  // Primary store actions.
  const primary: MenuOption[] = [
    {
      icon: 'qr_code_2',
      label: isHe ? 'שלם בחנות וצבור קאשבק' : 'Pay in store & earn cashback',
      onClick: () => { dismiss(); navigate(`/${lang}/wallet/pay-intro`); },
    },
    {
      icon: 'storefront',
      label: isHe ? 'לבית העסק' : 'To the business',
      onClick: () => { dismiss(); navigate(`/${lang}/business/${business.id}`); },
    },
  ];

  // Secondary actions — carried over from the business page's own menu.
  const secondary: MenuOption[] = [
    { icon: 'ios_share', label: isHe ? 'שיתוף' : 'Share', onClick: handleShare },
    { icon: 'assignment_return', label: isHe ? 'מדיניות החזרים' : 'Refund policy' },
    { icon: 'local_shipping', label: isHe ? 'מדיניות משלוחים' : 'Shipping policy' },
    { icon: 'shield', label: isHe ? 'מדיניות פרטיות' : 'Privacy policy' },
    { icon: 'description', label: isHe ? 'תנאים והגבלות' : 'Terms and conditions' },
    { icon: 'flag', label: isHe ? 'דיווח' : 'Report', danger: true },
  ];

  const Row = (opt: MenuOption) => (
    <button
      key={opt.icon}
      onClick={opt.onClick}
      className="w-full flex items-center gap-4 py-3.5 text-start active:bg-surface/70 rounded-xl transition-colors"
    >
      <span
        className={`material-symbols-outlined ${opt.danger ? 'text-error' : 'text-text-primary'}`}
        style={{ fontSize: 24 }}
      >
        {opt.icon}
      </span>
      <span className={`text-[16px] font-semibold ${opt.danger ? 'text-error' : 'text-text-primary'}`}>
        {opt.label}
      </span>
    </button>
  );

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
            id="store-actions-sheet-header"
            className="flex-shrink-0 select-none px-6 pt-3 pb-4"
            style={{ touchAction: 'none' }}
          >
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
                <h2 className="text-lg font-bold text-text-primary leading-tight">{name}</h2>
                <p className="text-xs text-text-muted font-medium mt-0.5">
                  {business.rating} ★ ({business.reviewCount.toLocaleString()})
                </p>
              </div>
            </div>
          </div>

          {/* ── Options ── */}
          <div className="flex-1 overflow-y-auto overscroll-contain px-6 pb-2">
            <div className="space-y-1">{primary.map(Row)}</div>
            <div className="my-2 border-t border-border/60" />
            <div className="space-y-1">{secondary.map(Row)}</div>
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
