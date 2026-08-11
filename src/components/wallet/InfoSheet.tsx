import { createPortal } from 'react-dom';
import { useLanguage } from '../../i18n/LanguageContext';

export interface InfoSection {
  title: string;
  body: string;
}

interface InfoSheetProps {
  isOpen: boolean;
  onClose: () => void;
  sections: InfoSection[];
}

/**
 * Minimal "?" info sheet — same chrome as `PayCodeInfoSheet` (drag handle,
 * close row, stacked heading + explanation sections), for contexts that
 * need a lightweight explainer without the pay-code-specific "more" link.
 */
export default function InfoSheet({ isOpen, onClose, sections }: InfoSheetProps) {
  const { isRTL } = useLanguage();

  if (!isOpen) return null;

  return createPortal(
    <>
      <div className="fixed inset-0 z-[60] bg-black/40 animate-fade-in" onClick={onClose} />
      <div className="fixed inset-x-0 bottom-0 z-[60] max-w-md mx-auto px-4 pb-6 pointer-events-none">
        <div
          dir={isRTL ? 'rtl' : 'ltr'}
          className="pointer-events-auto bg-white rounded-[28px] shadow-2xl flex flex-col overflow-hidden animate-slide-up"
        >
          <div className="flex-shrink-0 px-6 pt-3 pb-2">
            <div className="flex justify-center pb-4">
              <div className="w-10 h-1.5 bg-border rounded-full" />
            </div>
            <div className="flex justify-end">
              <button
                onClick={onClose}
                aria-label={isRTL ? 'סגירה' : 'Close'}
                className="h-8 w-8 inline-flex items-center justify-center rounded-full bg-surface active:bg-border transition-colors flex-shrink-0"
              >
                <span className="material-symbols-rounded text-text-primary" style={{ fontSize: 20 }}>
                  close
                </span>
              </button>
            </div>
          </div>
          <div className="px-6 pb-8 space-y-4">
            {sections.map((sec) => (
              <div key={sec.title}>
                <h3 className="text-base font-bold text-text-primary mb-1.5">{sec.title}</h3>
                <p className="text-sm text-text-secondary leading-relaxed">{sec.body}</p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </>,
    document.body,
  );
}
