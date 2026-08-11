import { createPortal } from 'react-dom';
import { X } from 'lucide-react';
import { useLanguage } from '../../i18n/LanguageContext';
import type { Voucher } from '../../types/voucher.types';

interface VoucherTermsSheetProps {
  voucher: Voucher;
  onClose: () => void;
}

/**
 * "All terms" sheet for a sub-balance row — the same voucher card face
 * rendered large and centered (brand color / logo, or full-bleed art when
 * the voucher has one), with its full terms text underneath.
 */
export default function VoucherTermsSheet({ voucher, onClose }: VoucherTermsSheetProps) {
  const { isRTL } = useLanguage();
  const bg = voucher.brandColor || '#0a2540';

  return createPortal(
    <>
      <div className="fixed inset-0 z-[60] bg-black/40 animate-fade-in" onClick={onClose} />
      <div className="fixed inset-x-0 bottom-0 z-[60] max-w-md mx-auto px-4 pb-6 pointer-events-none">
        <div
          className="relative pointer-events-auto bg-white rounded-[28px] shadow-2xl overflow-hidden animate-slide-up"
          dir={isRTL ? 'rtl' : 'ltr'}
        >
          <div className="flex justify-center pt-3 pb-2">
            <div className="w-10 h-1.5 bg-border rounded-full" />
          </div>

          <button
            onClick={onClose}
            className="absolute top-4 end-4 h-8 w-8 inline-flex items-center justify-center rounded-full bg-surface active:bg-border transition-colors"
          >
            <X size={18} className="text-text-primary" />
          </button>

          <div className="px-6 pb-8 pt-2">
            {/* Large centered card face */}
            <div className="mx-auto mb-5" style={{ maxWidth: 260 }}>
              <div
                className="relative w-full rounded-xl shadow-xl overflow-hidden"
                style={{ aspectRatio: '1.586 / 1', backgroundColor: bg }}
              >
                {voucher.cardImage ? (
                  <img
                    src={voucher.cardImage}
                    alt={voucher.merchantName}
                    className="absolute inset-0 w-full h-full object-cover"
                    style={{ objectPosition: voucher.cardImagePosition || 'center' }}
                  />
                ) : voucher.brandLogo ? (
                  <div className="absolute inset-0 flex items-center justify-center px-6">
                    <img
                      src={voucher.brandLogo}
                      alt={voucher.merchantName}
                      className="h-16 w-auto max-w-[64%] object-contain"
                    />
                  </div>
                ) : (
                  <div className="absolute inset-0 flex items-center justify-center px-6">
                    <span className="text-xl font-extrabold text-white text-center leading-tight">
                      {voucher.merchantName}
                    </span>
                  </div>
                )}
              </div>
            </div>

            <h3 className="text-lg font-bold text-text-primary text-center mb-3">
              {voucher.merchantName}
            </h3>
            <p className="text-sm text-text-secondary leading-relaxed text-center">
              {isRTL ? voucher.termsAndConditionsHe : voucher.termsAndConditions}
            </p>
          </div>
        </div>
      </div>
    </>,
    document.body,
  );
}
