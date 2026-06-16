import { useRef, useCallback, useEffect, useState } from 'react';
import { createPortal } from 'react-dom';
import { useLanguage } from '../../i18n/LanguageContext';
import type { CouponCode } from '../../types/search.types';

interface CouponCodesSheetProps {
  isOpen: boolean;
  onClose: () => void;
  codes: CouponCode[];
  /** Copy the code and jump to the embedded supplier site. */
  onUseCode: (code: CouponCode) => void;
}

/**
 * Coupon-codes bottom sheet — lists the supplier's codes as "tickets". Each
 * row copies the code (local ✓ feedback) and/or jumps to the embedded supplier
 * site so the user can paste it at checkout. Mirrors the store filter sheet's
 * portal + slide-up + drag-to-dismiss pattern.
 */
export default function CouponCodesSheet({
  isOpen,
  onClose,
  codes,
  onUseCode,
}: CouponCodesSheetProps) {
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
    const header = document.getElementById('coupon-codes-sheet-header');
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
            id="coupon-codes-sheet-header"
            className="flex-shrink-0 select-none px-6 pt-3 pb-4"
            style={{ touchAction: 'none' }}
          >
            <div className="flex justify-center pb-4">
              <div className="w-10 h-1.5 bg-border rounded-full" />
            </div>
            <h2 className="text-lg font-bold text-text-primary leading-tight">
              {isHe ? 'קודי קופון' : 'Coupon codes'}
            </h2>
            <p className="text-xs text-text-muted mt-1">
              {isHe
                ? 'העתיקו קוד ועברו לאתר הספק כדי לממש'
                : 'Copy a code and head to the supplier site to redeem'}
            </p>
          </div>

          {/* ── Codes list ── */}
          <div className="flex-1 overflow-y-auto overscroll-contain px-6 pb-6 space-y-3">
            {codes.map((c) => (
              <CodeRow key={c.code} code={c} onUse={() => onUseCode(c)} isHe={isHe} />
            ))}
          </div>
        </div>
      </div>
    </>,
    document.body,
  );
}

function CodeRow({
  code,
  onUse,
  isHe,
}: {
  code: CouponCode;
  onUse: () => void;
  isHe: boolean;
}) {
  const [copied, setCopied] = useState(false);

  const copy = async () => {
    try {
      await navigator.clipboard.writeText(code.code);
    } catch {
      /* clipboard may be unavailable — ignore */
    }
    setCopied(true);
    window.setTimeout(() => setCopied(false), 1500);
  };

  return (
    <div className="flex items-center gap-3 rounded-2xl border border-dashed border-border bg-surface p-4">
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2">
          <span className="font-mono text-base font-bold tracking-wider text-text-primary" dir="ltr">
            {code.code}
          </span>
          {code.discount && (
            <span className="rounded-full bg-primary/10 text-primary text-[10px] font-bold px-2 py-0.5" dir="ltr">
              {code.discount}
            </span>
          )}
        </div>
        <p className="text-xs text-text-muted mt-0.5 truncate">
          {isHe ? code.titleHe : code.title}
        </p>
      </div>

      {/* Copy — copies only, with ✓ feedback */}
      <button
        onClick={copy}
        className="flex-shrink-0 w-10 h-10 rounded-full bg-white border border-border flex items-center justify-center text-text-secondary active:scale-90 transition-transform"
        aria-label={isHe ? 'העתק' : 'Copy'}
      >
        <span className="material-symbols-outlined" style={{ fontSize: 20 }}>
          {copied ? 'check' : 'content_copy'}
        </span>
      </button>

      {/* Go to supplier site — copies then opens the embedded site */}
      <button
        onClick={onUse}
        className="flex-shrink-0 bg-bg-dark text-white text-sm font-bold rounded-full px-4 py-2.5 active:scale-95 transition-transform"
      >
        {isHe ? 'לאתר' : 'Visit'}
      </button>
    </div>
  );
}
