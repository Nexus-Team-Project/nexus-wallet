/**
 * Hero explainer for the RouterScreen. Two presentational blocks:
 *
 * 1. Brand marquee - a single horizontal strip that scrolls partner
 *    logos at a calm linear pace. Pauses on hover / focus-within, and
 *    halts entirely under prefers-reduced-motion (the row sits static
 *    and remains readable). Replaces the previous bobbing floating
 *    circles, which the user said read as AI-slop decoration.
 *
 * 2. Value-prop pills - three explanatory cards that slide in on a
 *    spring stagger. Each pill has a brand-gradient icon tile and
 *    title + body.
 *
 * Pure presentational + bilingual. No router/auth coupling.
 */
import { motion } from 'framer-motion';
import { useState } from 'react';

interface MarqueeBrand {
  src: string;
  name: string;
  /**
   * Background color for the chip behind the logo. Most logos in
   * /public/brands are white-on-transparent or include their own
   * background; a soft slate-50 chip keeps them legible on the warm
   * page tint without clashing with each brand's primary color.
   */
  bg: string;
}

const MARQUEE_BRANDS: MarqueeBrand[] = [
  { src: '/brands/golf.png',           name: 'Golf',           bg: '#FFF7D1' },
  { src: '/brands/american-eagle.png', name: 'American Eagle', bg: '#1a3a7a' },
  { src: '/brands/rami-levy.png',      name: 'Rami Levy',      bg: '#B3171D' },
  { src: '/brands/mango.png',          name: 'Mango',          bg: '#ffffff' },
  { src: '/brands/foot-locker.png',    name: 'Foot Locker',    bg: '#1f2937' },
  { src: '/brands/shufersal.png',      name: 'Shufersal',      bg: '#ffffff' },
  { src: '/brands/superpharm.png',     name: 'Super-Pharm',    bg: '#ffffff' },
  { src: '/brands/aroma.png',          name: 'Aroma',          bg: '#ffffff' },
  { src: '/brands/hm.png',             name: 'H&M',            bg: '#ffffff' },
  { src: '/brands/mcdonalds.png',      name: 'McDonalds',      bg: '#ffffff' },
];

interface ValueProp {
  icon: string;
  he: { title: string; body: string };
  en: { title: string; body: string };
}

const VALUE_PROPS: ValueProp[] = [
  {
    icon: 'redeem',
    he: { title: 'הטבות ייחודיות', body: 'מבצעים והנחות שמוגדרים על ידי הארגון שלך.' },
    en: { title: 'Exclusive benefits', body: 'Deals and discounts curated by your organization.' },
  },
  {
    icon: 'storefront',
    he: { title: 'עשרות מותגים', body: 'מחירים מיוחדים אצל הקמעונאים המובילים בארץ.' },
    en: { title: 'Dozens of brands', body: 'Special pricing at top retailers across Israel.' },
  },
  {
    icon: 'shield_person',
    he: { title: 'מאובטח ופרטי', body: 'הזהות שלך מנוהלת על ידי נקסוס.' },
    en: { title: 'Private and secure', body: 'Nexus manages your identity.' },
  },
];

interface RouterHeroExplainerProps {
  isHe: boolean;
}

