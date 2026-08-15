import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { walletCards, PUSH_IMAGES } from '../features/stories/constants';

/**
 * The 3-slot "push strip" animation from the Nexus hero story slide
 * (src/features/stories/SlideNexusHero.tsx — "נקסוס עוזרת לך לקנות חכם יותר").
 *
 * Mechanic is unchanged: a 150%-wide row of [image | phone | image] slots that
 * translates by -33.33% so the phone slides from the right half into the left,
 * pushing the first image out and pulling the second one in.
 *
 * Two deliberate differences from the original slide:
 *  - It loops. The story fires the push once (a story is watched top-to-bottom
 *    and then gone), but on a scrollable page a one-shot animation would have
 *    already finished before the section is ever scrolled into view.
 *  - `failedImages` is dropped in favour of local per-image `onError` state,
 *    so the component is self-contained instead of needing the story flow's
 *    preload bookkeeping passed in.
 */
export default function SmartShoppingPush() {
  const [pushIdx, setPushIdx] = useState(0);
  const [failed, setFailed] = useState<Set<string>>(new Set());

  useEffect(() => {
    const first = setTimeout(() => setPushIdx(1), 1200);
    const loop = setInterval(() => setPushIdx((i) => (i === 0 ? 1 : 0)), 3600);
    return () => { clearTimeout(first); clearInterval(loop); };
  }, []);

  const markFailed = (src: string) =>
    setFailed((prev) => new Set(prev).add(src));

  /** One of the two bordered product images flanking the phone. */
  const ProductCard = ({ src, fallback }: { src: string; fallback: string }) => (
    <div className="flex items-center justify-center" style={{ width: '33.33%' }}>
      <div className="relative" style={{ width: '75%', height: 130 }}>
        <div
          className="absolute inset-0 rounded-2xl"
          style={{ background: 'rgba(255,255,255,0.10)', filter: 'blur(12px)', transform: 'scale(1.04)' }}
        />
        <div
          className="absolute inset-0 rounded-2xl z-20 pointer-events-none"
          style={{ border: '2.5px solid #0d1025', borderRadius: 16 }}
        />
        {failed.has(src) ? (
          <div className="relative z-10 rounded-2xl w-full h-full bg-white/20 flex items-center justify-center">
            <span style={{ fontSize: 28 }}>{fallback}</span>
          </div>
        ) : (
          <img
            src={src}
            alt=""
            onError={() => markFailed(src)}
            className="relative z-10 rounded-2xl object-cover shadow-xl w-full h-full"
          />
        )}
        <div
          className="absolute z-30 flex items-center justify-center rounded-full"
          style={{ width: 20, height: 20, background: '#22c55e', border: '2px solid #0d1025', bottom: -7, right: -7, boxShadow: '0 2px 6px rgba(0,0,0,0.4)' }}
        >
          <span style={{ color: '#fff', fontSize: 13, lineHeight: 1, fontWeight: 800, marginTop: -1 }}>+</span>
        </div>
      </div>
    </div>
  );

  return (
    <div className="flex items-center relative overflow-hidden w-full h-full">
      <motion.div
        className="absolute inset-y-0 flex flex-row items-center"
        style={{ width: '150%', left: 0 }}
        initial={{ x: '0%' }}
        animate={{ x: pushIdx === 0 ? '0%' : '-33.33%' }}
        transition={{ duration: 0.55, ease: [0.25, 0.46, 0.45, 0.94] }}
      >
        {/* slot 1 */}
        <ProductCard src={PUSH_IMAGES[0]} fallback="🛒" />

        {/* slot 2: phone mockup */}
        <div className="flex items-center justify-center" style={{ width: '33.33%' }}>
          <div className="relative flex items-center justify-center">
            <div
              className="absolute rounded-3xl"
              style={{ width: 110, height: 160, background: 'linear-gradient(135deg, rgba(255,255,255,0.22) 0%, rgba(180,170,255,0.30) 100%)', border: '1px solid rgba(255,255,255,0.25)', backdropFilter: 'blur(2px)', zIndex: 1 }}
            />
            <motion.div
              animate={{ y: [0, -5, 0] }}
              transition={{ repeat: Infinity, duration: 4.5, ease: 'easeInOut' }}
              className="relative"
              style={{ width: 88, aspectRatio: '9 / 18.8', borderRadius: 14, background: 'linear-gradient(180deg, rgba(255,255,255,0.10), rgba(255,255,255,0.04)), #0b0f1a', padding: 3, border: '1px solid rgba(255,255,255,0.18)', boxShadow: '0 16px 48px rgba(0,0,0,0.55)', zIndex: 2 }}
            >
              <div
                className="absolute top-1 left-1/2 -translate-x-1/2 z-10"
                style={{ width: 32, height: 7, background: 'rgba(0,0,0,0.6)', borderRadius: '0 0 5px 5px' }}
              />
              <div className="w-full h-full relative overflow-hidden" style={{ borderRadius: 11, background: 'linear-gradient(180deg, #0a0b14, #121535)' }}>
                <div className="absolute top-3.5 left-1.5 right-1.5 flex items-center justify-between z-10">
                  <span className="text-[5px] font-bold text-white/80">Wallet</span>
                  <div className="flex gap-0.5">
                    {[0, 1, 2].map((i) => (
                      <div key={i} style={{ width: 8, height: 8, borderRadius: 999, border: '1px solid rgba(255,255,255,0.1)', background: 'rgba(255,255,255,0.06)' }} />
                    ))}
                  </div>
                </div>
                <div className="absolute left-1.5 right-1.5 grid grid-cols-2 z-[2]" style={{ top: 23, gap: '2px', alignContent: 'start' }}>
                  {walletCards.map((card, i) => (
                    <motion.div
                      key={card.name}
                      initial={{ opacity: 0, y: 8 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ duration: 0.4, delay: 0.3 + i * 0.1 }}
                      className="flex items-center justify-center overflow-hidden"
                      style={{ height: 23, borderRadius: 4, background: card.bg, border: '1px solid rgba(255,255,255,0.08)' }}
                    >
                      {!failed.has(card.logo) ? (
                        <img
                          src={card.logo}
                          alt={card.name}
                          onError={() => markFailed(card.logo)}
                          style={{ width: card.logoW * 0.6, maxHeight: card.logoMaxH * 0.6, objectFit: 'contain' }}
                        />
                      ) : (
                        <span style={{ fontSize: 4, color: 'rgba(0,0,0,0.7)' }}>{card.name}</span>
                      )}
                    </motion.div>
                  ))}
                  <div
                    className="flex items-center justify-center"
                    style={{ height: 23, borderRadius: 4, background: 'rgba(255,255,255,0.06)', border: '1px dashed rgba(255,255,255,0.2)' }}
                  >
                    <span style={{ fontSize: 11, color: 'rgba(255,255,255,0.5)' }}>+</span>
                  </div>
                </div>
              </div>
            </motion.div>
          </div>
        </div>

        {/* slot 3 */}
        <ProductCard src={PUSH_IMAGES[1]} fallback="🛍️" />
      </motion.div>
    </div>
  );
}
