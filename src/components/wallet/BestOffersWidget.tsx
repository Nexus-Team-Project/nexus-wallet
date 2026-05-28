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
  },
  {
    id: 'fashion',
    brand: 'Castro',
    brandHe: 'קסטרו',
    cashbackPct: 20,
    imageUrl:
      'https://images.unsplash.com/photo-1490481651871-ab68de25d43d?w=480&q=70&auto=format',
  },
  {
    id: 'cinema',
    brand: 'Cinema City',
    brandHe: 'סינמה סיטי',
    cashbackPct: 25,
    imageUrl:
      'https://images.unsplash.com/photo-1489599849927-2ee91cede3ba?w=480&q=70&auto=format',
  },
  {
    id: 'fastfood',
    brand: "McDonald's",
    brandHe: 'מקדונלדס',
    cashbackPct: 10,
    imageUrl:
      'https://images.unsplash.com/photo-1568901346375-23c9450c58cd?w=480&q=70&auto=format',
  },
  {
    id: 'grocery',
    brand: 'Shufersal',
    brandHe: 'שופרסל',
    cashbackPct: 8,
    imageUrl:
      'https://images.unsplash.com/photo-1542838132-92c53300491e?w=480&q=70&auto=format',
  },
];

/** Auto-advance interval between slides, in ms. */
const SLIDE_DURATION = 3500;

/**
 * BestOffersWidget — coloured atmospheric carousel of top-cashback
 * offers. Each slide cross-fades in framer-motion, dark gradient at the
 * bottom keeps the brand + percentage readable over any image. Same
 * `w-48 h-36` footprint as the other featured widgets.
 */
export default function BestOffersWidget() {
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

  return (
    <button
      type="button"
      onClick={() => navigate(`/${lang}/store`)}
      aria-label={t.wallet.widgetBestOffers}
      className="flex-shrink-0 w-48 h-36 rounded-2xl overflow-hidden bg-surface border border-border shadow-[0_8px_30px_rgb(0,0,0,0.04)] active:scale-[0.98] transition-transform relative text-start"
    >
      {/* Cross-fading slide layer */}
      <AnimatePresence mode="wait">
        <motion.div
          key={slide.id}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.6, ease: 'easeOut' }}
          className="absolute inset-0"
        >
          <img
            src={slide.imageUrl}
            alt=""
            aria-hidden
            className="absolute inset-0 w-full h-full object-cover"
            loading="lazy"
          />
          {/* Bottom-to-top dark gradient so the brand label + % read
              cleanly over the photo. */}
          <div
            aria-hidden
            className="absolute inset-0 pointer-events-none"
            style={{
              background:
                'linear-gradient(to top, rgba(0,0,0,0.65) 0%, rgba(0,0,0,0.15) 55%, rgba(0,0,0,0) 100%)',
            }}
          />
        </motion.div>
      </AnimatePresence>

      {/* Title — top-leading corner, white over the dimmed top of the
          image. */}
      <div className="absolute top-3 start-3 end-3 pointer-events-none">
        <p
          className="text-sm font-bold text-white leading-tight"
          style={{ textShadow: '0 1px 3px rgba(0,0,0,0.4)' }}
        >
          {t.wallet.widgetBestOffers}
        </p>
      </div>

      {/* Bottom row — cashback chip on one side, brand name on the
          other. Lives outside AnimatePresence so the chip "swap" reads
          as content-only without the chip ever blinking away. */}
      <AnimatePresence mode="wait">
        <motion.div
          key={`label-${slide.id}`}
          initial={{ opacity: 0, y: 6 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -6 }}
          transition={{ duration: 0.35, ease: 'easeOut' }}
          className="absolute bottom-3 start-3 end-3 flex items-end justify-between gap-2 pointer-events-none"
        >
          <span
            className="text-xs font-semibold text-white leading-tight truncate"
            style={{ textShadow: '0 1px 3px rgba(0,0,0,0.55)' }}
          >
            {brandLabel}
          </span>
          <span
            className="bg-white text-text-primary rounded-full px-2 py-0.5 text-xs font-bold flex-shrink-0"
            dir="ltr"
          >
            {slide.cashbackPct}% {t.wallet.widgetCashbackLabel}
          </span>
        </motion.div>
      </AnimatePresence>

      {/* Slide-position pips — tiny dots so the user senses the
          carousel without taking up much space. */}
      <div className="absolute bottom-1 start-1/2 -translate-x-1/2 flex gap-1 pointer-events-none">
        {SLIDES.map((_, i) => (
          <span
            key={i}
            className={`h-[3px] rounded-full transition-all duration-300 ${
              i === index ? 'w-3 bg-white/95' : 'w-1.5 bg-white/45'
            }`}
          />
        ))}
      </div>
    </button>
  );
}
