import { useMemo, useState } from 'react';
import { useParams, useLocation, useNavigate, Navigate } from 'react-router-dom';
import { mockBusinesses } from '../mock/data/businesses.mock';
import { brandBgColors, FULL_BLEED_LOGOS } from '../utils/brandColors';
import { useLanguage } from '../i18n/LanguageContext';
import TopBar from '../components/layout/TopBar';
import FloatingActions from '../components/layout/FloatingActions';

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
  const [logoError, setLogoError] = useState(false);

  if (!business || !product) return <Navigate to=".." replace />;

  const cur = product.currency;
  const brandName = isHe ? business.nameHe : business.name;
  const productName = isHe ? product.nameHe : product.name;
  const qty = Math.max(1, state.qty ?? 1);
  const fmt = (n: number) => `${cur}${n.toLocaleString()}`;

  const recommendations = (business.products ?? []).filter((p) => p.id !== product.id).slice(0, 6);

  // Cross-brand "You might also like" — one product from each other business.
  const alsoLike = mockBusinesses
    .filter((b) => b.id !== business.id && (b.products?.length ?? 0) > 0)
    .slice(0, 8)
    .map((b) => ({ biz: b, p: b.products![0] }));

  // Star row — same treatment as the product page (filled black up to the
  // rounded rating, light grey for the rest).
  const renderStars = (rating: number, reviewCount: number) => {
    const filled = Math.round(rating);
    return (
      <div className="flex items-center gap-1 mt-0.5">
        <div className="flex items-center">
          {[1, 2, 3, 4, 5].map((s) => (
            <span
              key={s}
              className={`material-symbols-rounded leading-none ${s <= filled ? 'text-black' : 'text-gray-200'}`}
              style={{ fontSize: 14, marginInline: -1.5, fontVariationSettings: s <= filled ? "'FILL' 1" : "'FILL' 0" }}
            >
              star
            </span>
          ))}
        </div>
        <span className="text-[11px] text-text-muted font-medium">({reviewCount.toLocaleString()})</span>
      </div>
    );
  };

  return (
    <div className="relative min-h-dvh bg-white flex flex-col pb-28" dir={isHe ? 'rtl' : 'ltr'}>
      {/* Decorative home-page gradient glow — same rainbow backdrop the home /
          wallet / orders surfaces use, fading into the white page below. */}
      <div className="absolute top-0 inset-x-0 h-[280px] pointer-events-none z-0" aria-hidden>
        <div
          className="w-full h-full opacity-[0.18]"
          style={{ background: 'linear-gradient(135deg, #ffb74d 0%, #ff91b8 35%, #9c88ff 65%, #80deea 100%)' }}
        />
        <div
          className="absolute inset-0"
          style={{ background: 'linear-gradient(to bottom, rgba(255,255,255,0) 0%, rgba(255,255,255,0) 60%, #ffffff 100%)' }}
        />
      </div>

      {/* Standard top strip — user icon / chat (support) / notifications */}
      <div className="relative z-10">
        <TopBar showBack />
      </div>

      {/* Order details */}
      <main className="relative z-10 px-5 pt-8 space-y-6">
        <div className="flex justify-between items-start gap-4">
          <div className="min-w-0">
            <h1 className="text-[28px] font-bold text-text-primary leading-tight">
              {isHe ? 'ההזמנה אושרה' : 'Order confirmed'}
            </h1>
            <p className="text-sm text-text-muted mt-1" dir="ltr">
              {isHe ? `מס׳ הזמנה #${orderNumber}` : `Order No. #${orderNumber}`}
            </p>
          </div>
          {/* Brand badge — brand-coloured disk so even white logos show. */}
          <div
            className="w-16 h-16 rounded-2xl flex items-center justify-center shrink-0 overflow-hidden"
            style={{ backgroundColor: brandBgColors[business.id] || 'var(--color-surface)' }}
          >
            {business.logoUrl && !logoError ? (
              <img
                src={business.logoUrl}
                alt={brandName}
                className={FULL_BLEED_LOGOS.has(business.id) ? 'w-full h-full object-cover' : 'w-11 h-11 object-contain'}
                onError={() => setLogoError(true)}
              />
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
          <div className="relative w-14 h-16 shrink-0">
            <div className="w-full h-full bg-surface rounded-xl border border-border overflow-hidden flex items-center justify-center">
              <img src={product.image} alt={productName} className="h-12 object-contain" />
            </div>
            <span className="absolute -top-1.5 -end-1.5 z-10 min-w-[20px] h-5 px-1 rounded-full bg-bg-dark text-white text-[11px] font-bold flex items-center justify-center border-2 border-white">
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

        {/* Receipt + track shipment */}
        <div className="space-y-3">
          <button
            type="button"
            onClick={() =>
              navigate(`/${language}/business/${business.id}/product/${product.id}/receipt`, {
                state: {
                  qty,
                  total: state.total,
                  shippingLabel: state.shippingLabel,
                  address: state.address,
                  orderNumber,
                },
              })
            }
            className="w-full bg-surface text-text-primary font-semibold py-3.5 rounded-xl text-center text-sm active:opacity-70 transition-opacity"
          >
            {isHe ? 'צפייה בקבלה' : 'View order receipt'}
          </button>

          <button
            type="button"
            onClick={() => navigate(`/${language}/orders/track`)}
            className="w-full bg-surface text-text-primary font-semibold py-3.5 rounded-xl text-center text-sm active:opacity-70 transition-opacity"
          >
            {isHe ? 'צפייה במשלוח' : 'View shipment'}
          </button>
        </div>
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
                {renderStars(business.rating, business.reviewCount)}
                <p className="text-sm font-bold text-text-primary mt-1">{`${p.currency}${p.price.toLocaleString()}`}</p>
              </button>
            ))}
          </div>
        </section>
      )}

      {/* You might also like — cross-brand recommendations */}
      {alsoLike.length > 0 && (
        <section className="mt-8">
          <div className="px-5 flex items-center gap-2 mb-4">
            <h2 className="text-xl font-bold text-text-primary">
              {isHe ? 'אולי תאהב גם' : 'You might also like'}
            </h2>
            <span className="material-symbols-rounded text-text-muted" style={{ fontSize: 20 }}>
              {isHe ? 'chevron_left' : 'chevron_right'}
            </span>
          </div>

          <div className="flex overflow-x-auto scrollbar-hide gap-4 px-5">
            {alsoLike.map(({ biz, p }) => (
              <button
                key={`${biz.id}-${p.id}`}
                type="button"
                onClick={() => navigate(`/${language}/business/${biz.id}/product/${p.id}`)}
                className="min-w-[170px] w-[170px] text-start shrink-0"
              >
                <div className="relative bg-surface rounded-2xl p-4 aspect-[4/5] flex items-center justify-center overflow-hidden">
                  <img src={p.image} alt={isHe ? p.nameHe : p.name} className="h-4/5 object-contain" />
                  <span className="absolute bottom-3 end-3 bg-white/80 backdrop-blur rounded-full p-2 border border-white">
                    <span className="material-symbols-rounded text-text-muted" style={{ fontSize: 18 }}>favorite</span>
                  </span>
                </div>
                <p className="text-sm font-semibold text-text-primary mt-2 truncate">{isHe ? p.nameHe : p.name}</p>
                <p className="text-[11px] text-text-muted mt-0.5 truncate">{isHe ? biz.nameHe : biz.name}</p>
                {renderStars(biz.rating, biz.reviewCount)}
                <p className="text-sm font-bold text-text-primary mt-1">{`${p.currency}${p.price.toLocaleString()}`}</p>
              </button>
            ))}
          </div>
        </section>
      )}

      {/* Standard bottom toolbar */}
      <FloatingActions force />
    </div>
  );
}
