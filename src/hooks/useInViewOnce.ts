import { useEffect, useRef, useState } from 'react';

/**
 * Fires once the referenced element first scrolls into view, then stops
 * observing. Handy for play-once entrance animations (bars filling, charts
 * drawing) that should trigger on scroll rather than on mount.
 */
export function useInViewOnce<T extends HTMLElement>(threshold = 0.3) {
  const ref = useRef<T>(null);
  const [inView, setInView] = useState(false);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const io = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setInView(true);
          io.disconnect();
        }
      },
      { threshold },
    );
    io.observe(el);
    return () => io.disconnect();
  }, [threshold]);

  return { ref, inView };
}
