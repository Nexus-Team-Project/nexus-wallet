import { useEffect, useRef, useState } from 'react';

/**
 * Rising brand-bubble animation, extracted from PremiumRevealPage's
 * celebration screen (src/pages/PremiumRevealPage.tsx). The original spawns
 * bubbles that rise the full viewport height (`vh` units, since it's a
 * full-screen reveal). This is meant to sit inside a much smaller box, so
 * the keyframes use fixed px travel distances tuned for a compact
 * (roughly 300–450px tall) container instead.
 */

const BRANDS = [
  { name: 'Carrefour', logo: '/brands/carrefour.png', color: '#FFFFFF' },
  { name: 'Golf & Co', logo: '/brands/golf.png', color: '#FFFFFF' },
  { name: 'American Eagle', logo: '/brands/american-eagle.png', color: '#00205B' },
  { name: 'Rami Levy', logo: '/brands/rami-levy.png', color: '#B3171D' },
  { name: 'Mango', logo: '/brands/mango.png', color: '#FFFFFF' },
  { name: 'Foot Locker', logo: '/brands/foot-locker.png', color: '#D3D3D3' },
  { name: 'Samsung', logo: '/brands/samsung.png', color: '#1428A0' },
  { name: 'Castro Home', logo: '/brands/castro-home.png', color: '#F5F5DC' },
  { name: 'Billabong', logo: '/brands/billabong.png', color: '#00A5A5' },
  { name: 'Hoodies', logo: '/brands/hoodis.png', color: '#8BA83F' },
  { name: "Sack's", logo: '/brands/sacks.png', color: '#F5F5DC' },
  { name: 'Magnolia', logo: '/brands/magnolia.png', color: '#F5E6E8' },
  { name: 'Yves Rocher', logo: '/brands/yves-rocher.png', color: '#FFFFFF' },
  { name: 'Ruby Bay', logo: '/brands/ruby-bay.png', color: '#7AB3C4' },
];

interface Bubble {
  id: number;
  brand: typeof BRANDS[0];
  left: number;
  size: number;
  duration: number;
  delay: number;
  drift: number;
}

interface RisingBubblesProps {
  /**
   * How far a bubble travels upward, in px, before it finishes fading out.
   * Defaults to the original 660px, tuned for a ~300-450px tall box. Pass the
   * container's height when the field spans a taller region, otherwise the
   * bubbles die partway up it.
   */
  travel?: number;
}

const BASE_TRAVEL = 660;

export default function RisingBubbles({ travel = BASE_TRAVEL }: RisingBubblesProps = {}) {
  const [bubbles, setBubbles] = useState<Bubble[]>([]);
  const bubbleIdRef = useRef(0);

  // Everything else scales off the travel distance: the duration so bubbles
  // keep the same apparent speed over a longer climb, and the live-bubble cap
  // so a taller field doesn't end up sparser than a short one.
  const speed = travel / BASE_TRAVEL;
  const maxBubbles = Math.round(20 * speed);

  useEffect(() => {
    const initial: Bubble[] = BRANDS.map((brand, i) => ({
      id: bubbleIdRef.current++,
      brand,
      left: Math.random() * 70 + 15,
      size: Math.random() * 25 + 52,
      duration: (Math.random() * 3 + 5) * speed,
      delay: i * 0.25,
      drift: (Math.random() - 0.5) * 40,
    }));
    setBubbles(initial);

    const interval = setInterval(() => {
      setBubbles((prev) => {
        const brand = BRANDS[Math.floor(Math.random() * BRANDS.length)];
        return [...prev.slice(-maxBubbles), {
          id: bubbleIdRef.current++,
          brand,
          left: Math.random() * 70 + 15,
          size: Math.random() * 25 + 52,
          duration: (Math.random() * 3 + 5) * speed,
          delay: 0,
          drift: (Math.random() - 0.5) * 40,
        }];
      });
    }, 800);

    return () => clearInterval(interval);
  }, [speed, maxBubbles]);

  // Keyframes are generated per travel distance, so two fields with different
  // heights can't clobber each other's @keyframes block.
  const animName = `riseBubbleCompact${Math.round(travel)}`;

  return (
    <div className="absolute inset-0 overflow-hidden pointer-events-none">
      {bubbles.map((b) => (
        <div
          key={b.id}
          className="absolute"
          style={{
            left: `${b.left}%`,
            bottom: '-60px',
            width: b.size,
            height: b.size,
            animationName: animName,
            animationDuration: `${b.duration}s`,
            animationDelay: `${b.delay}s`,
            animationTimingFunction: 'linear',
            animationFillMode: 'forwards',
            ['--drift' as string]: `${b.drift}px`,
          }}
        >
          <div
            className="w-full h-full rounded-full flex items-center justify-center shadow-xl"
            style={{
              backgroundColor: b.brand.color,
              boxShadow: `0 10px 40px ${b.brand.color}40`,
            }}
          >
            <img
              src={b.brand.logo}
              alt={b.brand.name}
              className="w-3/5 h-3/5 object-contain"
              onError={(e) => { (e.target as HTMLImageElement).style.display = 'none'; }}
            />
          </div>
        </div>
      ))}

      <style>{`
        /* Bubbles start below the container's bottom edge and rise the full
           travel distance, fading out as they reach the top of it. The
           waypoints keep the original 660px curve's proportions. */
        @keyframes ${animName} {
          0% { transform: translateY(0) translateX(0) scale(0.7); opacity: 0; }
          5% { opacity: 1; }
          20% { transform: translateY(-${(travel * 0.212).toFixed(0)}px) translateX(calc(var(--drift) * 0.2)) scale(0.8); }
          50% { transform: translateY(-${(travel * 0.515).toFixed(0)}px) translateX(calc(var(--drift) * 0.6)) scale(0.9); }
          72% { transform: translateY(-${(travel * 0.742).toFixed(0)}px) translateX(calc(var(--drift) * 0.85)) scale(1); opacity: 1; }
          100% { transform: translateY(-${travel}px) translateX(var(--drift)) scale(1); opacity: 0; }
        }
      `}</style>
    </div>
  );
}
