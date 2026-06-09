import { useState } from 'react';
import { CheckCircle2 } from 'lucide-react';
import { useLanguage } from '../../i18n/LanguageContext';
import { useAuthGate } from '../../hooks/useAuthGate';
import { usePurchaseVoucher } from '../../hooks/useVouchers';
import { formatCurrency } from '../../utils/formatCurrency';
import Button from '../ui/Button';
import type { Voucher } from '../../types/voucher.types';

interface PurchaseSheetProps {
  voucher: Voucher;
  onClose: () => void;
  onCancel: () => void;
}

export default function PurchaseSheet({ voucher, onClose, onCancel }: PurchaseSheetProps) {
  const { t, language } = useLanguage();
  const locale = language === 'he' ? 'he-IL' : 'en-IL';
  const { isAuthenticated } = useAuthGate();
  const purchaseMutation = usePurchaseVoucher();
  const [success, setSuccess] = useState(false);

  // Safety: should never render for anonymous users
  if (!isAuthenticated) return null;

  const handlePurchase = async () => {
    try {
      await purchaseMutation.mutateAsync(voucher.id);
      setSuccess(true);
    } catch {
      // Handle error
    }
  };

  return (
    <>
      <div className="bottom-sheet-overlay" style={{ zIndex: 60 }} onClick={onCancel} />
      <div className="fixed bottom-0 left-0 right-0 max-w-md mx-auto z-[70] bg-white rounded-t-3xl animate-slide-up">
        <div className="flex justify-center pt-3 pb-2">
          <div className="w-10 h-1 bg-border rounded-full" />
        </div>

        <div className="px-6 pb-8">
          {success ? (
            <div className="text-center py-8">
              <CheckCircle2 size={64} className="mx-auto text-success mb-4" />
              <h3 className="text-xl font-bold text-text-primary mb-2">{t.store.purchaseSuccess}</h3>
              <p className="text-sm text-text-secondary mb-6">
                {language === 'he' ? voucher.titleHe : voucher.title}
              </p>
              <Button fullWidth onClick={onClose}>{t.common.confirm}</Button>
            </div>
          ) : (
            <>
              <h3 className="text-lg font-bold text-text-primary text-center mb-4">
                {t.store.confirmPurchase}
              </h3>

              <div className="flex items-center gap-4 bg-surface rounded-2xl p-4 mb-6">
                <div className="w-14 h-14 bg-white rounded-xl flex items-center justify-center text-3xl flex-shrink-0">
                  {voucher.image}
                </div>
                <div className="flex-1">
                  <h4 className="text-sm font-semibold text-text-primary">
                    {language === 'he' ? voucher.titleHe : voucher.title}
                  </h4>
                  <p className="text-xs text-text-secondary">{voucher.merchantName}</p>
                </div>
                <p className="text-lg font-bold text-primary flex-shrink-0">
                  {formatCurrency(voucher.discountedPrice, 'ILS', locale)}
                </p>
              </div>

              <div className="flex gap-3">
                <Button variant="outline" fullWidth onClick={onCancel}>
                  {t.common.cancel}
                </Button>
                <Button
                  fullWidth
                  onClick={handlePurchase}
                  disabled={purchaseMutation.isPending}
                >
                  {purchaseMutation.isPending ? t.common.loading : t.store.buyNow}
                </Button>
              </div>
            </>
          )}
        </div>
      </div>
    </>
  );
}
