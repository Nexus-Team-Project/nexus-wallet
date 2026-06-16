import { useLanguage } from '../../i18n/LanguageContext';

/**
 * The Google Pay lockup: the multicolour Google "G" followed by "Pay".
 * On the white button "Pay" reads in Google's grey (#5F6368) per the
 * light-button brand treatment.
 */
function GooglePayLogo() {
  return (
    <span className="inline-flex items-center gap-1" dir="ltr" aria-label="Google Pay">
      <svg width="20" height="20" viewBox="0 0 24 24" aria-hidden="true">
        <path
          fill="#4285F4"
          d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 0 1-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z"
        />
        <path
          fill="#34A853"
          d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
        />
        <path
          fill="#FBBC05"
          d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
        />
        <path
          fill="#EA4335"
          d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
        />
      </svg>
      <span className="text-[#5f6368] font-semibold text-[15px] tracking-tight">Pay</span>
    </span>
  );
}

interface WalletCardActionsProps {
  /** Extra classes for the wrapping column (e.g. top margin). */
  className?: string;
  /** Fired when the user taps "Transfer value to my balance". */
  onTransfer?: () => void;
  /** Fired when the user taps "Add to Google Pay". */
  onAddToGooglePay?: () => void;
  /** Renders the transfer-to-balance button display-only (non-interactive),
   *  e.g. in the gift demo flow. */
  transferDisabled?: boolean;
}

/**
 * The two primary card-page actions, shared by the digital-card and voucher
 * detail pages: move the card's value into the wallet balance, and add the
 * card to Google Pay (official dark-button lockup).
 */
export default function WalletCardActions({
  className = '',
  onTransfer,
  onAddToGooglePay,
  transferDisabled = false,
}: WalletCardActionsProps) {
  const { isRTL } = useLanguage();

  return (
    <div className={`space-y-2.5 ${className}`}>
      {/* Transfer the card's value into the wallet balance — primary action,
          styled like the business-page CTA: dark navy fill, white ink, with
          the Nexus mark sitting in a sky pill after the text. */}
      <button
        onClick={transferDisabled ? undefined : onTransfer}
        disabled={transferDisabled}
        className={`w-full flex items-center justify-center gap-2 py-3.5 rounded-2xl bg-bg-dark text-white text-sm font-bold transition-transform ${
          transferDisabled ? 'cursor-default' : 'active:scale-[0.98]'
        }`}
      >
        {isRTL ? 'העברת הערך ליתרה שלי' : 'Transfer value to my balance'}
        <span
          className="inline-flex items-center bg-sky-300 rounded-xl px-2.5 py-1 overflow-hidden"
          style={{ transform: 'scale(0.873)' }}
        >
          <img
            src="/nexus-logo-black.png"
            alt="Nexus"
            className="h-5 w-auto object-contain"
            style={{ transform: 'scale(1.373)' }}
            draggable={false}
          />
        </span>
      </button>

      {/* Add to Google Pay — official light button lockup. */}
      <button
        onClick={onAddToGooglePay}
        aria-label={isRTL ? 'הוספה ל-Google Pay' : 'Add to Google Pay'}
        className="w-full flex items-center justify-center gap-2 py-3 rounded-2xl bg-white border border-[#dadce0] active:scale-[0.98] transition-transform"
      >
        <span className="text-[#3c4043] text-sm font-medium">
          {isRTL ? 'הוספה ל־' : 'Add to'}
        </span>
        <GooglePayLogo />
      </button>
    </div>
  );
}
