import { X } from 'lucide-react';
import { useLanguage } from '../../i18n/LanguageContext';
import { useAuthGate } from '../../hooks/useAuthGate';
import { formatDate } from '../../utils/formatDate';
import MaskedPrice from '../ui/MaskedPrice';
import Button from '../ui/Button';
import Badge from '../ui/Badge';
import PurchaseSheet from './PurchaseSheet';
import { useState } from 'react';
import type { Voucher } from '../../types/voucher.types';

interface VoucherDetailProps {
  voucher: Voucher;
  onClose: () => void;
}

export default function VoucherDetail({ voucher, onClose }: VoucherDetailProps) {
  const { t, language } = useLanguage();
  const locale = language === 'he' ? 'he-IL' : 'en-IL';
  const { isAuthenticated, requireAuth } = useAuthGate();
  const [showPurchase, setShowPurchase] = useState(false);

  const handleBuy = async () => {
    if (!isAuthenticated) {
      const authed = await requireAuth({ promptMessage: t.auth.eligibilityPrompt });
      if (!authed) return;
    }
    setShowPurchase(true);
  };

  return (
    <>
      {/* Overlay */}
      <div className="bottom-sheet-overlay" onClick={onClose} />

      {/* Bottom Sheet */}
      <div className="fixed bottom-0 left-0 right-0 max-w-md mx-auto z-50 bg-white rounded-t-3xl max-h-[85vh] overflow-y-auto animate-slide-up">
        {/* Handle bar */}
        <div className="flex justify-center pt-3 pb-2">
          <div className="w-10 h-1 bg-border rounded-full" />
        </div>

        {/* Close button */}
        <button onClick={onClose} className="absolute top-4 end-4 p-2 rounded-full hover:bg-border/50 transition-colors">
          <X size={20} className="text-text-secondary" />
        </button>

        {/* Content */}
        <div className="px-6 pb-8">
          {/* Hero */}
          <div className="flex flex-col items-center mb-6">
            <div className="w-24 h-24 bg-surface rounded-2xl flex items-center justify-center text-5xl mb-4">
              {voucher.image}
            </div>
            <p className="text-sm text-text-secondary">{voucher.merchantName}</p>
            <h2 className="text-xl font-bold text-text-primary text-center mt-1">
              {language === 'he' ? voucher.titleHe : voucher.title}
            </h2>
          </div>

          {/* Badges */}
          <div className="flex gap-2 justify-center mb-4">
            <Badge variant="emerald" size="md">{voucher.discountPercent}% {t.store.discount}</Badge>
            {voucher.popular && <Badge variant="purple" size="md">🔥 {t.store.popular}</Badge>}
          </div>

          {/* Description */}
          <p className="text-sm text-text-secondary text-center mb-6">
            {language === 'he' ? voucher.descriptionHe : voucher.description}
          </p>

          {/* Price section */}
          <div className="bg-surface rounded-2xl p-4 mb-4">
            <div className="flex justify-between items-center mb-2">
              <span className="text-sm text-text-secondary">{t.store.originalPrice}</span>
              <MaskedPrice
                amount={voucher.originalPrice}
                className="text-sm text-text-muted line-through"
              />
            </div>
            <div className="flex justify-between items-center">
              <span className="text-sm font-semibold text-text-primary">{t.store.price}</span>
              <MaskedPrice
                amount={voucher.discountedPrice}
                className="text-xl font-bold text-primary"
                authPrompt={t.auth.memberPricePrompt}
              />
            </div>
          </div>

          {/* Valid until */}
          <p className="text-xs text-text-secondary text-center mb-2">
            {t.store.validUntil}: {formatDate(voucher.validUntil, locale)}
          </p>

          {/* Terms */}
          <details className="mb-6">
            <summary className="text-xs text-text-secondary cursor-pointer hover:text-text-primary transition-colors">
              {t.store.termsAndConditions}
            </summary>
            <p className="text-xs text-text-secondary mt-2 ps-4">
              {language === 'he' ? voucher.termsAndConditionsHe : voucher.termsAndConditions}
            </p>
          </details>

          {/* Buy / Check eligibility button */}
          <Button
            fullWidth
            size="lg"
            disabled={!voucher.inStock}
            onClick={handleBuy}
          >
            {!voucher.inStock
              ? t.store.outOfStock
              : isAuthenticated
                ? t.store.buyNow
                : t.auth.checkEligibility}
          </Button>
        </div>
      </div>

      {showPurchase && (
        <PurchaseSheet
          voucher={voucher}
          onClose={() => { setShowPurchase(false); onClose(); }}
          onCancel={() => setShowPurchase(false)}
        />
      )}
    </>
  );
}
