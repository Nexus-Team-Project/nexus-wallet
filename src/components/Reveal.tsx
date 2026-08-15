import { motion, useReducedMotion } from 'framer-motion';
import type { ReactNode } from 'react';

interface RevealProps {
  children: ReactNode;
  /** Applied to the wrapper, so it can carry the section's own margins. */
  className?: string;
  /** Seconds to hold before starting — for staggering stacked sections. */
  delay?: number;
}

/**
 * Reveal — scroll-triggered "slide up into place" wrapper. Each section
 * starts slightly low and transparent, then rises as it enters the viewport.
 * Fires once: re-animating on every pass makes scrolling back up feel jumpy.
 *
 * `amount: 0.15` triggers as soon as a sixth of the section is visible, which
 * matters for the tall cards on the About page — waiting for half of a 600px
 * card would mean it animates well after the reader is already looking at it.
 *
 * Honours prefers-reduced-motion by rendering the content already in place.
 */
export default function Reveal({ children, className, delay = 0 }: RevealProps) {
  const reduceMotion = useReducedMotion();

  if (reduceMotion) return <div className={className}>{children}</div>;

  return (
    <motion.div
      className={className}
      initial={{ opacity: 0, y: 48 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, amount: 0.15 }}
      transition={{ duration: 0.55, ease: [0.22, 1, 0.36, 1], delay }}
    >
      {children}
    </motion.div>
  );
}
