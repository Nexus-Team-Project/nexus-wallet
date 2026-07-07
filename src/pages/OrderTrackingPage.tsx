import { useState } from 'react';
import { useLanguage } from '../i18n/LanguageContext';
import { useNavigate, useParams } from 'react-router-dom';
import { mockBusinesses } from '../mock/data/businesses.mock';
import { useUser } from '../hooks/useUser';
import AddressMapThumb from '../components/business/AddressMapThumb';
import BusinessContactSheet from '../components/business/BusinessContactSheet';

// Mock order — same source as the orders list so brand / product resolve.
const ORDER_BUSINESS = mockBusinesses.find((b) => (b.products?.length ?? 0) >= 2) ?? mockBusinesses[0];
const ACTIVE_PRODUCT = (ORDER_BUSINESS.products ?? [])[0];
const TRACKING_NUMBER = '92612902103258000179584347';
// Delivery destination (Tel Aviv) — same real map as the checkout address card.
const DESTINATION = { lng: 34.7806, lat: 32.0809 };
// "Popular at the store" rail — the rest of the catalogue from the same shop
// the order came from, excluding the item that's already on its way.
const POPULAR_PRODUCTS = (ORDER_BUSINESS.products ?? []).filter(
  (p) => p.image && p.id !== ACTIVE_PRODUCT?.id,
);

/**
 * Order tracking — the delivery detail screen reached by tapping the active
 * order on the Orders page. Shows a map, ETA + address, the carrier tracking
 * number, the item, and quick actions (receipt / contact / visit store).
 * The global TopBar (back) and floating nav come from AppLayout.
 */
