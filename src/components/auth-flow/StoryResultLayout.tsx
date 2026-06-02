/**
 * StoryResultLayout - shared stories-styled scaffold for the post-join result
 * screens (auto-accepted "you're in" and pending "waiting for approval"). Owns
 * the vivid gradient, soft blur blobs, optional confetti, the org avatar badge,
 * the headline + subline, and a low-anchored slot for the call-to-action
 * buttons. Each screen supplies its own copy, confetti flag, and CTAs.
 *
 * The avatar badge always shows the joined org's logo; when the org has no
 * logo it falls back to the Nexus logo (never a generic placeholder), so the
 * user always sees a real brand mark at the top.
 */
import { motion } from 'framer-motion';
import type { ReactNode } from 'react';

/** Fixed confetti pieces (deterministic positions so they don't reshuffle). */
const CONFETTI = [
  { left: '8%', color: '#fbbf24', delay: 0.0, size: 10, rot: 18 },
  { left: '20%', color: '#34d399', delay: 0.5, size: 8, rot: -24 },
  { left: '33%', color: '#f472b6', delay: 0.2, size: 12, rot: 40 },
  { left: '47%', color: '#60a5fa', delay: 0.8, size: 9, rot: -12 },
  { left: '61%', color: '#fbbf24', delay: 0.35, size: 11, rot: 30 },
  { left: '74%', color: '#a78bfa', delay: 0.65, size: 8, rot: -36 },
  { left: '86%', color: '#34d399', delay: 0.15, size: 10, rot: 22 },
  { left: '92%', color: '#f472b6', delay: 0.9, size: 9, rot: -18 },
];

interface StoryResultLayoutProps {
  /** Text direction for the screen (rtl for Hebrew). */
  dir: 'rtl' | 'ltr';
  /** Resolved organization name (used for the badge alt text). */
  orgName: string;
  /** Organization logo URL; falls back to the Nexus logo when absent. */
  orgLogo?: string;
  /** Big white headline. */
  headline: string;
  /** Supporting line under the headline. */
  subline: string;
  /** Render the drifting confetti layer (celebration only). */
  confetti?: boolean;
  /** Call-to-action buttons, anchored to the bottom of the screen. */
  children: ReactNode;
}

/**
 * Render the shared result-screen scaffold.
 * @returns the full-screen stories-styled result element.
 */
export default function StoryResultLayout({
  dir,
  orgName,
  orgLogo,
  headline,
  subline,
  confetti = false,
  children,
}: StoryResultLayoutProps) {
  return (
    <div
      dir={dir}
      className="fixed inset-0 z-[100] flex flex-col overflow-hidden"
      style={{ background: 'linear-gradient(135deg, #4f46e5 0%, #7c3aed 52%, #ec4899 100%)' }}
    >
      {/* Soft ambient blur blobs. */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden">
        <motion.div
          className="absolute w-72 h-72 rounded-full opacity-20"
          style={{ background: 'rgba(255,255,255,0.3)', top: '-12%', right: '-10%', filter: 'blur(48px)' }}
          animate={{ y: [0, 14, 0], x: [0, -10, 0] }}
          transition={{ repeat: Infinity, duration: 9, ease: 'easeInOut' }}
        />
        <motion.div
          className="absolute w-56 h-56 rounded-full opacity-15"
          style={{ background: 'rgba(255,255,255,0.25)', bottom: '-6%', left: '-6%', filter: 'blur(40px)' }}
          animate={{ y: [0, -12, 0], x: [0, 8, 0] }}
          transition={{ repeat: Infinity, duration: 11, ease: 'easeInOut' }}
        />
      </div>

      {/* Drifting confetti pieces (celebration only). */}
      {confetti && (
        <div className="absolute inset-0 pointer-events-none overflow-hidden">
          {CONFETTI.map((c, i) => (
            <motion.span
              key={i}
              className="absolute rounded-[2px]"
              style={{ left: c.left, top: '-6%', width: c.size, height: c.size * 1.6, background: c.color }}
              initial={{ y: '-10%', opacity: 0, rotate: 0 }}
              animate={{ y: '115vh', opacity: [0, 1, 1, 0.8], rotate: c.rot * 8 }}
              transition={{ repeat: Infinity, duration: 6 + (i % 3), delay: c.delay, ease: 'easeIn' }}
            />
          ))}
        </div>
      )}

      {/* Avatar badge: the org's logo, or the Nexus logo when it has none. */}
      <div className="flex-shrink-0 px-6 pt-14 pb-1 relative z-10 flex justify-start">
        <motion.div
          initial={{ opacity: 0, scale: 0.6, y: -10 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          transition={{ type: 'spring', damping: 14, stiffness: 220, delay: 0.1 }}
          className="h-20 w-20 rounded-3xl bg-white flex items-center justify-center overflow-hidden shadow-xl"
        >
          <img
            src={orgLogo || '/nexus-logo.png'}
            alt={orgName}
            className="h-14 w-14 object-contain"
          />
        </motion.div>
      </div>

      {/* Headline + subline. */}
      <div className="flex-shrink-0 pt-5 relative z-10 px-6">
        <motion.h1
          initial={{ opacity: 0, y: 14 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.25, ease: 'easeOut' }}
          className="text-white font-extrabold text-[32px] leading-tight"
        >
          {headline}
        </motion.h1>
        <motion.p
          initial={{ opacity: 0, y: 14 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.38, ease: 'easeOut' }}
          className="text-white/90 text-base mt-4 max-w-[92%] leading-relaxed"
        >
          {subline}
        </motion.p>
      </div>

      {/* CTAs, anchored low. */}
      <div className="flex-1 flex flex-col justify-end relative z-10 px-6 pb-12">
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.5, ease: 'easeOut' }}
          className="flex flex-col gap-3"
        >
          {children}
        </motion.div>
      </div>
    </div>
  );
}
