import { createPortal } from 'react-dom';
import { useNavigate, useParams } from 'react-router-dom';
import { useLanguage } from '../../i18n/LanguageContext';

interface PayCodeInfoSheetProps {
  isOpen: boolean;
  onClose: () => void;
}

/**
 * "How it works" explainer for the in-store pay code — a slide-up bottom
 * sheet matching the checkout's fees explainer. Holds the help text plus a
 * teal "more" link that opens the full pay-intro page.
 */
export default function PayCodeInfoSheet({ isOpen, onClose }: PayCodeInfoSheetProps) {
  const { t, language } = useLanguage();
  const { lang = 'he' } = useParams();
  const navigate = useNavigate();
  const isHe = language === 'he';

  if (!isOpen) return null;

  return createPortal(
    <>
      <div className="fixed inset-0 z-[60] bg-black/40 animate-fade-in" onClick={onClose} />

      <div className="fixed inset-x-0 bottom-0 z-[60] max-w-md mx-auto px-4 pb-6 pointer-events-none">
        <div
          dir={isHe ? 'rtl' : 'ltr'}
          className="pointer-events-auto bg-white rounded-[28px] shadow-2xl flex flex-col overflow-hidden animate-slide-up"
        >
          {/* Drag handle + title + close */}
          <div className="flex-shrink-0 px-6 pt-3 pb-4">
            <div className="flex justify-center pb-4">
              <div className="w-10 h-1.5 bg-border rounded-full" />
            </div>
            <div className="flex items-center justify-between gap-3">
              <h2 className="text-xl font-bold text-text-primary leading-tight">
                {isHe ? 'אז איך זה עובד?' : 'So how does it work?'}
              </h2>
              <button
                onClick={onClose}
                aria-label={isHe ? 'סגירה' : 'Close'}
                className="h-8 w-8 inline-flex items-center justify-center rounded-full bg-surface active:bg-border transition-colors flex-shrink-0"
              >
                <span className="material-symbols-rounded text-text-primary" style={{ fontSize: 20 }}>
                  close
                </span>
              </button>
            </div>
          </div>

          {/* Content */}
          <div className="px-6 pb-8 space-y-4">
            <p className="text-sm text-text-secondary leading-relaxed">{t.wallet.codeHelpTooltip}</p>

            {/* Stacking explainer — what "כולל / לא כולל כפל מבצעים" means */}
            <div>
              <h3 className="text-base font-bold text-text-primary mb-1.5">
                {isHe ? 'כפל מבצעים' : 'Stacking deals'}
              </h3>
              <p className="text-sm text-text-secondary leading-relaxed">
                {t.wallet.stackingExplanation}
              </p>
            </div>

            <button
              type="button"
              onClick={() => {
                onClose();
                navigate(`/${lang}/wallet/pay-intro`);
              }}
              className="text-sky-500 font-semibold underline"
            >
              {isHe ? 'עוד' : 'More'}
            </button>
          </div>
        </div>
      </div>
    </>,
    document.body,
  );
}
