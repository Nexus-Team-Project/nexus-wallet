import { useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useLanguage } from '../../i18n/LanguageContext';
import { useInViewVideo } from '../../hooks/useInViewVideo';
import { brandBgColors } from '../../utils/brandColors';
import StoreActionsSheet from '../home/StoreActionsSheet';
import type { Business } from '../../types/search.types';

interface BrandFeatureStoreProps {
  business: Business;
  /** 'light' = mauve inner card with white product tiles.
   *  'dark' = black inner card with full-bleed image tiles. */
  variant?: 'light' | 'dark';
  /** Promo copy shown at the foot of the outer card. */
  promo?: { saveLabel: string; condition: string };
  /** Short related background clip (muted, autoplay, looped). Falls back to the
   *  brand's hero image when not provided. */
  bgVideo?: string;
}

// Pick a legible text colour (near-black / white) for a given hex background.
function readableText(hex: string): string {
  const c = hex.replace('#', '');
  if (c.length < 6) return '#ffffff';
  const r = parseInt(c.slice(0, 2), 16);
  const g = parseInt(c.slice(2, 4), 16);
  const b = parseInt(c.slice(4, 6), 16);
  const lum = (0.299 * r + 0.587 * g + 0.114 * b) / 255;
  return lum > 0.6 ? '#1a1a1a' : '#ffffff';
}

/**
 * BrandFeatureStore — an in-page "mini store" for a single brand, modelled on
 * the Shop-app brand feature cards. A brand-coloured OUTER card frames a rounded
 * INNER card (the product grid + "Shop all"), with a promo line in the outer
 * card's foot — a card-within-a-card. The outer colour varies per store.
 */
