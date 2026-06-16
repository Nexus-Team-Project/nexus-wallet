import { useState } from 'react';
import { Marker } from 'react-map-gl/maplibre';
import { useLanguage } from '../i18n/LanguageContext';
import { useNavigate, useParams } from 'react-router-dom';
import { mockBusinesses } from '../mock/data/businesses.mock';
import { useUser } from '../hooks/useUser';
import AddressMapThumb from '../components/business/AddressMapThumb';

// Same mock order source as the tracking + orders screens so brand / product
// resolve to one consistent order across the flow.
const ORDER_BUSINESS = mockBusinesses.find((b) => (b.products?.length ?? 0) >= 2) ?? mockBusinesses[0];
const ACTIVE_PRODUCT = (ORDER_BUSINESS.products ?? [])[0];
const TRACKING_NUMBER = '92612902103258000179584347';
const ORDER_NUMBER = '8324087230';
// Delivery destination (Tel Aviv) — the map flies here, same as checkout.
const DESTINATION = { lng: 34.7806, lat: 32.0809 };
// Courier position (en route) — where the product-thumbnail pin sits.
const COURIER = { lng: 34.7691, lat: 32.0738 };

// Delivery timeline — newest event first (top). Carrier is Israel Post.
type TimelineStep = {
  kind: 'active' | 'dot' | 'carrier';
  he: string; en: string;
  whenHe: string; whenEn: string;
  placeHe?: string; placeEn?: string;
};
const TIMELINE: TimelineStep[] = [
  { kind: 'active', he: 'סומן כנמסר', en: 'Marked as delivered', whenHe: '10 ביוני, 07:56', whenEn: 'Jun 10, 7:56am' },
  { kind: 'dot', he: 'נשלח ממרכז המיון', en: 'Dispatched from sorting center', whenHe: '10 ביוני, 00:46', whenEn: 'Jun 10, 12:46am', placeHe: 'מרכז מיון מודיעין', placeEn: 'Modiin sorting center' },
  { kind: 'carrier', he: 'נוצרה תווית משלוח', en: 'Shipping label generated', whenHe: '5 ביוני, 16:10', whenEn: 'Jun 5, 4:10pm', placeHe: 'מרכז מיון מודיעין', placeEn: 'Modiin sorting center' },
];


/**
 * Live order tracking — the immersive, map-first view reached by tapping the
 * map on the order-tracking card. A full-bleed real map (the same
 * AddressMapThumb used on the checkout delivery-address card) fills the top
 * with the destination pin; a bottom sheet slides up over it carrying the item
 * summary, a delivery-progress timeline (carrier = Israel Post) and auxiliary
 * actions. The global TopBar (back) + floating nav come from AppLayout.
 */
