import { useEffect, useRef } from 'react';

/**
 * Returns a ref for a <video> that only plays while it is sufficiently in view
 * (the viewport is "centred" on it) and pauses otherwise — so off-screen
 * background videos don't run until the user scrolls to them.
 *
 * Attach the ref to a muted/loop/playsInline <video> and DO NOT set `autoPlay`;
 * playback is driven entirely by visibility.
 */
export function useInViewVideo<T extends HTMLVideoElement = HTMLVideoElement>(
  threshold = 0.6,
) {
  const ref = useRef<T>(null);

  useEffect(() => {
    const el = ref.current;
    if (!el || typeof IntersectionObserver === 'undefined') return;

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting && entry.intersectionRatio >= threshold) {
          el.play().catch(() => {
            /* play can reject if interrupted — ignore */
          });
        } else if (!el.paused) {
          el.pause();
        }
      },
      { threshold: [0, threshold, 1] },
    );

    observer.observe(el);
    return () => observer.disconnect();
  }, [threshold]);

  return ref;
}
