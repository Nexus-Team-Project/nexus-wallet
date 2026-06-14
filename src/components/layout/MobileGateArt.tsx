/**
 * MobileGateArt
 * -------------------------------------------------------------------------
 * The animated phone illustration shown inside the MobileViewportGate. Split
 * into its own file so the gate component stays small and focused.
 *
 * A stylised phone gently floats and tilts with a soft pulse glow behind it,
 * hinting "this app lives on a phone". Motion is disabled when the user
 * prefers reduced motion - the same phone renders static.
 */
import { motion, useReducedMotion } from 'framer-motion';

/**
 * Animated phone mock for the viewport gate.
 *
 * @returns The decorative phone illustration. No props - it is purely visual.
 */
export default function MobileGateArt() {
  // When true, render everything static (no float / tilt / pulse).
  const reduceMotion = useReducedMotion();

  // Float + tilt loop for the phone body. Empty object => no animation.
  const floatAnimation = reduceMotion
    ? {}
    : {
        y: [0, -10, 0],
        rotateZ: [-3, 3, -3],
      };

  return (
    <div
      className="relative mx-auto flex items-center justify-center"
      // Perspective gives the slight tilt a touch of depth.
      style={{ perspective: 900 }}
      aria-hidden="true"
    >
      {/* Pulse glow behind the phone - brand indigo, heavily blurred. */}
      <motion.div
        className="absolute h-44 w-44 rounded-full"
        style={{
          background:
            'radial-gradient(circle, rgba(99,91,255,0.45) 0%, rgba(99,91,255,0) 70%)',
          filter: 'blur(8px)',
        }}
        animate={reduceMotion ? {} : { scale: [1, 1.12, 1], opacity: [0.6, 0.9, 0.6] }}
        transition={{ duration: 3.2, repeat: Infinity, ease: 'easeInOut' }}
      />

      {/* Phone body. */}
      <motion.div
        className="relative h-56 w-32 rounded-[1.9rem] border border-white/60 bg-gradient-to-b from-white to-surface shadow-2xl"
        style={{ transformStyle: 'preserve-3d' }}
        animate={floatAnimation}
        transition={{ duration: 4.5, repeat: Infinity, ease: 'easeInOut' }}
      >
        {/* Notch. */}
        <div className="absolute left-1/2 top-2 h-1.5 w-12 -translate-x-1/2 rounded-full bg-text-primary/15" />

        {/* Screen content - a tiny abstract of the wallet UI. */}
        <div className="absolute inset-2.5 top-6 flex flex-col items-center gap-2.5 rounded-[1.3rem] bg-white p-3">
          {/* Nexus mark. */}
          <img
            src="/nexus-icon.png"
            alt=""
            className="mt-1 h-9 w-9 rounded-xl object-contain"
            draggable={false}
          />
          {/* Balance-card stand-in. */}
          <div className="h-9 w-full rounded-lg bg-gradient-to-r from-primary to-accent-cyan opacity-90" />
          {/* Row of stand-in voucher tiles. */}
          <div className="grid w-full grid-cols-3 gap-1.5">
            <div className="h-7 rounded-md bg-surface" />
            <div className="h-7 rounded-md bg-surface" />
            <div className="h-7 rounded-md bg-surface" />
          </div>
          {/* List rows. */}
          <div className="mt-0.5 h-2 w-full rounded-full bg-border" />
          <div className="h-2 w-3/4 self-start rounded-full bg-border" />
        </div>
      </motion.div>
    </div>
  );
}