export default function BrandFeatureStore({ business, variant = 'light', promo, bgVideo }: BrandFeatureStoreProps) {
  const navigate = useNavigate();
  const { lang = 'he' } = useParams();
  const { language } = useLanguage();
  const isHe = language === 'he';
  const isDark = variant === 'dark';
  // Background video only plays while the card is in view (see hook).
  const videoRef = useInViewVideo<HTMLVideoElement>();
  const [menuOpen, setMenuOpen] = useState(false);

  const products = (business.products ?? []).filter((p) => p.image).slice(0, 4);
  const arrow = isHe ? 'arrow_back' : 'arrow_forward';

  const openStore = () => navigate(`/${lang}/business/${business.id}/store`);
  const openProduct = (productId: string) =>
    navigate(`/${lang}/business/${business.id}/product/${productId}`);

  // Outer card = brand colour (varies per store). The inner area shows the
  // brand's hero image, faded under a colour wash (mauve / black).
  const outerBg = brandBgColors[business.id] ?? '#3a3a3a';
  const outerText = readableText(outerBg);
  const innerOverlay = isDark
    ? 'linear-gradient(to bottom, rgba(0,0,0,0.40) 0%, rgba(0,0,0,0.78) 100%)'
    : 'linear-gradient(to bottom, rgba(165,148,148,0.78) 0%, rgba(165,148,148,0.92) 100%)';
  const heroImage = business.heroImageUrl ?? business.heroImages?.[0];

  return (
    <section
      dir={isHe ? 'rtl' : 'ltr'}
      className="mx-4 rounded-3xl overflow-hidden shadow-xl"
      style={{ background: outerBg }}
    >
      {/* Inner card — the rounded "card within a card", flush to the top +
          left/right edges (the brand colour frames it only via the bottom promo
          band). Its background is the brand's hero image, faded under a colour
          wash. */}
      <div className="relative rounded-[20px] overflow-hidden text-white">
        {bgVideo ? (
          <video
            ref={videoRef}
            src={bgVideo}
            muted
            loop
            playsInline
            preload="metadata"
            aria-hidden
            className="absolute inset-0 w-full h-full object-cover"
          />
        ) : heroImage ? (
          <img src={heroImage} alt="" aria-hidden className="absolute inset-0 w-full h-full object-cover" />
        ) : null}
        <div className="absolute inset-0" aria-hidden style={{ background: innerOverlay }} />
        <div className="relative z-10 p-6">
          {/* Brand header — the brand's own logo */}
          <div className="flex items-center justify-between mb-6">
            {business.logoUrl ? (
              isDark ? (
                <img
                  src={business.logoUrl}
                  alt={business.name}
                  className="h-8 w-auto object-contain max-w-[60%] drop-shadow-md"
                />
              ) : (
                // Light variant — enlarge the (square) logo and crop its
                // top/bottom whitespace to a rectangle, keeping the centred
                // wordmark intact.
                <span className="block h-14 w-[150px] overflow-hidden">
                  <img
                    src={business.logoUrl}
                    alt={business.name}
                    className="w-full h-full object-cover object-center drop-shadow-md"
                  />
                </span>
              )
            ) : (
              <h2
                className={
                  isDark
                    ? 'text-2xl font-serif italic tracking-wide'
                    : 'text-4xl font-serif italic font-extrabold tracking-tight'
                }
              >
                {business.name}
              </h2>
            )}
            <button type="button" onClick={() => setMenuOpen(true)} aria-label={isHe ? 'פעולות' : 'Actions'} className="active:opacity-60">
              <span className="material-symbols-rounded block" style={{ fontSize: 24 }}>more_horiz</span>
            </button>
          </div>

          {/* Product grid */}
          <div className={`grid grid-cols-2 gap-3 ${isDark ? 'mb-8' : ''}`}>
            {products.map((p) => (
              <button
                key={p.id}
                type="button"
                onClick={() => openProduct(p.id)}
                className={`relative overflow-hidden rounded-2xl active:scale-[0.98] transition-transform ${
                  isDark ? 'aspect-[3/4]' : 'bg-white aspect-square'
                }`}
              >
                <img
                  src={p.image}
                  alt={isHe ? p.nameHe : p.name}
                  className="w-full h-full object-cover"
                  onError={(e) => { (e.currentTarget as HTMLImageElement).style.display = 'none'; }}
                />
                <span className="absolute top-2 px-2 py-0.5 rounded bg-black/40 backdrop-blur-sm text-[10px] font-bold text-white" style={{ insetInlineStart: 8 }} dir="ltr">
                  {p.currency}{p.price}
                </span>
                <span className="absolute bottom-2 w-8 h-8 rounded-full bg-black/30 backdrop-blur-md text-white flex items-center justify-center" style={{ insetInlineEnd: 8 }} aria-hidden>
                  <span className="material-symbols-rounded block" style={{ fontSize: 16, fontVariationSettings: isDark ? "'FILL' 0" : "'FILL' 1" }}>favorite</span>
                </span>
              </button>
            ))}
          </div>

          {/* Shop all */}
          <button type="button" onClick={openStore} className={`w-full flex items-center justify-between active:opacity-70 ${isDark ? '' : 'mt-7'}`}>
            <span className={isDark ? 'text-4xl font-bold tracking-tight' : 'text-3xl font-medium tracking-tight'}>
              {isHe ? 'לכל המוצרים' : 'Shop all'}
            </span>
            <span className={`flex items-center justify-center rounded-full bg-white/20 text-white ${isDark ? 'w-10 h-10' : 'p-3'}`}>
              <span className="material-symbols-rounded block" style={{ fontSize: 20 }}>{arrow}</span>
            </span>
          </button>
        </div>
      </div>

      {/* Promo — sits in the outer card's foot, on the brand colour. */}
      {promo && (
        <div className="py-3.5 px-6 text-center text-sm font-medium" style={{ color: outerText }}>
          <span className="bg-primary text-white px-2 py-0.5 rounded text-[11px] font-bold" style={{ marginInlineEnd: 6 }}>
            {promo.saveLabel}
          </span>
          {promo.condition}
        </div>
      )}

      {/* Actions sheet — opened by the ⋮ button */}
      <StoreActionsSheet
        business={business}
        isOpen={menuOpen}
        onClose={() => setMenuOpen(false)}
      />
    </section>
  );
}
