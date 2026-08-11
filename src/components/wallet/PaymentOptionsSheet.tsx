import { createPortal } from 'react-dom';
import { useLanguage } from '../../i18n/LanguageContext';

interface PaymentOptionsSheetProps {
  isOpen: boolean;
  onClose: () => void;
  onSelectSplit: () => void;
}

/**
 * "⋮" menu on the payment-method section — same list-of-actions chrome as
 * `MoreActionsSheet` (drag handle, title, icon rows). Currently a single
 * entry point into the split-payment flow; more options can slot in later.
 */
export default function PaymentOptionsSheet({ isOpen, onClose, onSelectSplit }: PaymentOptionsSheetProps) {
  const { isRTL } = useLanguage();

  if (!isOpen) return null;

  return createPortal(
    <>
      <div className="fixed inset-0 z-[70] bg-black/40 animate-fade-in" onClick={onClose} />
      <div className="fixed inset-x-0 bottom-0 z-[70] max-w-md mx-auto px-4 pb-6 pointer-events-none">
        <div
          dir={isRTL ? 'rtl' : 'ltr'}
          className="pointer-events-auto bg-white rounded-[28px] shadow-2xl overflow-hidden animate-slide-up"
        >
          <div className="flex justify-center pt-3 pb-1">
            <div className="w-10 h-1.5 bg-border rounded-full" />
          </div>

          <h3 className="text-lg font-bold text-text-primary px-5 mb-4 mt-1">
            {isRTL ? 'אפשרויות תשלום' : 'Payment options'}
          </h3>

          <div className="px-5 pb-10 space-y-1">
            <button
              onClick={onSelectSplit}
              className="w-full flex items-center gap-4 p-4 rounded-2xl hover:bg-surface active:scale-[0.98] transition-all text-start"
            >
              <div className="w-11 h-11 rounded-xl bg-surface flex items-center justify-center flex-shrink-0">
                <span className="material-symbols-rounded text-text-primary" style={{ fontSize: '22px' }}>
                  call_split
                </span>
              </div>
              <span className="text-sm font-semibold text-text-primary">
                {isRTL ? 'פצל בין אמצעי תשלום' : 'Split between payment methods'}
              </span>
            </button>
          </div>
        </div>
      </div>
    </>,
    document.body,
  );
}
