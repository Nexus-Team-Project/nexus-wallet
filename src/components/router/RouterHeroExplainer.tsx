/**
 * Hero explainer for the RouterScreen. Brings the visual language of
 * ReferralStoriesPage Story 1 (bobbing floating brand logos, soft
 * decorative glow, staggered value-prop reveal) into the post-login
 * chooser so users see WHAT the Nexus wallet does before they pick
 * a context.
 *
 * Pure presentational + bilingual. No router/auth coupling.
 *
 * Layout: stacks vertically as a compact mobile hero (logos above
 * value props), and expands into a larger story-style area on desktop
 * via the parent's grid. Sized via parent column, not viewport.
 */
import { motion } from 'framer-motion';
import { useState } from 'react';

interface FloatingBrand {
  src: string;
  name: string;
  size: number;
  top?: string;
  left?: string;
  right?: string;
  bottom?: string;
  delay: number;
}

// Curated subset of /public/brands/*.png that ships with the wallet.
// Position values are tuned for the desktop column - on mobile the
// logos collapse into a centered grid via the responsive class set.
const FLOATING_BRANDS: FloatingBrand[] = [
  { src: '/brands/golf.png',           name: 'Golf',           size: 56, top: '8%',     right: '14%', delay: 0   },
  { src: '/brands/american-eagle.png', name: 'American Eagle', size: 64, top: '22%',    left: '10%',  delay: 0.25 },
  { src: '/brands/rami-levy.png',      name: 'Rami Levy',      size: 48, bottom: '24%', right: '8%',  delay: 0.5 },
  { src: '/brands/mango.png',          name: 'Mango',          size: 56, bottom: '8%',  left: '18%',  delay: 0.75 },
  { src: '/brands/foot-locker.png',    name: 'Foot Locker',    size: 44, top: '50%',    right: '4%',  delay: 0.4 },
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
    he: { title: 'מאובטח ופרטי', body: 'הזהות שלך מנוהלת על ידי נקסוס. הארגון לא רואה את הקניות שלך.' },
    en: { title: 'Private and secure', body: 'Nexus owns your identity. Your org never sees what you buy.' },
  },
];

interface RouterHeroExplainerProps {
  isHe: boolean;
}

export default function RouterHeroExplainer({ isHe }: RouterHeroExplainerProps) {
  const [imgErrors, setImgErrors] = useState<Set<number>>(new Set());

  return (
    <div className="relative w-full">
      {/* ── Floating brand logos area ── */}
      {/* A short presentational stage above the value props. Each logo
          fades + scales in on a stagger, then bobs forever on a 3-4s
          loop, same rhythm as ReferralStoriesPage Story 1. Behind them
          sits a soft warm radial glow drawn from the stories palette. */}
      <div className="relative mb-8 h-[220px] sm:h-[260px] lg:h-[320px]">
        {/* Soft glow behind the logos */}
        <div
          aria-hidden
          className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 rounded-full"
          style={{
            width: 260,
            height: 260,
            background:
              'radial-gradient(circle, rgba(255,145,184,0.35) 0%, rgba(255,183,77,0.2) 55%, transparent 80%)',
            filter: 'blur(40px)',
          }}
        />

        {FLOATING_BRANDS.map((brand, i) => (
          <motion.div
            key={brand.name}
            className="absolute"
            style={{
              top: brand.top,
              left: brand.left,
              right: brand.right,
              bottom: brand.bottom,
            }}
            initial={{ opacity: 0, scale: 0.6 }}
            animate={{ opacity: 1, scale: 1, y: [0, -10, 0] }}
            transition={{
              opacity: { duration: 0.5, delay: 0.4 + brand.delay },
              scale: { duration: 0.5, delay: 0.4 + brand.delay },
              y: {
                repeat: Infinity,
                duration: 3.4 + i * 0.3,
                ease: 'easeInOut',
                delay: brand.delay,
              },
            }}
          >
            <div
              className="flex items-center justify-center rounded-full bg-white overflow-hidden"
              style={{
                width: brand.size,
                height: brand.size,
                boxShadow: '0 6px 24px rgba(15,23,42,0.10), 0 1px 3px rgba(15,23,42,0.06)',
              }}
            >
              {!imgErrors.has(i) ? (
                <img
                  src={brand.src}
                  alt={brand.name}
                  className="object-contain"
                  style={{ width: brand.size * 0.62, height: brand.size * 0.62 }}
                  onError={() => setImgErrors((prev) => new Set(prev).add(i))}
                />
              ) : (
                <span className="text-[10px] font-bold text-slate-500">
                  {brand.name.charAt(0)}
                </span>
              )}
            </div>
          </motion.div>
        ))}
      </div>

      {/* ── Value-prop pills ── */}
      {/* Three explanatory cards that slide in on a stagger. The icons
          use material-symbols-outlined which is already loaded by the
          wallet (material-icons is NOT - see CLAUDE.md). Cards sit on
          a translucent white background with backdrop-blur so the
          page's ambient gradient blobs gently show through. */}
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
