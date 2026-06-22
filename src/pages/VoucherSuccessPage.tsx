import { useRef } from 'react';
import { useNavigate, useParams, useLocation } from 'react-router-dom';
import { useLanguage } from '../i18n/LanguageContext';
import { usePaymentMethods } from '../hooks/usePaymentMethods';
import PaymentBrandMark from '../components/wallet/PaymentBrandMark';
import TransactionSuccessShell from '../components/ui/TransactionSuccessShell';

export interface VoucherSuccessState {
  /** Face value of the voucher */
  voucherValue: number;
  /** What was actually charged */
  amountPaid?: number;
  cashback?: number;
  merchantName?: string;
  merchantNameHe?: string;
  merchantLogo?: string;
  /** Brand background colour for the voucher card, hex. Defaults to dark navy. */
  brandColor?: string;
  /** Discount percent shown on the card face */
  discountPercent?: number;
  tier?: string;
  paymentMethodId?: string;
  userVoucherId?: string;
  returnTo?: string;
}

export default function VoucherSuccessPage() {
  const { lang = 'he' } = useParams();
  const navigate = useNavigate();
  const location = useLocation();
  const { language } = useLanguage();
  const isHe = language === 'he';

  const state = (location.state as VoucherSuccessState | null) ?? { voucherValue: 150 };
  const {
    voucherValue = 150,
    amountPaid = voucherValue,
    cashback = Math.round(amountPaid * 0.05 * 100) / 100,
    merchantName,
    merchantNameHe,
    merchantLogo,
    brandColor = '#0a2540',
    discountPercent,
    tier,
    paymentMethodId,
    userVoucherId,
  } = state;

  const { data: paymentMethods } = usePaymentMethods();
  const payMethod = paymentMethods.find((m) => m.id === paymentMethodId) ?? paymentMethods[0];

  const confirmId = useRef(`NX-${new Date().getFullYear()}-${Math.floor(10000 + Math.random() * 90000)}`);
  const now = useRef(new Date());

  const timeStr = now.current.toLocaleTimeString(isHe ? 'he-IL' : 'en-IL', { hour: '2-digit', minute: '2-digit' });
  const dateStr = now.current.toLocaleDateString(isHe ? 'he-IL' : 'en-IL', { day: '2-digit', month: '2-digit', year: '2-digit' });

  const displayMerchant = isHe ? (merchantNameHe ?? merchantName) : merchantName;

  // Perceived-luminance — pick readable ink on the brand colour
  function isDark(hex: string) {
    const c = hex.replace('#', '');
    if (c.length < 6) return true;
    const r = parseInt(c.slice(0, 2), 16);
    const g = parseInt(c.slice(2, 4), 16);
    const b = parseInt(c.slice(4, 6), 16);
    return (r * 299 + g * 587 + b * 114) / 1000 < 140;
  }
  const dark = isDark(brandColor);
  const ink = dark ? '#ffffff' : '#0a2540';

  const voucherCard = (
    <div
      className="relative w-full rounded-2xl shadow-lg overflow-hidden p-5"
      style={{ aspectRatio: '1.586 / 1', backgroundColor: brandColor }}
    >
      {/* Nexus mark — top-left */}
      <img
        src="/nexus-white-wide-logo.png"
        alt="Nexus"
        draggable={false}
        className="absolute left-4 top-4 h-9 w-auto opacity-90 pointer-events-none"
        style={{ filter: dark ? undefined : 'brightness(0)' }}
      />

      {/* Brand logo centred */}
      <div className="absolute inset-0 flex items-center justify-center px-6">
        {merchantLogo ? (
          <img
            src={merchantLogo}
            alt={displayMerchant ?? ''}
            className="h-20 w-auto max-w-[64%] object-contain"
            draggable={false}
          />
        ) : (
          <span className="text-2xl font-extrabold text-center leading-tight" style={{ color: ink }}>
            {displayMerchant}
          </span>
        )}
      </div>

      {/* Discount pill — bottom-left */}
      {discountPercent ? (
        <span
          className="absolute bottom-4 left-4 text-[11px] font-bold px-2 py-0.5 rounded-full"
          style={{ backgroundColor: 'rgba(255,255,255,0.18)', color: ink }}
        >
          {`-${discountPercent}%`}
        </span>
      ) : null}

      {/* Voucher value — bottom-right */}
      <div className="absolute bottom-4 right-4 text-right leading-none">
        <span className="block text-[11px] font-medium mb-1" style={{ color: ink, opacity: 0.7 }}>
          {isHe ? 'יתרה' : 'Balance'}
        </span>
        <span className="font-bold text-4xl tabular-nums" style={{ color: ink }}>
          <span className="text-[0.6em] font-semibold">₪</span>{voucherValue}
        </span>
      </div>
    </div>
  );

  const handleClose = () => {
    if (cashback > 0) {
      try {
        sessionStorage.setItem('nexus_pending_wallet_anim', JSON.stringify({
          cashback,
          targetCardId: userVoucherId ? `voucher:${userVoucherId}` : null,
        }));
        // Persistent upsell payload — a NEW purchase overwrites the previous one;
        // the wallet shows it until this expiry passes.
        localStorage.setItem('nexus_premium_upsell', JSON.stringify({
          cashback,
          total: amountPaid,
          productName: displayMerchant,
          businessName: displayMerchant,
          businessLogo: merchantLogo ?? null,
          cardColor: brandColor,
          targetCardId: userVoucherId ? `voucher:${userVoucherId}` : null,
          expiresAt: Date.now() + 300_000,
        }));
      } catch {}
    }
    navigate(`/${lang}/wallet`, {
      replace: true,
      state: userVoucherId ? { centerVoucherId: userVoucherId } : undefined,
    });
  };

  return (
    <TransactionSuccessShell
      isHe={isHe}
      cashback={cashback}
      previewSlot={voucherCard}
      onClose={handleClose}
    >
      {/* Header */}
      <div className="px-5 pt-5 pb-4 text-center">
        {displayMerchant && (
          <p className="text-sm text-text-secondary font-medium mb-1">{displayMerchant}</p>
        )}
        <p className="text-[44px] font-bold text-text-primary leading-tight" dir="ltr">
          ₪{voucherValue}
        </p>
        <p className="text-sm text-text-muted mt-0.5">
          {isHe ? `שולם ₪${amountPaid}` : `Paid ₪${amountPaid}`}
        </p>
        <span className="inline-block mt-2 text-[12px] font-semibold text-green-700 bg-green-50 px-3 py-1 rounded-full">
          {isHe ? 'וואוצר פעיל' : 'Voucher active'}
        </span>
      </div>

      <div className="mx-5 border-t border-border/60" />

      {/* Detail rows */}
      <div className="px-5 py-4 space-y-3" dir={isHe ? 'rtl' : 'ltr'}>
        {[
          tier    ? { label: isHe ? 'רמה'         : 'Tier',   value: tier,          green: false } : null,
          cashback > 0 ? { label: isHe ? 'קאשבק' : 'Cashback', value: `₪${cashback}`, green: true } : null,
          { label: isHe ? 'תאריך'      : 'Date',  value: dateStr,                   green: false },
          { label: isHe ? 'שעה'        : 'Time',  value: timeStr,                   green: false },
          { label: isHe ? 'מספר אישור' : 'Ref',   value: confirmId.current,         green: false },
        ].filter((r): r is { label: string; value: string; green: boolean } => r !== null).map(({ label, value, green }) => (
          <div key={label} className="flex items-center justify-between text-[14px]">
            <span className="text-text-secondary">{label}</span>
            <span className={`font-medium ${green ? 'text-green-600' : 'text-text-primary'}`} dir="ltr">
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