export default function OrderTrackingLivePage() {
  const { language } = useLanguage();
  const navigate = useNavigate();
  const { lang = 'he' } = useParams();
  const isHe = language === 'he';
  const { data: user } = useUser();
  const [mapReady, setMapReady] = useState(false);

  const brandName = isHe ? ORDER_BUSINESS.nameHe : ORDER_BUSINESS.name;
  const productName = ACTIVE_PRODUCT ? (isHe ? ACTIVE_PRODUCT.nameHe : ACTIVE_PRODUCT.name) : '';
  const orderDate = isHe ? '4 ביוני 2025' : 'Jun 4, 2025';
  // Gradient fill for the delivery progress bar — runs from the start edge.
  const barGradient = `linear-gradient(${isHe ? 'to left' : 'to right'}, #635bff 0%, #7b6bff 45%, #00c2cb 100%)`;

  return (
    <div className="animate-fade-in min-h-[100dvh] bg-bg-light">
      {/* ── Full-bleed real map — same component as the checkout address card ── */}
      <div className="h-[46vh] w-full relative bg-surface">
        <AddressMapThumb
          lng={DESTINATION.lng}
          lat={DESTINATION.lat}
          zoom={14}
          avatarUrl={user?.avatar}
          onLoad={() => setMapReady(true)}
          className="w-full h-full"
        >
          {/* Courier pin — the product thumbnail square above a ringed dot. */}
          <Marker longitude={COURIER.lng} latitude={COURIER.lat} anchor="bottom">
            <div className="flex flex-col items-center">
              <div className="bg-white p-1.5 rounded-2xl shadow-lg mb-1.5 border border-border">
                <div className="relative w-11 rounded-xl overflow-hidden bg-surface" style={{ height: '3.25rem' }}>
                  <span className="absolute inset-0 flex items-center justify-center text-text-muted/50" aria-hidden>
                    <span className="material-symbols-rounded" style={{ fontSize: 20 }}>shopping_bag</span>
                  </span>
                  <img
                    src={ACTIVE_PRODUCT?.image}
                    alt=""
                    className="relative w-full h-full object-cover"
                    onError={(e) => { (e.currentTarget as HTMLImageElement).style.display = 'none'; }}
                  />
                </div>
              </div>
              {/* White centre, ringed black. */}
              <span className="w-5 h-5 bg-white rounded-full border-4 border-bg-dark shadow-md" />
            </div>
          </Marker>
        </AddressMapThumb>
        {/* Loading shimmer — fades out once the interactive GL map has loaded
            (mirrors the checkout map). */}
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
      </div>

      {/* ── Bottom sheet — slides up over the map ── */}
      <div className="relative -mt-8 bg-bg-light rounded-t-[32px] shadow-[0_-4px_20px_rgba(0,0,0,0.05)] px-5 pt-3 pb-28 min-h-[58vh]">
        {/* Drag handle */}
        <div className="w-10 h-1 bg-border rounded-full mx-auto mt-1 mb-6" aria-hidden />

        {/* Brand header */}
        <div className="flex items-center justify-between gap-3 mb-1">
          <span className="text-sm font-medium text-text-secondary truncate">{brandName}</span>
          <button type="button" aria-label={isHe ? 'אפשרויות' : 'Options'} className="bg-surface p-2 rounded-full text-text-secondary active:opacity-60">
            <span className="material-symbols-rounded block" style={{ fontSize: 18 }}>more_horiz</span>
          </button>
        </div>

        {/* ETA headline */}
        <h1 className="text-2xl font-bold text-text-primary mb-4">{isHe ? 'מגיע ביום חמישי' : 'Arrives Thursday'}</h1>

        {/* Delivery progress bar */}
        <div className="relative h-1.5 bg-border/60 rounded-full mb-3">
          <div
            className="absolute inset-y-0 rounded-full"
            style={{ insetInlineStart: 0, width: '45%', background: barGradient }}
          />
          <div className="absolute top-1/2 -translate-y-1/2 w-2 h-2 rounded-full bg-white border-2 border-primary" style={{ insetInlineStart: 0 }} />
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-2 h-2 rounded-full bg-white border-2 border-border" />
          <div className="absolute top-1/2 -translate-y-1/2 w-2 h-2 rounded-full bg-white border-2 border-border" style={{ insetInlineEnd: 0 }} />
          {/* Package marker over the bar */}
          <div className="absolute -top-2 bg-white rounded-full p-0.5 shadow-md border border-border" style={{ insetInlineStart: '45%', transform: 'translateX(-50%)' }}>
            <div className="w-4 h-4 bg-surface rounded-full flex items-center justify-center text-[10px] leading-none">📦</div>
          </div>
        </div>
        <p className="text-primary font-semibold text-sm mb-6">{isHe ? 'בדרך אליך' : 'In transit'}</p>

        {/* ── Carrier card (grey) ── */}
        <div className="bg-white border border-border rounded-3xl p-5 shadow-sm mb-4">
          <div className="flex items-center justify-between gap-3 mb-4">
            <img src="/logos/israel-post.svg" alt={isHe ? 'דואר ישראל' : 'Israel Post'} className="h-6 w-auto" />
            <div className="flex items-center gap-1">
              <button type="button" aria-label={isHe ? 'העתקת מספר מעקב' : 'Copy tracking number'} className="p-2 text-text-muted active:opacity-60">
                <span className="material-symbols-rounded block" style={{ fontSize: 20 }}>content_copy</span>
              </button>
              <button type="button" aria-label={isHe ? 'מעקב באתר השליח' : 'Track on carrier site'} className="p-2 text-text-muted active:opacity-60">
                <span className="material-symbols-rounded block" style={{ fontSize: 20 }}>open_in_new</span>
              </button>
            </div>
          </div>
          <p className="text-xs text-text-muted mb-1">{isHe ? 'מספר מעקב' : 'Tracking no.'}</p>
          <p className="text-sm font-medium text-text-primary leading-tight break-all" dir="ltr">{TRACKING_NUMBER}</p>
        </div>

        {/* ── Order summary card (grey) ── */}
        <div className="bg-surface rounded-3xl p-6 mb-4">
          <div className="text-center mb-6">
            {ORDER_BUSINESS.logoUrl ? (
              <img
                src={ORDER_BUSINESS.logoUrl}
                alt={brandName}
                className="h-10 w-auto max-w-[60%] mx-auto object-contain"
              />
            ) : (
              <h2 className="text-3xl font-black text-text-secondary/80 tracking-tight truncate">{brandName}</h2>
            )}
            <div className="inline-block bg-border/70 px-3 py-1 rounded-full text-xs font-semibold text-text-secondary mt-2" dir="ltr">
              #{ORDER_NUMBER} · {orderDate}
            </div>
          </div>

          {/* Item */}
          <div className="flex items-center gap-4 bg-white/60 p-3 rounded-2xl">
            <div className="relative w-16 h-20 bg-white rounded-xl overflow-hidden border border-border shrink-0">
              <span className="absolute inset-0 flex items-center justify-center text-text-muted/50" aria-hidden>
                <span className="material-symbols-rounded" style={{ fontSize: 24 }}>shopping_bag</span>
              </span>
              <img
                src={ACTIVE_PRODUCT?.image}
                alt=""
                className="relative w-full h-full object-cover"
                onError={(e) => { (e.currentTarget as HTMLImageElement).style.display = 'none'; }}
              />
            </div>
            <div className="min-w-0">
              <p className="font-bold text-sm text-text-primary truncate">{productName}</p>
              {ACTIVE_PRODUCT && (
                <p className="text-xs text-text-muted" dir="ltr">{ACTIVE_PRODUCT.currency}{ACTIVE_PRODUCT.price}</p>
              )}
            </div>
          </div>

          {/* Visit store */}
          <button
            type="button"
            onClick={() => navigate(`/${lang}/business/${ORDER_BUSINESS.id}/store`)}
            className="w-full mt-6 py-4 text-sm font-bold text-text-secondary border-t border-border active:opacity-60 transition-opacity"
          >
            {isHe ? 'ביקור בחנות' : 'Visit store'}
          </button>
        </div>

        {/* ── Delivery progress timeline ── */}
        <section className="bg-white border border-border rounded-[28px] p-6 shadow-sm mb-4">
          <h2 className="text-base font-bold text-text-primary mb-6">{isHe ? 'התקדמות המשלוח' : 'Delivery progress'}</h2>

          <div className="relative space-y-8">
            {/* Vertical connector — sits under the node centres (start-aligned
                so it flips to the right in RTL). */}
            <div className="absolute w-0.5 bg-primary" style={{ insetInlineStart: 17, top: 24, bottom: 12 }} aria-hidden />

            {TIMELINE.map((step) => {
              const when = isHe ? step.whenHe : step.whenEn;
              const place = isHe ? step.placeHe : step.placeEn;
              return (
                <div key={step.en} className="flex items-start gap-4 relative z-10">
                  {/* Node */}
                  {step.kind === 'active' ? (
                    <div className="w-9 h-9 bg-white border-2 border-primary rounded-full flex items-center justify-center shrink-0">
                      <span className="material-symbols-rounded text-primary" style={{ fontSize: 20 }}>location_on</span>
                    </div>
                  ) : step.kind === 'carrier' ? (
                    <div className="w-9 h-9 bg-white rounded-full flex items-center justify-center overflow-hidden border border-border shrink-0">
                      <img src="/logos/israel-post.svg" alt={isHe ? 'דואר ישראל' : 'Israel Post'} className="w-7 object-contain" />
                    </div>
                  ) : (
                    <div className="w-9 h-9 flex items-center justify-center shrink-0">
                      <div className="w-2.5 h-2.5 bg-primary rounded-full" />
                    </div>
                  )}
                  {/* Label */}
                  <div className="min-w-0 pt-0.5">
                    <p className="text-[11px] text-text-muted leading-tight">{place ? `${place} · ${when}` : when}</p>
                    <p className="text-sm font-bold text-text-primary">{isHe ? step.he : step.en}</p>
                  </div>
                </div>
              );
            })}
          </div>

          <button
            type="button"
            className="w-full mt-8 bg-surface py-4 rounded-2xl text-sm font-bold text-text-primary active:opacity-70 transition-opacity"
          >
            {isHe ? 'צפייה בכל הפעילות' : 'View all activity'}
          </button>
        </section>

        {/* ── Auxiliary actions ── */}
        <section className="border border-border rounded-[24px] overflow-hidden mb-4 divide-y divide-border">
          <button type="button" className="w-full flex items-center gap-3 px-5 py-4 text-start active:bg-surface transition-colors">
            <span className="material-symbols-rounded text-text-primary shrink-0" style={{ fontSize: 22 }}>unpublished</span>
            <span className="text-sm font-bold text-text-primary">{isHe ? 'ביטול סימון כנמסר' : 'Unmark as delivered'}</span>
          </button>
          <button type="button" className="w-full flex items-center gap-3 px-5 py-4 text-start active:bg-surface transition-colors">
            <span className="material-symbols-rounded text-text-primary shrink-0" style={{ fontSize: 22 }}>info</span>
            <span className="text-sm font-bold text-text-primary">{isHe ? 'דיווח על מידע שגוי' : 'Report incorrect information'}</span>
          </button>
        </section>
      </div>
    </div>
  );
}
