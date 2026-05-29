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
      <h2 className="text-lg font-bold text-text-primary text-center mb-5">
        {t.wallet.payInStoreTitle}
      </h2>

      {/* QR Code — centered with badge */}
      <div className="rounded-2xl border border-border p-4 mb-4 flex items-center justify-center relative">
        <img src="/qr-code.png" alt="QR Code" width={180} height={180} style={{ display: 'block' }} />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-10 h-10 bg-white rounded-full flex items-center justify-center shadow-md overflow-hidden">
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
      <div className="flex items-center justify-center gap-2">
        <span className="material-symbols-outlined text-warning text-lg">warning</span>
        <p className="text-sm text-text-secondary">{t.wallet.dontShareCode}</p>
      </div>
    </div>
  );
}