export default function RouterHeroExplainer({ isHe }: RouterHeroExplainerProps) {
  const [imgErrors, setImgErrors] = useState<Set<string>>(new Set());

  // The marquee track repeats the brand list twice so the second half
  // is already in position when the first half scrolls off-screen,
  // giving the loop a seamless wrap. CSS keyframes (defined inline in
  // a <style> tag below) animate the track on a linear loop and pause
  // on hover/focus via the :hover / :focus-within selectors.
  const repeated = [...MARQUEE_BRANDS, ...MARQUEE_BRANDS];

  return (
    <div className="relative w-full">
      <style>{`
        @keyframes nexus-marquee-ltr {
          from { transform: translateX(0); }
          to   { transform: translateX(-50%); }
        }
        @keyframes nexus-marquee-rtl {
          from { transform: translateX(0); }
          to   { transform: translateX(50%); }
        }
        .nexus-marquee-track {
          animation: var(--nexus-marquee, nexus-marquee-ltr) 38s linear infinite;
          will-change: transform;
        }
        .nexus-marquee-wrap:hover .nexus-marquee-track,
        .nexus-marquee-wrap:focus-within .nexus-marquee-track {
          animation-play-state: paused;
        }
        @media (prefers-reduced-motion: reduce) {
          .nexus-marquee-track {
            animation: none;
          }
        }
      `}</style>

      {/* ── Brand marquee strip ──
          One row, scrolls slowly, fades on both sides via a mask so
          brands gently enter and exit instead of popping. */}
      <div
        className="nexus-marquee-wrap relative mb-10 overflow-hidden"
        style={{
          maskImage:
            'linear-gradient(90deg, transparent 0, #000 8%, #000 92%, transparent 100%)',
          WebkitMaskImage:
            'linear-gradient(90deg, transparent 0, #000 8%, #000 92%, transparent 100%)',
        }}
        aria-hidden
      >
        <div
          className="nexus-marquee-track flex w-max items-center gap-4 py-1"
          style={
            {
              '--nexus-marquee': isHe ? 'nexus-marquee-rtl' : 'nexus-marquee-ltr',
            } as React.CSSProperties
          }
        >
          {repeated.map((brand, i) => {
            const key = `${brand.name}-${i}`;
            return (
              <div
                key={key}
                className="flex h-14 w-20 flex-shrink-0 items-center justify-center rounded-2xl border border-slate-200 shadow-sm sm:h-16 sm:w-24"
                style={{ background: brand.bg }}
              >
                {!imgErrors.has(key) ? (
                  <img
                    src={brand.src}
                    alt=""
                    className="max-h-9 max-w-[60%] object-contain sm:max-h-10"
                    onError={() =>
                      setImgErrors((prev) => {
                        const next = new Set(prev);
                        next.add(key);
                        return next;
                      })
                    }
                  />
                ) : (
                  <span className="text-[11px] font-bold text-slate-500">
                    {brand.name.charAt(0)}
                  </span>
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* ── Value-prop pills ── */}
      <motion.ul
        className="space-y-3"
        initial="hidden"
        animate="show"
        variants={{
          hidden: {},
          show: { transition: { staggerChildren: 0.12, delayChildren: 0.6 } },
        }}
        aria-label={isHe ? 'מה אפשר לעשות עם הארנק' : 'What you can do with the wallet'}
      >
        {VALUE_PROPS.map((vp) => {
          const copy = isHe ? vp.he : vp.en;
          return (
            <motion.li
              key={vp.icon}
              variants={{ hidden: { opacity: 0, y: 12 }, show: { opacity: 1, y: 0 } }}
              transition={{ type: 'spring', damping: 22, stiffness: 220 }}
              className="flex items-start gap-3 rounded-2xl border border-slate-200 bg-white/80 px-4 py-3 backdrop-blur-sm shadow-sm sm:gap-4 sm:px-5 sm:py-4"
            >
              <div
                className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-xl text-white shadow-md sm:h-11 sm:w-11"
                style={{
                  background:
                    'linear-gradient(135deg, #ffb74d 0%, #ff91b8 55%, #9c88ff 100%)',
                }}
              >
                <span
                  className="material-symbols-outlined"
                  style={{ fontSize: 22, fontVariationSettings: "'FILL' 1" }}
                  aria-hidden="true"
                >
                  {vp.icon}
                </span>
              </div>
              <div className="min-w-0 flex-1">
                <p className="text-sm font-bold text-slate-900 sm:text-base">{copy.title}</p>
                <p className="text-xs leading-relaxed text-slate-600 sm:text-sm">{copy.body}</p>
              </div>
            </motion.li>
          );
        })}
      </motion.ul>
    </div>
  );
}
