import { useState } from 'react';
import { createPortal } from 'react-dom';
import { useLanguage } from '../../i18n/LanguageContext';

interface ChatSheetProps {
  isOpen: boolean;
  onClose: () => void;
}

const WHATSAPP_NUMBER_DISPLAY = '055-433-9191';
const WHATSAPP_NUMBER_INTL = '972554339191';

function WhatsAppIcon({ size = 24 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="#25D366" aria-hidden>
      <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z" />
    </svg>
  );
}

/**
 * Contact/chat sheet — the app's standard floating info-sheet chrome (see
 * PayCodeInfoSheet / InfoSheet): portalled to document.body, dark backdrop,
 * a card floating with margin on all sides, rounded-[28px] on all corners,
 * drag handle + title/close row, sliding up from the bottom.
 */
export default function ChatSheet({ isOpen, onClose }: ChatSheetProps) {
  const { isRTL, language } = useLanguage();
  const isHe = language === 'he';
  const [copied, setCopied] = useState(false);

  if (!isOpen) return null;

  const handleWhatsApp = () => {
    window.open(`https://wa.me/${WHATSAPP_NUMBER_INTL}`, '_blank');
  };

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(WHATSAPP_NUMBER_DISPLAY);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      const textarea = document.createElement('textarea');
      textarea.value = WHATSAPP_NUMBER_DISPLAY;
      document.body.appendChild(textarea);
      textarea.select();
      document.execCommand('copy');
      document.body.removeChild(textarea);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  return createPortal(
    <>
      <div className="fixed inset-0 z-[60] bg-black/40 animate-fade-in" onClick={onClose} />

      <div className="fixed inset-x-0 bottom-0 z-[60] max-w-md mx-auto px-4 pb-6 pointer-events-none">
        <div
          dir={isRTL ? 'rtl' : 'ltr'}
          className="pointer-events-auto bg-white rounded-[28px] shadow-2xl flex flex-col overflow-hidden animate-slide-up"
        >
          {/* Drag handle + title + close */}
          <div className="flex-shrink-0 px-6 pt-3 pb-4">
            <div className="flex justify-center pb-4">
              <div className="w-10 h-1.5 bg-border rounded-full" />
            </div>
            <div className="flex items-center justify-between gap-3">
              <h2 className="text-xl font-bold text-text-primary leading-tight">
                {isHe ? 'שירות לקוחות' : 'Customer Service'}
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
            <div className="space-y-0.5">
              <p className="text-sm text-text-secondary leading-relaxed">
                {isHe
                  ? 'אנחנו זמינים עבורך בוואטסאפ בשעות הפעילות.'
                  : "We're available for you on WhatsApp during business hours."}
              </p>
              <p className="text-sm text-text-secondary leading-relaxed">
                {isHe ? 'ראשון - חמישי' : 'Sun - Thu'} <span dir="ltr">09:00 - 17:00</span>
              </p>
              <p className="text-sm text-text-secondary leading-relaxed">
                {isHe ? 'שישי - שבת' : 'Fri - Sat'} {isHe ? 'סגור' : 'Closed'}
              </p>
            </div>

            {/* WhatsApp CTA — round pill, white with a black outline, single icon */}
            <button
              onClick={handleWhatsApp}
              className="w-full flex items-center justify-center gap-2 py-3 rounded-full bg-white border-2 border-black active:scale-[0.98] transition-transform"
            >
              <WhatsAppIcon size={18} />
              <span className="text-sm font-bold text-black">
                {isHe ? 'בוא נדבר' : "Let's talk"}
              </span>
            </button>
            <div className="flex items-center justify-center gap-1">
              <p className="text-center text-xs text-text-secondary" dir="ltr">
                {WHATSAPP_NUMBER_DISPLAY}
              </p>
              <button
                onClick={handleCopy}
                aria-label={isHe ? 'העתקת מספר' : 'Copy number'}
                className="p-1 rounded-lg hover:bg-surface active:scale-95 transition-all"
              >
                <span className="material-symbols-outlined text-text-muted" style={{ fontSize: '14px' }}>
                  {copied ? 'check' : 'content_copy'}
                </span>
              </button>
            </div>
          </div>
        </div>
      </div>
    </>,
    document.body,
  );
}
