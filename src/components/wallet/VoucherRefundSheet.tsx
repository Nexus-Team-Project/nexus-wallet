import { useState } from 'react';
import { createPortal } from 'react-dom';
import { X, CheckCircle2 } from 'lucide-react';
import { useNavigate, useParams } from 'react-router-dom';
import { useLanguage } from '../../i18n/LanguageContext';
import { useMarkVoucherUsed, useRequestVoucherRefund } from '../../hooks/useVouchers';
import { isVoucherRefundEligible, VOUCHER_REFUND_WINDOW_DAYS } from '../../mock/handlers/vouchers.handler';
import { formatCurrency } from '../../utils/formatCurrency';
import Button from '../ui/Button';
import type { UserVoucher } from '../../types/voucher.types';

const TERMS_URL = 'https://www.nexuswallet.info/terms';

interface VoucherRefundSheetProps {
  userVoucher: UserVoucher;
  onClose: () => void;
}

type Step = 'entry' | 'confirm' | 'done-refund' | 'done-used';

export default function VoucherRefundSheet({ userVoucher, onClose }: VoucherRefundSheetProps) {
  const { lang = 'he' } = useParams();
  const navigate = useNavigate();
  const { t, isRTL } = useLanguage();
  const [step, setStep] = useState<Step>('entry');
  const markUsed = useMarkVoucherUsed();
  const requestRefund = useRequestVoucherRefund();

  const eligible = isVoucherRefundEligible(userVoucher);
  const amountLabel = formatCurrency(userVoucher.voucher.discountedPrice, userVoucher.voucher.currency);

  const handleMarkUsed = () => {
    markUsed.mutate(userVoucher.id, { onSuccess: () => setStep('done-used') });
  };

  const handleConfirmRefund = () => {
    requestRefund.mutate(userVoucher.id, { onSuccess: () => setStep('done-refund') });
  };

  const closeAndReturnToWallet = () => {
    onClose();
    navigate(`/${lang}/wallet`);
  };

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

        <button onClick={onClose} className="absolute top-4 end-4 h-8 w-8 inline-flex items-center justify-center rounded-full bg-surface active:bg-border transition-colors">
          <X size={18} className="text-text-primary" />
        </button>

        <div className="px-6 pb-8">
          {/* ========== ENTRY — branches on the 14-day window ========== */}
          {step === 'entry' && !eligible && (
            <div className="pt-2 text-center animate-fade-in">
              <span
                className="material-symbols-outlined text-text-muted mb-3 inline-block"
                style={{ fontSize: '40px' }}
              >
                schedule
              </span>
              <h3 className="text-lg font-bold text-text-primary mb-2">
                {isRTL ? 'לא ניתן לזכות שובר זה' : 'This voucher can’t be credited'}
              </h3>
              <p className="text-sm text-text-secondary leading-relaxed mb-6">
                {isRTL
                  ? `לצערנו לא ניתן לזכות שובר לאחר ${VOUCHER_REFUND_WINDOW_DAYS} ימים מיום יצירתו. אבל הוא נשמר לך פה תמיד לכל רכישה עתידית. ללא קשר, תמיד אפשר לצבור קאשבק על שוברים נוספים.`
                  : `Unfortunately a voucher can’t be credited more than ${VOUCHER_REFUND_WINDOW_DAYS} days after it was created. It’s still yours here for any future purchase — and you can always earn cashback on more vouchers.`}
              </p>
              <div className="space-y-2.5">
                <Button
                  variant="outline"
                  fullWidth
                  size="lg"
                  onClick={() => window.open(TERMS_URL, '_blank', 'noopener,noreferrer')}
                >
                  {isRTL ? 'לתקנון המלא' : 'Full terms'}
                </Button>
                <Button variant="ghost" fullWidth onClick={onClose}>
                  {isRTL ? 'חזרה' : 'Back'}
                </Button>
              </div>
            </div>
          )}

          {step === 'entry' && eligible && (
            <div className="pt-2 text-center animate-fade-in">
              <span
                className="material-symbols-outlined text-bg-dark mb-3 inline-block"
                style={{ fontSize: '40px' }}
              >
                currency_exchange
              </span>
              <h3 className="text-lg font-bold text-text-primary mb-2">
                {isRTL ? 'זיכוי שובר' : 'Credit this voucher'}
              </h3>
              <p className="text-sm text-text-secondary leading-relaxed mb-6">
                {isRTL
                  ? `ניתן לזכות שובר עד ${VOUCHER_REFUND_WINDOW_DAYS} ימים מיום יצירתו ורק אם לא השתמשת בחלק ממנו או בכולו.`
                  : `You can credit a voucher up to ${VOUCHER_REFUND_WINDOW_DAYS} days from when it was created, only if you haven’t used any part of it.`}
              </p>
              <div className="space-y-2.5">
                <Button variant="secondary" fullWidth size="lg" onClick={() => setStep('confirm')}>
                  {isRTL ? 'לזכות' : 'Credit voucher'}
                </Button>
                <Button
                  variant="outline"
                  fullWidth
                  size="lg"
                  onClick={handleMarkUsed}
                  disabled={markUsed.isPending}
                >
                  {isRTL ? 'השתמשתי' : 'I already used it'}
                </Button>
              </div>
            </div>
          )}

          {/* ========== CONFIRM ========== */}
          {step === 'confirm' && (
            <div className="pt-2 animate-fade-in">
              <h3 className="text-lg font-bold text-text-primary mb-3">
                {isRTL ? 'בטוח? ' : 'Are you sure? '}
                <span className="font-normal text-text-secondary">
                  {isRTL ? 'מה קורה מפה:' : 'here’s what happens next:'}
                </span>
              </h3>

              <ol className="space-y-3 mb-6">
                {(isRTL
                  ? [
                      'בלחיצה על זיכוי נסיר את השובר מהארנק שלך.',
                      'אנחנו נבצע אימות שלא השתמשת בשובר.',
                      `במידה ולא, תקבל זיכוי של ${amountLabel} ליתרת הנקסוס שלך תוך שני ימי עסקים. את היתרה קיבלת כקאשבק במועד יצירת השובר.`,
                    ]
                  : [
                      'Tapping credit removes the voucher from your wallet.',
                      'We’ll verify that you haven’t used the voucher.',
                      `If you haven’t, you’ll receive a ${amountLabel} credit to your Nexus balance within two business days. That balance is the cashback you already received when the voucher was created.`,
                    ]
                ).map((line, i) => (
                  <li key={i} className="grid grid-cols-[20px_1fr] items-start gap-2.5 text-sm text-text-secondary leading-relaxed">
                    <span className="w-5 h-5 rounded-full bg-surface border border-border text-[11px] font-bold text-text-primary flex items-center justify-center">
                      {i + 1}
                    </span>
                    <span>{line}</span>
                  </li>
                ))}
              </ol>

              <div className="flex gap-3">
                <Button variant="outline" fullWidth size="lg" onClick={() => setStep('entry')}>
                  {t.common.cancel}
                </Button>
                <Button
                  variant="secondary"
                  fullWidth
                  size="lg"
                  onClick={handleConfirmRefund}
                  disabled={requestRefund.isPending}
                >
                  {requestRefund.isPending ? t.common.loading : isRTL ? 'לזכות' : 'Credit'}
                </Button>
              </div>
            </div>
          )}

          {/* ========== DONE — refund requested ========== */}
          {step === 'done-refund' && (
            <div className="text-center py-8 animate-fade-in">
              <CheckCircle2 size={64} className="mx-auto text-success mb-4" />
              <h3 className="text-xl font-bold text-text-primary mb-2">
                {isRTL ? 'הבקשה נשלחה' : 'Request submitted'}
              </h3>
              <p className="text-sm text-text-secondary leading-relaxed mb-6">
                {isRTL
                  ? 'הסרנו את השובר מהארנק שלך. נעדכן אותך בהתראה כשהזיכוי יאושר ליתרת הנקסוס שלך.'
                  : 'We’ve removed the voucher from your wallet. We’ll notify you once the credit to your Nexus balance is approved.'}
              </p>
              <Button variant="secondary" fullWidth size="lg" onClick={closeAndReturnToWallet}>
                {isRTL ? 'סגור' : 'Close'}
              </Button>
            </div>
          )}

          {/* ========== DONE — self-reported used ========== */}
          {step === 'done-used' && (
            <div className="text-center py-8 animate-fade-in">
              <span
                className="material-symbols-outlined text-text-muted mb-4 inline-block"
                style={{ fontSize: '56px' }}
              >
                info
              </span>
              <h3 className="text-xl font-bold text-text-primary mb-2">
                {isRTL ? 'עודכן' : 'Got it'}
              </h3>
              <p className="text-sm text-text-secondary leading-relaxed mb-6">
                {isRTL
                  ? 'סימנו את השובר כמומש. לא ניתן לזכות שובר שכבר נעשה בו שימוש.'
                  : 'We’ve marked the voucher as used. A used voucher can’t be credited.'}
              </p>
              <Button variant="secondary" fullWidth size="lg" onClick={onClose}>
                {isRTL ? 'סגור' : 'Close'}
              </Button>
            </div>
          )}
        </div>
      </div>
      </div>
    </>,
    document.body,
  );
}
