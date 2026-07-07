import { useRef } from 'react';
import { useNavigate, useParams, useLocation } from 'react-router-dom';
import { useLanguage } from '../i18n/LanguageContext';
import { usePaymentMethods } from '../hooks/usePaymentMethods';
import PaymentBrandMark from '../components/wallet/PaymentBrandMark';
import TransactionSuccessShell from '../components/ui/TransactionSuccessShell';

export interface StorePaymentSuccessState {
  amount: number;
  cashback?: number;
  merchantName?: string;
  merchantNameHe?: string;
  merchantLogo?: string;
  productName?: string;
  productNameHe?: string;
  paymentMethodId?: string;
  returnTo?: string;
  /** Passed as-is to the returnTo route (e.g. order confirmation needs qty/address). */
  returnToState?: Record<string, unknown>;
}

export default function StorePaymentSuccessPage() {
  const { lang = 'he' } = useParams();
  const navigate = useNavigate();
  const location = useLocation();
  const { language } = useLanguage();
  const isHe = language === 'he';

  const state = (location.state as StorePaymentSuccessState | null) ?? { amount: 150 };
  const {
    amount = 150,
    cashback = Math.round(amount * 0.05 * 100) / 100,
    merchantName,
    merchantNameHe,
    merchantLogo,
    productName,
    productNameHe,
    paymentMethodId,
    returnTo,
    returnToState,
  } = state;

  const { data: paymentMethods } = usePaymentMethods();
  const payMethod = paymentMethods.find((m) => m.id === paymentMethodId) ?? paymentMethods[0];

  const confirmId = useRef(`NX-${new Date().getFullYear()}-${Math.floor(10000 + Math.random() * 90000)}`);
  const now = useRef(new Date());

  const timeStr = now.current.toLocaleTimeString(isHe ? 'he-IL' : 'en-IL', { hour: '2-digit', minute: '2-digit' });
  const dateStr = now.current.toLocaleDateString(isHe ? 'he-IL' : 'en-IL', { day: '2-digit', month: '2-digit', year: '2-digit' });

  const displayMerchant = isHe ? (merchantNameHe ?? merchantName) : merchantName;
  const displayProduct  = isHe ? (productNameHe ?? productName)   : productName;

  const handleClose = () => navigate(returnTo ?? `/${lang}/store`, { replace: true, state: returnToState });

  return (
    <TransactionSuccessShell
      isHe={isHe}
      cashback={cashback}
      onClose={handleClose}
    >
      {/* Header */}
      <div className="px-5 pt-5 pb-4 text-center">
        {merchantLogo && (
          <div className="flex justify-center mb-3">
            <img src={merchantLogo} alt="" draggable={false} className="w-12 h-12 object-contain rounded-xl border border-border/60" />
          </div>
        )}
        {displayMerchant && (
          <p className="text-sm text-text-secondary font-medium mb-1">{displayMerchant}</p>
        )}
        <p className="text-[44px] font-bold text-text-primary leading-tight" dir="ltr">
          ₪{amount}
        </p>
        {displayProduct && (
          <p className="text-sm text-text-muted mt-1">{displayProduct}</p>
        )}
        <span className="inline-block mt-2 text-[12px] font-semibold text-green-700 bg-green-50 px-3 py-1 rounded-full">
          {isHe ? 'הזמנה אושרה' : 'Order confirmed'}
        </span>
      </div>

      <div className="mx-5 border-t border-border/60" />

      {/* Detail rows */}
      <div className="px-5 py-4 space-y-3" dir={isHe ? 'rtl' : 'ltr'}>
        {[
          { label: isHe ? 'סטטוס'     : 'Status', value: isHe ? 'הושלם' : 'Completed', green: true  },
          { label: isHe ? 'תאריך'      : 'Date',   value: dateStr,                      green: false },
          { label: isHe ? 'שעה'        : 'Time',   value: timeStr,                      green: false },
          { label: isHe ? 'מספר אישור' : 'Ref',    value: confirmId.current,            green: false },
        ].map(({ label, value, green }) => (
          <div key={label} className="flex items-center justify-between text-[14px]">
            <span className="text-text-secondary">{label}</span>
            <span className={`font-medium ${green ? 'text-green-600' : 'text-text-primary'}`} dir="ltr">
              {green && <span className="me-1">✓</span>}
              {value}
            </span>
          </div>
        ))}
      </div>

      {/* Payment method */}
      {payMethod && (
        <>
          <div className="mx-5 border-t border-border/60" />
          <div className="mx-5 my-4 bg-surface rounded-2xl p-4">
            <p className="text-[12px] font-semibold text-text-secondary mb-3 uppercase tracking-wide">
              {isHe ? 'אמצעי תשלום' : 'Payment method'}
            </p>
            <div className="flex items-center gap-3">
              <PaymentBrandMark brand={payMethod.brand} />
              <span className="text-text-secondary font-medium text-sm tracking-widest" dir="ltr">
                {payMethod.last4 ? `• • • •  ${payMethod.last4}` : (isHe ? payMethod.labelHe : payMethod.label)}
              </span>
            </div>
          </div>
        </>
      )}
    </TransactionSuccessShell>
  );
}