export default function OrderTrackingPage() {
  const { language } = useLanguage();
  const navigate = useNavigate();
  const { lang = 'he' } = useParams();
  const isHe = language === 'he';
  const { data: user } = useUser();
  const [mapReady, setMapReady] = useState(false);
  const [contactOpen, setContactOpen] = useState(false);

  const brandName = isHe ? ORDER_BUSINESS.nameHe : ORDER_BUSINESS.name;
  const productName = ACTIVE_PRODUCT ? (isHe ? ACTIVE_PRODUCT.nameHe : ACTIVE_PRODUCT.name) : '';

  return (
    <div className="animate-fade-in relative min-h-[100dvh] pb-28">
      {/* Decorative home-page gradient glow — same rainbow backdrop the home /
          orders surfaces use, fading into the page below. */}
      <div className="absolute top-0 inset-x-0 h-[280px] pointer-events-none z-0" aria-hidden>
        <div
          className="w-full h-full opacity-[0.18]"
          style={{ background: 'linear-gradient(135deg, #ffb74d 0%, #ff91b8 35%, #9c88ff 65%, #80deea 100%)' }}
        />
        <div
          className="absolute inset-0"
          style={{ background: 'linear-gradient(to bottom, rgba(255,255,255,0) 0%, rgba(255,255,255,0) 60%, var(--color-bg-light) 100%)' }}
        />
      </div>

      {/* Brand header — pt-28 clears the floating TopBar overlay and drops the
          whole page lower (matches the Orders page). */}
      <header className="relative z-10 px-5 pt-28 pb-4 flex items-center justify-between gap-3">
        <div className="flex items-center gap-3 min-w-0">
          <div className="w-12 h-12 rounded-xl bg-surface border border-border flex items-center justify-center overflow-hidden shrink-0">
            <img src={ORDER_BUSINESS.logoUrl} alt="" className="w-8 h-8 object-contain" />
          </div>
          <div className="min-w-0">
            <h1 className="font-bold text-lg leading-tight text-text-primary truncate">{brandName}</h1>
            <p className="text-text-muted text-sm">{isHe ? 'פריט אחד • בדרך אליך' : '1 item • In transit'}</p>
          </div>
        </div>
        <button type="button" aria-label={isHe ? 'אפשרויות' : 'Options'} className="p-2 text-text-secondary active:opacity-60">
          <span className="material-symbols-rounded block" style={{ fontSize: 24 }}>more_horiz</span>
        </button>
      </header>

      <main className="relative z-10 px-5 space-y-4">
        {/* ── Tracking card ── */}
        <div className="bg-white border border-border rounded-3xl p-3 shadow-sm">
          {/* Map — a real map (same AddressMapThumb as the checkout address
              card), inset with its own rounded frame. Tapping it opens the
              full-screen live tracking view. */}
          <button
            type="button"
            onClick={() => navigate(`/${lang}/orders/track/live`)}
            aria-label={isHe ? 'מעקב חי על המפה' : 'Live map tracking'}
            className="h-44 w-full relative rounded-2xl overflow-hidden bg-surface block active:opacity-90 transition-opacity"
          >
            <AddressMapThumb
              lng={DESTINATION.lng}
              lat={DESTINATION.lat}
              zoom={15}
              avatarUrl={user?.avatar}
              onLoad={() => setMapReady(true)}
              className="w-full h-full"
              // Static — the whole map is a tap target that opens the live view.
              interactive={false}
            />
            {/* Loading shimmer — fades out once tiles load (mirrors checkout). */}
            <div
              aria-hidden
              className="absolute inset-0 z-[5] pointer-events-none overflow-hidden bg-[#e9eaef] transition-opacity duration-500"
              style={{ opacity: mapReady ? 0 : 1 }}
            >
              <div
                className="absolute inset-y-0 w-2/3"
                style={{
                  background:
                    'linear-gradient(100deg, transparent 0%, rgba(255,255,255,0.7) 50%, transparent 100%)',
                  animation: 'map-shimmer 1.4s ease-in-out infinite',
                }}
              />
            </div>
            {/* Transparent overlay above the map canvas so taps reliably open
                the live view instead of being swallowed by the GL canvas. */}
            <span className="absolute inset-0 z-10" aria-hidden />
          </button>

          {/* Details */}
          <div className="px-2 pt-4 pb-1">
            <h2 className="font-bold text-lg text-text-primary">{isHe ? 'מגיע ביום חמישי' : 'Arrives Thursday'}</h2>
            <p className="text-text-secondary text-sm">{isHe ? 'תל אביב-יפו, ישראל' : 'Tel Aviv-Yafo, Israel'}</p>

            {/* Carrier + tracking number — a slim grey strip carrying the real
                Israel Post lockup (deer + wordmark). */}
            <div className="flex items-center justify-between gap-3 my-4 bg-surface rounded-xl px-3 py-2">
              <img src="/logos/israel-post.svg" alt={isHe ? 'דואר ישראל' : 'Israel Post'} className="h-5 w-auto shrink-0" />
              <span className="text-xs font-medium tracking-tight text-text-muted truncate" dir="ltr">{TRACKING_NUMBER}</span>
            </div>

            {/* Item — sits directly on the white card, no grey envelope. */}
            <div className="flex items-center gap-4">
              <div className="relative w-16 h-16 bg-white rounded-xl overflow-hidden border border-border shrink-0">
                <span className="absolute inset-0 flex items-center justify-center text-text-muted/50" aria-hidden>
                  <span className="material-symbols-rounded" style={{ fontSize: 22 }}>shopping_bag</span>
                </span>
                <img
                  src={ACTIVE_PRODUCT?.image}
                  alt=""
                  className="relative w-full h-full object-cover"
                  onError={(e) => { (e.currentTarget as HTMLImageElement).style.display = 'none'; }}
                />
              </div>
              <div className="min-w-0">
                <h3 className="font-bold text-sm text-text-primary truncate">{productName}</h3>
                {ACTIVE_PRODUCT && (
                  <p className="text-text-muted text-sm" dir="ltr">{ACTIVE_PRODUCT.currency}{ACTIVE_PRODUCT.price}</p>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* ── Action links — plain rows on the page, no card envelope. ── */}
        <div className="px-1 divide-y divide-border/60">
          <button
            type="button"
            onClick={() =>
              ACTIVE_PRODUCT &&
              navigate(`/${lang}/business/${ORDER_BUSINESS.id}/product/${ACTIVE_PRODUCT.id}/receipt`, {
                state: { qty: 1, total: ACTIVE_PRODUCT.price },
              })
            }
            className="w-full flex items-center justify-between gap-4 py-4 text-start active:opacity-60 transition-opacity"
          >
            <span className="flex items-center gap-4 min-w-0">
              <span className="material-symbols-rounded text-text-secondary shrink-0" style={{ fontSize: 22 }}>receipt_long</span>
              <span className="font-medium text-text-primary truncate">{isHe ? 'קבלה' : 'Order receipt'}</span>
            </span>
            <span className="material-symbols-rounded text-text-muted shrink-0" style={{ fontSize: 20 }}>{isHe ? 'chevron_left' : 'chevron_right'}</span>
          </button>
          <button
            type="button"
            onClick={() => setContactOpen(true)}
            className="w-full flex items-center justify-between gap-4 py-4 text-start active:opacity-60 transition-opacity"
          >
            <span className="flex items-center gap-4 min-w-0">
              <span className="material-symbols-rounded text-text-secondary shrink-0" style={{ fontSize: 22 }}>mail</span>
              <span className="font-medium text-text-primary truncate">{isHe ? `צרו קשר עם ${brandName}` : `Contact ${brandName}`}</span>
            </span>
            <span className="material-symbols-rounded text-text-muted shrink-0" style={{ fontSize: 20 }}>{isHe ? 'chevron_left' : 'chevron_right'}</span>
          </button>
        </div>

        {/* ── Popular at the store ── */}
        {POPULAR_PRODUCTS.length > 0 && (
          <section className="-mx-5 pt-1">
            <div className="flex items-center justify-between mb-3 px-5">
              <h3 className="text-base font-bold text-text-primary">
                {isHe ? `פופולרי ב${brandName}` : `Popular at ${brandName}`}
              </h3>
              <button
                type="button"
                onClick={() => navigate(`/${lang}/business/${ORDER_BUSINESS.id}/store`)}
                className="text-xs font-semibold text-primary active:opacity-60"
              >
                {isHe ? 'לכל המוצרים' : 'See all'}
              </button>
            </div>
            <div className="flex gap-3 overflow-x-auto hide-scrollbar px-5 pb-2">
              {POPULAR_PRODUCTS.map((p) => (
                <button
                  key={p.id}
                  type="button"
                  onClick={() => navigate(`/${lang}/business/${ORDER_BUSINESS.id}/store`)}
                  className="relative shrink-0 w-[110px] text-start active:scale-[0.98] transition-transform"
                >
                  <div className="relative w-[110px] h-[130px] bg-surface rounded-2xl border border-border overflow-hidden">
                    <span className="absolute inset-0 flex items-center justify-center text-text-muted/50" aria-hidden>
                      <span className="material-symbols-rounded" style={{ fontSize: 30 }}>shopping_bag</span>
                    </span>
                    <img
                      src={p.image}
                      alt={isHe ? p.nameHe : p.name}
                      className="relative w-full h-full object-cover"
                      onError={(e) => { (e.currentTarget as HTMLImageElement).style.display = 'none'; }}
                    />
                  </div>
                  <h4 className="mt-2 text-xs font-semibold text-text-primary truncate">{isHe ? p.nameHe : p.name}</h4>
                  <p className="text-xs text-text-muted" dir="ltr">{p.currency}{p.price}</p>
                </button>
              ))}
            </div>
          </section>
        )}

        {/* ── Visit store ── */}
        <button
          type="button"
          onClick={() => navigate(`/${lang}/business/${ORDER_BUSINESS.id}/store`)}
          className="w-full bg-surface rounded-2xl py-4 font-bold text-sm text-text-primary active:opacity-70 transition-opacity"
        >
          {isHe ? 'ביקור בחנות' : 'Visit store'}
        </button>
      </main>

      {/* Contact sheet — same bottom sheet used on the business page. */}
      <BusinessContactSheet
        business={ORDER_BUSINESS}
        isOpen={contactOpen}
        onClose={() => setContactOpen(false)}
      />
    </div>
  );
}
