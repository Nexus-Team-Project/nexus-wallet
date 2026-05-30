import { useState } from 'react';
import { useParams } from 'react-router-dom';
import { useLanguage } from '../../i18n/LanguageContext';

/** Mock payment code */
const PAYMENT_CODE = 'NXS-7526-4821';

/**
 * Codes half of the in-store payment UI — title, QR, barcode and the
 * copyable code. Rendered ABOVE the balance square so it appears to
 * rise up from behind it when the pay session opens.
 */
export default function PayCodesPanel() {
  const { t } = useLanguage();
  const { lang = 'he' } = useParams();
  const [copied, setCopied] = useState(false);
  // Which code the user is currently viewing — QR (default) or the 1-D
  // barcode. Toggled via the segmented switcher below the title.
  const [codeView, setCodeView] = useState<'qr' | 'barcode'>('qr');
  // Help tooltip — explains how to use the code at the till.
  const [showHelp, setShowHelp] = useState(false);

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

  return (
    <div
      className="bg-white rounded-3xl border border-border shadow-[0_8px_30px_rgb(0,0,0,0.06)] px-6 pb-6 pt-4"
      dir={lang === 'he' ? 'rtl' : 'ltr'}
    >
      {/* Title */}
      <h2 className="text-lg font-bold text-text-primary text-center mb-3">
        {t.wallet.payInStoreTitle}
      </h2>

      {/* Code box — holds the QR or barcode. The QR ↔ barcode switcher
          sits in the top corner of this rectangle. */}
      <div className="relative rounded-2xl border border-border p-3 mb-3 min-h-[150px] flex items-center justify-center">
        {/* Switcher — same segmented pill as the map view toggle */}
        <div
          role="group"
          aria-label={lang === 'he' ? 'בחר תצוגה' : 'View mode'}
          className="absolute top-2 start-2 z-10 flex items-center bg-white shadow-md rounded-full p-1"
        >
          <button
            type="button"
            onClick={() => setCodeView('qr')}
            aria-pressed={codeView === 'qr'}
            aria-label={lang === 'he' ? 'הצג QR' : 'Show QR'}
            className={`w-8 h-8 rounded-full flex items-center justify-center transition-colors active:scale-95 ${
              codeView === 'qr' ? 'bg-surface' : ''
            }`}
          >
            <span
              className={`material-symbols-outlined ${
                codeView === 'qr' ? 'text-text-primary' : 'text-text-muted'
              }`}
              style={{ fontSize: '18px' }}
            >
              qr_code
            </span>
          </button>
          <button
            type="button"
            onClick={() => setCodeView('barcode')}
            aria-pressed={codeView === 'barcode'}
            aria-label={lang === 'he' ? 'הצג ברקוד' : 'Show barcode'}
            className={`w-8 h-8 rounded-full flex items-center justify-center transition-colors active:scale-95 ${
              codeView === 'barcode' ? 'bg-surface' : ''
            }`}
          >
            <span
              className={`material-symbols-outlined ${
                codeView === 'barcode' ? 'text-text-primary' : 'text-text-muted'
              }`}
              style={{ fontSize: '18px' }}
            >
              barcode
            </span>
          </button>
        </div>

        {/* QR Code — centered with badge */}
        {codeView === 'qr' && (
          <div className="relative flex items-center justify-center">
            <img src="/qr-code.png" alt="QR Code" width={126} height={126} style={{ display: 'block' }} />
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-9 h-9 bg-white rounded-full flex items-center justify-center shadow-md overflow-hidden">
              {/* Logo fills the disk, leaving only a hairline white ring */}
              <img src="/nexus-icon.png" alt="Nexus" className="w-full h-full rounded-full object-cover p-px" />
              {/* Soft white feather fading inward from the thin ring */}
              <div
                aria-hidden
                className="absolute inset-0 rounded-full pointer-events-none"
                style={{
                  background:
                    'radial-gradient(circle, rgba(255,255,255,0) 42%, rgba(255,255,255,0.45) 66%, rgba(255,255,255,0.85) 84%, #fff 100%)',
                }}
              />
            </div>
          </div>
        )}

        {/* Barcode — centered */}
        {codeView === 'barcode' && (
          <img src="/barcode.png" alt="Barcode" width={170} height={44} style={{ display: 'block' }} />
        )}

        {/* Help "i" — opposite corner (bottom, other side) with tooltip */}
        <div className="absolute bottom-2 end-2 z-20">
          <button
            type="button"
            onClick={() => setShowHelp((v) => !v)}
            aria-expanded={showHelp}
            aria-label={t.wallet.moreInfo}
            className="w-8 h-8 rounded-full bg-white shadow-md flex items-center justify-center transition-colors active:scale-95"
          >
            <span
              className={`material-symbols-outlined ${showHelp ? 'text-text-primary' : 'text-text-muted'}`}
              style={{ fontSize: '18px' }}
            >
              info
            </span>
          </button>
          {showHelp && (
            <div
              role="tooltip"
              className="absolute bottom-full end-0 mb-2 w-56 bg-white rounded-xl border border-border shadow-[0_8px_30px_rgb(0,0,0,0.12)] p-3 text-xs text-text-secondary leading-relaxed animate-fade-in"
            >
              {t.wallet.codeHelpTooltip}
            </div>
          )}
        </div>
      </div>

      {/* Text code with copy button */}
      <div className="flex items-center justify-center gap-2 mb-1">
        <p className="text-lg font-bold text-text-primary tracking-[0.2em]">
          {PAYMENT_CODE}
        </p>
        <button
          onClick={handleCopy}
          className="p-1.5 rounded-lg hover:bg-surface active:scale-95 transition-all"
          title="Copy"
        >
          <span
            className="material-symbols-outlined text-text-muted"
            style={{ fontSize: '18px' }}
          >
            {copied ? 'check' : 'content_copy'}
          </span>
        </button>
      </div>

      {/* Warning */}
      <p className="text-xs text-text-secondary text-center">{t.wallet.dontShareCode}</p>
    </div>
  );
}
