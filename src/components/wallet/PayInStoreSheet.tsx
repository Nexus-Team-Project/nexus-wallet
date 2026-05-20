import { useState, useRef, useCallback, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { useNavigate, useParams } from 'react-router-dom';
import { ChevronLeft } from 'lucide-react';
import { useLanguage } from '../../i18n/LanguageContext';

interface PayInStoreSheetProps {
  onClose: () => void;
}

/** Mock payment code */
const PAYMENT_CODE = 'NXS-7526-4821';


export default function PayInStoreSheet({ onClose }: PayInStoreSheetProps) {
  const { t } = useLanguage();
  const { lang = 'he' } = useParams();
  const navigate = useNavigate();
  const [includesStacking, setIncludesStacking] = useState(true);
  const [showInfo, setShowInfo] = useState(false);
  const [showHowItWorks, setShowHowItWorks] = useState(false);
  const [copied, setCopied] = useState(false);

  // ── Refs for drag-to-dismiss ──
  const sheetRef = useRef<HTMLDivElement>(null);
  const overlayRef = useRef<HTMLDivElement>(null);
  const dragStartY = useRef(0);
  const currentTranslateY = useRef(0);
  const isDragging = useRef(false);

  // ── Copy code to clipboard ──
  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(PAYMENT_CODE);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      const textarea = document.createElement('textarea');
      textarea.value = PAYMENT_CODE;
      document.body.appendChild(textarea);
      textarea.select();
      document.execCommand('copy');
      document.body.removeChild(textarea);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  // ── Dismiss animation ──
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

  // ── Drag-to-dismiss (native touch events) ──
  useEffect(() => {
    const headerEl = document.getElementById('pay-sheet-header');
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
        if (sheetRef.current)
          sheetRef.current.style.transform = `translateY(${deltaY}px)`;
        if (overlayRef.current)
          overlayRef.current.style.opacity = String(
            Math.max(0, 1 - deltaY / 400)
          );
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
      {/* Overlay */}
      <div
        ref={overlayRef}
        className="fixed inset-0 z-[99] bg-black/40 animate-fade-in"
        onClick={dismiss}
      />

      {/* Sheet */}
      <div
        ref={sheetRef}
        className="fixed bottom-0 left-0 right-0 z-[100] bg-white rounded-t-3xl flex flex-col animate-slide-up"
        style={{ maxHeight: '90dvh' }}
      >
        {/* ── DRAG HEADER ── */}
        <div
          id="pay-sheet-header"
          className="flex-shrink-0 select-none"
          style={{ touchAction: 'none' }}
        >
          <div className="flex justify-center pt-3 pb-1">
            <div className="w-10 h-1.5 bg-border rounded-full" />
          </div>
        </div>

        {/* ── SCROLLABLE CONTENT ── */}
        <div className="flex-1 overflow-y-auto overscroll-contain px-6 pb-6" dir={lang === 'he' ? 'rtl' : 'ltr'}>
          {/* Title */}
          <h2 className="text-lg font-bold text-text-primary text-center mb-5 mt-1">
            {t.wallet.payInStoreTitle}
          </h2>

          {/* QR Code — centered with badge */}
          <div className="rounded-2xl border border-border p-4 mb-4 flex items-center justify-center relative">
            <img src="/qr-code.png" alt="QR Code" width={180} height={180} style={{ display: 'block' }} />
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-10 h-10 bg-white rounded-full flex items-center justify-center shadow-md border-2 border-white">
              <img src="/nexus-icon.png" alt="Nexus" className="w-7 h-7 rounded-full object-cover" />
            </div>
          </div>

          {/* Barcode — centered */}
          <div className="rounded-2xl border border-border p-4 mb-3 flex items-center justify-center">
            <img src="/barcode.png" alt="Barcode" width={200} height={50} style={{ display: 'block' }} />
          </div>

          {/* Text code with copy button */}
          <div className="flex items-center justify-center gap-2 mb-4">
            <p className="text-xl font-bold text-text-primary tracking-[0.2em]">
              {PAYMENT_CODE}
            </p>
            <button
              onClick={handleCopy}
              className="p-1.5 rounded-lg hover:bg-surface active:scale-95 transition-all"
              title="Copy"
            >
              <span
                className="material-symbols-outlined text-text-muted"
                style={{ fontSize: '20px' }}
              >
                {copied ? 'check' : 'content_copy'}
              </span>
            </button>
          </div>

          {/* Warning */}
          <div className="flex items-center justify-center gap-2 mb-5">
            <span className="material-symbols-outlined text-warning text-lg">warning</span>
            <p className="text-sm text-text-secondary">{t.wallet.dontShareCode}</p>
          </div>

          {/* Stacking toggle */}
          <div className="bg-surface rounded-2xl p-4 mb-4">
            <div className="flex items-center justify-between">
              {/* Title + info icon inline */}
              <div className="flex items-center gap-1.5">
                <span className="text-sm font-semibold text-text-primary">
                  {includesStacking ? t.wallet.includesStacking : t.wallet.excludesStacking}
                </span>
                <button
                  onClick={() => setShowInfo(!showInfo)}
                  className="p-0.5 rounded-full transition-colors"
                >
                  <span
                    className="material-symbols-outlined"
                    style={{ fontSize: '18px', color: 'var(--color-text-muted)', opacity: 0.5 }}
                  >
                    info
                  </span>
                </button>
              </div>

              {/* Toggle */}
              <button
                onClick={() => setIncludesStacking(!includesStacking)}
                className={`w-12 h-7 rounded-full transition-colors relative ${includesStacking ? 'bg-primary' : 'bg-border'}`}
              >
                <div
                  className="absolute top-0.5 w-6 h-6 bg-white rounded-full shadow-sm transition-all"
                  style={{ insetInlineStart: includesStacking ? '22px' : '2px' }}
                />
              </button>
            </div>

            {/* Info explanation */}
            {showInfo && (
              <p className="mt-3 text-sm text-text-secondary bg-white rounded-xl p-3 border border-border animate-fade-in">
                {t.wallet.stackingExplanation}
              </p>
            )}
          </div>

          {/* Maximize cashback — navigate to store */}
          <button
            onClick={() => {
              onClose();
              navigate(`/${lang}/store`);
            }}
            className="w-full flex items-center justify-between bg-surface rounded-2xl p-4 mb-3 active:scale-[0.98] transition-transform border border-border"
          >
            <span className="text-sm font-bold text-primary">
              {t.wallet.maximizeCashback}
            </span>
            <ChevronLeft size={20} className="text-primary" style={{ transform: lang === 'he' ? 'rotate(180deg)' : undefined }} />
          </button>

          {/* How does it work? — expandable card */}
          <div className="bg-surface rounded-2xl border border-border overflow-hidden">
            <button
              onClick={() => setShowHowItWorks(!showHowItWorks)}
              className="w-full flex items-center justify-between p-4 active:scale-[0.98] transition-transform"
            >
              <span className="text-sm font-bold text-primary">
                {t.wallet.howItWorks}
              </span>
              <span
                className={`material-symbols-outlined text-primary transition-transform duration-200 ${showHowItWorks ? 'rotate-180' : ''}`}
                style={{ fontSize: '20px' }}
              >
                expand_more
              </span>
            </button>
            {showHowItWorks && (
              <div className="px-4 pb-4 animate-fade-in">
                <div className="space-y-3 text-sm text-text-secondary">
                  <div className="flex items-start gap-2">
                    <span className="material-symbols-outlined text-primary flex-shrink-0" style={{ fontSize: '18px' }}>looks_one</span>
                    <span>{lang === 'he' ? 'הצג את הקוד בקופה לפני התשלום' : 'Show the code at checkout before paying'}</span>
                  </div>
                  <div className="flex items-start gap-2">
                    <span className="material-symbols-outlined text-primary flex-shrink-0" style={{ fontSize: '18px' }}>looks_two</span>
                    <span>{lang === 'he' ? 'שלם כרגיל עם כל אמצעי תשלום' : 'Pay as usual with any payment method'}</span>
                  </div>
                  <div className="flex items-start gap-2">
                    <span className="material-symbols-outlined text-primary flex-shrink-0" style={{ fontSize: '18px' }}>looks_3</span>
                    <span>{lang === 'he' ? 'קבל קאשבק ישירות לארנק שלך' : 'Get cashback directly to your wallet'}</span>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </>,
    document.body
  );
}
