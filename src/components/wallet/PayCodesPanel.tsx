import { useState } from 'react';
import { useParams } from 'react-router-dom';
import { useLanguage } from '../../i18n/LanguageContext';
import PayCodeInfoSheet from './PayCodeInfoSheet';

/** Mock payment code */
const PAYMENT_CODE = 'NXS-7526-4821';

/**
 * Codes half of the in-store payment UI — title, QR, barcode and the
 * copyable code.
 *
 * `compact` is the wallet-deck flip-side layout: no inner code rectangle,
 * the info button tucked into the card's bottom-left corner, and tighter
 * sizing so it fits a card-sized box. The full layout (used on the
 * balance-detail page) is unchanged.
 */
export default function PayCodesPanel({ compact = false }: { compact?: boolean }) {
  const { t } = useLanguage();
  const { lang = 'he' } = useParams();
  const [copied, setCopied] = useState(false);
  // Which code the user is currently viewing — barcode (default) or the
  // QR. Toggled via the segmented switcher below the title.
  const [codeView, setCodeView] = useState<'qr' | 'barcode'>('barcode');
  // Help tooltip — explains how to use the code at the till.
  const [showHelp, setShowHelp] = useState(false);
  // Whether this payment stacks promotions ("כפל מבצעים") — compact only.
  const [includesStacking, setIncludesStacking] = useState(true);

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

  // QR ↔ barcode segmented switcher — shared between both layouts.
  const switcher = (size: 'sm' | 'md') => {
    const b = size === 'sm' ? 'w-8 h-8' : 'w-8 h-8';
    const ic = size === 'sm' ? 19 : 18;
    return (
      <div
        role="group"
        aria-label={lang === 'he' ? 'בחר תצוגה' : 'View mode'}
        className="flex items-center bg-white shadow-md rounded-full p-0.5"
      >
        <button
          type="button"
          onClick={() => setCodeView('qr')}
          aria-pressed={codeView === 'qr'}
          aria-label={lang === 'he' ? 'הצג QR' : 'Show QR'}
          className={`${b} rounded-full flex items-center justify-center transition-colors active:scale-95 ${
            codeView === 'qr' ? 'bg-surface' : ''
          }`}
        >
          <span
            className={`material-symbols-outlined ${codeView === 'qr' ? 'text-text-primary' : 'text-text-muted'}`}
            style={{ fontSize: `${ic}px` }}
          >
            qr_code
          </span>
        </button>
        <button
          type="button"
          onClick={() => setCodeView('barcode')}
          aria-pressed={codeView === 'barcode'}
          aria-label={lang === 'he' ? 'הצג ברקוד' : 'Show barcode'}
          className={`${b} rounded-full flex items-center justify-center transition-colors active:scale-95 ${
            codeView === 'barcode' ? 'bg-surface' : ''
          }`}
        >
          <span
            className={`material-symbols-outlined ${codeView === 'barcode' ? 'text-text-primary' : 'text-text-muted'}`}
            style={{ fontSize: `${ic}px` }}
          >
            barcode
          </span>
        </button>
      </div>
    );
  };

  // QR glyph (with the centred Nexus badge) at a given pixel size.
  const qr = (px: number, badge: string) => (
    <div className="relative flex items-center justify-center">
      <img src="/qr-code.png" alt="QR Code" width={px} height={px} style={{ display: 'block' }} />
      <div
        className={`absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 bg-white rounded-full flex items-center justify-center shadow-md overflow-hidden ${badge}`}
      >
        <img src="/nexus-icon.png" alt="Nexus" className="w-full h-full rounded-full object-cover p-px" />
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
  );

  // ── Compact (wallet-deck flip side): no inner rectangle, info pinned to
  //    the card's bottom-left corner. ──
  if (compact) {
    return (
      <div
        className="relative h-full bg-white rounded-[22px] border border-border shadow-[0_8px_30px_rgb(0,0,0,0.06)] px-3 pt-12 pb-12 flex flex-col"
        dir={lang === 'he' ? 'rtl' : 'ltr'}
      >
        {/* Switcher — top-right corner */}
        <div className="absolute top-3 right-3 z-20">{switcher('sm')}</div>

        {/* Code + text inside a soft grey layout box stretched full-width */}
        <div className="flex-1 flex items-center justify-center min-h-0">
          <div className="w-full max-w-full overflow-hidden bg-surface rounded-2xl px-4 py-4 flex flex-col items-center gap-2.5">
            {/* Stacking state label — above the barcode */}
            <span className="text-xs font-bold text-text-primary text-center">
              {includesStacking ? t.wallet.includesStacking : t.wallet.excludesStacking}
            </span>
            {codeView === 'qr' ? qr(132, 'w-9 h-9') : (
              <img src="/barcode.png" alt="Barcode" className="w-full max-w-[220px] h-auto" />
            )}
            <div className="flex items-center justify-center gap-2 max-w-full">
              <p className="text-lg font-bold text-text-primary tracking-[0.12em] truncate">{PAYMENT_CODE}</p>
              <button
                onClick={handleCopy}
                className="p-2 rounded-lg hover:bg-white active:scale-95 transition-all"
                title="Copy"
              >
                <span className="material-symbols-outlined text-text-muted" style={{ fontSize: '20px' }}>
                  {copied ? 'check' : 'content_copy'}
                </span>
              </button>
            </div>
          </div>
        </div>

        {/* Help — bottom-left corner; opens the "how it works" sheet */}
        <button
          type="button"
          onClick={() => setShowHelp(true)}
          aria-label={t.wallet.moreInfo}
          className="absolute bottom-2 left-2 z-20 w-9 h-9 rounded-full bg-white shadow-md flex items-center justify-center transition-colors active:scale-95"
        >
          <span className="material-symbols-rounded text-text-muted" style={{ fontSize: '22px' }}>
            help
          </span>
        </button>

        {/* Stacking toggle — bottom-right corner */}
        <button
          type="button"
          onClick={() => setIncludesStacking((v) => !v)}
          aria-pressed={includesStacking}
          aria-label={includesStacking ? t.wallet.includesStacking : t.wallet.excludesStacking}
          className={`absolute bottom-2 right-2 z-20 w-12 h-7 rounded-full transition-colors ${
            includesStacking ? 'bg-text-secondary' : 'bg-border'
          }`}
        >
          <div
            className="absolute top-0.5 w-6 h-6 bg-white rounded-full shadow-sm transition-all"
            style={{ insetInlineStart: includesStacking ? '22px' : '2px' }}
          />
        </button>

        <PayCodeInfoSheet isOpen={showHelp} onClose={() => setShowHelp(false)} />
      </div>
    );
  }

  // ── Full layout (balance-detail page) ──
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
        <div className="absolute top-2 start-2 z-10">{switcher('md')}</div>

        {codeView === 'qr' && qr(126, 'w-9 h-9')}
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
        <p className="text-lg font-bold text-text-primary tracking-[0.2em]">{PAYMENT_CODE}</p>
        <button
          onClick={handleCopy}
          className="p-1.5 rounded-lg hover:bg-surface active:scale-95 transition-all"
          title="Copy"
        >
          <span className="material-symbols-outlined text-text-muted" style={{ fontSize: '18px' }}>
            {copied ? 'check' : 'content_copy'}
          </span>
        </button>
      </div>

      {/* Warning */}
      <p className="text-xs text-text-secondary text-center">{t.wallet.dontShareCode}</p>
    </div>
  );
}
