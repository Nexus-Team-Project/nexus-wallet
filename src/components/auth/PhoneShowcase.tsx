/**
 * Hero animation for AnonymousSplash. iPhone-style device mockup that
 * cycles through brand offer cards (logo + brand name + savings copy).
 * Each card slides up + fades in, holds for ~2.6s, then slides up +
 * fades out as the next card rises from the bottom. A soft warm halo
 * sits behind the device and breathes gently to anchor the eye.
 *
 * Pure presentational. No router / auth coupling. Mobile shrinks the
 * device width via the parent column.
 */
import { AnimatePresence, motion } from 'framer-motion';
import { useEffect, useState } from 'react';

interface BrandCard {
  src: string;
  name: string;
  /** Tile background color, drawn from the brand's primary hue. */
  bg: string;
  /** Solid header bar color above the logo. */
  accent: string;
  /** Localized savings line shown under the logo. */
  he: string;
  en: string;
}

const BRANDS: BrandCard[] = [
  { src: '/brands/golf.png',           name: 'Golf & Co',      bg: '#FFF7D1', accent: '#facc15', he: 'עד 25% הנחה בקופה', en: 'Up to 25% off at checkout' },
  { src: '/brands/american-eagle.png', name: 'American Eagle', bg: '#dbeafe', accent: '#3b82f6', he: 'הנחת חבר 18%',        en: '18% member discount'      },
  { src: '/brands/rami-levy.png',      name: 'Rami Levy',      bg: '#fee2e2', accent: '#ef4444', he: '₪200 הנחה בקנייה',   en: '₪200 off your basket'     },
  { src: '/brands/mango.png',          name: 'Mango',          bg: '#fce7f3', accent: '#ec4899', he: '15% הנחה על קולקציה', en: '15% off new arrivals'    },
  { src: '/brands/foot-locker.png',    name: 'Foot Locker',    bg: '#fef3c7', accent: '#f97316', he: 'משלוח חינם + הפתעה',  en: 'Free shipping + perk'     },
];

const CARD_INTERVAL_MS = 2800;

interface PhoneShowcaseProps {
  isHe: boolean;
}

export default function PhoneShowcase({ isHe }: PhoneShowcaseProps) {
  const [index, setIndex] = useState(0);

  useEffect(() => {
    const id = window.setInterval(() => {
      setIndex((i) => (i + 1) % BRANDS.length);
    }, CARD_INTERVAL_MS);
    return () => window.clearInterval(id);
  }, []);

  const card = BRANDS[index]!;

  return (
    <div className="relative mx-auto flex h-[460px] w-full max-w-[300px] items-center justify-center sm:h-[520px] sm:max-w-[340px]">
      {/* Soft warm halo behind the phone - breathes on a slow loop. */}
      <motion.div
        aria-hidden
        className="absolute h-[360px] w-[360px] rounded-full opacity-70 blur-3xl sm:h-[420px] sm:w-[420px]"
        style={{
          background:
            'radial-gradient(circle, rgba(255,145,184,0.45) 0%, rgba(255,183,77,0.28) 55%, transparent 80%)',
        }}
        animate={{ scale: [1, 1.06, 1] }}
        transition={{ repeat: Infinity, duration: 6, ease: 'easeInOut' }}
      />

      {/* iPhone body. Plain Tailwind, no external assets so it stays
          crisp at any zoom and renders identically across browsers. */}
      <div
        className="relative h-full w-[230px] flex-shrink-0 rounded-[42px] border-[10px] border-slate-900 bg-slate-900 shadow-2xl sm:w-[270px]"
        style={{ boxShadow: '0 30px 60px -20px rgba(15,23,42,0.35)' }}
      >
        {/* Notch */}
        <div className="absolute left-1/2 top-1.5 z-20 h-6 w-24 -translate-x-1/2 rounded-full bg-slate-900" />

        {/* Screen */}
        <div className="relative h-full w-full overflow-hidden rounded-[32px] bg-white">
          {/* Status bar */}
          <div className="flex items-center justify-between px-5 pb-2 pt-3 text-[10px] font-semibold text-slate-700">
            <span>9:41</span>
            <span className="opacity-70">●●●●</span>
          </div>

          {/* Top header strip */}
          <div className="flex items-center justify-between px-4 pb-3">
            <img src="/nexus-logo.png" alt="" className="h-5 w-5 object-contain opacity-90" />
            <span className="text-[11px] font-bold text-slate-900">Nexus Wallet</span>
            <div className="h-5 w-5" />
          </div>

          {/* Hero card stage */}
          <div className="relative mx-3 mt-1 h-[280px] overflow-hidden rounded-2xl sm:h-[320px]">
            <AnimatePresence mode="wait">
              <motion.div
                key={card.name}
                initial={{ y: 60, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                exit={{ y: -60, opacity: 0 }}
                transition={{ duration: 0.55, ease: [0.25, 0.46, 0.45, 0.94] }}
                className="absolute inset-0 flex flex-col"
                style={{ background: card.bg }}
              >
                <div
                  className="h-2 w-full"
                  style={{ background: card.accent }}
                  aria-hidden
                />
                <div className="flex flex-1 flex-col items-center justify-center px-4 text-center">
                  <div className="mb-3 flex h-20 w-20 items-center justify-center rounded-2xl bg-white shadow-md">
                    <img
                      src={card.src}
                      alt={card.name}
                      className="h-14 w-14 object-contain"
                    />
                  </div>
                  <p className="text-base font-extrabold text-slate-900">{card.name}</p>
                  <p className="mt-1 text-xs font-semibold text-slate-700" dir={isHe ? 'rtl' : 'ltr'}>
                    {isHe ? card.he : card.en}
                  </p>
                </div>
                <div className="px-4 pb-4">
                  <div className="flex h-10 w-full items-center justify-center rounded-xl bg-slate-900 text-[12px] font-bold text-white">
                    {isHe ? 'הצג את ההטבה' : 'View offer'}
                  </div>
                </div>
              </motion.div>
            </AnimatePresence>
          </div>

          {/* Footer pager dots reflect the active card. */}
          <div className="mt-3 flex items-center justify-center gap-1.5">
            {BRANDS.map((b, i) => (
              <span
                key={b.name}
                className={`h-1.5 rounded-full transition-all ${
                  i === index ? 'w-5 bg-slate-900' : 'w-1.5 bg-slate-300'
                }`}
                aria-hidden
              />
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
