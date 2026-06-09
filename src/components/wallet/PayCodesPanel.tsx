import { useState } from 'react';
import { useParams } from 'react-router-dom';
import { useLanguage } from '../../i18n/LanguageContext';
import PayCodeInfoSheet from './PayCodeInfoSheet';

/** Mock payment code (default — vouchers pass their own redemption code) */
const PAYMENT_CODE = 'NXS-7526-4821';

interface PayCodesPanelProps {
  compact?: boolean;
  /** Code shown + copied (defaults to the balance pay code). */
  code?: string;
  /** QR image source (defaults to the balance QR). */
  qrSrc?: string;
  /** Corner radius class for the compact card (so vouchers can be less round). */
  roundedClass?: string;
  /**
   * Fixed promotion-stacking state. When provided (vouchers), it's a GIVEN
   * fact of the voucher — rendered as a static label, NOT an interactive
   * toggle. When omitted (the balance pay code), the user can toggle it.
   */
  stacking?: boolean;
  /** Hide the "pay in store…" title (full layout only). */
  hideTitle?: boolean;
  /** Use the grey section surface as the panel background (full layout). */
  surface?: boolean;
}

/**
 * Codes half of the in-store payment UI — title, QR, barcode and the
 * copyable code. Shared by the balance pay side and each voucher's
 * redemption side (via `code` / `qrSrc`).
 *
 * `compact` is the wallet-deck flip-side layout: no inner code rectangle,
 * the info button tucked into the card's bottom-left corner, and tighter
 * sizing so it fits a card-sized box. The full layout (used on the
 * balance-detail page) is unchanged.
 */
export default function PayCodesPanel({
  compact = false,
  code = PAYMENT_CODE,
  qrSrc = '/qr-code.png',
  roundedClass = 'rounded-[22px]',
  stacking,
  hideTitle = false,
  surface = false,
}: PayCodesPanelProps) {
  const { t } = useLanguage();
  const { lang = 'he' } = useParams();
  const [copied, setCopied] = useState(false);
  // Which code the user is currently viewing — barcode (default) or the
  // QR. Toggled via the segmented switcher below the title.
  const [codeView, setCodeView] = useState<'qr' | 'barcode'>('barcode');
  // Help tooltip — explains how to use the code at the till.
  const [showHelp, setShowHelp] = useState(false);
  // Whether this payment stacks promotions ("כפל מבצעים").
  // For vouchers it's a fixed given (`stacking` prop) shown as a label;
  // for the balance pay code it's a user-toggleable state.
  const stackingFixed = stacking !== undefined;
  const [includesStackingState, setIncludesStacking] = useState(true);
  const includesStacking = stackingFixed ? (stacking as boolean) : includesStackingState;

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(code);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      const textarea = document.createElement('textarea');
      textarea.value = code;
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
      <img src={qrSrc} alt="QR Code" width={px} height={px} style={{ display: 'block' }} />
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
        className={`relative h-full overflow-hidden bg-white ${roundedClass} border border-border shadow-[0_8px_30px_rgb(0,0,0,0.06)] px-3 pt-12 pb-12 flex flex-col`}
        dir={lang === 'he' ? 'rtl' : 'ltr'}
      >
        {/* Switcher — top-right corner */}
        <div className="absolute top-3 right-3 z-20">{switcher('sm')}</div>

        {/* Code + text inside a soft grey layout box stretched full-width */}
        <div className="flex-1 flex items-center justify-center min-h-0">
          <div className="w-full max-w-full overflow-hidden bg-surface rounded-2xl px-4 py-4 flex flex-col items-center gap-2.5">
            {/* Stacking state label — above the barcode. Only the balance
                pay code shows it here (it's toggleable); for vouchers the
                fact lives on the card front, so it's omitted on the back. */}
            {!stackingFixed && (
              <span className="text-xs font-bold text-text-primary text-center">
                {includesStacking ? t.wallet.includesStacking : t.wallet.excludesStacking}
              </span>
            )}
            {codeView === 'qr' ? qr(132, 'w-9 h-9') : (
              <img src="/barcode.png" alt="Barcode" className="w-full max-w-[220px] h-auto" />
            )}
            <div className="flex items-center justify-center gap-2 max-w-full">
              <p className="text-lg font-bold text-text-primary tracking-[0.12em] truncate">{code}</p>
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

        {/* Stacking toggle — bottom-right corner. Only the balance pay code
            is toggleable; for vouchers the stacking fact is fixed and shown
            as the static label above the barcode instead. */}
        {!stackingFixed && (
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
        )}

        <PayCodeInfoSheet isOpen={showHelp} onClose={() => setShowHelp(false)} />
      </div>
    );
  }

  // ── Full layout (balance-detail page) ──
  return (
    <div
      className={`${
        surface
          ? 'bg-surface rounded-2xl border border-border'
          : 'bg-white rounded-3xl border border-border shadow-[0_8px_30px_rgb(0,0,0,0.06)]'
      } px-6 pb-6 pt-4`}
      dir={lang === 'he' ? 'rtl' : 'ltr'}
    >
      {/* Title */}
      {!hideTitle && (
        <h2 className="text-lg font-bold text-text-primary text-center mb-3">
          {t.wallet.payInStoreTitle}
        </h2>
      )}

      {/* Stacking fact — fixed per voucher, shown as a labelled chip */}
      {stackingFixed && (
        <div className="flex justify-center mb-3">
          <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full bg-surface text-xs font-bold text-text-secondary">
            <span className="material-symbols-rounded" style={{ fontSize: '16px' }}>
              {includesStacking ? 'check_circle' : 'do_not_disturb_on'}
            </span>
            {includesStacking ? t.wallet.includesStacking : t.wallet.excludesStacking}
          </span>
        </div>
      )}

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
        <p className="text-lg font-bold text-text-primary tracking-[0.2em]">{code}</p>
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
