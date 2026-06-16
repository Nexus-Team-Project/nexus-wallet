import { useMemo } from 'react';
import { useParams, useLocation, useNavigate, Navigate } from 'react-router-dom';
import { mockBusinesses } from '../mock/data/businesses.mock';
import { brandBgColors, FULL_BLEED_LOGOS } from '../utils/brandColors';
import { formatDate } from '../utils/formatDate';
import { useLanguage } from '../i18n/LanguageContext';
import { useUser } from '../hooks/useUser';
import TopBar from '../components/layout/TopBar';
import FloatingActions from '../components/layout/FloatingActions';

interface ReceiptState {
  qty?: number;
  total?: number;
  shippingLabel?: string;
  address?: string;
  orderNumber?: string;
}

/**
 * ReceiptPage — the order receipt reached from the confirmation screen's
 * "View order receipt" button. Built from the Rhode receipt mockup in the
 * nexus design language: order header, line items, price breakdown, payment
 * method, cashback banner, shipping + email + store, and the standard bottom
 * toolbar. AppLayout suppresses its global chrome here.
 */
export default function ReceiptPage() {
  const { businessId, productId, lang = 'he' } = useParams();
  const navigate = useNavigate();
  const location = useLocation();
  const { language } = useLanguage();
  const { data: user } = useUser();
  const isHe = language === 'he';
  const locale = isHe ? 'he-IL' : 'en-IL';

  const business = useMemo(() => mockBusinesses.find((b) => b.id === businessId), [businessId]);
  const product = useMemo(
    () => business?.products?.find((p) => p.id === productId),
    [business, productId],
  );

  const state = (location.state as ReceiptState | null) ?? {};
  const fallbackOrder = useMemo(() => `${Math.floor(1000000 + Math.random() * 9000000)}`, []);

  if (!business || !product) return <Navigate to=".." replace />;

  const cur = product.currency;
  const brandName = isHe ? business.nameHe : business.name;
  const productName = isHe ? product.nameHe : product.name;
  const qty = Math.max(1, state.qty ?? 1);
  const fmt = (n: number) => `${cur}${n.toLocaleString()}`;
  const orderNumber = state.orderNumber ?? fallbackOrder;
  const today = formatDate(new Date(), locale);

  // Reconstruct a believable breakdown that adds up to the paid total.
  const subtotal = product.price * qty;
  const total = typeof state.total === 'number' ? state.total : subtotal;
  const extra = Math.max(0, total - subtotal);
  const shipping = Math.round(extra * 0.8);
  const tax = extra - shipping;
  const cashback = Math.max(1, Math.round(total * 0.01));

  // Share the receipt — native share sheet where available (mobile), with a
  // copy-link fallback on browsers without the Web Share API (desktop).
  const handleShare = async () => {
    const shareData = {
      title: isHe ? `קבלה — הזמנה #${orderNumber}` : `Receipt — Order #${orderNumber}`,
      text: isHe
        ? `הקבלה שלך מ${brandName} על סך ${fmt(total)}`
        : `Your ${brandName} receipt for ${fmt(total)}`,
      url: window.location.href,
    };
    try {
      if (navigator.share) {
        await navigator.share(shareData);
      } else if (navigator.clipboard) {
        await navigator.clipboard.writeText(shareData.url);
      }
    } catch {
      /* user dismissed the share sheet — no-op */
    }
  };

  const Row = ({ label, value, bold }: { label: string; value: string; bold?: boolean }) => (
    <div className={`flex justify-between items-center ${bold ? 'text-lg font-bold pt-4' : 'text-[15px]'}`}>
      <span className={bold ? '' : 'text-text-primary'}>{label}</span>
      <span className={bold ? '' : 'font-medium'} dir="ltr">{value}</span>
    </div>
  );

  return (
    <div className="relative min-h-dvh bg-white flex flex-col pb-28" dir={isHe ? 'rtl' : 'ltr'}>
      {/* Standard top strip — user icon / chat (support) / notifications */}
      <TopBar showBack />

      {/* Receipt title + share */}
      <header className="flex items-center justify-between px-5 pt-3 pb-1">
        <h1 className="text-xl font-bold text-text-primary">{isHe ? 'קבלה' : 'Receipt'}</h1>
        <button type="button" onClick={handleShare} aria-label={isHe ? 'שיתוף' : 'Share'} className="p-1 -m-1 active:opacity-60">
          <span className="material-symbols-rounded text-text-primary" style={{ fontSize: 24 }}>ios_share</span>
        </button>
      </header>

      {/* Order info + items + breakdown */}
      <section className="px-5 pt-2 pb-6">
        <h2 className="text-xl font-bold text-text-primary" dir="ltr">
          {isHe ? `הזמנה #${orderNumber}` : `Order #${orderNumber}`}
        </h2>
        <p className="text-text-muted text-sm mt-1">{today}</p>

        {/* Line item */}
        <div className="mt-7 flex items-center gap-4">
          <div className="w-20 h-20 bg-surface rounded-xl border border-border overflow-hidden flex items-center justify-center shrink-0">
            <img src={product.image} alt={productName} className="h-16 w-auto object-contain" />
          </div>
          <div className="flex-1 min-w-0">
            <p className="font-medium text-[15px] text-text-primary leading-snug">{productName}</p>
            {qty > 1 && <p className="text-xs text-text-muted mt-0.5">{isHe ? `כמות ${qty}` : `Qty ${qty}`}</p>}
          </div>
          <p className="font-medium text-[15px] text-text-primary shrink-0" dir="ltr">{fmt(subtotal)}</p>
        </div>

        {/* Breakdown */}
        <div className="mt-7 pt-6 border-t border-border space-y-3">
          <Row label={isHe ? 'סכום ביניים' : 'Subtotal'} value={fmt(subtotal)} />
          <Row label={isHe ? 'משלוח' : 'Shipping'} value={shipping > 0 ? fmt(shipping) : isHe ? 'חינם' : 'Free'} />
          <Row label={isHe ? 'מע״מ' : 'Tax'} value={fmt(tax)} />
          <Row label={isHe ? 'סה״כ' : 'Total'} value={fmt(total)} bold />
        </div>
      </section>

      {/* Thick divider */}
      <div className="h-3 bg-surface w-full border-y border-border" />

      {/* Payment & shipping */}
      <section className="px-5 py-8 flex-1 space-y-10">
        {/* Payment method */}
        <div>
          <h3 className="text-lg font-bold text-text-primary mb-5">{isHe ? 'אמצעי תשלום' : 'Payment method'}</h3>
          <div className="flex justify-between items-center mb-3">
            <span className="font-semibold text-[15px] text-text-primary">{isHe ? 'נקסוס' : 'Nexus'}</span>
            <span className="font-semibold text-[15px] text-text-primary" dir="ltr">{fmt(total)}</span>
          </div>
          <div className="flex items-center gap-3">
            <span className="border border-border rounded px-1.5 py-0.5 text-[10px] font-black italic text-primary">VISA</span>
            <span className="text-text-secondary text-sm tracking-widest" dir="ltr">···· ···· ···· 2907</span>
          </div>

          {/* Cashback banner */}
          <button
            type="button"
            onClick={() => navigate(`/${lang}/wallet`)}
            className="mt-7 w-full bg-emerald-50 rounded-2xl p-4 flex items-center justify-between active:opacity-80 transition-opacity"
          >
            <span className="flex items-center gap-3">
              <span className="w-7 h-7 rounded-full bg-emerald-500/15 flex items-center justify-center">
                <span className="material-symbols-rounded text-emerald-600" style={{ fontSize: 18, fontVariationSettings: "'FILL' 1" }}>savings</span>
              </span>
              <span className="text-emerald-700 font-semibold text-sm" dir="ltr">
                {isHe ? `צברת ${fmt(cashback)} קאשבק` : `You earned ${fmt(cashback)} cashback`}
              </span>
            </span>
            <span className="material-symbols-rounded text-emerald-600" style={{ fontSize: 20 }}>
              {isHe ? 'chevron_left' : 'chevron_right'}
            </span>
          </button>
        </div>

        {/* Shipping address */}
        <div>
          <h3 className="text-lg font-bold text-text-primary mb-3">{isHe ? 'כתובת למשלוח' : 'Shipping address'}</h3>
          <p className="text-[15px] leading-relaxed text-text-secondary">
            {state.address || (isHe ? 'איסוף עצמי מהסניף' : 'Pickup at store')}
          </p>
          {state.shippingLabel && <p className="text-[15px] text-text-muted mt-1">{state.shippingLabel}</p>}
        </div>

        {/* Email address */}
        <div>
          <h3 className="text-lg font-bold text-text-primary mb-3">{isHe ? 'כתובת מייל' : 'Email address'}</h3>
          <p className="text-[15px] text-text-secondary" dir="ltr">
            {user?.email ?? 'user@nexus.co.il'}
          </p>
        </div>

        {/* Store */}
        <div>
          <h3 className="text-lg font-bold text-text-primary mb-4">{isHe ? 'חנות' : 'Store'}</h3>
          <div className="flex items-center gap-3">
            <div
              className="w-10 h-10 rounded-lg flex items-center justify-center overflow-hidden shrink-0"
              style={{ backgroundColor: brandBgColors[business.id] || 'var(--color-surface)' }}
            >
              {business.logoUrl ? (
                <img
                  src={business.logoUrl}
                  alt={brandName}
                  className={FULL_BLEED_LOGOS.has(business.id) ? 'w-full h-full object-cover' : 'w-8 h-8 object-contain'}
                />
              ) : (
                <span className="text-lg" aria-hidden>{business.logo}</span>
              )}
            </div>
            <span className="font-semibold text-[15px] text-text-primary">{brandName}</span>
          </div>
        </div>
      </section>

      {/* Download as PDF */}
      <div className="px-5 pb-4">
        <button
          type="button"
          onClick={() => window.print()}
          className="w-full bg-surface text-text-primary font-semibold py-3.5 rounded-xl text-sm flex items-center justify-center gap-2 active:opacity-70 transition-opacity"
        >
          <span className="material-symbols-rounded" style={{ fontSize: 20 }}>download</span>
          {isHe ? 'הורדה כ-PDF' : 'Download as PDF'}
        </button>
      </div>

      {/* Standard bottom toolbar */}
      <FloatingActions force />
    </div>
  );
}
