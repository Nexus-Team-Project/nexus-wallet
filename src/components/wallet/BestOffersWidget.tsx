import { useEffect, useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { useNavigate, useParams } from 'react-router-dom';
import { useLanguage } from '../../i18n/LanguageContext';

/** One slide in the carousel — a hero image + brand + cashback %. */
interface OfferSlide {
  id: string;
  brand: string;
  brandHe: string;
  cashbackPct: number;
  imageUrl: string;
  /** Path under /public for the brand's chip logo. */
  logoUrl: string;
  /** Override the round-chip background (some brand logos are
   *  black-on-transparent and need a dark plate with an inverted filter). */
  logoTreatment?: 'dark-invert';
}

/**
 * Mock slides — five offers cycling through. Real wiring would pull from
 * an offers API (top-cashback ranked). Unsplash URLs match the hero
 * images used elsewhere in the project (mockBusinesses) so the visual
 * language stays consistent.
 */
const SLIDES: OfferSlide[] = [
  {
    id: 'food',
    brand: 'Aroma',
    brandHe: 'ארומה',
    cashbackPct: 15,
    imageUrl:
      'https://images.unsplash.com/photo-1495474472287-4d71bcdd2085?w=480&q=70&auto=format',
    logoUrl: '/brands/aroma.png',
  },
  {
    id: 'fashion',
    brand: 'Castro',
    brandHe: 'קסטרו',
    cashbackPct: 20,
    imageUrl:
      'https://images.unsplash.com/photo-1490481651871-ab68de25d43d?w=480&q=70&auto=format',
    logoUrl: '/brands/castro-home.png',
    logoTreatment: 'dark-invert',
  },
  {
    id: 'cinema',
    brand: 'Cinema City',
    brandHe: 'סינמה סיטי',
    cashbackPct: 25,
    imageUrl:
      'https://images.unsplash.com/photo-1489599849927-2ee91cede3ba?w=480&q=70&auto=format',
    logoUrl: '/brands/cinema-city.png',
  },
  {
    id: 'fastfood',
    brand: "McDonald's",
    brandHe: 'מקדונלדס',
    cashbackPct: 10,
    imageUrl:
      'https://images.unsplash.com/photo-1568901346375-23c9450c58cd?w=480&q=70&auto=format',
    logoUrl: '/brands/mcdonalds.png',
  },
  {
    id: 'grocery',
    brand: 'Shufersal',
    brandHe: 'שופרסל',
    cashbackPct: 8,
    imageUrl:
      'https://images.unsplash.com/photo-1542838132-92c53300491e?w=480&q=70&auto=format',
    logoUrl: '/brands/shufersal.png',
  },
];

/** Auto-advance interval between slides, in ms. Slower than typical
 *  carousels so each offer has time to register before it swaps. */
const SLIDE_DURATION = 6500;

/**
 * BestOffersWidget — coloured atmospheric carousel of top-cashback
 * offers. Each slide cross-fades in framer-motion, dark gradient at the
 * bottom keeps the brand + percentage readable over any image. Same
 * `w-48 h-36` footprint as the other featured widgets.
 */
interface BestOffersWidgetProps {
  /** Override the widget's outer sizing classes (e.g. `w-full` when the
   *  widget is placed in a grid cell that controls its width). Defaults
   *  to the standalone `w-48 h-36` sizing used in single-row layouts. */
  className?: string;
}

export default function BestOffersWidget({ className }: BestOffersWidgetProps = {}) {
  const { t, isRTL } = useLanguage();
  const { lang = 'he' } = useParams();
  const navigate = useNavigate();
  const [index, setIndex] = useState(0);

  // Auto-rotate. We use `setTimeout` inside an effect so the timer
  // restarts cleanly whenever the index changes (skipping by tap would
  // also reset the clock).
  useEffect(() => {
    const id = setTimeout(
      () => setIndex((i) => (i + 1) % SLIDES.length),
      SLIDE_DURATION,
    );
    return () => clearTimeout(id);
  }, [index]);

  const slide = SLIDES[index];
  const brandLabel = isRTL ? slide.brandHe : slide.brand;

  // Image takes the top ~65% of the card; the bottom ~35% is a flat
  // dark band carrying the brand name + cashback line. The round brand
  // logo straddles the boundary (overlaps from the bottom of the image
  // into the dark band), matching the reference design.
  return (
    <button
      type="button"
      onClick={() => navigate(`/${lang}/store`)}
      aria-label={t.wallet.widgetBestOffers}
      className={`flex-shrink-0 ${className ?? 'w-48 h-36'} rounded-2xl overflow-hidden bg-white border border-border shadow-[0_8px_30px_rgb(0,0,0,0.04)] active:scale-[0.98] transition-transform relative text-start`}
    >
      {/* Static title — sits over whichever slide is current, doesn't
          travel with the gallery transition. */}
      <div className="absolute top-2 start-2.5 end-2.5 z-20 pointer-events-none">
        <p
          className="text-[11px] font-semibold text-white leading-tight"
          style={{ textShadow: '0 1px 3px rgba(0,0,0,0.5)' }}
        >
          {t.wallet.widgetBestOffers}
        </p>
      </div>

      {/* Gallery — each slide is a single motion.div that slides
          right-to-left. Old slide exits left, new slide enters from
          right, both running simultaneously (AnimatePresence sync). */}
      <AnimatePresence initial={false}>
        <motion.div
          key={slide.id}
          initial={{ x: '100%' }}
          animate={{ x: 0 }}
          exit={{ x: '-100%' }}
          transition={{ duration: 0.55, ease: [0.32, 0.72, 0, 1] }}
          className="absolute inset-0"
        >
          {/* Image area — 70% of the card. A white-to-transparent
              gradient at the bottom edge bleeds the image into the
              white band below so there's no hard horizontal seam. */}
          <div className="relative h-[70%] overflow-hidden">
            <img
              src={slide.imageUrl}
              alt=""
              aria-hidden
              loading="lazy"
              className="absolute inset-0 w-full h-full object-cover"
            />
            <div
              aria-hidden
              className="absolute inset-x-0 bottom-0 h-1/2 pointer-events-none"
              style={{
                background:
                  'linear-gradient(to bottom, rgba(255,255,255,0) 0%, rgba(255,255,255,0.55) 60%, rgba(255,255,255,1) 100%)',
              }}
            />
          </div>

          {/* Bottom band — slimmer white strip; logo + text positioned
              against the slide (motion.div) for stable corner anchoring. */}
          <div className="relative h-[30%] bg-white" />

          {/* Brand logo — positioned against the slide, straddling the
              image/band boundary at 70% from the top. */}
          <div
            className={`absolute start-3 w-10 h-10 rounded-full shadow-md ring-2 ring-white overflow-hidden flex items-center justify-center ${
              slide.logoTreatment === 'dark-invert' ? 'bg-black' : 'bg-white'
            }`}
            style={{ top: 'calc(70% - 24px)' }}
          >
            <img
              src={slide.logoUrl}
              alt={brandLabel}
              className="w-full h-full object-contain"
              style={
                slide.logoTreatment === 'dark-invert'
                  ? { filter: 'invert(1)' }
                  : undefined
              }
            />
          </div>

          {/* Brand name + cashback — single row at the very bottom.
              Brand on the start side, cashback % on the end side. */}
          <div className="absolute bottom-2 start-3 end-3 flex items-baseline justify-between gap-2">
            <span className="text-xs font-semibold text-text-primary leading-tight truncate">
              {brandLabel}
            </span>
            <span
              className="text-base font-bold text-success leading-tight flex-shrink-0"
              dir="ltr"
            >
              {slide.cashbackPct}%
            </span>
          </div>
        </motion.div>
      </AnimatePresence>
    </button>
  );
}
