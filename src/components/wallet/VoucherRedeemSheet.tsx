import { X, Copy, Check } from 'lucide-react';
import { useState } from 'react';
import { useLanguage } from '../../i18n/LanguageContext';
import type { UserVoucher } from '../../types/voucher.types';

interface VoucherRedeemSheetProps {
  userVoucher: UserVoucher;
  onClose: () => void;
}

export default function VoucherRedeemSheet({ userVoucher, onClose }: VoucherRedeemSheetProps) {
  const { t, language } = useLanguage();
  const [copied, setCopied] = useState(false);

  const copyCode = async () => {
    try {
      await navigator.clipboard.writeText(userVoucher.redemptionCode);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // Fallback
    }
  };

  return (
    <>
      <div className="bottom-sheet-overlay" onClick={onClose} />
      <div className="fixed bottom-0 left-0 right-0 max-w-md mx-auto z-50 bg-white rounded-t-3xl animate-slide-up">
        <div className="flex justify-center pt-3 pb-2">
          <div className="w-10 h-1 bg-border rounded-full" />
        </div>

        <button onClick={onClose} className="absolute top-4 end-4 p-2 rounded-full hover:bg-border/50">
          <X size={20} className="text-text-secondary" />
        </button>

        <div className="px-6 pb-8 text-center">
          {/* Merchant info */}
          <div className="w-20 h-20 bg-surface rounded-2xl flex items-center justify-center text-4xl mx-auto mb-3">
            {userVoucher.voucher.image}
          </div>
          <h3 className="text-lg font-bold text-text-primary mb-1">
            {language === 'he' ? userVoucher.voucher.titleHe : userVoucher.voucher.title}
          </h3>
          <p className="text-sm text-text-secondary mb-6">{userVoucher.voucher.merchantName}</p>

          {/* QR Code */}
          <div className="bg-surface rounded-2xl p-6 mb-4">
            <img
              src={userVoucher.qrCode}
              alt="QR Code"
              className="w-48 h-48 mx-auto mb-4 rounded-lg"
            />
          </div>

          {/* Redemption Code */}
          <p className="text-xs text-text-secondary mb-2">{t.wallet.redemptionCode}</p>
          <button
            onClick={copyCode}
            className="inline-flex items-center gap-2 bg-surface px-6 py-3 rounded-xl hover:bg-border transition-colors"
          >
            <span className="text-lg font-mono font-bold tracking-widest text-text-primary">
              {userVoucher.redemptionCode}
            </span>
            {copied ? (
              <Check size={18} className="text-success" />
            ) : (
              <Copy size={18} className="text-text-secondary" />
            )}
          </button>
        </div>
      </div>
    </>
  );
}
