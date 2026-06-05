import { useMemo } from 'react';
import { useParams, useLocation, useNavigate, Navigate } from 'react-router-dom';
import { mockBusinesses } from '../mock/data/businesses.mock';
import { useLanguage } from '../i18n/LanguageContext';

/**
 * OrderConfirmationPage — success screen after "Pay now".
 *
 * Reached (via replace) from the checkout once payment "completes". Rebuilt
 * from the Rhode order-confirmation mockup in the nexus design language: order
 * header + brand badge, ship-to + product thumb, totals, a receipt CTA, a
 * "More from <brand>" rail and a floating navigation bar. AppLayout suppresses
 * its global chrome here so the screen stands on its own.
 */

interface ConfirmState {
  qty?: number;
  total?: number;
  shippingLabel?: string;
  address?: string;
}

export default function OrderConfirmationPage() {
  const { businessId, productId } = useParams<{ businessId: string; productId: string }>();
  const navigate = useNavigate();
  const location = useLocation();
  const { language } = useLanguage();
  const isHe = language === 'he';

  const business = useMemo(
    () => mockBusinesses.find((b) => b.id === businessId),
    [businessId],
  );
  const product = useMemo(
    () => business?.products?.find((p) => p.id === productId),
    [business, productId],
  );

  const state = (location.state as ConfirmState | null) ?? {};
  // Stable order number derived once per mount.
  const orderNumber = useMemo(
    () => `${Math.floor(1000000 + Math.random() * 9000000)}`,
    [],
  );

  if (!business || !product) return <Navigate to=".." replace />;

  const cur = product.currency;
  const brandName = isHe ? business.nameHe : business.name;
  const productName = isHe ? product.nameHe : product.name;
  const qty = Math.max(1, state.qty ?? 1);
  const fmt = (n: number) => `${cur}${n.toLocaleString()}`;

  const recommendations = (business.products ?? []).filter((p) => p.id !== product.id).slice(0, 6);

  return (
    <div className="relative min-h-dvh bg-white flex flex-col pb-28" dir={isHe ? 'rtl' : 'ltr'}>
      {/* Close */}
      <header className="px-5 pt-5 pb-1">
        <button
          onClick={() => navigate(`/${language}`)}
          aria-label={isHe ? 'סגירה' : 'Close'}
          className="p-1 -m-1 active:opacity-60 transition-opacity"
        >
          <span className="material-symbols-rounded text-text-primary" style={{ fontSize: 30 }}>close</span>
        </button>
      </header>

      {/* Order details */}
      <main className="px-5 pt-3 space-y-6">
        <div className="flex justify-between items-start gap-4">
          <div className="min-w-0">
            <h1 className="text-[28px] font-bold text-text-primary leading-tight">
              {isHe ? 'ההזמנה אושרה' : 'Order confirmed'}
            </h1>
            <p className="text-sm text-text-muted mt-1" dir="ltr">
              {isHe ? `מס׳ הזמנה #${orderNumber}` : `Order No. #${orderNumber}`}
            </p>
          </div>
          {/* Brand badge */}
          <div className="w-16 h-16 rounded-2xl bg-surface border border-border flex items-center justify-center shrink-0 overflow-hidden">
            {business.logoUrl ? (
              <img src={business.logoUrl} alt={brandName} className="w-11 h-11 object-contain" />
            ) : (
              <span className="text-2xl" aria-hidden>{business.logo}</span>
            )}
          </div>
        </div>

        {/* Ships to + product thumb */}
        <div className="flex justify-between items-start gap-4 pt-1">
          <div className="max-w-[70%]">
            <h3 className="text-[11px] font-semibold uppercase tracking-wide text-text-muted">
              {isHe ? 'נשלח אל' : 'Ships to'}
            </h3>
            <p className="text-[15px] font-semibold text-text-primary mt-1 leading-snug">
              {state.address || (isHe ? 'איסוף עצמי מהסניף' : 'Pickup at store')}
            </p>
            {state.shippingLabel && (
              <p className="text-sm text-text-muted mt-1">{state.shippingLabel}</p>
            )}
          </div>
          <div className="relative w-14 h-16 bg-surface rounded-xl border border-border overflow-hidden flex items-center justify-center shrink-0">
            <img src={product.image} alt={productName} className="h-12 object-contain" />
            <span className="absolute -top-1.5 -end-1.5 min-w-[20px] h-5 px-1 rounded-full bg-bg-dark text-white text-[11px] font-bold flex items-center justify-center">
              {qty}
            </span>
          </div>
        </div>

        {/* Totals */}
        <div className="space-y-1">
          <div className="flex justify-between items-center">
            <span className="text-base font-bold text-text-primary">{isHe ? 'סה״כ' : 'Total'}</span>
            <span className="text-base font-bold text-text-primary">
              {typeof state.total === 'number' ? fmt(state.total) : '—'}
            </span>
          </div>
          <div className="flex justify-between items-center">
            <span className="text-[15px] text-text-secondary">{isHe ? 'נקסוס •••• 2907' : 'Nexus •••• 2907'}</span>
            <span className="text-[15px] text-text-secondary">
              {typeof state.total === 'number' ? fmt(state.total) : '—'}
            </span>
          </div>
        </div>

        {/* Receipt */}
        <button
          type="button"
          onClick={() => {}}
          className="w-full bg-primary/10 text-primary font-semibold py-3.5 rounded-xl text-center text-sm active:bg-primary/15 transition-colors"
        >
          {isHe ? 'צפייה בקבלה' : 'View order receipt'}
        </button>
      </main>

      {/* More from brand */}
      {recommendations.length > 0 && (
        <section className="mt-10">
          <div className="px-5 flex items-center gap-2 mb-4">
            <h2 className="text-xl font-bold text-text-primary">
              {isHe ? `עוד מ${brandName}` : `More from ${brandName}`}
            </h2>
            <span className="material-symbols-rounded text-text-muted" style={{ fontSize: 20 }}>
              {isHe ? 'chevron_left' : 'chevron_right'}
            </span>
          </div>

          <div className="flex overflow-x-auto scrollbar-hide gap-4 px-5">
            {recommendations.map((p) => (
              <button
                key={p.id}
                type="button"
                onClick={() => navigate(`/${language}/business/${business.id}/product/${p.id}`)}
                className="min-w-[170px] w-[170px] text-start shrink-0"
              >
                <div className="relative bg-surface rounded-2xl p-4 aspect-[4/5] flex items-center justify-center overflow-hidden">
                  <img src={p.image} alt={isHe ? p.nameHe : p.name} className="h-4/5 object-contain" />
                  <span className="absolute bottom-3 end-3 bg-white/80 backdrop-blur rounded-full p-2 border border-white">
                    <span className="material-symbols-rounded text-text-muted" style={{ fontSize: 18 }}>favorite</span>
                  </span>
                </div>
                <p className="text-sm font-semibold text-text-primary mt-2 truncate">{isHe ? p.nameHe : p.name}</p>
                <div className="flex items-center gap-1 text-[11px] text-amber-500 mt-0.5">
                  <span aria-hidden>★★★★★</span>
                  <span className="text-text-muted font-medium">(1.1K)</span>
                </div>
                <p className="text-sm font-bold text-text-primary mt-1">{`${p.currency}${p.price.toLocaleString()}`}</p>
              </button>
            ))}
          </div>
        </section>
      )}

      {/* Floating navigation bar */}
      <footer className="fixed bottom-6 inset-x-0 px-5 max-w-md mx-auto z-50">
        <div className="flex items-center gap-3">
          <button
            onClick={() => navigate(`/${language}`)}
            aria-label={isHe ? 'חזרה' : 'Back'}
            className="bg-white rounded-full p-3 shadow-lg border border-border active:scale-95 transition-transform"
          >
            <span className="material-symbols-rounded text-text-primary" style={{ fontSize: 24 }}>
              {isHe ? 'arrow_forward' : 'arrow_back'}
            </span>
          </button>
          <div className="flex-1 bg-white rounded-full flex items-center justify-around px-6 py-3 shadow-lg border border-border">
            <button onClick={() => navigate(`/${language}`)} aria-label={isHe ? 'בית' : 'Home'}>
              <span className="material-symbols-rounded text-text-primary" style={{ fontSize: 26 }}>home</span>
            </button>
            <button onClick={() => navigate(`/${language}/search`)} aria-label={isHe ? 'חיפוש' : 'Search'}>
              <span className="material-symbols-rounded text-text-muted" style={{ fontSize: 26 }}>search</span>
            </button>
            <button onClick={() => navigate(`/${language}/profile`)} aria-label={isHe ? 'הזמנות' : 'Orders'}>
              <span className="material-symbols-rounded text-text-muted" style={{ fontSize: 26 }}>receipt_long</span>
            </button>
          </div>
        </div>
      </footer>
    </div>
  );
}
